/**
 * profile.js — runs only on profile.html ("My account").
 * Visually: a white card with the logged-in user's details (name, email,
 * address) and a "Logout" button, and under it "Order history" — a card
 * for every order with its number, date, product list and the total in orange.
 * Someone not logged in who enters this page — is sent to the login page.
 */

(function initProfilePage() {
  const root = document.getElementById('profile-page-root');
  if (!root) return;

  // Draws the page: checks who is logged in (if nobody — sends to login),
  // gets the user details from the list, and shows the details and the
  // orders from newest to oldest. If there are no orders — "No purchases yet."
  async function render() {
    const email = storage.getSessionEmail();
    if (!email) { router.goTo(router.loginUrl()); return; }

    const users = await api.getUsers();
    const user = users.find((u) => u.email === email);
    if (!user) { storage.clearSession(); router.goTo(router.loginUrl()); return; }

    const orders = (user.orders || []).slice().reverse();
    const ordersHtml = orders.length
      ? orders.map((o) => `
          <div class="form-card" style="margin-bottom:12px;">
            <div style="display:flex;justify-content:space-between;font-size:14px;font-weight:700;margin-bottom:6px;">
              <span>הזמנה ${o.id}</span><span>${utils.formatDate(o.date)}</span>
            </div>
            <div style="font-size:13px;color:var(--color-text-muted);margin-bottom:6px;">
              ${o.items.map((i) => `${utils.escapeHtml(i.title)} ×${i.quantity}`).join(', ')}
            </div>
            <div style="font-weight:700;color:var(--color-accent);">${utils.formatPrice(o.total)}</div>
          </div>`).join('')
      : ui.renderStateMessage('עדיין לא ביצעת רכישות.');

    root.innerHTML = `
      <div class="section-title" style="margin-bottom:20px;">האזור האישי שלי</div>
      <div class="form-card" style="margin-bottom:24px;display:flex;flex-direction:column;gap:8px;">
        <div style="font-size:15px;"><b>שם:</b> ${utils.escapeHtml(user.name)}</div>
        <div style="font-size:15px;"><b>אימייל:</b> ${utils.escapeHtml(user.email)}</div>
        <div style="font-size:15px;"><b>כתובת למשלוח:</b> ${utils.escapeHtml(user.address)}</div>
        <button class="btn btn-outline" style="align-self:flex-start;margin-top:10px;" data-action="logout">התנתקות</button>
      </div>
      <div class="section-title" style="font-size:18px;margin-bottom:12px;">היסטוריית רכישות</div>
      ${ordersHtml}`;
  }

  // Clicking "Logout": deletes the login and goes back to the home page
  root.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    if (el.dataset.action === 'logout') {
      storage.clearSession();
      router.goTo(router.home());
    }
  });

  // First draw when entering the page
  render();
})();
