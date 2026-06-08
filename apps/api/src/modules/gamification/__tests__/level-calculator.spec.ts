import { calculateLevel, xpForLevel, xpProgress } from '../domain/level-calculator';

describe('level-calculator', () => {
  describe('xpForLevel', () => {
    it('returns 0 for level 1', () => {
      expect(xpForLevel(1)).toBe(0);
    });
    it('returns 100 for level 2', () => {
      expect(xpForLevel(2)).toBe(100);
    });
    it('returns 300 for level 3', () => {
      expect(xpForLevel(3)).toBe(300);
    });
    it('returns 600 for level 4', () => {
      expect(xpForLevel(4)).toBe(600);
    });
    it('returns 0 for level 0 or below', () => {
      expect(xpForLevel(0)).toBe(0);
    });
  });

  describe('calculateLevel', () => {
    it('returns 1 at 0 XP', () => {
      expect(calculateLevel(0)).toBe(1);
    });
    it('returns 1 below level-2 threshold', () => {
      expect(calculateLevel(99)).toBe(1);
    });
    it('returns 2 at exactly level-2 threshold', () => {
      expect(calculateLevel(100)).toBe(2);
    });
    it('returns 2 between levels 2 and 3', () => {
      expect(calculateLevel(200)).toBe(2);
    });
    it('returns 3 at level-3 threshold', () => {
      expect(calculateLevel(300)).toBe(3);
    });
    it('caps at 100 for very high XP', () => {
      expect(calculateLevel(9_999_999)).toBe(100);
    });
  });

  describe('xpProgress', () => {
    it('percent 0 at start of level 1', () => {
      expect(xpProgress(0).percent).toBe(0);
    });
    it('correct percent midway through level 1', () => {
      const { percent } = xpProgress(50);
      expect(percent).toBe(50);
    });
    it('shows 100% at level 100', () => {
      const result = xpProgress(9_999_999);
      expect(result.percent).toBe(100);
      expect(result.needed).toBe(0);
    });
    it('returns correct level in result', () => {
      expect(xpProgress(100).level).toBe(2);
    });
  });
});
