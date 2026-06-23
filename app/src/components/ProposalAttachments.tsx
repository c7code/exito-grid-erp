// ═══════════════════════════════════════════════════════════════════════════
// ProposalAttachments — Anexos de propostas (relatórios, visitas, PDFs)
// Upload via Supabase Storage, vinculado ao proposalId
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { api } from '@/api';
import {
  Paperclip, Upload, Trash2, FileText, Image, File as FileIcon,
  Loader2, Eye, EyeOff, Pencil, Check, X, AlertTriangle,
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
  purpose?: string;
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
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteAtt, setConfirmDeleteAtt] = useState<Attachment | null>(null);
  const [editingAtt, setEditingAtt] = useState<Attachment | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [editLoading, setEditLoading] = useState(false);
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
          purpose: 'proposal_internal',
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

  // ── Toggle visibility ──
  const handleToggleVisibility = async (att: Attachment) => {
    const newPurpose = att.purpose === 'proposal_external' ? 'proposal_internal' : 'proposal_external';
    setTogglingId(att.id);
    try {
      await api.updateDocumentPurpose(att.id, newPurpose);
      setAttachments(prev =>
        prev.map(a => a.id === att.id ? { ...a, purpose: newPurpose } : a)
      );
      toast.success(
        newPurpose === 'proposal_external'
          ? 'Anexo visível na proposta do cliente'
          : 'Anexo oculto da proposta do cliente'
      );
    } catch {
      toast.error('Erro ao alterar visibilidade');
    }
    setTogglingId(null);
  };

  // ── Delete (with confirmation) ──
  const handleDelete = async () => {
    if (!confirmDeleteAtt) return;
    setDeletingId(confirmDeleteAtt.id);
    try {
      await api.deleteDocument(confirmDeleteAtt.id);
      toast.success('Anexo removido');
      setAttachments(prev => prev.filter(a => a.id !== confirmDeleteAtt.id));
    } catch {
      toast.error('Erro ao remover anexo');
    }
    setDeletingId(null);
    setConfirmDeleteAtt(null);
  };

  // ── Edit (name + description) ──
  const handleOpenEdit = (att: Attachment) => {
    setEditingAtt(att);
    setEditForm({
      name: att.name || att.originalName || att.fileName || '',
      description: att.description || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editingAtt) return;
    if (!editForm.name.trim()) {
      toast.error('O nome do anexo é obrigatório');
      return;
    }
    setEditLoading(true);
    try {
      await api.updateDocument(editingAtt.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || null,
      });
      setAttachments(prev =>
        prev.map(a => a.id === editingAtt.id
          ? { ...a, name: editForm.name.trim(), description: editForm.description.trim() || undefined }
          : a
        )
      );
      toast.success('Anexo atualizado');
      setEditingAtt(null);
    } catch {
      toast.error('Erro ao atualizar anexo');
    }
    setEditLoading(false);
  };

  // ── Download / View ──
  const handleView = (att: Attachment) => {
    if (att.url) {
      window.open(att.url, '_blank');
    }
  };

  return (
    <>
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
          Relatórios de visita, fotos, documentos técnicos — anexos marcados como visíveis serão incluídos na proposta impressa.
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
              const isExternal = att.purpose === 'proposal_external';
              const isToggling = togglingId === att.id;
              return (
                <div
                  key={att.id}
                  className="flex items-center gap-3 bg-white border rounded-lg px-3 py-2 hover:border-violet-300 transition-colors"
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-400">{formatSize(att.size)}</span>
                      <span className="text-xs text-slate-300">•</span>
                      <span className="text-xs text-slate-400">
                        {new Date(att.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                      {att.description && (
                        <>
                          <span className="text-xs text-slate-300">•</span>
                          <span className="text-xs text-slate-400 truncate max-w-[150px]" title={att.description}>{att.description}</span>
                        </>
                      )}
                      {isExternal && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-300 text-blue-600 bg-blue-50">
                          Visível ao cliente
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Actions — sempre visíveis */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    {/* Visibility toggle */}
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(att)}
                        disabled={isToggling}
                        className={`p-1.5 rounded transition-colors ${
                          isExternal
                            ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                            : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                        }`}
                        title={isExternal ? 'Visível para o cliente — clique para ocultar' : 'Oculto do cliente — clique para tornar visível'}
                      >
                        {isToggling ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isExternal ? (
                          <Eye className="w-4 h-4" />
                        ) : (
                          <EyeOff className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    {/* View */}
                    <button
                      type="button"
                      onClick={() => handleView(att)}
                      className="p-1.5 rounded hover:bg-blue-50 text-blue-500 transition-colors"
                      title="Visualizar"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {/* Edit */}
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(att)}
                        className="p-1.5 rounded hover:bg-amber-50 text-amber-500 transition-colors"
                        title="Editar nome e descrição"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    )}
                    {/* Delete */}
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteAtt(att)}
                        className="p-1.5 rounded hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                        title="Remover anexo"
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

      {/* ═══ EDIT DIALOG ═══ */}
      <Dialog open={!!editingAtt} onOpenChange={(open) => !open && setEditingAtt(null)}>
        <DialogContent className="max-w-md p-0 border-none shadow-2xl">
          <DialogHeader className="p-5 bg-slate-900 text-white">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Pencil className="w-4 h-4 text-amber-500" />
              Editar Anexo
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-sm">
              Altere o nome e a descrição do anexo.
            </DialogDescription>
          </DialogHeader>
          <div className="p-5 bg-slate-50 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nome do Anexo *</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nome do arquivo"
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Descrição</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição opcional do anexo..."
                className="bg-white min-h-[80px] resize-none"
              />
            </div>
          </div>
          <DialogFooter className="p-4 bg-white border-t gap-3">
            <Button variant="outline" onClick={() => setEditingAtt(null)}>
              <X className="w-4 h-4 mr-1" /> Cancelar
            </Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
              onClick={handleSaveEdit}
              disabled={editLoading}
            >
              {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-1" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ CONFIRM DELETE DIALOG ═══ */}
      <Dialog open={!!confirmDeleteAtt} onOpenChange={(open) => !open && setConfirmDeleteAtt(null)}>
        <DialogContent className="max-w-sm p-0 border-none shadow-2xl">
          <DialogHeader className="p-5 bg-red-600 text-white">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-200" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription className="text-red-200 text-sm">
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="p-5 bg-slate-50">
            <p className="text-sm text-slate-700">
              Deseja remover o anexo <strong className="text-slate-900">{confirmDeleteAtt?.name || confirmDeleteAtt?.originalName || confirmDeleteAtt?.fileName}</strong>?
            </p>
            <p className="text-xs text-slate-400 mt-2">
              O arquivo será removido permanentemente do sistema e do armazenamento.
            </p>
          </div>
          <DialogFooter className="p-4 bg-white border-t gap-3">
            <Button variant="outline" onClick={() => setConfirmDeleteAtt(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="font-bold"
              onClick={handleDelete}
              disabled={deletingId === confirmDeleteAtt?.id}
            >
              {deletingId === confirmDeleteAtt?.id ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1" />
              ) : (
                <Trash2 className="w-4 h-4 mr-1" />
              )}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
