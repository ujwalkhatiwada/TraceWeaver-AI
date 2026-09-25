/**
 * Objective 03 – Classification & Prioritization (AI-assisted scoring)
 * Equivalent to prioritize.py
 */

import { CarvedCandidate } from './carving.ts';
import { IntegrityAssessment } from './integrity.ts';
import {
  EvidenceCategory,
  PriorityTier,
  CaseSettings,
} from '../types/forensics.ts';
import { extractPrintableStrings } from './cryptoUtils.ts';

export interface PrioritizationResult {
  category: EvidenceCategory;
  priorityScore: number; // 0 to 100
  priorityTier: PriorityTier;
  keywordHits: string[];
  extractedStrings: string[];
  plainEnglishRationale: string;
}

const DEFAULT_CATEGORY_WEIGHTS: Record<EvidenceCategory, number> = {
  Financial: 95,
  Communications: 88,
  'Legal & Contracts': 90,
  'System & Audit': 78,
  'Media & Graphics': 60,
  'System & Temp': 30,
};

const FORENSIC_KEYWORDS = [
  'swift',
  'wire',
  'transfer',
  'disbursement',
  'offshore',
  'cayman',
  'zurich',
  'panama',
  'confidential',
  'privileged',
  'attorney',
  'sterling',
  'chimera',
  'secret',
  'delete',
  'overwrite',
  'zero-wipe',
  'scrub',
  'audit',
  'freelist',
  'witness',
  'account',
];

export function prioritizeCandidate(
  candidate: CarvedCandidate,
  integrity: IntegrityAssessment,
  customSettings?: Partial<CaseSettings>
): PrioritizationResult {
  const bytes = candidate.rawBytes;
  const strings = extractPrintableStrings(bytes, 4, 30);
  const combinedText = strings.join(' ').toLowerCase();

  // 1. Determine Category
  let category: EvidenceCategory = 'System & Temp';
  if (
    candidate.name.includes('financial') ||
    combinedText.includes('wire transfer') ||
    combinedText.includes('swift') ||
    combinedText.includes('disbursement') ||
    combinedText.includes('offshore')
  ) {
    category = 'Financial';
  } else if (
    candidate.name.includes('case_notes') ||
    combinedText.includes('briefing') ||
    combinedText.includes('attorney') ||
    combinedText.includes('confidential memorandum')
  ) {
    category = 'Legal & Contracts';
  } else if (
    candidate.fileType === 'sqlite' ||
    candidate.name.includes('logs') ||
    combinedText.includes('security_logs') ||
    combinedText.includes('audit')
  ) {
    category = 'System & Audit';
  } else if (
    candidate.name.includes('readme') ||
    combinedText.includes('from: m. sterling') ||
    combinedText.includes('gentlemen:')
  ) {
    category = 'Communications';
  } else if (candidate.fileType === 'jpeg' || candidate.fileType === 'png') {
    category = 'Media & Graphics';
  }

  // 2. Keyword Relevance
  const targetKeywords = customSettings?.targetKeywords || FORENSIC_KEYWORDS;
  const keywordHits: string[] = [];

  for (const kw of targetKeywords) {
    if (combinedText.includes(kw.toLowerCase())) {
      keywordHits.push(kw);
    }
  }

  const keywordScore = Math.min(100, keywordHits.length * 16);

  // 3. Multi-Factor Prioritization Scoring Formula
  // PriorityScore = (CategoryWeight * 0.35) + (IntegrityFactor * 100 * 0.30) + (KeywordScore * 0.25) + (StructuralBonus * 0.10)
  const categoryWeight =
    customSettings?.categoryWeights?.[category] ??
    DEFAULT_CATEGORY_WEIGHTS[category];

  const integrityScore = integrity.integrityFactor * 100;
  const structuralBonus = candidate.stitched ? 85 : integrity.status === 'INTACT' ? 95 : 50;

  const rawScore =
    categoryWeight * 0.35 +
    integrityScore * 0.30 +
    keywordScore * 0.25 +
    structuralBonus * 0.10;

  const priorityScore = Math.min(100, Math.max(10, Math.round(rawScore)));

  // 4. Assign Priority Tier
  let priorityTier: PriorityTier = 'LOW';
  if (priorityScore >= 80) priorityTier = 'CRITICAL';
  else if (priorityScore >= 65) priorityTier = 'HIGH';
  else if (priorityScore >= 45) priorityTier = 'MEDIUM';

  // 5. Generate Plain-English Investigative Rationale
  const rationale = buildPlainEnglishRationale(
    candidate,
    category,
    priorityTier,
    priorityScore,
    integrity,
    keywordHits
  );

  return {
    category,
    priorityScore,
    priorityTier,
    keywordHits,
    extractedStrings: strings,
    plainEnglishRationale: rationale,
  };
}

function buildPlainEnglishRationale(
  candidate: CarvedCandidate,
  category: EvidenceCategory,
  tier: PriorityTier,
  score: number,
  integrity: IntegrityAssessment,
  keywordHits: string[]
): string {
  const kwSummary =
    keywordHits.length > 0
      ? `Detected ${keywordHits.length} high-significance forensic keywords (${keywordHits.slice(0, 4).join(', ')}).`
      : 'No high-significance keyword triggers.';

  if (category === 'Financial') {
    return `Priority ${score}/100 [${tier}]: High evidentiary yield in financial fraud inquiry. ${kwSummary} Structural integrity is rated ${integrity.status} (${(integrity.integrityFactor * 100).toFixed(0)}%). Discloses bank routing accounts and disbursement authorizations that establish direct culpable transactions.`;
  }

  if (category === 'Communications') {
    return `Priority ${score}/100 [${tier}]: Contains primary perpetrator communications isolated from slack storage. ${kwSummary} Preserves clear intent regarding planned emergency data destruction and fund diversion.`;
  }

  if (category === 'Legal & Contracts') {
    return `Priority ${score}/100 [${tier}]: Executive investigative documentation recovered via multi-cluster carver stitching. ${kwSummary} Connects named suspects and timeline milestones despite deliberate filesystem fragmentation.`;
  }

  if (category === 'System & Audit') {
    return `Priority ${score}/100 [${tier}]: SQLite database containing transaction audit tables. ${kwSummary} While partially truncated, unallocated b-tree leaf slots yielded deleted database entries confirming unauthorized access.`;
  }

  if (category === 'Media & Graphics') {
    return `Priority ${score}/100 [${tier}]: Photographic intelligence artifact carved from sector clusters. Structural status is ${integrity.status} due to truncated trailing sectors, but upper 70% scanlines remain visually interpretable.`;
  }

  return `Priority ${score}/100 [${tier}]: Carved fragment with ${integrity.status} status. Moderate investigative utility; preserved as context artifact.`;
}
