import { useRouter } from 'expo-router';
import {
  Download,
  FolderX,
  ImageOff,
  MessageCircle,
  Settings as SettingsIcon,
  Share2,
  type LucideIcon,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { BackHandler, Pressable, Share, Text, View } from 'react-native';

import { FilterTabs } from '@/components/FilterTabs';
import { MediaGrid } from '@/components/MediaGrid';
import { Screen } from '@/components/Screen';
import { SelectionBar } from '@/components/SelectionBar';
import { SkeletonGrid } from '@/components/SkeletonGrid';
import { BannerAdSlot, maybeShowInterstitial } from '@/features/ads';
import { useStatuses, type StatusFilter } from '@/features/status/useStatuses';
import { useMultiSelect } from '@/hooks/useMultiSelect';
import { saveMany, saveStatus, shareMany } from '@/lib/mediaActions';
import {
  requestStatusFolderAccess,
  type StatusSource,
} from '@/native/StatusAccessModule';
import { useStatusStore } from '@/store/useStatusStore';
import { palette } from '@/theme/tokens';

function CenterMessage({
  icon: Icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <View className="mb-5 h-20 w-20 items-center justify-center rounded-full bg-surface-alt">
        <Icon color={palette.primary} size={36} strokeWidth={1.75} />
      </View>
      <Text className="mb-2 text-center text-lg font-semibold text-text">
        {title}
      </Text>
      <Text className="mb-5 text-center text-sm text-text-muted">{body}</Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          className="rounded-card bg-primary px-6 py-3"
          accessibilityRole="button"
        >
          <Text className="text-sm font-semibold text-on-primary">
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * Shared status feed for the WhatsApp and Business WhatsApp tabs — same UI,
 * different SAF source. The Business grant is requested on demand from the
 * empty/error state's "Grant access" action.
 */
export function StatusFeed({
  source,
  title,
}: {
  source: StatusSource;
  title: string;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<StatusFilter>('image');
  const { phase, items, refreshing, refresh, reload } = useStatuses(
    source,
    filter,
  );
  const setStoreItems = useStatusStore((s) => s.setItems);
  const select = useMultiSelect();
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());

  // Hardware back exits multi-select before leaving the screen (Doc 03).
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
    setStoreItems(items, source);
    maybeShowInterstitial();
    router.push(`/viewer/${index}`);
  };

  const onPressItem = (index: number) => {
    const item = items[index];
    if (!item) {
      return;
    }
    if (select.active) {
      select.toggle(item.uri);
    } else {
      openViewer(index);
    }
  };

  const onLongPressItem = (index: number) => {
    const item = items[index];
    if (item && !select.active) {
      select.enter(item.uri);
    }
  };

  const onSaveItem = async (index: number) => {
    const item = items[index];
    if (!item) {
      return;
    }
    if (await saveStatus(item, source)) {
      setSavedKeys((prev) => new Set(prev).add(item.uri));
    }
  };

  const onBatchSave = async () => {
    const chosen = items.filter((i) => select.selected.has(i.uri));
    select.clear();
    await saveMany(chosen, source);
  };

  const onBatchShare = async () => {
    const chosen = items.filter((i) => select.selected.has(i.uri));
    select.clear();
    await shareMany(chosen);
  };

  const grant = async () => {
    try {
      await requestStatusFolderAccess(source);
    } finally {
      reload();
    }
  };

  const shareApp = () => {
    void Share.share({
      message:
        'Statusly — save & repost WhatsApp statuses in HD. ' +
        'https://play.google.com/store/apps/details?id=com.statusly.app',
    });
  };

  const gridItems = useMemo(
    () => items.map((i) => ({ key: i.uri, uri: i.uri, type: i.type })),
    [items],
  );

  return (
    <Screen>
      {select.active ? (
        <SelectionBar
          count={select.count}
          onClose={select.clear}
          actions={[
            { key: 'save', label: 'Save', icon: Download, onPress: onBatchSave },
            {
              key: 'share',
              label: 'Share',
              icon: Share2,
              onPress: onBatchShare,
            },
          ]}
        />
      ) : (
        <View className="px-4 pb-3 pt-2">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-text">{title}</Text>
            <View className="flex-row">
              <Pressable
                onPress={shareApp}
                accessibilityRole="button"
                accessibilityLabel="Share app"
                className="h-10 w-10 items-center justify-center rounded-full bg-surface"
              >
                <Share2 color={palette.primary} size={22} />
              </Pressable>
              <Pressable
                onPress={() => router.push('/direct-chat')}
                accessibilityRole="button"
                accessibilityLabel="Direct chat"
                className="ml-2 h-10 w-10 items-center justify-center rounded-full bg-surface"
              >
                <MessageCircle color={palette.primary} size={22} />
              </Pressable>
              <Pressable
                onPress={() => router.push('/settings')}
                accessibilityRole="button"
                accessibilityLabel="Settings"
                className="ml-2 h-10 w-10 items-center justify-center rounded-full bg-surface"
              >
                <SettingsIcon color={palette.primary} size={22} />
              </Pressable>
            </View>
          </View>
          <FilterTabs value={filter} onChange={setFilter} />
        </View>
      )}

      {phase === 'loading' ? (
        <SkeletonGrid />
      ) : phase === 'error' ? (
        <CenterMessage
          icon={FolderX}
          title="Can't read statuses"
          body={
            source === 'business'
              ? 'Grant access to the WhatsApp Business status folder to view statuses here.'
              : "Access to WhatsApp's status folder may have been revoked. Re-grant it to continue."
          }
          actionLabel="Grant access"
          onAction={grant}
        />
      ) : items.length === 0 ? (
        <CenterMessage
          icon={ImageOff}
          title="No statuses yet"
          body="Open WhatsApp and view some statuses, then pull to refresh here."
          actionLabel="Refresh"
          onAction={refresh}
        />
      ) : (
        <MediaGrid
          items={gridItems}
          selectedKeys={select.active ? select.selected : null}
          onPressItem={onPressItem}
          onLongPressItem={onLongPressItem}
          onSaveItem={(i) => void onSaveItem(i)}
          savedKeys={savedKeys}
          refreshing={refreshing}
          onRefresh={refresh}
        />
      )}
      <BannerAdSlot />
    </Screen>
  );
}
