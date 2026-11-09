import { createTask as insertTask, deleteTaskById, findTasks, updateTaskById } from "../models/Task.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listTasks = asyncHandler(async (req, res) => {
  const tasks = await findTasks();
  res.json({ success: true, data: { tasks } });
});

export const createTask = asyncHandler(async (req, res) => {
  const task = await insertTask(req.validated.body);
  res.status(201).json({ success: true, data: { task } });
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await updateTaskById(req.validated.params.id, req.validated.body);
  if (!task) throw new AppError("Task not found", 404);
  res.json({ success: true, data: { task } });
});

export const deleteTask = asyncHandler(async (req, res) => {
  const deleted = await deleteTaskById(req.validated.params.id);
  if (!deleted) throw new AppError("Task not found", 404);
  res.json({ success: true, message: "Task deleted" });
});
