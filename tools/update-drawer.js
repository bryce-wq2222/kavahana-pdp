// Rewrites the drawer takeover script (v3: pre-transform template + delegated CTA) in both embeds.
const fs = require('fs');
const path = 'C:/Users/bryce/kavahana-pdp/';

const NEW_SCRIPT = `<script>
(function(){
  if(window.__kvDrawer) return; window.__kvDrawer=1;
  function transform(root){
    var nav=root.querySelector('.sidebar-nav');
    if(!nav) return false;
    if(nav.querySelector('#kv-drawer-offer')) return true;
    var ul=nav.querySelector('ul');
    if(!ul) return false;
    nav.querySelectorAll('a').forEach(function(a){
      var h=a.getAttribute('href')||'';
      if(h.indexOf('/collections')===0||h.indexOf('/search')===0||h.indexOf('wholesale')>-1){var li=a.closest('li');(li||a).remove();}
    });
    var linkCls=(ul.querySelector('a')||{}).className||'';
    var liCls=(ul.querySelector('li')||{}).className||'';
    var panel=document.createElement('div');
    panel.id='kv-drawer-offer';
    panel.innerHTML='<span class="kvo-k">Starter kit</span>'+
      '<span class="kvo-s">Save up to 39%</span>'+
      '<span class="kvo-sub">Starter kit free: 2 coconut shell cups, whisk, digital recipe guide, 5 stick packs free, and again on your first renewal</span>'+
      '<span class="kvo-cta" data-kv-cta>Get my starter kit &rarr;</span>';
    var anchors=document.createElement('ul');
    anchors.id='kv-drawer-links';
    [['Recipes','/pages/recipes'],['Reviews','/pages/customer-reviews'],['About us','/pages/about']].forEach(function(p){
      var li=document.createElement('li'); li.className=liCls;
      var a=document.createElement('a'); a.className=linkCls; a.textContent=p[0]; a.href=p[1];
      li.appendChild(a); anchors.appendChild(li);
    });
    ul.parentNode.insertBefore(panel,ul);
    ul.parentNode.insertBefore(anchors,ul);
    ['customer_login_link','customer_register_link'].forEach(function(id){
      var a=nav.querySelector('#'+id);
      if(a&&linkCls&&a.className.indexOf('font-heading')===-1){a.className=(a.className+' font-heading heading-secondary block').trim();var li=a.closest('li');if(li&&li.className.indexOf('text-lg')===-1)li.className=(li.className+' text-lg').trim();}
    });
    return true;
  }
  document.addEventListener('click',function(e){
    var b=e.target&&e.target.closest&&e.target.closest('[data-kv-cta]');
    if(!b) return;
    e.preventDefault();
    window.__kvCtaHits=(window.__kvCtaHits||0)+1;
    var closed=false;
    try{if(window.Alpine&&Alpine.store('modals')&&Alpine.store('modals').closeAll){Alpine.store('modals').closeAll();closed=true;}}catch(err){}
    if(!closed){try{if(window.Alpine&&Alpine.store('modals')&&Alpine.store('modals').close){Alpine.store('modals').close('nav');closed=true;}}catch(err){}}
    if(!closed){var slot=document.getElementById('left-drawer-slot');if(slot){var x=slot.querySelector('.justify-between button')||slot.querySelector('button');if(x)x.click();}}
    var t=document.querySelector('#kv-page .buy');
    if(t) setTimeout(function(){t.scrollIntoView({behavior:'smooth',block:'start'})},300);
  },true);
  function sweep(){
    document.querySelectorAll('template').forEach(function(t){
      if(t.content&&t.content.querySelector&&t.content.querySelector('.sidebar-nav')&&!t.content.querySelector('#kv-drawer-offer')) transform(t.content);
    });
    var slot=document.getElementById('left-drawer-slot');
    if(slot&&slot.querySelector('.sidebar-nav')&&!slot.querySelector('#kv-drawer-offer')) transform(slot);
  }
  sweep();
  new MutationObserver(sweep).observe(document.documentElement,{subtree:true,childList:true});
})();
<\/script>`.replace('<\\/script>', '</scr' + 'ipt>');

const WILL_CHANGE = '#modals-leftDrawer .drawer-transition-host{will-change:transform}\n';

for (const f of ['shopify-embed-v2.txt', 'shopify-embed.txt']) {
  let s = fs.readFileSync(path + f, 'utf8').replace(/\r\n/g, '\n');
  const cssIdx = s.indexOf('<style id="kv-drawer-css">');
  if (cssIdx < 0) throw new Error(f + ': drawer css not found');
  const scrIdx = s.indexOf('<script>', s.indexOf('__kvDrawer', cssIdx) - 200);
  const realScrIdx = s.indexOf('<script>\n(function(){\n  if(window.__kvDrawer)', cssIdx);
  if (realScrIdx < 0) throw new Error(f + ': drawer script not found');
  let out = s.slice(0, realScrIdx) + NEW_SCRIPT + '\n';
  if (out.indexOf(WILL_CHANGE) < 0) {
    out = out.replace('#left-drawer-slot form[action*="/search"]', WILL_CHANGE + '#left-drawer-slot form[action*="/search"]');
  }
  if (!/data-kv-cta/.test(out) || !/will-change:transform/.test(out)) throw new Error(f + ': rewrite incomplete');
  fs.writeFileSync(path + f, out);
  console.log(f + ' -> drawer v3, len=' + out.length);
}
