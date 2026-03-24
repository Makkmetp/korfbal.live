export type BlockMarginLevel = 'none' | 'sm' | 'md' | 'lg';

/**
 * Spacing-tokens gelijk aan ButtonWrapper (sm/md/lg).
 */
export function blockMarginCssValue(level: Exclude<BlockMarginLevel, 'none'>): string {
  const map = { sm: 'var(--space-3)', md: 'var(--space-4)', lg: 'var(--space-6)' } as const;
  return map[level];
}
