import React, { useState, useRef } from 'react';
import { Search, Upload, ShieldCheck, Database, Zap, Filter, Calendar, Stethoscope } from 'lucide-react';

interface HomeProps {
  hasData: boolean;
  onUpload: (file: File) => void;
  onSearch: (query: string, filters?: { dateRange?: [string, string], service?: string }) => void;
}

export default function Home({ hasData, onUpload, onSearch }: HomeProps) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [service, setService] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, {
      dateRange: dateStart || dateEnd ? [dateStart, dateEnd] : undefined,
      service: service || undefined
    });
  };

  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-20 px-4">
        <div className="bg-[var(--surface-clinical)] p-12 rounded-2xl shadow-xl border border-[var(--border-clinical)] max-w-md w-full">
          <div className="w-16 h-16 bg-[var(--accent-clinical)]/10 text-[var(--accent-clinical)] rounded-full flex items-center justify-center mx-auto mb-6">
            <Upload size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-[var(--text-primary)]">Inicializar Memoria Local</h2>
          <p className="text-[var(--text-secondary)] text-sm mb-8 leading-relaxed">
            Importe la matriz de datos estructurada (.csv) para cargar la base en la memoria temporal del analizador.
          </p>
          <input
            type="file"
            accept=".csv"
            className="hidden"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                 onUpload(file);
                 if (fileInputRef.current) fileInputRef.current.value = '';
              }
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-[var(--accent-clinical)] hover:opacity-90 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg active:scale-95"
          >
            Importar Base de Datos
          </button>
          
          <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-[var(--border-clinical)]">
            <div className="space-y-2">
              <ShieldCheck className="mx-auto text-[var(--text-secondary)]" size={20} />
              <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Aislamiento<br/>Local-First</p>
            </div>
            <div className="space-y-2">
              <Database className="mx-auto text-[var(--text-secondary)]" size={20} />
              <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Motor en<br/>RAM</p>
            </div>
            <div className="space-y-2">
              <Zap className="mx-auto text-[var(--text-secondary)]" size={20} />
              <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Booleano<br/>Avanzado</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-20 w-full relative z-20">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black tracking-tight mb-4 text-[var(--text-primary)]">
          Explorador de Historias Clínicas
        </h1>
        <p className="text-[var(--text-secondary)] font-medium">
          Análisis masivo de datos clínicos con sintaxis Booleana estricta (AND, OR, NOT).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative max-w-[650px] mx-auto">
        <div className="relative flex items-center group">
          <Search className="absolute left-5 text-[var(--text-secondary)] group-focus-within:text-[var(--accent-clinical)] transition-colors" size={20} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Identificadores, diagnóstico o hallazgos clínicos..."
            className="w-full pl-12 pr-32 py-4 text-[15px] bg-[var(--surface-clinical)] border border-[var(--border-clinical)] rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-[var(--accent-clinical)]/20 focus:border-[var(--accent-clinical)] transition-all placeholder:text-[var(--text-secondary)]/50"
          />
          <div className="absolute right-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-xl transition-all ${showFilters ? 'bg-[var(--accent-clinical)]/10 text-[var(--accent-clinical)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-clinical)]'}`}
              title="Filtros avanzados"
            >
              <Filter size={20} />
            </button>
            <button
              type="submit"
              className="bg-[var(--accent-clinical)] hover:opacity-90 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-md active:scale-95"
            >
              Consultar
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="absolute top-full left-0 right-0 mt-4 bg-[var(--surface-clinical)] border border-[var(--border-clinical)] rounded-2xl p-6 shadow-2xl z-20 grid grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div>
              <label className="flex items-center gap-2 text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                <Calendar size={14} /> Rango de Fechas
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-clinical)] border border-[var(--border-clinical)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-clinical)] text-sm text-[var(--text-primary)]"
                />
                <span className="text-[var(--text-secondary)]">-</span>
                <input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--bg-clinical)] border border-[var(--border-clinical)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-clinical)] text-sm text-[var(--text-primary)]"
                />
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                <Stethoscope size={14} /> Especialidad / Servicio
              </label>
              <input
                type="text"
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder="Ej: ALG, URGENCIAS..."
                className="w-full px-3 py-2 bg-[var(--bg-clinical)] border border-[var(--border-clinical)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-clinical)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/30"
              />
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
