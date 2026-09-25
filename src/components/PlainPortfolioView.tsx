import React from 'react';
import {
  ExternalLink,
  Shield,
  Layers,
  ArrowRight,
  Code2,
  Cpu,
  Database,
  FileCheck,
  Terminal,
} from 'lucide-react';
import { ThemeConfig } from '../types/themes.ts';
import { EvidenceFragment, DiskImageMetadata } from '../types/forensics.ts';

interface PlainPortfolioViewProps {
  currentTheme: ThemeConfig;
  metadata: DiskImageMetadata;
  fragments: EvidenceFragment[];
  onOpenChat: () => void;
  onOpenReport: () => void;
  onOpenPython: () => void;
  onSwitchToWorkbench: () => void;
  onSelectFragment: (fragment: EvidenceFragment) => void;
}

export const PlainPortfolioView: React.FC<PlainPortfolioViewProps> = ({
  currentTheme,
  metadata,
  fragments,
  onOpenChat,
  onOpenReport,
  onOpenPython,
  onSwitchToWorkbench,
  onSelectFragment,
}) => {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-16">
      {/* Hero Section */}
      <section className="space-y-6 pt-4 border-b border-[#E5E7EB] pb-12">
        <div className="space-y-2">
          <div className="text-xs uppercase font-mono text-[#2563EB] tracking-wider font-semibold">
            Digital Forensics & Incident Response Portfolio
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#222222]">
            Hi, I'm Ujwal.
          </h1>
          <p className="text-lg font-medium text-[#666666]">
            Information Science Engineering Student & Security Systems Developer
          </p>
        </div>

        <p className="text-sm leading-relaxed text-[#444444] max-w-2xl">
          I build simple, powerful software projects with practical utility. This project integrates{' '}
          <strong className="text-[#222222]">Deep Sector Carving</strong> (header/footer boundary matching) and{' '}
          <strong className="text-[#222222]">Filesystem Recovery</strong>{' '}
          (directory table & unallocated cluster recovery) into an AI-augmented evidence reconstruction engine.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={onSwitchToWorkbench}
            className="px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-medium text-xs rounded-md flex items-center gap-2"
          >
            <span>Launch Forensic Workbench</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onOpenChat}
            className="px-4 py-2 bg-white hover:bg-neutral-50 text-[#222222] border border-[#E5E7EB] font-medium text-xs rounded-md flex items-center gap-2"
          >
            <span>Ask AI Recovery Chatbot</span>
          </button>

          <button
            onClick={onOpenPython}
            className="px-4 py-2 bg-white hover:bg-neutral-50 text-[#222222] border border-[#E5E7EB] font-medium text-xs rounded-md flex items-center gap-2"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>View Python Code (digler + py)</span>
          </button>
        </div>
      </section>

      {/* About Me Section */}
      <section id="about" className="space-y-4 border-b border-[#E5E7EB] pb-12">
        <h2 className="text-xl font-bold text-[#222222]">About Me</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-[#555555] leading-relaxed">
          <div className="space-y-3">
            <p>
              I am currently studying Information Science Engineering. My primary interests include digital forensics, reverse engineering, file format parsing, and data retrieval systems.
            </p>
            <p>
              I prefer straightforward, clean architectures: practical tools, clear telemetry, deterministic state, and transparent AI reasoning rather than opaque black-box workflows.
            </p>
          </div>
          <div className="bg-[#FAFAFA] border border-[#E5E7EB] p-4 rounded-lg space-y-2">
            <h4 className="font-semibold text-[#222222] text-xs">Core Focus Areas</h4>
            <ul className="space-y-1.5 list-disc pl-4 text-xs text-[#666666]">
              <li>Low-level storage carving (MBR, FAT, NTFS, and raw dd volumes)</li>
              <li>Shannon Entropy anomaly detection for encryption vs compression</li>
              <li>Bi-directional cluster fragment stitching across unallocated gaps</li>
              <li>Interactive decision support for incident response investigators</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Projects Showcase Section */}
      <section id="projects" className="space-y-6 border-b border-[#E5E7EB] pb-12">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#222222]">Featured Projects</h2>
          <span className="text-xs text-[#666666] font-mono">3 Integrated Systems</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Project 1: Digler Carver */}
          <div className="border border-[#E5E7EB] rounded-lg p-5 bg-white space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  SECTOR CARVER
                </span>
                <Cpu className="w-4 h-4 text-[#2563EB]" />
              </div>
              <h3 className="font-bold text-sm text-[#222222]">
                Digler File Carver Engine
              </h3>
              <p className="text-xs text-[#666666] leading-relaxed">
                High-performance raw disk signature scanner. Identifies SOI/EOI delimiters, handles stream boundary alignment, and isolates candidate blocks.
              </p>
            </div>
            <button
              onClick={onOpenPython}
              className="text-xs text-[#2563EB] hover:underline font-medium inline-flex items-center gap-1 pt-2 self-start"
            >
              <span>Inspect digler_carver.py</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Project 2: Data Recovery Using Python */}
          <div className="border border-[#E5E7EB] rounded-lg p-5 bg-white space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  FS RECOVERY
                </span>
                <Database className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="font-bold text-sm text-[#222222]">
                Data Recovery Using Python
              </h3>
              <p className="text-xs text-[#666666] leading-relaxed">
                Filesystem-level analyzer for MBR partitions, directory table scraping (0xE5 deleted markers), and unallocated slack space harvesting.
              </p>
            </div>
            <button
              onClick={onOpenPython}
              className="text-xs text-[#2563EB] hover:underline font-medium inline-flex items-center gap-1 pt-2 self-start"
            >
              <span>Inspect data_recovery_py.py</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Project 3: TraceWeaver-AI Forensics */}
          <div className="border border-[#E5E7EB] rounded-lg p-5 bg-white space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Objective 01 - 04
                </span>
                <Shield className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="font-bold text-sm text-[#222222]">
                TraceWeaver-AI Workbench
              </h3>
              <p className="text-xs text-[#666666] leading-relaxed">
                Full decision support dashboard with cluster map, true Shannon entropy, bi-directional fragment stitching, and conversational AI recovery advisor.
              </p>
            </div>
            <button
              onClick={onSwitchToWorkbench}
              className="text-xs text-[#2563EB] hover:underline font-medium inline-flex items-center gap-1 pt-2 self-start"
            >
              <span>Open Interactive Workbench</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </section>

      {/* Recovered Evidence Overview in Portfolio */}
      <section className="space-y-4 border-b border-[#E5E7EB] pb-12">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#222222]">Current Storage Recovery Results</h2>
            <p className="text-xs text-[#666666]">
              Real-time artifacts carved from active disk image: <strong>{metadata.filename}</strong>
            </p>
          </div>
          <button
            onClick={onOpenReport}
            className="text-xs text-[#2563EB] border border-[#E5E7EB] px-3 py-1.5 rounded-md hover:bg-neutral-50"
          >
            Export DFIR Incident Report
          </button>
        </div>

        <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#666666] font-mono text-[11px]">
              <tr>
                <th className="py-2.5 px-3">ARTIFACT</th>
                <th className="py-2.5 px-3">CATEGORY</th>
                <th className="py-2.5 px-3">HEALTH STATUS</th>
                <th className="py-2.5 px-3">PRIORITY</th>
                <th className="py-2.5 px-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {fragments.map((frag) => (
                <tr key={frag.id} className="hover:bg-[#F9FAFB]">
                  <td className="py-2.5 px-3 font-medium text-[#222222]">
                    {frag.name}
                    <div className="text-[10px] text-[#666666] font-mono">
                      Sec {frag.sectorStart} - {frag.sectorEnd} ({(frag.sizeBytes / 1024).toFixed(1)} KB)
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-[#555555]">{frag.category}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        frag.status === 'INTACT'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : frag.status === 'PARTIALLY_RECOVERABLE'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {frag.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-[#222222]">
                    {frag.priorityScore}/100
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => {
                        onSwitchToWorkbench();
                        onSelectFragment(frag);
                      }}
                      className="text-xs text-[#2563EB] hover:underline font-medium"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="space-y-4 pb-8">
        <h2 className="text-xl font-bold text-[#222222]">Contact</h2>
        <p className="text-xs text-[#666666]">
          Interested in digital forensics tools, data recovery algorithms, or simple software systems? Reach out!
        </p>
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#2563EB]">
          <a
            href="mailto:ujwalkhatiwada2021@gmail.com"
            className="hover:underline flex items-center gap-1"
          >
            <span>Email</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <span className="text-[#CCCCCC]">|</span>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noreferrer"
            className="hover:underline flex items-center gap-1"
          >
            <span>LinkedIn</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </section>
    </div>
  );
};
