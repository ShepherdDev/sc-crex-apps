/**
 * HLS playback goes through Amazon's patched Shaka Player for Vega.
 *
 * Its files are NOT in git: download "Shaka Player for Vega" from Amazon's
 * developer resources, run its setup script, and copy it into src/shakaplayer/
 * (steps in README.md). This file is the only place the app touches it, so a
 * future Shaka update only needs changes here.
 */
import type {VideoPlayer} from '@amazon-devices/react-native-w3cmedia';
import {ShakaPlayer} from '../shakaplayer/ShakaPlayer';

export interface HlsPlayer {
  /** Starts loading the stream. Live streams begin at the live edge. */
  load(url: string): Promise<void>;
  unload(): Promise<void>;
}

export function createHlsPlayer(video: VideoPlayer): HlsPlayer {
  const shaka: any = new ShakaPlayer(video, {secure: false, abrEnabled: true});
  return {
    async load(url: string) {
      await shaka.load(
        {uri: url, secure: 'false', drm_scheme: '', drm_license_uri: ''},
        true,
      );
      // Amazon recommends this for HLS with MPEG-TS segments (Resi and Vimeo).
      shaka.player?.configure?.('manifest.hls.sequenceMode', true);
    },
    async unload() {
      await shaka.unload?.();
    },
  };
}
