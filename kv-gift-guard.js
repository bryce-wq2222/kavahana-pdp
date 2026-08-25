/* Kavahana gift guard v2: free gifts exist only alongside a subscribed Starter Kit.
   - Reacts instantly to any cart mutation (fetch hook) + 2s polling backstop.
   - After stripping gifts, refreshes the cart UI so shoppers never see phantom lines.
   - Hides the cart's selling-plan opt-out dropdown. */
(function () {
  if (window.__kvGiftGuard) return;
  window.__kvGiftGuard = 1;
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
  function sweep() {
    if (busy) return; busy = true;
    fetch('/cart.js').then(function (r) { return r.json(); }).then(function (c) {
      var items = (c && c.items) || [];
      var hasSubKit = items.some(function (i) {
        return (i.sku || '').indexOf('KH-STARTER-KIT') === 0 && i.selling_plan_allocation;
      });
      if (hasSubKit) { busy = false; refreshUI(); return; }
      var gift = null;
      for (var k = 0; k < items.length; k++) {
        if ((items[k].sku || '').indexOf('KH-GIFT-') === 0) { gift = items[k]; break; }
      }
      if (!gift) { busy = false; refreshUI(); return; }
      fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: gift.key, quantity: 0 })
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
