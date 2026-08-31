/* Kavahana gift guard v4: gifts are rationed to the subscribed kits in the cart.
   v4: /cart/change.js param must be `id` (line key), not `key` — v3 400'd on every trim.
   Allowances per subscribed Starter Kit unit:
     - KH-GIFT-CUP:      2 x (total kit qty)
     - KH-GIFT-WHISK:    1 x (total kit qty)
     - KH-GIFT-5BALSTIX: 1 x (45-serving kit qty only)
   No subscribed kit => no gifts (v2 behavior kept).
   Excess quantities are trimmed line-by-line via /cart/change.
   - Reacts instantly to any cart mutation (fetch hook) + 2s polling backstop.
   - After trimming, refreshes the cart UI so shoppers never see phantom lines.
   - Hides the cart's selling-plan opt-out dropdown. */
(function () {
  if (window.__kvGiftGuard) return;
  window.__kvGiftGuard = 4;
  try {
    var st = document.createElement('style');
    st.textContent = 'select.cart-item-selling-plan-selector{display:none!important}';
    (document.head || document.documentElement).appendChild(st);
  } catch (e) {}
  var busy = false, removedSomething = false;
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
    return 0; /* unknown KH-GIFT-* sku: not allowed */
  }
  function sweep() {
    if (busy) return; busy = true;
    fetch('/cart.js').then(function (r) { return r.json(); }).then(function (c) {
      var items = (c && c.items) || [];
      var kitTotal = 0, kit45 = 0;
      items.forEach(function (i) {
        var s = i.sku || '';
        if (s.indexOf('KH-STARTER-KIT') === 0 && i.selling_plan_allocation) {
          kitTotal += i.quantity;
          if (s.indexOf('45') > -1) kit45 += i.quantity;
        }
      });
      /* walk gift lines in order, allocating remaining allowance per sku family */
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fix)
      }).then(function () { removedSomething = true; busy = false; sweep(); })
        .catch(function () { busy = false; });
    }).catch(function () { busy = false; });
  }
  try {
    var of = window.fetch;
    window.fetch = function (u) {
      var p = of.apply(this, arguments);
      try {
        var url = (typeof u === 'string') ? u : ((u && u.url) || '');
        if (/\/cart\/(change|update|add|clear)/.test(url) && !/kv_guard/.test(url)) {
          p.then(function () { setTimeout(sweep, 150); });
        }
      } catch (e) {}
      return p;
    };
  } catch (e) {}
  setInterval(sweep, 2000);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sweep);
  else sweep();
})();
