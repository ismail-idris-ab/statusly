import '../global.css';

import * as Sentry from '@sentry/react-native';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorFallback } from '@/components/ErrorFallback';
import { getDatabase } from '@/db';
import { initAds } from '@/features/ads';
import { configureNotifications, syncAlertsRegistration } from '@/features/alerts';
import { initSentry } from '@/lib/sentry';
import { ThemeProvider } from '@/theme/ThemeProvider';

initSentry();
// Keep the native splash up until the gate (app/index.tsx) decides the route.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // Open → migrate → seed the local database once, at startup, before any
    // feature reads it. Failures are reported but must not block the UI shell.
    getDatabase().catch((error: unknown) => {
      Sentry.captureException(error);
    });
    // Notification channel + re-arm the alerts background task if enabled.
    void configureNotifications();
    syncAlertsRegistration().catch((error: unknown) => {
      Sentry.captureException(error);
    });
    // AdMob SDK init (test units in dev; no-op work once ads are removed).
    initAds().catch((error: unknown) => {
      Sentry.captureException(error);
    });
  }, []);

  useEffect(() => {
    // Tapping a status-alert notification deep-links to the Status tab.
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const route = response.notification.request.content.data?.route;
        if (route === '/status') {
          router.replace('/status');
        }
      },
    );
    return () => sub.remove();
  }, [router]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <StatusBar style="auto" />
          <Sentry.ErrorBoundary
            fallback={({ resetError }) => (
              <ErrorFallback resetError={resetError} />
            )}
          >
            <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen
              name="viewer/[id]"
              options={{ presentation: 'fullScreenModal', animation: 'fade' }}
            />
            <Stack.Screen
              name="direct-chat"
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="settings"
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="legal/terms"
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="legal/privacy"
              options={{ presentation: 'modal' }}
            />
            </Stack>
          </Sentry.ErrorBoundary>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
