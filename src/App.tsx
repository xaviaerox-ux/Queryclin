 import React, { useState, useEffect, useMemo } from 'react';
import { Sun, Moon, Database, Users, HelpCircle, ShieldCheck, Search } from 'lucide-react';
import * as XLSX from 'xlsx';
import { HCEData } from './core/types';
import { searchEngine, SearchResult } from './lib/searchEngine';
import { db } from './storage/indexedDB';
import Home from './components/Home';
import Results from './components/Results';
import HCEView from './components/HCEView';
import Help from './components/Help';
import Evolution from './components/Evolution';
import { FORMS } from './core/mappings';

/**
 * Error Boundary para mitigar fallos en tiempo de renderizado
 */
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state: { hasError: boolean } = { hasError: false };
  props!: { children: React.ReactNode };

  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--bg-clinical)] text-center p-10">
          <h2 className="text-2xl font-black text-[var(--accent-clinical)] mb-4">Sistema Temporalmente Fuera de Servicio</h2>
          <p className="text-[var(--text-secondary)] mb-6">Se ha detectado una excepción en la interfaz. Por favor, reinicia la sesión.</p>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-[var(--accent-clinical)] text-white font-bold rounded-xl shadow-lg">
            Reiniciar Aplicación
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const VERSION = '4.2.1';
const BUILD_DATE = '30/04/2026 10:37';

type ViewState = 'home' | 'results' | 'hce' | 'help' | 'evolution';

