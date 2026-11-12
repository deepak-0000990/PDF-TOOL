const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { executePythonCommand } = require('../services/pythonBridge');
const pikepdf = require('child_process');

exports.protect = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Please upload a PDF document.' });
    const password = req.body.password;
    if (!password) return res.status(400).json({ success: false, error: 'Password is required to protect the PDF.' });

    const outputFilename = `protected_${uuidv4()}.pdf`;
    const outputPath = path.join(config.TEMP_DIR, outputFilename);

    // Use Python pikepdf for strong standard 256-bit AES encryption
    await executePythonCommand('compress_pdf', {
      input: req.file.path,
      output: outputPath
    });

    // Encrypt using Python inline script with pikepdf
    const encryptScript = `
import pikepdf, sys
with pikepdf.open(sys.argv[1]) as pdf:
    enc = pikepdf.Encryption(owner=sys.argv[3], user=sys.argv[3], R=6)
    pdf.save(sys.argv[2], encryption=enc)
`;
    const { spawnSync } = require('child_process');
    const proc = spawnSync(config.PYTHON_PATH, ['-c', encryptScript, req.file.path, outputPath, password]);
    if (proc.status !== 0) {
      throw new Error(proc.stderr.toString() || 'Failed to encrypt PDF.');
    }

    res.json({
      success: true,
      message: 'PDF protected with password encryption successfully!',
      downloadUrl: `/api/jobs/download/${outputFilename}`,
      filename: outputFilename,
      size: fs.statSync(outputPath).size
    });
  } catch (err) {
    next(err);
  }
};

exports.unlock = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Please upload a PDF document.' });
    const password = req.body.password || '';

    const outputFilename = `unlocked_${uuidv4()}.pdf`;
    const outputPath = path.join(config.TEMP_DIR, outputFilename);

    const unlockScript = `
import pikepdf, sys
try:
    with pikepdf.open(sys.argv[1], password=sys.argv[3]) as pdf:
        pdf.save(sys.argv[2])
    print("SUCCESS")
except pikepdf.PasswordError:
    print("INVALID_PASSWORD")
    sys.exit(2)
except Exception as e:
    print(str(e))
    sys.exit(1)
`;
    const { spawnSync } = require('child_process');
    const proc = spawnSync(config.PYTHON_PATH, ['-c', unlockScript, req.file.path, outputPath, password]);
    
    if (proc.status === 2) {
      return res.status(401).json({ success: false, error: 'Incorrect password provided.' });
    }
    if (proc.status !== 0) {
      return res.status(400).json({ success: false, error: proc.stdout.toString() || proc.stderr.toString() || 'Failed to unlock PDF.' });
    }

    res.json({
      success: true,
      message: 'Password security removed successfully!',
      downloadUrl: `/api/jobs/download/${outputFilename}`,
      filename: outputFilename,
      size: fs.statSync(outputPath).size
    });
  } catch (err) {
    next(err);
  }
};

exports.redact = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Please upload a PDF document.' });

    let keywords = [];
    if (req.body.keywords) {
      keywords = typeof req.body.keywords === 'string' ? req.body.keywords.split(',').map((k) => k.trim()) : req.body.keywords;
    }
    let rectangles = [];
    if (req.body.rectangles) {
      rectangles = typeof req.body.rectangles === 'string' ? JSON.parse(req.body.rectangles) : req.body.rectangles;
    }

    if (keywords.length === 0 && rectangles.length === 0) {
      return res.status(400).json({ success: false, error: 'Please specify search keywords or region coordinates to redact.' });
    }

    const outputFilename = `redacted_${uuidv4()}.pdf`;
    const outputPath = path.join(config.TEMP_DIR, outputFilename);

    const result = await executePythonCommand('redact_pdf', {
      input: req.file.path,
      output: outputPath,
      keywords,
      rectangles
    });

    res.json({
      success: true,
      message: `Permanently redacted ${result.redactions_applied} instances of sensitive content.`,
      downloadUrl: `/api/jobs/download/${outputFilename}`,
      filename: outputFilename,
      redactionsApplied: result.redactions_applied,
      size: fs.statSync(outputPath).size
    });
  } catch (err) {
    next(err);
  }
};

exports.repair = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Please upload a corrupted or damaged PDF.' });

    const outputFilename = `repaired_${uuidv4()}.pdf`;
    const outputPath = path.join(config.TEMP_DIR, outputFilename);

    const result = await executePythonCommand('repair_pdf', {
      input: req.file.path,
      output: outputPath
    });

    if (!result.success) {
      return res.status(422).json({ success: false, error: result.error || 'The file is too heavily damaged to salvage.' });
    }

    res.json({
      success: true,
      message: `PDF repaired using ${result.method}!`,
      downloadUrl: `/api/jobs/download/${outputFilename}`,
      filename: outputFilename,
      method: result.method,
      size: fs.statSync(outputPath).size
    });
  } catch (err) {
    next(err);
  }
};
