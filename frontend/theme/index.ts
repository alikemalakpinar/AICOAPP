// Professional Corporate Dark Theme - AICO Project Management
// Clean, minimal, enterprise-focused design with neutral tones

export const theme = {
  colors: {
    // Background colors - Sophisticated dark neutrals
    background: {
      primary: '#0a0b0d',
      secondary: '#111214',
      tertiary: '#18191c',
      card: '#1c1d21',
      cardSolid: '#1c1d21',
      cardHover: '#222428',
      elevated: '#26282c',
      input: '#151618',
      overlay: 'rgba(0, 0, 0, 0.75)',
      glass: 'rgba(28, 29, 33, 0.85)',
    },
    // Text colors - Clear hierarchy with warm neutrals
    text: {
      primary: '#f4f4f5',
      secondary: '#a1a1aa',
      tertiary: '#71717a',
      muted: '#52525b',
      disabled: '#3f3f46',
      inverse: '#09090b',
      link: '#60a5fa',
    },
    // Accent colors - Professional Slate Blue palette
    accent: {
      primary: '#6366f1',
      primaryLight: '#818cf8',
      primaryDark: '#4f46e5',
      secondary: '#8b5cf6',
      secondaryLight: '#a78bfa',
      tertiary: '#06b6d4',
      hover: '#7c7cf8',
      muted: 'rgba(99, 102, 241, 0.15)',
      // Backwards compatibility
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#06b6d4',
    },
    // Semantic colors - Muted, professional tones
    semantic: {
      success: '#10b981',
      successMuted: 'rgba(16, 185, 129, 0.12)',
      warning: '#f59e0b',
      warningMuted: 'rgba(245, 158, 11, 0.12)',
      error: '#ef4444',
      errorMuted: 'rgba(239, 68, 68, 0.12)',
      info: '#06b6d4',
      infoMuted: 'rgba(6, 182, 212, 0.12)',
    },
    // Border colors - Subtle definition
    border: {
      primary: '#27272a',
      light: '#27272a',
      medium: '#3f3f46',
      strong: '#52525b',
      focus: '#6366f1',
    },
    // Status colors - Professional and distinct
    status: {
      todo: '#71717a',
      todoBackground: 'rgba(113, 113, 122, 0.10)',
      inProgress: '#6366f1',
      inProgressBackground: 'rgba(99, 102, 241, 0.10)',
      done: '#10b981',
      doneBackground: 'rgba(16, 185, 129, 0.10)',
      pending: '#f59e0b',
      pendingBackground: 'rgba(245, 158, 11, 0.10)',
      cancelled: '#ef4444',
      cancelledBackground: 'rgba(239, 68, 68, 0.10)',
      onHold: '#8b5cf6',
      onHoldBackground: 'rgba(139, 92, 246, 0.10)',
      review: '#06b6d4',
      reviewBackground: 'rgba(6, 182, 212, 0.10)',
    },
    // Priority colors - Clear urgency levels
    priority: {
      low: '#10b981',
      lowBackground: 'rgba(16, 185, 129, 0.10)',
      medium: '#f59e0b',
      mediumBackground: 'rgba(245, 158, 11, 0.10)',
      high: '#f97316',
      highBackground: 'rgba(249, 115, 22, 0.10)',
      critical: '#ef4444',
      criticalBackground: 'rgba(239, 68, 68, 0.12)',
      urgent: '#ef4444',
      urgentBackground: 'rgba(239, 68, 68, 0.12)',
    },
    // Tag colors - Muted professional tones
    tags: {
      blue: { bg: 'rgba(99, 102, 241, 0.12)', text: '#818cf8' },
      green: { bg: 'rgba(16, 185, 129, 0.12)', text: '#34d399' },
      yellow: { bg: 'rgba(245, 158, 11, 0.12)', text: '#fbbf24' },
      red: { bg: 'rgba(239, 68, 68, 0.12)', text: '#f87171' },
      purple: { bg: 'rgba(139, 92, 246, 0.12)', text: '#a78bfa' },
      pink: { bg: 'rgba(236, 72, 153, 0.12)', text: '#f472b6' },
      cyan: { bg: 'rgba(6, 182, 212, 0.12)', text: '#22d3ee' },
      gray: { bg: 'rgba(113, 113, 122, 0.12)', text: '#a1a1aa' },
      indigo: { bg: 'rgba(99, 102, 241, 0.12)', text: '#a5b4fc' },
    },
    // Gradients - Subtle, professional
    gradients: {
      primary: ['#6366f1', '#4f46e5'] as const,
      primaryVibrant: ['#818cf8', '#6366f1'] as const,
      secondary: ['#8b5cf6', '#7c3aed'] as const,
      success: ['#10b981', '#059669'] as const,
      warning: ['#f59e0b', '#d97706'] as const,
      error: ['#ef4444', '#dc2626'] as const,
      info: ['#06b6d4', '#0891b2'] as const,
      tertiary: ['#06b6d4', '#0891b2'] as const,
      dark: ['#1c1d21', '#0a0b0d'] as const,
      premium: ['#f59e0b', '#d97706'] as const,
      neutral: ['#3f3f46', '#27272a'] as const,
      glass: ['rgba(28, 29, 33, 0.9)', 'rgba(10, 11, 13, 0.95)'] as const,
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
      shadowOpacity: 0.25,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 12,
      elevation: 8,
    },
    xl: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 12,
    },
    focus: {
      shadowColor: '#6366f1',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 4,
    },
    glow: {
      shadowColor: '#6366f1',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
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
    springGentle: {
      friction: 10,
      tension: 30,
    },
  },
  // Top-level gradients for backwards compatibility
  gradients: {
    primary: ['#6366f1', '#4f46e5'] as const,
    primaryVibrant: ['#818cf8', '#6366f1'] as const,
    secondary: ['#8b5cf6', '#7c3aed'] as const,
    success: ['#10b981', '#059669'] as const,
    warning: ['#f59e0b', '#d97706'] as const,
    error: ['#ef4444', '#dc2626'] as const,
    info: ['#06b6d4', '#0891b2'] as const,
    tertiary: ['#06b6d4', '#0891b2'] as const,
    dark: ['#1c1d21', '#0a0b0d'] as const,
    neutral: ['#3f3f46', '#27272a'] as const,
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
    'review': theme.colors.status.review,
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
    'review': theme.colors.status.reviewBackground,
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
    'review': 'İnceleniyor',
  };
  return statusMap[status] || status;
};

