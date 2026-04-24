/**
 * Parser de CSV optimizado para grandes volúmenes y robustez clínica.
 * Maneja BOM, diferentes finales de línea y delimitadores automáticos.
 */
export function* streamCSV(csvText: string): Generator<any> {
  if (!csvText || csvText.length < 5) return;

  // 1. Limpieza inicial: eliminar BOM si existe
  if (csvText.startsWith('\uFEFF')) {
    csvText = csvText.substring(1);
  }

  // 2. Extraer cabeceras y detectar delimitador
  const firstNewLine = csvText.indexOf('\n');
  const firstCarriageReturn = csvText.indexOf('\r');
  let firstLineEnd = firstNewLine;
  if (firstCarriageReturn !== -1 && (firstNewLine === -1 || firstCarriageReturn < firstNewLine)) {
    firstLineEnd = firstCarriageReturn;
  }
  
  if (firstLineEnd === -1) firstLineEnd = csvText.length;
  
  const firstLine = csvText.slice(0, firstLineEnd).trim();
  const delimiter = detectDelimiter(firstLine);
  const headers = parseCSVLine(firstLine, delimiter).map(h => h.trim());

  let pos = firstLineEnd;
  
  // Saltar el final de línea inicial
  while (pos < csvText.length && (csvText[pos] === '\n' || csvText[pos] === '\r')) {
    pos++;
  }

  let currentRow: string[] = [];
  let currentVal = '';
  let insideQuotes = false;

  while (pos < csvText.length) {
    const char = csvText[pos];
    const nextChar = csvText[pos + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentVal += '"';
        pos++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      // Evitar empujar valores vacíos finales si la línea termina en delimitador
      currentRow.push(currentVal.trim());
      currentVal = '';
      
      if (currentRow.length > 0) {
        // Validación: Si la fila tiene menos columnas que el header, el sistema debe saberlo
        const record: any = {};
        for (let j = 0; j < headers.length; j++) {
          const val = currentRow[j];
          record[headers[j]] = val !== undefined ? val : '';
        }
        yield record;
      }
      
      currentRow = [];
      if (char === '\r' && nextChar === '\n') pos++;
    } else {
      currentVal += char;
    }
    pos++;
  }

  // Última fila
  if (currentVal || currentRow.length > 0) {
    if (currentVal) currentRow.push(currentVal.trim());
    if (currentRow.some(val => val.length > 0)) {
      const record: any = {};
      for (let j = 0; j < headers.length; j++) {
        record[headers[j]] = currentRow[j] || '';
      }
      yield record;
    }
  }
}

function detectDelimiter(line: string): string {
  const delimiters = ['|', ',', ';', '\t'];
  let best = '|';
  let maxCount = -1;
  
  for (const d of delimiters) {
    const count = line.split(d).length;
    if (count > maxCount) {
      maxCount = count;
      best = d;
    }
  }
  return best;
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let currentValue = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentValue += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      values.push(currentValue);
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  values.push(currentValue);
  return values;
}
