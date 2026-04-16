import { HCEData, Patient, EpisodeVersion } from './dataStore';

export interface SearchResult {
  nhc: string;
  idToma: string;
  ordenToma: number;
  score: number;
  snippet?: string;
  record: EpisodeVersion;
}

export class SearchEngine {
  private index: Record<string, { nhc: string, idToma: string, ordenToma: number, count: number }[]> = {};
  private documentCount = 0;
  private data: HCEData | null = null;

  buildIndex(data: HCEData) {
    this.data = data;
    this.index = {};
    this.documentCount = 0;

    for (const nhc in data.patients) {
      const patient = data.patients[nhc];
      for (const idToma in patient.episodes) {
        const episode = patient.episodes[idToma];
        for (const version of episode.versions) {
          this.documentCount++;
          const tokens = this.tokenizeRecord(version.data);
          
          const termCounts: Record<string, number> = {};
          for (const token of tokens) {
            termCounts[token] = (termCounts[token] || 0) + 1;
          }

          for (const term in termCounts) {
            if (!this.index[term]) {
              this.index[term] = [];
            }
            this.index[term].push({
              nhc,
              idToma,
              ordenToma: version.ordenToma,
              count: termCounts[term]
            });
          }
        }
      }
    }
    
    try {
      localStorage.setItem('hce_index', JSON.stringify({ index: this.index, documentCount: this.documentCount }));
    } catch (e) {
      console.error("Could not save index to localStorage", e);
    }
  }

  loadIndex(data: HCEData) {
    this.data = data;
    try {
      const saved = localStorage.getItem('hce_index');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.index = parsed.index;
        this.documentCount = parsed.documentCount;
      } else {
        this.buildIndex(data);
      }
    } catch (e) {
      this.buildIndex(data);
    }
  }

  private tokenize(text: string): string[] {
    return text.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 1);
  }

  private tokenizeRecord(record: Record<string, string>): string[] {
    const tokens: string[] = [];
    for (const [key, value] of Object.entries(record)) {
      tokens.push(...this.tokenize(key));
      tokens.push(...this.tokenize(value));
    }
    return tokens;
  }

  search(query: string, filters?: { dateRange?: [string, string], service?: string }): SearchResult[] {
    if (!this.data) return [];
    
    // Simple boolean parsing: split by space, check for AND, OR, NOT
    // For simplicity in this local engine, we'll treat terms without operators as AND
    // and handle -term as NOT.
    const rawTerms = query.split(/\s+/).filter(t => t.length > 0);
    const must: string[] = [];
    const mustNot: string[] = [];
    const should: string[] = [];

    for (let i = 0; i < rawTerms.length; i++) {
      let term = rawTerms[i];
      if (term.toUpperCase() === 'AND') continue;
      if (term.toUpperCase() === 'OR') {
        // Next term is should
        if (i + 1 < rawTerms.length) {
          should.push(...this.tokenize(rawTerms[i+1]));
          i++;
        }
        continue;
      }
      if (term.toUpperCase() === 'NOT' || term.startsWith('-')) {
        const t = term.startsWith('-') ? term.substring(1) : rawTerms[++i];
        if (t) mustNot.push(...this.tokenize(t));
        continue;
      }
      must.push(...this.tokenize(term));
    }

    if (must.length === 0 && should.length === 0) {
      // Return all if no query but maybe filters
      return this.getAllRecords(filters);
    }

    const scores: Record<string, SearchResult> = {};

    const processTerms = (terms: string[], isMust: boolean, isShould: boolean) => {
      for (const term of terms) {
        // Find matching terms in index (partial match)
        const matchingIndexTerms = Object.keys(this.index).filter(t => t.includes(term));
        
        for (const indexTerm of matchingIndexTerms) {
          const docs = this.index[indexTerm];
          const idf = Math.log(this.documentCount / (docs.length || 1));
          
          for (const doc of docs) {
            const docId = `${doc.nhc}_${doc.idToma}_${doc.ordenToma}`;
            
            // Exact match gets higher weight
            const tf = doc.count;
            const weight = indexTerm === term ? 2.0 : 1.0;
            const score = tf * idf * weight;

            if (!scores[docId]) {
              const patient = this.data!.patients[doc.nhc];
              const episode = patient.episodes[doc.idToma];
              const version = episode.versions.find(v => v.ordenToma === doc.ordenToma)!;
              
              scores[docId] = {
                nhc: doc.nhc,
                idToma: doc.idToma,
                ordenToma: doc.ordenToma,
                score: 0,
                record: version
              };
            }
            scores[docId].score += score;
          }
        }
      }
    };

    processTerms(must, true, false);
    processTerms(should, false, true);

    // Apply NOT
    for (const term of mustNot) {
      const matchingIndexTerms = Object.keys(this.index).filter(t => t.includes(term));
      for (const indexTerm of matchingIndexTerms) {
        const docs = this.index[indexTerm];
        for (const doc of docs) {
          const docId = `${doc.nhc}_${doc.idToma}_${doc.ordenToma}`;
          if (scores[docId]) {
            delete scores[docId];
          }
        }
      }
    }

    // Filter results
    let results = Object.values(scores);
    
    // If we had MUST terms, ensure documents contain ALL must terms (simplified check)
    if (must.length > 0) {
       results = results.filter(res => {
         const tokens = this.tokenizeRecord(res.record.data);
         return must.every(m => tokens.some(t => t.includes(m)));
       });
    }

    return this.applyFiltersAndSort(results, filters);
  }

  private getAllRecords(filters?: { dateRange?: [string, string], service?: string }): SearchResult[] {
    const results: SearchResult[] = [];
    if (!this.data) return results;

    for (const nhc in this.data.patients) {
      const patient = this.data.patients[nhc];
      for (const idToma in patient.episodes) {
        const episode = patient.episodes[idToma];
        for (const version of episode.versions) {
          results.push({
            nhc,
            idToma,
            ordenToma: version.ordenToma,
            score: 1,
            record: version
          });
        }
      }
    }
    return this.applyFiltersAndSort(results, filters);
  }

  private applyFiltersAndSort(results: SearchResult[], filters?: { dateRange?: [string, string], service?: string }): SearchResult[] {
    let filtered = results;
    
    if (filters) {
      if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
        const start = new Date(filters.dateRange[0]).getTime();
        const end = new Date(filters.dateRange[1]).getTime();
        filtered = filtered.filter(r => {
          const dateKey = Object.keys(r.record.data).find(k => k.toUpperCase().includes('FECHA_TOMA'));
          if (!dateKey || !r.record.data[dateKey]) return false;
          // Try to parse date. Assuming YYYY-MM-DD or DD/MM/YYYY
          let dateStr = r.record.data[dateKey];
          if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            if (parts.length === 3) dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
          }
          const time = new Date(dateStr).getTime();
          return time >= start && time <= end;
        });
      }

      if (filters.service) {
        const srv = filters.service.toLowerCase();
        filtered = filtered.filter(r => {
          const srvKey = Object.keys(r.record.data).find(k => k.toUpperCase().includes('SERVICIO') || k.toUpperCase().includes('PROCESO'));
          if (!srvKey || !r.record.data[srvKey]) return false;
          return r.record.data[srvKey].toLowerCase().includes(srv);
        });
      }
    }

    // Sort by score DESC, then ordenToma DESC
    return filtered.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.ordenToma - a.ordenToma;
    });
  }
}

export const searchEngine = new SearchEngine();
