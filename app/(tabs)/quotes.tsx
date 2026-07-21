import { Heart, Share2 } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import type Svg from 'react-native-svg';

import { QuoteCard } from '@/components/QuoteCard';
import { Screen } from '@/components/Screen';
import { SkeletonGrid } from '@/components/SkeletonGrid';
import type { Quote } from '@/db/types';
import { shareQuoteImage } from '@/features/quotes/shareQuote';
import { FAVORITES, useQuotes } from '@/features/quotes/useQuotes';
import { palette } from '@/theme/tokens';

const PADDING = 16;
const GAP = 12;

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      className={`mr-2 rounded-pill border px-4 py-2 ${active ? 'border-primary bg-primary' : 'border-border bg-surface'}`}
    >
      <Text
        className={`text-sm font-semibold capitalize ${active ? 'text-on-primary' : 'text-text-muted'}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function QuotesScreen() {
  const { width } = useWindowDimensions();
  const [filter, setFilter] = useState<string>('motivation');
  const { categories, quotes, loading, toggleFavorite } = useQuotes(filter);

  const cellSize = Math.floor((width - PADDING * 2 - GAP) / 2);

  // Off-screen full-size card used to export a shareable PNG.
  const [captureQuote, setCaptureQuote] = useState<Quote | null>(null);
  const captureRef = useRef<Svg>(null);

  useEffect(() => {
    if (!captureQuote) {
      return;
    }
    const timer = setTimeout(() => {
      const node = captureRef.current;
      if (!node) {
        setCaptureQuote(null);
        return;
      }
      node.toDataURL((base64: string) => {
        void shareQuoteImage(base64).finally(() => setCaptureQuote(null));
      });
    }, 80);
    return () => clearTimeout(timer);
  }, [captureQuote]);

  const chips = [FAVORITES, ...categories];

  return (
    <Screen>
      <View className="px-4 pb-2 pt-2">
        <Text className="mb-3 text-2xl font-bold text-text">Quotes</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {chips.map((c) => (
            <Chip
              key={c}
              label={c === FAVORITES ? 'Favorites' : c}
              active={filter === c}
              onPress={() => setFilter(c)}
            />
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <SkeletonGrid />
      ) : quotes.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-sm text-text-muted">
            {filter === FAVORITES
              ? 'No favorites yet — tap the heart on a quote.'
              : 'No quotes here.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={quotes}
          keyExtractor={(q) => q.id}
          numColumns={2}
          contentContainerStyle={{ padding: PADDING, rowGap: GAP }}
          columnWrapperStyle={{ gap: GAP }}
          renderItem={({ item }) => (
            <View>
              <Pressable
                onPress={() => setCaptureQuote(item)}
                accessibilityRole="button"
                accessibilityLabel="Share quote"
              >
                <QuoteCard quote={item} size={cellSize} />
              </Pressable>
              <Pressable
                onPress={() => toggleFavorite(item)}
                accessibilityRole="button"
                accessibilityLabel="Toggle favorite"
                className="absolute right-2 top-2 h-9 w-9 items-center justify-center rounded-full bg-black/30"
              >
                <Heart
                  color="#FFFFFF"
                  fill={item.isFavorite ? palette.danger : 'transparent'}
                  size={18}
                />
              </Pressable>
              <View className="absolute bottom-2 right-2 h-9 w-9 items-center justify-center rounded-full bg-black/30">
                <Share2 color="#FFFFFF" size={16} />
              </View>
            </View>
          )}
        />
      )}

      {captureQuote ? (
        <View
          style={{ position: 'absolute', left: -3000, top: 0 }}
          pointerEvents="none"
        >
          <QuoteCard ref={captureRef} quote={captureQuote} size={1080} />
        </View>
      ) : null}
    </Screen>
  );
}
