// MODIFIED: 2026-03-03 - Added TailwindCSS configuration with brand theme

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        background: {
          primary: "var(--bg-primary)",
          surface: "var(--surface)",
          card: "var(--surface-card)",
        },
        surface: {
          base: "var(--surface-base)",
          card: "var(--surface-card)",
          elevated: "var(--surface-elevated)",
          border: "var(--border-default)",
          hover: "var(--surface-hover)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          disabled: "var(--text-disabled)",
          inverse: "#0F1115",
        },
        accent: {
          primary: "var(--accent-primary)",
          primaryHover: "var(--accent-primary-hover)",
          primaryActive: "var(--accent-primary-active)",
          secondary: "var(--accent-secondary)",
          secondaryHover: "var(--accent-secondary-hover)",
        },
        status: {
          success: "var(--status-success)",
          successDark: "var(--status-success-dark)",
          warning: "var(--status-warning)",
          warningDark: "var(--status-warning-dark)",
          error: "var(--status-error)",
          errorDark: "var(--status-error-dark)",
          // alias to keep older classnames working
          danger: "var(--status-error)",
          info: "var(--accent-secondary)",
        },
        border: {
          subtle: "var(--border-subtle)",
          default: "var(--border-default)",
        },
        divider: "var(--divider)",
        // Backwards-compatible aliases for existing classes
        brand: {
          primary: "var(--accent-primary)",
          hover: "var(--accent-primary-hover)",
          accent: "var(--accent-secondary)",
        },
      },
      boxShadow: {
        card: "0 10px 30px rgba(0,0,0,0.6)",
        modal: "0 30px 60px rgba(0,0,0,0.85)",
        glow: "0 0 24px rgba(255,194,71,0.35)",
      },
      borderRadius: {
        xl: "0.9rem",
        "2xl": "1.25rem",
      },
    },
  },
  plugins: [],
};
