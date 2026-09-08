/* Build shopify-embed-v3.txt from the LIVE embed (shopify-embed.txt).
   Spec: PDP-V3-SPEC-2026-09-07.md (rev 3). Run: node tools/build-v3.js
   Every edit asserts its anchor exists so a live-embed change cannot silently skip a step. */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'shopify-embed-v1-source.txt'); /* 9/8 cutover: the old live embed, frozen; shopify-embed.txt is now a copy of the v3 output */
const OUT = path.join(ROOT, 'shopify-embed-v3.txt');
const GH = 'https://bryce-wq2222.github.io/kavahana-pdp';
let h = fs.readFileSync(SRC, 'utf8').replace(/\r\n/g, '\n');
const steps = [];
function rep(label, from, to, opts) {
  opts = opts || {};
  const idx = h.indexOf(from);
  if (idx < 0) throw new Error('anchor missing for ' + label + ': ' + String(from).slice(0, 80));
  if (!opts.all && h.indexOf(from, idx + 1) >= 0 && !opts.first) throw new Error('anchor not unique for ' + label);
  h = opts.all ? h.split(from).join(to) : h.slice(0, idx) + to + h.slice(idx + from.length);
  steps.push(label);
}
function cut(label, startMarker, endMarker) {
  const a = h.indexOf(startMarker), b = h.indexOf(endMarker);
  if (a < 0 || b < 0 || b < a) throw new Error('cut anchors missing for ' + label);
  const removed = h.slice(a, b);
  h = h.slice(0, a) + h.slice(b);
  steps.push(label);
  return removed;
}

/* ---------- 0. marquee (chrome, line 1) ---------- */
rep('marquee', "var seg='END OF SUMMER SALE! &#129381; UP TO 39% OFF + FREE STARTER KIT&nbsp;&nbsp;&bull;&nbsp;&nbsp;';",
  "var seg='FALL RESET SALE &#127810; 61% OFF + $92 IN FREE GIFTS&nbsp;&nbsp;&bull;&nbsp;&nbsp;';");
/* body-scroll lock must survive the chrome's z() reset while the cart is open */
rep('z-lock', "if(!document.querySelector('.lbx.on')){", "if(!document.querySelector('.lbx.on')&&!document.querySelector('#kv-cart.on')){");

/* ---------- 1. v3 CSS (appended inside the main style block) ---------- */
const CSS = fs.readFileSync(path.join(__dirname, 'css-v3.css'), 'utf8').split(String.fromCharCode(13)).join('');
rep('css', '\n</style>\n<div id="kv-page">', CSS + '\n</style>\n<div id="kv-page">');

/* ---------- 2. hero buy box + value stack ---------- */
const buyStart = h.indexOf('<div class="buy">');
const asSeen = h.indexOf('<!-- 3b. AS SEEN ON -->');
if (buyStart < 0 || asSeen < 0) throw new Error('hero anchors missing');
const heroOld = h.slice(buyStart, asSeen);
const accMatch = heroOld.match(/<div class="acc">[\s\S]*?<\/details>\n    <\/div>/);
if (!accMatch) throw new Error('accordion block not found');
let ACC = accMatch[0]
  .replace('<li>Every batch third-party tested for purity and potency</li>', '<li>Every batch is tested for purity and potency</li>');
if (ACC.indexOf('third-party') > -1) throw new Error('third-party wording still present');

const HERO = fs.readFileSync(path.join(__dirname, 'hero-v3.html'), 'utf8').split(String.fromCharCode(13)).join('').replace('__ACC__', ACC);
h = h.slice(0, buyStart) + HERO + h.slice(asSeen);
steps.push('hero+valsec');

