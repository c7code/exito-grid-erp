/**
 * Utilitário para renderizar páginas de um PDF como imagens base64.
 * Usa pdf.js para converter cada página em canvas → data URL.
 * 
 * Busca o PDF via fetch() primeiro para evitar problemas de CORS
 * com Supabase Storage.
 */
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configurar o worker — usa import ?url do Vite para resolver o caminho local
// (o CDN não possui a versão 6.x do pdf.js)
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl;

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
 * Busca o PDF via fetch() e passa como ArrayBuffer para evitar CORS.
 */
export async function renderPdfToImages(url: string, scale: number = 2): Promise<RenderedPage[]> {
  // Buscar o PDF como ArrayBuffer via fetch (resolve CORS)
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Falha ao buscar PDF: ${response.status} ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const data = new Uint8Array(arrayBuffer);

  const loadingTask = pdfjsLib.getDocument({
    data,
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

  if (pdfDocs.length === 0) return [];

  const results: RenderedAttachment[] = [];

  for (const doc of pdfDocs) {
    try {
      console.log(`[pdfRenderer] Renderizando "${doc.name || doc.fileName}" de ${doc.url}`);
      const pages = await renderPdfToImages(doc.url, scale);
      console.log(`[pdfRenderer] "${doc.name || doc.fileName}": ${pages.length} páginas renderizadas`);
      results.push({
        docId: doc.id,
        docName: doc.name || doc.fileName || 'Anexo',
        description: doc.description,
        pages,
      });
    } catch (err) {
      console.error(`[pdfRenderer] Falha ao renderizar PDF "${doc.name || doc.fileName}":`, err);
    }
  }

  return results;
}
