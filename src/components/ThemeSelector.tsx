import React from 'react';
import {
  Palette,
  Check,
  ChevronDown,
} from 'lucide-react';
import { WebsiteTheme, ThemeConfig, THEMES } from '../types/themes.ts';

interface ThemeSelectorProps {
  currentTheme: WebsiteTheme;
  onSelectTheme: (theme: WebsiteTheme) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onSelectTheme,
}) => {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <Palette className="w-3.5 h-3.5 text-neutral-500" />
      <span className="text-[11px] text-neutral-500 font-mono hidden md:inline">Theme:</span>
      <select
        value={currentTheme}
        onChange={(e) => onSelectTheme(e.target.value as WebsiteTheme)}
        className="text-xs bg-white text-neutral-800 border border-neutral-300 rounded px-2 py-1 focus:outline-none focus:border-blue-600 font-sans cursor-pointer"
        title="Select website theme"
      >
        <option value="plain_portfolio">Plain Portfolio (Ujwal Recommendation)</option>
        <option value="clean_white">1. Clean White</option>
        <option value="soft_beige">2. Soft Beige (#F7F5EF)</option>
        <option value="classic_blue">3. Classic Blue (Navy & White)</option>
        <option value="simple_gray">4. Simple Gray</option>
      </select>
    </div>
  );
};
