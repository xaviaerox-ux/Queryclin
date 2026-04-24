const fs = require('fs');
const path = require('path');

const NHC_COUNT = 5000;
const TOMAS_PER_NHC = 2;
const FILE_NAME = 'QUICK_TEST_DATA.csv';

const cities = ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza', 'Malaga'];
const services = ['Urgencias', 'Medicina Interna', 'Cardiologia', 'Neumologia', 'Digestivo'];
const diagnoses = [
  'Fascitis necrotizante con afectación de tejidos blandos.',
  'Neumonía bacteriana adquirida en la comunidad.',
  'Insuficiencia cardíaca congestiva grado II.',
  'Diabetes mellitus tipo 2 descompensada.',
  'Cuadro febril de origen desconocido.'
];

const headers = 'NHC_ID|ID_TOMA|ORDEN_TOMA|FECHA_TOMA|EC_NOMBRE_PACIENTE|EC_SEXO|EDAD|CIUDAD_PACIENTE|POSTAL|SERVICIO|ANAMNESIS|EXPLORACION|DIAGNOSTICO|TRATAMIENTO|EVOLUCION\n';

const stream = fs.createWriteStream(path.join(process.cwd(), FILE_NAME));
stream.write(headers);

console.log(`Generando ${NHC_COUNT * TOMAS_PER_NHC} registros en ${FILE_NAME}...`);

for (let i = 1; i <= NHC_COUNT; i++) {
  const nhc = `NHC-${String(i).padStart(6, '0')}`;
  const name = `PACIENTE PRUEBA ${i}`;
  const sex = i % 2 === 0 ? 'H' : 'M';
  const age = 20 + (i % 60);
  const city = cities[i % cities.length];
  const cp = 28000 + (i % 100);

  for (let t = 1; t <= TOMAS_PER_NHC; t++) {
    const tomaId = `TOMA-${i}-${t}`;
    const date = `2024-04-${String((i % 28) + 1).padStart(2, '0')}`;
    const service = services[(i + t) % services.length];
    const diag = diagnoses[(i + t) % diagnoses.length];

    const row = [
      nhc, tomaId, t, date, name, sex, age, city, cp, service,
      "Paciente refiere dolor leve y seguimiento rutinario.",
      "Exploracion fisica dentro de la normalidad.",
      diag,
      "Mantener medicacion habitual y control en 6 meses.",
      "Evolucion favorable sin incidencias."
    ].join('|') + '\n';
    
    stream.write(row);
  }
}

stream.end();
console.log('¡Archivo generado con éxito!');
