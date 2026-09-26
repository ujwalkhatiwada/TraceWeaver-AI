import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  HardDrive,
  Cpu,
  Layers,
  Binary,
  MessageSquare,
  FileText,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Download,
  Copy,
  Check,
  Search,
  X,
  ChevronRight,
  Sparkles,
  Clock,
  Upload,
  Terminal,
  FileCode,
  Hash,
  Filter,
  Compass,
  Lock,
  ArrowUpRight,
} from 'lucide-react';
import {
  EvidenceFragment,
  DiskImageMetadata,
  DiskSector,
} from '../types/forensics.ts';
import { ForensicTimelineView } from './ForensicTimelineView.tsx';
import {
  downloadEvidenceFragmentFile,
  extractDiskStrings,
  inspectMasterBootRecord,
  ExtractedStringItem,
} from '../forensics/diskParser.ts';
import { calculateShannonEntropy } from '../forensics/cryptoUtils.ts';

interface ForensicWorkbenchProps {
  diskBytes?: Uint8Array | null;
  metadata: DiskImageMetadata;
  fragments: EvidenceFragment[];
  sectors: DiskSector[];
  onBackToWebsite: () => void;
  onOpenPreview: (fragment: EvidenceFragment) => void;
  onOpenPython: () => void;
  onOpenUpload?: () => void;
  onSelectScenario?: (scenario: 'ironvault' | 'antiforensics' | 'flashcorrupt') => void;
  onDownloadCurrentDisk?: () => void;
}

type WorkbenchTab =
  | 'overview'
  | 'timeline'
  | 'recovered_files'
  | 'strings_search'
  | 'sector_map'
  | 'hex_inspector'
  | 'ai_assistant'
  | 'dfir_report';

