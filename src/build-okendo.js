const fs = require('fs');
const raw = fs.readFileSync('C:/Users/bryce/Downloads/tts_reviews_with_usernames.csv', 'utf8').replace(/^\uFEFF/, '');

function parseCSV(s) {
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (q) { if (ch === '"') { if (s[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cur); cur = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && s[i + 1] === '\n') i++; row.push(cur); cur = '';
      if (row.length > 1 || row[0] !== '') rows.push(row); row = []; }
    else cur += ch;
  }
  if (cur !== '' || row.length > 0) { row.push(cur); if (row.length > 1 || row[0] !== '') rows.push(row); }
  return rows;
}

/* TikTok product -> Shopify product (verified against live Shopify catalog 8/13/26) */
const PRODUCTS = {
  '1729408268170334600': { handle: 'kava-nectar', pid: '10300597928254' },
  '1729452957222801800': { handle: 'kava-nectar-relax-edition', pid: '10869190689086' },
  '1729607401129677192': { handle: 'kava-nectar-balance-edition', pid: '11370415751486' },
  '1731271730139337096': { handle: 'kava-nectar-triple-pack', pid: '11916049187134' },
  '1729467403843506568': { handle: 'kava-nectar-combo-pack', pid: '11034488373566' },
  '1729416627397890440': { handle: 'kavacup', pid: '10683684389182' },
  '1729754069126517128': { handle: 'kava-nectar-classic-stick-packs', pid: '11596743704894' },
  '1729418751067263368': { handle: 'kava-nectar-starter-kit', pid: '10692933288254' },
  '1729418540369744264': { handle: 'kava-nectar-whisk', pid: '10692874371390' },
};
/* TikTok sku_id -> Shopify SKU, only where the variant is verified (22 vs 45 confirmed
   from Seller Center review rows); ambiguous variants stay blank on purpose */
const SKUS = {
  '1729413517708661128': 'KH-CLAS22', '1729413517708726664': 'KH-CLAS45',
  '1729452957222867336': 'KH-REL22', '1729452957222932872': 'KH-REL45',
  '1729607479957492104': 'KH-BAL22', '1729607479957557640': 'KH-BAL45',
  '1731271732120686984': 'KH-TRIPLE-CLAS22-REL22-BAL22',
  '1729418540369809800': 'KH-WHISK',
  '1731532931436745096': 'KH-ORIGINAL-CUP', '1729431951972536712': 'KH-ORIGINAL-CUP',
};

const MEDIA = JSON.parse(fs.readFileSync('C:/Users/bryce/Downloads/tts-media.json', 'utf8'));
const rows = parseCSV(raw);
const h = rows[0];
const ix = n => h.indexOf(n);
const head = ['name','body','dateCreated','email','handle','productId','imageUrls','isApproved','rating','reply','replyDateCreated','sku','title','videoUrls','isVerifiedBuyer','variantId','countryCode'];
const out = [head];
let kept = 0, dropNoName = 0, dropNoProduct = 0, skuFilled = 0;
for (let i = 1; i < rows.length; i++) {
  const r = rows[i]; if (r.length < h.length) continue;
  if (r[ix('name_status')] === 'missing') { dropNoName++; continue; }
  const map = PRODUCTS[r[ix('product_id')]];
  if (!map) { dropNoProduct++; continue; }
  const sku = SKUS[r[ix('sku_id')]] || '';
  if (sku) skuFilled++;
  const name = r[ix('display_name')] || 'TikTok Shopper';
  const med = MEDIA[r[ix('order_id')]];
  const imageUrls = med && med.i.length ? med.i.join(',') : '';
  out.push([name, r[ix('review_text')], r[ix('review_date')], '', map.handle, map.pid, imageUrls, 'true',
    r[ix('rating')], '', '', sku, '', '', 'true', '', 'us']);
  kept++;
  if (imageUrls) global.photoCount = (global.photoCount || 0) + 1;
}
const esc = v => /[",\n\r]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
fs.writeFileSync('C:/Users/bryce/Downloads/Kavahana_TikTok_Okendo_Import.csv',
  out.map(r => r.map(esc).join(',')).join('\r\n'));
console.log(JSON.stringify({ imported: kept, droppedNoUsername: dropNoName, droppedDeletedProduct: dropNoProduct, withSku: skuFilled }));
