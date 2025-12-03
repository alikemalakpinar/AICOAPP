// Premium Dark Theme Design System - AICO App
// Modern, Premium, Glassmorphism-based design

export const theme = {
  colors: {
    // Background colors - Deep, rich dark tones
    background: {
      primary: '#05060a',
      secondary: '#0c0d14',
      tertiary: '#14151f',
      card: 'rgba(20, 22, 35, 0.85)',
      cardSolid: '#141623',
      cardHover: '#1c1e2d',
      elevated: '#1f2133',
      glass: 'rgba(255, 255, 255, 0.03)',
      overlay: 'rgba(5, 6, 10, 0.9)',
    },
    // Text colors - Clear hierarchy
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
      muted: 'rgba(255, 255, 255, 0.45)',
      inverse: '#05060a',
      accent: '#00d4ff',
    },
    // Premium accent colors - Vibrant and modern
    accent: {
      primary: '#00d4ff',      // Electric Cyan
      primaryLight: '#5ce1ff',
      primaryDark: '#00a8cc',
      secondary: '#a855f7',    // Vivid Purple
      secondaryLight: '#c084fc',
      secondaryDark: '#7c3aed',
      tertiary: '#f472b6',     // Hot Pink
      tertiaryLight: '#f9a8d4',
      tertiaryDark: '#ec4899',
      success: '#22c55e',      // Emerald Green
      successLight: '#4ade80',
      successDark: '#16a34a',
      warning: '#f59e0b',      // Amber
      warningLight: '#fbbf24',
      warningDark: '#d97706',
      error: '#ef4444',        // Red
      errorLight: '#f87171',
      errorDark: '#dc2626',
      info: '#3b82f6',         // Blue
      infoLight: '#60a5fa',
      infoDark: '#2563eb',
    },
    // Premium gradient combinations
    gradients: {
      primary: ['#00d4ff', '#00a8cc'] as [string, string],
      primaryVibrant: ['#00d4ff', '#a855f7'] as [string, string],
      secondary: ['#a855f7', '#ec4899'] as [string, string],
      secondaryVibrant: ['#c084fc', '#f472b6'] as [string, string],
      tertiary: ['#f472b6', '#fb7185'] as [string, string],
      success: ['#22c55e', '#059669'] as [string, string],
      warning: ['#f59e0b', '#f97316'] as [string, string],
      error: ['#ef4444', '#dc2626'] as [string, string],
      info: ['#3b82f6', '#6366f1'] as [string, string],
      dark: ['#14151f', '#05060a'] as [string, string],
      darkReverse: ['#05060a', '#14151f'] as [string, string],
      card: ['rgba(30, 32, 48, 0.9)', 'rgba(15, 16, 25, 0.9)'] as [string, string],
      premium: ['#fbbf24', '#f59e0b', '#ea580c'] as [string, string, string],
      neon: ['#00d4ff', '#a855f7', '#f472b6'] as [string, string, string],
      aurora: ['#22c55e', '#00d4ff', '#a855f7'] as [string, string, string],
      sunset: ['#f97316', '#ef4444', '#ec4899'] as [string, string, string],
      ocean: ['#0ea5e9', '#3b82f6', '#6366f1'] as [string, string, string],
    },
    // Border colors
    border: {
      light: 'rgba(255, 255, 255, 0.08)',
      medium: 'rgba(255, 255, 255, 0.12)',
      strong: 'rgba(255, 255, 255, 0.2)',
      focus: '#00d4ff',
      glass: 'rgba(255, 255, 255, 0.1)',
    },
    // Status colors with better contrast
    status: {
      todo: '#64748b',
      todoBackground: 'rgba(100, 116, 139, 0.15)',
      inProgress: '#3b82f6',
      inProgressBackground: 'rgba(59, 130, 246, 0.15)',
      done: '#22c55e',
      doneBackground: 'rgba(34, 197, 94, 0.15)',
      pending: '#f59e0b',
      pendingBackground: 'rgba(245, 158, 11, 0.15)',
      rejected: '#ef4444',
      rejectedBackground: 'rgba(239, 68, 68, 0.15)',
      onHold: '#8b5cf6',
      onHoldBackground: 'rgba(139, 92, 246, 0.15)',
    },
    // Priority colors
    priority: {
      low: '#22c55e',
      lowBackground: 'rgba(34, 197, 94, 0.15)',
      medium: '#f59e0b',
      mediumBackground: 'rgba(245, 158, 11, 0.15)',
      high: '#ef4444',
      highBackground: 'rgba(239, 68, 68, 0.15)',
      urgent: '#dc2626',
      urgentBackground: 'rgba(220, 38, 38, 0.2)',
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    xxxxl: 40,
  },
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    full: 9999,
  },
  typography: {
    largeTitle: {
      fontSize: 34,
      fontWeight: '800' as const,
      lineHeight: 41,
      letterSpacing: -0.5,
    },
    title1: {
      fontSize: 28,
      fontWeight: '700' as const,
      lineHeight: 34,
      letterSpacing: -0.3,
    },
    title2: {
      fontSize: 22,
      fontWeight: '700' as const,
      lineHeight: 28,
      letterSpacing: -0.2,
    },
    title3: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 25,
    },
    headline: {
      fontSize: 17,
      fontWeight: '600' as const,
      lineHeight: 22,
    },
    body: {
      fontSize: 17,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    bodyBold: {
      fontSize: 17,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
    callout: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 21,
    },
    subhead: {
      fontSize: 15,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    subheadBold: {
      fontSize: 15,
      fontWeight: '600' as const,
      lineHeight: 20,
    },
    footnote: {
      fontSize: 13,
      fontWeight: '400' as const,
      lineHeight: 18,
    },
    footnoteBold: {
      fontSize: 13,
      fontWeight: '600' as const,
      lineHeight: 18,
    },
    caption1: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
    },
    caption2: {
      fontSize: 11,
      fontWeight: '400' as const,
      lineHeight: 13,
    },
    micro: {
      fontSize: 10,
      fontWeight: '500' as const,
      lineHeight: 12,
    },
  },
  shadows: {
    xs: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.15,
      shadowRadius: 2,
      elevation: 1,
    },
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.35,
      shadowRadius: 24,
      elevation: 12,
    },
    glow: {
      shadowColor: '#00d4ff',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 8,
    },
    glowPurple: {
      shadowColor: '#a855f7',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 8,
    },
    glowPink: {
      shadowColor: '#f472b6',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 8,
    },
    glowSuccess: {
      shadowColor: '#22c55e',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 8,
    },
    inner: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 0,
    },
  },
  glass: {
    light: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
    },
    medium: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderColor: 'rgba(255, 255, 255, 0.12)',
      borderWidth: 1,
    },
    strong: {
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      borderColor: 'rgba(255, 255, 255, 0.15)',
      borderWidth: 1,
    },
    dark: {
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      borderColor: 'rgba(255, 255, 255, 0.08)',
      borderWidth: 1,
    },
    accent: {
      backgroundColor: 'rgba(0, 212, 255, 0.08)',
      borderColor: 'rgba(0, 212, 255, 0.2)',
      borderWidth: 1,
    },
  },
  animation: {
    fast: 150,
    normal: 300,
    slow: 500,
    spring: {
      friction: 8,
      tension: 40,
    },
    springBouncy: {
      friction: 6,
      tension: 50,
    },
    springSmooth: {
      friction: 10,
      tension: 30,
    },
  },
};

