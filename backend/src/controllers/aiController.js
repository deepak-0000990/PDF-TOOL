const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { executePythonCommand } = require('../services/pythonBridge');

exports.summarize = async (req, res, next) => {
  try {
    const filePath = req.file ? req.file.path : null;
    const text = req.body.text || '';
    const summaryType = req.body.summaryType || 'comprehensive';

    if (!filePath && !text.trim()) {
      return res.status(400).json({ success: false, error: 'Please provide either a PDF file or text to summarize.' });
    }

    const result = await executePythonCommand('ai_summarize', {
      input: filePath,
      text: text,
      summary_type: summaryType
    });

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error || 'Failed to generate summary.' });
    }

    res.json({
      success: true,
      message: 'AI document summary generated successfully!',
      summary: result
    });
  } catch (err) {
    next(err);
  }
};

exports.translate = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Please upload a PDF document.' });

    const targetLang = req.body.targetLang || 'Spanish';
    const outputFilename = `translated_${uuidv4()}.pdf`;
    const outputPath = path.join(config.TEMP_DIR, outputFilename);

    const result = await executePythonCommand('ai_translate', {
      input: req.file.path,
      output: outputPath,
      target_lang: targetLang
    });

    res.json({
      success: true,
      message: `Document translated to ${targetLang}!`,
      downloadUrl: `/api/jobs/download/${outputFilename}`,
      filename: outputFilename,
      targetLang,
      pages: result.pages,
      size: fs.statSync(outputPath).size
    });
  } catch (err) {
    next(err);
  }
};
