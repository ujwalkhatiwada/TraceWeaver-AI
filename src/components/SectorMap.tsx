import React, { useState } from 'react';
import { Layers, Info } from 'lucide-react';
import { DiskSector, EvidenceFragment } from '../types/forensics.ts';
import { ThemeConfig } from '../types/themes.ts';

interface SectorMapProps {
  sectors: DiskSector[];
  fragments: EvidenceFragment[];
  highlightedFragmentId?: string;
  onSelectSector: (sectorIndex: number) => void;
  themeConfig: ThemeConfig;
}

export const SectorMap: React.FC<SectorMapProps> = ({
  sectors,
  fragments,
  highlightedFragmentId,
  onSelectSector,
  themeConfig,
}) => {
  const [hoveredSector, setHoveredSector] = useState<DiskSector | null>(null);

  const getColorClass = (sector: DiskSector) => {
    if (highlightedFragmentId) {
      if (sector.evidenceId === highlightedFragmentId) {
        return 'bg-blue-600 ring-2 ring-blue-400 z-10 scale-110';
      }
      return 'bg-neutral-200/50 opacity-40';
    }

    switch (sector.state) {
      case 'boot':
        return 'bg-purple-600 hover:bg-purple-500';
      case 'allocated_intact':
        return 'bg-emerald-600 hover:bg-emerald-500';
      case 'fragment_a':
        return 'bg-blue-500 hover:bg-blue-400';
      case 'fragment_b':
        return 'bg-indigo-600 hover:bg-indigo-500';
      case 'slack_corrupted':
        return 'bg-rose-500 hover:bg-rose-400';
      case 'zeroed':
        return 'bg-neutral-100 border border-neutral-300 hover:bg-neutral-200';
      case 'unallocated':
      default:
        return 'bg-neutral-200 hover:bg-neutral-300';
    }
  };

  return (
    <div className={`p-4 border rounded-lg ${themeConfig.cardClass}`}>
      {/* Header and Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-semibold">
            Disk Cluster & Sector Layout
          </h3>
          <span className="text-xs text-neutral-500 font-mono">
            ({sectors.length} Sectors @ 512B)
          </span>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-purple-600 inline-block" />
            <span className="text-neutral-600">MBR</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block" />
            <span className="text-neutral-600">Intact File</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-blue-500 inline-block" />
            <span className="text-neutral-600">Chunk 1</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-indigo-600 inline-block" />
            <span className="text-neutral-600">Chunk 2 (Stitched)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block" />
            <span className="text-neutral-600">Corrupted / Overwritten</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-neutral-200 border border-neutral-300 inline-block" />
            <span className="text-neutral-500">Unallocated / Slack</span>
          </div>
        </div>
      </div>

      {/* 2D Block Grid */}
      <div className="grid grid-cols-16 sm:grid-cols-32 gap-1 p-2 bg-neutral-50 rounded border border-neutral-200 max-h-56 overflow-y-auto">
        {sectors.map((sec) => (
          <button
            key={sec.sectorIndex}
            onClick={() => onSelectSector(sec.sectorIndex)}
            onMouseEnter={() => setHoveredSector(sec)}
            onMouseLeave={() => setHoveredSector(null)}
            className={`w-full aspect-square rounded-[2px] transition-none cursor-pointer relative group ${getColorClass(
              sec
            )}`}
            title={`Sector ${sec.sectorIndex} (Offset 0x${sec.offset.toString(16).toUpperCase()}) - ${sec.label}`}
          >
            {sec.sectorIndex % 32 === 0 && (
              <span className="absolute -top-1 -left-1 text-[7px] text-neutral-400 font-mono pointer-events-none opacity-60 group-hover:opacity-100">
                {sec.sectorIndex}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Sector Live Inspector Footer */}
      <div className="mt-3 pt-2.5 border-t border-neutral-200 flex flex-wrap items-center justify-between text-xs text-neutral-600 font-mono gap-2 min-h-[30px]">
        {hoveredSector ? (
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-neutral-800 font-bold">
              Sector #{hoveredSector.sectorIndex}
            </span>
            <span>
              Offset: 0x{hoveredSector.offset.toString(16).toUpperCase().padStart(6, '0')}
            </span>
            <span>
              State: <span className="font-semibold text-neutral-800">{hoveredSector.label}</span>
            </span>
            <span>
              Entropy: <span className="text-amber-700 font-semibold">{hoveredSector.entropy.toFixed(3)}</span>/8.0
            </span>
            {hoveredSector.evidenceId && (
              <span className="text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                Artifact: {hoveredSector.evidenceId}
              </span>
            )}
          </div>
        ) : (
          <div className="text-neutral-500 flex items-center gap-1.5 text-[11px]">
            <Info className="w-3.5 h-3.5 text-neutral-400" />
            <span>Hover over any cluster to view forensic details. Click to open in Hex Inspector.</span>
          </div>
        )}

        <div className="text-[11px] text-neutral-400">
          Click any block to inspect raw bytes
        </div>
      </div>
    </div>
  );
};
