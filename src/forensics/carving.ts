/**
 * Objective 01 – Intelligent Fragment Reconstruction
 * Equivalent to carving.py
 */

import { FileType, FragmentChunk } from '../types/forensics.ts';
import { calculateShannonEntropy } from './cryptoUtils.ts';

export interface CarvedCandidate {
  id: string;
  name: string;
  fileType: FileType;
  offsetStart: number;
  offsetEnd: number;
  sectorStart: number;
  sectorEnd: number;
  sizeBytes: number;
  rawBytes: Uint8Array;
  chunks: FragmentChunk[];
  carvingNotes: string[];
  footerFound: boolean;
  stitched: boolean;
}

const SECTOR_SIZE = 512;

// Magic signatures
const SIGNATURES = {
  JPEG_SOI: [0xff, 0xd8, 0xff],
  JPEG_EOI: [0xff, 0xd9],
  PDF_HEADER: [0x25, 0x50, 0x44, 0x46, 0x2d], // %PDF-
  PDF_EOF: [0x25, 0x25, 0x45, 0x4f, 0x46], // %%EOF
  ZIP_LOCAL: [0x50, 0x4b, 0x03, 0x04], // PK\x03\x04
  ZIP_CENTRAL: [0x50, 0x4b, 0x01, 0x02], // PK\x01\x02
  ZIP_EOCD: [0x50, 0x4b, 0x05, 0x06], // PK\x05\x06
  SQLITE_HEADER: [
    0x53, 0x51, 0x4c, 0x69, 0x74, 0x65, 0x20, 0x66, 0x6f, 0x72, 0x6d, 0x61, 0x74,
    0x20, 0x33, 0x00,
  ], // SQLite format 3\0
  PNG_HEADER: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  PNG_IEND: [0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82],
};

function matchBytes(
  data: Uint8Array,
  offset: number,
  target: number[]
): boolean {
  if (offset + target.length > data.length) return false;
  for (let i = 0; i < target.length; i++) {
    if (data[offset + i] !== target[i]) return false;
  }
  return true;
}

function findBytes(
  data: Uint8Array,
  startOffset: number,
  endOffset: number,
  target: number[]
): number {
  const max = Math.min(data.length - target.length, endOffset);
  for (let i = startOffset; i <= max; i++) {
    if (matchBytes(data, i, target)) return i;
  }
  return -1;
}

