const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { executePythonCommand } = require('../services/pythonBridge');
const { PDFDocument } = require('pdf-lib');

// 1. Compress PDF
exports.compress = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Please upload a PDF file.' });

    const level = req.body.level || 'recommended'; // 'low', 'recommended', 'high'
    const outputFilename = `compressed_${uuidv4()}.pdf`;
    const outputPath = path.join(config.TEMP_DIR, outputFilename);

    const result = await executePythonCommand('compress_pdf', {
      input: req.file.path,
      output: outputPath,
      level
    });

    res.json({
      success: true,
      message: `PDF compressed by ${result.percent_saved}%!`,
      downloadUrl: `/api/jobs/download/${outputFilename}`,
      filename: outputFilename,
      originalSize: result.original_size,
      compressedSize: result.compressed_size,
      savedBytes: result.saved_bytes,
      percentSaved: result.percent_saved
    });
  } catch (err) {
    next(err);
  }
};

// 2. OCR PDF
exports.ocr = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Please upload a PDF document.' });

    const lang = req.body.lang || 'eng';
    const outputFilename = `searchable_ocr_${uuidv4()}.pdf`;
    const outputPath = path.join(config.TEMP_DIR, outputFilename);

    const result = await executePythonCommand('ocr_pdf', {
      input: req.file.path,
      output: outputPath,
      lang
    });

    res.json({
      success: true,
      message: 'OCR processed successfully! Document is now searchable and selectable.',
      downloadUrl: `/api/jobs/download/${outputFilename}`,
      filename: outputFilename,
      pagesOcred: result.pages_ocred,
      size: fs.statSync(outputPath).size
    });
  } catch (err) {
    next(err);
  }
};

// 3. Scan to PDF
exports.scanToPdf = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'Please capture or upload scanned images.' });
    }

    const doc = await PDFDocument.create();
    for (const file of req.files) {
      const imgBytes = fs.readFileSync(file.path);
      const ext = path.extname(file.originalname).toLowerCase();
      let img;
      if (ext === '.png') {
        img = await doc.embedPng(imgBytes);
      } else {
        img = await doc.embedJpg(imgBytes);
      }

      // Standard A4 dimensions
      const page = doc.addPage([595.28, 841.89]);
      const margin = 20;
      const availW = 595.28 - margin * 2;
      const availH = 841.89 - margin * 2;
      const scale = Math.min(availW / img.width, availH / img.height);
      const w = img.width * scale;
      const h = img.height * scale;

      page.drawImage(img, {
        x: (595.28 - w) / 2,
        y: (841.89 - h) / 2,
        width: w,
        height: h
      });
    }

    const outputFilename = `scan_document_${uuidv4()}.pdf`;
    const outputPath = path.join(config.TEMP_DIR, outputFilename);
    const bytes = await doc.save();
    fs.writeFileSync(outputPath, bytes);

    res.json({
      success: true,
      message: `Scanned document created with ${req.files.length} pages!`,
      downloadUrl: `/api/jobs/download/${outputFilename}`,
      filename: outputFilename,
      pages: req.files.length,
      size: bytes.length
    });
  } catch (err) {
    next(err);
  }
};

// 4. Compare PDF
exports.compare = async (req, res, next) => {
  try {
    if (!req.files || req.files.length < 2) {
      return res.status(400).json({ success: false, error: 'Please upload two PDF documents to compare.' });
    }

    const file1 = req.files[0];
    const file2 = req.files[1];

    const result = await executePythonCommand('compare_pdf', {
      input1: file1.path,
      input2: file2.path
    });

    res.json({
      success: true,
      message: result.identical ? 'Both documents are completely identical!' : 'Comparison analysis completed.',
      identical: result.identical,
      doc1Pages: result.doc1_pages,
      doc2Pages: result.doc2_pages,
      totalAddedLines: result.total_added_lines,
      totalRemovedLines: result.total_removed_lines,
      pages: result.pages
    });
  } catch (err) {
    next(err);
  }
};