/* ---------- 3. proof carousel after AS SEEN ON ---------- */
const PROOF = `<!-- 3c. PROOF -->
<section class="proofsec lav"><div class="wrap">
  <div class="ctr">
    <h2 class="kith2">What 1,133 customers say</h2>
    <div class="pf-sub"><span>Excellent</span><span class="s">&#9733;&#9733;&#9733;&#9733;&#9733;</span><span class="g">4.8 out of 5 &middot; verified buyers</span></div>
  </div>
  <div class="carou pf-carou" data-carou="proof">
    <button class="cnav prev" aria-label="Previous">&#8249;</button>
    <div class="ctrack">
      <div class="cslide"><div class="pf"><div class="vid vid-live pf-media pos-top"><video class="slot v" preload="metadata" poster="${GH}/img/rev/charles-w.jpg" playsinline muted loop title="Charles W. making his morning Kava Nectar"><source src="https://d4yxl4pe8dqlj.cloudfront.net/b71da776-0bd5-4817-b687-6614fa031896/9db85de2-0901-4eea-af62-782494e66220/web.mp4" type="video/mp4"></video><button class="play" type="button" aria-label="Play review video">&#9654;</button></div><div class="pf-b"><div class="pf-top"><span class="st">&#9733;&#9733;&#9733;&#9733;&#9733;</span><span class="pf-v">&#10003; Verified buyer</span></div><p>&ldquo;Ever since my wife and I visited Kavahana in Santa Monica, we&rsquo;ve been hooked. We start most mornings with kava, a cup of joe and jazz. Highly recommended.&rdquo;</p><div class="pf-who"><b>Charles W.</b> &middot; Kava Nectar Triple Pack</div></div></div></div>
      <div class="cslide"><div class="pf"><div class="vid vid-live pf-media"><video class="slot v" preload="metadata" poster="${GH}/img/rev/darija-v.jpg" playsinline muted loop title="Darija V. pouring Kava Nectar over ice"><source src="https://d4yxl4pe8dqlj.cloudfront.net/b71da776-0bd5-4817-b687-6614fa031896/19075973-7508-48ee-829b-1cac94339093/web.mp4" type="video/mp4"></video><button class="play" type="button" aria-label="Play review video">&#9654;</button></div><div class="pf-b"><div class="pf-top"><span class="st">&#9733;&#9733;&#9733;&#9733;&#9733;</span><span class="pf-v">&#10003; Verified buyer</span></div><p>&ldquo;The little tingly feeling is so fun. That perfect upbeat, relaxed mood that makes socializing feel easy and fun without feeling out of it.&rdquo;</p><div class="pf-who"><b>Darija V.</b> &middot; Kava Nectar Classic Edition</div></div></div></div>
      <div class="cslide"><div class="pf"><div class="vid vid-live pf-media"><video class="slot v" preload="metadata" poster="${GH}/img/rev/samuel-h-day.jpg" playsinline muted loop title="Samuel H. on Classic and Balance for daytime"><source src="https://d4yxl4pe8dqlj.cloudfront.net/b71da776-0bd5-4817-b687-6614fa031896/6b46c645-187a-4317-b4c9-cff06f92f95c/web.mp4" type="video/mp4"></video><button class="play" type="button" aria-label="Play review video">&#9654;</button></div><div class="pf-b"><div class="pf-top"><span class="st">&#9733;&#9733;&#9733;&#9733;&#9733;</span><span class="pf-v">&#10003; Verified buyer</span></div><p>&ldquo;I like the Classic and Balance for daytime: chill but focused, and it actually gives me some energy. I mix one scoop of each with fruit juice and seltzer.&rdquo;</p><div class="pf-who"><b>Samuel H.</b> &middot; Kava Nectar Combo Pack</div></div></div></div>
    </div>
    <button class="cnav next" aria-label="Next">&#8250;</button>
  </div>
  <div class="cdots" data-dots="proof"></div>
  <p class="proofline">Noble kava root, cold-pressed. One ingredient. Every batch is tested.</p>
</div></section>

<!-- 14. UGC CAROUSEL -->`;
rep('proof', '<!-- 14. UGC CAROUSEL -->', PROOF);

/* ---------- 4. section removals ---------- */
cut('cut giftband', '<!-- 4. GIFT BAND -->', '<!-- 4b. SUBSCRIBER PERKS -->');
cut('cut green band', '<!-- 7. TRANSFORM -->', '<!-- 9. MARQUEE -->');
const realtalk = cut('cut mid-page reviews', '<!-- 11. REAL TALK -->', '<!-- 12. US X THEM -->');
cut('cut reverse tolerance graph', '<!-- 14c. REVERSE TOLERANCE -->', '<!-- 17. FOUNDERS -->');

