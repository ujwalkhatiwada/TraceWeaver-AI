import React from 'react';
import {
  HardDrive,
  Cpu,
  CheckCircle2,
  SlidersHorizontal,
  LayoutDashboard,
  ArrowRight,
} from 'lucide-react';
import { ThemeConfig } from '../types/themes.ts';

interface PipelineStepsBarProps {
  currentStep: number;
  onSelectStep: (step: number) => void;
  themeConfig: ThemeConfig;
}

export const PipelineStepsBar: React.FC<PipelineStepsBarProps> = ({
  currentStep,
  onSelectStep,
  themeConfig,
}) => {
  const steps = [
    {
      id: 1,
      title: 'Storage Acquisition',
      file: 'generate_demo_image.py',
      label: 'Step 1: Damaged Disk',
      desc: 'Embeds real files with fragmentation, deletion, truncation & corruption.',
      icon: HardDrive,
    },
    {
      id: 2,
      title: 'Intelligent Carving',
      file: 'carving.py & digler',
      label: 'Objective 01',
      desc: 'Magic signature scan & bi-directional cluster fragment stitching.',
      icon: Cpu,
    },
    {
      id: 3,
      title: 'Integrity Assessment',
      file: 'integrity.py & py-rec',
      label: 'Objective 02',
      desc: 'Shannon entropy & structural parsers -> Intact / Partial / Corrupted.',
      icon: CheckCircle2,
    },
    {
      id: 4,
      title: 'AI Prioritization',
      file: 'prioritize.py',
      label: 'Objective 03',
      desc: 'Category weights + keyword relevance -> Priority score & rationale.',
      icon: SlidersHorizontal,
    },
    {
      id: 5,
      title: 'Decision Support',
      file: 'app.py',
      label: 'Objective 04',
      desc: 'Ranked ledger, hex/ASCII inspector, previews & plain-English AI advice.',
      icon: LayoutDashboard,
    },
  ];

  return (
    <div className={`border-b py-2 px-4 overflow-x-auto ${themeConfig.headerClass}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between min-w-[760px] gap-2">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isPassed = currentStep > step.id;

          return (
            <React.Fragment key={step.id}>
              <button
                onClick={() => onSelectStep(step.id)}
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border text-left cursor-pointer transition-none ${
                  isActive
                    ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs'
                    : isPassed
                    ? 'bg-white border-neutral-200 text-neutral-800 hover:bg-neutral-50'
                    : 'bg-neutral-50/60 border-neutral-200 text-neutral-500 hover:bg-neutral-100'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded flex items-center justify-center shrink-0 text-xs font-bold ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : isPassed
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-neutral-200 text-neutral-600'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono uppercase text-neutral-500 font-semibold">
                      {step.label}
                    </span>
                    <span className="text-[9px] font-mono text-neutral-400 hidden xl:inline">
                      ({step.file})
                    </span>
                  </div>
                  <div className="text-xs font-semibold truncate leading-tight">
                    {step.title}
                  </div>
                </div>
              </button>

              {idx < steps.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-neutral-400 shrink-0 mx-0.5" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
