import { z } from "zod";

const email = z.string().trim().email().max(254).transform((value) => value.toLowerCase());

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80),
    email,
    password: z.string().min(8).max(72)
  })
});

export const loginSchema = z.object({
  body: z.object({
    email,
    password: z.string().min(1).max(72)
  })
});
