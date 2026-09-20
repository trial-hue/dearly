import { DISPLAY_FONT, H, HAND_FONT, W, type Shape } from './scene';

export interface Palette {
  bg: string;
  ink: string;
  a: string;
  b: string;
  c: string;
  d: string;
  light: string;
}

export const PALETTES = {
  coral: {
    bg: '#FFF1EC',
    ink: '#2B2340',
    a: '#F26B5B',
    b: '#FFB347',
    c: '#2B55C6',
    d: '#1B7A5A',
    light: '#FFFFFF',
  },
  blush: {
    bg: '#FFE6EC',
    ink: '#3B1F2B',
    a: '#E0274C',
    b: '#FF8FA3',
    c: '#14213D',
    d: '#F5A623',
    light: '#FFFFFF',
  },
  butter: {
    bg: '#FFF3CC',
    ink: '#3A2E12',
    a: '#F5A623',
    b: '#E0274C',
    c: '#2B55C6',
    d: '#1B7A5A',
    light: '#FFFFFF',
  },
  mint: {
    bg: '#DDF5EA',
    ink: '#0F3D2E',
    a: '#1B7A5A',
    b: '#7AD3B0',
    c: '#F5A623',
    d: '#E0274C',
    light: '#FFFFFF',
  },
  sky: {
    bg: '#E1EEFF',
    ink: '#14213D',
    a: '#2B55C6',
    b: '#8FB0FF',
    c: '#E0274C',
    d: '#F5A623',
    light: '#FFFFFF',
  },
  lilac: {
    bg: '#EDE6FF',
    ink: '#2A1F4D',
    a: '#6C4BD3',
    b: '#B39DFF',
    c: '#FFB347',
    d: '#E0274C',
    light: '#FFFFFF',
  },
  night: {
    bg: '#14213D',
    ink: '#FFFFFF',
    a: '#FFD166',
    b: '#FFFFFF',
    c: '#8FB0FF',
    d: '#FF8FA3',
    light: '#FFFFFF',
  },
  forest: {
    bg: '#0F3D2E',
    ink: '#FFFFFF',
    a: '#FFD166',
    b: '#E0274C',
    c: '#DDF5EA',
    d: '#7AD3B0',
    light: '#FFFFFF',
  },
  paper: {
    bg: '#FFFDF7',
    ink: '#1F1A15',
    a: '#E0274C',
    b: '#F5A623',
    c: '#2B55C6',
    d: '#1B7A5A',
    light: '#FFFFFF',
  },
  plum: {
    bg: '#3A1F3D',
    ink: '#FFFFFF',
    a: '#F5A623',
    b: '#FF6B6B',
    c: '#FFE6EC',
    d: '#B39DFF',
    light: '#FFFFFF',
  },
  sand: {
    bg: '#F7EBDD',
    ink: '#3A2A1A',
    a: '#C96B3C',
    b: '#E7B77E',
    c: '#1B7A5A',
    d: '#2B55C6',
    light: '#FFFFFF',
  },
  ocean: {
    bg: '#DDEFF7',
    ink: '#0F2A44',
    a: '#1E6FB0',
    b: '#7CC4E8',
    c: '#F5A623',
    d: '#E0274C',
    light: '#FFFFFF',
  },
} as const satisfies Record<string, Palette>;

export type PaletteName = keyof typeof PALETTES;

/** Deterministic pseudo-random sequence so scatter patterns are stable per design. */
export function rng(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 10_000) / 10_000;
  };
}

const sh = (tag: Shape['tag'], attrs: Shape['attrs'], text?: string): Shape =>
  text === undefined ? { tag, attrs } : { tag, attrs, text };

// Grounds and patterns

export const bg = (color: string): Shape[] => [sh('rect', { width: W, height: H, fill: color })];

export const frame = (color: string, inset = 12, radius = 6, width = 2): Shape[] => [
  sh('rect', {
    x: inset,
    y: inset,
    width: W - inset * 2,
    height: H - inset * 2,
    rx: radius,
    fill: 'none',
    stroke: color,
    strokeWidth: width,
  }),
];

export const bandTop = (color: string, h: number): Shape[] => [
  sh('rect', { width: W, height: h, fill: color }),
];
export const bandBottom = (color: string, h: number): Shape[] => [
  sh('rect', { y: H - h, width: W, height: h, fill: color }),
];

export function dots(
  color: string,
  cols: number,
  rows: number,
  r: number,
  opacity = 0.35,
  offsetY = 0,
): Shape[] {
  const out: Shape[] = [];
  const dx = W / cols;
  const dy = (H - offsetY) / rows;
  for (let i = 0; i < cols; i++)
    for (let j = 0; j < rows; j++)
      out.push(
        sh('circle', {
          cx: dx / 2 + i * dx + (j % 2 ? dx / 2 : 0),
          cy: offsetY + dy / 2 + j * dy,
          r,
          fill: color,
          opacity,
        }),
      );
  return out;
}

export function diagonalStripes(color: string, count = 8, width = 14, opacity = 0.35): Shape[] {
  const out: Shape[] = [];
  for (let i = 0; i < count; i++) {
    const x = -H + (i * (W + H)) / count;
    out.push(
      sh('polygon', {
        points: `${x},${H} ${x + width},${H} ${x + width + H},0 ${x + H},0`,
        fill: color,
        opacity,
      }),
    );
  }
  return out;
}

export function scallop(color: string, y: number, r = 14, top = true): Shape[] {
  const out: Shape[] = [
    sh('rect', { x: 0, y: top ? 0 : y, width: W, height: top ? y : H - y, fill: color }),
  ];
  for (let x = r; x < W + r; x += r * 2) out.push(sh('circle', { cx: x, cy: y, r, fill: color }));
  return out;
}

