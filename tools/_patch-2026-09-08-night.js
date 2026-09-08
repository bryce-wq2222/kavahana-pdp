/* One-off patch, 9/8 night (Bryce): marquee = Fall Reset Sale + fall leaf, label slide per size,
   kit line trash in the drawer, and build-v3 reads a frozen copy of the old live embed (cutover). */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
function rep(file, label, from, to) {
  let s = fs.readFileSync(file, 'utf8');
  const n = s.split(from).length - 1;
  if (n !== 1) throw new Error(label + ': expected 1 anchor, found ' + n);
  s = s.replace(from, to);
  fs.writeFileSync(file, s);
  console.log('ok: ' + label);
}

/* 0. freeze the old live embed as the v3 build source (the live file is about to become v3) */
const live = path.join(ROOT, 'shopify-embed.txt');
const frozen = path.join(ROOT, 'shopify-embed-v1-source.txt');
if (!fs.existsSync(frozen)) {
  const s = fs.readFileSync(live, 'utf8');
  if (!/END OF SUMMER SALE/.test(s)) throw new Error('live embed is not the v1 source any more; refusing to freeze');
  fs.writeFileSync(frozen, s);
  console.log('ok: froze old live embed -> shopify-embed-v1-source.txt');
}

const B = path.join(ROOT, 'tools', 'build-v3.js');
rep(B, 'build source', "const SRC = path.join(ROOT, 'shopify-embed.txt');", "const SRC = path.join(ROOT, 'shopify-embed-v1-source.txt'); /* 9/8 cutover: the old live embed, frozen; shopify-embed.txt is now a copy of the v3 output */");
rep(B, 'marquee copy', "var seg='$79.99 FIRST BOX &#129381; SAVE 61% + FREE STARTER KIT&nbsp;&nbsp;&bull;&nbsp;&nbsp;';", "var seg='FALL RESET SALE &#127810; 61% OFF + $92 IN FREE GIFTS&nbsp;&nbsp;&bull;&nbsp;&nbsp;';");

/* label slide (slide 6): 45 = the new 4 oz label, 22 = the old 2 oz label; swaps with the size like slide 1 */
const LABEL_STEP = [
  "/* ---------- 12c. supplement-facts slide per size (Bryce 9/8 night): 45 = s6-45e (4 oz pouch), 22 = s6 (2 oz) ---------- */",
  "rep('label slide 45', 'src=\"https://bryce-wq2222.github.io/kavahana-pdp/img/s6.jpg\"', 'src=\"https://bryce-wq2222.github.io/kavahana-pdp/img/s6-45e.jpg\"');",
  "rep('label size map 45', \"'4oz':{hero:'https://bryce-wq2222.github.io/kavahana-pdp/img/s1-45e.jpg',\", \"'4oz':{label:'https://bryce-wq2222.github.io/kavahana-pdp/img/s6-45e.jpg', hero:'https://bryce-wq2222.github.io/kavahana-pdp/img/s1-45e.jpg',\");",
  "rep('label size map 22', \"'2oz':{hero:'https://bryce-wq2222.github.io/kavahana-pdp/img/s1-22e.jpg',\", \"'2oz':{label:'https://bryce-wq2222.github.io/kavahana-pdp/img/s6.jpg', hero:'https://bryce-wq2222.github.io/kavahana-pdp/img/s1-22e.jpg',\");",
  "rep('label swap', \"swapImgs(document.querySelectorAll('#slides .heroimg'), s);\", \"swapImgs(document.querySelectorAll('#slides .heroimg'), s); var lab=document.querySelector('#slides img[src*=\\\"/img/s6\\\"]'); if(lab&&s.label&&lab.getAttribute('src')!==s.label){lab.src=s.label;}\");",
  "rep('label preload', \"['https://bryce-wq2222.github.io/kavahana-pdp/img/s1-45e.jpg','https://bryce-wq2222.github.io/kavahana-pdp/img/s1-22e.jpg'].forEach\", \"['https://bryce-wq2222.github.io/kavahana-pdp/img/s1-45e.jpg','https://bryce-wq2222.github.io/kavahana-pdp/img/s1-22e.jpg','https://bryce-wq2222.github.io/kavahana-pdp/img/s6.jpg'].forEach\");",
  ""
].join('\n');
rep(B, 'label step inserted', "/* 9/8 Bryce: guarantee reads \"Feel it\"", LABEL_STEP + "/* 9/8 Bryce: guarantee reads \"Feel it\"");

/* drawer: trash on the kit line; removing it clears kit + gifts and leaves the empty state with the add-ons */
const C = path.join(ROOT, 'tools', 'cart-v3.html');
const TRASH = '<button type="button" class="kc-trash" data-rm-kit aria-label="Remove"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg></button>';
rep(C, 'kit line trash', "<span class=\"kc-off\">'+K.save+'</span></div></div></div>';", "<span class=\"kc-off\">'+K.save+'</span></div></div>" + TRASH + "</div>';");
rep(C, 'kit remove handler', "    var rm=t.closest('[data-rm]');if(rm){",
  "    var rk=t.closest('[data-rm-kit]');if(rk){var snapK={kit:lines.kit,gifts:lines.gifts,bonus:lines.bonus};lines.kit=null;lines.gifts=[];lines.bonus=null;render();serial(function(){return getCart().then(function(c){var up={};(c.items||[]).forEach(function(i){var s=i.sku||'';if(s.indexOf('KH-GIFT-')===0||s.indexOf('KH-STARTER-KIT')===0||s==='KH-FREE-CUP')up[i.key]=0});return Object.keys(up).length?post('/cart/update.js',{updates:up}):null}).then(refreshNow).catch(function(){lines.kit=snapK.kit;lines.gifts=snapK.gifts;lines.bonus=snapK.bonus;render()})});return}\n" +
  "    var rm=t.closest('[data-rm]');if(rm){");
console.log('all patches applied');
