import React from 'react';
import {
  HardDrive,
  Cpu,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Flame,
  Fingerprint,
} from 'lucide-react';
import { EvidenceFragment, DiskImageMetadata } from '../types/forensics.ts';
import { ThemeConfig } from '../types/themes.ts';

interface SummaryCardsProps {
  metadata: DiskImageMetadata;
  fragments: EvidenceFragment[];
  processingTimeMs: number;
  themeConfig: ThemeConfig;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  metadata,
  fragments,
  processingTimeMs,
  themeConfig,
}) => {
  const intactCount = fragments.filter((f) => f.status === 'INTACT').length;
  const partialCount = fragments.filter((f) => f.status === 'PARTIALLY_RECOVERABLE').length;
  const corruptedCount = fragments.filter((f) => f.status === 'CORRUPTED').length;
  const criticalCount = fragments.filter((f) => f.priorityTier === 'CRITICAL').length;
  const highCount = fragments.filter((f) => f.priorityTier === 'HIGH').length;
  const stitchedCount = fragments.filter((f) => f.chunks.some((c) => c.stitched)).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {/* 1. Storage Scanned */}
      <div className={`p-3.5 border rounded-lg ${themeConfig.cardClass}`}>
        <div className="flex items-center justify-between text-neutral-500 text-xs mb-1 font-mono">
          <span>RAW ACQUISITION</span>
          <HardDrive className="w-3.5 h-3.5 text-neutral-400" />
        </div>
        <div className="text-xl font-bold tracking-tight">
          {(metadata.totalSize / 1024).toFixed(0)} KB
        </div>
        <div className="text-[11px] text-neutral-500 mt-1 flex items-center justify-between">
          <span>{metadata.sectorCount} Sectors (512B)</span>
          <span className="text-blue-600 font-mono text-[10px]">{processingTimeMs}ms</span>
        </div>
      </div>

      {/* 2. Carved & Stitched */}
      <div className={`p-3.5 border rounded-lg ${themeConfig.cardClass}`}>
        <div className="flex items-center justify-between text-neutral-500 text-xs mb-1 font-mono">
          <span>FRAGMENTS CARVED</span>
          <Cpu className="w-3.5 h-3.5 text-blue-600" />
        </div>
        <div className="text-xl font-bold tracking-tight flex items-baseline gap-2">
          <span>{fragments.length} Artifacts</span>
        </div>
        <div className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1.5">
          <span className="text-blue-600 font-medium">⚡ {stitchedCount} Stitched</span>
          <span className="text-neutral-300">|</span>
          <span>across gaps</span>
        </div>
      </div>

      {/* 3. Integrity Breakdown */}
      <div className={`p-3.5 border rounded-lg ${themeConfig.cardClass}`}>
        <div className="flex items-center justify-between text-neutral-500 text-xs mb-1 font-mono">
          <span>HEALTH ASSESSMENT</span>
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="flex items-center gap-1 text-emerald-700 text-sm font-semibold">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{intactCount}</span>
            <span className="text-[10px] text-neutral-500 font-normal">Intact</span>
          </div>
          <span className="text-neutral-300">/</span>
          <div className="flex items-center gap-1 text-amber-700 text-sm font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{partialCount}</span>
            <span className="text-[10px] text-neutral-500 font-normal">Part</span>
          </div>
          <span className="text-neutral-300">/</span>
          <div className="flex items-center gap-1 text-rose-700 text-sm font-semibold">
            <XCircle className="w-3.5 h-3.5" />
            <span>{corruptedCount}</span>
            <span className="text-[10px] text-neutral-500 font-normal">Bad</span>
          </div>
        </div>
        <div className="text-[10px] text-neutral-400 mt-1.5 font-mono truncate">
          MIME & Entropy validated
        </div>
      </div>

      {/* 4. Actionable Priority Leads */}
      <div className={`p-3.5 border rounded-lg ${themeConfig.cardClass}`}>
        <div className="flex items-center justify-between text-neutral-500 text-xs mb-1 font-mono">
          <span>PRIORITY LEADS</span>
          <Flame className="w-3.5 h-3.5 text-amber-500" />
        </div>
        <div className="text-xl font-bold tracking-tight flex items-baseline gap-2">
          <span className="text-rose-600">{criticalCount} Critical</span>
          <span className="text-neutral-300 text-sm">/</span>
          <span className="text-amber-600 text-base">{highCount} High</span>
        </div>
        <div className="text-[11px] text-neutral-500 mt-1">
          Investigative weighted value
        </div>
      </div>

      {/* 5. Cryptographic Chain of Custody */}
      <div className={`col-span-2 md:col-span-3 lg:col-span-1 p-3.5 border rounded-lg ${themeConfig.cardClass}`}>
        <div className="flex items-center justify-between text-neutral-500 text-xs mb-1 font-mono">
          <span>IMAGE SHA-256</span>
          <Fingerprint className="w-3.5 h-3.5 text-blue-600" />
        </div>
        <div className="font-mono text-xs text-neutral-800 truncate tracking-tight font-medium" title={metadata.sha256}>
          {metadata.sha256 ? `${metadata.sha256.slice(0, 10)}...${metadata.sha256.slice(-6)}` : 'Computing...'}
        </div>
        <div className="text-[10px] text-neutral-500 mt-1 flex items-center justify-between font-mono">
          <span>Chain of Custody</span>
          <span className="text-emerald-600 font-semibold">VERIFIED</span>
        </div>
      </div>
    </div>
  );
};
