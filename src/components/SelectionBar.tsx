import { X, type LucideIcon } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { palette } from '@/theme/tokens';

export type SelectionAction = {
  key: string;
  label: string;
  icon: LucideIcon;
  onPress: () => void;
};

type SelectionBarProps = {
  count: number;
  onClose: () => void;
  actions: SelectionAction[];
};

/** Emerald header shown in multi-select mode: "Selected Items (n)" + actions. */
export function SelectionBar({ count, onClose, actions }: SelectionBarProps) {
  return (
    <View className="flex-row items-center justify-between bg-primary px-2 py-3">
      <View className="flex-row items-center">
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Exit selection"
          className="mr-2 h-10 w-10 items-center justify-center rounded-full"
        >
          <X color={palette.onPrimary} size={22} />
        </Pressable>
        <Text className="text-base font-semibold text-on-primary">
          Selected Items ({count})
        </Text>
      </View>
      <View className="flex-row">
        {actions.map(({ key, label, icon: Icon, onPress }) => (
          <Pressable
            key={key}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={label}
            className="ml-1 h-10 w-10 items-center justify-center rounded-full"
          >
            <Icon color={palette.onPrimary} size={22} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
