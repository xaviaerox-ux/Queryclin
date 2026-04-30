import { streamCSV } from './csvStreamer';
import { db } from '../storage/indexedDB';
import { searchEngine } from '../lib/searchEngine';
import { PatientData } from '../core/types';

import { FormMapping } from '../core/mappings';

// REMOVED: detectNhcKey, as it violates the strict mapping rules.

self.onmessage = async (e: MessageEvent) => {
  const { csvText, mapping, strictMode, delimiter, source_file, ingest_timestamp } = e.data;
  
  if (!mapping || !mapping.keys) {
    self.postMessage({ type: 'error', message: 'ERROR: Falta formulario/mapping externo. Ejecución detenida.' });
    return;
  }

  try {
    console.log('[Worker] Iniciando Ingesta Determinista (V4.0)...');
    
    const BATCH_SIZE = 2500;
    let recordsBatch: any[] = [];
    let totalProcessed = 0;
    const uniqueNhcs = new Set<string>();
    
    // Calcular total estimado de líneas antes del streaming
    // para que la barra de progreso sea determinista (antes era siempre totalProcessed + 5000).
    const estimatedTotal = Math.max((csvText.match(/\n/g) || []).length, 1);
    
    searchEngine.startIndexing();

    const stream = streamCSV(csvText, delimiter);

    for (const record of stream) {
      if (totalProcessed === 0) {
        // Validar que las claves estructurales existan en la cabecera
        const keys = Object.keys(record);
        const structuralKeys = [mapping.keys.nhc, mapping.keys.idToma, mapping.keys.ordenToma];
        const missingStruct = structuralKeys.filter(k => !keys.includes(k));
        
        if (missingStruct.length > 0) {
            self.postMessage({ type: 'debug_error', logs: [`Faltan claves estructurales requeridas por el formulario: ${missingStruct.join(', ')}`] });
            return; // Abort
        }
        
        // Validar campos no mapeados (Mapping Completo)
        const allMappedKeys = [
          ...structuralKeys,
          mapping.keys.fechaToma,
          ...Object.values(mapping.demographics || {}),
          ...Object.values(mapping.visualCategories).flat()
        ];
        
        const unmappedFields = keys.filter(k => !allMappedKeys.includes(k));
        if (unmappedFields.length > 0) {
            if (strictMode) {
                self.postMessage({ type: 'debug_error', logs: [`Detectados campos en el CSV no definidos en el Mapping: ${unmappedFields.join(', ')}. Modo STRICT bloquea el almacenamiento silencioso.`] });
                return; // Abort
            } else {
                console.warn(`[Worker] Campos no mapeados detectados (se ignorarán visualmente): ${unmappedFields.join(', ')}`);
            }
        }
      }

      const nhc = record[mapping.keys.nhc];
      if (!nhc) {
          self.postMessage({ type: 'debug_error', logs: [`Falta estructura clave (NHC nulo/vacío) en la línea ${totalProcessed + 1}.`] });
          return; // Abort
      }
      uniqueNhcs.add(String(nhc));

      recordsBatch.push(record);
      totalProcessed++;

      if (recordsBatch.length >= BATCH_SIZE) {
        await processBatch(recordsBatch, totalProcessed, mapping);
        recordsBatch = [];
        
        self.postMessage({ 
          type: 'progress', 
          progress: totalProcessed, 
          total: estimatedTotal
        });
      }
    }

    // Procesar el último lote
    if (recordsBatch.length > 0) {
      await processBatch(recordsBatch, totalProcessed, mapping);
      self.postMessage({ 
        type: 'progress', 
        progress: totalProcessed, 
        total: estimatedTotal
      });
    }

    console.log(`[Worker] Finalizando indexación de ${totalProcessed} registros (${uniqueNhcs.size} pacientes)...`);
    await searchEngine.finalizeIndexing();
    
    await db.saveBatch(db.stores.metadata, { 
      'patient_count': uniqueNhcs.size, 
      'form_id': mapping.id,
      'source_file': source_file,
      'ingest_timestamp': ingest_timestamp
    });

    self.postMessage({ type: 'complete', total: totalProcessed, patientCount: uniqueNhcs.size });

  } catch (error: any) {
    console.error('[Worker] Error crítico:', error);
    if (error.message && error.message.startsWith('DEBUG:')) {
      self.postMessage({ type: 'debug_error', logs: [error.message.replace('DEBUG:', '').trim()] });
    } else {
      self.postMessage({ type: 'error', message: error.message });
    }
  }
};

/**
 * Procesa un lote de registros aplicando la transformación determinista
 */
