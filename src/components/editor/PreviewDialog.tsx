'use client';

import { CardReveal, type RevealProps } from '@/components/recipient/CardReveal';
import { Dialog } from '@/components/ui/Dialog';

/** "Preview as recipient": the phone frame with the animation, card, message and narration. */
export function PreviewDialog({
  open,
  onClose,
  ...reveal
}: { open: boolean; onClose: () => void } & RevealProps) {
  return (
    <Dialog open={open} onClose={onClose} title="As they will see it" testId="preview-dialog">
      <div className="phone">
        <p className="mb-2 text-center text-xs text-ink-2">A card from Alex, delivered by Dearly</p>
        <CardReveal {...reveal} key={open ? 'open' : 'closed'} />
      </div>
    </Dialog>
  );
}
