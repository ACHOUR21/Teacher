/** XP required to reach a given level. Level 1 = 0 XP. */
export function xpForLevel(level: number): number {
  if (level <= 1) {return 0;}
  return level * (level - 1) * 50;
}

/** Derive level from total accumulated XP (capped at 100). */
export function calculateLevel(totalXp: number): number {
  if (totalXp <= 0) {return 1;}
  // Solve level*(level-1)*50 <= totalXp for largest integer level
  // => level = floor((1 + sqrt(1 + 4*totalXp/50)) / 2)
  const level = Math.floor((1 + Math.sqrt(1 + (4 * totalXp) / 50)) / 2);
  return Math.max(1, Math.min(level, 100));
}

/** Progress within the current level. */
export function xpProgress(totalXp: number): {
  level: number;
  current: number;
  needed: number;
  percent: number;
} {
  const level = calculateLevel(totalXp);
  if (level >= 100) {
    return { level: 100, current: totalXp, needed: 0, percent: 100 };
  }
  const currentFloor = xpForLevel(level);
  const nextFloor = xpForLevel(level + 1);
  const current = totalXp - currentFloor;
  const needed = nextFloor - currentFloor;
  return { level, current, needed, percent: Math.round((current / needed) * 100) };
}
