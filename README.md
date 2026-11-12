# Professional Online PDF Toolkit Platform

A full-stack web application providing a complete suite of **32 essential PDF tools** in one unified, modern platform. Every tool is backed by real document processing engines with dedicated REST APIs, security safeguards, and downloadable outputs.

---

## 🛠 Technology Stack

### Frontend
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS v4 with custom responsive design
- **Icons:** Lucide React
- **Routing:** React Router v7
- **HTTP Client:** Axios
- **Form & Input Handling:** React Hook Form & Interactive Canvas Signing
- **Celebration Effects:** Canvas Confetti

### Backend
- **Server:** Node.js & Express.js
- **Architecture:** Modular REST API (Routes, Controllers, Services)
- **File Uploads:** Multer with mime-type checking, file size restrictions, and unique UUID filenames
- **Fast PDF Manipulation:** `pdf-lib` (pure JS, zero native binaries)
- **HTML & Webpage Rendering:** Playwright with Chromium (headless, SSRF-protected, high DPI)
- **Archive Generation:** Archiver (ZIP packaging for batch extractions)

### Python Processing Services
- **PDF Extraction & Manipulation:** PyMuPDF (`fitz`) & `pymupdf4llm`
- **Table Extraction:** `pdfplumber`
- **Office Document Processing:** `python-docx`, `openpyxl`, `python-pptx`
- **PDF Generation & Layout:** `reportlab`
- **PDF/A & Security:** `pikepdf`
- **Image Processing & OCR:** Pillow & `pytesseract`

---

## 📋 Comprehensive Tool Catalog (32 Tools)

### A. Organize PDF Tools
1. **Merge PDF** (`/tools/merge-pdf` | `POST /api/pdf/merge`) - Combine multiple PDFs into one document with custom ordering.
2. **Split PDF** (`/tools/split-pdf` | `POST /api/pdf/split`) - Split every page into individual PDFs or extract custom page ranges (e.g. `1-3, 5`).
3. **Organize PDF** (`/tools/organize-pdf` | `POST /api/pdf/organize`) - Reorder, rotate, and delete selected pages.
4. **Rotate PDF** (`/tools/rotate-pdf` | `POST /api/pdf/rotate`) - Rotate documents 90°, 180°, or 270° clockwise.
5. **Crop PDF** (`/tools/crop-pdf` | `POST /api/pdf/crop`) - Trim margins visually for custom print framing.

### B. PDF Conversion Tools
6. **HTML & Webpage to PDF** (`/tools/html-to-pdf` | `POST /api/convert/html-to-pdf`) - Convert live public URLs, raw HTML code, or HTML files using Playwright Chromium with paper size (A4, A3, Letter), orientation, and SSRF protection.
7. **PDF to Word** (`/tools/pdf-to-word` | `POST /api/convert/pdf-to-word`) - Convert PDF documents into editable `.docx` files with preserved headings, paragraphs, and tables.
8. **PDF to Excel** (`/tools/pdf-to-excel` | `POST /api/convert/pdf-to-excel`) - Extract structured tables from pages into multi-sheet `.xlsx` workbooks.
9. **PDF to PowerPoint** (`/tools/pdf-to-ppt` | `POST /api/convert/pdf-to-ppt`) - Transform PDF pages into presentation slides (`.pptx`).
10. **Word to PDF** (`/tools/word-to-pdf` | `POST /api/convert/word-to-pdf`) - Convert `.docx` files to standard PDF.
11. **PowerPoint to PDF** (`/tools/ppt-to-pdf` | `POST /api/convert/ppt-to-pdf`) - Convert `.pptx` slides to PDF.
12. **Excel to PDF** (`/tools/excel-to-pdf` | `POST /api/convert/excel-to-pdf`) - Convert spreadsheet workbooks into cleanly styled PDF tables.
13. **PDF to JPG** (`/tools/pdf-to-jpg` | `POST /api/convert/pdf-to-jpg`) - Render PDF pages into high-resolution JPG images (individual or ZIP).
14. **JPG to PDF** (`/tools/jpg-to-pdf` | `POST /api/convert/jpg-to-pdf`) - Combine multiple images (JPG, PNG, WebP) into an aligned PDF.
15. **PDF to Markdown** (`/tools/pdf-to-markdown` | `POST /api/convert/pdf-to-markdown`) - Convert documents to Markdown (`.md`) preserving headers, tables, and lists.
16. **PDF to PDF/A** (`/tools/pdf-to-pdfa` | `POST /api/convert/pdf-to-pdfa`) - Standardize documents for long-term archiving (ISO 19005).

