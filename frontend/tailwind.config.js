/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        kamino: {
          bg: '#0B0D14',
          card: '#111520',
          border: '#1E2336',
          accent: '#5B6EF5',
          accent2: '#7C3AED',
          green: '#22C55E',
          yellow: '#F59E0B',
          red: '#EF4444',
          muted: '#6B7280',
          text: '#E2E8F0',
          dim: '#94A3B8',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'accent-glow': 'linear-gradient(135deg, #5B6EF5 0%, #7C3AED 100%)',
        'green-glow': 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
        'yield-split': 'linear-gradient(135deg, #5B6EF5 0%, #A855F7 50%, #EC4899 100%)',
      },
      boxShadow: {
        'glow-accent': '0 0 30px rgba(91, 110, 245, 0.15)',
        'glow-green': '0 0 30px rgba(34, 197, 94, 0.1)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
      }
    },
  },
  plugins: [],
}
