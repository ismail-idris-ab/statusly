import { useRouter } from 'expo-router';
import { Bell, Download, ShieldCheck, type LucideIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { GradientButton } from '@/components/GradientButton';
import { Screen } from '@/components/Screen';
import { prefs } from '@/lib/preferences';
import { requestStatusFolderAccess } from '@/native/StatusAccessModule';
import { palette, themeColors } from '@/theme/tokens';

type Slide = {
  icon: LucideIcon;
  title: string;
  body: string;
};

const SLIDES: Slide[] = [
  {
    icon: Download,
    title: 'Save & repost any status',
    body: 'Keep any WhatsApp status in HD — then save, share, or repost it to your own status in one tap.',
  },
  {
    icon: Bell,
    title: 'Never miss a new status',
    body: "Get notified when the contacts you care about post something new. We'll ask your permission next.",
  },
  {
    icon: ShieldCheck,
    title: 'Grant access to statuses',
    body: "Statusly needs one-time access to WhatsApp's status folder. Your media never leaves your device.",
  },
];

async function requestNotifications(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  if (typeof Platform.Version === 'number' && Platform.Version >= 33) {
    try {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      prefs.setNotificationsGranted(result === PermissionsAndroid.RESULTS.GRANTED);
    } catch {
      prefs.setNotificationsGranted(false);
    }
  } else {
    // Notifications are granted by default below API 33.
    prefs.setNotificationsGranted(true);
  }
}

export default function OnboardingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { colorScheme } = useColorScheme();
  const scrollRef = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const [denied, setDenied] = useState(false);
  const [busy, setBusy] = useState(false);

  const c = themeColors(colorScheme === 'dark' ? 'dark' : 'light');
  const isLast = page === SLIDES.length - 1;

  const goTo = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
    setPage(index);
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setPage(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const onPrimary = async () => {
    if (busy) {
      return;
    }
    if (page === 0) {
      goTo(1);
      return;
    }
    if (page === 1) {
      setBusy(true);
      await requestNotifications();
      setBusy(false);
      goTo(2);
      return;
    }
    // Final slide → launch the SAF grant.
    setBusy(true);
    setDenied(false);
    try {
      const grant = await requestStatusFolderAccess('whatsapp');
      if (grant.granted) {
        prefs.setOnboardingComplete(true);
        router.replace('/status');
        return;
      }
      setDenied(true);
    } catch {
      setDenied(true);
    } finally {
      setBusy(false);
    }
  };

  const buttonLabel = !isLast
    ? 'Continue'
    : denied
      ? 'Try again'
      : busy
        ? 'Opening…'
        : 'Grant access';

  return (
    <Screen className="px-0">
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        className="flex-1"
      >
        {SLIDES.map((slide) => {
          const Icon = slide.icon;
          return (
            <View
              key={slide.title}
              style={{ width }}
              className="flex-1 items-center justify-center px-8"
            >
              <View className="mb-8 h-32 w-32 items-center justify-center rounded-full bg-surface-alt">
                <Icon color={palette.primary} size={56} strokeWidth={1.75} />
              </View>
              <Text className="mb-3 text-center text-2xl font-bold text-text">
                {slide.title}
              </Text>
              <Text className="text-center text-base leading-6 text-text-muted">
                {slide.body}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <View className="px-6 pb-8 pt-2">
        {isLast && denied ? (
          <Text className="mb-3 text-center text-sm text-danger">
            Access needed — Statusly can&apos;t read statuses without folder
            access. Pick the <Text className="font-semibold">.Statuses</Text>{' '}
            folder and tap “Use this folder”.
          </Text>
        ) : null}

        <View className="mb-5 flex-row justify-center">
          {SLIDES.map((slide, i) => (
            <View
              key={slide.title}
              className="mx-1 h-2 rounded-full"
              style={{
                width: i === page ? 20 : 8,
                backgroundColor: i === page ? c.primary : c.border,
              }}
            />
          ))}
        </View>

        <GradientButton
          label={buttonLabel}
          onPress={onPrimary}
          disabled={busy}
          shape="card"
        />

        <Text className="mt-3 text-center text-xs text-text-muted">
          Your media stays on your device. No account needed.
        </Text>

        <View className="mt-2 flex-row items-center justify-center">
          <Pressable
            onPress={() => router.push('/legal/terms')}
            accessibilityRole="link"
            hitSlop={8}
          >
            <Text className="text-xs font-semibold text-primary">
              Terms of Service
            </Text>
          </Pressable>
          <Text className="mx-2 text-xs text-text-muted">·</Text>
          <Pressable
            onPress={() => router.push('/legal/privacy')}
            accessibilityRole="link"
            hitSlop={8}
          >
            <Text className="text-xs font-semibold text-primary">
              Privacy Policy
            </Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
