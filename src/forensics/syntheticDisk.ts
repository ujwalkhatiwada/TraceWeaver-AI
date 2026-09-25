import { calculateShannonEntropy } from './cryptoUtils.ts';
import { DiskSector, DiskImageMetadata, FileType } from '../types/forensics.ts';

export interface GroundTruthItem {
  name: string;
  originalName: string;
  fileType: FileType;
  expectedStatus: 'INTACT' | 'PARTIALLY_RECOVERABLE' | 'CORRUPTED';
  damageType: string;
  sectors: number[];
  notes: string;
}

export interface SyntheticDiskResult {
  diskBytes: Uint8Array;
  metadata: DiskImageMetadata;
  groundTruth: GroundTruthItem[];
  sectors: DiskSector[];
}

const SECTOR_SIZE = 512;
const DEFAULT_TOTAL_SECTORS = 256; // 128 KB disk (lightweight, blazing fast to carve and inspect)

export function generateSyntheticDiskImage(
  scenario: 'ironvault' | 'antiforensics' | 'flashcorrupt' = 'ironvault'
): SyntheticDiskResult {
  const totalSectors = DEFAULT_TOTAL_SECTORS;
  const totalBytes = totalSectors * SECTOR_SIZE;
  const disk = new Uint8Array(totalBytes);

  // Initialize with pseudo-random background noise / slack space
  for (let i = 0; i < totalBytes; i++) {
    // mostly unallocated (0x00) with occasional filesystem slack patterns
    disk[i] = Math.random() < 0.85 ? 0x00 : (i * 37) % 256;
  }

  // 1. MBR / Partition Table in Sector 0
  disk[0] = 0xeb; // JMP boot code
  disk[1] = 0x3c;
  disk[2] = 0x90;
  const oem = new TextEncoder().encode('AEGISDOS');
  disk.set(oem, 3);
  // Sector 0 signature
  disk[510] = 0x55;
  disk[511] = 0xaa;

  const groundTruth: GroundTruthItem[] = [];

  // ==========================================
  // Item 1: financial_report.pdf
  // Placed at Sector 10 to Sector 28 (19 sectors = 9728 bytes)
  // Status: INTACT
  // ==========================================
  const pdfContent = generateSamplePdf();
  const pdfSectorStart = 10;
  const pdfBytes = new TextEncoder().encode(pdfContent);
  const pdfOffset = pdfSectorStart * SECTOR_SIZE;
  disk.set(pdfBytes.subarray(0, Math.min(pdfBytes.length, 19 * SECTOR_SIZE)), pdfOffset);

  groundTruth.push({
    name: 'financial_report.pdf',
    originalName: 'Q3_Offshore_Disbursements_Audited.pdf',
    fileType: 'pdf',
    expectedStatus: 'INTACT',
    damageType: 'None - Contiguous sector allocation, intact xref table & %%EOF',
    sectors: Array.from({ length: 19 }, (_, i) => pdfSectorStart + i),
    notes: 'Contains high-priority wire transfer ledgers and SWIFT codes ($4,250,000 disbursement).',
  });

  // ==========================================
  // Item 2: photo1.jpg (Damaged Meeting Photo)
  // Placed at Sector 35 to Sector 55 (21 sectors)
  // Status: PARTIALLY_RECOVERABLE (Truncated trailing scan data, missing EOI marker)
  // ==========================================
  const jpegBytes = generateDamagedJpeg();
  const jpgSectorStart = 35;
  const jpgOffset = jpgSectorStart * SECTOR_SIZE;
  disk.set(jpegBytes, jpgOffset);

  // Simulate truncation: zero out the last 2 sectors to simulate incomplete write / wipe
  for (let b = (jpgSectorStart + 18) * SECTOR_SIZE; b < (jpgSectorStart + 21) * SECTOR_SIZE; b++) {
    disk[b] = 0x00;
  }

  groundTruth.push({
    name: 'photo1.jpg',
    originalName: 'IMG_20260914_Executive_Suite.jpg',
    fileType: 'jpeg',
    expectedStatus: 'PARTIALLY_RECOVERABLE',
    damageType: 'Truncation / Missing EOI marker (FF D9). Trailing 1.5KB zeroed.',
    sectors: Array.from({ length: 21 }, (_, i) => jpgSectorStart + i),
    notes: 'Meeting photograph of suspects; header & upper 70% of scan lines intact.',
  });

  // ==========================================
  // Item 3: case_notes.docx (Intelligently Fragmented)
  // Chunk 1: Sector 65 to Sector 74 (10 sectors)
  // Gap: Sectors 75 to 89 (15 unallocated sectors with garbage/zeros)
  // Chunk 2: Sector 90 to Sector 102 (13 sectors)
  // Status: INTACT / RECOVERABLE via Stitching
  // ==========================================
  const docxParts = generateFragmentedDocx();
  const docxChunk1Sector = 65;
  const docxChunk2Sector = 90;
  disk.set(docxParts.chunk1, docxChunk1Sector * SECTOR_SIZE);
  disk.set(docxParts.chunk2, docxChunk2Sector * SECTOR_SIZE);

  groundTruth.push({
    name: 'case_notes.docx',
    originalName: 'Confidential_Investigative_Briefing_v2.docx',
    fileType: 'docx',
    expectedStatus: 'PARTIALLY_RECOVERABLE',
    damageType: 'Split Fragmentation: Body in Sectors 65-74, Central Directory in Sectors 90-102 across 15-sector gap.',
    sectors: [
      ...Array.from({ length: 10 }, (_, i) => docxChunk1Sector + i),
      ...Array.from({ length: 13 }, (_, i) => docxChunk2Sector + i),
    ],
    notes: 'Word document with ZIP container. Requires intelligent carver stitching to bridge cluster gap.',
  });

  // ==========================================
  // Item 4: logs.db (SQLite Audit Log with Deletion)
  // Placed at Sector 115 to Sector 132 (18 sectors)
  // Status: PARTIALLY_RECOVERABLE
  // ==========================================
  const sqliteBytes = generateSampleSqlite();
  const dbSectorStart = 115;
  disk.set(sqliteBytes, dbSectorStart * SECTOR_SIZE);

  groundTruth.push({
    name: 'logs.db',
    originalName: 'system_security_audit.db',
    fileType: 'sqlite',
    expectedStatus: 'PARTIALLY_RECOVERABLE',
    damageType: 'Deleted Rows & Corrupted B-Tree pointers in page 2; SQLite header is intact.',
    sectors: Array.from({ length: 18 }, (_, i) => dbSectorStart + i),
    notes: 'SQLite database containing user authentication logs and deleted table rows.',
  });

  // ==========================================
  // Item 5: readme_evidence.txt (Slack Space Infiltration)
  // Placed at Sector 145 to Sector 148 (4 sectors)
  // Status: INTACT
  // ==========================================
  const txtContent = generateSampleText();
  const txtSectorStart = 145;
  const txtBytes = new TextEncoder().encode(txtContent);
  disk.set(txtBytes, txtSectorStart * SECTOR_SIZE);

  groundTruth.push({
    name: 'readme_evidence.txt',
    originalName: 'OPERATION_DESTRUCT_MEMO.txt',
    fileType: 'txt',
    expectedStatus: 'INTACT',
    damageType: 'Hidden in unallocated slack space; surrounded by null boundary padding.',
    sectors: Array.from({ length: 4 }, (_, i) => txtSectorStart + i),
    notes: 'Smoking gun plaintext memo detailing intentional wipe procedures and target bank accounts.',
  });

  // ==========================================
  // Item 6: corrupt_backup.tar.gz (Corrupted Archive)
  // Placed at Sector 160 to Sector 172
  // Status: CORRUPTED (Anti-forensic random overwrite)
  // ==========================================
  const corruptSectorStart = 160;
  // Partial GZIP magic 1F 8B 08, but subsequent blocks randomized
  disk[corruptSectorStart * SECTOR_SIZE] = 0x1f;
  disk[corruptSectorStart * SECTOR_SIZE + 1] = 0x8b;
  disk[corruptSectorStart * SECTOR_SIZE + 2] = 0x08;
  for (let b = corruptSectorStart * SECTOR_SIZE + 3; b < (corruptSectorStart + 12) * SECTOR_SIZE; b++) {
    disk[b] = (b * 19 + 7) % 256; // Pseudo-randomized junk
  }

  groundTruth.push({
    name: 'corrupt_backup.tar.gz',
    originalName: 'exfiltrated_database_dump.tar.gz',
    fileType: 'unknown',
    expectedStatus: 'CORRUPTED',
    damageType: 'Zero/Noise Overwrite. Magic header present but DEFLATE stream is corrupt.',
    sectors: Array.from({ length: 12 }, (_, i) => corruptSectorStart + i),
    notes: 'Severe byte corruption; anti-forensics zeroing destroyed checksum block.',
  });

  // Build sector map models
  const sectors: DiskSector[] = [];
  for (let s = 0; s < totalSectors; s++) {
    const sOffset = s * SECTOR_SIZE;
    const sectorBytes = disk.subarray(sOffset, sOffset + SECTOR_SIZE);
    const entropy = calculateShannonEntropy(sectorBytes);

    let state: DiskSector['state'] = 'unallocated';
    let fileType: FileType | undefined;
    let label = 'Unallocated Free Space';
    let evidenceId: string | undefined;

    if (s === 0) {
      state = 'boot';
      label = 'Master Boot Record (MBR)';
    } else if (s >= pdfSectorStart && s < pdfSectorStart + 19) {
      state = 'allocated_intact';
      fileType = 'pdf';
      evidenceId = 'financial_report.pdf';
      label = `PDF Data [Sec ${s}]`;
    } else if (s >= jpgSectorStart && s < jpgSectorStart + 21) {
      state = s >= jpgSectorStart + 18 ? 'slack_corrupted' : 'allocated_intact';
      fileType = 'jpeg';
      evidenceId = 'photo1.jpg';
      label = s >= jpgSectorStart + 18 ? `JPEG Zeroed Tail [Sec ${s}]` : `JPEG Scanline [Sec ${s}]`;
    } else if (s >= docxChunk1Sector && s < docxChunk1Sector + 10) {
      state = 'fragment_a';
      fileType = 'docx';
      evidenceId = 'case_notes.docx';
      label = `DOCX Chunk 1 (Header/Body) [Sec ${s}]`;
    } else if (s >= docxChunk2Sector && s < docxChunk2Sector + 13) {
      state = 'fragment_b';
      fileType = 'docx';
      evidenceId = 'case_notes.docx';
      label = `DOCX Chunk 2 (Central Dir) [Sec ${s}]`;
    } else if (s >= dbSectorStart && s < dbSectorStart + 18) {
      state = s >= dbSectorStart + 12 ? 'slack_corrupted' : 'allocated_intact';
      fileType = 'sqlite';
      evidenceId = 'logs.db';
      label = `SQLite Table Page [Sec ${s}]`;
    } else if (s >= txtSectorStart && s < txtSectorStart + 4) {
      state = 'allocated_intact';
      fileType = 'txt';
      evidenceId = 'readme_evidence.txt';
      label = `ASCII Memo In Slack [Sec ${s}]`;
    } else if (s >= corruptSectorStart && s < corruptSectorStart + 12) {
      state = 'slack_corrupted';
      evidenceId = 'corrupt_backup.tar.gz';
      label = `Wiped / Noise Block [Sec ${s}]`;
    } else {
      const isZero = sectorBytes.every((b) => b === 0);
      state = isZero ? 'zeroed' : 'unallocated';
      label = isZero ? 'Zeroed Space (0x00)' : 'Unallocated Cluster Slack';
    }

    sectors.push({
      sectorIndex: s,
      offset: sOffset,
      size: SECTOR_SIZE,
      state,
      fileType,
      entropy,
      label,
      evidenceId,
    });
  }

  const metadata: DiskImageMetadata = {
    filename: 'image.dd',
    totalSize: totalBytes,
    sectorCount: totalSectors,
    sectorSize: SECTOR_SIZE,
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', // will be computed live
    md5: 'd41d8cd98f00b204e9800998ecf8427e',
    scenarioName: 'Operation IronVault (Corporate Fraud & Emergency Wipe)',
    scenarioDescription:
      'Synthetic disk image capturing an emergency drive scrub attempt. Includes fragmented DOCX briefings, deleted SQLite ledger logs, truncated surveillance JPEGs, and intact offshore financial PDF disclosures.',
    timestamp: new Date().toISOString(),
    carvedCount: groundTruth.length,
    intactCount: groundTruth.filter((g) => g.expectedStatus === 'INTACT').length,
    partialCount: groundTruth.filter((g) => g.expectedStatus === 'PARTIALLY_RECOVERABLE').length,
    corruptedCount: groundTruth.filter((g) => g.expectedStatus === 'CORRUPTED').length,
  };

  return {
    diskBytes: disk,
    metadata,
    groundTruth,
    sectors,
  };
}

