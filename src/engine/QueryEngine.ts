import { HCEData, RegistroToma } from '../core/types';
import { db } from '../storage/indexedDB';
import { globalTokenizer } from './Tokenizer';

// ============================================================
// OKAPI BM25 — Parámetros de ajuste (V3.9.0)
// k1: controla la saturación de la frecuencia del término (TF).
//     Valores típicos: 1.2–2.0. Con k1=1.5, mencionar un término
//     50 veces ya NO multiplica el score x50 como en TF-IDF básico.
// b:  controla la normalización por longitud de documento.
//     b=0.75 penaliza levemente historiales muy largos sin hacerlo
//     tan agresivo como la penalización logarítmica anterior.
// ============================================================
const BM25_K1 = 1.5;
const BM25_B = 0.75;

export interface SearchResult {
  nhc: string;
  patient: any;
  totalScore: number;
  matchingTomasCount: number;
  bestMatchUrl: { idToma: string; ordenToma: number };
  matchedRegistros: { idToma: string; ordenToma: number; score: number; record?: RegistroToma }[];
}

export class QueryEngine {
  private documentCount = 0;
  private patientSkeletons: Record<string, any> = Object.create(null);
  private termFragmentCounts: Record<string, number> = Object.create(null);
  /** Longitud media de los documentos indexados (en tokens). Necesaria para BM25. */
  private avgDocLength = 0;
  public dictionary: string[] = [];

  public async loadIndex() {
    this.patientSkeletons = Object.create(null);
    
    console.log("[QueryEngine] Cargando metadatos del índice...");
    
    try {
      const termFrags = await db.getFromStore(db.stores.metadata, 'term_fragment_counts');
      const docCount = await db.getFromStore(db.stores.metadata, 'document_count');
      const avgLen = await db.getFromStore(db.stores.metadata, 'avg_doc_length');

      if (termFrags) {
        this.termFragmentCounts = termFrags;
      }

      this.documentCount = docCount || 0;
      // BM25: la longitud media se estima como total_tokens / document_count.
      // Si no está almacenada (datasets anteriores a V3.9.0), se usa un fallback heurístico.
      this.avgDocLength = avgLen || 150;
      console.log(`[QueryEngine] Metadatos BM25 cargados: ${this.documentCount} docs, avgLen=${this.avgDocLength} tokens.`);
      
      const allMetaKeys = await db.getAllKeys(db.stores.metadata);
      const skeletonKeys = allMetaKeys.filter(k => k.startsWith('skeletons_frag_'));
      
      console.log(`[QueryEngine] Cargando ${skeletonKeys.length} fragmentos de esqueletos...`);
      
      for (const key of skeletonKeys) {
        const frag = await db.getFromStore(db.stores.metadata, key);
        if (frag) Object.assign(this.patientSkeletons, frag);
      }
      
      console.log(`[QueryEngine] Índice cargado: ${Object.keys(this.patientSkeletons).length} pacientes, ${this.documentCount} documentos.`);
    } catch (err) {
      console.error("[QueryEngine] Error cargando el índice:", err);
      throw err;
    }
  }

  public getPatientSkeletons() {
    return this.patientSkeletons;
  }

  public async loadDictionary() {
    const saved = await db.getFromStore(db.stores.metadata, 'clinical_dictionary');
    if (saved) this.dictionary = saved;
  }

  public getSuggestions(input: string): string[] {
    if (!input || input.length < 3) return [];
    
    // Usamos el tokenizer para la normalización básica
    const normalized = input.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    return this.dictionary
      .filter(term => term.includes(normalized))
      .slice(0, 8);
  }

