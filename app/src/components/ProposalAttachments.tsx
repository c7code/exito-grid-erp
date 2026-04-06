// ═══════════════════════════════════════════════════════════════════════════
// ProposalAttachments — Anexos de propostas (relatórios, visitas, PDFs)
// Upload via Supabase Storage, vinculado ao proposalId
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { api } from '@/api';
import {
  Paperclip, Upload, Trash2, FileText, Image, File as FileIcon,
  Loader2, Eye,
} from 'lucide-react';

interface Attachment {
  id: string;
  name: string;
  fileName: string;
  originalName?: string;
  url: string;
  mimeType: string;
  size: number;
  description?: string;
  createdAt: string;
}

interface Props {
  proposalId: string;
  readOnly?: boolean;
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (mimeType: string) => {
  if (mimeType?.startsWith('image/')) return Image;
  if (mimeType?.includes('pdf')) return FileText;
  return FileIcon;
};

export default function ProposalAttachments({ proposalId, readOnly }: Props) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load attachments ──
  const loadAttachments = async () => {
    if (!proposalId) return;
    setLoading(true);
    try {
      const docs = await api.getDocuments({ proposalId });
      setAttachments(Array.isArray(docs) ? docs : []);
    } catch {
      setAttachments([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAttachments();
  }, [proposalId]);

  // ── Upload ──
  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    let successCount = 0;
    for (const file of Array.from(files)) {
      try {
        await api.uploadDocument(file, {
          proposalId,
          type: 'attachment',
          name: file.name,
          description: `Anexo da proposta`,
        });
        successCount++;
      } catch (err) {
        console.error('Upload error:', err);
        toast.error(`Erro ao enviar: ${file.name}`);
      }
    }
    if (successCount > 0) {
      toast.success(`${successCount} anexo(s) enviado(s)`);
      await loadAttachments();
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Delete ──
  const handleDelete = async (id: string) => {
    try {
      await api.deleteDocument(id);
      toast.success('Anexo removido');
      setAttachments(prev => prev.filter(a => a.id !== id));
    } catch {
      toast.error('Erro ao remover anexo');
    }
  };

  // ── Download / View ──
  const handleView = (att: Attachment) => {
    if (att.url) {
      window.open(att.url, '_blank');
    }
  };

  return (
    <div className="bg-slate-50 border rounded-lg p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-violet-600" />
          <h3 className="font-semibold text-sm text-slate-700">Anexos da Proposta</h3>
          {attachments.length > 0 && (
            <Badge variant="outline" className="text-xs">{attachments.length}</Badge>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Relatórios de visita, fotos, documentos técnicos — serão incluídos como anexo ao imprimir.
      </p>

      {/* Upload area */}
      {!readOnly && (
        <div
          className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center hover:border-violet-400 hover:bg-violet-50/30 transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); e.stopPropagation(); }}
          onDrop={e => { e.preventDefault(); e.stopPropagation(); handleUpload(e.dataTransfer.files); }}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
            className="hidden"
            onChange={e => handleUpload(e.target.files)}
          />
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-violet-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Enviando...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <Upload className="w-6 h-6 text-slate-400" />
              <span className="text-sm text-slate-500">Clique ou arraste arquivos aqui</span>
              <span className="text-xs text-slate-400">PDF, imagens, documentos — máx. 50 MB</span>
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-3">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      )}

      {/* Attachment list */}
      {attachments.length > 0 && (
        <div className="space-y-1.5">
          {attachments.map(att => {
            const Icon = getFileIcon(att.mimeType);
            const isImage = att.mimeType?.startsWith('image/');
            return (
              <div
                key={att.id}
                className="flex items-center gap-3 bg-white border rounded-lg px-3 py-2 group hover:border-violet-300 transition-colors"
              >
                {/* Thumbnail or icon */}
                {isImage && att.url ? (
                  <img
                    src={att.url}
                    alt={att.name}
                    className="w-10 h-10 rounded object-cover border"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-slate-500" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{att.name || att.originalName || att.fileName}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">{formatSize(att.size)}</span>
                    <span className="text-xs text-slate-300">•</span>
                    <span className="text-xs text-slate-400">
                      {new Date(att.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleView(att)}
                    className="p-1.5 rounded hover:bg-blue-50 text-blue-500"
                    title="Visualizar"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleDelete(att.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-red-400"
                      title="Remover"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && attachments.length === 0 && (
        <p className="text-xs text-slate-400 text-center py-1">Nenhum anexo adicionado</p>
      )}
    </div>
  );
}
