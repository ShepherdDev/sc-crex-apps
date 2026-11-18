import React, {useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, StyleSheet, Text, View} from 'react-native';
import Video, {
  SelectedTrackType,
  type OnLoadData,
  type OnProgressData,
  type OnTextTracksData,
  type VideoRef,
} from 'react-native-video';
import {colors} from '@shared/config';
import {getResumePosition, saveProgress} from '@shared/storage/progress';
import {getCaptionsOn, setCaptionsOn} from '@shared/storage/prefs';
import {PlayerControls, type Playback} from '@shared/components/PlayerControls';
import type {PlayerScreenProps} from '@shared/navigation';
import {scaledStyles} from '@shared/scale';

/** How often to save the position of a recorded message while it plays. */
const SAVE_EVERY_MS = 15_000;

/**
 * Full-screen playback on Fire OS with ExoPlayer (react-native-video) and
 * the shared controls. Same behavior as the Vega player:
 * Live: starts at the live edge (Resi's playlist sets EXT-X-START), never
 * saves a position. Recorded: resumes where this TV left off and feeds
 * Continue Watching. Captions come from the stream (Vimeo's English
 * auto-captions) and the viewer's on/off choice is remembered.
 */
export const PlayerScreen = ({
  message,
  live,
  onFinished,
}: PlayerScreenProps) => {
  const url = live?.videoUrl ?? message?.videoUrl ?? '';
  const ref = useRef<VideoRef>(null);
  const [paused, setPaused] = useState(false);
  const [state, setState] = useState<'loading' | 'playing' | 'error'>(
    'loading',
  );
  const [captionTrack, setCaptionTrack] = useState<number | null>(null);
  const [captionsOn, setCaptions] = useState(false);
  const resumeAt = useRef<number | undefined>(undefined);

  // The latest position, kept in refs so the controls and saving can read it
  // without re-rendering on every progress tick.
  const time = useRef({current: 0, duration: 0});
  const pausedRef = useRef(false);
  pausedRef.current = paused;

  useEffect(() => {
    let cancelled = false;
    if (message && !live) {
      getResumePosition(message.id).then((p) => {
        if (!cancelled) {
          resumeAt.current = p;
        }
      });
    }
    getCaptionsOn().then((on) => !cancelled && setCaptions(on));
    return () => {
      cancelled = true;
    };
  }, [message, live]);

  // Save the position every so often, and when leaving the player.
  useEffect(() => {
    if (!message || live) {
      return;
    }
    const save = () => {
      const {current, duration} = time.current;
      if (duration > 0) {
        saveProgress(message, current, duration);
      }
    };
    const timer = setInterval(save, SAVE_EVERY_MS);
    return () => {
      clearInterval(timer);
      save();
    };
  }, [message, live]);

  /** What the shared controls drive: the same shape as Vega's VideoPlayer. */
  const playback = useMemo<Playback>(
    () => ({
      get paused() {
        return pausedRef.current;
      },
      get currentTime() {
        return time.current.current;
      },
      set currentTime(seconds: number) {
        time.current.current = seconds;
        ref.current?.seek(seconds);
      },
      get duration() {
        return time.current.duration;
      },
      play: () => setPaused(false),
      pause: () => setPaused(true),
    }),
    [],
  );

  const onLoad = (data: OnLoadData) => {
    time.current.duration = Number.isFinite(data.duration) ? data.duration : 0;
    if (resumeAt.current) {
      ref.current?.seek(resumeAt.current);
    }
  };

  const onProgress = (data: OnProgressData) => {
    time.current.current = data.currentTime;
    if (data.currentTime > 0) {
      setState((s) => (s === 'loading' ? 'playing' : s));
    }
  };

  const onTextTracks = ({textTracks}: OnTextTracksData) => {
    // Prefer English; Vimeo labels its track "en-x-autogen".
    const english = textTracks.find((t) =>
      String(t.language ?? '').startsWith('en'),
    );
    const track = english ?? textTracks[0];
    setCaptionTrack(track ? track.index : null);
  };

  const toggleCaptions = () => {
    const on = !captionsOn;
    setCaptions(on);
    setCaptionsOn(on);
  };

  return (
    <View style={styles.page}>
      <Video
        ref={ref}
        source={{uri: url, type: 'm3u8'}}
        style={styles.video}
        resizeMode="contain"
        paused={paused}
        controls={false}
        onLoad={onLoad}
        onProgress={onProgress}
        progressUpdateInterval={500}
        onTextTracks={onTextTracks}
        selectedTextTrack={
          captionsOn && captionTrack !== null
            ? {type: SelectedTrackType.INDEX, value: captionTrack}
            : {type: SelectedTrackType.DISABLED}
        }
        onError={() => setState('error')}
        onEnd={() => {
          if (message) {
            saveProgress(message, 0, 0); // finished: drop it from Continue Watching
          }
          onFinished();
        }}
      />

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

      {state === 'playing' ? (
        <PlayerControls
          video={playback}
          handlesMediaKeys
          title={live ? live.title : message?.title ?? ''}
          subtitle={
            live
              ? 'Streaming live from Shepherd Church'
              : [message?.seriesTitle, message?.speaker]
                  .filter(Boolean)
                  .join(' · ')
          }
          live={!!live}
          hasCaptions={captionTrack !== null}
          captionsOn={captionsOn}
          onToggleCaptions={toggleCaptions}
        />
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
});
