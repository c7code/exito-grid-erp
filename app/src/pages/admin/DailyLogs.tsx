import { useState, useEffect } from 'react';
import { api } from '@/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sun,
    Cloud,
    CloudRain,
    CloudLightning,
    Wind,
    CloudFog,
    Plus,
    Calendar,
    Users,
    FileText,
    CheckCircle,
    Loader2,
    Search,
    ClipboardList,
    Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const weatherIcons: Record<string, any> = {
    sunny: Sun,
    cloudy: Cloud,
    rainy: CloudRain,
    stormy: CloudLightning,
    windy: Wind,
    foggy: CloudFog,
};

const weatherLabels: Record<string, string> = {
    sunny: 'Ensolarado',
    cloudy: 'Nublado',
    rainy: 'Chuvoso',
    stormy: 'Tempestade',
    windy: 'Ventoso',
    foggy: 'Neblina',
};

export default function DailyLogs() {
    const [logs, setLogs] = useState<any[]>([]);
    const [works, setWorks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterWork, setFilterWork] = useState('');
    const [search, setSearch] = useState('');
    const [showDialog, setShowDialog] = useState(false);
    const [showViewDialog, setShowViewDialog] = useState(false);
    const [selectedLog, setSelectedLog] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        date: format(new Date(), 'yyyy-MM-dd'),
        workId: '',
        weatherMorning: 'sunny',
        weatherAfternoon: 'sunny',
        workersPresent: 0,
        workersAbsent: 0,
        activitiesPerformed: '',
        activitiesPlanned: '',
        occurrences: '',
        safetyNotes: '',
        observations: '',
        startTime: '07:00',
        endTime: '17:00',
        workedOvertime: false,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [logsData, worksData] = await Promise.all([
                api.getDailyLogs(filterWork || undefined),
                api.getWorks(),
            ]);
            setLogs(Array.isArray(logsData) ? logsData : []);
            const w = Array.isArray(worksData) ? worksData : (worksData?.data ?? []);
            setWorks(w);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [filterWork]);

    const handleSubmit = async () => {
        if (!formData.workId) {
            toast.error('Selecione uma obra');
            return;
        }
        setSaving(true);
        try {
            await api.createDailyLog(formData);
            toast.success('Diário de obra registrado!');
            setShowDialog(false);
            resetForm();
            loadData();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Erro ao registrar');
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setFormData({
            date: format(new Date(), 'yyyy-MM-dd'),
            workId: '',
            weatherMorning: 'sunny',
            weatherAfternoon: 'sunny',
            workersPresent: 0,
            workersAbsent: 0,
            activitiesPerformed: '',
            activitiesPlanned: '',
            occurrences: '',
            safetyNotes: '',
            observations: '',
            startTime: '07:00',
            endTime: '17:00',
            workedOvertime: false,
        });
    };

    const filteredLogs = logs.filter(log => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            log.work?.title?.toLowerCase().includes(s) ||
            log.activitiesPerformed?.toLowerCase().includes(s) ||
            log.occurrences?.toLowerCase().includes(s)
        );
    });

    const WeatherIcon = ({ type }: { type: string }) => {
        const Icon = weatherIcons[type] || Sun;
        return <Icon className="w-4 h-4" />;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <ClipboardList className="w-7 h-7 text-amber-500" />
                        Diário de Obra
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        Registro diário de atividades, clima, equipe e ocorrências
                    </p>
                </div>
                <Button
                    onClick={() => setShowDialog(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold shadow-lg"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Registro
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        placeholder="Buscar por obra, atividades..."
                        className="pl-10"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <Select value={filterWork} onValueChange={setFilterWork}>
                    <SelectTrigger className="w-[250px]">
                        <SelectValue placeholder="Todas as obras" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todas as obras</SelectItem>
                        {works.map((w: any) => (
                            <SelectItem key={w.id} value={w.id}>{w.title}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border p-4">
                    <p className="text-xs text-slate-500 uppercase font-bold">Total Registros</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{filteredLogs.length}</p>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <p className="text-xs text-slate-500 uppercase font-bold">Dias com Chuva</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                        {filteredLogs.filter(l => l.weatherMorning === 'rainy' || l.weatherAfternoon === 'rainy').length}
                    </p>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <p className="text-xs text-slate-500 uppercase font-bold">Média Trabalhadores/Dia</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                        {filteredLogs.length > 0
                            ? Math.round(filteredLogs.reduce((s, l) => s + (l.workersPresent || 0), 0) / filteredLogs.length)
                            : 0}
                    </p>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <p className="text-xs text-slate-500 uppercase font-bold">Com Ocorrências</p>
                    <p className="text-2xl font-bold text-orange-600 mt-1">
                        {filteredLogs.filter(l => l.occurrences).length}
                    </p>
                </div>
            </div>

            {/* Logs List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                </div>
            ) : filteredLogs.length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                    <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">Nenhum registro encontrado</p>
                    <p className="text-sm">Clique em "Novo Registro" para começar</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredLogs.map((log) => (
                        <div
                            key={log.id}
                            className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => { setSelectedLog(log); setShowViewDialog(true); }}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {log.date ? format(new Date(log.date), "dd/MM/yyyy (EEEE)", { locale: ptBR }) : '-'}
                                        </Badge>
                                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                            {log.work?.title || 'Sem obra'}
                                        </Badge>
                                        {log.isSigned && (
                                            <Badge className="bg-green-100 text-green-700 border-green-200">
                                                <CheckCircle className="w-3 h-3 mr-1" /> Assinado
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-6 text-sm text-slate-600">
                                        <span className="flex items-center gap-1.5">
                                            <WeatherIcon type={log.weatherMorning} />
                                            <span className="text-xs text-slate-400">Manhã</span>
                                            {weatherLabels[log.weatherMorning]}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <WeatherIcon type={log.weatherAfternoon} />
                                            <span className="text-xs text-slate-400">Tarde</span>
                                            {weatherLabels[log.weatherAfternoon]}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Users className="w-4 h-4 text-green-500" />
                                            {log.workersPresent} presentes
                                        </span>
                                    </div>

                                    {log.activitiesPerformed && (
                                        <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                                            <FileText className="w-3.5 h-3.5 inline mr-1" />
                                            {log.activitiesPerformed}
                                        </p>
                                    )}
                                </div>
                                <Button variant="ghost" size="icon" className="shrink-0">
                                    <Eye className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* New Log Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-amber-500" />
                            Novo Registro — Diário de Obra
                        </DialogTitle>
                        <DialogDescription>
                            Registre as informações do dia de trabalho na obra.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 mt-2">
                        {/* Date + Work */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Data *</Label>
                                <Input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Obra *</Label>
                                <Select value={formData.workId} onValueChange={(v) => setFormData({ ...formData, workId: v })}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a obra" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {works.map((w: any) => (
                                            <SelectItem key={w.id} value={w.id}>{w.title}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Weather */}
                        <div className="space-y-2">
                            <Label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Condições Climáticas</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs">Manhã</Label>
                                    <Select value={formData.weatherMorning} onValueChange={(v) => setFormData({ ...formData, weatherMorning: v })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(weatherLabels).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-xs">Tarde</Label>
                                    <Select value={formData.weatherAfternoon} onValueChange={(v) => setFormData({ ...formData, weatherAfternoon: v })}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(weatherLabels).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>{label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Workforce */}
                        <div className="space-y-2">
                            <Label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Mão de Obra</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-xs">Presentes</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={formData.workersPresent}
                                        onChange={(e) => setFormData({ ...formData, workersPresent: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Ausentes</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={formData.workersAbsent}
                                        onChange={(e) => setFormData({ ...formData, workersAbsent: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Work hours */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-xs">Hora Início</Label>
                                <Input
                                    type="time"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label className="text-xs">Hora Fim</Label>
                                <Input
                                    type="time"
                                    value={formData.endTime}
                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Activities */}
                        <div>
                            <Label>Atividades Realizadas</Label>
                            <Textarea
                                rows={3}
                                placeholder="Descreva as atividades executadas no dia..."
                                value={formData.activitiesPerformed}
                                onChange={(e) => setFormData({ ...formData, activitiesPerformed: e.target.value })}
                            />
                        </div>

                        <div>
                            <Label>Atividades Previstas para Amanhã</Label>
                            <Textarea
                                rows={2}
                                placeholder="Atividades planejadas para o próximo dia..."
                                value={formData.activitiesPlanned}
                                onChange={(e) => setFormData({ ...formData, activitiesPlanned: e.target.value })}
                            />
                        </div>

                        {/* Occurrences */}
                        <div>
                            <Label>Ocorrências / Incidentes</Label>
                            <Textarea
                                rows={2}
                                placeholder="Registre qualquer ocorrência, acidente, parada..."
                                value={formData.occurrences}
                                onChange={(e) => setFormData({ ...formData, occurrences: e.target.value })}
                                className="border-orange-200 focus:border-orange-400"
                            />
                        </div>

                        <div>
                            <Label>Notas de Segurança</Label>
                            <Textarea
                                rows={2}
                                placeholder="Observações sobre segurança do trabalho (NR-10, NR-35)..."
                                value={formData.safetyNotes}
                                onChange={(e) => setFormData({ ...formData, safetyNotes: e.target.value })}
                            />
                        </div>

                        <div>
                            <Label>Observações Gerais</Label>
                            <Textarea
                                rows={2}
                                placeholder="Outras observações..."
                                value={formData.observations}
                                onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter className="mt-4">
                        <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
                        <Button
                            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold"
                            onClick={handleSubmit}
                            disabled={saving}
                        >
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Registrar Diário
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-amber-500" />
                            Diário de Obra — {selectedLog?.date ? format(new Date(selectedLog.date), 'dd/MM/yyyy') : ''}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedLog?.work?.title || 'Sem obra vinculada'}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedLog && (
                        <div className="space-y-4 mt-2">
                            <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <WeatherIcon type={selectedLog.weatherMorning} />
                                    <span className="text-sm"><span className="text-slate-400">Manhã:</span> {weatherLabels[selectedLog.weatherMorning]}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <WeatherIcon type={selectedLog.weatherAfternoon} />
                                    <span className="text-sm"><span className="text-slate-400">Tarde:</span> {weatherLabels[selectedLog.weatherAfternoon]}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-green-500" />
                                    <span className="text-sm">{selectedLog.workersPresent} presentes / {selectedLog.workersAbsent} ausentes</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-blue-500" />
                                    <span className="text-sm">{selectedLog.startTime} - {selectedLog.endTime}</span>
                                </div>
                            </div>

                            {selectedLog.activitiesPerformed && (
                                <div>
                                    <Label className="text-xs uppercase font-bold text-slate-500">Atividades Realizadas</Label>
                                    <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{selectedLog.activitiesPerformed}</p>
                                </div>
                            )}

                            {selectedLog.activitiesPlanned && (
                                <div>
                                    <Label className="text-xs uppercase font-bold text-slate-500">Previsão Amanhã</Label>
                                    <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{selectedLog.activitiesPlanned}</p>
                                </div>
                            )}

                            {selectedLog.occurrences && (
                                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                    <Label className="text-xs uppercase font-bold text-orange-600">Ocorrências</Label>
                                    <p className="text-sm text-orange-800 mt-1 whitespace-pre-wrap">{selectedLog.occurrences}</p>
                                </div>
                            )}

                            {selectedLog.safetyNotes && (
                                <div>
                                    <Label className="text-xs uppercase font-bold text-slate-500">Notas de Segurança</Label>
                                    <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{selectedLog.safetyNotes}</p>
                                </div>
                            )}

                            {selectedLog.observations && (
                                <div>
                                    <Label className="text-xs uppercase font-bold text-slate-500">Observações</Label>
                                    <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{selectedLog.observations}</p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
