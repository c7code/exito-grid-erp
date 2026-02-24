import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Plus,
    FileText,
    User,
    Globe,
    Briefcase,
    Building2,
    Mail,
    MapPin,
    CheckCircle2,
    Calendar,
    ExternalLink
} from 'lucide-react';
import type { Client } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ClientDetailViewerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    client: Client | null;
}

export function ClientDetailViewer({
    open,
    onOpenChange,
    client
}: ClientDetailViewerProps) {
    if (!client) return null;

    const categories = [
        { id: 'contract', name: 'Contratos / Propostas', icon: FileText, color: 'text-amber-500', bg: 'bg-amber-50' },
        { id: 'id', name: 'Identificação (RG/CPF/CNPJ)', icon: User, color: 'text-blue-500', bg: 'bg-blue-50' },
        { id: 'project', name: 'Projetos / Engenharia', icon: Globe, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { id: 'other', name: 'Outros Anexos', icon: Briefcase, color: 'text-slate-500', bg: 'bg-slate-50' },
    ];

    const getDocsByCategory = (type: string) => {
        return client.documents?.filter(doc => doc.type === type) || [];
    };

    const handleDownload = async (url: string, filename: string) => {
        try {
            toast.info('Iniciando download...');
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
            toast.success('Download concluído!');
        } catch (err) {
            window.open(url, '_blank');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden border-none shadow-2xl max-h-[90vh] flex flex-col">
                <DialogHeader className="p-8 bg-slate-900 text-white shrink-0 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <Building2 className="w-32 h-32" />
                    </div>
                    <div className="flex items-start gap-6 relative z-10">
                        <div className="w-16 h-16 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-900 font-bold text-2xl shadow-xl ring-4 ring-white/10">
                            {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <DialogTitle className="text-2xl font-bold">{client.name}</DialogTitle>
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-none px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                    Cliente Ativo
                                </Badge>
                            </div>
                            <DialogDescription className="text-slate-400 text-base">
                                {client.companyName || 'Pessoa Física'} • {client.document || 'Sem Documento'}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto bg-slate-50 p-8 space-y-10">
                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex items-center gap-2 text-slate-400 mb-3">
                                <Mail className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Contato Principal</span>
                            </div>
                            <p className="text-sm font-bold text-slate-700">{client.email}</p>
                            <p className="text-xs text-slate-500 mt-1">{client.phone || client.whatsapp || 'Sem telefone'}</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex items-center gap-2 text-slate-400 mb-3">
                                <MapPin className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Localização</span>
                            </div>
                            <p className="text-sm font-bold text-slate-700">{client.city}, {client.state}</p>
                            <p className="text-xs text-slate-500 mt-1 truncate">{client.address}, {client.number}</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex items-center gap-2 text-slate-400 mb-3">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Status do Portal</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={cn("w-2 h-2 rounded-full", client.hasPortalAccess ? "bg-emerald-500" : "bg-slate-300")} />
                                <p className="text-sm font-bold text-slate-700">{client.hasPortalAccess ? 'Acesso Liberado' : 'Sem Acesso'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Documents */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                            <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-amber-500" />
                                <h3 className="font-bold text-slate-800 text-lg uppercase tracking-tight">Central de Documentos</h3>
                            </div>
                            <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold border-slate-200 hover:bg-slate-100">
                                <Plus className="w-3.5 h-3.5 mr-1.5" /> Adicionar Novo
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {categories.map(category => {
                                const docs = getDocsByCategory(category.id);
                                return (
                                    <div key={category.id} className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={cn("p-1.5 rounded-lg", category.bg)}>
                                                    <category.icon className={cn("w-4 h-4", category.color)} />
                                                </div>
                                                <h4 className="font-bold text-slate-600 text-xs uppercase tracking-wider">{category.name}</h4>
                                            </div>
                                            <Badge variant="secondary" className="text-[9px] font-bold h-4 bg-slate-200 text-slate-600">
                                                {docs.length}
                                            </Badge>
                                        </div>

                                        <div className="space-y-2">
                                            {docs.length > 0 ? docs.map((doc: any) => (
                                                <div key={doc.id} className="group flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-amber-400 transition-all duration-200 shadow-sm">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-500 transition-colors">
                                                            <FileText className="w-5 h-5" />
                                                        </div>
                                                        <div className="overflow-hidden">
                                                            <p className="text-xs font-bold text-slate-700 truncate">{doc.name}</p>
                                                            {doc.expiryDate && (
                                                                <span className="flex items-center gap-1 text-[9px] text-slate-400 mt-0.5">
                                                                    <Calendar className="w-2.5 h-2.5" />
                                                                    Venc: {new Date(doc.expiryDate).toLocaleDateString('pt-BR')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 w-8 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-full"
                                                        onClick={() => handleDownload(doc.url, doc.name)}
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            )) : (
                                                <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-100/30">
                                                    <p className="text-[10px] text-slate-400 italic">Vazio</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-white border-t flex justify-end shrink-0">
                    <Button
                        variant="secondary"
                        onClick={() => onOpenChange(false)}
                        className="font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
                    >
                        Fechar Central
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
