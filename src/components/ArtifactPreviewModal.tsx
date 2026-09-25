import React, { useEffect, useRef } from 'react';
import {
  X,
  Eye,
  FileSpreadsheet,
  FileText,
  Database,
  Image as ImageIcon,
  Download,
  AlertTriangle,
  CheckCircle,
  Check,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { EvidenceFragment } from '../types/forensics.ts';

interface ArtifactPreviewModalProps {
  fragment: EvidenceFragment | null;
  onClose: () => void;
}

export const ArtifactPreviewModal: React.FC<ArtifactPreviewModalProps> = ({
  fragment,
  onClose,
}) => {
  if (!fragment) return null;

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Render simulated image preview for JPEG on clean white/gray canvas
  useEffect(() => {
    if (fragment.fileType === 'jpeg' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw upper 70% intact photo raster (office/conference scene)
        const intactHeight = canvas.height * 0.7;
        const grad = ctx.createLinearGradient(0, 0, 0, intactHeight);
        grad.addColorStop(0, '#E0E7FF');
        grad.addColorStop(1, '#93C5FD');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, intactHeight);

        // Windows & room silhouettes
        ctx.fillStyle = '#1E3A8A';
        ctx.globalAlpha = 0.4;
        for (let x = 40; x < canvas.width - 40; x += 50) {
          ctx.fillRect(x, 30, 32, 60);
        }
        ctx.globalAlpha = 1.0;

        // Conference table & meeting figures
        ctx.fillStyle = '#1E293B';
        ctx.beginPath();
        ctx.ellipse(canvas.width / 2, intactHeight - 20, 160, 35, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(canvas.width / 2 - 60, intactHeight - 45, 14, 0, Math.PI * 2);
        ctx.arc(canvas.width / 2 + 60, intactHeight - 45, 14, 0, Math.PI * 2);
        ctx.fill();

        // Demarcation line where truncation occurred
        ctx.fillStyle = '#DC2626';
        ctx.fillRect(0, intactHeight, canvas.width, 3);

        // Trailing corrupted 30% area
        ctx.fillStyle = '#F3F4F6';
        ctx.fillRect(0, intactHeight + 3, canvas.width, canvas.height - intactHeight - 3);

        // Corrupted raster tear pattern
        ctx.strokeStyle = '#D1D5DB';
        ctx.lineWidth = 1;
        for (let y = intactHeight + 8; y < canvas.height; y += 8) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }

        ctx.fillStyle = '#DC2626';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(
          'MISSING SCANLINE DATA (Sector Overwritten with Zeros)',
          16,
          intactHeight + 25
        );
      }
    }
  }, [fragment]);

  const handleDownloadRaw = () => {
    const blob = new Blob([fragment.rawBytes.buffer as ArrayBuffer], {
      type: 'application/octet-stream',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carved_${fragment.name}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isDocx = fragment.fileType === 'docx';
  const isPdf = fragment.fileType === 'pdf';
  const isJpeg = fragment.fileType === 'jpeg';
  const isSqlite = fragment.fileType === 'sqlite';
  const isTxt = fragment.fileType === 'txt';

  return (
    <div className="fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-[#E5E7EB] rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden text-[#1F2937] font-sans">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E5E7EB] flex items-center justify-between bg-[#F8F9FA]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-white border border-[#E5E7EB] text-[#2563EB]">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#1F2937]">
                  {isPdf
                    ? 'FINANCIAL TRANSACTION REPORT'
                    : isDocx
                    ? 'CASE BRIEFING'
                    : `Evidence Preview: ${fragment.name}`}
                </h3>
                <span className="text-xs font-mono uppercase text-[#6B7280]">
                  ({fragment.fileType})
                </span>
              </div>
              <p className="text-xs text-[#6B7280]">
                File Size: {(fragment.sizeBytes / 1024).toFixed(1)} KB • Sectors {fragment.sectorStart}–{fragment.sectorEnd}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadRaw}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-white hover:bg-[#F3F4F6] border border-[#E5E7EB] text-xs font-medium text-[#1F2937] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-[#E5E7EB] text-[#6B7280] hover:text-[#1F2937] cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Demonstration Notice Banner */}
          <div className="p-2.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded text-xs text-[#1E40AF] font-medium flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0 text-[#2563EB]" />
            <span>
              Demonstration Forensic Data: Displayed information is simulated evidence constructed for challenge demonstration.
            </span>
          </div>

          {/* 1. FINANCIAL PDF PREVIEW */}
          {isPdf && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-xs font-bold uppercase text-[#6B7280] font-mono">
                    Document Header
                  </div>
                  <div className="text-base font-bold text-[#1F2937]">
                    FINANCIAL TRANSACTION REPORT
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] font-semibold">
                    <Check className="w-3 h-3" />
                    INTACT
                  </span>
                  <div className="text-xs font-mono text-[#6B7280] mt-0.5">
                    Recovery: 100%
                  </div>
                </div>
              </div>

              {/* Required Demonstration Table */}
              <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8F9FA] border-b border-[#E5E7EB] text-[#6B7280] font-mono text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Transaction</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    <tr className="hover:bg-[#F9FAFB]">
                      <td className="py-2.5 px-3 font-semibold text-[#1F2937]">
                        Wire Transfer
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#16A34A]">
                        $4,250,000
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] text-[10px] font-bold font-mono">
                          Cleared
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#F9FAFB]">
                      <td className="py-2.5 px-3 text-[#4B5563]">
                        Corporate Retainer
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#1F2937]">
                        $125,000
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] text-[10px] font-bold font-mono">
                          Cleared
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#F9FAFB]">
                      <td className="py-2.5 px-3 text-[#4B5563]">
                        Escrow Liquidation
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#1F2937]">
                        $890,000
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] text-[10px] font-bold font-mono">
                          Cleared
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Decoded Body Text */}
              <div className="bg-[#F8F9FA] p-3 rounded-lg border border-[#E5E7EB] space-y-1">
                <span className="text-[10px] font-mono text-[#6B7280] uppercase block font-semibold">
                  Decoded PDF Stream Excerpt
                </span>
                <p className="text-xs text-[#4B5563] font-mono leading-relaxed">
                  Beneficiary: Sterling Global Holdings (Geneva Branch) • Account: CH88-2918-0091 • Authorization: BOARD-RESOLVE-2026-Q3
                </p>
              </div>
            </div>
          )}

          {/* 2. DOCX WORD DOCUMENT PREVIEW */}
          {isDocx && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-[#1F2937]">
                    CASE BRIEFING
                  </h4>
                  <p className="text-xs text-[#6B7280]">
                    Document fragments recovered and stitched across unallocated space.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-mono px-2.5 py-1 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] font-bold">
                  <Check className="w-3.5 h-3.5" />
                  STITCHED
                </span>
              </div>

              {/* Cluster Gap Explanation Box */}
              <div className="p-4 bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg space-y-2">
                <p className="text-xs text-[#4B5563] leading-relaxed">
                  The document contains fragments separated by an unallocated disk gap. TraceWeaver-AI demonstrates how these fragments can be associated and reconstructed.
                </p>

                {/* Stitched Sector Flow */}
                <div className="pt-2 flex flex-wrap items-center gap-2 text-xs font-mono">
                  <span className="px-2.5 py-1 bg-white border border-[#E5E7EB] rounded font-semibold text-[#1F2937]">
                    Sectors 65–74
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#9CA3AF]" />
                  <span className="px-2.5 py-1 bg-[#FFFBEB] border border-[#FDE68A] text-[#D97706] rounded font-semibold">
                    15-sector gap (unallocated)
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#9CA3AF]" />
                  <span className="px-2.5 py-1 bg-white border border-[#E5E7EB] rounded font-semibold text-[#1F2937]">
                    Sectors 90–102
                  </span>
                </div>
              </div>

              {/* Case Briefing Content */}
              <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg space-y-2 text-xs text-[#1F2937]">
                <div className="font-bold text-xs uppercase text-[#6B7280]">
                  Reconstructed Briefing Notes
                </div>
                <div className="space-y-1.5 leading-relaxed text-[#4B5563]">
                  <p>
                    <span className="font-semibold text-[#1F2937]">Subject:</span> Marcus Sterling (VP Finance)
                  </p>
                  <p>
                    <span className="font-semibold text-[#1F2937]">Finding:</span> Automated batch scripts were configured to run at 23:45 UTC to zero out cluster slack and unallocated sectors.
                  </p>
                  <p>
                    <span className="font-semibold text-[#1F2937]">Offshore Destination:</span> Bank of Zurich #CH88-2918-0091.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3. JPEG IMAGE PREVIEW */}
          {isJpeg && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-[#1F2937]">
                  photo1.jpg Preview
                </h4>
                <p className="text-xs text-[#6B7280]">
                  Simulated partially recovered image preview with trailing sector corruption.
                </p>
              </div>

              {/* Canvas Preview */}
              <div className="border border-[#E5E7EB] rounded-lg overflow-hidden bg-white p-2 flex justify-center">
                <canvas
                  ref={canvasRef}
                  width={460}
                  height={240}
                  className="w-full max-w-[460px] h-auto block rounded border border-[#E5E7EB]"
                />
              </div>

              {/* Status and Warning */}
              <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-[#D97706]">
                    Status: PARTIALLY RECOVERABLE
                  </span>
                  <span className="font-bold text-[#1F2937]">
                    Recovery: 70%
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-[#B45309] font-medium pt-1">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Warning: Trailing data is missing or damaged.</span>
                </div>
              </div>
            </div>
          )}

          {/* 4. SQLITE DATABASE PREVIEW */}
          {isSqlite && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-[#1F2937]">
                  logs.db Database Records
                </h4>
                <p className="text-xs text-[#6B7280]">
                  Database-style table showing normal and recovered/deleted demonstration rows.
                </p>
              </div>

              {/* Table with distinction */}
              <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
                <div className="bg-[#F8F9FA] px-3 py-2 border-b border-[#E5E7EB] flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-[#1F2937]">
                    Recovered Freelist Records
                  </span>
                  <span className="text-[11px] text-[#6B7280] font-mono">
                    Table: transactions
                  </span>
                </div>

                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] font-mono text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">RECORD ID</th>
                      <th className="py-2.5 px-3">DESTINATION</th>
                      <th className="py-2.5 px-3">AMOUNT</th>
                      <th className="py-2.5 px-3">RECORD STATE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {/* Normal Row */}
                    <tr className="hover:bg-[#F9FAFB]">
                      <td className="py-2.5 px-3 font-mono font-semibold text-[#1F2937]">
                        #REC-1044
                      </td>
                      <td className="py-2.5 px-3 text-[#4B5563]">Zurich Trust Corp</td>
                      <td className="py-2.5 px-3 font-mono text-[#1F2937]">$2,400,000</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-[#F3F4F6] text-[#4B5563] text-[10px] font-mono">
                          ACTIVE
                        </span>
                      </td>
                    </tr>
                    {/* Deleted Row 1 */}
                    <tr className="bg-[#FEF2F2]/60 hover:bg-[#FEF2F2]">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#DC2626]">
                        #REC-1045
                      </td>
                      <td className="py-2.5 px-3 text-[#1F2937] font-medium">Cayman Escrow Ltd</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#DC2626]">$1,850,000</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] text-[10px] font-bold font-mono">
                          RECOVERED (DELETED)
                        </span>
                      </td>
                    </tr>
                    {/* Deleted Row 2 */}
                    <tr className="bg-[#FEF2F2]/60 hover:bg-[#FEF2F2]">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#DC2626]">
                        #REC-1046
                      </td>
                      <td className="py-2.5 px-3 text-[#1F2937] font-medium">Swiss Private Bank</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-[#DC2626]">$4,250,000</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] text-[10px] font-bold font-mono">
                          RECOVERED (DELETED)
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. TXT FILE PREVIEW */}
          {isTxt && (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-bold text-[#1F2937]">
                  readme_evidence.txt Stream
                </h4>
                <p className="text-xs text-[#6B7280]">
                  Plaintext memo recovered from unallocated slack space.
                </p>
              </div>

              <div className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg p-4 font-mono text-xs text-[#1F2937] whitespace-pre-wrap leading-relaxed">
                {fragment.previewText ||
                  `CONFIDENTIAL MEMORANDUM\nDate: 2026-09-24\nTo: Operation Team\nFrom: M. Sterling\n\nEnsure all disk clusters between 65 and 90 are zeroed out before 00:00 UTC.\nRetain encrypted backup of financial_report.pdf on offshore volume.`}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
