const fs = require('fs');
const REPO = 'C:/Users/bryce/kavahana-pdp/';

/* v2 = the live PDP with one change: KAVA NECTAR set in Mauna Loa renders in
   brand green. The signature "Hana" stays ink, and any .mauna sitting on a
   green band keeps inheriting so it never goes green-on-green. */
const OVERRIDE =
  '/* v2 */\n' +
  '.mauna{color:var(--green)}\n' +
  '.fnd-sig.mauna{color:var(--green)}\n' +
  'section.green .mauna,.mq .mauna{color:inherit}\n' +
  '.opt.sel .mauna,.opt.sel .optbens .mauna{color:inherit}\n';

function inject(html, css) {
  const i = html.lastIndexOf('</style>');
  if (i < 0) throw new Error('no </style> found');
  return html.slice(0, i) + css + html.slice(i);
}

/* page build */
let idx = fs.readFileSync(REPO + 'index.html', 'utf8');
let v2 = inject(idx, OVERRIDE);
v2 = v2.replace(/<title>[^<]*<\/title>/, '<title>Kavahana &middot; Nectar Starter Kit (v2)</title>');
fs.writeFileSync(REPO + 'v2.html', v2);

/* shopify embed build: same override appended to the scoped embed */
let emb = fs.readFileSync(REPO + 'shopify-embed.html', 'utf8');
const scoped = OVERRIDE.split('\n').filter(Boolean).map(function (line) {
  if (line.startsWith('/*')) return line;
  return line.split(',').map(function (s) { return s.trim().startsWith('#kv-page') ? s.trim() : '#kv-page ' + s.trim(); }).join(',');
}).join('\n');
let embV2 = inject(emb, '\n' + scoped + '\n');
fs.writeFileSync(REPO + 'shopify-embed-v2.txt', embV2);

console.log('v2.html', Math.round(v2.length / 1024) + 'KB | embed-v2',
  Math.round(embV2.length / 1024) + 'KB | override present:',
  /\.mauna\{color:var\(--green\)\}/.test(v2) && /#kv-page \.mauna\{color:var\(--green\)\}/.test(embV2));
