import { z } from "zod";

const taskId = z.string().uuid();

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(120)
  })
});

export const updateTaskSchema = z.object({
  params: z.object({ id: taskId }),
  body: z.object({
    title: z.string().trim().min(1).max(120).optional(),
    completed: z.boolean().optional()
  }).refine((body) => Object.keys(body).length > 0, "Provide at least one field to update")
});

export const taskIdSchema = z.object({
  params: z.object({ id: taskId })
});