export default function App() {
  const [view, setView] = useState<ViewState>('home');
  const [data, setData] = useState<HCEData | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [patientCount, setPatientCount] = useState<number>(0);
  const [activeFormId, setActiveFormId] = useState<string>('');
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('queryclin_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    const initData = async () => {
      // Tarea A3: Persistencia de Sesión y Privacidad
      const isSessionActive = sessionStorage.getItem('queryclin_active_session');
      if (!isSessionActive) {
        console.warn("[Privacidad] Nueva sesión detectada. Limpiando IndexedDB para prevenir retención de datos médicos.");
        await db.clear();
        sessionStorage.setItem('queryclin_active_session', 'true');
        setData(null);
        setPatientCount(0);
        return;
      }

      const count = await db.getFromStore(db.stores.metadata, 'patient_count');
      const formId = await db.getFromStore(db.stores.metadata, 'form_id');
      if (count) {
        setData({ patients: {} });
        setPatientCount(count);
        if (formId) setActiveFormId(formId);
        await searchEngine.loadIndex({ patients: {} });
        await searchEngine.loadDictionary();
      }
    };
    initData();
  }, []);

  // Tarea A3: Advertencia en beforeunload si hay datos cargados
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (patientCount > 0) {
        const msg = "Si abandonas la página se perderán los datos clínicos cargados en memoria.";
        e.returnValue = msg;
        return msg;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [patientCount]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('queryclin_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleFileUpload = async (file: File, formId: string, config?: { fileType: string, delimiter: string }) => {
    const mapping = FORMS.find(f => f.id === formId);
    if (!mapping) {
        alert("Error crítico: Formulario no válido.");
        return;
    }

    setIsProcessing(true);
    setDebugLogs([]);
    setProgressPercent(0);

    try {
      const buffer = await file.arrayBuffer();
      let text = '';

      if (file.name.toLowerCase().endsWith('.xlsx') || config?.fileType === 'xlsx') {
        const workbook = XLSX.read(buffer, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        text = XLSX.utils.sheet_to_csv(worksheet, { FS: config?.delimiter || '|' });
        console.log('[App] Archivo Excel convertido a CSV para procesamiento');
      } else {
        try {
          const decoder = new TextDecoder('utf-8', { fatal: true });
          text = decoder.decode(buffer);
          console.log('[App] Archivo decodificado como UTF-8');
        } catch (err) {
          console.warn('[App] Fallo en UTF-8, intentando con IBM850 (DOS)...');
          const testDecoder = new TextDecoder('windows-1252');
          text = testDecoder.decode(buffer);
          
          if (text.includes('¢') || text.includes(' ') || text.includes('¡') || text.includes('¤')) {
             console.log('[App] Detectada codificación CP850 (DOS), aplicando transcodificación...');
             text = decodeCP850(buffer);
          }
        }
      }

      const worker = new Worker(new URL('./ingestion/csv.worker.ts', import.meta.url) + '?v=' + Date.now(), { type: 'module' });
      worker.postMessage({ 
        csvText: text, 
        mapping, 
        strictMode: false,
        delimiter: config?.delimiter || '|',
        source_file: file.name,
        ingest_timestamp: new Date().toISOString()
      });
      
      worker.onmessage = async (event) => {
        const { type, progress, total, message, patientCount } = event.data;

        if (type === 'progress') {
          const percent = Math.round((progress / total) * 100);
          setProgressPercent(percent);
          console.log(`[Ingesta] Progreso: ${progress} / ${total} (${percent}%)`);
          return;
        }

        if (type === 'complete') {
          console.log("[App] Ingesta completada. Sincronizando interfaz...");
          
          // Primero actualizamos estados ligeros para cerrar el cargador
          setPatientCount(patientCount);
          setActiveFormId(formId);
          setData({ patients: {} }); 
          setIsProcessing(false);
          worker.terminate();

          // Cargamos el índice pesado en el siguiente tick
          setTimeout(async () => {
            try {
              await searchEngine.loadIndex({ patients: {} }); 
              await searchEngine.loadDictionary();
            } catch (err: any) {
              console.error("[App] Error diferido al cargar el índice:", err);
              alert("Aviso: El buscador puede tardar unos segundos en activarse.");
            }
          }, 100);
        } else if (type === 'debug_error') {
          setDebugLogs(event.data.logs);
          setIsProcessing(false);
          worker.terminate();
        } else if (type === 'debug_warn') {
          // No aborta, solo acumula los logs
          setDebugLogs(prev => [...prev, ...event.data.logs]);
        } else if (type === 'error') {
          console.error("Error en el worker:", message);
          alert("Error crítico durante la ingesta: " + message);
          setIsProcessing(false);
          worker.terminate();
        }
      };


      worker.onerror = (err) => {
        console.error("Fallo crítico del worker:", err);
        setIsProcessing(false);
        worker.terminate();
      };
    } catch (err: any) {
      console.error("Fallo crítico en handleFileUpload:", err);
      setIsProcessing(false);
      alert("Error preparando el archivo para ingesta: " + err.message);
    }
  };

  const handleSearch = async (q: string, filters?: { dateRange?: [string, string], service?: string }) => {
    setQuery(q);
    const results = await searchEngine.search(q, filters);
    setSearchResults(results);
    setView('results');
  };

  const handleClearData = async () => {
    // Tarea B1: Confirmación de Borrado
    if (window.confirm("¿Está seguro de que desea eliminar todos los registros clínicos de la memoria? Esta acción no se puede deshacer y requerirá volver a importar el archivo CSV.")) {
      try {
        setIsProcessing(true);
        await db.clear();
        searchEngine.startIndexing(); // Reinicia el estado interno del buscador
        setData(null);
        setPatientCount(0);
        setActiveFormId('');
        setSearchResults([]);
        setView('home');
        setIsProcessing(false);
        console.log("[UI] Estado reseteado tras limpieza de DB.");
      } catch (err) {
        console.error("Error al limpiar la base de datos:", err);
        alert("No se pudo limpiar la base de datos completamente.");
        setIsProcessing(false);
      }
    }
  };

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col bg-[var(--bg-clinical)] text-[var(--text-primary)] font-sans overflow-hidden">
        <header className="h-[64px] bg-[var(--glass-bg)] backdrop-blur-md border-b border-[var(--border-clinical)] px-6 flex items-center justify-between z-[100] shrink-0">
          <div className="flex items-center gap-4 shrink-0 h-full">
            <div 
              className="flex items-center gap-3 cursor-pointer group h-full py-2"
              onClick={() => { setView('home'); setQuery(''); }}
            >
              <div className="text-[20px] font-black tracking-tighter text-[var(--accent-clinical)] flex items-baseline">
                Query<span className="font-light text-[var(--text-primary)]">clin</span>
              </div>
              <div className="h-6 w-px bg-[var(--border-clinical)] opacity-30 mx-1 self-center" />
              <div className="flex items-center text-[19px] font-medium tracking-[-0.03em] select-none antialiased">
                <span className="text-[#4285F4]">N</span>
                <span className="text-[#EA4335]">a</span>
                <span className="text-[#FBBC05]">c</span>
                <span className="text-[#4285F4]">h</span>
                <span className="text-[#34A853]">u</span>
                <span className="text-[#EA4335]">S</span>
              </div>
            </div>
            <button 
              onClick={() => setView('evolution')}
              className="px-2 py-0.5 text-[9px] font-black bg-[var(--accent-clinical)]/10 text-[var(--accent-clinical)] border border-[var(--accent-clinical)]/20 rounded-full hover:bg-[var(--accent-clinical)] hover:text-white transition-all active:scale-95 flex items-center gap-1 self-center" 
              title={`Click para ver la evolución del proyecto`}
            >
              <span>V{VERSION}</span>
              <span className="opacity-50 border-l border-[var(--accent-clinical)]/30 pl-1">{BUILD_DATE}</span>
            </button>
          </div>

          {/* Buscador Integrado en Cabecera */}
          {view !== 'home' && (data || patientCount > 0) && (
            <div className="flex-1 max-w-xl mx-8 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="relative flex items-center group">
                <Search className="absolute left-4 text-[var(--text-secondary)] group-focus-within:text-[var(--accent-clinical)] transition-colors" size={16} />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch(query);
                    }
                  }}
                  placeholder="Buscar paciente, patología, síntoma..."
                  className="w-full pl-10 pr-4 py-2 bg-[var(--bg-clinical)] border border-[var(--border-clinical)] rounded-xl focus:border-[var(--accent-clinical)] focus:outline-none transition-all text-sm font-bold text-[var(--text-primary)] shadow-sm"
                />
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-4 h-full">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-[var(--border-clinical)] transition-colors text-[var(--text-secondary)]"
              title={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button
              onClick={() => setView('help')}
              className={`p-2 rounded-full transition-all ${view === 'help' ? 'bg-[var(--accent-clinical)] text-white' : 'hover:bg-[var(--border-clinical)] text-[var(--text-secondary)]'}`}
              title="Guía de uso y documentación"
            >
              <HelpCircle size={20} />
            </button>
            {data && (
              <div className="flex items-center gap-6 border-l border-[var(--border-clinical)] pl-4 h-full">
                <button 
                  onClick={() => handleSearch('')}
                  className="flex flex-col items-end hover:opacity-80 active:scale-95 transition-all cursor-pointer group"
                  title="Explorar el padrón completo de pacientes"
                >
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] group-hover:text-[var(--accent-clinical)] transition-colors">Pacientes</span>
                  <span className="text-[14px] font-bold text-[var(--text-primary)]">{patientCount}</span>
                </button>
                <button 
                  onClick={handleClearData}
                  className="p-2 rounded-xl text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-50/50 transition-all"
                  title="Limpiar base de datos local"
                >
                  <Database size={20} />
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto relative bg-[var(--bg-clinical)]">
          {isProcessing && (
            <div className="fixed inset-0 bg-[var(--bg-clinical)]/90 backdrop-blur-md z-[100] flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
              <div className="w-20 h-20 border-4 border-[var(--accent-clinical)] border-t-transparent rounded-full animate-spin mb-8 shadow-[0_0_30px_rgba(var(--accent-clinical-rgb),0.2)]"></div>
              
              <div className="max-w-md w-full space-y-6 text-center">
                <h2 className="text-2xl font-black text-[var(--text-primary)]">Procesando registros médicos...</h2>
                <p className="text-[var(--text-secondary)] font-medium">Queryclin está organizando e indexando la base de datos local para permitir la búsqueda instantánea de los pacientes importados.</p>
                
                {/* Barra de Progreso Evolutiva */}
                <div className="w-full bg-[var(--surface-clinical)] h-4 rounded-full border border-[var(--border-clinical)] overflow-hidden shadow-inner p-1">
                  <div 
                    className="h-full bg-gradient-to-r from-[var(--accent-clinical)] to-emerald-500 rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(var(--accent-clinical-rgb),0.4)]"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-60">
                  <span>Estado: Ingesta Activa</span>
                  <span>{progressPercent}% Completado</span>
                </div>
              </div>
            </div>
          )}

          {debugLogs.length > 0 && !isProcessing && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex flex-col items-center justify-center p-8 animate-in fade-in">
              <div className="bg-red-950 border border-red-500 rounded-2xl w-full max-w-3xl p-8 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="flex items-center gap-4 mb-6 text-red-500">
                  <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-widest">Modo Debug</h2>
                    <p className="text-red-400/80 font-bold text-sm">Registro de inconsistencias o alertas.</p>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto bg-black/50 rounded-xl p-4 border border-red-500/30 space-y-2">
                  {debugLogs.map((log, i) => (
                    <div key={i} className="text-red-300 font-mono text-[13px] break-words">
                      <span className="opacity-50 mr-2">[{String(i+1).padStart(3, '0')}]</span>
                      {log}
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex justify-end">
                  <button 
                    onClick={() => setDebugLogs([])}
                    className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95"
                  >
                    Entendido, cerrar
                  </button>
                </div>
              </div>
            </div>
          )}

          {view === 'home' && (
            <div className="transition-all duration-500 ease-in-out">
              <Home 
                onUpload={handleFileUpload} 
                onSearch={handleSearch} 
                getSuggestions={(q) => searchEngine.getSuggestions(q)}
                hasData={!!data || patientCount > 0} 
              />
            </div>
          )}
          {view === 'results' && (
            <div className="pt-8">
              <Results 
                results={searchResults} 
                query={query}
                onBack={() => { setQuery(''); setView('home'); }} 
                onSelect={(res) => {
                  const idx = searchResults.findIndex(r => r.nhc === res.nhc);
                  setSelectedIndex(idx);
                  setView('hce');
                }}
              />
            </div>
          )}
          {view === 'hce' && selectedIndex !== -1 && (
            <HCEView 
              results={searchResults}
              currentIndex={selectedIndex}
              onBack={() => setView('results')}
              query={query}
              onNavigate={(idx: number) => setSelectedIndex(idx)}
              formId={activeFormId}
            />
          )}
          {view === 'help' && (
            <Help onBack={() => setView('home')} />
          )}
          {view === 'evolution' && (
            <Evolution onBack={() => setView('home')} />
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}

/**
 * Decodificador manual para CP850 (MS-DOS Latin 1).
 * Esencial para exportaciones de sistemas hospitalarios antiguos que no usan estándares modernos.
 */
function decodeCP850(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const cp850Map: Record<number, string> = {
    160: 'á', 130: 'é', 161: 'í', 162: 'ó', 163: 'ú',
    164: 'ñ', 165: 'Ñ', 129: 'ü', 154: 'Ü',
    181: 'Á', 144: 'É', 214: 'Í', 224: 'Ó', 233: 'Ú',
    173: '¡', 168: '¿', 245: '§', 241: '±'
  };

  let result = '';
  for (let i = 0; i < bytes.length; i++) {
    const byte = bytes[i];
    if (byte < 128) {
      result += String.fromCharCode(byte);
    } else {
      result += cp850Map[byte] || '?';
    }
  }
  return result;
}
