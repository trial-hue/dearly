import { createElement } from 'react';

import { sceneFor, type Shape } from './designs';

export interface CardArtProps {
  design: string;
  title: string;
  name?: string | null;
  age?: number | null;
  className?: string;
  ariaHidden?: boolean;
}

function render(shape: Shape, key: number): React.ReactNode {
  if (shape.tag === 'text') return createElement('text', { key, ...shape.attrs }, shape.text);
  if (shape.tag === 'g')
    return createElement('g', { key, ...shape.attrs }, shape.children?.map(render));
  return createElement(shape.tag, { key, ...shape.attrs });
}

/** One of twelve card fronts. Paper colours are fixed in both themes. */
export function CardArt({ design, title, name, age, className, ariaHidden = true }: CardArtProps) {
  const shapes = sceneFor(design, { title, name: name ?? '', age: age ?? null });
  return (
    <svg
      viewBox="0 0 264 370"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role={ariaHidden ? undefined : 'img'}
      aria-hidden={ariaHidden || undefined}
      aria-label={ariaHidden ? undefined : `${title} card for ${name ?? ''}`}
    >
      {shapes.map(render)}
    </svg>
  );
}
