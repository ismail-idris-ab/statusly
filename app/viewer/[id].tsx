import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionTrio } from '@/components/ActionTrio';
import { ZoomableImage } from '@/components/ZoomableImage';
import { repostStatus, saveStatus, shareStatus } from '@/lib/mediaActions';
import type { StatusFile } from '@/native/StatusAccessModule';
import { useStatusStore } from '@/store/useStatusStore';

function VideoPage({
  item,
  active,
  width,
  height,
}: {
  item: StatusFile;
  active: boolean;
  width: number;
  height: number;
}) {
  const player = useVideoPlayer(item.uri, (p) => {
    p.loop = true;
  });

  // Only the focused, on-screen video plays; everything else is paused, so
  // swiping away or opening another viewer stops previous playback.
  useEffect(() => {
    if (active) {
      player.play();
    } else {
      player.pause();
    }
  }, [active, player]);

  return (
    <VideoView
      style={{ width, height }}
      player={player}
      contentFit="contain"
      nativeControls
    />
  );
}

function ImagePage({
  item,
  active,
  width,
  height,
  onZoomChange,
}: {
  item: StatusFile;
  active: boolean;
  width: number;
  height: number;
  onZoomChange: (zoomed: boolean) => void;
}) {
  return (
    <ZoomableImage
      uri={item.uri}
      width={width}
      height={height}
      active={active}
      onZoomChange={onZoomChange}
    />
  );
}

export default function ViewerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const items = useStatusStore((s) => s.items);
  const source = useStatusStore((s) => s.source);
  const listRef = useRef<FlatList<StatusFile>>(null);

  const initial = Math.min(
    Math.max(0, Number.parseInt(id ?? '0', 10) || 0),
    Math.max(0, items.length - 1),
  );
  const [current, setCurrent] = useState(initial);
  const [busy, setBusy] = useState(false);
  // Measure the pager container so item width, snap interval, offsets and the
  // visible-index math all use one consistent width (window Dimensions can
  // differ from the laid-out width with edge-to-edge / display cutouts, which
  // desynced the shown page from `current` and saved the wrong item).
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [focused, setFocused] = useState(true);
  // Lock horizontal paging while an image is zoomed in, so panning the zoomed
  // image doesn't flip to the next status.
  const [zoomed, setZoomed] = useState(false);

  // Pause videos when the screen is not focused (e.g. another viewer is pushed
  // on top, or we navigate back to the grid).
  useFocusEffect(
    useCallback(() => {
      setFocused(true);
      return () => setFocused(false);
    }, []),
  );

  useEffect(() => {
    if (items.length === 0) {
      router.back();
    }
  }, [items.length, router]);

  if (items.length === 0) {
    return null;
  }

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (size.width > 0) {
      setCurrent(Math.round(e.nativeEvent.contentOffset.x / size.width));
    }
  };

  const ready = size.width > 0 && size.height > 0;
  const active = items[current];

  const run = (fn: (status: StatusFile) => Promise<unknown>) => async () => {
    if (busy || !active) {
      return;
    }
    setBusy(true);
    try {
      await fn(active);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <View
        className="flex-1"
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setSize((prev) =>
            prev.width === width && prev.height === height
              ? prev
              : { width, height },
          );
        }}
      >
        {ready ? (
          <FlatList
            ref={listRef}
            data={items}
            horizontal
            scrollEnabled={!zoomed}
            keyExtractor={(item) => item.uri}
            showsHorizontalScrollIndicator={false}
            snapToInterval={size.width}
            snapToAlignment="start"
            disableIntervalMomentum
            decelerationRate="fast"
            initialScrollIndex={initial}
            getItemLayout={(_, index) => ({
              length: size.width,
              offset: size.width * index,
              index,
            })}
            onScrollToIndexFailed={(info) => {
              requestAnimationFrame(() => {
                listRef.current?.scrollToOffset({
                  offset: size.width * info.index,
                  animated: false,
                });
              });
            }}
            onMomentumScrollEnd={onMomentumScrollEnd}
            renderItem={({ item, index }) =>
              item.type === 'video' ? (
                <VideoPage
                  item={item}
                  active={index === current && focused}
                  width={size.width}
                  height={size.height}
                />
              ) : (
                <ImagePage
                  item={item}
                  active={index === current && focused}
                  width={size.width}
                  height={size.height}
                  onZoomChange={setZoomed}
                />
              )
            }
          />
        ) : null}

        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={{ top: insets.top + 8 }}
          className="absolute left-3 h-10 w-10 items-center justify-center rounded-full bg-black/40"
        >
          <X color="#FFFFFF" size={22} />
        </Pressable>
      </View>

      <View
        style={{ paddingBottom: insets.bottom + 10, paddingTop: 14 }}
        className="bg-black"
      >
        <ActionTrio
          busy={busy}
          onSave={run((s) => saveStatus(s, source))}
          onShare={run(shareStatus)}
          onRepost={run(repostStatus)}
        />
      </View>
    </View>
  );
}
