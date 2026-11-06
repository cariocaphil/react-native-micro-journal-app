import { z } from 'zod';

import { MOODS } from './moods';

export const ContentSchema = z.string().trim().min(1).max(500);

export const MoodSchema = z.enum(MOODS);

/** ISO 8601 datetimes, including timezone offsets (e.g. +02:00) and Z. */
export const IsoDateTimeSchema = z.iso.datetime({ offset: true });

export const CreateJournalEntrySchema = z.object({
  content: ContentSchema,
  mood: MoodSchema,
});

/** Same validation as create: content + mood required. */
export const UpdateJournalEntrySchema = CreateJournalEntrySchema;

export const JournalEntrySchema = z
  .object({
    id: z.string().trim().min(1),
    content: ContentSchema,
    mood: MoodSchema,
    createdAt: IsoDateTimeSchema,
    updatedAt: IsoDateTimeSchema,
  })
  .refine((entry) => Date.parse(entry.updatedAt) >= Date.parse(entry.createdAt), {
    message: 'updatedAt must not precede createdAt',
    path: ['updatedAt'],
  });

export type CreateJournalEntryInput = z.infer<typeof CreateJournalEntrySchema>;
export type UpdateJournalEntryInput = z.infer<typeof UpdateJournalEntrySchema>;
export type JournalEntry = z.infer<typeof JournalEntrySchema>;
