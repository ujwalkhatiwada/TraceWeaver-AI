import React, { useState } from 'react';
import {
  ArrowRight,
  HardDrive,
  Cpu,
  CheckCircle2,
  SlidersHorizontal,
  LayoutDashboard,
  FileCheck,
  ShieldCheck,
  Search,
  ExternalLink,
  Terminal,
  FileText,
  AlertTriangle,
  XCircle,
  Eye,
  Check,
  Menu,
  X,
  Layers,
  Sparkles,
  Upload,
} from 'lucide-react';
import { EvidenceFragment, DiskImageMetadata } from '../types/forensics.ts';

interface HomePageProps {
  metadata: DiskImageMetadata;
  fragments: EvidenceFragment[];
  onLaunchWorkbench: () => void;
  onOpenPreview: (fragment: EvidenceFragment) => void;
  onOpenPython: () => void;
  onOpenUpload?: () => void;
  onSelectScenario?: (scenario: 'ironvault' | 'antiforensics' | 'flashcorrupt') => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  metadata,
  fragments,
  onLaunchWorkbench,
  onOpenPreview,
  onOpenPython,
  onOpenUpload,
  onSelectScenario,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Helper to find a fragment by filename or fallback
  const getFragmentByName = (namePart: string) => {
    return (
      fragments.find((f) => f.name.toLowerCase().includes(namePart.toLowerCase())) ||
      fragments[0]
    );
  };

