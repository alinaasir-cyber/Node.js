import { getTransactionOverview } from "../models/Transaction.js";
import { countUsers } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAdminOverview = asyncHandler(async (req, res) => {
  const [totalUsers, { totals: transactionTotals, topExpenseCategories }] = await Promise.all([
    countUsers(),
    getTransactionOverview()
  ]);

  res.json({
    success: true,
    data: {
      totalUsers,
      totalTransactions: transactionTotals,
      topExpenseCategories
    }
  });
});