/* ---------- 5. text review strip after the FAQ (old 4 cards + Brittney + Robert L.) ---------- */
let strip = realtalk
  .replace('<!-- 11. REAL TALK -->', '<!-- 11b. TEXT REVIEWS -->')
  .replace('<section class="lav realtalksec">', '<section class="lav realtalksec txtrev">')
  .replace('<h2>From the people who drink it</h2>', '<h2>More from the people who drink it</h2>');
const extraCards = `      <div class="cslide"><div class="rc"><div class="st">&#9733;&#9733;&#9733;&#9733;&#9733;</div><h3>"Quit the vodka and start the kava"</h3><p>Would usually have vodka to unwind. The same bottle has sat in my freezer for months untouched since I started ending my day with a kava or 2. Within seconds I have a grin on my face and a tingle on my tongue.</p><div class="who"><span class="wn">Robert L.</span><span class="wv">Verified review</span></div></div></div>
      <div class="cslide"><div class="rc"><div class="st">&#9733;&#9733;&#9733;&#9733;&#9733;</div><h3>"Great alternative to taking the edge off"</h3><p>Without the after effects of alcohol! I can feel a sense of calm and uplift within minutes and it is fun to make drinks with.</p><div class="who"><span class="wn">Brittney D.</span><span class="wv">Verified review</span></div></div></div>
`;
if (strip.indexOf('    </div>\n    <button class="cnav next"') < 0) throw new Error('strip anchor missing');
strip = strip.replace('    </div>\n    <button class="cnav next"', extraCards + '    </div>\n    <button class="cnav next"');
rep('text strip', '<!-- 16. REVIEWS, SHOPIFY APP -->', strip + '<!-- 16. REVIEWS, SHOPIFY APP -->');

/* ---------- 6. buy box repeat prices ---------- */
rep('btb tag', '<span class="tag">Best deal &ndash; 34% savings</span>', '<span class="tag">Best deal &ndash; save 61%</span>');
rep('btb 45 price', '<span class="pr">$109.99<s>$166.46</s></span>', '<span class="pr">$79.99<s>$202.96</s><span class="fb">First box</span></span>');
rep('btb 22 price', '<span class="pr">$59.99<s>$98.96</s></span>', '<span class="pr">$59.99<s>$117.96</s><span class="fb">Save 49%</span></span>');
rep('btb 45 small', '<span class="nm">45 servings<small>Starter kit + 5 stick packs free</small></span>', '<span class="nm">45 servings<small>Starter kit + 10 stick packs free &middot; then $109.99/mo</small></span>');
rep('btb 22 small', '<span class="nm">22 servings<small>Starter kit free</small></span>', '<span class="nm">22 servings<small>Starter kit free &middot; $59.99/mo</small></span>');

/* ---------- 7. FAQ: reverse tolerance in two sentences ---------- */
rep('faq rt', 'Kava is thought to have a kind of reverse tolerance, where the benefits feel subtle at first and become more noticeable with continued use. Traditionally, newcomers are welcomed with 2 to 3 servings.',
  'Kava is thought to have a kind of reverse tolerance, where the benefits feel subtle at first and become more noticeable with continued use. It works the opposite way to alcohol: the longer you drink it, the less you need. Traditionally, newcomers are welcomed with 2 to 3 servings.');