export function confetti(
  seed: number,
  count: number,
  colors: string[],
  region: { x: number; y: number; w: number; h: number } = { x: 0, y: 0, w: W, h: H },
): Shape[] {
  const r = rng(seed);
  const out: Shape[] = [];
  for (let i = 0; i < count; i++) {
    const x = region.x + r() * region.w;
    const y = region.y + r() * region.h;
    const c = colors[i % colors.length] ?? colors[0] ?? '#000';
    const kind = i % 3;
    if (kind === 0)
      out.push(
        sh('rect', {
          x,
          y,
          width: 7,
          height: 12,
          rx: 2,
          fill: c,
          transform: `rotate(${Math.round(r() * 360)} ${x + 3} ${y + 6})`,
        }),
      );
    else if (kind === 1) out.push(sh('circle', { cx: x, cy: y, r: 3.5, fill: c }));
    else
      out.push(
        sh('path', {
          d: `M${x} ${y} q6 -8 12 0`,
          stroke: c,
          strokeWidth: 2.5,
          fill: 'none',
          strokeLinecap: 'round',
        }),
      );
  }
  return out;
}

export function sparkles(
  seed: number,
  count: number,
  color: string,
  region = { x: 10, y: 10, w: W - 20, h: H - 20 },
  size = 6,
): Shape[] {
  const r = rng(seed);
  const out: Shape[] = [];
  for (let i = 0; i < count; i++)
    out.push(
      ...sparkle(
        region.x + r() * region.w,
        region.y + r() * region.h,
        size * (0.6 + r() * 0.8),
        color,
      ),
    );
  return out;
}

export const sparkle = (x: number, y: number, s: number, color: string): Shape[] => [
  sh('path', {
    d: `M${x} ${y - s} Q${x} ${y} ${x + s} ${y} Q${x} ${y} ${x} ${y + s} Q${x} ${y} ${x - s} ${y} Q${x} ${y} ${x} ${y - s}Z`,
    fill: color,
  }),
];

export function star5(cx: number, cy: number, r: number, color: string): Shape[] {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 ? r * 0.45 : r;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    pts.push(`${cx + Math.cos(a) * rad},${cy + Math.sin(a) * rad}`);
  }
  return [sh('polygon', { points: pts.join(' '), fill: color })];
}

// Party

export function balloon(
  x: number,
  y: number,
  r: number,
  color: string,
  stringLen = 70,
  sway = 8,
): Shape[] {
  return [
    sh('path', {
      d: `M${x} ${y + r * 1.25} q${sway} ${stringLen / 2} ${-sway} ${stringLen}`,
      stroke: '#3B2F2F',
      strokeWidth: 1.2,
      fill: 'none',
      opacity: 0.7,
    }),
    sh('ellipse', { cx: x, cy: y, rx: r, ry: r * 1.2, fill: color }),
    sh('ellipse', {
      cx: x - r * 0.35,
      cy: y - r * 0.45,
      rx: r * 0.22,
      ry: r * 0.4,
      fill: '#FFFFFF',
      opacity: 0.45,
    }),
    sh('path', { d: `M${x - 4} ${y + r * 1.18} l4 7 l4 -7z`, fill: color }),
  ];
}

export function balloonBunch(x: number, y: number, colors: string[], r = 30): Shape[] {
  const offsets: [number, number][] = [
    [-r * 1.1, 6],
    [r * 1.1, 14],
    [0, -r * 0.6],
    [-r * 0.45, r * 1.05],
    [r * 0.6, r * 1.1],
  ];
  return offsets
    .slice(0, colors.length)
    .flatMap(([dx, dy], i) =>
      balloon(
        x + dx,
        y + dy,
        r * (i === 2 ? 1.1 : 0.92),
        colors[i] ?? '#E0274C',
        90 - dy,
        i % 2 ? 6 : -6,
      ),
    );
}

export function bunting(
  y: number,
  colors: string[],
  sag = 22,
  count = 9,
  from = -6,
  to = W + 6,
): Shape[] {
  const out: Shape[] = [];
  const step = (to - from) / count;
  const pts: string[] = [];
  for (let i = 0; i <= count; i++) {
    const t = i / count;
    pts.push(`${from + step * i},${y + Math.sin(Math.PI * t) * sag}`);
  }
  out.push(
    sh('path', {
      d: `M${pts.join(' L')}`,
      stroke: '#3B2F2F',
      strokeWidth: 1.4,
      fill: 'none',
      opacity: 0.6,
    }),
  );
  for (let i = 0; i < count; i++) {
    const t0 = i / count;
    const t1 = (i + 1) / count;
    const x0 = from + step * i;
    const x1 = from + step * (i + 1);
    const y0 = y + Math.sin(Math.PI * t0) * sag;
    const y1 = y + Math.sin(Math.PI * t1) * sag;
    out.push(
      sh('polygon', {
        points: `${x0},${y0} ${x1},${y1} ${(x0 + x1) / 2},${(y0 + y1) / 2 + step * 0.9}`,
        fill: colors[i % colors.length] ?? '#E0274C',
      }),
    );
  }
  return out;
}

export function candle(x: number, y: number, h: number, color: string, flame = '#FFD166'): Shape[] {
  return [
    sh('rect', { x: x - 3, y: y - h, width: 6, height: h, rx: 1.5, fill: color }),
    sh('rect', { x: x - 3, y: y - h + 6, width: 6, height: 3, fill: '#FFFFFF', opacity: 0.5 }),
    sh('ellipse', { cx: x, cy: y - h - 8, rx: 4, ry: 7, fill: flame }),
    sh('ellipse', { cx: x, cy: y - h - 7, rx: 1.8, ry: 3.5, fill: '#FFFFFF', opacity: 0.8 }),
  ];
}

