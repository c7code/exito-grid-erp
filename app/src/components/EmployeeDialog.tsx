import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Loader2,
    CheckCircle2,
    Plus,
    X,
    Shield,
    Heart,
    User,
    Eye,
    EyeOff,
    ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';
import type { Employee, EmployeeRole, EmployeeDocumentType } from '@/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface EmployeeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    employee?: Employee;
}

export function EmployeeDialog({
    open,
    onOpenChange,
    onSuccess,
    employee
}: EmployeeDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'operational' as EmployeeRole,
        specialty: '',
        status: 'active' as 'active' | 'inactive',
    });

    const [files, setFiles] = useState<{ file: File; type: EmployeeDocumentType; clientVisible: boolean; issueDate?: string; expiryDate?: string }[]>([]);

    useEffect(() => {
        if (open) {
            if (employee) {
                setFormData({
                    name: employee.name,
                    email: employee.email,
                    phone: employee.phone || '',
                    role: employee.role,
                    specialty: employee.specialty || '',
                    status: employee.status,
                });
            } else {
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    role: 'operational',
                    specialty: '',
                    status: 'active',
                });
            }
            setFiles([]);
        }
    }, [open, employee]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: EmployeeDocumentType) => {
        if (e.target.files) {
            const now = new Date().toISOString().split('T')[0];
            const newFiles = Array.from(e.target.files).map(file => ({
                file,
                type,
                clientVisible: type === 'safety' || type === 'health',
                issueDate: now,
                expiryDate: '',
            }));
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const updateFileData = (index: number, key: string, value: any) => {
        setFiles(prev => prev.map((f, i) => i === index ? { ...f, [key]: value } : f));
    }

    const toggleVisibility = (index: number) => {
        updateFileData(index, 'clientVisible', !files[index].clientVisible);
    }

    const handleUpdateDoc = async (docId: string, data: any) => {
        try {
            await api.updateEmployeeDocument(docId, data);
            toast.success('Documento atualizado');
            onSuccess();
        } catch (error) {
            toast.error('Erro ao atualizar documento');
        }
    }

    const handleRemoveDoc = async (docId: string) => {
        if (!confirm('Deseja remover este documento?')) return;
        try {
            await api.removeEmployeeDocument(docId);
            toast.success('Documento removido');
            onSuccess();
        } catch (error) {
            toast.error('Erro ao remover documento');
        }
    }

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email) {
            toast.error('Preencha os campos obrigatórios');
            return;
        }

        try {
            setLoading(true);
            let savedEmployee;

            if (employee) {
                savedEmployee = await api.updateEmployee(employee.id, formData);
                toast.success('Funcionário atualizado!');
            } else {
                savedEmployee = await api.createEmployee(formData);
                toast.success('Funcionário cadastrado!');
            }

            // Handle file uploads
            if (files.length > 0 && savedEmployee?.id) {
                for (const item of files) {
                    // Mocking the upload to Supabase Storage - in real flow we'd use api.uploadDocuments
                    const mockUrl = `https://[PROJECT_ID].supabase.co/storage/v1/object/public/employee-vault/${item.file.name}`;

                    await api.addEmployeeDocument(savedEmployee.id, {
                        name: item.file.name,
                        url: mockUrl,
                        type: item.type,
                        clientVisible: item.clientVisible,
                        issueDate: item.issueDate || null,
                        expiryDate: item.expiryDate || null
                    });
                }
            }

            onSuccess();
            onOpenChange(false);
        } catch (err) {
            console.error(err);
            toast.error('Erro ao salvar funcionário');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden border-none shadow-2xl max-h-[90vh] flex flex-col">
                <DialogHeader className="p-6 bg-slate-900 text-white shrink-0">
                    <DialogTitle className="text-xl font-bold flex items-center gap-2">
                        {employee ? <User className="w-5 h-5 text-amber-500" /> : <Plus className="w-5 h-5 text-amber-500" />}
                        {employee ? 'Editar Funcionário' : 'Novo Funcionário'}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Gerencie as informações pessoais, cargos e documentação técnica.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase">Nome Completo *</Label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="bg-white"
                                placeholder="Ex: João Silva"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase">E-mail Corporativo *</Label>
                            <Input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                className="bg-white"
                                placeholder="joao.silva@empresa.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase">Telefone / WhatsApp</Label>
                            <Input
                                value={formData.phone}
                                onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                className="bg-white"
                                placeholder="(11) 99999-9999"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase">Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={val => setFormData(prev => ({ ...prev, status: val as any }))}
                            >
                                <SelectTrigger className="bg-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Ativo</SelectItem>
                                    <SelectItem value="inactive">Inativo</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 p-4 bg-white border rounded-xl shadow-sm">
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase">Função / Cargo</Label>
                            <Select
                                value={formData.role}
                                onValueChange={val => setFormData(prev => ({ ...prev, role: val as EmployeeRole }))}
                            >
                                <SelectTrigger className="bg-slate-50 border-none font-medium">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="administrative">Administrativo</SelectItem>
                                    <SelectItem value="operational">Operacional</SelectItem>
                                    <SelectItem value="engineering">Engenharia</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-slate-500 uppercase">Especialidade (CREA/CFT)</Label>
                            <Input
                                value={formData.specialty}
                                onChange={e => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
                                className="bg-slate-50 border-none"
                                placeholder="Ex: Engenheiro Eletricista"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <Shield className="w-4 h-4 text-amber-500" />
                            Documentação Técnica e Segurança
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="p-3 border-2 border-dashed rounded-xl flex flex-col items-center gap-2 hover:bg-white hover:border-amber-300 transition-all cursor-pointer relative group">
                                <User className="w-6 h-6 text-slate-400 group-hover:text-amber-500" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Identidade (RG/CPF)</span>
                                <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileChange(e, 'identification')} />
                            </div>
                            <div className="p-3 border-2 border-dashed rounded-xl flex flex-col items-center gap-2 hover:bg-white hover:border-amber-300 transition-all cursor-pointer relative group">
                                <Heart className="w-6 h-6 text-slate-400 group-hover:text-red-500" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Saúde (ASO)</span>
                                <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileChange(e, 'health')} />
                            </div>
                            <div className="p-3 border-2 border-dashed rounded-xl flex flex-col items-center gap-2 hover:bg-white hover:border-amber-300 transition-all cursor-pointer relative group">
                                <Shield className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Segurança (NRs)</span>
                                <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileChange(e, 'safety')} />
                            </div>
                        </div>

                        {/* Documentos Existentes */}
                        {employee?.documents && employee.documents.length > 0 && (
                            <div className="space-y-3">
                                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-l-2 border-amber-500 pl-2">Documentos Cadastrados</Label>
                                <div className="grid grid-cols-1 gap-3">
                                    {employee.documents.map((doc) => (
                                        <div key={doc.id} className="flex flex-col gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-sm group">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-lg flex items-center justify-center bg-slate-50",
                                                        doc.type === 'identification' ? "text-blue-600" :
                                                            doc.type === 'health' ? "text-red-600" :
                                                                "text-emerald-600"
                                                    )}>
                                                        {doc.type === 'identification' ? <User className="w-5 h-5" /> :
                                                            doc.type === 'health' ? <Heart className="w-5 h-5" /> :
                                                                <Shield className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-700 truncate max-w-[200px]">{doc.name}</p>
                                                        <Badge variant="secondary" className="text-[9px] uppercase h-4 px-1 leading-none bg-slate-100 text-slate-500">
                                                            {doc.type}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-amber-500"
                                                        onClick={() => handleDownload(doc.url, doc.name)}
                                                        title="Baixar Arquivo"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-red-500"
                                                        onClick={() => handleRemoveDoc(doc.id)}
                                                        title="Remover Documento"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[9px] font-bold text-slate-400 uppercase">Data de Entrada</label>
                                                    <input
                                                        type="date"
                                                        defaultValue={doc.issueDate ? new Date(doc.issueDate).toISOString().split('T')[0] : ''}
                                                        onBlur={e => handleUpdateDoc(doc.id, { issueDate: e.target.value })}
                                                        className="text-[11px] bg-slate-50 border border-slate-200 rounded px-2 h-7 focus:outline-amber-500 font-medium"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[9px] font-bold text-slate-400 uppercase">Vencimento</label>
                                                    <input
                                                        type="date"
                                                        defaultValue={doc.expiryDate ? new Date(doc.expiryDate).toISOString().split('T')[0] : ''}
                                                        onBlur={e => handleUpdateDoc(doc.id, { expiryDate: e.target.value })}
                                                        className="text-[11px] bg-slate-50 border border-slate-200 rounded px-2 h-7 focus:outline-amber-500 font-medium"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {files.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase">Arquivos para Upload</Label>
                                <div className="grid grid-cols-1 gap-2">
                                    {files.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 bg-white border rounded-lg group">
                                            <div className="flex items-center gap-2">
                                                <div className={cn(
                                                    "w-8 h-8 rounded flex items-center justify-center",
                                                    item.type === 'identification' ? "bg-slate-100 text-slate-600" :
                                                        item.type === 'health' ? "bg-red-50 text-red-600" :
                                                            "bg-blue-50 text-blue-600"
                                                )}>
                                                    {item.type === 'identification' ? <User className="w-4 h-4" /> :
                                                        item.type === 'health' ? <Heart className="w-4 h-4" /> :
                                                            <Shield className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-700 truncate max-w-[140px]">{item.file.name}</p>
                                                    <Badge variant="outline" className="text-[9px] uppercase h-4 px-1 leading-none">
                                                        {item.type}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[8px] font-bold text-slate-400 uppercase">Emissão</label>
                                                    <input
                                                        type="date"
                                                        value={item.issueDate}
                                                        onChange={e => updateFileData(idx, 'issueDate', e.target.value)}
                                                        className="text-[10px] bg-slate-50 border rounded px-1 h-6 focus:outline-amber-500"
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[8px] font-bold text-slate-400 uppercase">Vencimento</label>
                                                    <input
                                                        type="date"
                                                        value={item.expiryDate}
                                                        onChange={e => updateFileData(idx, 'expiryDate', e.target.value)}
                                                        className="text-[10px] bg-slate-50 border rounded px-1 h-6 focus:outline-amber-500"
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleVisibility(idx)}
                                                    className={cn(
                                                        "p-1.5 rounded-full transition-colors",
                                                        item.clientVisible ? "text-amber-500 bg-amber-50" : "text-slate-300 bg-slate-50"
                                                    )}
                                                    title={item.clientVisible ? "Visível para o cliente" : "Privado (Admin apenas)"}
                                                >
                                                    {item.clientVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                                </button>
                                                <button type="button" onClick={() => removeFile(idx)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors">
                                                    <X className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </form>

                <DialogFooter className="p-4 bg-white border-t gap-3 shrink-0">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button
                        className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold shadow-lg shadow-amber-100"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin text-slate-900" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                        {employee ? 'Salvar Alterações' : 'Contratar Funcionário'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
