# TraceWeaver-AI (AegisCarve)

> **AI-Assisted Digital Evidence Recovery, Anti-Forensics Analysis, and Incident Reconstruction**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8.svg)](https://tailwindcss.com/)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![DFIR Compliant](https://img.shields.io/badge/Forensics-SHA--256%20Verified-emerald.svg)](#chain-of-custody--integrity)

---

## 📖 Overview

**TraceWeaver-AI** is an advanced Digital Forensics and Incident Response (DFIR) platform that bridges low-level physical sector carving with machine intelligence. Traditional file carvers (*PhotoRec, Scalpel, Foremost*) rely strictly on finding contiguous start-of-file (header) and end-of-file (footer) magic byte signatures. Consequently, they fail when faced with:
- **Flash Storage Wear-Leveling:** SSDs scatter clusters non-contiguously across physical storage blocks.
- **Deliberate Anti-Forensics:** Attackers truncate file trailers (e.g. stripping JPEG `FF D9` EOI markers), purge SQLite database records into unallocated freelists, or execute zero-wiping scripts across slack space.
- **The Translation Bottleneck:** Junior analysts and non-technical stakeholders (legal counsel, HR, C-suite) cannot interpret raw hex dumps or sector maps, creating an investigative bottleneck.

TraceWeaver-AI solves these challenges by combining **bi-directional fragment stitching**, **sliding-window Shannon entropy analysis ($0.000$ to $8.000$)**, **hardware-accelerated cryptographic hashing (SHA-256 / MD5)**, and an **LLM-driven forensic narrative layer** that converts raw sector defects into an actionable 5-phase incident timeline.

---

## 🚀 Key Features

- **Bi-Directional Fragment Stitching:** Reconnects fragmented Office OpenXML / ZIP files separated by unallocated zero gaps (bridging non-contiguous clusters).
- **Multi-Factor Integrity Assessment:** Combines Shannon entropy, null-byte ratios, and format-specific structural validation to distinguish between zero-wiping routines, plaintext, and encrypted/compressed streams.
- **SQLite Freelist Carving:** Recovers "permanently deleted" database rows preserved in unallocated B-Tree leaf pages invisible to standard database viewers.
- **Partial Canvas Reconstruction:** Renders truncated images (e.g. missing JPEG `FF D9` footer) up to the exact point of data destruction with visual wipe indicators.
- **Interactive 256-Sector Physical Map:** Visual block allocation grid color-coding intact, damaged, stitched, and unallocated slack sectors with instant LBA lookup.
- **Deep Hex & Entropy Inspector:** Real-time dual-pane hex/ASCII viewer with byte-level offset navigation, 1-byte, 2-byte, 4-byte integer decoding, and binary bit visualization.
- **Cryptographic Chain of Custody:** Calculates client-side SHA-256 and MD5 hashes for the master disk and each carved fragment using the Web Cryptography API (`crypto.subtle`).
- **Resilient Dual-Mode AI Reasoning:** Connects to Gemini Flash for incident timeline generation with an automatic fallback to local rule-based deterministic heuristics for air-gapped forensic labs.
- **Court-Ready DFIR Reports:** One-click export to Markdown (`.md`) and CSV evidence logs formatted for legal discovery.
- **Native Python Scripts:** Includes downloadable, standalone Python 3 scripts (`carving.py`, `integrity.py`, `prioritize.py`, `timeline.py`, `synthetic_disk.py`) runnable in Linux DFIR environments (SANS SIFT, CAINE, Kali).

---

## 🔬 The 4-Pillar Pipeline

```
[ Raw Storage Image (.dd) ]
             │
             ▼
┌──────────────────────────────────────────────┐
│  Objective 01: Intelligent Fragment Carving  │
│  - Linear header scan & slack space boundary │
│  - Bi-directional ZIP central directory link │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  Objective 02: Multi-Factor Integrity Score  │
│  - Sliding-window Shannon Entropy (0 - 8)    │
│  - Null-byte ratio & format validation       │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  Objective 03: Triage & Chain of Custody     │
│  - Real-time SHA-256 & MD5 hash generation   │
│  - Priority classification (Critical - Info) │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│  Objective 04: Plain-English AI Timeline     │
│  - Baseline -> Exfil -> Tamper -> Anti-Wipe  │
│  - Dual-mode: Gemini Flash + Local Fallback  │
└──────────────────────────────────────────────┘
```

---

## 🧪 Built-In Case Study: "Operation IronVault"

TraceWeaver-AI includes an in-memory, synthetic 128 KB raw disk image (256 physical sectors $\times$ 512 bytes) modeling a corporate insider fraud investigation involving an unauthorized **$4,250,000 wire transfer**:

| Artifact | Sector Range | Status | Forensic Challenge & Damage |
| :--- | :--- | :--- | :--- |
| `financial_report.pdf` | Sectors 10–28 | **INTACT** | Contiguous allocation; valid `%PDF-1.7` header and `%%EOF` marker; verifies wire disbursements. |
| `photo1.jpg` | Sectors 35–55 | **PARTIAL** | Suspect meeting photo. Trailing 3 sectors zeroed out (missing `FF D9` EOI). Top 72% scanlines rendered via canvas. |
| `case_notes.docx` | Sectors 65–74 & 90–102 | **STITCHED** | Split across a **15-sector zeroed gap** (Sectors 75–89). Local ZIP header reconnected with Central Directory. |
| `logs.db` | Sectors 115–132 | **PARTIAL** | SQLite audit database. Incriminating access records purged via `DELETE`; carved from unallocated B-Tree freelist. |
| `readme_evidence.txt` | Sectors 145–148 | **INTACT** | Smoking gun plaintext wipe memo recovered from unallocated slack space. |
| `corrupt_backup.tar.gz`| Sectors 160–172 | **CORRUPT** | GZIP magic header present, but DEFLATE stream overwritten with random noise (proves deliberate spoliation). |

---

## 🛠️ Workbench Modules

The platform provides a **7-Tab Forensic Workbench**:

1. **Executive Overview:** High-level recovery metrics, integrity score breakdown, and rapid triage shortcuts.
2. **Forensic Timeline:** Interactive chronological 5-phase incident reconstruction with severity badges and tactical IR recommendations.
3. **Recovered Artifacts:** Searchable evidence inventory (with `Cmd+K` / `Ctrl+K`), status badges, and direct preview triggers.
4. **Interactive Sector Map:** 256-block physical grid with color-coded cluster states (🟩 Intact, 🟧 Damaged, 🟦 Stitched, ⬜ Slack).
5. **Hex & Entropy Inspector:** Byte-level offset inspector with 8/16/32-bit integer decoding, binary representation, and Shannon entropy meters.
6. **AI Forensic Advisor:** Interactive DFIR copilot with preset investigative prompts and contextual evidence assessment.
7. **DFIR Report Generator:** Court-ready exportable reports in Markdown and CSV formats.

---

## 💻 Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide-React
- **Backend / Server:** Express.js (`tsx server.ts`), Vite Dev Server Middleware
- **AI / LLM Integration:** Google GenAI SDK (`@google/genai`) with Gemini 3.8 Flash
- **Cryptography:** Hardware-accelerated Web Cryptography API (`window.crypto.subtle`)

---

## ⚙️ Getting Started

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** or **bun**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/traceweaver-ai.git
   cd traceweaver-ai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables (Optional):**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   *Note: If `GEMINI_API_KEY` is not provided, TraceWeaver-AI automatically activates its deterministic local heuristic engine, enabling full functionality offline.*

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   The application will be running at `http://localhost:3000`.

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs the full-stack development server with Vite middleware on port 3000. |
| `npm run build` | Compiles and builds the production bundle into `/dist`. |
| `npm run start` | Starts the production server via `tsx server.ts`. |
| `npm run preview`| Previews the production build locally. |
| `npm run lint` | Runs TypeScript compiler checks (`tsc --noEmit`) to validate types. |
| `npm run clean` | Removes the `/dist` build output folder. |

---

## 🔒 Chain of Custody & Integrity

In accordance with **NIST SP 800-86** (*Guide to Integrating Forensic Techniques into Incident Response*), TraceWeaver-AI strictly adheres to forensic non-destructiveness:
- Raw disk images are treated as read-only bitstreams.
- Cryptographic SHA-256 hashes are computed client-side before any carving or stitching.
- The AI reasoning layer functions strictly on extracted metadata and cannot alter original evidence bytes.

---

## 📄 License

This project is licensed under the **Apache-2.0 License** - see the [LICENSE](LICENSE) file for details.
