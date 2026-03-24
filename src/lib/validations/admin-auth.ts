import { z } from "zod";

export const adminSignInSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8)
});

export const adminSignUpSchema = adminSignInSchema.extend({
  name: z.string().trim().min(2)
});

export type AdminSignInInput = z.infer<typeof adminSignInSchema>;
export type AdminSignUpInput = z.infer<typeof adminSignUpSchema>;
