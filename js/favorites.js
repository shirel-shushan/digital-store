/*
 * favorites.js — everything about the favorites (the hearts).
 * Two parts: 1) favoritesApi — functions to manage the list, used by every
 * page with a product card when the heart is clicked. 2) Code that draws
 * the favorites page itself (favorites.html) — a grid of cards with the
 * marked products.
 * The list is always kept in the browser memory (a fast local cache so the
 * hearts draw instantly). When a user is logged in it is ALSO saved on their
 * account in the cloud (jsonbin, through api.js) so it survives across
 * browsers and devices, exactly like the cart. Guests keep it locally only.
 */
const favoritesApi = {
  // Returns all the products marked as favorites
  getAll() {
    return storage.getFavorites();
  },
  // Returns only the ids of the favorites — easy for a quick "is it marked?" check
  getIds() {
    return this.getAll().map((f) => f.id);
  },
  // Is this product in the favorites? (decides if the heart is drawn full or empty)
  isFavorite(id) {
    return this.getIds().includes(id);
  },
  // Heart click: if the product is a favorite — remove it, if not — add it.
  // Saves to the local cache, pushes the list to the cloud (if logged in),
  // and updates the counter on the header icon
  toggle(product) {
    const favorites = this.getAll();
    const exists = favorites.find((f) => f.id === product.id);
    const next = exists ? favorites.filter((f) => f.id !== product.id) : [...favorites, product];
    storage.setFavorites(next);      // local cache — keeps the hearts instant
    this.syncToAccount(next);        // push to the cloud in the background (logged-in only)
    if (window.header) header.refreshBadges();
    return next;
  },
  // Saves the given list onto the logged-in user's account in the cloud.
  // Does nothing for a guest (nobody logged in)
  async syncToAccount(favorites) {
    const email = storage.getSessionEmail();
    if (!email) return;
    try {
      const users = await api.getUsers();
      const idx = users.findIndex((u) => u.email === email);
      if (idx >= 0) {
        users[idx] = { ...users[idx], favorites };
        await api.saveUsers(users);
      }
    } catch (err) {
      console.warn('favorites: cloud sync failed', err);
    }
  },
  // Called right after login: brings the account's saved favorites into the
  // local cache, and merges anything the guest marked before logging in
  async loadFromAccount() {
    const email = storage.getSessionEmail();
    if (!email) return;
    try {
      const users = await api.getUsers();
      const user = users.find((u) => u.email === email);
      const accountFavs = (user && user.favorites) || [];
      const guestFavs = storage.getFavorites();
      const merged = [...accountFavs];
      guestFavs.forEach((g) => { if (!merged.find((f) => f.id === g.id)) merged.push(g); });
      storage.setFavorites(merged);
      // if the guest added new items, write the merged list back to the cloud
      if (merged.length !== accountFavs.length) await this.syncToAccount(merged);
      if (window.header) header.refreshBadges();
    } catch (err) {
      console.warn('favorites: cloud load failed', err);
    }
  },
};
// ---- drawing the favorites page (runs only if the page has the #favorites-page-root element) ----
(function initFavoritesPage() {
  const root = document.getElementById('favorites-page-root');
  if (!root) return;
  // Draws the page: if there are no favorites — a message with a "Keep shopping" link,
  // and if there are — a normal grid of product cards
  function render() {
    const favorites = favoritesApi.getAll();
    if (!favorites.length) {
      root.innerHTML = ui.renderStateMessage('אין עדיין מוצרים במועדפים.', 'המשך לקנות', 'go-home');
      return;
    }
    root.innerHTML = ui.renderProductGrid(favorites, favoritesApi.getIds());
  }
  // Clicks on the favorites page: card -> product page, heart -> remove from the list
  // (and the page is drawn again), "Add to cart" -> adds to the cart
  root.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const id = Number(el.dataset.productId);
    const action = el.dataset.action;
    if (action === 'go-home') { router.goTo(router.home()); return; }
    if (action === 'open-product') { router.goTo(router.productUrl(id)); return; }
    if (action === 'toggle-favorite') {
      const product = favoritesApi.getAll().find((f) => f.id === id);
      if (product) favoritesApi.toggle(product);
      render();
      return;
    }
    if (action === 'add-to-cart') {
      const product = favoritesApi.getAll().find((f) => f.id === id);
      if (product) {
        await cartApi.addToCart(product, 1);
        ui.flashAdded(el);
      }
    }
  });
  // First draw when entering the page
  render();
})();
