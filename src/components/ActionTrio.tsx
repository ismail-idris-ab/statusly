import { Download, Repeat, Share2, type LucideIcon } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

type ActionTrioProps = {
  onSave: () => void;
  onShare: () => void;
  onRepost: () => void;
  busy?: boolean;
};

type Action = { key: string; label: string; icon: LucideIcon; onPress: () => void };

/** Save · Share · Repost — three circular emerald buttons (Doc 04). */
export function ActionTrio({ onSave, onShare, onRepost, busy }: ActionTrioProps) {
  const actions: Action[] = [
    { key: 'save', label: 'Save', icon: Download, onPress: onSave },
    { key: 'share', label: 'Share', icon: Share2, onPress: onShare },
    { key: 'repost', label: 'Repost', icon: Repeat, onPress: onRepost },
  ];

  return (
    <View className="flex-row justify-center gap-10">
      {actions.map(({ key, label, icon: Icon, onPress }) => (
        <Pressable
          key={key}
          accessibilityRole="button"
          accessibilityLabel={label}
          disabled={busy}
          onPress={onPress}
          className={`items-center ${busy ? 'opacity-50' : ''}`}
        >
          <View className="h-14 w-14 items-center justify-center rounded-full bg-accent">
            <Icon color="#FFFFFF" size={24} />
          </View>
          <Text className="mt-1.5 text-xs font-medium text-white">{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
