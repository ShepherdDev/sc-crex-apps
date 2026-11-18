import {Dimensions, StyleSheet} from 'react-native';

/**
 * Every size in this app is written for a 1920 x 1080 screen (the mockups).
 * Vega reports the screen in density-independent units (960 x 540 on a
 * 1080p TV), so we scale everything to the real width. Without this the whole
 * app draws twice as big.
 */
export const SCALE = Dimensions.get('window').width / 1920;

/** Converts a 1920-wide design size to screen units. */
export const px = (n: number) => n * SCALE;

/** Style keys that are ratios or counts, not sizes. */
const UNSCALED = new Set([
  'flex',
  'flexGrow',
  'flexShrink',
  'opacity',
  'zIndex',
  'aspectRatio',
  'elevation',
  'transform',
]);

function scaleStyle(style: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(style)) {
    out[key] =
      typeof value === 'number' && !UNSCALED.has(key) ? px(value) : value;
  }
  return out;
}

/** StyleSheet.create with every size written in 1920-wide design units. */
export function scaledStyles<T extends StyleSheet.NamedStyles<T>>(
  styles: T,
): T {
  const out: Record<string, any> = {};
  for (const [name, style] of Object.entries(styles)) {
    out[name] = scaleStyle(style as Record<string, any>);
  }
  return StyleSheet.create(out as T);
}
