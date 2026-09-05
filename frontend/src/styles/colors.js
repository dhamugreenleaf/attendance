export const THEME_COLORS = [
  '#1A365D', // Navy (Default)
  '#7C3AED', // Purple
  '#059669', // Green
  '#DC2626', // Red
  '#EA580C', // Orange
];

export const getDynamicColors = (theme, primaryColor) => {
  const isDark = theme === 'dark';
  
  return {
    // Brand
    primary: primaryColor,
    primaryDark: isDark ? '#0A1322' : '#0D1B2E',
    primaryLight: isDark ? '#2B548F' : `${primaryColor}CC`, // approx 80% opacity
    
    // Backgrounds
    background: isDark ? '#0F172A' : '#F8FAFC',
    surface: isDark ? '#1E293B' : '#FFFFFF',
    surfaceSecondary: isDark ? '#334155' : '#F1F5F9',
    
    // Text
    textPrimary: isDark ? '#F8FAFC' : '#0F172A',
    textSecondary: isDark ? '#CBD5E1' : '#475569',
    textMuted: isDark ? '#64748B' : '#94A3B8',
    
    // Border
    border: isDark ? '#334155' : '#E2E8F0',
    divider: isDark ? '#1E293B' : '#F1F5F9',
    
    // Semantic
    success: '#10B981',
    successLight: isDark ? 'rgba(16, 185, 129, 0.1)' : '#D1FAE5',
    warning: '#F59E0B',
    warningLight: isDark ? 'rgba(245, 158, 11, 0.1)' : '#FEF3C7',
    error: '#EF4444',
    errorLight: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEE2E2',
    info: '#3B82F6',
    infoLight: isDark ? 'rgba(59, 130, 246, 0.1)' : '#DBEAFE',
    neutral: '#64748B',
    neutralLight: isDark ? 'rgba(148, 163, 184, 0.1)' : '#F1F5F9',
  };
};

export const colors = getDynamicColors('light', THEME_COLORS[0]);

