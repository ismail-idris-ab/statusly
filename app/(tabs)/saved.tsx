import { useRouter } from 'expo-router';
import { BookmarkX, Share2, Trash2 } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { BackHandler, Pressable, Text, View } from 'react-native';

import { FilterTabs, type MediaFilter } from '@/components/FilterTabs';
import { MediaGrid } from '@/components/MediaGrid';
import { Screen } from '@/components/Screen';
import { SelectionBar } from '@/components/SelectionBar';
import { SkeletonGrid } from '@/components/SkeletonGrid';
import type { SavedItem } from '@/db/types';
import { BannerAdSlot, maybeShowInterstitial } from '@/features/ads';
import { useSavedItems } from '@/features/saved/useSavedItems';
import { useMultiSelect } from '@/hooks/useMultiSelect';
import { shareMany } from '@/lib/mediaActions';
import type { StatusFile } from '@/native/StatusAccessModule';
import { useStatusStore } from '@/store/useStatusStore';
import { palette } from '@/theme/tokens';

function toStatusFile(item: SavedItem): StatusFile {
  return {
    uri: item.localUri,
    name: item.originName ?? 'status',
    mime: item.type === 'video' ? 'video/mp4' : 'image/jpeg',
    sizeBytes: item.sizeBytes,
    lastModified: item.originModifiedAt ?? item.savedAt,
    type: item.type,
  };
}

export default function SavedScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<MediaFilter>('image');
  const { phase, items, reload, remove } = useSavedItems(filter);
  const setStoreItems = useStatusStore((s) => s.setItems);
  const select = useMultiSelect();

  useEffect(() => {
    if (!select.active) {
      return;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      select.clear();
      return true;
    });
    return () => sub.remove();
  }, [select]);

  const openViewer = (index: number) => {
    setStoreItems(items.map(toStatusFile));
    maybeShowInterstitial();
    router.push(`/viewer/${index}`);
  };

  const onPressItem = (index: number) => {
    const item = items[index];
    if (!item) {
      return;
    }
    if (select.active) {
      select.toggle(item.id);
    } else {
      openViewer(index);
    }
  };

  const onLongPressItem = (index: number) => {
    const item = items[index];
    if (item && !select.active) {
      select.enter(item.id);
    }
  };

  const onBatchShare = async () => {
    const chosen = items
      .filter((i) => select.selected.has(i.id))
      .map(toStatusFile);
    select.clear();
    await shareMany(chosen);
  };

  const onBatchDelete = async () => {
    const ids = items.filter((i) => select.selected.has(i.id)).map((i) => i.id);
    select.clear();
    await remove(ids);
  };

  const gridItems = useMemo(
    () => items.map((i) => ({ key: i.id, uri: i.localUri, type: i.type })),
    [items],
  );

  return (
    <Screen>
      {select.active ? (
        <SelectionBar
          count={select.count}
          onClose={select.clear}
          actions={[
            {
              key: 'share',
              label: 'Share',
              icon: Share2,
              onPress: onBatchShare,
            },
            {
              key: 'delete',
              label: 'Delete',
              icon: Trash2,
              onPress: onBatchDelete,
            },
          ]}
        />
      ) : (
        <View className="px-4 pb-3 pt-2">
          <Text className="mb-3 text-2xl font-bold text-text">Saved</Text>
          <FilterTabs value={filter} onChange={setFilter} />
        </View>
      )}

      {phase === 'loading' ? (
        <SkeletonGrid />
      ) : phase === 'error' ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-4 text-center text-sm text-text-muted">
            Couldn&apos;t load saved items.
          </Text>
          <Pressable
            onPress={reload}
            className="rounded-card bg-primary px-6 py-3"
            accessibilityRole="button"
          >
            <Text className="text-sm font-semibold text-on-primary">Retry</Text>
          </Pressable>
        </View>
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="mb-5 h-20 w-20 items-center justify-center rounded-full bg-surface-alt">
            <BookmarkX color={palette.primary} size={36} strokeWidth={1.75} />
          </View>
          <Text className="mb-2 text-center text-lg font-semibold text-text">
            Nothing saved yet
          </Text>
          <Text className="text-center text-sm text-text-muted">
            Statuses you save will show up here. Long-press to select and manage
            them.
          </Text>
        </View>
      ) : (
        <MediaGrid
          items={gridItems}
          selectedKeys={select.active ? select.selected : null}
          onPressItem={onPressItem}
          onLongPressItem={onLongPressItem}
        />
      )}
      <BannerAdSlot />
    </Screen>
  );
}
