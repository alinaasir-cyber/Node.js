import { query, withDatabaseTransaction } from "../config/database.js";

function mapTransaction(row) {
  if (!row) return null;
  return {
    _id: row.id,
    owner: row.owner,
    title: row.title,
    amount: Number(row.amount),
    type: row.type,
    category: row.category,
    date: row.date,
    accountId: row.account_id,
    transferAccountId: row.transfer_account_id,
    costType: row.cost_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function validateAccounts(client, owner, transaction) {
  const accountIds = [...new Set([transaction.accountId, transaction.transferAccountId].filter(Boolean))];
  if (transaction.type === "transfer" && (!transaction.accountId || !transaction.transferAccountId)) {
    const error = new Error("A transfer requires source and destination accounts");
    error.statusCode = 400;
    throw error;
  }
  if (transaction.type !== "transfer" && transaction.transferAccountId) {
    const error = new Error("Only transfers can have a destination account");
    error.statusCode = 400;
    throw error;
  }
  if (transaction.type === "transfer" && transaction.accountId === transaction.transferAccountId) {
    const error = new Error("Transfer accounts must be different");
    error.statusCode = 400;
    throw error;
  }
  if (!accountIds.length) return;
  const { rows } = await client.query(
    "SELECT id FROM accounts WHERE owner = $1 AND id = ANY($2::UUID[])",
    [owner, accountIds]
  );
  if (rows.length !== accountIds.length) {
    const error = new Error("One or more accounts were not found");
    error.statusCode = 400;
    throw error;
  }
}

export async function createTransaction({ owner, title, amount, type, category, date, accountId, transferAccountId, costType }) {
  return withDatabaseTransaction(async (client) => {
    const transaction = { type, accountId, transferAccountId };
    await validateAccounts(client, owner, transaction);
    const { rows } = await client.query(
      `INSERT INTO transactions (owner, title, amount, type, category, date, account_id, transfer_account_id, cost_type)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, NOW()), $7, $8, $9)
       RETURNING *`,
      [owner, title, amount, type, category, date ?? null, accountId ?? null, transferAccountId ?? null, costType ?? "variable"]
    );
    return mapTransaction(rows[0]);
  });
}

export async function findTransactions({ owner, type, category, from, to, page, limit }) {
  const conditions = ["owner = $1"];
  const values = [owner];
  for (const [field, value] of [["type", type], ["category", category]]) {
    if (value !== undefined) {
      values.push(value);
      conditions.push(`${field} = $${values.length}`);
    }
  }
  if (from) {
    values.push(from);
    conditions.push(`date >= $${values.length}`);
  }
  if (to) {
    values.push(to);
    conditions.push(`date <= $${values.length}`);
  }
  const where = conditions.join(" AND ");
  const offset = (page - 1) * limit;
  const [transactions, total] = await Promise.all([
    query(
      `SELECT * FROM transactions
       WHERE ${where}
       ORDER BY date DESC, id DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, limit, offset]
    ),
    query(`SELECT COUNT(*)::INTEGER AS count FROM transactions WHERE ${where}`, values)
  ]);
  return {
    transactions: transactions.rows.map(mapTransaction),
    total: total.rows[0].count
  };
}

export async function updateTransactionForOwner(id, owner, changes) {
  return withDatabaseTransaction(async (client) => {
    const existing = await client.query("SELECT * FROM transactions WHERE id = $1 AND owner = $2 FOR UPDATE", [id, owner]);
    if (!existing.rows[0]) return null;
    const row = existing.rows[0];
    const updatedValues = { ...changes };
    const merged = {
      type: changes.type ?? row.type,
      accountId: changes.accountId ?? row.account_id,
      transferAccountId: changes.transferAccountId ?? row.transfer_account_id
    };
    if (changes.type && changes.type !== "transfer" && changes.transferAccountId === undefined) {
      merged.transferAccountId = null;
      updatedValues.transferAccountId = null;
    }
    await validateAccounts(client, owner, merged);
    const columns = {
      title: "title",
      amount: "amount",
      type: "type",
      category: "category",
      date: "date",
      accountId: "account_id",
      transferAccountId: "transfer_account_id",
      costType: "cost_type"
    };
    const values = [id, owner];
    const assignments = [];
    for (const [key, column] of Object.entries(columns)) {
      const value = updatedValues[key];
      if (value !== undefined) {
        values.push(value);
        assignments.push(`${column} = $${values.length}`);
      }
    }
    if (!assignments.length) return mapTransaction(row);
    const { rows } = await client.query(
      `UPDATE transactions SET ${assignments.join(", ")}, updated_at = NOW()
       WHERE id = $1 AND owner = $2 RETURNING *`,
      values
    );
    return mapTransaction(rows[0]);
  });
}

export async function deleteTransactionForOwner(id, owner) {
  const { rows } = await query(
    "DELETE FROM transactions WHERE id = $1 AND owner = $2 RETURNING id",
    [id, owner]
  );
  return rows.length > 0;
}

export async function getMonthlySummary(owner, start, end) {
  const [totals, categories, costs] = await Promise.all([
    query(
      `SELECT type, COALESCE(SUM(amount), 0)::FLOAT8 AS total
       FROM transactions
       WHERE owner = $1 AND date >= $2 AND date < $3
       GROUP BY type`,
      [owner, start, end]
    ),
    query(
      `SELECT category, SUM(amount)::FLOAT8 AS total
       FROM transactions
       WHERE owner = $1 AND type = 'expense' AND date >= $2 AND date < $3
       GROUP BY category
       ORDER BY total DESC`,
      [owner, start, end]
    ),
    query(
      `SELECT cost_type, SUM(amount)::FLOAT8 AS total
       FROM transactions
       WHERE owner = $1 AND type = 'expense' AND date >= $2 AND date < $3
       GROUP BY cost_type`,
      [owner, start, end]
    )
  ]);
  return {
    totals: {
      income: 0,
      expense: 0,
      ...Object.fromEntries(totals.rows.map(({ type, total }) => [type, total]))
    },
    categories: categories.rows,
    costsByType: {
      fixed: 0,
      variable: 0,
      ...Object.fromEntries(costs.rows.map(({ cost_type, total }) => [cost_type, total]))
    }
  };
}

export async function getTransactionOverview() {
  const [totals, categories] = await Promise.all([
    query(
      `SELECT type, COALESCE(SUM(amount), 0)::FLOAT8 AS total
       FROM transactions
       GROUP BY type`
    ),
    query(
      `SELECT category, SUM(amount)::FLOAT8 AS total
       FROM transactions
       WHERE type = 'expense'
       GROUP BY category
       ORDER BY total DESC
       LIMIT 5`
    )
  ]);
  return {
    totals: {
      income: 0,
      expense: 0,
      ...Object.fromEntries(totals.rows.map(({ type, total }) => [type, total]))
    },
    topExpenseCategories: categories.rows
  };
}

export async function countTransactions() {
  const { rows } = await query("SELECT COUNT(*)::INTEGER AS count FROM transactions");
  return rows[0].count;
}
