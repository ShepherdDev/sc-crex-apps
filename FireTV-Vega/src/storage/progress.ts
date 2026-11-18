import type {Message} from '../api/types';

interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

/**
 * Vega's AsyncStorage is a system library. If the TV doesn't link it, loading
 * it throws, so we load it lazily and fall back to memory (progress is then
 * kept only until the app closes) instead of crashing the whole app.
 */
let store: KeyValueStore | undefined;
const memory = new Map<string, string>();
const memoryStore: KeyValueStore = {
  getItem: async (key) => memory.get(key) ?? null,
  setItem: async (key, value) => {
    memory.set(key, value);
  },
};
function getStore(): KeyValueStore {
  if (!store) {
    try {
      store = require('@react-native-async-storage/async-storage').default;
    } catch (e) {
      console.warn(
        'AsyncStorage unavailable; Continue Watching is memory only',
        e,
      );
    }
    store = store ?? memoryStore;
  }
  return store;
}

/** A partly watched message, saved on this TV only. */
export interface Progress {
  message: Message;
  position: number; // seconds
  duration: number; // seconds
  updatedAt: number;
}

const KEY = 'shepherd.progress.v1';
const MAX_ITEMS = 20;
/** Ignore the first minute and the last five (people who barely started or finished). */
const MIN_POSITION = 60;
const END_MARGIN = 300;

async function readAll(): Promise<Progress[]> {
  try {
    const raw = await getStore().getItem(KEY);
    return raw ? (JSON.parse(raw) as Progress[]) : [];
  } catch {
    return [];
  }
}

async function writeAll(items: Progress[]) {
  try {
    await getStore().setItem(KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch {
    // Storage is a nice-to-have; never let it break playback.
  }
}

/** Newest first: what the Continue Watching row shows. */
export const getContinueWatching = readAll;

export async function getResumePosition(
  messageId: string,
): Promise<number | undefined> {
  const found = (await readAll()).find((p) => p.message.id === messageId);
  return found?.position;
}

export async function saveProgress(
  message: Message,
  position: number,
  duration: number,
) {
  const others = (await readAll()).filter((p) => p.message.id !== message.id);
  const finished = duration > 0 && position > duration - END_MARGIN;
  if (position < MIN_POSITION || finished) {
    await writeAll(others);
    return;
  }
  await writeAll([
    {message, position, duration, updatedAt: Date.now()},
    ...others,
  ]);
}
