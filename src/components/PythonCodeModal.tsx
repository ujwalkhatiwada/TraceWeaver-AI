import React, { useState } from 'react';
import {
  X,
  Terminal,
  Copy,
  Check,
  Download,
  FileCode,
} from 'lucide-react';
import { PYTHON_SCRIPTS } from '../forensics/pythonArtifacts.ts';
import { ThemeConfig } from '../types/themes.ts';

interface PythonCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeConfig: ThemeConfig;
}

export const PythonCodeModal: React.FC<PythonCodeModalProps> = ({
  isOpen,
  onClose,
  themeConfig,
}) => {
  if (!isOpen) return null;

  const scriptKeys = Object.keys(PYTHON_SCRIPTS);
  const [activeTab, setActiveTab] = useState<string>('digler_carver.py');
  const [copied, setCopied] = useState(false);

  const currentScript = PYTHON_SCRIPTS[activeTab] || PYTHON_SCRIPTS['carving.py'];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentScript.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentScript.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = currentScript.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className={`border rounded-xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden ${themeConfig.cardClass}`}>
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${themeConfig.borderClass} ${themeConfig.headerClass}`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-blue-50 border border-blue-200 text-blue-600">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">
                  Executable Python & Digler Source Implementations
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                  Ready to Execute
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                Complete, runnable Python scripts integrating Digler and Data Recovery Using Python.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-white hover:bg-neutral-50 border border-neutral-300 text-xs text-neutral-700 transition-none"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-white hover:bg-neutral-50 border border-neutral-300 text-xs text-neutral-700 transition-none"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 transition-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-neutral-200 bg-neutral-50 px-3 overflow-x-auto gap-1">
          {scriptKeys.map((key) => {
            const item = PYTHON_SCRIPTS[key];
            const isActive = activeTab === key;

            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-mono border-b-2 transition-none shrink-0 ${
                  isActive
                    ? 'border-blue-600 text-blue-600 bg-white font-semibold'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>{item.filename}</span>
              </button>
            );
          })}
        </div>

        {/* Script Details Bar */}
        <div className="bg-neutral-100/70 px-4 py-2 border-b border-neutral-200 flex flex-wrap items-center justify-between text-xs font-mono text-neutral-600 gap-2">
          <div className="flex items-center gap-3">
            <span className="text-blue-700 font-bold">{currentScript.step}:</span>
            <span className="text-neutral-800">{currentScript.objective}</span>
          </div>
          <span className="text-[11px] text-neutral-500">{currentScript.description}</span>
        </div>

        {/* Code Content View */}
        <div className="flex-1 overflow-y-auto p-4 bg-[#18181B] text-[#F4F4F5] font-mono text-xs leading-relaxed select-text">
          <pre className="whitespace-pre overflow-x-auto text-[11px] sm:text-xs">
            <code>{currentScript.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
