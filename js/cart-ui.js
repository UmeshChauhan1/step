/* ════════════════════════════════════════════════════════
   StepStyle — Cart UI
   ════════════════════════════════════════════════════════ */

function buildProductCard(p) {
  return `
    <div class="card-img" style="background:${p.color||'var(--gray-mid)'}">
      <span>${p.emoji||'👟'}</span>
      ${p.badge ? `<span class="card-badge">${p.badge}</span>` : ''}
    </div>
    <div class="card-body">
      <h3 class="card-name">${p.name}</h3>
      <p class="card-sub">${p.category} · ${p.stock > 0 ? p.stock + ' in stock' : '<span style="color:#ff4d4d">Out of stock</span>'}</p>
      <div class="card-footer">
        <div>
          <div class="card-price">$${p.price}</div>
        </div>
        <button class="btn-cart" onclick="handleAddToCart('${p.id}', this)" ${p.stock === 0 ? 'disabled style="opacity:.4"' : ''}>
          + Cart
        </button>
      </div>
    </div>`;
}

function handleAddToCart(id, btn) {
  const p = Products.byId(id);
  if (!p || p.stock === 0) return;
  Cart.add(p);
  btn.textContent = '✓ Added';
  btn.classList.add('added');
  showToast(`${p.name} added to cart`);
  renderCart();
  setTimeout(() => { btn.textContent = '+ Cart'; btn.classList.remove('added'); }, 1800);
}

function renderCart() {
  const container = document.getElementById('cartItems');
  const footer = document.getElementById('cartFooter');
  if (!container) return;

  const items = Cart.get();
  if (items.length === 0) {
    container.innerHTML = '<div class="cart-empty"><p style="font-size:2.5rem;margin-bottom:.8rem">🛒</p>Your cart is empty.</div>';
    if (footer) footer.innerHTML = '';
    return;
  }

  container.innerHTML = items.map(item => `
    <div class="cart-item">
      <div class="cart-item-img">${item.emoji || '👟'}</div>
      <div>
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">$${item.price}</div>
        <div class="cart-qty">
          <button class="qty-btn" onclick="Cart.setQty('${item.id}', ${item.qty - 1}); renderCart()">−</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" onclick="Cart.setQty('${item.id}', ${item.qty + 1}); renderCart()">+</button>
        </div>
      </div>
      <button class="remove-btn" onclick="Cart.remove('${item.id}'); renderCart()">✕</button>
    </div>
  `).join('');

  if (footer) footer.innerHTML = `
    <div class="cart-total">
      <span>Total</span>
      <strong>$${Cart.total().toFixed(2)}</strong>
    </div>
    <a href="checkout.html" class="btn btn-green" style="width:100%;justify-content:center" onclick="ga('begin_checkout',{currency:'USD',value:${Cart.total().toFixed(2)}})">
      Checkout →
    </a>
    <button class="btn btn-outline" style="width:100%;justify-content:center;margin-top:.6rem" onclick="Cart.clear();renderCart()">
      Clear Cart
    </button>`;
}

// Cart sidebar toggle
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('cartToggle');
  const overlay = document.getElementById('cartOverlay');
  const sidebar = document.getElementById('cartSidebar');
  const closeBtn = document.getElementById('cartClose');

  function openCart() {
    overlay?.classList.add('open');
    sidebar?.classList.add('open');
    renderCart();
  }
  function closeCart() {
    overlay?.classList.remove('open');
    sidebar?.classList.remove('open');
  }

  toggle?.addEventListener('click', openCart);
  closeBtn?.addEventListener('click', closeCart);
  overlay?.addEventListener('click', closeCart);
  renderCart();
});