// Helper: Generates realistic PDF byte stream with tables & metadata
function generateSamplePdf(): string {
  return `%PDF-1.4
%âãÏÓ
1 0 obj
<<
  /Title (CONFIDENTIAL OFFSHORE DISBURSEMENTS - Q3 2026)
  /Author (Director of Treasury)
  /Subject (SWIFT Authorization CHASEUS33)
  /CreationDate (D:20260918142200Z)
  /Producer (Forensic Financial Suite 4.2)
>>
endobj
2 0 obj
<<
  /Type /Catalog
  /Pages 3 0 R
>>
endobj
3 0 obj
<<
  /Type /Pages
  /Kids [4 0 R]
  /Count 1
>>
endobj
4 0 obj
<<
  /Type /Page
  /Parent 3 0 R
  /MediaBox [0 0 612 792]
  /Contents 5 0 R
>>
endobj
5 0 obj
<<
  /Length 1120
>>
stream
BT
/F1 16 Tf
50 720 Td
(CHIMERA HOLDINGS - WIRE TRANSFER DISBURSEMENT SCHEDULE) Tj
/F1 10 Tf
0 -30 Td
(CLASSIFICATION: STRICTLY CONFIDENTIAL - ATTORNEY-CLIENT PRIVILEGED) Tj
0 -20 Td
(Case Reference: IRONVAULT-DISBURSEMENT-2026-09) Tj
0 -30 Td
(TRANSACTION ID   | BENEFICIARY ACCOUNT      | AMOUNT (USD)  | ROUTING / SWIFT | STATUS) Tj
0 -15 Td
(TX-990214-A      | AURA CAPITAL (CAYMAN)   | $ 1,750,000   | SWIFT: AURAISKY | CLEARED) Tj
0 -15 Td
(TX-990215-B      | VANGUARD SHELL CORP     | $ 2,500,000   | SWIFT: CHASEUS33| CLEARED) Tj
0 -15 Td
(TX-990216-C      | ESCROW KEY 0x8892A      | $   820,000   | SWIFT: UBSWCHZH | PENDING) Tj
0 -30 Td
(NOTES: Direct wire executed under executive authorization. Overwrite local mirror prior to quarterly audit.) Tj
0 -15 Td
(Primary Signatory: CFO M. Sterling | Approval Code: AUTH-EXEC-8891) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000015 00000 n 
0000000210 00000 n 
0000000262 00000 n 
0000000325 00000 n 
0000000418 00000 n 
trailer
<<
  /Size 6
  /Root 2 0 R
  /Info 1 0 R
>>
startxref
1620
%%EOF
`;
}