  return (
    <div className="bg-[#FFFFFF] text-[#1F2937] font-sans min-h-screen flex flex-col">
      {/* 1. STICKY NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E5E7EB]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Left branding */}
          <div className="flex flex-col">
            <span className="font-extrabold text-[#1F2937] text-base tracking-tight leading-none">
              TRACEWEAVER-AI
            </span>
            <span className="text-[11px] text-[#6B7280] font-normal leading-tight mt-0.5">
              AI-Driven Digital Forensics & Fragment Reconstruction
            </span>
          </div>

          {/* Desktop Right navigation */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#4B5563]">
            <a href="#home" className="hover:text-[#2563EB] transition-none">
              Home
            </a>
            <a href="#about" className="hover:text-[#2563EB] transition-none">
              About
            </a>
            <a href="#timeline" className="hover:text-[#2563EB] transition-none">
              IR Timeline
            </a>
            <a href="#how-it-works" className="hover:text-[#2563EB] transition-none">
              How It Works
            </a>
            <a href="#features" className="hover:text-[#2563EB] transition-none">
              Features
            </a>
            {onOpenUpload && (
              <button
                onClick={onOpenUpload}
                className="px-3 py-1.5 bg-white hover:bg-neutral-50 text-[#374151] border border-[#D1D5DB] font-medium text-xs rounded-md shadow-2xs transition-none cursor-pointer inline-flex items-center gap-1.5"
                title="Upload raw forensic disk image (.dd)"
              >
                <Upload className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Upload .dd</span>
              </button>
            )}
            <button
              onClick={onLaunchWorkbench}
              className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-medium text-sm rounded-md shadow-xs transition-none cursor-pointer"
            >
              Launch Workbench
            </button>
          </nav>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden flex items-center gap-2">
            {onOpenUpload && (
              <button
                onClick={onOpenUpload}
                className="px-2.5 py-1.5 bg-white border border-[#D1D5DB] text-xs font-medium rounded-md shadow-2xs inline-flex items-center gap-1 text-[#374151]"
              >
                <Upload className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Upload</span>
              </button>
            )}
            <button
              onClick={onLaunchWorkbench}
              className="px-3 py-1.5 bg-[#2563EB] text-white text-xs font-medium rounded-md shadow-xs"
            >
              Workbench
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#4B5563] hover:text-[#1F2937] rounded-md border border-[#E5E7EB]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#E5E7EB] bg-white px-4 py-3 space-y-2 text-sm font-medium text-[#4B5563]">
            <a
              href="#home"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1 hover:text-[#2563EB]"
            >
              Home
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1 hover:text-[#2563EB]"
            >
              About
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1 hover:text-[#2563EB]"
            >
              How It Works
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1 hover:text-[#2563EB]"
            >
              Features
            </a>
            <div className="pt-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onLaunchWorkbench();
                }}
                className="w-full py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-center rounded-md"
              >
                Launch Workbench
              </button>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section id="home" className="py-16 sm:py-20 border-b border-[#E5E7EB]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] text-xs font-semibold uppercase tracking-wider">
            <span>AI-DRIVEN DIGITAL FORENSICS</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1F2937] tracking-tight leading-tight">
            TraceWeaver-AI
          </h1>

          <p className="text-base sm:text-lg text-[#4B5563] max-w-3xl mx-auto leading-relaxed">
            An AI-driven digital forensics tool that reconstructs, classifies, and analyzes corrupted data fragments into actionable investigative insights. TraceWeaver-AI goes beyond traditional file carving using statistical entropy and LLMs to analyze raw disk images, piece together fragmented evidence, assess data integrity, and generate plain-English forensic timelines for incident response teams.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onLaunchWorkbench}
              className="px-6 py-3 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-sm rounded-md shadow-xs flex items-center gap-2 cursor-pointer transition-none"
            >
              <span>Launch Forensic Workbench</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#timeline"
              className="px-6 py-3 bg-white hover:bg-[#F9FAFB] text-[#1F2937] border border-[#E5E7EB] font-medium text-sm rounded-md cursor-pointer transition-none"
            >
              View IR Timeline
            </a>
          </div>

          {/* Custom .dd Image Ingestion Callout Card */}
          {onOpenUpload && (
            <div className="pt-2 max-w-2xl mx-auto text-left">
              <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50/80 border border-blue-200/80 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-blue-600 text-white font-semibold uppercase">
                      Custom Evidence
                    </span>
                    <span className="text-xs font-semibold text-neutral-800">
                      Analyze Your Own .dd Disk Image
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Upload any raw bitstream (<code className="font-mono text-[11px] bg-white px-1 py-0.5 rounded border border-neutral-200">.dd</code>, <code className="font-mono text-[11px] bg-white px-1 py-0.5 rounded border border-neutral-200">.raw</code>, <code className="font-mono text-[11px] bg-white px-1 py-0.5 rounded border border-neutral-200">.img</code>) for client-side signature carving, sliding-window Shannon entropy mapping, and automated incident timeline synthesis.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onOpenUpload}
                  className="shrink-0 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-medium text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-none cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload .dd File</span>
                </button>
              </div>
            </div>
          )}

          {/* Three Small Statistics */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-8 text-xs font-mono text-[#6B7280]">
            <div>
              <span className="font-bold text-[#1F2937] text-sm sm:text-base block">256</span>
              <span>Sectors Analyzed</span>
            </div>
            <div className="text-[#D1D5DB]">•</div>
            <div>
              <span className="font-bold text-[#1F2937] text-sm sm:text-base block">128 KB</span>
              <span>Disk Image</span>
            </div>
            <div className="text-[#D1D5DB]">•</div>
            <div>
              <span className="font-bold text-[#2563EB] text-sm sm:text-base block">5</span>
              <span>Reconstructed Files</span>
            </div>
          </div>

          {/* Clean Horizontal/Vertical Pipeline Flow Diagram */}
          <div className="pt-6 max-w-3xl mx-auto">
            <div className="p-4 bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-medium text-[#4B5563]">
                <div className="px-3 py-2 bg-white border border-[#E5E7EB] rounded w-full sm:w-auto text-center">
                  Raw Disk Image
                </div>
                <div className="text-[#9CA3AF] hidden sm:block">→</div>
                <div className="text-[#9CA3AF] sm:hidden">↓</div>
                <div className="px-3 py-2 bg-white border border-[#E5E7EB] rounded w-full sm:w-auto text-center">
                  Entropy & Fragment Carving
                </div>
                <div className="text-[#9CA3AF] hidden sm:block">→</div>
                <div className="text-[#9CA3AF] sm:hidden">↓</div>
                <div className="px-3 py-2 bg-white border border-[#E5E7EB] rounded w-full sm:w-auto text-center">
                  Bi-Directional Stitching
                </div>
                <div className="text-[#9CA3AF] hidden sm:block">→</div>
                <div className="text-[#9CA3AF] sm:hidden">↓</div>
                <div className="px-3 py-2 bg-white border border-[#E5E7EB] rounded w-full sm:w-auto text-center">
                  Integrity & Classification
                </div>
                <div className="text-[#9CA3AF] hidden sm:block">→</div>
                <div className="text-[#9CA3AF] sm:hidden">↓</div>
                <div className="px-3 py-2 bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] rounded w-full sm:w-auto text-center font-bold">
                  Plain-English IR Timeline
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PROBLEM SECTION (Why TraceWeaver-AI?) */}
      <section id="about" className="py-16 border-b border-[#E5E7EB] bg-[#FFFFFF]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-[#1F2937]">Why TraceWeaver-AI?</h2>
            <div className="mt-3 space-y-3 text-sm sm:text-base text-[#4B5563] leading-relaxed">
              <p>
                Traditional file carvers search for known static headers and footers, but they break down when storage is fragmented across unallocated cluster gaps, when anti-forensic tools zero out trailer bytes, or when deleted database records are hidden inside freelist structures.
              </p>
              <p>
                TraceWeaver-AI goes beyond traditional file carving by employing sliding-window Shannon entropy calculations, bi-directional fragment stitching, automated defect classification, and LLM reasoning to produce plain-English forensic timelines for incident response teams.
              </p>
            </div>
          </div>

          {/* Simple Two-Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Left: Traditional Recovery */}
            <div className="p-5 border border-[#E5E7EB] bg-[#F8F9FA] rounded-lg space-y-3">
              <h3 className="font-bold text-sm sm:text-base text-[#1F2937]">
                Traditional Recovery
              </h3>
              <ul className="text-xs sm:text-sm text-[#6B7280] space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-[#9CA3AF]">•</span>
                  <span>Recovers files</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#9CA3AF]">•</span>
                  <span>Produces large file dumps</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#9CA3AF]">•</span>
                  <span>Limited integrity information</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#9CA3AF]">•</span>
                  <span>Manual investigation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#9CA3AF]">•</span>
                  <span>Difficult for non-technical users</span>
                </li>
              </ul>
            </div>

            {/* Right: TraceWeaver-AI */}
            <div className="p-5 border border-[#BFDBFE] bg-[#EFF6FF]/40 rounded-lg space-y-3">
              <h3 className="font-bold text-sm sm:text-base text-[#2563EB]">
                TraceWeaver-AI
              </h3>
              <ul className="text-xs sm:text-sm text-[#1F2937] space-y-2">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                  <span>Reconstructs fragmented & non-contiguous files</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                  <span>Calculates statistical Shannon entropy sliding window</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                  <span>Classifies corruption root-causes and defects</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                  <span>Generates plain-English IR timelines for incident teams</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                  <span>LLM-powered decision support & recovery feasibility</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 3.5. FORENSIC TIMELINE & INCIDENT RECONSTRUCTION SECTION */}
      <section id="timeline" className="py-16 border-b border-[#E5E7EB] bg-[#F8F9FA]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#EFF6FF] border border-[#BFDBFE] text-[#2563EB] text-[11px] font-mono font-bold uppercase tracking-wider mb-2">
                Plain-English Forensic Timelines
              </div>
              <h2 className="text-2xl font-bold text-[#1F2937]">Incident Response Reconstruction</h2>
              <p className="text-xs sm:text-sm text-[#6B7280] mt-1 max-w-xl">
                TraceWeaver-AI connects the dots between raw sector damage, cluster gap fragmentation, and anti-forensics wipe traces to reconstruct chronological event timelines for IR teams.
              </p>
            </div>
            <button
              onClick={onLaunchWorkbench}
              className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-medium text-xs rounded-md shadow-xs flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
            >
              <span>Explore Interactive Timeline</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg shadow-xs space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-mono font-bold">
                <span className="px-2 py-0.5 rounded bg-[#F3F4F6] text-[#4B5563] border border-[#E5E7EB]">PHASE 1 • BASELINE</span>
                <span className="text-[#6B7280]">2026-09-14 11:14 UTC</span>
              </div>
              <h4 className="text-sm font-bold text-[#1F2937]">Legitimate Financial Record Creation</h4>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Audited wire disbursements PDF written contiguously to Sectors 10–28. Intact xref table and verified %%EOF trailer ($4,250,000 USD disbursement schedule).
              </p>
            </div>

            <div className="p-4 bg-white border border-[#FCD34D] bg-[#FFFBEB]/30 rounded-lg shadow-xs space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-mono font-bold">
                <span className="px-2 py-0.5 rounded bg-[#FEF3C7] text-[#D97706] border border-[#FCD34D]">PHASE 2 • TAMPERING</span>
                <span className="text-[#6B7280]">2026-09-14 18:22 UTC</span>
              </div>
              <h4 className="text-sm font-bold text-[#1F2937]">Database Record Deletion & Freelist Alteration</h4>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Unauthorized DELETE queries executed on security database. TraceWeaver-AI recovered deleted transaction records directly from freelist b-tree leaf pages.
              </p>
            </div>

            <div className="p-4 bg-white border border-[#FCA5A5] bg-[#FEF2F2]/30 rounded-lg shadow-xs space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-mono font-bold">
                <span className="px-2 py-0.5 rounded bg-[#FEE2E2] text-[#DC2626] border border-[#FCA5A5]">PHASE 3 • ANTI-FORENSICS</span>
                <span className="text-[#6B7280]">2026-09-14 19:10 UTC</span>
              </div>
              <h4 className="text-sm font-bold text-[#1F2937]">Emergency Zero-Wipe Routine & Cluster Splitting</h4>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Suspect script zeroed unallocated slack clusters and split Word document across a 15-sector gap. TraceWeaver-AI bi-directional carver bridged the gap and reconnected the file.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FOUR OBJECTIVES (What TraceWeaver-AI Does) */}
      <section id="features" className="py-16 border-b border-[#E5E7EB] bg-[#FFFFFF]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-[#1F2937]">What TraceWeaver-AI Does</h2>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
              Engineering solutions targeting the four primary digital recovery objectives.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 01 */}
            <div className="p-5 bg-white border border-[#E5E7EB] rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#2563EB]" />
                <span className="text-xs font-mono font-bold text-[#2563EB]">CARD 01</span>
              </div>
              <h3 className="font-bold text-base text-[#1F2937]">
                Intelligent Fragment Reconstruction
              </h3>
              <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                Finds file fragments and attempts to reconnect them across gaps in the disk.
              </p>
            </div>

            {/* Card 02 */}
            <div className="p-5 bg-white border border-[#E5E7EB] rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />
                <span className="text-xs font-mono font-bold text-[#2563EB]">CARD 02</span>
              </div>
              <h3 className="font-bold text-base text-[#1F2937]">
                Data Integrity Analysis
              </h3>
              <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                Determines whether recovered files are intact, partially recoverable, or corrupted.
              </p>
            </div>

            {/* Card 03 */}
            <div className="p-5 bg-white border border-[#E5E7EB] rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#2563EB]" />
                <span className="text-xs font-mono font-bold text-[#2563EB]">CARD 03</span>
              </div>
              <h3 className="font-bold text-base text-[#1F2937]">
                Evidence Prioritization
              </h3>
              <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                Ranks recovered evidence so investigators can focus on potentially important files first.
              </p>
            </div>

            {/* Card 04 */}
            <div className="p-5 bg-white border border-[#E5E7EB] rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#2563EB]" />
                <span className="text-xs font-mono font-bold text-[#2563EB]">CARD 04</span>
              </div>
              <h3 className="font-bold text-base text-[#1F2937]">
                Investigator Decision Support
              </h3>
              <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                Provides visual analysis and plain-English explanations of recovery results.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section id="how-it-works" className="py-16 border-b border-[#E5E7EB] bg-[#FFFFFF]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-[#1F2937]">How It Works</h2>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
              Automated four-step pipeline from raw bitstream acquisition to prioritized decision support.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 sm:gap-2">
            {/* Step 01 */}
            <div className="p-4 bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg space-y-2 relative">
              <div className="text-xs font-mono font-bold text-[#2563EB]">01</div>
              <h4 className="font-bold text-sm text-[#1F2937]">Acquire</h4>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Analyze a raw disk image.
              </p>
            </div>

            {/* Step 02 */}
            <div className="p-4 bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg space-y-2 relative">
              <div className="text-xs font-mono font-bold text-[#2563EB]">02</div>
              <h4 className="font-bold text-sm text-[#1F2937]">Recover</h4>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Search for recognizable file signatures and fragments.
              </p>
            </div>

            {/* Step 03 */}
            <div className="p-4 bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg space-y-2 relative">
              <div className="text-xs font-mono font-bold text-[#2563EB]">03</div>
              <h4 className="font-bold text-sm text-[#1F2937]">Analyze</h4>
              <p className="text-xs text-[#6B7280] leading-relaxed">
                Check recovered files for structural damage and integrity.
              </p>
            </div>

            {/* Step 04 */}
            <div className="p-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg space-y-2 relative">
              <div className="text-xs font-mono font-bold text-[#2563EB]">04</div>
              <h4 className="font-bold text-sm text-[#1F2937]">Prioritize</h4>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                Rank evidence and provide useful investigative information.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. RECOVERED EVIDENCE SECTION & PRIORITY SYSTEM */}
      <section className="py-16 border-b border-[#E5E7EB] bg-[#F8F9FA]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-[#1F2937]">Recovered Evidence</h2>
              <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
                TraceWeaver-AI organizes recovered artifacts according to their recovery condition and investigative priority.
              </p>
            </div>

            <button
              onClick={onLaunchWorkbench}
              className="text-xs text-[#2563EB] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Open in Full Workbench</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Clean Evidence Table */}
          <div className="bg-white border border-[#E5E7EB] rounded-lg overflow-x-auto shadow-none">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280] font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">FILE</th>
                  <th className="py-3 px-4 font-semibold">TYPE</th>
                  <th className="py-3 px-4 font-semibold">STATUS</th>
                  <th className="py-3 px-4 font-semibold">PRIORITY</th>
                  <th className="py-3 px-4 text-right font-semibold">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {/* 1. financial_report.pdf */}
                <tr className="hover:bg-[#F9FAFB]">
                  <td className="py-3 px-4 font-semibold text-[#1F2937]">
                    financial_report.pdf
                  </td>
                  <td className="py-3 px-4 font-mono text-[#4B5563]">PDF</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] font-semibold">
                      <Check className="w-3 h-3" />
                      INTACT
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-[#DC2626]">
                    P1 CRITICAL
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onOpenPreview(getFragmentByName('financial_report.pdf'))}
                      className="text-xs text-[#2563EB] hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Preview</span>
                    </button>
                  </td>
                </tr>

                {/* 2. case_notes.docx */}
                <tr className="hover:bg-[#F9FAFB]">
                  <td className="py-3 px-4 font-semibold text-[#1F2937]">
                    case_notes.docx
                  </td>
                  <td className="py-3 px-4 font-mono text-[#4B5563]">DOCX</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] font-semibold">
                      <Check className="w-3 h-3" />
                      STITCHED
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-[#DC2626]">
                    P1 CRITICAL
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onOpenPreview(getFragmentByName('case_notes.docx'))}
                      className="text-xs text-[#2563EB] hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Preview</span>
                    </button>
                  </td>
                </tr>

                {/* 3. photo1.jpg */}
                <tr className="hover:bg-[#F9FAFB]">
                  <td className="py-3 px-4 font-semibold text-[#1F2937]">
                    photo1.jpg
                  </td>
                  <td className="py-3 px-4 font-mono text-[#4B5563]">JPEG</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] font-semibold">
                      <AlertTriangle className="w-3 h-3" />
                      PARTIAL
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-[#D97706]">
                    P2 HIGH
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onOpenPreview(getFragmentByName('photo1.jpg'))}
                      className="text-xs text-[#2563EB] hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Preview</span>
                    </button>
                  </td>
                </tr>

                {/* 4. logs.db */}
                <tr className="hover:bg-[#F9FAFB]">
                  <td className="py-3 px-4 font-semibold text-[#1F2937]">
                    logs.db
                  </td>
                  <td className="py-3 px-4 font-mono text-[#4B5563]">SQLite</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] font-semibold">
                      <Check className="w-3 h-3" />
                      RECOVERED
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-[#DC2626]">
                    P1 CRITICAL
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onOpenPreview(getFragmentByName('logs.db'))}
                      className="text-xs text-[#2563EB] hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Preview</span>
                    </button>
                  </td>
                </tr>

                {/* 5. readme_evidence.txt */}
                <tr className="hover:bg-[#F9FAFB]">
                  <td className="py-3 px-4 font-semibold text-[#1F2937]">
                    readme_evidence.txt
                  </td>
                  <td className="py-3 px-4 font-mono text-[#4B5563]">TXT</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] font-semibold">
                      <Check className="w-3 h-3" />
                      RECOVERED
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-[#D97706]">
                    P2 HIGH
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onOpenPreview(getFragmentByName('readme_evidence.txt'))}
                      className="text-xs text-[#2563EB] hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Preview</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Evidence Priority System Explanation */}
          <div className="bg-white border border-[#E5E7EB] rounded-lg p-5 space-y-3">
            <h3 className="font-bold text-sm text-[#1F2937]">Evidence Priority System</h3>
            <p className="text-xs text-[#6B7280]">
              Mathematical classification mapping evidence relevance, file structure intactness, and investigative value.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-md">
                <span className="font-bold text-[#DC2626] block">P1 CRITICAL</span>
                <span className="text-[#1F2937] text-sm font-semibold">80–100</span>
                <span className="text-[10px] text-[#6B7280] block mt-0.5">Financial & Logs</span>
              </div>
              <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-md">
                <span className="font-bold text-[#D97706] block">P2 HIGH</span>
                <span className="text-[#1F2937] text-sm font-semibold">65–79</span>
                <span className="text-[10px] text-[#6B7280] block mt-0.5">Images & Notes</span>
              </div>
              <div className="p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-md">
                <span className="font-bold text-[#4B5563] block">P3 MEDIUM</span>
                <span className="text-[#1F2937] text-sm font-semibold">45–64</span>
                <span className="text-[10px] text-[#6B7280] block mt-0.5">System Artifacts</span>
              </div>
              <div className="p-3 bg-[#F9FAFB] border border-[#E5E7EB] rounded-md">
                <span className="font-bold text-[#9CA3AF] block">P4 LOW</span>
                <span className="text-[#1F2937] text-sm font-semibold">Below 45</span>
                <span className="text-[10px] text-[#6B7280] block mt-0.5">Unallocated Slack</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PROJECT DEMONSTRATION SECTION (See the Recovery Process) */}
      <section className="py-16 border-b border-[#E5E7EB] bg-[#FFFFFF]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-[#1F2937]">See the Recovery Process</h2>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
              Select an artifact below to inspect real structural reconstruction and integrity metrics.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* CARD 1: Fragment Reconstruction */}
            <div className="p-5 border border-[#E5E7EB] rounded-lg bg-white flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-[#6B7280] uppercase tracking-wider block">
                  Fragment Reconstruction
                </span>
                <h4 className="font-bold text-sm text-[#1F2937]">case_notes.docx</h4>
                <div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] font-semibold">
                    <Check className="w-3 h-3" />
                    STITCHED
                  </span>
                </div>
                <p className="text-xs text-[#6B7280] leading-relaxed pt-1">
                  Recovered document fragments were connected across a disk gap.
                </p>
              </div>

              <button
                onClick={() => onOpenPreview(getFragmentByName('case_notes.docx'))}
                className="w-full py-2 bg-white hover:bg-[#F9FAFB] border border-[#E5E7EB] text-[#1F2937] font-semibold text-xs rounded-md cursor-pointer transition-none text-center"
              >
                View Evidence
              </button>
            </div>

            {/* CARD 2: Integrity Assessment */}
            <div className="p-5 border border-[#E5E7EB] rounded-lg bg-white flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-[#6B7280] uppercase tracking-wider block">
                  Integrity Assessment
                </span>
                <h4 className="font-bold text-sm text-[#1F2937]">financial_report.pdf</h4>
                <div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] font-semibold">
                    <Check className="w-3 h-3" />
                    INTACT — 100%
                  </span>
                </div>
                <p className="text-xs text-[#6B7280] leading-relaxed pt-1">
                  The recovered file passed structural integrity checks.
                </p>
              </div>

              <button
                onClick={() => onOpenPreview(getFragmentByName('financial_report.pdf'))}
                className="w-full py-2 bg-white hover:bg-[#F9FAFB] border border-[#E5E7EB] text-[#1F2937] font-semibold text-xs rounded-md cursor-pointer transition-none text-center"
              >
                View Evidence
              </button>
            </div>

            {/* CARD 3: Partial Recovery */}
            <div className="p-5 border border-[#E5E7EB] rounded-lg bg-white flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-[#6B7280] uppercase tracking-wider block">
                  Partial Recovery
                </span>
                <h4 className="font-bold text-sm text-[#1F2937]">photo1.jpg</h4>
                <div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] font-semibold">
                    <AlertTriangle className="w-3 h-3" />
                    PARTIALLY RECOVERABLE
                  </span>
                </div>
                <p className="text-xs text-[#6B7280] leading-relaxed pt-1">
                  The image contains recoverable data but has a damaged trailing section.
                </p>
              </div>

              <button
                onClick={() => onOpenPreview(getFragmentByName('photo1.jpg'))}
                className="w-full py-2 bg-white hover:bg-[#F9FAFB] border border-[#E5E7EB] text-[#1F2937] font-semibold text-xs rounded-md cursor-pointer transition-none text-center"
              >
                View Evidence
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. TECHNOLOGY SECTION (Built With) */}
      <section className="py-16 border-b border-[#E5E7EB] bg-[#F8F9FA]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-[#1F2937]">Built With</h2>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
              Engineered using production forensics algorithms, TypeScript, and Python.
            </p>
          </div>

          {/* Simple Technology Tags */}
          <div className="flex flex-wrap gap-2 text-xs font-medium text-[#1F2937]">
            <span className="px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-md">Python</span>
            <span className="px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-md">React</span>
            <span className="px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-md">TypeScript</span>
            <span className="px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-md">Express</span>
            <span className="px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-md">Digital Forensics</span>
            <span className="px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-md">File Carving</span>
            <span className="px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-md">AI Analysis</span>
            <span className="px-3 py-1.5 bg-white border border-[#E5E7EB] rounded-md">SHA-256</span>
          </div>

          {/* Main Python Modules */}
          <div className="p-4 bg-white border border-[#E5E7EB] rounded-lg space-y-2">
            <div className="text-xs font-semibold text-[#1F2937] flex items-center justify-between">
              <span>Main Python Modules</span>
              <button
                onClick={onOpenPython}
                className="text-xs text-[#2563EB] hover:underline font-mono"
              >
                View Source Files →
              </button>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] font-mono text-[#4B5563]">
              <span className="bg-[#F8F9FA] px-2 py-1 rounded border border-[#E5E7EB]">carving.py</span>
              <span className="bg-[#F8F9FA] px-2 py-1 rounded border border-[#E5E7EB]">digler_carver.py</span>
              <span className="bg-[#F8F9FA] px-2 py-1 rounded border border-[#E5E7EB]">integrity.py</span>
              <span className="bg-[#F8F9FA] px-2 py-1 rounded border border-[#E5E7EB]">data_recovery_py.py</span>
              <span className="bg-[#F8F9FA] px-2 py-1 rounded border border-[#E5E7EB]">prioritize.py</span>
              <span className="bg-[#F8F9FA] px-2 py-1 rounded border border-[#E5E7EB]">app.py</span>
            </div>
          </div>
        </div>
      </section>

      {/* 9. SIMPLE CLEAN FOOTER */}
      <footer className="py-10 bg-white text-xs text-[#6B7280]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="font-extrabold text-[#1F2937] text-sm tracking-tight">
              TRACEWEAVER-AI
            </div>
            <p className="text-[11px] text-[#6B7280] mt-0.5">
              AI-Driven Digital Forensics & Fragment Reconstruction
            </p>
            <p className="text-[11px] text-[#9CA3AF] mt-2">
              Built by Ujwal Khatiwada
              <br />
              Information Science Engineering
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs font-mono">
            <button onClick={onOpenPython} className="hover:text-[#1F2937] cursor-pointer">
              Documentation
            </button>
            <span className="hidden sm:inline text-[#D1D5DB]">•</span>
            <button onClick={onOpenPython} className="hover:text-[#1F2937] cursor-pointer">
              Python Code
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-[10px] text-[#9CA3AF] mt-6 pt-4 border-t border-[#E5E7EB]">
          © 2026 TraceWeaver-AI
        </div>
      </footer>
    </div>
  );
};
