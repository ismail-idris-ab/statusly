import { type PropsWithChildren } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ScreenProps = PropsWithChildren<{
  className?: string;
  /** Apply top safe-area inset padding. Default true. */
  safeTop?: boolean;
}>;

/** Themed screen container: fills the viewport, `bg` token, safe-area top. */
export function Screen({ children, className, safeTop = true }: ScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className={`flex-1 bg-bg ${className ?? ''}`}
      style={{ paddingTop: safeTop ? insets.top : 0 }}
    >
      {children}
    </View>
  );
}
