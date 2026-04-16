import { SearchResult } from '../lib/searchEngine';
import { ArrowLeft, FileText, ChevronRight } from 'lucide-react';

interface ResultsProps {
  results: SearchResult[];
  query: string;
  onSelect: (result: SearchResult) => void;
  onBack: () => void;
}

export default function Results({ results, query, onSelect, onBack }: ResultsProps) {
  return (
    <div className="max-w-5xl mx-auto w-full py-6 flex flex-col gap-10">
      <div className="flex items-center gap-8 glass p-8 rounded-[2.5rem] premium-shadow">
        <button 
          onClick={onBack}
          className="p-4 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl transition-all text-slate-500 dark:text-slate-300 shadow-sm active:scale-95 border dark:border-slate-700"
          title="Volver al buscador"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Análisis de Resultados</h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">
            Se han identificado <span className="text-blue-600 dark:text-blue-400 font-black">{results.length}</span> registros críticos para "{query}"
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {results.map((res, idx) => {
          const record = res.record.data;
          const nameKey = Object.keys(record).find(k => k.toUpperCase().includes('NOMBRE')) || '';
          
          const name = nameKey ? record[nameKey] : `Paciente ${res.nhc}`;
          const service = 'Servicio Clínico • NHC ' + res.nhc;

          return (
            <div 
              key={`${res.nhc}_${res.idToma}_${res.ordenToma}_${idx}`}
              onClick={() => onSelect(res)}
              className="group glass p-8 rounded-[2rem] premium-shadow hover:border-blue-500/50 transition-all cursor-pointer flex items-center gap-8 group/card"
            >
              <div className="w-16 h-16 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all group-hover/card:scale-110 group-hover/card:bg-blue-600 group-hover/card:text-white shadow-inner">
                <FileText size={28} />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover/card:text-blue-600 dark:group-hover/card:text-blue-400 transition-colors">
                    {name}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-4 py-1.5 rounded-full uppercase tracking-widest border border-emerald-500/20 shadow-sm">
                      Score: {res.score.toFixed(1)}
                    </span>
                    <ChevronRight size={24} className="text-slate-300 group-hover/card:text-blue-500 transition-all group-hover/card:translate-x-1" />
                  </div>
                </div>
                
                <div className="flex items-center gap-5 text-[14px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                  <span className="bg-slate-100 dark:bg-slate-900 px-3 py-1 rounded-lg text-slate-400">ID {res.idToma}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                  <span>v{res.ordenToma}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                  <span className="opacity-80 font-medium normal-case">{service}</span>
                </div>
              </div>
            </div>
          );
        })}

        {results.length === 0 && (
          <div className="text-center py-20 glass rounded-[3rem] border-dashed border-2 premium-shadow">
            <div className="w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
              <FileText size={40} />
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xl font-bold">No se han encontrado registros coincidentes.</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">Intenta usar otros términos o revisa los operadores booleanos.</p>
          </div>
        )}
      </div>
    </div>
  );
}
