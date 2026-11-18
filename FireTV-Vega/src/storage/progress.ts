import AsyncStorage from '@amazon-devices/react-native-async-storage__async-storage';
import type {Message} from '../api/types';

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
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Progress[]) : [];
  } catch {
    return [];
  }
}

async function writeAll(items: Progress[]) {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
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
