import type { Config } from 'tailwindcss'
import { Colors } from './src/components/colors'
import { AppFontNames } from './src/components/fonts/font-names'

const config: Config = {
  content: ['./src/app/**/*.{js,ts,tsx}', './src/components/**/*.{js,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: Colors,
      fontFamily: {
        'geist-mono': [AppFontNames.GeistMono_500Medium],
        sans: [AppFontNames.GeistMono_500Medium, 'sans-serif'],
        mono: [AppFontNames.GeistMono_500Medium],
        primary: [AppFontNames.GeistMono_500Medium, 'sans-serif'],
        secondary: [AppFontNames.GeistMono_500Medium, 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
