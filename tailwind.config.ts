import type { Config } from 'tailwindcss'
import { Colors } from './src/components/colors'
import { AppFontNames } from './src/components/fonts/font-names'

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,tsx}',
    './src/components/**/*.{js,ts,tsx}',
  ],
  presets: [
    require('nativewind/preset'),
  ],
  theme: {
    extend: {
      colors: Colors,
      fontFamily: {
        'geist-mono': [
          AppFontNames.GeistMono_400Regular,
        ],
        'geist-mono-thin': [
          AppFontNames.GeistMono_100Thin,
        ],
        'geist-mono-extralight': [
          AppFontNames.GeistMono_200ExtraLight,
        ],
        'geist-mono-light': [
          AppFontNames.GeistMono_300Light,
        ],
        'geist-mono-regular': [
          AppFontNames.GeistMono_400Regular,
        ],
        'geist-mono-medium': [
          AppFontNames.GeistMono_500Medium,
        ],
        'geist-mono-semibold': [
          AppFontNames.GeistMono_600SemiBold,
        ],
        'geist-mono-bold': [
          AppFontNames.GeistMono_700Bold,
        ],
        doto: [
          AppFontNames.DotoRounded_400Regular,
        ],
        'doto-medium': [
          AppFontNames.DotoRounded_500Medium,
        ],
        sans: [
          AppFontNames.GeistMono_400Regular,
          'sans-serif',
        ],
        mono: [
          AppFontNames.GeistMono_400Regular,
        ],
        primary: [
          AppFontNames.GeistMono_400Regular,
          'sans-serif',
        ],
        secondary: [
          AppFontNames.GeistMono_400Regular,
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}

export default config
