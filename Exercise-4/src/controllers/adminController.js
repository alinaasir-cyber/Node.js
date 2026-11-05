import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAdminOverview = asyncHandler(async (req, res) => {
  const [totalUsers, totals, topExpenseCategories] = await Promise.all([
    User.countDocuments(),
    Transaction.aggregate([
      { $group: { _id: "$type", total: { $sum: "$amount" } } }
    ]),
    Transaction.aggregate([
      { $match: { type: "expense" } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } },
      { $limit: 5 }
    ])
  ]);

  const transactionTotals = totals.reduce((result, row) => {
    result[row._id] = row.total;
    return result;
  }, { income: 0, expense: 0 });

  res.json({
    success: true,
    data: {
      totalUsers,
      totalTransactions: transactionTotals,
      topExpenseCategories: topExpenseCategories.map(({ _id, total }) => ({
        category: _id,
        total
      }))
    }
  });
});