export function cake(
  cx: number,
  baseY: number,
  w: number,
  tiers: string[],
  candles: number,
  candleColor = '#FFFFFF',
  plate = '#FFFFFF',
): Shape[] {
  const out: Shape[] = [
    sh('ellipse', { cx, cy: baseY + 4, rx: w / 2 + 14, ry: 8, fill: plate, opacity: 0.9 }),
  ];
  let y = baseY;
  let tw = w;
  const th = 34;
  tiers.forEach((color, i) => {
    out.push(sh('rect', { x: cx - tw / 2, y: y - th, width: tw, height: th, rx: 4, fill: color }));
    for (let k = 0; k < Math.max(3, Math.round(tw / 22)); k++) {
      const dx = cx - tw / 2 + 8 + (k * (tw - 16)) / Math.max(1, Math.round(tw / 22) - 1);
      out.push(
        sh('path', {
          d: `M${dx - 7} ${y - th} q7 14 14 0`,
          fill: i % 2 ? '#FFFFFF' : '#FFE6EC',
          opacity: 0.9,
        }),
      );
    }
    y -= th;
    tw *= 0.72;
  });
  const topW = tw / 0.72;
  for (let i = 0; i < candles; i++) {
    const x = cx - topW / 2 + 12 + (i * (topW - 24)) / Math.max(1, candles - 1);
    out.push(...candle(x, y, 18, candleColor));
  }
  return out;
}

export function gift(
  x: number,
  y: number,
  w: number,
  h: number,
  box: string,
  ribbon: string,
): Shape[] {
  return [
    sh('rect', { x, y: y + h * 0.22, width: w, height: h * 0.78, rx: 4, fill: box }),
    sh('rect', { x: x - 3, y: y + h * 0.18, width: w + 6, height: h * 0.2, rx: 3, fill: box }),
    sh('rect', {
      x: x + w / 2 - w * 0.09,
      y: y + h * 0.18,
      width: w * 0.18,
      height: h * 0.82,
      fill: ribbon,
    }),
    sh('path', {
      d: `M${x + w / 2} ${y + h * 0.18} c-14 -22 -30 -6 -12 0 c-18 6 -4 22 12 0 c14 -22 30 -6 12 0 c18 6 4 22 -12 0z`,
      fill: ribbon,
    }),
  ];
}

export function cupcake(
  cx: number,
  baseY: number,
  s: number,
  caseColor: string,
  icing: string,
  cherry = '#E0274C',
): Shape[] {
  return [
    sh('path', {
      d: `M${cx - s * 0.5} ${baseY - s * 0.6} L${cx - s * 0.36} ${baseY} L${cx + s * 0.36} ${baseY} L${cx + s * 0.5} ${baseY - s * 0.6}Z`,
      fill: caseColor,
    }),
    sh('path', {
      d: `M${cx - s * 0.42} ${baseY - s * 0.45} l${s * 0.08} ${s * 0.36} M${cx} ${baseY - s * 0.5} l0 ${s * 0.42} M${cx + s * 0.42} ${baseY - s * 0.45} l${-s * 0.08} ${s * 0.36}`,
      stroke: '#FFFFFF',
      strokeWidth: 1.5,
      opacity: 0.6,
    }),
    sh('path', {
      d: `M${cx - s * 0.55} ${baseY - s * 0.6} q${s * 0.1} -${s * 0.45} ${s * 0.32} -${s * 0.3} q${s * 0.05} -${s * 0.35} ${s * 0.3} -${s * 0.2} q${s * 0.3} -${s * 0.15} ${s * 0.3} ${s * 0.2} q${s * 0.25} 0 ${s * 0.18} ${s * 0.3}z`,
      fill: icing,
    }),
    sh('circle', { cx, cy: baseY - s * 1.12, r: s * 0.09, fill: cherry }),
  ];
}

export function partyHat(
  cx: number,
  baseY: number,
  h: number,
  color: string,
  stripe: string,
): Shape[] {
  const w = h * 0.7;
  return [
    sh('polygon', {
      points: `${cx - w / 2},${baseY} ${cx + w / 2},${baseY} ${cx},${baseY - h}`,
      fill: color,
    }),
    sh('path', {
      d: `M${cx - w * 0.3} ${baseY - h * 0.42} L${cx + w * 0.3} ${baseY - h * 0.42} L${cx + w * 0.16} ${baseY - h * 0.7} L${cx - w * 0.16} ${baseY - h * 0.7}Z`,
      fill: stripe,
    }),
    sh('circle', { cx, cy: baseY - h - 2, r: 6, fill: stripe }),
  ];
}

// Botanical

export function flower(
  cx: number,
  cy: number,
  r: number,
  petals: number,
  petal: string,
  centre: string,
): Shape[] {
  const out: Shape[] = [];
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * 360;
    out.push(
      sh('ellipse', {
        cx,
        cy: cy - r * 0.6,
        rx: r * 0.42,
        ry: r * 0.62,
        fill: petal,
        transform: `rotate(${a} ${cx} ${cy})`,
      }),
    );
  }
  out.push(sh('circle', { cx, cy, r: r * 0.32, fill: centre }));
  return out;
}

