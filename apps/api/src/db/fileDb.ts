// apps/api/src/db/fileDb.ts
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = join(process.cwd(), 'apps', 'api', 'data');
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

export function readJson<T>(file: string, fallback: T): T {
  const path = join(DATA_DIR, file);
  try {
    const raw = readFileSync(path, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    writeFileSync(path, JSON.stringify(fallback, null, 2));
    return fallback;
  }
}

export function writeJson<T>(file: string, data: T) {
  const path = join(DATA_DIR, file);
  writeFileSync(path, JSON.stringify(data, null, 2));
}
