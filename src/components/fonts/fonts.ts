import {
  GeistMono_100Thin,
  GeistMono_200ExtraLight,
  GeistMono_300Light,
  GeistMono_400Regular,
  GeistMono_500Medium,
  GeistMono_600SemiBold,
  GeistMono_700Bold,
} from '@expo-google-fonts/geist-mono'

const DotoRounded_400Regular = require('../../assets/fonts/Doto_Rounded-Regular.ttf')
const DotoRounded_500Medium = require('../../assets/fonts/Doto_Rounded-Medium.ttf')

export const AppFonts = {
  GeistMono_100Thin,
  GeistMono_200ExtraLight,
  GeistMono_300Light,
  GeistMono_400Regular,
  GeistMono_500Medium,
  GeistMono_600SemiBold,
  GeistMono_700Bold,
  DotoRounded_400Regular,
  DotoRounded_500Medium,
} as const

export type AppFontKeys = keyof typeof AppFonts
