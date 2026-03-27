/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: '#202020',
        'dark-light': '#2a2a2a',
        'dark-lighter': '#333333',
        accent: '#DDB3FF',
        'accent-blue': '#0E6EFF',
        'accent-pink': '#E8A0BF',
      },
      fontFamily: {
        heading: ['GreedCondensed', 'sans-serif'],
        body: ['Satoshi', 'sans-serif'],
        label: ['KansasNew', 'sans-serif'],
      },
      borderRadius: {
        btn: '6px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