export function leafSprig(
  x: number,
  y: number,
  len: number,
  angle: number,
  color: string,
  leaves = 5,
): Shape[] {
  const out: Shape[] = [
    sh('path', {
      d: `M0 0 L0 ${-len}`,
      stroke: color,
      strokeWidth: 2,
      fill: 'none',
      transform: `translate(${x} ${y}) rotate(${angle})`,
    }),
  ];
  for (let i = 0; i < leaves; i++) {
    const ly = -len * ((i + 1) / (leaves + 1));
    const side = i % 2 ? 1 : -1;
    out.push(
      sh('path', {
        d: `M0 ${ly} q${side * 14} -6 ${side * 18} -18 q-12 4 -18 18z`,
        fill: color,
        transform: `translate(${x} ${y}) rotate(${angle})`,
      }),
    );
  }
  return out;
}

export function tulip(
  cx: number,
  baseY: number,
  h: number,
  color: string,
  stem = '#1B7A5A',
): Shape[] {
  return [
    sh('path', {
      d: `M${cx} ${baseY} L${cx} ${baseY - h * 0.55}`,
      stroke: stem,
      strokeWidth: 4,
      strokeLinecap: 'round',
    }),
    sh('path', { d: `M${cx} ${baseY - h * 0.25} q-24 -6 -30 -34 q22 4 30 30`, fill: stem }),
    sh('path', {
      d: `M${cx - 22} ${baseY - h * 0.55} q0 -${h * 0.5} 22 -${h * 0.5} q22 0 22 ${h * 0.5} q-11 -14 -22 0 q-11 -14 -22 0z`,
      fill: color,
    }),
    sh('path', {
      d: `M${cx - 10} ${baseY - h * 0.62} q4 -${h * 0.25} 10 -${h * 0.3}`,
      stroke: '#FFFFFF',
      strokeWidth: 2,
      opacity: 0.35,
      fill: 'none',
    }),
  ];
}

export function heart(cx: number, cy: number, s: number, color: string): Shape[] {
  return [
    sh('path', {
      d: 'M0 40 C-60 -10 -40 -60 0 -28 C40 -60 60 -10 0 40z',
      fill: color,
      transform: `translate(${cx} ${cy}) scale(${s / 60})`,
    }),
  ];
}

export function wreath(
  cx: number,
  cy: number,
  r: number,
  leaf: string,
  berry: string,
  leaves = 18,
): Shape[] {
  const out: Shape[] = [];
  for (let i = 0; i < leaves; i++) {
    const a = (i / leaves) * 360;
    out.push(
      sh('path', {
        d: `M0 ${-r} q14 -10 22 0 q-8 10 -22 0z`,
        fill: leaf,
        transform: `rotate(${a} ${cx} ${cy}) translate(${cx} ${cy}) rotate(70)`,
      }),
    );
    out.push(
      sh('path', {
        d: `M0 ${-r} q-14 -10 -22 0 q8 10 22 0z`,
        fill: leaf,
        opacity: 0.85,
        transform: `rotate(${a + 10} ${cx} ${cy}) translate(${cx} ${cy}) rotate(70)`,
      }),
    );
    if (i % 3 === 0)
      out.push(
        sh('circle', {
          cx: cx + Math.cos(((a + 5) * Math.PI) / 180) * r,
          cy: cy + Math.sin(((a + 5) * Math.PI) / 180) * r,
          r: 4,
          fill: berry,
        }),
      );
  }
  return out;
}

// Faith and festival

export const crescent = (
  cx: number,
  cy: number,
  r: number,
  color: string,
  bgColor: string,
): Shape[] => [
  sh('circle', { cx, cy, r, fill: color }),
  sh('circle', { cx: cx + r * 0.42, cy: cy - r * 0.18, r: r * 0.9, fill: bgColor }),
];

export function lantern(cx: number, top: number, h: number, color: string, glow: string): Shape[] {
  const w = h * 0.55;
  return [
    sh('path', { d: `M${cx} ${top - 26} L${cx} ${top}`, stroke: color, strokeWidth: 1.5 }),
    sh('rect', { x: cx - w * 0.3, y: top, width: w * 0.6, height: 6, rx: 2, fill: color }),
    sh('path', {
      d: `M${cx - w / 2} ${top + 14} q${w / 2} -14 ${w} 0 L${cx + w * 0.4} ${top + h - 14} q-${w * 0.4} 12 -${w * 0.8} 0Z`,
      fill: glow,
    }),
    sh('path', {
      d: `M${cx - w / 2} ${top + 14} q${w / 2} -14 ${w} 0 L${cx + w * 0.4} ${top + h - 14} q-${w * 0.4} 12 -${w * 0.8} 0Z`,
      fill: 'none',
      stroke: color,
      strokeWidth: 2,
    }),
    sh('path', {
      d: `M${cx - w * 0.3} ${top + 28} L${cx + w * 0.3} ${top + 28} M${cx - w * 0.35} ${top + h * 0.6} L${cx + w * 0.35} ${top + h * 0.6}`,
      stroke: color,
      strokeWidth: 1.5,
    }),
    sh('rect', {
      x: cx - w * 0.22,
      y: top + h - 14,
      width: w * 0.44,
      height: 8,
      rx: 2,
      fill: color,
    }),
    sh('circle', { cx, cy: top + h + 2, r: 3, fill: color }),
  ];
}

export function arch(cx: number, top: number, w: number, h: number, color: string): Shape[] {
  return [
    sh('path', {
      d: `M${cx - w / 2} ${top + h} L${cx - w / 2} ${top + w / 2} Q${cx - w / 2} ${top + w * 0.1} ${cx} ${top} Q${cx + w / 2} ${top + w * 0.1} ${cx + w / 2} ${top + w / 2} L${cx + w / 2} ${top + h}Z`,
      fill: color,
    }),
  ];
}

