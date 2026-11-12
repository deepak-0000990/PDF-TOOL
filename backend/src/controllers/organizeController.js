const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const pdfLibService = require('../services/pdfLibService');

exports.merge = async (req, res, next) => {
  try {
    if (!req.files || req.files.length < 2) {
      return res.status(400).json({ success: false, error: 'Please upload at least 2 PDF files to merge.' });
    }

    // Optional order indices from request body
    let files = req.files;
    if (req.body.order) {
      try {
        const order = JSON.parse(req.body.order);
        files = order.map((idx) => req.files[idx]).filter(Boolean);
      } catch (_) {}
    }

    const filePaths = files.map((f) => f.path);
    const result = await pdfLibService.mergePdfs(filePaths);

    res.json({
      success: true,
      message: 'PDFs merged successfully!',
      downloadUrl: `/api/jobs/download/${result.filename}`,
      filename: result.filename,
      pageCount: result.pageCount,
      size: result.size
    });
  } catch (err) {
    next(err);
  }
};

exports.split = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a PDF file to split.' });
    }

    const mode = req.body.mode || 'all'; // 'all' or 'range'
    const pageRanges = req.body.pageRanges || '';

    const result = await pdfLibService.splitPdf(req.file.path, mode, pageRanges);

    if (result.results.length === 1) {
      // Single output PDF
      const single = result.results[0];
      return res.json({
        success: true,
        message: 'PDF split successfully!',
        downloadUrl: `/api/jobs/download/${single.filename}`,
        filename: single.filename,
        size: single.size,
        totalPages: result.totalPages
      });
    }

    // Multiple PDFs: package into a ZIP archive
    const zipFilename = `split_pages_${uuidv4()}.zip`;
    const zipPath = path.join(config.TEMP_DIR, zipFilename);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);
    for (const item of result.results) {
      archive.file(item.path, { name: item.filename });
    }
    await archive.finalize();

    output.on('close', () => {
      res.json({
        success: true,
        message: `PDF split into ${result.results.length} files.`,
        downloadUrl: `/api/jobs/download/${zipFilename}`,
        filename: zipFilename,
        count: result.results.length,
        totalPages: result.totalPages
      });
    });
  } catch (err) {
    next(err);
  }
};

exports.organize = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a PDF file to organize.' });
    }

    let pageOperations = [];
    if (req.body.pages) {
      pageOperations = typeof req.body.pages === 'string' ? JSON.parse(req.body.pages) : req.body.pages;
    }

    if (!pageOperations.length) {
      return res.status(400).json({ success: false, error: 'No page layout specified.' });
    }

    const result = await pdfLibService.organizePdf(req.file.path, pageOperations);

    res.json({
      success: true,
      message: 'PDF pages organized successfully!',
      downloadUrl: `/api/jobs/download/${result.filename}`,
      filename: result.filename,
      pageCount: result.pageCount,
      size: result.size
    });
  } catch (err) {
    next(err);
  }
};

exports.rotate = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a PDF file to rotate.' });
    }

    const angle = parseInt(req.body.angle, 10) || 90;
    const selectedPages = req.body.pages || 'all';

    const result = await pdfLibService.rotatePdf(req.file.path, angle, selectedPages);

    res.json({
      success: true,
      message: 'PDF rotated successfully!',
      downloadUrl: `/api/jobs/download/${result.filename}`,
      filename: result.filename,
      rotatedPages: result.rotatedPages,
      size: result.size
    });
  } catch (err) {
    next(err);
  }
};

exports.crop = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a PDF file to crop.' });
    }

    let margins = { top: 0, bottom: 0, left: 0, right: 0 };
    if (req.body.margins) {
      margins = typeof req.body.margins === 'string' ? JSON.parse(req.body.margins) : req.body.margins;
    }
    const selectedPages = req.body.pages || 'all';

    const result = await pdfLibService.cropPdf(req.file.path, margins, selectedPages);

    res.json({
      success: true,
      message: 'PDF cropped successfully!',
      downloadUrl: `/api/jobs/download/${result.filename}`,
      filename: result.filename,
      croppedPages: result.croppedPages,
      size: result.size
    });
  } catch (err) {
    next(err);
  }
};
