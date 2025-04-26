import { z } from 'zod';

export const hostAiAttachmentSchema = z.object({
  name: z.string().optional(),
  extension: z.string().optional(),
  url: z.string().url()
});

export const hostAiWebhookSchema = z.object({
  task: z.object({
    action: z.string(),
    description: z.string(),
    assignee: z.object({
      firstName: z.string(),
      lastName: z.string()
    })
  }),
  source: z.object({
    sourceType: z.string(),
    link: z.string()
  }),
  attachments: z.array(hostAiAttachmentSchema),
  guest: z.object({
    guestName: z.string(),
    guestEmail: z.string(),
    guestPhone: z.string()
  }),
  listing: z.object({
    listingName: z.string(),
    listingId: z.string()
  }),
  _creationDate: z.string(),
  external_id: z.string().optional()
}).catchall(z.unknown());

export type HostAiWebhookPayload = z.infer<typeof hostAiWebhookSchema>;