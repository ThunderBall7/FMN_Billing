import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export async function buildInvoicePDF(printElement) {
  const scalerEl = printElement.closest('.preview-scaler');
  if (scalerEl) scalerEl.style.transform = 'none';

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfPageHeight = pdf.internal.pageSize.getHeight();
  const extraPages = printElement.querySelectorAll('[data-pdf-page]');

  extraPages.forEach((element) => { element.style.display = 'none'; });
  const mainCanvas = await html2canvas(printElement, {
    scale: 2,
    useCORS: true,
    width: printElement.scrollWidth,
    height: printElement.scrollHeight,
    onclone: (clonedDoc) => {
      clonedDoc.querySelectorAll('*').forEach((node) => {
        node.style.letterSpacing = '0px';
        node.style.wordSpacing = '0px';
      });
      const invoice = clonedDoc.getElementById('invoice-preview');
      if (invoice) {
        invoice.style.width = '210mm';
        invoice.style.overflow = 'visible';
        invoice.style.minHeight = 'unset';
        invoice.style.border = 'none';
        invoice.style.boxShadow = 'none';
        invoice.style.borderRadius = '0';
      }
      clonedDoc.querySelectorAll('[data-pdf-page]').forEach((element) => { element.style.display = 'none'; });
    },
  });
  extraPages.forEach((element) => { element.style.display = ''; });

  const mainImg = mainCanvas.toDataURL('image/jpeg', 0.92);
  const mainImgHeight = (mainCanvas.height * pdfWidth) / mainCanvas.width;
  if (mainImgHeight <= pdfPageHeight + 2) {
    pdf.addImage(mainImg, 'JPEG', 0, 0, pdfWidth, Math.min(mainImgHeight, pdfPageHeight));
  } else {
    let heightLeft = mainImgHeight;
    let position = 0;
    pdf.addImage(mainImg, 'JPEG', 0, position, pdfWidth, mainImgHeight);
    heightLeft -= pdfPageHeight;
    while (heightLeft > 2) {
      position -= pdfPageHeight;
      pdf.addPage();
      pdf.addImage(mainImg, 'JPEG', 0, position, pdfWidth, mainImgHeight);
      heightLeft -= pdfPageHeight;
    }
  }

  for (const pageEl of extraPages) {
    const canvas = await html2canvas(pageEl, {
      scale: 2,
      useCORS: true,
      width: pageEl.scrollWidth,
      height: pageEl.scrollHeight,
      onclone: (clonedDoc) => {
        clonedDoc.querySelectorAll('*').forEach((node) => {
          node.style.letterSpacing = '0px';
          node.style.wordSpacing = '0px';
        });
      },
    });
    pdf.addPage();
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pdfWidth, Math.min((canvas.height * pdfWidth) / canvas.width, pdfPageHeight));
  }

  if (scalerEl) scalerEl.style.transform = '';
  return pdf;
}
