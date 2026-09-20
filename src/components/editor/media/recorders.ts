'use client';

import { ApiError } from '@/lib/fetcher';

export async function uploadMedia(
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

/** Duration of a recorded or uploaded audio blob; recorded webm often needs a seek to report it. */
export function blobDuration(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const el = document.createElement('audio');
    el.preload = 'metadata';
    el.onloadedmetadata = () => {
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

export const canRecord = (): boolean =>
  typeof window !== 'undefined' &&
  typeof MediaRecorder !== 'undefined' &&
  Boolean(navigator.mediaDevices?.getUserMedia);

/** Start a MediaRecorder for audio or video; resolves the blob when stop() is called. */
export async function startRecording(
  kind: 'audio' | 'video',
): Promise<{ stop: () => void; done: Promise<Blob> }> {
  const stream = await navigator.mediaDevices.getUserMedia(
    kind === 'audio' ? { audio: true } : { audio: true, video: true },
  );
  const rec = new MediaRecorder(stream);
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => chunks.push(e.data);
  const done = new Promise<Blob>((resolve) => {
    rec.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      resolve(
        new Blob(chunks, {
          type: rec.mimeType || (kind === 'audio' ? 'audio/webm' : 'video/webm'),
        }),
      );
    };
  });
  rec.start();
  return { stop: () => rec.stop(), done };
}

export type NarrationSource =
  | { kind: 'recording' | 'upload'; blob: Blob; url: string; duration: number }
  | { kind: 'voice' }
  | null;
export type ClipSource = { blob: Blob; url: string; kind: 'video' | 'audio' } | null;

/** Word timings spaced evenly across the audio for the recipient's word-by-word reveal. */
export function evenTimings(message: string, durationSec: number): number[] {
  const words = message.split(/\s+/).filter(Boolean);
  const dur = durationSec > 0 ? durationSec : words.length / 2.5;
  return words.map((_, i) => Math.round(((i + 0.5) / words.length) * dur * 1000));
}
