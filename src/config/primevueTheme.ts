import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

export const pericialPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b',
      950: '#09090b',
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
        primary: {
          color: '#18181b',
          inverseColor: '#ffffff',
          hoverColor: '#27272a',
          activeColor: '#3f3f46',
        },
        text: {
          color: '#18181b',
          secondaryColor: '#71717a',
          mutedColor: '#a1a1aa',
        },
        content: {
          background: '#ffffff',
          hoverBackground: '#fafafa',
          borderColor: '#e4e4e7',
        },
      },
      dark: {
        surface: {
          0: '#09090b',
          50: '#18181b',
          100: '#27272a',
          200: '#3f3f46',
          300: '#52525b',
          400: '#71717a',
          500: '#a1a1aa',
          600: '#d4d4d8',
          700: '#e4e4e7',
          800: '#f4f4f5',
          900: '#fafafa',
          950: '#ffffff',
        },
        primary: {
          color: '#fafafa',
          inverseColor: '#18181b',
          hoverColor: '#ffffff',
          activeColor: '#f4f4f5',
        },
        text: {
          color: '#fafafa',
          secondaryColor: '#a1a1aa',
          mutedColor: '#71717a',
        },
        content: {
          background: '#18181b',
          hoverBackground: '#27272a',
          borderColor: '#3f3f46',
        },
      },
    },
  },
})
