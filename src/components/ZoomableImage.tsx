/* eslint-disable react-hooks/immutability -- Reanimated shared values are mutable
   by design (`.value` is the documented API). This rule targets React state/prop
   immutability and misfires on shared-value writes inside worklets/effects. */
import { Image } from 'expo-image';
import { useEffect } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const AnimatedImage = Animated.createAnimatedComponent(Image);

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;

type ZoomableImageProps = {
  uri: string;
  width: number;
  height: number;
  /** True when this page is the focused one; when it loses focus, zoom resets. */
  active: boolean;
  /** Reports whether this image is zoomed in, so the pager can lock horizontal
   * swiping (a zoomed image pans instead of flipping to the next status). */
  onZoomChange: (zoomed: boolean) => void;
};

/**
 * Pinch-to-zoom + double-tap + pan image, built on gesture-handler + reanimated
 * (both already app deps — no new native module). Used only for image pages in
 * the viewer; videos keep their native controls.
 */
export function ZoomableImage({
  uri,
  width,
  height,
  active,
  onZoomChange,
}: ZoomableImageProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const reset = () => {
    scale.value = withTiming(1);
    savedScale.value = 1;
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  };

  // Reset zoom when this page is swiped away, so returning to it starts at fit.
  useEffect(() => {
    if (!active) {
      reset();
      onZoomChange(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(
        Math.max(savedScale.value * e.scale, MIN_SCALE),
        MAX_SCALE,
      );
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= MIN_SCALE) {
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
      runOnJS(onZoomChange)(scale.value > MIN_SCALE);
    });

  // Panning only does something when zoomed; the pager keeps swiping otherwise.
  const pan = Gesture.Pan()
    .enabled(true)
    .onUpdate((e) => {
      if (savedScale.value > MIN_SCALE) {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      }
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const zoomingIn = scale.value <= MIN_SCALE;
      if (zoomingIn) {
        scale.value = withTiming(DOUBLE_TAP_SCALE);
        savedScale.value = DOUBLE_TAP_SCALE;
      } else {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
      runOnJS(onZoomChange)(zoomingIn);
    });

  const composed = Gesture.Exclusive(
    doubleTap,
    Gesture.Simultaneous(pinch, pan),
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <AnimatedImage
        source={{ uri }}
        style={[{ width, height }, animatedStyle]}
        contentFit="contain"
      />
    </GestureDetector>
  );
}