export function star8(cx: number, cy: number, r: number, color: string): Shape[] {
  const a = r;
  const b = r * 0.72;
  return [
    sh('rect', {
      x: cx - a,
      y: cy - a,
      width: a * 2,
      height: a * 2,
      fill: color,
      transform: `rotate(45 ${cx} ${cy}) scale(0.72) translate(${(cx * 0.28) / 0.72} ${(cy * 0.28) / 0.72})`,
    }),
    sh('rect', { x: cx - b, y: cy - b, width: b * 2, height: b * 2, fill: color }),
  ];
}

export function diya(
  cx: number,
  baseY: number,
  w: number,
  body: string,
  rim: string,
  flame = '#FFD166',
): Shape[] {
  return [
    sh('path', {
      d: `M${cx - w / 2} ${baseY - 22} q${w / 2} 44 ${w} 0 q-6 22 -${w / 2} 26 q-${w / 2 - 6} -4 -${w / 2} -26z`,
      fill: body,
    }),
    sh('ellipse', { cx, cy: baseY - 22, rx: w / 2, ry: 8, fill: rim }),
    sh('path', { d: `M${cx} ${baseY - 30} q-14 -22 0 -46 q14 24 0 46z`, fill: flame }),
    sh('path', {
      d: `M${cx} ${baseY - 34} q-6 -12 0 -24 q6 12 0 24z`,
      fill: '#FFFFFF',
      opacity: 0.8,
    }),
  ];
}

export function rangoli(cx: number, cy: number, r: number, colors: string[]): Shape[] {
  const out: Shape[] = [];
  const rings = 3;
  for (let ring = rings; ring >= 1; ring--) {
    const rr = (r * ring) / rings;
    const petals = 6 + ring * 2;
    for (let i = 0; i < petals; i++) {
      out.push(
        sh('ellipse', {
          cx,
          cy: cy - rr * 0.6,
          rx: rr * 0.22,
          ry: rr * 0.42,
          fill: colors[(ring + i) % colors.length] ?? '#E0274C',
          transform: `rotate(${(i / petals) * 360} ${cx} ${cy})`,
        }),
      );
    }
  }
  out.push(sh('circle', { cx, cy, r: r * 0.14, fill: colors[0] ?? '#F5A623' }));
  return out;
}

export function firework(cx: number, cy: number, r: number, color: string, rays = 12): Shape[] {
  const out: Shape[] = [];
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2;
    out.push(
      sh('line', {
        x1: cx + Math.cos(a) * r * 0.25,
        y1: cy + Math.sin(a) * r * 0.25,
        x2: cx + Math.cos(a) * r,
        y2: cy + Math.sin(a) * r,
        stroke: color,
        strokeWidth: 2,
        strokeLinecap: 'round',
      }),
    );
    out.push(
      sh('circle', {
        cx: cx + Math.cos(a) * r * 1.12,
        cy: cy + Math.sin(a) * r * 1.12,
        r: 2.2,
        fill: color,
      }),
    );
  }
  return out;
}

export function menorah(cx: number, baseY: number, color: string, flame: string): Shape[] {
  const out: Shape[] = [
    sh('rect', { x: cx - 6, y: baseY - 70, width: 12, height: 70, rx: 3, fill: color }),
    sh('rect', { x: cx - 46, y: baseY - 6, width: 92, height: 10, rx: 4, fill: color }),
  ];
  for (let i = -4; i <= 4; i++) {
    const x = cx + i * 20;
    const h = i === 0 ? 96 : 76;
    if (i !== 0)
      out.push(
        sh('path', {
          d: `M${cx} ${baseY - 70} Q${x} ${baseY - 70} ${x} ${baseY - h + 10}`,
          stroke: color,
          strokeWidth: 6,
          fill: 'none',
          strokeLinecap: 'round',
        }),
      );
    out.push(sh('rect', { x: x - 4, y: baseY - h, width: 8, height: 12, rx: 2, fill: color }));
    out.push(
      sh('rect', { x: x - 2.5, y: baseY - h - 16, width: 5, height: 16, rx: 1.5, fill: '#FFFFFF' }),
    );
    out.push(sh('ellipse', { cx: x, cy: baseY - h - 24, rx: 4, ry: 7, fill: flame }));
  }
  return out;
}

export function dreidel(
  cx: number,
  cy: number,
  s: number,
  color: string,
  letterColor: string,
): Shape[] {
  return [
    sh('rect', {
      x: cx - s * 0.08,
      y: cy - s * 0.9,
      width: s * 0.16,
      height: s * 0.3,
      rx: 2,
      fill: color,
      transform: `rotate(-15 ${cx} ${cy})`,
    }),
    sh('rect', {
      x: cx - s * 0.5,
      y: cy - s * 0.6,
      width: s,
      height: s * 0.9,
      rx: 6,
      fill: color,
      transform: `rotate(-15 ${cx} ${cy})`,
    }),
    sh('polygon', {
      points: `${cx - s * 0.5},${cy + s * 0.3} ${cx + s * 0.5},${cy + s * 0.3} ${cx},${cy + s * 0.9}`,
      fill: color,
      transform: `rotate(-15 ${cx} ${cy})`,
    }),
    sh(
      'text',
      {
        x: cx,
        y: cy + s * 0.1,
        textAnchor: 'middle',
        fontFamily: DISPLAY_FONT,
        fontWeight: 800,
        fontSize: s * 0.5,
        fill: letterColor,
        transform: `rotate(-15 ${cx} ${cy})`,
      },
      'נ',
    ),
  ];
}

