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
