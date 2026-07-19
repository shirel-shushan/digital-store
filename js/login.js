/**
 * login.js — runs only on login.html and draws the login form
 * or the signup form (they switch on the same page, no separate page).
 * Visually: a centered white card with an icon, a title, input fields,
 * a wide dark button, and a link to switch between login and signup.
 */

(function initLoginPage() {
  const root = document.getElementById('login-page-root');
  if (!root) return;

  // The page state: which form is shown (login / signup),
  // is the password visible, and what is the current error message
  let mode = utils.getQueryParam('mode') === 'signup' ? 'signup' : 'login';
  let showPassword = false;
  let error = '';

  // Draws the login form: email, password with a show / hide button,
  // a red error message if there is one, a "Sign in" button, a signup link,
  // and a hint with the demo user details for testing
  function renderLogin() {
    root.innerHTML = `
      <div class="auth-card">
        <div class="auth-icon"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#c1440e" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></div>
        <div class="auth-title">ברוכים השבים</div>
        <div class="auth-sub">התחברו כדי להמשיך לקנייה</div>
        <div class="field-group">
          <div class="field">
            <div class="field-label">אימייל</div>
            <div class="field-with-icon">${ui.icons.search()}<input class="field-input" id="login-email" placeholder="you@example.com"></div>
          </div>
          <div class="field">
            <div class="field-label">סיסמה</div>
            <div class="field-with-icon field-with-toggle">
              <input class="field-input" id="login-password" type="${showPassword ? 'text' : 'password'}" placeholder="••••••••">
              <button class="field-toggle-btn" data-action="toggle-password" type="button">${showPassword ? 'הסתר' : 'הצג'}</button>
            </div>
          </div>
          ${error ? `<div class="form-error">${error}</div>` : ''}
          <button class="btn btn-dark btn-block" data-action="submit-login">כניסה</button>
          <div class="form-footnote">אין לך חשבון? <button class="link-btn" data-action="go-signup">הרשמה</button></div>
          <div class="form-footnote hint">לבדיקה: demo@store.co.il / Demo1234</div>
        </div>
      </div>`;
  }

  // Draws the signup form: full name, email, password and shipping address,
  // with a "Create account" button and a link back to login
  function renderSignup() {
    root.innerHTML = `
      <div class="auth-card" style="max-width:400px;">
        <div class="auth-title">הרשמה</div>
        <div class="field-group">
          <div class="field"><div class="field-label">שם מלא</div><input class="field-input" id="signup-name"></div>
          <div class="field"><div class="field-label">אימייל</div><input class="field-input" id="signup-email"></div>
          <div class="field"><div class="field-label">סיסמה</div><input class="field-input" type="password" id="signup-password"></div>
          <div class="field"><div class="field-label">כתובת למשלוח</div><input class="field-input" id="signup-address"></div>
          ${error ? `<div class="form-error">${error}</div>` : ''}
          <button class="btn btn-dark btn-block" data-action="submit-signup">יצירת חשבון</button>
          <div class="form-footnote">כבר יש לך חשבון? <button class="link-btn" data-action="go-login">התחברות</button></div>
        </div>
      </div>`;
  }

  // Clears an old error and draws the right form based on the state
  function render() {
    error = '';
    mode === 'signup' ? renderSignup() : renderLogin();
  }

  // All the clicks on the page:
  // - switching between login and signup, show / hide password
  // - "Sign in": checks that the email and password exist in the users list —
  //   if yes, saves who is logged in and goes to the home page, if not shows an error
  // - "Create account": checks that all the fields are filled and the email is
  //   not taken, creates a new user, logs them in and goes to the home page
  root.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;

    if (el.dataset.action === 'go-signup') { mode = 'signup'; render(); return; }
    if (el.dataset.action === 'go-login') { mode = 'login'; render(); return; }
    if (el.dataset.action === 'toggle-password') { showPassword = !showPassword; renderLogin(); return; }

    if (el.dataset.action === 'submit-login') {
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const users = await api.getUsers();
      const user = users.find((u) => u.email === email && u.password === password);
      if (!user) { error = 'אימייל או סיסמה שגויים'; renderLogin(); return; }
      storage.setSessionEmail(user.email);
      router.goTo(router.home());
      return;
    }

    if (el.dataset.action === 'submit-signup') {
      const name = document.getElementById('signup-name').value.trim();
      const email = document.getElementById('signup-email').value.trim();
      const password = document.getElementById('signup-password').value.trim();
      const address = document.getElementById('signup-address').value.trim();
if (!/^\S+@\S+\.\S+$/.test(email)) { error = 'כתובת אימייל לא תקינה'; renderSignup(); return; }
      if (password.length < 6) { error = 'הסיסמה חייבת להכיל לפחות 6 תווים'; renderSignup(); return; }
      const users = await api.getUsers();
      if (users.find((u) => u.email === email)) { error = 'קיים כבר משתמש עם אימייל זה'; renderSignup(); return; }

      const newUser = { name, email, password, address, cart: [], orders: [] };
      await api.saveUsers([...users, newUser]);
      storage.setSessionEmail(newUser.email);
      router.goTo(router.home());
    }
  });

  // First draw when entering the page
  render();
})();
