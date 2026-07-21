import { useColorScheme } from 'nativewind';
import { useEffect, type PropsWithChildren } from 'react';

import { useSettingsStore } from '@/store/useSettingsStore';

/**
 * Applies the persisted theme preference to NativeWind's color scheme.
 * `'system'` follows the OS setting; `'light'`/`'dark'` force a mode.
 * NativeWind toggles the `.dark` class that drives the CSS-variable tokens.
 */
export function ThemeProvider({ children }: PropsWithChildren) {
  const theme = useSettingsStore((state) => state.theme);
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    setColorScheme(theme);
  }, [theme, setColorScheme]);

  return <>{children}</>;
}
