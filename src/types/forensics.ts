export type EvidenceStatus = 'INTACT' | 'PARTIALLY_RECOVERABLE' | 'CORRUPTED';

export type PriorityTier = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type EvidenceCategory =
  | 'Financial'
  | 'Communications'
  | 'System & Audit'
  | 'Legal & Contracts'
  | 'Media & Graphics'
  | 'System & Temp';

export type FileType =
  | 'jpeg'
  | 'pdf'
  | 'docx'
  | 'sqlite'
  | 'txt'
  | 'png'
  | 'unknown';

export interface FragmentChunk {
  sectorStart: number;
  sectorEnd: number;
  byteOffset: number;
  byteLength: number;
  stitched: boolean;
  chunkIndex: number;
}

export interface AiAnalysisResult {
  rationale: string;
  rootCause: string;
  restorationFeasibility: string;
  evidentiaryValue: string;
  confidenceScore: number;
  suggestedNextSteps: string[];
}

export interface EvidenceFragment {
  id: string;
  name: string;
  originalName: string;
  fileType: FileType;
  category: EvidenceCategory;
  offsetStart: number;
  offsetEnd: number;
  sectorStart: number;
  sectorEnd: number;
  sizeBytes: number;
  status: EvidenceStatus;
  integrityFactor: number; // 0.0 to 1.0
  entropy: number; // Shannon entropy 0.0 to 8.0
  nullByteRatio: number; // 0.0 to 1.0
  priorityScore: number; // 0 to 100
  priorityTier: PriorityTier;
  hashSha256: string;
  hashMd5: string;
  chunks: FragmentChunk[];
  defects: string[];
  plainEnglishRationale: string;
  extractedStrings: string[];
  previewText?: string;
  previewImageUrl?: string;
  previewTableRows?: Array<Record<string, string | number>>;
  rawHexDump: string;
  rawAsciiDump: string;
  rawBytes: Uint8Array;
  aiAnalysis?: AiAnalysisResult;
  isAiAnalyzing?: boolean;
}

export interface DiskSector {
  sectorIndex: number;
  offset: number;
  size: number;
  state:
    | 'unallocated'
    | 'boot'
    | 'allocated_intact'
    | 'fragment_a'
    | 'fragment_b'
    | 'slack_corrupted'
    | 'zeroed';
  evidenceId?: string;
  fileType?: FileType;
  entropy: number;
  label?: string;
}

export interface DiskImageMetadata {
  filename: string;
  totalSize: number;
  sectorCount: number;
  sectorSize: number;
  sha256: string;
  md5: string;
  scenarioName: string;
  scenarioDescription: string;
  timestamp: string;
  carvedCount: number;
  intactCount: number;
  partialCount: number;
  corruptedCount: number;
}

export interface CaseSettings {
  caseNumber: string;
  caseName: string;
  examinerName: string;
  evidenceId: string;
  targetKeywords: string[];
  categoryWeights: Record<EvidenceCategory, number>;
}

export interface ForensicTimelineEvent {
  id: string;
  timestamp: string;
  phase: 'Baseline' | 'Exfiltration' | 'Anti-Forensics' | 'Tampering' | 'Reconstruction';
  title: string;
  description: string;
  associatedFragmentId?: string;
  associatedFile?: string;
  sectorsAffected?: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
  evidenceType: string;
  irRecommendation: string;
  entropySignature?: string;
  tamperingDetected?: boolean;
}

export interface ExecutiveReport {
  caseNumber: string;
  caseName: string;
  examinerName: string;
  dateGenerated: string;
  diskImageSha256: string;
  totalFragmentsRecovered: number;
  executiveSummary: string;
  timelineHypothesis: string;
  keyFindings: string[];
  tamperingIndicators: string[];
  investigativeRecommendation: string;
}
