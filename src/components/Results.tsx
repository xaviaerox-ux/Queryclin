import { useState, useEffect } from 'react';
import { SearchResult } from '../lib/searchEngine';
import { ArrowLeft, FileText, Activity, User, ChevronRight, FileSpreadsheet } from 'lucide-react';
import { db } from '../storage/indexedDB';
import { Patient, getGender } from '../core/types';
import * as XLSX from 'xlsx';

interface ResultsProps {
  results: SearchResult[];
  query: string;
  onSelect: (result: SearchResult) => void;
  onBack: () => void;
}

// ─── Avatar Compacto ──────────────────────────────────────────────────────────
function PatientAvatar({ gender, size = 16 }: { gender: 'male' | 'female' | 'neutral', size?: number }) {
  const config = {
    male:    { bg: 'bg-cyan-500/10',    text: 'text-cyan-500',    border: 'border-cyan-500/20' },
    female:  { bg: 'bg-purple-400/10',  text: 'text-purple-400',  border: 'border-purple-400/20' },
    neutral: { bg: 'bg-[var(--accent-clinical)]/10', text: 'text-[var(--accent-clinical)]', border: 'border-[var(--accent-clinical)]/20' },
  };
  const { bg, text, border } = config[gender];
  return (
    <div className={`w-8 h-8 ${bg} ${text} ${border} border rounded-lg flex items-center justify-center flex-shrink-0 transition-transform shadow-sm`}>
      <User size={size} />
    </div>
  );
}

// ─── Fila de Resultado (Compacta) ──────────────────────────────────────────────
function ResultRow({ res, onSelect }: { key?: any; res: SearchResult, onSelect: (r: SearchResult) => void }) {
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
  
  // Búsqueda del valor a mostrar: Prioridad PROCESO (mapeado a EC_Proceso2 en worker) -> Nombre
  let displayValue = demographics['PROCESO'] || demographics['ECPROCESO2'] || demographics['EC_Proceso2'];
  
  if (!displayValue && patient) {
    const firstToma = Object.values(patient.tomas)[0];
    if (firstToma) {
      displayValue = firstToma.latest.data['EC_Proceso2'] || firstToma.latest.data['EC_PROCESO2'];
    }
  }

  if (!displayValue) {
    const nameKey = Object.keys(demographics).find(k => k.toUpperCase().includes('NOMBRE')) || '';
    displayValue = nameKey ? demographics[nameKey] : `Paciente ${res.nhc}`;
  }

  return (
    <div 
      onClick={() => onSelect(res)}
      className="group flex items-center gap-4 bg-[var(--surface-clinical)] hover:bg-[var(--bg-clinical)] p-3 rounded-xl border border-[var(--border-clinical)] hover:border-[var(--accent-clinical)] transition-all cursor-pointer shadow-sm hover:shadow-md"
    >
      <PatientAvatar gender={getGender(demographics)} />
      
      {/* Información Principal: NHC y Nombre */}
      <div className="flex-1 flex items-center gap-4 min-w-0">
        <div className="flex flex-col min-w-[100px]">
          <span className="text-[10px] font-black text-[var(--accent-clinical)] uppercase tracking-tighter leading-none mb-1">NHC</span>
          <span className="text-[14px] font-bold text-[var(--text-primary)] font-mono leading-none">{res.nhc}</span>
        </div>
        
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-tighter leading-none mb-1 opacity-60">Proceso / Nombre</span>
          {loading ? (
            <div className="h-4 w-32 bg-[var(--border-clinical)] animate-pulse rounded"></div>
          ) : (
            <span className="text-[14px] font-bold text-[var(--text-primary)] truncate uppercase tracking-tight">{displayValue}</span>
          )}
        </div>
      </div>

      {/* Estadísticas de Coincidencia */}
      <div className="hidden md:flex items-center gap-8 px-4">
        <div className="flex flex-col items-center w-14">
          <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase mb-1.5 opacity-60">Informes</span>
          <div className="flex items-center gap-1.5 text-[13px] font-bold text-[var(--text-primary)] h-6">
            <Activity size={12} className="text-[var(--accent-clinical)]" />
            {res.matchingTomasCount}
          </div>
        </div>
        <div className="flex flex-col items-center w-16">
          <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase mb-1.5 opacity-60">Hallazgos</span>
          <div className="bg-[var(--accent-clinical)] text-white min-w-[24px] h-6 flex items-center justify-center rounded-md text-[11px] font-black px-2 shadow-sm shadow-[var(--accent-clinical)]/20">
            {res.matchedRegistros.length}
          </div>
        </div>
      </div>

      {/* Score y Acción */}
      <div className="flex items-center gap-4 pl-4 border-l border-[var(--border-clinical)]">
        <div className="flex flex-col items-end w-16">
          <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase mb-1.5 opacity-60">Relevancia</span>
          <div className="h-6 flex items-center">
            <span className="text-[15px] font-black text-[var(--accent-clinical)] leading-none">{res.totalScore.toFixed(1)}</span>
          </div>
        </div>
        <div className="text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-1 group-hover:translate-x-0">
          <ChevronRight size={18} />
        </div>
      </div>
    </div>
  );
}

