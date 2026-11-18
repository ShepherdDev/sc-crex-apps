import {useTVEventHandler} from '@amazon-devices/react-native-kepler';
import type {VideoPlayer} from '@amazon-devices/react-native-w3cmedia';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Image, Text, View} from 'react-native';
import {playbackTime} from '../api/format';
import {colors} from '../config';
import {scaledStyles} from '../scale';

/** Hide the controls after this long without a button press. */
const HIDE_AFTER_MS = 5000;
const SKIP_SECONDS = 10;

type ButtonId = 'back' | 'play' | 'forward' | 'cc';

interface Props {
  video: VideoPlayer;
  title: string;
  subtitle?: string;
  live: boolean;
  hasCaptions: boolean;
  captionsOn: boolean;
  onToggleCaptions: () => void;
}

/**
 * Our own playback controls, so they line up with the rest of the app and
 * have a captions button.
 *
 * The remote is handled here directly (not through Vega's focus system,
 * which wouldn't move between these buttons over the video): Left/Right
 * pick a button, Select presses it. Any button shows the controls; they
 * fade after a few seconds unless paused, and the first Select only brings
 * them back. The remote's own play/pause, rewind and fast-forward buttons
 * are handled by Vega's player.
 */
export const PlayerControls = ({
  video,
  title,
  subtitle,
  live,
  hasCaptions,
  captionsOn,
  onToggleCaptions,
}: Props) => {
  const buttons: ButtonId[] = [
    ...(live ? [] : (['back'] as ButtonId[])),
    'play',
    ...(live ? [] : (['forward'] as ButtonId[])),
    ...(hasCaptions ? (['cc'] as ButtonId[]) : []),
  ];

  const [visible, setVisible] = useState(true);
  const [selected, setSelected] = useState<ButtonId>('play');
  const [paused, setPaused] = useState(false);
  const [time, setTime] = useState({current: 0, duration: 0});
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const visibleRef = useRef(true);

  const show = useCallback(() => {
    visibleRef.current = true;
    setVisible(true);
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
    hideTimer.current = setTimeout(() => {
      // Stay up while paused so people can see where they are.
      if (!video.paused) {
        visibleRef.current = false;
        setVisible(false);
        setSelected('play');
      }
    }, HIDE_AFTER_MS);
  }, [video]);

  useEffect(() => {
    show();
    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    };
  }, [show]);

  // Keep the clock and play state current while the controls are showing.
  useEffect(() => {
    if (!visible) {
      return;
    }
    const tick = () => {
      setPaused(video.paused);
      setTime({
        current: video.currentTime || 0,
        duration: Number.isFinite(video.duration) ? video.duration : 0,
      });
    };
    tick();
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [visible, video]);

  const togglePlay = useCallback(() => {
    if (video.paused) {
      video.play();
      setPaused(false);
    } else {
      video.pause();
      setPaused(true);
    }
    show();
  }, [video, show]);

  const skip = useCallback(
    (seconds: number) => {
      if (live) {
        return;
      }
      const end = Number.isFinite(video.duration) ? video.duration : Infinity;
      video.currentTime = Math.min(
        Math.max(0, (video.currentTime || 0) + seconds),
        end - 1,
      );
      show();
    },
    [video, live, show],
  );

  const press = (id: ButtonId) => {
    switch (id) {
      case 'back':
        return skip(-SKIP_SECONDS);
      case 'forward':
        return skip(SKIP_SECONDS);
      case 'play':
        return togglePlay();
      case 'cc':
        onToggleCaptions();
        return show();
    }
  };

  const move = (step: number) => {
    const i = Math.max(0, buttons.indexOf(selected));
    const next = Math.min(buttons.length - 1, Math.max(0, i + step));
    setSelected(buttons[next]);
    show();
  };

  useTVEventHandler((evt) => {
    // Act once per press: ignore key-up when the remote sends down and up.
    if (evt?.eventKeyAction === 1) {
      return;
    }
    const wasVisible = visibleRef.current;
    switch (evt?.eventType) {
      // Remote media buttons: Vega's player already plays/pauses and skips
      // 10s on these, so handling them here too doubled every skip. Just
      // show the controls so people can see what happened.
      case 'playpause':
      case 'pause':
      case 'rewind':
      case 'skip_backward':
      case 'forward':
      case 'fastforward':
      case 'fast_forward':
      case 'skip_forward':
        return show();
      case 'back':
        return; // the app's Back handler closes the player
      case 'left':
        return wasVisible ? move(-1) : show();
      case 'right':
        return wasVisible ? move(1) : show();
      case 'select':
      case 'enter':
        return wasVisible ? press(selected) : show();
      default:
        return show();
    }
  });

  if (!visible) {
    return null;
  }

  const progress =
    time.duration > 0 ? Math.min(1, time.current / time.duration) : 0;
  const on = (id: ButtonId) => selected === id;

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Image
        source={require('../assets/fade-down.png')}
        aria-hidden
        accessible={false}
        style={styles.shade}
        resizeMode="stretch"
      />
      <View style={styles.panel}>
        <View style={styles.titleRow}>
          {live ? (
            <View style={styles.liveTag}>
              <Text style={styles.liveTagText}>LIVE</Text>
            </View>
          ) : null}
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}

        {live ? null : (
          <View style={styles.timeline}>
            <Text style={styles.time}>{playbackTime(time.current)}</Text>
            <View style={styles.track}>
              <View style={[styles.fill, {flex: progress}]} />
              <View style={{flex: 1 - progress}} />
            </View>
            <Text style={styles.time}>{playbackTime(time.duration)}</Text>
          </View>
        )}

        <View style={styles.buttons}>
          <View style={styles.transport}>
            {live ? null : (
              <Button selected={on('back')} label="Back 10 seconds">
                <Text style={[styles.glyph, on('back') && styles.glyphOn]}>
                  −10
                </Text>
              </Button>
            )}
            <Button big selected={on('play')} label={paused ? 'Play' : 'Pause'}>
              {paused ? (
                <View style={[styles.playIcon, on('play') && styles.playOn]} />
              ) : (
                <View style={styles.pauseIcon}>
                  <View style={[styles.pauseBar, on('play') && styles.barOn]} />
                  <View style={[styles.pauseBar, on('play') && styles.barOn]} />
                </View>
              )}
            </Button>
            {live ? null : (
              <Button selected={on('forward')} label="Forward 10 seconds">
                <Text style={[styles.glyph, on('forward') && styles.glyphOn]}>
                  +10
                </Text>
              </Button>
            )}
          </View>

          {hasCaptions ? (
            <Button
              wide
              selected={on('cc')}
              label={captionsOn ? 'Captions on' : 'Captions off'}>
              <View style={styles.ccRow}>
                <View style={[styles.ccBox, on('cc') && styles.ccBoxOn]}>
                  <Text style={[styles.ccText, on('cc') && styles.glyphOn]}>
                    CC
                  </Text>
                </View>
                <Text style={[styles.ccLabel, on('cc') && styles.glyphOn]}>
                  {captionsOn ? 'On' : 'Off'}
                </Text>
              </View>
            </Button>
          ) : null}
        </View>
      </View>
    </View>
  );
};