/* ---------- 8. size script: sublines, value-stack toggle, CTA -> cart ---------- */
rep('sizes 45', "s:'45 servings \\u00b7 delivered monthly', r:'$109.99',", "s:'Code <span class=\"code\">DRINKKAVA</span> applied \\u00b7 then $109.99/mo', r:'$109.99',");
rep('sizes 22', "s:'22 servings \\u00b7 delivered monthly', r:'$59.99',", "s:'$59.99 a month \\u00b7 skip or cancel anytime', r:'$59.99',");
rep('sizes get', "get:'<span class=\"mauna\">KAVA NECTAR</span> is a non-alcoholic drink you can actually feel: calm, smiley and social, from one ingredient, cold-pressed noble kava root. Scoop, mix into any cold drink and enjoy.'", "get:'<span class=\"mauna\">KAVA NECTAR</span> is a non-alcoholic drink you can actually feel: calm, smiley and social. One ingredient: cold-pressed noble kava root.'", { all: true });
rep('bbSub html', "$('bbSub').textContent=s.s;", "$('bbSub').innerHTML=s.s;if(window.kvVal)kvVal(key);");
const ctaOld = h.slice(h.indexOf("  document.querySelectorAll('.hero .pill-cta').forEach(function(b){"), h.indexOf("  stabilize();\n  window.addEventListener('load',stabilize);"));
if (!ctaOld || ctaOld.indexOf('19079102782') < 0) throw new Error('cta handler not found');
h = h.replace(ctaOld, "  window.__kvKey=function(b){return (b&&b.closest&&b.closest('.btbsec'))?btbKey:topKey};\n  document.querySelectorAll('.pill-cta').forEach(function(b){ if(b.id==='readlabel')return; b.addEventListener('click',function(e){ e.preventDefault(); if(window.__kvOpenCart) window.__kvOpenCart(window.__kvKey(b)); }); });\n");
steps.push('cta->cart');
rep('no scroll-to-top', "    b.addEventListener('click',function(){ window.scrollTo({top:0,behavior:'smooth'}); });\n", '');

/* ---------- 9. sticky bar: copy + arm on first scroll past the button ---------- */
rep('sticky copy', '<div class="ks-t">Up to 39% off<br>+ free starter kit gifts</div>', '<div class="ks-t">$79.99 first box<br>Save 61% + free starter kit</div>');
rep('sticky arm', "var kvBarSync=function(){var seen=document.querySelector('.seenon');var passed=seen?seen.getBoundingClientRect().top<=0:hero.getBoundingClientRect().bottom<0;",
  "var kvBarSync=function(){var cta=document.querySelector('.buy .pill-cta');var r=cta?cta.getBoundingClientRect():hero.getBoundingClientRect();var passed=(r.bottom<0||r.top>innerHeight)&&window.scrollY>120&&!document.querySelector('#kv-cart.on');");
rep('sticky btn', 'document.getElementById("kv-sticky-btn").addEventListener("click",function(){var b=document.querySelector(".buy .pill-cta");if(b)b.click()});',
  'document.getElementById("kv-sticky-btn").addEventListener("click",function(){if(window.__kvOpenCart)window.__kvOpenCart(window.__kvKey?window.__kvKey(null):"4oz")});');

/* ---------- 10. theme drawer offer panel ---------- */
rep('drawer offer', "'<span class=\"kvo-s\">Save up to 39%</span>'", "'<span class=\"kvo-s\"><s>$202.96</s> $79.99 first box</span>'");
rep('offer strike css', '.kvo-s{display:block;font-family:Newsreader,ui-serif,Georgia,serif;font-weight:600;font-size:27px;line-height:1.08;letter-spacing:-.012em;color:#1F1D17;margin:0 0 7px}', '.kvo-s{display:block;font-family:Newsreader,ui-serif,Georgia,serif;font-weight:600;font-size:26px;line-height:1.1;letter-spacing:-.012em;color:#1F1D17;margin:0 0 7px}.kvo-s s{color:#9A958A;font-weight:400;font-size:.66em;margin-right:5px;text-decoration-thickness:2px;white-space:nowrap}');
rep('drawer sub', "'<span class=\"kvo-sub\">Starter kit free: 2 coconut shell cups, whisk, digital recipe guide, 5 stick packs free, and again on your first renewal</span>'",
  "'<span class=\"kvo-sub\">Save 61%: 2 coconut shell cups, whisk, 5 stick packs and the digital guide free, then $109.99 a month</span>'");

