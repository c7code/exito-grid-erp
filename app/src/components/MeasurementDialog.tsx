import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calculator, AlertCircle, FileText } from 'lucide-react';
import { api } from '@/api';
import { toast } from 'sonner';

interface MeasurementDialogProps {
    isOpen: boolean;
    onClose: () => void;
    workId: string;
    onSuccess?: () => void;
}

export function MeasurementDialog({ isOpen, onClose, workId, onSuccess }: MeasurementDialogProps) {
    const [loading, setLoading] = useState(false);
    const [measurement, setMeasurement] = useState<any>(null);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        if (isOpen && workId) {
            checkExistingDraft();
        }
    }, [isOpen, workId]);

    const checkExistingDraft = async () => {
        setLoading(true);
        try {
            const measurements = await api.getMeasurements(workId);
            const draft = measurements.find((m: any) => m.status === 'draft');
            if (draft) {
                setMeasurement(draft);
            } else {
                setMeasurement(null);
            }
        } catch (error) {
            console.error('Erro ao buscar medições:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        setCreating(true);
        try {
            const newMeasurement = await api.createMeasurement({ workId });
            const calculated = await api.calculateMeasurement(newMeasurement.id);
            setMeasurement(calculated);
            toast.success('Rascunho de medição criado com sucesso!');
        } catch (error) {
            toast.error('Erro ao criar medição.');
        } finally {
            setCreating(false);
        }
    };

    const handleApprove = async () => {
        if (!measurement) return;
        setLoading(true);
        try {
            await api.approveMeasurement(measurement.id);
            toast.success('Medição aprovada e conta a receber gerada!');
            onSuccess?.();
            onClose();
        } catch (error) {
            toast.error('Erro ao aprovar medição.');
        } finally {
            setLoading(false);
        }
    };

    const totalValue = measurement?.totalAmount || 0;
    const retention = measurement?.retentionAmount || 0;
    const netValue = measurement?.netAmount || 0;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-6 border-b">
                    <DialogTitle className="flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-amber-500" />
                        Nova Medição de Obra
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {!measurement ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center">
                                <FileText className="w-8 h-8 text-amber-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold">Iniciar nova medição</h3>
                                <p className="text-sm text-slate-500 max-w-sm">
                                    O sistema irá capturar o progresso atual de todas as tarefas da obra para calcular o valor a ser faturado.
                                </p>
                            </div>
                            <Button
                                onClick={handleCreate}
                                disabled={creating}
                                className="bg-amber-500 hover:bg-amber-600 text-slate-900"
                            >
                                {creating ? 'Processando...' : 'Gerar Medição Baseada no Progresso'}
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 bg-slate-50 rounded-lg border">
                                    <p className="text-xs text-slate-500 uppercase font-bold">Valor Bruto</p>
                                    <p className="text-lg font-bold">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                </div>
                                <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                                    <p className="text-xs text-red-500 uppercase font-bold">Retenção (5%)</p>
                                    <p className="text-lg font-bold text-red-600">- R$ {retention.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                </div>
                                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                                    <p className="text-xs text-emerald-500 uppercase font-bold">Valor Líquido</p>
                                    <p className="text-xl font-black text-emerald-700">R$ {netValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <div className="w-1 h-4 bg-amber-500 rounded-full" />
                                    Detalhamento de Tarefas
                                </h4>
                                <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-slate-50">
                                            <TableRow>
                                                <TableHead>Tarefa</TableHead>
                                                <TableHead className="text-center">Peso</TableHead>
                                                <TableHead className="text-center">Progresso</TableHead>
                                                <TableHead className="text-right">Valor Calculado</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {measurement.items?.map((item: any) => (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-medium text-xs">{item.task?.title || 'Tarefa s/ Nome'}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="outline" className="font-mono">{item.weightPercentage}%</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-amber-500"
                                                                    style={{ width: `${item.currentProgress}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-[10px] font-bold">{item.currentProgress}%</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono text-xs">
                                                        R$ {Number(item.calculatedValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex gap-3">
                                <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    Ao aprovar esta medição, o sistema irá atualizar o status para <strong>Aprovado</strong> e gerará automaticamente um título no Contas a Receber com vencimento em 15 dias.
                                </p>
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter className="p-6 border-t bg-slate-50/50">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>
                        Cancelar
                    </Button>
                    {measurement && (
                        <Button
                            onClick={handleApprove}
                            disabled={loading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {loading ? 'Processando...' : 'Aprovar e Gerar Faturamento'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
