import type { Config } from 'tailwindcss';

/**
 * FitTrack — FitLink design system
 * Premium dark aesthetic with electric lime accents.
 * The `primary` scale is a chartreuse/lime that all existing `primary-*`
 * utility classes automatically pick up.
 */
const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Electric lime — used as the app's primary accent.
        primary: {
          50: '#f6ffdf',
          100: '#ecffb5',
          200: '#ddff83',
          300: '#ccff4d',
          400: '#bdff2e', // core lime — "Start Workout"
          500: '#a3e60b',
          600: '#82b800',
          700: '#608500',
          800: '#425a00',
          900: '#283600',
        },
        // Cyan/teal — secondary accent used for icon chips (dumbbell, etc.)
        accent: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee', // core cyan — exercise icons
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        // Surfaces — the dark layer system.
        surface: {
          base: '#07080a',   // page background
          900: '#0a0b0e',    // app shell
          800: '#101114',    // primary card
          700: '#17181c',    // elevated card
          600: '#1f2126',    // inputs / hover
          500: '#2a2c33',    // strong surface
          border: '#1c1e23', // subtle border
          'border-strong': '#2a2d34',
        },
        // Foreground / text
        ink: {
          DEFAULT: '#fafafa',
          muted: '#9ca0a8',
          subtle: '#6b6f78',
          dim: '#4a4d54',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-lime': '0 0 0 1px rgba(189, 255, 46, 0.25), 0 0 24px -4px rgba(189, 255, 46, 0.35)',
        'glow-lime-sm': '0 0 0 1px rgba(189, 255, 46, 0.18), 0 0 12px -2px rgba(189, 255, 46, 0.25)',
        'card-dark': '0 1px 0 rgba(255,255,255,0.02) inset, 0 10px 30px -18px rgba(0,0,0,0.8)',
      },
      backgroundImage: {
        'lime-gradient':
          'linear-gradient(135deg, #d8ff5c 0%, #bdff2e 45%, #a3e60b 100%)',
        'dark-radial':
          'radial-gradient(circle at 20% 0%, rgba(189,255,46,0.08) 0%, transparent 40%), radial-gradient(circle at 100% 100%, rgba(34,211,238,0.06) 0%, transparent 45%)',
      },
    },
  },
  plugins: [],
};

export default config;
