// WCAG 2.1 relative luminance + contrast ratio utilities

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) {return null;}
  const n = parseInt(clean, 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function relativeLuminance(r: number, g: number, b: number): number {
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) {return 0;}

  const l1 = relativeLuminance(...rgb1);
  const l2 = relativeLuminance(...rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export type ContrastLevel = 'pass-aaa' | 'pass-aa' | 'pass-aa-large' | 'fail';

export function wcagLevel(ratio: number): ContrastLevel {
  if (ratio >= 7) {return 'pass-aaa';}
  if (ratio >= 4.5) {return 'pass-aa';}
  if (ratio >= 3) {return 'pass-aa-large';}
  return 'fail';
}

export function useContrastRatio(bg: string, fg = '#ffffff') {
  const ratio = getContrastRatio(bg, fg);
  const level = wcagLevel(ratio);
  return { ratio, level, passes: level !== 'fail' };
}
