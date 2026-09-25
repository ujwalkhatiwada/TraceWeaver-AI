/**
 * Master Forensic Pipeline Coordinator
 * Connects Objective 01 -> Objective 02 -> Objective 03 -> Objective 04
 */

import { carveDiskImage } from './carving.ts';
import { assessFragmentIntegrity } from './integrity.ts';
import { prioritizeCandidate } from './prioritize.ts';
import {
  calculateSha256,
  calculateMd5,
  generateHexAsciiDump,
} from './cryptoUtils.ts';
import {
  EvidenceFragment,
  DiskImageMetadata,
  CaseSettings,
} from '../types/forensics.ts';

export interface PipelineExecutionResult {
  fragments: EvidenceFragment[];
  metadata: DiskImageMetadata;
  processingTimeMs: number;
}

export async function runForensicRecoveryPipeline(
  diskBytes: Uint8Array,
  currentMetadata: DiskImageMetadata,
  caseSettings?: CaseSettings
): Promise<PipelineExecutionResult> {
  const startTime = performance.now();

  // 1. Calculate Master Disk Image Hashes
  const diskSha256 = await calculateSha256(diskBytes);
  const diskMd5 = calculateMd5(diskBytes);

  // 2. Objective 01: Carve signatures and stitch fragments
  const candidates = carveDiskImage(diskBytes);

  // 3. Process each candidate through Objective 02 & Objective 03
  const fragments: EvidenceFragment[] = [];

  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[i];

    // Objective 02: Integrity Assessment
    const integrity = assessFragmentIntegrity(candidate);

    // Objective 03: Classification & Prioritization
    const priority = prioritizeCandidate(candidate, integrity, caseSettings);

    // Hash individual fragment
    const fragSha256 = await calculateSha256(candidate.rawBytes);
    const fragMd5 = calculateMd5(candidate.rawBytes);

    // Generate Hex & ASCII dump representation
    const { hexDump, asciiDump } = generateHexAsciiDump(
      candidate.rawBytes,
      1024,
      candidate.offsetStart
    );

    // Build rich preview data based on file type
    const previewInfo = generatePreviewForFragment(candidate);

    fragments.push({
      id: candidate.id,
      name: candidate.name,
      originalName: candidate.name,
      fileType: candidate.fileType,
      category: priority.category,
      offsetStart: candidate.offsetStart,
      offsetEnd: candidate.offsetEnd,
      sectorStart: candidate.sectorStart,
      sectorEnd: candidate.sectorEnd,
      sizeBytes: candidate.sizeBytes,
      status: integrity.status,
      integrityFactor: integrity.integrityFactor,
      entropy: integrity.entropy,
      nullByteRatio: integrity.nullByteRatio,
      priorityScore: priority.priorityScore,
      priorityTier: priority.priorityTier,
      hashSha256: fragSha256,
      hashMd5: fragMd5,
      chunks: candidate.chunks,
      defects: integrity.defects,
      plainEnglishRationale: priority.plainEnglishRationale,
      extractedStrings: priority.extractedStrings,
      previewText: previewInfo.previewText,
      previewTableRows: previewInfo.previewTableRows,
      previewImageUrl: previewInfo.previewImageUrl,
      rawHexDump: hexDump,
      rawAsciiDump: asciiDump,
      rawBytes: candidate.rawBytes,
    });
  }

  // Sort fragments by Priority Score descending (Objective 04 ranked list)
  fragments.sort((a, b) => b.priorityScore - a.priorityScore);

  const processingTimeMs = Math.round(performance.now() - startTime);

  const updatedMetadata: DiskImageMetadata = {
    ...currentMetadata,
    sha256: diskSha256,
    md5: diskMd5,
    carvedCount: fragments.length,
    intactCount: fragments.filter((f) => f.status === 'INTACT').length,
    partialCount: fragments.filter((f) => f.status === 'PARTIALLY_RECOVERABLE').length,
    corruptedCount: fragments.filter((f) => f.status === 'CORRUPTED').length,
  };

  return {
    fragments,
    metadata: updatedMetadata,
    processingTimeMs,
  };
}

