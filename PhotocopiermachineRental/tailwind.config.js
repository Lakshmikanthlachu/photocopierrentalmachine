/** Copixa — Tailwind configuration
 *  Rebuild CSS after editing any HTML:  npm run build   (or npm run watch)
 */
module.exports = {
  content: ['./*.html', './assets/js/**/*.js'],
  darkMode: 'class',
  theme: {
    container: { center: true, padding: { DEFAULT: '1rem', sm: '1.5rem', lg: '2rem' } },
    extend: {
      fontFamily: {
        display: ['Sora', 'IBM Plex Sans Arabic', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Manrope', 'IBM Plex Sans Arabic', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef3ff', 100: '#dae4ff', 200: '#bccdff', 300: '#8eabff', 400: '#5b7fff',
          500: '#3659ff', 600: '#2440f5', 700: '#1c30d8', 800: '#1d2bae', 900: '#1e2b89', 950: '#141a50',
        },
        ink: {
          50: '#f6f7fb', 100: '#eceef5', 200: '#d5d9e6', 300: '#b0b7cc', 400: '#8590ab',
          500: '#646f8c', 600: '#4e5772', 700: '#3f465c', 800: '#1b2133', 900: '#0e1424', 950: '#070b16',
        },
        cyanx: '#06b6d4', magentax: '#ec4899', yellowx: '#facc15',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(14,20,36,.04), 0 8px 24px -8px rgba(14,20,36,.10)',
        lift: '0 2px 4px rgba(14,20,36,.04), 0 24px 48px -16px rgba(14,20,36,.22)',
        glow: '0 0 0 1px rgba(54,89,255,.25), 0 16px 40px -12px rgba(54,89,255,.45)',
      },
      borderRadius: { '4xl': '2rem' },
      keyframes: {
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        floaty: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
      },
      animation: {
        marquee: 'marquee 38s linear infinite',
        floaty: 'floaty 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