/* ---------- 11. cart drawer (outside #kv-page, own CSS) ---------- */
const CART = fs.readFileSync(path.join(__dirname, 'cart-v3.html'), 'utf8').replace(/\r\n/g, '\n');
rep('cart drawer', '<script src="https://bryce-wq2222.github.io/kavahana-pdp/kv-gift-guard.js" defer></script>', CART + '\n<script src="https://bryce-wq2222.github.io/kavahana-pdp/kv-gift-guard-v3.js" defer></script>'); /* v3 guard: event-driven + 30 s heartbeat, no 2 s poll (9/8) */

/* ---------- 12. desktop clicks inside carousels: capture the pointer only once it actually drags ---------- */
const CAP = JSON.parse(fs.readFileSync(path.join(__dirname, 'capture-patch.json'), 'utf8'));
rep('ctrack capture', CAP.ctrackFrom, CAP.ctrackTo);
rep('slides capture', CAP.slidesFrom, CAP.slidesTo);

/* ---------- 12b. slide 1 = Fall Reset Sale heroes (Bryce 9/8), v3 + listicle only; live keeps s1-45c/s1-22c ---------- */
rep("slide1 45 file", "/img/s1-45c.jpg", "/img/s1-45e.jpg", { all: true });
rep("slide1 22 file", "/img/s1-22c.jpg", "/img/s1-22e.jpg", { all: true });
rep("slide1 45 alt", "The 45 serving Starter Kit: two bags, two coconut shell cups, whisk and 5 stick packs", "Fall Reset Sale: 61% off + $92 in free gifts. The 45 serving Starter Kit: two bags, two coconut shell cups, whisk and 5 stick packs", { all: true });
rep("slide1 22 alt", "The 22 serving Starter Kit: one bag, two coconut shell cups and whisk", "Fall Reset Sale: 49% off + $57 in free gifts. The 22 serving Starter Kit: one bag, two coconut shell cups and whisk", { all: true });
[["s1-45e.jpg", 4], ["s1-22e.jpg", 2]].forEach(function (pair) { var n = h.split(pair[0]).length - 1; if (n !== pair[1]) throw new Error("expected " + pair[1] + " refs to " + pair[0] + ", found " + n); });
if (h.indexOf("s1-45c.jpg") > -1 || h.indexOf("s1-22c.jpg") > -1) throw new Error("old slide-1 file still referenced");

/* ---------- 13. review videos: spinner from tap until playback starts ---------- */
const VID = JSON.parse(fs.readFileSync(path.join(__dirname, 'video-patch.json'), 'utf8'));
rep('video loading state', VID.clickFrom, VID.clickTo);

