import { query } from "../config/database.js";

function mapUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    role: row.role,
    profilePicture: row.profile_picture,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function createUser({ name, email, password }) {
  const { rows } = await query(
    `INSERT INTO users (name, email, password)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [name, email, password]
  );
  return mapUser(rows[0]);
}

export async function findUserByEmail(email) {
  const { rows } = await query("SELECT * FROM users WHERE email = $1", [email]);
  return mapUser(rows[0]);
}

export async function findUserById(id) {
  const { rows } = await query(
    `SELECT id, name, email, role, profile_picture, created_at, updated_at
     FROM users
     WHERE id = $1`,
    [id]
  );
  return mapUser(rows[0]);
}

export async function updateUserProfilePicture(id, profilePicture) {
  const { rows } = await query(
    `UPDATE users
     SET profile_picture = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING id, name, email, role, profile_picture, created_at, updated_at`,
    [id, profilePicture]
  );
  return mapUser(rows[0]);
}

export async function countUsers() {
  const { rows } = await query("SELECT COUNT(*)::INTEGER AS count FROM users");
  return rows[0].count;
}
