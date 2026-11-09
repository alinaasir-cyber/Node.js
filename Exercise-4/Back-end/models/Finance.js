import { query, withDatabaseTransaction } from "../config/database.js";

function mapAccount(row) {
  const isLiability = ["credit_card", "loan"].includes(row.account_type);
  return {
    id: row.id,
    name: row.name,
    accountType: row.account_type,
    institution: row.institution,
    openingBalance: Number(row.opening_balance),
    balance: Number(row.balance),
    creditLimit: row.credit_limit == null ? null : Number(row.credit_limit),
    isLiability,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapBudget(row) {
  return {
    id: row.id,
    category: row.category,
    monthlyLimit: Number(row.monthly_limit),
    spent: Number(row.spent),
    remaining: Number(row.monthly_limit) - Number(row.spent),
    percentUsed: Number(row.monthly_limit) > 0
      ? Math.round((Number(row.spent) / Number(row.monthly_limit)) * 100)
      : 0,
    month: row.month,
    year: row.year
  };
}

function mapGoal(row) {
  return {
    id: row.id,
    name: row.name,
    targetAmount: Number(row.target_amount),
    savedAmount: Number(row.saved_amount),
    remaining: Math.max(Number(row.target_amount) - Number(row.saved_amount), 0),
    progress: Math.min(Math.round((Number(row.saved_amount) / Number(row.target_amount)) * 100), 100),
    targetDate: row.target_date
  };
}

function mapDebt(row) {
  return {
    id: row.id,
    name: row.name,
    debtType: row.debt_type,
    balance: Number(row.balance),
    creditLimit: row.credit_limit == null ? null : Number(row.credit_limit),
    utilization: row.credit_limit ? Math.round((Number(row.balance) / Number(row.credit_limit)) * 100) : null,
    minimumPayment: Number(row.minimum_payment),
    dueDate: row.due_date
  };
}

export async function listAccounts(owner) {
  const { rows } = await query(
    `SELECT a.*,
       a.opening_balance
         + COALESCE(SUM(CASE
           WHEN a.account_type IN ('credit_card', 'loan') AND t.type = 'income' THEN -t.amount
           WHEN a.account_type IN ('credit_card', 'loan') AND t.type = 'expense' THEN t.amount
           WHEN a.account_type IN ('credit_card', 'loan') AND t.type = 'transfer' AND t.account_id = a.id THEN t.amount
           WHEN a.account_type IN ('credit_card', 'loan') AND t.type = 'transfer' AND t.transfer_account_id = a.id THEN -t.amount
           WHEN t.type = 'income' THEN t.amount
           WHEN t.type = 'expense' THEN -t.amount
           WHEN t.type = 'transfer' AND t.account_id = a.id THEN -t.amount
           WHEN t.type = 'transfer' AND t.transfer_account_id = a.id THEN t.amount
             ELSE 0
           END), 0) AS balance
     FROM accounts a
     LEFT JOIN transactions t
       ON t.owner = a.owner AND (t.account_id = a.id OR t.transfer_account_id = a.id)
     WHERE a.owner = $1
     GROUP BY a.id
     ORDER BY a.created_at, a.name`,
    [owner]
  );
  return rows.map(mapAccount);
}

export async function createAccount(owner, { name, accountType, institution, openingBalance, creditLimit }) {
  const { rows } = await query(
    `INSERT INTO accounts (owner, name, account_type, institution, opening_balance, credit_limit)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *, opening_balance AS balance`,
    [owner, name, accountType, institution ?? "", openingBalance ?? 0, creditLimit ?? null]
  );
  return mapAccount(rows[0]);
}

export async function updateAccount(owner, id, changes) {
  const columns = {
    name: "name",
    accountType: "account_type",
    institution: "institution",
    openingBalance: "opening_balance",
    creditLimit: "credit_limit"
  };
  const values = [owner, id];
  const assignments = [];
  for (const [field, column] of Object.entries(columns)) {
    if (changes[field] !== undefined) {
      values.push(changes[field]);
      assignments.push(`${column} = $${values.length}`);
    }
  }
  const { rows } = await query(
    `UPDATE accounts SET ${assignments.join(", ")}, updated_at = NOW()
     WHERE owner = $1 AND id = $2 RETURNING *`,
    values
  );
  if (!rows[0]) return null;
  const accounts = await listAccounts(owner);
  return accounts.find((account) => account.id === id) ?? null;
}

export async function deleteAccount(owner, id) {
  const { rows } = await query(
    `DELETE FROM accounts a
     WHERE a.owner = $1 AND a.id = $2
       AND NOT EXISTS (
         SELECT 1 FROM transactions t
         WHERE t.owner = a.owner AND (t.account_id = a.id OR t.transfer_account_id = a.id)
       )
     RETURNING id`,
    [owner, id]
  );
  if (rows.length) return { deleted: true, referenced: false };
  const referenced = await query("SELECT 1 FROM transactions WHERE owner = $1 AND (account_id = $2 OR transfer_account_id = $2) LIMIT 1", [owner, id]);
  return { deleted: false, referenced: referenced.rows.length > 0 };
}

export async function listBudgets(owner, month, year) {
  const { rows } = await query(
    `SELECT b.*,
       COALESCE(SUM(t.amount) FILTER (
         WHERE t.type = 'expense'
           AND EXTRACT(MONTH FROM t.date) = b.month
           AND EXTRACT(YEAR FROM t.date) = b.year
       ), 0)::FLOAT8 AS spent
     FROM budgets b
     LEFT JOIN transactions t ON t.owner = b.owner
       AND t.category = b.category
       AND t.type = 'expense'
       AND t.date >= make_date(b.year::INTEGER, b.month::INTEGER, 1)
       AND t.date < make_date(b.year::INTEGER, b.month::INTEGER, 1) + INTERVAL '1 month'
     WHERE b.owner = $1 AND b.month = $2 AND b.year = $3
     GROUP BY b.id
     ORDER BY b.category`,
    [owner, month, year]
  );
  return rows.map(mapBudget);
}

export async function saveBudget(owner, { category, monthlyLimit, month, year }) {
  const { rows } = await query(
    `INSERT INTO budgets (owner, category, monthly_limit, month, year)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (owner, category, month, year)
     DO UPDATE SET monthly_limit = EXCLUDED.monthly_limit, updated_at = NOW()
     RETURNING *`,
    [owner, category, monthlyLimit, month, year]
  );
  return rows[0];
}

export async function removeBudget(owner, id) {
  const { rows } = await query("DELETE FROM budgets WHERE owner = $1 AND id = $2 RETURNING id", [owner, id]);
  return rows.length > 0;
}

export async function listGoals(owner) {
  const { rows } = await query("SELECT * FROM savings_goals WHERE owner = $1 ORDER BY target_date NULLS LAST, created_at", [owner]);
  return rows.map(mapGoal);
}

export async function createGoal(owner, goal) {
  const { rows } = await query(
    `INSERT INTO savings_goals (owner, name, target_amount, saved_amount, target_date)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [owner, goal.name, goal.targetAmount, goal.savedAmount ?? 0, goal.targetDate ?? null]
  );
  return mapGoal(rows[0]);
}

export async function updateGoal(owner, id, changes) {
  const columns = { name: "name", targetAmount: "target_amount", savedAmount: "saved_amount", targetDate: "target_date" };
  const values = [owner, id];
  const assignments = [];
  for (const [field, column] of Object.entries(columns)) {
    if (changes[field] !== undefined) {
      values.push(changes[field]);
      assignments.push(`${column} = $${values.length}`);
    }
  }
  const { rows } = await query(
    `UPDATE savings_goals SET ${assignments.join(", ")}, updated_at = NOW()
     WHERE owner = $1 AND id = $2 RETURNING *`,
    values
  );
  return mapGoal(rows[0]);
}

export async function removeGoal(owner, id) {
  const { rows } = await query("DELETE FROM savings_goals WHERE owner = $1 AND id = $2 RETURNING id", [owner, id]);
  return rows.length > 0;
}

export async function listDebts(owner) {
  const { rows } = await query("SELECT * FROM debts WHERE owner = $1 ORDER BY due_date NULLS LAST, created_at", [owner]);
  return rows.map(mapDebt);
}

export async function createDebt(owner, debt) {
  const { rows } = await query(
    `INSERT INTO debts (owner, name, debt_type, balance, credit_limit, minimum_payment, due_date)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [owner, debt.name, debt.debtType, debt.balance, debt.creditLimit ?? null, debt.minimumPayment ?? 0, debt.dueDate ?? null]
  );
  return mapDebt(rows[0]);
}

export async function updateDebt(owner, id, changes) {
  const columns = { name: "name", debtType: "debt_type", balance: "balance", creditLimit: "credit_limit", minimumPayment: "minimum_payment", dueDate: "due_date" };
  const values = [owner, id];
  const assignments = [];
  for (const [field, column] of Object.entries(columns)) {
    if (changes[field] !== undefined) {
      values.push(changes[field]);
      assignments.push(`${column} = $${values.length}`);
    }
  }
  const { rows } = await query(
    `UPDATE debts SET ${assignments.join(", ")}, updated_at = NOW()
     WHERE owner = $1 AND id = $2 RETURNING *`,
    values
  );
  return mapDebt(rows[0]);
}

export async function removeDebt(owner, id) {
  const { rows } = await query("DELETE FROM debts WHERE owner = $1 AND id = $2 RETURNING id", [owner, id]);
  return rows.length > 0;
}

export async function getNetWorth(owner) {
  const { rows } = await query(
    `SELECT
       COALESCE(SUM(CASE WHEN account_type NOT IN ('credit_card', 'loan') THEN balance ELSE 0 END), 0)::FLOAT8 AS assets,
       COALESCE(SUM(CASE WHEN account_type IN ('credit_card', 'loan') THEN balance ELSE 0 END), 0)::FLOAT8 AS account_liabilities
     FROM (
       SELECT a.account_type,
         a.opening_balance
           + COALESCE(SUM(CASE
               WHEN a.account_type IN ('credit_card', 'loan') AND t.type = 'income' THEN -t.amount
               WHEN a.account_type IN ('credit_card', 'loan') AND t.type = 'expense' THEN t.amount
               WHEN a.account_type IN ('credit_card', 'loan') AND t.type = 'transfer' AND t.account_id = a.id THEN t.amount
               WHEN a.account_type IN ('credit_card', 'loan') AND t.type = 'transfer' AND t.transfer_account_id = a.id THEN -t.amount
               WHEN t.type = 'income' THEN t.amount
               WHEN t.type = 'expense' THEN -t.amount
               WHEN t.type = 'transfer' AND t.account_id = a.id THEN -t.amount
               WHEN t.type = 'transfer' AND t.transfer_account_id = a.id THEN t.amount
               ELSE 0
             END), 0) AS balance
       FROM accounts a
       LEFT JOIN transactions t
         ON t.owner = a.owner AND (t.account_id = a.id OR t.transfer_account_id = a.id)
       WHERE a.owner = $1
       GROUP BY a.id
     ) account_balances`,
    [owner]
  );
  const debtTotals = await query("SELECT COALESCE(SUM(balance), 0)::FLOAT8 AS debts FROM debts WHERE owner = $1", [owner]);
  const assets = rows[0].assets;
  const liabilities = rows[0].account_liabilities + debtTotals.rows[0].debts;
  return { assets, liabilities, netWorth: assets - liabilities };
}

export async function getMonthlyComparisons(owner, year, month, count) {
  const { rows } = await query(
    `WITH months AS (
       SELECT generate_series(
         make_date($2, $3, 1) - (($4::INTEGER - 1) * INTERVAL '1 month'),
         make_date($2, $3, 1),
         INTERVAL '1 month'
       )::DATE AS month_start
     )
     SELECT EXTRACT(YEAR FROM m.month_start)::INTEGER AS year,
       EXTRACT(MONTH FROM m.month_start)::INTEGER AS month,
       COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'income'), 0)::FLOAT8 AS income,
       COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'expense'), 0)::FLOAT8 AS expense
     FROM months m
     LEFT JOIN transactions t ON t.owner = $1
       AND t.date >= m.month_start
       AND t.date < m.month_start + INTERVAL '1 month'
     GROUP BY m.month_start
     ORDER BY m.month_start`,
    [owner, year, month, count]
  );
  return rows;
}

export async function importTransactions(owner, transactions) {
  return withDatabaseTransaction(async (client) => {
    const saved = [];
    for (const transaction of transactions) {
      const { rows } = await client.query(
        `INSERT INTO transactions (owner, title, amount, type, category, date, account_id, transfer_account_id, cost_type)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [
          owner,
          transaction.title,
          transaction.amount,
          transaction.type,
          transaction.category,
          transaction.date,
          transaction.accountId ?? null,
          transaction.transferAccountId ?? null,
          transaction.costType ?? "variable"
        ]
      );
      saved.push(rows[0]);
    }
    return saved;
  });
}
