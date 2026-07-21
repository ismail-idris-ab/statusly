/** @type {import('tailwindcss').Config} */
const withOpacity = (variable) => `rgb(var(${variable}) / <alpha-value>)`;

module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: withOpacity('--color-primary'),
          dark: withOpacity('--color-primary-dark'),
          light: withOpacity('--color-primary-light'),
        },
        accent: {
          DEFAULT: withOpacity('--color-accent'),
          glow: withOpacity('--color-accent-glow'),
        },
        'on-primary': withOpacity('--color-on-primary'),
        danger: withOpacity('--color-danger'),
        bg: withOpacity('--color-bg'),
        surface: {
          DEFAULT: withOpacity('--color-surface'),
          alt: withOpacity('--color-surface-alt'),
        },
        text: {
          DEFAULT: withOpacity('--color-text'),
          muted: withOpacity('--color-text-muted'),
        },
        border: withOpacity('--color-border'),
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        pill: '999px',
      },
    },
  },
  plugins: [],
};
