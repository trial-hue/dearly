'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';

import { CardArt } from '@/components/card/CardArt';
import { Narration } from '@/components/recipient/Narration';
import { useToast } from '@/components/shell/Toast';
import { Badge, ErrorNote, Field } from '@/components/ui';
import { DESIGNS, DESIGN_FOR, TITLES, type DesignId, type OccasionType } from '@/domain';
import { ApiError, api, useAction } from '@/lib/fetcher';

import { DrawingCanvas, type DrawingHandle } from './DrawingCanvas';

interface PersonOption {
  id: string;
  name: string;
  occasions: OccasionType[];
}

type Font = 'hand' | 'print' | 'serif' | 'mono';
type Animation = 'envelope' | 'flip' | 'confetti';
type NarrationSource =
  | { kind: 'recording' | 'upload'; blob: Blob; url: string; duration: number }
  | { kind: 'voice' }
  | null;

async function upload(
  kind: string,
  blob: Blob,
  filename: string,
): Promise<{ id: string; url: string }> {
  const form = new FormData();
  form.append('kind', kind);
  form.append('file', blob, filename);
  const res = await fetch('/api/uploads', { method: 'POST', body: form });
  if (!res.ok)
    throw new ApiError({
      title: 'Upload failed',
      status: res.status,
      ...(await res.json().catch(() => ({}))),
    });
  return (await res.json()) as { id: string; url: string };
}

function blobDuration(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const el = document.createElement('audio');
    el.preload = 'metadata';
    el.onloadedmetadata = () => {
      // Recorded webm often reports Infinity until seeked; fall back to a word-based estimate.
      if (Number.isFinite(el.duration) && el.duration > 0) resolve(el.duration);
      else {
        el.currentTime = 1e9;
        el.ontimeupdate = () => {
          el.ontimeupdate = null;
          resolve(Number.isFinite(el.duration) && el.duration > 0 ? el.duration : 0);
        };
      }
    };
    el.onerror = () => resolve(0);
    el.src = URL.createObjectURL(blob);
  });
}

