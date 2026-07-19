/**
 * header.js — builds the top bar (the header) that appears on every page.
 * Visually it is the sticky white bar at the top: logo on the right,
 * menu (Home / Categories / Contact), a search box in the middle, and on
 * the left three icons — cart, favorites and user — with a small orange
 * circle that shows how many items there are.
 * Every HTML page has an empty <div id="site-header">, and this file
 * fills it, so the header is written only once and not copied into every page.
 */

const header = {
  // The main function: draws the footer and the header into the page,
  // then connects the search, the categories menu, the buttons and the counters
  async init() {
    const footerMount = document.getElementById('site-footer');
    if (footerMount) footerMount.innerHTML = ui.renderFooter();

    const mount = document.getElementById('site-header');
    if (!mount) return;

    const currentPage = document.body.dataset.page || '';
    mount.innerHTML = `
      <header class="site-header">
        <div class="container">
          <button class="brand" data-action="go-home" aria-label="דף הבית">${ui.icons.logo()}</button>

          <nav class="main-nav">
            <button class="nav-tab ${currentPage === 'home' ? 'active' : ''}" data-action="go-home">דף הבית</button>
            <div class="category-dropdown">
              <button class="category-trigger" data-action="toggle-categories">
                קטגוריות ${ui.icons.chevronDown()}
              </button>
              <div class="category-menu" id="category-menu" hidden></div>
            </div>
            <a href="index.html#contact" class="nav-link">צור קשר</a>
          </nav>

          <form class="search-form" id="search-form">
            <div class="search-box">
              ${ui.icons.search()}
              <input class="search-input" id="search-input" placeholder="חיפוש מוצרים..." autocomplete="off">
            </div>
          </form>

          <div class="header-actions">
            <button class="icon-btn" id="cart-icon-btn" data-action="go-cart" aria-label="סל קניות">
              ${ui.icons.cart()}
              <span class="icon-badge" id="cart-badge" hidden></span>
            </button>
            <button class="icon-btn" data-action="go-favorites" aria-label="מועדפים">
              <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="#1c1a17" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7.5-4.6-10-9.3C.5 8 2 4 6 4c2 0 3.6 1.1 6 3.6C14.4 5.1 16 4 18 4c4 0 5.5 4 4 7.7C19.5 16.4 12 21 12 21z"></path></svg>
              <span class="icon-badge" id="favorites-badge" hidden></span>
            </button>
            <button class="icon-btn" id="user-icon-btn" data-action="go-user" aria-label="חשבון" style="gap:6px;">
              ${ui.icons.user()}
              <span id="user-name-label" style="font-size:13px;font-weight:600;color:var(--color-text-muted);"></span>
            </button>
          </div>
        </div>
      </header>`;

    search.wireSearchBox(document.getElementById('search-form'), document.getElementById('search-input'));
    this.wireCategoryMenu();
    this.wireStaticActions();
    await this.refreshBadges();
    await this.refreshUserLabel();
  },

  // Connects the clicks in the header: logo / "Home" -> home page, cart -> cart page,
  // heart -> favorites, user icon -> profile (if logged in) or login (if not)
  wireStaticActions() {
    document.getElementById('site-header').addEventListener('click', (e) => {
      const el = e.target.closest('[data-action]');
      if (!el) return;
      switch (el.dataset.action) {
        case 'go-home': router.goTo(router.home()); break;
        case 'go-cart': router.goTo(router.cartUrl()); break;
        case 'go-favorites': router.goTo(router.favoritesUrl()); break;
        case 'go-user': router.goTo(storage.getSessionEmail() ? router.profileUrl() : router.loginUrl()); break;
      }
    });
  },

  // The categories dropdown: clicking "Categories" opens a white list
  // under the button. The list is loaded from the server only on the first
  // open (saves requests), clicking a category goes to its products page,
  // and clicking anywhere else closes the menu
  async wireCategoryMenu() {
    const trigger = document.querySelector('[data-action="toggle-categories"]');
    const menu = document.getElementById('category-menu');
    trigger.addEventListener('click', async (e) => {
      e.stopPropagation();
      const willOpen = menu.hidden;
      menu.hidden = !willOpen;
      if (willOpen && !menu.dataset.loaded) {
        const categories = await api.getCategories();
        menu.innerHTML = categories
          .map((c) => `<button class="category-menu-item" data-slug="${c.slug}">${c.name}</button>`)
          .join('');
        menu.dataset.loaded = '1';
        menu.querySelectorAll('.category-menu-item').forEach((btn) => {
          btn.addEventListener('click', () => router.goTo(router.categoryUrl(btn.dataset.slug)));
        });
      }
    });
    document.addEventListener('click', () => { menu.hidden = true; });
  },

  /** Updates the small orange circles on the cart and favorites icons —
      counts again how many items there are and hides the circle when it is 0.
      Called after every add / remove / login / logout. */
  async refreshBadges() {
    const cartBadge = document.getElementById('cart-badge');
    const favBadge = document.getElementById('favorites-badge');
    if (!cartBadge || !favBadge) return;

    const cart = await cartApi.getActiveCart();
    const cartCount = cartApi.count(cart);
    cartBadge.hidden = cartCount === 0;
    cartBadge.textContent = cartCount;

    const favCount = favoritesApi.getAll().length;
    favBadge.hidden = favCount === 0;
    favBadge.textContent = favCount;
  },

  // Shows "שלום, <name>" next to the user icon when someone is logged in,
  // and clears it when nobody is logged in
  async refreshUserLabel() {
    const label = document.getElementById('user-name-label');
    if (!label) return;
    const email = storage.getSessionEmail();
    if (!email) { label.textContent = ''; return; }
    const users = await api.getUsers();
    const user = users.find((u) => u.email === email);
    label.textContent = user ? `שלום, ${user.name}` : '';
  },
};

// Technical note: a normal const is NOT saved on window automatically,
// but cart.js and favorites.js check if window.header exists before they
// update the counters — so we must expose it here by hand,
// otherwise the counters on the icons will never update.
window.header = header;

// When the page finishes loading — build the header
document.addEventListener('DOMContentLoaded', () => header.init());