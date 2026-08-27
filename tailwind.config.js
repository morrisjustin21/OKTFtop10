/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // "Cinder" all-weather track surface red — the site's core identity color
        cinder: {
          DEFAULT: '#B7410E',
          dark: '#7A2A09',
        },
        lane: '#F5F1E8', // lane-line cream, used as the light surface
        charcoal: '#1F1C1A', // primary text, reads like track infield dirt
        graphite: '#5B554C', // secondary text
        gold: '#C99A2E', // leaderboard #1 / record accent, muted (not neon)
      },
      fontFamily: {
        display: ['"Oswald"', 'sans-serif'], // condensed, scoreboard-style
        body: ['"Inter"', 'sans-serif'],
        mark: ['"Oswald"', 'sans-serif'], // used for the numeric marks/times
      },
    },
  },
  plugins: [],
}
