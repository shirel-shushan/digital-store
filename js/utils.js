/**
 * utils.js — small helper functions used all over the site.
 * They do not touch the screen, the internet or the memory — they only
 * get a value and return a value: price formatting, translating category
 * names to Hebrew, checking the payment form, and more.
 */

// Translation table: category name in English (as it comes from the server) -> Hebrew name shown on the site
const CATEGORY_NAMES_HE = {
  smartphones: 'סמארטפונים', laptops: 'מחשבים ניידים', fragrances: 'בשמים', 'skin-care': 'טיפוח עור',
  groceries: 'מכולת', 'home-decoration': 'עיצוב הבית', furniture: 'רהיטים', tops: 'חולצות',
  'womens-dresses': 'שמלות נשים', 'womens-shoes': 'נעלי נשים', 'mens-shirts': 'חולצות גברים',
  'mens-shoes': 'נעלי גברים', 'mens-watches': 'שעונים לגברים', 'womens-watches': 'שעונים לנשים',
  'womens-bags': 'תיקי נשים', 'womens-jewellery': 'תכשיטי נשים', sunglasses: 'משקפי שמש',
  automotive: 'רכב', motorcycle: 'אופנועים', lighting: 'תאורה', 'mobile-accessories': 'אביזרים לנייד',
  tablets: 'טאבלטים', vehicle: 'רכב', 'sports-accessories': 'ציוד ספורט', 'kitchen-accessories': 'כלי מטבח',
};

// Which categories appear on the homepage: in the circles row at the top, in the product sections and in the rotating banner
const FEATURED_CATEGORY_SLUGS = ['smartphones', 'laptops', 'fragrances', 'skin-care'];
const ICON_ROW_SLUGS = ['smartphones', 'laptops', 'tablets', 'fragrances', 'skin-care', 'womens-watches', 'sunglasses', 'womens-bags'];
const PROMO_SLUGS = ['smartphones', 'laptops', 'fragrances', 'mens-watches', 'sunglasses'];

const utils = {
  /** Returns a Hebrew name for a category. If there is no translation in the table — makes the English name look nice. */
  categoryName(slug) {
    if (CATEGORY_NAMES_HE[slug]) return CATEGORY_NAMES_HE[slug];
    return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  },

  FEATURED_CATEGORY_SLUGS,
  ICON_ROW_SLUGS,
  PROMO_SLUGS,

  // Gets a number and returns a nice price with a shekel sign, for example: 99.9 -> "₪99.90"
  formatPrice(value) {
    return '₪' + Number(value).toFixed(2);
  },

  // Gets a computer date and returns a date in Israeli format, for example 19.7.2026
  formatDate(isoString) {
    return new Date(isoString).toLocaleDateString('he-IL');
  },

  // Turns a number rating into stars, for example 4 -> "★★★★☆" (shown in reviews on the product page)
  starsLabel(rating) {
    const full = Math.round(rating || 0);
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  },

  /** Reads a value from the page address. For example on product.html?id=5 it returns "5". */
  getQueryParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  },

  /** Checks the payment form: address, card number, expiry date and CVV.
      Returns an errors object in Hebrew — if it is empty, the form is OK. */
  validateCheckout({ address, cardNumber, cardExp, cvv }) {
    const errors = {};
    if (!address || !address.trim()) errors.address = 'נא למלא כתובת';
    if (!/^[0-9]{13,19}$/.test((cardNumber || '').replace(/\s/g, ''))) errors.cardNumber = 'מספר כרטיס לא תקין';
    if (!/^(0[1-9]|1[0-2])\/[0-9]{2}$/.test((cardExp || '').trim())) errors.cardExp = 'פורמט תוקף: MM/YY';
    if (!/^[0-9]{3,4}$/.test((cvv || '').trim())) errors.cvv = 'CVV לא תקין';
    return errors;
  },

  // Turns dangerous characters in text (like < and >) into safe ones,
  // so text coming from the server cannot break the page or run bad code (basic safety)
  escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  },

  // "Calms down" a function: if it is called many times fast, it will run
  // only once after a short pause (useful for example while typing in search)
  debounce(fn, delay) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },
};
