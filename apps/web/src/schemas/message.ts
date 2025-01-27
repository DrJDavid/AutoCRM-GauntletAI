import { z } from 'zod';

/**
 * Schema for validating ticket messages
 */
export const messageSchema = z.object({
  id: z.string().uuid('Invalid message ID'),
  ticket_id: z.string().uuid('Invalid ticket ID'),
  user_id: z.string().uuid('Invalid user ID'),
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message is too long'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

/**
 * Schema for creating a new message
 */
export const createMessageSchema = messageSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

/**
 * Schema for updating a message
 */
export const updateMessageSchema = messageSchema
  .omit({
    id: true,
    ticket_id: true,
    user_id: true,
    created_at: true,
    updated_at: true,
  })
  .partial();

export type MessageInput = z.infer<typeof messageSchema>;
export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>;
