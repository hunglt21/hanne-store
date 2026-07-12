import { useState, type CSSProperties } from 'react';

/**
 * Brand logo (Hanne Authentic).
 *
 * To use the ORIGINAL image instead of the built-in vector recreation,
 * just save it as `client/public/brand/hanne-logo.png` — it will be picked
 * up automatically (the .svg is only a fallback). No code change needed.
 */
const CANDIDATES = ['/brand/hanne-logo.png', '/brand/hanne-logo.svg'];

export default function BrandLogo({
  size = 40,
  radius = 12,
  alt = 'Hanne Authentic',
  style,
}: {
  size?: number | string;
  radius?: number | string;
  alt?: string;
  style?: CSSProperties;
}) {
  const [idx, setIdx] = useState(0);
  return (
    <img
      src={CANDIDATES[idx]}
      onError={() => setIdx((n) => (n < CANDIDATES.length - 1 ? n + 1 : n))}
      alt={alt}
      style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover', display: 'block', flexShrink: 0, ...style }}
    />
  );
}