export function starOfDavid(cx: number, cy: number, r: number, color: string, width = 4): Shape[] {
  const tri = (rot: number) => {
    const pts: string[] = [];
    for (let i = 0; i < 3; i++) {
      const a = ((i * 120 + rot) * Math.PI) / 180 - Math.PI / 2;
      pts.push(`${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`);
    }
    return sh('polygon', {
      points: pts.join(' '),
      fill: 'none',
      stroke: color,
      strokeWidth: width,
      strokeLinejoin: 'round',
    });
  };
  return [tri(0), tri(180)];
}

export function tree(
  cx: number,
  baseY: number,
  h: number,
  color: string,
  trunk = '#7A4B22',
): Shape[] {
  const w = h * 0.7;
  return [
    sh('rect', {
      x: cx - w * 0.08,
      y: baseY - h * 0.12,
      width: w * 0.16,
      height: h * 0.14,
      fill: trunk,
    }),
    sh('polygon', {
      points: `${cx},${baseY - h} ${cx + w * 0.3},${baseY - h * 0.6} ${cx - w * 0.3},${baseY - h * 0.6}`,
      fill: color,
    }),
    sh('polygon', {
      points: `${cx},${baseY - h * 0.78} ${cx + w * 0.4},${baseY - h * 0.38} ${cx - w * 0.4},${baseY - h * 0.38}`,
      fill: color,
    }),
    sh('polygon', {
      points: `${cx},${baseY - h * 0.55} ${cx + w * 0.5},${baseY - h * 0.12} ${cx - w * 0.5},${baseY - h * 0.12}`,
      fill: color,
    }),
  ];
}

export const bauble = (cx: number, cy: number, r: number, color: string): Shape[] => [
  sh('rect', { x: cx - 2, y: cy - r - 5, width: 4, height: 5, fill: '#B08D57' }),
  sh('circle', { cx, cy, r, fill: color }),
  sh('circle', {
    cx: cx - r * 0.35,
    cy: cy - r * 0.35,
    r: r * 0.25,
    fill: '#FFFFFF',
    opacity: 0.5,
  }),
];

export function snow(seed: number, count: number, color: string, opacity = 0.9): Shape[] {
  const r = rng(seed);
  const out: Shape[] = [];
  for (let i = 0; i < count; i++)
    out.push(sh('circle', { cx: r() * W, cy: r() * H, r: 1.5 + r() * 2.5, fill: color, opacity }));
  return out;
}

export function holly(
  cx: number,
  cy: number,
  s: number,
  leaf = '#1B7A5A',
  berry = '#E0274C',
): Shape[] {
  return [
    sh('path', {
      d: `M0 0 q-8 -14 -22 -14 q4 10 -6 18 q12 -2 18 8 q4 -8 10 -12z`,
      fill: leaf,
      transform: `translate(${cx} ${cy}) scale(${s / 20})`,
    }),
    sh('path', {
      d: `M0 0 q8 -14 22 -14 q-4 10 6 18 q-12 -2 -18 8 q-4 -8 -10 -12z`,
      fill: leaf,
      transform: `translate(${cx} ${cy}) scale(${s / 20})`,
    }),
    sh('circle', { cx: cx - s * 0.2, cy: cy + s * 0.15, r: s * 0.16, fill: berry }),
    sh('circle', { cx: cx + s * 0.2, cy: cy + s * 0.18, r: s * 0.16, fill: berry }),
    sh('circle', { cx, cy: cy + s * 0.32, r: s * 0.16, fill: berry }),
  ];
}

// Scenes and objects

export function sun(
  cx: number,
  cy: number,
  r: number,
  color: string,
  rays = 14,
  rayColor?: string,
): Shape[] {
  const out: Shape[] = [];
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2;
    out.push(
      sh('line', {
        x1: cx + Math.cos(a) * r * 1.25,
        y1: cy + Math.sin(a) * r * 1.25,
        x2: cx + Math.cos(a) * r * 1.7,
        y2: cy + Math.sin(a) * r * 1.7,
        stroke: rayColor ?? color,
        strokeWidth: 5,
        strokeLinecap: 'round',
      }),
    );
  }
  out.push(sh('circle', { cx, cy, r, fill: color }));
  return out;
}

export const cloud = (x: number, y: number, w: number, color: string): Shape[] => [
  sh('ellipse', { cx: x, cy: y, rx: w * 0.5, ry: w * 0.22, fill: color }),
  sh('circle', { cx: x - w * 0.15, cy: y - w * 0.12, r: w * 0.22, fill: color }),
  sh('circle', { cx: x + w * 0.15, cy: y - w * 0.16, r: w * 0.26, fill: color }),
];

export const hills = (y: number, colors: string[]): Shape[] =>
  colors.map((c, i) =>
    sh('path', {
      d: `M0 ${H} L0 ${y + i * 26} Q${W * (0.25 + i * 0.2)} ${y - 40 + i * 30} ${W * 0.6} ${y + 10 + i * 24} Q${W * 0.85} ${y + 40 + i * 16} ${W} ${y + 20 + i * 20} L${W} ${H}Z`,
      fill: c,
    }),
  );

