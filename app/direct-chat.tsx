import { useRouter } from 'expo-router';
import { Check, ChevronDown, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  FlatList,
  Linking,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientButton } from '@/components/GradientButton';
import { palette } from '@/theme/tokens';

type Country = { code: string; flag: string; name: string };

const COUNTRIES: Country[] = [
  { code: '234', flag: '🇳🇬', name: 'Nigeria' },
  { code: '1', flag: '🇺🇸', name: 'United States' },
  { code: '44', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '91', flag: '🇮🇳', name: 'India' },
  { code: '233', flag: '🇬🇭', name: 'Ghana' },
  { code: '254', flag: '🇰🇪', name: 'Kenya' },
  { code: '27', flag: '🇿🇦', name: 'South Africa' },
  { code: '971', flag: '🇦🇪', name: 'United Arab Emirates' },
  { code: '92', flag: '🇵🇰', name: 'Pakistan' },
  { code: '55', flag: '🇧🇷', name: 'Brazil' },
  { code: '62', flag: '🇮🇩', name: 'Indonesia' },
  { code: '20', flag: '🇪🇬', name: 'Egypt' },
];

export default function DirectChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [country, setCountry] = useState<Country>(COUNTRIES[0]!);
  const [number, setNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const openChat = async () => {
    const digits = number.replace(/\D/g, '').replace(/^0+/, '');
    if (digits.length < 6) {
      setError('Enter a valid phone number');
      return;
    }
    setError(null);
    const phone = `${country.code}${digits}`;
    try {
      await Linking.openURL(`https://wa.me/${phone}`);
    } catch {
      setError('Could not open WhatsApp. Is it installed?');
    }
  };

  return (
    <View
      className="flex-1 bg-bg px-4"
      style={{ paddingTop: insets.top + 8 }}
    >
      <View className="mb-6 flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-text">Direct chat</Text>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Close"
          className="h-10 w-10 items-center justify-center rounded-full bg-surface"
        >
          <X color={palette.primary} size={22} />
        </Pressable>
      </View>

      <Text className="mb-6 text-sm text-text-muted">
        Message any number on WhatsApp without saving it to your contacts.
      </Text>

      <Text className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
        Phone number
      </Text>
      <View className="flex-row">
        <Pressable
          onPress={() => setPickerOpen(true)}
          accessibilityRole="button"
          className="mr-2 flex-row items-center rounded-card border border-border bg-surface px-3"
        >
          <Text className="text-base text-text">
            {country.flag} +{country.code}
          </Text>
          <ChevronDown color="#5B6B64" size={16} />
        </Pressable>
        <TextInput
          value={number}
          onChangeText={(t) => {
            setNumber(t);
            setError(null);
          }}
          keyboardType="phone-pad"
          placeholder="Phone number"
          placeholderTextColor="#9DB0A8"
          className="flex-1 rounded-card border border-border bg-surface px-4 py-3 text-base text-text"
        />
      </View>

      {error ? (
        <Text className="mt-2 text-sm text-danger">{error}</Text>
      ) : null}

      <View className="mt-6">
        <GradientButton label="Open chat" onPress={openChat} shape="card" />
      </View>

      <Modal
        visible={pickerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerOpen(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setPickerOpen(false)}
        >
          <Pressable
            className="max-h-[70%] rounded-t-3xl bg-bg px-4 pb-6 pt-4"
            onPress={() => undefined}
          >
            <Text className="mb-3 text-lg font-bold text-text">
              Select country
            </Text>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(c) => c.code + c.name}
              renderItem={({ item }) => {
                const active = item.code === country.code;
                return (
                  <Pressable
                    onPress={() => {
                      setCountry(item);
                      setPickerOpen(false);
                    }}
                    className="flex-row items-center justify-between py-3"
                  >
                    <Text className="text-base text-text">
                      {item.flag} {item.name} (+{item.code})
                    </Text>
                    {active ? (
                      <Check color={palette.primary} size={18} />
                    ) : null}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
