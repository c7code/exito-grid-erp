import React, { useState, useMemo, useCallback } from 'react';
import { Calculator, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import type { WizardInput, SimulatorResult } from './engine/simulatorTypes';
import { runSimulation } from './engine/rankingEngine';
import Step1ServiceData from './steps/Step1_ServiceData';
import Step2ClientProfile from './steps/Step2_ClientProfile';
import Step3Results from './steps/Step3_Results';
import Step4Export from './steps/Step4_Export';

const STEPS = [
  { label: 'Serviço', icon: '📋' },
  { label: 'Cliente', icon: '👤' },
  { label: 'Resultado', icon: '⭐' },
  { label: 'Exportar', icon: '📤' },
];

const DEFAULT_INPUT: WizardInput = {
  serviceDescription: '',
  proposalValue: 0,
  immediateCost: 0,
  totalCost: 0,
  minMargin: 0,
  maxTerm: 0,
  correctionIndex: 'CDI',
  cardMachineRate: 4.99,
  atSightDiscount: 5,
  clientProfile: 'auto',
  preferredPayment: 'any',
  entryMethod: 'pix',
};

export default function SimulatorWizard() {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<WizardInput>(DEFAULT_INPUT);
  const [result, setResult] = useState<SimulatorResult | null>(null);
  const [selectedConditionId, setSelectedConditionId] = useState<string | null>(null);

  const updateInput = useCallback(<K extends keyof WizardInput>(key: K, value: WizardInput[K]) => {
    setInput(prev => ({ ...prev, [key]: value }));
  }, []);

  const canProceedStep1 = useMemo(() => {
    return (
      input.serviceDescription.trim().length > 0 &&
      input.totalCost > 0 &&
      input.immediateCost > 0 &&
      input.minMargin > 0
    );
  }, [input.serviceDescription, input.totalCost, input.immediateCost, input.minMargin]);

  const handleNext = useCallback(() => {
    if (step === 1) {
      // Ao avançar da etapa 2 → 3, rodar o motor
      const simResult = runSimulation(input);
      setResult(simResult);
      setSelectedConditionId(simResult.recommended.id);
    }
    setStep(s => Math.min(s + 1, 3));
  }, [step, input]);

  const handleBack = useCallback(() => {
    setStep(s => Math.max(s - 1, 0));
  }, []);

  const handleReset = useCallback(() => {
    setStep(0);
    setInput(DEFAULT_INPUT);
    setResult(null);
    setSelectedConditionId(null);
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 -m-6 p-3 sm:p-6">
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Calculator className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Simulador Inteligente
          </h1>
          <p className="text-gray-400 text-xs sm:text-sm">
            Motor de decisão comercial-financeira
          </p>
        </div>
      </div>

      {/* ── Progress Bar ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 mb-8 px-2">
        {STEPS.map((s, i) => (
          <React.Fragment key={i}>
            <button
              onClick={() => i < step ? setStep(i) : undefined}
              disabled={i > step}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                i === step
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30'
                  : i < step
                  ? 'bg-gray-800 text-cyan-400 hover:bg-gray-700 cursor-pointer'
                  : 'bg-gray-900 text-gray-600 cursor-not-allowed'
              }`}
            >
              <span>{s.icon}</span>
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 rounded-full transition-colors ${
                i < step ? 'bg-cyan-600' : 'bg-gray-800'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ── Step Content ──────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto">
        {step === 0 && (
          <Step1ServiceData input={input} updateInput={updateInput} />
        )}
        {step === 1 && (
          <Step2ClientProfile input={input} updateInput={updateInput} />
        )}
        {step === 2 && result && (
          <Step3Results
            result={result}
            selectedId={selectedConditionId}
            onSelect={setSelectedConditionId}
          />
        )}
        {step === 3 && result && (
          <Step4Export
            result={result}
            selectedId={selectedConditionId}
            clientName={input.clientName}
            serviceDescription={input.serviceDescription}
          />
        )}

        {/* ── Navigation ──────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-800">
          <div>
            {step > 0 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 rounded-xl text-sm font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {step === 3 && (
              <button
                onClick={handleReset}
                className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 rounded-xl text-sm font-medium transition-colors"
              >
                Nova Simulação
              </button>
            )}
            {step < 3 && (
              <button
                onClick={handleNext}
                disabled={step === 0 && !canProceedStep1}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  (step === 0 && !canProceedStep1)
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : step === 1
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/30'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                }`}
              >
                {step === 1 ? (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Simular
                  </>
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