### C. PDF Editing & Security Tools
17. **Edit PDF** (`/tools/edit-pdf` | `POST /api/pdf/edit`) - Add text annotations, shapes, and highlight markers.
18. **Sign PDF** (`/tools/sign-pdf` | `POST /api/pdf/sign`) - Interactive HTML5 canvas for drawing signatures, typing names, and stamping onto documents.
19. **Watermark** (`/tools/watermark-pdf` | `POST /api/pdf/watermark`) - Add customizable text or image watermarks with opacity and rotation controls.
20. **Page Numbers** (`/tools/page-numbers` | `POST /api/pdf/page-numbers`) - Insert header or footer page numbers with custom formats (`Page {n} of {total}`).
21. **Protect PDF** (`/tools/protect-pdf` | `POST /api/pdf/protect`) - Encrypt PDFs with standard 256-bit AES opening passwords.
22. **Unlock PDF** (`/tools/unlock-pdf` | `POST /api/pdf/unlock`) - Remove password protection when credentials are provided.
23. **Redact PDF** (`/tools/redact-pdf` | `POST /api/pdf/redact`) - Permanently obliterate underlying sensitive text and vector coordinates (not just visual overlay).
24. **Repair PDF** (`/tools/repair-pdf` | `POST /api/pdf/repair`) - Reconstruct broken xref tables and salvage corrupted documents.
25. **Compare PDF** (`/tools/compare-pdf` | `POST /api/pdf/compare`) - Structural and textual side-by-side diff highlighting added and deleted content.
26. **PDF Forms** (`/tools/pdf-forms` | `POST /api/pdf/forms`) - Interactive form field creation, editing, and flattening.

### D. Document Processing & AI Tools
27. **Compress PDF** (`/tools/compress-pdf` | `POST /api/pdf/compress`) - Reduce file sizes using PyMuPDF stream deflating and image downsampling with savings percentage reporting.
28. **Scan to PDF** (`/tools/scan-to-pdf` | `POST /api/pdf/scan`) - In-browser camera capture stream to snap multiple pages directly into a PDF.
29. **OCR PDF** (`/tools/ocr-pdf` | `POST /api/pdf/ocr`) - Convert scanned image documents into searchable and selectable text.
30. **AI Summarizer** (`/tools/ai-summarizer` | `POST /api/ai/summarize`) - Generate executive summaries, key bullet points, and chapter-by-chapter breakdowns.
31. **Translate PDF** (`/tools/translate-pdf` | `POST /api/ai/translate`) - Translate document contents into Spanish, French, German, and more.

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **Python**: 3.10+ (tested on Python 3.14 with workspace `venv`)

### 2. Running the Backend
From the project root:
```bash
cd backend
npm install
npm start
```
The backend server runs on `http://localhost:5000`.
Health check: `http://localhost:5000/api/health`

### 3. Running the Frontend
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
The Vite frontend runs on `http://localhost:3000`.

---

## 🧪 Testing

The repository includes an automated end-to-end test suite testing real document processing for all tools:
```bash
npm test
```
Or directly:
```bash
$env:NODE_PATH="backend/node_modules"; node tests/run_all_tests.js
```
The test suite validates:
- Real multi-page PDF generation and merging
- Split extraction
- Rotation verification
- Watermarking & numbering
- DOCX, XLSX, PPTX, and Markdown two-way conversions
- Playwright Chromium HTML-to-PDF rendering
- PyMuPDF redaction and compression
- Diff comparison and AI summarization

---

## 🛡️ Security Features
- **SSRF Protection:** `validateSafeUrl` blocks requests to `localhost`, `127.0.0.1`, AWS metadata `169.254.169.254`, and private subnets.
- **True Content Redaction:** Uses PyMuPDF's `page.apply_redactions()` to purge underlying text vectors.
- **In-Memory / Auto-Expiring Storage:** Automated background timer purges files in `temp/` and `uploads/` older than 2 hours.
- **Rate Limiting:** Built-in IP rate limiter prevents abusive request floods.
