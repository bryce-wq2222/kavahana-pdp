const fs = require('fs');
const path = 'C:/Users/bryce/kavahana-pdp/';
const v2 = fs.readFileSync(path + 'shopify-embed-v2.txt', 'utf8');
const live = fs.readFileSync(path + 'shopify-embed.txt', 'utf8');

if (/__kvDrawer/.test(live)) { console.log('live already has drawer, aborting'); process.exit(1); }
const drStart = v2.indexOf('<style id="kv-drawer-css">');
if (drStart < 0) throw new Error('drawer block not found in v2');
const drawerBlock = v2.slice(drStart).trim();
if (!/__kvDrawer/.test(drawerBlock) || !/recipes-preview/.test(drawerBlock)) throw new Error('drawer block incomplete');

fs.writeFileSync(path + 'shopify-embed.txt', live.replace(/\s*$/, '\n') + drawerBlock + '\n');
console.log('drawer appended to live embed: +' + drawerBlock.length + ' chars, new total=' + (live.length + drawerBlock.length));
