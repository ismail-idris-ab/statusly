import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import type {
  MaterialTopTabNavigationEventMap,
  MaterialTopTabNavigationOptions,
} from '@react-navigation/material-top-tabs';
import type {
  ParamListBase,
  TabNavigationState,
} from '@react-navigation/native';
import { withLayoutContext } from 'expo-router';
import { Bookmark, Building2, House, Sparkles } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { themeColors } from '@/theme/tokens';

const { Navigator } = createMaterialTopTabNavigator();

// Swipeable tabs via material-top-tabs, but with the bar pinned to the bottom
// so it still looks like a bottom tab bar (Doc 04) while allowing horizontal
// swipe between Status · B Status · Saved · Quotes.
const SwipeTabs = withLayoutContext<
  MaterialTopTabNavigationOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  MaterialTopTabNavigationEventMap
>(Navigator);

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const c = themeColors(colorScheme === 'dark' ? 'dark' : 'light');
  const insets = useSafeAreaInsets();

  return (
    <SwipeTabs
      tabBarPosition="bottom"
      screenOptions={{
        swipeEnabled: true,
        tabBarShowIcon: true,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.textMuted,
        tabBarLabelStyle: { fontSize: 11, textTransform: 'none', marginTop: 2 },
        tabBarIndicatorStyle: { height: 0 },
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.border,
          borderTopWidth: 1,
          paddingBottom: insets.bottom,
        },
      }}
    >
      <SwipeTabs.Screen
        name="status"
        options={{
          title: 'Status',
          tabBarIcon: ({ color }) => <House color={color} size={24} />,
        }}
      />
      <SwipeTabs.Screen
        name="b-status"
        options={{
          title: 'B Status',
          tabBarIcon: ({ color }) => <Building2 color={color} size={24} />,
        }}
      />
      <SwipeTabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color }) => <Bookmark color={color} size={24} />,
        }}
      />
      <SwipeTabs.Screen
        name="quotes"
        options={{
          title: 'Quotes',
          tabBarIcon: ({ color }) => <Sparkles color={color} size={24} />,
        }}
      />
    </SwipeTabs>
  );
}
