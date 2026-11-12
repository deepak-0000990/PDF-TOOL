const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { executePythonCommand } = require('../services/pythonBridge');
const htmlToPdfService = require('../services/htmlToPdfService');
const { PDFDocument } = require('pdf-lib');

// 1. PDF to Word (DOCX)
exports.pdfToWord = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Please upload a PDF file.' });

    const outputFilename = `document_${uuidv4()}.docx`;
    const outputPath = path.join(config.TEMP_DIR, outputFilename);

    await executePythonCommand('pdf_to_docx', {
      input: req.file.path,
      output: outputPath
    });

    res.json({
      success: true,
      message: 'Converted PDF to editable Word document!',
      downloadUrl: `/api/jobs/download/${outputFilename}`,
      filename: outputFilename,
      size: fs.statSync(outputPath).size
    });
  } catch (err) {
    next(err);
  }
};

// 2. PDF to Excel (XLSX)
exports.pdfToExcel = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Please upload a PDF file.' });

    const outputFilename = `spreadsheet_${uuidv4()}.xlsx`;
    const outputPath = path.join(config.TEMP_DIR, outputFilename);

    const result = await executePythonCommand('pdf_to_xlsx', {
      input: req.file.path,
      output: outputPath
    });

    res.json({
      success: true,
      message: 'Extracted tables to Excel spreadsheet!',
      downloadUrl: `/api/jobs/download/${outputFilename}`,
      filename: outputFilename,
      tablesFound: result.tables_found,
      size: fs.statSync(outputPath).size
    });
  } catch (err) {
    next(err);
  }
};

// 3. PDF to PowerPoint (PPTX)
exports.pdfToPpt = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Please upload a PDF file.' });

    const outputFilename = `presentation_${uuidv4()}.pptx`;
    const outputPath = path.join(config.TEMP_DIR, outputFilename);

    const result = await executePythonCommand('pdf_to_pptx', {
      input: req.file.path,
      output: outputPath
    });

    res.json({
      success: true,
      message: 'Converted PDF pages to presentation slides!',
      downloadUrl: `/api/jobs/download/${outputFilename}`,
      filename: outputFilename,
      slides: result.slides,
      size: fs.statSync(outputPath).size
    });
  } catch (err) {
    next(err);
  }
};

// 4. Word to PDF
exports.wordToPdf = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Please upload a Word document.' });

    const outputFilename = `converted_${uuidv4()}.pdf`;
    const outputPath = path.join(config.TEMP_DIR, outputFilename);

    await executePythonCommand('docx_to_pdf', {
      input: req.file.path,
      output: outputPath
    });

    res.json({
      success: true,
      message: 'Converted Word document to PDF!',
      downloadUrl: `/api/jobs/download/${outputFilename}`,
      filename: outputFilename,
      size: fs.statSync(outputPath).size
    });
  } catch (err) {
    next(err);
  }
};

// 5. PowerPoint to PDF
exports.pptToPdf = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Please upload a PowerPoint document.' });

    const outputFilename = `presentation_${uuidv4()}.pdf`;
    const outputPath = path.join(config.TEMP_DIR, outputFilename);

    await executePythonCommand('pptx_to_pdf', {
      input: req.file.path,
      output: outputPath
    });

    res.json({
      success: true,
      message: 'Converted PowerPoint presentation to PDF!',
      downloadUrl: `/api/jobs/download/${outputFilename}`,
      filename: outputFilename,
      size: fs.statSync(outputPath).size
    });
  } catch (err) {
    next(err);
  }
};

// 6. Excel to PDF
exports.excelToPdf = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Please upload an Excel spreadsheet.' });

    const outputFilename = `spreadsheet_${uuidv4()}.pdf`;
    const outputPath = path.join(config.TEMP_DIR, outputFilename);

    await executePythonCommand('xlsx_to_pdf', {
      input: req.file.path,
      output: outputPath
    });

    res.json({
      success: true,
      message: 'Converted Excel spreadsheet to PDF!',
      downloadUrl: `/api/jobs/download/${outputFilename}`,
      filename: outputFilename,
      size: fs.statSync(outputPath).size
    });
  } catch (err) {
    next(err);
  }
};

// 7. HTML / URL to PDF (Playwright Chromium)
exports.htmlToPdf = async (req, res, next) => {
  try {
    const { url, htmlContent, format, landscape, printBackground, scale } = req.body;

    let result;
    if (url) {
      result = await htmlToPdfService.convertUrlToPdf({
        url,
        format,
        landscape: landscape === 'true' || landscape === true,
        printBackground: printBackground !== 'false' && printBackground !== false,
        scale: parseFloat(scale) || 1.0
      });
    } else if (req.file) {
      // HTML file upload
      const content = fs.readFileSync(req.file.path, 'utf8');
      result = await htmlToPdfService.convertHtmlToPdf({
        htmlContent: content,
        format,
        landscape: landscape === 'true' || landscape === true,
        printBackground: printBackground !== 'false' && printBackground !== false,
        scale: parseFloat(scale) || 1.0
      });
    } else if (htmlContent) {
      result = await htmlToPdfService.convertHtmlToPdf({
        htmlContent,
        format,
        landscape: landscape === 'true' || landscape === true,
        printBackground: printBackground !== 'false' && printBackground !== false,
        scale: parseFloat(scale) || 1.0
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Please provide either a webpage URL, HTML content, or an HTML file.'
      });
    }

    res.json({
      success: true,
      message: 'HTML rendered to PDF successfully!',
      downloadUrl: `/api/jobs/download/${result.filename}`,
      filename: result.filename,
      size: result.size
    });
  } catch (err) {
    next(err);
  }
};

