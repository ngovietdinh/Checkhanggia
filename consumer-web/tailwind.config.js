/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#0A0E14',
          surface: '#131924',
          surface2: '#1A2230',
          border: '#232C3D',
        },
        text: {
          DEFAULT: '#E7ECEF',
          muted: '#8A95A6',
        },
        verify: {
          valid: '#00E5A0',
          danger: '#FF4D6D',
          warn: '#FFB020',
          data: '#3ECFFF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(0, 229, 160, 0.25), 0 0 24px rgba(0, 229, 160, 0.08)',
      },
    },
  },
  plugins: [],
};
