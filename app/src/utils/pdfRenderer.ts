/**
 * Utilitário para renderizar páginas de um PDF como imagens base64.
 * Usa pdf.js para converter cada página em canvas → data URL.
 */
import * as pdfjsLib from 'pdfjs-dist';

// Configurar o worker — usa o CDN para evitar problemas de bundle
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export interface RenderedPage {
  dataUrl: string;     // base64 data URL da página
  pageNumber: number;  // número da página (1-indexed)
  width: number;
  height: number;
}

export interface RenderedAttachment {
  docId: string;
  docName: string;
  description?: string;
  pages: RenderedPage[];
}

/**
 * Renderiza todas as páginas de um PDF como imagens PNG base64.
 * @param url URL pública do PDF (Supabase storage)
 * @param scale Escala de renderização (2 = boa qualidade, 3 = alta)
 */
export async function renderPdfToImages(url: string, scale: number = 2): Promise<RenderedPage[]> {
  const loadingTask = pdfjsLib.getDocument({
    url,
    cMapUrl: `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/cmaps/`,
    cMapPacked: true,
  });

  const pdf = await loadingTask.promise;
  const pages: RenderedPage[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;

    pages.push({
      dataUrl: canvas.toDataURL('image/png'),
      pageNumber: i,
      width: viewport.width,
      height: viewport.height,
    });

    // Limpar memória
    page.cleanup();
  }

  pdf.cleanup();
  return pages;
}

/**
 * Processa todos os documentos PDF anexos de uma proposta e retorna
 * as páginas renderizadas como imagens.
 */
export async function renderAttachmentPdfs(
  documents: any[],
  scale: number = 2
): Promise<RenderedAttachment[]> {
  const pdfDocs = documents.filter(
    (d: any) => d.mimeType?.includes('pdf') || /\.pdf$/i.test(d.fileName || d.name || '')
  );

  const results: RenderedAttachment[] = [];

  for (const doc of pdfDocs) {
    try {
      const pages = await renderPdfToImages(doc.url, scale);
      results.push({
        docId: doc.id,
        docName: doc.name || doc.fileName || 'Anexo',
        description: doc.description,
        pages,
      });
    } catch (err) {
      console.warn(`Falha ao renderizar PDF "${doc.name || doc.fileName}":`, err);
    }
  }

  return results;
}
