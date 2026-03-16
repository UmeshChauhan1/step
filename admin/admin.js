/* ════════════════════════════════════════════════════════
   StepStyle Admin — Shared UI
   ════════════════════════════════════════════════════════ */

// Auth guard
function requireAuth() {
  if (localStorage.getItem('ss_adminAuth') !== 'true') {
    location.href = 'login.html';
    return false;
  }
  return true;
}

function logout() {
  localStorage.removeItem('ss_adminAuth');
  location.href = 'login.html';
}

// Sidebar toggle (mobile)
function initAdminUI() {
  const toggle = document.getElementById('menuToggle');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('open');
    });
  }
  if (overlay) overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  });
  // Topbar clock
  const clockEl = document.getElementById('topbarTime');
  if (clockEl) {
    const tick = () => { clockEl.textContent = new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}); };
    tick(); setInterval(tick, 1000);
  }
  // Active sidebar link
  const path = location.pathname.split('/').pop();
  document.querySelectorAll('.sidebar-link').forEach(l => {
    if (l.getAttribute('href') === path) l.classList.add('active');
  });
}

// Admin toast
function adminToast(msg, type = '') {
  let t = document.getElementById('adminToast');
  if (!t) { t = document.createElement('div'); t.id = 'adminToast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.className = 'toast' + (type ? ' ' + type : '');
  void t.offsetWidth;
  t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 2800);
}

// Status badge helper
function statusBadge(status) {
  const map = { Pending:'badge-orange', Shipped:'badge-blue', Delivered:'badge-green', Cancelled:'badge-red' };
  return `<span class="badge ${map[status]||'badge-gray'}">${status}</span>`;
}

// Format currency
function fmt(n) { return '$' + Number(n).toFixed(2); }
// Format date
function fmtDate(iso) { return new Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}); }

document.addEventListener('DOMContentLoaded', initAdminUI);
