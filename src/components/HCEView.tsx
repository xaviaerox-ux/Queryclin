import { useState, useMemo, useEffect } from 'react';
import { HCEData } from '../lib/dataStore';
import { FieldCategory, classifyField } from '../lib/fieldDictionary';
import { SearchResult } from '../lib/searchEngine';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import HighlightedText from './HighlightedText';

interface HCEViewProps {
  results: SearchResult[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onBack: () => void;
  query: string;
  data: HCEData;
}

const TABS: FieldCategory[] = [
  'Demografía',
  'Antecedentes',
  'Anamnesis y Exploración',
  'Diagnóstico y Tratamiento',
  'Resultados',
  'Hospitalización',
  'OTROS'
];

export default function HCEView({ results, currentIndex, onIndexChange, onBack, query, data }: HCEViewProps) {
  const currentResult = results[currentIndex];
  const patient = currentResult.patient;
  
  const [selectedTomaId, setSelectedTomaId] = useState(currentResult.bestMatchUrl.idToma);
  const [selectedOrdenToma, setSelectedOrdenToma] = useState(currentResult.bestMatchUrl.ordenToma);
  const [activeTab, setActiveTab] = useState<FieldCategory>('Anamnesis y Exploración');

  useEffect(() => {
    setSelectedTomaId(currentResult.bestMatchUrl.idToma);
    setSelectedOrdenToma(currentResult.bestMatchUrl.ordenToma);

    // Auto-detectar la pestaña que contiene el primer match
    const currentToma = patient.tomas[currentResult.bestMatchUrl.idToma];
    const currentReg = currentToma?.registros.find(r => r.ordenToma === currentResult.bestMatchUrl.ordenToma);
    
    if (currentReg && query) {
      const tokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 1 && !['AND', 'OR', 'NOT'].includes(t.toUpperCase()));
      for (const [key, value] of Object.entries(currentReg.data)) {
        if (tokens.some(token => value.toLowerCase().includes(token))) {
          const category = classifyField(key);
          setActiveTab(category);
          break;
        }
      }
    }
  }, [currentResult.nhc, currentResult.bestMatchUrl.idToma, currentResult.bestMatchUrl.ordenToma, query, patient]);

