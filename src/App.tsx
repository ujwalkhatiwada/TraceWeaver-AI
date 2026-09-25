/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { HomePage } from './components/HomePage.tsx';
import { ForensicWorkbench } from './components/ForensicWorkbench.tsx';
import { ArtifactPreviewModal } from './components/ArtifactPreviewModal.tsx';
import { PythonCodeModal } from './components/PythonCodeModal.tsx';
import { RecoveryChatbot } from './components/RecoveryChatbot.tsx';

import { generateSyntheticDiskImage } from './forensics/syntheticDisk.ts';
import { runForensicRecoveryPipeline } from './forensics/pipeline.ts';
import {
  EvidenceFragment,
  DiskImageMetadata,
  DiskSector,
} from './types/forensics.ts';
import { MessageSquare } from 'lucide-react';
import { THEMES } from './types/themes.ts';

export default function App() {
  const [viewMode, setViewMode] = useState<'homepage' | 'workbench'>('homepage');
  const [diskBytes, setDiskBytes] = useState<Uint8Array | null>(null);
  const [metadata, setMetadata] = useState<DiskImageMetadata | null>(null);
  const [sectors, setSectors] = useState<DiskSector[]>([]);
  const [fragments, setFragments] = useState<EvidenceFragment[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Modals state
  const [selectedPreviewFragment, setSelectedPreviewFragment] = useState<EvidenceFragment | null>(null);
  const [isPythonOpen, setIsPythonOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Initialize demonstration disk image on load
  const loadInitialDisk = useCallback(async () => {
    setIsProcessing(true);
    try {
      const synthetic = generateSyntheticDiskImage('ironvault');
      setDiskBytes(synthetic.diskBytes);
      setSectors(synthetic.sectors);

      const result = await runForensicRecoveryPipeline(
        synthetic.diskBytes,
        synthetic.metadata
      );
      setFragments(result.fragments);
      setMetadata(result.metadata);
    } catch (err) {
      console.error('Failed to initialize demo disk image:', err);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  useEffect(() => {
    loadInitialDisk();
  }, [loadInitialDisk]);

  if (!metadata) {
    return (
      <div className="min-h-screen bg-white text-[#1F2937] flex items-center justify-center font-sans">
        <div className="flex items-center gap-3 text-sm">
          <div className="w-5 h-5 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
          <span>Mounting TraceWeaver-AI Demo Storage...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1F2937] font-sans">
      {/* View 1: Public Portfolio / Project Website */}
      {viewMode === 'homepage' ? (
        <HomePage
          metadata={metadata}
          fragments={fragments}
          onLaunchWorkbench={() => {
            setViewMode('workbench');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenPreview={(fragment) => setSelectedPreviewFragment(fragment)}
          onOpenPython={() => setIsPythonOpen(true)}
        />
      ) : (
        /* View 2: Technical Forensic Workbench */
        <ForensicWorkbench
          metadata={metadata}
          fragments={fragments}
          sectors={sectors}
          onBackToWebsite={() => {
            setViewMode('homepage');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenPreview={(fragment) => setSelectedPreviewFragment(fragment)}
          onOpenPython={() => setIsPythonOpen(true)}
        />
      )}

      {/* Floating Action Button for TraceWeaver AI Advisor */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 z-40 bg-[#2563EB] hover:bg-blue-700 text-white rounded-full px-4 py-3 shadow-lg flex items-center gap-2 cursor-pointer border border-blue-500 font-medium text-xs transition-none"
        title="Open TraceWeaver AI Recovery Decision Support"
      >
        <MessageSquare className="w-4 h-4" />
        <span className="font-sans">Can My Data Be Recovered?</span>
      </button>

      {/* Reusable Modals */}
      <RecoveryChatbot
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        fragments={fragments}
        metadata={metadata}
        onInspectFragmentByName={(name) => {
          const found = fragments.find((f) => f.name.includes(name));
          if (found) setSelectedPreviewFragment(found);
        }}
      />

      <ArtifactPreviewModal
        fragment={selectedPreviewFragment}
        onClose={() => setSelectedPreviewFragment(null)}
      />

      <PythonCodeModal
        isOpen={isPythonOpen}
        onClose={() => setIsPythonOpen(false)}
        themeConfig={THEMES.clean_white}
      />
    </div>
  );
}