export const ForensicWorkbench: React.FC<ForensicWorkbenchProps> = ({
  diskBytes,
  metadata,
  fragments,
  sectors,
  onBackToWebsite,
  onOpenPreview,
  onOpenPython,
  onOpenUpload,
  onSelectScenario,
  onDownloadCurrentDisk,
}) => {
  const [activeTab, setActiveTab] = useState<WorkbenchTab>('overview');

  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener (Cmd/Ctrl + K or Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered fragments based on search query
  const filteredFragments = fragments.filter((frag) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      frag.name.toLowerCase().includes(q) ||
      (frag.originalName && frag.originalName.toLowerCase().includes(q)) ||
      frag.fileType.toLowerCase().includes(q) ||
      frag.status.toLowerCase().includes(q) ||
      frag.priorityTier.toLowerCase().includes(q) ||
      (frag.category && frag.category.toLowerCase().includes(q)) ||
      (frag.previewText && frag.previewText.toLowerCase().includes(q)) ||
      (frag.hashSha256 && frag.hashSha256.toLowerCase().includes(q)) ||
      (frag.hashMd5 && frag.hashMd5.toLowerCase().includes(q)) ||
      (frag.defects && frag.defects.some((d) => d.toLowerCase().includes(q))) ||
      `sector ${frag.sectorStart}`.includes(q) ||
      `sector ${frag.sectorEnd}`.includes(q) ||
      frag.sectorStart.toString() === q ||
      frag.sectorEnd.toString() === q
    );
  });

  // Embedded TraceWeaver AI Advisor State in Workbench
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<
    Array<{
      sender: 'bot' | 'user';
      text: string;
      feasibility?: string;
      reason?: string;
      nextSteps?: string[];
    }>
  >([
    {
      sender: 'bot',
      text: 'TraceWeaver AI Advisor ready. Select a pre-calibrated forensic query below or ask about any sector, file, entropy marker, or timeline incident milestone.',
    },
  ]);

  // DFIR Report State
  const [copiedReport, setCopiedReport] = useState(false);

  // Sector Map Selection
  const [selectedSectorIndex, setSelectedSectorIndex] = useState<number>(65);

  // Hex Inspector State
  const [hexMode, setHexMode] = useState<'fragments' | 'sectors'>('fragments');
  const [selectedHexLba, setSelectedHexLba] = useState<number>(0);
  const [hexSelectedFragmentId, setHexSelectedFragmentId] = useState<string>(
    fragments[0]?.id || ''
  );
  const [selectedByteIdx, setSelectedByteIdx] = useState<number>(0);
  const [copiedHex, setCopiedHex] = useState(false);

  // Strings Search & IOC Hunter State
  const [stringsCategoryFilter, setStringsCategoryFilter] = useState<
    'all' | 'network' | 'email' | 'url' | 'financial' | 'command' | 'credentials'
  >('all');
  const [stringsSearchTerm, setStringsSearchTerm] = useState('');

  // Extract strings across the disk bitstream
  const allExtractedStrings = useMemo(() => {
    if (diskBytes && diskBytes.length > 0) {
      return extractDiskStrings(diskBytes, 4, 400);
    }
    // Reconstruct strings from fragments rawBytes if diskBytes is missing
    const combinedBytes = new Uint8Array(
      fragments.reduce((acc, f) => acc + (f.rawBytes?.length || 0), 0)
    );
    let offset = 0;
    for (const f of fragments) {
      if (f.rawBytes) {
        combinedBytes.set(f.rawBytes, offset);
        offset += f.rawBytes.length;
      }
    }
    return extractDiskStrings(combinedBytes, 4, 400);
  }, [diskBytes, fragments]);

  // Filtered strings
  const filteredStrings = useMemo(() => {
    let list = allExtractedStrings;
    if (stringsCategoryFilter !== 'all') {
      list = list.filter((s) => s.category === stringsCategoryFilter);
    }
    if (stringsSearchTerm.trim()) {
      const q = stringsSearchTerm.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.text.toLowerCase().includes(q) ||
          `sector ${s.sectorLba}`.includes(q) ||
          s.sectorLba.toString() === q
      );
    }
    return list;
  }, [allExtractedStrings, stringsCategoryFilter, stringsSearchTerm]);

  // Master Boot Record (MBR) Analysis for Overview
  const mbrResult = useMemo(() => {
    return inspectMasterBootRecord(diskBytes || new Uint8Array(512));
  }, [diskBytes]);

  const totalSectorsCount = Math.max(
    1,
    sectors.length || metadata.sectorCount || (diskBytes ? Math.ceil(diskBytes.length / 512) : 256)
  );

  // Find active hex fragment
  const activeHexFrag =
    fragments.find((f) => f.id === hexSelectedFragmentId) || fragments[0];

  let displayBytes: Uint8Array;
  let activeHexLabel = '';
  let activeHexEntropy = 0;
  let activeSectorOffsetBase = 0;

  if (hexMode === 'sectors') {
    const safeLba = Math.max(0, Math.min(selectedHexLba, totalSectorsCount - 1));
    activeSectorOffsetBase = safeLba * 512;
    if (diskBytes && diskBytes.length >= activeSectorOffsetBase) {
      const end = Math.min(diskBytes.length, activeSectorOffsetBase + 512);
      displayBytes = diskBytes.slice(activeSectorOffsetBase, end);
    } else {
      displayBytes = new Uint8Array(512);
    }
    activeHexEntropy = calculateShannonEntropy(displayBytes);

    // Identify bound fragment for this sector if any
    const boundFrag = fragments.find(
      (f) => safeLba >= f.sectorStart && safeLba <= f.sectorEnd
    );
    if (safeLba === 0) {
      activeHexLabel = 'Physical Sector 0: Master Boot Record (MBR) & Partition Table';
    } else if (boundFrag) {
      activeHexLabel = `Physical Sector ${safeLba}: Allocated to ${boundFrag.name} (${boundFrag.fileType.toUpperCase()})`;
    } else if (activeHexEntropy === 0) {
      activeHexLabel = `Physical Sector ${safeLba}: Zero-Filled / Wiped Slack (Anti-Forensics)`;
    } else {
      activeHexLabel = `Physical Sector ${safeLba}: Raw Unallocated Disk Cluster`;
    }
  } else {
    const hexBytes = activeHexFrag?.rawBytes || new Uint8Array(256);
    displayBytes = hexBytes.subarray(0, Math.min(hexBytes.length, 512));
    activeHexLabel = `${activeHexFrag?.name || 'Artifact'} (${activeHexFrag?.fileType.toUpperCase() || 'DATA'})`;
    activeHexEntropy = calculateShannonEntropy(displayBytes);
  }

  // Jump from String Hunter to Hex Inspector at specific sector and byte
  const handleJumpToStringHex = (strItem: ExtractedStringItem) => {
    setHexMode('sectors');
    setSelectedHexLba(strItem.sectorLba);
    setSelectedByteIdx(strItem.sectorOffset);
    setActiveTab('hex_inspector');
  };

  // Current selected byte computations
  const currentByte = displayBytes[selectedByteIdx] ?? 0;
  const uint8Val = currentByte;
  const int8Val = (currentByte << 24) >> 24;
  const uint16Val =
    selectedByteIdx + 1 < displayBytes.length
      ? displayBytes[selectedByteIdx] | (displayBytes[selectedByteIdx + 1] << 8)
      : 'N/A';
  const uint32Val =
    selectedByteIdx + 3 < displayBytes.length
      ? (displayBytes[selectedByteIdx] |
          (displayBytes[selectedByteIdx + 1] << 8) |
          (displayBytes[selectedByteIdx + 2] << 16) |
          (displayBytes[selectedByteIdx + 3] << 24)) >>>
        0
      : 'N/A';
  const binaryVal = currentByte.toString(2).padStart(8, '0');
  const asciiVal =
    currentByte >= 32 && currentByte <= 126
      ? String.fromCharCode(currentByte)
      : '.';

  // Sector information
  const selectedSector =
    sectors.find((s) => s.sectorIndex === selectedSectorIndex) || {
      sectorIndex: selectedSectorIndex,
      offset: selectedSectorIndex * 512,
      size: 512,
      state: 'unallocated',
      entropy: 0,
      label: `Sector ${selectedSectorIndex}`,
    };

  const boundFile = fragments.find(
    (f) =>
      selectedSectorIndex >= f.sectorStart && selectedSectorIndex <= f.sectorEnd
  );

  const getSectorColor = (sectorIndex: number) => {
    const bound = fragments.find(
      (f) => sectorIndex >= f.sectorStart && sectorIndex <= f.sectorEnd
    );
    if (!bound) return 'bg-[#E5E7EB] hover:bg-neutral-300'; // Gray: Unallocated
    if (bound.status === 'INTACT') return 'bg-[#16A34A] hover:bg-green-700'; // Green: Verified
    if (bound.status === 'PARTIALLY_RECOVERABLE')
      return 'bg-[#D97706] hover:bg-amber-700'; // Orange: Partial/damaged
    return 'bg-[#2563EB] hover:bg-blue-700'; // Blue: Recovered / Stitched
  };

  const handleBotAsk = (questionText: string) => {
    const userMsg = { sender: 'user' as const, text: questionText };
    let reply = {
      sender: 'bot' as const,
      text: '',
      feasibility: 'Very High (95%)',
      reason:
        'The file contains recognizable structural information and enough recoverable data for further analysis.',
      nextSteps: [
        'Inspect recovered sectors',
        'Verify file structure',
        'Export the evidence report',
      ],
    };

    if (questionText.toLowerCase().includes('photo')) {
      reply = {
        sender: 'bot',
        text: 'photo1.jpg has been partially recovered from sectors 35–42.',
        feasibility: 'Partial (70%)',
        reason:
          'JFIF/EXIF header and upper 72% of scanlines are intact. The trailing sectors were zeroed out during an anti-forensic wipe.',
        nextSteps: [
          'Inspect sectors 35 to 42 in Sector Map',
          'Open preview to observe intact image raster',
          'Flag trailing sectors as zero-fill anti-forensics',
        ],
      };
    } else if (
      questionText.toLowerCase().includes('pdf') ||
      questionText.toLowerCase().includes('financial')
    ) {
      reply = {
        sender: 'bot',
        text: 'financial_report.pdf is fully intact and verified.',
        feasibility: 'Very High (100%)',
        reason:
          'Valid %PDF-1.7 header, unbroken catalog dictionary, and verified %%EOF trailer marker with zero byte loss.',
        nextSteps: [
          'Verify cryptographic SHA-256 hash',
          'Preview cleared $4,250,000 wire transaction table',
          'Include in formal DFIR report',
        ],
      };
    } else if (
      questionText.toLowerCase().includes('word') ||
      questionText.toLowerCase().includes('docx') ||
      questionText.toLowerCase().includes('fragment')
    ) {
      reply = {
        sender: 'bot',
        text: 'case_notes.docx was successfully stitched across an unallocated gap.',
        feasibility: 'High (88%)',
        reason:
          'Local ZIP header at Sector 65 was reconnected with orphaned Central Directory at Sector 90 across a 15-sector gap.',
        nextSteps: [
          'Review Sector Map gap between 74 and 90',
          'Inspect word/document.xml payload',
          'Document cluster continuity in report',
        ],
      };
    } else if (questionText.toLowerCase().includes('next')) {
      reply = {
        sender: 'bot',
        text: 'Recommended next investigative steps based on active case priorities:',
        feasibility: 'Decision Ready',
        reason:
          'Top 3 prioritized evidence items (PDF, DOCX, SQLite) correlate to the same offshore transfer sequence.',
        nextSteps: [
          'Review logs.db freelist table for deleted wire approver records',
          'Check readme_evidence.txt for plaintext operator memos',
          'Export signed DFIR Incident Report for legal discovery',
        ],
      };
    }

    setChatMessages((prev) => [...prev, userMsg, reply]);
    setChatInput('');
  };

  const handleExportReport = () => {
    const reportText = `===============================================================
AEGISCARVE DIGITAL FORENSICS INCIDENT REPORT (DFIR)
Case: OPERATION IRONVAULT (DEMONSTRATION SAMPLE)
Generated: ${new Date().toISOString()}
Examiner: Lead Forensic Specialist
Storage Volume: ${metadata.filename} (${metadata.totalSize} bytes, 256 sectors)
Disk SHA-256: ${metadata.sha256}
===============================================================

1. EXECUTIVE SUMMARY
TraceWeaver-AI performed intelligent fragment reconstruction, Shannon entropy 
validation, and evidence prioritization on the acquired 128 KB storage image. 
A total of 5 critical artifacts were carved and classified.

2. EVIDENCE INVENTORY & RECOVERY STATUS
---------------------------------------------------------------
File: financial_report.pdf (PDF)
  Status: INTACT (100%) | Priority: P1 CRITICAL
  Hash: 3c5a78f2e91b4d08...
  Note: Validated %PDF-1.7 container. Confirms $4,250,000 cleared wire transfer.

File: case_notes.docx (DOCX)
  Status: STITCHED | Priority: P1 CRITICAL
  Hash: 9f12b6a782e41c50...
  Note: Reconstructed across 15-sector unallocated gap (Sectors 65-74 -> 90-102).

File: photo1.jpg (JPEG)
  Status: PARTIALLY_RECOVERABLE (70%) | Priority: P2 HIGH
  Hash: e8a209b4f61c37d1...
  Note: JFIF header intact. Trailing scanlines overwritten by zeroes.

File: logs.db (SQLite)
  Status: RECOVERED | Priority: P1 CRITICAL
  Hash: 7b31c9a04f2e85d6...
  Note: Active SQLite database with recovered freelist deleted transactions.

File: readme_evidence.txt (TXT)
  Status: RECOVERED | Priority: P2 HIGH
  Hash: a1b2c3d4e5f60718...
  Note: Plaintext confession memorandum recovered from cluster slack.

3. INTEGRITY & CORRUPTION ASSESSMENT
All artifacts underwent windowed Shannon entropy calculations and structural
MIME parsers. Cryptographic hashes ensure non-repudiation in judicial filings.

4. CHAIN OF CUSTODY
Primary evidence image acquired write-blocked. Analysis executed on verified bitstream copy.
Demonstration dataset created for Hackathon Track 01.
`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TraceWeaver_DFIR_Report_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1F2937] font-sans flex flex-col">
      {/* 1. Top Bar */}
      <header className="bg-white border-b border-[#E5E7EB] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left branding & return */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={onBackToWebsite}
              className="p-1.5 rounded-md hover:bg-[#F3F4F6] text-[#6B7280] hover:text-[#1F2937] transition-none flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="h-4 w-px bg-[#E5E7EB] hidden sm:block" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#1F2937] text-sm tracking-tight hidden md:inline">
                  TRACEWEAVER-AI
                </span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] font-semibold border border-[#DBEAFE]">
                  Workbench
                </span>
              </div>
            </div>
          </div>

          {/* Center: Global Search Bar */}
          <div className="relative flex-1 max-w-xs sm:max-w-sm md:max-w-md">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-[#9CA3AF] absolute left-2.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchOpen(true);
                }}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Search files, keywords, sectors (e.g. pdf, wire, 65)..."
                className="w-full pl-8 pr-14 py-1.5 bg-[#F9FAFB] hover:bg-white focus:bg-white border border-[#E5E7EB] focus:border-[#2563EB] rounded-md text-xs text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#2563EB] transition-none"
              />
              <div className="absolute right-2 flex items-center gap-1">
                {searchQuery ? (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setIsSearchOpen(false);
                    }}
                    className="p-0.5 text-[#9CA3AF] hover:text-[#1F2937] rounded cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <kbd className="hidden lg:inline-flex items-center text-[10px] font-mono px-1.5 py-0.5 bg-white border border-[#E5E7EB] rounded text-[#9CA3AF]">
                    ⌘K
                  </kbd>
                )}
              </div>
            </div>

            {/* Quick Results Dropdown */}
            {isSearchOpen && searchQuery.trim() && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsSearchOpen(false)}
                />
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-[#E5E7EB] rounded-lg shadow-lg z-50 overflow-hidden text-xs">
                  <div className="p-2 bg-[#F9FAFB] border-b border-[#E5E7EB] flex items-center justify-between text-[11px] font-mono text-[#6B7280]">
                    <span>MATCHING ARTIFACTS ({filteredFragments.length})</span>
                    <button
                      onClick={() => {
                        setActiveTab('recovered_files');
                        setIsSearchOpen(false);
                      }}
                      className="text-[#2563EB] hover:underline font-sans font-medium cursor-pointer"
                    >
                      View in table →
                    </button>
                  </div>

                  <div className="max-h-64 overflow-y-auto divide-y divide-[#E5E7EB]">
                    {filteredFragments.length > 0 ? (
                      filteredFragments.map((frag) => (
                        <div
                          key={frag.id}
                          onClick={() => {
                            onOpenPreview(frag);
                            setIsSearchOpen(false);
                          }}
                          className="p-2.5 hover:bg-[#F9FAFB] cursor-pointer flex items-center justify-between gap-3 group"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-[#1F2937] truncate group-hover:text-[#2563EB]">
                                {frag.name}
                              </span>
                              <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 bg-[#F3F4F6] text-[#4B5563] rounded">
                                {frag.fileType}
                              </span>
                              {frag.status === 'INTACT' ? (
                                <span className="text-[10px] font-mono text-[#16A34A] font-semibold">
                                  INTACT
                                </span>
                              ) : frag.chunks.some((c) => c.stitched) ? (
                                <span className="text-[10px] font-mono text-[#2563EB] font-semibold">
                                  STITCHED
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono text-[#D97706] font-semibold">
                                  PARTIAL
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#6B7280] font-mono truncate mt-0.5">
                              Sectors {frag.sectorStart}–{frag.sectorEnd} • {(frag.sizeBytes / 1024).toFixed(1)} KB • Priority {frag.priorityTier}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenPreview(frag);
                              setIsSearchOpen(false);
                            }}
                            className="px-2 py-1 bg-[#EFF6FF] text-[#2563EB] hover:bg-blue-100 rounded text-[11px] font-medium shrink-0 cursor-pointer"
                          >
                            Preview
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-[#6B7280]">
                        No files or keywords matching "{searchQuery}"
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {onOpenUpload && (
              <button
                onClick={onOpenUpload}
                className="text-xs font-mono text-[#374151] hover:text-[#111827] px-2.5 py-1.5 rounded border border-[#D1D5DB] hover:bg-[#F9FAFB] inline-flex items-center gap-1.5 cursor-pointer font-medium bg-white shadow-2xs"
                title="Upload custom raw .dd forensic disk image"
              >
                <Upload className="w-3.5 h-3.5 text-[#2563EB]" />
                <span className="hidden sm:inline">Upload .dd</span>
              </button>
            )}
            <button
              onClick={onOpenPython}
              className="text-xs font-mono text-[#4B5563] hover:text-[#1F2937] px-2.5 py-1.5 rounded border border-[#E5E7EB] hover:bg-[#F9FAFB] hidden md:inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Python Scripts</span>
            </button>
            <button
              onClick={onBackToWebsite}
              className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white font-medium text-xs rounded-md shadow-xs transition-none cursor-pointer"
            >
              Exit Workbench
            </button>
          </div>
        </div>
      </header>

      {/* 2. Four Summary Cards */}
      <div className="bg-white border-b border-[#E5E7EB] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-3 bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg">
            <span className="text-[10px] font-mono uppercase text-[#6B7280] block">
              Disk Sectors
            </span>
            <span className="text-xl sm:text-2xl font-bold text-[#1F2937]">
              {sectors.length || metadata.sectorCount || 256}
            </span>
            <span className="text-[11px] text-[#6B7280] block mt-0.5">512 Bytes / Sector</span>
          </div>

          <div className="p-3 bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg">
            <span className="text-[10px] font-mono uppercase text-[#6B7280] block">
              Disk Image Size
            </span>
            <span className="text-xl sm:text-2xl font-bold text-[#1F2937]">
              {(metadata.totalSize / 1024).toFixed(0)} KB
            </span>
            <span className="text-[11px] text-[#6B7280] block mt-0.5 truncate" title={metadata.filename}>
              {metadata.filename}
            </span>
          </div>

          <div className="p-3 bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg">
            <span className="text-[10px] font-mono uppercase text-[#6B7280] block">
              Recovered Files
            </span>
            <span className="text-xl sm:text-2xl font-bold text-[#2563EB]">
              {fragments.length}
            </span>
            <span className="text-[11px] text-[#6B7280] block mt-0.5">Carved & Stitched</span>
          </div>

          <div className="p-3 bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg">
            <span className="text-[10px] font-mono uppercase text-[#6B7280] block">
              Integrity Status
            </span>
            <span className="text-xl sm:text-2xl font-bold text-[#16A34A] flex items-center gap-1">
              <ShieldCheck className="w-5 h-5 inline text-[#16A34A]" />
              SHA-256
            </span>
            <span className="text-[11px] text-[#6B7280] block mt-0.5 font-mono truncate" title={metadata.sha256}>
              {metadata.sha256 ? `${metadata.sha256.substring(0, 14)}...` : 'Verified'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Workbench Layout (Sidebar + Content) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 flex flex-col md:flex-row gap-6">
        {/* Sidebar (Desktop) / Dropdown (Mobile) */}
        <aside className="w-full md:w-56 shrink-0 space-y-1">
          {/* Mobile Tab Selector */}
          <div className="md:hidden mb-4">
            <label className="text-xs font-mono text-[#6B7280] block mb-1">
              WORKBENCH MODULE
            </label>
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as WorkbenchTab)}
              className="w-full p-2 bg-white border border-[#E5E7EB] rounded-md text-sm font-medium text-[#1F2937]"
            >
              <option value="overview">Overview</option>
              <option value="timeline">Forensic Timeline (IR Team)</option>
              <option value="recovered_files">Recovered Files</option>
              <option value="strings_search">Strings & IOC Hunter ({allExtractedStrings.length})</option>
              <option value="sector_map">Sector Map</option>
              <option value="hex_inspector">Hex Inspector</option>
              <option value="ai_assistant">AI Assistant (TraceWeaver AI)</option>
              <option value="dfir_report">DFIR Report</option>
            </select>
          </div>

          {/* Desktop Sidebar Buttons */}
          <div className="hidden md:flex flex-col space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#6B7280] px-3 py-1 font-semibold">
              Forensic Navigation
            </div>

            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium flex items-center gap-2 cursor-pointer transition-none ${
                activeTab === 'overview'
                  ? 'bg-[#2563EB] text-white font-semibold'
                  : 'text-[#4B5563] hover:bg-white hover:text-[#1F2937]'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('timeline')}
              className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium flex items-center gap-2 cursor-pointer transition-none ${
                activeTab === 'timeline'
                  ? 'bg-[#2563EB] text-white font-semibold'
                  : 'text-[#4B5563] hover:bg-white hover:text-[#1F2937]'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Forensic Timeline</span>
              <span
                className={`ml-auto text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                  activeTab === 'timeline'
                    ? 'bg-blue-800 text-white'
                    : 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
                }`}
              >
                IR
              </span>
            </button>

            <button
              onClick={() => setActiveTab('recovered_files')}
              className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium flex items-center gap-2 cursor-pointer transition-none ${
                activeTab === 'recovered_files'
                  ? 'bg-[#2563EB] text-white font-semibold'
                  : 'text-[#4B5563] hover:bg-white hover:text-[#1F2937]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Recovered Files</span>
              <span
                className={`ml-auto text-[10px] font-mono px-1.5 py-0.2 rounded ${
                  activeTab === 'recovered_files'
                    ? 'bg-blue-800 text-white'
                    : 'bg-[#E5E7EB] text-[#4B5563]'
                }`}
              >
                {searchQuery.trim() ? filteredFragments.length : fragments.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('strings_search')}
              className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium flex items-center gap-2 cursor-pointer transition-none ${
                activeTab === 'strings_search'
                  ? 'bg-[#2563EB] text-white font-semibold'
                  : 'text-[#4B5563] hover:bg-white hover:text-[#1F2937]'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Strings & IOC Hunter</span>
              <span
                className={`ml-auto text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                  activeTab === 'strings_search'
                    ? 'bg-blue-800 text-white'
                    : 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                }`}
              >
                {allExtractedStrings.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('sector_map')}
              className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium flex items-center gap-2 cursor-pointer transition-none ${
                activeTab === 'sector_map'
                  ? 'bg-[#2563EB] text-white font-semibold'
                  : 'text-[#4B5563] hover:bg-white hover:text-[#1F2937]'
              }`}
            >
              <HardDrive className="w-4 h-4" />
              <span>Sector Map</span>
            </button>

            <button
              onClick={() => setActiveTab('hex_inspector')}
              className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium flex items-center gap-2 cursor-pointer transition-none ${
                activeTab === 'hex_inspector'
                  ? 'bg-[#2563EB] text-white font-semibold'
                  : 'text-[#4B5563] hover:bg-white hover:text-[#1F2937]'
              }`}
            >
              <Binary className="w-4 h-4" />
              <span>Hex Inspector</span>
            </button>

            <button
              onClick={() => setActiveTab('ai_assistant')}
              className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium flex items-center gap-2 cursor-pointer transition-none ${
                activeTab === 'ai_assistant'
                  ? 'bg-[#2563EB] text-white font-semibold'
                  : 'text-[#4B5563] hover:bg-white hover:text-[#1F2937]'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>AI Advisor</span>
              <span className="ml-auto w-2 h-2 rounded-full bg-[#16A34A]" />
            </button>

            <button
              onClick={() => setActiveTab('dfir_report')}
              className={`w-full text-left px-3 py-2 rounded-md text-xs font-medium flex items-center gap-2 cursor-pointer transition-none ${
                activeTab === 'dfir_report'
                  ? 'bg-[#2563EB] text-white font-semibold'
                  : 'text-[#4B5563] hover:bg-white hover:text-[#1F2937]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>DFIR Report</span>
            </button>
          </div>
        </aside>

        {/* Content Panel */}
        <main className="flex-1 bg-white border border-[#E5E7EB] rounded-lg p-5 sm:p-6 shadow-xs overflow-hidden">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[#1F2937]">Recovery Summary</h3>
                <p className="text-xs text-[#6B7280] mt-0.5">
                  Automated triage metrics from the synthetic damaged disk acquisition.
                </p>
              </div>

              {/* Recovery Status Counts */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-center">
                  <span className="text-[10px] font-mono text-[#6B7280] block">RECOVERED FILES</span>
                  <span className="text-xl font-bold text-[#1F2937]">{fragments.length}</span>
                </div>
                <div className="p-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg text-center">
                  <span className="text-[10px] font-mono text-[#16A34A] block">INTACT</span>
                  <span className="text-xl font-bold text-[#16A34A]">
                    {fragments.filter((f) => f.status === 'INTACT').length}
                  </span>
                </div>
                <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg text-center">
                  <span className="text-[10px] font-mono text-[#D97706] block">PARTIALLY REC.</span>
                  <span className="text-xl font-bold text-[#D97706]">
                    {fragments.filter((f) => f.status === 'PARTIALLY_RECOVERABLE').length}
                  </span>
                </div>
                <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg text-center">
                  <span className="text-[10px] font-mono text-[#2563EB] block">STITCHED</span>
                  <span className="text-xl font-bold text-[#2563EB]">
                    {fragments.filter((f) => f.chunks && f.chunks.some((c) => c.stitched)).length}
                  </span>
                </div>
                <div className="p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg text-center">
                  <span className="text-[10px] font-mono text-[#4B5563] block">TOTAL SECTORS</span>
                  <span className="text-xl font-bold text-[#4B5563]">{sectors.length || 256}</span>
                </div>
              </div>

              {/* Recent Evidence Table */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#6B7280]">
                    Recent Carved Evidence
                  </h4>
                  <button
                    onClick={() => setActiveTab('recovered_files')}
                    className="text-xs text-[#2563EB] hover:underline font-medium cursor-pointer"
                  >
                    View Full Table →
                  </button>
                </div>

                {searchQuery.trim() && (
                  <div className="flex items-center justify-between p-2 bg-[#EFF6FF] border border-[#BFDBFE] rounded text-xs text-[#1E40AF]">
                    <span>
                      Filtered by "<strong>{searchQuery}</strong>" ({filteredFragments.length} of {fragments.length} files)
                    </span>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-[#2563EB] hover:underline font-semibold text-xs cursor-pointer"
                    >
                      Clear Filter
                    </button>
                  </div>
                )}

                <div className="border border-[#E5E7EB] rounded-lg overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] font-mono text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">FILE</th>
                        <th className="py-2.5 px-3">TYPE</th>
                        <th className="py-2.5 px-3">STATUS</th>
                        <th className="py-2.5 px-3">SECTORS</th>
                        <th className="py-2.5 px-3 text-right">ACTION</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E7EB]">
                      {filteredFragments.length > 0 ? (
                        filteredFragments.map((frag) => (
                          <tr key={frag.id} className="hover:bg-[#F9FAFB]">
                            <td className="py-2.5 px-3 font-semibold text-[#1F2937]">
                              {frag.name}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[#4B5563] uppercase">
                              {frag.fileType}
                            </td>
                            <td className="py-2.5 px-3">
                              {frag.status === 'INTACT' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] font-semibold">
                                  <CheckCircle2 className="w-3 h-3" />
                                  INTACT
                                </span>
                              ) : frag.chunks.some((c) => c.stitched) ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] font-semibold">
                                  <CheckCircle2 className="w-3 h-3" />
                                  STITCHED
                                </span>
                              ) : frag.status === 'PARTIALLY_RECOVERABLE' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] font-semibold">
                                  <AlertTriangle className="w-3 h-3" />
                                  PARTIAL
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] font-semibold">
                                  <XCircle className="w-3 h-3" />
                                  CORRUPTED
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[#6B7280]">
                              {frag.sectorStart} - {frag.sectorEnd}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                onClick={() => onOpenPreview(frag)}
                                className="text-xs text-[#2563EB] hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Preview</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-[#6B7280]">
                            No artifacts matching "{searchQuery}".
                            <button
                              onClick={() => setSearchQuery('')}
                              className="ml-2 text-[#2563EB] underline font-medium cursor-pointer"
                            >
                              Clear search
                            </button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Storage Media & Acquisition Profile */}
              <div className="p-4 bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1F2937] flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-[#2563EB]" />
                      Acquired Storage Bitstream Profile
                    </h4>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">
                      {metadata.scenarioDescription || 'Raw forensic bitstream under write-blocked analysis.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {onOpenUpload && (
                      <button
                        onClick={onOpenUpload}
                        className="px-3 py-1.5 bg-white border border-[#D1D5DB] text-[#2563EB] hover:bg-blue-50 text-xs font-medium rounded-md shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Custom .dd</span>
                      </button>
                    )}
                    {onDownloadCurrentDisk && (
                      <button
                        onClick={onDownloadCurrentDisk}
                        className="px-3 py-1.5 bg-white border border-[#D1D5DB] text-[#374151] hover:bg-neutral-50 text-xs font-medium rounded-md shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
                        title="Download raw bitstream file to test in external tools"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export .dd</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono bg-white p-2.5 rounded border border-[#E5E7EB]">
                  <div>
                    <span className="text-[#6B7280] block text-[10px]">IMAGE NAME</span>
                    <span className="font-semibold text-[#1F2937] truncate block" title={metadata.filename}>
                      {metadata.filename}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block text-[10px]">MASTER SHA-256</span>
                    <span className="font-semibold text-[#16A34A] truncate block" title={metadata.sha256}>
                      {metadata.sha256 ? `${metadata.sha256.substring(0, 18)}...` : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block text-[10px]">CHAIN OF CUSTODY</span>
                    <span className="text-emerald-700 font-semibold block">
                      Read-Only Bitstream Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Physical Media & Master Boot Record (MBR) Analysis Card */}
              <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1F2937] flex items-center gap-1.5">
                      <Binary className="w-3.5 h-3.5 text-[#2563EB]" />
                      Master Boot Record (MBR) & Partition Table (LBA 0)
                    </h4>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">
                      {mbrResult.detectionSummary}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setHexMode('sectors');
                        setSelectedHexLba(0);
                        setSelectedByteIdx(0);
                        setActiveTab('hex_inspector');
                      }}
                      className="px-2.5 py-1 bg-[#EFF6FF] hover:bg-blue-100 text-[#2563EB] rounded text-xs font-medium inline-flex items-center gap-1 cursor-pointer transition-none"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Inspect LBA 0 in Hex</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono bg-[#F8F9FA] p-3 rounded border border-[#E5E7EB]">
                  <div>
                    <span className="text-[#6B7280] block text-[10px]">MBR SIGNATURE</span>
                    <span className={`font-bold flex items-center gap-1 ${mbrResult.hasValidSignature ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
                      {mbrResult.hasValidSignature ? (
                        <CheckCircle2 className="w-3 h-3 text-[#16A34A]" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 text-[#DC2626]" />
                      )}
                      {mbrResult.signatureHex} {mbrResult.hasValidSignature ? '(VALID)' : '(NON-STANDARD)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block text-[10px]">BOOTSTRAP CODE</span>
                    <span className="font-semibold text-[#1F2937]">
                      {mbrResult.hasBootCode ? 'Present (x86/BIOS Code)' : 'Empty / Zero-filled'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block text-[10px]">PARTITION ENTRIES</span>
                    <span className="font-semibold text-[#2563EB]">
                      {mbrResult.partitionEntries.length > 0 ? `${mbrResult.partitionEntries.length} Table Slot(s) Active` : 'Raw Superfloppy / Unpartitioned'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block text-[10px]">BLOCK GEOMETRY</span>
                    <span className="font-semibold text-[#1F2937]">
                      512 Bytes / Sector (LBA Mode)
                    </span>
                  </div>
                </div>

                {mbrResult.partitionEntries.length > 0 && (
                  <div className="border border-[#E5E7EB] rounded overflow-hidden">
                    <table className="w-full text-left font-mono text-[11px]">
                      <thead className="bg-[#F3F4F6] text-[#4B5563] text-[10px] border-b border-[#E5E7EB]">
                        <tr>
                          <th className="py-1.5 px-3">SLOT</th>
                          <th className="py-1.5 px-3">BOOTABLE</th>
                          <th className="py-1.5 px-3">TYPE</th>
                          <th className="py-1.5 px-3">START LBA</th>
                          <th className="py-1.5 px-3">SECTORS</th>
                          <th className="py-1.5 px-3 text-right">SIZE</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5E7EB]">
                        {mbrResult.partitionEntries.map((p) => (
                          <tr key={p.slot} className="hover:bg-[#F9FAFB]">
                            <td className="py-1.5 px-3 font-semibold text-[#1F2937]">Slot #{p.slot}</td>
                            <td className="py-1.5 px-3">
                              {p.bootable ? (
                                <span className="text-[#16A34A] font-bold">0x80 (ACTIVE)</span>
                              ) : (
                                <span className="text-[#6B7280]">0x00 (NO)</span>
                              )}
                            </td>
                            <td className="py-1.5 px-3 font-bold text-[#2563EB]">
                              {p.typeHex} ({p.typeName})
                            </td>
                            <td className="py-1.5 px-3 text-[#1F2937]">{p.startLba}</td>
                            <td className="py-1.5 px-3 text-[#1F2937]">{p.sizeSectors.toLocaleString()}</td>
                            <td className="py-1.5 px-3 text-right font-semibold text-[#1F2937]">{p.sizeKb} KB</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: RECOVERED FILES */}
          {activeTab === 'recovered_files' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[#1F2937]">Recovered Files</h3>
                  <p className="text-xs text-[#6B7280]">
                    Detailed inventory of carved and stitched digital artifacts.
                  </p>
                </div>
                {searchQuery.trim() && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] rounded-full font-mono text-[11px]">
                      Filter: "{searchQuery}" ({filteredFragments.length} matches)
                    </span>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-[#6B7280] hover:text-[#1F2937] hover:underline font-medium cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                )}
              </div>

              <div className="border border-[#E5E7EB] rounded-lg overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] font-mono text-[11px]">
                    <tr>
                      <th className="py-3 px-4">FILENAME</th>
                      <th className="py-3 px-4">TYPE</th>
                      <th className="py-3 px-4">RECOVERY STATUS</th>
                      <th className="py-3 px-4">INTEGRITY</th>
                      <th className="py-3 px-4">PRIORITY</th>
                      <th className="py-3 px-4 text-right">PREVIEW</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {filteredFragments.length > 0 ? (
                      filteredFragments.map((frag) => {
                        const isStitched = frag.chunks.some((c) => c.stitched);
                        return (
                          <tr key={frag.id} className="hover:bg-[#F9FAFB]">
                            <td className="py-3 px-4 font-semibold text-[#1F2937]">
                              {frag.name}
                              <div className="text-[10px] text-[#6B7280] font-mono font-normal">
                                Sectors {frag.sectorStart}–{frag.sectorEnd} • {(frag.sizeBytes / 1024).toFixed(1)} KB
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono uppercase text-[#4B5563]">
                              {frag.fileType}
                            </td>
                            <td className="py-3 px-4">
                              {frag.status === 'INTACT' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] font-semibold">
                                  <CheckCircle2 className="w-3 h-3" />
                                  INTACT
                                </span>
                              ) : isStitched ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] font-semibold">
                                  <CheckCircle2 className="w-3 h-3" />
                                  STITCHED
                                </span>
                              ) : frag.status === 'PARTIALLY_RECOVERABLE' ? (
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] font-semibold">
                                  <AlertTriangle className="w-3 h-3" />
                                  PARTIAL
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] font-semibold">
                                  <XCircle className="w-3 h-3" />
                                  CORRUPTED
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono text-[#1F2937]">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold">
                                  {(frag.integrityFactor * 100).toFixed(0)}%
                                </span>
                                <span className="text-[10px] text-[#6B7280]">
                                  (H={frag.entropy.toFixed(1)})
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono font-bold">
                              {frag.priorityTier === 'CRITICAL' ? (
                                <span className="px-2 py-0.5 rounded bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] text-[10px]">
                                  P1 CRITICAL
                                </span>
                              ) : frag.priorityTier === 'HIGH' ? (
                                <span className="px-2 py-0.5 rounded bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] text-[10px]">
                                  P2 HIGH
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB] text-[10px]">
                                  P3 MEDIUM
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="inline-flex items-center gap-1.5 justify-end">
                                <button
                                  onClick={() => onOpenPreview(frag)}
                                  className="px-2.5 py-1 rounded bg-[#2563EB] hover:bg-blue-700 text-white font-medium text-xs inline-flex items-center gap-1 cursor-pointer transition-none"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Preview</span>
                                </button>
                                <button
                                  onClick={() => downloadEvidenceFragmentFile(frag)}
                                  className="px-2.5 py-1 rounded bg-white hover:bg-[#F3F4F6] text-[#374151] border border-[#D1D5DB] font-medium text-xs inline-flex items-center gap-1 cursor-pointer transition-none"
                                  title={`Download ${frag.name} file to local system`}
                                >
                                  <Download className="w-3 h-3 text-[#2563EB]" />
                                  <span className="hidden sm:inline">Save</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-[#6B7280]">
                          <div className="max-w-xs mx-auto space-y-2">
                            <p>No recovered files or keywords matching "{searchQuery}".</p>
                            <button
                              onClick={() => setSearchQuery('')}
                              className="px-3 py-1.5 bg-[#EFF6FF] text-[#2563EB] hover:bg-blue-100 rounded text-xs font-semibold cursor-pointer"
                            >
                              Clear Search Filter
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: STRINGS & IOC HUNTER */}
          {activeTab === 'strings_search' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[#1F2937] flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-[#2563EB]" />
                    <span>Disk-Wide Strings & IOC Keyword Hunter</span>
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Full bitstream string carving across all physical sectors. Identifies network artifacts, commands, email addresses, and anti-forensics wipers.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[#6B7280]">
                    Matched: <strong className="text-[#1F2937]">{filteredStrings.length}</strong> / {allExtractedStrings.length}
                  </span>
                </div>
              </div>

              {/* Category Pills & Search Box */}
              <div className="bg-[#F8F9FA] p-3 border border-[#E5E7EB] rounded-lg space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {/* Category Pills */}
                  <div className="flex flex-wrap gap-1.5 text-xs font-mono">
                    <button
                      onClick={() => setStringsCategoryFilter('all')}
                      className={`px-2.5 py-1 rounded text-xs transition-none cursor-pointer font-medium ${
                        stringsCategoryFilter === 'all'
                          ? 'bg-[#2563EB] text-white font-semibold'
                          : 'bg-white text-[#4B5563] border border-[#E5E7EB] hover:bg-neutral-50'
                      }`}
                    >
                      All ({allExtractedStrings.length})
                    </button>
                    <button
                      onClick={() => setStringsCategoryFilter('financial')}
                      className={`px-2.5 py-1 rounded text-xs transition-none cursor-pointer font-medium ${
                        stringsCategoryFilter === 'financial'
                          ? 'bg-[#2563EB] text-white font-semibold'
                          : 'bg-white text-[#D97706] border border-[#FDE68A] hover:bg-amber-50'
                      }`}
                    >
                      Financial ({allExtractedStrings.filter((s) => s.category === 'financial').length})
                    </button>
                    <button
                      onClick={() => setStringsCategoryFilter('command')}
                      className={`px-2.5 py-1 rounded text-xs transition-none cursor-pointer font-medium ${
                        stringsCategoryFilter === 'command'
                          ? 'bg-[#2563EB] text-white font-semibold'
                          : 'bg-white text-[#DC2626] border border-[#FECACA] hover:bg-red-50'
                      }`}
                    >
                      Commands / Wipers ({allExtractedStrings.filter((s) => s.category === 'command').length})
                    </button>
                    <button
                      onClick={() => setStringsCategoryFilter('network')}
                      className={`px-2.5 py-1 rounded text-xs transition-none cursor-pointer font-medium ${
                        stringsCategoryFilter === 'network'
                          ? 'bg-[#2563EB] text-white font-semibold'
                          : 'bg-white text-[#2563EB] border border-[#BFDBFE] hover:bg-blue-50'
                      }`}
                    >
                      Network / IPs ({allExtractedStrings.filter((s) => s.category === 'network').length})
                    </button>
                    <button
                      onClick={() => setStringsCategoryFilter('email')}
                      className={`px-2.5 py-1 rounded text-xs transition-none cursor-pointer font-medium ${
                        stringsCategoryFilter === 'email'
                          ? 'bg-[#2563EB] text-white font-semibold'
                          : 'bg-white text-[#4B5563] border border-[#E5E7EB] hover:bg-neutral-50'
                      }`}
                    >
                      Email ({allExtractedStrings.filter((s) => s.category === 'email').length})
                    </button>
                    <button
                      onClick={() => setStringsCategoryFilter('url')}
                      className={`px-2.5 py-1 rounded text-xs transition-none cursor-pointer font-medium ${
                        stringsCategoryFilter === 'url'
                          ? 'bg-[#2563EB] text-white font-semibold'
                          : 'bg-white text-[#4B5563] border border-[#E5E7EB] hover:bg-neutral-50'
                      }`}
                    >
                      URLs ({allExtractedStrings.filter((s) => s.category === 'url').length})
                    </button>
                    <button
                      onClick={() => setStringsCategoryFilter('credentials')}
                      className={`px-2.5 py-1 rounded text-xs transition-none cursor-pointer font-medium ${
                        stringsCategoryFilter === 'credentials'
                          ? 'bg-[#2563EB] text-white font-semibold'
                          : 'bg-white text-[#7C3AED] border border-[#DDD6FE] hover:bg-purple-50'
                      }`}
                    >
                      Credentials ({allExtractedStrings.filter((s) => s.category === 'credentials').length})
                    </button>
                  </div>

                  {/* Search Query Input */}
                  <div className="relative shrink-0 sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                    <input
                      type="text"
                      value={stringsSearchTerm}
                      onChange={(e) => setStringsSearchTerm(e.target.value)}
                      placeholder="Search string, sector, or keyword..."
                      className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#E5E7EB] rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                    />
                    {stringsSearchTerm && (
                      <button
                        onClick={() => setStringsSearchTerm('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Strings Table */}
              <div className="border border-[#E5E7EB] rounded-lg overflow-x-auto max-h-[460px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] font-mono text-[11px] sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3">EXTRACTED STRING ARTIFACT</th>
                      <th className="py-2.5 px-3">CATEGORY</th>
                      <th className="py-2.5 px-3">SECTOR (LBA)</th>
                      <th className="py-2.5 px-3">BYTE OFFSET</th>
                      <th className="py-2.5 px-3">LEN</th>
                      <th className="py-2.5 px-3 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB] font-mono">
                    {filteredStrings.length > 0 ? (
                      filteredStrings.map((s) => (
                        <tr key={s.id} className="hover:bg-[#F9FAFB]">
                          <td className="py-2 px-3 text-[#1F2937] font-semibold max-w-xs sm:max-w-md truncate" title={s.text}>
                            {s.text}
                          </td>
                          <td className="py-2 px-3">
                            {s.category === 'financial' ? (
                              <span className="px-2 py-0.5 rounded bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] text-[10px] font-bold">
                                FINANCIAL
                              </span>
                            ) : s.category === 'command' ? (
                              <span className="px-2 py-0.5 rounded bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] text-[10px] font-bold">
                                COMMAND / WIPER
                              </span>
                            ) : s.category === 'network' ? (
                              <span className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] text-[10px] font-bold">
                                NETWORK / IP
                              </span>
                            ) : s.category === 'email' ? (
                              <span className="px-2 py-0.5 rounded bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] text-[10px] font-bold">
                                EMAIL
                              </span>
                            ) : s.category === 'url' ? (
                              <span className="px-2 py-0.5 rounded bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB] text-[10px] font-bold">
                                URL
                              </span>
                            ) : s.category === 'credentials' ? (
                              <span className="px-2 py-0.5 rounded bg-[#FAF5FF] text-[#7C3AED] border border-[#DDD6FE] text-[10px] font-bold">
                                CREDENTIALS
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-[#F3F4F6] text-[#6B7280] text-[10px]">
                                PLAINTEXT
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-[#1F2937]">
                            LBA {s.sectorLba}
                          </td>
                          <td className="py-2 px-3 text-[#6B7280]">
                            0x{s.offset.toString(16).padStart(8, '0').toUpperCase()}
                          </td>
                          <td className="py-2 px-3 text-[#6B7280]">
                            {s.length} B
                          </td>
                          <td className="py-2 px-3 text-right">
                            <button
                              onClick={() => handleJumpToStringHex(s)}
                              className="px-2.5 py-1 rounded bg-[#EFF6FF] hover:bg-blue-100 text-[#2563EB] font-medium text-xs inline-flex items-center gap-1 cursor-pointer transition-none"
                              title={`Inspect Sector ${s.sectorLba} at offset +${s.sectorOffset} in Hex`}
                            >
                              <Binary className="w-3 h-3" />
                              <span>Inspect Hex</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-[#6B7280]">
                          No strings matching current filter "{stringsSearchTerm}".
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: FORENSIC TIMELINE */}
          {activeTab === 'timeline' && (
            <ForensicTimelineView
              fragments={fragments}
              metadata={metadata}
              onOpenPreview={onOpenPreview}
            />
          )}

          {/* TAB 3: SECTOR MAP */}
          {activeTab === 'sector_map' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-[#1F2937]">Disk Sector Map</h3>
                <p className="text-xs text-[#6B7280]">
                  Visual grid representing 256 disk sectors. Click any sector block to inspect allocation details.
                </p>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono py-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-[#E5E7EB] border border-neutral-300" />
                  <span className="text-[#6B7280]">Unallocated</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-[#2563EB]" />
                  <span className="text-[#6B7280]">Recovered / Stitched</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-[#D97706]" />
                  <span className="text-[#6B7280]">Partial / Damaged</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded bg-[#16A34A]" />
                  <span className="text-[#6B7280]">Verified Intact</span>
                </div>
              </div>

              {/* Sector Grid (16x16 = 256 sectors) */}
              <div className="bg-[#F8F9FA] p-3 border border-[#E5E7EB] rounded-lg">
                <div className="grid grid-cols-16 sm:grid-cols-32 gap-1 max-h-[300px] overflow-y-auto p-1">
                  {Array.from({ length: 256 }).map((_, idx) => {
                    const isSelected = selectedSectorIndex === idx;
                    const colorClass = getSectorColor(idx);

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedSectorIndex(idx)}
                        className={`h-4 w-full rounded-xs transition-none cursor-pointer ${colorClass} ${
                          isSelected ? 'ring-2 ring-[#1F2937] ring-offset-1' : ''
                        }`}
                        title={`Sector ${idx} (Offset: ${idx * 512})`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Sector Inspector Box */}
              <div className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg p-4 font-mono text-xs space-y-2">
                <div className="font-bold text-[#1F2937] text-sm">
                  Sector Inspection: Sector {selectedSectorIndex}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[#4B5563]">
                  <div>
                    <span className="text-[#6B7280] block text-[10px]">SECTOR</span>
                    <span className="font-bold text-[#1F2937]">{selectedSectorIndex}</span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block text-[10px]">BYTE OFFSET</span>
                    <span className="font-bold text-[#1F2937]">{selectedSectorIndex * 512}</span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block text-[10px]">STATUS</span>
                    <span className="font-bold text-[#1F2937]">
                      {boundFile ? (boundFile.chunks.some((c) => c.stitched) ? 'Stitched Fragment' : 'Fragment Block') : 'Unallocated Slack'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block text-[10px]">BOUND FILE</span>
                    <span className="font-bold text-[#2563EB]">
                      {boundFile ? boundFile.name : 'None'}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-[#6B7280] pt-2 border-t border-[#E5E7EB] italic">
                  Note: The sector map is a demonstration visualization based on the project's sample disk image.
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HEX INSPECTOR */}
          {activeTab === 'hex_inspector' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-[#1F2937]">Hex Inspector</h3>
                  <p className="text-xs text-[#6B7280]">
                    Clean hex and ASCII byte inspector with real-time scalar conversions.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Mode Selector Toggle */}
                  <div className="inline-flex rounded-md border border-[#D1D5DB] p-0.5 bg-[#F3F4F6] text-xs font-mono">
                    <button
                      onClick={() => {
                        setHexMode('fragments');
                        setSelectedByteIdx(0);
                      }}
                      className={`px-2.5 py-1 rounded transition-none cursor-pointer font-medium ${
                        hexMode === 'fragments'
                          ? 'bg-white text-[#1F2937] shadow-2xs font-semibold'
                          : 'text-[#4B5563] hover:text-[#111827]'
                      }`}
                    >
                      Carved Fragments
                    </button>
                    <button
                      onClick={() => {
                        setHexMode('sectors');
                        setSelectedByteIdx(0);
                      }}
                      className={`px-2.5 py-1 rounded transition-none cursor-pointer font-medium ${
                        hexMode === 'sectors'
                          ? 'bg-white text-[#1F2937] shadow-2xs font-semibold'
                          : 'text-[#4B5563] hover:text-[#111827]'
                      }`}
                    >
                      Raw Sectors (LBA 0..N)
                    </button>
                  </div>

                  {hexMode === 'fragments' ? (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-[#6B7280] font-mono">ARTIFACT:</label>
                      <select
                        value={hexSelectedFragmentId}
                        onChange={(e) => {
                          setHexSelectedFragmentId(e.target.value);
                          setSelectedByteIdx(0);
                        }}
                        className="p-1.5 bg-white border border-[#E5E7EB] rounded text-xs font-mono text-[#1F2937]"
                      >
                        {fragments.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.fileType.toUpperCase()})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs text-[#6B7280] font-mono">LBA:</label>
                      <button
                        onClick={() => {
                          setSelectedHexLba((prev) => Math.max(0, prev - 1));
                          setSelectedByteIdx(0);
                        }}
                        disabled={selectedHexLba <= 0}
                        className="px-2 py-1 bg-white border border-[#E5E7EB] hover:bg-neutral-50 rounded text-xs font-mono disabled:opacity-40 cursor-pointer"
                        title="Previous Sector"
                      >
                        ◄
                      </button>
                      <input
                        type="number"
                        min={0}
                        max={totalSectorsCount - 1}
                        value={selectedHexLba}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val)) {
                            setSelectedHexLba(Math.max(0, Math.min(val, totalSectorsCount - 1)));
                            setSelectedByteIdx(0);
                          }
                        }}
                        className="w-16 p-1 text-center bg-white border border-[#E5E7EB] rounded text-xs font-mono text-[#1F2937]"
                      />
                      <span className="text-xs font-mono text-[#6B7280]">/ {totalSectorsCount - 1}</span>
                      <button
                        onClick={() => {
                          setSelectedHexLba((prev) => Math.min(totalSectorsCount - 1, prev + 1));
                          setSelectedByteIdx(0);
                        }}
                        disabled={selectedHexLba >= totalSectorsCount - 1}
                        className="px-2 py-1 bg-white border border-[#E5E7EB] hover:bg-neutral-50 rounded text-xs font-mono disabled:opacity-40 cursor-pointer"
                        title="Next Sector"
                      >
                        ►
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Status & Offset Banner */}
              <div className="p-2.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#1F2937]">{activeHexLabel}</span>
                  <span className="text-[#6B7280]">•</span>
                  <span className="text-[#4B5563]">
                    Entropy: <strong className={activeHexEntropy === 0 ? 'text-[#DC2626]' : 'text-[#2563EB]'}>{activeHexEntropy.toFixed(3)}</strong>
                  </span>
                </div>
                {hexMode === 'sectors' && (
                  <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
                    <span>
                      Range: 0x{activeSectorOffsetBase.toString(16).padStart(8, '0').toUpperCase()} - 0x{(activeSectorOffsetBase + displayBytes.length - 1).toString(16).padStart(8, '0').toUpperCase()}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedHexLba(0);
                        setSelectedByteIdx(0);
                      }}
                      className="text-[#2563EB] hover:underline cursor-pointer"
                    >
                      Jump to LBA 0 (MBR)
                    </button>
                  </div>
                )}
              </div>

              {/* Main Hex Viewer Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* 16 Hex Columns + ASCII */}
                <div className="lg:col-span-2 border border-[#E5E7EB] rounded-lg p-3 bg-white font-mono text-xs overflow-x-auto max-h-[360px] overflow-y-auto">
                  <div className="text-[10px] text-[#9CA3AF] border-b border-[#E5E7EB] pb-1 mb-2 flex">
                    <span className="w-20 shrink-0 font-bold">OFFSET</span>
                    <span className="flex-1 font-bold">00 01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F</span>
                    <span className="w-32 shrink-0 font-bold text-right">ASCII</span>
                  </div>

                  {Array.from({ length: Math.ceil(displayBytes.length / 16) }).map((_, rowIdx) => {
                    const rowOffset = rowIdx * 16;
                    const rowSlice = displayBytes.subarray(rowOffset, rowOffset + 16);
                    const hexOffsetStr = (activeSectorOffsetBase + rowOffset).toString(16).padStart(8, '0').toUpperCase();

                    return (
                      <div key={rowIdx} className="flex items-center py-0.5 hover:bg-[#F9FAFB]">
                        <span className="w-20 shrink-0 text-[#6B7280] select-none">{hexOffsetStr}</span>
                        <div className="flex-1 flex gap-1">
                          {Array.from({ length: 16 }).map((_, colIdx) => {
                            const byteIdx = rowOffset + colIdx;
                            if (byteIdx >= displayBytes.length) return <span key={colIdx} className="w-5" />;
                            const byteVal = displayBytes[byteIdx];
                            const isSelected = selectedByteIdx === byteIdx;

                            return (
                              <button
                                key={colIdx}
                                onClick={() => setSelectedByteIdx(byteIdx)}
                                className={`w-5 text-center rounded-xs transition-none cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#2563EB] text-white font-bold'
                                    : 'text-[#1F2937] hover:bg-[#EFF6FF]'
                                }`}
                              >
                                {byteVal.toString(16).padStart(2, '0').toUpperCase()}
                              </button>
                            );
                          })}
                        </div>
                        <span className="w-32 shrink-0 text-right text-[#4B5563] truncate">
                          {Array.from(rowSlice)
                            .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
                            .join('')}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Byte Information Inspector Panel */}
                <div className="border border-[#E5E7EB] rounded-lg p-4 bg-[#F8F9FA] space-y-3 font-mono text-xs">
                  <div className="font-bold text-[#1F2937] text-sm border-b border-[#E5E7EB] pb-2">
                    Byte Information
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between py-1 border-b border-[#E5E7EB]/60">
                      <span className="text-[#6B7280]">Physical Offset</span>
                      <span className="font-bold text-[#1F2937]">
                        0x{(activeSectorOffsetBase + selectedByteIdx).toString(16).toUpperCase()}
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-[#E5E7EB]/60">
                      <span className="text-[#6B7280]">Sector Offset</span>
                      <span className="font-bold text-[#1F2937]">
                        +{selectedByteIdx} (0x{selectedByteIdx.toString(16).toUpperCase()})
                      </span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-[#E5E7EB]/60">
                      <span className="text-[#6B7280]">Uint8</span>
                      <span className="font-bold text-[#1F2937]">{uint8Val}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-[#E5E7EB]/60">
                      <span className="text-[#6B7280]">Int8</span>
                      <span className="font-bold text-[#1F2937]">{int8Val}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-[#E5E7EB]/60">
                      <span className="text-[#6B7280]">Uint16</span>
                      <span className="font-bold text-[#1F2937]">{uint16Val}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-[#E5E7EB]/60">
                      <span className="text-[#6B7280]">Uint32</span>
                      <span className="font-bold text-[#1F2937]">{uint32Val}</span>
                    </div>

                    <div className="flex justify-between py-1 border-b border-[#E5E7EB]/60">
                      <span className="text-[#6B7280]">Binary</span>
                      <span className="font-bold text-[#2563EB]">{binaryVal}</span>
                    </div>

                    <div className="flex justify-between py-1">
                      <span className="text-[#6B7280]">ASCII</span>
                      <span className="font-bold text-[#16A34A]">'{asciiVal}'</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => onOpenPreview(activeHexFrag)}
                      className="w-full py-2 bg-white border border-[#E5E7EB] hover:bg-[#F3F4F6] text-[#1F2937] font-semibold text-xs rounded-md"
                    >
                      Open Full Artifact Preview
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: AI ASSISTANT (TRACEWEAVER AI) */}
          {activeTab === 'ai_assistant' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-[#1F2937]">TraceWeaver AI Advisor</h3>
                <p className="text-xs text-[#6B7280]">
                  Recovery Decision Support powered by statistical entropy, fragment stitching, and LLM reasoning.
                </p>
              </div>

              {/* Quick Questions Chips */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => handleBotAsk('Can my deleted photo be recovered?')}
                  className="px-3 py-1.5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] hover:bg-blue-100 text-xs font-medium cursor-pointer"
                >
                  Can my deleted photo be recovered?
                </button>
                <button
                  onClick={() => handleBotAsk('Is the financial PDF intact?')}
                  className="px-3 py-1.5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] hover:bg-blue-100 text-xs font-medium cursor-pointer"
                >
                  Is the financial PDF intact?
                </button>
                <button
                  onClick={() => handleBotAsk('Can the fragmented Word document be recovered?')}
                  className="px-3 py-1.5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] hover:bg-blue-100 text-xs font-medium cursor-pointer"
                >
                  Can the fragmented Word document be recovered?
                </button>
                <button
                  onClick={() => handleBotAsk('What should I inspect next?')}
                  className="px-3 py-1.5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] hover:bg-blue-100 text-xs font-medium cursor-pointer"
                >
                  What should I inspect next?
                </button>
              </div>

              {/* Messages Container */}
              <div className="border border-[#E5E7EB] rounded-lg p-4 bg-[#F8F9FA] h-[340px] overflow-y-auto space-y-3">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${
                      msg.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-xl p-3 rounded-lg text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-[#2563EB] text-white'
                          : 'bg-white border border-[#E5E7EB] text-[#1F2937]'
                      }`}
                    >
                      <p className="font-medium">{msg.text}</p>

                      {msg.feasibility && (
                        <div className="mt-2.5 pt-2 border-t border-[#E5E7EB] font-sans space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] uppercase font-bold text-[#6B7280]">
                              Recovery Feasibility:
                            </span>
                            <span className="font-bold text-[#16A34A] text-[11px]">
                              {msg.feasibility}
                            </span>
                          </div>
                          {msg.reason && (
                            <p className="text-[11px] text-[#4B5563]">
                              <span className="font-semibold text-[#1F2937]">Reason: </span>
                              {msg.reason}
                            </p>
                          )}
                          {msg.nextSteps && msg.nextSteps.length > 0 && (
                            <div className="pt-1">
                              <span className="font-semibold text-[#1F2937] text-[11px] block mb-0.5">
                                Next Steps:
                              </span>
                              <ol className="list-decimal list-inside text-[11px] text-[#4B5563] space-y-0.5">
                                {msg.nextSteps.map((s, sIdx) => (
                                  <li key={sIdx}>{s}</li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && chatInput && handleBotAsk(chatInput)}
                  placeholder="Ask a question about recovering damaged sectors or files..."
                  className="flex-1 px-3 py-2 bg-white border border-[#E5E7EB] rounded-md text-xs text-[#1F2937] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
                <button
                  onClick={() => chatInput && handleBotAsk(chatInput)}
                  className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-md text-xs font-semibold"
                >
                  Send
                </button>
              </div>

              <p className="text-[10px] text-[#6B7280] italic">
                IMPORTANT: This is a demonstration interface. Recovery feasibility scores and recommendations are calibrated on the sample corrupted volume.
              </p>
            </div>
          )}

          {/* TAB 6: DFIR REPORT */}
          {activeTab === 'dfir_report' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E7EB] pb-4">
                <div>
                  <h3 className="text-lg font-bold text-[#1F2937]">
                    Digital Forensics Incident Report
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    Formal DFIR summary for courtroom submission and investigative archival.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportReport}
                    className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white font-medium text-xs rounded-md flex items-center gap-1.5 shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Report</span>
                  </button>
                </div>
              </div>

              {/* Printable / Viewable Report Document */}
              <div className="border border-[#E5E7EB] rounded-lg p-6 bg-[#FAFAFA] font-mono text-xs space-y-6 text-[#1F2937]">
                {/* 1. Case Summary */}
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-[#1F2937] border-b border-[#E5E7EB] pb-1 uppercase">
                    1. Case Summary
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
                    <div>
                      <span className="text-[#6B7280] block">CASE ID:</span>
                      <span className="font-bold">IRONVAULT-2026-09</span>
                    </div>
                    <div>
                      <span className="text-[#6B7280] block">EXAMINER:</span>
                      <span className="font-bold">Ujwal Khatiwada (Lead)</span>
                    </div>
                    <div>
                      <span className="text-[#6B7280] block">TARGET IMAGE:</span>
                      <span className="font-bold">image.dd (128 KB)</span>
                    </div>
                    <div>
                      <span className="text-[#6B7280] block">STATUS:</span>
                      <span className="font-bold text-[#16A34A]">Completed</span>
                    </div>
                  </div>
                </div>

                {/* 2. Evidence Inventory */}
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-[#1F2937] border-b border-[#E5E7EB] pb-1 uppercase">
                    2. Evidence Inventory
                  </h4>
                  <p className="text-[11px] text-[#4B5563]">
                    5 distinct digital artifacts were carved across 256 sectors.
                  </p>
                  <ul className="list-disc list-inside text-[11px] space-y-1 text-[#4B5563]">
                    <li><span className="font-semibold text-[#1F2937]">financial_report.pdf:</span> Sectors 0–34, 17.5 KB (INTACT)</li>
                    <li><span className="font-semibold text-[#1F2937]">case_notes.docx:</span> Sectors 65–74 and 90–102 (STITCHED across gap)</li>
                    <li><span className="font-semibold text-[#1F2937]">photo1.jpg:</span> Sectors 35–42, 4.0 KB (PARTIALLY RECOVERABLE)</li>
                    <li><span className="font-semibold text-[#1F2937]">logs.db:</span> Sectors 120–150, 15.5 KB (RECOVERED with freelist entries)</li>
                    <li><span className="font-semibold text-[#1F2937]">readme_evidence.txt:</span> Sectors 170–172, 1.2 KB (RECOVERED)</li>
                  </ul>
                </div>

                {/* 3. Recovery Results & Integrity Assessment */}
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-[#1F2937] border-b border-[#E5E7EB] pb-1 uppercase">
                    3. Recovery Results & Integrity Assessment
                  </h4>
                  <p className="text-[11px] text-[#4B5563]">
                    Shannon Entropy thresholds confirmed high-entropy compressed documents and flagged low-entropy zero-fill attacks. Intact container trees verified for PDF and DOCX formats.
                  </p>
                </div>

                {/* 4. Hash Verification & Chain of Custody */}
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-[#1F2937] border-b border-[#E5E7EB] pb-1 uppercase">
                    4. Hash Verification & Chain of Custody
                  </h4>
                  <div className="bg-white p-3 rounded border border-[#E5E7EB] space-y-1 text-[11px]">
                    <div><span className="text-[#6B7280]">Disk Image SHA-256: </span><span className="font-bold">{metadata.sha256}</span></div>
                    <div><span className="text-[#6B7280]">Disk Image MD5: </span><span className="font-bold">{metadata.md5}</span></div>
                    <div><span className="text-[#6B7280]">Acquisition Protocol: </span><span>Write-blocked bitstream copy compliant with NIST SP 800-86</span></div>
                  </div>
                </div>

                {/* 5. Tampering Indicators & Timeline Hypotheses */}
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-[#1F2937] border-b border-[#E5E7EB] pb-1 uppercase">
                    5. Tampering Indicators & Timeline Hypotheses
                  </h4>
                  <p className="text-[11px] text-[#4B5563]">
                    The presence of an artificial 15-sector gap between DOCX local file headers and the central directory, combined with the zero-overwritten tail of photo1.jpg, demonstrates an intentional emergency wipe attempt.
                  </p>
                </div>

                <div className="text-[10px] text-[#6B7280] pt-2 border-t border-[#E5E7EB] italic">
                  Note: Clearly identified as demonstration forensic data for college hackathon presentation.
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
