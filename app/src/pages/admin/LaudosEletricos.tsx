import { Zap } from 'lucide-react';

export default function LaudosEletricos() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Laudos Elétricos</h1>
          <p className="text-sm text-slate-500">Atendimentos técnicos e laudos comerciais</p>
        </div>
      </div>

      {/* Placeholder */}
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-xl border border-slate-200">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-4">
          <Zap className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-lg font-semibold text-slate-700 mb-1">Módulo em Construção</h2>
        <p className="text-sm text-slate-400 max-w-md text-center">
          O módulo de Laudos Elétricos está sendo preparado. Em breve você poderá registrar atendimentos, 
          anexar documentos e gerar propostas diretamente por aqui.
        </p>
      </div>
    </div>
  );
}
