module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}", "./app/**/*.{js,ts,jsx,tsx}", "./pages/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      backgroundImage: {
        "radial-grid": "radial-gradient(circle at 20% 20%, rgba(99,102,241,0.15), transparent 55%), radial-gradient(circle at 80% 0%, rgba(14,165,233,0.12), transparent 45%)"
      },
      boxShadow: {
        glow: "0 20px 45px rgba(99,102,241,0.25)",
        soft: "0 4px 30px rgba(15,23,42,0.08)"
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "fade-down": {
          "0%": { opacity: "0", transform: "translateY(-12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        float: {
          "0%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
          "100%": { transform: "translateY(0)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        },
        "pulse-border": {
          "0%": { boxShadow: "0 0 0 0 rgba(59,130,246,0.4)" },
          "70%": { boxShadow: "0 0 0 8px rgba(59,130,246,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(59,130,246,0)" }
        }
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out forwards",
        "fade-down": "fade-down 0.45s ease-out forwards",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 1.8s linear infinite",
        "pulse-border": "pulse-border 2.4s ease-out infinite"
      },
      transitionTimingFunction: {
        "swift-out": "cubic-bezier(0.16, 1, 0.3, 1)"
      }
    }
  },
  plugins: []
}
