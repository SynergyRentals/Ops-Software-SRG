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
      lastName: z.string().optional(),
    }).optional(),
  }),
  source: z.object({
    sourceType: z.string().optional(),
    link: z.string().url().optional(),
  }).optional(),
  guest: z.object({
    guestName: z.string().optional(),
    guestEmail: z.string().email().optional(),
    guestPhone: z.string().optional(),
  }).optional(),
  listing: z.object({
    listingName: z.string().optional(),
    listingId: z.string().optional(),
  }).optional(),
  attachments: z.array(hostAiAttachmentSchema).optional(),
  external_id: z.string(),
  _creationDate: z.string().optional(),
}).catchall(z.unknown());

export type HostAiWebhookPayload = z.infer<typeof hostAiWebhookSchema>;