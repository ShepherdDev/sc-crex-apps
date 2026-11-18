import { Dimensions, PixelRatio, StyleSheet } from "react-native";

/**
 * Every size in this app is written for a 1920 x 1080 screen (the mockups).
 * The real drawing area is measured by the app's root view on startup (see
 * App.tsx) and everything is scaled to it. We measure instead of trusting
 * Dimensions because Vega's reported size didn't match its layout units.
 */
let scale = Dimensions.get("window").width / 1920;
let version = 0;

export function setScreenWidth(width: number) {
  console.log(
    `[scale] root width ${width}, window ${JSON.stringify(
      Dimensions.get("window")
    )}, pixelRatio ${PixelRatio.get()}`
  );
  const next = width / 1920;
  if (next !== scale) {
    scale = next;
    version++;
  }
}

/** Converts a 1920-wide design size to screen units. */
export const px = (n: number) => n * scale;

/** Style keys that are ratios or counts, not sizes. */
const UNSCALED = new Set([
  "flex",
  "flexGrow",
  "flexShrink",
  "opacity",
  "zIndex",
  "aspectRatio",
  "elevation",
  "transform",
]);

function scaleStyle(style: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const [key, value] of Object.entries(style)) {
    out[key] =
      typeof value === "number" && !UNSCALED.has(key) ? px(value) : value;
  }
  return out;
}

/**
 * Like StyleSheet.create, with every size written in 1920-wide design units.
 * Styles are scaled when first used (after the screen is measured) and
 * rescaled if the measured size ever changes.
 */
export function scaledStyles<T extends StyleSheet.NamedStyles<T>>(
  styles: T & StyleSheet.NamedStyles<any>
): T {
  const out = {} as T;
  for (const name of Object.keys(styles) as (keyof T)[]) {
    let cached: any;
    let cachedVersion = -1;
    Object.defineProperty(out, name, {
      enumerable: true,
      get() {
        if (cachedVersion !== version) {
          cached = scaleStyle(styles[name] as Record<string, any>);
          cachedVersion = version;
        }
        return cached;
      },
    });
  }
  return out;
}
