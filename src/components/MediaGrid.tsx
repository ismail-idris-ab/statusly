import { FlatList, useWindowDimensions } from 'react-native';

import { MediaThumb } from './MediaThumb';

const COLUMNS = 3;
const GAP = 8;
const PADDING = 16;

export type GridItem = {
  key: string;
  uri: string;
  type: 'image' | 'video';
};

type MediaGridProps = {
  items: GridItem[];
  /** null = not selecting; a Set = select mode with these keys checked. */
  selectedKeys: Set<string> | null;
  onPressItem: (index: number) => void;
  onLongPressItem: (index: number) => void;
  /** Quick-save a single item without opening it. */
  onSaveItem?: (index: number) => void;
  /** Keys already saved (renders a check on the save button). */
  savedKeys?: Set<string>;
  refreshing?: boolean;
  onRefresh?: () => void;
};

/** Shared 3-column media grid for Status and Saved, with multi-select + quick-save. */
export function MediaGrid({
  items,
  selectedKeys,
  onPressItem,
  onLongPressItem,
  onSaveItem,
  savedKeys,
  refreshing,
  onRefresh,
}: MediaGridProps) {
  const { width } = useWindowDimensions();
  const size = Math.floor(
    (width - PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS,
  );

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.key}
      numColumns={COLUMNS}
      contentContainerStyle={{ padding: PADDING, rowGap: GAP }}
      columnWrapperStyle={{ gap: GAP }}
      refreshing={refreshing}
      onRefresh={onRefresh}
      removeClippedSubviews
      initialNumToRender={12}
      maxToRenderPerBatch={12}
      windowSize={7}
      renderItem={({ item, index }) => (
        <MediaThumb
          uri={item.uri}
          type={item.type}
          size={size}
          selected={selectedKeys ? selectedKeys.has(item.key) : undefined}
          saved={savedKeys?.has(item.key)}
          onPress={() => onPressItem(index)}
          onLongPress={() => onLongPressItem(index)}
          onSave={onSaveItem ? () => onSaveItem(index) : undefined}
        />
      )}
    />
  );
}
