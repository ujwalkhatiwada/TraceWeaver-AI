export type WebsiteTheme =
  | 'clean_white'
  | 'soft_beige'
  | 'classic_blue'
  | 'simple_gray'
  | 'plain_portfolio';

export interface ThemeConfig {
  id: WebsiteTheme;
  name: string;
  description: string;
  bodyClass: string;
  cardClass: string;
  headerClass: string;
  textClass: string;
  mutedTextClass: string;
  accentClass: string;
  accentBtnClass: string;
  secondaryBtnClass: string;
  borderClass: string;
  badgeClass: string;
  codeBgClass: string;
}

export const THEMES: Record<WebsiteTheme, ThemeConfig> = {
  clean_white: {
    id: 'clean_white',
    name: 'Clean White',
    description: 'White background, black text, blue accent (#2563EB), clean borders, minimal animation.',
    bodyClass: 'bg-white text-neutral-900',
    cardClass: 'bg-white border border-neutral-200 shadow-xs rounded-lg',
    headerClass: 'bg-white/95 border-b border-neutral-200 text-neutral-900 backdrop-blur-xs',
    textClass: 'text-neutral-900',
    mutedTextClass: 'text-neutral-600',
    accentClass: 'text-blue-600',
    accentBtnClass: 'bg-blue-600 hover:bg-blue-700 text-white font-medium',
    secondaryBtnClass: 'bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300',
    borderClass: 'border-neutral-200',
    badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200',
    codeBgClass: 'bg-neutral-900 text-neutral-100',
  },
  soft_beige: {
    id: 'soft_beige',
    name: 'Soft Beige',
    description: '#F7F5EF warm background, dark brown/black text, #C8A96B warm gold accent.',
    bodyClass: 'bg-[#F7F5EF] text-[#2C2416]',
    cardClass: 'bg-white/80 border border-[#E3DEC9] shadow-xs rounded-xl',
    headerClass: 'bg-[#F7F5EF]/95 border-b border-[#E3DEC9] text-[#2C2416] backdrop-blur-xs',
    textClass: 'text-[#2C2416]',
    mutedTextClass: 'text-[#6D5D4B]',
    accentClass: 'text-[#9F7A2D]',
    accentBtnClass: 'bg-[#9F7A2D] hover:bg-[#866624] text-white font-medium rounded-lg',
    secondaryBtnClass: 'bg-white hover:bg-[#EFECE1] text-[#2C2416] border border-[#DDD6C0] rounded-lg',
    borderClass: 'border-[#E3DEC9]',
    badgeClass: 'bg-[#EFECE1] text-[#866624] border border-[#DDD6C0]',
    codeBgClass: 'bg-[#1E1912] text-[#F3EFE6]',
  },
  classic_blue: {
    id: 'classic_blue',
    name: 'Classic Blue',
    description: 'White background, navy headings, light blue sections, professional collegiate style.',
    bodyClass: 'bg-slate-50 text-slate-900',
    cardClass: 'bg-white border border-slate-200 shadow-xs rounded-md',
    headerClass: 'bg-[#0f1e36] text-white border-b border-slate-800 shadow-xs',
    textClass: 'text-slate-900',
    mutedTextClass: 'text-slate-600',
    accentClass: 'text-[#1d4ed8]',
    accentBtnClass: 'bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-semibold rounded-md',
    secondaryBtnClass: 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-md',
    borderClass: 'border-slate-200',
    badgeClass: 'bg-blue-50 text-[#1d4ed8] border border-blue-200',
    codeBgClass: 'bg-[#0c1524] text-slate-100',
  },
  simple_gray: {
    id: 'simple_gray',
    name: 'Simple Gray',
    description: 'Light gray background, white content cards, black text, dark practical accent.',
    bodyClass: 'bg-[#eceff1] text-[#212121]',
    cardClass: 'bg-white border border-[#cfd8dc] shadow-xs rounded-md',
    headerClass: 'bg-white border-b border-[#cfd8dc] text-[#212121]',
    textClass: 'text-[#212121]',
    mutedTextClass: 'text-[#546e7a]',
    accentClass: 'text-[#263238]',
    accentBtnClass: 'bg-[#263238] hover:bg-[#37474f] text-white font-medium rounded-md',
    secondaryBtnClass: 'bg-white hover:bg-slate-100 text-[#212121] border border-[#cfd8dc] rounded-md',
    borderClass: 'border-[#cfd8dc]',
    badgeClass: 'bg-[#eceff1] text-[#263238] border border-[#b0bec5]',
    codeBgClass: 'bg-[#1a202c] text-white',
  },
  plain_portfolio: {
    id: 'plain_portfolio',
    name: 'Plain Portfolio (Ujwal Recommended)',
    description: 'White #FFFFFF background, #222222 text, #666666 secondary, #2563EB accent, 6-10px radius, zero animation.',
    bodyClass: 'bg-[#FFFFFF] text-[#222222]',
    cardClass: 'bg-white border border-[#E5E7EB] rounded-lg shadow-none',
    headerClass: 'bg-white border-b border-[#E5E7EB] text-[#222222]',
    textClass: 'text-[#222222]',
    mutedTextClass: 'text-[#666666]',
    accentClass: 'text-[#2563EB]',
    accentBtnClass: 'bg-[#2563EB] hover:bg-blue-700 text-white font-medium rounded-md transition-none',
    secondaryBtnClass: 'bg-white hover:bg-[#F9FAFB] text-[#222222] border border-[#E5E7EB] rounded-md transition-none',
    borderClass: 'border-[#E5E7EB]',
    badgeClass: 'bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]',
    codeBgClass: 'bg-[#18181B] text-[#F4F4F5]',
  },
};
