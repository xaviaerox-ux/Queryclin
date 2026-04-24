import { HCEData, Patient, RegistroToma } from './dataStore';
import { db } from './db';

export interface SearchResult {
  nhc: string;
  patient: any; // Usamos any porque ahora es un esqueleto fragmentado
  totalScore: number;
  matchingTomasCount: number;
  bestMatchUrl: { idToma: string; ordenToma: number };
  matchedRegistros: { idToma: string; ordenToma: number; score: number; record?: RegistroToma }[];
}

export class SearchEngine {
  private documentCount = 0;
  private patientSkeletons: Record<string, any> = {};
  private dictionary: string[] = [];

  // FIX BUG-007: Normalizadas sin tilde para que el filtro funcione sobre tokens ya normalizados.
  // FIX BUG-009: INDEX_STOPWORDS (amplio, solo para indexación) vs QUERY_STOPWORDS (restrictivo, solo
  // artículos/preposiciones, para que términos clínicos como 'antecedentes' sigan siendo buscables).
  private readonly INDEX_STOPWORDS: Set<string>;
  private readonly QUERY_STOPWORDS: Set<string>;

  constructor() {
    const normalize = (w: string) => w.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    // Solo lingüísticas — usadas también para filtrar queries
    const linguistic = [
      'de','el','la','y','en','del','los','las','un','una','con','por','para','su','al','lo',
      'como','mas','pero','sus','este','esta','se','ha','si','o','entre','cuando','muy','sin',
      'sobre','tambien','me','hasta','hay','donde','quien','desde','todo','nos','durante',
      'todos','uno','les','ni','contra','otros','ese','eso','ante','ellos','e','esto','mi',
      'antes','algunos','que','unos','yo','otro','otras','otra','el','tanto','esa','estos',
      'mucho','quienes','nada','muchos','cual','poco','ella','estar','estas','algunas','algo',
      'nosotros','mis','tu','te','ti','tus'
    ].map(normalize);
    // Clínicas estructurales — solo para indexación, NO para queries
    const clinicalFillers = [
      'paciente','refiere','presenta','muestra','signos','cuadro','clinico','inicio','hace',
      'horas','dias','meses','anos','ingreso','alta','relevantes'
    ].map(normalize);
    this.QUERY_STOPWORDS = new Set(linguistic);
    this.INDEX_STOPWORDS = new Set([...linguistic, ...clinicalFillers]);
  }

  private tempIndex: Record<string, any[]> = {};
  private tempGlobalTermCounts: Record<string, number> = {};
  private tempSkeletons: Record<string, any> = {};
  private tempSkeletonFragmentCount = 0;
  private termFragmentCounts: Record<string, number> = {};
  private readonly FRAGMENT_SIZE_LIMIT = 2000;

  async buildIndex(data: HCEData) {
    if (!data || !data.patients) return;
    
    const nhcs = Object.keys(data.patients);
    const totalPatients = nhcs.length;

    this.startIndexing();

    for (let i = 0; i < totalPatients; i++) {
      const nhc = nhcs[i];
      await this.indexPatient(nhc, data.patients[nhc], i < 10000);
      
      // Flush periódico del índice
      if (i > 0 && i % 5000 === 0) {
        await this.flushIndex();
      }
    }

    await this.finalizeIndexing();
  }

  startIndexing() {
    this.documentCount = 0;
    this.tempIndex = {};
    this.tempGlobalTermCounts = {};
    this.tempSkeletons = {};
    this.tempSkeletonFragmentCount = 0;
    // FIX BUG-001: Resetear el mapa de fragmentos para evitar IDF corrupto en reimportaciones.
    // Sin este reset, el IDF compara documentCount del CSV nuevo con listas acumuladas del anterior.
    this.termFragmentCounts = {};
    console.log('[SearchEngine] Preparado para indexación incremental.');
  }

