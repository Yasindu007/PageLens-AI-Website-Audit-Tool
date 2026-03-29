export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'DM Serif Display'", "Georgia", "serif"],
        body: ["'DM Sans'", "system-ui", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      colors: {
        ink: { DEFAULT: "#0d0d0d", soft: "#1a1a1a", muted: "#2e2e2e" },
        paper: { DEFAULT: "#f9f6f0", warm: "#f2ede3", mid: "#e8e0d0" },
        amber: { audit: "#e8a000", light: "#ffc94a", pale: "#fff4d6" },
        signal: {
          green: "#1a7a4a", greenLight: "#d1f2e1",
          red: "#b91c1c", redLight: "#fee2e2",
          yellow: "#b45309", yellowLight: "#fef3c7",
        },
      },
      boxShadow: {
        card: "0 2px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)",
        "card-hover": "0 8px 28px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)",
        inner: "inset 0 1px 3px rgba(0,0,0,0.08)",
      },
      borderRadius: { "2.5xl": "1.125rem" },
    },
  },
  plugins: [],
};
