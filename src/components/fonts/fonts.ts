import {
  GeistMono_300Light,
  GeistMono_400Regular,
  GeistMono_500Medium,
  GeistMono_600SemiBold,
  GeistMono_700Bold,
} from '@expo-google-fonts/geist-mono'

export const AppFonts = {
  GeistMono_300Light,
  GeistMono_400Regular,
  GeistMono_500Medium,
  GeistMono_600SemiBold,
  GeistMono_700Bold,
} as const

export type AppFontKeys = keyof typeof AppFonts
