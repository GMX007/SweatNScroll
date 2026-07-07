/**
 * FormForge Gamification Levels
 * Free tier: levels 1-3 only
 * Standard tier: levels 1-10
 */

export const levels = [
  {
    level: 1,
    name: 'COUCH POTATO',
    emoji: '🛋️',
    tier: 'free',
    xpRequired: 0,
    lore: "Welcome, you beautiful couch potato. You've been horizontal so long your sofa has a you-shaped dent. But hey — you're here, and that's more than your cushions expected.",
    unlocks: ['3 free exercises', 'Basic form tracking'],
  },
  {
    level: 2,
    name: 'SLOW STARTER',
    emoji: '🐢',
    tier: 'free',
    xpRequired: 200,
    lore: "You actually moved. On purpose. Your couch is in shock. You're not fast, you're not graceful, but you showed up — and that's basically an Olympic achievement at this point.",
    unlocks: ['Streak tracking', 'Session history'],
  },
  {
    level: 3,
    name: 'MOVER',
    emoji: '⚡',
    tier: 'free',
    xpRequired: 500,
    lore: "Look at you — moving like you mean it! Your body is starting to remember it has muscles. Your couch misses you. Don't text it back.",
    unlocks: ['Leaderboard access', 'Form score history'],
  },
  {
    level: 4,
    name: 'SWEATY MESS',
    emoji: '💦',
    tier: 'standard',
    xpRequired: 1000,
    lore: "You're dripping, glowing, and slightly out of breath at all times. People at the gym are concerned. But you? You're thriving. Messy, sweaty, unstoppable thriving.",
    unlocks: ['Body area selection', 'Progressive overload', 'Equipment exercises'],
  },
  {
    level: 5,
    name: 'GETTING SPICY',
    emoji: '🌶️',
    tier: 'standard',
    xpRequired: 2000,
    lore: "Things are heating up. You walked past a mirror and did a double-take — at yourself. Your reps have flavor now. Your form has swagger. You're officially spicy.",
    unlocks: ['Advanced exercises', 'Custom targets'],
  },
  {
    level: 6,
    name: 'WARRIOR',
    emoji: '⚔️',
    tier: 'standard',
    xpRequired: 3500,
    lore: "Every battle with the bar has been won. You don't negotiate with laziness anymore. Your alarm goes off and you just... get up. Who even are you?",
    unlocks: ['Warrior badge', 'Extended session options'],
  },
  {
    level: 7,
    name: 'TITAN',
    emoji: '🏛️',
    tier: 'standard',
    xpRequired: 5500,
    lore: "Titans hold up the sky. You've been holding up your own world — one rep at a time. Lesser mortals scroll endlessly. You earn your time like a legend.",
    unlocks: ['Titan challenges', 'Weekly reports'],
  },
  {
    level: 8,
    name: 'LEGEND',
    emoji: '👑',
    tier: 'standard',
    xpRequired: 8000,
    lore: "Legends aren't born — they're forged in sweat while everyone else hits snooze. Your before photo wouldn't recognize your after photo. And you're not even done.",
    unlocks: ['Legend badge', 'Unlimited favorites'],
  },
  {
    level: 9,
    name: 'IMMORTAL',
    emoji: '🌟',
    tier: 'standard',
    xpRequired: 12000,
    lore: "At this point, your muscles have muscles. The version of you that started as a Couch Potato? They'd faint looking at you now. You're basically a fitness cryptid.",
    unlocks: ['Immortal badge', 'Exclusive exercises'],
  },
  {
    level: 10,
    name: 'MACHINE',
    emoji: '🤖',
    tier: 'standard',
    xpRequired: 20000,
    lore: "You've reached the summit. You don't exercise — exercise exercises you. The couch potato is a distant memory. You are the machine. Beep boop, gains loaded.",
    unlocks: ['Machine badge', 'Leaderboard crown'],
  },
];

export function getLevelForXP(xp) {
  let current = levels[0];
  for (const level of levels) {
    if (xp >= level.xpRequired) current = level;
    else break;
  }
  return current;
}

export function getNextLevel(currentLevel) {
  const idx = levels.findIndex(l => l.level === currentLevel);
  return idx < levels.length - 1 ? levels[idx + 1] : null;
}

export function getXPProgress(xp) {
  const current = getLevelForXP(xp);
  const next = getNextLevel(current.level);
  if (!next) return { current, next: null, progress: 1 };
  const needed = next.xpRequired - current.xpRequired;
  const earned = xp - current.xpRequired;
  return { current, next, progress: Math.min(earned / needed, 1) };
}
