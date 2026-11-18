import React, {useEffect, useRef, useState} from 'react';
import {TVFocusGuideView} from '../platform/tv';
import {Image, Pressable, Text, View} from 'react-native';
import {colors, MENU_WIDTH} from '../config';
import type {Section} from '../navigation';
import {scaledStyles} from '../scale';

const ITEMS: {section: Section; label: string; hint: string}[] = [
  {section: 'home', label: 'Home', hint: 'Go to the home screen'},
  {section: 'live', label: 'Watch Live', hint: 'Watch the live stream'},
  {section: 'series', label: 'Series', hint: 'Browse all message series'},
  {section: 'groups', label: 'Life Groups', hint: 'Browse Life Group videos'},
];

interface Props {
  current: Section;
  isLive: boolean;
  onSelect: (section: Section) => void;
  /** Tells the app whether focus is in the menu, for the Back button rules. */
  onFocusChange: (inMenu: boolean) => void;
  /** Bump this to move focus onto the current item (Back from a screen). */
  focusRequest: number;
}

/**
 * The always-visible menu on the left. Icons and words are always shown so
 * nobody has to guess what an icon means. Left from any screen lands here;
 * the focus guide brings you back to the item you were on.
 */
export const SideMenu = ({
  current,
  isLive,
  onSelect,
  onFocusChange,
  focusRequest,
}: Props) => {
  const refs = useRef<Partial<Record<Section, any>>>({});

  // Back from a screen: put focus on the current section's menu item.
  useEffect(() => {
    if (focusRequest > 0) {
      refs.current[current]?.requestTVFocus?.();
    }
    // Only when a new request comes in, not when the section changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRequest]);

  return (
    <View style={styles.rail}>
      <Image
        source={require('../assets/logo.png')}
        aria-label="Shepherd Church"
        style={styles.logo}
        resizeMode="contain"
      />
      <TVFocusGuideView autoFocus style={styles.items}>
        {ITEMS.map((item) => (
          <MenuItem
            key={item.section}
            itemRef={(r) => {
              refs.current[item.section] = r;
            }}
            section={item.section}
            label={item.label}
            hint={item.hint}
            current={item.section === current}
            showLive={item.section === 'live' && isLive}
            onPress={() => onSelect(item.section)}
            onFocusChange={onFocusChange}
          />
        ))}
      </TVFocusGuideView>
    </View>
  );
};

const MenuItem = ({
  section,
  label,
  hint,
  current,
  showLive,
  itemRef,
  onPress,
  onFocusChange,
}: {
  section: Section;
  label: string;
  hint: string;
  current: boolean;
  showLive: boolean;
  itemRef: (r: any) => void;
  onPress: () => void;
  onFocusChange: (inMenu: boolean) => void;
}) => {
  const [focused, setFocused] = useState(false);
  const color = focused
    ? colors.background
    : current
    ? colors.blue
    : colors.textMuted;
  return (
    <Pressable
      role="button"
      aria-label={showLive ? `${label}, live now` : label}
      aria-selected={current}
      accessibilityHint={hint}
      ref={itemRef}
      onPress={onPress}
      onFocus={() => {
        setFocused(true);
        onFocusChange(true);
      }}
      onBlur={() => {
        setFocused(false);
        onFocusChange(false);
      }}
      style={[
        styles.item,
        current && styles.itemCurrent,
        focused && styles.itemFocused,
      ]}>
      <Icon section={section} color={color} />
      <Text
        numberOfLines={1}
        style={[styles.label, {color}, (current || focused) && styles.bold]}>
        {label}
      </Text>
      {showLive ? (
        <View style={styles.liveTag}>
          <Text style={styles.liveTagText}>LIVE</Text>
        </View>
      ) : null}
    </Pressable>
  );
};

/** Simple icons drawn with views, so we don't need an SVG library. */
const Icon = ({section, color}: {section: Section; color: string}) => {
  switch (section) {
    case 'home':
      return (
        <View style={styles.icon}>
          <View style={[styles.roof, {borderBottomColor: color}]} />
          <View style={[styles.house, {borderColor: color}]} />
        </View>
      );
    case 'live':
      return (
        <View style={styles.icon}>
          <View style={[styles.ring, {borderColor: color}]}>
            <View style={[styles.dot, {backgroundColor: color}]} />
          </View>
        </View>
      );
    case 'series':
      return (
        <View style={styles.icon}>
          <View style={[styles.stackBack, {borderColor: color}]} />
          <View style={[styles.stackFront, {borderColor: color}]} />
        </View>
      );
    case 'groups':
      return (
        <View style={[styles.icon, styles.people]}>
          {[0, 1].map((i) => (
            <View key={i} style={styles.person}>
              <View style={[styles.head, {borderColor: color}]} />
              <View style={[styles.body, {borderColor: color}]} />
            </View>
          ))}
        </View>
      );
  }
};

const styles = scaledStyles({
  rail: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: MENU_WIDTH,
    backgroundColor: '#060708',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.08)',
    // Many TVs crop the picture's edges (overscan), so the menu's contents
    // start inside the ~5% title-safe zone. The background still runs to the edge.
    paddingTop: 64,
    paddingLeft: 84,
    paddingRight: 16,
  },
  logo: {width: 256, height: 43, marginLeft: 12, marginBottom: 64},
  items: {gap: 12},
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    height: 72,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  itemCurrent: {backgroundColor: 'rgba(67,178,229,0.14)'},
  itemFocused: {
    backgroundColor: colors.focusRing,
    transform: [{scale: 1.04}],
  },
  label: {fontSize: 26, fontWeight: '500', flexShrink: 1},
  bold: {fontWeight: '700'},
  liveTag: {
    backgroundColor: colors.red,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 'auto',
  },
  liveTagText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  // Icons, 30 x 30
  icon: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roof: {
    width: 0,
    height: 0,
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  house: {width: 22, height: 14, borderWidth: 3, borderTopWidth: 0},
  ring: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {width: 10, height: 10, borderRadius: 5},
  stackBack: {
    position: 'absolute',
    top: 2,
    left: 6,
    width: 22,
    height: 16,
    borderWidth: 3,
    borderRadius: 3,
    opacity: 0.6,
  },
  stackFront: {
    position: 'absolute',
    top: 10,
    left: 1,
    width: 22,
    height: 16,
    borderWidth: 3,
    borderRadius: 3,
  },
  people: {flexDirection: 'row', gap: 2, alignItems: 'flex-end'},
  person: {alignItems: 'center'},
  head: {width: 11, height: 11, borderRadius: 6, borderWidth: 3},
  body: {
    width: 14,
    height: 9,
    marginTop: 2,
    borderWidth: 3,
    borderBottomWidth: 0,
    borderTopLeftRadius: 7,
    borderTopRightRadius: 7,
  },
});
