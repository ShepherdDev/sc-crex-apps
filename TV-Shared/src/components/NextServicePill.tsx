import React from 'react';
import {Text, View} from 'react-native';
import {nextServiceLabel} from '../api/format';
import {colors} from '../config';
import {scaledStyles} from '../scale';

/**
 * "Next service in 3 hours" on a dark, nearly opaque pill so it reads over
 * any series artwork. Counts down to when the stream goes live.
 */
export const NextServicePill = ({start, now}: {start: string; now: string}) => {
  const {lead, emphasis} = nextServiceLabel(start, now);
  return (
    <View style={styles.pill} aria-label={`${lead} ${emphasis}`}>
      <View style={styles.clock}>
        <View style={styles.handHour} />
        <View style={styles.handMinute} />
      </View>
      <Text style={styles.text}>
        {lead} <Text style={styles.emphasis}>{emphasis}</Text>
      </Text>
    </View>
  );
};

const styles = scaledStyles({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 14,
    paddingBottom: 14,
    paddingLeft: 22,
    paddingRight: 28,
    borderRadius: 999,
    // No backdrop blur on TV, so the pill is more opaque than the mockup.
    backgroundColor: 'rgba(11,12,14,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  text: {color: '#E3E6EA', fontSize: 26, fontWeight: '300'},
  emphasis: {color: colors.text, fontWeight: '700'},
  clock: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.blue,
  },
  handHour: {
    position: 'absolute',
    left: 10,
    top: 4,
    width: 2,
    height: 8,
    backgroundColor: colors.blue,
  },
  handMinute: {
    position: 'absolute',
    left: 11,
    top: 11,
    width: 6,
    height: 2,
    backgroundColor: colors.blue,
  },
});
