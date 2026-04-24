import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchEngine } from '../searchEngine';
import { HCEData } from '../dataStore';

// Mock de la base de datos
const mockDb: Record<string, any> = {};

vi.mock('../db', () => ({
  db: {
    stores: {
      search_index: 'search_index',
      metadata: 'metadata',
      patients: 'patients'
    },
    saveBatch: vi.fn(async (store, items) => {
      if (store === 'search_index') {
        Object.assign(mockDb, items);
      }
      return Promise.resolve();
    }),
    getFromStore: vi.fn(async (store, key) => {
      if (store === 'search_index') return mockDb[key];
      if (key === 'skeleton_fragments') return 1;
      if (key === 'skeletons_frag_0') return { 
        '123': { nhc: '123', services: ['urgencias'], dates: { start: 0, end: 100 } },
        '456': { nhc: '456', services: ['urgencias'], dates: { start: 50, end: 150 } }
      };
      if (key === 'document_count') return 2;
      return null;
    }),
    getBatch: vi.fn(async (store, keys) => {
      const results: Record<string, any> = {};
      keys.forEach(key => {
        if (store === 'search_index' && mockDb[key]) {
          results[key] = mockDb[key];
        }
        // Para esqueletos y otros metadatos
        if (store === 'metadata') {
          if (key === 'skeleton_fragments') results[key] = 1;
          if (key === 'skeletons_frag_0') results[key] = { 
            '123': { nhc: '123', services: ['urgencias'], dates: { start: 0, end: 100 } },
            '456': { nhc: '456', services: ['urgencias'], dates: { start: 50, end: 150 } }
          };
          if (key === 'document_count') results[key] = 2;
        }
      });
      return results;
    }),
    open: vi.fn()
  }
}));

describe('SearchEngine', () => {
  const sampleData: HCEData = {
    patients: {
      '123': {
        nhc: '123',
        demographics: { NOMBRE: 'JUAN' },
        tomas: {
          'T1': {
            idToma: 'T1',
            latest: { ordenToma: 1, data: { DIAGNOSTICO: 'DIABETES pH 7.4', SERVICIO: 'URGENCIAS' } },
            registros: [{ ordenToma: 1, data: { DIAGNOSTICO: 'DIABETES pH 7.4', SERVICIO: 'URGENCIAS' } }]
          }
        }
      },
      '456': {
        nhc: '456',
        demographics: { NOMBRE: 'MARIA' },
        tomas: {
          'T1': {
            idToma: 'T1',
            latest: { ordenToma: 1, data: { DIAGNOSTICO: 'ASMA O2 98%', SERVICIO: 'URGENCIAS' } },
            registros: [{ ordenToma: 1, data: { DIAGNOSTICO: 'ASMA O2 98%', SERVICIO: 'URGENCIAS' } }]
          }
        }
      }
    }
  };

  beforeEach(async () => {
    // Limpiar mock DB antes de cada test
    for (const key in mockDb) delete mockDb[key];
    await searchEngine.buildIndex(sampleData);
    await searchEngine.loadIndex(sampleData);
  });

  it('debe tokenizar términos de 2 letras como pH y O2', async () => {
    const resultsPH = await searchEngine.search('pH');
    expect(resultsPH.length).toBe(1);
    expect(resultsPH[0].nhc).toBe('123');

    const resultsO2 = await searchEngine.search('O2');
    expect(resultsO2.length).toBe(1);
    expect(resultsO2[0].nhc).toBe('456');
  });

  it('debe realizar búsquedas Booleanas AND (implícitas)', async () => {
    const results = await searchEngine.search('diabetes pH');
    expect(results.length).toBe(1);
    expect(results[0].nhc).toBe('123');
  });

  it('debe realizar búsquedas Booleanas OR', async () => {
    const results = await searchEngine.search('diabetes OR asma');
    expect(results.length).toBe(2);
  });

  it('debe realizar búsquedas Booleanas NOT (operador -)', async () => {
    // Si buscamos URGENCIAS pero excluimos DIABETES
    const results = await searchEngine.search('urgencias -diabetes');
    expect(results.length).toBe(1);
    expect(results[0].nhc).toBe('456'); // Solo María (Asma)
  });

  it('debe filtrar por servicio correctamente usando los skeletons indexados', async () => {
    const results = await searchEngine.search('', { service: 'URGENCIAS' });
    expect(results.length).toBe(2);
    
    const resultsNonExistent = await searchEngine.search('', { service: 'UCI' });
    expect(resultsNonExistent.length).toBe(0);
  });
});
