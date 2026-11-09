import { query } from "../config/database.js";

function mapTask(row) {
  if (!row) return null;
  return {
    _id: row.id,
    title: row.title,
    completed: row.completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function findTasks() {
  const { rows } = await query("SELECT * FROM tasks ORDER BY created_at DESC, id DESC");
  return rows.map(mapTask);
}

export async function createTask({ title }) {
  const { rows } = await query(
    "INSERT INTO tasks (title) VALUES ($1) RETURNING *",
    [title]
  );
  return mapTask(rows[0]);
}

export async function updateTaskById(id, changes) {
  const fields = [];
  const values = [id];
  if (changes.title !== undefined) {
    values.push(changes.title);
    fields.push(`title = $${values.length}`);
  }
  if (changes.completed !== undefined) {
    values.push(changes.completed);
    fields.push(`completed = $${values.length}`);
  }

  const { rows } = await query(
    `UPDATE tasks
     SET ${fields.join(", ")}, updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    values
  );
  return mapTask(rows[0]);
}

export async function deleteTaskById(id) {
  const { rows } = await query("DELETE FROM tasks WHERE id = $1 RETURNING id", [id]);
  return rows.length > 0;
}
