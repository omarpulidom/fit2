import type { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { Text, TouchableOpacity, View } from 'react-native'

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  return (
    <View className='bg-[#f7f7f5] border-t border-zinc-200 px-8 pt-2 pb-8'>
      <View className='flex-row justify-around'>
        {state.routes.map((route, index) => {
          const focused = index === state.index
          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              className='items-center gap-1 py-2 px-7'
            >
              <Text
                className={`font-geist-mono text-base ${focused ? 'text-zinc-950' : 'text-zinc-400'}`}
              >
                {route.name === 'index' ? 'HOY' : 'PLAN'}
              </Text>
              {focused && <View className='w-1.5 h-1.5 bg-zinc-950' />}
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}
