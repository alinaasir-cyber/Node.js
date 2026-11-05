import { Router } from "express";
import {
  createTransaction,
  deleteTransaction,
  listTransactions,
  monthlySummary,
  updateTransaction
} from "../controllers/transactionController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  createTransactionSchema,
  listTransactionsSchema,
  monthlySummarySchema,
  transactionIdSchema,
  updateTransactionSchema
} from "../validators/transactions.js";

const router = Router();

router.use(requireAuth);
router.get("/monthly-summary", validate(monthlySummarySchema), monthlySummary);
router.route("/")
  .post(validate(createTransactionSchema), createTransaction)
  .get(validate(listTransactionsSchema), listTransactions);
router.route("/:id")
  .put(validate(updateTransactionSchema), updateTransaction)
  .delete(validate(transactionIdSchema), deleteTransaction);

export default router;
