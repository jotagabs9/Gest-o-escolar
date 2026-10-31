import { z } from "zod";

/** Entrada do login. O limite de 128 evita custo abusivo no bcrypt (que só usa os 72 primeiros bytes). */
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;
