const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload.middleware');
const aiCtrl = require('../controllers/aiController');

router.post('/summarize', upload.single('file'), aiCtrl.summarize);
router.post('/translate', upload.single('file'), aiCtrl.translate);

module.exports = router;
