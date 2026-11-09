import test from "node:test";
import assert from "node:assert/strict";
import { parseTransactionsCsv } from "../Back-end/utils/parseTransactionsCsv.js";
import {
  createAccountSchema,
  createDebtSchema,
  createGoalSchema,
  saveBudgetSchema
} from "../Back-end/validators/finance.js";
import { createTransactionSchema } from "../Back-end/validators/transactions.js";

test("transaction transfers require two different account IDs", () => {
  const accountId = "a0b1c2d3-e4f5-4678-9012-abcdefabcdef";
  const otherAccountId = "a0b1c2d3-e4f5-4678-9012-abcdefabcdea";
  const base = { title: "Move savings", amount: 25, type: "transfer", category: "Transfer" };

  assert.equal(createTransactionSchema.safeParse({
    body: { ...base, accountId, transferAccountId: otherAccountId }
  }).success, true);
  assert.equal(createTransactionSchema.safeParse({
    body: { ...base, accountId }
  }).success, false);
  assert.equal(createTransactionSchema.safeParse({
    body: { ...base, accountId, transferAccountId: accountId }
  }).success, false);
});

test("account, budget, savings goal, and debt inputs validate", () => {
  assert.equal(createAccountSchema.safeParse({
    body: { name: "Everyday", accountType: "checking", openingBalance: 150 }
  }).success, true);
  assert.equal(createAccountSchema.safeParse({
    body: { name: "Unknown", accountType: "crypto" }
  }).success, false);
  assert.equal(saveBudgetSchema.safeParse({
    body: { category: "Food", monthlyLimit: 400, month: 11, year: 2026 }
  }).success, true);
  assert.equal(createGoalSchema.safeParse({
    body: { name: "Emergency fund", targetAmount: 1000, savedAmount: 200 }
  }).success, true);
  assert.equal(createDebtSchema.safeParse({
    body: { name: "Card", debtType: "credit_card", balance: 500, creditLimit: 2000 }
  }).success, true);
});

test("CSV import parses quoted descriptions and account references", () => {
  const accountId = "a0b1c2d3-e4f5-4678-9012-abcdefabcdef";
  const rows = parseTransactionsCsv(
    'date,description,amount,type,category,account,cost_type\r\n2026-11-02,"Market, groceries",42.50,expense,Food,Everyday,fixed\r\n',
    [{ id: accountId, name: "Everyday" }]
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].title, "Market, groceries");
  assert.equal(rows[0].accountId, accountId);
  assert.equal(rows[0].costType, "fixed");
});

test("CSV import rejects invalid rows before importing any data", () => {
  assert.throws(
    () => parseTransactionsCsv("date,description,amount,type,category\n2026-11-02,Bad,-1,expense,Food\n"),
    /Line 2: amount must be a positive number/
  );
  assert.throws(
    () => parseTransactionsCsv("date,description,amount,type,category\n"),
    /at least one transaction/
  );
});
