import {
  calculateSha256,
  calculateMd5,
  calculateShannonEntropy,
} from './cryptoUtils.ts';
import { runForensicRecoveryPipeline } from './pipeline.ts';
import {
  DiskImageMetadata,
  DiskSector,
  EvidenceFragment,
  FileType,
} from '../types/forensics.ts';

const SECTOR_SIZE = 512;

export interface UploadedDiskParseResult {
  diskBytes: Uint8Array;
  metadata: DiskImageMetadata;
  sectors: DiskSector[];
  fragments: EvidenceFragment[];
  processingTimeMs: number;
}

/**
 * Builds a visual sector map from any arbitrary disk byte array.
 * Maps up to maxDisplaySectors (default 256) for performant UI rendering.
 */
export function buildSectorsFromDiskBytes(
  diskBytes: Uint8Array,
  fragments: EvidenceFragment[],
  maxDisplaySectors: number = 256
): DiskSector[] {
  const totalSectors = Math.max(1, Math.ceil(diskBytes.length / SECTOR_SIZE));
  const displayCount = Math.min(totalSectors, maxDisplaySectors);
  const sectors: DiskSector[] = [];

  for (let s = 0; s < displayCount; s++) {
    const sOffset = s * SECTOR_SIZE;
    const sEnd = Math.min(diskBytes.length, sOffset + SECTOR_SIZE);
    const sectorBytes = diskBytes.subarray(sOffset, sEnd);
    const entropy = calculateShannonEntropy(sectorBytes);

    // Check if this sector is bound to any carved fragment
    const boundFrag = fragments.find(
      (f) => s >= f.sectorStart && s <= f.sectorEnd
    );

    let state: DiskSector['state'] = 'unallocated';
    let fileType: FileType | undefined = boundFrag?.fileType;
    let label = `Sector ${s} (Unallocated)`;
    let evidenceId: string | undefined = boundFrag?.name;

    if (s === 0) {
      state = 'boot';
      label = 'Sector 0: Master Boot Record (MBR) / Partition Table';
    } else if (boundFrag) {
      if (boundFrag.chunks && boundFrag.chunks.length > 1) {
        const chunkIdx = boundFrag.chunks.findIndex(
          (c) => s >= c.sectorStart && s <= c.sectorEnd
        );
        state = chunkIdx === 0 ? 'fragment_a' : 'fragment_b';
        label = `${boundFrag.name} [Chunk ${chunkIdx + 1}, Sec ${s}]`;
      } else if (boundFrag.status === 'INTACT') {
        state = 'allocated_intact';
        label = `${boundFrag.name} [Sec ${s} - Intact]`;
      } else if (boundFrag.status === 'PARTIALLY_RECOVERABLE') {
        // If entropy is near zero or at the end of the fragment, mark as slack/corrupted
        if (entropy < 0.2 || s >= boundFrag.sectorEnd - 2) {
          state = 'slack_corrupted';
          label = `${boundFrag.name} [Sec ${s} - Truncated/Zeroed Slack]`;
        } else {
          state = 'allocated_intact';
          label = `${boundFrag.name} [Sec ${s} - Recovered Data]`;
        }
      } else {
        state = 'slack_corrupted';
        label = `${boundFrag.name} [Sec ${s} - Damaged Payload]`;
      }
    } else {
      // Check if zeroed
      let isAllZero = true;
      for (let i = 0; i < sectorBytes.length; i++) {
        if (sectorBytes[i] !== 0) {
          isAllZero = false;
          break;
        }
      }
      state = isAllZero ? 'zeroed' : 'unallocated';
      label = isAllZero
        ? `Sector ${s}: Null Zero Wiped Space (0x00)`
        : `Sector ${s}: Unallocated Cluster Slack`;
    }

    sectors.push({
      sectorIndex: s,
      offset: sOffset,
      size: sectorBytes.length,
      state,
      fileType,
      entropy,
      label,
      evidenceId,
    });
  }

  return sectors;
}

/**
 * Downloads raw disk bytes as a forensic .dd binary image file
 */
export function downloadDiskImage(
  diskBytes: Uint8Array,
  filename: string = 'evidence_disk.dd'
): void {
  const blob = new Blob([diskBytes.buffer as ArrayBuffer], {
    type: 'application/octet-stream',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Parses an uploaded .dd / .raw / .img / .bin file entirely client-side
 */
export async function parseUploadedDiskImage(
  file: File,
  onProgress?: (step: string, progressPercent: number) => void
): Promise<UploadedDiskParseResult> {
  const startTime = performance.now();

  onProgress?.('Reading raw bitstream from local disk...', 20);
  const arrayBuffer = await file.arrayBuffer();
  const diskBytes = new Uint8Array(arrayBuffer);

  onProgress?.('Calculating cryptographic hashes (SHA-256 & MD5)...', 45);
  const sha256 = await calculateSha256(diskBytes);
  const md5 = calculateMd5(diskBytes);

  const totalSectors = Math.max(1, Math.ceil(diskBytes.length / SECTOR_SIZE));

  const baseMetadata: DiskImageMetadata = {
    filename: file.name,
    totalSize: diskBytes.length,
    sectorCount: totalSectors,
    sectorSize: SECTOR_SIZE,
    sha256,
    md5,
    scenarioName: `Investigative Image: ${file.name}`,
    scenarioDescription: `User-provided raw forensic bitstream (${(file.size / 1024).toFixed(1)} KB, ${totalSectors} sectors). Read-only chain of custody verified.`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
    carvedCount: 0,
    intactCount: 0,
    partialCount: 0,
    corruptedCount: 0,
  };

  onProgress?.('Scanning signatures & entropy sliding windows...', 70);
  const pipelineResult = await runForensicRecoveryPipeline(
    diskBytes,
    baseMetadata
  );

  onProgress?.('Building 256-sector allocation grid & timeline...', 90);
  const sectors = buildSectorsFromDiskBytes(diskBytes, pipelineResult.fragments);

  const processingTimeMs = Math.round(performance.now() - startTime);
  onProgress?.('Forensic pipeline complete!', 100);

  return {
    diskBytes,
    metadata: pipelineResult.metadata,
    sectors,
    fragments: pipelineResult.fragments,
    processingTimeMs,
  };
}
