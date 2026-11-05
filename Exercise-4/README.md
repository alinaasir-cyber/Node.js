# Personal Finance Tracker API

A Node.js, Express, and MongoDB API for tracking income and expenses.

## Requirements

- Node.js 20 or newer
- MongoDB (local, or a MongoDB Atlas cluster)
- Cloudinary account only if profile-picture uploads are needed

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env`.
3. Set `MONGODB_URI` and replace `JWT_SECRET` with a private random value of at least 32 characters. Keep `.env` out of Git.
4. Start MongoDB, then run `npm run dev`.
5. Open `http://localhost:5000/docs` for Swagger or `http://localhost:5000/health` to check the server.

The server will not start if required environment values are invalid or MongoDB cannot be reached.

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

Send authenticated requests with `Authorization: Bearer <token>`. Transaction amounts are positive numbers; `type` (`income` or `expense`) determines how they are counted.

## Manual setup you must do

- Choose where MongoDB will run and enter its connection string in `.env`.
- Generate and privately store `JWT_SECRET`; do not share or commit it.
- If enabling picture uploads, add your own Cloudinary credentials to `.env`.
- Create and deploy the API service (for example, on Render), then set the same environment variables in the host's secret/environment settings.
- To use an admin route, promote your account's `role` to `admin` directly in your MongoDB database. Public registration intentionally always creates a regular `user`.
- Create a GitHub repository and push the project if you need to submit a repository link.

## Security notes

- Authentication passwords are hashed with bcrypt; the password field is not returned by user queries.
- Users can only access or modify their own transactions.
- Admin access is checked from the authenticated account's database role.
- Image upload accepts JPEG, PNG, and WebP files up to 5 MB.
- Rate limiting, Helmet, CORS, request validation, and centralized error handling are enabled.
