import test from "node:test";
import assert from "node:assert/strict";
import { loginSchema, registerSchema } from "../Back-end/validators/auth.js";
import {
  createTransactionSchema,
  listTransactionsSchema,
  monthlySummarySchema,
  updateTransactionSchema
} from "../Back-end/validators/transactions.js";
import {
  createTaskSchema,
  taskIdSchema,
  updateTaskSchema
} from "../Back-end/validators/tasks.js";

test("registration trims names and normalizes email", () => {
  const result = registerSchema.safeParse({
    body: { name: "  Amina  ", email: "AMINA@example.com", password: "password123" }
  });

  assert.equal(result.success, true);
  assert.deepEqual(result.data.body, {
    name: "Amina",
    email: "amina@example.com",
    password: "password123"
  });
});

test("registration rejects short passwords and invalid email addresses", () => {
  assert.equal(registerSchema.safeParse({
    body: { name: "Amina", email: "not-an-email", password: "short" }
  }).success, false);
});

test("login accepts a valid email and password", () => {
  assert.equal(loginSchema.safeParse({
    body: { email: "amina@example.com", password: "password123" }
  }).success, true);
});

test("transaction amounts must be positive and transaction type is constrained", () => {
  const valid = {
    body: { title: "Groceries", amount: 50, type: "expense", category: "Food" }
  };
  assert.equal(createTransactionSchema.safeParse(valid).success, true);
  assert.equal(createTransactionSchema.safeParse({
    body: { ...valid.body, amount: -50 }
  }).success, false);
  assert.equal(createTransactionSchema.safeParse({
    body: { ...valid.body, type: "refund" }
  }).success, false);
});

test("transaction list pagination defaults and enforces a maximum page size", () => {
  const result = listTransactionsSchema.safeParse({ query: {} });
  assert.equal(result.success, true);
  assert.equal(result.data.query.page, 1);
  assert.equal(result.data.query.limit, 20);
  assert.equal(listTransactionsSchema.safeParse({ query: { limit: 101 } }).success, false);
});

test("monthly summary requires a valid month and year", () => {
  assert.equal(monthlySummarySchema.safeParse({ query: { year: "2025", month: "5" } }).success, true);
  assert.equal(monthlySummarySchema.safeParse({ query: { year: "2025", month: "13" } }).success, false);
});

test("transaction updates reject empty bodies and malformed identifiers", () => {
  assert.equal(updateTransactionSchema.safeParse({
    params: { id: "a0b1c2d3-e4f5-4678-9012-abcdefabcdef" },
    body: { title: "Updated" }
  }).success, true);
  assert.equal(updateTransactionSchema.safeParse({
    params: { id: "0123456789abcdef01234567" },
    body: { title: "Updated" }
  }).success, false);
  assert.equal(updateTransactionSchema.safeParse({
    params: { id: "a0b1c2d3-e4f5-4678-9012-abcdefabcdef" },
    body: {}
  }).success, false);
});

test("task creation requires a non-empty title and trims whitespace", () => {
  const result = createTaskSchema.safeParse({ body: { title: "  Study React  " } });
  assert.equal(result.success, true);
  assert.deepEqual(result.data.body, { title: "Study React" });
  assert.equal(createTaskSchema.safeParse({ body: { title: "   " } }).success, false);
});

test("task updates validate identifiers and require at least one field", () => {
  assert.equal(updateTaskSchema.safeParse({
    params: { id: "a0b1c2d3-e4f5-4678-9012-abcdefabcdef" },
    body: { completed: true }
  }).success, true);
  assert.equal(updateTaskSchema.safeParse({
    params: { id: "0123456789abcdef01234567" },
    body: { completed: true }
  }).success, false);
  assert.equal(updateTaskSchema.safeParse({
    params: { id: "a0b1c2d3-e4f5-4678-9012-abcdefabcdef" },
    body: {}
  }).success, false);
  assert.equal(taskIdSchema.safeParse({
    params: { id: "a0b1c2d3-e4f5-4678-9012-abcdefabcdef" }
  }).success, true);
});
