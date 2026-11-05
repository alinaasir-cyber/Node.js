import { Transaction } from "../models/Transaction.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.create({
    ...req.validated.body,
    owner: req.user.id
  });
  res.status(201).json({ success: true, data: { transaction } });
});

export const listTransactions = asyncHandler(async (req, res) => {
  const { type, category, from, to, page, limit } = req.validated.query;
  const filter = { owner: req.user.id };
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = from;
    if (to) filter.date.$lte = to;
  }

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .sort({ date: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Transaction.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: { transactions, pagination: { page, limit, total, pages: Math.ceil(total / limit) } }
  });
});

export const updateTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOneAndUpdate(
    { _id: req.validated.params.id, owner: req.user.id },
    req.validated.body,
    { new: true, runValidators: true }
  );
  if (!transaction) throw new AppError("Transaction not found", 404);
  res.json({ success: true, data: { transaction } });
});

export const deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findOneAndDelete({
    _id: req.validated.params.id,
    owner: req.user.id
  });
  if (!transaction) throw new AppError("Transaction not found", 404);
  res.json({ success: true, message: "Transaction deleted" });
});

export const monthlySummary = asyncHandler(async (req, res) => {
  const { year, month } = req.validated.query;
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  const [totals = { income: 0, expense: 0 }, categories] = await Promise.all([
    Transaction.aggregate([
      { $match: { owner: req.user._id, date: { $gte: start, $lt: end } } },
      { $group: { _id: "$type", total: { $sum: "$amount" } } }
    ]).then((rows) => rows.reduce((result, row) => {
      result[row._id] = row.total;
      return result;
    }, { income: 0, expense: 0 })),
    Transaction.aggregate([
      {
        $match: {
          owner: req.user._id,
          type: "expense",
          date: { $gte: start, $lt: end }
        }
      },
      { $group: { _id: "$category", total: { $sum: "$amount" } } },
      { $sort: { total: -1 } }
    ])
  ]);

  res.json({
    success: true,
    data: {
      year,
      month,
      income: totals.income,
      expense: totals.expense,
      balance: totals.income - totals.expense,
      expensesByCategory: categories.map(({ _id, total }) => ({ category: _id, total }))
    }
  });
});
