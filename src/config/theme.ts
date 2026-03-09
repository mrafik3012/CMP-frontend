export const theme = {
  background: {
    primary: "#0F1115",
    surface: "#1B1F27",
  },
  text: {
    primary: "#F2F4F8",
    secondary: "#C5CAD3",
    muted: "#9AA3B2",
    disabled: "#6E7685",
  },
  accent: {
    primary: "#FFC247",
    primaryHover: "#E6AA2F",
    primaryActive: "#CC931E",
    secondary: "#3A7DFF",
    secondaryHover: "#2F69D6",
  },
  status: {
    success: "#2FBF71",
    successDark: "#23945A",
    warning: "#F5A524",
    warningDark: "#D4881C",
    error: "#E5484D",
    errorDark: "#C7363A",
  },
  border: {
    subtle: "#2E3443",
    default: "#3A4152",
  },
  divider: "#343B4A",
} as const;

export type Theme = typeof theme;

export const taskStateColors = {
  completed: theme.status.success,
  inProgress: theme.status.warning,
  delayed: theme.status.error,
  pendingApproval: theme.accent.secondary,
} as const;

