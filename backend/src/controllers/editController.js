const pdfLibService = require('../services/pdfLibService');

exports.edit = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Please upload a PDF file to edit.' });

    let annotations = [];
    if (req.body.annotations) {
      annotations = typeof req.body.annotations === 'string' ? JSON.parse(req.body.annotations) : req.body.annotations;
    }

    const result = await pdfLibService.editPdf(req.file.path, annotations);

    res.json({
      success: true,
      message: 'PDF modifications saved successfully!',
      downloadUrl: `/api/jobs/download/${result.filename}`,
      filename: result.filename,
      size: result.size
    });
  } catch (err) {
    next(err);
  }
};

exports.watermark = async (req, res, next) => {
  try {
    if (!req.file && (!req.files || !req.files['pdf'])) {
      return res.status(400).json({ success: false, error: 'Please upload a PDF document.' });
    }

    const pdfFile = req.file || (req.files['pdf'] && req.files['pdf'][0]);
    const watermarkImageFile = req.files && req.files['watermarkImage'] ? req.files['watermarkImage'][0] : null;

    const options = {
      text: req.body.text || 'CONFIDENTIAL',
      fontSize: parseInt(req.body.fontSize, 10) || 48,
      opacity: parseFloat(req.body.opacity) || 0.3,
      rotation: parseInt(req.body.rotation, 10) || -45,
      color: req.body.color || '#ff0000',
      selectedPages: req.body.pages || 'all',
      imagePath: watermarkImageFile ? watermarkImageFile.path : null
    };

    const result = await pdfLibService.watermarkPdf(pdfFile.path, options);

    res.json({
      success: true,
      message: 'Watermark added successfully!',
      downloadUrl: `/api/jobs/download/${result.filename}`,
      filename: result.filename,
      watermarkedPages: result.watermarkedPages,
      size: result.size
    });
  } catch (err) {
    next(err);
  }
};

exports.pageNumbers = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Please upload a PDF document.' });

    const options = {
      position: req.body.position || 'bottom-center',
      fontSize: parseInt(req.body.fontSize, 10) || 11,
      color: req.body.color || '#333333',
      startFromPage: parseInt(req.body.startFromPage, 10) || 1,
      format: req.body.format || 'Page {n} of {total}'
    };

    const result = await pdfLibService.addPageNumbers(req.file.path, options);

    res.json({
      success: true,
      message: 'Page numbers added to PDF successfully!',
      downloadUrl: `/api/jobs/download/${result.filename}`,
      filename: result.filename,
      size: result.size
    });
  } catch (err) {
    next(err);
  }
};

exports.sign = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Please upload a PDF document to sign.' });

    const options = {
      signatureImageBase64: req.body.signatureData,
      pageNumber: parseInt(req.body.page, 10) || 1,
      x: parseFloat(req.body.x) || 100,
      y: parseFloat(req.body.y) || 100,
      width: parseFloat(req.body.width) || 180,
      height: parseFloat(req.body.height) || 60,
      signerName: req.body.signerName || '',
      signDate: req.body.signDate || new Date().toLocaleDateString()
    };

    const result = await pdfLibService.signPdf(req.file.path, options);

    res.json({
      success: true,
      message: 'Signature applied to PDF document!',
      downloadUrl: `/api/jobs/download/${result.filename}`,
      filename: result.filename,
      pageSigned: result.pageSigned,
      size: result.size
    });
  } catch (err) {
    next(err);
  }
};

exports.forms = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'Please upload a PDF document.' });

    let fields = [];
    if (req.body.fields) {
      fields = typeof req.body.fields === 'string' ? JSON.parse(req.body.fields) : req.body.fields;
    }
    const flatten = req.body.flatten === 'true' || req.body.flatten === true;

    const result = await pdfLibService.handlePdfForms(req.file.path, fields, flatten);

    res.json({
      success: true,
      message: 'Form fields processed successfully!',
      downloadUrl: `/api/jobs/download/${result.filename}`,
      filename: result.filename,
      fieldsProcessed: result.fieldsProcessed,
      flattened: result.flattened,
      size: result.size
    });
  } catch (err) {
    next(err);
  }
};
