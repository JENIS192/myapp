import 'dotenv/config';
import express from 'express';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const { PORT = 5000, DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET } = process.env;
const pool = mysql.createPool({ host: DB_HOST, port: +DB_PORT, user: DB_USER, password: DB_PASSWORD, database: DB_NAME, connectionLimit: 10 });
const app = express();
app.use(express.json());

const wrap = (fn) => (req, res) => fn(req, res).catch((e) => { console.error(e); res.status(500).json({ error: 'Server error' }); });
const auth = (req, res, next) => {
  try { req.user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), JWT_SECRET); next(); }
  catch { res.status(401).json({ error: 'Please log in' }); }
};
const token = (u) => jwt.sign({ id: u.id, name: u.name }, JWT_SECRET, { expiresIn: '7d' });

// Health check (tier-2 -> tier-3 connectivity)
app.get('/api/hell/health', wrap(async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok', database: 'connected', uptime: process.uptime() });
}));

app.get('/api/vehicles', wrap(async (req, res) => {
  const { brand, q } = req.query; const w = []; const p = [];
  if (brand) { w.push('brand=?'); p.push(brand); }
  if (q) { w.push('model LIKE ?'); p.push(`%${q}%`); }
  const [rows] = await pool.query(`SELECT * FROM vehicles ${w.length ? 'WHERE ' + w.join(' AND ') : ''} ORDER BY price DESC`, p);
  res.json(rows);
}));
app.get('/api/vehicles/:id', wrap(async (req, res) => {
  const [[v]] = await pool.query('SELECT * FROM vehicles WHERE id=?', [req.params.id]);
  v ? res.json(v) : res.status(404).json({ error: 'Vehicle not found' });
}));

app.post('/api/auth/register', wrap(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6) return res.status(400).json({ error: 'Name, email and a 6+ character password are required' });
  try {
    const [r] = await pool.query('INSERT INTO users(name,email,password_hash) VALUES(?,?,?)', [name, email, await bcrypt.hash(password, 10)]);
    res.status(201).json({ token: token({ id: r.insertId, name }), name });
  } catch (e) { if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already registered' }); throw e; }
}));
app.post('/api/auth/login', wrap(async (req, res) => {
  const [[u]] = await pool.query('SELECT * FROM users WHERE email=?', [req.body.email]);
  if (!u || !(await bcrypt.compare(req.body.password || '', u.password_hash))) return res.status(401).json({ error: 'Wrong email or password' });
  res.json({ token: token(u), name: u.name });
}));

// Totals are computed from the database, never from the client
app.post('/api/orders', auth, wrap(async (req, res) => {
  const items = req.body.items || [];
  if (!items.length) return res.status(400).json({ error: 'Cart is empty' });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction(); let total = 0; const lines = [];
    for (const { id, qty } of items) {
      const [[v]] = await conn.query('SELECT id,model,price,stock FROM vehicles WHERE id=? FOR UPDATE', [id]);
      if (!v || !(qty >= 1) || v.stock < qty) throw Object.assign(new Error(`${v?.model || 'Vehicle'} is out of stock`), { client: true });
      total += Number(v.price) * qty; lines.push([v.id, qty, v.price]);
      await conn.query('UPDATE vehicles SET stock=stock-? WHERE id=?', [qty, id]);
    }
    const [o] = await conn.query('INSERT INTO orders(user_id,total) VALUES(?,?)', [req.user.id, total]);
    for (const [vid, qty, price] of lines) await conn.query('INSERT INTO order_items(order_id,vehicle_id,qty,unit_price) VALUES(?,?,?,?)', [o.insertId, vid, qty, price]);
    await conn.commit(); res.status(201).json({ orderId: o.insertId, total });
  } catch (e) { await conn.rollback(); if (e.client) return res.status(409).json({ error: e.message }); throw e; }
  finally { conn.release(); }
}));
app.get('/api/orders', auth, wrap(async (req, res) => {
  const [rows] = await pool.query('SELECT id,total,status,created_at FROM orders WHERE user_id=? ORDER BY id DESC', [req.user.id]);
  res.json(rows);
}));

app.listen(PORT, '0.0.0.0', () => console.log(`API on :${PORT}  health: /api/hell/health`));
