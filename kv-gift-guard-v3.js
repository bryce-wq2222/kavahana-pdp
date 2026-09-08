/* Kavahana gift guard v5 (v3 PDP + listicle only; the live PDP keeps kv-gift-guard.js v4).
   Same allowances as v4:
     - KH-GIFT-CUP:      2 x (total subscribed kit qty)
     - KH-GIFT-WHISK:    1 x (total subscribed kit qty)
     - KH-GIFT-5BALSTIX: 1 x (45-serving kit qty only)
   No subscribed kit => no gifts. Excess is trimmed line-by-line via /cart/change (param `id` = line key).
   What changed in v5 (9/8/2026, after Shopify 429'd a test cookie into the bot wall):
     - no 2 s polling. Sweeps run on load, 150 ms after any /cart/(add|update|change|clear) call,
       on pageshow (back/forward cache) and when the tab becomes visible again.
     - a slow 30 s heartbeat that is skipped while document.hidden.
     - a sweep never runs while a previous one is in flight, and a 429 / non-JSON answer backs the
       heartbeat off for 5 minutes instead of hammering.
     - theme.liquid still loads kv-gift-guard.js (v4, 2 s poll) on every page, so v5 takes over even when
       v4 registered first: bare fetch('/cart.js') polls (a string URL and no options object, which is how
       v4 reads) are answered from a cached copy of the last cart response while it is younger than 20 s;
       the cache is dropped on any cart mutation so v4 and the theme still see a fresh cart right after
       add/change/update/clear. cart-v3 and this file always pass an options object, so they never hit
       the cache. */
(function () {
  if (window.__kvGiftGuard >= 5) return;
  window.__kvGiftGuard = 5;
  try {
    var st = document.createElement('style');
    st.textContent = 'select.cart-item-selling-plan-selector{display:none!important}';
    (document.head || document.documentElement).appendChild(st);
  } catch (e) {}
  var busy = false, removedSomething = false, backoffUntil = 0;
  var HEARTBEAT = 30000, BACKOFF = 300000, CACHE_MS = 20000;
  var cache = null, cacheAt = 0;
  function remember(r) {
    try {
      if (r && r.status === 200 && /json|javascript/.test(r.headers.get('content-type') || '')) {
        r.clone().text().then(function (t) { cache = t; cacheAt = Date.now(); });
      }
    } catch (e) {}
    return r;
  }
  function refreshUI() {
    if (!removedSomething) return;
    removedSomething = false;
    var onCartPage = location.pathname.indexOf('/cart') === 0;
    var drawer = document.querySelector('.rebuy-cart-items');
    if (onCartPage || (drawer && drawer.offsetParent)) location.reload();
  }
  function allowanceFor(sku, kitTotal, kit45) {
    if (sku.indexOf('KH-GIFT-CUP') === 0) return 2 * kitTotal;
    if (sku.indexOf('KH-GIFT-WHISK') === 0) return 1 * kitTotal;
    if (sku.indexOf('KH-GIFT-5BALSTIX') === 0) return 1 * kit45;
    return 0;
  }
  function sweep() {
    if (busy || Date.now() < backoffUntil) return; busy = true;
    fetch('/cart.js', { credentials: 'same-origin' }).then(remember).then(function (r) {
      if (r.status === 429 || !/json|javascript/.test(r.headers.get('content-type') || '')) { backoffUntil = Date.now() + BACKOFF; throw new Error('cart ' + r.status); }
      return r.json();
    }).then(function (c) {
      var items = (c && c.items) || [];
      var kitTotal = 0, kit45 = 0;
      items.forEach(function (i) {
        var s = i.sku || '';
        if (s.indexOf('KH-STARTER-KIT') === 0 && i.selling_plan_allocation) {
          kitTotal += i.quantity;
          if (s.indexOf('45') > -1) kit45 += i.quantity;
        }
      });
      var used = {};
      var fix = null;
      for (var k = 0; k < items.length; k++) {
        var it = items[k], s = it.sku || '';
        if (s.indexOf('KH-GIFT-') !== 0) continue;
        var fam = s.indexOf('KH-GIFT-CUP') === 0 ? 'CUP' : (s.indexOf('KH-GIFT-WHISK') === 0 ? 'WHISK' : (s.indexOf('KH-GIFT-5BALSTIX') === 0 ? 'STIX' : s));
        var allow = allowanceFor(s, kitTotal, kit45);
        var already = used[fam] || 0;
        var permitted = Math.max(0, Math.min(it.quantity, allow - already));
        used[fam] = already + permitted;
        if (permitted < it.quantity) { fix = { id: it.key, quantity: permitted }; break; }
      }
      if (!fix) { busy = false; refreshUI(); return; }
      fetch('/cart/change.js', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fix)
      }).then(function () { removedSomething = true; busy = false; sweep(); })
        .catch(function () { busy = false; });
    }).catch(function () { busy = false; });
  }
  try {
    var of = window.fetch;
    window.fetch = function (u, o) {
      var url = (typeof u === 'string') ? u : ((u && u.url) || '');
      var bare = (typeof u === 'string') && (o === undefined) && /^(https?:\/\/[^/]+)?\/cart\.js(\?|$)/.test(url);
      if (bare && cache && Date.now() - cacheAt < CACHE_MS) {
        return Promise.resolve(new Response(cache, { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
      var p = of.apply(this, arguments);
      try {
        if (bare) p.then(remember);
        if (/\/cart\/(change|update|add|clear)/.test(url) && !/kv_guard/.test(url)) {
          cache = null; cacheAt = 0;
          p.then(function () { setTimeout(sweep, 150); });
        }
      } catch (e) {}
      return p;
    };
  } catch (e) {}
  setInterval(function () { if (!document.hidden) sweep(); }, HEARTBEAT);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) sweep(); });
  window.addEventListener('pageshow', function (e) { if (e.persisted) sweep(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sweep);
  else sweep();
})();