  public async search(query: string, filters?: { dateRange?: [string, string], service?: string }): Promise<SearchResult[]> {
    const rawTerms = query.split(/\s+/).filter(t => t.length > 0);
    const must: string[] = [];
    const mustNot: string[] = [];
    const should: string[] = [];

    for (let i = 0; i < rawTerms.length; i++) {
      const originalTerm = rawTerms[i];
      const termUpper = originalTerm.toUpperCase();
      const prev = rawTerms[i - 1]?.toUpperCase();
      const next = rawTerms[i + 1]?.toUpperCase();
      
      if (termUpper === 'AND' || termUpper === 'OR' || termUpper === 'NOT') continue;

      // MEJORA V3.9.0: Usar expandQuery en lugar de tokenize para capturar
      // sinónimos clínicos y frases compuestas en la consulta del usuario.
      const tokens = globalTokenizer.expandQuery(originalTerm)
        .filter(t => !globalTokenizer.QUERY_STOPWORDS.has(t));
      const compact = originalTerm.toLowerCase().replace(/[^a-z0-9]/g, '');
      
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

    const uniqueMust = Array.from(new Set(must));

    if (must.length === 0 && should.length === 0) return await this.getAllRecords(filters);

    const allQueryTokens = Array.from(new Set([...uniqueMust, ...should, ...mustNot]));
    const indexResults: Record<string, any[]> = Object.create(null);
    
    if (allQueryTokens.length > 0) {
      const allFragmentKeys: string[] = [];
      for (const token of allQueryTokens) {
        const count = this.termFragmentCounts[token] || 0;
        for (let i = 0; i < count; i++) {
          allFragmentKeys.push(`${token}:${i}`);
        }
      }
      
      const fragments = await db.getBatch(db.stores.search_index, allFragmentKeys);
      
      for (const token of allQueryTokens) {
        indexResults[token] = [];
        const count = this.termFragmentCounts[token] || 0;
        for (let i = 0; i < count; i++) {
          const frag = fragments[`${token}:${i}`];
          if (frag) indexResults[token].push(...frag);
        }
      }
    }

    const patientMatches: Record<string, any> = Object.create(null);
    
    const mustNotRecords = new Set<string>();
    for (const term of mustNot) {
      const docs = indexResults[term];
      if (docs) docs.forEach((doc: any) => mustNotRecords.add(`${doc.nhc}_${doc.idToma}_${doc.ordenToma}`));
    }

    const processTerms = (terms: string[], isMust: boolean) => {
      for (const term of terms) {
        const docs = indexResults[term];
        if (!docs) continue;

        // ── OKAPI BM25 SCORING (V3.9.0) ──────────────────────────────────
        // IDF con suavizado Robertson: log((N - df + 0.5) / (df + 0.5) + 1)
        // Evita IDF negativo cuando df > N/2 y es numéricamente más estable.
        const N = this.documentCount;
        const df = docs.length || 1;
        const idf = Math.log((N - df + 0.5) / (df + 0.5) + 1);

        for (const doc of docs) {
          const regId = `${doc.idToma}_${doc.ordenToma}`;
          
          if (mustNotRecords.has(`${doc.nhc}_${doc.idToma}_${doc.ordenToma}`)) continue;

          // TF saturado con BM25: tf_bm25 = (tf * (k1+1)) / (tf + k1 * (1 - b + b * docLen/avgDocLen))
          // doc.count = TF crudo. doc.docLen = longitud del documento en tokens (si está disponible).
          const tf = doc.count;
          const docLen = doc.docLen || this.avgDocLength;
          const tfBm25 = (tf * (BM25_K1 + 1)) / (tf + BM25_K1 * (1 - BM25_B + BM25_B * (docLen / this.avgDocLength)));
          const score = tfBm25 * idf;
          // ────────────────────────────────────────────────────────────────

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
          if (!pm.registros[regId]) {
            pm.registros[regId] = { idToma: doc.idToma, ordenToma: doc.ordenToma, score: 0, mustTerms: new Set<string>() };
          }
          pm.registros[regId].score += score;
          if (isMust) pm.registros[regId].mustTerms.add(term);
        }
      }
    };

    processTerms(uniqueMust, true);
    processTerms(should, false);

    let results: SearchResult[] = [];
    const filterService = filters?.service?.toLowerCase();
    const filterStart = filters?.dateRange?.[0] ? new Date(filters.dateRange[0]).getTime() : null;
    const filterEnd = filters?.dateRange?.[1] ? new Date(filters.dateRange[1]).getTime() : null;

    for (const nhc in patientMatches) {
      const pm = patientMatches[nhc];
      const skeleton = this.patientSkeletons[nhc];

      if (uniqueMust.length > 0 && pm.matchedMustTokens.size < uniqueMust.length) continue;

      const flatRegistros = Object.values(pm.registros).sort((a: any, b: any) => b.score - a.score);
      if (flatRegistros.length === 0) continue;

      const validRegistros = flatRegistros.filter((reg: any) => {
        const meta = skeleton?.tomasMeta?.[reg.idToma];
        if (!meta) return true;
        
        if (filterService && meta.service) {
          if (!meta.service.includes(filterService)) return false;
        }
        
        if (meta.date) {
          if (filterStart && meta.date < filterStart) return false;
          if (filterEnd && meta.date > filterEnd) return false;
        }
        return true;
      });

      if (validRegistros.length === 0) continue;

      if (uniqueMust.length > 0) {
        const hasColocated = validRegistros.some(
          (reg: any) => reg.mustTerms instanceof Set && uniqueMust.every(term => reg.mustTerms.has(term))
        );
        if (!hasColocated) continue;
      }

      const uniqueTomasCount = new Set(validRegistros.map((r: any) => r.idToma)).size;
      const normalizedScore = pm.totalScore / Math.log(validRegistros.length + 2);

      results.push({
        nhc: pm.nhc,
        patient: skeleton || { nhc: pm.nhc, demographics: {}, tomas: {}, services: [], dates: { start: Infinity, end: -Infinity } },
        totalScore: normalizedScore,
        matchingTomasCount: uniqueTomasCount,
        bestMatchUrl: { idToma: (validRegistros[0] as any).idToma, ordenToma: (validRegistros[0] as any).ordenToma },
        matchedRegistros: validRegistros as any
      });
    }

    return this.applyFiltersAndSort(results);
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
    return this.applyFiltersAndSort(results);
  }

  private applyFiltersAndSort(results: SearchResult[]): SearchResult[] {
    return results.sort((a, b) => b.totalScore - a.totalScore);
  }
}

export const queryEngine = new QueryEngine();
