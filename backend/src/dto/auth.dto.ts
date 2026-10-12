import { z } from 'zod';
import { userResponseSchema } from './user.dto.js';

// request
export const loginRequestSchema = z.object({
  email: z.email().transform((email) => email.toLowerCase()),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

// response
export const loginResponseSchema = z.object({
  tokenType: z.literal('Bearer'),
  accessToken: z.string(),
  expiresAt: z.iso.datetime(),
  user: userResponseSchema,
});
export type LoginResponse = z.infer<typeof loginResponseSchema>;

export const meResponseSchema = z.object({
  user: userResponseSchema,
  session: z.object({ expiresAt: z.iso.datetime() }),
});
export type MeResponse = z.infer<typeof meResponseSchema>;