// Helper: Generates realistic damaged JPEG with JFIF header
function generateDamagedJpeg(): Uint8Array {
  const bytes = new Uint8Array(21 * SECTOR_SIZE);
  // SOI marker
  bytes[0] = 0xff;
  bytes[1] = 0xd8;
  // APP0 marker
  bytes[2] = 0xff;
  bytes[3] = 0xe0;
  bytes[4] = 0x00;
  bytes[5] = 0x10; // length 16
  // 'JFIF\0'
  const jfif = [0x4a, 0x46, 0x49, 0x46, 0x00];
  jfif.forEach((b, idx) => (bytes[6 + idx] = b));
  bytes[11] = 0x01; // v1.1
  bytes[12] = 0x01;
  bytes[13] = 0x01; // dots per inch
  bytes[14] = 0x00;
  bytes[15] = 0x48; // 72 DPI
  bytes[16] = 0x00;
  bytes[17] = 0x48;

  // DQT (Quantization table) marker
  bytes[18] = 0xff;
  bytes[19] = 0xdb;
  bytes[20] = 0x00;
  bytes[21] = 0x43; // 67 bytes

  // Fill pseudo scanline data with high entropy
  for (let i = 22; i < 18 * SECTOR_SIZE; i++) {
    bytes[i] = ((i * 127) ^ (i >> 3) ^ 0xaa) % 256;
  }

  // Trailing sectors intentionally left with zero-wipe truncation (simulating partial camera deletion)
  return bytes;
}

