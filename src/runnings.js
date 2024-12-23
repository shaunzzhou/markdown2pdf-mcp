export default {
  header: (watermarkText) => `
    <style>
      .watermark-header {
        width: 100%;
        font-size: 24px;
        color: rgba(0,0,0,0.1);
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        margin: 0;
        padding: 0;
      }
    </style>
    <div class="watermark-header">${watermarkText}</div>
  `,
  footer: (watermarkText) => `
    <style>
      .watermark-footer {
        width: 100%;
        font-size: 24px;
        color: rgba(0,0,0,0.1);
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        margin: 0;
        padding: 0;
      }
    </style>
    <div class="watermark-footer">${watermarkText}</div>
  `
}
