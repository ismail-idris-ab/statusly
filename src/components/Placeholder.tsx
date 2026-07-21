import { Text, View } from 'react-native';

import { Screen } from './Screen';

type PlaceholderProps = {
  title: string;
  subtitle: string;
};

/**
 * Temporary tab-screen stub (Phase 1). Real screens replace these per the
 * phase plan — Status (Phase 5), Saved (Phase 6), Quotes (Phase 8), etc.
 */
export function Placeholder({ title, subtitle }: PlaceholderProps) {
  return (
    <Screen>
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-3xl font-bold text-text">{title}</Text>
        <Text className="mt-3 text-center text-base text-text-muted">
          {subtitle}
        </Text>
      </View>
    </Screen>
  );
}
