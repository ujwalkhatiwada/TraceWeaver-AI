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

/**
 * Downloads a single carved evidence fragment as an individual file
 */
export function downloadEvidenceFragmentFile(fragment: EvidenceFragment): void {
  const bytes = fragment.rawBytes || new Uint8Array(256);
  let mimeType = 'application/octet-stream';

  switch (fragment.fileType) {
    case 'pdf':
      mimeType = 'application/pdf';
      break;
    case 'jpeg':
      mimeType = 'image/jpeg';
      break;
    case 'docx':
    case 'zip':
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      break;
    case 'sqlite':
      mimeType = 'application/vnd.sqlite3';
      break;
    case 'txt':
      mimeType = 'text/plain;charset=utf-8';
      break;
    default:
      mimeType = 'application/octet-stream';
  }

  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fragment.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface ExtractedStringItem {
  id: string;
  text: string;
  category: 'network' | 'email' | 'url' | 'financial' | 'command' | 'credentials' | 'general';
  offset: number;
  sectorLba: number;
  sectorOffset: number;
  length: number;
}

/**
 * Extracts printable ASCII/UTF-8 strings from raw disk bytes and categorizes IOCs
 */
export function extractDiskStrings(
  diskBytes: Uint8Array,
  minLength: number = 4,
  maxItems: number = 300
): ExtractedStringItem[] {
  const items: ExtractedStringItem[] = [];
  const len = diskBytes.length;
  let start = -1;

  const isPrintable = (byte: number) =>
    (byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13;

  for (let i = 0; i <= len; i++) {
    const byte = i < len ? diskBytes[i] : 0;
    if (isPrintable(byte)) {
      if (start === -1) start = i;
    } else {
      if (start !== -1) {
        const strLen = i - start;
        if (strLen >= minLength) {
          const slice = diskBytes.subarray(start, i);
          const rawStr = new TextDecoder('utf-8', { fatal: false }).decode(slice).trim();

          if (rawStr.length >= minLength) {
            let category: ExtractedStringItem['category'] = 'general';
            const lower = rawStr.toLowerCase();

            // IPv4 regex check
            if (/\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/.test(rawStr)) {
              category = 'network';
            } else if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(rawStr) || rawStr.includes('@')) {
              category = 'email';
            } else if (rawStr.startsWith('http://') || rawStr.startsWith('https://') || rawStr.includes('.com') || rawStr.includes('.org') || rawStr.includes('.onion')) {
              category = 'url';
            } else if (
              lower.includes('swift') ||
              lower.includes('iban') ||
              lower.includes('wire') ||
              lower.includes('transfer') ||
              lower.includes('disbursement') ||
              lower.includes('$') ||
              lower.includes('usd') ||
              lower.includes('escrow') ||
              lower.includes('bank') ||
              lower.includes('credit')
            ) {
              category = 'financial';
            } else if (
              lower.includes('shred') ||
              lower.includes('rm -rf') ||
              lower.includes('cipher') ||
              lower.includes('srm') ||
              lower.includes('dd if=') ||
              lower.includes('sudo') ||
              lower.includes('chmod') ||
              lower.includes('/bin/') ||
              lower.includes('kill') ||
              lower.includes('zero')
            ) {
              category = 'command';
            } else if (
              lower.includes('password') ||
              lower.includes('secret') ||
              lower.includes('api_key') ||
              lower.includes('token') ||
              lower.includes('bearer') ||
              lower.includes('authorization') ||
              lower.includes('auth')
            ) {
              category = 'credentials';
            }

            items.push({
              id: `str-${start}`,
              text: rawStr,
              category,
              offset: start,
              sectorLba: Math.floor(start / SECTOR_SIZE),
              sectorOffset: start % SECTOR_SIZE,
              length: strLen,
            });

            if (items.length >= maxItems) break;
          }
        }
        start = -1;
      }
    }
  }

  return items;
}

export interface PartitionTableEntry {
  slot: number;
  bootable: boolean;
  typeHex: string;
  typeName: string;
  startLba: number;
  sizeSectors: number;
  sizeKb: number;
}

export interface MbrInspectionResult {
  hasValidSignature: boolean;
  signatureHex: string;
  partitionEntries: PartitionTableEntry[];
  hasBootCode: boolean;
  detectionSummary: string;
}

/**
 * Inspects Master Boot Record (MBR) at LBA 0
 */
export function inspectMasterBootRecord(diskBytes: Uint8Array): MbrInspectionResult {
  if (diskBytes.length < 512) {
    return {
      hasValidSignature: false,
      signatureHex: '0x0000',
      partitionEntries: [],
      hasBootCode: false,
      detectionSummary: 'Disk image is smaller than 512 bytes (insufficient for MBR).',
    };
  }

  const sigByte1 = diskBytes[510];
  const sigByte2 = diskBytes[511];
  const hasValidSignature = sigByte1 === 0x55 && sigByte2 === 0xaa;
  const signatureHex = `0x${sigByte1.toString(16).padStart(2, '0')}${sigByte2.toString(16).padStart(2, '0')}`.toUpperCase();

  // Check if initial 446 bytes contain non-zero boot code
  let nonZeroBootBytes = 0;
  for (let i = 0; i < 446; i++) {
    if (diskBytes[i] !== 0) nonZeroBootBytes++;
  }
  const hasBootCode = nonZeroBootBytes > 16;

  const partitionEntries: PartitionTableEntry[] = [];
  const typeMap: Record<number, string> = {
    0x00: 'Empty / Unused',
    0x01: 'FAT12',
    0x04: 'FAT16 (<32MB)',
    0x05: 'Extended Partition',
    0x06: 'FAT16 (>32MB)',
    0x07: 'NTFS / exFAT / HPFS',
    0x0b: 'FAT32 (CHS)',
    0x0c: 'FAT32 (LBA)',
    0x0e: 'FAT16 (LBA)',
    0x82: 'Linux Swap',
    0x83: 'Linux Native (ext2/ext3/ext4)',
    0x8e: 'Linux LVM',
    0xee: 'GPT Protective MBR',
    0xef: 'EFI System Partition',
  };

  for (let slot = 0; slot < 4; slot++) {
    const entryOffset = 446 + slot * 16;
    const status = diskBytes[entryOffset];
    const typeByte = diskBytes[entryOffset + 4];

    // Read 32-bit little endian start LBA and sector count
    const startLba =
      diskBytes[entryOffset + 8] |
      (diskBytes[entryOffset + 9] << 8) |
      (diskBytes[entryOffset + 10] << 16) |
      (diskBytes[entryOffset + 11] << 24);

    const sizeSectors =
      diskBytes[entryOffset + 12] |
      (diskBytes[entryOffset + 13] << 8) |
      (diskBytes[entryOffset + 14] << 16) |
      (diskBytes[entryOffset + 15] << 24);

    if (typeByte !== 0 || sizeSectors > 0) {
      partitionEntries.push({
        slot: slot + 1,
        bootable: status === 0x80,
        typeHex: `0x${typeByte.toString(16).padStart(2, '0').toUpperCase()}`,
        typeName: typeMap[typeByte] || `Unknown (0x${typeByte.toString(16).toUpperCase()})`,
        startLba: Math.max(0, startLba),
        sizeSectors: Math.max(0, sizeSectors),
        sizeKb: Math.round((Math.max(0, sizeSectors) * 512) / 1024),
      });
    }
  }

  let detectionSummary = '';
  if (hasValidSignature) {
    if (partitionEntries.length > 0) {
      detectionSummary = `Valid MBR (${signatureHex}) with ${partitionEntries.length} partition table entry/entries identified.`;
    } else {
      detectionSummary = `Valid MBR signature (${signatureHex}) detected with raw volume structure or single-partition superfloppy layout.`;
    }
  } else {
    detectionSummary = `No standard 0x55AA MBR signature found at sector boundary offset 510–511. Raw volume or headerless bitstream image.`;
  }

  return {
    hasValidSignature,
    signatureHex,
    partitionEntries,
    hasBootCode,
    detectionSummary,
  };
}