  // Efecto para scroll automático al primer resaltado
  useEffect(() => {
    const timer = setTimeout(() => {
      const firstMatch = document.querySelector('.highlight-match');
      if (firstMatch) {
        firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300); // Pequeño delay para asegurar que el DOM y la pestaña han cargado
    return () => clearTimeout(timer);
  }, [activeTab, selectedOrdenToma]);

  const toma = patient.tomas[selectedTomaId];
  const registro = toma?.registros.find(r => r.ordenToma === selectedOrdenToma) || toma?.latest;

  const categorizedFields = useMemo(() => {
    const result = {} as Record<FieldCategory, { key: string; value: string }[]>;
    TABS.forEach(tab => result[tab] = []);
    if (!registro) return result;

    for (const [key, value] of Object.entries(registro.data)) {
      if (!value || value.trim() === '') continue;
      const category = classifyField(key);
      result[category].push({ key, value });
    }
    return result;
  }, [registro]);

  if (!toma || !registro) return <div className="p-20 text-center bg-white/70 rounded-2xl border border-white/40">Error cargando información clínica.</div>;

  const hasNext = currentIndex < results.length - 1;
  const hasPrev = currentIndex > 0;

  return (
    <div className="flex flex-col h-full w-full gap-5">
      {/* Navigation Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-[var(--surface-clinical)] rounded-xl transition-colors text-[var(--text-secondary)]"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-black text-[var(--text-primary)] hidden sm:block uppercase tracking-wider">Expediente Clínico</h2>
        </div>

        <div className="flex items-center gap-3 bg-[var(--surface-clinical)] px-4 py-2 rounded-xl border border-[var(--border-clinical)] shadow-md">
          <div className="text-[13px] font-bold text-[var(--text-secondary)] mr-2 uppercase tracking-wide">
            {currentIndex + 1} / {results.length} coincidencias
          </div>
          <div className="flex gap-1 border-l border-[var(--border-clinical)] pl-2">
            <button 
              disabled={!hasPrev}
              onClick={() => onIndexChange(currentIndex - 1)}
              className="p-1 rounded-lg hover:bg-[var(--bg-clinical)] disabled:opacity-30 disabled:cursor-not-allowed text-[var(--text-primary)]"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              disabled={!hasNext}
              onClick={() => onIndexChange(currentIndex + 1)}
              className="p-1 rounded-lg hover:bg-[var(--bg-clinical)] disabled:opacity-30 disabled:cursor-not-allowed text-[var(--text-primary)]"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden flex-col lg:flex-row">
        {/* Tomas Sidebar */}
        <aside className="w-full lg:w-[300px] bg-[var(--surface-clinical)] border border-[var(--border-clinical)] flex flex-col rounded-2xl shadow-xl overflow-hidden shrink-0">
          <div className="p-4 border-b border-[var(--border-clinical)] text-[12px] font-black text-[var(--text-secondary)] uppercase tracking-widest flex justify-between items-center bg-[var(--bg-clinical)]/50">
            <span>Tomas Registradas</span>
            <span className="bg-[var(--accent-clinical)]/10 text-[var(--accent-clinical)] px-2.5 py-0.5 rounded-lg text-[10px] font-bold">{Object.keys(patient.tomas).length}</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            {Object.values(patient.tomas).map(t => (
              <div
                key={t.idToma}
                onClick={() => {
                  setSelectedTomaId(t.idToma);
                  setSelectedOrdenToma(t.latest.ordenToma);
                }}
                className={`p-4 border-b border-[var(--border-clinical)] cursor-pointer transition-all ${
                  selectedTomaId === t.idToma 
                    ? 'bg-[var(--accent-clinical)]/5 border-l-4 border-l-[var(--accent-clinical)]' 
                    : 'hover:bg-[var(--bg-clinical)] border-l-4 border-l-transparent'
                }`}
              >
                <h4 className="text-[14px] font-black text-[var(--text-primary)] mb-1 uppercase tracking-tight">ID: {t.idToma}</h4>
                <p className="text-[12px] text-[var(--text-secondary)] font-medium">{t.registros.length} registros evolutivos</p>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col gap-5 overflow-y-auto lg:pr-2 hide-scrollbar">
          {/* Patient Profile Card */}
          <div className="bg-[var(--surface-clinical)] border border-[var(--border-clinical)] rounded-2xl p-6 shadow-lg flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h1 className="text-[26px] font-black text-[var(--text-primary)] mb-3 tracking-tight">Paciente {patient.nhc}</h1>
              <div className="flex gap-3 text-[13px] text-[var(--text-secondary)] flex-wrap">
                <span className="bg-[var(--bg-clinical)] px-3 py-1.5 rounded-lg border border-[var(--border-clinical)]"><strong className="text-[var(--text-primary)] font-black uppercase text-[10px] mr-1">N.H.C:</strong> {patient.nhc}</span>
                {categorizedFields['Demografía'].slice(0, 3).map(field => (
                  <span key={field.key} className="bg-[var(--bg-clinical)] px-3 py-1.5 rounded-lg border border-[var(--border-clinical)]"><strong className="text-[var(--text-primary)] font-black uppercase text-[10px] mr-1">{field.key}:</strong> {field.value}</span>
                ))}
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="bg-emerald-500/10 text-emerald-500 px-4 py-2 rounded-xl text-[11px] font-black tracking-widest uppercase border border-emerald-500/20">HISTORIA ACTIVA</span>
            </div>
          </div>

          {/* Timeline Selector */}
          <div className="bg-[var(--bg-clinical)] border border-[var(--border-clinical)] rounded-xl p-4 flex items-center gap-4 flex-wrap">
            <div className="text-[13px] font-black text-[var(--text-primary)] uppercase tracking-wider">ID Toma: <span className="font-medium normal-case text-[var(--accent-clinical)]">{selectedTomaId}</span></div>
            <div className="w-[1px] h-5 bg-[var(--border-clinical)] hidden sm:block"></div>
            <div className="text-[13px] font-black text-[var(--text-primary)] uppercase tracking-wider">Registros Evolutivos:</div>
            <div className="flex gap-2 flex-wrap">
              {toma.registros.map(r => (
                <button
                  key={r.ordenToma}
                  onClick={() => setSelectedOrdenToma(r.ordenToma)}
                  className={`px-4 py-1.5 rounded-lg border text-[12px] transition-all font-bold ${
                    r.ordenToma === selectedOrdenToma
                      ? 'bg-[var(--accent-clinical)] text-white border-[var(--accent-clinical)] shadow-lg scale-105'
                      : 'bg-[var(--surface-clinical)] border-[var(--border-clinical)] text-[var(--text-secondary)] hover:border-[var(--accent-clinical)]'
                  }`}
                >
                  Reg #{r.ordenToma} {r.ordenToma === toma.latest.ordenToma ? '(Último)' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Tabs Selector */}
          <div className="flex gap-3 border-b border-[var(--border-clinical)] overflow-x-auto hide-scrollbar shrink-0 pt-2">
            {TABS.map(tab => {
              const count = categorizedFields[tab].length;
              if (count === 0 && tab !== activeTab) return null;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3 text-[14px] font-bold cursor-pointer whitespace-nowrap border-b-2 transition-all flex items-center gap-2 uppercase tracking-tight ${
                    activeTab === tab 
                      ? 'text-[var(--accent-clinical)] border-[var(--accent-clinical)]' 
                      : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
                  }`}
                >
                  {tab} 
                  <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black ${activeTab === tab ? 'bg-[var(--accent-clinical)] text-white' : 'bg-[var(--border-clinical)] text-[var(--text-secondary)]'}`}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-6">
            {categorizedFields[activeTab].length === 0 ? (
              <div className="col-span-full text-center py-20 text-[var(--text-secondary)] bg-[var(--surface-clinical)] rounded-2xl border border-dashed border-[var(--border-clinical)]">
                <p className="text-[14px] font-bold uppercase tracking-wider opacity-50">Datos no disponibles en esta categoría</p>
              </div>
            ) : (
              categorizedFields[activeTab].map((field, idx) => (
                <div key={`${field.key}_${idx}`} className="bg-[var(--surface-clinical)] border border-[var(--border-clinical)] rounded-2xl p-6 flex flex-col gap-4 shadow-lg hover:border-[var(--accent-clinical)] transition-all">
                  <div className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest border-b border-[var(--border-clinical)] pb-3">
                    {field.key}
                  </div>
                  <div className="text-[15px] text-[var(--text-primary)] font-medium whitespace-pre-wrap leading-[1.6]">
                    <HighlightedText text={field.value} query={query} />
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
