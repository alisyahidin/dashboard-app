import { z } from 'zod';

export const roleItemSchema = z.object({
  id: z.uuid(),
  name: z.string(),
});
export type RoleItem = z.infer<typeof roleItemSchema>;
