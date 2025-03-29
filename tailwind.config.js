/** @type {import('tailwindcss').Config} */

const defaultTheme = require('tailwindcss/defaultTheme')

export default {
  content: [
    './components/*.{html,js,ts,vue}',
    './layouts/*.{html,js,ts,vue}',
    './pages/*.{html,js,ts,vue}'
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter var', ...defaultTheme.fontFamily.sans],
      },
    },
    colors: {
      'white': '#ffffff',
      'black': '#000000',
      red: {
        50: '#fef2f2',
        100: '#fee2e2',
        200: '#fbd5d5',
        300: '#f8b4b4',
        400: '#f58787',
        500: '#bb2b2b',  // Your primary color
        600: '#a52525',
        700: '#8e1f1f',
        800: '#771a1a',
        900: '#601414',
        950: '#490f0f',
      },
      green: {
        50: 'rgba(196, 224, 180, 0.15)',
        100: "#345C32",
        200: "#527A4E",
        300: "#6A9669",
        400: "#83B184",
        500: "#9BCB9F",
        600: "#042f3a",
        700: "#CCFFDC",
        800: "#E5FFE8",
        900: "#F0FFF2",
        1000: "#FAFFFA",
      },      
      indigo: {
        50: '#eef2ff',
        100: '#e0e7ff',
        200: '#c7d2fe',
        300: '#a5b4fc',
        400: '#818cf8',
        500: '#6366f1',
        600: '#4f46e5',
        700: '#4338ca',
        800: '#3730a3',
        900: '#203354',
        950: '#0A3161',
      },
      slate: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
        950: '#020617',
      },
      gray: {
        50: '#f9fafb',
        100: '#f3f4f6',
        200: '#e5e7eb',
        300: '#d1d5db',
        400: '#9ca3af',
        500: '#6b7280',
        600: '#666d80',
        700: '#374151',
        800: '#1f2937',
        900: '#111827',
        950: '#030712',
      },
      red: {
        50: '#fef2f2',
        100: '#fee2e2',
        200: '#fecaca',
        300: '#fca5a5',
        400: '#f87171',
        500: '#ef4444',
        600: '#dc2626',
        700: '#b91c1c',
        800: '#991b1b',
        900: '#7f1d1d',
        950: '#450a0a',
      },
      blue: {
        '50': '#d1eaff',
        '100': '#a3d4ff',
        '200': '#75c8ff',
        '300': '#46bcff',  // Your original shade
        '400': '#18b0ff',
        '500': '#009ee6',
        '600': '#0084b4',
        '700': '#006a82',
        '800': '#00504f',
        '900': '#00361d',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/typography')
  ],
}

