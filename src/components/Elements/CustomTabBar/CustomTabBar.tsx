import { Feather } from '@expo/vector-icons'
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { Text, TouchableOpacity, View } from 'react-native'

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View className='bg-[#f7f7f5] border-t border-zinc-200 px-8 pt-3 pb-7'>
      <View className='flex-row justify-around'>
        {state.routes.map((route, index) => {
          const focused = index === state.index
          const icon = (
            route.name === 'index' ? 'activity' : 'sliders'
          ) as keyof typeof Feather.glyphMap
          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              className='items-center gap-1 py-2 px-7'
            >
              <Feather name={icon} size={20} color={focused ? '#18181b' : '#a1a1aa'} />
              <Text
                className={`font-geist-mono text-[10px] ${focused ? 'text-zinc-950' : 'text-zinc-400'}`}
              >
                {route.name === 'index' ? 'HOY' : 'PLAN'}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}
