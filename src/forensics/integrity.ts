/**
 * Objective 02 – Data Integrity & Corruption Assessment
 * Equivalent to integrity.py
 */

import { CarvedCandidate } from './carving.ts';
import { EvidenceStatus } from '../types/forensics.ts';
import {
  calculateShannonEntropy,
  calculateNullByteRatio,
} from './cryptoUtils.ts';

export interface IntegrityAssessment {
  status: EvidenceStatus;
  integrityFactor: number; // 0.0 to 1.0
  entropy: number;
  nullByteRatio: number;
  defects: string[];
  structuralValidations: {
    headerValid: boolean;
    footerValid: boolean;
    internalStructuresValid: boolean;
    expectedEntropyRange: boolean;
  };
}

export function assessFragmentIntegrity(
  candidate: CarvedCandidate
): IntegrityAssessment {
  const bytes = candidate.rawBytes;
  const entropy = calculateShannonEntropy(bytes);
  const nullRatio = calculateNullByteRatio(bytes);
  const defects: string[] = [];

  let headerValid = false;
  let footerValid = false;
  let internalStructuresValid = false;
  let expectedEntropyRange = false;

  switch (candidate.fileType) {
    case 'pdf': {
      // PDF: Header %PDF-, trailer %%EOF, xref table
      const headerStr = new TextDecoder('latin1').decode(bytes.subarray(0, 10));
      headerValid = headerStr.startsWith('%PDF-');
      if (!headerValid) defects.push('Missing or damaged %PDF- magic signature.');

      const fullStr = new TextDecoder('latin1').decode(bytes);
      footerValid = fullStr.includes('%%EOF');
      if (!footerValid) defects.push("Missing '%%EOF' trailer marker; stream may be truncated.");

      const hasXref = fullStr.includes('xref') || fullStr.includes('/XRef');
      const hasCatalog = fullStr.includes('/Catalog');
      internalStructuresValid = hasXref && hasCatalog;
      if (!hasXref) defects.push('Cross-reference (xref) table missing or corrupted.');
      if (!hasCatalog) defects.push('PDF Document Catalog root object missing.');

      expectedEntropyRange = entropy >= 5.0 && entropy <= 7.8;
      if (entropy < 4.5) defects.push(`Abnormally low entropy (${entropy.toFixed(2)}) for PDF container.`);
      break;
    }

    case 'jpeg': {
      // JPEG: SOI 0xFF,0xD8; EOI 0xFF,0xD9; SOF marker
      headerValid = bytes[0] === 0xff && bytes[1] === 0xd8;
      if (!headerValid) defects.push('Invalid JPEG Start of Image (SOI) marker.');

      footerValid = candidate.footerFound;
      if (!footerValid) {
        defects.push('Missing End of Image (EOI 0xFF 0xD9) marker; premature termination detected.');
      }

      // Check for zeroed tail sectors
      const tail = bytes.subarray(Math.max(0, bytes.length - 1024));
      const tailNullRatio = calculateNullByteRatio(tail);
      if (tailNullRatio > 0.6) {
        defects.push(`Trailing sectors contain ${(tailNullRatio * 100).toFixed(0)}% zero-padding indicating truncation.`);
      }

      // JPEG compressed scan data is typically high entropy (6.8 - 7.9)
      expectedEntropyRange = entropy >= 6.0;
      internalStructuresValid = headerValid && (bytes[2] === 0xff);
      break;
    }

    case 'docx': {
      // DOCX: ZIP Local header PK\x03\x04; Central Directory PK\x01\x02; EOCD PK\x05\x06
      headerValid = bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
      if (!headerValid) defects.push('ZIP local file header missing.');

      footerValid = candidate.footerFound;
      if (candidate.stitched) {
        defects.push('Non-contiguous storage: Central Directory re-stitched across unallocated cluster gap.');
      } else if (!footerValid) {
        defects.push('End of Central Directory (EOCD PK\\x05\\x06) not found.');
      }

      const textRepresentation = new TextDecoder('latin1').decode(bytes);
      internalStructuresValid =
        textRepresentation.includes('word/document.xml') ||
        textRepresentation.includes('[Content_Types].xml');

      if (!internalStructuresValid) {
        defects.push('Core OpenXML parts ([Content_Types].xml or document.xml) damaged or missing.');
      }

      expectedEntropyRange = entropy >= 4.0 && entropy <= 7.9;
      break;
    }

    case 'sqlite': {
      // SQLite: Header 'SQLite format 3\0'
      const magic = new TextDecoder('latin1').decode(bytes.subarray(0, 16));
      headerValid = magic.startsWith('SQLite format 3\0');
      if (!headerValid) defects.push('Invalid SQLite 3 database header.');

      footerValid = true; // page aligned
      internalStructuresValid = headerValid && bytes.length >= 4096;
      expectedEntropyRange = entropy >= 3.0 && entropy <= 6.5;

      const fullStr = new TextDecoder('latin1').decode(bytes);
      if (fullStr.includes('-- DELETED')) {
        defects.push('Deleted record artifacts located in freelist / unallocated b-tree leaf slots.');
      }
      break;
    }

    case 'txt': {
      // ASCII text in slack space
      headerValid = true;
      footerValid = true;
      internalStructuresValid = true;
      expectedEntropyRange = entropy >= 3.5 && entropy <= 5.8;
      if (nullRatio > 0.4) {
        defects.push(`Slack padding: ${(nullRatio * 100).toFixed(0)}% zero bytes at sector boundary.`);
      }
      break;
    }

    default: {
      headerValid = false;
      footerValid = false;
      internalStructuresValid = false;
      expectedEntropyRange = false;
      defects.push('Unknown or damaged file signature. Stream failed standard MIME parsing.');
      break;
    }
  }

  // Determine overall status
  let status: EvidenceStatus = 'INTACT';
  let integrityFactor = 1.0;

  if (!headerValid || defects.length >= 3) {
    status = 'CORRUPTED';
    integrityFactor = 0.25;
  } else if (defects.length > 0 || !footerValid || candidate.stitched) {
    status = 'PARTIALLY_RECOVERABLE';
    integrityFactor = candidate.stitched ? 0.85 : 0.7;
  } else {
    status = 'INTACT';
    integrityFactor = 1.0;
  }

  return {
    status,
    integrityFactor,
    entropy,
    nullByteRatio: nullRatio,
    defects,
    structuralValidations: {
      headerValid,
      footerValid,
      internalStructuresValid,
      expectedEntropyRange,
    },
  };
}
