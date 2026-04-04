import { useState, useRef, useEffect, useCallback } from 'react';
import { Pen, Type, Upload, RotateCcw, Check } from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// SignaturePad — DocuSign-style signature capture component
// Modes: Draw (canvas) | Type (cursive fonts) | Upload (file)
// ═══════════════════════════════════════════════════════════════

interface SignaturePadProps {
  onSignatureCapture: (base64: string) => void;
  onSignatureClear?: () => void;
  initialMode?: 'draw' | 'type' | 'upload';
  signerName?: string;
  accentColor?: string;
}

const FONTS = [
  { name: 'Dancing Script', label: 'Cursiva' },
  { name: 'Great Vibes', label: 'Elegante' },
  { name: 'Sacramento', label: 'Fluida' },
  { name: 'Parisienne', label: 'Clássica' },
  { name: 'Caveat', label: 'Manuscrita' },
];

// Load Google Fonts dynamically
const loadedFonts = new Set<string>();
function ensureFont(fontName: string) {
  if (loadedFonts.has(fontName)) return;
  loadedFonts.add(fontName);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@400;700&display=swap`;
  document.head.appendChild(link);
}

export function SignaturePad({
  onSignatureCapture,
  onSignatureClear,
  initialMode = 'draw',
  signerName = '',
  accentColor = '#E8620A',
}: SignaturePadProps) {
  const [mode, setMode] = useState<'draw' | 'type' | 'upload'>(initialMode);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [typedName, setTypedName] = useState(signerName);
  const [selectedFont, setSelectedFont] = useState(0);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  // Load fonts on mount
  useEffect(() => {
    FONTS.forEach(f => ensureFont(f.name));
  }, []);

  // Update typed name when signerName prop changes
  useEffect(() => {
    if (signerName) setTypedName(signerName);
  }, [signerName]);

  // ═══ DRAWING ═══════════════════════════════════════════════════

  const getCanvasPoint = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const startDraw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDrawing.current = true;
    lastPoint.current = getCanvasPoint(e);
  }, [getCanvasPoint]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const point = getCanvasPoint(e);
    if (!ctx || !point || !lastPoint.current) return;

    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);

    // Smooth curve using quadratic bezier
    const midX = (lastPoint.current.x + point.x) / 2;
    const midY = (lastPoint.current.y + point.y) / 2;
    ctx.quadraticCurveTo(lastPoint.current.x, lastPoint.current.y, midX, midY);

    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    lastPoint.current = point;
    setHasDrawn(true);
  }, [getCanvasPoint]);

  const endDraw = useCallback(() => {
    isDrawing.current = false;
    lastPoint.current = null;
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasDrawn(false);
    onSignatureClear?.();
  }, [onSignatureClear]);

  const captureDrawing = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Create transparent PNG
    const data = canvas.toDataURL('image/png');
    onSignatureCapture(data);
  }, [onSignatureCapture]);

  // ═══ TYPED SIGNATURE ═════════════════════════════════════════

  const captureTyped = useCallback(() => {
    if (!typedName.trim()) return;
    const font = FONTS[selectedFont];
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `48px "${font.name}", cursive`;
    ctx.fillStyle = '#1a1a1a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);

    onSignatureCapture(canvas.toDataURL('image/png'));
  }, [typedName, selectedFont, onSignatureCapture]);

  // ═══ UPLOAD ══════════════════════════════════════════════════

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setUploadPreview(base64);
      onSignatureCapture(base64);
    };
    reader.readAsDataURL(file);
  }, [onSignatureCapture]);

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '10px 16px',
    border: 'none',
    borderBottom: active ? `3px solid ${accentColor}` : '3px solid transparent',
    background: active ? '#fff' : '#f8fafc',
    color: active ? accentColor : '#64748b',
    fontWeight: active ? 700 : 500,
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'all 0.2s ease',
    fontFamily: "'Segoe UI', sans-serif",
  });

  return (
    <div style={{
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      overflow: 'hidden',
      background: '#fff',
    }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
        <button style={tabStyle(mode === 'draw')} onClick={() => setMode('draw')}>
          <Pen style={{ width: '15px', height: '15px' }} /> Desenhar
        </button>
        <button style={tabStyle(mode === 'type')} onClick={() => setMode('type')}>
          <Type style={{ width: '15px', height: '15px' }} /> Digitar
        </button>
        <button style={tabStyle(mode === 'upload')} onClick={() => setMode('upload')}>
          <Upload style={{ width: '15px', height: '15px' }} /> Upload
        </button>
      </div>

      {/* Canvas area */}
      <div style={{ padding: '16px', minHeight: '180px' }}>

        {/* ═══ DRAW MODE ═══ */}
        {mode === 'draw' && (
          <div>
            <div style={{
              position: 'relative',
              border: '2px dashed #cbd5e1',
              borderRadius: '8px',
              background: '#fefefe',
              cursor: 'crosshair',
              touchAction: 'none',
            }}>
              <canvas
                ref={canvasRef}
                width={560}
                height={160}
                style={{ width: '100%', height: '160px', display: 'block' }}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
              />
              {!hasDrawn && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  color: '#94a3b8',
                  fontSize: '14px',
                  pointerEvents: 'none',
                  textAlign: 'center',
                }}>
                  <Pen style={{ width: '24px', height: '24px', marginBottom: '6px', opacity: 0.5 }} />
                  <div>Desenhe sua assinatura aqui</div>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
              <button
                onClick={clearCanvas}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  background: '#fff',
                  color: '#64748b',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <RotateCcw style={{ width: '13px', height: '13px' }} /> Limpar
              </button>
              <button
                onClick={captureDrawing}
                disabled={!hasDrawn}
                style={{
                  padding: '8px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  background: hasDrawn ? accentColor : '#e2e8f0',
                  color: hasDrawn ? '#fff' : '#94a3b8',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: hasDrawn ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Check style={{ width: '13px', height: '13px' }} /> Confirmar
              </button>
            </div>
          </div>
        )}

        {/* ═══ TYPE MODE ═══ */}
        {mode === 'type' && (
          <div>
            <input
              type="text"
              value={typedName}
              onChange={e => setTypedName(e.target.value)}
              placeholder="Digite seu nome completo"
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: '12px',
              }}
            />
            {/* Font preview */}
            <div style={{
              border: '2px dashed #cbd5e1',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              minHeight: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fefefe',
              marginBottom: '12px',
            }}>
              {typedName ? (
                <span style={{
                  fontFamily: `"${FONTS[selectedFont].name}", cursive`,
                  fontSize: '36px',
                  color: '#1a1a1a',
                }}>
                  {typedName}
                </span>
              ) : (
                <span style={{ color: '#94a3b8', fontSize: '14px' }}>
                  Pré-visualização da assinatura
                </span>
              )}
            </div>
            {/* Font selector */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {FONTS.map((font, i) => (
                <button
                  key={font.name}
                  onClick={() => setSelectedFont(i)}
                  style={{
                    padding: '6px 12px',
                    border: selectedFont === i ? `2px solid ${accentColor}` : '1px solid #e2e8f0',
                    borderRadius: '6px',
                    background: selectedFont === i ? `${accentColor}10` : '#fff',
                    cursor: 'pointer',
                    fontFamily: `"${font.name}", cursive`,
                    fontSize: '16px',
                    color: selectedFont === i ? accentColor : '#475569',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {font.label}
                </button>
              ))}
            </div>
            <button
              onClick={captureTyped}
              disabled={!typedName.trim()}
              style={{
                width: '100%',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                background: typedName.trim() ? accentColor : '#e2e8f0',
                color: typedName.trim() ? '#fff' : '#94a3b8',
                fontSize: '13px',
                fontWeight: 600,
                cursor: typedName.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <Check style={{ width: '14px', height: '14px' }} /> Confirmar Assinatura
            </button>
          </div>
        )}

        {/* ═══ UPLOAD MODE ═══ */}
        {mode === 'upload' && (
          <div>
            <label style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed #cbd5e1',
              borderRadius: '8px',
              padding: '30px 20px',
              cursor: 'pointer',
              background: '#fefefe',
              transition: 'border-color 0.2s ease',
              minHeight: '100px',
            }}>
              {uploadPreview ? (
                <img
                  src={uploadPreview}
                  alt="Assinatura"
                  style={{
                    maxHeight: '80px',
                    maxWidth: '300px',
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <>
                  <Upload style={{ width: '32px', height: '32px', color: '#94a3b8', marginBottom: '8px' }} />
                  <span style={{ color: '#64748b', fontSize: '14px' }}>
                    Clique ou arraste uma imagem da sua assinatura
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>
                    PNG, JPG ou SVG – máx. 2MB
                  </span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
            {uploadPreview && (
              <button
                onClick={() => { setUploadPreview(null); onSignatureClear?.(); }}
                style={{
                  marginTop: '10px',
                  padding: '8px 16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  background: '#fff',
                  color: '#64748b',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <RotateCcw style={{ width: '13px', height: '13px' }} /> Trocar imagem
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
