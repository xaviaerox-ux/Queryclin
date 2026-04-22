import React, { useState, useRef } from 'react';
import { Search, Upload, ShieldCheck, Database, Zap, Filter, Calendar, Stethoscope, Users } from 'lucide-react';

interface HomeProps {
  hasData: boolean;
  onUpload: (file: File) => void;
  onSearch: (query: string, filters?: { dateRange?: [string, string], service?: string }) => void;
  getSuggestions: (query: string) => string[];
  compact?: boolean;
}

export default function Home({ hasData, onUpload, onSearch, compact = false }: HomeProps) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [service, setService] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    return JSON.parse(localStorage.getItem('queryclin_recent_searches') || '[]');
  });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);

  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, {
      dateRange: dateStart || dateEnd ? [dateStart, dateEnd] : undefined,
      service: service || undefined
    });
    if (query.trim()) {
      const newRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
      setRecentSearches(newRecent);
      localStorage.setItem('queryclin_recent_searches', JSON.stringify(newRecent));
    }
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
            accept=".csv, .txt"
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
    <div className={`max-w-3xl mx-auto w-full relative z-20 ${compact ? 'mt-6 mb-8' : 'mt-20'}`}>
      {!compact && (
        <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4">
          <h1 className="text-4xl font-black tracking-tight mb-4 text-[var(--text-primary)]">
            Explorador de Historias Clínicas
          </h1>
          <p className="text-[var(--text-secondary)] font-medium">
            Análisis masivo de datos clínicos con sintaxis Booleana estricta (AND, OR, NOT).
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className={`relative mx-auto ${compact ? 'max-w-full' : 'max-w-[650px]'}`}>
        <div className="relative flex items-center group">
          <Search className="absolute left-5 text-[var(--text-secondary)] group-focus-within:text-[var(--accent-clinical)] transition-colors" size={20} />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              const val = e.target.value;
              setQuery(val);
              if (val.length >= 3) {
                const suggs = getSuggestions(val);
                setSuggestions(suggs);
                setShowSuggestions(suggs.length > 0);
                setActiveSuggestionIndex(-1);
              } else {
                setSuggestions([]);
                setShowSuggestions(false);
                setActiveSuggestionIndex(-1);
              }
            }}
            onKeyDown={(e) => {
              if (!showSuggestions) return;
              
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveSuggestionIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveSuggestionIndex(prev => (prev > 0 ? prev - 1 : prev));
              } else if (e.key === 'Enter' && activeSuggestionIndex >= 0) {
                e.preventDefault();
                const selected = suggestions[activeSuggestionIndex];
                setQuery(selected);
                onSearch(selected);
                setShowSuggestions(false);
              } else if (e.key === 'Escape') {
                setShowSuggestions(false);
              }
            }}
            onFocus={() => {
              if (query.length >= 3 && suggestions.length > 0) setShowSuggestions(true);
            }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} // Delay para permitir clics
            placeholder="Identificadores, diagnóstico o hallazgos clínicos..."
            className="w-full pl-12 pr-32 py-4 text-[15px] bg-[var(--surface-clinical)] border border-[var(--border-clinical)] rounded-2xl shadow-lg focus:outline-none focus:ring-4 focus:ring-[var(--accent-clinical)]/20 focus:border-[var(--accent-clinical)] transition-all placeholder:text-[var(--text-secondary)]/50"
          />

          {/* Clinical Suggestions Dropdown */}
          {showSuggestions && (
            <div className="absolute top-full left-0 right-16 mt-2 bg-[var(--surface-clinical)] border border-[var(--border-clinical)] rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-2 border-b border-[var(--border-clinical)] bg-[var(--bg-clinical)]/50">
                <span className="text-[9px] font-black uppercase text-[var(--text-secondary)] tracking-widest pl-2">Sugerencias Clínicas</span>
              </div>
              <ul className="max-h-[300px] overflow-y-auto">
                {suggestions.map((s, idx) => (
                  <li key={idx}>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery(s);
                        onSearch(s);
                        setShowSuggestions(false);
                      }}
                      onMouseEnter={() => setActiveSuggestionIndex(idx)}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between group ${
                        idx === activeSuggestionIndex 
                          ? 'bg-[var(--accent-clinical)]/10 text-[var(--accent-clinical)]' 
                          : 'hover:bg-[var(--accent-clinical)]/5 hover:text-[var(--accent-clinical)]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-bold text-[var(--text-primary)]">
                          {s.toLowerCase().startsWith(query.toLowerCase()) ? (
                            <>
                              <span className="text-[var(--accent-clinical)]">{s.substring(0, query.length)}</span>
                              {s.substring(query.length)}
                            </>
                          ) : s}
                        </span>
                      </span>
                      <Zap size={12} className={`transition-opacity ${idx === activeSuggestionIndex ? 'opacity-40' : 'opacity-0'}`} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
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

      {hasData && !compact && (
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
          {/* Histórico Column */}
          <div className="lg:col-span-2">
            <h3 className="text-[10px] font-black uppercase tracking-[3px] text-[var(--accent-clinical)] mb-6 flex items-center gap-3">
              <div className="w-6 h-[1px] bg-[var(--accent-clinical)] opacity-30"></div>
              Consultas Recientes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentSearches.length > 0 ? recentSearches.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => { setQuery(s); onSearch(s); }}
                  className="group relative flex items-center justify-between p-4 bg-[var(--surface-clinical)] border border-[var(--border-clinical)] rounded-xl hover:border-[var(--accent-clinical)] hover:shadow-md transition-all text-left overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-clinical)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="w-8 h-8 rounded-lg bg-[var(--bg-clinical)] flex items-center justify-center text-[var(--text-secondary)] group-hover:text-[var(--accent-clinical)] transition-colors">
                      <Search size={14} />
                    </div>
                    <span className="text-[14px] font-bold text-[var(--text-primary)] truncate max-w-[150px]">{s}</span>
                  </div>
                  <Zap size={14} className="text-[var(--text-secondary)] opacity-0 group-hover:opacity-40 transition-all transform translate-x-2 group-hover:translate-x-0" />
                </button>
              )) : (
                <div className="col-span-full p-12 border border-dashed border-[var(--border-clinical)] rounded-2xl text-center bg-[var(--surface-clinical)]/30">
                  <p className="text-[12px] text-[var(--text-secondary)] font-medium italic opacity-40">No hay registros en esta sesión.</p>
                </div>
              )}
            </div>
          </div>

          {/* Premium Analytics Dashboard Column */}
          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[3px] text-[var(--text-secondary)] mb-6 flex items-center gap-3">
              <div className="w-6 h-[1px] bg-[var(--text-secondary)] opacity-30"></div>
              Consola de Análisis
            </h3>
            <div className="flex flex-col gap-4">
              {/* Card: Pacientes */}
              <div className="relative group bg-[var(--surface-clinical)] p-5 rounded-2xl border border-[var(--border-clinical)] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Users size={64} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-[var(--accent-clinical)] animate-pulse"></div>
                    <span className="text-[9px] font-black uppercase text-[var(--accent-clinical)] tracking-widest">Base de Datos</span>
                  </div>
                  <div className="text-3xl font-black text-[var(--text-primary)] tracking-tighter mb-1">Activo</div>
                  <div className="text-[11px] text-[var(--text-secondary)] font-medium leading-relaxed">
                    Sincronización persistente con IndexedDB habilitada.
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-[var(--border-clinical)] flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[var(--text-secondary)]">Motor: RAM-First</span>
                  <div className="flex gap-1">
                    <div className="w-1 h-3 bg-[var(--accent-clinical)]/30 rounded-full h-1/2"></div>
                    <div className="w-1 h-3 bg-[var(--accent-clinical)] rounded-full"></div>
                    <div className="w-1 h-3 bg-[var(--accent-clinical)]/50 rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Card: Seguridad */}
              <div className="relative group bg-[var(--surface-clinical)] p-5 rounded-2xl border border-[var(--border-clinical)] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden">
                <div className="absolute -bottom-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
                  <ShieldCheck size={80} />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span className="text-[9px] font-black uppercase text-emerald-500 tracking-widest">Protocolo Privacidad</span>
                  </div>
                  <div className="text-2xl font-black text-[var(--text-primary)] tracking-tight">Isolated Local</div>
                  <div className="text-[11px] text-[var(--text-secondary)] mt-1 font-medium italic">
                    Sin rastro en servidor externo.
                  </div>
                </div>
              </div>

              {/* Card: Status Visualizer */}
              <div className="bg-gradient-to-br from-[var(--surface-clinical)] to-[var(--bg-clinical)] p-5 rounded-2xl border border-[var(--border-clinical)] shadow-inner">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[9px] font-black uppercase text-orange-500 tracking-widest">Rendimiento</span>
                  <span className="text-[11px] font-bold text-orange-500">Optimum</span>
                </div>
                <div className="space-y-3">
                  <div className="h-1.5 w-full bg-[var(--border-clinical)] rounded-full overflow-hidden">
                    <div className="h-full w-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all duration-1000"></div>
                  </div>
                  <div className="flex justify-between text-[9px] font-bold text-[var(--text-secondary)] uppercase">
                    <span>Indexación</span>
                    <span>Latencia (12ms)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
