import { Tabs } from 'expo-router'
import { Text } from 'react-native'
import { colors, fonts, fontSize } from '../../../src/lib/theme'

function TabIcon({ symbol, focused }: { symbol: string; focused: boolean }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{symbol}</Text>
}

// تاب مختلف تمامًا عن وضع العميل — مندوب التوصيل بيشوف بس الطلبات المُسندة له وحسابه
export default function CourierTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { fontFamily: fonts.semiBold, fontSize: fontSize.md },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.brand,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: fontSize.xs },
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen
        name="orders"
        options={{
          title: 'توصيلاتي',
          headerTitle: 'توصيلاتي',
          tabBarIcon: ({ focused }) => <TabIcon symbol="🛵" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'حسابي',
          tabBarIcon: ({ focused }) => <TabIcon symbol="👤" focused={focused} />,
        }}
      />
    </Tabs>
  )
}
