import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Crop, RotateCcw, ZoomIn, ZoomOut, Check, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface SignatureCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSignatureUrl?: string | null;
  onSave: (croppedImageDataUrl: string) => Promise<void>;
  onRemove?: () => Promise<void>;
  title?: string;
}

export function SignatureCropDialog({
  open,
  onOpenChange,
  currentSignatureUrl,
  onSave,
  onRemove,
  title = 'Upload de Assinatura',
}: SignatureCropDialogProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [saving, setSaving] = useState(false);

  // Crop area
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);
  const [cropEnd, setCropEnd] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Zoom/rotation
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Draw image on canvas ──
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const maxW = 500;
    const maxH = 300;
    const scale = Math.min(maxW / image.width, maxH / image.height, 1) * zoom;
    canvas.width = maxW;
    canvas.height = maxH;

    ctx.fillStyle = '#f8f8f8';
    ctx.fillRect(0, 0, maxW, maxH);

    ctx.save();
    ctx.translate(maxW / 2, maxH / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(
      image,
      (-image.width * scale) / 2,
      (-image.height * scale) / 2,
      image.width * scale,
      image.height * scale,
    );
    ctx.restore();

    // Draw crop overlay
    if (cropStart && cropEnd) {
      const x = Math.min(cropStart.x, cropEnd.x);
      const y = Math.min(cropStart.y, cropEnd.y);
      const w = Math.abs(cropEnd.x - cropStart.x);
      const h = Math.abs(cropEnd.y - cropStart.y);

      // Dim outside crop area
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, maxW, y);
      ctx.fillRect(0, y + h, maxW, maxH - y - h);
      ctx.fillRect(0, y, x, h);
      ctx.fillRect(x + w, y, maxW - x - w, h);

      // Border
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.strokeRect(x, y, w, h);
      ctx.setLineDash([]);
    }
  }, [image, zoom, rotation, cropStart, cropEnd]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // ── File selection ──
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione apenas imagens (PNG, JPG)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setCropStart(null);
        setCropEnd(null);
        setZoom(1);
        setRotation(0);
        setIsCropping(true);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  // ── Mouse handlers for crop ──
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCropStart({ x, y });
    setCropEnd({ x, y });
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    setCropEnd({ x, y });
  };

  const handleMouseUp = () => setIsDragging(false);

  // ── Generate cropped image ──
  const getCroppedImage = (): string | null => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return null;

    // If no crop area, use the whole canvas
    if (!cropStart || !cropEnd) {
      // Create a clean canvas without overlay
      const tempCanvas = document.createElement('canvas');
      const maxW = 500;
      const maxH = 300;
      const scale = Math.min(maxW / image.width, maxH / image.height, 1) * zoom;
      const w = image.width * scale;
      const h = image.height * scale;
      tempCanvas.width = w;
      tempCanvas.height = h;
      const ctx = tempCanvas.getContext('2d');
      if (!ctx) return null;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.translate(w / 2, h / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(image, -w / 2, -h / 2, w, h);
      return tempCanvas.toDataURL('image/png');
    }

    const x = Math.min(cropStart.x, cropEnd.x);
    const y = Math.min(cropStart.y, cropEnd.y);
    const w = Math.abs(cropEnd.x - cropStart.x);
    const h = Math.abs(cropEnd.y - cropStart.y);

    if (w < 10 || h < 10) return null;

    // Extract cropped region from image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return null;

    // Draw white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);

    // We need to replicate the exact drawing from the main canvas
    const maxW = 500;
    const maxH = 300;
    const scale = Math.min(maxW / image.width, maxH / image.height, 1) * zoom;

    ctx.save();
    ctx.translate(maxW / 2 - x, maxH / 2 - y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.drawImage(
      image,
      (-image.width * scale) / 2,
      (-image.height * scale) / 2,
      image.width * scale,
      image.height * scale,
    );
    ctx.restore();

    return tempCanvas.toDataURL('image/png');
  };

  // ── Save ──
  const handleSave = async () => {
    const cropped = getCroppedImage();
    if (!cropped) {
      toast.error('Nenhuma imagem para salvar');
      return;
    }
    setSaving(true);
    try {
      await onSave(cropped);
      toast.success('Assinatura salva com sucesso!');
      onOpenChange(false);
      setImage(null);
      setIsCropping(false);
    } catch {
      toast.error('Erro ao salvar assinatura');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!onRemove) return;
    if (!confirm('Remover assinatura?')) return;
    setSaving(true);
    try {
      await onRemove();
      toast.success('Assinatura removida');
      onOpenChange(false);
    } catch {
      toast.error('Erro ao remover');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-orange-600" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current signature preview */}
          {currentSignatureUrl && !isCropping && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <p className="text-xs text-gray-500 mb-2 font-medium">Assinatura Atual:</p>
              <div className="flex items-center justify-center bg-white border rounded p-3 min-h-[80px]">
                <img
                  src={currentSignatureUrl}
                  alt="Assinatura atual"
                  className="max-h-[100px] max-w-full object-contain"
                />
              </div>
            </div>
          )}

          {/* Upload button */}
          {!isCropping && (
            <div className="flex flex-col items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-20 border-2 border-dashed border-orange-300 hover:border-orange-500 hover:bg-orange-50"
              >
                <div className="flex flex-col items-center gap-1">
                  <Upload className="w-6 h-6 text-orange-500" />
                  <span className="text-sm text-gray-600">
                    {currentSignatureUrl ? 'Trocar Assinatura' : 'Enviar Assinatura Escaneada'}
                  </span>
                  <span className="text-xs text-gray-400">PNG, JPG — clique ou arraste</span>
                </div>
              </Button>
            </div>
          )}

          {/* Crop canvas */}
          {isCropping && image && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Crop className="w-4 h-4" />
                Arraste para selecionar a área da assinatura
              </p>
              <div className="border-2 border-orange-300 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={300}
                  className="cursor-crosshair"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}
                >
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <span className="text-xs text-gray-500 w-12 text-center">{Math.round(zoom * 100)}%</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZoom(z => Math.min(3, z + 0.1))}
                >
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <div className="w-px h-6 bg-gray-300 mx-1" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setRotation(r => r + 90)}
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="ml-1 text-xs">Girar</span>
                </Button>
                <div className="w-px h-6 bg-gray-300 mx-1" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCropStart(null);
                    setCropEnd(null);
                  }}
                >
                  <X className="w-4 h-4" />
                  <span className="ml-1 text-xs">Limpar Corte</span>
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {currentSignatureUrl && onRemove && !isCropping && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRemove}
              disabled={saving}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Remover
            </Button>
          )}
          <div className="flex-1" />
          {isCropping && (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setIsCropping(false);
                  setImage(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {saving ? (
                  <>Salvando...</>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Salvar Assinatura
                  </>
                )}
              </Button>
            </>
          )}
          {!isCropping && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
