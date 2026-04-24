const fs = require('fs');
const path = require('path');

const headers = [
  'N.H.C',
  'Nombre',
  'EC_Sexo',
  'Edad',
  'EC_Ciudad_Paciente',
  'DEMOG-Código postal',
  'EC_Fecha_Toma',
  'ID_Toma',
  'Orden_Toma',
  'EC_Proceso',
  'Motivo_Consulta',
  'Antecedentes',
  'Enfermedad_Actual',
  'Exploracion_Fisica',
  'Juicio_Clinico',
  'Tratamiento',
  'Resultados_Lab'
];

const delimiter = '|';
const rows = [headers.join(delimiter)];

const patients = [
  { nhc: 'NHC-1001', name: 'JUAN PEREZ GARCIA', sex: 'V', age: 52, city: 'MURCIA', cp: '30001' },
  { nhc: 'NHC-1002', name: 'LUCIA MARTIN LOPEZ', sex: 'M', age: 45, city: 'LORCA', cp: '30800' },
  { nhc: 'NHC-1003', name: 'ANTONIO SAURA RUIZ', sex: 'V', age: 68, city: 'CARTAGENA', cp: '30201' },
  { nhc: 'NHC-1004', name: 'MARIA SOLER DIAZ', sex: 'M', age: 31, city: 'MURCIA', cp: '30008' },
  { nhc: 'NHC-1005', name: 'PEDRO GOMEZ SANCHEZ', sex: 'V', age: 74, city: 'LORCA', cp: '30800' }
];

const services = ['URGENCIAS', 'ALERGOLOGIA', 'MEDICINA INTERNA', 'CARDIOLOGIA', 'NEUMOLOGIA'];

// Generar registros variados
for (let i = 0; i < 50; i++) {
  const p = patients[i % patients.length];
  const srv = services[i % services.length];
  const idToma = `T-${1000 + i}`;
  const orden = Math.floor(i / 5);
  const fecha = `2024-0${(i % 9) + 1}-12`;
  
  const content = {
    'Motivo_Consulta': (i + Math.floor(i/3)) % 2 === 0 ? 'Disnea y tos persistente' : 'Control rutinario',
    'Antecedentes': p.nhc === 'NHC-1001' || i % 7 === 0 ? 'ASMA, fumador, HTA' : 'Sin antecedentes de interes',
    'Enfermedad_Actual': (i % 3 === 0) ? 'Presenta cuadro de PNEUMONIA bacteriana con fiebre de 38.5C' : 'Estable sin cambios',
    'Exploracion_Fisica': 'TA 120/80, FC 75 bpm, SatO2 98%, pH 7.35',
    'Juicio_Clinico': (i % 2 === 0) ? 'COVID-19 confirmado por PCR' : 'Gripe estacional',
    'Tratamiento': 'Paracetamol 1g cada 8h, reposo y mucha hidratacion',
    'Resultados_Lab': 'Leucocitos 12000, PCR 45, Glucosa 110'
  };

  const row = [
    p.nhc,
    p.name,
    p.sex,
    p.age,
    p.city,
    p.cp,
    fecha,
    idToma,
    orden,
    srv,
    content['Motivo_Consulta'],
    content['Antecedentes'],
    content['Enfermedad_Actual'],
    content['Exploracion_Fisica'],
    content['Juicio_Clinico'],
    content['Tratamiento'],
    content['Resultados_Lab']
  ];

  rows.push(row.join(delimiter));
}

// Caso especial: Intercalado para NHC-1001
rows.push([
  'NHC-1001', 'JUAN PEREZ GARCIA', 'V', 52, 'MURCIA', '30001',
  '2023-12-01', 'T-OLD-01', 0, 'ALERGOLOGIA',
  'Pruebas cutaneas', 'ASMA conocido', 'Reaccion a polen', 'Normal', 'Rinitis alergica', 'Antihistaminicos', 'IgE elevada'
].join(delimiter));

const outputPath = path.join(__dirname, '..', 'tests', 'data', 'TEST_SUITE_V3.csv');
fs.writeFileSync(outputPath, rows.join('\n'));
console.log(`Dataset de test generado en: ${outputPath}`);
