import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import {
  ChevronRight,
  FileText,
  Mail,
  Shield,
  Star,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  Switch,
  Text,
  ToastAndroid,
  View,
} from 'react-native';

import { Screen } from '@/components/Screen';
import {
  checkForNewStatuses,
  disableAlerts,
  enableAlerts,
} from '@/features/alerts';
import { useRemoveAds } from '@/features/iap/useRemoveAds';
import { prefs } from '@/lib/preferences';
import { palette, themeColors } from '@/theme/tokens';
import { useSettingsStore, type ThemePref } from '@/store/useSettingsStore';

// TODO(store): replace with the real "Follow us" URL before submission.
const FOLLOW_URL = 'https://www.instagram.com/';
const FEEDBACK_EMAIL = 'aiimern001@gmail.com';

function LinkRow({
  icon: Icon,
  label,
  sublabel,
  onPress,
}: {
  icon: LucideIcon;
  label: string;
  sublabel?: string;
  onPress: () => void;
}) {
  const { colorScheme } = useColorScheme();
  const muted = themeColors(colorScheme === 'dark' ? 'dark' : 'light').textMuted;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className="mb-2 flex-row items-center justify-between rounded-card border border-border bg-surface px-4 py-3"
    >
      <View className="flex-1 flex-row items-center pr-3">
        <Icon color={palette.primary} size={20} />
        <View className="ml-3 flex-1">
          <Text className="text-base font-medium text-text">{label}</Text>
          {sublabel ? (
            <Text className="mt-0.5 text-xs text-text-muted">{sublabel}</Text>
          ) : null}
        </View>
      </View>
      <ChevronRight color={muted} size={18} />
    </Pressable>
  );
}

const THEME_OPTIONS: { value: ThemePref; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

function SectionLabel({ children }: { children: string }) {
  return (
    <Text className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-text-muted">
      {children}
    </Text>
  );
}

function ThemeSegment() {
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  return (
    <View className="flex-row rounded-card border border-border bg-surface p-1">
      {THEME_OPTIONS.map((option) => {
        const active = option.value === theme;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => setTheme(option.value)}
            className={`flex-1 items-center rounded-card py-2 ${active ? 'bg-primary' : ''}`}
          >
            <Text
              className={`text-sm font-semibold ${active ? 'text-on-primary' : 'text-text-muted'}`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function AlertsSection() {
  const [enabled, setEnabled] = useState(prefs.getAlertsEnabled());
  const [busy, setBusy] = useState(false);

  const onToggle = async (value: boolean) => {
    setBusy(true);
    try {
      if (value) {
        const ok = await enableAlerts();
        setEnabled(ok);
        if (!ok) {
          ToastAndroid.show('Notification permission denied', ToastAndroid.SHORT);
        }
      } else {
        await disableAlerts();
        setEnabled(false);
      }
    } finally {
      setBusy(false);
    }
  };

  const onCheckNow = async () => {
    const fresh = await checkForNewStatuses(true);
    ToastAndroid.show(
      fresh > 0 ? `${fresh} new status(es)` : 'No new statuses',
      ToastAndroid.SHORT,
    );
  };

  return (
    <View>
      <View className="flex-row items-center justify-between rounded-card border border-border bg-surface px-4 py-3">
        <View className="flex-1 pr-3">
          <Text className="text-base font-medium text-text">
            New status alerts
          </Text>
          <Text className="mt-0.5 text-xs text-text-muted">
            Get notified when new statuses appear (checked periodically in the
            background).
          </Text>
        </View>
        <Switch
          value={enabled}
          disabled={busy}
          onValueChange={onToggle}
          trackColor={{ true: palette.primary, false: undefined }}
          thumbColor={enabled ? palette.accent : undefined}
        />
      </View>

      {enabled ? (
        <Pressable
          onPress={onCheckNow}
          accessibilityRole="button"
          className="mt-2 items-center rounded-card border border-border py-3"
        >
          <Text className="text-sm font-semibold text-primary">
            Check for new statuses now
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function RemoveAdsSection() {
  const { removedAds, price, buy, restore, connected } = useRemoveAds();

  if (removedAds) {
    return (
      <View className="rounded-card border border-border bg-surface px-4 py-3">
        <Text className="text-base font-medium text-text">Ads removed</Text>
        <Text className="mt-0.5 text-xs text-text-muted">
          Thanks for supporting Statusly.
        </Text>
      </View>
    );
  }

  return (
    <View className="rounded-card border border-border bg-surface px-4 py-3">
      <Text className="text-base font-medium text-text">Remove ads</Text>
      <Text className="mt-0.5 text-xs text-text-muted">
        One-time purchase — no ads, ever.
      </Text>
      <Pressable
        onPress={() => void buy()}
        disabled={!connected}
        accessibilityRole="button"
        className={`mt-3 items-center rounded-card bg-primary py-3 ${connected ? '' : 'opacity-60'}`}
      >
        <Text className="text-sm font-semibold text-on-primary">
          {price ? `Remove ads — ${price}` : 'Remove ads'}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => void restore()}
        accessibilityRole="button"
        className="mt-2 items-center py-2"
      >
        <Text className="text-xs font-semibold text-text-muted">
          Restore purchase
        </Text>
      </Pressable>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <Screen className="px-4">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <Text className="mb-1 mt-2 text-2xl font-bold text-text">Settings</Text>
        <Text className="text-sm text-text-muted">
          Everything stays on your device.
        </Text>

        <SectionLabel>Remove ads</SectionLabel>
        <RemoveAdsSection />

        <SectionLabel>Alerts</SectionLabel>
        <AlertsSection />

        <SectionLabel>Theme</SectionLabel>
        <ThemeSegment />

        <SectionLabel>Support</SectionLabel>
        <LinkRow
          icon={Star}
          label="Rate the app"
          sublabel="A quick review really helps"
          onPress={() =>
            void Linking.openURL('market://details?id=com.statusly.app').catch(
              () => undefined,
            )
          }
        />
        <LinkRow
          icon={Users}
          label="Follow us"
          sublabel="Updates and tips"
          onPress={() => void Linking.openURL(FOLLOW_URL).catch(() => undefined)}
        />
        <LinkRow
          icon={Mail}
          label="Send feedback"
          sublabel={FEEDBACK_EMAIL}
          onPress={() =>
            void Linking.openURL(
              `mailto:${FEEDBACK_EMAIL}?subject=Statusly%20feedback`,
            ).catch(() => undefined)
          }
        />

        <SectionLabel>Legal</SectionLabel>
        <LinkRow
          icon={FileText}
          label="Terms of Service"
          onPress={() => router.push('/legal/terms')}
        />
        <LinkRow
          icon={Shield}
          label="Privacy Policy"
          onPress={() => router.push('/legal/privacy')}
        />

        <SectionLabel>About</SectionLabel>
        <View className="rounded-card border border-border bg-surface px-4 py-3">
          <Text className="text-base font-medium text-text">Statusly</Text>
          <Text className="mt-0.5 text-xs text-text-muted">
            Version {version}
          </Text>
          <Text className="mt-2 text-xs leading-5 text-text-muted">
            Not affiliated with, endorsed by, or connected to WhatsApp LLC or
            Meta Platforms, Inc. “WhatsApp” is a trademark of WhatsApp LLC.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
