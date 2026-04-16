export interface ClinicalRecord {
  [key: string]: string;
}

export interface EpisodeVersion {
  ordenToma: number;
  data: ClinicalRecord;
}

export interface Episode {
  idToma: string;
  versions: EpisodeVersion[];
  // Helper to get the latest version
  latest: EpisodeVersion;
}

export interface Patient {
  nhc: string;
  episodes: Record<string, Episode>;
  // Demographics from the latest record
  demographics: ClinicalRecord;
}

export interface HCEData {
  patients: Record<string, Patient>;
}

export function groupData(records: ClinicalRecord[]): HCEData {
  const patients: Record<string, Patient> = {};

  for (const record of records) {
    // Find keys for grouping, handling possible variations in case/spacing
    const nhcKey = Object.keys(record).find(k => k.toUpperCase().includes('N.H.C')) || 'N.H.C';
    const idTomaKey = Object.keys(record).find(k => k.toUpperCase().includes('ID_TOMA')) || 'ID_Toma';
    const ordenTomaKey = Object.keys(record).find(k => k.toUpperCase().includes('ORDEN_TOMA')) || 'Orden_Toma';

    const nhc = record[nhcKey];
    const idToma = record[idTomaKey];
    const ordenTomaStr = record[ordenTomaKey];
    
    if (!nhc) continue; // Skip invalid records

    const ordenToma = parseInt(ordenTomaStr, 10) || 0;

    if (!patients[nhc]) {
      patients[nhc] = {
        nhc,
        episodes: {},
        demographics: record
      };
    }

    if (!patients[nhc].episodes[idToma]) {
      patients[nhc].episodes[idToma] = {
        idToma,
        versions: [],
        latest: { ordenToma: -1, data: {} }
      };
    }

    const episode = patients[nhc].episodes[idToma];
    const version = { ordenToma, data: record };
    episode.versions.push(version);

    if (ordenToma > episode.latest.ordenToma) {
      episode.latest = version;
      // Update demographics to the latest available
      patients[nhc].demographics = record;
    }
  }

  // Sort versions descending
  for (const nhc in patients) {
    for (const idToma in patients[nhc].episodes) {
      patients[nhc].episodes[idToma].versions.sort((a, b) => b.ordenToma - a.ordenToma);
    }
  }

  return { patients };
}

export const storage = {
  saveData: (data: HCEData) => {
    try {
      localStorage.setItem('hce_data', JSON.stringify(data));
    } catch (e) {
      console.error("Error saving to localStorage", e);
    }
  },
  loadData: (): HCEData | null => {
    try {
      const data = localStorage.getItem('hce_data');
      return data ? JSON.stringify(data) ? JSON.parse(data) : null : null;
    } catch (e) {
      console.error("Error loading from localStorage", e);
      return null;
    }
  },
  clearData: () => {
    localStorage.removeItem('hce_data');
    localStorage.removeItem('hce_index');
  }
};
