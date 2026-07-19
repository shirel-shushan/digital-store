/**
 * search.js — the site search.
 * Connects the search box at the top of the page (the header) so that
 * pressing Enter moves to the results page, and actually runs
 * the search request against the server.
 */

const search = {
  /** Connects the search box in the header: when the user types and presses Enter —
      we go to the products page with the search word in the address. */
  wireSearchBox(formEl, inputEl) {
    if (!formEl || !inputEl) return;
    formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      const q = inputEl.value.trim();
      if (q) router.goTo(router.searchUrl(q));
    });
  },

  /** Sends the search to the server and returns the list of products found. */
  async run(query) {
    if (!query || !query.trim()) return [];
    return api.searchProducts(query.trim());
  },
};
