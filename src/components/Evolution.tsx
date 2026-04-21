import React from 'react';
import { ArrowLeft, Code, Lightbulb, Database, Activity, FileCheck, Zap, Shield, Microscope } from 'lucide-react';

interface EvolutionProps {
  onBack: () => void;
}

export default function Evolution({ onBack }: EvolutionProps) {
  const milestones = [
    {
      date: '08 de Abril, 2026',
      title: 'Génesis y Fundamentos',
      description: 'El proyecto nace como una serie de laboratorios de lógica intensiva. Se establecen los estándares de codificación y la estructura profesional que servirá de base para todo el ecosistema.',
      icon: <Code className="text-blue-500" />,
      color: 'blue'
    },
    {
      date: '13-15 de Abril, 2026',
      title: 'El Concepto Queryclin',
      description: 'Se conceptualiza un buscador clínico que prioriza la privacidad absoluta (Local-First). Se realiza una auditoría técnica para asegurar que los datos médicos nunca abandonen el equipo del usuario.',
      icon: <Lightbulb className="text-yellow-500" />,
      color: 'yellow'
    },
    {
      date: '16 de Abril, 2026',
      title: 'Arquitectura de Acero',
      description: 'Nace la primera versión funcional. Se implementa IndexedDB para persistencia y se diseña el "Deep Slate Dark Mode", una interfaz premium enfocada en reducir la fatiga visual del personal clínico.',
      icon: <Database className="text-cyan-500" />,
      color: 'cyan'
    },
    {
      date: '17-20 de Abril, 2026',
      title: 'Salto a la Escala (Big Data)',
      description: 'Se rompen los límites del navegador. Implementación de sharding local para gestionar más de 100,000 registros con tiempos de respuesta de milisegundos. El motor de búsqueda evoluciona para entender abreviaturas médicas.',
      icon: <Zap className="text-orange-500" />,
      color: 'orange'
    },
    {
      date: 'Hoy',
      title: 'Ecosistema de Calidad Clínica',
      description: 'Se consolida el sistema con una suite de pruebas industriales (Vitest/Playwright). Se inaugura el Centro de Ayuda técnico y se oficializa la coordinación con el Hospital Rafael Méndez.',
      icon: <FileCheck className="text-green-500" />,
      color: 'green'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-12 px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent-clinical)] transition-colors mb-8 group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="font-bold uppercase tracking-widest text-[11px]">Volver al buscador</span>
      </button>

      <div className="mb-16">
        <h1 className="text-4xl font-black mb-4 tracking-tight">Evolución de <span className="text-[var(--accent-clinical)]">Queryclin</span></h1>
        <p className="text-[var(--text-secondary)] text-lg leading-relaxed max-w-2xl">
          Un viaje desde el código base hasta una plataforma de análisis clínico de alto rendimiento.
        </p>
      </div>

      <div className="relative border-l-2 border-[var(--border-clinical)] ml-4 pl-10 space-y-16 py-4">
        {milestones.map((milestone, idx) => (
          <div key={idx} className="relative group">
            {/* Dot */}
            <div className={`absolute -left-[51px] top-0 w-5 h-5 rounded-full border-4 border-[var(--bg-clinical)] bg-${milestone.color}-500 shadow-lg group-hover:scale-125 transition-transform z-10`} />
            
            <div className="bg-[var(--glass-bg)] p-8 rounded-3xl border border-[var(--border-clinical)] hover:border-[var(--accent-clinical)]/30 transition-all hover:shadow-xl hover:shadow-[var(--accent-clinical)]/5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl bg-${milestone.color}-500/10 flex items-center justify-center p-2.5`}>
                    {milestone.icon}
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">{milestone.date}</span>
                    <h2 className="text-xl font-black text-[var(--text-primary)]">{milestone.title}</h2>
                  </div>
                </div>
              </div>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                {milestone.description}
              </p>
            </div>
          </div>
        ))}
        
        {/* Progress Line Cover at bottom */}
        <div className="absolute bottom-0 -left-[2px] w-[2px] h-32 bg-gradient-to-t from-[var(--bg-clinical)] to-transparent" />
      </div>

      <div className="mt-20 p-10 bg-[var(--glass-bg)] rounded-[40px] border border-[var(--border-clinical)] text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <Activity size={300} className="absolute -top-20 -right-20" />
        </div>
        
        <h3 className="text-2xl font-black mb-4">Misión Continua</h3>
        <p className="text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed italic">
          "Nuestra meta es proporcionar una herramienta que sea invisible en su complejidad pero indispensable en su precisión, devolviéndole al clínico el tiempo que los datos fragmentados le arrebatan."
        </p>
        <div className="mt-8 flex justify-center items-center gap-3">
          <Microscope size={20} className="text-[var(--accent-clinical)]" />
          <span className="text-[11px] font-black uppercase tracking-[4px] text-[var(--text-secondary)]">Próxima Fase: Ingesta Inteligente con IA</span>
        </div>
      </div>

      <div className="text-center mt-12 text-[var(--text-secondary)] text-[10px] font-medium tracking-widest uppercase opacity-50">
        Hoja de Ruta 2026 - Queryclin V2.4
      </div>
    </div>
  );
}
