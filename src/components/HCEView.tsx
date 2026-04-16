import { useState, useMemo, useEffect } from 'react';
import { HCEData } from '../lib/dataStore';
import { FieldCategory, classifyField } from '../lib/fieldDictionary';
import { SearchResult } from '../lib/searchEngine';
import { ArrowLeft, Clock, FileText, User, ChevronLeft, ChevronRight, Hash, Activity } from 'lucide-react';
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
  const patient = data.patients[currentResult.nhc];
  
  const [selectedEpisodeId, setSelectedEpisodeId] = useState(currentResult.idToma);
  const [selectedVersion, setSelectedVersion] = useState(currentResult.ordenToma);
  const [activeTab, setActiveTab] = useState<FieldCategory>('Anamnesis y Exploración');

  useEffect(() => {
    setSelectedEpisodeId(currentResult.idToma);
    setSelectedVersion(currentResult.ordenToma);
  }, [currentResult.nhc, currentResult.idToma, currentResult.ordenToma]);

  const episode = patient.episodes[selectedEpisodeId];
  const version = episode?.versions.find(v => v.ordenToma === selectedVersion) || episode?.latest;

  const categorizedFields = useMemo(() => {
    const result = {} as Record<FieldCategory, { key: string; value: string }[]>;
    TABS.forEach(tab => result[tab] = []);
    if (!version) return result;

    for (const [key, value] of Object.entries(version.data)) {
      if (!value || value.trim() === '') continue;
      const category = classifyField(key);
      result[category].push({ key, value });
    }
    return result;
  }, [version]);

  if (!episode || !version) return <div className="p-20 text-center glass rounded-3xl">Error cargando información clínica.</div>;

  const hasNext = currentIndex < results.length - 1;
  const hasPrev = currentIndex > 0;

  return (
    <div className="flex flex-col h-full w-full gap-8">
      {/* Navigation Bar */}
      <div className="flex items-center justify-between glass p-4 rounded-[2rem] premium-shadow shrink-0">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="p-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all text-slate-500 dark:text-slate-300 border dark:border-slate-700 active:scale-95"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="hidden sm:block">
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Expediente Clínico</h2>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Navegación de Resultados</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-100/50 dark:bg-slate-900/50 p-2 rounded-[1.5rem] border dark:border-slate-800">
          <div className="px-4 text-[13px] font-black text-slate-600 dark:text-slate-400">
            {currentIndex + 1} <span className="opacity-30">/</span> {results.length}
          </div>
          <div className="flex gap-2">
            <button 
              disabled={!hasPrev}
              onClick={() => onIndexChange(currentIndex - 1)}
              className="p-2 rounded-xl glass hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
            >
              <ChevronLeft size={20} />
            </button>
            <button 
              disabled={!hasNext}
              onClick={() => onIndexChange(currentIndex + 1)}
              className="p-2 rounded-xl glass hover:bg-white dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-90"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-8 overflow-hidden flex-col lg:flex-row">
        {/* Episodes Sidebar */}
        <aside className="w-full lg:w-[280px] glass premium-shadow flex flex-col rounded-[2.5rem] overflow-hidden shrink-0">
          <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
            <span className="text-[12px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Episodios</span>
            <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-lg text-[11px] font-black">{Object.keys(patient.episodes).length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 hide-scrollbar">
            {Object.values(patient.episodes).map(ep => (
              <div
                key={ep.idToma}
                onClick={() => {
                  setSelectedEpisodeId(ep.idToma);
                  setSelectedVersion(ep.latest.ordenToma);
                }}
                className={`p-4 rounded-2xl cursor-pointer transition-all border ${
                  selectedEpisodeId === ep.idToma 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-600/20 translate-x-1' 
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 border-transparent text-slate-600 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Hash size={14} className={selectedEpisodeId === ep.idToma ? 'text-blue-200' : 'text-slate-400'} />
                  <span className="text-[14px] font-black">ID {ep.idToma}</span>
                </div>
                <p className={`text-[11px] font-bold ${selectedEpisodeId === ep.idToma ? 'text-blue-100' : 'text-slate-400'}`}>
                  {ep.versions.length} VERSIONES
                </p>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col gap-8 overflow-y-auto pr-2 hide-scrollbar">
          {/* Patient Header Card */}
          <div className="glass premium-shadow rounded-[3rem] p-10 flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden group">
            <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-blue-500/5 blur-[80px] rounded-full group-hover:bg-blue-500/10 transition-colors"></div>
            
            <div className="flex items-center gap-8 relative z-10 w-full">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-[2rem] flex items-center justify-center flex-shrink-0 shadow-2xl shadow-blue-600/40">
                <User size={48} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Paciente {patient.nhc}</h1>
                  <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-4 py-1.5 rounded-full text-[11px] font-black tracking-widest uppercase border border-emerald-500/20">Historia Activa</span>
                </div>
                <div className="flex gap-6 text-[14px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide">
                  <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
                    <Hash size={14} className="text-blue-500" /> NHC: {patient.nhc}
                  </div>
                  {categorizedFields['Demografía'].slice(0, 2).map((field, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-900 rounded-lg">
                      <Activity size={14} className="text-blue-500" /> {field.key}: {field.value}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Version Timeline */}
          <div className="glass p-4 rounded-[1.8rem] flex items-center gap-6 overflow-x-auto hide-scrollbar premium-shadow">
            <div className="flex items-center gap-3 text-[12px] font-black text-slate-400 uppercase tracking-widest pl-4 shrink-0 border-r dark:border-slate-800 pr-6 mr-2">
              <Clock size={16} /> Versiones
            </div>
            <div className="flex gap-3">
              {episode.versions.map(v => (
                <button
                  key={v.ordenToma}
                  onClick={() => setSelectedVersion(v.ordenToma)}
                  className={`px-6 py-2.5 rounded-2xl text-[13px] font-black transition-all border whitespace-nowrap ${
                    v.ordenToma === selectedVersion
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-transparent shadow-xl'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  v{v.ordenToma} {v.ordenToma === episode.latest.ordenToma ? '(ACTUAL)' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Categories Navigation */}
          <div className="flex gap-3 overflow-x-auto hide-scrollbar py-2 shrink-0">
            {TABS.map(tab => {
              const count = categorizedFields[tab].length;
              if (count === 0 && tab !== activeTab) return null;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 rounded-2xl text-[14px] font-black transition-all whitespace-nowrap border-2 flex items-center gap-3 ${
                    activeTab === tab 
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-600/30' 
                      : 'bg-white/50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-transparent hover:bg-white dark:hover:bg-slate-800'
                  }`}
                >
                  {tab}
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${activeTab === tab ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
            {categorizedFields[activeTab].length === 0 ? (
              <div className="col-span-full py-32 glass rounded-[3rem] text-center border-dashed border-2 flex flex-col items-center justify-center">
                <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-6 text-slate-200 dark:text-slate-800">
                  <FileText size={48} />
                </div>
                <p className="text-xl font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">Sin registros detectados</p>
              </div>
            ) : (
              categorizedFields[activeTab].map((field, idx) => (
                <div key={`${field.key}_${idx}`} className="glass p-6 rounded-[2rem] flex flex-col gap-4 border-transparent hover:border-blue-500/30 hover:scale-[1.02] premium-shadow">
                  <div className="flex items-center justify-between border-b dark:border-slate-800/50 pb-4">
                    <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{field.key}</span>
                  </div>
                  <div className="text-[15px] text-slate-900 dark:text-slate-100 font-bold leading-relaxed whitespace-pre-wrap">
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
