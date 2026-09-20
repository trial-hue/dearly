'use client';

import { useRef, useState } from 'react';

import { Badge, Field } from '@/components/ui';
import { DIGITAL, GIFTS, type CardSpec } from '@/domain';
import { formatPence } from '@/lib/format';

import { DrawingCanvas, type DrawingHandle } from '../media/DrawingCanvas';
import {
  blobDuration,
  canRecord,
  startRecording,
  type ClipSource,
  type NarrationSource,
} from '../media/recorders';

export type Animation = 'envelope' | 'flip' | 'confetti';

export interface EcardExtras {
  animation: Animation;
  narration: NarrationSource;
  clip: ClipSource;
}

export function ExtrasStep({
  card,
  ecard,
  extras,
  onCard,
  onExtras,
  drawingRef,
  busy,
}: {
  card: CardSpec;
  ecard: boolean;
  extras: EcardExtras;
  onCard: (patch: Partial<CardSpec>) => void;
  onExtras: (e: EcardExtras) => void;
  drawingRef: React.RefObject<DrawingHandle | null>;
  busy: boolean;
}) {
  const [recording, setRecording] = useState<'idle' | 'audio' | 'video' | 'blocked'>('idle');
  const stopRef = useRef<(() => void) | null>(null);

  const record = async (kind: 'audio' | 'video') => {
    if (!canRecord()) {
      setRecording('blocked');
      return;
    }
    try {
      const rec = await startRecording(kind);
      stopRef.current = rec.stop;
      setRecording(kind);
      const blob = await rec.done;
      const url = URL.createObjectURL(blob);
      if (kind === 'audio')
        onExtras({
          ...extras,
          narration: { kind: 'recording', blob, url, duration: await blobDuration(blob) },
        });
      else onExtras({ ...extras, clip: { blob, url, kind: 'video' } });
      setRecording('idle');
    } catch {
      setRecording('blocked');
    }
  };

  return (
    <div className="space-y-5">
      {!ecard ? (
        <>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={card.digital}
              disabled={busy}
              onChange={(e) => onCard({ digital: e.target.checked })}
            />
            <span>
              <span className="block font-bold">
                Digital copy, {formatPence(Math.round(DIGITAL.paired * 100))}
              </span>
              <span className="text-ink-2">
                They also get the card by link, kept in their Dearly.
              </span>
            </span>
          </label>
          <Field label="Add a gift" htmlFor="editor-gift">
            <select
              id="editor-gift"
              className="input"
              value={card.gift}
              disabled={busy}
              onChange={(e) => onCard({ gift: e.target.value as CardSpec['gift'] })}
            >
              {GIFTS.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.label}
                  {g.price ? ` · ${formatPence(g.price * 100)}` : ''}
                </option>
              ))}
            </select>
          </Field>
        </>
      ) : null}

      {ecard ? (
        <>
          <section>
            <h3 className="mb-2 text-sm font-bold">Animation</h3>
            <div role="radiogroup" aria-label="Animation" className="grid grid-cols-3 gap-1">
              {(['envelope', 'flip', 'confetti'] as Animation[]).map((a) => (
                <button
                  key={a}
                  type="button"
                  role="radio"
                  aria-checked={extras.animation === a}
                  className="btn btn-sm"
                  onClick={() => onExtras({ ...extras, animation: a })}
                >
                  {a === 'envelope' ? 'Envelope' : a === 'flip' ? 'Card flip' : 'Confetti'}
                </button>
              ))}
            </div>
          </section>
          <section>
            <h3 className="mb-1 text-sm font-bold">Narration</h3>
            <p className="mb-2 text-xs text-ink-2">
              Record it, upload a recording, or let their device read it. The words light up as it
              plays.
            </p>
            <div className="flex flex-wrap gap-2">
              {recording === 'audio' ? (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => stopRef.current?.()}
                >
                  Stop recording
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => void record('audio')}
                  disabled={recording === 'video'}
                  data-testid="record-narration"
                >
                  Record
                </button>
              )}
              <label className="btn btn-sm cursor-pointer">
                Upload a recording
                <input
                  type="file"
                  accept="audio/*"
                  className="sr-only"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f)
                      onExtras({
                        ...extras,
                        narration: {
                          kind: 'upload',
                          blob: f,
                          url: URL.createObjectURL(f),
                          duration: await blobDuration(f),
                        },
                      });
                  }}
                />
              </label>
              <button
                type="button"
                className="btn btn-sm"
                aria-pressed={extras.narration?.kind === 'voice'}
                onClick={() => onExtras({ ...extras, narration: { kind: 'voice' } })}
                data-testid="builtin-voice"
              >
                Built-in voice
              </button>
              {extras.narration ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => onExtras({ ...extras, narration: null })}
                >
                  Remove
                </button>
              ) : null}
            </div>
            {recording === 'blocked' ? (
              <p className="mt-2 text-sm text-warning">
                The microphone is blocked or unavailable. Upload a recording or use the built-in
                voice.
              </p>
            ) : null}
            {extras.narration && extras.narration.kind !== 'voice' ? (
              <audio controls src={extras.narration.url} className="mt-2 w-full" />
            ) : null}
            {extras.narration?.kind === 'voice' ? (
              <p className="mt-2">
                <Badge>Read aloud on their device</Badge>
              </p>
            ) : null}
          </section>
          <section>
            <h3 className="mb-1 text-sm font-bold">A short clip</h3>
            <div className="flex flex-wrap gap-2">
              {recording === 'video' ? (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => stopRef.current?.()}
                >
                  Stop recording
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => void record('video')}
                  disabled={recording === 'audio'}
                >
                  Record video
                </button>
              )}
              <label className="btn btn-sm cursor-pointer">
                Upload a clip
                <input
                  type="file"
                  accept="video/*,audio/*"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f)
                      onExtras({
                        ...extras,
                        clip: {
                          blob: f,
                          url: URL.createObjectURL(f),
                          kind: f.type.startsWith('video') ? 'video' : 'audio',
                        },
                      });
                  }}
                />
              </label>
              {extras.clip ? (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => onExtras({ ...extras, clip: null })}
                >
                  Remove
                </button>
              ) : null}
            </div>
            {extras.clip ? (
              extras.clip.kind === 'video' ? (
                <video controls src={extras.clip.url} className="mt-2 w-full rounded" />
              ) : (
                <audio controls src={extras.clip.url} className="mt-2 w-full" />
              )
            ) : null}
          </section>
          <section>
            <h3 className="mb-2 text-sm font-bold">Draw something inside</h3>
            <DrawingCanvas ref={drawingRef} />
          </section>
        </>
      ) : (
        <p className="rounded-[12px] bg-surface-2 p-3 text-sm text-ink-2">
          Narration, a video clip, a drawing and an opening animation come with eCards. Turn on
          &ldquo;Send as eCard only&rdquo; on the first step to add them.
        </p>
      )}
    </div>
  );
}
