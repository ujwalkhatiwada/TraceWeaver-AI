import React from 'react';
import {
  ShieldAlert,
  Play,
  FileText,
  RotateCcw,
  Upload,
  Cpu,
  Terminal,
  MessageSquare,
  LayoutTemplate,
  Laptop,
} from 'lucide-react';
import { DiskImageMetadata } from '../types/forensics.ts';
import { ThemeConfig, WebsiteTheme } from '../types/themes.ts';
import { ThemeSelector } from './ThemeSelector.tsx';

interface HeaderProps {
  metadata: DiskImageMetadata;
  isProcessing: boolean;
  onRunPipeline: () => void;
  onResetDemo: (scenario: 'ironvault' | 'antiforensics' | 'flashcorrupt') => void;
  onOpenReport: () => void;
  onOpenPython: () => void;
  onOpenChat: () => void;
  onUploadDisk: (file: File) => void;
  currentScenario: string;
  currentTheme: WebsiteTheme;
  themeConfig: ThemeConfig;
  onSelectTheme: (theme: WebsiteTheme) => void;
  activeView: 'workbench' | 'portfolio';
  onToggleView: (view: 'workbench' | 'portfolio') => void;
}

export const Header: React.FC<HeaderProps> = ({
  metadata,
  isProcessing,
  onRunPipeline,
  onResetDemo,
  onOpenReport,
  onOpenPython,
  onOpenChat,
  onUploadDisk,
  currentScenario,
  currentTheme,
  themeConfig,
  onSelectTheme,
  activeView,
  onToggleView,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <header className={`border-b sticky top-0 z-40 ${themeConfig.headerClass}`}>
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-base">
                TraceWeaver-AI
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700 border border-neutral-300">
                Entropy + LLM
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 hidden sm:block">
              AI-Driven Digital Forensics & Fragment Reconstruction Workbench
            </p>
          </div>
        </div>

        {/* Navigation Tabs (Plain Portfolio Style) */}
        <nav className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg border border-neutral-200 text-xs">
          <button
            onClick={() => onToggleView('portfolio')}
            className={`px-3 py-1.5 rounded-md font-medium transition-none flex items-center gap-1.5 ${
              activeView === 'portfolio'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span>Portfolio View</span>
          </button>
          <button
            onClick={() => onToggleView('workbench')}
            className={`px-3 py-1.5 rounded-md font-medium transition-none flex items-center gap-1.5 ${
              activeView === 'workbench'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Forensic Workbench</span>
          </button>
        </nav>

        {/* Controls & Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Theme Selector */}
          <ThemeSelector
            currentTheme={currentTheme}
            onSelectTheme={onSelectTheme}
          />

          {/* Scenario Select */}
          <select
            value={currentScenario}
            onChange={(e) => onResetDemo(e.target.value as any)}
            className="bg-white border border-neutral-300 text-neutral-800 text-xs rounded-md px-2 py-1 focus:outline-none focus:border-blue-600"
            title="Load forensic benchmark scenario"
          >
            <option value="ironvault">Scenario: Operation IronVault</option>
            <option value="antiforensics">Scenario: Anti-Forensics Zeroing</option>
            <option value="flashcorrupt">Scenario: Flash Media Slack</option>
          </select>

          {/* Hidden File Input for Custom .dd */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".dd,.raw,.img,.bin"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) onUploadDisk(e.target.files[0]);
            }}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-700 text-xs px-2.5 py-1.5 rounded-md"
            title="Load custom raw disk image"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Upload .dd</span>
          </button>

          {/* AI Chatbot Trigger Button */}
          <button
            onClick={onOpenChat}
            className="inline-flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-medium text-xs px-2.5 py-1.5 rounded-md shadow-xs"
            title="Ask AI if your data can be retrieved"
          >
            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
            <span>AI Advisor</span>
          </button>

          {/* Python Code Modal Trigger */}
          <button
            onClick={onOpenPython}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-700 text-xs px-2.5 py-1.5 rounded-md"
            title="View Python scripts (digler, carving, integrity, prioritize)"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Python Code</span>
          </button>

          {/* Executive Report Modal */}
          <button
            onClick={onOpenReport}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-700 text-xs px-2.5 py-1.5 rounded-md"
            title="Generate Executive Incident Report"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">DFIR Report</span>
          </button>

          {/* Run Pipeline Button */}
          <button
            onClick={onRunPipeline}
            disabled={isProcessing}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium cursor-pointer shadow-xs ${themeConfig.accentBtnClass}`}
          >
            {isProcessing ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                <span>Carving...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Execute Pipeline</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
