import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';

async function renderPDF({
  htmlPath,
  pdfPath,
  runningsPath,
  cssPath,
  highlightCssPath,
  paperFormat,
  paperOrientation,
  paperBorder,
  renderDelay,
  loadTimeout
}) {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/Users/ianashen/.cache/puppeteer/chrome/mac_arm-131.0.6778.204/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing',
    product: 'chrome'
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({
      width: 1200,
      height: 1600
    });

    // Handle timeout
    const timeout = setTimeout(() => {
      throw new Error('Timeout loading HTML content');
    }, loadTimeout);

    // Load the HTML file
    await page.goto(`file://${htmlPath}`, {
      waitUntil: 'networkidle0',
      timeout: loadTimeout
    });
    clearTimeout(timeout);

    // Import runnings (header/footer)
    const runnings = await import(fileURLToPath(`file://${runningsPath}`));

    // Add CSS if provided
    if (cssPath) {
      await page.addStyleTag({ path: cssPath });
    }
    
    if (highlightCssPath) {
      await page.addStyleTag({ path: highlightCssPath });
    }

    // Wait for specified delay
    await new Promise(resolve => setTimeout(resolve, renderDelay));

    // Force repaint to ensure proper rendering
    await page.evaluate(() => {
      document.body.style.transform = 'scale(1)';
      return document.body.offsetHeight;
    });

    // Get watermark text if present
    const watermarkText = await page.evaluate(() => {
      const watermark = document.querySelector('.watermark');
      return watermark ? watermark.textContent : '';
    });

    // Generate PDF
    await page.pdf({
      path: pdfPath,
      format: paperFormat,
      landscape: paperOrientation === 'landscape',
      margin: {
        top: paperBorder,
        right: paperBorder,
        bottom: paperBorder,
        left: paperBorder
      },
      printBackground: true,
      displayHeaderFooter: !!watermarkText,
      headerTemplate: watermarkText ? runnings.default.header(watermarkText) : '',
      footerTemplate: watermarkText ? runnings.default.footer(watermarkText) : '',
      preferCSSPageSize: true
    });

    return true;
  } finally {
    await browser.close();
  }
}

export default renderPDF;
