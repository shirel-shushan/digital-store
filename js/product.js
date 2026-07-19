/**
 * product.js — runs only on product.html (a single product page).
 * Visually, the page is split in two: on the right a big product image
 * with a row of small images under it, and on the left — brand, product
 * name with a heart, price, description, quantity picker (+/−),
 * an "Add to cart" button, stock and more details
 * (category, weight, sizes, warranty, shipping, returns).
 * At the bottom: a list of customer reviews with stars.
 * The product id is read from the address (?id=...).
 */

(function initProductPage() {
  const root = document.getElementById('product-page-root');
  if (!root) return;

  // The page state: the product id from the address, the product itself (after
  // loading), which image is chosen in the gallery, and which quantity is chosen
  const id = Number(utils.getQueryParam('id'));
  let product = null;
  let selectedImage = 0;
  let qty = 1;

  // Draws the whole product page from the data: gallery, details, quantity,
  // add to cart button, info table and reviews. If the product is not
  // loaded yet — shows "Loading product..."
  function render() {
    if (!product) { root.innerHTML = ui.renderStateMessage('טוען מוצר...'); return; }

    const images = (product.images && product.images.length ? product.images : [product.thumbnail]).slice(0, 6);
    const thumbsHtml = images.map((src, i) => `
<button class="product-thumb ${i === selectedImage ? 'active' : ''}" data-action="select-image" data-index="${i}">
        <img src="${src}" alt="">
      </button>`).join('');

    const reviews = product.reviews || [];
    const reviewsHtml = reviews.length
      ? `<div class="reviews-list">${reviews.map((r) => `
          <div class="review-card">
            <div class="review-head"><span class="review-name">${utils.escapeHtml(r.reviewerName)}</span><span class="review-stars">${utils.starsLabel(r.rating)}</span></div>
            <div class="review-comment">${utils.escapeHtml(r.comment)}</div>
          </div>`).join('')}</div>`
      : '<div class="state-message" style="padding:0;text-align:right;">אין עדיין חוות דעת למוצר זה.</div>';

    const dims = product.dimensions ? `${product.dimensions.width}×${product.dimensions.height}×${product.dimensions.depth} ס"מ` : '-';
    const isFav = favoritesApi.isFavorite(product.id);

    root.innerHTML = `
      <div class="product-detail">
        <div>
          <div class="product-gallery-main"><img src="${images[selectedImage]}" alt="${utils.escapeHtml(product.title)}"></div>
          <div class="product-thumbs">${thumbsHtml}</div>
        </div>
        <div>
          <div class="product-brand">${utils.escapeHtml(product.brand || '')}</div>
          <div class="product-title">${utils.escapeHtml(product.title)}
            <button class="fav-toggle" data-action="toggle-favorite" style="position:static;display:inline-flex;vertical-align:middle;margin-right:8px;">${ui.icons.heart(isFav)}</button>
          </div>
          <div class="product-price">${utils.formatPrice(product.price)}</div>
          <div class="product-description">${utils.escapeHtml(product.description)}</div>
          <div class="product-buy-row">
            <div class="qty-stepper">
              <button data-action="dec-qty">−</button>
              <div class="qty-value">${qty}</div>
              <button data-action="inc-qty">+</button>
            </div>
            <button class="btn btn-dark" data-action="add-to-cart">הוספה לסל</button>
          </div>
          <div class="product-stock">מלאי זמין: ${product.stock} יחידות</div>
          <div class="product-meta">
            <div>קטגוריה: ${utils.categoryName(product.category)}</div>
            <div>משקל: ${product.weight || '-'} גרם</div>
            <div>מידות: ${dims}</div>
            <div>אחריות: ${product.warrantyInformation || '-'}</div>
            <div>משלוח: ${product.shippingInformation || '-'}</div>
            <div>החזרות: ${product.returnPolicy || '-'}</div>
          </div>
        </div>
      </div>
      <div>
        <div class="reviews-title">חוות דעת קונים</div>
        ${reviewsHtml}
      </div>`;
  }

  // Clicks on the page: + / − change the quantity, "Add to cart" adds the
  // chosen quantity, the heart adds / removes a favorite, and clicking a
  // small image switches the big one
  root.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    if (el.dataset.action === 'dec-qty') { qty = Math.max(1, qty - 1); render(); return; }
    if (el.dataset.action === 'inc-qty') { qty += 1; render(); return; }
    if (el.dataset.action === 'add-to-cart') { await cartApi.addToCart(product, qty); ui.flashAdded(el); return; }
    if (el.dataset.action === 'toggle-favorite') { favoritesApi.toggle(product); render(); return; }
if (el.dataset.action === 'select-image') { selectedImage = Number(el.dataset.index); render(); }  });

  // Loading the product from the server when entering the page. If there is
  // no id in the address or the product is not found — shows "Product not found."
  (async () => {
    if (!id) { root.innerHTML = ui.renderStateMessage('מוצר לא נמצא.'); return; }
    product = await api.getProductById(id);
    if (!product) { root.innerHTML = ui.renderStateMessage('מוצר לא נמצא.'); return; }
    render();
  })();
})();
