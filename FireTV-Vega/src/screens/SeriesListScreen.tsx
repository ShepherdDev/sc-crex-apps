import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, FlatList, Text, View} from 'react-native';
import {getSeriesList} from '../api/client';
import type {SeriesListResponse} from '../api/types';
import {Card} from '../components/Card';
import {colors, MENU_WIDTH, SIDE_MARGIN} from '../config';
import type {Navigate} from '../navigation';
import {ErrorView} from './ErrorView';
import {scaledStyles} from '../scale';

const COLUMNS = 4;
const GAP = 28;
/** Cards sized so four columns fit beside the menu. */
const GRID_CARD_WIDTH =
  (1920 - MENU_WIDTH - SIDE_MARGIN * 2 - GAP * (COLUMNS - 1)) / COLUMNS;

/** "See all": every series as a grid of posters. */
export const SeriesListScreen = ({
  url,
  navigate,
}: {
  url: string;
  navigate: Navigate;
}) => {
  const [data, setData] = useState<SeriesListResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await getSeriesList(url));
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong.');
    }
  }, [url]);

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

  return (
    <View style={styles.page}>
      <Text style={styles.title}>{data.title}</Text>
      <FlatList
        data={data.series}
        numColumns={COLUMNS}
        keyExtractor={(s) => s.id}
        initialNumToRender={12}
        maxToRenderPerBatch={8}
        windowSize={5}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.grid}
        renderItem={({item, index}) => (
          <Card
            image={item.image}
            caption={`${item.title} · ${item.messageCount}`}
            accessibilityLabel={`${item.title} series`}
            accessibilityHint="Opens this series"
            hasTVPreferredFocus={index === 0}
            width={GRID_CARD_WIDTH}
            onPress={() => navigate({name: 'series', id: item.id})}
          />
        )}
      />
    </View>
  );
};

const styles = scaledStyles({
  page: {flex: 1, backgroundColor: colors.background, paddingTop: 64},
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  title: {
    color: colors.text,
    fontSize: 56,
    fontWeight: '700',
    marginLeft: SIDE_MARGIN,
    marginBottom: 24,
  },
  grid: {paddingHorizontal: SIDE_MARGIN, paddingBottom: 120, paddingTop: 12},
  gridRow: {gap: GAP, marginBottom: 40},
});
