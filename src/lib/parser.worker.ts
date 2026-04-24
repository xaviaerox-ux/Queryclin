import { streamCSV } from './csvParser';
import { db } from './db';
import { searchEngine } from './searchEngine';
import { PatientData } from './dataStore';

// FIX BUG-003: Función centralizada de detección de NHC.
// Antes se duplicaba esta lógica en el loop principal Y en processBatch,
// lo que causaba desincronización de identidades si el primer registro de un lote tenía el campo vacío.
function detectNhcKey(keys: string[]): string {
  const found = keys.find(k => {
    const cleanKey = k.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const isId = cleanKey.includes('ID') || cleanKey.includes('COD') || cleanKey.includes('IDENTIF');
    const isPatient = cleanKey.includes('PAC') || cleanKey.includes('PAT') || cleanKey.includes('NHC') || cleanKey.includes('HCE') || cleanKey.includes('HISTORIA');
    return (isId && isPatient) || cleanKey === 'NHC' || cleanKey === 'ID' || cleanKey === 'CIPA' || cleanKey === 'CIP';
  });
  return found || keys[0] || '';
}

self.onmessage = async (e: MessageEvent) => {
  const { csvText } = e.data;
  
  try {
    console.log('[Worker] Iniciando Ingesta Solid-State (V3.1)...');
    
    const BATCH_SIZE = 10000;
    let recordsBatch: any[] = [];
    let totalProcessed = 0;
    const uniqueNhcs = new Set<string>();
    
    // FIX BUG-006: Calcular total estimado de líneas antes del streaming
    // para que la barra de progreso sea determinista (antes era siempre totalProcessed + 5000).
    const estimatedTotal = Math.max((csvText.match(/\n/g) || []).length, 1);
    
    searchEngine.startIndexing();

    // FIX BUG-003: Detectar nhcKey UNA sola vez desde el primer registro y reutilizar.
    let nhcKey = '';
    const stream = streamCSV(csvText);

    for (const record of stream) {
      const keys = Object.keys(record);
      
      if (totalProcessed === 0) {
        // Detección única de NHC al procesar el primer registro
        nhcKey = detectNhcKey(keys);
        console.log('[Worker] Cabeceras detectadas:', keys);
        console.log('[Worker] Columna NHC detectada:', nhcKey);
      }

      const nhc = nhcKey ? record[nhcKey] : null;
      if (nhc) uniqueNhcs.add(String(nhc));

      recordsBatch.push(record);
      totalProcessed++;

      if (recordsBatch.length >= BATCH_SIZE) {
        // FIX BUG-003: Pasar nhcKey como parámetro para evitar re-detección inconsistente
        await processBatch(recordsBatch, totalProcessed, nhcKey);
        recordsBatch = [];
        
        // FIX BUG-006: Usar estimatedTotal en lugar de la estimación arbitraria anterior
        self.postMessage({ 
          type: 'progress', 
          progress: totalProcessed, 
          total: estimatedTotal
        });
      }
    }

    // Procesar el último lote
    if (recordsBatch.length > 0) {
      await processBatch(recordsBatch, totalProcessed, nhcKey);
    }

    console.log(`[Worker] Finalizando indexación de ${totalProcessed} registros (${uniqueNhcs.size} pacientes)...`);
    await searchEngine.finalizeIndexing();
    
    await db.saveBatch(db.stores.metadata, { 'patient_count': uniqueNhcs.size });

    self.postMessage({ type: 'complete', total: totalProcessed, patientCount: uniqueNhcs.size });

  } catch (error: any) {
    console.error('[Worker] Error crítico:', error);
    self.postMessage({ type: 'error', message: error.message });
  }
};

/**
 * Procesa un lote de registros: Merge de pacientes e Indexación.
 * FIX BUG-003: Recibe nhcKey como parámetro en lugar de re-detectarlo (evita desincronización).
 * FIX BUG-004: No llama a flushIndex() al final — finalizeIndexing() lo hace una sola vez.
 */
async function processBatch(records: any[], currentTotal: number, nhcKey: string) {
  if (records.length === 0) return;
  
  const sample = records[0];
  const keys = Object.keys(sample);

  const batchNhcs = Array.from(new Set(
    records.map(r => r[nhcKey]).filter(Boolean).map(String)
  ));

  const existingPatients = await db.getBatch(db.stores.patients, batchNhcs);
  const batchPatients: Record<string, PatientData> = { ...existingPatients };

  const findKey = (keywords: string[], exclusions: string[] = []) => {
    return keys.find(k => {
      const uk = k.toUpperCase().replace(/[^A-Z0-9]/g, '');
      const matches = keywords.some(kw => uk.includes(kw));
      const isExcluded = exclusions.some(ex => uk.includes(ex));
      return matches && !isExcluded;
    });
  };

  const idTomaKey = findKey(['IDTOMA', 'IDENTIFICADORTOMA', 'EPISODIO']) || 'ID_TOMA';
  const ordenTomaKey = findKey(['ORDENTOMA', 'ORDEN', 'VERSION']) || 'ORDEN_TOMA';

  for (const record of records) {
    const nhc = record[nhcKey] ? String(record[nhcKey]) : null;
    if (!nhc) continue;

    if (!batchPatients[nhc]) {
      const findValue = (keywords: string[], exclusions: string[] = []) => {
        const key = findKey(keywords, exclusions);
        return key ? record[key] : '';
      };

      batchPatients[nhc] = {
        nhc,
        demographics: {
          NOMBRE: findValue(['NOMBRE', 'APELLIDO'], ['CIUDAD', 'POBLACION', 'USUARIO', 'PROCESO']),
          SEXO: findValue(['SEXO', 'GENERO']),
          EDAD: findValue(['EDAD', 'ANOS'], ['FECHA', 'NACIMIENTO']), 
          CIUDAD: findValue(['CIUDAD', 'POBLACION', 'LOCALIDAD']),
          POSTAL: findValue(['POSTAL', 'CP', 'ZIP'])
        },
        tomas: {}
      };
    }

    const idToma = record[idTomaKey] || `T-${currentTotal}-${record[ordenTomaKey] || 'X'}`;
    const ordenToma = parseInt(record[ordenTomaKey]) || 0;

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
    
    // FIX BUG-005: La comprobación de existencia ya evita duplicados dentro del lote.
    // Los registros cargados de IDB via getBatch están preservados en batchPatients[nhc].tomas,
    // así que el historial previo persiste correctamente.
    const exists = batchPatients[nhc].tomas[idToma].registros.some(r => r.ordenToma === ordenToma);
    if (!exists) {
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
