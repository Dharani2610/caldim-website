import type { Config } from "tailwindcss";

/** Reads a "R G B" CSS variable and produces a Tailwind-compatible colour
 *  function that still supports opacity modifiers (e.g. bg-steel-950/40). */
function withOpacity(varName: string) {
  return ({ opacityValue }: { opacityValue?: string }) =>
    opacityValue !== undefined
      ? `rgb(var(${varName}) / ${opacityValue})`
      : `rgb(var(${varName}))`;
}

const config: Config = {
  content: [
    "./frontend/**/*.{js,ts,jsx,tsx,mdx}",
    "./shared/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Tailwind fully supports function-based dynamic colours at runtime
      // (the standard pattern for CSS-variable-driven themes); the bundled
      // Config type just doesn't model that signature, hence the cast.
      colors: {
        steel: {
          950: withOpacity("--color-steel-950"),
          900: withOpacity("--color-steel-900"),
          // The metal grey used by drawing marks and 3D materials.
          mark: withOpacity("--color-steel-mark"),
        },
        blueprint: {
          DEFAULT: withOpacity("--color-blueprint"),
          light: withOpacity("--color-blueprint-light"),
        },
        paper: {
          DEFAULT: withOpacity("--color-paper"),
          dim: withOpacity("--color-paper-dim"),
        },
        accent: {
          DEFAULT: withOpacity("--color-accent"),
          // Full-strength brand colour, for graphics rather than text.
          vivid: withOpacity("--color-accent-vivid"),
          dim: "rgb(var(--color-accent) / 0.2)",
          faint: "rgb(var(--color-accent) / 0.08)",
        },
        mark: {
          cool: withOpacity("--color-mark-cool"),
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      fontFamily: {
        display: ["var(--font-space-grotesk)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "ui-monospace", "monospace"],
      },
      backgroundImage: {
        "blueprint-grid":
          "linear-gradient(var(--tw-grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--tw-grid-line) 1px, transparent 1px)",
      },
      // One easing curve for everything that decelerates, so unrelated
      // components still feel like they belong to the same object.
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      animation: {
        marquee: "marquee 32s linear infinite",
        "spin-slow": "spin 18s linear infinite",
        "pulse-slow": "pulseGlow 3.5s ease-in-out infinite",
        floaty: "floaty 9s ease-in-out infinite",
        "badge-tilt": "badgeTilt 7s ease-in-out infinite",
        "sheen": "sheen 2.4s ease-in-out infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "0.9" },
        },
        // Amplitude reduced from 14px to 5px. Every card on the page carries
        // this animation; at the original throw, a grid of them read as
        // restless rather than alive, and made body copy harder to track.
        floaty: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-5px) rotate(0.15deg)" },
        },
        badgeTilt: {
          "0%, 100%": { transform: "rotateY(-10deg) rotateX(4deg)" },
          "50%": { transform: "rotateY(10deg) rotateX(-4deg)" },
        },
        sheen: {
          "0%": { transform: "translateX(-120%)" },
          "60%, 100%": { transform: "translateX(220%)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
