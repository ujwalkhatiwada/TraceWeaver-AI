import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  FileQuestion,
  Scale,
  Wrench,
  Compass,
} from 'lucide-react';
import { EvidenceFragment, AiAnalysisResult } from '../types/forensics.ts';

interface AiAnalysisDrawerProps {
  fragment: EvidenceFragment | null;
  onClose: () => void;
  onUpdateAiAnalysis: (fragmentId: string, result: AiAnalysisResult) => void;
}

export const AiAnalysisDrawer: React.FC<AiAnalysisDrawerProps> = ({
  fragment,
  onClose,
  onUpdateAiAnalysis,
}) => {
  if (!fragment) return null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAiAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/gemini/analyze-fragment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fragment: {
            id: fragment.id,
            name: fragment.name,
            originalName: fragment.originalName,
            fileType: fragment.fileType,
            category: fragment.category,
            status: fragment.status,
            integrityFactor: fragment.integrityFactor,
            sizeBytes: fragment.sizeBytes,
            sectorStart: fragment.sectorStart,
            sectorEnd: fragment.sectorEnd,
            entropy: fragment.entropy,
            nullByteRatio: fragment.nullByteRatio,
            priorityScore: fragment.priorityScore,
            defects: fragment.defects,
            fragments: fragment.chunks,
            extractedStrings: fragment.extractedStrings,
          },
          caseContext: {
            caseType: 'Corporate Fraud, Embezzlement & Emergency Zero-Wipe Attempt',
            keywords: ['SWIFT', 'wire', 'offshore', 'Cayman', 'Zurich', 'delete', 'confidential'],
          },
        }),
      });

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      onUpdateAiAnalysis(fragment.id, data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate AI analysis');
    } finally {
      setLoading(false);
    }
  };

  const analysis = fragment.aiAnalysis;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-end">
      <div className="bg-zinc-950 border-l border-zinc-800 w-full max-w-2xl h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">
                  AI Forensic Decision Support
                </h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-800 text-cyan-300 border border-zinc-700">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                Artifact: {fragment.name} ({fragment.category})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-zinc-300">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-zinc-900 rounded-lg border border-zinc-800 font-mono">
            <div>
              <span className="text-[10px] text-zinc-500 block">PRIORITY</span>
              <span className="text-emerald-400 font-bold text-sm">
                {fragment.priorityScore}/100 [{fragment.priorityTier}]
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 block">INTEGRITY</span>
              <span
                className={`font-bold text-sm ${
                  fragment.status === 'INTACT'
                    ? 'text-emerald-400'
                    : fragment.status === 'PARTIALLY_RECOVERABLE'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {fragment.status}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 block">ENTROPY</span>
              <span className="text-zinc-200 font-bold text-sm">
                {fragment.entropy.toFixed(3)}
              </span>
            </div>
          </div>

          {!analysis && !loading && (
            <div className="p-6 rounded-lg bg-zinc-900 border border-zinc-800 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-emerald-400 mx-auto opacity-80" />
              <div className="font-semibold text-white text-sm">
                Generate Deep Forensic Assessment
              </div>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Engage server-side Gemini 3.8 Flash to evaluate root-cause corruption, realistic
                restoration guidance, legal evidentiary value, and next investigative steps.
              </p>
              <button
                onClick={fetchAiAnalysis}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2 rounded-md transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>Perform AI Deep Dive</span>
              </button>
            </div>
          )}

          {loading && (
            <div className="p-12 text-center space-y-3 bg-zinc-900 rounded-lg border border-zinc-800">
              <RotateCcw className="w-6 h-6 animate-spin text-emerald-400 mx-auto" />
              <div className="font-semibold text-white">Synthesizing Forensic Hypothesis...</div>
              <p className="text-xs text-zinc-500">
                Correlating sector boundaries, extracted strings, and structural anomalies...
              </p>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-rose-950/40 border border-rose-800 text-rose-300 rounded-lg text-xs">
              Error: {error}
            </div>
          )}

          {analysis && !loading && (
            <div className="space-y-4">
              {/* 1. Plain English Rationale */}
              <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 font-mono">
                  <Compass className="w-3.5 h-3.5" />
                  <span>INVESTIGATIVE RATIONALE</span>
                </div>
                <p className="text-xs text-zinc-200 leading-relaxed font-sans">
                  {analysis.rationale}
                </p>
              </div>

              {/* 2. Root Cause Analysis */}
              <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 font-mono">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>CORRUPTION & FRAGMENTATION ROOT CAUSE</span>
                </div>
                <p className="text-xs text-zinc-200 leading-relaxed font-sans">
                  {analysis.rootCause}
                </p>
              </div>

              {/* 3. Restoration Feasibility Guidance */}
              <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 font-mono">
                  <Wrench className="w-3.5 h-3.5" />
                  <span>RESTORATION FEASIBILITY GUIDANCE</span>
                </div>
                <p className="text-xs text-zinc-200 leading-relaxed font-sans">
                  {analysis.restorationFeasibility}
                </p>
              </div>

              {/* 4. Evidentiary Value & Court Admissibility */}
              <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400 font-mono">
                  <Scale className="w-3.5 h-3.5" />
                  <span>EVIDENTIARY VALUE & ADMISSIBILITY</span>
                </div>
                <p className="text-xs text-zinc-200 leading-relaxed font-sans">
                  {analysis.evidentiaryValue}
                </p>
                <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-zinc-400 border-t border-zinc-800/80 pt-2">
                  <span>Reconstruction Confidence:</span>
                  <span className="text-emerald-400 font-bold">
                    {analysis.confidenceScore || 90}%
                  </span>
                </div>
              </div>

              {/* 5. Recommended Next Steps */}
              {analysis.suggestedNextSteps && analysis.suggestedNextSteps.length > 0 && (
                <div className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-300 font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>TACTICAL FORENSIC NEXT STEPS</span>
                  </div>
                  <ul className="space-y-1.5 pl-1">
                    {analysis.suggestedNextSteps.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-zinc-300">
                        <span className="text-emerald-400 font-mono font-bold shrink-0">
                          {idx + 1}.
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Re-analyze Button */}
              <div className="pt-2">
                <button
                  onClick={fetchAiAnalysis}
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Re-run AI Analysis</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
