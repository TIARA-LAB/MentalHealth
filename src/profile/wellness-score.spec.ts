import { Mood } from '../generated/prisma/client';
import { computeWellnessScore } from './wellness-score';

const DAY_MS = 86_400_000;
const NOW = new Date('2026-09-16T12:00:00.000Z');

function daysAgo(count: number): Date {
  return new Date(NOW.getTime() - count * DAY_MS);
}

function dailyCheckIns(count: number, mood: Mood) {
  return Array.from({ length: count }, (_, index) => ({
    mood,
    date: daysAgo(index),
  }));
}

describe('computeWellnessScore', () => {
  it('returns 0 for a user with no check-ins and no streak', () => {
    expect(
      computeWellnessScore({ streakCount: 0, checkIns: [], now: NOW }),
    ).toBe(0);
  });

  it('returns 100 for perfect mood, full consistency and a 7-day streak', () => {
    const score = computeWellnessScore({
      streakCount: 7,
      checkIns: dailyCheckIns(30, Mood.FIVE),
      now: NOW,
    });

    expect(score).toBe(100);
  });

  it('weights mood most heavily', () => {
    const goodMood = computeWellnessScore({
      streakCount: 0,
      checkIns: dailyCheckIns(30, Mood.FIVE),
      now: NOW,
    });
    const poorMood = computeWellnessScore({
      streakCount: 0,
      checkIns: dailyCheckIns(30, Mood.ONE),
      now: NOW,
    });

    expect(goodMood).toBeGreaterThan(poorMood);
    // mood 0 * 0.5 + consistency 100 * 0.3 + streak 0 * 0.2
    expect(poorMood).toBe(30);
  });

  it('ignores check-ins older than the 30-day window', () => {
    const recent = computeWellnessScore({
      streakCount: 0,
      checkIns: dailyCheckIns(30, Mood.FIVE),
      now: NOW,
    });
    const allStale = computeWellnessScore({
      streakCount: 0,
      checkIns: Array.from({ length: 30 }, (_, index) => ({
        mood: Mood.FIVE,
        date: daysAgo(60 + index),
      })),
      now: NOW,
    });

    expect(recent).toBe(80);
    expect(allStale).toBe(0);
  });

  it('caps the streak contribution at seven days', () => {
    const sevenDay = computeWellnessScore({
      streakCount: 7,
      checkIns: dailyCheckIns(30, Mood.THREE),
      now: NOW,
    });
    const ninetyDay = computeWellnessScore({
      streakCount: 90,
      checkIns: dailyCheckIns(30, Mood.THREE),
      now: NOW,
    });

    expect(ninetyDay).toBe(sevenDay);
  });

  it('always stays within 0-100', () => {
    const scores = [0, 1, 3, 5, 10, 50, 365].flatMap((streakCount) =>
      [
        dailyCheckIns(30, Mood.ONE),
        dailyCheckIns(30, Mood.FIVE),
        dailyCheckIns(3, Mood.THREE),
      ].map((checkIns) =>
        computeWellnessScore({ streakCount, checkIns, now: NOW }),
      ),
    );

    for (const score of scores) {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
      expect(Number.isInteger(score)).toBe(true);
    }
  });
});
