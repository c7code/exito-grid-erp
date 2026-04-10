// Converte a primeira página do PDF logo para PNG e gera base64
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createCanvas } from 'canvas';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  
  const pdfPath = path.join('C:', 'Users', 'Euller Matheus', 'Downloads', 'LOGO EXITO GRID (1).pdf');
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  
  const doc = await pdfjsLib.getDocument({ data }).promise;
  const page = await doc.getPage(1);
  
  // Render at high DPI for quality
  const scale = 3;
  const vp = page.getViewport({ scale });
  
  const canvas = createCanvas(vp.width, vp.height);
  const ctx = canvas.getContext('2d');
  
  await page.render({
    canvasContext: ctx,
    viewport: vp,
  }).promise;
  
  // Save as PNG
  const outDir = path.join(__dirname, 'public');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'exito-grid-logo.png');
  const pngBuffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outPath, pngBuffer);
  console.log('PNG saved to:', outPath);
  console.log('Size:', pngBuffer.length, 'bytes');
  console.log('Dimensions:', vp.width, 'x', vp.height);
  
  // Also generate base64 for embedding in PDF templates
  const base64 = pngBuffer.toString('base64');
  const dataUrl = `data:image/png;base64,${base64}`;
  
  // Save base64 to a file for reference
  const assetsDir = path.join(__dirname, 'src', 'assets');
  fs.mkdirSync(assetsDir, { recursive: true });
  const b64Path = path.join(assetsDir, 'exito-grid-logo-base64.ts');
  fs.writeFileSync(b64Path, `// Auto-generated logo base64\nexport const EXITO_GRID_LOGO = '${dataUrl}';\n`);
  console.log('Base64 TS saved to:', b64Path);
  console.log('Base64 length:', dataUrl.length);
}

main().catch(err => { console.error(err); process.exit(1); });
