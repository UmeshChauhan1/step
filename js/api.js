// API Configuration
const API_BASE_URL = 'http://localhost:5001/api';

// ━━━ UTILITY FUNCTIONS ━━━
const getAuthToken = () => localStorage.getItem('ss_token');

const setAuthToken = (token) => localStorage.setItem('ss_token', token);

const removeAuthToken = () => localStorage.removeItem('ss_token');

const getCurrentUser = () => {
  try {
    const user = localStorage.getItem('ss_user');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

const setCurrentUser = (user) => localStorage.setItem('ss_user', JSON.stringify(user));

// ━━━ API FETCH HELPER ━━━
const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API Error');
    }
    
    return await response.json();
  } catch (err) {
    console.error('API Error:', err.message);
    throw err;
  }
};

// ━━━ AUTHENTICATION API ━━━
const AuthAPI = {
  signup: async (email, password, name) => {
    const data = await apiFetch('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    setAuthToken(data.token);
    setCurrentUser(data.user);
    return data;
  },
  
  login: async (email, password) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setAuthToken(data.token);
    setCurrentUser(data.user);
    return data;
  },
  
  logout: () => {
    removeAuthToken();
    localStorage.removeItem('ss_user');
  },
  
  getCurrentUser: async () => {
    return await apiFetch('/auth/me');
  },
  
  updateProfile: async (name, phone) => {
    const data = await apiFetch('/user/profile', {
      method: 'PUT',
      body: JSON.stringify({ name, phone }),
    });
    if (data) {
      setCurrentUser({ ...(getCurrentUser() || {}), name: data.name, email: data.email });
    }
    return data;
  },
  
  forgotPassword: async (email) => {
    return await apiFetch('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
  
  resetPassword: async (token, password) => {
    return await apiFetch('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  },
};

// ━━━ PRODUCTS API ━━━
const ProductsAPI = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.q) params.append('q', filters.q);
    if (filters.category) params.append('category', filters.category);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.size) params.append('size', filters.size);
    if (filters.color) params.append('color', filters.color);
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    
    return await apiFetch(`/products?${params}`);
  },
  
  getById: async (id) => {
    return await apiFetch(`/products/${id}`);
  },
  
  getRelated: async (id) => {
    return await apiFetch(`/products/${id}/related`);
  },
  
  search: async (query) => {
    return await apiFetch(`/products/search/autocomplete?q=${query}`);
  },
};

