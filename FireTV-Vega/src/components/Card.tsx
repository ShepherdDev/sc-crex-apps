import React, {useState} from 'react';
import {Image, Pressable, Text, View} from 'react-native';
import {imageUrl} from '../api/client';
import {colors} from '../config';
import {px, scaledStyles} from '../scale';
import {useInitialFocus} from '../focus';

export const CARD_WIDTH = 400;
export const CARD_HEIGHT = 225;

interface Props {
  image: string | null;
  /** Printed over the artwork (message cards), since messages share series art. */
  overlayTitle?: string;
  caption?: string;
  /** 0..1, draws a progress bar (Continue Watching). */
  progress?: number;
  onPress: () => void;
  onFocus?: () => void;
  hasTVPreferredFocus?: boolean;
  accessibilityLabel: string;
  /** What pressing does, read by screen readers. */
  accessibilityHint: string;
  /** Card width in 1920-wide design units (grids size cards to fit). */
  width?: number;
}

export const Card = ({
  image,
  overlayTitle,
  caption,
  progress,
  onPress,
  onFocus,
  hasTVPreferredFocus,
  accessibilityLabel,
  accessibilityHint,
  width = CARD_WIDTH,
}: Props) => {
  const preferFocus = useInitialFocus(hasTVPreferredFocus);
  const [focused, setFocused] = useState(false);
  const src = imageUrl(image, width * 1.5);
  const size =
    width === CARD_WIDTH
      ? null
      : {width: px(width), height: px((width * CARD_HEIGHT) / CARD_WIDTH)};
  return (
    <Pressable
      role="button"
      aria-label={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      hasTVPreferredFocus={preferFocus}
      onPress={onPress}
      onFocus={() => {
        setFocused(true);
        onFocus?.();
      }}
      onBlur={() => setFocused(false)}
      style={[styles.wrap, size && {width: size.width}]}>
      <View style={[styles.art, size, focused && styles.artFocused]}>
        {src ? (
          <Image
            accessible={false}
            aria-label=""
            source={{uri: src}}
            style={[styles.image, overlayTitle ? styles.dimmed : null]}
            resizeMode="cover"
          />
        ) : null}
        {overlayTitle ? (
          <Text numberOfLines={2} style={styles.overlayTitle}>
            {overlayTitle}
          </Text>
        ) : null}
        {progress !== undefined ? (
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                {width: `${Math.round(Math.min(1, progress) * 100)}%`},
              ]}
            />
          </View>
        ) : null}
      </View>
      {caption ? (
        <Text
          numberOfLines={1}
          style={[styles.caption, focused && styles.captionFocused]}>
          {caption}
        </Text>
      ) : null}
    </Pressable>
  );
};

const styles = scaledStyles({
  wrap: {width: CARD_WIDTH},
  art: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 4,
    borderColor: 'transparent',
  },
  artFocused: {borderColor: colors.blue, transform: [{scale: 1.05}]},
  image: {width: '100%', height: '100%'},
  dimmed: {opacity: 0.5},
  overlayTitle: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 22,
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
  },
  track: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  fill: {height: 8, backgroundColor: colors.blue},
  caption: {marginTop: 12, color: colors.textDim, fontSize: 22},
  captionFocused: {color: colors.text},
});
