/**
 * api.js — the only file that talks to the internet (outside servers).
 * All other files never call fetch() directly — only through this file.
 *
 * Two servers are used:
 *  1. DummyJSON — gives us all the products, categories and search results.
 *  2. jsonbin.io — saves the list of registered users (name, email, password,
 *     address, cart, orders) so the account is kept even on another browser.
 *
 * To make jsonbin work, fill in the two values below (bin id + key).
 * As long as they are empty — the site saves users in the browser memory
 * (localStorage, see storage.js), and login / signup / cart / orders
 * still work normally.
 */

// Before final submission: paste your own jsonbin details here.
const JSONBIN_BIN_ID = '6a38d2f3da38895dfee9badd';
const JSONBIN_API_KEY = '$2a$10$NfmdxkGKXv0Lor0Fg0MkTOjfCE2VdNLgyizHBMei8BdvDCiEQqIbe';

const DUMMYJSON_BASE = 'https://dummyjson.com';
const JSONBIN_BASE = 'https://api.jsonbin.io/v3/b';

// Small check: did we fill in the jsonbin details? (if not — use localStorage)
const jsonbinConfigured = () => Boolean(JSONBIN_BIN_ID && JSONBIN_API_KEY);

const api = {
  /** Gets the full list of categories from the server. For each one it returns an id (slug) and a Hebrew name. */
  async getCategories() {
    const res = await fetch(`${DUMMYJSON_BASE}/products/category-list`);
    const data = await res.json();
    return data.map((c) => {
      const slug = typeof c === 'string' ? c : c.slug;
      return { slug, name: utils.categoryName(slug) };
    });
  },

  /** Gets the products of one category. Can limit how many products to get (limit). */
  async getProductsByCategory(slug, limit) {
    const url = limit
      ? `${DUMMYJSON_BASE}/products/category/${slug}?limit=${limit}`
      : `${DUMMYJSON_BASE}/products/category/${slug}`;
    const res = await fetch(url);
    const data = await res.json();
    return data.products || [];
  },

  /** Free text product search — this runs when you type in the search box at the top. */
  async searchProducts(query) {
    const res = await fetch(`${DUMMYJSON_BASE}/products/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    return data.products || [];
  },

  /** Gets one product by its id — with images, reviews and sizes (for the product page). */
  async getProductById(id) {
    const res = await fetch(`${DUMMYJSON_BASE}/products/${id}`);
    if (!res.ok) return null;
    return res.json();
  },
/** Returns the list of all registered users. Tries jsonbin first, if not — reads from the browser. */
  async getUsers() {
    if (jsonbinConfigured()) {
      try {
        const res = await fetch(`${JSONBIN_BASE}/${JSONBIN_BIN_ID}/latest`, {
          headers: { 'X-Master-Key': JSONBIN_API_KEY },
        });
        if (!res.ok) {
          console.warn('jsonbin read failed', res.status);
          return storage.getLocalUsers();
        }
        const data = await res.json();
        const users = (data.record && data.record.users) || [];
        if (!users.find((u) => u.email === storage.DEMO_USER.email)) {
          const withDemo = [...users, storage.DEMO_USER];
          await this.saveUsers(withDemo);
          return withDemo;
        }
        return users;
      } catch (err) {
        console.warn('jsonbin read failed, using local storage instead', err);
      }
    }
    return storage.getLocalUsers();
  },

  /** Saves the updated users list. Tries jsonbin first, if not — saves in the browser. */
  async saveUsers(users) {
    if (jsonbinConfigured()) {
      try {
        const res = await fetch(`${JSONBIN_BASE}/${JSONBIN_BIN_ID}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'X-Master-Key': JSONBIN_API_KEY },
          body: JSON.stringify({ users }),
        });
        if (!res.ok) {
          console.warn('jsonbin write failed', res.status);
          storage.setLocalUsers(users);
        }
        return;
      } catch (err) {
        console.warn('jsonbin write failed, using local storage instead', err);
      }
    }
    storage.setLocalUsers(users);
  },
};
