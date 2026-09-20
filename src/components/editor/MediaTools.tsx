'use client';

import { useRef, useState } from 'react';

import { useToast } from '@/components/shell/Toast';
import { Badge, ErrorNote } from '@/components/ui';
import { SIZES, type CardSpec, type Size } from '@/domain';
import { ApiError, api, useAction } from '@/lib/fetcher';
import type { Serialized } from '@/lib/serialize';
import type { ProposalView } from '@/server/services/proposals';

type ProposalDTO = Serialized<ProposalView>;

interface UploadResult {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
}

async function upload(kind: string, file: Blob, filename: string): Promise<UploadResult> {
  const form = new FormData();
  form.append('kind', kind);
  form.append('file', file, filename);
  const res = await fetch('/api/uploads', { method: 'POST', body: form });
  if (!res.ok)
    throw new ApiError({
      title: 'Upload failed',
      status: res.status,
      ...(await res.json().catch(() => ({}))),
    });
  return (await res.json()) as UploadResult;
}

function readImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not read the image'));
    img.src = url;
  });
}

/** Photo check, handwriting by photo, signature-only, child's drawing and the AI card front. */
export function MediaTools({
  proposalKey,
  card,
  size,
  onCard,
}: {
  proposalKey: string;
  card: CardSpec;
  size: Size;
  onCard: (view: ProposalDTO) => void;
}) {
  const { run, busy, error } = useAction();
  const { toast } = useToast();
  const [verdict, setVerdict] = useState<{ ok: boolean; text: string; file: File } | null>(null);
  const [signatureOnly, setSignatureOnly] = useState(card.handwriting?.signatureOnly ?? false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const patch = (changes: Partial<CardSpec>) =>
    run(
      'media',
      async () => {
        const view = await api<ProposalDTO>(`/api/proposals/${encodeURIComponent(proposalKey)}`, {
          method: 'PATCH',
          json: { action: 'edit', patch: changes },
        });
        onCard(view);
      },
      { refresh: false },
    );

  const checkPhoto = async (file: File) => {
    const img = await readImage(file);
    const longEdge = Math.max(img.naturalWidth, img.naturalHeight);
    const need = SIZES[size].minPx;
    const ok = longEdge >= need;
    let advice = ok
      ? `Sharp enough for a ${SIZES[size].label} card.`
      : `Too small for ${SIZES[size].label}: the long edge is ${longEdge} px and ${need} px is needed.`;
    if (!ok) {
      const fits = (Object.keys(SIZES) as Size[]).filter((s) => longEdge >= SIZES[s].minPx);
      advice += fits.length
        ? ` It would print well at ${fits.map((s) => SIZES[s].label).join(' or ')}.`
        : ' Try a larger original.';
    }
    setVerdict({ ok, text: `${img.naturalWidth} × ${img.naturalHeight} px. ${advice}`, file });
  };

  const setFrontFrom = (kind: 'photo' | 'drawing', file: File) =>
    run(
      'front',
      async () => {
        const up = await upload(kind, file, file.name);
        await patch({ customFront: { kind: 'media', mediaId: up.id, url: up.url } });
        toast(kind === 'photo' ? 'Photo set as the front' : 'Drawing set as the front');
      },
      { refresh: false },
    );

  const cleanHandwriting = (file: File) =>
    run(
      'handwriting',
      async () => {
        const img = await readImage(file);
        const canvas = canvasRef.current;
        if (!canvas || !canvas.getContext) return;
        const scale = Math.min(1, 1200 / Math.max(img.naturalWidth, img.naturalHeight));
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const px = data.data;
        // Threshold: paper goes transparent, ink stays dark.
        for (let i = 0; i < px.length; i += 4) {
          const lum = 0.299 * (px[i] ?? 0) + 0.587 * (px[i + 1] ?? 0) + 0.114 * (px[i + 2] ?? 0);
          if (lum > 150) px[i + 3] = 0;
          else {
            px[i] = 31;
            px[i + 1] = 26;
            px[i + 2] = 21;
            px[i + 3] = 255;
          }
        }
        ctx.putImageData(data, 0, 0);
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/png'),
        );
        if (!blob) throw new Error('Could not process the handwriting');
        const up = await upload('handwriting', blob, 'handwriting.png');
        await patch({ handwriting: { mediaId: up.id, url: up.url, signatureOnly } });
        toast('Handwriting added to the card');
      },
      { refresh: false },
    );

  const aiFront = () =>
    run(
      'aifront',
      async () => {
        const r = await api<{
          view: ProposalDTO;
          by: 'ai' | 'rule';
          applied: boolean;
          note?: string | null;
        }>('/api/ai/card_front', { json: { key: proposalKey } });
        onCard(r.view);
        toast(
          r.applied ? 'Front drawn by AI' : `Kept the stock design${r.note ? `: ${r.note}` : ''}`,
        );
      },
      { refresh: false },
    );

  return (
    <section>
      <h3 className="mb-2 text-sm font-bold">Photos, handwriting and drawings</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="card space-y-2">
          <label className="text-xs font-medium text-ink-2" htmlFor="photo-input">
            Photo check for the front
          </label>
          <input
            id="photo-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="block w-full text-sm"
            onChange={(e) => e.target.files?.[0] && void checkPhoto(e.target.files[0])}
          />
          {verdict ? (
            <div className="space-y-2 text-sm">
              <p className={verdict.ok ? 'text-success' : 'text-warning'}>{verdict.text}</p>
              <button
                type="button"
                className="btn btn-sm"
                disabled={busy !== null}
                onClick={() => void setFrontFrom('photo', verdict.file)}
              >
                Use this photo as the front
              </button>
            </div>
          ) : (
            <p className="muted text-xs">
              Reads the pixel size and says whether it will print sharply at the chosen size (
              {SIZES[size].minPx} px on the long edge).
            </p>
          )}
        </div>
        <div className="card space-y-2">
          <label className="text-xs font-medium text-ink-2" htmlFor="handwriting-input">
            Handwriting by photo
          </label>
          <input
            id="handwriting-input"
            type="file"
            accept="image/*"
            capture="environment"
            className="block w-full text-sm"
            onChange={(e) => e.target.files?.[0] && void cleanHandwriting(e.target.files[0])}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={signatureOnly}
              onChange={(e) => setSignatureOnly(e.target.checked)}
            />{' '}
            Signature only (small, bottom right)
          </label>
          <p className="muted text-xs">
            Photograph your writing on white paper. The paper is removed and the ink is placed
            inside the card.
          </p>
          <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
        </div>
        <div className="card space-y-2">
          <label className="text-xs font-medium text-ink-2" htmlFor="drawing-input">
            A child&rsquo;s drawing as the front
          </label>
          <input
            id="drawing-input"
            type="file"
            accept="image/*"
            className="block w-full text-sm"
            onChange={(e) => e.target.files?.[0] && void setFrontFrom('drawing', e.target.files[0])}
          />
        </div>
        <div className="card space-y-2">
          <span className="text-xs font-medium text-ink-2">AI card front</span>
          <button
            type="button"
            className="btn btn-sm"
            disabled={busy !== null}
            onClick={() => void aiFront()}
          >
            {busy === 'aifront' ? 'Drawing…' : 'Draw a front with AI'}
          </button>
          <p className="muted text-xs">
            Asks the AI for an SVG front. It is sanitised before it is shown; with no AI the stock
            design stays.
          </p>
        </div>
      </div>
      {card.customFront || card.handwriting ? (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {card.customFront ? (
            <Badge kind={card.customFront.kind === 'svg' ? 'ai' : 'plain'}>
              {card.customFront.kind === 'svg' ? 'Front drawn by AI' : 'Custom front'}
            </Badge>
          ) : null}
          {card.handwriting ? <Badge>Handwriting inside</Badge> : null}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => void patch({ customFront: null, handwriting: null })}
          >
            Remove custom media
          </button>
        </div>
      ) : null}
      <ErrorNote message={error} />
    </section>
  );
}
