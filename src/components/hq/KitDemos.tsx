'use client';

import { useState } from 'react';

import { StepIndicator } from '@/components/editor/StepIndicator';
import { ChatBubble } from '@/components/help/ChatBubble';
import { ProductOptions } from '@/components/product/ProductOptions';
import { RatingStars } from '@/components/recipient/RatingStars';
import { useToast } from '@/components/shell/Toast';
import { FilterChips, STYLES, WHO_FOR } from '@/components/store/FilterChips';
import { SortSelect } from '@/components/store/SortSelect';
import { Dialog } from '@/components/ui/Dialog';

/** Client-side component demos: state, dialogs, toasts. */
export function KitDemos({ designId }: { designId: string }) {
  const [step, setStep] = useState(1);
  const [stars, setStars] = useState(4);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  return (
    <>
      <section className="rounded-[12px] border border-line bg-surface p-4">
        <h2 className="t-h3 mb-3">OptionTiles, DeliveryPromise, StickyBuyBar (inline)</h2>
        <div className="max-w-md">
          <ProductOptions designId={designId} />
        </div>
      </section>
      <section className="rounded-[12px] border border-line bg-surface p-4">
        <h2 className="t-h3 mb-3">FilterChips and SortSelect</h2>
        <FilterChips
          groups={[
            { label: 'Who for', param: 'tag', options: WHO_FOR },
            { label: 'Style', param: 'tag', options: STYLES },
          ]}
          resultCount={12}
        />
        <div className="mt-3">
          <SortSelect />
        </div>
      </section>
      <section className="rounded-[12px] border border-line bg-surface p-4">
        <h2 className="t-h3 mb-3">StepIndicator</h2>
        <StepIndicator
          steps={[
            { id: 'a', label: 'Front' },
            { id: 'b', label: 'Inside message' },
            { id: 'c', label: 'Make it yours' },
            { id: 'd', label: 'Extras' },
            { id: 'e', label: 'Delivery' },
          ]}
          current={step}
          onSelect={setStep}
        />
      </section>
      <section className="rounded-[12px] border border-line bg-surface p-4">
        <h2 className="t-h3 mb-3">RatingStars, ChatBubble, Toast, Dialog</h2>
        <RatingStars value={stars} onRate={setStars} />
        <ol className="mt-4 flex max-w-md flex-col gap-2">
          <ChatBubble role="user">My card for Dan hasn&rsquo;t arrived</ChatBubble>
          <ChatBubble
            role="assistant"
            footer={<span className="label label-success">Done: reprint</span>}
          >
            Sorry about that. A tracked reprint is on its way and an eCard goes on the day.
          </ChatBubble>
        </ol>
        <div className="mt-4 flex gap-2">
          <button type="button" className="btn" onClick={() => toast('This is a toast')}>
            Show a toast
          </button>
          <button type="button" className="btn" onClick={() => setOpen(true)}>
            Open a dialog
          </button>
        </div>
        <Dialog open={open} onClose={() => setOpen(false)} title="A dialog">
          <p className="text-sm">Focus is trapped, Escape closes, the backdrop closes.</p>
        </Dialog>
      </section>
    </>
  );
}
