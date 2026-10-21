import type { Config } from "tailwindcss";

/**
 * الأطرش — brand tokens.
 * brand-400/500 = the signature yellow from the logo and the stores (use with ink text, never white).
 * brand-700/800 = deep gold, readable as text on white.
 */
export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#FFFBE6", 100: "#FFF4BF", 200: "#FFEA85", 300: "#FFDF4D",
          400: "#FFD21F", 500: "#F5C400", 600: "#E0B000", 700: "#8F6D00",
          800: "#6E5300", 900: "#4D3A00", 950: "#2B2000",
        },
        ink: { DEFAULT: "#131210", soft: "#3A3833", mute: "#6E6B62", line: "#E9E6DA" },
        paper: "#F7F5EE",
      },
      fontFamily: { sans: ["Cairo", "system-ui", "sans-serif"] },
      borderRadius: { xl2: "1.25rem", xl3: "1.75rem" },
      boxShadow: {
        card: "0 1px 2px rgba(19,18,16,.04), 0 10px 26px -14px rgba(19,18,16,.18)",
        pop: "0 18px 40px -18px rgba(245,196,0,.9)",
        ink: "0 18px 40px -18px rgba(19,18,16,.6)",
      },
      keyframes: {
        rise: { "0%": { opacity: "0", transform: "translateY(12px)" }, "100%": { opacity: "1", transform: "none" } },
        pulseRing: { "0%": { transform: "scale(.9)", opacity: ".7" }, "100%": { transform: "scale(1.8)", opacity: "0" } },
        slide: { "0%": { backgroundPosition: "0 0" }, "100%": { backgroundPosition: "56px 0" } },
        pop: { "0%": { transform: "scale(1)" }, "40%": { transform: "scale(1.25)" }, "100%": { transform: "scale(1)" } },
        floaty: { "0%,100%": { transform: "translateY(0) rotate(var(--r,0deg))" }, "50%": { transform: "translateY(-10px) rotate(var(--r,0deg))" } },
        spin24: { to: { transform: "rotate(360deg)" } },
        marquee: { from: { transform: "translateX(0)" }, to: { transform: "translateX(50%)" } },
        steam: { "0%": { opacity: "0", transform: "translateY(6px) scaleX(.9)" }, "40%": { opacity: ".7" }, "100%": { opacity: "0", transform: "translateY(-26px) scaleX(1.2)" } },
        drive: { "0%": { transform: "translateX(-120%)" }, "100%": { transform: "translateX(0)" } },
        wiggle: { "0%,100%": { transform: "rotate(-4deg)" }, "50%": { transform: "rotate(4deg)" } },
      },
      animation: {
        rise: "rise .5s cubic-bezier(.2,.7,.2,1) both",
        ring: "pulseRing 1.6s ease-out infinite",
        stripes: "slide 1.2s linear infinite",
        pop: "pop .35s ease",
        floaty: "floaty 5s ease-in-out infinite",
        spin24: "spin24 8s linear infinite",
        marquee: "marquee 28s linear infinite",
        steam: "steam 2.6s ease-out infinite",
        wiggle: "wiggle .6s ease-in-out",
      },
    },
  },
  plugins: [],
} satisfies Config;
