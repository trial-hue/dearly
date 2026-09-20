import { MessageCircleQuestion } from 'lucide-react';
import Link from 'next/link';

export function FloatingHelp() {
  return (
    <Link
      href="/help"
      className="btn btn-secondary fixed bottom-[calc(76px+env(safe-area-inset-bottom,0px))] right-4 z-20 shadow-[var(--shadow-tile-hover)] md:bottom-6 md:right-6"
      aria-label="Help"
    >
      <MessageCircleQuestion size={20} strokeWidth={1.75} aria-hidden="true" />
      Help
    </Link>
  );
}
