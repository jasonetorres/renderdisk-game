/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        body:  ['"VT323"', 'monospace'],
      },
      colors: {
        ink: {
          900: '#0f0f1b', 800: '#1a1a2e', 700: '#27273f', 600: '#3a3a5c',
          500: '#52527a', 400: '#7a7aa3', 300: '#a8a8c8', 200: '#d0d0e8', 100: '#e8e8f5',
        },
        forest: {
          900: '#1a3a1a', 800: '#2a5a2a', 700: '#3a7a3a', 600: '#4a9a4a',
          500: '#6aba6a', 400: '#8ada8a', 300: '#a8eaa8', 200: '#c8f5c8', 100: '#e0fbe0',
        },
        ember: {
          900: '#3a1a0a', 800: '#5a2a0a', 700: '#8B3A10', 600: '#B44A15',
          500: '#C85A1A', 400: '#da8a3a', 300: '#eaaa6a', 200: '#f5c89a', 100: '#fbe5c8',
        },
        ocean: {
          900: '#0a2a3a', 800: '#0a3a5a', 700: '#1A4A8A', 600: '#2B5FBF',
          500: '#3B6EC5', 400: '#5A8ED8', 300: '#7aaee8', 200: '#9ad5ea', 100: '#c8e8f5',
        },
        gold: {
          900: '#2a1a00', 800: '#4a2a00', 700: '#7a4a0a', 600: '#9a6a1a',
          500: '#C8960A', 400: '#E0B020', 300: '#eac07a', 200: '#f5d8a8', 100: '#fbe8c8',
        },
        rust: {
          900: '#2a0a0a', 800: '#3a0a0a', 700: '#5a1a1a', 600: '#7a2a2a',
          500: '#9a3a3a', 400: '#ba5a5a', 300: '#da7a7a', 200: '#ea9a9a', 100: '#f5c8c8',
        },
        violet: {
          900: '#1a0a2e', 800: '#2a1248', 700: '#3D1A6E', 600: '#5724A0',
          500: '#7B4FA6', 400: '#9B6FC6', 300: '#B990E0', 200: '#D4B5F0', 100: '#EDD8FA',
        },
        parchment: {
          900: '#3a2a1a', 800: '#5a4a2a', 700: '#7a6a3a', 600: '#9a8a4a',
          500: '#baaa6a', 400: '#dac08a', 300: '#e8d5a8', 200: '#f0e2c8', 100: '#f8f0e0',
        },
      },
      boxShadow: {
        pixel:      '0 4px 0 0 rgba(0,0,0,0.4)',
        pixelInset: 'inset 0 2px 0 0 rgba(255,255,255,0.15), inset 0 -2px 0 0 rgba(0,0,0,0.3)',
        pixelDeep:  '0 6px 0 0 rgba(0,0,0,0.5), 0 8px 12px 0 rgba(0,0,0,0.4)',
        // Card glow variants
        cardPurple: '0 0 0 3px #7B4FA6, 0 0 0 6px #3D1A6E, 0 8px 24px rgba(123,79,166,0.5)',
        cardOrange: '0 0 0 3px #C85A1A, 0 0 0 6px #5a2a0a, 0 8px 24px rgba(200,90,26,0.5)',
        cardBlue:   '0 0 0 3px #3B6EC5, 0 0 0 6px #0a3a5a, 0 8px 24px rgba(59,110,197,0.5)',
        cardViolet: '0 0 0 3px #7B4FA6, 0 0 0 6px #3D1A6E, 0 8px 24px rgba(123,79,166,0.5)',
        cardGold:   '0 0 0 3px #C8960A, 0 0 0 6px #4a2a00, 0 8px 32px rgba(200,150,10,0.6)',
      },
      animation: {
        idleBounce: 'idleBounce 1.6s ease-in-out infinite',
        float:      'float 3s ease-in-out infinite',
        blink:      'blink 1s steps(2) infinite',
        shake:      'shake 0.4s ease-in-out',
        flash:      'flash 0.3s ease-out',
        sparkle:    'sparkle 2s ease-in-out infinite',
        slideUp:    'slideUp 0.4s ease-out',
        cardFlip:   'cardFlip 0.6s ease-out',
      },
      keyframes: {
        idleBounce: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
        float:      { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        blink:      { '0%,50%': { opacity: '1' }, '50.01%,100%': { opacity: '0' } },
        shake:      { '0%,100%': { transform: 'translateX(0)' }, '25%': { transform: 'translateX(-8px)' }, '75%': { transform: 'translateX(8px)' } },
        flash:      { '0%': { opacity: '0' }, '50%': { opacity: '0.8' }, '100%': { opacity: '0' } },
        sparkle:    { '0%,100%': { opacity: '1', transform: 'scale(1) rotate(0deg)' }, '50%': { opacity: '0.6', transform: 'scale(1.3) rotate(20deg)' } },
        slideUp:    { '0%': { opacity: '0', transform: 'translateY(20px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        cardFlip:   { '0%': { opacity: '0', transform: 'scale(0.85) translateY(30px)' }, '100%': { opacity: '1', transform: 'scale(1) translateY(0)' } },
      },
    },
  },
  plugins: [],
};
