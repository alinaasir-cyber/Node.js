# Personal Finance Tracker API

A Node.js and Express API using Neon PostgreSQL to track income and expenses.

## Requirements

- Node.js 20 or newer
- A Neon PostgreSQL project and its connection string
- Cloudinary account only if profile-picture uploads are needed

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env`.
3. Set `DATABASE_URL` to the Neon connection string from your Neon dashboard (use the pooled connection string and keep `sslmode=require`), and replace `JWT_SECRET` with a private random value of at least 32 characters. Keep `.env` out of Git.
4. Run `npm run dev`. The backend creates the required tables and indexes in Neon on startup.
5. Open `http://localhost:5000/docs` for Swagger or `http://localhost:5000/health` to check the server.

The server will not start if required environment values are invalid or Neon cannot be reached.

## Endpoints

All API endpoints are under `/api/v1`.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Create an account and receive a JWT |
| POST | `/auth/login` | Public | Log in and receive a JWT |
| GET | `/auth/profile` | User | Get the current user's profile |
| POST | `/transactions` | User | Create an income or expense |
| GET | `/transactions` | User | List/filter/paginate the current user's transactions |
| GET | `/transactions/monthly-summary?year=2025&month=5` | User | Monthly totals and expense totals per category |
| PUT | `/transactions/:id` | Owner | Update a transaction |
| DELETE | `/transactions/:id` | Owner | Delete a transaction |
| GET | `/categories` | User | Get predefined categories |
| POST | `/upload/profile-picture` | User | Upload an image using multipart field `image` |
| GET | `/admin/overview` | Admin | Get platform-wide user and transaction statistics |
| GET/POST | `/accounts` | User | List or add manually tracked cash, bank, credit, or investment accounts |
| PUT/DELETE | `/accounts/:id` | User | Update or remove an account (accounts with linked transactions cannot be removed) |
| GET/PUT | `/budgets?year=2026&month=5` | User | View or set a category spending limit for a month |
| DELETE | `/budgets/:id` | User | Remove a monthly category budget |
| GET/POST | `/goals` | User | List or create a savings goal |
| PUT/DELETE | `/goals/:id` | User | Update progress or remove a savings goal |
| GET/POST | `/debts` | User | List or track credit-card balances, loans, payments, and due dates |
| PUT/DELETE | `/debts/:id` | User | Update or remove a debt |
| GET | `/net-worth` | User | Calculate tracked assets minus tracked liabilities |
| GET | `/monthly-comparison?year=2026&month=5&count=6` | User | Compare income and expenses across months |
| POST | `/transactions/import` | User | Import validated CSV transactions (up to 1 MB) |
| GET | `/api/tasks` | Public | List tasks |
| POST | `/api/tasks` | Public | Create a task |
| PATCH | `/api/tasks/:id` | Public | Update a task or mark it complete |
| DELETE | `/api/tasks/:id` | Public | Delete a task |

The task endpoints are a public, shared demo API without user ownership. Add authentication and per-user access controls before deploying them for real users.

CSV transaction imports require `date,description,amount,type,category` columns. Optional columns are `account,transfer_account,cost_type`; account names must match an account belonging to the signed-in user. `type` can be `income`, `expense`, or `transfer`; `cost_type` can be `fixed` or `variable`. Transfers must identify different source and destination accounts. Rows are validated before the import is committed.

Accounts are manually maintained. Budget alerts, spending summaries, and net worth are derived from the tracked records; record each liability only once to avoid double-counting it in net worth. Connecting live bank feeds requires choosing and configuring a third-party open-banking provider, so this project does not connect to banks automatically.

Send authenticated requests with `Authorization: Bearer <token>`. Transaction amounts are positive numbers; `type` (`income` or `expense`) determines how they are counted.

## Manual setup you must do

- Create a Neon project and enter its PostgreSQL connection string as `DATABASE_URL` in `.env`.
- Generate and privately store `JWT_SECRET`; do not share or commit it.
- If enabling picture uploads, add your own Cloudinary credentials to `.env`.
- Create and deploy the API service (for example, on Render), then set the same environment variables in the host's secret/environment settings.
- To use an admin route, promote your account's `role` to `admin` in the Neon `users` table. Public registration intentionally always creates a regular `user`.
- Create a GitHub repository and push the project if you need to submit a repository link.

## Security notes

- Authentication passwords are hashed with bcrypt; the password field is not returned by user queries.
- Users can only access or modify their own transactions.
- Admin access is checked from the authenticated account's database role.
- Image upload accepts JPEG, PNG, and WebP files up to 5 MB.
- Rate limiting, Helmet, CORS, request validation, and centralized error handling are enabled.
