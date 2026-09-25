import React, { useState } from 'react';
import {
  X,
  Binary,
  Sparkles,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { EvidenceFragment } from '../types/forensics.ts';

interface HexInspectorModalProps {
  fragment: EvidenceFragment | null;
  onClose: () => void;
}

export const HexInspectorModal: React.FC<HexInspectorModalProps> = ({
  fragment,
  onClose,
}) => {
  if (!fragment) return null;

  const [selectedByteIdx, setSelectedByteIdx] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  // Bytes to inspect
  const bytes = fragment.rawBytes;
  const maxInspect = Math.min(bytes.length, 512);
  const inspectSlice = bytes.subarray(0, maxInspect);

  // Selected byte value calculations
  const selByte = inspectSlice[selectedByteIdx] ?? 0;
  const int8Val = (selByte << 24) >> 24;
  const uint8Val = selByte;
  const hexVal = selByte.toString(16).toUpperCase().padStart(2, '0');
  const binVal = selByte.toString(2).padStart(8, '0');
  const asciiChar = selByte >= 32 && selByte <= 126 ? String.fromCharCode(selByte) : '.';

  // 16-bit and 32-bit preview if in range
  const uint16Val =
    selectedByteIdx + 1 < bytes.length
      ? bytes[selectedByteIdx] | (bytes[selectedByteIdx + 1] << 8)
      : 'N/A';
  const uint32Val =
    selectedByteIdx + 3 < bytes.length
      ? (bytes[selectedByteIdx] |
          (bytes[selectedByteIdx + 1] << 8) |
          (bytes[selectedByteIdx + 2] << 16) |
          (bytes[selectedByteIdx + 3] << 24)) >>>
        0
      : 'N/A';

  const handleCopyHex = () => {
    navigator.clipboard.writeText(fragment.rawHexDump);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAiExplain = async () => {
    setIsExplaining(true);
    setAiExplanation(null);
    try {
      const res = await fetch('/api/gemini/hex-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hexSnippet: fragment.rawHexDump.split('\n').slice(0, 8).join('\n'),
          asciiSnippet: fragment.rawAsciiDump.split('\n').slice(0, 8).join('\n'),
          offset: fragment.offsetStart + selectedByteIdx,
          fileType: fragment.fileType,
        }),
      });
      const data = await res.json();
      setAiExplanation(data.explanation || 'No structural pattern identified.');
    } catch {
      setAiExplanation(
        `Offset 0x${(fragment.offsetStart + selectedByteIdx).toString(16).toUpperCase()}: Structural data matching ${fragment.fileType.toUpperCase()} file container.`
      );
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-zinc-800 border border-zinc-700 text-emerald-400">
              <Binary className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">
                  Hex & ASCII Byte Inspector
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-cyan-300 border border-zinc-700">
                  {fragment.name}
                </span>
                <span className="text-xs font-mono text-zinc-400">
                  Sectors {fragment.sectorStart} - {fragment.sectorEnd}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                Offset: 0x{fragment.offsetStart.toString(16).toUpperCase()} - 0x
                {fragment.offsetEnd.toString(16).toUpperCase()} | Size: {fragment.sizeBytes} Bytes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyHex}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs text-zinc-300 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Dump'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Hex Dump + Inspector Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 flex-1 overflow-hidden">
          {/* Main Hex Viewer (Cols 1-3) */}
          <div className="lg:col-span-3 p-4 overflow-y-auto font-mono text-xs text-zinc-300 bg-zinc-950 border-b lg:border-b-0 lg:border-r border-zinc-800 space-y-1 select-text">
            <div className="text-[11px] text-zinc-500 font-bold mb-2 pb-1 border-b border-zinc-900 flex justify-between">
              <span>OFFSET    00 01 02 03 04 05 06 07  08 09 0A 0B 0C 0D 0E 0F  ASCII</span>
              <span>Showing first {maxInspect} of {bytes.length} bytes</span>
            </div>

            {Array.from({ length: Math.ceil(inspectSlice.length / 16) }).map((_, rowIdx) => {
              const rowStart = rowIdx * 16;
              const rowBytes = inspectSlice.subarray(rowStart, rowStart + 16);
              const offsetStr = (fragment.offsetStart + rowStart).toString(16).toUpperCase().padStart(8, '0');

              return (
                <div key={rowIdx} className="flex items-center hover:bg-zinc-900/60 py-0.5 rounded px-1 group">
                  {/* Offset */}
                  <span className="text-zinc-500 w-24 shrink-0 font-bold select-none">{offsetStr}</span>

                  {/* Hex Bytes */}
                  <div className="flex items-center gap-1.5 mr-4">
                    {/* First 8 bytes */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 8 }).map((_, col) => {
                        const bIdx = rowStart + col;
                        const hasByte = col < rowBytes.length;
                        const bVal = hasByte ? rowBytes[col] : null;
                        const isSelected = bIdx === selectedByteIdx;

                        return (
                          <span
                            key={col}
                            onClick={() => hasByte && setSelectedByteIdx(bIdx)}
                            className={`w-5 text-center cursor-pointer rounded-xs transition-colors ${
                              isSelected
                                ? 'bg-emerald-500 text-zinc-950 font-bold'
                                : bVal === 0
                                ? 'text-zinc-600'
                                : 'text-zinc-200 group-hover:text-emerald-400'
                            }`}
                          >
                            {hasByte ? bVal!.toString(16).toUpperCase().padStart(2, '0') : '  '}
                          </span>
                        );
                      })}
                    </div>

                    <span className="text-zinc-700 select-none">|</span>

                    {/* Second 8 bytes */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 8 }).map((_, col) => {
                        const bIdx = rowStart + 8 + col;
                        const hasByte = 8 + col < rowBytes.length;
                        const bVal = hasByte ? rowBytes[8 + col] : null;
                        const isSelected = bIdx === selectedByteIdx;

                        return (
                          <span
                            key={col}
                            onClick={() => hasByte && setSelectedByteIdx(bIdx)}
                            className={`w-5 text-center cursor-pointer rounded-xs transition-colors ${
                              isSelected
                                ? 'bg-emerald-500 text-zinc-950 font-bold'
                                : bVal === 0
                                ? 'text-zinc-600'
                                : 'text-zinc-200 group-hover:text-emerald-400'
                            }`}
                          >
                            {hasByte ? bVal!.toString(16).toUpperCase().padStart(2, '0') : '  '}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* ASCII Representation */}
                  <div className="font-mono text-zinc-400 border-l border-zinc-800 pl-3 tracking-wider select-text">
                    {Array.from({ length: 16 }).map((_, col) => {
                      const bIdx = rowStart + col;
                      const hasByte = col < rowBytes.length;
                      const bVal = hasByte ? rowBytes[col] : 0;
                      const isSelected = bIdx === selectedByteIdx;
                      const char = hasByte && bVal >= 32 && bVal <= 126 ? String.fromCharCode(bVal) : '.';

                      return (
                        <span
                          key={col}
                          onClick={() => hasByte && setSelectedByteIdx(bIdx)}
                          className={`cursor-pointer ${
                            isSelected ? 'bg-emerald-500 text-zinc-950 font-bold' : ''
                          }`}
                        >
                          {char}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Data Inspector Sidebar (Col 4) */}
          <div className="p-4 bg-zinc-900/40 flex flex-col justify-between overflow-y-auto text-xs space-y-4 font-mono">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="text-zinc-400 font-bold">BYTE INSPECTOR</span>
                <span className="text-emerald-400 font-bold">
                  Offset +0x{selectedByteIdx.toString(16).toUpperCase().padStart(4, '0')}
                </span>
              </div>

              {/* Data Type Conversions */}
              <div className="space-y-2 mt-3 text-zinc-300">
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/40">
                  <span className="text-zinc-500">Hex Value:</span>
                  <span className="text-emerald-400 font-bold">0x{hexVal}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/40">
                  <span className="text-zinc-500">Binary:</span>
                  <span className="text-zinc-200">{binVal}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/40">
                  <span className="text-zinc-500">Uint8:</span>
                  <span className="text-zinc-200">{uint8Val}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/40">
                  <span className="text-zinc-500">Int8:</span>
                  <span className="text-zinc-200">{int8Val}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/40">
                  <span className="text-zinc-500">ASCII Character:</span>
                  <span className="text-cyan-400 font-bold font-mono">'{asciiChar}'</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/40">
                  <span className="text-zinc-500">Uint16 (Little Endian):</span>
                  <span className="text-zinc-200">{uint16Val}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/40">
                  <span className="text-zinc-500">Uint32 (Little Endian):</span>
                  <span className="text-zinc-200">{uint32Val}</span>
                </div>
              </div>

              {/* Shannon Entropy Metric */}
              <div className="mt-4 p-2.5 rounded bg-zinc-950 border border-zinc-800">
                <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                  <span>Shannon Entropy</span>
                  <span className="text-amber-400 font-bold">{fragment.entropy.toFixed(3)} / 8.0</span>
                </div>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-400 h-full rounded-full"
                    style={{ width: `${(fragment.entropy / 8) * 100}%` }}
                  />
                </div>
                <div className="text-[10px] text-zinc-500 mt-1">
                  {fragment.entropy > 7.0
                    ? 'High entropy (Compressed or encrypted payload)'
                    : fragment.entropy > 4.0
                    ? 'Moderate entropy (Structured document or database text)'
                    : 'Low entropy (Zero runs, repetitive padding or sparse table)'}
                </div>
              </div>
            </div>

            {/* AI Hex Explanation Tool */}
            <div className="border-t border-zinc-800 pt-3">
              <button
                onClick={handleAiExplain}
                disabled={isExplaining}
                className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-medium py-2 rounded-md transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isExplaining ? 'Analyzing Structure...' : 'AI Explain Byte Structure'}</span>
              </button>

              {aiExplanation && (
                <div className="mt-2.5 p-2.5 rounded bg-zinc-950 border border-emerald-800/60 text-zinc-300 text-[11px] leading-relaxed">
                  <div className="text-emerald-400 font-bold mb-1 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    <span>Forensic Byte Analysis:</span>
                  </div>
                  {aiExplanation}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
