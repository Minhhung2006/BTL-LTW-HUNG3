import pool from '../config/db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export async function register(req, res) {
  try {
    const { email, full_name, password } = req.body;
    if (!email || !full_name || !password) return res.status(400).json({ error: 'Missing fields' });

    // check exists
    const exists = await pool.query('SELECT user_id FROM users WHERE email=$1', [email]);
    if (exists.rowCount) return res.status(400).json({ error: 'Email already used' });

    const hashed = await bcrypt.hash(password, 10);
    const r = await pool.query(
      `INSERT INTO users (email, full_name, hashed_password) VALUES ($1,$2,$3) RETURNING user_id, email, full_name`,
      [email, full_name, hashed]
    );
    res.json({ user: r.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

    const r = await pool.query('SELECT user_id, hashed_password, full_name FROM users WHERE email=$1', [email]);
    if (!r.rowCount) return res.status(401).json({ error: 'Invalid credentials' });

    const user = r.rows[0];
    const ok = await bcrypt.compare(password, user.hashed_password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ user_id: user.user_id, full_name: user.full_name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { user_id: user.user_id, full_name: user.full_name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
