export interface ClinicalRecord {
  [key: string]: string;
}

export interface RegistroToma {
  ordenToma: number;
  data: ClinicalRecord;
}

export interface Toma {
  idToma: string;
  registros: RegistroToma[];
  latest: RegistroToma;
}

export interface Patient {
  nhc: string;
  tomas: Record<string, Toma>;
  demographics: ClinicalRecord;
}

// Alias para compatibilidad con parser.worker.ts
export type PatientData = Patient;

export interface HCEData {
  patients: Record<string, Patient>;
}

import { db } from './db';

/**
 * Capa de almacenamiento. Arquitectura Local-First (V3+):
 * la persistencia real la gestiona el Worker via IndexedDB.
 */
export const storage = {
  clearData: async () => {
    await db.clear();
  }
};

/**
 * Detecta el género del paciente basándose en los datos demográficos.
 * Prioriza campos que contengan 'SEXO' o 'GENERO'.
 * Normaliza H/V -> male, M -> female.
 */
export function getGender(demographics: ClinicalRecord): 'male' | 'female' | 'neutral' {
  const genderKey = Object.keys(demographics).find(k => {
    const uk = k.toUpperCase();
    return uk.includes('SEXO') || uk.includes('GENERO') || uk === 'SEX';
  });

  if (!genderKey) return 'neutral';
  
  const val = demographics[genderKey].toUpperCase().trim();
  if (['H', 'V', 'HOMBRE', 'VARON', 'VARÓN', 'MALE'].some(v => val.includes(v))) return 'male';
  if (['M', 'MUJER', 'FEMALE', 'HEMBRA'].some(v => val.includes(v))) return 'female';
  
  return 'neutral';
}
