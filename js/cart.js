/**
 * cart.js — everything about the shopping cart.
 * Two parts:
 * 1) cartApi — functions to manage the cart (add, remove, quantity, total, order).
 *    For a guest the cart is saved in the browser memory; for a logged-in
 *    user — inside the user's details.
 *    All other pages use cartApi.addToCart for their "Add to cart" buttons.
 * 2) Code that draws the cart page (cart.html), which has three screens:
 *    the cart itself -> payment form (checkout) -> order confirmation.
 */

const cartApi = {
  /** Returns the cart that matters right now: the logged-in user's, or the guest cart. */
  async getActiveCart() {
    const email = storage.getSessionEmail();
    if (!email) return storage.getGuestCart();
    const users = await api.getUsers();
    const user = users.find((u) => u.email === email);
    return (user && user.cart) || [];
  },

  // Saves the cart in the right place: guest -> browser memory,
  // logged-in user -> inside the user details saved on the server
  async persist(cart) {
    const email = storage.getSessionEmail();
    if (!email) {
      storage.setGuestCart(cart);
      return;
    }
    const users = await api.getUsers();
    const idx = users.findIndex((u) => u.email === email);
    if (idx >= 0) {
      users[idx] = { ...users[idx], cart };
      await api.saveUsers(users);
    }
  },

  // Adds a product to the cart. If it is already there — only raises the quantity.
  // At the end: saves, updates the counter in the header and pops a "Added to cart" toast
  async addToCart(product, qty = 1) {
    const cart = await this.getActiveCart();
    const existing = cart.find((c) => c.id === product.id);
    const next = existing
      ? cart.map((c) => (c.id === product.id ? { ...c, quantity: c.quantity + qty } : c))
      : [...cart, { id: product.id, title: product.title, thumbnail: product.thumbnail, price: product.price, quantity: qty }];
    await this.persist(next);
    if (window.header) header.refreshBadges();
    ui.showToast('נוסף לסל בהצלחה ✓');
    return next;
  },

  // Changes the quantity of a product in the cart (the + and − buttons). Never goes below 1
  async updateQuantity(id, quantity) {
    const cart = await this.getActiveCart();
    const next = cart.map((c) => (c.id === id ? { ...c, quantity: Math.max(1, quantity) } : c));
    await this.persist(next);
    if (window.header) header.refreshBadges();
    return next;
  },

  // Deletes a product from the cart completely (the trash can button)
  async removeItem(id) {
    const cart = await this.getActiveCart();
    const next = cart.filter((c) => c.id !== id);
    await this.persist(next);
    if (window.header) header.refreshBadges();
    return next;
  },

  // Empties the whole cart
  async clear() {
    await this.persist([]);
    if (window.header) header.refreshBadges();
  },

  // Counts how many items are in the cart in total (the number in the orange circle in the header)
  count(cart) {
    return cart.reduce((sum, c) => sum + c.quantity, 0);
  },

  // Calculates the total price to pay: price × quantity of every product
  total(cart) {
    return cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  },

  /** Places the order at the end of checkout: creates an order record (number,
      date, items, total). For a logged-in user — it is saved in the order
      history and the cart is emptied; for a guest — the cart is just emptied. */
  async placeOrder(cart) {
    const total = this.total(cart);
    const order = { id: Date.now(), date: new Date().toISOString(), items: cart, total };
    const email = storage.getSessionEmail();
    if (email) {
      const users = await api.getUsers();
      const idx = users.findIndex((u) => u.email === email);
      if (idx >= 0) {
        users[idx] = { ...users[idx], cart: [], orders: [...(users[idx].orders || []), order] };
        await api.saveUsers(users);
      }
    } else {
      storage.setGuestCart([]);
    }
    if (window.header) header.refreshBadges();
    return order;
  },
};

