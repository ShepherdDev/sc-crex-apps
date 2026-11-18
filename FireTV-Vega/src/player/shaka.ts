/**
 * HLS playback goes through Amazon's patched Shaka Player for Vega.
 *
 * Amazon's files (src/shakaplayer/, src/polyfills/, src/PlayerInterface.ts)
 * are licensed and NOT in git. See README.md for how to install them.
 * This file is the only place the app touches Shaka.
 */
import type {VideoPlayer} from '@amazon-devices/react-native-w3cmedia';
// Must come before ShakaPlayer: sets up the globals Shaka reads on load.
import './environment';
import {ShakaPlayer} from '../shakaplayer/ShakaPlayer';

// React Native's global object (where Amazon's wrapper expects `gmedia`).
declare const global: any;

export interface HlsPlayer {
  /**
   * Starts loading the stream. With no startPosition, live streams join near
   * the live point (Resi's playlist sets EXT-X-START) and recorded videos
   * start at the beginning.
   */
  load(url: string, startPosition?: number): Promise<void>;
  unload(): Promise<void>;
}

export function createHlsPlayer(video: VideoPlayer): HlsPlayer {
  // Amazon's wrapper looks the media element up on this global.
  (global as any).gmedia = video;
  const shaka: any = new ShakaPlayer(video, {
    secure: false,
    abrEnabled: true,
    abrMaxWidth: 1920,
    abrMaxHeight: 1080,
  });
  return {
    async load(url: string, startPosition?: number) {
      await shaka.load(
        {
          uri: url,
          secure: 'false',
          drm_scheme: '',
          drm_license_uri: '',
          type: 'HLS',
          // Resi and Vimeo both use fMP4 segments, so the wrapper turns
          // Shaka's sequenceMode off (it's only for MPEG-TS).
          container: 'MP4',
          ...(startPosition ? {start_position: startPosition} : {}),
        },
        true,
      );
    },
    async unload() {
      try {
        await shaka.destroy();
      } finally {
        (global as any).gmedia = null;
      }
    },
  };
}
