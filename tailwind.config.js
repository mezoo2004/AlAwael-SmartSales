/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#FF5A00',
          'orange-light': '#FF7A1A',
          gray: '#AEB5BC',
          dark: '#292D32',
          'dark-light': '#3A4047',
          light: '#F0F2F4',
          white: '#FFFFFF',
        },
      },
      fontFamily: {
        arabic: ['Tajawal', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
        '34': '8.5rem',
      },
      minHeight: {
        'touch': '60px',
      },
      backgroundImage: {
        'brand-orange-gradient': 'linear-gradient(135deg, #FF5A00 0%, #FF7A1A 100%)',
        'brand-light-gradient': 'linear-gradient(135deg, #FFFFFF 0%, #F0F2F4 100%)',
        'brand-gray-gradient': 'linear-gradient(135deg, #F0F2F4 0%, #D9DEE3 100%)',
        'brand-dark-gradient': 'linear-gradient(135deg, #292D32 0%, #3A4047 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
