import React from 'react';
import { ArrowLeft, Search, Shield, Zap, FileText, User, Hospital } from 'lucide-react';

interface HelpProps {
  onBack: () => void;
}

export default function Help({ onBack }: HelpProps) {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent-clinical)] transition-colors mb-8 group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-bold uppercase tracking-widest text-[11px]">Volver al buscador</span>
      </button>

      <div className="mb-12">
        <h1 className="text-4xl font-black mb-4 tracking-tight">Centro de Ayuda y <span className="text-[var(--accent-clinical)]">Documentación</span></h1>
        <p className="text-[var(--text-secondary)] text-lg leading-relaxed">
          Guía técnica y operativa diseñada para el personal médico del Hospital Universitario Rafael Méndez.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        {/* Búsqueda Avanzada */}
        <section className="bg-[var(--glass-bg)] p-8 rounded-3xl border border-[var(--border-clinical)]">
          <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 mb-6">
            <Search size={24} />
          </div>
          <h2 className="text-xl font-bold mb-4">Motor de Búsqueda</h2>
          <ul className="space-y-3 text-[var(--text-secondary)] text-sm">
            <li className="flex gap-2">
              <span className="text-[var(--accent-clinical)] font-mono font-bold">AND:</span> 
              Búsqueda implícita. Escribir varios términos buscará registros que contengan todos (ej: "Dolor Fiebre").
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--accent-clinical)] font-mono font-bold">OR:</span> 
              Busca registros que contengan cualquiera de los términos (ej: "Disnea OR Tos").
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--accent-clinical)] font-mono font-bold">NOT / - :</span> 
              Excluye términos de la búsqueda (ej: "Dolor -Cabeza").
            </li>
            <li className="flex gap-2">
              <span className="text-[var(--accent-clinical)] font-mono font-bold">Abrev:</span> 
              Indexación optimizada para pH, O2, Na, K, etc.
            </li>
          </ul>
        </section>

        {/* Privacidad */}
        <section className="bg-[var(--glass-bg)] p-8 rounded-3xl border border-[var(--border-clinical)]">
          <div className="w-12 h-12 bg-green-500/10 rounded-2xl flex items-center justify-center text-green-500 mb-6">
            <Shield size={24} />
          </div>
          <h2 className="text-xl font-bold mb-4">Privacidad Absoluta</h2>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-4">
            Queryclin ha sido diseñado bajo arquitectura <strong>Local-First</strong>:
          </p>
          <ul className="space-y-3 text-[var(--text-secondary)] text-sm">
            <li className="flex items-center gap-2">✓ Los datos NUNCA abandonan su navegador.</li>
            <li className="flex items-center gap-2">✓ Sin servidores externos ni bases de datos en la nube.</li>
            <li className="flex items-center gap-2">✓ Almacenamiento seguro en IndexedDB local.</li>
          </ul>
        </section>

        {/* Ingesta de Datos */}
        <section className="bg-[var(--glass-bg)] p-8 rounded-3xl border border-[var(--border-clinical)]">
          <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 mb-6">
            <FileText size={24} />
          </div>
          <h2 className="text-xl font-bold mb-4">Importar Registros</h2>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
            Suelte su archivo CSV en la pantalla principal. El sistema procesará automáticamente delimitadores de tipo pipeline (|) o coma (,).
          </p>
          <div className="mt-4 p-3 bg-[var(--bg-clinical)] rounded-xl border border-[var(--border-clinical)] text-[10px] font-mono text-[var(--text-secondary)]">
            NHC|Nombre|Servicio|Fecha|Historia
          </div>
        </section>

        {/* Rendimiento */}
        <section className="bg-[var(--glass-bg)] p-8 rounded-3xl border border-[var(--border-clinical)]">
          <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 mb-6">
            <Zap size={24} />
          </div>
          <h2 className="text-xl font-bold mb-4">Escalabilidad</h2>
          <p className="text-[var(--text-secondary)] text-sm leading-relaxed">
            Arquitectura de fragmentación de metadatos (Sharding) que permite manejar hasta 100,000 registros clínicos sin degradación de rendimiento.
          </p>
        </section>
      </div>

      <hr className="border-[var(--border-clinical)] mb-16" />

      {/* Créditos */}
      <div className="bg-[var(--accent-clinical)]/5 p-12 rounded-[40px] border border-[var(--accent-clinical)]/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Hospital size={120} />
        </div>
        
        <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
          <Users size={24} className="text-[var(--accent-clinical)]" />
          Equipo del Proyecto
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[3px] text-[var(--accent-clinical)] block mb-2">Desarrollo y Diseño</span>
            <h3 className="text-xl font-extrabold">Francisco Javier Alonso Fondón</h3>
            <p className="text-[var(--text-secondary)] text-sm mt-1">Estudiante Grado Superior ASIR</p>
          </div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-[3px] text-[var(--accent-clinical)] block mb-2">Coordinación Técnica</span>
            <h3 className="text-xl font-extrabold">Ignacio Martínez Soriano</h3>
            <p className="text-[var(--text-secondary)] text-sm mt-1">Jefe Sección Análisis de Datos</p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-[var(--accent-clinical)]/10 flex items-center gap-4">
          <div className="w-10 h-10 bg-[var(--accent-clinical)] rounded-xl flex items-center justify-center text-white font-black text-xl">RM</div>
          <div>
            <h4 className="font-bold text-sm">Hospital Universitario Rafael Méndez</h4>
            <p className="text-[var(--text-secondary)] text-[11px] leading-tight">Servicio de Salud de la Región de Murcia</p>
          </div>
        </div>
      </div>

      <div className="text-center mt-16 text-[var(--text-secondary)] text-[10px] font-medium tracking-widest uppercase opacity-50">
        Queryclin V2.3 &copy; 2026 - Auditoría y Calidad Clínica Asegurada
      </div>
    </div>
  );
}