export function Studio({ people }: { people: PersonOption[] }) {
  const { run, busy, error } = useAction();
  const { toast } = useToast();
  const [personId, setPersonId] = useState(people[0]?.id ?? '');
  const person = people.find((p) => p.id === personId) ?? people[0];
  const [occasion, setOccasion] = useState<OccasionType>(person?.occasions[0] ?? 'thank_you');
  const [message, setMessage] = useState('Thinking of you today. Hope this makes you smile.');
  const [font, setFont] = useState<Font>('hand');
  const [design, setDesign] = useState<DesignId>('balloons');
  const [animation, setAnimation] = useState<Animation>('envelope');
  const [narration, setNarration] = useState<NarrationSource>(null);
  const [recording, setRecording] = useState<'idle' | 'audio' | 'video' | 'blocked'>('idle');
  const [clip, setClip] = useState<{ blob: Blob; url: string; kind: 'video' | 'audio' } | null>(
    null,
  );
  const [preview, setPreview] = useState(false);
  const [sent, setSent] = useState<{ slug: string } | null>(null);
  const drawing = useRef<DrawingHandle>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const first = person?.name.split(' ')[0] ?? '';
  const title = TITLES[occasion];

  const chooseOccasion = (o: OccasionType) => {
    setOccasion(o);
    setDesign(DESIGN_FOR[o]);
  };
  const choosePerson = (id: string) => {
    setPersonId(id);
    const next = people.find((p) => p.id === id);
    if (next && !next.occasions.includes(occasion))
      chooseOccasion(next.occasions[0] ?? 'thank_you');
  };

  const canRecord =
    typeof window !== 'undefined' &&
    typeof MediaRecorder !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getUserMedia);

  const startRecording = async (kind: 'audio' | 'video') => {
    if (!canRecord) {
      setRecording('blocked');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        kind === 'audio' ? { audio: true } : { audio: true, video: true },
      );
      const rec = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => chunks.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunks, {
          type: rec.mimeType || (kind === 'audio' ? 'audio/webm' : 'video/webm'),
        });
        const url = URL.createObjectURL(blob);
        if (kind === 'audio')
          setNarration({ kind: 'recording', blob, url, duration: await blobDuration(blob) });
        else setClip({ blob, url, kind: 'video' });
        setRecording('idle');
      };
      rec.start();
      recorder.current = rec;
      setRecording(kind);
    } catch {
      setRecording('blocked');
    }
  };
  const stopRecording = () => recorder.current?.stop();

  const send = () =>
    run('send', async () => {
      if (!person) return;
      let drawingMediaId: string | null = null;
      let narrationMediaId: string | null = null;
      let clipMediaId: string | null = null;
      if (drawing.current && !drawing.current.isEmpty()) {
        const blob = await drawing.current.toBlob();
        if (blob) drawingMediaId = (await upload('drawing', blob, 'drawing.png')).id;
      }
      let wordTimings: number[] = [];
      if (narration && narration.kind !== 'voice') {
        narrationMediaId = (
          await upload(
            'audio',
            narration.blob,
            narration.kind === 'upload' ? 'narration.audio' : 'narration.webm',
          )
        ).id;
        const words = message.split(/\s+/).filter(Boolean);
        const dur = narration.duration > 0 ? narration.duration : words.length / 2.5;
        wordTimings = words.map((_, i) => Math.round(((i + 0.5) / words.length) * dur * 1000));
      }
      if (clip)
        clipMediaId = (
          await upload(
            clip.kind === 'video' ? 'video' : 'audio',
            clip.blob,
            clip.kind === 'video' ? 'clip.webm' : 'clip.audio',
          )
        ).id;
      const r = await api<{ slug: string }>('/api/orders/ecard', {
        json: {
          personId: person.id,
          occasion,
          message,
          font,
          design,
          animation,
          drawingMediaId,
          narrationMediaId,
          clipMediaId,
          wordTimings,
        },
      });
      setSent(r);
      toast(`eCard sent to ${person.name} for 79p`);
    });

  const fontClass =
    font === 'hand'
      ? 'font-hand text-[22px]'
      : font === 'serif'
        ? 'font-serif text-lg'
        : font === 'mono'
          ? 'font-mono text-base'
          : 'text-lg';

  if (sent) {
    return (
      <div className="card max-w-lg space-y-3" data-testid="ecard-sent">
        <h2 className="text-lg font-bold">Sent</h2>
        <p className="text-sm">
          The eCard is delivered by link and sits in Orders and the Inventory.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href={`/r/${sent.slug}`} className="btn btn-primary">
            Open it as the recipient
          </Link>
          <Link href="/orders" className="btn">
            See the order
          </Link>
          <button type="button" className="btn btn-ghost" onClick={() => setSent(null)}>
            Make another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
      <div className="space-y-4">
        <section className="card grid gap-3 sm:grid-cols-2">
          <Field label="For" htmlFor="studio-person">
            <select
              id="studio-person"
              className="input"
              value={personId}
              onChange={(e) => choosePerson(e.target.value)}
            >
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Occasion" htmlFor="studio-occasion">
            <select
              id="studio-occasion"
              className="input"
              value={occasion}
              onChange={(e) => chooseOccasion(e.target.value as OccasionType)}
            >
              {[
                ...new Set([
                  ...(person?.occasions ?? []),
                  'thank_you' as OccasionType,
                  'birthday' as OccasionType,
                ]),
              ].map((o) => (
                <option key={o} value={o}>
                  {TITLES[o]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Message" htmlFor="studio-message">
            <textarea
              id="studio-message"
              className={`input min-h-[90px] ${fontClass}`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={600}
            />
          </Field>
          <div className="space-y-3">
            <Field label="Font" htmlFor="studio-font">
              <select
                id="studio-font"
                className="input"
                value={font}
                onChange={(e) => setFont(e.target.value as Font)}
              >
                <option value="hand">Handwritten (Caveat)</option>
                <option value="print">Printed (Bricolage Grotesque)</option>
                <option value="serif">Serif</option>
                <option value="mono">Typewriter</option>
              </select>
            </Field>
            <Field label="Design" htmlFor="studio-design">
              <select
                id="studio-design"
                className="input"
                value={design}
                onChange={(e) => setDesign(e.target.value as DesignId)}
              >
                {DESIGNS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </section>

        <section className="card">
          <h2 className="mb-2 font-bold">Draw something</h2>
          <DrawingCanvas ref={drawing} />
        </section>

        <section className="card space-y-3">
          <h2 className="font-bold">Narration</h2>
          <p className="muted text-sm">
            Record it, upload a recording, or let the built-in voice read it. The words light up as
            it plays.
          </p>
          <div className="flex flex-wrap gap-2">
            {recording === 'audio' ? (
              <button type="button" className="btn btn-primary btn-sm" onClick={stopRecording}>
                Stop recording
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => void startRecording('audio')}
                disabled={recording !== 'idle' && recording !== 'blocked'}
                data-testid="record-narration"
              >
                Record with the microphone
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
                    setNarration({
                      kind: 'upload',
                      blob: f,
                      url: URL.createObjectURL(f),
                      duration: await blobDuration(f),
                    });
                }}
              />
            </label>
            <button
              type="button"
              className="btn btn-sm"
              aria-pressed={narration?.kind === 'voice'}
              onClick={() => setNarration({ kind: 'voice' })}
              data-testid="builtin-voice"
            >
              Use the built-in voice
            </button>
            {narration ? (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setNarration(null)}
              >
                Remove
              </button>
            ) : null}
          </div>
          {recording === 'blocked' ? (
            <p className="text-sm text-amber">
              The microphone is blocked or unavailable. Upload a recording or use the built-in voice
              instead.
            </p>
          ) : null}
          {narration?.kind === 'recording' || narration?.kind === 'upload' ? (
            <audio controls src={narration.url} className="w-full" />
          ) : null}
          {narration?.kind === 'voice' ? (
            <Badge>Built-in voice, read on the recipient&rsquo;s device</Badge>
          ) : null}
        </section>

        <section className="card space-y-3">
          <h2 className="font-bold">A short clip</h2>
          <p className="muted text-sm">
            A voice note or a few seconds of video. Kept with the card in local storage (nothing
            leaves this server).
          </p>
          <div className="flex flex-wrap gap-2">
            {recording === 'video' ? (
              <button type="button" className="btn btn-primary btn-sm" onClick={stopRecording}>
                Stop recording
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => void startRecording('video')}
                disabled={recording !== 'idle' && recording !== 'blocked'}
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
                    setClip({
                      blob: f,
                      url: URL.createObjectURL(f),
                      kind: f.type.startsWith('video') ? 'video' : 'audio',
                    });
                }}
              />
            </label>
            {clip ? (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setClip(null)}>
                Remove
              </button>
            ) : null}
          </div>
          {clip ? (
            clip.kind === 'video' ? (
              <video controls src={clip.url} className="w-full max-w-sm rounded" />
            ) : (
              <audio controls src={clip.url} className="w-full" />
            )
          ) : null}
        </section>
      </div>

      <aside className="space-y-3 lg:sticky lg:top-4 lg:self-start">
        <section className="card">
          <h2 className="mb-2 font-bold">Animation</h2>
          <div role="radiogroup" aria-label="Animation" className="grid grid-cols-3 gap-1">
            {(['envelope', 'flip', 'confetti'] as Animation[]).map((a) => (
              <button
                key={a}
                type="button"
                role="radio"
                aria-checked={animation === a}
                className="btn btn-sm"
                onClick={() => setAnimation(a)}
              >
                {a === 'envelope' ? 'Envelope' : a === 'flip' ? 'Card flip' : 'Confetti'}
              </button>
            ))}
          </div>
        </section>
        <section className="card">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-bold">Preview as recipient</h2>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setPreview((p) => !p)}
              data-testid="preview-recipient"
            >
              {preview ? 'Reset' : 'Play'}
            </button>
          </div>
          <div
            className={`anim-stage relative mx-auto w-[180px] ${preview ? `anim-${animation}` : ''}`}
            key={preview ? 'on' : 'off'}
          >
            {animation === 'confetti' && preview
              ? Array.from({ length: 18 }).map((_, i) => (
                  <span
                    key={i}
                    className="confetti-piece"
                    style={{
                      left: `${(i * 41) % 100}%`,
                      background: ['#C92F3A', '#2B55C6', '#D9A441', '#1B6B57'][i % 4],
                      animationDelay: `${(i % 6) * 0.12}s`,
                    }}
                    aria-hidden="true"
                  />
                ))
              : null}
            <div
              className={`paper ${animation === 'flip' && preview ? 'flipping' : animation === 'envelope' && preview ? 'rising' : ''}`}
            >
              <CardArt design={design} title={title} name={first} />
            </div>
            {animation === 'envelope' && preview ? (
              <div
                className="flap absolute inset-x-0 top-0 h-1/2 rounded-t-md bg-surface2 opacity-90"
                aria-hidden="true"
              />
            ) : null}
          </div>
          <div className="paper mt-3 p-3">
            {preview ? (
              <Narration
                key={message}
                text={message}
                audioUrl={narration && narration.kind !== 'voice' ? narration.url : null}
                timings={[]}
                className={fontClass}
              />
            ) : (
              <p className={`${fontClass} leading-snug`}>{message}</p>
            )}
          </div>
        </section>
        <button
          type="button"
          className="btn btn-primary w-full"
          disabled={busy !== null || !person || !message.trim()}
          data-testid="send-ecard"
          onClick={() => void send()}
        >
          {busy === 'send' ? 'Sending…' : 'Send eCard £0.79'}
        </button>
        <ErrorNote message={error} />
      </aside>
    </div>
  );
}
