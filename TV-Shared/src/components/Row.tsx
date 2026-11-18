import React, { useRef } from "react";
import { FlatList, Text, View } from "react-native";
import { colors, SIDE_MARGIN } from "../config";
import { CARD_WIDTH } from "./Card";
import { px, scaledStyles } from "../scale";

const GAP = 28;

interface Props<T> {
  title: string;
  items: T[];
  keyOf: (item: T) => string;
  renderCard: (
    item: T,
    onFocus: () => void,
    index: number
  ) => React.ReactElement;
  /** Tells the page this row got focus so it can scroll the row into view. */
  onRowFocus?: () => void;
}

/** A titled, horizontally scrolling row of cards that follows the remote's focus. */
export function Row<T>({
  title,
  items,
  keyOf,
  renderCard,
  onRowFocus,
}: Props<T>) {
  const list = useRef<FlatList<T>>(null);
  if (items.length === 0) {
    return null;
  }
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      <FlatList
        ref={list}
        horizontal
        data={items}
        keyExtractor={keyOf}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={Separator}
        getItemLayout={(_, index) => ({
          length: px(CARD_WIDTH + GAP),
          offset: px(CARD_WIDTH + GAP) * index,
          index,
        })}
        renderItem={({ item, index }) =>
          renderCard(
            item,
            () => {
              onRowFocus?.();
              list.current?.scrollToIndex({
                index,
                viewPosition: 0,
                animated: true,
              });
            },
            index
          )
        }
      />
    </View>
  );
}

const Separator = () => <View style={{ width: px(GAP) }} />;

const styles = scaledStyles({
  row: { marginBottom: 48 },
  title: {
    marginLeft: SIDE_MARGIN,
    marginBottom: 22,
    color: colors.text,
    fontSize: 34,
    fontWeight: "700",
  },
  // Vertical padding leaves room for the focused card's scale-up.
  content: { paddingHorizontal: SIDE_MARGIN, paddingVertical: 12 },
});