// Helper functions
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'todo':
    case 'not_started':
      return theme.colors.status.todo;
    case 'in_progress':
    case 'active':
      return theme.colors.status.inProgress;
    case 'done':
    case 'completed':
      return theme.colors.status.done;
    case 'pending':
    case 'waiting':
      return theme.colors.status.pending;
    case 'rejected':
    case 'cancelled':
      return theme.colors.status.rejected;
    case 'on_hold':
      return theme.colors.status.onHold;
    default:
      return theme.colors.text.muted;
  }
};

export const getStatusBackground = (status: string) => {
  switch (status) {
    case 'todo':
    case 'not_started':
      return theme.colors.status.todoBackground;
    case 'in_progress':
    case 'active':
      return theme.colors.status.inProgressBackground;
    case 'done':
    case 'completed':
      return theme.colors.status.doneBackground;
    case 'pending':
    case 'waiting':
      return theme.colors.status.pendingBackground;
    case 'rejected':
    case 'cancelled':
      return theme.colors.status.rejectedBackground;
    case 'on_hold':
      return theme.colors.status.onHoldBackground;
    default:
      return 'rgba(255, 255, 255, 0.05)';
  }
};

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'low':
      return theme.colors.priority.low;
    case 'medium':
      return theme.colors.priority.medium;
    case 'high':
      return theme.colors.priority.high;
    case 'urgent':
      return theme.colors.priority.urgent;
    default:
      return theme.colors.text.muted;
  }
};

export const getPriorityBackground = (priority: string) => {
  switch (priority) {
    case 'low':
      return theme.colors.priority.lowBackground;
    case 'medium':
      return theme.colors.priority.mediumBackground;
    case 'high':
      return theme.colors.priority.highBackground;
    case 'urgent':
      return theme.colors.priority.urgentBackground;
    default:
      return 'rgba(255, 255, 255, 0.05)';
  }
};

export type Theme = typeof theme;
