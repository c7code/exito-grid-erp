import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Users, Loader2, FileText, Download, Search, ShieldCheck,
  Briefcase, AlertTriangle, CheckCircle2, ChevronDown, ChevronRight,
  Calendar, Building2, FolderOpen,
} from 'lucide-react';
import { api } from '@/api';
import { cn } from '@/lib/utils';

// ═══ CATEGORY CONFIG ═════════════════════════════════════════════════════════

const CATEGORY_CONFIG: Record<string, { label: string; icon: any; color: string; bgCard: string }> = {
  ssma: {
    label: 'SSMA',
    icon: ShieldCheck,
    color: 'text-emerald-600',
    bgCard: 'from-emerald-50 to-emerald-100/50 border-emerald-200',
  },
  trabalhista: {
    label: 'Trabalhista',
    icon: Briefcase,
    color: 'text-blue-600',
    bgCard: 'from-blue-50 to-blue-100/50 border-blue-200',
  },
  identificacao: {
    label: 'Identificação',
    icon: FileText,
    color: 'text-purple-600',
    bgCard: 'from-purple-50 to-purple-100/50 border-purple-200',
  },
  qualificacao: {
    label: 'Qualificação',
    icon: CheckCircle2,
    color: 'text-indigo-600',
    bgCard: 'from-indigo-50 to-indigo-100/50 border-indigo-200',
  },
};

function getExpiryStatus(date: string | null): 'valid' | 'expiring' | 'expired' | 'none' {
  if (!date) return 'none';
  const d = new Date(date);
  const now = new Date();
  const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diff < 0) return 'expired';
  if (diff < 30) return 'expiring';
  return 'valid';
}

const STATUS_COLORS = {
  valid: 'bg-emerald-100 text-emerald-700',
  expiring: 'bg-amber-100 text-amber-700',
  expired: 'bg-red-100 text-red-700',
  none: 'bg-slate-100 text-slate-500',
};

const STATUS_LABELS = {
  valid: 'Válido',
  expiring: 'Vencendo',
  expired: 'Vencido',
  none: 'Sem validade',
};

const STATUS_ICONS = {
  valid: CheckCircle2,
  expiring: AlertTriangle,
  expired: AlertTriangle,
  none: Calendar,
};

// ═══ COMPONENT ═══════════════════════════════════════════════════════════════

