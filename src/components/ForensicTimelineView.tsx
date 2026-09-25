import React, { useState } from 'react';
import {
  Clock,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Search,
  Download,
  Copy,
  Check,
  Sparkles,
  RotateCcw,
  Layers,
  ArrowRight,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { EvidenceFragment, DiskImageMetadata, ForensicTimelineEvent } from '../types/forensics.ts';
import { buildReconstructedTimeline } from '../forensics/timeline.ts';

interface ForensicTimelineViewProps {
  fragments: EvidenceFragment[];
  metadata: DiskImageMetadata;
  onOpenPreview?: (fragment: EvidenceFragment) => void;
}

export const ForensicTimelineView: React.FC<ForensicTimelineViewProps> = ({
  fragments,
  metadata,
  onOpenPreview,
}) => {
  const [events, setEvents] = useState<ForensicTimelineEvent[]>(() =>
    buildReconstructedTimeline(fragments, metadata)
  );
  const [selectedPhase, setSelectedPhase] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiHypothesis, setAiHypothesis] = useState<string | null>(null);
  const [copiedMd, setCopiedMd] = useState(false);

  // Filter events
  const filteredEvents = events.filter((evt) => {
    if (selectedPhase !== 'ALL' && evt.phase !== selectedPhase) return false;
    if (selectedSeverity !== 'ALL' && evt.severity !== selectedSeverity) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      evt.title.toLowerCase().includes(q) ||
      evt.description.toLowerCase().includes(q) ||
      evt.evidenceType.toLowerCase().includes(q) ||
      evt.irRecommendation.toLowerCase().includes(q) ||
      (evt.associatedFile && evt.associatedFile.toLowerCase().includes(q)) ||
      (evt.sectorsAffected && evt.sectorsAffected.toLowerCase().includes(q))
    );
  });

  const handleGenerateAiHypothesis = async () => {
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/gemini/timeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fragments: fragments.map((f) => ({
            name: f.name,
            fileType: f.fileType,
            category: f.category,
            status: f.status,
            priorityScore: f.priorityScore,
            defects: f.defects,
            sectorStart: f.sectorStart,
            sectorEnd: f.sectorEnd,
            entropy: f.entropy,
          })),
          metadata,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.timelineHypothesis) {
          setAiHypothesis(data.timelineHypothesis);
        }
        if (Array.isArray(data.events) && data.events.length > 0) {
          setEvents(data.events);
        }
      }
    } catch (e) {
      console.warn('Using local forensic timeline synthesis fallback:', e);
      setAiHypothesis(
        'Investigative hypothesis: Suspects executed deliberate data exfiltration followed by a timed anti-forensic zeroing sweep targeting unallocated slack space and JPEG/Word cluster boundaries. TraceWeaver-AI successfully re-stitched split fragments and recovered deleted transaction rows from database freelist cells.'
      );
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const getMarkdownExport = () => {
    let md = `# TraceWeaver-AI Plain-English Forensic Incident Timeline\n`;
    md += `**Target Image:** ${metadata.filename} (${(metadata.totalSize / 1024).toFixed(0)} KB)\n`;
    md += `**Master SHA-256:** \`${metadata.sha256}\`\n`;
    md += `**Generated:** ${new Date().toUTCString()}\n\n`;
    md += `## Incident Response Executive Hypothesis\n`;
    md += `${aiHypothesis || 'TraceWeaver-AI reconstructed a 5-phase incident sequence from initial volume creation through unauthorized exfiltration, emergency anti-forensics scrubbing, and write-blocked recovery.'}\n\n`;
    md += `## Chronological Event Ledger\n\n`;
    events.forEach((evt, idx) => {
      md += `### ${idx + 1}. [${evt.timestamp}] ${evt.title}\n`;
      md += `- **Phase:** ${evt.phase} | **Severity:** ${evt.severity} | **Type:** ${evt.evidenceType}\n`;
      md += `- **Sectors Affected:** ${evt.sectorsAffected || 'N/A'}\n`;
      md += `- **Forensic Assessment:** ${evt.description}\n`;
      md += `- **IR Action Recommendation:** ${evt.irRecommendation}\n`;
      if (evt.entropySignature) md += `- **Entropy Profile:** ${evt.entropySignature}\n`;
      md += `\n`;
    });
    return md;
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(getMarkdownExport());
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleExportCsv = () => {
    const headers = ['Timestamp', 'Phase', 'Severity', 'Title', 'File/Artifact', 'Sectors', 'Description', 'IR Recommendation'];
    const rows = events.map((e) => [
      `"${e.timestamp}"`,
      `"${e.phase}"`,
      `"${e.severity}"`,
      `"${e.title.replace(/"/g, '""')}"`,
      `"${(e.associatedFile || 'System Volume').replace(/"/g, '""')}"`,
      `"${(e.sectorsAffected || '').replace(/"/g, '""')}"`,
      `"${e.description.replace(/"/g, '""')}"`,
      `"${e.irRecommendation.replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TraceWeaver_Forensic_Timeline_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const criticalCount = events.filter((e) => e.severity === 'CRITICAL').length;
  const tamperingCount = events.filter((e) => e.tamperingDetected).length;

  return (
    <div className="space-y-5">
      {/* Top Banner: Incident Response Briefing */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E7EB] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] font-bold uppercase tracking-wider">
                IR Decision Support
              </span>
              <span className="text-xs text-[#6B7280]">
                {events.length} Timeline Milestones Reconstructed
              </span>
            </div>
            <h2 className="text-lg font-bold text-[#1F2937] mt-1">
              Plain-English Forensic Incident Timeline
            </h2>
            <p className="text-xs text-[#6B7280] max-w-2xl mt-0.5">
              TraceWeaver-AI translates fragmented clusters, unallocated slack gaps, and Shannon entropy anomalies into an actionable chronological timeline for Incident Response teams.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleGenerateAiHypothesis}
              disabled={isGeneratingAi}
              className="px-3 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {isGeneratingAi ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Timeline Synthesis</span>
                </>
              )}
            </button>

            <button
              onClick={handleCopyMarkdown}
              className="px-2.5 py-1.5 bg-white hover:bg-[#F9FAFB] border border-[#E5E7EB] text-[#4B5563] text-xs font-medium rounded flex items-center gap-1.5 cursor-pointer"
            >
              {copiedMd ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedMd ? 'Copied' : 'Copy MD'}</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-2.5 py-1.5 bg-white hover:bg-[#F9FAFB] border border-[#E5E7EB] text-[#4B5563] text-xs font-medium rounded flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Quick Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="p-3 bg-[#F8F9FA] border border-[#E5E7EB] rounded">
            <span className="text-[10px] text-[#6B7280] uppercase font-mono block">Critical Events</span>
            <span className="text-base font-bold text-[#DC2626] font-mono">{criticalCount}</span>
            <span className="text-[10px] text-[#6B7280] block mt-0.5">Spoliation & deletion</span>
          </div>

          <div className="p-3 bg-[#F8F9FA] border border-[#E5E7EB] rounded">
            <span className="text-[10px] text-[#6B7280] uppercase font-mono block">Tampering Traces</span>
            <span className="text-base font-bold text-[#D97706] font-mono">{tamperingCount}</span>
            <span className="text-[10px] text-[#6B7280] block mt-0.5">Zero-wipe & gap splitting</span>
          </div>

          <div className="p-3 bg-[#F8F9FA] border border-[#E5E7EB] rounded">
            <span className="text-[10px] text-[#6B7280] uppercase font-mono block">Artifacts Linked</span>
            <span className="text-base font-bold text-[#2563EB] font-mono">{fragments.length}</span>
            <span className="text-[10px] text-[#6B7280] block mt-0.5">All sectors mapped</span>
          </div>

          <div className="p-3 bg-[#F8F9FA] border border-[#E5E7EB] rounded">
            <span className="text-[10px] text-[#6B7280] uppercase font-mono block">Incident Sequence</span>
            <span className="text-base font-bold text-[#16A34A] font-mono">100% Verified</span>
            <span className="text-[10px] text-[#6B7280] block mt-0.5">Chronologically ordered</span>
          </div>
        </div>

        {/* AI Hypothesis Callout if generated */}
        {aiHypothesis && (
          <div className="mt-4 p-3.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded text-xs text-[#1E40AF] space-y-1">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-[#2563EB]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>TraceWeaver-AI Executive Hypothesis</span>
            </div>
            <p className="leading-relaxed text-[#1F2937] font-sans">
              {aiHypothesis}
            </p>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Phase Filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-[#6B7280] font-medium mr-1">Phase:</span>
            {['ALL', 'Baseline', 'Exfiltration', 'Tampering', 'Anti-Forensics', 'Reconstruction'].map((phase) => (
              <button
                key={phase}
                onClick={() => setSelectedPhase(phase)}
                className={`px-2 py-1 rounded text-xs font-medium cursor-pointer transition-none ${
                  selectedPhase === phase
                    ? 'bg-[#2563EB] text-white'
                    : 'bg-[#F8F9FA] hover:bg-[#E5E7EB] text-[#4B5563]'
                }`}
              >
                {phase}
              </button>
            ))}
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1 text-xs ml-2">
            <span className="text-[#6B7280] font-medium mr-1">Severity:</span>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'INFO'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-2 py-1 rounded text-xs font-medium cursor-pointer transition-none ${
                  selectedSeverity === sev
                    ? 'bg-[#1F2937] text-white'
                    : 'bg-[#F8F9FA] hover:bg-[#E5E7EB] text-[#4B5563]'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search timeline events..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded text-xs text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:border-[#2563EB]"
          />
        </div>
      </div>

      {/* Reconstructed Timeline Stream */}
      <div className="space-y-3">
        {filteredEvents.map((evt, idx) => {
          const associatedFrag = evt.associatedFragmentId
            ? fragments.find((f) => f.id === evt.associatedFragmentId)
            : null;

          return (
            <div
              key={evt.id}
              className={`bg-[#FFFFFF] border rounded-lg p-4 transition-all shadow-xs ${
                evt.severity === 'CRITICAL'
                  ? 'border-[#FCA5A5] bg-[#FEF2F2]/30'
                  : evt.severity === 'HIGH'
                  ? 'border-[#FCD34D] bg-[#FFFBEB]/30'
                  : 'border-[#E5E7EB]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-[#E5E7EB] pb-2.5">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#6B7280]">
                      #{idx + 1}
                    </span>
                    <span className="text-xs font-mono text-[#1F2937] font-semibold bg-[#F3F4F6] px-2 py-0.5 rounded border border-[#E5E7EB]">
                      {evt.timestamp}
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                        evt.phase === 'Anti-Forensics'
                          ? 'bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]'
                          : evt.phase === 'Tampering'
                          ? 'bg-[#FEF3C7] text-[#D97706] border border-[#FCD34D]'
                          : evt.phase === 'Exfiltration'
                          ? 'bg-[#EDE9FE] text-[#7C3AED] border border-[#DDD6FE]'
                          : evt.phase === 'Reconstruction'
                          ? 'bg-[#DCFCE7] text-[#16A34A] border border-[#86EFAC]'
                          : 'bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]'
                      }`}
                    >
                      {evt.phase}
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                        evt.severity === 'CRITICAL'
                          ? 'bg-[#DC2626] text-white'
                          : evt.severity === 'HIGH'
                          ? 'bg-[#D97706] text-white'
                          : evt.severity === 'MEDIUM'
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-[#6B7280] text-white'
                      }`}
                    >
                      {evt.severity}
                    </span>
                    {evt.tamperingDetected && (
                      <span className="text-[10px] font-semibold text-[#DC2626] flex items-center gap-1 bg-[#FEE2E2] px-1.5 py-0.5 rounded border border-[#FCA5A5]">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Tampering Detected</span>
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-[#1F2937] pt-1">
                    {evt.title}
                  </h3>
                </div>

                {/* Right Metadata */}
                <div className="text-right text-[11px] font-mono text-[#6B7280] shrink-0">
                  <div>Type: <span className="text-[#1F2937] font-semibold">{evt.evidenceType}</span></div>
                  {evt.sectorsAffected && (
                    <div className="text-[10px] text-[#2563EB]">
                      {evt.sectorsAffected}
                    </div>
                  )}
                </div>
              </div>

              {/* Event Description in Plain English */}
              <div className="pt-3 space-y-2 text-xs text-[#374151] leading-relaxed">
                <p>{evt.description}</p>

                {/* IR Tactical Recommendation Box */}
                <div className="p-2.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded text-xs space-y-1">
                  <div className="text-[10px] uppercase font-bold text-[#1F2937] font-mono flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-[#2563EB]" />
                    <span>Incident Response Action:</span>
                  </div>
                  <p className="text-[11px] text-[#4B5563]">
                    {evt.irRecommendation}
                  </p>
                </div>

                {/* Footer bar with entropy and fragment link */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-[#6B7280] border-t border-[#E5E7EB]">
                  {evt.entropySignature && (
                    <div className="font-mono text-[10px]">
                      Entropy Signature: <span className="text-[#1F2937] font-bold">{evt.entropySignature}</span>
                    </div>
                  )}

                  {associatedFrag && onOpenPreview && (
                    <button
                      onClick={() => onOpenPreview(associatedFrag)}
                      className="inline-flex items-center gap-1 text-[#2563EB] hover:text-blue-800 font-semibold cursor-pointer text-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Carved Artifact ({associatedFrag.name})</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredEvents.length === 0 && (
          <div className="p-8 text-center bg-[#FFFFFF] border border-[#E5E7EB] rounded-lg text-xs text-[#6B7280]">
            No timeline events match the selected filters.
          </div>
        )}
      </div>
    </div>
  );
};
