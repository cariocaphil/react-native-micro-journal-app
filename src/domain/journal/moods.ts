export const MOODS = ['great', 'good', 'okay', 'bad', 'awful'] as const;

export type Mood = (typeof MOODS)[number];
