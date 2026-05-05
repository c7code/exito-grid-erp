import { useState, useEffect } from 'react';
import { Loader2, Truck, LayoutDashboard, Package, FileText, Clock, Zap, Wrench, ClipboardCheck, FolderOpen, Anchor } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/api';

import EquipmentDashboard from './equipment/EquipmentDashboard';
import EquipmentList from './equipment/EquipmentList';
import RentalTab from './equipment/RentalTab';
import DailyLogTab from './equipment/DailyLogTab';
import MeasurementTab from './equipment/MeasurementTab';
import ServiceTab from './equipment/ServiceTab';
import MaintenanceTab from './equipment/MaintenanceTab';
import ChecklistTab from './equipment/ChecklistTab';
import DocumentTab from './equipment/DocumentTab';
import LiftingPlanTab from './equipment/LiftingPlanTab';

type TabKey = 'dash' | 'equip' | 'rent' | 'daily' | 'measure' | 'service' | 'maint' | 'check' | 'docs' | 'lifting';

const TABS: { key: TabKey; label: string; icon: any; color: string }[] = [
  { key: 'dash',    label: 'Dashboard',     icon: LayoutDashboard, color: 'text-indigo-500' },
  { key: 'equip',   label: 'Equipamentos',  icon: Package,         color: 'text-orange-500' },
  { key: 'rent',    label: 'Locações',      icon: FileText,        color: 'text-blue-500' },
  { key: 'daily',   label: 'Diárias',       icon: Clock,           color: 'text-cyan-500' },
  { key: 'measure', label: 'Medição',       icon: FileText,        color: 'text-emerald-500' },
  { key: 'service', label: 'Serviços',      icon: Zap,             color: 'text-purple-500' },
  { key: 'maint',   label: 'Manutenções',   icon: Wrench,          color: 'text-amber-500' },
  { key: 'check',   label: 'Vistorias',     icon: ClipboardCheck,  color: 'text-teal-500' },
  { key: 'docs',    label: 'Documentos',    icon: FolderOpen,      color: 'text-sky-500' },
  { key: 'lifting', label: 'Plano Içamento',icon: Anchor,          color: 'text-rose-500' },
];

export default function EquipmentPage() {
  const [tab, setTab] = useState<TabKey>('dash');
  const [loading, setLoading] = useState(true);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [rentals, setRentals] = useState<any[]>([]);
  const [maintenances, setMaintenances] = useState<any[]>([]);
  const [dailyLogs, setDailyLogs] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [checklists, setChecklists] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [liftingPlans, setLiftingPlans] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    try {
      setLoading(true);
      const [eq, re, ma, dl, sv, cl, st, docs, lp] = await Promise.all([
        api.getEquipment(),
        api.getEquipmentRentals().catch(() => []),
        api.getEquipmentMaintenance().catch(() => []),
        api.getEquipmentDailyLogs().catch(() => []),
        api.getEquipmentServices().catch(() => []),
        api.getEquipmentChecklists().catch(() => []),
        api.getEquipmentStats().catch(() => null),
        api.getEquipmentDocuments().catch(() => []),
        api.getEquipmentLiftingPlans().catch(() => []),
      ]);
      setEquipment(eq || []);
      setRentals(re || []);
      setMaintenances(ma || []);
      setDailyLogs(dl || []);
      setServices(sv || []);
      setChecklists(cl || []);
      setStats(st);
      setDocuments(docs || []);
      setLiftingPlans(lp || []);

      try {
        const [cliRes, empRes] = await Promise.all([api.getClients(), api.getEmployees()]);
        setClients(cliRes || []);
        setEmployees(empRes || []);
      } catch { /* non-critical */ }
    } catch (e: any) {
      console.error('Equipment load error:', e);
      toast.error('Erro ao carregar dados de equipamentos');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <p className="text-sm text-muted-foreground">Carregando equipamentos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
          <Truck className="h-7 w-7 text-orange-500" />
          Locação de Equipamentos
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Gestão completa de equipamentos, locações, diárias, serviços, manutenções, vistorias, documentos e planos de içamento
        </p>
      </div>

      <div className="flex gap-1 bg-slate-100/80 p-1 rounded-xl w-fit overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon, color }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap
              ${tab === key ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}`}
          >
            <Icon className={`h-4 w-4 ${tab === key ? color : ''}`} />
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {tab === 'dash' && <EquipmentDashboard stats={stats} />}
        {tab === 'equip' && <EquipmentList equipment={equipment} reload={loadAll} />}
        {tab === 'rent' && <RentalTab rentals={rentals} equipment={equipment} clients={clients} employees={employees} reload={loadAll} />}
        {tab === 'daily' && <DailyLogTab dailyLogs={dailyLogs} rentals={rentals} equipment={equipment} employees={employees} reload={loadAll} />}
        {tab === 'measure' && <MeasurementTab rentals={rentals} equipment={equipment} dailyLogs={dailyLogs} reload={loadAll} />}
        {tab === 'service' && <ServiceTab services={services} equipment={equipment} clients={clients} employees={employees} reload={loadAll} />}
        {tab === 'maint' && <MaintenanceTab maintenances={maintenances} equipment={equipment} reload={loadAll} />}
        {tab === 'check' && <ChecklistTab checklists={checklists} equipment={equipment} rentals={rentals} reload={loadAll} />}
        {tab === 'docs' && <DocumentTab documents={documents} equipment={equipment} reload={loadAll} />}
        {tab === 'lifting' && <LiftingPlanTab liftingPlans={liftingPlans} equipment={equipment} clients={clients} rentals={rentals} reload={loadAll} />}
      </div>
    </div>
  );
}
