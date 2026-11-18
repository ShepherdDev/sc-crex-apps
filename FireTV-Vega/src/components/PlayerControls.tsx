import {useTVEventHandler} from '@amazon-devices/react-native-kepler';
import type {VideoPlayer} from '@amazon-devices/react-native-w3cmedia';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {Image, Pressable, Text, View} from 'react-native';
import {playbackTime} from '../api/format';
import {colors} from '../config';
import {scaledStyles} from '../scale';

/** Hide the controls after this long without a button press. */
const HIDE_AFTER_MS = 5000;
const SKIP_SECONDS = 10;

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
 * have a captions button. Any remote button shows them; they fade after a
 * few seconds unless paused. Play/pause, rewind and fast-forward on the
 * remote work whether or not the controls are showing.
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
  const [visible, setVisible] = useState(true);
  const [paused, setPaused] = useState(false);
  const [time, setTime] = useState({current: 0, duration: 0});
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  const show = useCallback(() => {
    setVisible(true);
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
    hideTimer.current = setTimeout(() => {
      // Stay up while paused so people can see where they are.
      if (!video.paused) {
        setVisible(false);
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

  useTVEventHandler((evt) => {
    // Act once per press (some remotes send key down and key up).
    if (evt?.eventKeyAction === 1) {
      return;
    }
    switch (evt?.eventType) {
      case 'playpause':
      case 'pause':
        togglePlay();
        break;
      case 'rewind':
      case 'skip_backward':
        skip(-SKIP_SECONDS);
        break;
      case 'forward':
      case 'fastforward':
      case 'fast_forward':
      case 'skip_forward':
        skip(SKIP_SECONDS);
        break;
      case 'back':
        break; // the app's Back handler closes the player
      default:
        show();
    }
  });

  if (!visible) {
    // Invisible catcher: the first Select only brings the controls back.
    return (
      <Pressable
        style={styles.catcher}
        hasTVPreferredFocus
        role="button"
        aria-label="Show playback controls"
        accessibilityHint="Shows play, pause, skip and captions"
        onPress={show}
      />
    );
  }

  const progress =
    time.duration > 0 ? Math.min(1, time.current / time.duration) : 0;

  return (
    <View style={styles.wrap} pointerEvents="box-none">
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
              <ControlButton
                label={`Back ${SKIP_SECONDS} seconds`}
                onPress={() => skip(-SKIP_SECONDS)}
                onFocus={show}>
                {(focused) => (
                  <Text style={[styles.glyph, focused && styles.glyphFocused]}>
                    −10
                  </Text>
                )}
              </ControlButton>
            )}
            <ControlButton
              label={paused ? 'Play' : 'Pause'}
              big
              hasTVPreferredFocus
              onPress={togglePlay}
              onFocus={show}>
              {(focused) =>
                paused ? (
                  <View
                    style={[styles.playIcon, focused && styles.playFocused]}
                  />
                ) : (
                  <View style={styles.pauseIcon}>
                    <View
                      style={[styles.pauseBar, focused && styles.barFocused]}
                    />
                    <View
                      style={[styles.pauseBar, focused && styles.barFocused]}
                    />
                  </View>
                )
              }
            </ControlButton>
            {live ? null : (
              <ControlButton
                label={`Forward ${SKIP_SECONDS} seconds`}
                onPress={() => skip(SKIP_SECONDS)}
                onFocus={show}>
                {(focused) => (
                  <Text style={[styles.glyph, focused && styles.glyphFocused]}>
                    +10
                  </Text>
                )}
              </ControlButton>
            )}
          </View>

          {hasCaptions ? (
            <ControlButton
              label={captionsOn ? 'Captions on' : 'Captions off'}
              wide
              onPress={() => {
                onToggleCaptions();
                show();
              }}
              onFocus={show}>
              {(focused) => (
                <View style={styles.ccRow}>
                  <View style={[styles.ccBox, focused && styles.ccBoxFocused]}>
                    <Text
                      style={[styles.ccText, focused && styles.glyphFocused]}>
                      CC
                    </Text>
                  </View>
                  <Text
                    style={[styles.ccLabel, focused && styles.glyphFocused]}>
                    {captionsOn ? 'On' : 'Off'}
                  </Text>
                </View>
              )}
            </ControlButton>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const ControlButton = ({
  label,
  big,
  wide,
  hasTVPreferredFocus,
  onPress,
  onFocus,
  children,
}: {
  label: string;
  big?: boolean;
  wide?: boolean;
  hasTVPreferredFocus?: boolean;
  onPress: () => void;
  onFocus: () => void;
  children: (focused: boolean) => React.ReactNode;
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      role="button"
      aria-label={label}
      accessibilityHint={label}
      hasTVPreferredFocus={hasTVPreferredFocus}
      onPress={onPress}
      onFocus={() => {
        setFocused(true);
        onFocus();
      }}
      onBlur={() => setFocused(false)}
      style={[
        styles.button,
        big && styles.buttonBig,
        wide && styles.buttonWide,
        focused && styles.buttonFocused,
      ]}>
      {children(focused)}
    </Pressable>
  );
};

const styles = scaledStyles({
  catcher: {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0},
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
  buttonFocused: {
    backgroundColor: colors.focusRing,
    borderColor: colors.focusRing,
    transform: [{scale: 1.08}],
  },
  glyph: {color: colors.text, fontSize: 28, fontWeight: '700'},
  glyphFocused: {color: colors.background},
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
  playFocused: {borderLeftColor: colors.background},
  pauseIcon: {flexDirection: 'row', gap: 10},
  pauseBar: {
    width: 10,
    height: 38,
    borderRadius: 2,
    backgroundColor: colors.text,
  },
  barFocused: {backgroundColor: colors.background},
  ccRow: {flexDirection: 'row', alignItems: 'center', gap: 14},
  ccBox: {
    borderWidth: 3,
    borderColor: colors.text,
    borderRadius: 6,
    paddingHorizontal: 6,
  },
  ccBoxFocused: {borderColor: colors.background},
  ccText: {color: colors.text, fontSize: 24, fontWeight: '700'},
  ccLabel: {color: colors.text, fontSize: 26, fontWeight: '600'},
});
