const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload.middleware');
const conversionCtrl = require('../controllers/conversionController');

router.post('/pdf-to-word', upload.single('file'), conversionCtrl.pdfToWord);
router.post('/pdf-to-excel', upload.single('file'), conversionCtrl.pdfToExcel);
router.post('/pdf-to-ppt', upload.single('file'), conversionCtrl.pdfToPpt);
router.post('/word-to-pdf', upload.single('file'), conversionCtrl.wordToPdf);
router.post('/ppt-to-pdf', upload.single('file'), conversionCtrl.pptToPdf);
router.post('/excel-to-pdf', upload.single('file'), conversionCtrl.excelToPdf);
router.post('/html-to-pdf', upload.single('file'), conversionCtrl.htmlToPdf);
router.post('/pdf-to-jpg', upload.single('file'), conversionCtrl.pdfToJpg);
router.post('/jpg-to-pdf', upload.array('files', 50), conversionCtrl.jpgToPdf);
router.post('/pdf-to-markdown', upload.single('file'), conversionCtrl.pdfToMarkdown);
router.post('/pdf-to-pdfa', upload.single('file'), conversionCtrl.pdfToPdfA);

module.exports = router;