/* ---------- checks ---------- */
['$166.46', '34% savings', 'third-party', 'END OF SUMMER', 'Morning and evening', 'class="rt-card', '<h2>From the people who drink it</h2>'].forEach(function (bad) {
  if (h.indexOf(bad) > -1) throw new Error('leftover: ' + bad);
});
/* ---------- 12c. supplement-facts slide per size (Bryce 9/8 night): 45 = s6-45e (4 oz pouch), 22 = s6 (2 oz) ---------- */
rep('label slide 45', 'src="https://bryce-wq2222.github.io/kavahana-pdp/img/s6.jpg"', 'src="https://bryce-wq2222.github.io/kavahana-pdp/img/s6-45e.jpg"', { all: true });
rep('label size map 45', "'4oz':{hero:'https://bryce-wq2222.github.io/kavahana-pdp/img/s1-45e.jpg',", "'4oz':{label:'https://bryce-wq2222.github.io/kavahana-pdp/img/s6-45e.jpg', hero:'https://bryce-wq2222.github.io/kavahana-pdp/img/s1-45e.jpg',");
rep('label size map 22', "'2oz':{hero:'https://bryce-wq2222.github.io/kavahana-pdp/img/s1-22e.jpg',", "'2oz':{label:'https://bryce-wq2222.github.io/kavahana-pdp/img/s6.jpg', hero:'https://bryce-wq2222.github.io/kavahana-pdp/img/s1-22e.jpg',");
rep('label swap', "swapImgs(document.querySelectorAll('#slides .heroimg'), s);", "swapImgs(document.querySelectorAll('#slides .heroimg'), s); document.querySelectorAll('img[src*=\"/img/s6\"]').forEach(function(lab){ if(s.label&&lab.getAttribute('src')!==s.label){lab.src=s.label;} });");
rep('label preload', "['https://bryce-wq2222.github.io/kavahana-pdp/img/s1-45e.jpg','https://bryce-wq2222.github.io/kavahana-pdp/img/s1-22e.jpg'].forEach", "['https://bryce-wq2222.github.io/kavahana-pdp/img/s1-45e.jpg','https://bryce-wq2222.github.io/kavahana-pdp/img/s1-22e.jpg','https://bryce-wq2222.github.io/kavahana-pdp/img/s6.jpg'].forEach");
/* 9/8 night: the buy box link "See your monthly gifts" points at #kv-perks, which never existed; give the perks section that id */
rep('kv-perks anchor', '<section class="perksec"', '<section class="perksec" id="kv-perks"');
/* 9/9: picking a size in the BOTTOM buy box must drive the whole page too (sticky bar + top tiles used to keep the old size -> sticky built the 45 after the visitor chose 22 at the bottom) */
rep('bottom size syncs all', "} else {\n      btbKey=key;\n      document.querySelectorAll('[data-o2]').forEach(function(x){x.classList.toggle('sel', x.dataset.o2===key)});\n      swapImgs(document.querySelectorAll('.btbsec .heroimg'), s);\n    }\n", "} else { setSize(key, true); return; }\n");
/* 9/9: the sticky bar copy follows the selected size (it said $79.99 / 61% with the 22 selected) */
rep('sticky size sync', "{lab.src=s.label;}", "{lab.src=s.label;} var ks=document.querySelector('#kv-sticky .ks-t'); if(ks){ks.innerHTML=(key==='2oz')?'$59.99 a month<br>Save 49% + free starter kit':'$79.99 first box<br>Save 61% + free starter kit';}");
/* 9/8 Bryce: guarantee reads "Feel it", everywhere the live embed says "Love it" */
{ const n = h.split('Love it or your money back').length - 1; if (n < 1) throw new Error('expected a Love-it guarline left in the live embed, found ' + n); h = h.split('Love it or your money back').join('Feel it or your money back'); }
/* 9/8 Bryce: "As seen on" moves to right above "What's inside your free starter kit" */
{ const so = h.indexOf('<section class="seenon"'); if (so < 0) throw new Error('no .seenon section'); const soEnd = h.indexOf('</section>', so) + 10; const seen = h.slice(so, soEnd); h = h.slice(0, so) + h.slice(soEnd); const vs = h.indexOf('<section class="kitsec valsec" id="kv-valsec">'); if (vs < 0) throw new Error('no #kv-valsec'); h = h.slice(0, vs) + seen + String.fromCharCode(10) + h.slice(vs); }
/* 9/8 Bryce: the bottom buy box tiles must be the same as the top ones (gift line, per-serving line, pill) */
{ const hero = fs.readFileSync(path.join(__dirname, 'hero-v3.html'), 'utf8').replace(/\r\n/g, '\n');
  const t45 = (hero.match(/<div class="opt sel" data-o="4oz">[\s\S]*?<\/div>/) || [])[0];
  const t22 = (hero.match(/<div class="opt" data-o="2oz">[\s\S]*?<\/div>/) || [])[0];
  if (!t45 || !t22) throw new Error('hero tiles not found');
  const b45 = h.match(/<div class="opt sel" data-o2="4oz">[\s\S]*?<\/div>/);
  const b22 = h.match(/<div class="opt" data-o2="2oz">[\s\S]*?<\/div>/);
  if (!b45 || !b22) throw new Error('btb tiles not found');
  h = h.replace(b45[0], t45.replace('data-o="4oz"', 'data-o2="4oz"')).replace(b22[0], t22.replace('data-o="2oz"', 'data-o2="2oz"')); }
fs.writeFileSync(OUT, h);
console.log('wrote', OUT, h.length, 'bytes;', steps.length, 'steps:', steps.join(', '));
