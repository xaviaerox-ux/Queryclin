import { useState, useEffect, useMemo } from 'react';
import { SearchResult } from '../lib/searchEngine';
import { ArrowLeft, ChevronLeft, ChevronRight, User, AlertTriangle, Activity } from 'lucide-react';
import HighlightedText from './HighlightedText';
import { db } from '../lib/db';
import { Patient, Toma, getGender } from '../lib/dataStore';
import { FieldCategory, SECTION_ORDER, SECTION_LABELS, classifyField } from '../lib/fieldDictionary';

// ─── Tipos Internos ────────────────────────────────────────────────────────────
interface HCEViewProps {
  results: SearchResult[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  onBack: () => void;
  query: string;
}

// Campos técnicos internos que nunca se muestran en la vista clínica
const INTERNAL_FIELDS = new Set([
  'IDTOMA','ORDENTOMA','NHCID','CONTADOR','NHC_ID','NHC','CIPA','ID_TOMA','ORDEN_TOMA',
]);

function isInternalField(key: string): boolean {
  const uk = key.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return INTERNAL_FIELDS.has(uk) || uk === 'NHC';
}

// ─── Avatar de Paciente ────────────────────────────────────────────────────────
function PatientAvatar({ gender, size = 28 }: { gender: 'male' | 'female' | 'neutral'; size?: number }) {
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
function DemoChip({ label, value }: { key?: string; label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-2 bg-[var(--bg-clinical)] border border-[var(--border-clinical)] px-3 py-1.5 rounded-lg text-[12px]">
      <span className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] opacity-70">{label}</span>
      <span className="font-bold text-[var(--text-primary)]">{value}</span>
    </span>
  );
}

// ─── Campo Clínico Individual ──────────────────────────────────────────────────
function ClinicalField({ label, value, query, highlight }: { key?: string; label: string; value: string; query: string; highlight?: boolean }) {
  const isLong = value.length > 80;
  const isBoolean = ['SI','NO','SÍ','TRUE','FALSE','POSITIVO','NEGATIVO'].includes(value.trim().toUpperCase());

  return (
    <div className={`flex flex-col gap-1.5 ${highlight ? 'bg-[var(--accent-clinical)]/5 rounded-xl p-3 -mx-3' : ''}`}>
      <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[var(--accent-clinical)]/60 leading-none">
        {label.replace(/_/g, ' ')}
      </span>
      {isBoolean ? (
        <span className={`inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-lg text-[12px] font-black uppercase tracking-wide ${
          ['SI','SÍ','TRUE','POSITIVO'].includes(value.trim().toUpperCase())
            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
            : 'bg-red-500/10 text-red-500 border border-red-500/20'
        }`}>
          {value}
        </span>
      ) : isLong ? (
        <p className="text-[14px] text-[var(--text-primary)] leading-[1.75] whitespace-pre-wrap font-normal">
          <HighlightedText text={value} query={query} />
        </p>
      ) : (
        <span className="text-[15px] text-[var(--text-primary)] font-medium leading-snug">
          <HighlightedText text={value} query={query} />
        </span>
      )}
    </div>
  );
}

// ─── Cabecera de Sección Clínica ───────────────────────────────────────────────
function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-4 mt-8 mb-4">
      <div className="h-[1px] w-6 bg-[var(--accent-clinical)]/40 flex-shrink-0" />
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent-clinical)]/70 whitespace-nowrap flex-shrink-0">
        {label}
      </span>
      {count > 0 && (
        <span className="text-[9px] font-black bg-[var(--accent-clinical)]/10 text-[var(--accent-clinical)] px-2 py-0.5 rounded-full">
          {count}
        </span>
      )}
      <div className="h-[1px] flex-1 bg-[var(--border-clinical)]" />
    </div>
  );
}