export default function ClientTeam() {
  const [employeeDocs, setEmployeeDocs] = useState<any[]>([]);
  const [companyDocs, setCompanyDocs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        const [empData, compData] = await Promise.all([
          api.getClientMyPublications('employee_doc'),
          api.getClientMyPublications('company_doc'),
        ]);

        const empItems = (Array.isArray(empData) ? empData : []).map((p: any) => ({
          ...p,
          employeeName: p.metadata?.employeeName || p.content?.employeeName || p.title?.split(' — ')[0] || 'Colaborador',
          documentType: p.metadata?.documentType || p.content?.name || 'Documento',
          documentCategory: p.metadata?.documentCategory || p.content?.documentCategory || 'ssma',
          fileName: p.metadata?.fileName || p.content?.name || p.title,
          url: p.metadata?.url || p.content?.url || null,
          expiryDate: p.metadata?.expiryDate || p.content?.expiryDate || null,
          referenceMonth: p.metadata?.referenceMonth || p.content?.referenceMonth || null,
        }));

        const compItems = (Array.isArray(compData) ? compData : []).map((p: any) => ({
          ...p,
          documentGroup: p.metadata?.documentGroup || 'other',
          fileName: p.metadata?.fileName || p.title,
          url: p.metadata?.url || p.content?.url || null,
          expiryDate: p.metadata?.expiryDate || p.content?.expiryDate || null,
        }));

        setEmployeeDocs(empItems);
        setCompanyDocs(compItems);

        // Auto-expand all employees
        const names = new Set(empItems.map((d: any) => d.employeeName));
        setExpandedEmployees(names);
      } catch { /* empty */ }
      finally { setIsLoading(false); }
    };
    load();
  }, []);

  // Group by employee then by category
  const groupedByEmployee = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    employeeDocs.forEach(doc => {
      const name = doc.employeeName;
      if (!grouped[name]) grouped[name] = [];
      grouped[name].push(doc);
    });
    return grouped;
  }, [employeeDocs]);

  // Filter
  const filteredEmployees = useMemo(() => {
    let entries = Object.entries(groupedByEmployee);
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      entries = entries.filter(([name, docs]) =>
        name.toLowerCase().includes(s) ||
        docs.some((d: any) => d.documentType.toLowerCase().includes(s))
      );
    }
    return entries;
  }, [groupedByEmployee, searchTerm]);

  // Stats
  const stats = useMemo(() => {
    const total = employeeDocs.length + companyDocs.length;
    const valid = employeeDocs.filter(d => getExpiryStatus(d.expiryDate) === 'valid').length;
    const expiring = employeeDocs.filter(d => getExpiryStatus(d.expiryDate) === 'expiring').length;
    const expired = employeeDocs.filter(d => getExpiryStatus(d.expiryDate) === 'expired').length;
    return { total, employees: Object.keys(groupedByEmployee).length, valid, expiring, expired };
  }, [employeeDocs, companyDocs, groupedByEmployee]);

  const toggleEmployee = (name: string) => {
    setExpandedEmployees(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-900">Equipe e Documentação</h1>
        <p className="text-slate-500">Documentos dos colaboradores e certidões da empresa vinculados às suas obras</p>
      </div>

      {/* ═══ STAT CARDS ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="border-none shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-4.5 h-4.5 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">{stats.employees}</p>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Colaboradores</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
              <FileText className="w-4.5 h-4.5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-800">{stats.total}</p>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Documentos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-emerald-600">{stats.valid}</p>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Válidos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4.5 h-4.5 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-amber-600">{stats.expiring}</p>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Vencendo</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-4.5 h-4.5 text-red-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-red-600">{stats.expired}</p>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Vencidos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══ FILTERS ═══ */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Buscar colaborador ou documento..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant={filterCategory === '' ? 'default' : 'outline'}
            onClick={() => setFilterCategory('')}
            className={cn(filterCategory === '' && 'bg-slate-800 text-white')}
          >
            Todos
          </Button>
          {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return (
              <Button
                key={key}
                size="sm"
                variant={filterCategory === key ? 'default' : 'outline'}
                onClick={() => setFilterCategory(filterCategory === key ? '' : key)}
                className={cn('gap-1.5', filterCategory === key && 'bg-slate-800 text-white')}
              >
                <Icon className="w-3.5 h-3.5" /> {cfg.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* ═══ EMPLOYEE DOCUMENTS ═══ */}
      {filteredEmployees.length === 0 && companyDocs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Nenhum documento disponível</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEmployees.map(([name, docs]) => {
            const isExpanded = expandedEmployees.has(name);
            const expired = docs.filter((d: any) => getExpiryStatus(d.expiryDate) === 'expired').length;
            const validCount = docs.filter((d: any) => getExpiryStatus(d.expiryDate) === 'valid').length;

            // Filter by category if active
            const displayDocs = filterCategory
              ? docs.filter((d: any) => d.documentCategory === filterCategory)
              : docs;

            if (displayDocs.length === 0) return null;

            // Group docs by category
            const docsByCategory: Record<string, any[]> = {};
            displayDocs.forEach((d: any) => {
              const cat = d.documentCategory || 'ssma';
              if (!docsByCategory[cat]) docsByCategory[cat] = [];
              docsByCategory[cat].push(d);
            });

            return (
              <Card key={name} className="border-none shadow-md overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => toggleEmployee(name)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500">{displayDocs.length} documento(s)</span>
                        {validCount > 0 && (
                          <Badge className="bg-emerald-100 text-emerald-700 text-[10px] border border-emerald-200 gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> {validCount}
                          </Badge>
                        )}
                        {expired > 0 && (
                          <Badge className="bg-red-100 text-red-700 text-[10px] border border-red-200 gap-0.5">
                            <AlertTriangle className="w-3 h-3" /> {expired} vencido(s)
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                </div>

                {isExpanded && (
                  <CardContent className="p-0">
                    {Object.entries(docsByCategory).map(([cat, catDocs]) => {
                      const catCfg = CATEGORY_CONFIG[cat] || CATEGORY_CONFIG.ssma;
                      const CatIcon = catCfg.icon;
                      return (
                        <div key={cat} className="border-t">
                          <div className={cn('flex items-center gap-2 px-5 py-2', catCfg.color, 'bg-gradient-to-r', catCfg.bgCard)}>
                            <CatIcon className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">{catCfg.label}</span>
                            <Badge variant="outline" className="text-[10px] ml-auto">{catDocs.length}</Badge>
                          </div>
                          <div className="divide-y divide-slate-100">
                            {catDocs.map((doc: any) => {
                              const status = getExpiryStatus(doc.expiryDate);
                              const StatusIcon = STATUS_ICONS[status];
                              return (
                                <div key={doc.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-slate-700 truncate">{doc.documentType}</p>
                                      <div className="flex items-center gap-2">
                                        <p className="text-xs text-slate-400 truncate">{doc.fileName}</p>
                                        {doc.referenceMonth && (
                                          <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-200">
                                            <Calendar className="w-3 h-3 mr-0.5" /> {doc.referenceMonth}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <Badge className={cn('text-[10px] gap-0.5', STATUS_COLORS[status])}>
                                      <StatusIcon className="w-3 h-3" />
                                      {doc.expiryDate
                                        ? `${STATUS_LABELS[status]} ${new Date(doc.expiryDate).toLocaleDateString('pt-BR')}`
                                        : STATUS_LABELS[status]}
                                    </Badge>
                                    {doc.url && (
                                      <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50" asChild>
                                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                                          <Download className="w-4 h-4" />
                                        </a>
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                )}
              </Card>
            );
          })}

          {/* ═══ COMPANY DOCUMENTS ═══ */}
          {companyDocs.length > 0 && (
            <Card className="border-none shadow-md overflow-hidden">
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
                <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white shadow-sm">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Documentos da Empresa</h3>
                  <p className="text-xs text-slate-500">CND, FGTS-CRF, certidões e documentação fiscal</p>
                </div>
              </div>
              <CardContent className="p-0 divide-y divide-slate-100">
                {companyDocs.map((doc: any) => {
                  const status = getExpiryStatus(doc.expiryDate);
                  const StatusIcon = STATUS_ICONS[status];
                  return (
                    <div key={doc.id} className="flex items-center justify-between px-5 py-3 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FolderOpen className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{doc.title || doc.fileName}</p>
                          <p className="text-xs text-slate-400">{doc.description || doc.documentGroup}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className={cn('text-[10px] gap-0.5', STATUS_COLORS[status])}>
                          <StatusIcon className="w-3 h-3" />
                          {doc.expiryDate
                            ? `${STATUS_LABELS[status]} ${new Date(doc.expiryDate).toLocaleDateString('pt-BR')}`
                            : STATUS_LABELS[status]}
                        </Badge>
                        {doc.url && (
                          <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-800 hover:bg-amber-50" asChild>
                            <a href={doc.url} target="_blank" rel="noopener noreferrer">
                              <Download className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
