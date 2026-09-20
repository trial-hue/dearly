'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

import { Logo } from '@/components/store/Logo';
import { useIsDesktop } from '@/lib/useIsDesktop';

import { BottomSheet } from './BottomSheet';
import { StepIndicator, type Step } from './StepIndicator';

/**
 * Full-screen editor: card centred, tools in a side panel on desktop and a bottom sheet on
 * phones, a step indicator at the top and a sticky bar (rendered by the caller) at the bottom.
 */
export function EditorShell({
  backHref,
  backLabel,
  steps,
  current,
  onStep,
  stage,
  tools,
  actions,
}: {
  backHref: string;
  backLabel: string;
  steps: Step[];
  current: number;
  onStep: (i: number) => void;
  stage: React.ReactNode;
  tools: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const stepTitle = steps[current]?.label ?? '';
  const desktop = useIsDesktop();
  return (
    <div className="min-h-full bg-surface-2 pb-[140px] md:pb-[88px]" data-testid="editor">
      <header className="sticky top-0 z-20 border-b border-line bg-surface">
        <div className="container-x flex flex-wrap items-center gap-3 py-2">
          <Link href={backHref} className="btn btn-ghost btn-sm" aria-label={backLabel}>
            <ArrowLeft size={18} strokeWidth={1.75} aria-hidden="true" />
            <span className="hidden sm:inline">{backLabel}</span>
          </Link>
          <Logo />
          <div className="order-last w-full md:order-none md:ml-4 md:w-auto md:flex-1">
            <StepIndicator steps={steps} current={current} onSelect={onStep} />
          </div>
          <div className="ml-auto flex items-center gap-2">{actions}</div>
        </div>
      </header>
      <div className="container-x grid gap-6 pt-6 md:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex items-start justify-center">
          <div className="w-full max-w-[520px]">{stage}</div>
        </div>
        {desktop ? (
          <aside
            className="self-start rounded-[12px] bg-surface p-5 md:sticky md:top-[76px]"
            aria-label={`${stepTitle} tools`}
          >
            {tools}
          </aside>
        ) : null}
      </div>
      {desktop ? null : <BottomSheet title={`${stepTitle} tools`}>{tools}</BottomSheet>}
    </div>
  );
}
