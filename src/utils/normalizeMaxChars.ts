export type MaxCharsInput = number | 'none' | `${number}` | undefined;
export type NormalizedMaxChars = number | 'none' | undefined;

export function normalizeMaxChars(maxChars: MaxCharsInput): NormalizedMaxChars {
  if (maxChars === undefined) {
    return undefined;
  }

  if (maxChars === 'none') {
    return 'none';
  }

  if (typeof maxChars === 'number') {
    return Number.isFinite(maxChars) && maxChars > 0 ? maxChars : undefined;
  }

  const trimmed = maxChars.trim();
  const normalized = trimmed.startsWith('{') && trimmed.endsWith('}')
    ? trimmed.slice(1, -1).trim()
    : trimmed;

  if (normalized === 'none') {
    return 'none';
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}