/** A control button; "selected" is the one Left/Right has landed on. */
const Button = ({
  selected,
  big,
  wide,
  label,
  children,
}: {
  selected: boolean;
  big?: boolean;
  wide?: boolean;
  label: string;
  children: React.ReactNode;
}) => (
  <View
    aria-label={label}
    aria-selected={selected}
    style={[
      styles.button,
      big && styles.buttonBig,
      wide && styles.buttonWide,
      selected && styles.buttonOn,
    ]}>
    {children}
  </View>
);

const styles = scaledStyles({
  wrap: {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0},
  shade: {position: 'absolute', left: 0, right: 0, bottom: 0, height: 520},
  panel: {
    position: 'absolute',
    left: 96,
    right: 96,
    bottom: 64,
  },
  titleRow: {flexDirection: 'row', alignItems: 'center', gap: 16},
  title: {color: colors.text, fontSize: 44, fontWeight: '700', flexShrink: 1},
  subtitle: {color: colors.textMuted, fontSize: 26, marginTop: 6},
  liveTag: {
    backgroundColor: colors.red,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  liveTagText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 2,
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginTop: 28,
  },
  time: {color: colors.text, fontSize: 24, width: 110, textAlign: 'center'},
  track: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    flexDirection: 'row',
    overflow: 'hidden',
  },
  fill: {backgroundColor: colors.blue},
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 28,
  },
  transport: {flexDirection: 'row', alignItems: 'center', gap: 24},
  button: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  buttonBig: {width: 112, height: 112, borderRadius: 56},
  buttonWide: {width: 200},
  buttonOn: {
    backgroundColor: colors.focusRing,
    borderColor: colors.focusRing,
    transform: [{scale: 1.08}],
  },
  glyph: {color: colors.text, fontSize: 28, fontWeight: '700'},
  glyphOn: {color: colors.background},
  playIcon: {
    width: 0,
    height: 0,
    marginLeft: 8,
    borderTopWidth: 20,
    borderBottomWidth: 20,
    borderLeftWidth: 32,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: colors.text,
  },
  playOn: {borderLeftColor: colors.background},
  pauseIcon: {flexDirection: 'row', gap: 10},
  pauseBar: {
    width: 10,
    height: 38,
    borderRadius: 2,
    backgroundColor: colors.text,
  },
  barOn: {backgroundColor: colors.background},
  ccRow: {flexDirection: 'row', alignItems: 'center', gap: 14},
  ccBox: {
    borderWidth: 3,
    borderColor: colors.text,
    borderRadius: 6,
    paddingHorizontal: 6,
  },
  ccBoxOn: {borderColor: colors.background},
  ccText: {color: colors.text, fontSize: 24, fontWeight: '700'},
  ccLabel: {color: colors.text, fontSize: 26, fontWeight: '600'},
});
