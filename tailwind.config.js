/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // "Slate" — neutral dark surface for the header and dark UI, paired
        // with a single accent color rather than a literal track-surface hue.
        slate: {
          DEFAULT: '#2B2F36',
          dark: '#1F232A',
        },
        paper: '#F7F6F3', // off-white light surface
        charcoal: '#1F1C1A', // primary text
        graphite: '#5B554C', // secondary text
        // Indigo-blue accent. Use `accent` (the saturated version) on light
        // surfaces; use `accent-light` on dark surfaces, where the fully
        // saturated color loses contrast against near-black.
        accent: {
          DEFAULT: '#3A3FE0',
          light: '#6C72F0',
        },
        silver: '#9CA3AC', // 2nd place
        bronze: '#B87333', // 3rd place
        gold: '#C99A2E', // 1st place — muted gold, not neon
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
