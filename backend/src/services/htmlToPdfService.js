const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { validateSafeUrl } = require('../middleware/security.middleware');

let browserInstance = null;

async function getBrowser() {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
  }
  return browserInstance;
}

async function convertUrlToPdf({
  url,
  format = 'A4',
  landscape = false,
  printBackground = true,
  margin = { top: '20px', bottom: '20px', left: '20px', right: '20px' },
  scale = 1.0,
  waitTimeout = 15000
}) {
  const urlCheck = validateSafeUrl(url);
  if (!urlCheck.safe) {
    throw new Error(urlCheck.error);
  }

  const browser = await getBrowser();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 PDFToolkit/1.0'
  });

  const page = await context.newPage();
  try {
    await page.goto(urlCheck.url, {
      waitUntil: 'networkidle',
      timeout: waitTimeout
    });
  } catch (err) {
    // If networkidle times out, proceed anyway with domcontentloaded
    try {
      await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
    } catch (_) {}
  }

  const outputFilename = `webpage_${uuidv4()}.pdf`;
  const outputPath = path.join(config.TEMP_DIR, outputFilename);

  await page.pdf({
    path: outputPath,
    format: ['A4', 'A3', 'Letter', 'Legal'].includes(format) ? format : 'A4',
    landscape: Boolean(landscape),
    printBackground: Boolean(printBackground),
    margin,
    scale: Math.max(0.1, Math.min(2.0, Number(scale) || 1.0))
  });

  await context.close();
  return {
    filename: outputFilename,
    path: outputPath,
    size: fs.statSync(outputPath).size
  };
}

async function convertHtmlToPdf({
  htmlContent,
  format = 'A4',
  landscape = false,
  printBackground = true,
  margin = { top: '20px', bottom: '20px', left: '20px', right: '20px' },
  scale = 1.0
}) {
  const browser = await getBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.setContent(htmlContent, {
    waitUntil: 'networkidle',
    timeout: 15000
  });

  const outputFilename = `html_${uuidv4()}.pdf`;
  const outputPath = path.join(config.TEMP_DIR, outputFilename);

  await page.pdf({
    path: outputPath,
    format: ['A4', 'A3', 'Letter', 'Legal'].includes(format) ? format : 'A4',
    landscape: Boolean(landscape),
    printBackground: Boolean(printBackground),
    margin,
    scale: Math.max(0.1, Math.min(2.0, Number(scale) || 1.0))
  });

  await context.close();
  return {
    filename: outputFilename,
    path: outputPath,
    size: fs.statSync(outputPath).size
  };
}

module.exports = {
  convertUrlToPdf,
  convertHtmlToPdf
};
