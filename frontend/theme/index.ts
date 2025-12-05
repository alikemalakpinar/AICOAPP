// Professional Dark Theme - AICO Project Management
// Clean, minimal, business-focused design

export const theme = {
  colors: {
    // Background colors - Refined dark tones
    background: {
      primary: '#0f1117',
      secondary: '#161921',
      tertiary: '#1c1f2a',
      card: '#1e2230',
      cardSolid: '#1e2230',
      cardHover: '#252a3a',
      elevated: '#262b3d',
      input: '#1a1d27',
      overlay: 'rgba(0, 0, 0, 0.7)',
    },
    // Text colors - Clear hierarchy
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
      tertiary: '#64748b',
      muted: '#64748b',
      disabled: '#475569',
      inverse: '#0f1117',
      link: '#60a5fa',
    },
    // Accent colors - Professional Blue palette
    accent: {
      primary: '#3b82f6',
      primaryLight: '#60a5fa',
      primaryDark: '#2563eb',
      secondary: '#6366f1',
      secondaryLight: '#818cf8',
      tertiary: '#8b5cf6',
      hover: '#4f8ff7',
      muted: 'rgba(59, 130, 246, 0.15)',
      // Backwards compatibility aliases
      success: '#22c55e',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#06b6d4',
    },
    // Semantic colors - Functional, not decorative
    semantic: {
      success: '#22c55e',
      successMuted: 'rgba(34, 197, 94, 0.15)',
      warning: '#f59e0b',
      warningMuted: 'rgba(245, 158, 11, 0.15)',
      error: '#ef4444',
      errorMuted: 'rgba(239, 68, 68, 0.15)',
      info: '#06b6d4',
      infoMuted: 'rgba(6, 182, 212, 0.15)',
    },
    // Border colors
    border: {
      primary: '#2d3548',
      light: '#2d3548',
      medium: '#3d4660',
      strong: '#4d5a78',
      focus: '#3b82f6',
    },
    // Status colors - Clear and distinct
    status: {
      todo: '#64748b',
      todoBackground: 'rgba(100, 116, 139, 0.12)',
      inProgress: '#3b82f6',
      inProgressBackground: 'rgba(59, 130, 246, 0.12)',
      done: '#22c55e',
      doneBackground: 'rgba(34, 197, 94, 0.12)',
      pending: '#f59e0b',
      pendingBackground: 'rgba(245, 158, 11, 0.12)',
      cancelled: '#ef4444',
      cancelledBackground: 'rgba(239, 68, 68, 0.12)',
      onHold: '#8b5cf6',
      onHoldBackground: 'rgba(139, 92, 246, 0.12)',
    },
    // Priority colors
    priority: {
      low: '#22c55e',
      lowBackground: 'rgba(34, 197, 94, 0.12)',
      medium: '#f59e0b',
      mediumBackground: 'rgba(245, 158, 11, 0.12)',
      high: '#ef4444',
      highBackground: 'rgba(239, 68, 68, 0.12)',
      urgent: '#dc2626',
      urgentBackground: 'rgba(220, 38, 38, 0.15)',
    },
    // Tag colors for categorization
    tags: {
      blue: { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa' },
      green: { bg: 'rgba(34, 197, 94, 0.15)', text: '#4ade80' },
      yellow: { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24' },
      red: { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171' },
      purple: { bg: 'rgba(139, 92, 246, 0.15)', text: '#a78bfa' },
      pink: { bg: 'rgba(236, 72, 153, 0.15)', text: '#f472b6' },
      cyan: { bg: 'rgba(6, 182, 212, 0.15)', text: '#22d3ee' },
      gray: { bg: 'rgba(100, 116, 139, 0.15)', text: '#94a3b8' },
    },
    // Gradients inside colors for backwards compatibility
    gradients: {
      primary: ['#3b82f6', '#2563eb'] as const,
      primaryVibrant: ['#3b82f6', '#1d4ed8'] as const,
      secondary: ['#6366f1', '#4f46e5'] as const,
      success: ['#22c55e', '#16a34a'] as const,
      warning: ['#f59e0b', '#d97706'] as const,
      error: ['#ef4444', '#dc2626'] as const,
      info: ['#06b6d4', '#0891b2'] as const,
      tertiary: ['#8b5cf6', '#7c3aed'] as const,
      dark: ['#1e2230', '#0f1117'] as const,
      premium: ['#f59e0b', '#d97706'] as const,
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
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 20,
    xxxl: 24,
    full: 9999,
  },
  typography: {
    largeTitle: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 40,
      letterSpacing: -0.5,
    },
    title1: {
      fontSize: 26,
      fontWeight: '700' as const,
      lineHeight: 32,
      letterSpacing: -0.3,
    },
    title2: {
      fontSize: 22,
      fontWeight: '600' as const,
      lineHeight: 28,
      letterSpacing: -0.2,
    },
    title3: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
    headline: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 22,
    },
    body: {
      fontSize: 15,
      fontWeight: '400' as const,
      lineHeight: 22,
    },
    bodyMedium: {
      fontSize: 15,
      fontWeight: '500' as const,
      lineHeight: 22,
    },
    callout: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    subhead: {
      fontSize: 13,
      fontWeight: '400' as const,
      lineHeight: 18,
    },
    footnote: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
    },
    caption: {
      fontSize: 11,
      fontWeight: '500' as const,
      lineHeight: 14,
    },
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
      elevation: 12,
    },
    focus: {
      shadowColor: '#3b82f6',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    glow: {
      shadowColor: '#3b82f6',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
      elevation: 8,
    },
  },
  animation: {
    fast: 150,
    normal: 250,
    slow: 400,
    spring: {
      friction: 8,
      tension: 40,
    },
    springBouncy: {
      friction: 6,
      tension: 50,
    },
  },
  // Gradients - Professional, subtle gradients
  gradients: {
    primary: ['#3b82f6', '#2563eb'] as const,
    primaryVibrant: ['#3b82f6', '#1d4ed8'] as const,
    success: ['#22c55e', '#16a34a'] as const,
    warning: ['#f59e0b', '#d97706'] as const,
    error: ['#ef4444', '#dc2626'] as const,
    dark: ['#1e2230', '#0f1117'] as const,
  },
};

