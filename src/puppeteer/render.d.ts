interface RenderPDFOptions {
  htmlPath: string;
  pdfPath: string;
  runningsPath: string;
  cssPath: string;
  highlightCssPath: string;
  paperFormat: string;
  paperOrientation: string;
  paperBorder: string;
  renderDelay: number;
  loadTimeout: number;
}

declare const renderPDF: (options: RenderPDFOptions) => Promise<boolean>;
export default renderPDF;