async function processBatch(records: any[], currentTotal: number, mapping: FormMapping) {
  if (records.length === 0) return;

  // Normalización previa de cabeceras basada en aliases
  const normalizedRecords = records.map(record => {
    const normalized: any = {};
    if (mapping.headerAliases) {
      for (const [canonical, aliases] of Object.entries(mapping.headerAliases)) {
        const foundKey = Object.keys(record).find(k => 
          aliases.some(a => {
            const cleanA = a.toLowerCase().trim();
            const cleanK = k.toLowerCase().trim().replace(/:$/, '');
            return cleanA === cleanK;
          })
        );
        if (foundKey) normalized[canonical] = record[foundKey];
      }
    }
    
    // Añadir campos que ya vengan en formato canónico o estén en visualCategories
    const allExpectedKeys = new Set([
      mapping.keys.nhc, mapping.keys.idToma, mapping.keys.ordenToma, mapping.keys.fechaToma,
      ...Object.values(mapping.demographics),
      ...Object.values(mapping.visualCategories).flat()
    ]);

    for (const key of Object.keys(record)) {
      if (!normalized[key] && allExpectedKeys.has(key)) {
        normalized[key] = record[key];
      }
    }
    return normalized;
  });

  const batchNhcs = Array.from(new Set(
    normalizedRecords.map(r => r[mapping.keys.nhc]).filter(Boolean).map(String)
  ));

  const existingPatients = await db.getBatch(db.stores.patients, batchNhcs);
  const batchPatients: Record<string, PatientData> = { ...existingPatients };

  const { nhc: nhcKey, idToma: idTomaKey, ordenToma: ordenTomaKey } = mapping.keys;
  const demographics = mapping.demographics;

  for (const record of normalizedRecords) {
    const nhc = record[nhcKey] ? String(record[nhcKey]) : null;
    if (!nhc) continue; // Si llegara a faltar, ya deberíamos haber lanzado el error en la lectura

    if (!batchPatients[nhc]) {
      const demoData: Record<string, string> = {};
      if (demographics) {
          for (const [canonicalKey, sourceKey] of Object.entries(demographics)) {
              demoData[canonicalKey] = record[sourceKey] || '';
          }
      }

      // Regla especial HCE-ALG: Evitar duplicidad de fechas
      if (record['Fecha_Observacion_Clinica'] && record['EC_Fecha_Toma'] === record['Fecha_Observacion_Clinica']) {
        delete record['Fecha_Observacion_Clinica'];
      }

      batchPatients[nhc] = {
        nhc,
        demographics: demoData,
        tomas: {}
      };
    }

    const idToma = record[idTomaKey];
    const ordenToma = parseInt(record[ordenTomaKey]);
    
    if (!idToma || isNaN(ordenToma)) {
        throw new Error(`DEBUG: Falta Identificador de Toma o de Orden en línea NHC ${nhc}`);
    }

    if (!batchPatients[nhc].tomas[idToma]) {
      batchPatients[nhc].tomas[idToma] = {
        idToma,
        latest: { ordenToma, data: record },
        registros: []
      };
    } else {
      if (ordenToma > batchPatients[nhc].tomas[idToma].latest.ordenToma) {
        batchPatients[nhc].tomas[idToma].latest = { ordenToma, data: record };
      }
    }
    
    const exists = batchPatients[nhc].tomas[idToma].registros.some(r => r.ordenToma === ordenToma);
    if (exists) {
      // Duplicado detectado: No bloquear ingesta, marcar registro y advertir.
      self.postMessage({ type: 'debug_warn', logs: [`Duplicado detectado en NHC ${nhc}, Toma ${idToma}, Orden ${ordenToma}`] });
      record._is_duplicate = true;
      batchPatients[nhc].tomas[idToma].registros.push({ ordenToma, data: record });
    } else {
      batchPatients[nhc].tomas[idToma].registros.push({ ordenToma, data: record });
    }
  }

  for (const nhc of batchNhcs) {
    if (batchPatients[nhc]) {
      await searchEngine.indexPatient(nhc, batchPatients[nhc], currentTotal < 20000);
    }
  }

  await db.saveBatch(db.stores.patients, batchPatients);
  
  // FIX BUG-004: flushIndex() NO se llama aquí incondicionalmente.
  // En su lugar, hacemos un flush por umbral de tamaño para gestionar memoria
  // sin causar la doble escritura que ocurría cuando finalizeIndexing() volvía a flushar.
  // El flush final definitivo lo realiza finalizeIndexing().
  await searchEngine.flushIndexIfNeeded();

  
  // Limpieza agresiva de memoria
  for (const key in batchPatients) delete batchPatients[key];
}
