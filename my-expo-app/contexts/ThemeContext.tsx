import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { ViewStyle, TextStyle } from 'react-native';

export type ThemeType = 'light' | 'dark';

export interface ThemeColors {
  // Background colors
   background: string;
  backgroundHex: string;
  surface: string;
  surfaceSecondary: string;
  headerBackground: string;
  
  // Tab Bar
  tabBarActive: string;
  tabBarInactive: string;
  tabBarActiveBg: string;
  tabBarInactiveBg: string;

  // Text colors
  text: string;
  textSecondary: string;
  textTertiary: string;

  // Profile container
  profileGradientStart: string;
  profileGradientEnd: string;

  // Menu items
  menuItemBackground: string;
  menuItemBorder: string;
  menuItemText: string;
  menuItemTextSecondary: string;

  // Borders and accents
  border: string;
  accent: string;
}

export const lightTheme: ThemeColors = {
  background: 'bg-cream',
  backgroundHex: '#FEFBEA',
  surface: 'bg-white',
  surfaceSecondary: 'bg-yellow-50',
  headerBackground: 'bg-white',

  tabBarActive: '#F472B6',
  tabBarInactive: '#9CA3AF',
  tabBarActiveBg: 'bg-pink-100',
  tabBarInactiveBg: 'bg-yellow-50',

  text: 'text-gray-900',
  textSecondary: 'text-gray-700',
  textTertiary: 'text-gray-500',

  profileGradientStart: 'from-brand-yellow',
  profileGradientEnd: 'to-brand-pink',

  menuItemBackground: 'bg-white',
  menuItemBorder: 'border-yellow-100',
  menuItemText: 'text-gray-900',
  menuItemTextSecondary: 'text-gray-600',

  border: 'border-yellow-200',
  accent: 'bg-brand-yellow',
};

export const darkTheme: ThemeColors = {
  background: 'bg-[#1c1c14]',
  backgroundHex: '#1c1c14',
  surface: 'bg-[#2d2d24]',
  surfaceSecondary: 'bg-[#3e3e34]',
  headerBackground: 'bg-[#2d2d24]',

  tabBarActive: '#F472B6',
  tabBarInactive: '#6B7280',
  tabBarActiveBg: 'bg-[#3d2d34]',
  tabBarInactiveBg: 'bg-[#2d2d24]',

  text: 'text-cream',
  textSecondary: 'text-gray-200',
  textTertiary: 'text-gray-300',

  profileGradientStart: 'from-brand-yellow',
  profileGradientEnd: 'to-brand-pink',

  menuItemBackground: 'bg-[#2d2d24]',
  menuItemBorder: 'border-[#3e3e34]',
  menuItemText: 'text-cream',
  menuItemTextSecondary: 'text-gray-300',

  border: 'border-[#4e4e44]',
  accent: 'bg-brand-yellow',
};

interface ThemeContextType {
  theme: ThemeType;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Determine initial theme based on time of day
  // Light: 6:00 AM to 6:00 PM (18:00)
  // Dark: 6:00 PM to 6:00 AM
  const getAutoTheme = (): ThemeType => {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18 ? 'light' : 'dark';
  };

  const [theme, setThemeState] = useState<ThemeType>(getAutoTheme());

  // Check time on mount and update if necessary
  useEffect(() => {
    setThemeState(getAutoTheme());
    
    // Optional: Refresh periodically or when app returns to foreground
    // For now, simple on-mount check is most stable
  }, []);

  const colors = theme === 'light' ? lightTheme : darkTheme;

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
  };

  const value = useMemo(() => ({
    theme,
    colors,
    toggleTheme,
    setTheme,
  }), [theme, colors]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
