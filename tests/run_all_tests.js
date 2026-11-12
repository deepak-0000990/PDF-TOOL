const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('../backend/node_modules/pdf-lib');

// Import services directly to unit/integration test their real functionality
const pdfLibService = require('../backend/src/services/pdfLibService');
const htmlToPdfService = require('../backend/src/services/htmlToPdfService');
const { executePythonCommand } = require('../backend/src/services/pythonBridge');

const ASSETS = path.resolve(__dirname, 'assets');
const OUT_DIR = path.resolve(__dirname, 'output');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function runTests() {
  console.log('====================================================');
  console.log(' STARTING FULL PDF TOOLKIT TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`Testing: ${name}... `);
      await fn();
      console.log('PASSED ✓');
      passed++;
    } catch (err) {
      console.log(`FAILED ✗: ${err.message}`);
      failed++;
    }
  }

  // 1. Merge PDF
  await test('Merge PDF (2 files -> 5 pages)', async () => {
    const result = await pdfLibService.mergePdfs([
      path.join(ASSETS, 'sample1.pdf'),
      path.join(ASSETS, 'sample2.pdf')
    ]);
    const doc = await PDFDocument.load(fs.readFileSync(result.path));
    if (doc.getPageCount() !== 5) throw new Error(`Expected 5 pages, got ${doc.getPageCount()}`);
  });

  // 2. Split PDF
  await test('Split PDF (all pages mode)', async () => {
    const result = await pdfLibService.splitPdf(path.join(ASSETS, 'sample1.pdf'), 'all');
    if (result.results.length !== 3) throw new Error(`Expected 3 split pages, got ${result.results.length}`);
  });

  // 3. Rotate PDF
  await test('Rotate PDF (90 degrees)', async () => {
    const result = await pdfLibService.rotatePdf(path.join(ASSETS, 'sample1.pdf'), 90, 'all');
    const doc = await PDFDocument.load(fs.readFileSync(result.path));
    const rot = doc.getPage(0).getRotation().angle;
    if (rot !== 90) throw new Error(`Expected rotation 90, got ${rot}`);
  });

  // 4. Crop PDF
  await test('Crop PDF (apply margins)', async () => {
    const result = await pdfLibService.cropPdf(path.join(ASSETS, 'sample1.pdf'), { top: 20, bottom: 20, left: 20, right: 20 });
    if (!fs.existsSync(result.path) || fs.statSync(result.path).size === 0) {
      throw new Error('Cropped PDF was empty or not generated');
    }
  });

  // 5. Watermark PDF
  await test('Watermark PDF (add CONFIDENTIAL stamp)', async () => {
    const result = await pdfLibService.watermarkPdf(path.join(ASSETS, 'sample1.pdf'), { text: 'SAMPLE WATERMARK' });
    if (!fs.existsSync(result.path) || fs.statSync(result.path).size === 0) {
      throw new Error('Watermarked file not generated');
    }
  });

  // 6. Page Numbers
  await test('Add Page Numbers (footer)', async () => {
    const result = await pdfLibService.addPageNumbers(path.join(ASSETS, 'sample1.pdf'), { format: 'Page {n} of {total}' });
    if (!fs.existsSync(result.path) || fs.statSync(result.path).size === 0) {
      throw new Error('Numbered file not generated');
    }
  });

  // 7. Sign PDF
  await test('Sign PDF (stamp visual signature)', async () => {
    const result = await pdfLibService.signPdf(path.join(ASSETS, 'sample1.pdf'), { signerName: 'John Doe Signature' });
    if (!fs.existsSync(result.path) || fs.statSync(result.path).size === 0) {
      throw new Error('Signed file not generated');
    }
  });

  // 8. HTML to PDF (Playwright Chromium)
  await test('HTML to PDF (Playwright Chromium render)', async () => {
    const result = await htmlToPdfService.convertHtmlToPdf({
      htmlContent: '<html><body><h1>Playwright PDF Render Test</h1><p>Pixel-perfect PDF from Chromium.</p></body></html>'
    });
    const doc = await PDFDocument.load(fs.readFileSync(result.path));
    if (doc.getPageCount() < 1) throw new Error('Rendered PDF has no pages');
  });

  // 9. PDF to Word (Python)
  await test('PDF to Word (.docx extraction)', async () => {
    const out = path.join(OUT_DIR, 'test_output.docx');
    await executePythonCommand('pdf_to_docx', {
      input: path.join(ASSETS, 'sample1.pdf'),
      output: out
    });
    if (!fs.existsSync(out) || fs.statSync(out).size === 0) throw new Error('DOCX not created');
  });

  // 10. PDF to Excel (Python)
  await test('PDF to Excel (.xlsx table extraction)', async () => {
    const out = path.join(OUT_DIR, 'test_output.xlsx');
    await executePythonCommand('pdf_to_xlsx', {
      input: path.join(ASSETS, 'sample1.pdf'),
      output: out
    });
    if (!fs.existsSync(out) || fs.statSync(out).size === 0) throw new Error('XLSX not created');
  });

  // 11. PDF to PowerPoint (Python)
  await test('PDF to PowerPoint (.pptx slide conversion)', async () => {
    const out = path.join(OUT_DIR, 'test_output.pptx');
    await executePythonCommand('pdf_to_pptx', {
      input: path.join(ASSETS, 'sample1.pdf'),
      output: out
    });
    if (!fs.existsSync(out) || fs.statSync(out).size === 0) throw new Error('PPTX not created');
  });

  // 12. Word to PDF (Python)
  await test('Word to PDF (.docx -> .pdf conversion)', async () => {
    const out = path.join(OUT_DIR, 'docx_to_pdf.pdf');
    await executePythonCommand('docx_to_pdf', {
      input: path.join(ASSETS, 'sample.docx'),
      output: out
    });
    if (!fs.existsSync(out) || fs.statSync(out).size === 0) throw new Error('PDF not created');
  });

  // 13. Excel to PDF (Python)
  await test('Excel to PDF (.xlsx -> .pdf table rendering)', async () => {
    const out = path.join(OUT_DIR, 'xlsx_to_pdf.pdf');
    await executePythonCommand('xlsx_to_pdf', {
      input: path.join(ASSETS, 'sample.xlsx'),
      output: out
    });
    if (!fs.existsSync(out) || fs.statSync(out).size === 0) throw new Error('PDF not created');
  });

  // 14. PPT to PDF (Python)
  await test('PowerPoint to PDF (.pptx -> .pdf)', async () => {
    const out = path.join(OUT_DIR, 'pptx_to_pdf.pdf');
    await executePythonCommand('pptx_to_pdf', {
      input: path.join(ASSETS, 'sample.pptx'),
      output: out
    });
    if (!fs.existsSync(out) || fs.statSync(out).size === 0) throw new Error('PDF not created');
  });

  // 15. PDF to Markdown (Python)
  await test('PDF to Markdown (.md structure extraction)', async () => {
    const out = path.join(OUT_DIR, 'sample1.md');
    await executePythonCommand('pdf_to_markdown', {
      input: path.join(ASSETS, 'sample1.pdf'),
      output: out
    });
    const md = fs.readFileSync(out, 'utf8');
    if (!md || md.length === 0) throw new Error('Markdown output was empty');
  });

  // 16. PDF to Images (Python)
  await test('PDF to Images (render JPGs)', async () => {
    const outDir = path.join(OUT_DIR, 'images');
    const result = await executePythonCommand('pdf_to_images', {
      input: path.join(ASSETS, 'sample1.pdf'),
      output_dir: outDir
    });
    if (result.page_count !== 3) throw new Error(`Expected 3 images, got ${result.page_count}`);
  });

  // 17. PDF to PDF/A (Python pikepdf)
  await test('PDF to PDF/A (Archiving standard)', async () => {
    const out = path.join(OUT_DIR, 'archive.pdf');
    await executePythonCommand('pdf_to_pdfa', {
      input: path.join(ASSETS, 'sample1.pdf'),
      output: out,
      conformance: '2b'
    });
    if (!fs.existsSync(out)) throw new Error('PDF/A not created');
  });

  // 18. Redact PDF (Python PyMuPDF)
  await test('Redact PDF (Permanently remove CONFIDENTIAL)', async () => {
    const out = path.join(OUT_DIR, 'redacted.pdf');
    const res = await executePythonCommand('redact_pdf', {
      input: path.join(ASSETS, 'sample1.pdf'),
      output: out,
      keywords: ['CONFIDENTIAL']
    });
    if (res.redactions_applied < 1) throw new Error('No redactions applied');
  });

  // 19. Compress PDF (Python PyMuPDF)
  await test('Compress PDF (Stream optimization)', async () => {
    const out = path.join(OUT_DIR, 'compressed.pdf');
    const res = await executePythonCommand('compress_pdf', {
      input: path.join(ASSETS, 'sample1.pdf'),
      output: out,
      level: 'recommended'
    });
    if (!fs.existsSync(out)) throw new Error('Compressed file not created');
  });

  // 20. Compare PDF (Python)
  await test('Compare PDF (Structural diff)', async () => {
    const res = await executePythonCommand('compare_pdf', {
      input1: path.join(ASSETS, 'sample1.pdf'),
      input2: path.join(ASSETS, 'sample2.pdf')
    });
    if (res.identical !== false) throw new Error('Expected sample1 and sample2 to differ');
  });

  // 21. AI Summarizer (Python)
  await test('AI Summarizer (Executive summary & key points)', async () => {
    const res = await executePythonCommand('ai_summarize', {
      input: path.join(ASSETS, 'sample1.pdf')
    });
    if (!res.executive_summary) throw new Error('Summary missing');
  });

  // 22. AI Translate (Python)
  await test('Translate PDF (Generate translated document)', async () => {
    const out = path.join(OUT_DIR, 'translated.pdf');
    const res = await executePythonCommand('ai_translate', {
      input: path.join(ASSETS, 'sample1.pdf'),
      output: out,
      target_lang: 'Spanish'
    });
    if (!fs.existsSync(out)) throw new Error('Translated PDF not created');
  });

  console.log('\n====================================================');
  console.log(` RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
  process.exit(0);
}

runTests();
