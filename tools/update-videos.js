// Video weight fix (9/1/2026): point both embeds at the re-encoded -v2 mp4s, move <source src> to data-src
// so no video bytes load until the clip is within 900px of the viewport, and attach src in the existing
// intersection loader + as a guard inside start(). Usage: node tools/update-videos.js [--live]
// Default patches shopify-embed-v2.txt only (staging). --live also patches shopify-embed.txt (needs Bryce's go).
const fs = require('fs');
const path = 'C:/Users/bryce/kavahana-pdp/';
const files = ['shopify-embed-v2.txt'].concat(process.argv.includes('--live') ? ['shopify-embed.txt'] : []);
const CDN = 'https://bryce-wq2222.github.io/kavahana-pdp/video/';
const NAMES = ['ugc-what-is-kava','ugc-shots-party','ugc-alcohol-free','ugc-take-home','ugc-beach-day','hana-cbs','how-to-prepare'];

const OLD_LOADER_START = "function load(v){ if(v.dataset.poster){ v.poster=v.dataset.poster; delete v.dataset.poster; } }";
const NEW_LOADER_START = "function load(v){ if(v.dataset.poster){ v.poster=v.dataset.poster; delete v.dataset.poster; } var s=v.querySelector('source[data-src]'); if(s){ s.src=s.dataset.src; s.removeAttribute('data-src'); v.load(); } }";
const OLD_SEL = ".vid-live video[data-poster]";
const NEW_SEL = ".vid-live video[data-poster], .vid-live video:has(source[data-src])";
const OLD_START = "    function start(){\n      wraps.forEach(";
const NEW_START = "    function start(){\n      var s=v.querySelector('source[data-src]'); if(s){ s.src=s.dataset.src; s.removeAttribute('data-src'); v.load(); }\n      wraps.forEach(";

for (const f of files) {
  let s = fs.readFileSync(path + f, 'utf8'); const before = s.length; let n = 0;
  for (const name of NAMES) {
    const needle = '<source src="' + CDN + name + '.mp4" type="video/mp4">';
    const parts = s.split(needle); n += parts.length - 1; s = parts.join('<source data-src="' + CDN + name + '-v2.mp4" type="video/mp4">');
  }
  // the how-to loop autoplays on intersection: keep a real src (it must play without a tap) but use the small file
  s = s.split('<source data-src="' + CDN + 'how-to-prepare-v2.mp4"').join('<source src="' + CDN + 'how-to-prepare-v2.mp4"');
  // UGC videos: preload none (data-src means nothing loads anyway; belt and braces)
  s = s.replace(/<video class="slot v" preload="metadata"/g, '<video class="slot v" preload="none"');
  if (!s.includes(OLD_LOADER_START)) throw new Error(f + ': loader not found');
  s = s.replace(OLD_LOADER_START, NEW_LOADER_START).replace(OLD_SEL, NEW_SEL);
  if (!s.includes(OLD_START)) throw new Error(f + ': start() not found');
  s = s.replace(OLD_START, NEW_START);
  // poster loader also has to run for videos that have no data-poster attr but do have data-src: covered by NEW_SEL
  fs.writeFileSync(path + f, s);
  console.log(f, 'sources rewritten:', n, 'bytes', before, '->', s.length,
    '| data-src count', (s.match(/source data-src=/g) || []).length,
    '| v2 refs', (s.match(/-v2\.mp4/g) || []).length,
    '| old mp4 refs left', NAMES.filter(x => s.includes(x + '.mp4"')).join(',') || 'none');
}