  async indexPatient(nhc: string, patient: Patient, isSampling: boolean) {
    // Esqueleto optimizado
    const skeleton: any = { 
      nhc: patient.nhc, 
      demographics: patient.demographics, 
      services: new Set<string>(),
      dates: { start: Infinity, end: -Infinity }
    };

    for (const idToma in patient.tomas) {
      for (const registro of patient.tomas[idToma].registros) {
        this.documentCount++;
        
        // Indexación de atributos (Servicio)
        const srvKey = Object.keys(registro.data).find(k => k.toUpperCase().includes('SERVICIO') || k.toUpperCase().includes('PROCESO'));
        if (srvKey && registro.data[srvKey]) {
          skeleton.services.add(registro.data[srvKey].toLowerCase());
        }
        
        // Indexación de atributos (Fecha)
        const dateKey = Object.keys(registro.data).find(k => k.toUpperCase().includes('FECHA_TOMA'));
        if (dateKey && registro.data[dateKey]) {
           let dateStr = registro.data[dateKey];
           if (dateStr.includes('/')) {
             const parts = dateStr.split('/');
             if (parts.length === 3) dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
           }
           const time = new Date(dateStr).getTime();
           if (!isNaN(time)) {
             skeleton.dates.start = Math.min(skeleton.dates.start, time);
             skeleton.dates.end = Math.max(skeleton.dates.end, time);
           }
        }

        const tokens = this.tokenizeRecord(registro.data);
        const termCounts: Record<string, number> = {};
        for (const token of tokens) termCounts[token] = (termCounts[token] || 0) + 1;

        // INDEXACIÓN DE IDENTIFICADOR COMPACTO: Prioridad máxima
        const nhcTokens = this.tokenize(nhc);
        const nhcCompact = nhc.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        for (const nt of nhcTokens) {
          termCounts[nt] = (termCounts[nt] || 0) + 5; 
        }
        if (nhcCompact.length > 2) {
          termCounts[nhcCompact] = (termCounts[nhcCompact] || 0) + 50; // Peso de ID exacto
        }

        for (const term in termCounts) {
          // FILTRO CRÍTICO: No indexar stopwords de indexación
          if (this.INDEX_STOPWORDS.has(term)) continue;

          // FILTRO DE ESCALA: Solo ignorar números extremadamente cortos (0-99)
          if (term.length <= 2 && /^\d+$/.test(term)) continue;
          
          // FILTRO DE RUIDO: No indexar letras sueltas
          if (term.length === 1) continue;

          if (!this.tempIndex[term]) this.tempIndex[term] = [];
          this.tempIndex[term].push({ nhc, idToma, ordenToma: registro.ordenToma, count: termCounts[term] });
          
          if (isSampling) {
            this.tempGlobalTermCounts[term] = (this.tempGlobalTermCounts[term] || 0) + termCounts[term];
          }
        }
      }
    }
    skeleton.services = Array.from(skeleton.services);
    this.tempSkeletons[nhc] = skeleton;

    // Flush de esqueletos si llegamos a un lote
    if (Object.keys(this.tempSkeletons).length >= 1000) {
      await this.flushSkeletons();
    }
  }

  async flushIndex() {
    if (Object.keys(this.tempIndex).length === 0) return;
    await this.flushIndexPart(this.tempIndex);
    this.tempIndex = {}; 
  }

  // FIX BUG-004: flush condicional por umbral de tamaño.
  // Solo se ejecuta si hay >3000 términos distintos acumulados en memoria,
  // evitando el doble-flush que ocurría al llamar flushIndex() en cada lote.
  async flushIndexIfNeeded(threshold = 3000) {
    if (Object.keys(this.tempIndex).length >= threshold) {
      await this.flushIndexPart(this.tempIndex);
      this.tempIndex = {};
    }
  }

