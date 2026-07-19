/**
 * favorites.js — everything about the favorites (the hearts).
 * Two parts: 1) favoritesApi — functions to manage the list, used by every
 * page with a product card when the heart is clicked. 2) Code that draws
 * the favorites page itself (favorites.html) — a grid of cards with the
 * marked products.
 * The list is saved in the browser memory, even without logging in.
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
  // Then saves and updates the counter on the header icon
  toggle(product) {
    const favorites = this.getAll();
    const exists = favorites.find((f) => f.id === product.id);
    const next = exists ? favorites.filter((f) => f.id !== product.id) : [...favorites, product];
    storage.setFavorites(next);
    if (window.header) header.refreshBadges();
    return next;
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
