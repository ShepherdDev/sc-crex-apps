import React, {useState} from 'react';
import {Image, Pressable, StyleSheet, Text, View} from 'react-native';
import {imageUrl} from '../api/client';
import {colors} from '../config';

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
}: Props) => {
  const [focused, setFocused] = useState(false);
  const src = imageUrl(image, CARD_WIDTH * 1.5);
  return (
    <Pressable
      role="button"
      aria-label={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      hasTVPreferredFocus={hasTVPreferredFocus}
      onPress={onPress}
      onFocus={() => {
        setFocused(true);
        onFocus?.();
      }}
      onBlur={() => setFocused(false)}
      style={styles.wrap}>
      <View style={[styles.art, focused && styles.artFocused]}>
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

const styles = StyleSheet.create({
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