// ---- drawing the cart page (runs only if the page has the #cart-page-root element) ----
(function initCartPage() {
  const root = document.getElementById('cart-page-root');
  if (!root) return;

  // Which "screen" we are on inside the page: 'cart' = the cart, 'checkout' = payment form, 'confirm' = order confirmation
  let view = 'cart'; // 'cart' | 'checkout' | 'confirm'
  let checkoutErrors = {};
  let lastOrderId = null;
  let checkoutValues = { address: '', city: '', zip: '', cardNumber: '', cardExp: '', cvv: '' };

  // Draws the page based on the current screen:
  // - confirm: a white box with a green check, "Order received!" and an order number
  // - checkout: a shipping + payment form with red error messages under the fields
  // - cart: two columns — on the right the product rows (image, name, quantity,
  //   price, trash can), and on the left an "Order summary" box with the total
  //   and a "Go to payment" button
  async function render() {
    const cart = await cartApi.getActiveCart();

    if (view === 'confirm') {
      root.innerHTML = `
        <div class="confirm-box">
          <div class="confirm-check">✓</div>
          <div class="confirm-title">ההזמנה התקבלה!</div>
          <div class="confirm-sub">מספר הזמנה ${lastOrderId} • המוצרים בדרך אלייך.</div>
          ${!storage.getSessionEmail() ? '<div class="confirm-hint">התחברי כדי לשמור את ההזמנה בהיסטוריית הרכישות שלך.</div>' : ''}
          <button class="btn btn-dark" data-action="go-home">חזרה לחנות</button>
        </div>`;
      return;
    }

    if (view === 'checkout') {
      root.innerHTML = `
        <div class="checkout-form">
          <div class="cart-title" style="margin-bottom:20px;">פרטי משלוח ותשלום</div>
          <div class="form-card field-group">
            <div class="field">
              <div class="field-label">כתובת למשלוח</div>
              <input class="field-input" id="checkout-address" value="${utils.escapeHtml(checkoutValues.address)}">
              ${checkoutErrors.address ? `<div class="field-error">${checkoutErrors.address}</div>` : ''}
            </div>
            <div class="form-grid-2">
              <div class="field"><div class="field-label">עיר</div><input class="field-input" id="checkout-city" value="${utils.escapeHtml(checkoutValues.city)}"></div>
              <div class="field"><div class="field-label">מיקוד</div><input class="field-input" id="checkout-zip" value="${utils.escapeHtml(checkoutValues.zip)}"></div>
            </div>
            <div class="form-divider"></div>
            <div class="field">
              <div class="field-label">מספר כרטיס אשראי</div>
              <input class="field-input" id="checkout-card-number" placeholder="0000 0000 0000 0000" value="${utils.escapeHtml(checkoutValues.cardNumber)}">
              ${checkoutErrors.cardNumber ? `<div class="field-error">${checkoutErrors.cardNumber}</div>` : ''}
            </div>
            <div class="form-grid-2">
              <div class="field">
                <div class="field-label">תוקף (MM/YY)</div>
                <input class="field-input" id="checkout-exp" placeholder="MM/YY" value="${utils.escapeHtml(checkoutValues.cardExp)}">
                ${checkoutErrors.cardExp ? `<div class="field-error">${checkoutErrors.cardExp}</div>` : ''}
              </div>
              <div class="field">
                <div class="field-label">CVV</div>
                <input class="field-input" id="checkout-cvv" placeholder="123" value="${utils.escapeHtml(checkoutValues.cvv)}">
                ${checkoutErrors.cvv ? `<div class="field-error">${checkoutErrors.cvv}</div>` : ''}
              </div>
            </div>
            <div class="checkout-total-row"><span>סה"כ לתשלום</span><span>${utils.formatPrice(cartApi.total(cart))}</span></div>
            <button class="btn btn-dark btn-block" data-action="submit-checkout">אישור תשלום</button>
          </div>
        </div>`;
      return;
    }

    // view === 'cart'
    if (!cart.length) {
      root.innerHTML = `
        <div class="cart-header">
          <button class="cart-continue" data-action="go-home">← המשך קניות</button>
        </div>
        ${ui.renderStateMessage('הסל שלך ריק.', 'המשך לקנות', 'go-home')}`;
      return;
    }

    const lines = cart.map((c) => `
      <div class="cart-line" data-id="${c.id}">
        <div class="cart-line-info">
          <div class="cart-line-thumb"><img src="${c.thumbnail}" alt="${utils.escapeHtml(c.title)}"></div>
          <div>
            <div class="cart-line-title">${utils.escapeHtml(c.title)}</div>
            <div class="cart-line-unit">${utils.formatPrice(c.price)} ליחידה</div>
          </div>
        </div>
        <div class="cart-line-actions">
          <div class="qty-stepper cart-line-qty">
            <button data-action="dec-qty" data-id="${c.id}">−</button>
            <div class="qty-value">${c.quantity}</div>
            <button data-action="inc-qty" data-id="${c.id}">+</button>
          </div>
          <div class="cart-line-total">${utils.formatPrice(c.price * c.quantity)}</div>
          <button class="cart-line-remove" data-action="remove-item" data-id="${c.id}">
            <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-1 13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7"></path></svg>
          </button>
        </div>
      </div>`).join('');

    root.innerHTML = `
      <div class="cart-header">
        <button class="cart-continue" data-action="go-home">← המשך קניות</button>
        <div style="display:flex;align-items:center;gap:12px;">
          <div style="text-align:left;">
            <div class="cart-title">סל הקניות שלי</div>
            <div class="cart-line-unit">${cart.length} מוצרים בסל</div>
          </div>
          <div class="cart-icon-badge">${ui.icons.cart()}</div>
        </div>
      </div>
      <div class="cart-layout">
        <div class="cart-lines">
          ${lines}
          <div class="cart-perks">
            <div class="cart-perk">${ui.icons.cart()}<span>משלוח חינם בהזמנות מעל ₪199</span></div>
            <div class="cart-perk">${ui.icons.user()}<span>קנייה בטוחה ומאובטחת</span></div>
            <div class="cart-perk">${ui.icons.user()}<span>שירות לקוחות 24/7</span></div>
          </div>
        </div>
        <div class="order-summary">
          <div class="order-summary-title">סיכום ההזמנה</div>
          <div class="order-summary-row"><span>${cart.length} מוצרים בסל</span><span>${utils.formatPrice(cartApi.total(cart))}</span></div>
          <div class="order-summary-row free"><span>משלוח</span><span>חינם</span></div>
          <div class="order-summary-total"><span>סה"כ לתשלום</span><span>${utils.formatPrice(cartApi.total(cart))}</span></div>
          <button class="btn btn-accent btn-block" data-action="go-checkout" style="margin-bottom:10px;">מעבר לתשלום</button>
          <div class="summary-note">מקבלים את כל כרטיסי האשראי המובילים</div>
        </div>
      </div>`;
  }

  // All the clicks on the cart page: keep shopping, go to checkout, + / − for
  // quantity, delete a product, and "Confirm payment" — which checks the form,
  // and if everything is OK places the order and moves to the confirmation screen
  root.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    const id = Number(el.dataset.id);

    if (action === 'go-home') { router.goTo(router.home()); return; }
    if (action === 'go-checkout') { view = 'checkout'; checkoutErrors = {}; render(); return; }
    if (action === 'inc-qty' || action === 'dec-qty') {
      const cart = await cartApi.getActiveCart();
      const line = cart.find((c) => c.id === id);
      const delta = action === 'inc-qty' ? 1 : -1;
      await cartApi.updateQuantity(id, line.quantity + delta);
      render();
      return;
    }
    if (action === 'remove-item') { await cartApi.removeItem(id); render(); return; }
    if (action === 'submit-checkout') {
      checkoutValues = {
        address: document.getElementById('checkout-address').value,
        city: document.getElementById('checkout-city').value,
        zip: document.getElementById('checkout-zip').value,
        cardNumber: document.getElementById('checkout-card-number').value,
        cardExp: document.getElementById('checkout-exp').value,
        cvv: document.getElementById('checkout-cvv').value,
      };
      checkoutErrors = utils.validateCheckout(checkoutValues);
      if (Object.keys(checkoutErrors).length) { render(); return; }
      const cart = await cartApi.getActiveCart();
      const order = await cartApi.placeOrder(cart);
      lastOrderId = order.id;
      view = 'confirm';
      render();
    }
  });

  // First draw when entering the page
  render();
})();