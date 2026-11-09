import { z } from "zod";

const transactionFields = {
  title: z.string().trim().min(1).max(120),
  amount: z.coerce.number().positive().finite(),
  type: z.enum(["income", "expense", "transfer"]),
  category: z.string().trim().min(1).max(60),
  date: z.coerce.date(),
  accountId: z.string().uuid().optional(),
  transferAccountId: z.string().uuid().optional(),
  costType: z.enum(["fixed", "variable"])
};

export const createTransactionSchema = z.object({
  body: z.object({
    ...transactionFields,
    date: transactionFields.date.optional(),
    costType: transactionFields.costType.default("variable")
  }).superRefine((body, context) => {
    if (body.type === "transfer") {
      if (!body.accountId || !body.transferAccountId) {
        context.addIssue({ code: "custom", path: ["accountId"], message: "A transfer requires source and destination accounts" });
      } else if (body.accountId === body.transferAccountId) {
        context.addIssue({ code: "custom", path: ["transferAccountId"], message: "Transfer accounts must be different" });
      }
    } else if (body.transferAccountId) {
      context.addIssue({ code: "custom", path: ["transferAccountId"], message: "Only transfers can have a destination account" });
    }
  })
});

export const updateTransactionSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: z.object({
    title: transactionFields.title.optional(),
    amount: transactionFields.amount.optional(),
    type: transactionFields.type.optional(),
    category: transactionFields.category.optional(),
    date: transactionFields.date.optional(),
    accountId: transactionFields.accountId,
    transferAccountId: transactionFields.transferAccountId,
    costType: transactionFields.costType.optional()
  }).refine((body) => Object.keys(body).length > 0, "Provide at least one field to update").superRefine((body, context) => {
    if (body.type === "transfer" && (!body.accountId || !body.transferAccountId)) {
      context.addIssue({ code: "custom", message: "A transfer requires source and destination accounts" });
    }
    if (body.accountId && body.transferAccountId && body.accountId === body.transferAccountId) {
      context.addIssue({ code: "custom", path: ["transferAccountId"], message: "Transfer accounts must be different" });
    }
    if (body.type && body.type !== "transfer" && body.transferAccountId) {
      context.addIssue({ code: "custom", path: ["transferAccountId"], message: "Only transfers can have a destination account" });
    }
  })
});

export const transactionIdSchema = z.object({
  params: z.object({ id: z.string().uuid() })
});

export const listTransactionsSchema = z.object({
  query: z.object({
    type: z.enum(["income", "expense", "transfer"]).optional(),
    category: z.string().trim().min(1).max(60).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20)
  }).refine((query) => !query.from || !query.to || query.from <= query.to, {
    message: "from must be earlier than or equal to to"
  })
});

export const monthlySummarySchema = z.object({
  query: z.object({
    year: z.coerce.number().int().min(2000).max(2200),
    month: z.coerce.number().int().min(1).max(12)
  })
});
