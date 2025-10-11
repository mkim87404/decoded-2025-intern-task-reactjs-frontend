module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      animation: {
        'blob': 'blob 7s infinite',
        'fade-in': 'fadeIn 1s ease-in',
        'fade-in-slow': 'fadeIn 2.5s ease-in',
        'pop': 'pop 0.3s cubic-bezier(0.4,0,0.2,1)',
        'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
      },
      keyframes: {
        blob: {
          '0%': { transform: 'scale(1) translate(0px, 0px)' },
          '33%': { transform: 'scale(1.1) translate(30px, -20px)' },
          '66%': { transform: 'scale(0.9) translate(-20px, 20px)' },
          '100%': { transform: 'scale(1) translate(0px, 0px)' },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        pop: {
          '0%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
