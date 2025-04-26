import { z } from 'zod';

export const hostAiAttachmentSchema = z.object({
  name: z.string().optional(),
  extension: z.string().optional(),
  url: z.string().url(),
});

export const hostAiWebhookSchema = z.object({
  task: z.object({
    action: z.string(),
    description: z.string().optional(),
    assignee: z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional()
    }).optional()
  }).passthrough(),
  source: z.object({
    sourceType: z.string().optional(),
    link: z.string().url().optional()
  }).passthrough().optional(),
  attachments: z.array(hostAiAttachmentSchema).optional(),
  guest: z.object({
    guestName: z.string().optional(),
    guestEmail: z.string().email().optional(),
    guestPhone: z.string().optional()
  }).passthrough().optional(),
  listing: z.object({
    listingName: z.string().optional(),
    listingId: z.string()
  }).passthrough(),
  _creationDate: z.string().optional(),
  external_id: z.string().optional()
}).catchall(z.unknown());

export type HostAiWebhookPayload = z.infer<typeof hostAiWebhookSchema>;