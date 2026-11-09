CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(80) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  profile_picture TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(120) NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  type VARCHAR(8) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  category VARCHAR(60) NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  account_id UUID,
  transfer_account_id UUID,
  cost_type VARCHAR(8) NOT NULL DEFAULT 'variable' CHECK (cost_type IN ('fixed', 'variable')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check
  CHECK (type IN ('income', 'expense', 'transfer'));
ALTER TABLE transactions ALTER COLUMN type TYPE VARCHAR(8);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS account_id UUID;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS transfer_account_id UUID;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS cost_type VARCHAR(8) NOT NULL DEFAULT 'variable';
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_cost_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_cost_type_check
  CHECK (cost_type IN ('fixed', 'variable'));

CREATE INDEX IF NOT EXISTS transactions_owner_date_id_idx
  ON transactions (owner, date DESC, id DESC);

CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(80) NOT NULL,
  account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('checking', 'savings', 'cash', 'investment', 'credit_card', 'loan')),
  institution VARCHAR(80) NOT NULL DEFAULT '',
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  credit_limit NUMERIC CHECK (credit_limit IS NULL OR credit_limit >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS accounts_owner_idx ON accounts (owner, created_at);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_account_id_fkey'
  ) THEN
    ALTER TABLE transactions ADD CONSTRAINT transactions_account_id_fkey
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_transfer_account_id_fkey'
  ) THEN
    ALTER TABLE transactions ADD CONSTRAINT transactions_transfer_account_id_fkey
      FOREIGN KEY (transfer_account_id) REFERENCES accounts(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(60) NOT NULL,
  monthly_limit NUMERIC NOT NULL CHECK (monthly_limit > 0),
  month SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year SMALLINT NOT NULL CHECK (year BETWEEN 2000 AND 2200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (owner, category, month, year)
);

CREATE TABLE IF NOT EXISTS savings_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(80) NOT NULL,
  target_amount NUMERIC NOT NULL CHECK (target_amount > 0),
  saved_amount NUMERIC NOT NULL DEFAULT 0 CHECK (saved_amount >= 0),
  target_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(80) NOT NULL,
  debt_type VARCHAR(20) NOT NULL CHECK (debt_type IN ('credit_card', 'loan', 'other')),
  balance NUMERIC NOT NULL CHECK (balance >= 0),
  credit_limit NUMERIC CHECK (credit_limit IS NULL OR credit_limit > 0),
  minimum_payment NUMERIC NOT NULL DEFAULT 0 CHECK (minimum_payment >= 0),
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(120) NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