  async flushSkeletons() {
    const keys = Object.keys(this.tempSkeletons);
    if (keys.length === 0) return;

    const fragKey = `skeletons_frag_${this.tempSkeletonFragmentCount}`;
    await db.saveBatch(db.stores.metadata, { [fragKey]: this.tempSkeletons });
    this.tempSkeletons = {};
    this.tempSkeletonFragmentCount++;
  }

  async finalizeIndexing() {
    // 1. Guardar lo que quede en el índice y esqueletos
    await this.flushIndex();
    await this.flushSkeletons();

    // 2. Metadatos finales
    await db.saveBatch(db.stores.metadata, { 
      'skeleton_fragments': this.tempSkeletonFragmentCount, 
      'term_fragment_counts': this.termFragmentCounts,
      'document_count': this.documentCount,
      'last_indexed': new Date().toISOString()
    });

    // 3. Generar diccionario
    console.log(`[SearchEngine] Generando diccionario clínico final...`);
    this.dictionary = Object.entries(this.tempGlobalTermCounts)
      .filter(([term]) => {
        if (term.length < 3) return false;
        if (this.INDEX_STOPWORDS.has(term)) return false;
        if (/^\d+$/.test(term)) return false;
        return true;
      })
      .sort((a, b) => b[1] - a[1])
      .slice(0, 1000)
      .map(([term]) => term);

    await db.saveBatch(db.stores.metadata, { clinical_dictionary: this.dictionary });
    
    // 4. Limpieza final de temporales
    this.tempIndex = {};
    this.tempGlobalTermCounts = {};
    this.tempSkeletons = {};
    console.log(`[SearchEngine] Indexación completada. Diccionario: ${this.dictionary.length} términos.`);
  }

  async loadDictionary() {
    const saved = await db.getFromStore(db.stores.metadata, 'clinical_dictionary');
    if (saved) this.dictionary = saved;
  }

  getSuggestions(input: string): string[] {
    if (!input || input.length < 3) return [];
    const normalized = input.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Devolvemos hasta 8 sugerencias que contengan el input
    return this.dictionary
      .filter(term => term.includes(normalized))
      .slice(0, 8);
  }

  private async flushIndexPart(partialIndex: Record<string, any[]>) {
    const terms = Object.keys(partialIndex);
    if (terms.length === 0) return;

    // 1. Identificar las claves de los "últimos fragmentos" para estos términos
    const lastFragmentKeys = terms.map(term => {
      const count = this.termFragmentCounts[term] || 0;
      const index = Math.max(0, count - 1);
      return `${term}:${index}`;
    });

    // 2. Leer los últimos fragmentos existentes
    const existingFragments = await db.getBatch(db.stores.search_index, lastFragmentKeys);
    
    const batchToSave: Record<string, any[]> = {};
    
    for (const term of terms) {
      const incoming = partialIndex[term];
      const count = this.termFragmentCounts[term] || 0;
      const lastIndex = Math.max(0, count - 1);
      const lastKey = `${term}:${lastIndex}`;
      
      let currentList = existingFragments[lastKey] || [];
      
      // Si el último fragmento está lleno o no existía (count 0), empezamos uno nuevo
      // Pero si count > 0 y lastKey tenía espacio, lo reusamos.
      if (count > 0 && currentList.length < this.FRAGMENT_SIZE_LIMIT) {
        // Reusar el último fragmento
        currentList.push(...incoming);
        
        // Si ahora excede el límite, lo partimos
        if (currentList.length > this.FRAGMENT_SIZE_LIMIT) {
          const remaining = currentList.splice(this.FRAGMENT_SIZE_LIMIT);
          batchToSave[lastKey] = currentList;
          
          // Guardar el excedente en nuevos fragmentos
          let nextIdx = lastIndex + 1;
          while (remaining.length > 0) {
            const chunk = remaining.splice(0, this.FRAGMENT_SIZE_LIMIT);
            batchToSave[`${term}:${nextIdx}`] = chunk;
            nextIdx++;
          }
          this.termFragmentCounts[term] = nextIdx;
        } else {
          batchToSave[lastKey] = currentList;
        }
      } else {
        // Nuevo término o fragmento previo ya estaba lleno
        let nextIdx = count;
        const remaining = [...incoming];
        while (remaining.length > 0) {
          const chunk = remaining.splice(0, this.FRAGMENT_SIZE_LIMIT);
          batchToSave[`${term}:${nextIdx}`] = chunk;
          nextIdx++;
        }
        this.termFragmentCounts[term] = nextIdx;
      }
    }

    // 3. Guardado masivo
    await db.saveBatch(db.stores.search_index, batchToSave);
  }



