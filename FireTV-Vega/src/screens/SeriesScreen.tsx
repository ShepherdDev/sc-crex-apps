import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {getSeries, imageUrl} from '../api/client';
import {messageMeta, shortDate} from '../api/format';
import type {Message, SeriesResponse} from '../api/types';
import {PillButton} from '../components/PillButton';
import {colors, SIDE_MARGIN} from '../config';
import type {Navigate} from '../navigation';
import {ErrorView} from './ErrorView';

/** Big series art on the left, the series' messages on the right. */
export const SeriesScreen = ({
  id,
  navigate,
}: {
  id: string;
  navigate: Navigate;
}) => {
  const [data, setData] = useState<SeriesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await getSeries(id));
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong.');
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (!data) {
    return error ? (
      <ErrorView message={error} onRetry={load} />
    ) : (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.blue} />
      </View>
    );
  }

  const {series, messages} = data;
  const art = imageUrl(series.image, 960);
  const oldest = messages[messages.length - 1];
  const newest = messages[0];
  const span =
    messages.length > 1
      ? `${shortDate(oldest.date)} to ${shortDate(newest.date)}`
      : newest
      ? shortDate(newest.date)
      : '';
  const play = (message: Message) => navigate({name: 'player', message});

  return (
    <View style={styles.page}>
      <View style={styles.left}>
        {art ? (
          <Image
            source={{uri: art}}
            aria-label={`${series.title} series art`}
            style={styles.art}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.art} />
        )}
        <Text style={styles.eyebrow}>SERIES</Text>
        <Text style={styles.title} numberOfLines={3}>
          {series.title}
        </Text>
        <Text style={styles.meta}>
          {messages.length} message{messages.length === 1 ? '' : 's'}
          {span ? ` · ${span}` : ''}
        </Text>
        {series.description ? (
          <Text style={styles.description} numberOfLines={4}>
            {series.description}
          </Text>
        ) : null}
        {oldest ? (
          <View style={styles.buttonRow}>
            <PillButton
              label="Play from the start"
              icon="play"
              onPress={() => play(oldest)}
            />
          </View>
        ) : null}
      </View>

      <View style={styles.right}>
        <Text style={styles.heading}>Messages</Text>
        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={5}
          updateCellsBatchingPeriod={50}
          removeClippedSubviews
          contentContainerStyle={styles.listContent}
          renderItem={({item, index}) => (
            <MessageRow
              message={item}
              hasTVPreferredFocus={index === 0}
              onPress={() => play(item)}
            />
          )}
        />
      </View>
    </View>
  );
};

const MessageRow = ({
  message,
  onPress,
  hasTVPreferredFocus,
}: {
  message: Message;
  onPress: () => void;
  hasTVPreferredFocus?: boolean;
}) => {
  const [focused, setFocused] = useState(false);
  const thumb = imageUrl(message.image, 480);
  return (
    <Pressable
      role="button"
      aria-label={message.title}
      accessibilityHint="Plays this message"
      hasTVPreferredFocus={hasTVPreferredFocus}
      onPress={onPress}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={[styles.row, focused && styles.rowFocused]}>
      {thumb ? (
        <Image
          source={{uri: thumb}}
          accessible={false}
          aria-label=""
          style={styles.thumb}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.thumb} />
      )}
      <View style={styles.rowText}>
        <Text style={styles.rowMeta}>
          {messageMeta(message.date, message.speaker)}
        </Text>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {message.title}
        </Text>
        {message.description ? (
          <Text style={styles.rowDescription} numberOfLines={2}>
            {message.description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  page: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.background,
    paddingHorizontal: SIDE_MARGIN,
    paddingTop: 72,
    gap: 80,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  left: {width: 640},
  art: {
    width: 640,
    height: 360,
    borderRadius: 18,
    backgroundColor: colors.surface,
    marginBottom: 26,
  },
  eyebrow: {
    color: colors.blue,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 14,
  },
  title: {
    color: colors.text,
    fontSize: 72,
    lineHeight: 76,
    fontWeight: '700',
    marginBottom: 14,
  },
  meta: {color: colors.textMuted, fontSize: 28},
  description: {color: '#D5D9DE', fontSize: 24, lineHeight: 34, marginTop: 16},
  buttonRow: {flexDirection: 'row', marginTop: 32},
  right: {flex: 1},
  heading: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 12,
  },
  listContent: {paddingBottom: 120, paddingTop: 8},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
    padding: 14,
    marginBottom: 10,
    borderRadius: 18,
    borderWidth: 4,
    borderColor: 'transparent',
  },
  rowFocused: {
    backgroundColor: 'rgba(67,178,229,0.14)',
    borderColor: colors.blue,
  },
  thumb: {
    width: 320,
    height: 180,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  rowText: {flex: 1},
  rowMeta: {color: colors.textDim, fontSize: 22, marginBottom: 8},
  rowTitle: {
    color: colors.text,
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 8,
  },
  rowDescription: {color: '#D5D9DE', fontSize: 24, lineHeight: 32},
});
