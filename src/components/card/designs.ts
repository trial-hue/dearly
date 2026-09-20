/**
 * The twelve card fronts as plain shape lists, so the same design renders as React in the
 * interface and as an SVG string for downloads. Paper colours are fixed in both themes.
 */
export type Attrs = Record<string, string | number>;
export interface Shape {
  tag: 'rect' | 'circle' | 'ellipse' | 'path' | 'line' | 'text' | 'g';
  attrs: Attrs;
  text?: string;
  children?: Shape[];
}

export interface SceneInput {
  title: string;
  name: string;
  age: number | null;
}

export const PAPER = '#FFFDF7';
export const INK = '#1F1A15';
const RED = '#C92F3A';
const BLUE = '#2B55C6';
const GOLD = '#D9A441';
const GREEN = '#1B6B57';
const PINK = '#E0708A';
const NIGHT = '#1B2345';

const UI_FONT = 'var(--font-ui), system-ui, sans-serif';
const HAND_FONT = 'var(--font-hand), cursive';

const frame = (bg = PAPER): Shape => ({
  tag: 'rect',
  attrs: { width: 264, height: 370, fill: bg },
});
const title = (text: string, y = 318, fill = INK, size = 22): Shape => ({
  tag: 'text',
  attrs: {
    x: 132,
    y,
    textAnchor: 'middle',
    fontFamily: UI_FONT,
    fontWeight: 700,
    fontSize: size,
    fill,
  },
  text,
});
const name = (text: string, y = 344, fill = INK): Shape => ({
  tag: 'text',
  attrs: { x: 132, y, textAnchor: 'middle', fontFamily: HAND_FONT, fontSize: 20, fill },
  text,
});