// ─── Separador Temporal de Toma ────────────────────────────────────────────────
function TomaDivider({ idToma, fecha, hora, usuario, index }: { idToma: string; fecha: string; hora: string; usuario: string; index: number }) {
  return (
    <div className={`flex items-center gap-4 ${index === 0 ? 'mt-2' : 'mt-10'} mb-5`}>
      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${index === 0 ? 'bg-[var(--accent-clinical)]' : 'bg-[var(--border-clinical)]'}`} />
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-3 flex-wrap">
          {fecha && <span className="text-[13px] font-black text-[var(--text-primary)]">{fecha}</span>}
          {hora && <span className="text-[12px] font-medium text-[var(--text-secondary)]">{hora}</span>}
          {index === 0 && (
            <span className="text-[9px] font-black uppercase tracking-widest bg-[var(--accent-clinical)] text-white px-2 py-0.5 rounded-full">
              Última toma
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
          <span className="font-mono font-bold opacity-60">#{idToma}</span>
          {usuario && <><span className="opacity-40">·</span><span>{usuario}</span></>}
        </div>
      </div>
      <div className="flex-1 h-[1px] bg-[var(--border-clinical)]" />
    </div>
  );
}

// ─── Bloque de Registro (una toma) ────────────────────────────────────────────
function RegistroBlock({ registro, query, isFirst }: { key?: string; registro: any; query: string; isFirst: boolean }) {
  const data = registro.data as Record<string, string>;
  const queryTokens = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);

  // Extraer metadatos temporales
  const fechaKey = Object.keys(data).find(k => k.toUpperCase().includes('FECHA_TOMA') || k.toUpperCase().includes('FECHA_OBS'));
  const horaKey  = Object.keys(data).find(k => k.toUpperCase().includes('HORA_TOMA') || k.toUpperCase().includes('HORA'));
  const userKey  = Object.keys(data).find(k => k.toUpperCase().includes('USUARIO'));

  const fecha   = fechaKey ? data[fechaKey] : '';
  const hora    = horaKey  ? data[horaKey]  : '';
  const usuario = userKey  ? data[userKey]  : '';

  // Agrupar campos por categoría HCE
  const sections: Record<FieldCategory, { key: string; value: string }[]> = {} as any;
  for (const cat of SECTION_ORDER) sections[cat] = [];

  for (const [k, v] of Object.entries(data)) {
    if (!v || String(v).trim() === '') continue;
    if (isInternalField(k)) continue;
    if (k === fechaKey || k === horaKey || k === userKey) continue;
    const cat = classifyField(k);
    if (!sections[cat]) sections[cat] = [];
    sections[cat].push({ key: k, value: String(v) });
  }

  // Campos de alerta (alergia) para tratamiento visual especial
  const alergiaSection = sections['Alergias y Motivo'];

  return (
    <div className={`pb-2 ${!isFirst ? 'border-t border-[var(--border-clinical)] pt-2' : ''}`}>
      <TomaDivider
        idToma={registro.ordenToma}
        fecha={fecha}
        hora={hora}
        usuario={usuario}
        index={isFirst ? 0 : 1}
      />

      {/* ALERGIAS — tratamiento visual prioritario */}
      {alergiaSection.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 mb-1">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-500/80">
              {SECTION_LABELS['Alergias y Motivo']}
            </span>
          </div>
          <div className="flex flex-col gap-4">
            {alergiaSection.map(f => (
              <ClinicalField
                key={f.key}
                label={f.key}
                value={f.value}
                query={query}
                highlight={queryTokens.some(t => f.value.toLowerCase().includes(t))}
              />
            ))}
          </div>
        </div>
      )}

      {/* RESTO DE SECCIONES en orden fijo */}
      {SECTION_ORDER.filter(s => s !== 'Alergias y Motivo').map(section => {
        const fields = sections[section];
        if (!fields || fields.length === 0) return null;
        return (
          <div key={section}>
            <SectionHeader label={SECTION_LABELS[section]} count={fields.length} />
            <div className="flex flex-col gap-5">
              {fields.map(f => (
                <ClinicalField
                  key={f.key}
                  label={f.key}
                  value={f.value}
                  query={query}
                  highlight={queryTokens.some(t => f.value.toLowerCase().includes(t))}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Componente Principal ──────────────────────────────────────────────────────
export default function HCEView({ results, currentIndex, onIndexChange, onBack, query }: HCEViewProps) {
  const currentResult = results[currentIndex];
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar paciente completo desde IndexedDB
  useEffect(() => {
    let active = true;
    const loadPatient = async () => {
      setLoading(true);
      setPatient(null);
      const fullPatient = await db.getFromStore(db.stores.patients, currentResult.nhc);
      if (active && fullPatient) {
        setPatient(fullPatient);
        setLoading(false);
      }
    };
    loadPatient();
    return () => { active = false; };
  }, [currentResult.nhc]);

  // Scroll automático al primer highlight
  useEffect(() => {
    const timer = setTimeout(() => {
      const el = document.querySelector('.highlight-match');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 350);
    return () => clearTimeout(timer);
  }, [currentResult.nhc, query]);

  // Ordenar tomas descendente (más reciente primero)
  const sortedTomas = useMemo(() => {
    if (!patient) return [];
    return (Object.values(patient.tomas) as Toma[]).sort((a, b) => {
      const getTime = (t: Toma) => {
        const dateKey = Object.keys(t.latest.data).find(k => k.toUpperCase().includes('FECHA_TOMA'));
        if (!dateKey || !t.latest.data[dateKey]) return 0;
        let d = t.latest.data[dateKey] as string;
        if (d.includes('/')) {
          const p = d.split('/');
          if (p.length === 3) d = `${p[2]}-${p[1]}-${p[0]}`;
        }
        return new Date(d).getTime() || 0;
      };
      return getTime(b) - getTime(a);
    });
  }, [patient]);

  const hasNext = currentIndex < results.length - 1;
  const hasPrev = currentIndex > 0;

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading || !patient) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 py-24">
        <div className="w-10 h-10 border-4 border-[var(--accent-clinical)] border-t-transparent rounded-full animate-spin" />
        <p className="text-[var(--text-secondary)] font-bold text-sm">
          Recuperando historial clínico del NHC {currentResult.nhc}…
        </p>
      </div>
    );
  }

  const demo = patient.demographics || {};

  return (
    <div className="flex flex-col h-full w-full gap-0">

      {/* ── Barra de Navegación ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between shrink-0 mb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-[var(--surface-clinical)] rounded-xl transition-colors text-[var(--text-secondary)]"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-wider hidden sm:block">
            Historia Clínica Electrónica
          </h2>
        </div>
        <div className="flex items-center gap-3 bg-[var(--surface-clinical)] px-4 py-2 rounded-xl border border-[var(--border-clinical)] shadow-md">
          <span className="text-[12px] font-bold text-[var(--text-secondary)] uppercase tracking-wide">
            {currentIndex + 1} / {results.length}
          </span>
          <div className="flex gap-1 border-l border-[var(--border-clinical)] pl-2">
            <button disabled={!hasPrev} onClick={() => onIndexChange(currentIndex - 1)}
              className="p-1 rounded-lg hover:bg-[var(--bg-clinical)] disabled:opacity-30 disabled:cursor-not-allowed text-[var(--text-primary)]">
              <ChevronLeft size={18} />
            </button>
            <button disabled={!hasNext} onClick={() => onIndexChange(currentIndex + 1)}
              className="p-1 rounded-lg hover:bg-[var(--bg-clinical)] disabled:opacity-30 disabled:cursor-not-allowed text-[var(--text-primary)]">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* ── CABECERA FIJA: Datos Demográficos ───────────────────────────── */}
      <div className="bg-[var(--surface-clinical)] border border-[var(--border-clinical)] rounded-2xl p-6 shadow-lg ring-1 ring-[var(--accent-clinical)]/5 shrink-0 mb-6">
        <div className="flex items-start gap-5">
          <PatientAvatar gender={getGender(demo)} size={28} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3 flex-wrap mb-3">
              <h1 className="text-[24px] font-black text-[var(--text-primary)] tracking-tight leading-none">
                {demo.NOMBRE || `Paciente ${patient.nhc}`}
              </h1>
              <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2.5 py-1 rounded-full mt-1">
                Historia Activa
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <DemoChip label="NHC" value={patient.nhc} />
              {['EDAD', 'SEXO', 'CIUDAD', 'POSTAL'].map(k => {
                const actualKey = Object.keys(demo).find(dk => dk.toUpperCase().includes(k));
                if (!actualKey || !demo[actualKey]) return null;
                return <DemoChip key={k} label={k === 'POSTAL' ? 'C.P.' : k} value={demo[actualKey]} />;
              })}
            </div>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-[var(--text-secondary)] shrink-0">
            <Activity size={14} className="text-[var(--accent-clinical)]" />
            <span className="font-bold">{sortedTomas.length} toma{sortedTomas.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* ── VISTA ÚNICA CONTINUA ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto hide-scrollbar">
        <div className="max-w-3xl mx-auto pb-24 space-y-0">
          {sortedTomas.length === 0 ? (
            <div className="text-center py-20 text-[var(--text-secondary)]">
              <p className="font-bold">No se encontraron registros clínicos para este paciente.</p>
            </div>
          ) : (
            sortedTomas.map((toma, tomaIdx) =>
              // Dentro de cada toma, mostrar registros ordenados descendente
              [...toma.registros]
                .sort((a, b) => b.ordenToma - a.ordenToma)
                .map((registro, regIdx) => (
                  <RegistroBlock
                    key={`${toma.idToma}_${registro.ordenToma}`}
                    registro={registro}
                    query={query}
                    isFirst={tomaIdx === 0 && regIdx === 0}
                  />
                ))
            )
          )}
        </div>
      </div>
    </div>
  );
}