  async loadIndex(_data: HCEData) {
    this.patientSkeletons = {};
    
    console.log("[SearchEngine] Cargando metadatos del índice...");
    
    try {
      // 1. Cargar metadatos básicos
      const termFrags = await db.getFromStore(db.stores.metadata, 'term_fragment_counts');
      const docCount = await db.getFromStore(db.stores.metadata, 'document_count');
      const patCount = await db.getFromStore(db.stores.metadata, 'patient_count');

      if (termFrags) {
        this.termFragmentCounts = termFrags;
      }

      this.documentCount = docCount || 0;
      console.log(`[SearchEngine] Metadatos cargados: ${this.documentCount} documentos, ${Object.keys(this.termFragmentCounts).length} términos.`);
      
      // 2. Cargar esqueletos de pacientes
      const allMetaKeys = await db.getAllKeys(db.stores.metadata);
      const skeletonKeys = allMetaKeys.filter(k => k.startsWith('skeletons_frag_'));
      
      console.log(`[SearchEngine] Cargando ${skeletonKeys.length} fragmentos de esqueletos...`);
      
      for (const key of skeletonKeys) {
        const frag = await db.getFromStore(db.stores.metadata, key);
        if (frag) Object.assign(this.patientSkeletons, frag);
      }
      
      console.log(`[SearchEngine] Índice V3 cargado: ${Object.keys(this.patientSkeletons).length} pacientes, ${this.documentCount} documentos.`);
    } catch (err) {
      console.error("[SearchEngine] Error cargando el índice:", err);
      throw err;
    }
  }

  getPatientSkeletons() {
    return this.patientSkeletons;
  }

  private tokenize(text: string): string[] {
    if (!text) return [];
    // Soporte para términos cortos (pH, O2) e indicadores clínicos
    return text.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .split(/[^a-z0-9]+/)
      .filter(t => t.length >= 1); // Reducido para capturar códigos y abreviaturas
  }

  private tokenizeRecord(record: Record<string, any>): string[] {
    const tokens: string[] = [];
    for (const key in record) {
      const val = record[key];
      if (val && typeof val === 'string') {
        tokens.push(...this.tokenize(val));
      } else if (val && typeof val === 'number') {
        tokens.push(String(val));
      }
    }
    return tokens;
  }

