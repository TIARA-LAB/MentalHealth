import { Mood } from '../generated/prisma/client';

const WINDOW_DAYS = 30;
const DAY_MS = 86_400_000;

const MOOD_WEIGHT = 0.5;
const CONSISTENCY_WEIGHT = 0.3;
const STREAK_WEIGHT = 0.2;
const FULL_MARKS_STREAK = 7;

const MOOD_VALUE: Record<Mood, number> = {
  [Mood.ONE]: 1,
  [Mood.TWO]: 2,
  [Mood.THREE]: 3,
  [Mood.FOUR]: 4,
  [Mood.FIVE]: 5,
};

export type WellnessScoreInput = {
  streakCount: number;
  checkIns: { mood: Mood; date: Date }[];
  now?: Date;
};

/**
 * Weighted 0-100 wellness score over the last 30 days.
 *
 * The weights live here rather than in the client so a tuning change ships
 * without a frontend release. All three components are normalised to 0-100
 * before weighting, so the result stays within range regardless of mix.
 */
export function computeWellnessScore({
  streakCount,
  checkIns,
  now = new Date(),
}: WellnessScoreInput): number {
  const windowStart = new Date(now.getTime() - (WINDOW_DAYS - 1) * DAY_MS);
  windowStart.setUTCHours(0, 0, 0, 0);

  const inWindow = checkIns.filter((checkIn) => checkIn.date >= windowStart);

  const moodScore = averageMoodScore(inWindow);
  const consistencyScore = (distinctDays(inWindow) / WINDOW_DAYS) * 100;
  const streakScore =
    Math.min(Math.max(streakCount, 0) / FULL_MARKS_STREAK, 1) * 100;

  const raw =
    moodScore * MOOD_WEIGHT +
    consistencyScore * CONSISTENCY_WEIGHT +
    streakScore * STREAK_WEIGHT;

  return Math.round(Math.min(Math.max(raw, 0), 100));
}

function averageMoodScore(checkIns: { mood: Mood }[]): number {
  if (checkIns.length === 0) {
    return 0;
  }

  const total = checkIns.reduce(
    (sum, checkIn) =>
      sum + (MOOD_VALUE[checkIn.mood] ?? MOOD_VALUE[Mood.THREE]),
    0,
  );
  const average = total / checkIns.length;

  return ((average - 1) / 4) * 100;
}

function distinctDays(checkIns: { date: Date }[]): number {
  return new Set(
    checkIns.map((checkIn) => checkIn.date.toISOString().slice(0, 10)),
  ).size;
}
