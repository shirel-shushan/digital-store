/**
 * ui.js — shared display parts used by more than one page.
 * Here you find: all the icons (SVG), the product card, the products grid,
 * the footer, state messages ("Loading..." / "Empty") and a small toast message.
 * This file only builds HTML from data it gets — it never talks to the
 * server or to the memory.
 */

// All the site icons are drawn here as SVG code (instead of image files)
const icons = {
  // Heart icon — for favorites. If filled=true the heart is painted orange (marked product)
  heart(filled) {
    return `<svg viewBox="0 0 24 24" width="18" height="18" fill="${filled ? '#c1440e' : 'none'}" stroke="${filled ? '#c1440e' : '#a49d92'}" stroke-width="1.8"><path d="M12 21s-7.5-4.6-10-9.3C.5 8 2 4 6 4c2 0 3.6 1.1 6 3.6C14.4 5.1 16 4 18 4c4 0 5.5 4 4 7.7C19.5 16.4 12 21 12 21z"></path></svg>`;
  },
  // Shopping cart icon — shown in the header and on the cart page
  cart() {
    return '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#1c1a17" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 8H6"></path><circle cx="9.5" cy="20" r="1.4" fill="#1c1a17" stroke="none"></circle><circle cx="17" cy="20" r="1.4" fill="#1c1a17" stroke="none"></circle></svg>';
  },
  // User icon — the account button in the header
  user() {
    return '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#1c1a17" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="3.6"></circle><path d="M4.5 20c1.4-3.6 4.4-5.6 7.5-5.6s6.1 2 7.5 5.6"></path></svg>';
  },
  // Magnifying glass icon — inside the search box
  search() {
    return '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#8b8579" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"></circle><path d="M21 21l-4.3-4.3"></path></svg>';
  },
  // Small down arrow — next to the "Categories" button in the menu
  chevronDown() {
    return '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="#4a453e" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"></path></svg>';
  },
  // The store logo (a cart with a bag). You can pass a color —
  // dark for the white header, light for the dark footer
  logo(strokeColor = '#1c1a17') {
    return `<svg viewBox="0 0 44 44" width="44" height="44">
      <path d="M4 13h4l2.2 3" stroke="${strokeColor}" stroke-width="2.4" fill="none" stroke-linecap="round"></path>
      <path d="M22 26c-8 0-13-3-13-3l1.6 9.5A2.5 2.5 0 0 0 13 34.4h13a2.5 2.5 0 0 0 2.4-1.9L30 23s-5 3-13 3z" fill="none" stroke="${strokeColor}" stroke-width="2.2" stroke-linejoin="round"></path>
      <circle cx="15" cy="38" r="2.1" fill="${strokeColor}"></circle>
      <circle cx="27" cy="38" r="2.1" fill="${strokeColor}"></circle>
      <path d="M12 20h20l-1.6 10a2 2 0 0 1-2 1.7H15.6a2 2 0 0 1-2-1.7z" fill="#fff" stroke="${strokeColor}" stroke-width="1.5"></path>
      <path d="M16 20v-3a6 6 0 0 1 12 0v3" fill="none" stroke="${strokeColor}" stroke-width="2.2" stroke-linecap="round"></path>
      <path d="M18.5 23.5h5l-1.4 8.5h-2.2z" fill="#f4ede2"></path>
      <circle cx="21" cy="21.5" r="1.1" fill="${strokeColor === '#1c1a17' ? '#1c1a17' : '#1c1a17'}"></circle>
      <path d="M27.5 12.5l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" fill="#e0b98f"></path>
    </svg>`;
  },
};

