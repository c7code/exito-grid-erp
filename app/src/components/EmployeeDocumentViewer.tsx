import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Shield,
    Heart,
    User,
    ExternalLink,
    FileText,
    Calendar,
    Eye,
    EyeOff
} from 'lucide-react';
import type { Employee } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface EmployeeDocumentViewerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employee: Employee | null;
}

export function EmployeeDocumentViewer({
    open,
    onOpenChange,
    employee
}: EmployeeDocumentViewerProps) {
    if (!employee) return null;

    const categories = [
        { id: 'identification', name: 'Identificação', icon: User, color: 'text-blue-500', bg: 'bg-blue-50' },
        { id: 'health', name: 'Saúde (ASO)', icon: Heart, color: 'text-red-500', bg: 'bg-red-50' },
        { id: 'safety', name: 'Segurança (NRs)', icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        { id: 'other', name: 'Outros', icon: FileText, color: 'text-slate-500', bg: 'bg-slate-50' },
    ];

    const getDocsByCategory = (type: string) => {
        return employee.documents?.filter(doc => doc.type === type) || [];
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
            console.error(err);
            window.open(url, '_blank');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl max-h-[85vh] flex flex-col">
                <DialogHeader className="p-6 bg-slate-900 text-white shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-slate-900 font-bold text-xl ring-4 ring-white/10 shadow-lg">
                            {employee.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold">{employee.name}</DialogTitle>
                            <DialogDescription className="text-slate-400">
                                Visualização de documentos vinculados ao colaborador.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-8">
                    {categories.map(category => {
                        const docs = getDocsByCategory(category.id);
                        return (
                            <div key={category.id} className="space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={cn("p-1.5 rounded-lg", category.bg)}>
                                            <category.icon className={cn("w-4 h-4", category.color)} />
                                        </div>
                                        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">{category.name}</h3>
                                    </div>
                                    <Badge variant="secondary" className="text-[10px] font-bold">
                                        {docs.length} arquivo(s)
                                    </Badge>
                                </div>

                                {docs.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-2">
                                        {docs.map(doc => (
                                            <div key={doc.id} className="group flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-amber-400 hover:shadow-md transition-all">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-700 truncate max-w-[250px]">{doc.name}</p>
                                                        <div className="flex items-center gap-4 mt-1">
                                                            <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                                                                <Calendar className="w-3 h-3" />
                                                                Emissão: {doc.issueDate ? new Date(doc.issueDate).toLocaleDateString('pt-BR') : 'Não informado'}
                                                            </span>
                                                            <span className={cn(
                                                                "flex items-center gap-1 text-[10px] font-bold",
                                                                doc.expiryDate ? (new Date(doc.expiryDate) < new Date() ? "text-red-500" : "text-amber-600") : "text-slate-400"
                                                            )}>
                                                                <Calendar className="w-3 h-3" />
                                                                Vencimento: {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString('pt-BR') : 'Sem prazo'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-1.5">
                                                            <span className="flex items-center gap-1 text-[10px] font-bold">
                                                                {doc.clientVisible ? (
                                                                    <span className="text-emerald-600 flex items-center gap-1"><Eye className="w-3 h-3" /> Visível ao Cliente</span>
                                                                ) : (
                                                                    <span className="text-slate-400 flex items-center gap-1"><EyeOff className="w-3 h-3" /> Privado</span>
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold h-8 text-[11px]"
                                                    onClick={() => handleDownload(doc.url, doc.name)}
                                                >
                                                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                                    Baixar
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-4 text-center rounded-xl bg-slate-100/50 border border-dashed text-slate-400 text-xs italic">
                                        Nenhum documento anexado nesta categoria.
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="p-4 bg-white border-t flex justify-end shrink-0">
                    <Button
                        variant="secondary"
                        onClick={() => onOpenChange(false)}
                        className="font-bold text-slate-600"
                    >
                        Fechar Visualização
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