export function suitcase(cx: number, cy: number, w: number, color: string, trim: string): Shape[] {
  const h = w * 0.7;
  return [
    sh('rect', {
      x: cx - w * 0.2,
      y: cy - h / 2 - 10,
      width: w * 0.4,
      height: 14,
      rx: 5,
      fill: 'none',
      stroke: trim,
      strokeWidth: 4,
    }),
    sh('rect', { x: cx - w / 2, y: cy - h / 2, width: w, height: h, rx: 8, fill: color }),
    sh('rect', {
      x: cx - w / 2,
      y: cy - h * 0.1,
      width: w,
      height: h * 0.2,
      fill: trim,
      opacity: 0.85,
    }),
    sh('rect', {
      x: cx - w * 0.06,
      y: cy - h * 0.16,
      width: w * 0.12,
      height: h * 0.32,
      rx: 2,
      fill: '#FFFFFF',
    }),
    sh('circle', { cx: cx - w * 0.3, cy: cy + h / 2 + 4, r: 5, fill: trim }),
    sh('circle', { cx: cx + w * 0.3, cy: cy + h / 2 + 4, r: 5, fill: trim }),
  ];
}

export const paperPlane = (
  cx: number,
  cy: number,
  s: number,
  color: string,
  shade: string,
): Shape[] => [
  sh('polygon', {
    points: `${cx - s},${cy + s * 0.2} ${cx + s},${cy - s * 0.5} ${cx - s * 0.2},${cy + s * 0.7}`,
    fill: color,
  }),
  sh('polygon', {
    points: `${cx - s * 0.2},${cy + s * 0.7} ${cx + s},${cy - s * 0.5} ${cx - s * 0.05},${cy + s * 0.3}`,
    fill: shade,
  }),
  sh('path', {
    d: `M${cx - s * 1.4} ${cy + s * 0.9} q${s * 0.5} -${s * 0.3} ${s * 0.3} -${s * 0.7}`,
    stroke: shade,
    strokeWidth: 1.5,
    fill: 'none',
    strokeDasharray: '4 4',
  }),
];

export function rocket(
  cx: number,
  baseY: number,
  h: number,
  color: string,
  fin: string,
  flame = '#FFD166',
): Shape[] {
  const w = h * 0.36;
  return [
    sh('path', {
      d: `M${cx} ${baseY + 8} q-${w * 0.35} ${h * 0.25} 0 ${h * 0.4} q${w * 0.35} -${h * 0.15} 0 -${h * 0.4}z`,
      fill: flame,
    }),
    sh('path', {
      d: `M${cx - w / 2} ${baseY} L${cx - w / 2} ${baseY - h * 0.55} Q${cx} ${baseY - h * 1.15} ${cx + w / 2} ${baseY - h * 0.55} L${cx + w / 2} ${baseY}Z`,
      fill: color,
    }),
    sh('polygon', {
      points: `${cx - w / 2},${baseY - h * 0.35} ${cx - w},${baseY + 4} ${cx - w / 2},${baseY}`,
      fill: fin,
    }),
    sh('polygon', {
      points: `${cx + w / 2},${baseY - h * 0.35} ${cx + w},${baseY + 4} ${cx + w / 2},${baseY}`,
      fill: fin,
    }),
    sh('circle', { cx, cy: baseY - h * 0.55, r: w * 0.24, fill: '#FFFFFF' }),
    sh('circle', { cx, cy: baseY - h * 0.55, r: w * 0.16, fill: '#8FB0FF' }),
  ];
}

export function laurel(cx: number, cy: number, r: number, color: string): Shape[] {
  const out: Shape[] = [];
  for (const side of [-1, 1]) {
    for (let i = 0; i < 7; i++) {
      const a = (-30 + i * 20) * side;
      out.push(
        sh('path', {
          d: `M0 0 q${10 * side} -14 ${22 * side} -8 q-8 12 -22 8z`,
          fill: color,
          transform: `translate(${cx + Math.sin((a * Math.PI) / 180) * r} ${cy + Math.cos((a * Math.PI) / 180) * r}) rotate(${-a})`,
        }),
      );
    }
  }
  return out;
}

export function trophy(
  cx: number,
  baseY: number,
  h: number,
  color: string,
  shade: string,
): Shape[] {
  const w = h * 0.6;
  return [
    sh('rect', {
      x: cx - w * 0.35,
      y: baseY - h * 0.08,
      width: w * 0.7,
      height: h * 0.08,
      rx: 2,
      fill: shade,
    }),
    sh('rect', {
      x: cx - w * 0.1,
      y: baseY - h * 0.3,
      width: w * 0.2,
      height: h * 0.22,
      fill: color,
    }),
    sh('path', {
      d: `M${cx - w / 2} ${baseY - h} L${cx + w / 2} ${baseY - h} q0 ${h * 0.55} -${w / 2} ${h * 0.7} q-${w / 2} -${h * 0.15} -${w / 2} -${h * 0.7}z`,
      fill: color,
    }),
    sh('path', {
      d: `M${cx - w / 2} ${baseY - h * 0.9} q-${w * 0.45} 0 -${w * 0.35} ${h * 0.35} q${w * 0.1} ${h * 0.15} ${w * 0.35} ${h * 0.12} M${cx + w / 2} ${baseY - h * 0.9} q${w * 0.45} 0 ${w * 0.35} ${h * 0.35} q-${w * 0.1} ${h * 0.15} -${w * 0.35} ${h * 0.12}`,
      stroke: color,
      strokeWidth: 5,
      fill: 'none',
    }),
    sh('path', {
      d: `M${cx - w * 0.28} ${baseY - h * 0.85} l0 ${h * 0.3}`,
      stroke: '#FFFFFF',
      strokeWidth: 4,
      opacity: 0.35,
      strokeLinecap: 'round',
    }),
  ];
}

