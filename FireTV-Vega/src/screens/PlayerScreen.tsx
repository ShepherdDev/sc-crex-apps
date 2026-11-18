import React, {useEffect, useRef, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import {
  KeplerVideoView,
  VideoPlayer,
} from '@amazon-devices/react-native-w3cmedia';
import type {LiveStream, Message} from '../api/types';
import {colors} from '../config';
import {createHlsPlayer, HlsPlayer} from '../player/shaka';
import {getResumePosition, saveProgress} from '../storage/progress';
import {scaledStyles} from '../scale';

/** How often to save the position of a recorded message while it plays. */
const SAVE_EVERY_MS = 15_000;

interface Props {
  message?: Message;
  live?: LiveStream;
  onFinished: () => void;
}

/**
 * Full-screen playback with Amazon's built-in controls.
 * Live: always starts at the live edge, never saves a position.
 * Recorded: resumes where this TV left off and feeds Continue Watching.
 */
export const PlayerScreen = ({message, live, onFinished}: Props) => {
  const url = live?.videoUrl ?? message?.videoUrl ?? '';
  const [player, setPlayer] = useState<VideoPlayer | null>(null);
  const [state, setState] = useState<'loading' | 'playing' | 'error'>(
    'loading',
  );
  const hls = useRef<HlsPlayer | null>(null);

  useEffect(() => {
    let cancelled = false;
    let saveTimer: ReturnType<typeof setInterval> | undefined;
    const video = new VideoPlayer();

    const save = () => {
      if (message && video.duration > 0) {
        saveProgress(message, video.currentTime, video.duration);
      }
    };
    const onPlaying = () => setState('playing');
    const onError = () => setState('error');
    const onEnded = () => {
      if (message) {
        saveProgress(message, 0, 0); // finished: drop it from Continue Watching
      }
      onFinished();
    };

    (async () => {
      await video.initialize();
      if (cancelled) {
        return;
      }
      video.addEventListener('playing', onPlaying);
      video.addEventListener('error', onError);
      video.addEventListener('ended', onEnded);
      video.autoplay = false;
      // Mount the video view now so its surface is ready when playback starts.
      setPlayer(video);

      hls.current = createHlsPlayer(video);
      const resumeAt =
        message && !live ? await getResumePosition(message.id) : undefined;
      if (cancelled) {
        return;
      }
      await hls.current.load(url, resumeAt);
      if (cancelled) {
        return;
      }
      video.play();
      if (message && !live) {
        saveTimer = setInterval(save, SAVE_EVERY_MS);
      }
    })().catch(() => !cancelled && setState('error'));

    return () => {
      cancelled = true;
      if (saveTimer) {
        clearInterval(saveTimer);
      }
      save();
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('error', onError);
      video.removeEventListener('ended', onEnded);
      // Amazon's certification checks that the decoder is released when playback ends.
      (async () => {
        try {
          await hls.current?.unload();
        } catch {
          // Already unloaded; nothing to release.
        }
        try {
          video.pause();
          await video.deinitialize();
        } catch {
          // Player never finished initializing; nothing to release.
        }
      })();
    };
    // Only re-run if a different video is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  return (
    <View style={styles.page}>
      {player ? (
        <KeplerVideoView
          videoPlayer={player}
          showControls
          scalingmode="fit"
          style={styles.video}
        />
      ) : null}

      {state === 'loading' ? (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={colors.blue} />
        </View>
      ) : null}

      {state === 'error' ? (
        <View style={styles.overlay}>
          <Text style={styles.errorTitle}>
            This video can't be played right now.
          </Text>
          <Text style={styles.errorText}>
            {live
              ? 'If a service is about to start, try again in a minute.'
              : 'Press Back to return.'}
          </Text>
        </View>
      ) : null}

      {live && state === 'playing' ? (
        <View style={styles.liveBadge}>
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = scaledStyles({
  page: {flex: 1, backgroundColor: '#000'},
  video: {flex: 1},
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    color: colors.text,
    fontSize: 40,
    fontWeight: '700',
    marginBottom: 12,
  },
  errorText: {color: colors.textMuted, fontSize: 28},
  liveBadge: {
    position: 'absolute',
    top: 50,
    right: 60,
    backgroundColor: colors.red,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  liveText: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
