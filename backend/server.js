// server.js (recommended improved version)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import url from 'url';

dotenv.config();
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import DB pool (adjust path if your db file is elsewhere)
let pool;
try {
  const dbMod = await import(url.pathToFileURL(path.join(__dirname, 'src', 'config', 'db.js')).href);
  // support both `export default pool` and named exports
  pool = dbMod.default ?? dbMod.pool ?? dbMod;
} catch (err) {
  console.warn('⚠️ Could not import DB module (will continue without DB):', err.message);
  pool = null;
}

// serve static files
const publicDir = path.join(__dirname, 'public');
if (fs.existsSync(publicDir)) {
  app.use('/public', express.static(publicDir));
  console.log('✅ Serving static files from /public');
} else {
  console.log('ℹ️ No public directory found (skipping static files).');
}

// helper to load route modules safely (works with ESM default or CommonJS module.exports)
async function safeLoadRoute(relativePath, mountPath) {
  const fullPath = path.join(__dirname, relativePath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️ Route file not found: ${relativePath} (skipped)`);
    return false;
  }

  try {
    const mod = await import(url.pathToFileURL(fullPath).href);
    // support ESM default and CommonJS (module.exports)
    const router = mod.default ?? mod;
    if (!router) {
      console.warn(`⚠️ Route module ${relativePath} has no exports (skipped)`);
      return false;
    }
    // router might export several things; try to find an Express router
    // common case: module.exports = router OR export default router
    app.use(mountPath, router);
    console.log(`✅ Loaded route ${relativePath} -> ${mountPath}`);
    return true;
  } catch (err) {
    console.error(`❌ Error loading route ${relativePath}:`, err);
    return false;
  }
}

// Load routes
const routesToLoad = [
  { file: './src/routes/users.js', mount: '/api/users' },
  { file: './src/routes/expenses.js', mount: '/api/expenses' },
  { file: './src/routes/reportRoutes.js', mount: '/api/report' },
];

for (const r of routesToLoad) {
  // eslint-disable-next-line no-await-in-loop
  await safeLoadRoute(r.file, r.mount);
}

// basic health check
app.get('/', (req, res) => {
  res.json({ ok: true, msg: 'Backend is running' });
});

// global error handlers
process.on('uncaughtException', (err) => console.error('uncaughtException:', err));
process.on('unhandledRejection', (reason) => console.error('unhandledRejection:', reason));

// Start server AFTER DB connection is OK (if DB required)
const PORT = process.env.PORT || 4000;

async function startServer() {
  if (pool) {
    try {
      // pool.connect() returns a client — we just check connectivity and release immediately
      const client = await pool.connect();
      client.release();
      console.log('✅ PostgreSQL reachable');
    } catch (err) {
      console.error('❌ PostgreSQL connection failed:', err.message);
      console.warn('⚠️ Starting server without active DB connection — some endpoints may fail.');
      // Optionally: return process.exit(1); to stop server if DB is mandatory
    }
  } else {
    console.warn('⚠️ No DB pool configured — skipping DB connectivity check.');
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

startServer();
