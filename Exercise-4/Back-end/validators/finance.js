import { z } from "zod";

const uuid = z.string().uuid();
const accountTypes = z.enum(["checking", "savings", "cash", "investment", "credit_card", "loan"]);
const debtTypes = z.enum(["credit_card", "loan", "other"]);
const category = z.string().trim().min(1).max(60);

export const accountIdSchema = z.object({ params: z.object({ id: uuid }) });

export const createAccountSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(80),
    accountType: accountTypes,
    institution: z.string().trim().max(80).optional(),
    openingBalance: z.coerce.number().finite().default(0),
    creditLimit: z.coerce.number().positive().optional()
  })
});

export const updateAccountSchema = z.object({
  params: z.object({ id: uuid }),
  body: z.object({
    name: z.string().trim().min(1).max(80).optional(),
    accountType: accountTypes.optional(),
    institution: z.string().trim().max(80).optional(),
    openingBalance: z.coerce.number().finite().optional(),
    creditLimit: z.coerce.number().positive().nullable().optional()
  }).refine((body) => Object.keys(body).length > 0, "Provide at least one field to update")
});

export const budgetsQuerySchema = z.object({
  query: z.object({
    month: z.coerce.number().int().min(1).max(12),
    year: z.coerce.number().int().min(2000).max(2200)
  })
});

export const saveBudgetSchema = z.object({
  body: z.object({
    category,
    monthlyLimit: z.coerce.number().positive().finite(),
    month: z.coerce.number().int().min(1).max(12),
    year: z.coerce.number().int().min(2000).max(2200)
  })
});

export const createGoalSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(80),
    targetAmount: z.coerce.number().positive().finite(),
    savedAmount: z.coerce.number().nonnegative().finite().default(0),
    targetDate: z.coerce.date().optional()
  })
});

export const updateGoalSchema = z.object({
  params: z.object({ id: uuid }),
  body: z.object({
    name: z.string().trim().min(1).max(80).optional(),
    targetAmount: z.coerce.number().positive().finite().optional(),
    savedAmount: z.coerce.number().nonnegative().finite().optional(),
    targetDate: z.coerce.date().nullable().optional()
  }).refine((body) => Object.keys(body).length > 0, "Provide at least one field to update")
});

export const createDebtSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(80),
    debtType: debtTypes,
    balance: z.coerce.number().nonnegative().finite(),
    creditLimit: z.coerce.number().positive().optional(),
    minimumPayment: z.coerce.number().nonnegative().finite().default(0),
    dueDate: z.coerce.date().optional()
  })
});

export const updateDebtSchema = z.object({
  params: z.object({ id: uuid }),
  body: z.object({
    name: z.string().trim().min(1).max(80).optional(),
    debtType: debtTypes.optional(),
    balance: z.coerce.number().nonnegative().finite().optional(),
    creditLimit: z.coerce.number().positive().nullable().optional(),
    minimumPayment: z.coerce.number().nonnegative().finite().optional(),
    dueDate: z.coerce.date().nullable().optional()
  }).refine((body) => Object.keys(body).length > 0, "Provide at least one field to update")
});

export const monthlyComparisonSchema = z.object({
  query: z.object({
    year: z.coerce.number().int().min(2000).max(2200),
    month: z.coerce.number().int().min(1).max(12),
    count: z.coerce.number().int().min(2).max(24).default(6)
  })
});

export const importTransactionsSchema = z.object({
  body: z.object({
    csv: z.string().min(1).max(1_000_000)
  })
});
