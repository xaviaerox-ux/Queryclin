import React, { useState } from 'react';
import { Search, Upload, Database, ShieldCheck, Zap, Activity } from 'lucide-react';

interface HomeProps {
  hasData: boolean;
  onUpload: (file: File) => void;
  onSearch: (query: string) => void;
}

export default function Home({ hasData, onUpload, onSearch }: HomeProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query);
  };

  return (
    <div className="max-w-5xl mx-auto w-full py-16 flex flex-col gap-20">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[12px] font-black uppercase tracking-[0.2em] animate-pulse">
          <Activity size={14} /> Medical Data Intelligence
        </div>
        <h1 className="text-6xl md:text-7xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]">
          Análisis de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-300">Historias Clínicas</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xl max-w-2xl mx-auto font-medium leading-relaxed">
          Navegación avanzada y búsqueda booleana instantánea sobre datos estructurados. 
          Privacidad total con procesamiento local.
        </p>
      </div>

      {!hasData ? (
        <div className="glass premium-shadow p-16 rounded-[3rem] text-center max-w-3xl mx-auto w-full group hover:scale-[1.01]">
          <div className="w-24 h-24 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner rotate-3 transition-transform group-hover:rotate-0">
            <Upload size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Comienza el Análisis</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-10 text-lg font-medium">Suelta tu archivo CSV aquí o haz clic para importar la base de datos.</p>
          
          <label className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-[1.5rem] font-black transition-all cursor-pointer shadow-2xl shadow-blue-600/30 active:scale-95 inline-block text-[15px] uppercase tracking-wider">
            Importar Base de Datos
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} 
            />
          </label>
          
          <div className="grid grid-cols-3 gap-10 mt-16 pt-10 border-t border-slate-200/50 dark:border-slate-800/50">
            <div className="space-y-3">
              <ShieldCheck className="mx-auto text-emerald-500" size={28} />
              <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Hiper Privado</p>
            </div>
            <div className="space-y-3">
              <Database className="mx-auto text-blue-500" size={28} />
              <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Motor Local</p>
            </div>
            <div className="space-y-3">
              <Zap className="mx-auto text-amber-500" size={28} />
              <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Carga Vital</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto w-full space-y-8">
          <form onSubmit={handleSubmit} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-500 rounded-[2.5rem] blur opacity-20 group-focus-within:opacity-40 transition duration-500"></div>
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ej: diabetes AND hipertension NOT asma"
                className="w-full glass p-7 pl-16 rounded-[2.5rem] text-[20px] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 font-bold"
              />
              <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={28} />
              <button 
                type="submit"
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-4 px-8 rounded-[1.5rem] font-black text-[13px] uppercase transition-all shadow-xl shadow-blue-600/20 active:scale-95 hover:bg-blue-700"
              >
                Buscar
              </button>
            </div>
          </form>

          <div className="flex justify-center items-center gap-10">
            <div className="flex items-center gap-3 text-[13px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
              Dataset Activo
            </div>
            <div className="w-[1px] h-4 bg-slate-200 dark:border-slate-800"></div>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium">
              Usa <code className="bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-md text-blue-600 dark:text-blue-400 font-black">AND</code> para combinar términos.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
