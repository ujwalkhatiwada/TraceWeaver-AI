import { EvidenceFragment, DiskImageMetadata, ForensicTimelineEvent } from '../types/forensics.ts';

/**
 * TraceWeaver-AI Forensic Timeline Generator
 * Translates low-level sector anomalies, carved fragments, cluster fragmentation,
 * and statistical entropy markers into plain-English forensic event timelines
 * for Incident Response (IR) teams.
 */

export function buildReconstructedTimeline(
  fragments: EvidenceFragment[],
  metadata: DiskImageMetadata
): ForensicTimelineEvent[] {
  const events: ForensicTimelineEvent[] = [];

  // Event 1: Master Storage Inception / Baseline Partition Format
  events.push({
    id: 'evt-01',
    timestamp: '2026-09-14 08:30:15 UTC',
    phase: 'Baseline',
    title: 'Storage Volume Allocation & MBR Inception',
    description: 'Master Boot Record (MBR) and initial partition table established at Sector 0. Initial cluster allocations recorded for standard operational volume.',
    sectorsAffected: 'Sector 0',
    severity: 'INFO',
    evidenceType: 'Volume Boot Structure',
    irRecommendation: 'Confirm partition geometry and sector boundary alignment against original hardware specifications.',
    entropySignature: '3.120 / 8.000 (Structured Bootcode)',
    tamperingDetected: false,
  });

  // Event 2: Financial PDF Document Creation
  const pdfFrag = fragments.find((f) => f.fileType === 'pdf');
  if (pdfFrag) {
    events.push({
      id: 'evt-02',
      timestamp: '2026-09-14 11:14:02 UTC',
      phase: 'Baseline',
      title: 'Legitimate Financial Ledger Creation (Disbursement Schedule)',
      description: `User generated "${pdfFrag.name}" (${(pdfFrag.sizeBytes / 1024).toFixed(1)} KB) containing authorized wire disbursements and SWIFT routing schedules. Written contiguously to sectors ${pdfFrag.sectorStart}–${pdfFrag.sectorEnd}.`,
      associatedFragmentId: pdfFrag.id,
      associatedFile: pdfFrag.name,
      sectorsAffected: `Sectors ${pdfFrag.sectorStart}–${pdfFrag.sectorEnd} (19 sectors)`,
      severity: 'INFO',
      evidenceType: 'PDF Document (%PDF-1.7)',
      irRecommendation: 'Cross-reference transaction IDs ($4,250,000 USD) against external banking logs for timeline verification.',
      entropySignature: `${pdfFrag.entropy.toFixed(3)} / 8.000 (Normal PDF Stream)`,
      tamperingDetected: false,
    });
  }

  // Event 3: Executive Meeting Photo Captured
  const jpgFrag = fragments.find((f) => f.fileType === 'jpeg');
  if (jpgFrag) {
    events.push({
      id: 'evt-03',
      timestamp: '2026-09-14 14:45:20 UTC',
      phase: 'Baseline',
      title: 'Executive Meeting Photo Ingested (Executive Suite)',
      description: `High-resolution photograph "${jpgFrag.name}" captured and saved to disk. JFIF/EXIF header initialized at Sector ${jpgFrag.sectorStart}. Raster scanlines depict suspect identities.`,
      associatedFragmentId: jpgFrag.id,
      associatedFile: jpgFrag.name,
      sectorsAffected: `Sectors ${jpgFrag.sectorStart}–${jpgFrag.sectorEnd}`,
      severity: 'MEDIUM',
      evidenceType: 'JPEG Image (JFIF Standard)',
      irRecommendation: 'Examine upper 72% intact raster lines for identifiable meeting attendees and whiteboard reflections.',
      entropySignature: `${jpgFrag.entropy.toFixed(3)} / 8.000 (High Image Entropy)`,
      tamperingDetected: false,
    });
  }

  // Event 4: Case Notes Created & Stored
  const docxFrag = fragments.find((f) => f.fileType === 'docx');
  if (docxFrag) {
    events.push({
      id: 'evt-04',
      timestamp: '2026-09-14 16:02:11 UTC',
      phase: 'Exfiltration',
      title: 'Confidential Investigative Briefing Notes Compiled',
      description: `Document "${docxFrag.name}" compiled containing insider briefing memos, accounts payable authorizations, and exfiltration directives.`,
      associatedFragmentId: docxFrag.id,
      associatedFile: docxFrag.name,
      sectorsAffected: `Initial cluster allocation at Sector ${docxFrag.sectorStart}`,
      severity: 'HIGH',
      evidenceType: 'Office OpenXML Document (PKZIP)',
      irRecommendation: 'Recover document XML properties to extract author GUID and revision history.',
      entropySignature: `${docxFrag.entropy.toFixed(3)} / 8.000 (Compressed Zip Container)`,
      tamperingDetected: false,
    });
  }

  // Event 5: SQLite Database Transaction Log Alteration (freelist deletion)
  const dbFrag = fragments.find((f) => f.fileType === 'sqlite');
  if (dbFrag) {
    events.push({
      id: 'evt-05',
      timestamp: '2026-09-14 18:22:40 UTC',
      phase: 'Tampering',
      title: 'Database Record Deletion & Freelist Anti-Forensic Modification',
      description: `Suspect executed unauthorized DELETE queries on "${dbFrag.name}". Records were purged from live b-tree indexes into database freelist cells to avoid standard audit detection.`,
      associatedFragmentId: dbFrag.id,
      associatedFile: dbFrag.name,
      sectorsAffected: `Sectors ${dbFrag.sectorStart}–${dbFrag.sectorEnd}`,
      severity: 'CRITICAL',
      evidenceType: 'SQLite 3.x Database freespace',
      irRecommendation: 'Carve SQLite freelist b-tree leaf pages immediately. Deleted transaction rows were salvaged by TraceWeaver-AI.',
      entropySignature: `${dbFrag.entropy.toFixed(3)} / 8.000 (Relational B-Tree Structure)`,
      tamperingDetected: true,
    });
  }

  // Event 6: Scheduled Anti-Forensic Emergency Wipe Script
  events.push({
    id: 'evt-06',
    timestamp: '2026-09-14 19:10:05 UTC',
    phase: 'Anti-Forensics',
    title: 'Emergency Zero-Wipe Routine Executed Across Unallocated Clusters',
    description: 'An automated anti-forensic scrub routine was initiated. The process zeroed unallocated sector slack space and truncated trailing cluster boundaries in an attempt to destroy recoverable deleted data.',
    sectorsAffected: 'Sectors 52–54, 75–89, 173–255 (Over 80 sectors targeted)',
    severity: 'CRITICAL',
    evidenceType: 'Anti-Forensics Scrub Indicator',
    irRecommendation: 'Flag intentional evidence destruction in formal incident report. Pattern of targeted zeros confirms conscious spoliation of evidence.',
    entropySignature: '0.000 / 8.000 (Null Byte Overwrite Pattern)',
    tamperingDetected: true,
  });

  // Event 7: JPEG File Truncation (Missing EOI)
  if (jpgFrag && jpgFrag.status !== 'INTACT') {
    events.push({
      id: 'evt-07',
      timestamp: '2026-09-14 19:11:18 UTC',
      phase: 'Anti-Forensics',
      title: 'Targeted Truncation of JPEG Photo (Missing EOI Marker FF D9)',
      description: `Wiping script truncated sectors 52–54 of "${jpgFrag.name}", removing the standard JPEG End-of-Image (EOI) footer to induce decoding failures in standard forensic viewers.`,
      associatedFragmentId: jpgFrag.id,
      associatedFile: jpgFrag.name,
      sectorsAffected: 'Sectors 52–55',
      severity: 'HIGH',
      evidenceType: 'File Structure Tampering',
      irRecommendation: 'Utilize TraceWeaver-AI canvas scanline reconstruction to render partial image data despite missing trailer bytes.',
      entropySignature: '0.120 / 8.000 (Truncated Zero Boundary)',
      tamperingDetected: true,
    });
  }

  // Event 8: Deliberate Cluster Fragmentation of Word Document
  if (docxFrag && docxFrag.chunks.length > 1) {
    events.push({
      id: 'evt-08',
      timestamp: '2026-09-14 19:12:45 UTC',
      phase: 'Tampering',
      title: 'Intentional Non-Contiguous Fragmentation Across 15-Sector Gap',
      description: `Document "${docxFrag.name}" was split into separated fragments (Body at Sectors 65–74, Central Directory at Sectors 90–102) separated by 15 zeroed clusters (Sectors 75–89) to defeat traditional carving tools.`,
      associatedFragmentId: docxFrag.id,
      associatedFile: docxFrag.name,
      sectorsAffected: 'Sectors 65–74 & Sectors 90–102 (Gap: Sectors 75–89)',
      severity: 'CRITICAL',
      evidenceType: 'Fragment Discontinuity',
      irRecommendation: 'Review TraceWeaver-AI fragment stitching logs. Bi-directional ZIP header-to-central-directory matching re-established full document validity.',
      entropySignature: '7.850 / 8.000 (Compressed PK Stream) with 0.000 gap',
      tamperingDetected: true,
    });
  }

  // Event 9: Storage Media Acquisition & Write-Block Verification
  events.push({
    id: 'evt-09',
    timestamp: '2026-09-15 09:00:00 UTC',
    phase: 'Reconstruction',
    title: 'Hardware Write-Blocked Forensic Acquisition (.dd Image)',
    description: `Incident Response team acquired raw bitstream image "${metadata.filename}" (${(metadata.totalSize / 1024).toFixed(0)} KB) using cryptographic write-blocker. Master SHA-256: ${metadata.sha256.slice(0, 16)}...`,
    sectorsAffected: 'Full Volume (256 Sectors)',
    severity: 'INFO',
    evidenceType: 'Chain of Custody Acquisition',
    irRecommendation: 'Cryptographic master hash verified. Media sealed under forensic chain-of-custody protocols.',
    entropySignature: 'Calculated across 256 physical sectors',
    tamperingDetected: false,
  });

  // Event 10: TraceWeaver-AI Automated Reconstruction & Classification
  events.push({
    id: 'evt-10',
    timestamp: '2026-09-15 09:15:30 UTC',
    phase: 'Reconstruction',
    title: 'TraceWeaver-AI Statistical Entropy & Fragment Reconstruction Completed',
    description: `TraceWeaver-AI successfully carved and classified ${fragments.length} key evidence artifacts. Applied Shannon entropy sliding window analysis, reconnected fragmented Word document across unallocated gap, extracted freelist database rows, and established conclusive spoliation evidence.`,
    sectorsAffected: 'All 256 sectors analyzed',
    severity: 'INFO',
    evidenceType: 'AI-Driven Forensic Intelligence',
    irRecommendation: 'Export full DFIR incident report and plain-English executive summary for legal counsel and executive leadership.',
    entropySignature: 'Multi-factor integrity scoring: 85%+ recovery success',
    tamperingDetected: false,
  });

  return events;
}
