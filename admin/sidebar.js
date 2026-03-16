/* Sidebar HTML builder */
function buildSidebar(activePage) {
  return `
  <div class="sidebar" id="adminSidebar">
    <div class="sidebar-header">
      <div class="sidebar-logo">STEP<span>STYLE</span></div>
      <div class="sidebar-role">Admin Panel</div>
    </div>
    <nav class="sidebar-nav">
      <div class="nav-section-label">Main</div>
      <a href="dashboard.html" class="sidebar-link ${activePage==='dashboard'?'active':''}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        Dashboard
      </a>
      <div class="nav-section-label">Store</div>
      <a href="products.html" class="sidebar-link ${activePage==='products'?'active':''}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        Products
      </a>
      <a href="orders.html" class="sidebar-link ${activePage==='orders'?'active':''}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/></svg>
        Orders
      </a>
      <a href="customers.html" class="sidebar-link ${activePage==='customers'?'active':''}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        Customers
      </a>
      <div class="nav-section-label">Reports</div>
      <a href="analytics.html" class="sidebar-link ${activePage==='analytics'?'active':''}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
        Analytics
      </a>
    </nav>
    <div class="sidebar-bottom">
      <div class="sidebar-user"><strong>Admin</strong>Logged in</div>
      <button class="btn-logout" onclick="logout()">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Logout
      </button>
      <a href="../index.html" style="font-size:.7rem;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;transition:color .2s" onmouseover="this.style.color='var(--green)'" onmouseout="this.style.color='var(--muted)'">← View Store</a>
    </div>
  </div>
  <div id="sidebarOverlay" style="position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99;opacity:0;pointer-events:none;transition:opacity .3s" class=""></div>`;
}
