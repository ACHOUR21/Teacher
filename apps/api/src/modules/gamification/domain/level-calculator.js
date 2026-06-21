"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.calculateLevel = calculateLevel;
exports.xpForLevel = xpForLevel;
exports.xpProgress = xpProgress;
/** XP required to reach a given level. Level 1 = 0 XP. */
function xpForLevel(level) {
  if (level <= 1) {
    return 0;
  }
  return level * (level - 1) * 50;
}
/** Derive level from total accumulated XP (capped at 100). */
function calculateLevel(totalXp) {
  if (totalXp <= 0) {
    return 1;
  }
  // Solve level*(level-1)*50 <= totalXp for largest integer level
  // => level = floor((1 + sqrt(1 + 4*totalXp/50)) / 2)
  const level = Math.floor((1 + Math.sqrt(1 + 4 * totalXp / 50)) / 2);
  return Math.max(1, Math.min(level, 100));
}
/** Progress within the current level. */
function xpProgress(totalXp) {
  const level = calculateLevel(totalXp);
  if (level >= 100) {
    return {
      level: 100,
      current: totalXp,
      needed: 0,
      percent: 100
    };
  }
  const currentFloor = xpForLevel(level);
  const nextFloor = xpForLevel(level + 1);
  const current = totalXp - currentFloor;
  const needed = nextFloor - currentFloor;
  return {
    level,
    current,
    needed,
    percent: Math.round(current / needed * 100)
  };
}