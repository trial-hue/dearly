import { getStorage } from '@/server/adapters/storage';
import { prisma } from '@/server/db';
import { json } from '@/server/json';

export type MediaKind = 'photo' | 'handwriting' | 'drawing' | 'audio' | 'video';

const LIMITS: Record<MediaKind, { mimes: string[]; maxBytes: number }> = {
  photo: { mimes: ['image/jpeg', 'image/png', 'image/webp'], maxBytes: 10 * 1024 * 1024 },
  handwriting: { mimes: ['image/png', 'image/jpeg', 'image/webp'], maxBytes: 8 * 1024 * 1024 },
  drawing: { mimes: ['image/png', 'image/jpeg', 'image/webp'], maxBytes: 8 * 1024 * 1024 },
  audio: {
    mimes: [
      'audio/webm',
      'audio/mp4',
      'audio/mpeg',
      'audio/wav',
      'audio/ogg',
      'audio/x-m4a',
      'audio/aac',
    ],
    maxBytes: 10 * 1024 * 1024,
  },
  video: { mimes: ['video/webm', 'video/mp4', 'video/quicktime'], maxBytes: 25 * 1024 * 1024 },
};

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'audio/webm': 'weba',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/aac': 'aac',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/ogg': 'ogg',
  'video/webm': 'webm',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
};

export function isMediaKind(value: string): value is MediaKind {
  return Object.prototype.hasOwnProperty.call(LIMITS, value);
}

/** Pixel size from PNG and JPEG headers, without an image library. */
export function imageDimensions(
  buf: Buffer,
  mime: string,
): { width: number; height: number } | null {
  if (mime === 'image/png' && buf.length > 24 && buf.toString('ascii', 1, 4) === 'PNG') {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  if (mime === 'image/jpeg' && buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = buf[i + 1] ?? 0;
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc
      ) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      const len = buf.readUInt16BE(i + 2);
      i += 2 + len;
    }
  }
  return null;
}

export type UploadResult =
  | {
      ok: true;
      id: string;
      url: string;
      width: number | null;
      height: number | null;
      mimeType: string;
    }
  | { ok: false; status: number; error: string };

export async function storeUpload(
  accountId: string,
  kind: MediaKind,
  file: File,
): Promise<UploadResult> {
  const limit = LIMITS[kind];
  const mime = file.type.split(';')[0] ?? '';
  if (!limit.mimes.includes(mime))
    return {
      ok: false,
      status: 415,
      error: `Unsupported type ${mime || 'unknown'} for ${kind}. Allowed: ${limit.mimes.join(', ')}`,
    };
  if (file.size > limit.maxBytes)
    return {
      ok: false,
      status: 413,
      error: `File is ${(file.size / 1048576).toFixed(1)} MB; the limit for ${kind} is ${limit.maxBytes / 1048576} MB`,
    };
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length === 0) return { ok: false, status: 400, error: 'Empty file' };
  const dims = imageDimensions(buffer, mime);
  const stored = await getStorage().put(buffer, mime, EXT[mime] ?? 'bin');
  const media = await prisma.media.create({
    data: {
      accountId,
      kind,
      storageKey: stored.key,
      mimeType: mime,
      sizeBytes: buffer.length,
      width: dims?.width ?? null,
      height: dims?.height ?? null,
      checks: json({ dimensionsRead: Boolean(dims) }),
    },
  });
  return {
    ok: true,
    id: media.id,
    url: stored.url,
    width: dims?.width ?? null,
    height: dims?.height ?? null,
    mimeType: mime,
  };
}
