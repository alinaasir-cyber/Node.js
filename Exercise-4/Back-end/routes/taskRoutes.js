import { Router } from "express";
import {
  createTask,
  deleteTask,
  listTasks,
  updateTask
} from "../controllers/taskController.js";
import { validate } from "../middleware/validate.js";
import {
  createTaskSchema,
  taskIdSchema,
  updateTaskSchema
} from "../validators/tasks.js";

const router = Router();

router.route("/")
  .get(listTasks)
  .post(validate(createTaskSchema), createTask);
router.route("/:id")
  .patch(validate(updateTaskSchema), updateTask)
  .delete(validate(taskIdSchema), deleteTask);

export default router;
