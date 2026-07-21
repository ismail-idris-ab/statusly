import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { palette } from '@/theme/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type GradientButtonProps = {
  label: string;
  onPress: () => void;
  icon?: LucideIcon;
  disabled?: boolean;
  /** pill (default) or 12px card radius. */
  shape?: 'pill' | 'card';
};

/**
 * Statusly's signature action button (Doc 04): an oversized emerald→mint
 * gradient with a soft glow and a spring press. The gradient is drawn with
 * react-native-svg (no extra native dep) and clipped by the rounded container.
 */
export function GradientButton({
  label,
  onPress,
  icon: Icon,
  disabled,
  shape = 'pill',
}: GradientButtonProps) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const press = (to: number) => {
    scale.set(reducedMotion ? to : withSpring(to, { damping: 18, stiffness: 260 }));
  };

  const radius = shape === 'pill' ? 999 : 12;

  return (
    <Animated.View
      style={[
        animatedStyle,
        {
          borderRadius: radius,
          // Soft glow (Android elevation + tinted shadow on iOS).
          shadowColor: palette.accent,
          shadowOpacity: 0.45,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        },
        disabled ? { opacity: 0.6 } : null,
      ]}
    >
      <AnimatedPressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        onPressIn={() => press(0.97)}
        onPressOut={() => press(1)}
        style={{ borderRadius: radius, overflow: 'hidden' }}
      >
        <Svg style={StyleSheet.absoluteFill}>
          <Defs>
            <LinearGradient id="statuslyGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={palette.primary} />
              <Stop offset="1" stopColor={palette.accentGlow} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#statuslyGrad)" />
        </Svg>
        <View className="min-h-[54px] flex-row items-center justify-center px-6">
          {Icon ? <Icon color={palette.onPrimary} size={20} /> : null}
          <Text
            className={`text-base font-semibold text-on-primary ${Icon ? 'ml-2' : ''}`}
          >
            {label}
          </Text>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}
