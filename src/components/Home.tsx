import React, { useState, useRef } from 'react';
import { Search, Upload, ShieldCheck, Database, Zap, Filter, Calendar, Stethoscope } from 'lucide-react';
import { FORMS } from '../core/mappings';

interface HomeProps {
  hasData: boolean;
  onUpload: (file: File, formId: string, config?: any) => void;
  onSearch: (query: string, filters?: { dateRange?: [string, string], service?: string }) => void;
  getSuggestions: (query: string) => string[];
  compact?: boolean;
}

export default function Home({ hasData, onUpload, onSearch, getSuggestions, compact = false }: HomeProps) {
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
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [ingestionConfig, setIngestionConfig] = useState({
    fileType: 'auto'
  });

  
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
          <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed">
            Seleccione el formulario clínico correspondiente antes de importar la matriz de datos (.txt, .xlsx).
          </p>

          <div className="space-y-8 mt-8">
            {/* Paso 1 */}
            <div className="relative pl-10 text-left border-l-2 border-dashed border-[var(--border-clinical)] pb-4">
              <div className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-[var(--accent-clinical)] text-white text-[10px] font-black flex items-center justify-center shadow-lg">1</div>
              <label className="block text-[11px] font-black text-[var(--accent-clinical)] uppercase tracking-[2px] mb-3">
                Seleccionar Modelo Clínico
              </label>
              <div className="relative group">
                <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--accent-clinical)]" size={16} />
                <select
                  value={selectedFormId}
                  onChange={(e) => setSelectedFormId(e.target.value)}
                  className="w-full pl-10 pr-4 py-4 bg-[var(--bg-clinical)] border-2 border-[var(--border-clinical)] rounded-xl focus:border-[var(--accent-clinical)] focus:outline-none transition-all text-sm font-bold text-[var(--text-primary)] cursor-pointer"
                >
                  <option value="" disabled>-- Elegir especialidad --</option>
                  {FORMS.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Paso 2 */}
            <div className="relative pl-10 text-left border-l-2 border-dashed border-[var(--border-clinical)] pb-4">
              <div className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-[var(--accent-clinical)] text-white text-[10px] font-black flex items-center justify-center shadow-lg">2</div>
              <label className="block text-[11px] font-black text-[var(--accent-clinical)] uppercase tracking-[2px] mb-3">
                Configurar Archivo de Datos
              </label>
              <div className="relative group">
                <Database className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] group-focus-within:text-[var(--accent-clinical)]" size={16} />
                <select
                  value={ingestionConfig.fileType}
                  onChange={(e) => setIngestionConfig(prev => ({ ...prev, fileType: e.target.value }))}
                  className="w-full pl-10 pr-4 py-4 bg-[var(--bg-clinical)] border-2 border-[var(--border-clinical)] rounded-xl focus:border-[var(--accent-clinical)] focus:outline-none transition-all text-sm font-bold text-[var(--text-primary)] cursor-pointer"
                >
                  <option value="auto">Detección Automática (Recomendado)</option>
                  <option value="txt">Archivo Plano / Texto (.txt, .csv)</option>
                  <option value="xlsx">Libro Excel (.xlsx)</option>
                </select>
              </div>
            </div>

            {/* Paso 3 */}
            <div className="relative pl-10 text-left">
              <div className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-[var(--accent-clinical)] text-white text-[10px] font-black flex items-center justify-center shadow-lg">3</div>
              <label className="block text-[11px] font-black text-[var(--accent-clinical)] uppercase tracking-[2px] mb-3">
                Finalizar Importación
              </label>
              <input
                type="file"
                accept=".csv, .txt, .xlsx"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && selectedFormId) {
                     onUpload(file, selectedFormId, { ...ingestionConfig, delimiter: '|' });
                     if (fileInputRef.current) fileInputRef.current.value = '';
                  }
                }}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={!selectedFormId}
                className="w-full bg-[var(--accent-clinical)] hover:bg-[var(--accent-clinical)]/90 disabled:opacity-30 disabled:grayscale text-white font-black py-4 px-6 rounded-xl transition-all shadow-[0_8px_30px_rgb(0,0,0,0.12)] active:scale-[0.98] flex items-center justify-center gap-3"
              >
                <Upload size={20} />
                {selectedFormId ? 'CARGAR ARCHIVO AHORA' : 'SELECCIONE MODELO'}
              </button>
            </div>
          </div>
          
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
          <div className="absolute top-full left-0 right-0 mt-4 bg-[var(--surface-clinical)] border border-[var(--border-clinical)] rounded-2xl p-6 shadow-2xl z-20 animate-in fade-in slide-in-from-top-2 duration-300">
            <div>
              <label className="flex items-center gap-2 text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                <Calendar size={14} /> Rango de Fechas
              </label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                   <input
                    type="date"
                    value={dateStart}
                    onChange={(e) => setDateStart(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--bg-clinical)] border border-[var(--border-clinical)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-clinical)] text-sm text-[var(--text-primary)]"
                  />
                </div>
                <span className="text-[var(--text-secondary)] font-bold">HASTA</span>
                <div className="flex-1">
                  <input
                    type="date"
                    value={dateEnd}
                    onChange={(e) => setDateEnd(e.target.value)}
                    className="w-full px-4 py-3 bg-[var(--bg-clinical)] border border-[var(--border-clinical)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--accent-clinical)] text-sm text-[var(--text-primary)]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </form>

      {hasData && !compact && (
        <div className="mt-16 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
          {/* Histórico Column */}
          <div className="w-full">
            <h3 className="text-[10px] font-black uppercase tracking-[3px] text-[var(--accent-clinical)] mb-6 flex items-center gap-3">
              <div className="w-6 h-[1px] bg-[var(--accent-clinical)] opacity-30"></div>
              Consultas Recientes
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
        </div>
      )}

    </div>
  );
}