const ui = {
  icons,

  /** Builds one product card — the white box with an image, a heart in the corner,
      product name, rating, price (with the old price crossed out if there is a
      discount) and an "Add to cart" button.
      Used on the home, products and favorites pages. */
  renderProductCard(product, { isFavorite = false, wide = false } = {}) {
    const hasDiscount = (product.discountPercentage || 0) > 0;
    const original = hasDiscount ? product.price / (1 - product.discountPercentage / 100) : null;
    const rating = product.rating ? `${product.rating.toFixed(1)} (${(product.reviews || []).length})` : '';
    return `
      <article class="product-card" data-product-id="${product.id}" data-action="open-product">
        <div class="product-card-media">
          <img src="${product.thumbnail}" alt="${utils.escapeHtml(product.title)}" loading="lazy">
          <button class="fav-toggle" data-action="toggle-favorite" data-product-id="${product.id}" aria-label="הוספה למועדפים">
            ${icons.heart(isFavorite)}
          </button>
        </div>
        <div class="product-card-body">
          <div class="product-card-title">${utils.escapeHtml(product.title)}</div>
          <div class="product-card-subtitle">${utils.escapeHtml(product.brand || utils.categoryName(product.category || ''))}</div>
          ${rating ? `<div class="product-card-rating">★ ${rating}</div>` : ''}
          <div class="product-card-price-row">
            ${hasDiscount ? `<span class="price-original">${utils.formatPrice(original)}</span>` : ''}
            <span class="price-current">${utils.formatPrice(product.price)}</span>
          </div>
          <button class="add-to-cart-btn" data-action="add-to-cart" data-product-id="${product.id}">
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.6L21 8H6"></path></svg>
            הוספה לסל
          </button>
        </div>
      </article>`;
  },

  // Builds a full grid of product cards (calls renderProductCard for every product)
  renderProductGrid(products, favoriteIds = [], wide = false) {
    if (!products.length) return '';
    return `<div class="product-grid${wide ? ' wide' : ''}">${products
      .map((p) => ui.renderProductCard(p, { isFavorite: favoriteIds.includes(p.id), wide }))
      .join('')}</div>`;
  },

  // A gray state message in the middle of the page, for example "Loading products..."
  // or "Your cart is empty", with an optional clickable link like "Keep shopping"
  renderStateMessage(message, linkLabel, linkAction) {
    return `<div class="state-message">${message}${
      linkLabel ? ` <span class="link" data-action="${linkAction}">${linkLabel}</span>` : ''
    }</div>`;
  },

  /** Builds the dark footer at the bottom of every page: a scrolling brands strip,
      logo, "Contact" and "Help" columns, and a copyright line. Kept here once
      so we do not copy the same code into every page. */
  renderFooter() {
    const brands = ['Apple', 'SAMSUNG', 'SONY', 'dyson', 'NIKE', 'Canon', 'ועוד...'];
    const track = [...brands, ...brands].map((b) => `<span>${b}</span>`).join('');
    return `
      <footer class="site-footer" id="contact">
        <div class="brand-strip"><div class="brand-strip-track">${track}</div></div>
        <div class="footer-cols">
          <div class="footer-col">${icons.logo('#f4ede2')}</div>
          <div class="footer-col">
            <div class="footer-col-title">צור קשר</div>
            <p>support@marketplus.co.il<br>02-5551234</p>
          </div>
          <div class="footer-col">
            <div class="footer-col-title">עזרה</div>
            <p>משלוחים והחזרות<br>שאלות נפוצות</p>
          </div>
        </div>
        <div class="footer-bottom">© 2026 מרקט פלוס — פרויקט גמר בקורס תכנות בסביבת אינטרנט</div>
      </footer>`;
  },

  /** Small effect on the "Add to cart" button: for a moment the button turns
      green with the text "Added ✓" and after about a second it goes back to normal. */
  flashAdded(buttonEl) {
    if (!buttonEl) return;
    if (!buttonEl.dataset.originalHtml) buttonEl.dataset.originalHtml = buttonEl.innerHTML;
    buttonEl.classList.add('added');
    buttonEl.innerHTML = 'נוסף לסל ✓';
    clearTimeout(buttonEl._flashTimer);
    buttonEl._flashTimer = setTimeout(() => {
      buttonEl.classList.remove('added');
      buttonEl.innerHTML = buttonEl.dataset.originalHtml;
    }, 1300);
  },

  /** Toast — a small black message that pops up at the bottom of the screen
      ("Added to cart") and disappears by itself after a second and a half. */
  showToast(message) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1c1a17;color:#fff;padding:12px 20px;border-radius:10px;font-size:14px;font-weight:600;z-index:999;box-shadow:0 12px 30px rgba(0,0,0,.25);transition:opacity .25s;';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => { toast.style.opacity = '0'; }, 1500);
  },
};