import { useState, useEffect } from 'react';
import { HCEData, storage, groupData } from './lib/dataStore';
import { parseCSV } from './lib/csvParser';
import { searchEngine, SearchResult } from './lib/searchEngine';
import Home from './components/Home';
import Results from './components/Results';
import HCEView from './components/HCEView';
import { Moon, Sun } from 'lucide-react';

export type ViewState = 'home' | 'results' | 'hce';

export default function App() {
  const [data, setData] = useState<HCEData | null>(null);
  const [view, setView] = useState<ViewState>('home');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [query, setQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    const loaded = storage.loadData();
    if (loaded) {
      setData(loaded);
      searchEngine.loadIndex(loaded);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const records = parseCSV(text);
      const grouped = groupData(records);
      setData(grouped);
      storage.saveData(grouped);
      searchEngine.buildIndex(grouped);
    };
    reader.readAsText(file);
  };

  const handleSearch = (q: string, filters?: { dateRange?: [string, string], service?: string }) => {
    setQuery(q);
    if (!data) return;
    const results = searchEngine.search(q, filters);
    setSearchResults(results);
    setView('results');
  };

  const handleClearData = () => {
    storage.clearData();
    setData(null);
    setView('home');
    setSearchResults([]);
  };

  return (
    <div className={`h-screen flex flex-col font-['Inter',Helvetica,Arial,sans-serif] overflow-hidden`}>
      <header className="h-[72px] glass z-[100] px-8 flex items-center justify-between border-b shrink-0">
        <div 
          className="text-[22px] font-black tracking-tighter cursor-pointer flex items-center gap-2 text-[var(--accent)]"
          onClick={() => setView('home')}
        >
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] text-white flex items-center justify-center font-black text-sm">H</div>
          <span>HCE <span className="font-light text-[var(--text-main)] opacity-60">Intelligence</span></span>
        </div>
        
        <div className="flex items-center gap-8">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-2xl transition-all active:scale-95"
            title={isDarkMode ? 'Modo claro' : 'Modo oscuro'}
          >
            {isDarkMode ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-slate-600" />}
          </button>

          {data && (
            <div className="flex items-center gap-6 border-l border-black/5 dark:border-white/10 pl-8">
              <div className="flex flex-col items-end">
                <span className="text-[11px] font-black uppercase tracking-widest opacity-40">Pacientes</span>
                <span className="text-[14px] font-bold">{Object.keys(data.patients).length}</span>
              </div>
              <button 
                onClick={handleClearData}
                className="text-[12px] font-black uppercase tracking-wider text-red-500 hover:text-red-600 transition-colors"
              >
                Limpiar
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative">
        <main className="h-full overflow-y-auto p-8 relative z-10 scroll-smooth">
          {view === 'home' && (
            <Home 
              hasData={!!data} 
              onUpload={handleFileUpload} 
              onSearch={handleSearch} 
            />
          )}
          {view === 'results' && (
            <Results 
              results={searchResults} 
              query={query}
              onSelect={(res) => {
                const idx = searchResults.findIndex(r => r.nhc === res.nhc && r.idToma === res.idToma && r.ordenToma === res.ordenToma);
                setSelectedIndex(idx);
                setView('hce');
              }}
              onBack={() => setView('home')}
            />
          )}
          {view === 'hce' && selectedIndex !== -1 && data && (
            <HCEView 
              results={searchResults}
              currentIndex={selectedIndex}
              onIndexChange={setSelectedIndex}
              onBack={() => setView('results')}
              query={query}
              data={data}
            />
          )}
        </main>
        
        {/* Background Decorative Element */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--accent)] opacity-[0.03] dark:opacity-[0.05] blur-[120px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-[#8b5cf6] opacity-[0.02] dark:opacity-[0.04] blur-[120px] rounded-full pointer-events-none"></div>
      </div>
    </div>
  );
}
