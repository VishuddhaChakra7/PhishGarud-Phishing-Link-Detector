import type { Config } from 'tailwindcss';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        page: {
          DEFAULT: "#09090b", // Pure dark zinc-950
        },
        card: {
          DEFAULT: "#09090b", // Same as page for a unified flat canvas
          elevated: "#18181b", // Zinc-900
        },
        border: {
          card: "#27272a", // Zinc-800 (very clean, thin hairline borders)
        },
        accent: {
          blue: "#3f83f8", // Crisp muted blue
        },
        phish: {
          red: "#f05252", // Stark desaturated red
        },
        suspicious: {
          amber: "#e3a008", // Stark desaturated amber
        },
        safe: {
          green: "#0e9f6e", // Stark desaturated green
        },
        text: {
          primary: "#f3f4f6", // Off-white
          secondary: "#9ca3af", // Zinc-400
          muted: "#6b7280", // Zinc-500
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['Georgia', 'serif'], // Elegant serif for editorial headings
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
} satisfies Config;
