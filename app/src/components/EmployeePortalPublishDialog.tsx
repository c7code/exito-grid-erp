import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Users, Building2, FileText, Check, ChevronRight, ChevronLeft,
  Loader2, Upload, AlertTriangle, ShieldCheck, Briefcase, FileCheck,
  DollarSign, Search, CheckCircle2, FolderOpen,
} from 'lucide-react';
import { api } from '@/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ═══ DOCUMENT CATEGORY STRUCTURE ═════════════════════════════════════════════

const DOC_CATEGORIES: Record<string, { label: string; icon: any; color: string; types: string[] }> = {
  ssma: {
    label: 'SSMA — Segurança, Saúde e Meio Ambiente',
    icon: ShieldCheck,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    types: ['aso', 'nr10', 'nr35', 'nr12', 'nr33', 'nr06', 'health', 'safety', 'training', 'certification'],
  },
  trabalhista: {
    label: 'Trabalhista — Folha e Encargos',
    icon: Briefcase,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    types: ['holerite', 'fgts_guia', 'inss_gps', 'vale_transporte', 'ponto', 'contract', 'ctps'],
  },
  identificacao: {
    label: 'Identificação e Admissional',
    icon: FileCheck,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
    types: ['cpf_rg', 'identification'],
  },
  fiscal: {
    label: 'Fiscal e Certidões',
    icon: DollarSign,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    types: [],
  },
};

const DOC_TYPE_LABELS: Record<string, string> = {
  aso: 'ASO — Atestado de Saúde Ocupacional',
  nr10: 'NR-10 — Segurança em Eletricidade',
  nr35: 'NR-35 — Trabalho em Altura',
  nr12: 'NR-12 — Máquinas e Equipamentos',
  nr33: 'NR-33 — Espaços Confinados',
  nr06: 'NR-06 — Equipamento de Proteção Individual',
  training: 'Treinamento / Capacitação',
  certification: 'Certificação Técnica',
  health: 'Documento de Saúde',
  safety: 'Documento de Segurança',
  holerite: 'Holerite / Comprovante de Pagamento',
  fgts_guia: 'FGTS — Guia de Recolhimento',
  inss_gps: 'INSS/GPS — Guia de Previdência',
  vale_transporte: 'Vale Transporte',
  ponto: 'Registro de Ponto',
  contract: 'Contrato de Trabalho',
  ctps: 'CTPS — Carteira de Trabalho',
  cpf_rg: 'CPF / RG',
  identification: 'Documento de Identificação',
  other: 'Outro Documento',
};

function getDocCategory(type: string): string {
  for (const [cat, config] of Object.entries(DOC_CATEGORIES)) {
    if (config.types.includes(type)) return cat;
  }
  return 'ssma'; // default
}

function getExpiryStatus(date: string | null): 'valid' | 'expiring' | 'expired' | 'none' {
  if (!date) return 'none';
  const d = new Date(date);
  const now = new Date();
  const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return 'expired';
  if (diff < 30) return 'expiring';
  return 'valid';
}