  async search(query: string, filters?: { dateRange?: [string, string], service?: string }): Promise<SearchResult[]> {
    const rawTerms = query.split(/\s+/).filter(t => t.length > 0);
    const must: string[] = [];
    const mustNot: string[] = [];
    const should: string[] = [];

    for (let i = 0; i < rawTerms.length; i++) {
      const originalTerm = rawTerms[i];
      const termUpper = originalTerm.toUpperCase();
      const prev = rawTerms[i - 1]?.toUpperCase();
      const next = rawTerms[i + 1]?.toUpperCase();
      
      // Saltamos los operadores como palabras clave de búsqueda
      if (termUpper === 'AND' || termUpper === 'OR' || termUpper === 'NOT') continue;

      const tokens = this.tokenize(originalTerm).filter(t => !this.QUERY_STOPWORDS.has(t));
      const compact = originalTerm.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Solo añadimos el término compacto si es un CÓDIGO (contiene números y letras) 
      // y no está ya presente en los tokens. Esto evita romper búsquedas de texto normal.
      const isCode = /[a-z]/.test(compact) && /[0-9]/.test(compact);
      if (isCode && compact.length > 3 && !tokens.includes(compact)) {
        tokens.push(compact);
      }
      
      if (tokens.length === 0) continue;
      
      if (prev === 'NOT' || originalTerm.startsWith('-')) {
        mustNot.push(...tokens);
      } else if (next === 'OR' || prev === 'OR') {
        should.push(...tokens);
      } else {
        must.push(...tokens);
      }
    }

    // NORMALIZACIÓN DE MUST: Evitar fallos de longitud con términos duplicados
    const uniqueMust = Array.from(new Set(must));

    if (must.length === 0 && should.length === 0) return await this.getAllRecords(filters);

    // --- OPTIMIZACIÓN V3: FETCH FRAGMENTADO ---
    const allQueryTokens = Array.from(new Set([...uniqueMust, ...should, ...mustNot]));
    const indexResults: Record<string, any[]> = {};
    
    if (allQueryTokens.length > 0) {
      const allFragmentKeys: string[] = [];
      for (const token of allQueryTokens) {
        const count = this.termFragmentCounts[token] || 0;
        for (let i = 0; i < count; i++) {
          allFragmentKeys.push(`${token}:${i}`);
        }
      }
      
      const fragments = await db.getBatch(db.stores.search_index, allFragmentKeys);
      
      // Re-agrupar fragmentos por token
      for (const token of allQueryTokens) {
        indexResults[token] = [];
        const count = this.termFragmentCounts[token] || 0;
        for (let i = 0; i < count; i++) {
          const frag = fragments[`${token}:${i}`];
          if (frag) indexResults[token].push(...frag);
        }
      }
    }

    const patientMatches: Record<string, any> = {};
    
    const processTerms = (terms: string[], isMust: boolean) => {
      for (const term of terms) {
        const docs = indexResults[term];
        if (!docs) continue;

        const idf = Math.log(this.documentCount / (docs.length || 1)) + 1;
        for (const doc of docs) {
          const score = doc.count * idf;
          if (!patientMatches[doc.nhc]) {
            patientMatches[doc.nhc] = {
              nhc: doc.nhc,
              totalScore: 0,
              registros: {},
              matchedMustTokens: new Set<string>()
            };
          }
          const pm = patientMatches[doc.nhc];
          pm.totalScore += score;
          if (isMust) pm.matchedMustTokens.add(term);
          const regId = `${doc.idToma}_${doc.ordenToma}`;
          if (!pm.registros[regId]) {
            // FIX BUG-002: Rastrear qué tokens must aparecen en cada registro individual
            pm.registros[regId] = { idToma: doc.idToma, ordenToma: doc.ordenToma, score: 0, mustTerms: new Set<string>() };
          }
          pm.registros[regId].score += score;
          // FIX BUG-002: Acumular token must a nivel de registro (co-locación)
          if (isMust) pm.registros[regId].mustTerms.add(term);
        }
      }
    };

    processTerms(uniqueMust, true);
    processTerms(should, false);

    // CORRECCIÓN NOT: Usar los resultados ya obtenidos en el batch
    const mustNotNhcs = new Set<string>();
    for (const term of mustNot) {
      const docs = indexResults[term];
      if (docs) docs.forEach((doc: any) => mustNotNhcs.add(doc.nhc));
    }

    let results: SearchResult[] = [];
    const filterService = filters?.service?.toLowerCase();
    const filterStart = filters?.dateRange?.[0] ? new Date(filters.dateRange[0]).getTime() : null;
    const filterEnd = filters?.dateRange?.[1] ? new Date(filters.dateRange[1]).getTime() : null;

    for (const nhc in patientMatches) {
      const pm = patientMatches[nhc];
      
      // 1. FILTRO DE EXCLUSIÓN (NOT)
      if (mustNotNhcs.has(nhc)) continue;

      // 2. INTERSECCIÓN ESTRICTA A NIVEL DE PACIENTE (pre-filtro rápido)
      if (uniqueMust.length > 0 && pm.matchedMustTokens.size < uniqueMust.length) continue;

      const skeleton = this.patientSkeletons[nhc];

      // 3. FILTRO POR SERVICIO
      if (filterService && skeleton) {
        const hasService = skeleton.services.some((s: string) => s.includes(filterService));
        if (!hasService) continue;
      }

      // 4. FILTRO POR FECHA
      if (skeleton && (filterStart || filterEnd)) {
        if (filterStart && skeleton.dates.end < filterStart) continue;
        if (filterEnd && skeleton.dates.start > filterEnd) continue;
      }

      const flatRegistros = Object.values(pm.registros).sort((a: any, b: any) => b.score - a.score);
      if (flatRegistros.length === 0) continue;

      // FIX BUG-002: Verificación de co-locación a nivel de registro.
      // Para búsquedas multi-token AND, al menos UN registro debe contener TODOS los tokens must.
      // Esto evita el falso positivo de "PNEUMONIA BACTERIANA" donde cada término está en una toma diferente.
      if (uniqueMust.length > 1) {
        const hasColocated = flatRegistros.some(
          (reg: any) => reg.mustTerms instanceof Set && uniqueMust.every(term => reg.mustTerms.has(term))
        );
        if (!hasColocated) continue;
      }

      const uniqueTomasCount = new Set(flatRegistros.map((r: any) => r.idToma)).size;

      // FIX BUG-008: Normalizar el score por log del número de registros para evitar que
      // pacientes crónicos con historiales largos dominen el ranking sobre coincidencias más relevantes.
      const normalizedScore = pm.totalScore / Math.log(flatRegistros.length + 2);

      results.push({
        nhc: pm.nhc,
        patient: skeleton || { nhc: pm.nhc, demographics: {}, tomas: {}, services: [], dates: { start: Infinity, end: -Infinity } },
        totalScore: normalizedScore,
        matchingTomasCount: uniqueTomasCount,
        bestMatchUrl: { idToma: (flatRegistros[0] as any).idToma, ordenToma: (flatRegistros[0] as any).ordenToma },
        matchedRegistros: flatRegistros as any
      });
    }

    return this.applyFiltersAndSort(results, filters);
  }

