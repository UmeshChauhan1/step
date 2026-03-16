const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID || '';
const CASHFREE_SECRET = process.env.CASHFREE_SECRET || '';
const CASHFREE_ENV = process.env.CASHFREE_ENV || 'TEST';
const PORT = process.env.PORT || 5000;

const BASE_URL = CASHFREE_ENV === 'PROD' ? 'https://api.cashfree.com' : 'https://sandbox.cashfree.com';

const users = [];
const orders = [];

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.replace('Bearer ', '');
  const user = users.find(u => u.token === token);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  req.user = user;
  next();
}

app.post('/api/auth/signup', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });
  if (users.some(u => u.email === email)) return res.status(400).json({ error: 'Email already exists' });
  const token = `token-${Date.now()}`;
  const user = { id: String(Date.now()), name, email, password, addresses: [], token };
  users.push(user);
  return res.json({ user: { id: user.id, name: user.name, email: user.email, addresses: user.addresses }, token });
});

const passwordResetTokens = {};

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });
  user.token = `token-${Date.now()}`;
  return res.json({ user: { id: user.id, name: user.name, email: user.email, addresses: user.addresses }, token: user.token });
});

app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  const user = users.find(u => u.email === email);
  if (!user) {
    // To prevent account enumeration, still return success message
    return res.json({ message: 'If this email exists, a reset link has been sent.' });
  }

  const token = `reset-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  passwordResetTokens[token] = { userId: user.id, expiresAt: Date.now() + 1000 * 60 * 60 };
  console.log(`Password reset token for ${email}: ${token}`);

  // In a real app, send email containing the reset page link.
  return res.json({ message: 'Password reset email sent. Use the reset link in your inbox.', token });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and password are required' });

  const record = passwordResetTokens[token];
  if (!record || record.expiresAt < Date.now()) {
    return res.status(400).json({ error: 'Invalid or expired token' });
  }

  const user = users.find(u => u.id === record.userId);
  if (!user) return res.status(400).json({ error: 'User not found' });

  user.password = password;
  delete passwordResetTokens[token];
  return res.json({ message: 'Password has been reset successfully' });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = req.user;
  return res.json({ id: user.id, name: user.name, email: user.email, addresses: user.addresses });
});

app.get('/api/user/profile', authMiddleware, (req, res) => {
  const user = req.user;
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone || '',
    addresses: user.addresses || [],
    preferences: user.preferences || {},
  });
});

app.get('/api/user/stats', authMiddleware, (req, res) => {
  const userOrders = orders.filter(o => o.userId === req.user.id);
  const totalOrders = userOrders.length;
  const totalSpent = userOrders.reduce((s, o) => s + (o.total || 0), 0);
  const loyaltyPoints = Math.floor(totalSpent / 100);
  res.json({ totalOrders, totalSpent, loyaltyPoints });
});

app.post('/api/user/addresses', authMiddleware, (req, res) => {
  const { name, phone, line1, line2, city, state, zip, country } = req.body;
  if (!name || !phone || !line1 || !city || !state || !zip || !country) {
    return res.status(400).json({ error: 'Missing address fields' });
  }
  const address = {
    id: `addr-${Date.now()}`,
    name,
    phone,
    line1,
    line2,
    city,
    state,
    zip,
    country,
    isDefault: req.user.addresses.length === 0
  };
  req.user.addresses.push(address);
  res.json({ address });
});

app.delete('/api/user/addresses/:id', authMiddleware, (req, res) => {
  const id = req.params.id;
  req.user.addresses = req.user.addresses.filter(a => a.id !== id);
  res.json({ success: true });
});

app.put('/api/user/profile', authMiddleware, (req, res) => {
  const { name, phone } = req.body;
  if (name) req.user.name = name;
  if (phone) req.user.phone = phone;
  res.json({ id: req.user.id, name: req.user.name, email: req.user.email, phone: req.user.phone || '', addresses: req.user.addresses, preferences: req.user.preferences || {} });
});

app.put('/api/user/preferences', authMiddleware, (req, res) => {
  req.user.preferences = { ...req.user.preferences, ...req.body };
  res.json({ preferences: req.user.preferences });
});

app.post('/api/orders', authMiddleware, (req, res) => {
  const { items, shippingAddress, shippingMethod, couponCode } = req.body;
  if (!items || !items.length) return res.status(400).json({ error: 'Cart is empty' });
  const subtotal = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
  const shippingCost = { standard: 50, express: 150, overnight: 300 }[shippingMethod] || 50;
  const discount = 0;
  const tax = Math.round((subtotal - discount + shippingCost) * 0.08);
  const total = subtotal - discount + shippingCost + tax;
  const orderId = `SS-${Date.now()}`;
  const order = {
    id: orderId,
    orderId,
    userId: req.user.id,
    items,
    shippingAddress,
    shippingMethod,
    couponCode,
    subtotal,
    shippingCost,
    discount,
    tax,
    total,
    status: 'Pending',
    paymentStatus: 'Pending',
    createdAt: new Date().toISOString()
  };
  orders.push(order);
  return res.json({ order });
});

app.get('/api/orders', authMiddleware, (req, res) => {
  const userOrders = orders.filter(o => o.userId === req.user.id);
  res.json({ orders: userOrders });
});

app.get('/api/orders/:id', authMiddleware, (req, res) => {
  const order = orders.find(o => o.id === req.params.id && o.userId === req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json({ order });
});

app.post('/api/orders/:id/cancel', authMiddleware, (req, res) => {
  const order = orders.find(o => o.id === req.params.id && o.userId === req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status === 'delivered' || order.status === 'cancelled') {
    return res.status(400).json({ error: 'Cannot cancel this order' });
  }
  order.status = 'Cancelled';
  order.statusHistory = order.statusHistory || [];
  order.statusHistory.push({ status: 'cancelled', timestamp: new Date().toISOString(), note: 'Order cancelled by user' });
  return res.json({ order });
});

app.post('/api/orders/:id/return', authMiddleware, (req, res) => {
  const order = orders.find(o => o.id === req.params.id && o.userId === req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status !== 'Delivered' && order.status !== 'delivered') {
    return res.status(400).json({ error: 'Return request only available for delivered orders' });
  }
  order.returnStatus = 'Requested';
  order.statusHistory = order.statusHistory || [];
  order.statusHistory.push({ status: 'return_requested', timestamp: new Date().toISOString(), note: 'Return requested by user' });
  return res.json({ order });
});

app.post('/api/cashfree/create-order', async (req, res) => {
  try {
    const { orderId, orderAmount, customerName, customerPhone, customerEmail, returnUrl } = req.body;
    if (!orderId || !orderAmount || !customerName || !customerPhone || !customerEmail || !returnUrl) {
      return res.status(400).json({ error: 'Missing fields' });
    }
    const payload = {
      order_id: orderId,
      order_amount: Number(orderAmount).toFixed(2),
      order_currency: 'INR',
      customer_details: {
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone
      },
      return_url: returnUrl,
      notify_url: returnUrl
    };
    const auth = Buffer.from(`${CASHFREE_APP_ID}:${CASHFREE_SECRET}`).toString('base64');
    const response = await axios.post(`${BASE_URL}/sellers/${CASHFREE_APP_ID}/orders`, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`
      }
    });
    if (response.data?.status === 'OK' || response.data?.status === 'SUCCESS') {
      return res.json({ orderToken: response.data.order_token, order: response.data.order });
    }
    return res.status(500).json({ error: 'Cashfree order creation failed' });
  } catch (err) {
    console.error(err.response?.data || err.message || err);
    return res.status(500).json({ error: err.response?.data?.message || 'Cashfree error' });
  }
});

app.get('/api/cashfree/config', (req, res) => {
  return res.json({ appId: CASHFREE_APP_ID, env: CASHFREE_ENV, sdkUrl: CASHFREE_ENV === 'PROD' ? 'https://sdk.cashfree.com/js/ui/1.0.0/cashfree.js' : 'https://sdk.cashfree.com/js/ui/1.0.0/cashfree.sandbox.js' });
});

// Serve all frontend pages for client routing
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  return res.sendFile(path.join(__dirname, 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;

