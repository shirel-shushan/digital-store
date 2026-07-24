/*
 * storage.js — the only file that touches localStorage (the browser memory).
 * Things saved here stay even after refreshing the page: who is logged in,
 * the guest cart, and the favorites list.
 * All other files read/write this memory only through the functions here.
 */
// The "key" names used to save each piece of data in the browser memory
const KEYS = {
  USERS: 'store_users',
  SESSION: 'store_session',
  GUEST_CART: 'guest_cart',
  FAVORITES: 'store_favorites',
};
// A ready-made demo user — so the checker can log in without signing up
const DEMO_USER = {
  name: 'משתמש לדוגמה',
  email: 'demo@store.co.il',
  password: 'Demo1234',
  address: 'רחוב הדוגמה 1, תל אביב',
  cart: [],
  orders: [],
};
// Reads a value from memory and turns it back into an object. If missing / error — returns the fallback
function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.warn(`storage: failed to read "${key}"`, err);
    return fallback;
  }
}
// Saves an object in the browser memory (turns it into JSON text)
function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
const storage = {
  DEMO_USER,
  // --- users (local backup for api.js when jsonbin is not set up) ---
  // Returns the users list from the browser, and makes sure the demo user is always in it
  getLocalUsers() {
    const users = readJSON(KEYS.USERS, []);
    if (!users.find((u) => u.email === DEMO_USER.email)) {
      users.push(DEMO_USER);
      writeJSON(KEYS.USERS, users);
    }
    return users;
  },
  // Saves the users list in the browser
  setLocalUsers(users) {
    writeJSON(KEYS.USERS, users);
  },
  // --- session (which user email is logged in right now) ---
  // Who is logged in now? Returns the email, or null if nobody
  getSessionEmail() {
    return localStorage.getItem(KEYS.SESSION);
  },
  // Marks a user as logged in (called after a successful login / signup)
  setSessionEmail(email) {
    localStorage.setItem(KEYS.SESSION, email);
  },
  // Logs the user out (called when clicking "logout")
  clearSession() {
    localStorage.removeItem(KEYS.SESSION);
  },
  // --- guest cart (used only when nobody is logged in) ---
  // Returns the shopping cart of a guest (someone not logged in)
  getGuestCart() {
    return readJSON(KEYS.GUEST_CART, []);
  },
  // Saves the guest cart
  setGuestCart(cart) {
    writeJSON(KEYS.GUEST_CART, cart);
  },
  // --- favorites (saved in the browser, does not depend on login) ---
  // Returns the list of products marked with the red heart (favorites)
  getFavorites() {
    return readJSON(KEYS.FAVORITES, []);
  },
  // Saves the updated favorites list
  setFavorites(favorites) {
    writeJSON(KEYS.FAVORITES, favorites);
  },
};
