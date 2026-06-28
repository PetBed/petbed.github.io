/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mv: {
          bg: '#0a0a0a',
          panel: '#0e0e0e',
          elevated: '#141414',
          border: 'rgba(107, 143, 113, 0.35)',
          'border-dim': 'rgba(255, 255, 255, 0.08)',
          text: '#a8a8a8',
          bright: '#d4d4d4',
          dim: '#5a5a5a',
          track: '#6b8f71',
          'track-dim': 'rgba(107, 143, 113, 0.15)',
          amber: '#9a8860',
          'amber-bright': '#c4a574',
          alert: '#7a4545',
          'alert-bright': '#a86565',
        },
      },
      fontFamily: {
        mono: ['"IBM Plex Mono"', 'Consolas', '"Courier New"', 'monospace'],
      },
    },
  },
  plugins: [],
}
