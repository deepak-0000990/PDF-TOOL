const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const config = require('../config');

// Safe file download
router.get('/download/:filename', (req, res) => {
  const safeFilename = path.basename(req.params.filename);
  const filePath = path.join(config.TEMP_DIR, safeFilename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: 'Requested download file not found or expired.' });
  }

  res.download(filePath, safeFilename);
});

// Safe subfolder download (for extracted image directories)
router.get('/download/:subDir/:filename', (req, res) => {
  const safeSubDir = path.basename(req.params.subDir);
  const safeFilename = path.basename(req.params.filename);
  const filePath = path.join(config.TEMP_DIR, safeSubDir, safeFilename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: 'File not found.' });
  }

  res.download(filePath, safeFilename);
});

// Inline preview (for PDFs & images in browser)
router.get('/preview/:filename', (req, res) => {
  const safeFilename = path.basename(req.params.filename);
  const filePath = path.join(config.TEMP_DIR, safeFilename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, error: 'File not found.' });
  }

  const ext = path.extname(safeFilename).toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.md': 'text/markdown',
    '.txt': 'text/plain'
  };

  res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
  res.setHeader('Content-Disposition', `inline; filename="${safeFilename}"`);
  fs.createReadStream(filePath).pipe(res);
});

module.exports = router;
