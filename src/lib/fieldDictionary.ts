export type FieldCategory =
  | 'Demografía'
  | 'Antecedentes'
  | 'Anamnesis y Exploración'
  | 'Diagnóstico y Tratamiento'
  | 'Resultados'
  | 'Hospitalización'
  | 'OTROS';

const categoryKeywords: Record<FieldCategory, string[]> = {
  'Demografía': [
    'n.h.c', 'cipa', 'fecha de nacimiento', 'edad', 'sexo', 'ciudad', 'código postal', 'postal', 'demog'
  ],
  'Antecedentes': [
    'antecedente', 'alergia', 'habito', 'familiar', 'personal', 'vacuna'
  ],
  'Anamnesis y Exploración': [
    'anamnesis', 'exploracion', 'exploración', 'motivo', 'enfermedad actual', 'sintoma', 'talla', 'peso', 'ta', 'fc', 'temperatura', 'constante'
  ],
  'Diagnóstico y Tratamiento': [
    'diagnostico', 'diagnóstico', 'tratamiento', 'medicacion', 'prescripcion', 'plan', 'proceso'
  ],
  'Resultados': [
    'resultado', 'laboratorio', 'analitica', 'imagen', 'prueba', 'cultivo', 'biopsia'
  ],
  'Hospitalización': [
    'ingreso', 'alta', 'cama', 'planta', 'habitacion', 'estancia', 'evolucion', 'epicrisis'
  ],
  'OTROS': []
};

export function classifyField(fieldName: string): FieldCategory {
  const lowerName = fieldName.toLowerCase();
  
  // Special exact matches based on prompt
  if (lowerName.includes('ec_proceso')) return 'Diagnóstico y Tratamiento';
  if (lowerName.includes('talla')) return 'Anamnesis y Exploración';
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (category === 'OTROS') continue;
    for (const keyword of keywords) {
      if (lowerName.includes(keyword)) {
        return category as FieldCategory;
      }
    }
  }
  
  return 'OTROS';
}
