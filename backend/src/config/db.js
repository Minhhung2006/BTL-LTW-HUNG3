// backend/src/config/db.js
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD ?? '',   // <- đọc DB_PASSWORD
  database: process.env.DB_NAME || 'expense_db',
  port: Number(process.env.DB_PORT || 5432),
});

// optional quick test (won't throw, just logs)
pool.connect()
  .then(client => {
    client.release();
    console.log('✅ PostgreSQL: connection OK');
  })
  .catch(err => {
    console.error('❌ PostgreSQL connection error:', err);
  });

export default pool;
