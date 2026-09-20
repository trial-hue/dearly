export const SVG_MAX_BYTES = 20 * 1024;

/**
 * Sanitise an SVG string from an untrusted source (the AI or an upload): no scripts, no
 * foreignObject, no event handlers, no links or external references, under 20 KB.
 * Returns null when the input is not an SVG document or is too large.
 */
export function sanitiseSvg(input: string): string | null {
  if (typeof input !== 'string') return null;
  let svg = input.trim();
  const start = svg.indexOf('<svg');
  const end = svg.lastIndexOf('</svg>');
  if (start === -1 || end === -1) return null;
  svg = svg.slice(start, end + 6);
  if (Buffer.byteLength(svg, 'utf8') > SVG_MAX_BYTES) return null;

  svg = svg.replace(/<!--[\s\S]*?-->/g, '');
  svg = svg.replace(/<!DOCTYPE[\s\S]*?>/gi, '');
  svg = svg.replace(/<\?xml[\s\S]*?\?>/gi, '');
  for (const tag of [
    'script',
    'foreignObject',
    'iframe',
    'object',
    'embed',
    'style',
    'a',
    'image',
    'use',
    'animate',
    'set',
    'animateTransform',
    'animateMotion',
    'feImage',
  ]) {
    svg = svg.replace(new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}\\s*>`, 'gi'), '');
    svg = svg.replace(new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi'), '');
  }
  // Event handler attributes and links, quoted or bare.
  svg = svg.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  svg = svg.replace(/\s+(?:xlink:)?href\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  // External references in url(...) and any remaining protocol handlers.
  svg = svg.replace(/url\s*\(\s*(?!#)[^)]*\)/gi, 'none');
  svg = svg.replace(/(javascript|data|vbscript)\s*:/gi, '');
  if (/<script|<foreignObject|\son[a-z]+=|href=/i.test(svg)) return null;
  return svg;
}