// Helper: Generates two fragmented pieces of DOCX (ZIP container)
function generateFragmentedDocx(): { chunk1: Uint8Array; chunk2: Uint8Array } {
  const chunk1 = new Uint8Array(10 * SECTOR_SIZE);
  const chunk2 = new Uint8Array(13 * SECTOR_SIZE);

  // Chunk 1: Local File Header 1 - '[Content_Types].xml'
  // PK\x03\x04
  chunk1[0] = 0x50;
  chunk1[1] = 0x4b;
  chunk1[2] = 0x03;
  chunk1[3] = 0x04;
  chunk1[4] = 0x14; // version needed
  chunk1[5] = 0x00;
  chunk1[6] = 0x00; // general purpose flags
  chunk1[7] = 0x00;
  chunk1[8] = 0x08; // compression: deflate
  chunk1[9] = 0x00;
  // filename length = 19
  chunk1[26] = 19;
  chunk1[27] = 0;
  const fn1 = new TextEncoder().encode('[Content_Types].xml');
  chunk1.set(fn1, 30);

  // XML body for word/document.xml with confidential evidence text
  const docxXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>INVESTIGATIVE CASE BRIEFING - OPERATION IRONVAULT</w:t></w:r></w:p>
    <w:p><w:r><w:t>Suspect: Marcus Sterling (VP of Corporate Finance)</w:t></w:r></w:p>
    <w:p><w:r><w:t>Findings: Automated script was discovered scheduled to run at 23:45 UTC to zero-out unallocated cluster slack and overwrite database tables.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Target Accounts: Bank of Zurich #CH88-2918-0091; Wire reference: PROJECT-CHIMERA-FINAL.</w:t></w:r></w:p>
    <w:p><w:r><w:t>Key Witnesses: Senior Auditor J. Vance, Lead Security Architect D. Lin.</w:t></w:r></w:p>
  </w:body>
</w:document>`;
  const xmlEncoded = new TextEncoder().encode(docxXml);
  chunk1.set(xmlEncoded, 30 + fn1.length + 10);

  // Chunk 2: Central Directory & End of Central Directory (EOCD)
  // Central Directory Record: PK\x01\x02
  chunk2[0] = 0x50;
  chunk2[1] = 0x4b;
  chunk2[2] = 0x01;
  chunk2[3] = 0x02;
  const cdFn = new TextEncoder().encode('word/document.xml');
  chunk2[28] = cdFn.length;
  chunk2[29] = 0;
  chunk2.set(cdFn, 46);

  // End of Central Directory (EOCD): PK\x05\x06
  const eocdOffset = 100;
  chunk2[eocdOffset] = 0x50;
  chunk2[eocdOffset + 1] = 0x4b;
  chunk2[eocdOffset + 2] = 0x05;
  chunk2[eocdOffset + 3] = 0x06;
  chunk2[eocdOffset + 8] = 0x02; // number of central directory records on this disk
  chunk2[eocdOffset + 10] = 0x02; // total records

  return { chunk1, chunk2 };
}

// Helper: Generates realistic SQLite 3 database bytes
function generateSampleSqlite(): Uint8Array {
  const bytes = new Uint8Array(18 * SECTOR_SIZE);
  // Header: 'SQLite format 3\0'
  const magic = new TextEncoder().encode('SQLite format 3\0');
  bytes.set(magic, 0);

  // Page size 4096 (0x1000)
  bytes[16] = 0x10;
  bytes[17] = 0x00;
  bytes[18] = 0x01; // file format write version
  bytes[19] = 0x01; // file format read version
  bytes[24] = 0x00; // change counter
  bytes[25] = 0x00;
  bytes[26] = 0x00;
  bytes[27] = 0x12;

  // Schema string embedded in B-Tree page 1
  const schemaStr = `CREATE TABLE security_logs (id INTEGER PRIMARY KEY, user_id TEXT, event_type TEXT, ip_address TEXT, payload TEXT, timestamp DATETIME);
CREATE TABLE offshore_wires (wire_id TEXT, destination TEXT, amount REAL, approved_by TEXT);
INSERT INTO offshore_wires VALUES ('W-9901','Cayman Alpha Trust',1750000,'M_STERLING');
INSERT INTO offshore_wires VALUES ('W-9902','Zurich Vault Escrow',2500000,'M_STERLING');
-- DELETED ENTRY RECOVERED FROM FREELIST CELL:
-- INSERT INTO offshore_wires VALUES ('W-SECRET','Panama Shadow Holdings',4200000,'M_STERLING');`;
  const schemaEncoded = new TextEncoder().encode(schemaStr);
  bytes.set(schemaEncoded, 100);

  return bytes;
}

// Helper: Generates plaintext smoking-gun evidence memo
function generateSampleText(): string {
  return `=== STRICTLY CONFIDENTIAL & PRIVILEGED MEMORANDUM ===
DATE: 2026-09-18 21:15:00 UTC
TO: EXECUTIVE DISBURSEMENT COMMITTEE
FROM: M. STERLING (PROJECT CHIMERA CONTROLLER)
SUBJECT: EMERGENCY STORAGE OVERWRITE AND AUDIT PREPARATION

Gentlemen:
Our external forensics team is scheduled to seize the premises tomorrow at 08:00 EST.
Per protocol:
1. All local SQLite database logs on workstation WS-FIN-09 have been marked for zero-wipe.
2. The offshore wire transfers (Totaling $4,250,000 USD to Cayman Alpha & Zurich Escrow) were routed through intermediate dummy companies.
3. If questioned regarding the fragmented Word document (case_notes.docx), maintain that it was standard routine system defragmentation.
4. Ensure all physical tokens and hardware encryption keys are destroyed immediately.

Do not commit this file to network storage. It will remain in cluster slack until scrub utility completes.
=== END OF RECORD ===
`;
}
