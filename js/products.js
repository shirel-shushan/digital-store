/**
 * products.js — runs only on products.html (the products list page).
 * Visually: a big title at the top and under it a grid of product cards.
 * The page shows one of two things, based on the address:
 *  - ?category=... -> all the products of one category
 *  - ?q=...        -> search results
 */

(function initProductsPage() {
  const titleEl = document.getElementById('products-title');
  const gridRoot = document.getElementById('products-grid-root');
  if (!gridRoot) return;

  // Loads and shows the products: sets the title, shows "Loading...",
  // gets the products from the server and draws them as a grid of cards
  async function load() {
    const { category, query } = router.currentListParams();
    gridRoot.innerHTML = ui.renderStateMessage('טוען מוצרים...');

    let products = [];
    if (query) {
      titleEl.textContent = `תוצאות חיפוש עבור "${query}"`;
      products = await search.run(query);
    } else if (category) {
      titleEl.textContent = utils.categoryName(category);
      products = await api.getProductsByCategory(category);
    } else {
      titleEl.textContent = 'כל המוצרים';
      router.goTo(router.home());
      return;
    }

    if (!products.length) {
      gridRoot.innerHTML = ui.renderStateMessage('לא נמצאו מוצרים.');
      return;
    }
    gridRoot.innerHTML = ui.renderProductGrid(products, favoritesApi.getIds(), true);
  }

  // One click listener for the whole grid (instead of a listener on every card):
  // click on a card -> go to the product page, heart -> add / remove favorite,
  // "Add to cart" button -> adds to the cart and shows a small check on the button
  gridRoot.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const id = Number(el.dataset.productId);

    if (el.dataset.action === 'open-product') { router.goTo(router.productUrl(id)); return; }
    if (el.dataset.action === 'toggle-favorite') {
      const product = await api.getProductById(id);
      if (product) favoritesApi.toggle(product);
      load();
      return;
    }
    if (el.dataset.action === 'add-to-cart') {
      const product = await api.getProductById(id);
      if (product) {
        await cartApi.addToCart(product, 1);
        ui.flashAdded(el);
      }
    }
  });

  // First run when entering the page
  load();
})();
