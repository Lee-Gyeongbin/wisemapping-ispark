/*
 *    Copyright [2007-2025] [wisemapping]
 *
 *   Licensed under WiseMapping Public License, Version 1.0 (the "License").
 *   It is basically the Apache License, Version 2.0 (the "License") plus the
 *   "powered by wisemapping" text requirement on every single page;
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the license at
 *
 *       https://github.com/wisemapping/wisemapping-open-source/blob/main/LICENSE.md
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { PaletteMode } from '@mui/material';

interface ThemeContextType {
  mode: PaletteMode;
  toggleMode: () => void;
  initializeThemeFromSystem: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

// 앱 기본 테마를 라이트로 고정. 시스템 테마(prefers-color-scheme) 미사용 → Edge 등에서 배경색 이슈 방지
const DEFAULT_THEME_MODE: PaletteMode = 'light';

export const AppThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<PaletteMode>(() => {
    const savedMode = localStorage.getItem('themeMode') as PaletteMode;
    if (savedMode === 'light' || savedMode === 'dark') {
      return savedMode;
    }
    return DEFAULT_THEME_MODE;
  });

  const toggleMode = () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('themeMode', newMode);
  };

  const initializeThemeFromSystem = () => {
    if (!localStorage.getItem('themeMode')) {
      setMode(DEFAULT_THEME_MODE);
      localStorage.setItem('themeMode', DEFAULT_THEME_MODE);
    }
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleMode, initializeThemeFromSystem }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within an AppThemeProvider');
  }
  return context;
};
