import { z } from 'zod';

import { MOODS } from './moods';

export const ContentSchema = z.string().trim().min(1).max(500);

export const MoodSchema = z.enum(MOODS);

export const CreateJournalEntrySchema = z.object({
  content: ContentSchema,
  mood: MoodSchema,
});

export const JournalEntrySchema = z
  .object({
    id: z.string().trim().min(1),
    content: ContentSchema,
    mood: MoodSchema,
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .refine((entry) => Date.parse(entry.updatedAt) >= Date.parse(entry.createdAt), {
    message: 'updatedAt must not precede createdAt',
    path: ['updatedAt'],
  });

export type CreateJournalEntryInput = z.infer<typeof CreateJournalEntrySchema>;
export type JournalEntry = z.infer<typeof JournalEntrySchema>;