export function banner(
  cx: number,
  cy: number,
  w: number,
  h: number,
  color: string,
  text: string,
  textColor: string,
  fontSize = 15,
): Shape[] {
  return [
    sh('path', {
      d: `M${cx - w / 2 - 14} ${cy - h / 2 + 8} L${cx - w / 2} ${cy - h / 2 + 8} L${cx - w / 2} ${cy + h / 2 + 8} L${cx - w / 2 - 14} ${cy + h / 2 + 8} L${cx - w / 2 - 6} ${cy + 8}Z`,
      fill: color,
      opacity: 0.8,
    }),
    sh('path', {
      d: `M${cx + w / 2 + 14} ${cy - h / 2 + 8} L${cx + w / 2} ${cy - h / 2 + 8} L${cx + w / 2} ${cy + h / 2 + 8} L${cx + w / 2 + 14} ${cy + h / 2 + 8} L${cx + w / 2 + 6} ${cy + 8}Z`,
      fill: color,
      opacity: 0.8,
    }),
    sh('rect', { x: cx - w / 2, y: cy - h / 2, width: w, height: h, rx: 4, fill: color }),
    sh(
      'text',
      {
        x: cx,
        y: cy + fontSize * 0.36,
        textAnchor: 'middle',
        fontFamily: DISPLAY_FONT,
        fontWeight: 800,
        fontSize,
        fill: textColor,
        letterSpacing: 0.5,
      },
      text,
    ),
  ];
}

export const speechBubble = (
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): Shape[] => [
  sh('rect', { x, y, width: w, height: h, rx: 16, fill: color }),
  sh('polygon', {
    points: `${x + w * 0.25},${y + h} ${x + w * 0.4},${y + h} ${x + w * 0.22},${y + h + 18}`,
    fill: color,
  }),
];

export const envelope = (
  cx: number,
  cy: number,
  w: number,
  color: string,
  flap: string,
): Shape[] => {
  const h = w * 0.66;
  return [
    sh('rect', { x: cx - w / 2, y: cy - h / 2, width: w, height: h, rx: 6, fill: color }),
    sh('path', {
      d: `M${cx - w / 2} ${cy - h / 2} L${cx} ${cy + h * 0.1} L${cx + w / 2} ${cy - h / 2}`,
      fill: flap,
    }),
    sh('path', {
      d: `M${cx - w / 2} ${cy + h / 2} L${cx} ${cy - h * 0.02} L${cx + w / 2} ${cy + h / 2}`,
      fill: 'none',
      stroke: '#FFFFFF',
      strokeWidth: 1.5,
      opacity: 0.6,
    }),
  ];
};

export function photoFrame(
  x: number,
  y: number,
  w: number,
  h: number,
  frameColor: string,
  label = 'Your photo',
): Shape[] {
  return [
    sh('rect', { x: x - 8, y: y - 8, width: w + 16, height: h + 16, rx: 6, fill: frameColor }),
    sh('rect', { x, y, width: w, height: h, fill: '#D9DEE8' }),
    sh('path', {
      d: `M${x + w * 0.1} ${y + h * 0.8} L${x + w * 0.38} ${y + h * 0.5} L${x + w * 0.56} ${y + h * 0.68} L${x + w * 0.7} ${y + h * 0.56} L${x + w * 0.9} ${y + h * 0.8}Z`,
      fill: '#FFFFFF',
      opacity: 0.9,
    }),
    sh('circle', {
      cx: x + w * 0.72,
      cy: y + h * 0.28,
      r: w * 0.07,
      fill: '#FFFFFF',
      opacity: 0.9,
    }),
    sh(
      'text',
      {
        x: x + w / 2,
        y: y + h * 0.95,
        textAnchor: 'middle',
        fontFamily: DISPLAY_FONT,
        fontSize: 9,
        fontWeight: 600,
        fill: '#5A6478',
      },
      label,
    ),
  ];
}

// Typography

export interface TextOpts {
  size?: number;
  weight?: number;
  color?: string;
  font?: 'display' | 'hand';
  anchor?: 'middle' | 'start' | 'end';
  x?: number;
  letterSpacing?: number;
  opacity?: number;
  rotate?: number;
}

export function title(text: string, y: number, o: TextOpts = {}): Shape[] {
  const x = o.x ?? W / 2;
  const attrs: Shape['attrs'] = {
    x,
    y,
    textAnchor: o.anchor ?? 'middle',
    fontFamily: o.font === 'hand' ? HAND_FONT : DISPLAY_FONT,
    fontWeight: o.weight ?? 800,
    fontSize: o.size ?? 26,
    fill: o.color ?? '#14213D',
  };
  if (o.letterSpacing) attrs.letterSpacing = o.letterSpacing;
  if (o.opacity != null) attrs.opacity = o.opacity;
  if (o.rotate) attrs.transform = `rotate(${o.rotate} ${x} ${y})`;
  return [sh('text', attrs, text)];
}

export function titleLines(
  lines: string[],
  y: number,
  lineHeight: number,
  o: TextOpts = {},
): Shape[] {
  return lines.flatMap((l, i) => title(l, y + i * lineHeight, o));
}

/** The recipient's name in the handwriting face; omitted when there is no name. */
export function nameLine(name: string, y: number, color: string, size = 22): Shape[] {
  return name ? title(name, y, { font: 'hand', weight: 700, size, color }) : [];
}

export function numeral(
  age: number | null,
  y: number,
  size: number,
  color: string,
  fallback = '!',
): Shape[] {
  return title(age == null ? fallback : String(age), y, {
    size,
    weight: 800,
    color,
    letterSpacing: -2,
  });
}

/** Split "Happy birthday" style titles into two balanced lines. */
export function twoLines(text: string): string[] {
  const words = text.split(' ');
  if (words.length < 2) return [text];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')];
}
