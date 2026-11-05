import { z } from "zod";

const transactionFields = {
  title: z.string().trim().min(1).max(120),
  amount: z.coerce.number().positive().finite(),
  type: z.enum(["income", "expense"]),
  category: z.string().trim().min(1).max(60),
  date: z.coerce.date()
};

export const createTransactionSchema = z.object({
  body: z.object({
    ...transactionFields,
    date: transactionFields.date.optional()
  })
});

export const updateTransactionSchema = z.object({
  params: z.object({ id: z.string().regex(/^[a-f\d]{24}$/i) }),
  body: z.object({
    title: transactionFields.title.optional(),
    amount: transactionFields.amount.optional(),
    type: transactionFields.type.optional(),
    category: transactionFields.category.optional(),
    date: transactionFields.date.optional()
  }).refine((body) => Object.keys(body).length > 0, "Provide at least one field to update")
});

export const transactionIdSchema = z.object({
  params: z.object({ id: z.string().regex(/^[a-f\d]{24}$/i) })
});

export const listTransactionsSchema = z.object({
  query: z.object({
    type: z.enum(["income", "expense"]).optional(),
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
