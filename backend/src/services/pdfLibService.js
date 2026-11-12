const { PDFDocument, rgb, degrees, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

// 1. Merge PDFs
async function mergePdfs(pdfPaths) {
  const mergedPdf = await PDFDocument.create();

  for (const filePath of pdfPaths) {
    const pdfBytes = fs.readFileSync(filePath);
    const pdf = await PDFDocument.load(pdfBytes);
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const outputFilename = `merged_${uuidv4()}.pdf`;
  const outputPath = path.join(config.TEMP_DIR, outputFilename);
  const pdfBytes = await mergedPdf.save();
  fs.writeFileSync(outputPath, pdfBytes);

  return {
    filename: outputFilename,
    path: outputPath,
    pageCount: mergedPdf.getPageCount(),
    size: pdfBytes.length
  };
}

// 2. Split PDF
async function splitPdf(pdfPath, mode = 'all', pageRanges = '') {
  const pdfBytes = fs.readFileSync(pdfPath);
  const srcDoc = await PDFDocument.load(pdfBytes);
  const totalPages = srcDoc.getPageCount();

  const results = [];

  if (mode === 'all') {
    // Each page becomes a separate PDF
    for (let i = 0; i < totalPages; i++) {
      const newDoc = await PDFDocument.create();
      const [copiedPage] = await newDoc.copyPages(srcDoc, [i]);
      newDoc.addPage(copiedPage);

      const filename = `page_${i + 1}_${uuidv4().slice(0, 8)}.pdf`;
      const outPath = path.join(config.TEMP_DIR, filename);
      const bytes = await newDoc.save();
      fs.writeFileSync(outPath, bytes);

      results.push({ page: i + 1, filename, path: outPath, size: bytes.length });
    }
  } else {
    // Custom ranges (e.g. "1-3, 5, 7-9")
    const pageIndices = parsePageRanges(pageRanges, totalPages);
    if (pageIndices.length === 0) {
      throw new Error('No valid pages found in selected range.');
    }

    const newDoc = await PDFDocument.create();
    const copiedPages = await newDoc.copyPages(srcDoc, pageIndices);
    copiedPages.forEach((p) => newDoc.addPage(p));

    const filename = `split_extracted_${uuidv4()}.pdf`;
    const outPath = path.join(config.TEMP_DIR, filename);
    const bytes = await newDoc.save();
    fs.writeFileSync(outPath, bytes);

    results.push({
      pages: pageIndices.map((i) => i + 1),
      filename,
      path: outPath,
      size: bytes.length
    });
  }

  return {
    totalPages,
    results
  };
}

// 3. Organize PDF (reorder, delete, rotate individual pages)
async function organizePdf(pdfPath, pageOperations) {
  // pageOperations: array of { originalIndex: 0, rotation: 90 }
  const pdfBytes = fs.readFileSync(pdfPath);
  const srcDoc = await PDFDocument.load(pdfBytes);
  const newDoc = await PDFDocument.create();

  for (const op of pageOperations) {
    if (op.originalIndex >= 0 && op.originalIndex < srcDoc.getPageCount()) {
      const [copiedPage] = await newDoc.copyPages(srcDoc, [op.originalIndex]);
      if (op.rotation) {
        const currentRot = copiedPage.getRotation().angle;
        copiedPage.setRotation(degrees((currentRot + op.rotation) % 360));
      }
      newDoc.addPage(copiedPage);
    }
  }

  const outputFilename = `organized_${uuidv4()}.pdf`;
  const outputPath = path.join(config.TEMP_DIR, outputFilename);
  const bytes = await newDoc.save();
  fs.writeFileSync(outputPath, bytes);

  return {
    filename: outputFilename,
    path: outputPath,
    pageCount: newDoc.getPageCount(),
    size: bytes.length
  };
}

// 4. Rotate PDF
async function rotatePdf(pdfPath, angle = 90, selectedPages = 'all') {
  const pdfBytes = fs.readFileSync(pdfPath);
  const doc = await PDFDocument.load(pdfBytes);
  const totalPages = doc.getPageCount();

  const pagesToRotate =
    selectedPages === 'all'
      ? doc.getPageIndices()
      : parsePageRanges(selectedPages, totalPages);

  for (const idx of pagesToRotate) {
    const page = doc.getPage(idx);
    const currentRot = page.getRotation().angle;
    page.setRotation(degrees((currentRot + Number(angle)) % 360));
  }

  const outputFilename = `rotated_${uuidv4()}.pdf`;
  const outputPath = path.join(config.TEMP_DIR, outputFilename);
  const bytes = await doc.save();
  fs.writeFileSync(outputPath, bytes);

  return {
    filename: outputFilename,
    path: outputPath,
    rotatedPages: pagesToRotate.length,
    size: bytes.length
  };
}

// 5. Crop PDF
async function cropPdf(pdfPath, margins = { top: 0, bottom: 0, left: 0, right: 0 }, selectedPages = 'all') {
  const pdfBytes = fs.readFileSync(pdfPath);
  const doc = await PDFDocument.load(pdfBytes);
  const totalPages = doc.getPageCount();

  const targetPages =
    selectedPages === 'all'
      ? doc.getPageIndices()
      : parsePageRanges(selectedPages, totalPages);

  for (const idx of targetPages) {
    const page = doc.getPage(idx);
    const { width, height } = page.getSize();
    const newX = margins.left || 0;
    const newY = margins.bottom || 0;
    const newWidth = Math.max(50, width - (margins.left || 0) - (margins.right || 0));
    const newHeight = Math.max(50, height - (margins.top || 0) - (margins.bottom || 0));

    page.setCropBox(newX, newY, newWidth, newHeight);
  }

  const outputFilename = `cropped_${uuidv4()}.pdf`;
  const outputPath = path.join(config.TEMP_DIR, outputFilename);
  const bytes = await doc.save();
  fs.writeFileSync(outputPath, bytes);

  return {
    filename: outputFilename,
    path: outputPath,
    croppedPages: targetPages.length,
    size: bytes.length
  };
}

// 6. Watermark
async function watermarkPdf(pdfPath, options = {}) {
  const {
    text = 'CONFIDENTIAL',
    fontSize = 48,
    opacity = 0.3,
    rotation = -45,
    color = '#ff0000',
    selectedPages = 'all',
    imagePath = null
  } = options;

  const pdfBytes = fs.readFileSync(pdfPath);
  const doc = await PDFDocument.load(pdfBytes);
  const totalPages = doc.getPageCount();
  const font = await doc.embedFont(StandardFonts.HelveticaBold);

  const rgbColor = hexToRgb(color);
  const targetPages =
    selectedPages === 'all'
      ? doc.getPageIndices()
      : parsePageRanges(selectedPages, totalPages);

  let embeddedImage = null;
  if (imagePath && fs.existsSync(imagePath)) {
    const imgBytes = fs.readFileSync(imagePath);
    const ext = path.extname(imagePath).toLowerCase();
    if (ext === '.png') {
      embeddedImage = await doc.embedPng(imgBytes);
    } else {
      embeddedImage = await doc.embedJpg(imgBytes);
    }
  }

  for (const idx of targetPages) {
    const page = doc.getPage(idx);
    const { width, height } = page.getSize();

    if (embeddedImage) {
      const imgScale = Math.min((width * 0.4) / embeddedImage.width, (height * 0.4) / embeddedImage.height);
      const imgW = embeddedImage.width * imgScale;
      const imgH = embeddedImage.height * imgScale;
      page.drawImage(embeddedImage, {
        x: (width - imgW) / 2,
        y: (height - imgH) / 2,
        width: imgW,
        height: imgH,
        opacity: Number(opacity) || 0.3,
        rotate: degrees(Number(rotation) || 0)
      });
    } else {
      const textWidth = font.widthOfTextAtSize(text, Number(fontSize) || 48);
      const textHeight = font.heightAtSize(Number(fontSize) || 48);
      page.drawText(text, {
        x: (width - textWidth) / 2,
        y: (height - textHeight) / 2,
        size: Number(fontSize) || 48,
        font,
        color: rgb(rgbColor.r, rgbColor.g, rgbColor.b),
        opacity: Number(opacity) || 0.3,
        rotate: degrees(Number(rotation) || -45)
      });
    }
  }

  const outputFilename = `watermarked_${uuidv4()}.pdf`;
  const outputPath = path.join(config.TEMP_DIR, outputFilename);
  const bytes = await doc.save();
  fs.writeFileSync(outputPath, bytes);

  return {
    filename: outputFilename,
    path: outputPath,
    watermarkedPages: targetPages.length,
    size: bytes.length
  };
}

// 7. Page Numbers
async function addPageNumbers(pdfPath, options = {}) {
  const {
    position = 'bottom-center', // top-left, top-center, top-right, bottom-left, bottom-center, bottom-right
    fontSize = 11,
    color = '#333333',
    startFromPage = 1,
    format = 'Page {n} of {total}' // or '{n}'
  } = options;

  const pdfBytes = fs.readFileSync(pdfPath);
  const doc = await PDFDocument.load(pdfBytes);
  const totalPages = doc.getPageCount();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const rgbColor = hexToRgb(color);

  for (let i = 0; i < totalPages; i++) {
    if (i + 1 < Number(startFromPage)) continue;

    const pageNum = i + 1;
    const page = doc.getPage(i);
    const { width, height } = page.getSize();

    const label = format
      .replace('{n}', pageNum)
      .replace('{total}', totalPages);

    const textWidth = font.widthOfTextAtSize(label, Number(fontSize));
    let x = (width - textWidth) / 2;
    let y = 30;

    if (position.includes('left')) x = 40;
    if (position.includes('right')) x = width - textWidth - 40;
    if (position.includes('top')) y = height - 40;

    page.drawText(label, {
      x,
      y,
      size: Number(fontSize),
      font,
      color: rgb(rgbColor.r, rgbColor.g, rgbColor.b)
    });
  }

  const outputFilename = `numbered_${uuidv4()}.pdf`;
  const outputPath = path.join(config.TEMP_DIR, outputFilename);
  const bytes = await doc.save();
  fs.writeFileSync(outputPath, bytes);

  return {
    filename: outputFilename,
    path: outputPath,
    size: bytes.length
  };
}

// 8. Sign PDF (Visual signature stamping with date/name)
async function signPdf(pdfPath, options = {}) {
  const {
    signatureImageBase64 = null, // base64 dataURL or path
    pageNumber = 1,
    x = 100,
    y = 100,
    width = 180,
    height = 60,
    signerName = '',
    signDate = new Date().toLocaleDateString()
  } = options;

  const pdfBytes = fs.readFileSync(pdfPath);
  const doc = await PDFDocument.load(pdfBytes);
  const pageIndex = Math.max(0, Math.min(doc.getPageCount() - 1, Number(pageNumber) - 1));
  const page = doc.getPage(pageIndex);
  const font = await doc.embedFont(StandardFonts.Helvetica);

  if (signatureImageBase64) {
    let cleanBase64 = signatureImageBase64;
    let isPng = true;
    if (signatureImageBase64.includes(',')) {
      isPng = signatureImageBase64.startsWith('data:image/png');
      cleanBase64 = signatureImageBase64.split(',')[1];
    }
    const imgBuffer = Buffer.from(cleanBase64, 'base64');
    const embeddedImg = isPng ? await doc.embedPng(imgBuffer) : await doc.embedJpg(imgBuffer);

    page.drawImage(embeddedImg, {
      x: Number(x) || 100,
      y: Number(y) || 100,
      width: Number(width) || 180,
      height: Number(height) || 60
    });
  }

  if (signerName) {
    page.drawText(`Digitally signed by: ${signerName}\nDate: ${signDate}`, {
      x: Number(x) || 100,
      y: Math.max(10, (Number(y) || 100) - 20),
      size: 9,
      font,
      color: rgb(0.2, 0.2, 0.2)
    });
  }

  const outputFilename = `signed_${uuidv4()}.pdf`;
  const outputPath = path.join(config.TEMP_DIR, outputFilename);
  const bytes = await doc.save();
  fs.writeFileSync(outputPath, bytes);

  return {
    filename: outputFilename,
    path: outputPath,
    pageSigned: pageIndex + 1,
    size: bytes.length
  };
}

// 9. PDF Forms
async function handlePdfForms(pdfPath, fields = [], flatten = false) {
  const pdfBytes = fs.readFileSync(pdfPath);
  const doc = await PDFDocument.load(pdfBytes);
  const form = doc.getForm();

  for (const f of fields) {
    try {
      const existingField = form.getFieldMaybe(f.name);
      if (existingField) {
        if (f.type === 'text' || f.type === 'textfield') {
          form.getTextField(f.name).setText(String(f.value || ''));
        } else if (f.type === 'checkbox') {
          if (f.value) form.getCheckBox(f.name).check();
          else form.getCheckBox(f.name).uncheck();
        } else if (f.type === 'dropdown') {
          form.getDropdown(f.name).select(String(f.value));
        }
      } else {
        // Create new field on target page
        const pageIdx = Math.max(0, Math.min(doc.getPageCount() - 1, (f.page || 1) - 1));
        const page = doc.getPage(pageIdx);
        if (f.type === 'textfield' || f.type === 'text') {
          const tf = form.createTextField(f.name);
          tf.setText(String(f.value || ''));
          tf.addToPage(page, {
            x: f.x || 100,
            y: f.y || 400,
            width: f.width || 200,
            height: f.height || 28
          });
        } else if (f.type === 'checkbox') {
          const cb = form.createCheckBox(f.name);
          if (f.value) cb.check();
          cb.addToPage(page, {
            x: f.x || 100,
            y: f.y || 400,
            width: f.width || 20,
            height: f.height || 20
          });
        }
      }
    } catch (_) {}
  }

  if (flatten) {
    form.flatten();
  }

  const outputFilename = `form_completed_${uuidv4()}.pdf`;
  const outputPath = path.join(config.TEMP_DIR, outputFilename);
  const bytes = await doc.save();
  fs.writeFileSync(outputPath, bytes);

  return {
    filename: outputFilename,
    path: outputPath,
    fieldsProcessed: fields.length,
    flattened: Boolean(flatten),
    size: bytes.length
  };
}

// 10. Edit PDF (Annotations: text, rectangles, highlights)
async function editPdf(pdfPath, annotations = []) {
  const pdfBytes = fs.readFileSync(pdfPath);
  const doc = await PDFDocument.load(pdfBytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);

  for (const annot of annotations) {
    const pageIdx = Math.max(0, Math.min(doc.getPageCount() - 1, (annot.page || 1) - 1));
    const page = doc.getPage(pageIdx);
    const color = hexToRgb(annot.color || '#000000');

    if (annot.type === 'text') {
      page.drawText(annot.text || '', {
        x: Number(annot.x) || 50,
        y: Number(annot.y) || 50,
        size: Number(annot.fontSize) || 14,
        font,
        color: rgb(color.r, color.g, color.b),
        opacity: Number(annot.opacity) || 1.0
      });
    } else if (annot.type === 'rectangle' || annot.type === 'highlight') {
      page.drawRectangle({
        x: Number(annot.x) || 50,
        y: Number(annot.y) || 50,
        width: Number(annot.width) || 100,
        height: Number(annot.height) || 30,
        color: rgb(color.r, color.g, color.b),
        opacity: annot.type === 'highlight' ? 0.35 : (Number(annot.opacity) || 1.0)
      });
    }
  }

  const outputFilename = `edited_${uuidv4()}.pdf`;
  const outputPath = path.join(config.TEMP_DIR, outputFilename);
  const bytes = await doc.save();
  fs.writeFileSync(outputPath, bytes);

  return {
    filename: outputFilename,
    path: outputPath,
    size: bytes.length
  };
}

// Helper: parse string page ranges like "1-3, 5, 8" into 0-indexed array
function parsePageRanges(rangesStr, totalPages) {
  if (!rangesStr || rangesStr === 'all') {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const pages = new Set();
  const parts = rangesStr.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [start, end] = trimmed.split('-').map((n) => parseInt(n.trim(), 10));
      if (!isNaN(start) && !isNaN(end)) {
        const s = Math.max(1, Math.min(start, end));
        const e = Math.min(totalPages, Math.max(start, end));
        for (let p = s; p <= e; p++) {
          pages.add(p - 1);
        }
      }
    } else {
      const p = parseInt(trimmed, 10);
      if (!isNaN(p) && p >= 1 && p <= totalPages) {
        pages.add(p - 1);
      }
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

// Helper: convert hex color "#rrggbb" to 0..1 RGB object
function hexToRgb(hex) {
  let c = hex.replace('#', '');
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('');
  }
  const num = parseInt(c, 16);
  if (isNaN(num)) return { r: 0, g: 0, b: 0 };
  return {
    r: ((num >> 16) & 255) / 255,
    g: ((num >> 8) & 255) / 255,
    b: (num & 255) / 255
  };
}

module.exports = {
  mergePdfs,
  splitPdf,
  organizePdf,
  rotatePdf,
  cropPdf,
  watermarkPdf,
  addPageNumbers,
  signPdf,
  handlePdfForms,
  editPdf,
  parsePageRanges
};
