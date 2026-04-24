import { useState, useEffect } from 'react';
import { SearchResult } from '../lib/searchEngine';
import { ArrowLeft, FileText, Download, Activity, User, UserPlus } from 'lucide-react';

interface ResultsProps {
  results: SearchResult[];
  query: string;
  onSelect: (result: SearchResult) => void;
  onBack: () => void;
}

import { db } from '../lib/db';
import { Patient, getGender } from '../lib/dataStore';

function PatientAvatar({ gender, size = 28 }: { gender: 'male' | 'female' | 'neutral', size?: number }) {
  const config = {
    male: {
      bg: 'bg-cyan-500/10',
      text: 'text-cyan-500',
      border: 'border-cyan-500/20',
      Icon: User
    },
    female: {
      bg: 'bg-purple-400/10',
      text: 'text-purple-400',
      border: 'border-purple-400/20',
      Icon: User
    },
    neutral: {
      bg: 'bg-[var(--accent-clinical)]/10',
      text: 'text-[var(--accent-clinical)]',
      border: 'border-[var(--accent-clinical)]/20',
      Icon: User
    }
  };

  const { bg, text, border, Icon } = config[gender];

  return (
    <div className={`w-14 h-14 ${bg} ${text} ${border} border rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm`}>
      <Icon size={size} />
    </div>
  );
}

function ResultCard({ res, onSelect }: { key?: string; res: SearchResult, onSelect: (r: SearchResult) => void }) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchDemographics = async () => {
      const p = await db.getFromStore(db.stores.patients, res.nhc);
      if (active && p) {
        setPatient(p);
        setLoading(false);
      }
    };
    fetchDemographics();
    return () => { active = false; };
  }, [res.nhc]);

  const demographics = patient?.demographics || {};
  const nameKey = Object.keys(demographics).find(k => k.toUpperCase().includes('NOMBRE')) || '';
  const name = nameKey ? demographics[nameKey] : `Paciente ${res.nhc}`;

  return (
    <div 
      onClick={() => onSelect(res)}
      className="bg-[var(--surface-clinical)] p-6 rounded-2xl shadow-lg border border-[var(--border-clinical)] hover:border-[var(--accent-clinical)] transition-all cursor-pointer flex items-center gap-6 group relative overflow-hidden"
    >
      <PatientAvatar gender={getGender(demographics)} />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          {loading ? (
            <div className="h-6 w-48 bg-[var(--border-clinical)] animate-pulse rounded-md"></div>
          ) : (
            <h3 className="text-[18px] font-black text-[var(--text-primary)] flex items-center gap-2 group-hover:text-[var(--accent-clinical)] transition-colors">
              {name}
            </h3>
          )}
          <span className="text-[11px] font-black bg-[var(--accent-clinical)]/10 text-[var(--accent-clinical)] px-3 py-1.5 rounded-full uppercase tracking-widest">
            Score: {res.totalScore.toFixed(1)}
          </span>
        </div>
        
        <div className="flex gap-3 flex-wrap mt-3 items-center text-[12px] text-[var(--text-secondary)]">
          <span className="bg-[var(--bg-clinical)] px-3 py-1.5 rounded-lg border border-[var(--border-clinical)] font-bold flex items-center gap-1.5">NHC: {res.nhc}</span>
          <span className="bg-[var(--bg-clinical)] px-3 py-1.5 rounded-lg border border-[var(--border-clinical)] font-bold flex items-center gap-1.5" title="Número de sesiones con hallazgos">
            <Activity size={14} className="text-[var(--accent-clinical)]" /> 
            {res.matchingTomasCount} Tomas
          </span>
          {res.matchedRegistros.length > 0 && (
            <span className="bg-[var(--accent-clinical)] text-white px-3 py-1.5 rounded-lg font-black flex items-center gap-1.5 shadow-sm">
              {res.matchedRegistros.length} Coincidencias
            </span>
          )}
        </div>

      </div>
    </div>
  );
}


export default function Results({ results, query, onSelect, onBack }: ResultsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  
  const totalPages = Math.ceil(results.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleResults = results.slice(startIndex, startIndex + itemsPerPage);

  // Resetear a la página 1 cuando cambie la búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [results]);

  const handleExportCSV = async () => {
    if (results.length === 0) return;

    // Obtener los pacientes completos desde la DB (asíncrono)
    const fullPatients: Patient[] = [];
    for (const res of results) {
       const p = await db.getFromStore(db.stores.patients, res.nhc);
       if (p) fullPatients.push(p);
    }

    if (fullPatients.length === 0) {
      alert("No se pudieron cargar los datos completos para exportar.");
      return;
    }

    // Identificar todas las cabeceras posibles de los registros de estos pacientes
    const tempKeys = new Set<string>();
    fullPatients.forEach(p => {
       Object.values(p.tomas).forEach(toma => {
          toma.registros.forEach(registro => {
             Object.keys(registro.data).forEach(k => tempKeys.add(k));
          });
       });
    });
    const keys = Array.from(tempKeys);
    
    // Generar CSV
    let csvContent = '\uFEFF'; 
    csvContent += keys.map(k => `"${k.replace(/"/g, '""')}"`).join(',') + '\n';

    fullPatients.forEach(p => {
      Object.values(p.tomas).forEach(toma => {
        toma.registros.forEach(registro => {
          const row = keys.map(k => registro.data[k] || '');
          csvContent += row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',') + '\n';
        });
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
        {visibleResults.map((res, idx) => (
          <ResultCard key={`res_${res.nhc}_${idx}`} res={res} onSelect={onSelect} />
        ))}

        {/* Controles de Paginación */}
        {results.length > itemsPerPage && (
          <div className="flex items-center justify-center gap-4 mt-8 mb-12">
            <button
              disabled={currentPage === 1}
              onClick={() => {
                setCurrentPage(prev => prev - 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-6 py-2 bg-[var(--surface-clinical)] border border-[var(--border-clinical)] rounded-xl font-bold text-[var(--text-secondary)] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[var(--accent-clinical)] transition-all"
            >
              Anterior
            </button>
            <span className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest">
              Página {currentPage} de {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => {
                setCurrentPage(prev => prev + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-6 py-2 bg-[var(--surface-clinical)] border border-[var(--border-clinical)] rounded-xl font-bold text-[var(--text-secondary)] disabled:opacity-30 disabled:cursor-not-allowed hover:border-[var(--accent-clinical)] transition-all"
            >
              Siguiente
            </button>
          </div>
        )}

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
