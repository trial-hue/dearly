/**
 * Card fronts are described as plain shape lists, so one design renders as React in the
 * interface and as an SVG string for storage and download. The canvas is 264 × 370 (5:7).
 */
export type Attrs = Record<string, string | number>;
export interface Shape {
  tag: 'rect' | 'circle' | 'ellipse' | 'path' | 'line' | 'polygon' | 'text' | 'g';
  attrs: Attrs;
  text?: string;
  children?: Shape[];
}

export interface SceneInput {
  title: string;
  name: string;
  age: number | null;
}

export const W = 264;
export const H = 370;
export const DISPLAY_FONT = "var(--font-display), 'Plus Jakarta Sans', system-ui, sans-serif";
export const HAND_FONT = "var(--font-hand), 'Caveat', cursive";

export const round = (n: number): number => Math.round(n * 10) / 10;

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
export const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function shapeToString(s: Shape): string {
  const attrs = Object.entries(s.attrs)
    .map(([k, v]) => `${kebab(k)}="${escapeXml(String(typeof v === 'number' ? round(v) : v))}"`)
    .join(' ');
  if (s.tag === 'text') return `<text ${attrs}>${escapeXml(s.text ?? '')}</text>`;
  if (s.tag === 'g') return `<g ${attrs}>${(s.children ?? []).map(shapeToString).join('')}</g>`;
  return `<${s.tag} ${attrs}/>`;
}

/** A standalone SVG document. Fonts fall back to system faces outside the app. */
export function sceneToSvgString(
  shapes: Shape[],
  label: string,
  opts: { designId?: string } = {},
): string {
  const body = shapes.map(shapeToString).join('');
  const dataAttr = opts.designId ? ` data-design="${escapeXml(opts.designId)}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${escapeXml(label)}"${dataAttr}>${body}</svg>`;
}

/** Recover the catalogue design id embedded in a stored SVG string, if any. */
export function designIdFromSvg(svg: string): string | null {
  const m = /data-design="([^"]+)"/.exec(svg);
  return m?.[1] ?? null;
}
