function parseRows(csv) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  const input = csv.replace(/^\uFEFF/, "");

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"' && input[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        value += character;
      }
    } else if (character === '"' && value.length === 0) {
      quoted = true;
    } else if (character === ",") {
      row.push(value.trim());
      value = "";
    } else if (character === "\n" || character === "\r") {
      row.push(value.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = "";
      if (character === "\r" && input[index + 1] === "\n") index += 1;
    } else {
      value += character;
    }
  }
  if (quoted) throw new Error("CSV contains an unclosed quoted field");
  row.push(value.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

export function parseTransactionsCsv(csv, accounts = []) {
  const rows = parseRows(csv);
  if (rows.length < 2) throw new Error("CSV must include a header and at least one transaction");

  const headers = rows[0].map((header) => header.trim().toLowerCase().replace(/[\s-]+/g, "_"));
  const required = ["date", "description", "amount", "type", "category"];
  const missing = required.filter((header) => !headers.includes(header));
  if (missing.length) {
    throw new Error(`CSV is missing required columns: ${missing.join(", ")}`);
  }
  if (headers.length !== new Set(headers).size) throw new Error("CSV contains duplicate column names");

  const accountByName = new Map(accounts.map((account) => [account.name.toLowerCase(), account.id]));
  const transactions = [];
  const errors = [];

  rows.slice(1).forEach((row, index) => {
    const line = index + 2;
    if (row.length !== headers.length) {
      errors.push(`Line ${line}: expected ${headers.length} columns, received ${row.length}`);
      return;
    }
    const record = Object.fromEntries(headers.map((header, column) => [header, row[column]]));
    const date = new Date(record.date);
    const amount = Number(record.amount);
    const type = record.type.toLowerCase();
    if (!record.description || record.description.length > 120) {
      errors.push(`Line ${line}: description is required and must be 120 characters or fewer`);
      return;
    }
    if (!Number.isFinite(date.getTime())) {
      errors.push(`Line ${line}: date is invalid`);
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      errors.push(`Line ${line}: amount must be a positive number`);
      return;
    }
    if (!["income", "expense", "transfer"].includes(type)) {
      errors.push(`Line ${line}: type must be income, expense, or transfer`);
      return;
    }
    if (!record.category || record.category.length > 60) {
      errors.push(`Line ${line}: category is required and must be 60 characters or fewer`);
      return;
    }
    if (record.cost_type && !["fixed", "variable"].includes(record.cost_type.toLowerCase())) {
      errors.push(`Line ${line}: cost_type must be fixed or variable`);
      return;
    }
    const accountId = record.account ? accountByName.get(record.account.toLowerCase()) : null;
    const transferAccountId = record.transfer_account
      ? accountByName.get(record.transfer_account.toLowerCase())
      : null;
    if (record.account && !accountId) {
      errors.push(`Line ${line}: account "${record.account}" was not found`);
      return;
    }
    if (record.transfer_account && !transferAccountId) {
      errors.push(`Line ${line}: transfer account "${record.transfer_account}" was not found`);
      return;
    }
    if (type === "transfer" && (!accountId || !transferAccountId || accountId === transferAccountId)) {
      errors.push(`Line ${line}: a transfer needs two different accounts`);
      return;
    }
    if (type !== "transfer" && transferAccountId) {
      errors.push(`Line ${line}: transfer_account can only be used for transfers`);
      return;
    }
    transactions.push({
      title: record.description,
      amount,
      type,
      category: record.category,
      costType: record.cost_type?.toLowerCase() === "fixed" ? "fixed" : "variable",
      date,
      accountId,
      transferAccountId
    });
  });

  if (errors.length) throw new Error(`CSV import failed:\n${errors.join("\n")}`);
  return transactions;
}
