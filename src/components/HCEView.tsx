import { useState, useEffect, useMemo } from 'react';
import { SearchResult } from '../lib/searchEngine';
import { ArrowLeft, ChevronLeft, ChevronRight, User, AlertTriangle, Calendar, Clock, Hash } from 'lucide-react';
import HighlightedText from './HighlightedText';
import { db } from '../storage/indexedDB';
import { Patient, Toma, getGender } from '../core/types';
import { FORMS } from '../core/mappings';

interface HCEViewProps {
  results: SearchResult[];
  currentIndex: number;
  query: string;
  onBack: () => void;
  onNavigate: (index: number) => void;
  formId: string;
}

// ─── Avatar de Paciente ───────────────────────────────────────────────────────
function PatientAvatar({ gender, size = 28 }: { gender: 'male' | 'female' | 'neutral', size?: number }) {
  const cfg = {
    male:    { bg: 'bg-cyan-500/10',    text: 'text-cyan-500',    border: 'border-cyan-500/20' },
    female:  { bg: 'bg-purple-400/10',  text: 'text-purple-400',  border: 'border-purple-400/20' },
    neutral: { bg: 'bg-[var(--accent-clinical)]/10', text: 'text-[var(--accent-clinical)]', border: 'border-[var(--accent-clinical)]/20' },
  }[gender];
  return (
    <div className={`w-14 h-14 ${cfg.bg} ${cfg.text} ${cfg.border} border-2 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
      <User size={size} />
    </div>
  );
}

// ─── Chip de Dato Demográfico ──────────────────────────────────────────────────
function DemoChip({ label, value }: { key?: any; label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-2 bg-[var(--bg-clinical)] border border-[var(--border-clinical)] px-3 py-1.5 rounded-lg text-[12px]">
      <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-70">{label}</span>
      <span className="font-bold text-[var(--text-primary)]">{value}</span>
    </span>
  );
}

// ─── Campo Clínico Individual ──────────────────────────────────────────────────
function ClinicalField({ label, value, query, highlight }: { key?: any; label: string; value: string; query: string; highlight?: boolean }) {
  const isLong = value.length > 80;
  
  // Mejora de legibilidad: 4 o más espacios -> Salto de línea doble (párrafo)
  const formattedValue = useMemo(() => {
    return value.replace(/ {4,}/g, '\n\n').trim();
  }, [value]);

  const isBoolean = ['SI','NO','SÍ','TRUE','FALSE','POSITIVO','NEGATIVO'].includes(value.trim().toUpperCase());

  return (
    <div className={`flex flex-col gap-1.5 border-b border-[var(--border-clinical)]/60 last:border-0 pb-4 last:pb-0 ${highlight ? 'bg-[var(--accent-clinical)]/5 rounded-xl p-3 -mx-3 ring-1 ring-[var(--accent-clinical)]/20' : ''}`}>
      <span className="text-[10px] font-black uppercase tracking-[0.12em] text-[var(--accent-clinical)] leading-none mb-1">
        {label.replace(/_/g, ' ')}
      </span>
      {isBoolean ? (
        <span className={`inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-lg text-[12px] font-black uppercase tracking-wide ${
          ['SI','SÍ','TRUE','POSITIVO'].includes(value.trim().toUpperCase())
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'bg-red-600 text-white shadow-sm'
        }`}>
          {value}
        </span>
      ) : isLong ? (
        <p className="text-[15px] text-slate-900 dark:text-slate-100 leading-[1.75] whitespace-pre-wrap font-bold">
          <HighlightedText text={formattedValue} query={query} />
        </p>
      ) : (
        <span className="text-[16px] text-slate-900 dark:text-slate-100 font-black leading-snug whitespace-pre-wrap">
          <HighlightedText text={formattedValue} query={query} />
        </span>
      )}
    </div>
  );
}

// ─── Bloque de Constantes Clínicas (Inmutable) ────────────────────────────────
function ClinicalConstants({ data, query }: { data: Record<string, string>, query: string }) {
  const getV = (keys: string[]) => {
    for (const k of keys) {
      const val = data[k];
      if (val !== undefined && val !== null && String(val).trim() !== '') return String(val);
    }
    return '--';
  };

  const Field = ({ label, keys, minW = "120px", valW = "80px" }: { label: string, keys: string[], minW?: string, valW?: string }) => (
    <div className="flex border-b border-r border-slate-300 last:border-b-0">
      <div className={`bg-white px-2 py-1 text-[11px] font-bold border-r border-slate-300 flex items-center`} style={{ minWidth: minW }}>
        {label}
      </div>
      <div className={`bg-[#F1F8E9] px-2 py-1 text-[11px] font-black text-slate-800 flex items-center justify-center text-center`} style={{ minWidth: valW }}>
        <HighlightedText text={getV(keys)} query={query} />
      </div>
    </div>
  );

  return (
    <div className="my-6 select-none">
      <div className="bg-[#0056b3] text-white px-4 py-1 text-[11px] font-black uppercase tracking-wider border border-slate-800 inline-block mb-[1px] shadow-sm">
        Constantes:
      </div>
      <div className="flex flex-wrap items-start gap-4">
        {/* Bloque 1 */}
        <div className="border border-slate-400 shadow-sm overflow-hidden">
          <Field label="IMC:" keys={['IMC:', 'IMC']} />
          <Field label="Valoracion IMC:" keys={['Valoración IMC', 'Valoración IMC:']} />
        </div>
        {/* Bloque 2 */}
        <div className="border border-slate-400 shadow-sm overflow-hidden">
          <Field label="Peso:" keys={['Peso:', 'Peso']} />
          <Field label="Superficie Corp:" keys={['Superficie Corporal', 'Superficie Corp:']} />
        </div>
        {/* Bloque 3 - Compuesto */}
        <div className="border border-slate-400 shadow-sm overflow-hidden flex flex-col">
          <div className="flex border-b border-slate-300 last:border-b-0">
             <Field label="Grupo Sanguineo:" keys={['Grupo sanguineo y RH', 'Grupo Sanguineo:']} minW="130px" valW="100px" />
             <Field label="Talla:" keys={['Talla:', 'Talla']} minW="60px" valW="60px" />
          </div>
          <div className="flex border-b border-slate-300 last:border-b-0">
             <Field label="Transfusiones:" keys={['Transfusiones', 'Transfusiones:']} minW="130px" valW="100px" />
             <Field label="Tmp" keys={['T', 'Temperatura', 'Tmp']} minW="60px" valW="60px" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Cabecera de Sección Clínica ───────────────────────────────────────────────
function SectionHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 mb-6 px-1">
      <span className="text-[12px] font-black uppercase tracking-[0.3em] text-emerald-700 dark:text-emerald-400 bg-emerald-500/5 px-4 py-1.5 rounded-lg border border-emerald-500/20">
        {label}
      </span>
      <div className="h-[2px] flex-1 bg-gradient-to-r from-emerald-500/30 to-transparent" />
    </div>
  );
}

// ─── Campo de Cabecera Compacta (HCE-ALG) ───────────────────────────────────
function HeaderField({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-md border ${highlight ? 'bg-red-500/10 border-red-500/20 text-red-600' : 'bg-white border-slate-200'}`}>
      <span className="text-[10px] font-black uppercase text-slate-400">{label}:</span>
      <span className={`text-[12px] font-bold ${highlight ? 'text-red-700' : 'text-slate-700'}`}>{value || '--'}</span>
    </div>
  );
}

// ─── Helpers de Fecha/Hora ─────────────────────────────────────────────────────
function extractFecha(data: Record<string, string>): string {
  const raw = data['EC_Fecha_Toma'] || data['FECHA_TOMA'] || '';
  if (!raw) return '--';
  return raw.includes(' ') ? raw.split(' ')[0] : raw;
}

function extractHora(data: Record<string, string>): string {
  const raw = data['EC_Fecha_Toma'] || '';
  if (raw.includes(' ')) return raw.split(' ')[1]?.slice(0, 5) || '--:--';
  return data['HORA_TOMA'] || data['EC_Hora_Toma'] || '--:--';
}

// ─── Timeline Lateral de Tomas ─────────────────────────────────────────────────
function TomaTimeline({
  sortedTomas,
  activeIndex,
  activeVersionIndex,
  onSelect,
  isHCEALG = false,
}: {
  sortedTomas: Toma[];
  activeIndex: number;
  activeVersionIndex: number;
  onSelect: (tomaIdx: number, versionIdx: number) => void;
  isHCEALG?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0 sticky top-[180px] max-h-[75vh] overflow-y-auto hide-scrollbar rounded-xl border border-slate-200 shadow-sm bg-white">
      {isHCEALG ? (
        <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex justify-between items-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Navegación / Tomas</span>
        </div>
      ) : (
        <h3 className="text-[9px] font-black uppercase tracking-[0.25em] text-[var(--text-secondary)] mb-3 px-2 py-3 opacity-50">
          Historial de Tomas ({sortedTomas.length})
        </h3>
      )}
      <div className="flex flex-col">
        {sortedTomas.map((t, tIdx) => {
          if (isHCEALG) {
            const sortedRegs = [...t.registros].sort((a, b) => b.ordenToma - a.ordenToma);
            
            return (
              <div key={t.idToma} className="flex flex-col border-b border-slate-100 last:border-0">
                <div className="bg-[#FFF9E5] px-3 py-1.5 text-[14px] font-black text-slate-800 border-b border-slate-200 flex items-center gap-1">
                  <Hash size={12} className="text-slate-400" />
                  {t.idToma}
                </div>
                {sortedRegs.map((r, rIdx) => {
                  const isActive = tIdx === activeIndex && rIdx === activeVersionIndex;
                  const fecha = extractFecha(r.data);
                  const orden = r.ordenToma;

                  return (
                    <button
                      key={`${t.idToma}-${orden}`}
                      onClick={() => onSelect(tIdx, rIdx)}
                      className={`flex items-center text-[11px] transition-all border-b border-slate-50 last:border-0 ${isActive ? 'bg-[#0074D9] text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                    >
                      <span className={`px-3 py-2 w-10 font-black text-center border-r ${isActive ? 'border-blue-400/30' : 'border-slate-100 text-slate-400'}`}>
                        {orden}
                      </span>
                      <span className="px-3 py-2 flex-1 font-bold text-right tabular-nums">
                        {fecha}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          }

          const isActive = tIdx === activeIndex;
          const isLatest = tIdx === 0;
          const fecha = extractFecha(t.latest?.data || {});
          const hora = extractHora(t.latest?.data || {});
          const usuario = t.latest?.data['Usuario'] || t.latest?.data['USUARIO_TOMA'] || '';

          return (
            <button
              key={t.idToma}
              onClick={() => onSelect(tIdx, 0)}
              className={`group flex flex-col items-start gap-1.5 py-4 px-4 -ml-[2px] border-l-2 transition-all text-left rounded-r-xl ${isActive ? 'border-[var(--accent-clinical)] bg-[var(--accent-clinical)]/8' : 'border-transparent hover:border-[var(--accent-clinical)]/50 hover:bg-[var(--accent-clinical)]/4'}`}
            >
              <div className="flex items-center gap-2 w-full">
                <span className={`text-[11px] font-black flex items-center gap-1 ${isActive ? 'text-[var(--accent-clinical)]' : 'text-[var(--text-secondary)]'}`}>
                  <Hash size={9} />
                  {t.idToma}
                </span>
                {isLatest && (
                  <span className="text-[8px] font-black uppercase tracking-widest bg-emerald-500 text-white px-1.5 py-0.5 rounded-full leading-none">
                    Última
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-primary)]">
                <Calendar size={10} className={isActive ? 'text-[var(--accent-clinical)]' : 'text-[var(--text-secondary)] opacity-60'} />
                <span>{fecha}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-secondary)] opacity-70">
                <Clock size={9} />
                <span>{hora}</span>
              </div>
              {usuario && (
                <span className="text-[9px] text-[var(--text-secondary)] opacity-50 truncate max-w-[140px]">{usuario}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Componente Principal HCEView ──────────────────────────────────────────────
export default function HCEView({ results, currentIndex, query, onBack, onNavigate, formId }: HCEViewProps) {
  const currentResult = results[currentIndex];
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTomaIndex, setActiveTomaIndex] = useState(0);
  const [activeVersionIndex, setActiveVersionIndex] = useState(0);
  
  const formMapping = useMemo(() => FORMS.find(f => f.id === formId) || FORMS[0], [formId]);

  useEffect(() => {
    if (!currentResult) return;
    let active = true;
    setActiveTomaIndex(0);
    setActiveVersionIndex(0);
    const fetchPatient = async () => {
      setLoading(true);
      try {
        const p = await db.getFromStore(db.stores.patients, currentResult.nhc);
        if (active && p) {
          setPatient(p);
          setLoading(false);
          window.scrollTo({ top: 0, behavior: 'instant' });
        } else if (active) {
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching patient:", err);
        if (active) setLoading(false);
      }
    };
    fetchPatient();
    return () => { active = false; };
  }, [currentResult?.nhc]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Evitar navegación si el usuario está escribiendo en algún input (ej. el buscador de la cabecera)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onNavigate(currentIndex - 1);
      } else if (e.key === 'ArrowRight' && currentIndex < results.length - 1) {
        onNavigate(currentIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, results.length, onNavigate]);

  const sortedTomas = useMemo(() => {
    if (!patient || !patient.tomas) return [];
    return Object.values(patient.tomas).sort((a, b) => {
      const getTime = (t: Toma) => {
        if (!t || !t.latest || !t.latest.data) return 0;
        let d = t.latest.data['EC_Fecha_Toma'] || t.latest.data['FECHA_TOMA'] || '';
        if (d.includes(' ')) d = d.split(' ')[0];
        if (d.includes('/')) {
          const p = d.split('/');
          if (p.length === 3) d = `${p[2]}-${p[1]}-${p[0]}`;
        }
        const timeStr = t.latest.data['HORA_TOMA'] || t.latest.data['EC_Hora_Toma'] || '00:00';
        return new Date(`${d}T${timeStr}`).getTime() || 0;
      };
      return getTime(b as unknown as Toma) - getTime(a as unknown as Toma);
    });
  }, [patient]);

  const activeToma = sortedTomas[activeTomaIndex];
  const sortedVersions = useMemo(() => {
    if (!activeToma) return [];
    return [...activeToma.registros].sort((a, b) => b.ordenToma - a.ordenToma);
  }, [activeToma]);
  const activeVersion = sortedVersions[activeVersionIndex];

  const hasNext = currentIndex < results.length - 1;
  const hasPrev = currentIndex > 0;
  const hasPrevToma = activeTomaIndex > 0;
  const hasNextToma = activeTomaIndex < sortedTomas.length - 1;
  const hasPrevVersion = activeVersionIndex > 0;
  const hasNextVersion = activeVersionIndex < sortedVersions.length - 1;

  if (!currentResult) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4 text-center">
        <h2 className="text-xl font-black text-[var(--accent-clinical)] uppercase tracking-widest">Error de Referencia</h2>
        <p className="text-sm text-[var(--text-secondary)] font-bold">No se ha podido localizar el expediente seleccionado.</p>
        <button onClick={onBack} className="mt-4 px-8 py-3 bg-[var(--accent-clinical)] text-white rounded-2xl font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">
          Volver a Resultados
        </button>
      </div>
    );
  }

  if (loading || !patient) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <div className="w-12 h-12 border-4 border-[var(--accent-clinical)] border-t-transparent rounded-full animate-spin" />
        <p className="text-[var(--text-secondary)] font-bold animate-pulse">Recuperando Historia Clínica...</p>
      </div>
    );
  }

  const demo = patient.demographics || {};
  const queryTokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  
  // Taxonomía estricta basada en el orden del formulario definido en mappings.ts
  const renderedSections: { title: string, fields: { key: string, value: string }[] }[] = [];
  
  if (activeVersion) {
    Object.entries(formMapping.visualCategories).forEach(([catName, allowedKeys]) => {
      if (formId === 'hce_alg' && (catName === 'CABECERA' || catName === 'CONTROL')) return;

      const categoryFields: { key: string, value: string }[] = [];
      allowedKeys.forEach(key => {
        const value = activeVersion.data[key];
        if (value !== undefined && value !== null && String(value).trim() !== '') {
          categoryFields.push({ key, value: String(value) });
        }
      });
      
      if (categoryFields.length > 0) {
        renderedSections.push({ title: catName, fields: categoryFields });
      }
    });

    const mappedKeys = new Set(Object.values(formMapping.visualCategories).flat());
    const unmappedFields: { key: string, value: string }[] = [];
    Object.entries(activeVersion.data).forEach(([key, value]) => {
       if (key === '_is_duplicate' || key === 'NHC' || key === 'N.H.C' || key === 'Id_Toma' || key === 'Orden_Toma' || key === 'EC_Fecha_Toma') return;
       if (!mappedKeys.has(key) && value !== undefined && value !== null && String(value).trim() !== '') {
         unmappedFields.push({ key, value: String(value) });
       }
    });
    
    if (unmappedFields.length > 0) {
      renderedSections.push({ title: 'Campos no mapeados (debug)', fields: unmappedFields });
    }
  }

  const fechaActiva = activeVersion ? extractFecha(activeVersion.data) : '--';
  const horaActiva = activeVersion ? extractHora(activeVersion.data) : '--';
  const ordenActivo = activeVersion?.ordenToma ?? 1;

  return (
    <div className="flex flex-col w-full pb-40">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <button onClick={onBack} className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold transition-colors">
          <ArrowLeft size={20} />
          <span>Volver al Listado</span>
        </button>
        <div className="flex items-center gap-4 bg-[var(--surface-clinical)] border border-[var(--border-clinical)] px-4 py-2 rounded-2xl shadow-sm">
          <span className="text-[12px] font-black uppercase tracking-widest text-[var(--text-secondary)]">
            Expediente {currentIndex + 1} de {results.length}
          </span>
          <div className="flex gap-1 border-l border-[var(--border-clinical)] pl-3">
            <button disabled={!hasPrev} onClick={() => { onNavigate(currentIndex - 1); }} className="p-1.5 hover:bg-[var(--bg-clinical)] rounded-lg disabled:opacity-20 transition-all">
              <ChevronLeft size={20} />
            </button>
            <button disabled={!hasNext} onClick={() => { onNavigate(currentIndex + 1); }} className="p-1.5 hover:bg-[var(--bg-clinical)] rounded-lg disabled:opacity-20 transition-all">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-8 items-start justify-center">
        <aside className="w-52 shrink-0 hidden lg:block">
          <TomaTimeline
            sortedTomas={sortedTomas}
            activeIndex={activeTomaIndex}
            activeVersionIndex={activeVersionIndex}
            isHCEALG={formId === 'hce_alg'}
            onSelect={(tIdx, vIdx) => { 
              setActiveTomaIndex(tIdx); 
              setActiveVersionIndex(vIdx); 
              window.scrollTo({ top: 0, behavior: 'smooth' }); 
            }}
          />
        </aside>

        <div className="flex-1 min-w-0 max-w-4xl">
          {formId === 'hce_alg' ? (
            <div className="bg-[var(--surface-clinical)] border border-[var(--border-clinical)] rounded-xl mb-6 shadow-sm overflow-hidden flex flex-col">
              <div className="flex flex-wrap items-center gap-4 px-6 py-2.5 border-b border-[var(--border-clinical)] bg-[#FFF9E5]">
                <div className="flex items-center gap-2 min-w-[140px]">
                  <span className="text-[16px] font-black text-slate-800 uppercase">NHC:</span>
                  <span className="text-[20px] font-black text-slate-900">{patient.nhc}</span>
                </div>
                <HeaderField label="CIPA" value={demo['cipa']} />
                <HeaderField label="EC_Sexo" value={demo['sexo']} />
                <HeaderField label="F_Nacimiento" value={demo['fechaNacimiento']} />
                <HeaderField label="C.P" value={demo['cp']} />
              </div>
              <div className="flex flex-wrap items-center gap-4 px-6 py-2.5 bg-white">
                <HeaderField label="AMBITO" value={activeVersion?.data['Ámbito'] || activeVersion?.data['AMBITO']} />
                <HeaderField label="EC_Proceso2" value={activeVersion?.data['EC_Proceso2'] || activeVersion?.data['Proceso 2']} />
                <div className="flex-1" />
                <HeaderField label="ALERGIAS" value={activeVersion?.data['ALERGIAS'] || activeVersion?.data['Alergias']} highlight={!!(activeVersion?.data['ALERGIAS'] || activeVersion?.data['Alergias']) && (activeVersion?.data['ALERGIAS'] || activeVersion?.data['Alergias']).toUpperCase() !== 'NO CONSTAN'} />
                <HeaderField label="Edad" value={activeVersion?.data['Edad'] || activeVersion?.data['EDAD']} />
              </div>
            </div>
          ) : (
            <div className="bg-[var(--surface-clinical)] border border-[var(--border-clinical)] rounded-3xl p-8 mb-8 shadow-xl relative overflow-hidden">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-8">
                  <PatientAvatar gender={getGender(demo)} />
                  <div className="flex flex-col">
                    <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight uppercase leading-none mb-2">
                      Paciente {patient.nhc}
                    </h1>
                    <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-3 py-1 rounded-full self-start">
                      Historia Activa · {sortedTomas.length} toma{sortedTomas.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 max-w-xl">
                  <DemoChip label="NHC" value={patient.nhc} />
                  {['EDAD', 'SEXO', 'CIUDAD', 'CP'].map(label => {
                    const key = Object.keys(demo).find(k => k.toUpperCase() === label.toUpperCase());
                    const val = key ? demo[key] : null;
                    if (val) return <DemoChip key={label} label={label === 'CP' ? 'C.P.' : label} value={val} />;
                    return null;
                  })}
                </div>
              </div>
            </div>
          )}

          {activeToma ? (
            <>
              <div className={`flex items-center justify-between mb-6 bg-[var(--surface-clinical)] border border-[var(--accent-clinical)]/20 rounded-2xl px-6 py-4 shadow-sm ${formId === 'hce_alg' ? 'hidden' : ''}`}>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-60 mb-1">Toma</span>
                    <span className="text-[18px] font-black text-[var(--accent-clinical)] flex items-center gap-1.5">
                      <Hash size={14} />
                      {activeToma.idToma}
                    </span>
                  </div>
                  <div className="w-px h-8 bg-[var(--border-clinical)]" />
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-60 mb-1">Versión / Orden</span>
                    <div className="flex items-center gap-2">
                        <button disabled={!hasPrevVersion} onClick={() => setActiveVersionIndex(i => i - 1)} className="p-1 hover:bg-[var(--accent-clinical)]/10 rounded disabled:opacity-20 transition-all text-[var(--text-secondary)]">
                            <ChevronLeft size={16} />
                        </button>
                        <span className={`text-[14px] font-black text-[var(--text-primary)] w-8 text-center px-2 rounded border ${activeVersion?.data?._is_duplicate ? 'bg-amber-500/20 border-amber-500 text-amber-500' : 'bg-[var(--bg-clinical)] border-[var(--border-clinical)]'}`}>
                            {ordenActivo}
                        </span>
                        <button disabled={!hasNextVersion} onClick={() => setActiveVersionIndex(i => i + 1)} className="p-1 hover:bg-[var(--accent-clinical)]/10 rounded disabled:opacity-20 transition-all text-[var(--text-secondary)]">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                  </div>
                  <div className="w-px h-8 bg-[var(--border-clinical)]" />
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-60 mb-1">Fecha / Hora</span>
                    <span className="text-[14px] font-black text-[var(--text-primary)] flex items-center gap-1.5">
                      <Calendar size={12} className="text-[var(--accent-clinical)]" />
                      {fechaActiva} <span className="opacity-40 font-light mx-1">|</span> {horaActiva}
                    </span>
                  </div>
                  {activeVersion?.data?._is_duplicate && (
                    <>
                      <div className="w-px h-8 bg-[var(--border-clinical)]" />
                      <div className="flex flex-col items-center">
                          <AlertTriangle size={16} className="text-amber-500 mb-1" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">Duplicado</span>
                      </div>
                    </>
                  )}
                  {activeTomaIndex === 0 && activeVersionIndex === 0 && (
                    <>
                      <div className="w-px h-8 bg-[var(--border-clinical)]" />
                      <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-600 text-white px-2.5 py-1 rounded-full">
                        Actual
                      </span>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={!hasPrevToma}
                    onClick={() => { setActiveTomaIndex(i => i - 1); setActiveVersionIndex(0); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-black text-[var(--text-secondary)] hover:text-[var(--accent-clinical)] rounded-lg disabled:opacity-20 transition-all"
                  >
                    <ChevronLeft size={14} /> Anterior
                  </button>
                  <span className="text-[10px] font-bold text-[var(--text-secondary)] opacity-50">
                    {activeTomaIndex + 1} / {sortedTomas.length}
                  </span>
                  <button
                    disabled={!hasNextToma}
                    onClick={() => { setActiveTomaIndex(i => i + 1); setActiveVersionIndex(0); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="flex items-center gap-1 px-3 py-1.5 text-[11px] font-black text-[var(--text-secondary)] hover:text-[var(--accent-clinical)] rounded-lg disabled:opacity-20 transition-all"
                  >
                    Siguiente <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {renderedSections.map(section => {
                const isAnamnesis = section.title === 'ANAMNESIS Y EXPLORACIÓN' || section.title === 'Anamnesis y exploraciones';
                
                return (
                  <div key={section.title} className={`bg-[var(--surface-clinical)] border-2 border-[var(--border-clinical)] rounded-3xl p-8 mb-8 shadow-md ${section.title === 'Campos no mapeados (debug)' ? 'bg-red-950/10 border-red-500/30' : ''}`}>
                    <SectionHeader label={section.title} />
                    <div className="flex flex-col gap-6">
                      {section.fields.map((f) => {
                        const isAfterExploracion = isAnamnesis && f.key.toUpperCase().includes('EXPLORACIÓN FÍSICA');
                        const isConstantsField = isAnamnesis && [
                          'PESO:', 'TALLA:', 'IMC:', 'VALORACIÓN IMC', 'SUPERFICIE CORPORAL', 'T', 'GRUPO SANGUINEO Y RH', 'TRANSFUSIONES',
                          'PESO', 'TALLA', 'SUPERFICIE CORP:', 'TMP', 'GRUPO SANGUINEO:', 'TRANSFUSIONES:'
                        ].includes(f.key.toUpperCase());

                        // Si es un campo que va en la tabla de constantes, no lo renderizamos individualmente
                        if (isConstantsField) return null;

                        return (
                          <div key={f.key}>
                            <ClinicalField 
                              label={f.key} 
                              value={f.value} 
                              query={query} 
                              highlight={queryTokens.some(t => f.value.toLowerCase().includes(t))} 
                            />
                            {/* Insertar tabla de constantes justo después de Exploración Física */}
                            {isAfterExploracion && (
                              <ClinicalConstants data={activeVersion.data} query={query} />
                            )}
                          </div>
                        );
                      })}

                      {/* Caso de seguridad: si Anamnesis existe pero no se renderizó la tabla porque no hubo "Exploración Física" */}
                      {isAnamnesis && !section.fields.some(f => f.key.toUpperCase().includes('EXPLORACIÓN FÍSICA')) && (
                        <ClinicalConstants data={activeVersion.data} query={query} />
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          ) : (
            <div className="text-center py-20 text-[var(--text-secondary)] font-bold">
              No hay tomas disponibles para este paciente.
            </div>
          )}
        </div>
        <aside className="w-52 shrink-0 hidden lg:block" />
      </div>
    </div>
  );
}