// ━━━ ORDERS API ━━━
const OrdersAPI = {
  create: async (items, shippingAddress, shippingMethod, couponCode) => {
    return await apiFetch('/orders', {
      method: 'POST',
      body: JSON.stringify({
        items,
        shippingAddress,
        shippingMethod,
        couponCode,
      }),
    });
  },
  
  getAll: async () => {
    return await apiFetch('/orders');
  },
  
  getById: async (id) => {
    return await apiFetch(`/orders/${id}`);
  },
  
  cancel: async (id) => {
    return await apiFetch(`/orders/${id}/cancel`, { method: 'POST' });
  },
  
  requestReturn: async (id, reason) => {
    return await apiFetch(`/orders/${id}/return`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
};

// ━━━ PAYMENTS API ━━━
const PaymentsAPI = {
  createIntent: async (orderId) => {
    return await apiFetch('/payment/create-intent', {
      method: 'POST',
      body: JSON.stringify({ orderId }),
    });
  },
  
  confirm: async (orderId, paymentIntentId) => {
    return await apiFetch('/payment/confirm', {
      method: 'POST',
      body: JSON.stringify({ orderId, paymentIntentId }),
    });
  },
  
  getHistory: async () => {
    return await apiFetch('/payment/history');
  },
};

// ━━━ REVIEWS API ━━━
const ReviewsAPI = {
  getByProduct: async (productId, sort = 'newest', page = 1) => {
    return await apiFetch(`/reviews/product/${productId}?sort=${sort}&page=${page}`);
  },
  
  getStats: async (productId) => {
    return await apiFetch(`/reviews/product/${productId}/stats`);
  },
  
  create: async (productId, rating, title, text, images = []) => {
    return await apiFetch('/reviews', {
      method: 'POST',
      body: JSON.stringify({
        productId,
        rating,
        title,
        text,
        images,
      }),
    });
  },
  
  markHelpful: async (reviewId, helpful = true) => {
    return await apiFetch(`/reviews/${reviewId}/helpful`, {
      method: 'POST',
      body: JSON.stringify({ helpful }),
    });
  },
};

// ━━━ CASHFREE API ━━━
const CashfreeAPI = {
  getConfig: async () => {
    return await apiFetch('/cashfree/config');
  },
  createOrder: async (payload) => {
    return await apiFetch('/cashfree/create-order', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};

// ━━━ WISHLIST API ━━━
const WishlistAPI = {
  get: async () => {
    return await apiFetch('/wishlist');
  },
  
  add: async (productId, size, color) => {
    return await apiFetch('/wishlist/add', {
      method: 'POST',
      body: JSON.stringify({ productId, size, color }),
    });
  },
  
  remove: async (itemId) => {
    return await apiFetch('/wishlist/remove', {
      method: 'POST',
      body: JSON.stringify({ itemId }),
    });
  },
  
  toggleNotification: async (itemId, notify) => {
    return await apiFetch(`/wishlist/${itemId}/notify`, {
      method: 'POST',
      body: JSON.stringify({ notify }),
    });
  },
  
  share: async () => {
    return await apiFetch('/wishlist/share', { method: 'POST' });
  },
  
  getShared: async (token) => {
    return await apiFetch(`/wishlist/shared/${token}`);
  },
  
  clear: async () => {
    return await apiFetch('/wishlist', { method: 'DELETE' });
  },
};

// ━━━ COUPONS API ━━━
const CouponsAPI = {
  validate: async (code, orderTotal) => {
    return await apiFetch('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, orderTotal }),
    });
  },
  
  getActive: async () => {
    return await apiFetch('/coupons');
  },
};

// ━━━ USER API ━━━
const UserAPI = {
  getProfile: async () => {
    return await apiFetch('/user/profile');
  },
  
  getStats: async () => {
    return await apiFetch('/user/stats');
  },
  
  updateProfile: async (data) => {
    return await apiFetch('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  addAddress: async (address) => {
    return await apiFetch('/user/addresses', {
      method: 'POST',
      body: JSON.stringify(address),
    });
  },
  
  deleteAddress: async (addressId) => {
    return await apiFetch(`/user/addresses/${addressId}`, {
      method: 'DELETE',
    });
  },
  
  updatePreferences: async (preferences) => {
    return await apiFetch('/user/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
  },
};

// ━━━ EXPORT ALL APIs ━━━
window.APIs = {
  auth: AuthAPI,
  products: ProductsAPI,
  orders: OrdersAPI,
  payments: PaymentsAPI,
  reviews: ReviewsAPI,
  wishlist: WishlistAPI,
  coupons: CouponsAPI,
  user: UserAPI,
};

// ━━━ HELPER: SHOW TOAST ━━━
function showToast(msg, type = 'success') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.style.cssText = `
      position: fixed; bottom: 20px; right: 20px; z-index: 9999;
      background: #2d ff6e; color: white; padding: 15px 20px;
      border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(toast);
  }
  
  toast.textContent = msg;
  toast.style.background = type === 'error' ? '#ff4d4d' : '#2dff6e';
  toast.style.display = 'block';
  
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

// ━━━ LOGIN CHECK ━━━
window.checkAuth = () => {
  const user = getCurrentUser();
  const token = getAuthToken();
  return !!(user && token);
};

window.redirectToLogin = () => {
  localStorage.setItem('ss_redirect', window.location.pathname);
  window.location.href = '/login.html';
};

if (!window.checkAuth() && 
    (window.location.pathname.includes('/checkout') || 
     window.location.pathname.includes('/user-'))) {
  window.redirectToLogin();
}
