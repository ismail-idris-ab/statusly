import { Image } from 'expo-image';
import { Check, CheckCircle2, Download, Play } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { palette } from '@/theme/tokens';

type MediaThumbProps = {
  uri: string;
  type: 'image' | 'video';
  size: number;
  /** undefined = not in select mode; boolean = show checkbox (checked state). */
  selected?: boolean;
  /** true once this item has been saved via the quick-save button. */
  saved?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  /** Quick-save (download) without opening the viewer. */
  onSave?: () => void;
};

/**
 * A media thumbnail: image/video badge, a quick-save button (turns into a
 * check once saved), and an optional multi-select checkbox.
 */
function MediaThumbBase({
  uri,
  type,
  size,
  selected,
  saved,
  onPress,
  onLongPress,
  onSave,
}: MediaThumbProps) {
  const selecting = selected !== undefined;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={250}
      accessibilityRole="imagebutton"
      style={{ width: size, height: size }}
      className="overflow-hidden rounded-card bg-surface-alt"
    >
      <Image
        source={{ uri }}
        style={{ width: '100%', height: '100%' }}
        contentFit="cover"
        transition={120}
      />

      {type === 'video' ? (
        <View className="absolute inset-0 items-center justify-center">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-black/45">
            <Play color="#FFFFFF" size={18} fill="#FFFFFF" />
          </View>
        </View>
      ) : null}

      {/* Quick-save button (hidden while multi-selecting). */}
      {!selecting && onSave ? (
        <Pressable
          onPress={onSave}
          disabled={saved}
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Saved' : 'Save'}
          hitSlop={8}
          className="absolute bottom-1.5 right-1.5 h-8 w-8 items-center justify-center rounded-full bg-black/45"
        >
          {saved ? (
            <CheckCircle2 color={palette.accentGlow} size={18} strokeWidth={2.5} />
          ) : (
            <Download color="#FFFFFF" size={16} />
          )}
        </Pressable>
      ) : null}

      {selecting ? (
        <View
          className="absolute right-1.5 top-1.5 h-6 w-6 items-center justify-center rounded-full border-2 border-white"
          style={{
            backgroundColor: selected ? palette.accent : 'rgba(0,0,0,0.35)',
          }}
        >
          {selected ? <Check color="#FFFFFF" size={14} strokeWidth={3} /> : null}
        </View>
      ) : null}

      {selected ? (
        <View
          className="absolute inset-0 rounded-card border-2"
          style={{ borderColor: palette.accent }}
        />
      ) : null}
    </Pressable>
  );
}

export const MediaThumb = memo(MediaThumbBase);
