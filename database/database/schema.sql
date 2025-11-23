-- users
CREATE TABLE IF NOT EXISTS users (
  user_id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  hashed_password VARCHAR(255),
  google_id VARCHAR(255) UNIQUE,
  avatar_url TEXT,
  created_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- categories
CREATE TABLE IF NOT EXISTS categories (
  category_id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon_url TEXT
);

-- expenses
CREATE TABLE IF NOT EXISTS expenses (
  expense_id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
  category_id BIGINT REFERENCES categories(category_id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  note TEXT,
  created_time TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- budgets
CREATE TABLE IF NOT EXISTS budgets (
  budget_id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE,
  month INT NOT NULL CHECK (month>=1 AND month<=12),
  year INT NOT NULL,
  limit_amount NUMERIC(12,2) NOT NULL,
  CONSTRAINT unique_user_month UNIQUE(user_id, month, year)
);

CREATE INDEX IF NOT EXISTS idx_expenses_user_created ON expenses(user_id, created_time);
