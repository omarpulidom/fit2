import { Tabs } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { CustomTabBar } from '@/components/Elements/CustomTabBar'

export default function TabsLayout() {
  return (
    <>
      <StatusBar style='dark' />
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          animation: 'shift',
        }}
      >
        <Tabs.Screen
          name='index'
          options={{
            title: 'Hoy',
          }}
        />
        <Tabs.Screen
          name='profile'
          options={{
            title: 'Plan',
          }}
        />
      </Tabs>
    </>
  )
}
