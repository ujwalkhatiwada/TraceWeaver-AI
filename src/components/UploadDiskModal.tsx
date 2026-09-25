import React, { useState, useRef, DragEvent } from 'react';
import {
  Upload,
  HardDrive,
  FileCheck,
  ShieldCheck,
  AlertCircle,
  Download,
  X,
  RotateCcw,
  CheckCircle2,
  Cpu,
  Layers,
} from 'lucide-react';
import { DiskImageMetadata } from '../types/forensics.ts';
import { downloadDiskImage } from '../forensics/diskParser.ts';

interface UploadDiskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadFile: (file: File) => Promise<void>;
  onSelectScenario: (scenario: 'ironvault' | 'antiforensics' | 'flashcorrupt') => void;
  currentMetadata?: DiskImageMetadata | null;
  currentDiskBytes?: Uint8Array | null;
  isProcessing: boolean;
}

export const UploadDiskModal: React.FC<UploadDiskModalProps> = ({
  isOpen,
  onClose,
  onUploadFile,
  onSelectScenario,
  currentMetadata,
  currentDiskBytes,
  isProcessing,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parseStep, setParseStep] = useState<string>('');
  const [parseProgress, setParseProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const processSelectedFile = async (file: File) => {
    setErrorMessage(null);
    setSelectedFile(file);

    try {
      setParseStep('Ingesting raw disk bitstream...');
      setParseProgress(25);

      await onUploadFile(file);

      setParseProgress(100);
      setParseStep('Analysis complete!');
      setTimeout(() => {
        onClose();
        setSelectedFile(null);
        setParseProgress(0);
        setParseStep('');
      }, 700);
    } catch (err: any) {
      console.error('Error processing uploaded .dd file:', err);
      setErrorMessage(
        err?.message ||
          'Failed to parse the forensic image. Ensure it is a valid raw bitstream (.dd, .raw, .img).'
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const handleDownloadCurrentSample = () => {
    if (currentDiskBytes) {
      downloadDiskImage(
        currentDiskBytes,
        currentMetadata?.filename || 'operation_ironvault.dd'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans animate-in fade-in duration-150">
      <div className="bg-white border border-[#E5E7EB] rounded-xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-neutral-50/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-[#111827]">
                Upload Forensic Disk Image (.dd)
              </h2>
              <p className="text-xs text-[#6B7280]">
                Supports raw bitstreams: <code className="font-mono bg-neutral-200/60 px-1 py-0.5 rounded text-[11px]">.dd</code>, <code className="font-mono bg-neutral-200/60 px-1 py-0.5 rounded text-[11px]">.raw</code>, <code className="font-mono bg-neutral-200/60 px-1 py-0.5 rounded text-[11px]">.img</code>, <code className="font-mono bg-neutral-200/60 px-1 py-0.5 rounded text-[11px]">.bin</code>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-neutral-400 hover:text-neutral-600 p-1.5 rounded-md hover:bg-neutral-200/60 transition-none cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs text-[#374151]">
          {/* Security Banner */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-3 flex items-start gap-2.5 text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-xs text-emerald-800">
                100% Client-Side Processing • Non-Destructive
              </p>
              <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                Raw bytes are processed locally in your browser memory via the Web Cryptography API. Zero bytes are transmitted to any remote server, preserving write-blocked chain of custody under NIST SP 800-86 standards.
              </p>
            </div>
          </div>

          {/* Drag & Drop Target Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors duration-150 flex flex-col items-center justify-center ${
              dragActive
                ? 'border-blue-500 bg-blue-50/60'
                : 'border-neutral-300 hover:border-blue-400 bg-neutral-50/50 hover:bg-blue-50/20'
            } ${isProcessing ? 'pointer-events-none opacity-60' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".dd,.raw,.img,.bin,.001"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-3 shadow-xs">
              {isProcessing ? (
                <RotateCcw className="w-6 h-6 animate-spin" />
              ) : (
                <HardDrive className="w-6 h-6" />
              )}
            </div>
            <p className="text-sm font-semibold text-[#111827]">
              {selectedFile ? selectedFile.name : 'Click to browse or drag & drop .dd file'}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              Select any raw storage dump or disk image from your computer
            </p>

            <span className="inline-block mt-3 px-3 py-1 bg-white border border-neutral-300 text-neutral-700 rounded-md font-medium text-xs shadow-2xs hover:bg-neutral-50">
              Browse Local Files
            </span>
          </div>

          {/* Progress / Step indicator */}
          {isProcessing && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
                <span className="flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  {parseStep || 'Processing forensic disk image...'}
                </span>
                <span className="font-mono">{parseProgress}%</span>
              </div>
              <div className="w-full bg-blue-200/70 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${parseProgress}%` }}
                />
              </div>
              <div className="grid grid-cols-4 gap-1 text-[10px] text-neutral-500 pt-1 text-center font-mono">
                <span className={parseProgress >= 25 ? 'text-blue-700 font-semibold' : ''}>1. Ingest</span>
                <span className={parseProgress >= 45 ? 'text-blue-700 font-semibold' : ''}>2. Hash</span>
                <span className={parseProgress >= 70 ? 'text-blue-700 font-semibold' : ''}>3. Carve</span>
                <span className={parseProgress >= 90 ? 'text-blue-700 font-semibold' : ''}>4. Timeline</span>
              </div>
            </div>
          )}

          {/* Error notice */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div className="text-xs">{errorMessage}</div>
            </div>
          )}

          {/* Don't have a .dd file? Section */}
          <div className="pt-2 border-t border-neutral-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-800 text-xs flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-neutral-500" />
                No .dd file on hand? Try Benchmark Scenarios:
              </span>
              {currentDiskBytes && (
                <button
                  type="button"
                  onClick={handleDownloadCurrentSample}
                  className="text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 hover:underline text-[11px] cursor-pointer"
                  title="Download the current scenario as an actual .dd file"
                >
                  <Download className="w-3 h-3" />
                  <span>Download Sample .dd</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  onSelectScenario('ironvault');
                  onClose();
                }}
                className="text-left p-2.5 rounded-lg border border-neutral-200 hover:border-blue-400 hover:bg-blue-50/40 transition-none cursor-pointer group bg-neutral-50/60"
              >
                <div className="font-semibold text-neutral-800 group-hover:text-blue-700">
                  Operation IronVault
                </div>
                <div className="text-[11px] text-neutral-500 mt-0.5">
                  128 KB • Financial wire fraud & cluster gap stitching
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectScenario('antiforensics');
                  onClose();
                }}
                className="text-left p-2.5 rounded-lg border border-neutral-200 hover:border-blue-400 hover:bg-blue-50/40 transition-none cursor-pointer group bg-neutral-50/60"
              >
                <div className="font-semibold text-neutral-800 group-hover:text-blue-700">
                  Anti-Forensics Wiper
                </div>
                <div className="text-[11px] text-neutral-500 mt-0.5">
                  128 KB • Truncated EOI & unallocated freelist purging
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectScenario('flashcorrupt');
                  onClose();
                }}
                className="text-left p-2.5 rounded-lg border border-neutral-200 hover:border-blue-400 hover:bg-blue-50/40 transition-none cursor-pointer group bg-neutral-50/60"
              >
                <div className="font-semibold text-neutral-800 group-hover:text-blue-700">
                  Flash Wear-Leveling
                </div>
                <div className="text-[11px] text-neutral-500 mt-0.5">
                  128 KB • SSD non-contiguous cluster fragmentation
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#E5E7EB] bg-neutral-50/80 flex items-center justify-between">
          <span className="text-[11px] text-neutral-500 font-mono">
            Sector size: 512 bytes • Bitstream SHA-256 Verified
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-neutral-600 hover:text-neutral-900 border border-neutral-300 rounded-md hover:bg-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="px-3.5 py-1.5 text-xs font-medium bg-[#2563EB] hover:bg-blue-700 text-white rounded-md shadow-xs cursor-pointer inline-flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Select .dd File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
