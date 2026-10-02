export const PrismaClient = class {
  $connect = jest.fn();
  $disconnect = jest.fn();
};

export const Mood = {
  ONE: 'ONE',
  TWO: 'TWO',
  THREE: 'THREE',
  FOUR: 'FOUR',
  FIVE: 'FIVE',
} as const;

export type Mood = (typeof Mood)[keyof typeof Mood];

export const OnboardingStatus = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  SKIPPED: 'SKIPPED',
} as const;

export type OnboardingStatus =
  (typeof OnboardingStatus)[keyof typeof OnboardingStatus];

export const Prisma = {
  PrismaClientKnownRequestError: class extends Error {},
};