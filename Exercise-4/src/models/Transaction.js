import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    amount: { type: Number, required: true, min: 0.01 },
    type: { type: String, enum: ["income", "expense"], required: true },
    category: { type: String, required: true, trim: true, maxlength: 60 },
    date: { type: Date, required: true, default: Date.now }
  },
  { timestamps: true }
);

transactionSchema.index({ owner: 1, date: -1 });

export const Transaction = mongoose.model("Transaction", transactionSchema);