// ─── Componente Principal ──────────────────────────────────────────────────────
export default function Results({ results, query, onSelect, onBack }: ResultsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  
  const totalPages = Math.ceil(results.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleResults = results.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [results]);

  const handleExportExcel = async () => {
    if (results.length === 0) return;
    
    // Tarea E2: Generador de Informes / Exportación XLSX Profesional
    const fullPatients: Patient[] = [];
    for (const res of results) {
       const p = await db.getFromStore(db.stores.patients, res.nhc);
       if (p) fullPatients.push(p);
    }
    
    if (fullPatients.length === 0) return;

    // Aplanamiento de datos para formato tabla Excel
    const exportData: any[] = [];
    
    fullPatients.forEach(p => {
      Object.values(p.tomas).forEach(toma => {
        toma.registros.forEach(reg => {
          // Consolidar NHC, Metadatos de la Toma y todos los campos clínicos
          exportData.push({
            'NHC': p.nhc,
            'Identificador_Toma': toma.idToma,
            'Version_Registro': reg.ordenToma,
            ...p.demographics,
            ...reg.data
          });
        });
      });
    });

    // Generación del libro de Excel
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Resultados Queryclin");
    
    // Generar nombre de archivo basado en la búsqueda
    const safeQuery = query.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `queryclin_export_${safeQuery || 'all'}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="max-w-5xl mx-auto w-full pb-20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-[var(--surface-clinical)] rounded-xl transition-colors text-[var(--text-secondary)]"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h2 className="text-2xl font-black text-[var(--text-primary)] flex items-center gap-3">
              Pacientes Coincidentes
              <span className="bg-[var(--accent-clinical)]/10 text-[var(--accent-clinical)] text-[12px] px-3 py-1 rounded-full">{results.length}</span>
            </h2>
            <p className="text-[var(--text-secondary)] text-sm font-medium">
              {query ? `Criterio de búsqueda: "${query}"` : 'Visualizando todos los registros del corpus'}.
            </p>
          </div>
        </div>

        {results.length > 0 && (
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 border-b-4 border-emerald-800"
            title="Exportar resultados actuales a archivo Excel (.xlsx)"
          >
            <FileSpreadsheet size={18} />
            <span className="hidden sm:inline">Descargar Excel</span>
          </button>
        )}
      </div>

      {/* Lista de Resultados (Layout de Fila Unica) */}
      <div className="flex flex-col gap-2">
        {visibleResults.map((res, idx) => (
          <ResultRow key={`res_${res.nhc}_${idx}`} res={res} onSelect={onSelect} />
        ))}

        {results.length === 0 && (
          <div className="text-center py-24 bg-[var(--surface-clinical)] rounded-2xl border border-dashed border-[var(--border-clinical)] shadow-sm">
            <div className="w-16 h-16 bg-[var(--bg-clinical)] rounded-full flex items-center justify-center mx-auto mb-4 text-[var(--text-secondary)]/40">
              <FileText size={32} />
            </div>
            <p className="text-[var(--text-secondary)] text-lg font-bold">No se han encontrado pacientes coincidentes.</p>
          </div>
        )}
      </div>

      {/* Paginación */}
      {results.length > itemsPerPage && (
        <div className="flex items-center justify-center gap-6 mt-12">
          <button
            disabled={currentPage === 1}
            onClick={() => { setCurrentPage(prev => prev - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="px-6 py-2.5 bg-[var(--surface-clinical)] border border-[var(--border-clinical)] rounded-xl font-black text-[var(--text-secondary)] text-[11px] uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:border-[var(--accent-clinical)] transition-all"
          >
            Anterior
          </button>
          <span className="text-[12px] font-black text-[var(--text-primary)] uppercase tracking-widest bg-[var(--surface-clinical)] px-4 py-2 rounded-lg border border-[var(--border-clinical)]">
            Página {currentPage} de {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => { setCurrentPage(prev => prev + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="px-6 py-2.5 bg-[var(--surface-clinical)] border border-[var(--border-clinical)] rounded-xl font-black text-[var(--text-secondary)] text-[11px] uppercase tracking-widest disabled:opacity-30 disabled:cursor-not-allowed hover:border-[var(--accent-clinical)] transition-all"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
}
