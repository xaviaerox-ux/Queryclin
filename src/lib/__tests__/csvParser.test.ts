import { describe, it, expect } from 'vitest';
import { streamCSV } from '../csvParser';

// Helper para convertir el generador a array (igual que haría el Worker)
function parseCSV(csv: string): any[] {
  return Array.from(streamCSV(csv));
}

describe('csvParser', () => {
  it('debe parsear correctamente un CSV con delimitador pipeline (|)', () => {
    const csv = 'NHC_ID|NOMBRE|EDAD\n123|JUAN|45\n456|MARIA|30';
    const result = parseCSV(csv);
    
    expect(result.length).toBe(2);
    expect(result[0].NHC_ID).toBe('123');
    expect(result[0].NOMBRE).toBe('JUAN');
    expect(result[1].NOMBRE).toBe('MARIA');
  });

  it('debe manejar campos con comillas dobles y delimitadores internos', () => {
    const csv = 'NHC_ID|DIAGNOSTICO\n123|"PACIENTE CON | DOLOR"\n456|NORMAL';
    const result = parseCSV(csv);
    
    expect(result.length).toBe(2);
    expect(result[0].DIAGNOSTICO).toBe('PACIENTE CON | DOLOR');
  });

  it('debe ignorar líneas vacías', () => {
    const csv = 'NHC_ID|NOMBRE\n123|JUAN\n\n456|MARIA\n';
    const result = parseCSV(csv);
    
    expect(result.length).toBe(2);
  });
});
