import {
  createTransaction as insertTransaction,
  deleteTransactionForOwner,
  findTransactions,
  getMonthlySummary,
  updateTransactionForOwner
} from "../models/Transaction.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createTransaction = asyncHandler(async (req, res) => {
  const transaction = await insertTransaction({
    ...req.validated.body,
    owner: req.user.id
  });
  res.status(201).json({ success: true, data: { transaction } });
});

export const listTransactions = asyncHandler(async (req, res) => {
  const { page, limit } = req.validated.query;
  const { transactions, total } = await findTransactions({
    owner: req.user.id,
    ...req.validated.query
  });

  res.json({
    success: true,
    data: { transactions, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }
  });
});

export const updateTransaction = asyncHandler(async (req, res) => {
  const transaction = await updateTransactionForOwner(
    req.validated.params.id,
    req.user.id,
    req.validated.body
  );
  if (!transaction) throw new AppError("Transaction not found", 404);
  res.json({ success: true, data: { transaction } });
});

export const deleteTransaction = asyncHandler(async (req, res) => {
  const deleted = await deleteTransactionForOwner(req.validated.params.id, req.user.id);
  if (!deleted) throw new AppError("Transaction not found", 404);
  res.json({ success: true, message: "Transaction deleted" });
});

export const monthlySummary = asyncHandler(async (req, res) => {
  const { year, month } = req.validated.query;
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  const { totals, categories, costsByType } = await getMonthlySummary(req.user.id, start, end);

  res.json({
    success: true,
    data: {
      year,
      month,
      income: totals.income,
      expense: totals.expense,
      balance: totals.income - totals.expense,
      expensesByCategory: categories.map(({ category, total }) => ({ category, total })),
      expensesByType: costsByType
    }
  });
});
