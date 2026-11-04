# JWT Role-Based Authentication API

An Express and MongoDB API with password hashing, JWT authentication, and admin-only authorization.

## Requirements

- Node.js 18 or newer
- MongoDB running locally, or a MongoDB Atlas connection URI

## Setup

1. Open a terminal in this project folder.
2. Install dependencies:

   ```powershell
   npm install
   ```

3. Copy `.env.example` to `.env`.
4. Set `MONGODB_URI` to your local MongoDB URI or Atlas URI.
5. Replace `JWT_SECRET` with a private random secret of at least 32 characters. In PowerShell, you can generate one with:

   ```powershell
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```

   Put the generated value in `.env`; do not share or commit `.env`.
6. Start the API:

   ```powershell
   npm run dev
   ```

   Or use `npm start` without auto-restart.

The API listens on `http://localhost:3000` by default.

## Endpoints

### `POST /auth/register`

Request:

```json
{
  "name": "Ayaan Ali",
  "email": "ayaan@example.com",
  "password": "a-strong-password"
}
```

Creates a regular `user`, hashes the password, and returns a JWT. Public registration intentionally does not accept a `role` field.

### `POST /auth/login`

Request:

```json
{
  "email": "ayaan@example.com",
  "password": "a-strong-password"
}
```

Returns a JWT when the credentials are valid.

### `GET /auth/profile`

Requires the header `Authorization: Bearer <token>`. Returns the authenticated user's profile.

### `GET /admin/dashboard`

Requires `Authorization: Bearer <token>` for a user whose database role is `admin`.

## Creating an admin

Register a normal account first, then use MongoDB Compass or `mongosh` to change only that trusted account's `role` to `admin` in the `users` collection. For example, in `mongosh`:

```javascript
use jwt_role_auth
db.users.updateOne(
  { email: "ayaan@example.com" },
  { $set: { role: "admin" } }
)
```

Use the database name from your `MONGODB_URI` if it is not `jwt_role_auth`. The new role is checked from MongoDB on each protected request.
