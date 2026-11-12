const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload.middleware');

const organizeCtrl = require('../controllers/organizeController');
const editCtrl = require('../controllers/editController');
const securityCtrl = require('../controllers/securityController');
const processingCtrl = require('../controllers/processingController');

// Organize
router.post('/merge', upload.array('files', 20), organizeCtrl.merge);
router.post('/split', upload.single('file'), organizeCtrl.split);
router.post('/organize', upload.single('file'), organizeCtrl.organize);
router.post('/rotate', upload.single('file'), organizeCtrl.rotate);
router.post('/crop', upload.single('file'), organizeCtrl.crop);

// Edit
router.post('/edit', upload.single('file'), editCtrl.edit);
router.post('/watermark', upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'pdf', maxCount: 1 },
  { name: 'watermarkImage', maxCount: 1 }
]), editCtrl.watermark);
router.post('/page-numbers', upload.single('file'), editCtrl.pageNumbers);
router.post('/sign', upload.single('file'), editCtrl.sign);
router.post('/forms', upload.single('file'), editCtrl.forms);

// Security
router.post('/protect', upload.single('file'), securityCtrl.protect);
router.post('/unlock', upload.single('file'), securityCtrl.unlock);
router.post('/repair', upload.single('file'), securityCtrl.repair);
router.post('/redact', upload.single('file'), securityCtrl.redact);

// Processing
router.post('/compress', upload.single('file'), processingCtrl.compress);
router.post('/ocr', upload.single('file'), processingCtrl.ocr);
router.post('/scan', upload.array('files', 30), processingCtrl.scanToPdf);
router.post('/compare', upload.array('files', 2), processingCtrl.compare);

module.exports = router;
