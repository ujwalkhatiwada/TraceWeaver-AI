import React, { useState } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  Database,
  FileArchive,
  Search,
  Eye,
  Binary,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  EvidenceFragment,
  EvidenceStatus,
  PriorityTier,
} from '../types/forensics.ts';
import { ThemeConfig } from '../types/themes.ts';

interface EvidenceTableProps {
  fragments: EvidenceFragment[];
  onInspectHex: (fragment: EvidenceFragment) => void;
  onPreview: (fragment: EvidenceFragment) => void;
  onAiAnalyze: (fragment: EvidenceFragment) => void;
  onHoverFragment?: (fragmentId?: string) => void;
  themeConfig: ThemeConfig;
}

export const EvidenceTable: React.FC<EvidenceTableProps> = ({
  fragments,
  onInspectHex,
  onPreview,
  onAiAnalyze,
  onHoverFragment,
  themeConfig,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filtered = fragments.filter((frag) => {
    const matchesSearch =
      frag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      frag.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      frag.plainEnglishRationale.toLowerCase().includes(searchTerm.toLowerCase()) ||
      frag.extractedStrings.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || frag.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || frag.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileSpreadsheet className="w-4 h-4 text-rose-600" />;
      case 'docx':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'jpeg':
      case 'png':
        return <ImageIcon className="w-4 h-4 text-emerald-600" />;
      case 'sqlite':
        return <Database className="w-4 h-4 text-amber-600" />;
      case 'txt':
        return <FileText className="w-4 h-4 text-cyan-700" />;
      default:
        return <FileArchive className="w-4 h-4 text-neutral-500" />;
    }
  };

  const getStatusBadge = (status: EvidenceStatus, factor: number) => {
    switch (status) {
      case 'INTACT':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
            <CheckCircle2 className="w-3 h-3" />
            INTACT (100%)
          </span>
        );
      case 'PARTIALLY_RECOVERABLE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-medium">
            <AlertTriangle className="w-3 h-3" />
            PARTIAL ({(factor * 100).toFixed(0)}%)
          </span>
        );
      case 'CORRUPTED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-medium">
            <XCircle className="w-3 h-3" />
            CORRUPTED
          </span>
        );
    }
  };

  const getPriorityBadge = (tier: PriorityTier, score: number) => {
    switch (tier) {
      case 'CRITICAL':
        return (
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold font-mono">
              P1 CRITICAL
            </span>
            <span className="text-xs font-mono font-bold text-neutral-900">{score}</span>
          </div>
        );
      case 'HIGH':
        return (
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold font-mono">
              P2 HIGH
            </span>
            <span className="text-xs font-mono font-bold text-neutral-900">{score}</span>
          </div>
        );
      case 'MEDIUM':
        return (
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold font-mono">
              P3 MEDIUM
            </span>
            <span className="text-xs font-mono font-bold text-neutral-900">{score}</span>
          </div>
        );
      case 'LOW':
        return (
          <div className="flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 border border-neutral-200 text-[10px] font-bold font-mono">
              P4 LOW
            </span>
            <span className="text-xs font-mono font-bold text-neutral-500">{score}</span>
          </div>
        );
    }
  };

  return (
    <div className={`border rounded-lg overflow-hidden ${themeConfig.cardClass}`}>
      {/* Table Controls */}
      <div className="p-3.5 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3 bg-neutral-50/70">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">
            Prioritized Evidence Ledger
          </h3>
          <span className="text-xs text-neutral-500 font-mono">
            ({filtered.length} of {fragments.length} matches)
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search filename, rationale, string..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-neutral-300 text-neutral-900 text-xs pl-8 pr-3 py-1.5 rounded-md focus:outline-none focus:border-blue-600 w-48 sm:w-64"
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-neutral-300 text-neutral-800 text-xs px-2.5 py-1.5 rounded-md focus:outline-none focus:border-blue-600"
          >
            <option value="all">All Statuses</option>
            <option value="INTACT">INTACT</option>
            <option value="PARTIALLY_RECOVERABLE">PARTIALLY RECOVERABLE</option>
            <option value="CORRUPTED">CORRUPTED</option>
          </select>

          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-neutral-300 text-neutral-800 text-xs px-2.5 py-1.5 rounded-md focus:outline-none focus:border-blue-600"
          >
            <option value="all">All Categories</option>
            <option value="Financial">Financial</option>
            <option value="Legal & Contracts">Legal & Contracts</option>
            <option value="Communications">Communications</option>
            <option value="System & Audit">System & Audit</option>
            <option value="Media & Graphics">Media & Graphics</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-50 text-neutral-500 font-mono text-[11px] border-b border-neutral-200">
            <tr>
              <th className="py-2.5 px-3 w-12 text-center">RANK</th>
              <th className="py-2.5 px-3">EVIDENCE ARTIFACT</th>
              <th className="py-2.5 px-3">CATEGORY</th>
              <th className="py-2.5 px-3">SECTORS & SIZE</th>
              <th className="py-2.5 px-3">DATA INTEGRITY</th>
              <th className="py-2.5 px-3">PRIORITY SCORE</th>
              <th className="py-2.5 px-3 text-right">FORENSIC ACTIONS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 font-sans">
            {filtered.map((frag, idx) => {
              const isStitched = frag.chunks.some((c) => c.stitched);

              return (
                <tr
                  key={frag.id}
                  onMouseEnter={() => onHoverFragment?.(frag.name)}
                  onMouseLeave={() => onHoverFragment?.(undefined)}
                  className="hover:bg-neutral-50 transition-none group"
                >
                  {/* Rank */}
                  <td className="py-3 px-3 text-center font-mono font-bold text-neutral-500">
                    #{idx + 1}
                  </td>

                  {/* Evidence Artifact Name & Type */}
                  <td className="py-3 px-3">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1.5 rounded bg-white border border-neutral-200 shrink-0 mt-0.5">
                        {getFileIcon(frag.fileType)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-neutral-900 truncate text-xs sm:text-sm">
                            {frag.name}
                          </span>
                          {isStitched && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] font-mono uppercase bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded font-bold">
                              <Zap className="w-2.5 h-2.5" /> Stitched
                            </span>
                          )}
                        </div>

                        {/* Plain English explanation preview */}
                        <p className="text-[11px] text-neutral-600 mt-0.5 line-clamp-1 group-hover:line-clamp-2">
                          {frag.plainEnglishRationale}
                        </p>

                        {/* Defect tags */}
                        {frag.defects.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 mt-1 text-[10px] text-neutral-500 font-mono">
                            <span className="text-amber-800 font-medium">Anomaly:</span>
                            {frag.defects.slice(0, 2).map((d, dIdx) => (
                              <span
                                key={dIdx}
                                className="bg-neutral-100 px-1.5 py-0.2 rounded border border-neutral-200 text-neutral-700"
                              >
                                {d}
                              </span>
                            ))}
                            {frag.defects.length > 2 && (
                              <span className="text-neutral-400">
                                +{frag.defects.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-neutral-700 text-[11px] font-mono">
                      {frag.category}
                    </span>
                  </td>

                  {/* Sectors & Size */}
                  <td className="py-3 px-3 font-mono text-[11px]">
                    <div className="text-neutral-800 font-medium">
                      Sec {frag.sectorStart} - {frag.sectorEnd}
                    </div>
                    <div className="text-neutral-500 text-[10px]">
                      {(frag.sizeBytes / 1024).toFixed(1)} KB ({frag.sizeBytes} B)
                    </div>
                  </td>

                  {/* Integrity Status & Entropy */}
                  <td className="py-3 px-3">
                    <div className="flex flex-col gap-1 items-start">
                      {getStatusBadge(frag.status, frag.integrityFactor)}
                      <div className="text-[10px] font-mono text-neutral-500 flex items-center gap-1">
                        <span>Entropy:</span>
                        <span className="text-neutral-800 font-medium">
                          {frag.entropy.toFixed(2)}
                        </span>
                        <span className="text-neutral-400">/ 8.0</span>
                      </div>
                    </div>
                  </td>

                  {/* Priority Score & Progress Bar */}
                  <td className="py-3 px-3">
                    <div className="w-28">
                      {getPriorityBadge(frag.priorityTier, frag.priorityScore)}
                      <div className="w-full bg-neutral-200 h-1.5 rounded-full mt-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            frag.priorityTier === 'CRITICAL'
                              ? 'bg-rose-500'
                              : frag.priorityTier === 'HIGH'
                              ? 'bg-amber-500'
                              : frag.priorityTier === 'MEDIUM'
                              ? 'bg-blue-600'
                              : 'bg-neutral-400'
                          }`}
                          style={{ width: `${frag.priorityScore}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Hex Inspector */}
                      <button
                        onClick={() => onInspectHex(frag)}
                        className="p-1.5 rounded bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-700 transition-none"
                        title="Open Hex / ASCII byte inspector"
                      >
                        <Binary className="w-3.5 h-3.5" />
                      </button>

                      {/* Preview */}
                      <button
                        onClick={() => onPreview(frag)}
                        className="p-1.5 rounded bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-700 transition-none"
                        title="Preview reconstructed file content"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* AI Deep Dive */}
                      <button
                        onClick={() => onAiAnalyze(frag)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-[11px] font-medium transition-none"
                        title="AI-assisted investigative assessment & restoration advice"
                      >
                        <Sparkles className="w-3 h-3 text-blue-600" />
                        <span>AI Advice</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-neutral-400 font-mono">
                  No carved fragments match the current filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
