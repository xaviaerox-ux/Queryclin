import { SearchResult } from '../lib/searchEngine';
import { ArrowLeft, FileText, Download, Activity, User } from 'lucide-react';

interface ResultsProps {
  results: SearchResult[];
  query: string;
  onSelect: (result: SearchResult) => void;
  onBack: () => void;
}

export default function Results({ results, query, onSelect, onBack }: ResultsProps) {
  const handleExportCSV = () => {
    if (results.length === 0) return;

    const tempKeys = new Set<string>();
    results.forEach(res => {
       res.matchedRegistros.forEach(match => {
          Object.keys(match.record.data).forEach(k => tempKeys.add(k));
       });
    });
    const keys = Array.from(tempKeys);
    
    const metaKeys = ['NHC_ID', 'ID_TOMA', 'ORDEN_TOMA', 'SCORE_BUSQUEDA'];

    let csvContent = '\uFEFF'; 
    csvContent += [...metaKeys, ...keys].map(k => `"${k.replace(/"/g, '""')}"`).join(',') + '\n';

    results.forEach(res => {
      res.matchedRegistros.forEach(match => {
        const row = [
          res.nhc,
          match.idToma,
          match.ordenToma.toString(),
          match.score.toString(),
          ...keys.map(k => match.record.data[k] || '')
        ];
        
        csvContent += row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',') + '\n';
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeQuery = query.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.href = url;
    link.setAttribute('download', `queryclin_export_${safeQuery || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-[var(--surface-clinical)] rounded-xl transition-colors text-[var(--text-secondary)]"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-[var(--text-primary)]">Pacientes Coincidentes</h2>
            <p className="text-[var(--text-secondary)] text-sm font-medium">
              {results.length} pacientes hallados {query ? `para "${query}"` : 'en base de datos'}.
            </p>
          </div>
        </div>

        {results.length > 0 && (
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-[var(--accent-clinical)] hover:opacity-90 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95"
            title="Exportar a CSV"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {results.map((res, idx) => {
          const record = res.patient.demographics;
          const nameKey = Object.keys(record).find(k => k.toUpperCase().includes('NOMBRE')) || '';
          const name = nameKey ? record[nameKey] : `Sin nombre registrado`;

          return (
            <div 
              key={`result_${res.nhc}_${idx}`}
              onClick={() => onSelect(res)}
              className="bg-[var(--surface-clinical)] p-6 rounded-2xl shadow-lg border border-[var(--border-clinical)] hover:border-[var(--accent-clinical)] transition-all cursor-pointer flex items-center gap-6 group relative overflow-hidden"
            >
              <div className="w-14 h-14 bg-[var(--accent-clinical)]/10 text-[var(--accent-clinical)] rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <User size={28} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[18px] font-black text-[var(--text-primary)] flex items-center gap-2 group-hover:text-[var(--accent-clinical)] transition-colors">
                    {name}
                  </h3>
                  <span className="text-[11px] font-black bg-[var(--accent-clinical)]/10 text-[var(--accent-clinical)] px-3 py-1.5 rounded-full uppercase tracking-widest">
                    Score: {res.totalScore.toFixed(1)}
                  </span>
                </div>
                
                <div className="flex gap-3 flex-wrap mt-3 items-center text-[12px] text-[var(--text-secondary)]">
                  <span className="bg-[var(--bg-clinical)] px-3 py-1.5 rounded-lg border border-[var(--border-clinical)] font-bold flex items-center gap-1.5">NHC: {res.nhc}</span>
                  <span className="bg-[var(--bg-clinical)] px-3 py-1.5 rounded-lg border border-[var(--border-clinical)] font-bold flex items-center gap-1.5">
                    <Activity size={14} className="text-[var(--accent-clinical)]" /> 
                    {res.matchingTomasCount} Tomas
                  </span>
                  <span className="bg-[var(--bg-clinical)] px-3 py-1.5 rounded-lg border border-[var(--border-clinical)] font-bold">
                    {res.matchedRegistros.length} Registros
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {results.length === 0 && (
          <div className="text-center py-24 bg-[var(--surface-clinical)] rounded-2xl border border-dashed border-[var(--border-clinical)] shadow-sm">
            <div className="w-16 h-16 bg-[var(--bg-clinical)] rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--text-secondary)]/40">
              <FileText size={32} />
            </div>
            <p className="text-[var(--text-secondary)] text-lg font-bold">No se han encontrado pacientes coincidentes.</p>
          </div>
        )}
      </div>
    </div>
  );
}
