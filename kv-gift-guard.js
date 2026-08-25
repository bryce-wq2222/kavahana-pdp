/* Kavahana gift guard: free gift items may only exist alongside a subscribed Starter Kit.
   Also hides the cart's selling-plan opt-out dropdown. Injected via ScriptTag on all pages. */
(function () {
  try {
    var st = document.createElement('style');
    st.textContent = 'select.cart-item-selling-plan-selector{display:none!important}';
    (document.head || document.documentElement).appendChild(st);
  } catch (e) {}
  var busy = false;
  function sweep() {
    if (busy) return; busy = true;
    fetch('/cart.js').then(function (r) { return r.json(); }).then(function (c) {
      var items = (c && c.items) || [];
      var hasSubKit = items.some(function (i) {
        return (i.sku || '').indexOf('KH-STARTER-KIT') === 0 && i.selling_plan_allocation;
      });
      if (hasSubKit) { busy = false; return; }
      var gift = null;
      for (var k = 0; k < items.length; k++) {
        if ((items[k].sku || '').indexOf('KH-GIFT-') === 0) { gift = items[k]; break; }
      }
      if (!gift) { busy = false; return; }
      fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: gift.key, quantity: 0 })
      }).then(function () { busy = false; sweep(); }).catch(function () { busy = false; });
    }).catch(function () { busy = false; });
  }
  setInterval(sweep, 4000);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sweep);
  else sweep();
})();
