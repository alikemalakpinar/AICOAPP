// Modern Dark Theme Design System - Based on Team Task Manager UI
export const theme = {
  colors: {
    // Background colors
    background: {
      primary: '#0a0a0f',
      secondary: '#12121a',
      tertiary: '#1a1a24',
      card: '#1e1e28',
      cardHover: '#252530',
      elevated: '#2a2a35',
    },
    // Text colors
    text: {
      primary: '#ffffff',
      secondary: '#9ca3af',
      muted: '#6b7280',
      inverse: '#0a0a0f',
    },
    // Accent colors
    accent: {
      primary: '#00d4ff',
      secondary: '#8b5cf6',
      tertiary: '#ec4899',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
    // Gradient combinations
    gradients: {
      primary: ['#00d4ff', '#8b5cf6'],
      secondary: ['#8b5cf6', '#ec4899'],
      success: ['#10b981', '#059669'],
      warning: ['#f59e0b', '#d97706'],
      dark: ['#1a1a24', '#0a0a0f'],
      card: ['#1e1e28', '#12121a'],
    },
    // Border colors
    border: {
      light: '#2d2d3a',
      medium: '#3d3d4a',
      focus: '#00d4ff',
    },
    // Status colors
    status: {
      todo: '#6b7280',
      inProgress: '#3b82f6',
      done: '#10b981',
      pending: '#f59e0b',
      rejected: '#ef4444',
    },
    // Priority colors
    priority: {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
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
  },
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
  },
  typography: {
    largeTitle: {
      fontSize: 34,
      fontWeight: 'bold' as const,
      lineHeight: 41,
    },
    title1: {
      fontSize: 28,
      fontWeight: 'bold' as const,
      lineHeight: 34,
    },
    title2: {
      fontSize: 22,
      fontWeight: 'bold' as const,
      lineHeight: 28,
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
      fontWeight: 'normal' as const,
      lineHeight: 22,
    },
    callout: {
      fontSize: 16,
      fontWeight: 'normal' as const,
      lineHeight: 21,
    },
    subhead: {
      fontSize: 15,
      fontWeight: 'normal' as const,
      lineHeight: 20,
    },
    footnote: {
      fontSize: 13,
      fontWeight: 'normal' as const,
      lineHeight: 18,
    },
    caption1: {
      fontSize: 12,
      fontWeight: 'normal' as const,
      lineHeight: 16,
    },
    caption2: {
      fontSize: 11,
      fontWeight: 'normal' as const,
      lineHeight: 13,
    },
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 8,
    },
    glow: {
      shadowColor: '#00d4ff',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 10,
    },
  },
};

export type Theme = typeof theme;
