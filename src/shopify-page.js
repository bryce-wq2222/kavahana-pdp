const fs = require('fs');
const BASE = 'https://bryce-wq2222.github.io/kavahana-pdp/';
let h = fs.readFileSync('C:/Users/bryce/kavahana-pdp/index.html', 'utf8');

let css = (h.match(/<style>([\s\S]*?)<\/style>/) || ['', ''])[1];
let body = h.split(/<body>/)[1].split(/<\/body>/)[0];

/* theme supplies header and footer */
body = body.replace(/<!-- 2\. NAV -->[\s\S]*?(?=<!-- 3\. HERO -->)/, '');
body = body.replace(/<!-- 18\. FOOTER -->[\s\S]*?<\/footer>/, '');

/* ---- scope every selector under #kv-page so theme CSS cannot reach in,
        and ours cannot leak out ---- */
function prefixCSS(src, pfx) {
  let out = '', i = 0;
  function readBlock() {
    let depth = 0, start = i;
    while (i < src.length) {
      if (src[i] === '{') depth++;
      else if (src[i] === '}') { depth--; if (depth === 0) { i++; return src.slice(start, i); } }
      i++;
    }
    return src.slice(start);
  }
  while (i < src.length) {
    const j = src.indexOf('{', i);
    if (j < 0) { out += src.slice(i); break; }
    const sel = src.slice(i, j).trim();
    i = j;
    if (/^@(media|supports)/.test(sel)) {
      const block = readBlock();
      out += sel + '{' + prefixCSS(block.slice(1, -1), pfx) + '}';
    } else if (sel.startsWith('@')) {
      out += sel + readBlock();
    } else {
      const block = readBlock();
      out += sel.split(',').map(s => {
        s = s.trim();
        if (/^(html|body|:root)$/.test(s)) return pfx;
        s = s.replace(/^(html|body|:root)\s+/, '');
        return pfx + ' ' + s;
      }).join(',') + block;
    }
  }
  return out;
}

const scoped =
  '#kv-page,#kv-page :where(*:not(svg):not(svg *)),#kv-page :where(*:not(svg):not(svg *))::before,#kv-page :where(*:not(svg):not(svg *))::after{all:revert}\n' +
  '#kv-page .note,#kv-page .tpl{display:none!important}\n' +
  '#kv-page{display:block;width:100vw;position:relative;left:50%;right:50%;margin-left:-50vw;margin-right:-50vw;text-align:left}\n' +
  prefixCSS(css, '#kv-page');

/* neutralize the theme page chrome around us: its auto page title and
   any container padding/width caps between us and <body> */
const chrome = `<script>
(function(){
  [].forEach.call(document.querySelectorAll('h1'),function(el){ if(!el.closest('#kv-page')) el.style.display='none'; });
  var p=document.getElementById('kv-page'); p=p&&p.parentElement;
  while(p&&p!==document.body){
    p.style.paddingTop='0'; p.style.paddingBottom='0';
    p.style.marginTop='0'; p.style.marginBottom='0';
    p.style.maxWidth='none'; p.style.background='transparent';
    p.style.display='block'; p.style.columns='auto';
    var ov=getComputedStyle(p);
    if(ov.overflow!=='visible'||ov.overflowX!=='visible'||ov.overflowY!=='visible'){ p.style.overflow='visible'; }
    p=p.parentElement;
  }
  /* body overflow:hidden kills position:sticky; the root scroller is exempt,
     so move the horizontal guard up to <html> and free the body */
  var bs=getComputedStyle(document.body);
  if(bs.overflow!=='visible'||bs.overflowX!=='visible'||bs.overflowY!=='visible'){
    document.body.style.overflow='visible';
    document.documentElement.style.overflowX='hidden';
  }
})();
</script>`;

let out = '<style>' + scoped + '</style>\n<div id="kv-page">\n' + body + '\n</div>\n' + chrome;

/* absolute asset urls */
out = out.split('src="img/').join('src="' + BASE + 'img/');
out = out.split('src="video/').join('src="' + BASE + 'video/');
out = out.split('src="press/').join('src="' + BASE + 'press/');
out = out.split('data-poster="video/').join('data-poster="' + BASE + 'video/');
out = out.split('url(fonts/').join('url(' + BASE + 'fonts/');
out = out.split("'img/").join("'" + BASE + 'img/');

fs.writeFileSync('C:/Users/bryce/kavahana-pdp/shopify-embed.html', out);
console.log('bytes:', out.length,
  '| unscoped selectors left:', (scoped.match(/^\s*(?!#kv-page|@|\d|from|to)[a-zA-Z.#][^{]*\{/gm) || []).slice(0, 5),
  '| relative refs left:', (out.match(/(?:src|poster)="(?:img|video|press)\//g) || []).length);