// 8. PDF to JPG
exports.pdfToJpg = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Please upload a PDF file.' });

    const outDirName = `images_${uuidv4()}`;
    const outputDir = path.join(config.TEMP_DIR, outDirName);
    const dpi = parseInt(req.body.dpi, 10) || 150;
    const quality = parseInt(req.body.quality, 10) || 85;

    const result = await executePythonCommand('pdf_to_images', {
      input: req.file.path,
      output_dir: outputDir,
      dpi,
      quality
    });

    if (result.images && result.images.length === 1) {
      // Single page: return image directly
      const singleImg = path.basename(result.images[0]);
      return res.json({
        success: true,
        message: 'PDF page converted to JPG image!',
        downloadUrl: `/api/jobs/download/${outDirName}/${singleImg}`,
        filename: singleImg,
        pageCount: 1
      });
    }

    // Multiple pages: package into ZIP
    const zipFilename = `pdf_images_${uuidv4()}.zip`;
    const zipPath = path.join(config.TEMP_DIR, zipFilename);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);
    archive.directory(outputDir, false);
    await archive.finalize();

    output.on('close', () => {
      res.json({
        success: true,
        message: `Converted ${result.page_count} PDF pages to JPG images!`,
        downloadUrl: `/api/jobs/download/${zipFilename}`,
        filename: zipFilename,
        pageCount: result.page_count
      });
    });
  } catch (err) {
    next(err);
  }
};

// 9. JPG to PDF
exports.jpgToPdf = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, error: 'Please upload at least one image.' });
    }

    const doc = await PDFDocument.create();
    const pageSize = req.body.pageSize || 'A4'; // A4 or Letter
    const margin = parseInt(req.body.margin, 10) || 20;

    for (const file of req.files) {
      const imgBytes = fs.readFileSync(file.path);
      const ext = path.extname(file.originalname).toLowerCase();
      let img;
      if (ext === '.png') {
        img = await doc.embedPng(imgBytes);
      } else {
        img = await doc.embedJpg(imgBytes);
      }

      // Standard A4: 595.28 x 841.89
      const pageWidth = pageSize === 'Letter' ? 612 : 595.28;
      const pageHeight = pageSize === 'Letter' ? 792 : 841.89;

      const page = doc.addPage([pageWidth, pageHeight]);
      const availableW = pageWidth - margin * 2;
      const availableH = pageHeight - margin * 2;

      const scale = Math.min(availableW / img.width, availableH / img.height);
      const w = img.width * scale;
      const h = img.height * scale;

      page.drawImage(img, {
        x: (pageWidth - w) / 2,
        y: (pageHeight - h) / 2,
        width: w,
        height: h
      });
    }

    const outputFilename = `images_combined_${uuidv4()}.pdf`;
    const outputPath = path.join(config.TEMP_DIR, outputFilename);
    const bytes = await doc.save();
    fs.writeFileSync(outputPath, bytes);

    res.json({
      success: true,
      message: `Created PDF from ${req.files.length} images!`,
      downloadUrl: `/api/jobs/download/${outputFilename}`,
      filename: outputFilename,
      pageCount: req.files.length,
      size: bytes.length
    });
  } catch (err) {
    next(err);
  }
};

// 10. PDF to Markdown
exports.pdfToMarkdown = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Please upload a PDF file.' });

    const outputFilename = `document_${uuidv4()}.md`;
    const outputPath = path.join(config.TEMP_DIR, outputFilename);

    await executePythonCommand('pdf_to_markdown', {
      input: req.file.path,
      output: outputPath
    });

    const content = fs.readFileSync(outputPath, 'utf8');

    res.json({
      success: true,
      message: 'PDF converted to Markdown successfully!',
      downloadUrl: `/api/jobs/download/${outputFilename}`,
      filename: outputFilename,
      preview: content.slice(0, 1000), // First 1000 chars preview
      size: fs.statSync(outputPath).size
    });
  } catch (err) {
    next(err);
  }
};

// 11. PDF to PDF/A
exports.pdfToPdfA = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Please upload a PDF file.' });

    const conformance = req.body.conformance || '2b';
    const outputFilename = `archive_${uuidv4()}.pdf`;
    const outputPath = path.join(config.TEMP_DIR, outputFilename);

    const result = await executePythonCommand('pdf_to_pdfa', {
      input: req.file.path,
      output: outputPath,
      conformance
    });

    res.json({
      success: true,
      message: `PDF converted to ${result.conformance} archive format!`,
      downloadUrl: `/api/jobs/download/${outputFilename}`,
      filename: outputFilename,
      conformance: result.conformance,
      size: fs.statSync(outputPath).size
    });
  } catch (err) {
    next(err);
  }
};