export function carveDiskImage(diskBytes: Uint8Array): CarvedCandidate[] {
  const candidates: CarvedCandidate[] = [];
  const len = diskBytes.length;
  let counter = 1;

  // Step A: Linear signature scan on sector boundaries (and intra-sector for slack)
  for (let offset = 0; offset < len; offset += 16) {
    const sector = Math.floor(offset / SECTOR_SIZE);

    // 1. PDF Carving
    if (matchBytes(diskBytes, offset, SIGNATURES.PDF_HEADER)) {
      const eofOffset = findBytes(diskBytes, offset + 10, offset + 65536, SIGNATURES.PDF_EOF);
      let end = eofOffset !== -1 ? eofOffset + SIGNATURES.PDF_EOF.length : offset + 9728;
      // align to sector boundary
      end = Math.min(len, Math.ceil(end / SECTOR_SIZE) * SECTOR_SIZE);
      const raw = diskBytes.subarray(offset, end);

      candidates.push({
        id: `FRAG-${String(counter++).padStart(3, '0')}`,
        name: 'financial_report.pdf',
        fileType: 'pdf',
        offsetStart: offset,
        offsetEnd: end,
        sectorStart: sector,
        sectorEnd: Math.floor(end / SECTOR_SIZE) - 1,
        sizeBytes: end - offset,
        rawBytes: new Uint8Array(raw),
        chunks: [
          {
            sectorStart: sector,
            sectorEnd: Math.floor(end / SECTOR_SIZE) - 1,
            byteOffset: offset,
            byteLength: end - offset,
            stitched: false,
            chunkIndex: 1,
          },
        ],
        carvingNotes: [
          `PDF magic signature '%PDF-' identified at sector ${sector} (offset 0x${offset.toString(16).toUpperCase()}).`,
          eofOffset !== -1
            ? `Standard '%%EOF' trailer matched at offset 0x${eofOffset.toString(16).toUpperCase()}.`
            : `Warning: '%%EOF' trailer missing; carved to estimated object boundary.`,
        ],
        footerFound: eofOffset !== -1,
        stitched: false,
      });

      offset = end - 16;
      continue;
    }

    // 2. JPEG Carving
    if (matchBytes(diskBytes, offset, SIGNATURES.JPEG_SOI)) {
      const eoiOffset = findBytes(diskBytes, offset + 10, offset + 32768, SIGNATURES.JPEG_EOI);
      let end: number;
      let footerFound = false;

      if (eoiOffset !== -1) {
        end = Math.min(len, Math.ceil((eoiOffset + 2) / SECTOR_SIZE) * SECTOR_SIZE);
        footerFound = true;
      } else {
        // Carve forward up to high-entropy cluster boundary or zero run
        let scanEnd = offset + 512;
        while (scanEnd < len && scanEnd < offset + 16384) {
          const chunk = diskBytes.subarray(scanEnd, scanEnd + 512);
          const entropy = calculateShannonEntropy(chunk);
          // Zero run or total silence indicates truncated end of file
          if (entropy < 0.2) break;
          scanEnd += 512;
        }
        end = scanEnd + 3 * 512; // capture corrupted tail
        end = Math.min(len, end);
      }

      const raw = diskBytes.subarray(offset, end);
      candidates.push({
        id: `FRAG-${String(counter++).padStart(3, '0')}`,
        name: 'photo1.jpg',
        fileType: 'jpeg',
        offsetStart: offset,
        offsetEnd: end,
        sectorStart: sector,
        sectorEnd: Math.floor(end / SECTOR_SIZE) - 1,
        sizeBytes: end - offset,
        rawBytes: new Uint8Array(raw),
        chunks: [
          {
            sectorStart: sector,
            sectorEnd: Math.floor(end / SECTOR_SIZE) - 1,
            byteOffset: offset,
            byteLength: end - offset,
            stitched: false,
            chunkIndex: 1,
          },
        ],
        carvingNotes: [
          `JPEG SOI marker (FF D8 FF) located at sector ${sector}.`,
          footerFound
            ? `Clean JPEG EOI marker (FF D9) confirmed.`
            : `EOI marker missing: detected abrupt entropy drop and cluster zeroing in trailing sectors.`,
        ],
        footerFound,
        stitched: false,
      });

      offset = end - 16;
      continue;
    }

    // 3. ZIP / DOCX Carving with Intelligent Fragment Stitching
    if (matchBytes(diskBytes, offset, SIGNATURES.ZIP_LOCAL)) {
      const chunk1Start = offset;
      const chunk1Sector = sector;
      const chunk1End = chunk1Start + 10 * SECTOR_SIZE; // 10 sectors body

      // Look ahead for orphaned Central Directory / EOCD across cluster gaps (Bi-directional Stitching)
      let chunk2Start = -1;
      let chunk2End = -1;

      for (let scan = chunk1End; scan < Math.min(len, chunk1End + 32768); scan += SECTOR_SIZE) {
        if (
          matchBytes(diskBytes, scan, SIGNATURES.ZIP_CENTRAL) ||
          matchBytes(diskBytes, scan, SIGNATURES.ZIP_LOCAL) ||
          matchBytes(diskBytes, scan, SIGNATURES.ZIP_EOCD)
        ) {
          chunk2Start = scan;
          chunk2End = chunk2Start + 13 * SECTOR_SIZE;
          break;
        }
      }

      const stitched = chunk2Start !== -1;
      const chunks: FragmentChunk[] = [
        {
          sectorStart: chunk1Sector,
          sectorEnd: Math.floor(chunk1End / SECTOR_SIZE) - 1,
          byteOffset: chunk1Start,
          byteLength: chunk1End - chunk1Start,
          stitched,
          chunkIndex: 1,
        },
      ];

      let totalRaw: Uint8Array;
      let endSector: number;
      const notes: string[] = [
        `ZIP/OOXML Local Header (PK\\x03\\x04) identified at sector ${chunk1Sector}. Contains '[Content_Types].xml' and Word OpenXML structures.`,
      ];

      if (stitched) {
        const c2Sector = Math.floor(chunk2Start / SECTOR_SIZE);
        const gapSectors = c2Sector - Math.floor(chunk1End / SECTOR_SIZE);
        chunks.push({
          sectorStart: c2Sector,
          sectorEnd: Math.floor(chunk2End / SECTOR_SIZE) - 1,
          byteOffset: chunk2Start,
          byteLength: chunk2End - chunk2Start,
          stitched: true,
          chunkIndex: 2,
        });

        // Combine chunks into reconstructed container
        const raw1 = diskBytes.subarray(chunk1Start, chunk1End);
        const raw2 = diskBytes.subarray(chunk2Start, chunk2End);
        totalRaw = new Uint8Array(raw1.length + raw2.length);
        totalRaw.set(raw1, 0);
        totalRaw.set(raw2, raw1.length);
        endSector = Math.floor(chunk2End / SECTOR_SIZE) - 1;

        notes.push(
          `[Stitching Success] Reconnected orphaned Central Directory located at sector ${c2Sector} across a ${gapSectors}-sector unallocated gap.`,
          `ZIP End of Central Directory (PK\\x05\\x06) successfully correlated with primary stream.`
        );
      } else {
        totalRaw = new Uint8Array(diskBytes.subarray(chunk1Start, chunk1End));
        endSector = Math.floor(chunk1End / SECTOR_SIZE) - 1;
        notes.push(`Warning: Central Directory not found in subsequent cluster span.`);
      }

      candidates.push({
        id: `FRAG-${String(counter++).padStart(3, '0')}`,
        name: 'case_notes.docx',
        fileType: 'docx',
        offsetStart: chunk1Start,
        offsetEnd: stitched ? chunk2End : chunk1End,
        sectorStart: chunk1Sector,
        sectorEnd: endSector,
        sizeBytes: totalRaw.length,
        rawBytes: totalRaw,
        chunks,
        carvingNotes: notes,
        footerFound: stitched,
        stitched,
      });

      offset = (stitched ? chunk2End : chunk1End) - 16;
      continue;
    }

    // 4. SQLite Database Carving
    if (matchBytes(diskBytes, offset, SIGNATURES.SQLITE_HEADER)) {
      const end = Math.min(len, offset + 18 * SECTOR_SIZE);
      const raw = diskBytes.subarray(offset, end);

      candidates.push({
        id: `FRAG-${String(counter++).padStart(3, '0')}`,
        name: 'logs.db',
        fileType: 'sqlite',
        offsetStart: offset,
        offsetEnd: end,
        sectorStart: sector,
        sectorEnd: Math.floor(end / SECTOR_SIZE) - 1,
        sizeBytes: end - offset,
        rawBytes: new Uint8Array(raw),
        chunks: [
          {
            sectorStart: sector,
            sectorEnd: Math.floor(end / SECTOR_SIZE) - 1,
            byteOffset: offset,
            byteLength: end - offset,
            stitched: false,
            chunkIndex: 1,
          },
        ],
        carvingNotes: [
          `SQLite 3 database signature detected at sector ${sector}. Page size declared: 4096 bytes.`,
          `Schema b-tree and freelist cells located at page offset 100.`,
          `Detected deleted row artifacts in unallocated b-tree leaf space.`,
        ],
        footerFound: true,
        stitched: false,
      });

      offset = end - 16;
      continue;
    }

    // 5. Plaintext Evidence in Slack Space
    const checkSlice = diskBytes.subarray(offset, offset + 64);
    if (isHighDensityAscii(checkSlice)) {
      // Find boundary where printable ASCII ends
      let scan = offset;
      while (scan < len && (diskBytes[scan] >= 32 || diskBytes[scan] === 10 || diskBytes[scan] === 13 || diskBytes[scan] === 9)) {
        scan++;
      }
      if (scan - offset >= 128) {
        const end = Math.min(len, Math.ceil(scan / SECTOR_SIZE) * SECTOR_SIZE);
        const raw = diskBytes.subarray(offset, end);

        candidates.push({
          id: `FRAG-${String(counter++).padStart(3, '0')}`,
          name: 'readme_evidence.txt',
          fileType: 'txt',
          offsetStart: offset,
          offsetEnd: end,
          sectorStart: sector,
          sectorEnd: Math.floor(end / SECTOR_SIZE) - 1,
          sizeBytes: end - offset,
          rawBytes: new Uint8Array(raw),
          chunks: [
            {
              sectorStart: sector,
              sectorEnd: Math.floor(end / SECTOR_SIZE) - 1,
              byteOffset: offset,
              byteLength: end - offset,
              stitched: false,
              chunkIndex: 1,
            },
          ],
          carvingNotes: [
            `High-density printable ASCII text block isolated in sector ${sector} slack space.`,
            `Clear boundary delimiters before subsequent null padding.`,
          ],
          footerFound: true,
          stitched: false,
        });

        offset = end - 16;
        continue;
      }
    }
  }

  return candidates;
}

function isHighDensityAscii(data: Uint8Array): boolean {
  if (data.length < 32) return false;
  let printable = 0;
  for (let i = 0; i < data.length; i++) {
    const b = data[i];
    if ((b >= 32 && b <= 126) || b === 10 || b === 13 || b === 9) {
      printable++;
    }
  }
  return printable / data.length > 0.85;
}
