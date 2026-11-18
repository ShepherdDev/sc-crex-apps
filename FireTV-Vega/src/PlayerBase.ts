/**
 * Base class that Amazon's ShakaPlayer wrapper (src/shakaplayer/ShakaPlayer.ts)
 * extends. Amazon's "Shaka Player for Vega" package imports this file but
 * doesn't ship it, so this is our own minimal version: it stores the media
 * element and provides no-op defaults for the hooks ShakaPlayer overrides.
 */
import type {HTMLMediaElement} from '@amazon-devices/react-native-w3cmedia';

export interface TextTrackInfo {
  id: string;
  kind: string;
  language: string;
  label: string;
  mode: string;
  playerTrackData?: unknown;
}

export abstract class PlayerBase {
  protected mediaElement: HTMLMediaElement | null;

  constructor(mediaElement: HTMLMediaElement | null) {
    this.mediaElement = mediaElement;
  }

  abstract load(content: any, autoplay: boolean): void;
  abstract unload(): void;

  async destroy(): Promise<void> {
    await this.unload();
  }

  play(): void {
    this.mediaElement?.play();
  }

  pause(): void {
    this.mediaElement?.pause();
  }

  seekBack(): void {
    if (this.mediaElement) {
      this.mediaElement.currentTime = Math.max(
        0,
        this.mediaElement.currentTime - 10,
      );
    }
  }

  seekFront(): void {
    if (this.mediaElement) {
      this.mediaElement.currentTime = this.mediaElement.currentTime + 10;
    }
  }

  getAudioLanguages(): string[] {
    return [];
  }

  selectAudioLanguage(_language: string): void {}

  getTextTracks(): TextTrackInfo[] {
    return [];
  }

  async setTextTrack(
    _newTrack: TextTrackInfo | null,
    _currTrack: TextTrackInfo | null,
  ): Promise<void> {}

  /** Out-of-band subtitles: not used by this app. */
  loadOOBSubtitles(_content: any): void {}

  addPlayerEventListener(_type: string, _listener: any, _options?: any): void {}

  removePlayerEventListener(
    _type: string,
    _listener: any,
    _options?: any,
  ): void {}
}
