/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8F9F8',
        forest: {
          50: '#F0F7F4',
          100: '#E1EFE9',
          200: '#C2DFD3',
          300: '#8FBFA9',
          400: '#4F9676',
          500: '#1B7354',
          600: '#134E39', // Dominant dark green from mockup
          700: '#0E3B2B', // Darker hero / footer
          800: '#0A2D21',
          900: '#061D15',
        },
        terracotta: {
          50: '#FDF6F2',
          100: '#FAECE4',
          200: '#F5D7C7',
          300: '#EEB79D',
          400: '#E28C6A',
          500: '#C85A32', // Mockup CTA button color
          600: '#B84A22',
          700: '#963A18',
          800: '#7A3016',
          900: '#642915',
        },
        brand: {
          50: '#F0F7F4',
          100: '#E1EFE9',
          500: '#134E39',
          600: '#0E3B2B',
          700: '#0A2D21',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
