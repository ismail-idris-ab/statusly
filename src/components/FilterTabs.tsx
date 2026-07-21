import { Pressable, Text, View } from 'react-native';

export type MediaFilter = 'image' | 'video';

const OPTIONS: { value: MediaFilter; label: string }[] = [
  { value: 'image', label: 'Images' },
  { value: 'video', label: 'Videos' },
];

/** Pill segmented Images / Videos filter (Doc 04). */
export function FilterTabs({
  value,
  onChange,
}: {
  value: MediaFilter;
  onChange: (value: MediaFilter) => void;
}) {
  return (
    <View className="flex-row rounded-pill border border-border bg-surface p-1">
      {OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            className={`flex-1 items-center rounded-pill py-2 ${active ? 'bg-primary' : ''}`}
          >
            <Text
              className={`text-sm font-semibold ${active ? 'text-on-primary' : 'text-text-muted'}`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
