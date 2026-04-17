import React, { useState, useEffect, useMemo } from 'react';
import { Sun, Moon, Database, Users } from 'lucide-react';
import { HCEData, storage } from './lib/dataStore';
import { searchEngine, SearchResult } from './lib/searchEngine';
import { db } from './lib/db';
import Home from './components/Home';
import Results from './components/Results';
import HCEView from './components/HCEView';

/**
 * Error Boundary para mitigar fallos en tiempo de renderizado
 */
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
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

export type ViewState = 'home' | 'results' | 'hce';

export default function App() {
  const [view, setView] = useState<ViewState>('home');
  const [data, setData] = useState<HCEData | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [patientCount, setPatientCount] = useState<number>(0);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('queryclin_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    const initData = async () => {
      const loaded = await storage.loadData();
      const count = await db.getFromStore(db.stores.metadata, 'patient_count');
      if (loaded || count) {
        setData(loaded || { patients: {} });
        setPatientCount(count || 0);
        await searchEngine.loadIndex(loaded || { patients: {} });
      }
    };
    initData();
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('queryclin_theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleFileUpload = (file: File) => {
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const worker = new Worker(new URL('./lib/parser.worker.ts', import.meta.url), { type: 'module' });
      worker.postMessage({ csvText: text });
      worker.onmessage = async (event) => {
        const { success, count, error } = event.data;
        if (success) {
          setPatientCount(count);
          setData({ patients: {} });
          await searchEngine.loadIndex({ patients: {} }); 
          setIsProcessing(false);
        } else {
          console.error("Error en el worker:", error);
          alert("Error procesando el archivo: " + error);
          setIsProcessing(false);
        }
        worker.terminate();
      };

      worker.onerror = (err) => {
        console.error("Fallo crítico del worker:", err);
        setIsProcessing(false);
        worker.terminate();
      };
    };
    reader.readAsText(file);
  };

  const handleSearch = async (q: string, filters?: { dateRange?: [string, string], service?: string }) => {
    setQuery(q);
    const results = await searchEngine.search(q, filters);
    setSearchResults(results);
    setView('results');
  };

  const handleClearData = () => {
    db.clear();
    setData(null);
    setPatientCount(0);
    setView('home');
    setSearchResults([]);
  };

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col bg-[var(--bg-clinical)] text-[var(--text-primary)] font-sans overflow-hidden">
        <header className="h-[64px] bg-[var(--glass-bg)] backdrop-blur-md border-b border-[var(--border-clinical)] px-6 flex items-center justify-between z-[100] shrink-0">
          <div 
            className="text-[20px] font-black tracking-tight cursor-pointer flex items-center gap-2 text-[var(--accent-clinical)]"
            onClick={() => setView('home')}
          >
            <span>Query<span className="font-light text-[var(--text-primary)]">clin</span> <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold bg-[var(--accent-clinical)] text-white rounded-md opacity-80" title="Última actualización: 17/04/2026 11:45">V2.1</span></span>
          </div>
          
          <div className="flex items-center gap-4 h-full">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-[var(--border-clinical)] transition-colors text-[var(--text-secondary)]"
              title={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
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
            <div className="absolute inset-0 bg-[var(--bg-clinical)]/80 backdrop-blur-sm z-[200] flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 border-4 border-[var(--accent-clinical)] border-t-transparent rounded-full animate-spin mb-6"></div>
              <h2 className="text-2xl font-black mb-2">Procesando registros médicos...</h2>
              <p className="text-[var(--text-secondary)] max-w-md">Queryclin está organizando e indexando la base de datos local para permitir la búsqueda instantánea de los pacientes importados.</p>
            </div>
          )}

          {view === 'home' && (
            <Home 
              onUpload={handleFileUpload} 
              onSearch={handleSearch} 
              hasData={!!data || patientCount > 0} 
            />
          )}
          {view === 'results' && (
            <Results 
              results={searchResults} 
              query={query}
              onBack={() => setView('home')} 
              onSelect={(res) => {
                const idx = searchResults.findIndex(r => r.nhc === res.nhc);
                setSelectedIndex(idx);
                setView('hce');
              }}
            />
          )}
          {view === 'hce' && selectedIndex !== -1 && (
            <HCEView 
              results={searchResults}
              currentIndex={selectedIndex}
              onBack={() => setView('results')}
              query={query}
              onIndexChange={setSelectedIndex}
            />
          )}
        </main>
      </div>
    </ErrorBoundary>
  );
}