const EXPIRY_BADGE: Record<string, { label: string; className: string }> = {
  valid: { label: 'Válido', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  expiring: { label: 'Vencendo', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  expired: { label: 'Vencido', className: 'bg-red-100 text-red-700 border-red-200' },
  none: { label: 'Sem validade', className: 'bg-slate-100 text-slate-500 border-slate-200' },
};

// ═══ COMPONENT ═══════════════════════════════════════════════════════════════

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEmployees: any[];
}

export function EmployeePortalPublishDialog({ open, onOpenChange, selectedEmployees }: Props) {
  const [step, setStep] = useState(0);
  const [clients, setClients] = useState<any[]>([]);
  const [companyDocs, setCompanyDocs] = useState<any[]>([]);
  const [selectedClientIds, setSelectedClientIds] = useState<Set<string>>(new Set());
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [selectedCompanyDocIds, setSelectedCompanyDocIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishProgress, setPublishProgress] = useState({ current: 0, total: 0 });

  // Load clients on open
  useEffect(() => {
    if (open) {
      setStep(0);
      setSelectedClientIds(new Set());
      setSelectedDocIds(new Set());
      setSelectedCompanyDocIds(new Set());
      setSearchTerm('');
      setClientSearchTerm('');
      loadClients();
      loadCompanyDocs();
    }
  }, [open]);

  const loadClients = async () => {
    try {
      const data = await api.getClients();
      setClients(data.filter((c: any) => c.hasPortalAccess));
    } catch { /* empty */ }
  };

  // Toggle client selection
  const toggleClient = (id: string) => {
    setSelectedClientIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const filteredClients = useMemo(() => {
    if (!clientSearchTerm) return clients;
    const s = clientSearchTerm.toLowerCase();
    return clients.filter(c =>
      c.name?.toLowerCase().includes(s) ||
      c.company?.toLowerCase().includes(s) ||
      c.email?.toLowerCase().includes(s)
    );
  }, [clients, clientSearchTerm]);

  const loadCompanyDocs = async () => {
    try {
      const companies = await api.getCompanies();
      if (companies?.length > 0) {
        const data = await api.getCompanyDocuments(companies[0].id);
        setCompanyDocs(Array.isArray(data) ? data.filter((d: any) => d.fileUrl) : []);
      }
    } catch { /* empty */ }
  };

  // Build all docs from selected employees
  const allEmployeeDocs = useMemo(() => {
    const docs: any[] = [];
    selectedEmployees.forEach(emp => {
      (emp.documents || []).forEach((doc: any) => {
        if (doc.url) {
          docs.push({
            ...doc,
            employeeName: emp.name,
            employeeId: emp.id,
            category: getDocCategory(doc.type),
            expiryStatus: getExpiryStatus(doc.expiryDate),
          });
        }
      });
    });
    return docs;
  }, [selectedEmployees]);

  // Group by category
  const docsByCategory = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    allEmployeeDocs.forEach(doc => {
      const cat = doc.category;
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(doc);
    });
    return grouped;
  }, [allEmployeeDocs]);

  // Filter search
  const filteredDocs = useMemo(() => {
    if (!searchTerm) return allEmployeeDocs;
    const s = searchTerm.toLowerCase();
    return allEmployeeDocs.filter(d =>
      d.employeeName.toLowerCase().includes(s) ||
      (DOC_TYPE_LABELS[d.type] || d.type).toLowerCase().includes(s) ||
      d.name.toLowerCase().includes(s)
    );
  }, [allEmployeeDocs, searchTerm]);

  // Toggle selection
  const toggleDoc = (id: string) => {
    setSelectedDocIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllInCategory = (cat: string) => {
    const catDocs = docsByCategory[cat] || [];
    setSelectedDocIds(prev => {
      const next = new Set(prev);
      const allSelected = catDocs.every(d => next.has(d.id));
      if (allSelected) {
        catDocs.forEach(d => next.delete(d.id));
      } else {
        catDocs.forEach(d => next.add(d.id));
      }
      return next;
    });
  };

  const toggleCompanyDoc = (id: string) => {
    setSelectedCompanyDocIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Publish to ALL selected clients
  const handlePublish = async () => {
    if (selectedClientIds.size === 0) { toast.error('Selecione pelo menos um cliente'); return; }
    const totalDocs = selectedDocIds.size + selectedCompanyDocIds.size;
    if (totalDocs === 0) { toast.error('Selecione pelo menos um documento'); return; }

    setPublishing(true);
    const clientArray = Array.from(selectedClientIds);
    setPublishProgress({ current: 0, total: clientArray.length });

    try {
      const items: any[] = [];

      // Employee docs
      allEmployeeDocs.filter(d => selectedDocIds.has(d.id)).forEach(doc => {
        items.push({
          contentType: 'employee_doc',
          contentId: doc.id,
          title: `${doc.employeeName} — ${DOC_TYPE_LABELS[doc.type] || doc.name}`,
          description: doc.referenceMonth ? `Competência: ${doc.referenceMonth}` : undefined,
          metadata: {
            employeeName: doc.employeeName,
            employeeId: doc.employeeId,
            documentType: DOC_TYPE_LABELS[doc.type] || doc.type,
            documentCategory: doc.category,
            fileName: doc.name,
            url: doc.url,
            expiryDate: doc.expiryDate,
            referenceMonth: doc.referenceMonth,
          },
        });
      });

      // Company docs
      companyDocs.filter(d => selectedCompanyDocIds.has(d.id)).forEach(doc => {
        items.push({
          contentType: 'company_doc',
          contentId: doc.id,
          title: doc.name,
          description: doc.description || `${doc.documentGroup} — ${doc.fileName || ''}`,
          metadata: {
            documentGroup: doc.documentGroup,
            fileName: doc.fileName,
            url: doc.fileUrl,
            expiryDate: doc.expiryDate,
            issueDate: doc.issueDate,
            responsibleName: doc.responsibleName,
            registrationNumber: doc.registrationNumber,
          },
        });
      });

      // Publish to EACH selected client
      let totalPublished = 0;
      let totalSkipped = 0;
      let totalErrors = 0;

      for (let i = 0; i < clientArray.length; i++) {
        const clientId = clientArray[i];
        setPublishProgress({ current: i + 1, total: clientArray.length });
        try {
          const result = await api.batchPublishToPortal({
            clientId,
            items,
          });
          totalPublished += result.published;
          totalSkipped += result.skipped;
        } catch {
          totalErrors++;
        }
      }




      if (totalErrors > 0) {
        toast.warning(`Publicado em ${clientArray.length - totalErrors} de ${clientArray.length} clientes. ${totalPublished} doc(s) publicado(s), ${totalSkipped} já existiam, ${totalErrors} erro(s).`);
      } else {
        toast.success(`${totalPublished} documento(s) publicado(s) para ${clientArray.length} cliente(s)!${totalSkipped > 0 ? ` (${totalSkipped} já existiam)` : ''}`);
      }
      onOpenChange(false);
    } catch {
      toast.error('Erro ao publicar documentos no portal');
    } finally {
      setPublishing(false);
    }
  };

  const selectedClientsList = clients.filter(c => selectedClientIds.has(c.id));
  const totalSelected = selectedDocIds.size + selectedCompanyDocIds.size;

  const STEPS = [
    { label: 'Colaboradores', icon: Users },
    { label: 'Destino', icon: Building2 },
    { label: 'Documentos', icon: FileText },
    { label: 'Confirmar', icon: Check },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] max-h-[85vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Upload className="w-5 h-5 text-indigo-500" />
            Enviar Documentação ao Portal do Cliente
          </DialogTitle>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-3">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="flex items-center gap-1.5">
                  <div className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                    i === step ? 'bg-indigo-100 text-indigo-700' :
                    i < step ? 'bg-emerald-100 text-emerald-700' :
                    'bg-slate-100 text-slate-400'
                  )}>
                    {i < step ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                    <span className="hidden sm:inline">{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                </div>
              );
            })}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* ═══ STEP 0: COLABORADORES ═══ */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                <p className="text-sm font-medium text-indigo-800">
                  {selectedEmployees.length} colaborador(es) selecionado(s) com {allEmployeeDocs.length} documento(s)
                </p>
              </div>
              <div className="space-y-2">
                {selectedEmployees.map(emp => {
                  const docs = (emp.documents || []).filter((d: any) => d.url);
                  const expired = docs.filter((d: any) => getExpiryStatus(d.expiryDate) === 'expired').length;
                  return (
                    <div key={emp.id} className="flex items-center justify-between p-3 bg-white border rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-slate-800">{emp.name}</p>
                          <p className="text-xs text-slate-500">{emp.jobFunction || emp.specialty || emp.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{docs.length} docs</Badge>
                        {expired > 0 && (
                          <Badge className="bg-red-100 text-red-700 border border-red-200 text-xs gap-1">
                            <AlertTriangle className="w-3 h-3" /> {expired} vencido(s)
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ STEP 1: DESTINO (CLIENTES — MULTI SELECT) ═══ */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
                <p className="text-sm font-medium text-indigo-800">
                  Selecione um ou mais clientes que receberão os documentos no portal.
                  O mesmo colaborador pode ser enviado para múltiplos clientes.
                </p>
              </div>

              {/* Client search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar cliente..."
                  value={clientSearchTerm}
                  onChange={e => setClientSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Quick actions */}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setSelectedClientIds(new Set(clients.map(c => c.id)))}>
                  Selecionar Todos ({clients.length})
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedClientIds(new Set())}>
                  Limpar
                </Button>
                {selectedClientIds.size > 0 && (
                  <Badge className="bg-indigo-100 text-indigo-700 border border-indigo-200">
                    {selectedClientIds.size} selecionado(s)
                  </Badge>
                )}
              </div>

              {clients.length === 0 ? (
                <p className="text-xs text-amber-600 flex items-center gap-1 p-3">
                  <AlertTriangle className="w-3.5 h-3.5" /> Nenhum cliente com acesso ao portal.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                  {filteredClients.map(c => (
                    <label
                      key={c.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                        selectedClientIds.has(c.id)
                          ? 'border-indigo-400 bg-indigo-50/60 ring-1 ring-indigo-200'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedClientIds.has(c.id)}
                        onChange={() => toggleClient(c.id)}
                        className="rounded border-slate-300 text-indigo-500 focus:ring-indigo-500"
                      />
                      <div className="w-9 h-9 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {c.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-slate-800 truncate">{c.name}</p>
                        <p className="text-xs text-slate-500 truncate">
                          {c.company || c.email || ''}
                        </p>
                      </div>
                      {selectedClientIds.has(c.id) && (
                        <CheckCircle2 className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ═══ STEP 2: DOCUMENTOS ═══ */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Buscar documentos..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Quick actions */}
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => setSelectedDocIds(new Set(allEmployeeDocs.map(d => d.id)))}>
                  Selecionar Todos ({allEmployeeDocs.length})
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedDocIds(new Set())}>
                  Limpar Seleção
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
                  setSelectedDocIds(new Set(allEmployeeDocs.filter(d => d.expiryStatus !== 'expired').map(d => d.id)));
                }}>
                  Apenas Válidos
                </Button>
              </div>

              {/* Categories */}
              {Object.entries(DOC_CATEGORIES).map(([catKey, catConfig]) => {
                const catDocs = (docsByCategory[catKey] || []).filter((d: any) =>
                  !searchTerm || filteredDocs.some(fd => fd.id === d.id)
                );
                if (catDocs.length === 0) return null;
                const CatIcon = catConfig.icon;
                const allSelected = catDocs.every((d: any) => selectedDocIds.has(d.id));
                const someSelected = catDocs.some((d: any) => selectedDocIds.has(d.id));
                return (
                  <div key={catKey} className="border rounded-xl overflow-hidden">
                    <div
                      className={cn('flex items-center justify-between px-4 py-2.5 cursor-pointer hover:opacity-80', catConfig.color)}
                      onClick={() => selectAllInCategory(catKey)}
                    >
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={allSelected} readOnly
                          className="rounded border-slate-300" ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }} />
                        <CatIcon className="w-4 h-4" />
                        <span className="font-semibold text-sm">{catConfig.label}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">{catDocs.length}</Badge>
                    </div>
                    <div className="divide-y">
                      {catDocs.map((doc: any) => {
                        const badge = EXPIRY_BADGE[doc.expiryStatus];
                        return (
                          <label key={doc.id} className={cn(
                            'flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-slate-50 text-sm',
                            selectedDocIds.has(doc.id) && 'bg-indigo-50/50',
                            doc.expiryStatus === 'expired' && 'opacity-60',
                          )}>
                            <div className="flex items-center gap-3">
                              <input type="checkbox" checked={selectedDocIds.has(doc.id)} onChange={() => toggleDoc(doc.id)}
                                className="rounded border-slate-300 text-indigo-500 focus:ring-indigo-500" />
                              <div>
                                <p className="font-medium text-slate-700">{doc.employeeName}</p>
                                <p className="text-xs text-slate-500">{DOC_TYPE_LABELS[doc.type] || doc.name}
                                  {doc.referenceMonth && <span className="ml-1 text-blue-600">({doc.referenceMonth})</span>}
                                </p>
                              </div>
                            </div>
                            <Badge variant="outline" className={cn('text-[10px] border', badge.className)}>
                              {doc.expiryDate
                                ? `${badge.label} — ${new Date(doc.expiryDate).toLocaleDateString('pt-BR')}`
                                : badge.label}
                            </Badge>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Company documents */}
              {companyDocs.length > 0 && (
                <div className="border rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-amber-50 border-amber-200 text-amber-700">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      <span className="font-semibold text-sm">Documentos da Empresa — CND, Certidões</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{companyDocs.length}</Badge>
                  </div>
                  <div className="divide-y">
                    {companyDocs.map((doc: any) => {
                      const expiryStatus = getExpiryStatus(doc.expiryDate);
                      const badge = EXPIRY_BADGE[expiryStatus];
                      return (
                        <label key={doc.id} className={cn(
                          'flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-slate-50 text-sm',
                          selectedCompanyDocIds.has(doc.id) && 'bg-amber-50/50',
                        )}>
                          <div className="flex items-center gap-3">
                            <input type="checkbox" checked={selectedCompanyDocIds.has(doc.id)} onChange={() => toggleCompanyDoc(doc.id)}
                              className="rounded border-slate-300 text-amber-500 focus:ring-amber-500" />
                            <div>
                              <p className="font-medium text-slate-700">{doc.name}</p>
                              <p className="text-xs text-slate-500">{doc.documentGroup} {doc.fileName ? `— ${doc.fileName}` : ''}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className={cn('text-[10px] border', badge.className)}>
                            {doc.expiryDate
                              ? `${badge.label} — ${new Date(doc.expiryDate).toLocaleDateString('pt-BR')}`
                              : badge.label}
                          </Badge>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ═══ STEP 3: CONFIRMAÇÃO ═══ */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5">
                <h3 className="font-bold text-indigo-800 text-lg mb-3">Resumo do Envio</h3>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="bg-white/70 rounded-lg p-3">
                    <p className="text-slate-500 text-xs mb-1">Clientes Destino</p>
                    <p className="font-semibold text-slate-800 text-lg">{selectedClientIds.size}</p>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3">
                    <p className="text-slate-500 text-xs mb-1">Colaboradores</p>
                    <p className="font-semibold text-slate-800 text-lg">{selectedEmployees.length}</p>
                  </div>
                  <div className="bg-white/70 rounded-lg p-3">
                    <p className="text-slate-500 text-xs mb-1">Documentos</p>
                    <p className="font-semibold text-slate-800 text-lg">{totalSelected}</p>
                  </div>
                </div>
              </div>

              {/* Clients list */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-600">Clientes que receberão os documentos:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedClientsList.map(c => (
                    <Badge key={c.id} className="bg-indigo-100 text-indigo-700 border border-indigo-200 gap-1.5 py-1">
                      <Building2 className="w-3 h-3" />
                      {c.name}{c.company ? ` (${c.company})` : ''}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-600">Detalhamento dos Documentos:</p>
                {Object.entries(DOC_CATEGORIES).map(([catKey, catConfig]) => {
                  const count = (docsByCategory[catKey] || []).filter(d => selectedDocIds.has(d.id)).length;
                  if (count === 0) return null;
                  const CatIcon = catConfig.icon;
                  return (
                    <div key={catKey} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg text-sm">
                      <div className="flex items-center gap-2">
                        <CatIcon className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-700">{catConfig.label.split(' — ')[0]}</span>
                      </div>
                      <Badge variant="outline">{count} doc(s)</Badge>
                    </div>
                  );
                })}
                {selectedCompanyDocIds.size > 0 && (
                  <div className="flex items-center justify-between px-3 py-2 bg-amber-50 rounded-lg text-sm">
                    <div className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-amber-600" />
                      <span className="text-amber-800">Documentos da Empresa</span>
                    </div>
                    <Badge variant="outline">{selectedCompanyDocIds.size} doc(s)</Badge>
                  </div>
                )}
              </div>

              {/* Total calculation */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                <p className="text-sm text-emerald-700">
                  <strong>{totalSelected}</strong> documento(s) × <strong>{selectedClientIds.size}</strong> cliente(s) = <strong>{totalSelected * selectedClientIds.size}</strong> publicação(ões) no total
                </p>
              </div>

              {/* Warning for expired */}
              {allEmployeeDocs.some(d => selectedDocIds.has(d.id) && d.expiryStatus === 'expired') && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-red-800 text-sm">Atenção: documentos vencidos incluídos</p>
                    <p className="text-xs text-red-600 mt-1">
                      Alguns documentos selecionados estão vencidos. O cliente poderá visualizá-los, mas com indicação de vencimento.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with navigation */}
        <DialogFooter className="px-6 py-4 border-t bg-slate-50 flex items-center justify-between">
          <div>
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {step === 2 && (
              <span className="text-xs text-slate-500 mr-2">{totalSelected} selecionado(s)</span>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            {step < 3 ? (
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={step === 1 && selectedClientIds.size === 0}
                onClick={() => setStep(step + 1)}
              >
                Próximo <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                disabled={publishing || totalSelected === 0}
                onClick={handlePublish}
              >
                {publishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Publicando... ({publishProgress.current}/{publishProgress.total})
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Publicar para {selectedClientIds.size} Cliente(s)
                  </>
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
