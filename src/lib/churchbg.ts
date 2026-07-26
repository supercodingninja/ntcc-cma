// ==========================================================================
// This Area Of Code Is: Per-Church Background Media.
// Explanation: Every church can put its own pictures AND videos running
// behind its app — one upload icon in Admin → This Church. Files live in
// the device's IndexedDB vault (big enough for video), the manifest is
// namespaced per church code so graham.praises.team and guam.praises.team
// each play their own memories. The backdrop interleaves them with the
// shared photo reel.
// In Other Words: Each church hangs its own family photos on its own walls.
// ==========================================================================

import { storeFile, resolveFileUrl } from './fileStore';

export interface ChurchBgItem {
  id: string;
  ref: string;                 // idb://…
  kind: 'image' | 'video';
  name: string;
}

const manifestKey = (code: string) => `ntcc.churchbg.${code}`;

export function loadChurchBg(code: string): ChurchBgItem[] {
  try {
    const raw = localStorage.getItem(manifestKey(code));
    if (raw) return JSON.parse(raw) as ChurchBgItem[];
  } catch { /* fall through */ }
  return [];
}

export async function addChurchBg(code: string, file: File): Promise<ChurchBgItem[]> {
  const ref = await storeFile(file);
  const item: ChurchBgItem = {
    id: ref.slice(6),
    ref,
    kind: file.type.startsWith('video') ? 'video' : 'image',
    name: file.name,
  };
  const list = [...loadChurchBg(code), item];
  localStorage.setItem(manifestKey(code), JSON.stringify(list));
  return list;
}

export function removeChurchBg(code: string, id: string): ChurchBgItem[] {
  const list = loadChurchBg(code).filter((i) => i.id !== id);
  localStorage.setItem(manifestKey(code), JSON.stringify(list));
  return list;
}

export interface ResolvedBg { url: string; kind: 'image' | 'video' }

/** Resolve the manifest to playable object URLs for the backdrop. */
export async function resolveChurchBg(code: string): Promise<ResolvedBg[]> {
  const out: ResolvedBg[] = [];
  for (const item of loadChurchBg(code)) {
    const url = await resolveFileUrl(item.ref);
    if (url) out.push({ url, kind: item.kind });
  }
  return out;
}
