import { randomUUID } from "crypto";
import { buildInclusaoPreviewFromExcel } from "./inclusaoImport";

type CacheItem = {
  createdAt: number;
  preview: ReturnType<typeof buildInclusaoPreviewFromExcel>;
};

const importCache = new Map<string, CacheItem>();

export function putCache(preview: CacheItem["preview"]) {
  const id = randomUUID();
  importCache.set(id, {
    createdAt: Date.now(),
    preview,
  });
  return id;
}

export function getCache(importId: string) {
  return importCache.get(importId);
}

export function deleteCache(importId: string) {
  importCache.delete(importId);
}
