import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';

interface WorkProgressDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    work: any;
    onProgressUpdated: () => void;
}

export default function WorkProgressDialog({ open, onOpenChange, work, onProgressUpdated }: WorkProgressDialogProps) {
    const [loading, setLoading] = useState(false);
    const [description, setDescription] = useState('');
    const [progress, setProgress] = useState(work?.progress || 0);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!work || !description.trim()) {
            toast.error('Preencha a descrição da atualização.');
            return;
        }

        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('description', description);
            formData.append('progress', String(progress));
            if (imageFile) {
                formData.append('image', imageFile);
            }

            await api.createWorkUpdate(work.id, formData);
            toast.success('Atualização registrada com sucesso!');
            setDescription('');
            setProgress(work.progress || 0);
            setImageFile(null);
            setImagePreview(null);
            onOpenChange(false);
            onProgressUpdated();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Erro ao registrar atualização.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Atualizar Progresso</DialogTitle>
                    <DialogDescription>
                        Registre a evolução da obra "{work?.title}". O cliente poderá acompanhar estas atualizações.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-3">
                        <Label>Progresso: {progress}%</Label>
                        <Slider
                            value={[progress]}
                            onValueChange={(vals) => setProgress(vals[0])}
                            max={100}
                            step={5}
                            className="py-2"
                        />
                        <div className="flex justify-between text-xs text-slate-400">
                            <span>0%</span>
                            <span>50%</span>
                            <span>100%</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Descrição da Atualização *</Label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Descreva o que foi realizado nesta etapa..."
                            rows={3}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Foto do Progresso</Label>
                        {imagePreview ? (
                            <div className="relative">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-48 object-cover rounded-lg border"
                                />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 h-8 w-8"
                                    onClick={removeImage}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-amber-400 hover:bg-amber-50/50 transition-colors">
                                <ImagePlus className="w-8 h-8 text-slate-400 mb-2" />
                                <span className="text-sm text-slate-500">Clique para anexar uma foto</span>
                                <Input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageChange}
                                />
                            </label>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-slate-900" disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Registrar Atualização
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
