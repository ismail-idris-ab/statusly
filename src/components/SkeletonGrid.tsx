import { useEffect, useState } from 'react';
import { Animated, useWindowDimensions, View } from 'react-native';

const COLUMNS = 3;
const GAP = 2;
const PADDING = 16;
const TILES = 15;

/** Pulsing placeholder grid shown while statuses/saved items load (Doc 04). */
export function SkeletonGrid() {
  const [opacity] = useState(() => new Animated.Value(0.4));
  const { width } = useWindowDimensions();
  const size = Math.floor(
    (width - PADDING * 2 - GAP * (COLUMNS - 1)) / COLUMNS,
  );

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <View
      className="flex-row flex-wrap"
      style={{ padding: PADDING, gap: GAP }}
    >
      {Array.from({ length: TILES }).map((_, i) => (
        <Animated.View
          key={i}
          style={{ width: size, height: size, opacity }}
          className="rounded-card bg-surface-alt"
        />
      ))}
    </View>
  );
}
