/* Build shopify-embed-v3.txt from the LIVE embed (shopify-embed.txt).
   Spec: PDP-V3-SPEC-2026-09-07.md (rev 3). Run: node tools/build-v3.js
   Every edit asserts its anchor exists so a live-embed change cannot silently skip a step. */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'shopify-embed.txt');
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
  "var seg='$79.99 FIRST BOX &#129381; SAVE 61% + FREE STARTER KIT&nbsp;&nbsp;&bull;&nbsp;&nbsp;';");
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
    <div class="eyebrow" style="text-align:center">Verified reviews</div>
    <h2 class="btbh2">Rated 4.8 by 1,133 customers</h2>
  </div>
  <div class="carou pf-carou" data-carou="proof">
    <button class="cnav prev" aria-label="Previous">&#8249;</button>
    <div class="ctrack">
      <div class="cslide"><div class="pf"><div class="vid vid-live pf-media pos-top"><video class="slot v" preload="none" poster="${GH}/img/rev/charles-w.jpg" playsinline muted loop title="Charles W. making his morning Kava Nectar"><source data-src="https://d4yxl4pe8dqlj.cloudfront.net/b71da776-0bd5-4817-b687-6614fa031896/9db85de2-0901-4eea-af62-782494e66220/web.mp4" type="video/mp4"></video><button class="play" type="button" aria-label="Play review video">&#9654;</button></div><div class="pf-b"><div class="pf-top"><span class="st">&#9733;&#9733;&#9733;&#9733;&#9733;</span><span class="pf-v">&#10003; Verified buyer</span></div><p>&ldquo;Ever since my wife and I visited Kavahana in Santa Monica, we&rsquo;ve been hooked. We start most mornings with kava, a cup of joe and jazz. Highly recommended.&rdquo;</p><div class="pf-who"><b>Charles W.</b> &middot; Kava Nectar Triple Pack</div></div></div></div>
      <div class="cslide"><div class="pf"><div class="vid vid-live pf-media"><video class="slot v" preload="none" poster="${GH}/img/rev/darija-v.jpg" playsinline muted loop title="Darija V. pouring Kava Nectar over ice"><source data-src="https://d4yxl4pe8dqlj.cloudfront.net/b71da776-0bd5-4817-b687-6614fa031896/19075973-7508-48ee-829b-1cac94339093/web.mp4" type="video/mp4"></video><button class="play" type="button" aria-label="Play review video">&#9654;</button></div><div class="pf-b"><div class="pf-top"><span class="st">&#9733;&#9733;&#9733;&#9733;&#9733;</span><span class="pf-v">&#10003; Verified buyer</span></div><p>&ldquo;The little tingly feeling is so fun. That perfect upbeat, relaxed mood that makes socializing feel easy and fun without feeling out of it.&rdquo;</p><div class="pf-who"><b>Darija V.</b> &middot; Kava Nectar Classic Edition</div></div></div></div>
      <div class="cslide"><div class="pf"><div class="vid vid-live pf-media"><video class="slot v" preload="none" poster="${GH}/img/rev/samuel-h.jpg" playsinline muted loop title="Samuel H. mixing Kava Nectar with a frother"><source data-src="https://d4yxl4pe8dqlj.cloudfront.net/b71da776-0bd5-4817-b687-6614fa031896/9258ccdf-6881-49c0-b8df-7e5e668597f4/web.mp4" type="video/mp4"></video><button class="play" type="button" aria-label="Play review video">&#9654;</button></div><div class="pf-b"><div class="pf-top"><span class="st">&#9733;&#9733;&#9733;&#9733;&#9733;</span><span class="pf-v">&#10003; Verified buyer</span></div><p>&ldquo;Very relaxing, kind of like the buzz of alcohol without any of the mental fuzziness. Tastes quite good when I use my frother with some fruit juice. Will definitely order again.&rdquo;</p><div class="pf-who"><b>Samuel H.</b> &middot; Kava Nectar Relax Edition</div></div></div></div>
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
rep('sizes 45', "s:'45 servings \\u00b7 delivered monthly', r:'$109.99',", "s:'Code <span class=\"code\">FIRSTBOX30</span> applied \\u00b7 then $109.99/mo', r:'$109.99',");
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
rep('drawer offer', "'<span class=\"kvo-s\">Save up to 39%</span>'", "'<span class=\"kvo-s\">$79.99 first box</span>'");
rep('drawer sub', "'<span class=\"kvo-sub\">Starter kit free: 2 coconut shell cups, whisk, digital recipe guide, 5 stick packs free, and again on your first renewal</span>'",
  "'<span class=\"kvo-sub\">Save 61%: 2 coconut shell cups, whisk, 10 stick packs and the digital guide free, then $109.99 a month</span>'");

/* ---------- 11. cart drawer (outside #kv-page, own CSS) ---------- */
const CART = fs.readFileSync(path.join(__dirname, 'cart-v3.html'), 'utf8').replace(/\r\n/g, '\n');
rep('cart drawer', '<script src="https://bryce-wq2222.github.io/kavahana-pdp/kv-gift-guard.js" defer></script>', CART + '\n<script src="https://bryce-wq2222.github.io/kavahana-pdp/kv-gift-guard.js" defer></script>');

/* ---------- checks ---------- */
['$166.46', '34% savings', 'third-party', 'END OF SUMMER', 'Morning and evening', 'class="rt-card', '<h2>From the people who drink it</h2>'].forEach(function (bad) {
  if (h.indexOf(bad) > -1) throw new Error('leftover: ' + bad);
});
fs.writeFileSync(OUT, h);
console.log('wrote', OUT, h.length, 'bytes;', steps.length, 'steps:', steps.join(', '));
