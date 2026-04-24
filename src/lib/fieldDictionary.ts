/**
 * Taxonomía de campos HCE con categorías jerárquicas según el metaprompt clínico V3.3.
 * Categorías en orden de visualización fijo y continuo.
 */
export type FieldCategory =
  | 'Demografía'
  | 'Alergias y Motivo'
  | 'Antecedentes'
  | 'Anamnesis y Exploración'
  | 'Exploraciones Complementarias'
  | 'Diagnóstico y Tratamiento'
  | 'Resultados y Pruebas'
  | 'Hospitalización'
  | 'OTROS';

/** Orden de renderizado fijo en la vista continua */
export const SECTION_ORDER: FieldCategory[] = [
  'Alergias y Motivo',
  'Antecedentes',
  'Anamnesis y Exploración',
  'Exploraciones Complementarias',
  'Diagnóstico y Tratamiento',
  'Resultados y Pruebas',
  'Hospitalización',
  'OTROS',
];

/** Etiquetas legibles por sección */
export const SECTION_LABELS: Record<FieldCategory, string> = {
  'Demografía':                  'Datos Demográficos',
  'Alergias y Motivo':           'Alergias · Motivo de Consulta',
  'Antecedentes':                'Antecedentes',
  'Anamnesis y Exploración':     'Anamnesis y Exploración',
  'Exploraciones Complementarias': 'Exploraciones Complementarias Solicitadas',
  'Diagnóstico y Tratamiento':   'Diagnóstico y Tratamiento',
  'Resultados y Pruebas':        'Resultados y Pruebas',
  'Hospitalización':             'Paciente Hospitalizado',
  'OTROS':                       'Otros Datos',
};

const categoryKeywords: Record<FieldCategory, string[]> = {
  'Demografía': [
    'nhc', 'cipa', 'fecha_nacimiento', 'nacimiento', 'edad', 'sexo', 'ciudad', 'postal',
    'domicilio', 'estado_civil', 'nombre', 'apellido',
  ],
  'Alergias y Motivo': [
    'alergia', 'alerg', 'intoleranc', 'motivo_consulta', 'motivo_ingreso', 'motivo',
  ],
  'Antecedentes': [
    'antecedente', 'ant_fam', 'antfam', 'ant_med', 'antmed', 'familiar', 'personal',
    'quirurgico', 'quirúrgico', 'habito', 'hábito', 'vacuna', 'ant_',
  ],
  'Anamnesis y Exploración': [
    'anamnesis', 'anam', 'enfermedad_actual', 'enfermedad', 'exploracion', 'exploración',
    'expl', 'sintoma', 'síntoma', 'talla', 'peso', 'ta', 'fc', 'temperatura', 'constante',
    'imc', 'perimetro', 'perímetro', 'edema',
  ],
  'Exploraciones Complementarias': [
    'complementaria', 'ecs', 'solicitud', 'solicita', 'observacion', 'observación', 'obs',
    'peticion', 'petición',
  ],
  'Diagnóstico y Tratamiento': [
    'diagnostico', 'diagnóstico', 'diag', 'juicio', 'tratamiento', 'tto', 'medicacion',
    'medicación', 'prescripcion', 'prescripción', 'plan', 'receta', 'recomendacion',
    'recomendación', 'evolucion', 'evolución', 'proxima_revision', 'revision',
  ],
  'Resultados y Pruebas': [
    'analitica', 'analítica', 'laboratorio', 'prueba', 'imagen', 'rx', 'tac', 'rmn',
    'ecografia', 'ecografía', 'biopsia', 'cultivo', 'resultado', 'anatomia', 'anatomía',
    'radiodiagnostico', 'radiodiagnóstico', 'otras_pruebas',
  ],
  'Hospitalización': [
    'tipo_ingreso', 'ingreso', 'alta', 'traslado', 'uci', 'urgencia', 'servicio',
    'resumen_evolucion', 'juicio_clinico', 'juicio_clínico', 'juicio_diagnostico',
    'juicio_diagnóstico', 'tratamiento_recomendado', 'revisiones_posteriores', 'motivo_alta',
  ],
  'OTROS': [],
};

export function classifyField(fieldName: string): FieldCategory {
  const lower = fieldName.toLowerCase().replace(/[_\s-]+/g, '_');

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (category === 'OTROS') continue;
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return category as FieldCategory;
      }
    }
  }

  return 'OTROS';
}
