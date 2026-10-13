import { z } from 'zod';

export const PASSWORD_MIN = 8;

export const inviteTokenParamSchema = z.string().min(1).max(64);

export const acceptInviteRequestSchema = z.object({
  password: z
    .string()
    .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters.`)
    .regex(/[A-Za-z]/, 'Password must include a letter and a number.')
    .regex(/\d/, 'Password must include a letter and a number.'),
});
export type AcceptInviteRequest = z.infer<typeof acceptInviteRequestSchema>;

export type InviteDetailsResponse =
  | { state: 'valid'; name: string; email: string; role: string; invitedBy: string }
  | { state: 'used'; email: string };
