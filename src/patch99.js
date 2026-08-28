const fs = require('fs');
let c = fs.readFileSync('pdp-clone-src.html', 'utf8'); const L = [];
const S = (a, b, l) => { if (!c.includes(a)) { L.push('MISS ' + l); return; } c = c.split(a).join(b); L.push('ok ' + l); };

/* 1. compact cards again: benefits only under the selected option */
S('.optbens{display:grid;gap:6px;margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.28);grid-column:1/-1}\n.opt:not(.sel) .optbens{border-top-color:var(--line)}\n.opt:not(.sel) .optbens span{color:var(--grey)}\n.opt:not(.sel) .optbens span::before{color:var(--green)}',
  '.optbens{display:none;margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.28);grid-column:1/-1}\n.opt.sel .optbens{display:grid;gap:6px}', 'bens selected-only again');

/* 2. giftband line */
S('The cups, the whisk, the guide.<br>They arrive with the kava and stay.', 'The cups, the whisk, the guide.<br>All in the Starter Kit.', 'giftband line');

/* 3. decouple the two buy boxes: bottom clicks change only the bottom */
S(`  function setSize(key, fromTop){
    var s=SIZES[key]; if(!s) return;
    document.querySelectorAll('.buy [data-o]').forEach(function(x){x.classList.toggle('sel', x.dataset.o===key)});
    document.querySelectorAll('[data-o2]').forEach(function(x){x.classList.toggle('sel', x.dataset.o2===key)});
    var $=function(i){return document.getElementById(i)};
    $('bbSub').textContent=s.s;
    $('bbRen').textContent=s.r;
    $('bbGet').innerHTML=s.get;
    document.querySelectorAll('.heroimg').forEach(function(hi){
      if(hi.getAttribute('src')!==s.hero){hi.src=s.hero;hi.alt=s.halt;}
    });
    if(fromTop){
      var sl=document.getElementById('slides');
      if(sl)sl.scrollTo({left:0,behavior:'smooth'});
    }
  }`,
`  var topKey='4oz', btbKey='4oz';
  function swapImgs(scope, s){
    scope.forEach(function(hi){ if(hi.getAttribute('src')!==s.hero){hi.src=s.hero;hi.alt=s.halt;} });
  }
  function setSize(key, fromTop){
    var s=SIZES[key]; if(!s) return;
    if(fromTop){
      topKey=key; btbKey=key;
      document.querySelectorAll('.buy [data-o]').forEach(function(x){x.classList.toggle('sel', x.dataset.o===key)});
      var $=function(i){return document.getElementById(i)};
      $('bbSub').textContent=s.s;
      $('bbRen').textContent=s.r;
      $('bbGet').innerHTML=s.get;
      swapImgs(document.querySelectorAll('#slides .heroimg'), s);
      document.querySelectorAll('[data-o2]').forEach(function(x){x.classList.toggle('sel', x.dataset.o2===key)});
      swapImgs(document.querySelectorAll('.btbsec .heroimg'), s);
      var sl=document.getElementById('slides');
      if(sl)sl.scrollTo({left:0,behavior:'smooth'});
    } else {
      btbKey=key;
      document.querySelectorAll('[data-o2]').forEach(function(x){x.classList.toggle('sel', x.dataset.o2===key)});
      swapImgs(document.querySelectorAll('.btbsec .heroimg'), s);
    }
  }`, 'boxes decoupled');

/* 4. per-box checkout variant */
S(`  function currentKey(){var s=document.querySelector('.buy .opt.sel[data-o]');return s?s.dataset.o:'4oz';}
  document.querySelectorAll('.hero .pill-cta').forEach(function(b){
    b.addEventListener('click',function(){ location.href='https://shop.kavahana.com/cart/'+VARIANTS[currentKey()]+':1'; });
  });`,
`  document.querySelectorAll('.hero .pill-cta').forEach(function(b){
    b.addEventListener('click',function(){ var k=b.closest('.btbsec')?btbKey:topKey; location.href='https://shop.kavahana.com/cart/'+VARIANTS[k]+':1'; });
  });`, 'per-box checkout');

/* 5. Everyday Dose infinite wrap: clone slide 1 at the end, silent reset */
S(`  var prev=document.querySelector('.gprev'), next=document.querySelector('.gnext');
  function page(d){ var n=sl.children.length; var i=Math.round(sl.scrollLeft/sl.clientWidth)+d; if(i<0)i=n-1; if(i>n-1)i=0; sl.scrollTo({left:i*sl.clientWidth, behavior:'smooth'}); }`,
`  var prev=document.querySelector('.gprev'), next=document.querySelector('.gnext');
  var clone=sl.children[0].cloneNode(true); clone.setAttribute('aria-hidden','true'); sl.appendChild(clone);
  var realN=sl.children.length-1;
  function silentJump(px){ var b=sl.style.scrollBehavior; sl.style.scrollBehavior='auto'; sl.scrollLeft=px; void sl.offsetWidth; sl.style.scrollBehavior=b; }
  function snapClone(){ if(Math.round(sl.scrollLeft/sl.clientWidth)>=realN){ silentJump(0); } }
  var _ct; sl.addEventListener('scroll',function(){ clearTimeout(_ct); _ct=setTimeout(snapClone,90); });
  function page(d){
    var w=sl.clientWidth, i=Math.round(sl.scrollLeft/w)+d;
    if(i<0){ silentJump(realN*w); i=realN-1; }
    if(i>realN) i=1;
    sl.scrollTo({left:i*w, behavior:'smooth'});
  }`, 'clone wrap');

/* old backwards-animating touch wrap removed */
S(`  var tsx=null;
  sl.addEventListener('touchstart',function(e){ tsx=e.touches[0].clientX; },{passive:true});
  sl.addEventListener('touchend',function(e){
    if(tsx===null)return;
    var dx=e.changedTouches[0].clientX-tsx; tsx=null;
    var last=(sl.children.length-1)*sl.clientWidth;
    if(dx<-30 && sl.scrollLeft>=last-8){ setTimeout(function(){ sl.scrollTo({left:0,behavior:'smooth'}); },80); }
  },{passive:true});`, '', 'old touch wrap removed');

/* 6. dots treat the clone as slide 1 */
S("        var idx=Math.round(slides.scrollLeft/slides.clientWidth);",
  "        var idx=Math.round(slides.scrollLeft/slides.clientWidth); if(idx>=n) idx=0;", 'dots modulo');

fs.writeFileSync('pdp-clone-src.html', c);
console.log(L.join('\n'));
