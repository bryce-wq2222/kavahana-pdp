const fs = require('fs');
const REPO = 'C:/Users/bryce/kavahana-pdp/';

/* =========================================================
   GitHub Pages build. Unlike the artifact build, fonts and
   logos are real files rather than base64, so the page is
   ~40KB and actually editable by hand.
   ========================================================= */

const FACES = `
@font-face{font-family:Chivo;font-style:normal;font-weight:100 900;font-display:swap;
  src:url(fonts/chivo-var.woff2) format('woff2-variations'),url(fonts/chivo-var.woff2) format('woff2')}
@font-face{font-family:Newsreader;font-style:normal;font-weight:200 800;font-display:swap;
  src:url(fonts/newsreader-var.woff2) format('woff2-variations'),url(fonts/newsreader-var.woff2) format('woff2')}
@font-face{font-family:'Mauna Loa';font-style:normal;font-weight:400;font-display:swap;
  src:url(fonts/MaunaLoa.otf) format('opentype')}
`;

const META = {
  'index.html':   ['Kavahana &#183; Nectar Starter Kit', 'The Starter Kit subscription PDP mockup.'],
  'premium.html': ['Kavahana &#183; Nectar Starter Kit, editorial', 'The premium editorial PDP mockup.'],
};

const wm = fs.readFileSync('wordmark.svg', 'utf8');

[['pdp-clone-src.html', 'index.html'], ['pdp1-src.html', 'premium.html']].forEach(([src, out]) => {
  let s = fs.readFileSync(src, 'utf8');
  s = s.replace('__CHIVO__', FACES).replace('__WORDMARK__', wm);

  /* base64 press logos become files on disk */
  let swapped = 0;
  s = s.replace(/<img alt="([^"]+)" src="data:image\/png;base64,[A-Za-z0-9+\/=]+">/g, (_, alt) => {
    const f = { 'Uncover LA':'uncoverla','Santa Monica':'santamonica','NBC News':'nbcnews',
      'Los Angeles Times':'latimes','LAist':'laist','Eater':'eater','PureWow':'purewow_1',
      'CBS':'cbs','Dry Run':'dryrun','Dry Atlas':'dry-atlas','Rare Beauty Impact Fund':'rarebeauty' }[alt];
    if (!f) { console.log('  UNMAPPED LOGO: ' + alt); return _; }
    swapped++;
    return '<img alt="' + alt + '" width="132" height="132" src="press/' + f + '.png">';
  });

  // bake the marquee's duplicate half so the seamless loop never depends on JS
  const pt = s.indexOf('id="ptrack" aria-hidden="true">');
  if (pt > -1) {
    const start = s.indexOf('>', pt) + 1;
    const end = s.indexOf('</div></div>', start);
    if (end > -1) {
      const inner = s.slice(start, end);
      if (!inner.includes('data-dup')) s = s.slice(0, end) + '<span data-dup hidden></span>'.replace('hidden', 'style="display:none"') + inner + s.slice(end);
    }
  }
  const title = (s.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || META[out][0];
  s = s.replace(/<title>[\s\S]*?<\/title>\s*/, '');

  const page = '<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    '<meta name="robots" content="noindex, nofollow">\n' +
    '<title>' + title + '</title>\n' +
    '<meta name="description" content="' + META[out][1] + '">\n' +
    '<link rel="preload" as="font" type="font/woff2" href="fonts/chivo-var.woff2" crossorigin>\n' +
    '<link rel="preload" as="font" type="font/woff2" href="fonts/newsreader-var.woff2" crossorigin>\n' +
    s.replace(/^([\s\S]*?<\/style>)/, '$1\n</head>\n<body>') + '\n</body>\n</html>\n';

  fs.writeFileSync(REPO + out, page);

  let js = 'ok';
  (page.match(/<script>([\s\S]*?)<\/script>/g) || []).forEach((b, i) => {
    try { new Function(b.replace(/<\/?script>/g, '')); } catch (e) { js = 'BROKEN#' + i + ' ' + e.message; }
  });
  const body = page.replace(/<style>[\s\S]*?<\/style>/, '');
  console.log(out.padEnd(13), String(Math.round(page.length / 1024) + 'KB').padStart(6), js,
    '| logos->files:', swapped,
    '| base64 left:', (page.match(/base64,/g) || []).length,
    '| doctype:', /^<!doctype html>/i.test(page),
    '| non-ascii:', (body.match(/[^\x00-\x7F]/g) || []).length);
});