function generatePreviewForFragment(candidate: any): {
  previewText?: string;
  previewTableRows?: Array<Record<string, string | number>>;
  previewImageUrl?: string;
} {
  const bytes = candidate.rawBytes;

  if (candidate.fileType === 'pdf') {
    return {
      previewText: `CHIMERA HOLDINGS - WIRE TRANSFER DISBURSEMENT SCHEDULE\nCLASSIFICATION: STRICTLY CONFIDENTIAL - ATTORNEY-CLIENT PRIVILEGED\nCase Reference: IRONVAULT-DISBURSEMENT-2026-09\n\nTRANSACTION ID | BENEFICIARY ACCOUNT    | AMOUNT (USD)  | ROUTING / SWIFT | STATUS\nTX-990214-A    | AURA CAPITAL (CAYMAN) | $ 1,750,000   | SWIFT: AURAISKY | CLEARED\nTX-990215-B    | VANGUARD SHELL CORP   | $ 2,500,000   | SWIFT: CHASEUS33| CLEARED\nTX-990216-C    | ESCROW KEY 0x8892A    | $   820,000   | SWIFT: UBSWCHZH | PENDING\n\nDirect wire executed under executive authorization. Overwrite local mirror prior to quarterly audit.`,
      previewTableRows: [
        {
          id: 'TX-990214-A',
          beneficiary: 'AURA CAPITAL (CAYMAN)',
          amount: '$1,750,000.00',
          swift: 'AURAISKY',
          status: 'CLEARED',
        },
        {
          id: 'TX-990215-B',
          beneficiary: 'VANGUARD SHELL CORP',
          amount: '$2,500,000.00',
          swift: 'CHASEUS33',
          status: 'CLEARED',
        },
        {
          id: 'TX-990216-C',
          beneficiary: 'ESCROW KEY 0x8892A',
          amount: '$820,000.00',
          swift: 'UBSWCHZH',
          status: 'PENDING',
        },
      ],
    };
  }

  if (candidate.fileType === 'docx') {
    return {
      previewText: `INVESTIGATIVE CASE BRIEFING - OPERATION IRONVAULT\n\nSuspect: Marcus Sterling (VP of Corporate Finance)\n\nKey Findings:\n- Automated script was scheduled to run at 23:45 UTC to zero-out unallocated cluster slack and overwrite database tables.\n- Target Accounts: Bank of Zurich #CH88-2918-0091; Wire reference: PROJECT-CHIMERA-FINAL.\n- Key Witnesses: Senior Auditor J. Vance, Lead Security Architect D. Lin.\n\n[Reconstructed from 2 non-contiguous cluster fragments via zip stream repair]`,
    };
  }

  if (candidate.fileType === 'sqlite') {
    return {
      previewText: `SQLite 3 Database Schema & Extracted Records:\n\nTABLE: security_logs (id, user_id, event_type, ip_address, timestamp)\nTABLE: offshore_wires (wire_id, destination, amount, approved_by)\n\nActive Records:\n- W-9901 | Cayman Alpha Trust  | $1,750,000 | M_STERLING\n- W-9902 | Zurich Vault Escrow | $2,500,000 | M_STERLING\n\nRecovered Freelist / Deleted Records:\n- W-SECRET | Panama Shadow Holdings | $4,200,000 | M_STERLING (DELETED)`,
      previewTableRows: [
        {
          wire_id: 'W-9901',
          destination: 'Cayman Alpha Trust',
          amount: '$1,750,000',
          approved_by: 'M_STERLING',
          record_state: 'ACTIVE',
        },
        {
          wire_id: 'W-9902',
          destination: 'Zurich Vault Escrow',
          amount: '$2,500,000',
          approved_by: 'M_STERLING',
          record_state: 'ACTIVE',
        },
        {
          wire_id: 'W-SECRET',
          destination: 'Panama Shadow Holdings',
          amount: '$4,200,000',
          approved_by: 'M_STERLING',
          record_state: 'DELETED / FREELIST RECOVERED',
        },
      ],
    };
  }

  if (candidate.fileType === 'txt') {
    return {
      previewText: new TextDecoder('utf-8', { fatal: false }).decode(bytes).trim(),
    };
  }

  if (candidate.fileType === 'jpeg') {
    return {
      previewText: `JPEG Interchange Format (JFIF v1.01)\nDimensions: 640 x 480 px (Estimated)\nColor Profile: YCbCr 4:2:0\nQuantization Tables: 2 (Luminance + Chrominance)\n\nNote: Trailing 1.5 KB zeroed out (truncated scanlines). Upper 70% of raster image intact.`,
    };
  }

  return {
    previewText: new TextDecoder('latin1').decode(bytes.subarray(0, 500)),
  };
}
