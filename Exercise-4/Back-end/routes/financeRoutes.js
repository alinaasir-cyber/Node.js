import { Router } from "express";
import {
  createAccount,
  deleteBudget,
  deleteDebt,
  deleteGoal,
  getAccounts,
  getBudgets,
  getDebts,
  getGoals,
  getMonthlyComparison,
  getNetWorthOverview,
  importCsvTransactions,
  patchAccount,
  patchDebt,
  patchGoal,
  postDebt,
  postGoal,
  putBudget,
  removeAccount
} from "../controllers/financeController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  accountIdSchema,
  budgetsQuerySchema,
  createAccountSchema,
  createDebtSchema,
  createGoalSchema,
  importTransactionsSchema,
  monthlyComparisonSchema,
  saveBudgetSchema,
  updateAccountSchema,
  updateDebtSchema,
  updateGoalSchema
} from "../validators/finance.js";

const router = Router();

router.use("/accounts", requireAuth);
router.route("/accounts")
  .get(getAccounts)
  .post(validate(createAccountSchema), createAccount);
router.route("/accounts/:id")
  .put(validate(updateAccountSchema), patchAccount)
  .delete(validate(accountIdSchema), removeAccount);
router.use("/budgets", requireAuth);
router.route("/budgets")
  .get(validate(budgetsQuerySchema), getBudgets)
  .put(validate(saveBudgetSchema), putBudget);
router.delete("/budgets/:id", validate(accountIdSchema), deleteBudget);
router.use("/goals", requireAuth);
router.route("/goals")
  .get(getGoals)
  .post(validate(createGoalSchema), postGoal);
router.route("/goals/:id")
  .put(validate(updateGoalSchema), patchGoal)
  .delete(validate(accountIdSchema), deleteGoal);
router.use("/debts", requireAuth);
router.route("/debts")
  .get(getDebts)
  .post(validate(createDebtSchema), postDebt);
router.route("/debts/:id")
  .put(validate(updateDebtSchema), patchDebt)
  .delete(validate(accountIdSchema), deleteDebt);
router.get("/net-worth", requireAuth, getNetWorthOverview);
router.get("/monthly-comparison", requireAuth, validate(monthlyComparisonSchema), getMonthlyComparison);
router.post("/transactions/import", requireAuth, validate(importTransactionsSchema), importCsvTransactions);

export default router;
