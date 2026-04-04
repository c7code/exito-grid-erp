import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Loader2, Pen, Check } from 'lucide-react';
import { api } from '@/api';
import { toast } from 'sonner';

interface SignatureSelectorProps {
  documentType: string;       // 'proposal' | 'measurement' | 'service_order' | 'receipt'
  documentId: string;
  slots?: { position: string; label: string }[];  // Which slots to show
  onSignaturesLoaded?: (sigs: Record<string, any>) => void;  // Called when resolved signatures are loaded
  compact?: boolean;
}

const defaultSlots = [
  { position: 'contratada', label: 'CONTRATADA (Empresa)' },
  { position: 'contratante', label: 'CONTRATANTE (Cliente)' },
  { position: 'testemunha', label: 'TESTEMUNHA' },
];

const scopeIcons: Record<string, string> = {
  company: '🏢', client: '🏗️', employee: '👷', witness: '✍️',
};

export function SignatureSelector({ documentType, documentId, slots, onSignaturesLoaded, compact }: SignatureSelectorProps) {
  const [allSlots, setAllSlots] = useState<any[]>([]);
  const [bindings, setBindings] = useState<Record<string, string>>({});
  const [resolved, setResolved] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const displaySlots = slots || defaultSlots;

  useEffect(() => {
    loadData();
  }, [documentType, documentId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [slotsData, docSigs, resolvedSigs] = await Promise.all([
        api.getSignatureSlots().catch(() => []),
        api.getDocumentSignatures(documentType, documentId).catch(() => []),
        api.resolveSignatures(documentType, documentId, displaySlots.map(s => s.position)).catch(() => ({})),
      ]);
      setAllSlots(Array.isArray(slotsData) ? slotsData : []);
      setResolved(resolvedSigs || {});

      // Build bindings map from existing doc signatures
      const bindMap: Record<string, string> = {};
      if (Array.isArray(docSigs)) {
        for (const ds of docSigs) {
          bindMap[ds.slotPosition] = ds.signatureSlotId;
        }
      }
      setBindings(bindMap);

      if (onSignaturesLoaded) onSignaturesLoaded(resolvedSigs || {});
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleBind = async (position: string, signatureSlotId: string) => {
    setSaving(position);
    try {
      await api.setDocumentSignature({
        documentType,
        documentId,
        slotPosition: position,
        signatureSlotId,
      });
      setBindings(prev => ({ ...prev, [position]: signatureSlotId }));
      // Re-resolve
      const resolvedSigs = await api.resolveSignatures(documentType, documentId, displaySlots.map(s => s.position));
      setResolved(resolvedSigs || {});
      if (onSignaturesLoaded) onSignaturesLoaded(resolvedSigs || {});
      toast.success('Assinatura vinculada!');
    } catch { toast.error('Erro ao vincular assinatura'); }
    setSaving(null);
  };

  if (loading) {
    return <div className="flex items-center gap-2 text-xs text-slate-400 py-2"><Loader2 className="w-3 h-3 animate-spin" /> Carregando assinaturas...</div>;
  }

  if (allSlots.length === 0) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
        <Pen className="w-3.5 h-3.5 inline mr-1" />
        Nenhuma assinatura cadastrada. Configure em <strong>Configurações → Assinaturas</strong>.
      </div>
    );
  }

  const apiBase = (window as any).__API_BASE_URL || '';

  return (
    <div className={`bg-gradient-to-r from-slate-50 to-gray-50 border rounded-lg ${compact ? 'p-2' : 'p-4'} space-y-3`}>
      <div className="flex items-center gap-2">
        <Pen className="w-4 h-4 text-slate-500" />
        <span className="text-xs font-bold text-slate-700">Assinaturas do Documento</span>
        <Badge className="text-[9px] bg-slate-100 text-slate-500">{allSlots.length} disponíveis</Badge>
      </div>

      <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-3'} gap-3`}>
        {displaySlots.map(slot => {
          const currentBinding = bindings[slot.position];
          const resolvedSig = resolved[slot.position];
          const imgUrl = resolvedSig?.imageUrl ? (resolvedSig.imageUrl.startsWith('/') ? `${apiBase}${resolvedSig.imageUrl}` : resolvedSig.imageUrl) : null;

          return (
            <div key={slot.position} className="bg-white border rounded-lg p-3 space-y-2">
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">{slot.label}</p>

              {/* Preview */}
              {imgUrl && (
                <div className="bg-gray-50 rounded p-2 flex items-center justify-center min-h-[40px]">
                  <img src={imgUrl} alt="Assinatura" className="max-h-[45px] max-w-full object-contain" />
                </div>
              )}

              {/* Signer info */}
              {resolvedSig?.signerName && (
                <p className="text-[10px] text-slate-500 truncate">👤 {resolvedSig.signerName} {resolvedSig.signerRole ? `(${resolvedSig.signerRole})` : ''}</p>
              )}

              {/* Selector */}
              <Select
                value={currentBinding || 'none'}
                onValueChange={v => { if (v !== 'none') handleBind(slot.position, v); }}
              >
                <SelectTrigger className="h-7 text-[10px]">
                  <SelectValue placeholder="Selecionar assinatura..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Usar padrão —</SelectItem>
                  {allSlots.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      {scopeIcons[s.scope] || '📋'} {s.label} {s.signerName ? `(${s.signerName})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {saving === slot.position && (
                <div className="flex items-center gap-1 text-[10px] text-amber-600"><Loader2 className="w-3 h-3 animate-spin" /> Salvando...</div>
              )}
              {currentBinding && saving !== slot.position && (
                <div className="flex items-center gap-1 text-[10px] text-green-600"><Check className="w-3 h-3" /> Vinculada</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
