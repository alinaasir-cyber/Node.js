const bearer = [{ bearerAuth: [] }];

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Personal Finance Tracker API",
    version: "1.0.0",
    description: "Track personal income and expenses. Amounts are positive; type determines income or expense."
  },
  servers: [
    { url: "/api/v1", description: "API v1" },
    { url: "/api", description: "Task API" }
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" }
    },
    schemas: {
      Transaction: {
        type: "object",
        required: ["title", "amount", "type", "category"],
        properties: {
          title: { type: "string", example: "Groceries" },
          amount: { type: "number", exclusiveMinimum: 0, example: 50 },
          type: { type: "string", enum: ["income", "expense", "transfer"] },
          category: { type: "string", example: "Food" },
            date: { type: "string", format: "date-time" },
            accountId: { type: "string", format: "uuid" },
            transferAccountId: { type: "string", format: "uuid" },
            costType: { type: "string", enum: ["fixed", "variable"] }
        }
      },
      Task: {
        type: "object",
        required: ["title"],
        properties: {
          title: { type: "string", example: "Finish the assignment" },
          completed: { type: "boolean", default: false }
        }
      }
    }
  },
  paths: {
    "/tasks": {
      servers: [{ url: "/api" }],
      get: {
        tags: ["Tasks"],
        summary: "List tasks",
        responses: { 200: { description: "Task list" } }
      },
      post: {
        tags: ["Tasks"],
        summary: "Create a task",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title"],
                properties: { title: { type: "string", minLength: 1, maxLength: 120 } }
              }
            }
          }
        },
        responses: { 201: { description: "Task created" }, 400: { description: "Invalid input" } }
      }
    },
    "/tasks/{id}": {
      servers: [{ url: "/api" }],
      patch: {
        tags: ["Tasks"],
        summary: "Update a task",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string", minLength: 1, maxLength: 120 },
                  completed: { type: "boolean" }
                }
              }
            }
          }
        },
        responses: { 200: { description: "Task updated" }, 404: { description: "Task not found" } }
      },
      delete: {
        tags: ["Tasks"],
        summary: "Delete a task",
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Task deleted" }, 404: { description: "Task not found" } }
      }
    },
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", minLength: 2 },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 }
                }
              }
            }
          }
        },
        responses: { 201: { description: "Account created with JWT" }, 409: { description: "Email already registered" } }
      }
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: { email: { type: "string", format: "email" }, password: { type: "string" } }
              }
            }
          }
        },
        responses: { 200: { description: "Authenticated with JWT" }, 401: { description: "Invalid credentials" } }
      }
    },
    "/auth/profile": {
      get: {
        tags: ["Auth"],
        summary: "Get the current user's profile",
        security: bearer,
        responses: { 200: { description: "User profile" }, 401: { description: "Authentication required" } }
      }
    },
    "/transactions": {
      get: {
        tags: ["Transactions"],
        summary: "List the current user's transactions",
        security: bearer,
        parameters: [
          { in: "query", name: "type", schema: { type: "string", enum: ["income", "expense"] } },
          { in: "query", name: "category", schema: { type: "string" } },
          { in: "query", name: "from", schema: { type: "string", format: "date-time" } },
          { in: "query", name: "to", schema: { type: "string", format: "date-time" } },
          { in: "query", name: "page", schema: { type: "integer", minimum: 1 } },
          { in: "query", name: "limit", schema: { type: "integer", minimum: 1, maximum: 100 } }
        ],
        responses: { 200: { description: "Paginated transaction list" } }
      },
      post: {
        tags: ["Transactions"],
        summary: "Create a transaction",
        security: bearer,
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/Transaction" } }
          }
        },
        responses: { 201: { description: "Transaction created" }, 400: { description: "Invalid input" } }
      }
    },
    "/transactions/monthly-summary": {
      get: {
        tags: ["Transactions"],
        summary: "Get income, expenses, balance, and expense totals per category for a month",
        security: bearer,
        parameters: [
          { in: "query", name: "year", required: true, schema: { type: "integer", example: 2025 } },
          { in: "query", name: "month", required: true, schema: { type: "integer", minimum: 1, maximum: 12, example: 5 } }
        ],
        responses: { 200: { description: "Monthly summary" } }
      }
    },
    "/transactions/{id}": {
      put: {
        tags: ["Transactions"],
        summary: "Update one of the current user's transactions",
        security: bearer,
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  amount: { type: "number", exclusiveMinimum: 0 },
                  type: { type: "string", enum: ["income", "expense"] },
                  category: { type: "string" },
                  date: { type: "string", format: "date-time" }
                }
              }
            }
          }
        },
        responses: { 200: { description: "Transaction updated" }, 404: { description: "Transaction not found" } }
      },
      delete: {
        tags: ["Transactions"],
        summary: "Delete one of the current user's transactions",
        security: bearer,
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Transaction deleted" }, 404: { description: "Transaction not found" } }
      }
    },
    "/categories": {
      get: {
        tags: ["Transactions"],
        summary: "List predefined income and expense categories",
        security: bearer,
        responses: { 200: { description: "Categories grouped by type" } }
      }
    },
    "/upload/profile-picture": {
      post: {
        tags: ["Upload"],
        summary: "Upload a profile picture to Cloudinary",
        security: bearer,
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: { type: "object", required: ["image"], properties: { image: { type: "string", format: "binary" } } }
            }
          }
        },
        responses: { 200: { description: "Profile picture updated" }, 503: { description: "Cloudinary not configured" } }
      }
    },
    "/admin/overview": {
      get: {
        tags: ["Admin"],
        summary: "Get total users, transaction totals, and top expense categories",
        security: bearer,
        responses: { 200: { description: "Admin overview" }, 403: { description: "Admin access required" } }
      }
    },
    "/accounts": {
      get: {
        tags: ["Accounts"],
        summary: "List manually tracked accounts and current balances",
        security: bearer,
        responses: { 200: { description: "Account list" } }
      },
      post: {
        tags: ["Accounts"],
        summary: "Add a manually tracked account",
        security: bearer,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "accountType"],
                properties: {
                  name: { type: "string", maxLength: 80 },
                  accountType: { type: "string", enum: ["checking", "savings", "cash", "investment", "credit_card", "loan"] },
                  institution: { type: "string", maxLength: 80 },
                  openingBalance: { type: "number" },
                  creditLimit: { type: "number", exclusiveMinimum: 0 }
                }
              }
            }
          }
        },
        responses: { 201: { description: "Account created" } }
      }
    },
    "/accounts/{id}": {
      put: {
        tags: ["Accounts"],
        summary: "Update an account",
        security: bearer,
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Account updated" }, 404: { description: "Account not found" } }
      },
      delete: {
        tags: ["Accounts"],
        summary: "Delete an account with no linked transactions",
        security: bearer,
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Account deleted" }, 409: { description: "Reassign linked transactions first" } }
      }
    },
    "/budgets": {
      get: {
        tags: ["Budgets"],
        summary: "List category budgets and current monthly spending",
        security: bearer,
        parameters: [
          { in: "query", name: "year", required: true, schema: { type: "integer" } },
          { in: "query", name: "month", required: true, schema: { type: "integer", minimum: 1, maximum: 12 } }
        ],
        responses: { 200: { description: "Monthly budgets" } }
      },
      put: {
        tags: ["Budgets"],
        summary: "Create or update a monthly category budget",
        security: bearer,
        responses: { 200: { description: "Budget saved" } }
      }
    },
    "/budgets/{id}": {
      delete: {
        tags: ["Budgets"],
        summary: "Delete a budget",
        security: bearer,
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Budget deleted" } }
      }
    },
    "/goals": {
      get: {
        tags: ["Savings goals"],
        summary: "List savings goals",
        security: bearer,
        responses: { 200: { description: "Savings goal list" } }
      },
      post: {
        tags: ["Savings goals"],
        summary: "Create a savings goal",
        security: bearer,
        responses: { 201: { description: "Savings goal created" } }
      }
    },
    "/goals/{id}": {
      put: {
        tags: ["Savings goals"],
        summary: "Update savings goal progress",
        security: bearer,
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Savings goal updated" } }
      },
      delete: {
        tags: ["Savings goals"],
        summary: "Delete a savings goal",
        security: bearer,
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Savings goal deleted" } }
      }
    },
    "/debts": {
      get: {
        tags: ["Debt & credit"],
        summary: "List tracked debts and credit utilization",
        security: bearer,
        responses: { 200: { description: "Debt list" } }
      },
      post: {
        tags: ["Debt & credit"],
        summary: "Add a debt or credit balance",
        security: bearer,
        responses: { 201: { description: "Debt created" } }
      }
    },
    "/debts/{id}": {
      put: {
        tags: ["Debt & credit"],
        summary: "Update a debt balance or repayment details",
        security: bearer,
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Debt updated" } }
      },
      delete: {
        tags: ["Debt & credit"],
        summary: "Delete a tracked debt",
        security: bearer,
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { 200: { description: "Debt deleted" } }
      }
    },
    "/net-worth": {
      get: {
        tags: ["Reports"],
        summary: "Calculate assets, liabilities, and net worth",
        security: bearer,
        responses: { 200: { description: "Net-worth overview" } }
      }
    },
    "/monthly-comparison": {
      get: {
        tags: ["Reports"],
        summary: "Compare income and expenses across months",
        security: bearer,
        parameters: [
          { in: "query", name: "year", required: true, schema: { type: "integer" } },
          { in: "query", name: "month", required: true, schema: { type: "integer", minimum: 1, maximum: 12 } },
          { in: "query", name: "count", schema: { type: "integer", minimum: 2, maximum: 24, default: 6 } }
        ],
        responses: { 200: { description: "Monthly comparison" } }
      }
    },
    "/transactions/import": {
      post: {
        tags: ["Transactions"],
        summary: "Validate and import a CSV of transactions",
        description: "Required columns: date, description, amount, type, category. Optional columns: account, transfer_account, cost_type. Maximum CSV size is 1 MB.",
        security: bearer,
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["csv"], properties: { csv: { type: "string" } } } } }
        },
        responses: { 201: { description: "CSV transactions imported" }, 400: { description: "Invalid CSV rows" } }
      }
    }
  }
};
