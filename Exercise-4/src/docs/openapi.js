const bearer = [{ bearerAuth: [] }];

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Personal Finance Tracker API",
    version: "1.0.0",
    description: "Track personal income and expenses. Amounts are positive; type determines income or expense."
  },
  servers: [{ url: "/api/v1", description: "API v1" }],
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
          type: { type: "string", enum: ["income", "expense"] },
          category: { type: "string", example: "Food" },
          date: { type: "string", format: "date-time" }
        }
      }
    }
  },
  paths: {
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
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" } }],
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
        parameters: [{ in: "path", name: "id", required: true, schema: { type: "string", pattern: "^[a-fA-F0-9]{24}$" } }],
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
    }
  }
};