// Helper functions
export const getStatusColor = (status: string) => {
  const statusMap: Record<string, string> = {
    'todo': theme.colors.status.todo,
    'not_started': theme.colors.status.todo,
    'in_progress': theme.colors.status.inProgress,
    'active': theme.colors.status.inProgress,
    'done': theme.colors.status.done,
    'completed': theme.colors.status.done,
    'pending': theme.colors.status.pending,
    'waiting': theme.colors.status.pending,
    'cancelled': theme.colors.status.cancelled,
    'rejected': theme.colors.status.cancelled,
    'on_hold': theme.colors.status.onHold,
  };
  return statusMap[status] || theme.colors.text.muted;
};

export const getStatusBackground = (status: string) => {
  const statusMap: Record<string, string> = {
    'todo': theme.colors.status.todoBackground,
    'not_started': theme.colors.status.todoBackground,
    'in_progress': theme.colors.status.inProgressBackground,
    'active': theme.colors.status.inProgressBackground,
    'done': theme.colors.status.doneBackground,
    'completed': theme.colors.status.doneBackground,
    'pending': theme.colors.status.pendingBackground,
    'waiting': theme.colors.status.pendingBackground,
    'cancelled': theme.colors.status.cancelledBackground,
    'rejected': theme.colors.status.cancelledBackground,
    'on_hold': theme.colors.status.onHoldBackground,
  };
  return statusMap[status] || 'rgba(255, 255, 255, 0.05)';
};

export const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    'todo': 'Yapılacak',
    'not_started': 'Başlanmadı',
    'in_progress': 'Devam Ediyor',
    'active': 'Aktif',
    'done': 'Tamamlandı',
    'completed': 'Tamamlandı',
    'pending': 'Beklemede',
    'waiting': 'Bekliyor',
    'cancelled': 'İptal Edildi',
    'rejected': 'Reddedildi',
    'on_hold': 'Bekletiliyor',
  };
  return statusMap[status] || status;
};

export const getPriorityColor = (priority: string) => {
  const priorityMap: Record<string, string> = {
    'low': theme.colors.priority.low,
    'medium': theme.colors.priority.medium,
    'high': theme.colors.priority.high,
    'urgent': theme.colors.priority.urgent,
  };
  return priorityMap[priority] || theme.colors.text.muted;
};

export const getPriorityBackground = (priority: string) => {
  const priorityMap: Record<string, string> = {
    'low': theme.colors.priority.lowBackground,
    'medium': theme.colors.priority.mediumBackground,
    'high': theme.colors.priority.highBackground,
    'urgent': theme.colors.priority.urgentBackground,
  };
  return priorityMap[priority] || 'rgba(255, 255, 255, 0.05)';
};

export const getPriorityLabel = (priority: string) => {
  const priorityMap: Record<string, string> = {
    'low': 'Düşük',
    'medium': 'Orta',
    'high': 'Yüksek',
    'urgent': 'Acil',
  };
  return priorityMap[priority] || priority;
};

export const getTagColor = (color: string) => {
  return theme.colors.tags[color as keyof typeof theme.colors.tags] || theme.colors.tags.gray;
};

export type Theme = typeof theme;
