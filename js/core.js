/* ════════════════════════════════════════════════════════
   StepStyle — Core Data & Cart Logic
   ════════════════════════════════════════════════════════ */

/* ── GA4 HELPER ──────────────────────────────────────── */
function ga(event, params = {}) {
  if (typeof gtag !== 'undefined') gtag('event', event, params);
}

/* ── DEFAULT PRODUCTS ────────────────────────────────── */
const DEFAULT_PRODUCTS = [
  { id:'p1', name:'Sprint Pro Runner', category:'Running', price:129, stock:18, badge:'Best Seller', emoji:'👟', color:'#111f14', desc:'Engineered for speed and endurance. Lightweight mesh upper with responsive foam midsole for maximum energy return on every stride.' },
  { id:'p2', name:'Urban Drift Sneaker', category:'Casual', price:99, stock:24, badge:'New', emoji:'👟', color:'#111422', desc:'Where street culture meets refined comfort. Vulcanized sole with premium suede panels — made for the city wanderer.' },
  { id:'p3', name:'Apex Court Trainer', category:'Sports', price:149, stock:12, badge:'Pro Pick', emoji:'🥿', color:'#1f1111', desc:'Lateral support system and anti-slip outsole built for high-intensity court sessions. Trusted by athletes.' },
  { id:'p4', name:'Cloud Walk Loafer', category:'Casual', price:89, stock:30, badge:'', emoji:'🥾', color:'#1a1811', desc:'Memory foam insole meets classic silhouette. All-day comfort with a contemporary edge for the modern professional.' },
  { id:'p5', name:'Enduro Trail Boot', category:'Sports', price:175, stock:8, badge:'Limited', emoji:'🥾', color:'#131f13', desc:'Waterproof Gore-Tex upper with deep lug outsole. Built for the toughest terrain — mud, rock, and everything between.' },
  { id:'p6', name:'Velocity X Run', category:'Running', price:139, stock:15, badge:'', emoji:'👟', color:'#1a1422', desc:'Carbon-plate propulsion system for competitive runners. Reduces ground contact time by up to 15% versus standard trainers.' },
];

/* ── STORAGE HELPERS ─────────────────────────────────── */
const DB = {
  get: (k, fallback = null) => {
    try { const v = localStorage.getItem('ss_' + k); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set: (k, v) => { try { localStorage.setItem('ss_' + k, JSON.stringify(v)); } catch {} },
};

/* ── INIT DATA ───────────────────────────────────────── */
function initData() {
  if (!DB.get('products')) DB.set('products', DEFAULT_PRODUCTS);
  if (!DB.get('orders')) DB.set('orders', []);
  if (!DB.get('cart')) DB.set('cart', []);
}
initData();

/* ── PRODUCTS ────────────────────────────────────────── */
const Products = {
  all: () => DB.get('products', []),
  byId: (id) => Products.all().find(p => p.id === id),
  save: (products) => DB.set('products', products),
  add: (p) => { const all = Products.all(); all.push(p); Products.save(all); },
  update: (updated) => {
    const all = Products.all().map(p => p.id === updated.id ? updated : p);
    Products.save(all);
  },
  delete: (id) => { Products.save(Products.all().filter(p => p.id !== id)); },
  genId: () => 'p' + Date.now(),
};

/* ── ORDERS ──────────────────────────────────────────── */
const Orders = {
  all: () => DB.get('orders', []),
  byId: (id) => Orders.all().find(o => o.id === id),
  save: (orders) => DB.set('orders', orders),
  add: (o) => { const all = Orders.all(); all.unshift(o); Orders.save(all); },
  update: (updated) => {
    const all = Orders.all().map(o => o.id === updated.id ? updated : o);
    Orders.save(all);
  },
  genId: () => 'SS-' + Date.now().toString(36).toUpperCase(),
  totalRevenue: () => Orders.all().reduce((s, o) => s + (o.total || 0), 0),
};

/* ── CART ────────────────────────────────────────────── */
const Cart = {
  get: () => DB.get('cart', []),
  save: (items) => DB.set('cart', items),
  count: () => Cart.get().reduce((s, i) => s + i.qty, 0),
  total: () => Cart.get().reduce((s, i) => s + (i.price * i.qty), 0),
  add: (product, qty = 1) => {
    const items = Cart.get();
    const existing = items.find(i => i.id === product.id);
    if (existing) existing.qty += qty;
    else items.push({ id: product.id, name: product.name, price: product.price, emoji: product.emoji, qty });
    Cart.save(items);
    ga('add_to_cart', { currency:'USD', value: product.price * qty, items:[{ item_id:product.id, item_name:product.name, price:product.price, quantity:qty }] });
    updateCartBadge();
  },
  remove: (id) => {
    const item = Cart.get().find(i => i.id === id);
    if (item) ga('remove_from_cart', { currency:'USD', value: item.price * item.qty, items:[{ item_id:id }] });
    Cart.save(Cart.get().filter(i => i.id !== id));
    updateCartBadge();
  },
  setQty: (id, qty) => {
    if (qty < 1) return Cart.remove(id);
    const items = Cart.get().map(i => i.id === id ? { ...i, qty } : i);
    Cart.save(items);
    updateCartBadge();
  },
  clear: () => { Cart.save([]); updateCartBadge(); },
};

// Expose global cart helpers
window.getCart = Cart.get;
window.clearCart = Cart.clear;
window.setCart = Cart.save;
window.getUser = () => {
  try { const u = localStorage.getItem('ss_user'); return u ? JSON.parse(u) : null; } catch { return null; }
};
window.setUser = (u) => { try { localStorage.setItem('ss_user', JSON.stringify(u)); } catch {} };

function updateCartBadge() {
  const badges = document.querySelectorAll('.cart-badge');
  const count = Cart.count();
  badges.forEach(b => { b.textContent = count; b.style.display = count ? 'flex' : 'none'; });
}

/* ── TOAST ───────────────────────────────────────────── */
function showToast(msg, type = '') {
  let toast = document.getElementById('globalToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'globalToast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = 'toast' + (type ? ' ' + type : '');
  void toast.offsetWidth;
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 2800);
}

/* ── REVEAL ON SCROLL ────────────────────────────────── */
function initReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold:.1 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

/* ── NAV ACTIVE ──────────────────────────────────────── */
function setNavActive() {
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-nav a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('href') === path);
  });
}

/* ── MARQUEE ─────────────────────────────────────────── */
function buildMarquee(selector) {
  const el = document.querySelector(selector);
  if (!el) return;
  const items = ['Running','Casual','Sports','Performance','Style','Comfort','Innovation','StepStyle'];
  const track = document.createElement('div');
  track.className = 'marquee-track';
  [...items, ...items].forEach(t => { const s = document.createElement('span'); s.textContent = '— ' + t; track.appendChild(s); });
  el.appendChild(track);
}

/* ── HAMBURGER ───────────────────────────────────────── */
function initHamburger() {
  const btn = document.getElementById('hamburger');
  const nav = document.getElementById('mobileNav');
  if (!btn || !nav) return;
  btn.addEventListener('click', () => nav.classList.toggle('open'));
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
}

document.addEventListener('DOMContentLoaded', () => {
  updateCartBadge();
  initReveal();
  setNavActive();
  initHamburger();
});
