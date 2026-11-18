import React, {useState} from 'react';
import {Pressable, Text, View} from 'react-native';
import {colors} from '../config';
import {scaledStyles} from '../scale';
import {useInitialFocus} from '../focus';

interface Props {
  label: string;
  onPress: () => void;
  icon?: 'play';
  primary?: boolean;
  hasTVPreferredFocus?: boolean;
  onFocus?: () => void;
  /** What pressing does, read by screen readers. */
  hint?: string;
}

/** Rounded button for the banner and series page; Shepherd Blue when focused. */
export const PillButton = ({
  label,
  onPress,
  icon,
  primary,
  hasTVPreferredFocus,
  onFocus,
  hint,
}: Props) => {
  const preferFocus = useInitialFocus(hasTVPreferredFocus);
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      role="button"
      aria-label={label}
      accessibilityHint={hint ?? label}
      hasTVPreferredFocus={preferFocus}
      onPress={onPress}
      onFocus={() => {
        setFocused(true);
        onFocus?.();
      }}
      onBlur={() => setFocused(false)}
      style={[
        styles.pill,
        primary && styles.primary,
        focused && styles.focused,
      ]}>
      {icon === 'play' && (
        <View style={[styles.play, focused && styles.playFocused]} />
      )}
      <Text style={[styles.label, focused && styles.labelFocused]}>
        {label}
      </Text>
    </Pressable>
  );
};

const styles = scaledStyles({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 76,
    paddingHorizontal: 40,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  primary: {borderColor: 'rgba(255,255,255,0.6)'},
  focused: {
    backgroundColor: colors.blue,
    borderColor: colors.focusRing,
    borderWidth: 4,
    transform: [{scale: 1.06}],
  },
  // CSS triangle for the play icon
  play: {
    width: 0,
    height: 0,
    marginRight: 16,
    borderTopWidth: 13,
    borderBottomWidth: 13,
    borderLeftWidth: 22,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: colors.text,
  },
  playFocused: {borderLeftColor: colors.background},
  label: {color: colors.text, fontSize: 30, fontWeight: '600'},
  labelFocused: {color: colors.background, fontWeight: '700'},
});
