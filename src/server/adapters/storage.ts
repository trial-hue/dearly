import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import { env } from '@/env';

export interface StoredObject {
  key: string;
  url: string;
}

export interface StorageAdapter {
  readonly driver: 'local' | 's3';
  put(buffer: Buffer, mimeType: string, extension: string): Promise<StoredObject>;
  get(key: string): Promise<{ buffer: Buffer; mimeType: string } | null>;
  url(key: string): string;
}

const SAFE_KEY = /^[a-z0-9]{1,8}\/[a-z0-9-]{1,64}\.[a-z0-9]{1,5}$/i;

/** Local disk under STORAGE_PATH, served through /api/uploads/[...key]. */
export class LocalStorage implements StorageAdapter {
  readonly driver = 'local' as const;
  constructor(private readonly root: string) {}

  async put(buffer: Buffer, mimeType: string, extension: string): Promise<StoredObject> {
    const key = `${new Date().toISOString().slice(0, 7).replace('-', '')}/${randomUUID()}.${extension}`;
    const file = path.join(this.root, key);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, buffer);
    await fs.writeFile(`${file}.mime`, mimeType);
    return { key, url: this.url(key) };
  }

  async get(key: string) {
    if (!SAFE_KEY.test(key)) return null;
    const file = path.join(this.root, key);
    try {
      const [buffer, mimeType] = await Promise.all([
        fs.readFile(file),
        fs.readFile(`${file}.mime`, 'utf8'),
      ]);
      return { buffer, mimeType: mimeType.trim() };
    } catch {
      return null;
    }
  }

  url(key: string): string {
    return `/api/uploads/${key}`;
  }
}

/** Documented seam for S3-compatible storage. Not implemented in the pilot (see docs/backlog.md). */
export class S3Storage implements StorageAdapter {
  readonly driver = 's3' as const;
  async put(): Promise<StoredObject> {
    throw new Error('S3 storage is not implemented in the pilot; set STORAGE_DRIVER=local');
  }
  async get(): Promise<null> {
    throw new Error('S3 storage is not implemented in the pilot; set STORAGE_DRIVER=local');
  }
  url(key: string): string {
    return `/api/uploads/${key}`;
  }
}

let instance: StorageAdapter | null = null;
export function getStorage(): StorageAdapter {
  if (!instance)
    instance =
      env.STORAGE_DRIVER === 's3'
        ? new S3Storage()
        : new LocalStorage(path.resolve(env.STORAGE_PATH));
  return instance;
}
