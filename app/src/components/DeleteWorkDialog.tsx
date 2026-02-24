import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';

interface DeleteWorkDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    work: any;
    onWorkDeleted: () => void;
}

export default function DeleteWorkDialog({ open, onOpenChange, work, onWorkDeleted }: DeleteWorkDialogProps) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!work) return;

        setLoading(true);
        try {
            await api.deleteWork(work.id);
            toast.success('Obra excluída com sucesso!');
            onOpenChange(false);
            onWorkDeleted();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Erro ao excluir obra.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-5 h-5" />
                        Excluir Obra
                    </DialogTitle>
                    <DialogDescription>
                        Tem certeza que deseja excluir a obra <strong className="text-slate-900">"{work?.title}"</strong>?
                        Esta ação não pode ser desfeita.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Excluir
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
