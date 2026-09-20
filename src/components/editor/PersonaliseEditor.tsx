'use client';

import { Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { renderDesignSvg, type DesignDef } from '@/catalogue';
import { useBasket } from '@/components/basket/basketStore';
import { CardMock } from '@/components/card/CardMock';
import { useToast } from '@/components/shell/Toast';
import { ErrorNote } from '@/components/ui';
import { chooseMode, quote, type CardSpec, type PrintedMode } from '@/domain';
import { api, useAction } from '@/lib/fetcher';
import { fmtDate, formatPence } from '@/lib/format';
import type { Serialized } from '@/lib/serialize';
import type { ProposalView } from '@/server/services/proposals';

import { EditorShell } from './EditorShell';
import type { DrawingHandle } from './media/DrawingCanvas';
import { evenTimings, uploadMedia } from './media/recorders';
import { MediaTools } from './MediaTools';
import { PreviewDialog } from './PreviewDialog';
import { DeliveryStep } from './steps/DeliveryStep';
import { ExtrasStep, type EcardExtras } from './steps/ExtrasStep';
import { FrontStep } from './steps/FrontStep';
import { MessageStep } from './steps/MessageStep';
import { StickyBuyBar } from './StickyBuyBar';
import { fontClassFor } from '../recipient/CardReveal';

type ProposalDTO = Serialized<ProposalView>;

const STEPS = [
  { id: 'front', label: 'Front' },
  { id: 'message', label: 'Inside message' },
  { id: 'yours', label: 'Make it yours' },
  { id: 'extras', label: 'Extras' },
  { id: 'delivery', label: 'Delivery' },
];

/** The five-step personalise flow over one proposal. Every price comes from quote(). */
export function PersonaliseEditor({
  proposal: initial,
  from,
}: {
  proposal: ProposalDTO;
  from: 'reminder' | 'shop' | 'basket';
}) {
  const router = useRouter();
  const basket = useBasket();
  const { toast } = useToast();
  const { run, busy, error } = useAction();
  const [p, setP] = useState(initial);
  const [card, setCard] = useState<CardSpec>(initial.card);
  const [message, setMessage] = useState(initial.card.message);
  const [step, setStep] = useState(0);
  const [preview, setPreview] = useState(false);
  const [extras, setExtras] = useState<EcardExtras>({
    animation: 'envelope',
    narration: null,
    clip: null,
  });
  const drawingRef = useRef<DrawingHandle>(null);
  const first = p.person.name.includes(' and ')
    ? p.person.name
    : (p.person.name.split(' ')[0] ?? p.person.name);
  const key = encodeURIComponent(p.key);
  const ecard = card.mode === 'ecard';
  const q = safeQuote(card);
  const daysLeft = p.daysLeft;

  const applyView = (view: ProposalDTO) => {
    setP(view);
    setCard(view.card);
    setMessage(view.card.message);
  };

  const patch = (changes: Partial<CardSpec>) => {
    setCard((c) => ({ ...c, ...changes }));
    return run(
      'edit',
      async () =>
        applyView(
          await api<ProposalDTO>(`/api/proposals/${key}`, {
            method: 'PATCH',
            json: { action: 'edit', patch: changes },
          }),
        ),
      { refresh: false },
    );
  };

  const onDesign = (d: DesignDef) =>
    patch({
      customFront: {
        kind: 'svg',
        svg: renderDesignSvg(d, { title: p.title, name: first, age: p.age }),
      },
    });
  const onEcard = (on: boolean) =>
    patch(
      on ? { mode: 'ecard' } : { mode: chooseMode(card.size, daysLeft), modeOverridden: false },
    );
  const onMode = (m: PrintedMode) => patch({ mode: m });
  const onDate = (date: string) =>
    run(
      'date',
      async () =>
        applyView(
          await api<ProposalDTO>(`/api/proposals/${key}`, {
            method: 'PATCH',
            json: { action: 'set_date', date },
          }),
        ),
      { refresh: false },
    );
  const commitMessage = () => {
    if (message !== card.message) void patch({ message });
  };
  const rewrite = () =>
    run(
      'rewrite',
      async () => {
        const r = await api<{ view: ProposalDTO }>('/api/ai/rewrite_message', {
          json: { key: p.key },
        });
        applyView(r.view);
      },
      { refresh: false },
    );
  const confirmAddress = () =>
    run(
      'confirm',
      async () =>
        applyView(
          await api<ProposalDTO>(`/api/proposals/${key}`, {
            method: 'PATCH',
            json: { action: 'confirm_address' },
          }),
        ),
      { refresh: false },
    );

  const approve = () =>
    run('pay', async () => {
      await api(`/api/proposals/${key}`, { method: 'PATCH', json: { action: 'approve' } });
      basket.remove(p.key);
      toast(`Paid. ${first}'s card is on its way.`);
      router.push('/orders');
    });

  const addToBasket = () => {
    basket.add(p.key);
    toast('Added to your basket');
    router.push('/basket');
  };

  const sendEcard = () =>
    run('pay', async () => {
      let drawingMediaId: string | null = null;
      let narrationMediaId: string | null = null;
      let clipMediaId: string | null = null;
      let wordTimings: number[] = [];
      if (drawingRef.current && !drawingRef.current.isEmpty()) {
        const blob = await drawingRef.current.toBlob();
        if (blob) drawingMediaId = (await uploadMedia('drawing', blob, 'drawing.png')).id;
      }
      if (extras.narration && extras.narration.kind !== 'voice') {
        narrationMediaId = (
          await uploadMedia(
            'audio',
            extras.narration.blob,
            extras.narration.kind === 'upload' ? 'narration.audio' : 'narration.webm',
          )
        ).id;
        wordTimings = evenTimings(message, extras.narration.duration);
      }
      if (extras.clip)
        clipMediaId = (
          await uploadMedia(
            extras.clip.kind === 'video' ? 'video' : 'audio',
            extras.clip.blob,
            extras.clip.kind === 'video' ? 'clip.webm' : 'clip.audio',
          )
        ).id;
      await api('/api/orders/ecard', {
        json: {
          personId: p.personId,
          occasion: p.occasionType,
          message,
          font: card.font,
          design: card.design,
          animation: extras.animation,
          drawingMediaId,
          narrationMediaId,
          clipMediaId,
          wordTimings,
        },
      });
      await api(`/api/proposals/${key}`, { method: 'PATCH', json: { action: 'skip' } }).catch(
        () => undefined,
      );
      basket.remove(p.key);
      toast(`eCard sent to ${first}`);
      router.push('/orders');
    });

  const backHref = from === 'reminder' ? '/reminders' : from === 'basket' ? '/basket' : '/cards';
  const backLabel = from === 'reminder' ? 'Reminders' : from === 'basket' ? 'Basket' : 'Cards';
  const isBusy = busy !== null;
  const note =
    q.moonpigPence != null
      ? `Moonpig: ${formatPence(q.moonpigPence)} for the same Regular card${q.savingPence && q.savingPence > 0 ? `, you save ${formatPence(q.savingPence)}` : ''}`
      : q.moonpigNote;

  const stage = (
    <div className="space-y-3">
      <div className="text-center text-sm text-ink-2">
        {p.title} for {p.person.name}, {fmtDate(p.dueDate)}
      </div>
      {step === 1 || step === 3 ? (
        <div className="paper mx-auto aspect-[10/7] w-full p-4">
          <div className="grid h-full grid-cols-2">
            <div className="border-r border-dashed border-line/60" />
            <div
              className={`flex flex-col items-center justify-center p-3 text-center leading-snug ${fontClassFor(card.font)}`}
            >
              <span>{message || <span className="opacity-40">Your message</span>}</span>
              {card.handwriting ? (
                // eslint-disable-next-line @next/next/no-img-element -- handwriting from the app's own storage
                <img
                  src={card.handwriting.url}
                  alt="Handwriting"
                  className={`mt-2 ${card.handwriting.signatureOnly ? 'w-1/2 self-end' : 'w-full'}`}
                />
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        <CardMock card={card} title={p.title} name={first} age={p.age} hover={false} />
      )}
      <div className="flex flex-wrap justify-center gap-1 text-xs text-ink-2">
        {p.messageBy === 'ai' ? <span className="label label-ai">Drafted for you</span> : null}
        {p.madeBy === 'ai' ? <span className="label label-ai">Picked for {first}</span> : null}
      </div>
    </div>
  );

  const tools = (
    <div>
      {step === 0 ? (
        <FrontStep
          onOption={(c) => void patch(c)}
          card={card}
          occasion={p.occasionType}
          title={p.title}
          name={first}
          age={p.age}
          ecard={ecard}
          onDesign={(d) => void onDesign(d)}
          onEcard={(on) => void onEcard(on)}
          busy={isBusy}
        />
      ) : null}
      {step === 1 ? (
        <MessageStep
          message={message}
          font={card.font}
          messageBy={p.messageBy}
          onMessage={setMessage}
          onCommit={commitMessage}
          onFont={(f) => void patch({ font: f })}
          onRewrite={() => void rewrite()}
          busy={busy}
        />
      ) : null}
      {step === 2 ? (
        <MediaTools proposalKey={p.key} card={card} size={card.size} onCard={applyView} />
      ) : null}
      {step === 3 ? (
        <ExtrasStep
          card={card}
          ecard={ecard}
          extras={extras}
          onCard={(c) => void patch(c)}
          onExtras={setExtras}
          drawingRef={drawingRef}
          busy={isBusy}
        />
      ) : null}
      {step === 4 ? (
        <DeliveryStep
          card={card}
          dueDate={p.dueDate}
          person={{ name: p.person.name, postcode: p.person.postcode, stale: p.person.stale }}
          onMode={(m) => void onMode(m)}
          onDate={(d) => void onDate(d)}
          onConfirmAddress={() => void confirmAddress()}
          busy={isBusy}
        />
      ) : null}
      <ErrorNote message={error} />
      <div className="mt-5 flex justify-between border-t border-line pt-3">
        <button
          type="button"
          className="btn btn-sm"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          Back
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={step === STEPS.length - 1}
          onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
          data-testid="step-next"
        >
          Next
        </button>
      </div>
    </div>
  );

  const primary = ecard ? (
    <button
      type="button"
      className="btn btn-primary"
      disabled={isBusy}
      data-testid="approve"
      onClick={() => void sendEcard()}
    >
      {busy === 'pay' ? 'Sending…' : `Send eCard ${formatPence(q.totalPence)}`}
    </button>
  ) : from === 'reminder' ? (
    <button
      type="button"
      className="btn btn-primary"
      disabled={isBusy || !p.approvable}
      title={
        p.blockReason === 'address_stale' ? 'Confirm the address on the Delivery step' : undefined
      }
      data-testid="approve"
      onClick={() => void approve()}
    >
      {busy === 'pay' ? 'Paying…' : `Approve and pay ${formatPence(q.totalPence)}`}
    </button>
  ) : (
    <button
      type="button"
      className="btn btn-primary"
      disabled={isBusy}
      data-testid="add-to-basket"
      onClick={addToBasket}
    >
      Add to basket
    </button>
  );

  return (
    <>
      <EditorShell
        backHref={backHref}
        backLabel={backLabel}
        steps={STEPS}
        current={step}
        onStep={setStep}
        stage={stage}
        tools={tools}
        actions={
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setPreview(true)}
            data-testid="preview-recipient"
          >
            <Eye size={18} strokeWidth={1.75} aria-hidden="true" />
            Preview as recipient
          </button>
        }
      />
      <StickyBuyBar
        totalPence={q.totalPence}
        note={note}
        primary={primary}
        secondary={
          from === 'reminder' && !ecard ? (
            <span className="hidden text-xs text-ink-2 sm:inline">
              Arrives {fmtDate(p.arrival)}
            </span>
          ) : null
        }
      />
      <PreviewDialog
        open={preview}
        onClose={() => setPreview(false)}
        card={card}
        title={p.title}
        name={first}
        age={p.age}
        message={message}
        animation={extras.animation}
        narrationUrl={
          extras.narration && extras.narration.kind !== 'voice' ? extras.narration.url : null
        }
        timings={[]}
        clipUrl={extras.clip?.url ?? null}
      />
    </>
  );
}

function safeQuote(card: CardSpec) {
  try {
    return quote(card);
  } catch {
    return quote({ ...card, mode: 'tracked' });
  }
}
