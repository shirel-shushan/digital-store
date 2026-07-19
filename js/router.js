/**
 * router.js — in charge of moving between the pages of the site.
 * The site is built from separate HTML pages, so "routing" here means:
 * building the right address for each page, and going to it.
 * All the code on the site uses these functions instead of writing
 * addresses by hand, so if a page name changes — we fix it only here.
 */

const router = {
  // Address of the home page
  home() { return 'index.html'; },
  // Address of the products list page
  products() { return 'products.html'; },

  // Address of a single product page, for example product.html?id=5
  productUrl(id) {
    return `product.html?id=${encodeURIComponent(id)}`;
  },
  // Address of the products page filtered by one category
  categoryUrl(slug) {
    return `products.html?category=${encodeURIComponent(slug)}`;
  },
  // Address of the search results page
  searchUrl(query) {
    return `products.html?q=${encodeURIComponent(query)}`;
  },
  // Addresses of the other pages: cart, favorites, login, signup and profile
  cartUrl() { return 'cart.html'; },
  favoritesUrl() { return 'favorites.html'; },
  loginUrl() { return 'login.html'; },
  signupUrl() { return 'login.html?mode=signup'; },
  profileUrl() { return 'profile.html'; },

  // Actually moves to another page (changes the address in the browser)
  goTo(url) {
    window.location.href = url;
  },

  /** Reads from the current address what to filter: ?category= (category) or ?q= (search).
      Used by the products page to know what to show. */
  currentListParams() {
    return {
      category: utils.getQueryParam('category'),
      query: utils.getQueryParam('q'),
    };
  },
};