const designs: Record<string, (i: SceneInput) => Shape[]> = {
  balloons: (i) => [
    frame(),
    ...(
      [
        [90, 140, RED],
        [150, 110, BLUE],
        [190, 165, GOLD],
      ] as [number, number, string][]
    ).flatMap(([x, y, c], k): Shape[] => [
      {
        tag: 'path',
        attrs: {
          d: `M${x} ${y + 46} q-4 30 ${k % 2 ? 10 : -10} 70`,
          stroke: INK,
          strokeWidth: 1.5,
          fill: 'none',
        },
      },
      { tag: 'ellipse', attrs: { cx: x, cy: y, rx: 34, ry: 44, fill: c } },
      {
        tag: 'ellipse',
        attrs: { cx: x - 12, cy: y - 16, rx: 8, ry: 14, fill: '#ffffff', opacity: 0.45 },
      },
      { tag: 'path', attrs: { d: `M${x - 5} ${y + 44} l5 8 l5 -8z`, fill: c } },
    ]),
    title(i.title),
    name(i.name),
  ],
  confetti: (i) => [
    frame(),
    ...Array.from({ length: 34 }, (_, k): Shape => {
      const x = 20 + ((k * 53) % 224);
      const y = 20 + ((k * 37) % 250);
      return {
        tag: 'rect',
        attrs: {
          x,
          y,
          width: 10,
          height: 16,
          rx: 2,
          fill: [RED, BLUE, GOLD, GREEN, PINK][k % 5] ?? RED,
          transform: `rotate(${(k * 41) % 360} ${x + 5} ${y + 8})`,
        },
      };
    }),
    title(i.title),
    name(i.name),
  ],
  bignumber: (i) => [
    frame(),
    {
      tag: 'text',
      attrs: {
        x: 132,
        y: 215,
        textAnchor: 'middle',
        fontFamily: UI_FONT,
        fontWeight: 700,
        fontSize: i.age != null && i.age >= 100 ? 120 : 170,
        fill: RED,
      },
      text: String(i.age ?? '!'),
    },
    { tag: 'rect', attrs: { x: 40, y: 240, width: 184, height: 3, fill: INK } },
    title(i.title, 300),
    name(i.name, 332),
  ],
  wreath: (i) => [
    frame(),
    {
      tag: 'circle',
      attrs: { cx: 132, cy: 150, r: 78, fill: 'none', stroke: GREEN, strokeWidth: 26 },
    },
    ...Array.from({ length: 12 }, (_, k): Shape => {
      const a = (k / 12) * Math.PI * 2;
      return {
        tag: 'circle',
        attrs: {
          cx: +(132 + Math.cos(a) * 78).toFixed(1),
          cy: +(150 + Math.sin(a) * 78).toFixed(1),
          r: 5.5,
          fill: k % 3 ? RED : GOLD,
        },
      };
    }),
    title(i.title),
    name(i.name),
  ],
  tulips: (i) => [
    frame(),
    ...[80, 132, 184].flatMap((x, k): Shape[] => [
      {
        tag: 'path',
        attrs: { d: `M${x} 250 L${x} ${150 + k * 6}`, stroke: GREEN, strokeWidth: 5, fill: 'none' },
      },
      {
        tag: 'path',
        attrs: {
          d: `M${x - 22} ${180 + k * 6} q22 30 22 70`,
          stroke: GREEN,
          strokeWidth: 5,
          fill: 'none',
        },
      },
      {
        tag: 'path',
        attrs: {
          d: `M${x - 26} ${150 + k * 6} q0 -60 26 -60 q26 0 26 60 q-13 -18 -26 0 q-13 -18 -26 0z`,
          fill: k === 1 ? RED : PINK,
        },
      },
    ]),
    title(i.title),
    name(i.name),
  ],
  crescent: (i) => [
    frame(NIGHT),
    { tag: 'circle', attrs: { cx: 140, cy: 150, r: 70, fill: GOLD } },
    { tag: 'circle', attrs: { cx: 168, cy: 138, r: 64, fill: NIGHT } },
    {
      tag: 'path',
      attrs: { d: 'M78 96 l4 11 11 4 -11 4 -4 11 -4 -11 -11 -4 11 -4z', fill: '#ffffff' },
    },
    { tag: 'path', attrs: { d: 'M200 230 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z', fill: '#ffffff' } },
    title(i.title, 318, '#ffffff'),
    name(i.name, 344, GOLD),
  ],
  menorah: (i) => [
    frame(),
    { tag: 'rect', attrs: { x: 126, y: 200, width: 12, height: 60, fill: BLUE } },
    { tag: 'rect', attrs: { x: 86, y: 256, width: 92, height: 10, rx: 3, fill: BLUE } },
    ...Array.from({ length: 9 }, (_, k): Shape[] => {
      const x = 52 + k * 20;
      return [
        {
          tag: 'rect',
          attrs: {
            x: x - 3,
            y: k === 4 ? 120 : 140,
            width: 6,
            height: k === 4 ? 80 : 60,
            fill: BLUE,
          },
        },
        { tag: 'ellipse', attrs: { cx: x, cy: k === 4 ? 108 : 128, rx: 5, ry: 9, fill: GOLD } },
      ];
    }).flat(),
    title(i.title),
    name(i.name),
  ],
  diya: (i) => [
    frame('#3A1F3D'),
    {
      tag: 'path',
      attrs: { d: 'M52 200 q80 70 160 0 q-10 50 -80 56 q-70 -6 -80 -56z', fill: '#B5462E' },
    },
    { tag: 'ellipse', attrs: { cx: 132, cy: 200, rx: 80, ry: 14, fill: '#E38A3B' } },
    { tag: 'path', attrs: { d: 'M132 190 q-26 -40 0 -78 q26 38 0 78z', fill: GOLD } },
    { tag: 'path', attrs: { d: 'M132 176 q-10 -20 0 -40 q10 20 0 40z', fill: '#ffffff' } },
    ...Array.from({ length: 10 }, (_, k): Shape => ({
      tag: 'circle',
      attrs: { cx: 30 + k * 23, cy: 60 + (k % 2) * 14, r: 3, fill: GOLD },
    })),
    title(i.title, 318, '#ffffff'),
    name(i.name, 344, GOLD),
  ],
  tree: (i) => [
    frame(),
    {
      tag: 'path',
      attrs: {
        d: 'M132 40 l52 70 h-28 l40 56 h-32 l44 60 h-152 l44 -60 h-32 l40 -56 h-28z',
        fill: GREEN,
      },
    },
    { tag: 'rect', attrs: { x: 120, y: 226, width: 24, height: 30, fill: '#7A4B22' } },
    {
      tag: 'path',
      attrs: { d: 'M132 22 l5 12 13 1 -10 8 3 13 -11 -7 -11 7 3 -13 -10 -8 13 -1z', fill: GOLD },
    },
    ...(
      [
        [112, 120],
        [150, 150],
        [100, 190],
        [160, 205],
        [132, 165],
      ] as [number, number][]
    ).map(([cx, cy], k): Shape => ({
      tag: 'circle',
      attrs: { cx, cy, r: 6, fill: k % 2 ? RED : GOLD },
    })),
    title(i.title),
    name(i.name),
  ],
  hearts: (i) => [
    frame(),
    ...(
      [
        [132, 150, 1],
        [78, 110, 0.55],
        [190, 200, 0.5],
      ] as [number, number, number][]
    ).map(([x, y, s], k): Shape => ({
      tag: 'path',
      attrs: {
        transform: `translate(${x} ${y}) scale(${s})`,
        d: 'M0 40 C-60 -10 -40 -60 0 -28 C40 -60 60 -10 0 40z',
        fill: k ? PINK : RED,
      },
    })),
    title(i.title),
    name(i.name),
  ],
  sun: (i) => [
    frame(),
    ...Array.from({ length: 16 }, (_, k): Shape => {
      const a = (k / 16) * Math.PI * 2;
      return {
        tag: 'line',
        attrs: {
          x1: +(132 + Math.cos(a) * 70).toFixed(1),
          y1: +(150 + Math.sin(a) * 70).toFixed(1),
          x2: +(132 + Math.cos(a) * 100).toFixed(1),
          y2: +(150 + Math.sin(a) * 100).toFixed(1),
          stroke: GOLD,
          strokeWidth: 6,
          strokeLinecap: 'round',
        },
      };
    }),
    { tag: 'circle', attrs: { cx: 132, cy: 150, r: 56, fill: GOLD } },
    title(i.title),
    name(i.name),
  ],
  stripes: (i) => [
    frame(),
    ...Array.from({ length: 9 }, (_, k): Shape => ({
      tag: 'rect',
      attrs: {
        x: 0,
        y: k * 30,
        width: 264,
        height: 16,
        fill: [PINK, BLUE, GOLD, GREEN][k % 4] ?? PINK,
        opacity: 0.8,
      },
    })),
    { tag: 'rect', attrs: { x: 28, y: 120, width: 208, height: 80, fill: PAPER } },
    title(i.title, 158),
    name(i.name, 186),
  ],
};

export function sceneFor(design: string, input: SceneInput): Shape[] {
  const fn = designs[design] ?? designs.balloons;
  return fn ? fn(input) : [];
}

const kebab = (s: string) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function shapeToString(s: Shape): string {
  const attrs = Object.entries(s.attrs)
    .map(([k, v]) => `${kebab(k)}="${escape(String(v))}"`)
    .join(' ');
  if (s.tag === 'text') return `<text ${attrs}>${escape(s.text ?? '')}</text>`;
  if (s.children?.length) return `<g ${attrs}>${s.children.map(shapeToString).join('')}</g>`;
  return `<${s.tag} ${attrs}/>`;
}

/** A standalone SVG document for downloads. Fonts fall back to system faces outside the app. */
export function sceneToSvgString(design: string, input: SceneInput): string {
  const body = sceneFor(design, input).map(shapeToString).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 264 370" width="264" height="370" role="img" aria-label="${escape(`${input.title} card for ${input.name}`)}">${body}</svg>`;
}
