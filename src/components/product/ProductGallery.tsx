'use client';

import { useState } from 'react';

import { designById } from '@/catalogue';
import { CardMock } from '@/components/card/CardMock';
import { TITLES } from '@/domain';

type View = 'front' | 'inside' | 'envelope';

/** The large card with front, inside and envelope views chosen from thumbnails. */
export function ProductGallery({ designId }: { designId: string }) {
  const [view, setView] = useState<View>('front');
  const design = designById(designId);
  if (!design) return null;
  const title = TITLES[design.occasions[0] ?? 'birthday'];
  const views: { id: View; label: string }[] = [
    { id: 'front', label: 'Front' },
    { id: 'inside', label: 'Inside' },
    { id: 'envelope', label: 'Envelope and mailer' },
  ];
  return (
    <div className="grid gap-3 md:grid-cols-[72px_1fr]">
      <div className="order-2 flex gap-2 md:order-1 md:flex-col" role="tablist" aria-label="Views">
        {views.map((v) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={view === v.id}
            aria-label={v.label}
            className={`w-[72px] rounded-[10px] p-1 ring-offset-2 ring-offset-bg ${view === v.id ? 'ring-2 ring-ink' : 'hover:ring-2 hover:ring-line'}`}
            onClick={() => setView(v.id)}
          >
            {v.id === 'front' ? (
              <CardMock design={design} title={title} name="" bare hover={false} />
            ) : v.id === 'inside' ? (
              <div className="paper aspect-[5/7] w-full p-1.5">
                <div className="h-full w-full border-l border-dashed border-line" />
              </div>
            ) : (
              <div className="aspect-[5/7] w-full rounded-[4px] bg-surface-2 p-1.5">
                <div
                  className="h-full w-full rounded-sm bg-paper"
                  style={{ clipPath: 'polygon(0 30%, 50% 60%, 100% 30%, 100% 100%, 0 100%)' }}
                />
              </div>
            )}
          </button>
        ))}
      </div>
      <div className="order-1 md:order-2" data-testid={`gallery-${view}`}>
        {view === 'front' ? (
          <CardMock
            design={design}
            title={title}
            name=""
            tint={design.tint}
            hover={false}
            className="mx-auto max-w-[520px]"
          />
        ) : view === 'inside' ? (
          <div className={`mx-auto max-w-[520px] rounded-[12px] bg-${design.tint} p-[9%]`}>
            <div className="paper aspect-[10/7] w-full" aria-label="Inside of the card">
              <div className="grid h-full grid-cols-2">
                <div className="border-r border-dashed border-line/60" />
                <div className="flex items-center justify-center p-4 text-center font-hand text-[clamp(14px,3.2vw,22px)] leading-snug text-paper-ink">
                  Your message goes here, in your own words or ours.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`mx-auto max-w-[520px] rounded-[12px] bg-${design.tint} p-[9%]`}
            aria-label="Envelope and mailer"
          >
            <div className="relative aspect-[10/7] w-full">
              <div className="absolute inset-x-[6%] top-[8%] w-[46%]">
                <CardMock design={design} title={title} name="" bare hover={false} />
              </div>
              <div className="absolute inset-x-0 bottom-0 h-[62%] rounded-[8px] bg-[#F4EFE6] shadow-[0_1px_0_rgba(0,0,0,0.06)_inset]">
                <div
                  className="absolute inset-x-0 top-0 h-[55%] rounded-t-[8px] bg-[#EAE3D6]"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }}
                />
                <span className="absolute bottom-3 right-4 rounded-full bg-surface px-2 py-0.5 text-[11px] font-semibold text-ink-2">
                  Card mailer, board-backed
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
