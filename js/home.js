/**
 * home.js — runs only on the home page (index.html) and builds its three dynamic parts:
 * 1) The rotating banner (carousel) — a big colorful card with "Top product
 *    of the week", that changes by itself every 4.5 seconds, with arrows and dots.
 * 2) The "Top categories" row — circles with an image and a category name.
 * 3) Product sections by category — a title + 4 product cards + "See all".
 */

(function initHomePage() {
  const promoRoot = document.getElementById('promo-root');
  const topCategoriesRoot = document.getElementById('top-categories-root');
  const homeSectionsRoot = document.getElementById('home-sections-root');
  if (!promoRoot && !topCategoriesRoot && !homeSectionsRoot) return;

  let promos = [];
  let promoIndex = 0;
  let promoTimer = null;

  // Fixed settings for the banner: a background color for every slide, a slogan, and a list of 4 features with icons
  const PROMO_SOLID = ['#ede4d8', '#e2ebe3', '#f2e2e4', '#f3ead2', '#dde6ec'];
  const PROMO_TAGLINE = ['טכנולוגיה. עיצוב. עוצמה.', 'עוצמה שמתאימה לכל מסך', 'הניחוח שמדבר בשמך', 'עיצוב שנשאר לתמיד', 'ראייה חדה, סטייל ברור'];
  const PROMO_FEATURES = [
    [{ icon: 'bolt', label: 'ביצועים מהירים' }, { icon: 'shield', label: 'עמיד וחזק' }, { icon: 'star', label: 'מצלמה מקצועית' }, { icon: 'drop', label: 'עיצוב פרימיום' }],
    [{ icon: 'bolt', label: 'מעבד חזק' }, { icon: 'shield', label: 'בנייה איכותית' }, { icon: 'star', label: 'מסך חד ובהיר' }, { icon: 'drop', label: 'עיצוב דק ונייד' }],
    [{ icon: 'bolt', label: 'החזקה ארוכה' }, { icon: 'shield', label: 'איכות פרימיום' }, { icon: 'star', label: 'ניחוח ייחודי' }, { icon: 'drop', label: 'בקבוק מהודר' }],
    [{ icon: 'bolt', label: 'עמיד במים' }, { icon: 'shield', label: 'זכוכית ספיר' }, { icon: 'star', label: 'עיצוב קלאסי' }, { icon: 'drop', label: 'רצועה איכותית' }],
    [{ icon: 'bolt', label: 'הגנת UV מלאה' }, { icon: 'shield', label: 'מסגרת עמידה' }, { icon: 'star', label: 'עדשות מקוטבות' }, { icon: 'drop', label: 'עיצוב אופנתי' }],
  ];
  // The SVG drawings of the feature icons (bolt, shield, star, drop)
  const FEATURE_ICON_PATHS = {
    bolt: '<path d="M13 2 4 14h6l-1 8 9-12h-6z"></path>',
    shield: '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"></path>',
    star: '<path d="M12 3l2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.2-5.4 3.2 1.3-6-4.6-4.1 6.1-.6z"></path>',
    drop: '<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"></path>',
  };

  // Loads the banners: gets one product from every chosen category, builds
  // slides from them, draws the first one and starts a timer that changes
  // the slide every 4.5 seconds
  async function loadPromos() {
    const results = await Promise.all(
      utils.PROMO_SLUGS.map((slug) => api.getProductsByCategory(slug, 1))
    );
    promos = results
      .map((products, i) => {
        const p = products[0];
        if (!p) return null;
        return {
          id: p.id, title: p.title, brand: (p.brand || utils.categoryName(utils.PROMO_SLUGS[i])).toUpperCase(),
          tagline: PROMO_TAGLINE[i], thumbnail: p.thumbnail, price: p.price,
          discountPercentage: p.discountPercentage || 0, solid: PROMO_SOLID[i], features: PROMO_FEATURES[i],
        };
      })
      .filter(Boolean);
    renderPromo();
    if (promoTimer) clearInterval(promoTimer);
    if (promos.length > 1) {
      promoTimer = setInterval(() => { promoIndex = (promoIndex + 1) % promos.length; renderPromo(); }, 4500);
    }
  }

  // Draws one banner slide: colored background, "Top product of the week" tag,
  // brand name, product name, slogan, 4 features, price (with the old price
  // crossed out if there is a discount), a "Buy now" button, a heart,
  // a big product image, arrows and dots
  function renderPromo() {
    if (!promoRoot || !promos.length) return;
    const b = promos[promoIndex];
    const hasDiscount = b.discountPercentage > 0;
    const original = hasDiscount ? b.price / (1 - b.discountPercentage / 100) : null;
    const isFav = favoritesApi.isFavorite(b.id);

    const featuresHtml = b.features.map((f) => `
      <div class="promo-feature">
        <div class="promo-feature-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#3a332b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${FEATURE_ICON_PATHS[f.icon]}</svg></div>
        <div class="promo-feature-label">${f.label}</div>
      </div>`).join('');

const dotsHtml = promos.map((_, i) => `<button class="promo-dot ${i === promoIndex ? 'active' : ''}" data-action="promo-dot" data-index="${i}"></button>`).join('');
    promoRoot.innerHTML = `
      <div class="promo">
        <div class="promo-slide" style="background:${b.solid};">
          <div class="promo-copy">
            <div class="promo-tag"><svg viewBox="0 0 24 24" width="13" height="13" fill="#c1440e" stroke="#c1440e"><path d="M12 2c1 3-2 4-2 7a2 2 0 0 0 4 0c1 1 2 2.5 2 4.5A6 6 0 0 1 4 13.5C4 9 7 7 8 4c.5 1.5 0 2.5 1 3 0-2 1-3.5 3-5z"></path></svg> המוצר המוביל השבוע</div>
            <div class="promo-brand">${b.brand}</div>
            <div class="promo-title">${utils.escapeHtml(b.title)}</div>
            <div class="promo-tagline">${b.tagline}</div>
            <div class="promo-features">${featuresHtml}</div>
            <div class="promo-price-row">
              <span class="promo-price">${utils.formatPrice(b.price)}</span>
              ${hasDiscount ? `<span class="promo-price-original">${utils.formatPrice(original)}</span>` : ''}
            </div>
            <div class="promo-cta-row">
              <button class="promo-cta" data-action="open-product" data-product-id="${b.id}">‹ לרכישה עכשיו</button>
              <button class="promo-fav-btn" data-action="toggle-favorite" data-product-id="${b.id}">${ui.icons.heart(isFav)}</button>
            </div>
          </div>
          <div class="promo-visual">
            <div class="promo-visual-bg"></div>
            <img src="${b.thumbnail}" alt="${utils.escapeHtml(b.title)}" data-action="open-product" data-product-id="${b.id}">
          </div>
        </div>
        <button class="promo-nav prev" data-action="promo-prev">‹</button>
        <button class="promo-nav next" data-action="promo-next">›</button>
        <div class="promo-dots">${dotsHtml}</div>
      </div>`;
  }

  // Builds the categories circles row: for every category it gets one product
  // from the server only for its image, and draws a circle with the image and the name
  async function loadTopCategories() {
    if (!topCategoriesRoot) return;
    const categories = await api.getCategories();
    const available = categories.map((c) => c.slug);
    const slugs = utils.ICON_ROW_SLUGS.filter((s) => available.includes(s));
    const chosen = slugs.length ? slugs : available.slice(0, 7);
    const entries = await Promise.all(chosen.map(async (slug) => {
      const products = await api.getProductsByCategory(slug, 1);
      return { slug, thumbnail: products[0] ? products[0].thumbnail : '' };
    }));
    topCategoriesRoot.innerHTML = entries.filter((e) => e.thumbnail).map((e) => `
<button class="top-category" data-action="open-category" data-slug="${e.slug}">
        <div class="top-category-thumb"><img src="${e.thumbnail}" alt="${utils.categoryName(e.slug)}"></div>
        <div class="top-category-label">${utils.categoryName(e.slug)}</div>
      </button>`).join('');
  }

  // Builds the product sections on the home page: for every chosen category —
  // a title, a "See all ←" button and a grid of 4 product cards
  async function loadHomeSections() {
    if (!homeSectionsRoot) return;
    const categories = await api.getCategories();
    const available = categories.map((c) => c.slug);
    const featured = utils.FEATURED_CATEGORY_SLUGS.filter((s) => available.includes(s));
    const slugs = featured.length ? featured : available.slice(0, 4);
    const sections = await Promise.all(slugs.map(async (slug) => ({
      slug, title: utils.categoryName(slug), products: await api.getProductsByCategory(slug, 4),
    })));
    const favIds = favoritesApi.getIds();
    homeSectionsRoot.innerHTML = sections.map((sec) => `
      <div class="section">
        <div class="section-head">
          <div class="section-title">${sec.title}</div>
          <button class="section-link" data-slug="${sec.slug}" data-action="see-all">לכל המוצרים ←</button>
        </div>
        ${ui.renderProductGrid(sec.products, favIds)}
      </div>`).join('');
  }

  // One click listener for the whole home page: go to a product / category,
  // the banner arrows and dots, the heart (favorites) and the "Add to cart" buttons
  document.getElementById('page-content').addEventListener('click', async (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    const productId = Number(el.dataset.productId);

    if (action === 'go-home') { router.goTo(router.home()); return; }
    if (action === 'open-product') { router.goTo(router.productUrl(productId)); return; }
    if (action === 'see-all') { router.goTo(router.categoryUrl(el.dataset.slug)); return; }
if (action === 'open-category') { router.goTo(router.categoryUrl(el.dataset.slug)); return; }
    if (action === 'promo-next') { promoIndex = (promoIndex + 1) % promos.length; renderPromo(); return; }
    if (action === 'promo-prev') { promoIndex = (promoIndex - 1 + promos.length) % promos.length; renderPromo(); return; }
if (action === 'promo-dot') { promoIndex = Number(el.dataset.index); renderPromo(); return; }
    if (action === 'toggle-favorite') {
      const products = await api.getProductById(productId);
      if (products) favoritesApi.toggle(products);
      renderPromo();
      loadHomeSections();
      return;
    }
    if (action === 'add-to-cart') {
      const product = await api.getProductById(productId);
      if (product) {
        await cartApi.addToCart(product, 1);
        ui.flashAdded(el);
      }
    }
  });

  // First load of the three parts when entering the home page
  loadPromos();
  loadTopCategories();
  loadHomeSections();
})();