  private async getAllRecords(filters?: { dateRange?: [string, string], service?: string }): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const nhcs = Object.keys(this.patientSkeletons);
    
    for (const nhc of nhcs) {
      results.push({
        nhc,
        patient: this.patientSkeletons[nhc],
        totalScore: 1,
        matchingTomasCount: 1,
        bestMatchUrl: { idToma: 'N/A', ordenToma: 0 },
        matchedRegistros: []
      });
    }
    return this.applyFiltersAndSort(results, filters);
  }

  private applyFiltersAndSort(results: SearchResult[], filters?: { dateRange?: [string, string], service?: string }): SearchResult[] {
    let filtered = results;
    
    if (filters) {
      if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
        const start = new Date(filters.dateRange[0]).getTime();
        const end = new Date(filters.dateRange[1]).getTime();
        filtered = filtered.filter(res => {
          const skel = this.patientSkeletons[res.nhc];
          if (!skel || !skel.dates) return false;
          // Optimización: Si el rango del paciente no solapa con el filtro, descartar
          return !(skel.dates.end < start || skel.dates.start > end);
        });
      }

      if (filters.service) {
        const srv = filters.service.toLowerCase();
        filtered = filtered.filter(res => {
          const skel = this.patientSkeletons[res.nhc];
          if (!skel || !skel.services) return false;
          return skel.services.some((s: string) => s.includes(srv));
        });
      }
    }

    return filtered.sort((a, b) => b.totalScore - a.totalScore);
  }
}

export const searchEngine = new SearchEngine();
