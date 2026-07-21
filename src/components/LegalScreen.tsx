import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { palette } from '@/theme/tokens';

function stripInline(line: string): string {
  return line.replace(/\*\*/g, '').replace(/`/g, '');
}

/** Renders bundled Markdown as readable text, skipping dev-only blockquote notes. */
function MarkdownBlocks({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((raw, index) => {
        const line = raw.trim();
        // Skip dev-facing blockquote warnings and horizontal rules.
        if (line.startsWith('>') || line === '---') {
          return null;
        }
        const key = `${index}-${line.slice(0, 12)}`;
        if (line === '') {
          return <View key={key} className="h-3" />;
        }
        if (line.startsWith('### ')) {
          return (
            <Text key={key} className="mb-1 mt-3 text-base font-semibold text-text">
              {stripInline(line.slice(4))}
            </Text>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <Text key={key} className="mb-1 mt-4 text-lg font-bold text-text">
              {stripInline(line.slice(3))}
            </Text>
          );
        }
        if (line.startsWith('# ')) {
          return (
            <Text key={key} className="mb-2 text-2xl font-bold text-text">
              {stripInline(line.slice(2))}
            </Text>
          );
        }
        return (
          <Text key={key} className="mb-1 text-sm leading-6 text-text-muted">
            {stripInline(line)}
          </Text>
        );
      })}
    </>
  );
}

export function LegalScreen({ title, source }: { title: string; source: number }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const asset = Asset.fromModule(source);
        await asset.downloadAsync();
        if (!asset.localUri) {
          throw new Error('no localUri');
        }
        const raw = await FileSystem.readAsStringAsync(asset.localUri);
        if (active) {
          setText(raw);
        }
      } catch {
        if (active) {
          setFailed(true);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [source]);

  return (
    <View className="flex-1 bg-bg" style={{ paddingTop: insets.top + 8 }}>
      <View className="flex-row items-center justify-between px-4 pb-3">
        <Text className="text-xl font-bold text-text">{title}</Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Close"
          className="h-10 w-10 items-center justify-center rounded-full bg-surface"
        >
          <X color={palette.primary} size={22} />
        </Pressable>
      </View>

      {failed ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-sm text-text-muted">
            Couldn&apos;t load this document.
          </Text>
        </View>
      ) : text === null ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        >
          <MarkdownBlocks text={text} />
        </ScrollView>
      )}
    </View>
  );
}
