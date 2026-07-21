import { TriangleAlert } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { palette } from '@/theme/tokens';

/** Fallback shown by the root Sentry.ErrorBoundary when a render crash occurs. */
export function ErrorFallback({ resetError }: { resetError: () => void }) {
  return (
    <View className="flex-1 items-center justify-center bg-bg px-8">
      <View className="mb-5 h-20 w-20 items-center justify-center rounded-full bg-surface-alt">
        <TriangleAlert color={palette.danger} size={36} strokeWidth={1.75} />
      </View>
      <Text className="mb-2 text-center text-lg font-semibold text-text">
        Something went wrong
      </Text>
      <Text className="mb-6 text-center text-sm text-text-muted">
        The app hit an unexpected error. Your saved media is safe. Try again.
      </Text>
      <Pressable
        onPress={resetError}
        accessibilityRole="button"
        className="rounded-card bg-primary px-6 py-3"
      >
        <Text className="text-sm font-semibold text-on-primary">Try again</Text>
      </Pressable>
    </View>
  );
}
