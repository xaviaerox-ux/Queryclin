import { HCEData, Patient } from '../core/types';
import { db } from '../storage/indexedDB';
import { parseClinicalDate } from '../utils/dateParser';
import { globalTokenizer } from './Tokenizer';

export class IndexerService {
  private documentCount = 0;
  /** Acumulador para BM25: suma de todos los tokens indexados para calcular la longitud media. */
  private totalTokens = 0;
  private tempIndex: Record<string, any[]> = Object.create(null);
  private tempGlobalTermCounts: Record<string, number> = Object.create(null);
  private tempSkeletons: Record<string, any> = Object.create(null);
  private tempSkeletonFragmentCount = 0;
  private termFragmentCounts: Record<string, number> = Object.create(null);
  private readonly FRAGMENT_SIZE_LIMIT = 2000;
  public dictionary: string[] = [];

  public startIndexing() {
    this.documentCount = 0;
    this.totalTokens = 0;
    this.tempIndex = Object.create(null);
    this.tempGlobalTermCounts = Object.create(null);
    this.tempSkeletons = Object.create(null);
    this.tempSkeletonFragmentCount = 0;
    this.termFragmentCounts = Object.create(null);
    console.log('[IndexerService] Preparado para indexación incremental.');
  }

  public async indexPatient(nhc: string, patient: Patient, isSampling: boolean) {
    const skeleton: any = { 
      nhc: patient.nhc, 
      demographics: patient.demographics, 
      services: new Set<string>(),
      dates: { start: Infinity, end: -Infinity },
      tomasMeta: {}
    };

    for (const idToma in patient.tomas) {
      for (const registro of patient.tomas[idToma].registros) {
        this.documentCount++;
        
        // Fecha
        let time: number | null = null;
        const dateKey = Object.keys(registro.data).find(k => k.toUpperCase().includes('FECHA') || k.toUpperCase().includes('DATE'));
        if (dateKey && registro.data[dateKey]) {
           time = parseClinicalDate(registro.data[dateKey]);
           if (time) {
             skeleton.dates.start = Math.min(skeleton.dates.start, time);
             skeleton.dates.end = Math.max(skeleton.dates.end, time);
           }
        }
        
        // Servicio
        let srv = '';
        const srvKey = Object.keys(registro.data).find(k => k.toUpperCase().includes('SERVICIO') || k.toUpperCase().includes('PROCESO'));
        if (srvKey && registro.data[srvKey]) {
          srv = String(registro.data[srvKey]).toLowerCase();
          skeleton.services.add(srv);
        }

        skeleton.tomasMeta[idToma] = { date: time, service: srv };

        const tokens = globalTokenizer.tokenizeRecord(registro.data);
        const docLen = tokens.length; // BM25: longitud de este documento en tokens
        this.totalTokens += docLen;
        const termCounts: Record<string, number> = Object.create(null);
        for (const token of tokens) termCounts[token] = (termCounts[token] || 0) + 1;

        const nhcTokens = globalTokenizer.tokenize(nhc);
        const nhcCompact = nhc.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        for (const nt of nhcTokens) termCounts[nt] = (termCounts[nt] || 0) + 5; 
        if (nhcCompact.length > 2) termCounts[nhcCompact] = (termCounts[nhcCompact] || 0) + 50;

        for (const term in termCounts) {
          if (globalTokenizer.isIndexStopword(term)) continue;
          if (term.length <= 2 && /^\d+$/.test(term)) continue;
          if (term.length === 1) continue;

          if (!this.tempIndex[term]) this.tempIndex[term] = [];
          // BM25: almacenamos docLen junto al count para el scoring en QueryEngine
          this.tempIndex[term].push({ nhc, idToma, ordenToma: registro.ordenToma, count: termCounts[term], docLen });
          
          if (isSampling) {
            this.tempGlobalTermCounts[term] = (this.tempGlobalTermCounts[term] || 0) + termCounts[term];
          }
        }
      }
    }
    skeleton.services = Array.from(skeleton.services);
    this.tempSkeletons[nhc] = skeleton;

    if (Object.keys(this.tempSkeletons).length >= 1000) {
      await this.flushSkeletons();
    }
  }

  public async flushIndex() {
    if (Object.keys(this.tempIndex).length === 0) return;
    await this.flushIndexPart(this.tempIndex);
    this.tempIndex = Object.create(null); 
  }

  public async flushIndexIfNeeded(threshold = 3000) {
    if (Object.keys(this.tempIndex).length >= threshold) {
      await this.flushIndexPart(this.tempIndex);
      this.tempIndex = Object.create(null);
    }
  }

  public async flushSkeletons() {
    const keys = Object.keys(this.tempSkeletons);
    if (keys.length === 0) return;

    const fragKey = `skeletons_frag_${this.tempSkeletonFragmentCount}`;
    await db.saveBatch(db.stores.metadata, { [fragKey]: this.tempSkeletons });
    this.tempSkeletons = Object.create(null);
    this.tempSkeletonFragmentCount++;
  }

  public async finalizeIndexing() {
    await this.flushIndex();
    await this.flushSkeletons();

    await db.saveBatch(db.stores.metadata, { 
      'skeleton_fragments': this.tempSkeletonFragmentCount, 
      'term_fragment_counts': this.termFragmentCounts,
      'document_count': this.documentCount,
      // BM25: longitud media de documento en tokens. Guardado para su uso en QueryEngine.
      'avg_doc_length': this.documentCount > 0 ? Math.round(this.totalTokens / this.documentCount) : 150,
      'last_indexed': new Date().toISOString()
    });

    console.log(`[IndexerService] Generando diccionario clínico final...`);
    this.dictionary = Object.entries(this.tempGlobalTermCounts)
      .filter(([term]) => {
        if (term.length < 3) return false;
        if (globalTokenizer.isIndexStopword(term)) return false;
        if (/^\d+$/.test(term)) return false;
        return true;
      })
      .sort((a, b) => b[1] - a[1])
      .slice(0, 1000)
      .map(([term]) => term);

    await db.saveBatch(db.stores.metadata, { clinical_dictionary: this.dictionary });
    
    this.tempIndex = Object.create(null);
    this.tempGlobalTermCounts = Object.create(null);
    this.tempSkeletons = Object.create(null);
    console.log(`[IndexerService] Indexación completada. Diccionario: ${this.dictionary.length} términos.`);
  }

  private async flushIndexPart(partialIndex: Record<string, any[]>) {
    const terms = Object.keys(partialIndex);
    if (terms.length === 0) return;

    const lastFragmentKeys = terms.map(term => {
      const count = this.termFragmentCounts[term] || 0;
      const index = Math.max(0, count - 1);
      return `${term}:${index}`;
    });

    const existingFragments = await db.getBatch(db.stores.search_index, lastFragmentKeys);
    const batchToSave: Record<string, any[]> = {};
    
    for (const term of terms) {
      const incoming = partialIndex[term];
      const count = this.termFragmentCounts[term] || 0;
      const lastIndex = Math.max(0, count - 1);
      const lastKey = `${term}:${lastIndex}`;
      
      let currentList = existingFragments[lastKey] || [];
      
      if (count > 0 && currentList.length < this.FRAGMENT_SIZE_LIMIT) {
        currentList.push(...incoming);
        if (currentList.length > this.FRAGMENT_SIZE_LIMIT) {
          const remaining = currentList.splice(this.FRAGMENT_SIZE_LIMIT);
          batchToSave[lastKey] = currentList;
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
    await db.saveBatch(db.stores.search_index, batchToSave);
  }
}

export const indexerService = new IndexerService();
