import type { AppFontKeys } from './fonts'

export const AppFontNames = {
  GeistMono_300Light: 'GeistMono_300Light',
  GeistMono_400Regular: 'GeistMono_400Regular',
  GeistMono_500Medium: 'GeistMono_500Medium',
  GeistMono_600SemiBold: 'GeistMono_600SemiBold',
  GeistMono_700Bold: 'GeistMono_700Bold',
  DotoRounded_400Regular: 'DotoRounded_400Regular',
  DotoRounded_500Medium: 'DotoRounded_500Medium',
} as const satisfies Record<AppFontKeys, AppFontKeys>
