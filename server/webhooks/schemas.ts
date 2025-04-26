import { z } from 'zod';

export const hostAiAttachmentSchema = z.object({
  name: z.string().optional(),
  extension: z.string().optional(),
  url: z.string().url(),
});

export const hostAiWebhookSchema = z.object({
  task: z.object({ action: z.string() }).passthrough(),
  source: z.object({}).passthrough().optional(),
  guest: z.object({}).passthrough().optional(),
  listing: z.object({}).passthrough().optional(),
  attachments: z.array(z.any()).optional(),
  _creationDate: z.string().optional()
}).catchall(z.unknown());

export type HostAiWebhookPayload = z.infer<typeof hostAiWebhookSchema>;