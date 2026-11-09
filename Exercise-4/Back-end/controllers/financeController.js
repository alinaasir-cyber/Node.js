import {
  createAccount as insertAccount,
  createDebt as insertDebt,
  createGoal as insertGoal,
  deleteAccount,
  getMonthlyComparisons,
  getNetWorth,
  importTransactions,
  listAccounts,
  listBudgets,
  listDebts,
  listGoals,
  removeBudget,
  removeDebt,
  removeGoal,
  saveBudget,
  updateAccount,
  updateDebt,
  updateGoal
} from "../models/Finance.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { parseTransactionsCsv } from "../utils/parseTransactionsCsv.js";

export const getAccounts = asyncHandler(async (req, res) => {
  const accounts = await listAccounts(req.user.id);
  res.json({ success: true, data: { accounts } });
});

export const createAccount = asyncHandler(async (req, res) => {
  const account = await insertAccount(req.user.id, req.validated.body);
  res.status(201).json({ success: true, data: { account } });
});

export const patchAccount = asyncHandler(async (req, res) => {
  const account = await updateAccount(req.user.id, req.validated.params.id, req.validated.body);
  if (!account) throw new AppError("Account not found", 404);
  res.json({ success: true, data: { account } });
});

export const removeAccount = asyncHandler(async (req, res) => {
  const result = await deleteAccount(req.user.id, req.validated.params.id);
  if (result.referenced) throw new AppError("Delete or reassign this account's transactions first", 409);
  if (!result.deleted) throw new AppError("Account not found", 404);
  res.json({ success: true, message: "Account deleted" });
});

export const getBudgets = asyncHandler(async (req, res) => {
  const { month, year } = req.validated.query;
  const budgets = await listBudgets(req.user.id, month, year);
  res.json({ success: true, data: { budgets, month, year } });
});

export const putBudget = asyncHandler(async (req, res) => {
  const budget = await saveBudget(req.user.id, req.validated.body);
  res.status(200).json({ success: true, data: { budget } });
});

export const deleteBudget = asyncHandler(async (req, res) => {
  const deleted = await removeBudget(req.user.id, req.validated.params.id);
  if (!deleted) throw new AppError("Budget not found", 404);
  res.json({ success: true, message: "Budget deleted" });
});

export const getGoals = asyncHandler(async (req, res) => {
  const goals = await listGoals(req.user.id);
  res.json({ success: true, data: { goals } });
});

export const postGoal = asyncHandler(async (req, res) => {
  const goal = await insertGoal(req.user.id, req.validated.body);
  res.status(201).json({ success: true, data: { goal } });
});

export const patchGoal = asyncHandler(async (req, res) => {
  const goal = await updateGoal(req.user.id, req.validated.params.id, req.validated.body);
  if (!goal) throw new AppError("Savings goal not found", 404);
  res.json({ success: true, data: { goal } });
});

export const deleteGoal = asyncHandler(async (req, res) => {
  const deleted = await removeGoal(req.user.id, req.validated.params.id);
  if (!deleted) throw new AppError("Savings goal not found", 404);
  res.json({ success: true, message: "Savings goal deleted" });
});

export const getDebts = asyncHandler(async (req, res) => {
  const debts = await listDebts(req.user.id);
  res.json({ success: true, data: { debts } });
});

export const postDebt = asyncHandler(async (req, res) => {
  const debt = await insertDebt(req.user.id, req.validated.body);
  res.status(201).json({ success: true, data: { debt } });
});

export const patchDebt = asyncHandler(async (req, res) => {
  const debt = await updateDebt(req.user.id, req.validated.params.id, req.validated.body);
  if (!debt) throw new AppError("Debt not found", 404);
  res.json({ success: true, data: { debt } });
});

export const deleteDebt = asyncHandler(async (req, res) => {
  const deleted = await removeDebt(req.user.id, req.validated.params.id);
  if (!deleted) throw new AppError("Debt not found", 404);
  res.json({ success: true, message: "Debt deleted" });
});

export const getNetWorthOverview = asyncHandler(async (req, res) => {
  const netWorth = await getNetWorth(req.user.id);
  res.json({ success: true, data: netWorth });
});

export const getMonthlyComparison = asyncHandler(async (req, res) => {
  const { year, month, count } = req.validated.query;
  const months = await getMonthlyComparisons(req.user.id, year, month, count);
  res.json({
    success: true,
    data: {
      months: months.map((item) => ({
        ...item,
        balance: Number(item.income) - Number(item.expense)
      }))
    }
  });
});

export const importCsvTransactions = asyncHandler(async (req, res) => {
  const accounts = await listAccounts(req.user.id);
  let transactions;
  try {
    transactions = parseTransactionsCsv(req.validated.body.csv, accounts);
  } catch (error) {
    throw new AppError(error.message, 400);
  }
  const imported = await importTransactions(req.user.id, transactions);
  res.status(201).json({
    success: true,
    data: { imported: imported.length },
    message: `${imported.length} transactions imported`
  });
});
