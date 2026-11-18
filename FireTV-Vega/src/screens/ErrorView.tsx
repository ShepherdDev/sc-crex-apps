import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {PillButton} from '../components/PillButton';
import {colors} from '../config';

export const ErrorView = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) => (
  <View style={styles.wrap}>
    <Text style={styles.title}>We couldn't load that.</Text>
    <Text style={styles.message}>{message}</Text>
    <PillButton
      label="Try Again"
      primary
      hasTVPreferredFocus
      onPress={onRetry}
    />
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 96,
  },
  title: {
    color: colors.text,
    fontSize: 44,
    fontWeight: '700',
    marginBottom: 16,
  },
  message: {
    color: colors.textMuted,
    fontSize: 28,
    marginBottom: 44,
    textAlign: 'center',
    maxWidth: 1200,
  },
});
