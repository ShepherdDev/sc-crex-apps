import {getStore} from './progress';

const CAPTIONS_KEY = 'shepherd.captions.v1';

/** Whether this TV's viewer last chose captions on. Remembered between videos. */
export async function getCaptionsOn(): Promise<boolean> {
  try {
    return (await getStore().getItem(CAPTIONS_KEY)) === 'on';
  } catch {
    return false;
  }
}

export async function setCaptionsOn(on: boolean): Promise<void> {
  try {
    await getStore().setItem(CAPTIONS_KEY, on ? 'on' : 'off');
  } catch {
    // Not critical.
  }
}