export const getPriorityColor = (priority: string) => {
  const priorityMap: Record<string, string> = {
    'low': theme.colors.priority.low,
    'medium': theme.colors.priority.medium,
    'high': theme.colors.priority.high,
    'critical': theme.colors.priority.critical,
    'urgent': theme.colors.priority.urgent,
  };
  return priorityMap[priority] || theme.colors.text.muted;
};

export const getPriorityBackground = (priority: string) => {
  const priorityMap: Record<string, string> = {
    'low': theme.colors.priority.lowBackground,
    'medium': theme.colors.priority.mediumBackground,
    'high': theme.colors.priority.highBackground,
    'critical': theme.colors.priority.criticalBackground,
    'urgent': theme.colors.priority.urgentBackground,
  };
  return priorityMap[priority] || 'rgba(255, 255, 255, 0.05)';
};

export const getPriorityLabel = (priority: string) => {
  const priorityMap: Record<string, string> = {
    'low': 'Düşük',
    'medium': 'Orta',
    'high': 'Yüksek',
    'critical': 'Kritik',
    'urgent': 'Acil',
  };
  return priorityMap[priority] || priority;
};

export const getTagColor = (color: string) => {
  return theme.colors.tags[color as keyof typeof theme.colors.tags] || theme.colors.tags.gray;
};

export type Theme = typeof theme;
