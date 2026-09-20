import { createElement } from 'react';

import type { Shape } from '@/catalogue/scene';

function render(shape: Shape, key: number): React.ReactNode {
  if (shape.tag === 'text') return createElement('text', { key, ...shape.attrs }, shape.text);
  if (shape.tag === 'g')
    return createElement('g', { key, ...shape.attrs }, shape.children?.map(render));
  return createElement(shape.tag, { key, ...shape.attrs });
}

/** A scene rendered as inline SVG (the React twin of sceneToSvgString). */
export function SceneSvg({
  shapes,
  label,
  className,
}: {
  shapes: Shape[];
  label: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 264 370"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={label}
      className={className}
    >
      {shapes.map(render)}
    </svg>
  );
}
