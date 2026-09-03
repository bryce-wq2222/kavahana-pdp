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

const NEW_LOADER = "<script>\n(function(){\n  if(window.__kvVidLoader) return; window.__kvVidLoader=1;\n  function load(v){ if(v.dataset.poster){ v.poster=v.dataset.poster; delete v.dataset.poster; } var s=v.querySelector('source[data-src]'); if(s){ s.src=s.dataset.src; s.removeAttribute('data-src'); v.load(); } }\n  function pending(){ var all=[].slice.call(document.querySelectorAll('.vid-live video, .fnd-vid video')); return all.filter(function(v){ return v.dataset.poster || v.querySelector('source[data-src]'); }); }\n  var io=('IntersectionObserver' in window) ? new IntersectionObserver(function(es){\n    es.forEach(function(e){ if(e.isIntersecting){\n      if(e.target.tagName==='VIDEO'){ load(e.target); }\n      else { [].forEach.call(e.target.querySelectorAll('video'), load); }\n      io.unobserve(e.target);\n    }});\n  },{rootMargin:'900px 0px'}) : null;\n  function scan(){\n    var vids=pending(); if(!vids.length) return;\n    if(!io){ vids.forEach(load); return; }\n    [].forEach.call(document.querySelectorAll('.vid-carou, .fnd-vid'), function(g){ io.observe(g); });\n    vids.forEach(function(v){ io.observe(v); });\n  }\n  scan();\n  document.addEventListener('DOMContentLoaded', scan);\n  window.addEventListener('load', scan);\n  setTimeout(scan, 1500); setTimeout(scan, 4000);\n  var once=function(){ scan(); window.removeEventListener('scroll', once); window.removeEventListener('touchstart', once); };\n  window.addEventListener('scroll', once, {passive:true}); window.addEventListener('touchstart', once, {passive:true});\n})();\n</script>";
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
  { const i = s.indexOf('function load(v){ if(v.dataset.poster)'); if (i < 0) throw new Error(f + ': loader not found'); const a = s.lastIndexOf('<script', i), b = s.indexOf('</script>', i) + 9; s = s.slice(0, a) + NEW_LOADER + s.slice(b); }
  if (s.includes(OLD_START)) s = s.replace(OLD_START, NEW_START); else if (!s.includes("var s=v.querySelector('source[data-src]'); if(s){ s.src=s.dataset.src;")) throw new Error(f + ': start() not found');
  // poster loader also has to run for videos that have no data-poster attr but do have data-src: covered by NEW_SEL
  fs.writeFileSync(path + f, s);
  console.log(f, 'sources rewritten:', n, 'bytes', before, '->', s.length,
    '| data-src count', (s.match(/source data-src=/g) || []).length,
    '| v2 refs', (s.match(/-v2\.mp4/g) || []).length,
    '| old mp4 refs left', NAMES.filter(x => s.includes(x + '.mp4"')).join(',') || 'none');
}
