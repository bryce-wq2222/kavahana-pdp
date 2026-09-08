const fs = require('fs');
const path = 'C:/Users/bryce/kavahana-pdp/';

async function fetchMain(url) {
  const res = await fetch(url, {headers: {'user-agent': 'Mozilla/5.0'}});
  if (!res.ok) throw new Error(url + ' -> ' + res.status);
  const html = await res.text();
  const m = html.match(/<main[^>]*>([\s\S]*?)<\/main>/);
  if (!m) throw new Error('no <main> in ' + url);
  return m[1].trim();
}

(async () => {
  /* 9/8: the replicas (recipes / customer-reviews / about) derive from the v3 embed: buy box with gift lines,
     DRINKKAVA drawer route, slide cart (tools/cart-v3.html), gift guard v5, first-box offer tab. */
  const raw = fs.readFileSync(path + 'shopify-embed-v3.txt', 'utf8').replace(/\r\n/g, '\n');
  const CART_V3 = fs.readFileSync(path + 'tools/cart-v3.html', 'utf8').replace(/\r\n/g, '\n');
  if (!/id="kv-cart"/.test(CART_V3) || !/DRINKKAVA/.test(CART_V3)) throw new Error('cart-v3.html incomplete');
  const GUARD_TAG = '<script src="https://bryce-wq2222.github.io/kavahana-pdp/kv-gift-guard-v3.js" defer></script>';
  const lines = raw.split('\n');
  const chrome = lines[0];
  if (!/kv-topmq/.test(chrome)) throw new Error('line 1 is not the chrome block');

  // main PDP style block, marker-based
  const sbStart = raw.indexOf('<style>#kv-page');
  if (sbStart < 0) throw new Error('style block start not found');
  const sbEnd = raw.indexOf('</style>', sbStart);
  const styleBlock = raw.slice(sbStart, sbEnd + 8);
  if (!/Mauna Loa/.test(styleBlock) || !/\.gifts\{/.test(styleBlock)) throw new Error('style block incomplete (needs the v3 .gifts rule)');

  // hero: gallery + buy box + accordions. v3: ends where the kit section marker starts (As seen on sits after it)
  const heroStart = raw.indexOf('<!-- 3. HERO -->');
  const heroEnd = raw.indexOf('<!-- 3a.');
  if (heroStart < 0 || heroEnd < 0 || heroEnd < heroStart) throw new Error('hero markers not found');
  const hero = raw.slice(heroStart, heroEnd).trim();
  if (!/class="buy"/.test(hero) || !/id="slides"/.test(hero) || !/class="acc"/.test(hero) || !/class="gifts"/.test(hero) || /class="seenon"/.test(hero)) throw new Error('hero block incomplete or too wide');

  // exact PDP founders video tag
  const fndVideoM = raw.match(/<div class="vid vid-live fnd-vid">[\s\S]*?<\/div>/);
  if (!fndVideoM) throw new Error('fnd video tag not found');
  const fndVideo = fndVideoM[0];

  // drawer takeover (styles + script), marker-based to end of file; the guard tag is added once, explicitly
  const drStart = raw.indexOf('<style id="kv-drawer-css">');
  if (drStart < 0) throw new Error('drawer block not found');
  const drawerBlock = raw.slice(drStart).trim().replace(/<script src="[^"]*kv-gift-guard[^"]*" defer><\/script>/g, '');
  if (!/__kvDrawer/.test(drawerBlock)) throw new Error('drawer block incomplete');

  // all inline scripts from the PDP embed except chrome/drawer/sticky/clarity and the slide cart IIFE (kc-lines), which comes from tools/cart-v3.html
  const allScripts = [...raw.matchAll(/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/g)].map(m => m[0]);
  const scripts = allScripts.filter(s => !/clarity|__kvDrawer|getElementById("kv-sticky")|kv-topmq|kc-lines/.test(s))
    .map(s => s.replace("el.closest('#kv-page')", "el.closest('#kv-page,#kvr-blog,#kvr-rt')"));
  console.log('scripts included: ' + scripts.length + '/' + allScripts.length);

  // neutralize ONLY the page-template wrapper (card + outer section padding), not replica content sections
  const CARD_FIX = '<style>\n' +
    '#MainContent .shopify-section:has(#kv-slot) .card__surface,#MainContent .shopify-section:has(#kv-slot) .card{background:transparent!important;box-shadow:none!important;border:0!important;padding:0!important;border-radius:0!important}\n' +
    '#MainContent .shopify-section:has(#kv-slot) > section > .section-content{padding-top:0!important;padding-bottom:0!important}\n' +
    '#MainContent .shopify-section:has(#kv-slot) [data-island]{margin:0!important}\n' +
    '</style>';

  const RTE_FIX = '#kvr-blog .section-content,#kvr-rt .section-content{width:100%!important}\n' +
    '#kvr-blog ul,#kvr-rt ul{padding:0!important;margin:0!important;list-style:none!important}\n' +
    '#kvr-blog a,#kvr-rt a{text-decoration:none!important}\n' +
    '#kvr-blog .card-title-overlay a,#kvr-blog .card-arrow a{color:#fff!important}';

  // hero wrapped like the PDP top, with bottom buffer before whatever follows; slide cart + guard ride along
  const heroCore = '<style>#kv-page .hero{padding-top:26px;padding-bottom:56px}@media(max-width:760px){#kv-page .hero{padding-bottom:40px}}</style>\n' +
    '<div id="kv-page">\n' + hero + '\n</div>\n' + scripts.join('\n') + '\n' + CART_V3 + '\n' + GUARD_TAG;

  const SCRIPT_END = '</scr' + 'ipt>';
  const RELOCATE_AFTER_REVIEWS = '<script>\n' +
    '(function(){\n' +
    '  function place(){\n' +
    "    var oke=document.querySelector('#MainContent .shopify-section:has([data-oke-widget])');\n" +
    "    var wraps=document.querySelectorAll('#MainContent [id=\"kv-page\"]');\n" +
    '    var heroWrap=wraps[wraps.length-1];\n' +
    '    if(oke&&heroWrap&&heroWrap.previousElementSibling!==oke){oke.parentNode.insertBefore(heroWrap,oke.nextSibling);}\n' +
    '  }\n' +
    '  place();\n' +
    "  new MutationObserver(place).observe(document.getElementById('MainContent')||document.body,{childList:true,subtree:true});\n" +
    '})();\n' + SCRIPT_END;

  // ---- recipes: verbatim blog main + full hero + reviews app after it ----
  const blogMain = await fetchMain('https://shop.kavahana.com/blogs/recipes');
  if (!/shopify-section/.test(blogMain) || blogMain.length < 5000) throw new Error('blog section wrong, len=' + blogMain.length);
  const RECIPES_CSS = '<style>\n' +
    '#kvr-blog{display:block;width:100vw;position:relative;left:50%;margin-left:-50vw}\n' +
    '#MainContent #kvr-blog h1{display:block!important}\n' + RTE_FIX + '\n' +
    '#MainContent .shopify-section:has([data-oke-widget]) .section-content{padding-top:10px!important}\n' +
    '#kvr-blog .kvr-cdots{display:none}\n' +
    '@media(max-width:989px){\n' +
    '#kvr-blog ul.grid{display:flex!important;flex-wrap:nowrap;align-items:flex-start!important;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;overscroll-behavior-x:contain;gap:14px!important;padding:0 18px 6px!important;scrollbar-width:none}\n' +
    '#kvr-blog ul.grid::-webkit-scrollbar{display:none}\n' +
    '#kvr-blog ul.grid>li{flex:0 0 80%;max-width:330px;scroll-snap-align:center;margin:0!important}\n' +
    '#kvr-blog .kvr-cdots{display:flex;gap:8px;justify-content:center;margin:18px 0 2px}\n' +
    '#kvr-blog .kvr-cdots button{width:9px;height:9px;border-radius:50%;border:0;padding:0;background:#C9C2B0;cursor:pointer;transition:background .15s,transform .15s}\n' +
    '#kvr-blog .kvr-cdots button.on{background:#367542;transform:scale(1.2)}\n' +
    '}\n</style>';
  const RECIPES_JS = '<script>\n' +
    '(function(){\n' +
    "  var ul=document.querySelector('#kvr-blog ul.grid');if(!ul)return;\n" +
    '  var items=[].slice.call(ul.children);if(!items.length)return;\n' +
    "  var dots=document.createElement('div');dots.className='kvr-cdots';\n" +
    '  ul.parentNode.insertBefore(dots,ul.nextSibling);\n' +
    '  function centerOf(el){var r=el.getBoundingClientRect(),u=ul.getBoundingClientRect();return r.left-u.left+ul.scrollLeft+r.width/2}\n' +
    '  items.forEach(function(it,i){\n' +
    "    var b=document.createElement('button');b.type='button';b.setAttribute('aria-label','Go to recipe '+(i+1));\n" +
    "    b.addEventListener('click',function(){ul.scrollTo({left:centerOf(it)-ul.clientWidth/2,behavior:'smooth'})});\n" +
    '    dots.appendChild(b);\n' +
    '  });\n' +
    '  function upd(){\n' +
    '    var mid=ul.scrollLeft+ul.clientWidth/2,best=0,bd=1e9;\n' +
    '    items.forEach(function(it,i){var d=Math.abs(centerOf(it)-mid);if(d<bd){bd=d;best=i}});\n' +
    "    [].forEach.call(dots.children,function(b,i){b.classList.toggle('on',i===best)});\n" +
    '  }\n' +
    "  var _t;ul.addEventListener('scroll',function(){clearTimeout(_t);_t=setTimeout(upd,60)},{passive:true});\n" +
    "  window.addEventListener('resize',upd);\n" +
    '  upd();\n' +
    '})();\n' + SCRIPT_END;
  const recipes = [chrome, CARD_FIX, RECIPES_CSS, '<div id="kvr-blog">', blogMain, '</div>', RECIPES_JS, styleBlock, heroCore, drawerBlock, ''].join('\n');
  fs.writeFileSync(path + 'recipes-embed.txt', recipes);

  // ---- reviews: rich-text replica + okendo (template) + full hero after it ----
  const revMain = await fetchMain('https://shop.kavahana.com/pages/reviews');
  const sections = revMain.split(/(?=<div id="shopify-section-)/).filter(s => s.trim());
  const rich = sections.find(s => !/data-oke-widget/.test(s) && /shopify-section/.test(s));
  if (!rich || rich.length < 300) throw new Error('rich text section not found');
  const REVIEWS_CSS = '<style>\n' +
    '#kvr-rt{display:block;width:100vw;position:relative;left:50%;margin-left:-50vw}\n' +
    '#MainContent #kvr-rt h1,#MainContent #kvr-rt h2{display:block!important}\n' + RTE_FIX + '\n' +
    '#kvr-rt .section-content{padding-top:52px!important;padding-bottom:10px!important}\n' +
    '#kvr-rt .section-content-top-margin{margin-top:14px!important}\n' +
    '#MainContent .shopify-section:has([data-oke-widget]) .section-content{padding-top:16px!important}\n' +
    '</style>';
  const reviews = [chrome, CARD_FIX, REVIEWS_CSS, '<div id="kvr-rt">', rich, '</div>', styleBlock, heroCore, RELOCATE_AFTER_REVIEWS, drawerBlock, ''].join('\n');
  fs.writeFileSync(path + 'reviews-embed.txt', reviews);

  // ---- about: elongated Hana note + okendo + full hero after it ----
  const ABOUT_CSS = '<style>\n' +
    '#kv-page .fndsec{padding:40px 0 26px}\n' +
    '@media(min-width:760px){#kv-page .fnd{align-items:start}#kv-page .fnd-vid{position:sticky;top:90px}}\n' +
    '#kv-page .fnd-b p{margin:13px 0;font-size:15.5px;line-height:1.66}\n' +
    '</style>';
  const NOTE = [
    '<div id="kv-page">',
    '<section class="fndsec"><div class="wrap">',
    '  <div class="fnd">',
    '    ' + fndVideo,
    '    <div class="fnd-b">',
    '      <h2 style="font-size:clamp(30px,4vw,44px)">A note from Hana</h2>',
    '      <p>I found kava 10 years ago, looking for a way to quiet my anxiety without a drink.</p>',
    '      <p>The first cup surprised me. Calm, but not blurry. Social, but still sharp. I kept waiting for the catch, and it never came.</p>',
    '      <p>It became my daily ritual. A cup in the evening instead of a glass of something I&rsquo;d regret. Ten years later, that hasn&rsquo;t changed.</p>',
    '      <p>So Neil and I started sharing it. We hauled a folding table to farmers markets and pop-ups all over LA and whisked one cup at a time for anyone curious enough to try. The best part of sharing kava with someone new came about twenty minutes in, when we would watch their face change mid-conversation. Relaxed, smiley, a little surprised. It never got old, and it is the whole reason Kavahana exists.</p>',
    '      <p>In February 2024 we opened our Santa Monica bar, the nation&rsquo;s first kava nectar bar. Our neighbors voted us Most Loved New Business, which still makes me smile. Then came our second bar in Hollywood. Over 500,000 cups later, we&rsquo;re still behind the counter most days.</p>',
    '      <p>The Starter Kit is everything I wish someone had handed me back then. Real cold-pressed noble kava root, the coconut shell cups, the whisk, and the recipes we actually pour at the bar. Nothing extracted, nothing added.</p>',
    '      <p>One honest tip before you start: kava works in reverse. The more consistently you drink it, the more you feel it. Give it a few cups of 2 to 3 servings before you judge it.</p>',
    '      <p>If it finds you the way it found me, tag me on social or come say hi at the bar.</p>',
'      <div class="fnd-sig mauna">Hana</div>',
    '      <div class="fnd-meta">2 bars in Los Angeles &#183; 500,000+ cups served<br><span style="white-space:nowrap">Ships to all 50 states and Canada</span></div>',
    '    </div>',
    '  </div>',
    '</div></section>',
    '</div>'
  ].join('\n');
  const about = [chrome, CARD_FIX, styleBlock, ABOUT_CSS, NOTE, heroCore, drawerBlock, ''].join('\n');
  fs.writeFileSync(path + 'about-embed.txt', about);

  console.log('recipes=' + recipes.length + '  reviews=' + reviews.length + '  about=' + about.length);
})().catch(e => { console.error('FAIL: ' + e.message); process.exit(1); });
