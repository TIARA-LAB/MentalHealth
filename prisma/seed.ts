import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { hash } from '@node-rs/argon2';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL as string });
const prisma = new PrismaClient({ adapter });

const JOURNAL_PROMPTS = [
  { text: 'What are three things you are grateful for today?', category: 'gratitude' },
  { text: 'How did you feel when you woke up this morning?', category: 'reflection' },
  { text: 'What was the highlight of your day?', category: 'reflection' },
  { text: 'Describe a moment that made you smile today.', category: 'gratitude' },
  { text: 'What is one thing you would like to let go of?', category: 'reflection' },
  { text: 'What small step can you take tomorrow to support your wellbeing?', category: 'planning' },
  { text: 'Write about a challenge you handled well recently.', category: 'resilience' },
  { text: 'What does rest look like for you right now?', category: 'mindfulness' },
  { text: 'Name someone who supports you and why they matter.', category: 'connection' },
  { text: 'What patterns do you notice in your mood this week?', category: 'awareness' },
];

const WELLNESS_TIPS = [
  {
    title: 'Start with a two-minute breathing reset',
    content:
      'When your mood dips, pause and take five slow breaths: inhale for four counts, hold for two, exhale for six. Doing this twice a day can help lower stress and improve focus.',
    category: 'breathing',
    tags: ['breathing', 'stress', 'quick'],
  },
  {
    title: 'Move your body for ten minutes',
    content:
      'Short bursts of movement release endorphins and can noticeably shift your mood. A ten-minute walk or stretching routine is enough to feel the benefit.',
    category: 'exercise',
    tags: ['exercise', 'movement', 'mood'],
  },
  {
    title: 'Keep a consistent sleep schedule',
    content:
      'Going to bed and waking up at the same time, even on weekends, strengthens your circadian rhythm and supports emotional regulation.',
    category: 'sleep',
    tags: ['sleep', 'rest', 'routine'],
  },
  {
    title: 'Try a body scan meditation',
    content:
      'Lie down, close your eyes, and slowly bring attention from your toes to the top of your head. It is a gentle way to release tension and reconnect with the present moment.',
    category: 'meditation',
    tags: ['meditation', 'mindfulness', 'relaxation'],
  },
  {
    title: 'Name your feelings to tame them',
    content:
      'Putting your emotions into words — "I feel anxious", "I feel tired" — activates parts of the brain that dampen the stress response. Journaling one sentence is enough.',
    category: 'journal',
    tags: ['journal', 'reflection', 'awareness'],
  },
  {
    title: 'Connect with someone today',
    content:
      'A brief, meaningful conversation with a friend or family member is one of the strongest protective factors for mental wellbeing.',
    category: 'connection',
    tags: ['connection', 'social', 'support'],
  },
  {
    title: 'Limit social media during low moments',
    content:
      'When you are feeling down, comparisons online can amplify negative thoughts. Try a screen-free hour and notice how your mood responds.',
    category: 'coping',
    tags: ['coping', 'digital', 'boundaries'],
  },
  {
    title: 'Build a small daily habit anchor',
    content:
      'Choose one tiny behavior to repeat each day at the same time, like making your bed or drinking water after waking. Habit anchors create structure and momentum.',
    category: 'routine',
    tags: ['routine', 'habit', 'consistency'],
  },
];

const RECOMMENDATIONS = [
  {
    title: 'Guided 5-minute breathing exercise',
    content:
      'Follow a slow 4-2-6 breathing cycle for five minutes to calm your nervous system and lower stress in the moment.',
    category: 'breathing',
    reason:
      'Recommended when recent check-ins show stress or a lower mood',
  },
  {
    title: 'Ten-day mindfulness streak',
    content:
      'Commit to two minutes of mindfulness each morning for ten days. Short, consistent practice builds emotional resilience.',
    category: 'mindfulness',
    reason: 'Best for users working on focus and emotional balance',
  },
  {
    title: 'Evening reflection journaling',
    content:
      'Write three sentences each evening about how your day went. Reflection turns experience into insight and supports mood tracking.',
    category: 'journal',
    reason: 'Builds on regular journaling habits and self-awareness',
  },
  {
    title: 'Wind-down routine for better sleep',
    content:
      'Create a 30-minute evening routine: dim lights, put screens away, and do a calming activity to prepare for restful sleep.',
    category: 'sleep',
    reason: 'Matching sleep as a wellness goal improves mood outcomes',
  },
  {
    title: 'Weekly structured walk',
    content:
      'Schedule three short walks this week. Regular movement and structure reinforce consistency and lift mood.',
    category: 'movement',
    reason: 'Helps maintain a check-in streak and build routine',
  },
  {
    title: 'Gratitude practice',
    content:
      'Each day, write down one thing you are grateful for. Gratitude practices are linked to higher reported wellbeing.',
    category: 'reflection',
    reason: 'Simple first step for users getting started with self-care',
  },
  {
    title: 'Stress check-in toolkit',
    content:
      'When you feel overwhelmed, use this three-step toolkit: pause and breathe, name the feeling, and choose one small next action.',
    category: 'stress',
    reason: 'Practical coping techniques for anxious moments',
  },
  {
    title: 'Reach out to a friend',
    content:
      'Plan one meaningful conversation this week. Social connection is a strong protective factor for mental health.',
    category: 'connection',
    reason: 'Encourages supportive relationships during low periods',
  },
];

async function main() {
  const email = 'admin@example.com';
  const password = await hash('password123');

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password,
      name: 'Admin',
    },
  });

  const userId = user.id;
  await prisma.profile.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  await prisma.notificationSetting.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  if ((await prisma.journalPrompt.count()) === 0) {
    await prisma.journalPrompt.createMany({
      data: JOURNAL_PROMPTS,
    });
    console.log(`Seeded ${JOURNAL_PROMPTS.length} journal prompts`);
  }

  if ((await prisma.wellnessTip.count()) === 0) {
    await prisma.wellnessTip.createMany({ data: WELLNESS_TIPS });
    console.log(`Seeded ${WELLNESS_TIPS.length} wellness tips`);
  }

  if ((await prisma.recommendation.count()) === 0) {
    await prisma.recommendation.createMany({ data: RECOMMENDATIONS });
    console.log(`Seeded ${RECOMMENDATIONS.length} recommendations`);
  }

  console.log(`Seeded user: ${user.email} (id: ${user.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });