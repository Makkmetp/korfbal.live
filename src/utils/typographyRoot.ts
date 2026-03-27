interface BuildTypographyRootOptions {
  baseClass: string;
  userClass: unknown;
  userStyle: unknown;
  inlineStyles?: Array<string | undefined>;
}

interface TypographyRootResult {
  className: string;
  style: string | undefined;
}

export function buildTypographyRoot({
  baseClass,
  userClass,
  userStyle,
  inlineStyles = [],
}: BuildTypographyRootOptions): TypographyRootResult {
  const className = [baseClass, typeof userClass === 'string' ? userClass : undefined]
    .filter(Boolean)
    .join(' ');

  const styleParts = [
    typeof userStyle === 'string' ? userStyle : undefined,
    ...inlineStyles,
  ].filter(Boolean);

  return {
    className,
    style: styleParts.length > 0 ? styleParts.join(' ') : undefined,
  };
}
