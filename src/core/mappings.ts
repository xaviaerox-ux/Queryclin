export interface FormMapping {
  id: string;
  name: string;
  keys: {
    nhc: string;
    idToma: string;
    ordenToma: string;
    fechaToma: string;
  };
  demographics: Record<string, string>;
  visualCategories: Record<string, string[]>; // Category name -> array of exact column names
  headerAliases?: Record<string, string[]>; // Canonical Header -> [Source Aliases]
}

export const FORMS: FormMapping[] = [
  {
    id: 'hce_alg',
    name: 'HCE-ALG',
    keys: {
      nhc: 'N.H.C',
      idToma: 'Id_Toma',
      ordenToma: 'Orden_Toma',
      fechaToma: 'EC_Fecha_Toma',
    },
    headerAliases: {
      'N.H.C': ['N.H.C', 'NHC', 'N.H.C.'],
      'Cipa': ['Cipa', 'CIPA'],
      'Fecha de Nacimiento': ['Fecha de Nacimiento', 'F_Nacimiento'],
      'EC_Sexo': ['EC_Sexo', 'Sexo'],
      'DEMOG-Código postal': ['DEMOG-Código postal', 'CP', 'C.P.'],
      'EC_Fecha_Toma': ['EC_Fecha_Toma', 'Fecha Toma'],
      'EC_Proceso': ['EC_Proceso', 'Proceso'],
      'EC_Proceso2': ['EC_Proceso2', 'Proceso 2'],
      'Ámbito': ['Ámbito', 'Ambito']
    },
    demographics: {
      nhc: 'N.H.C',
      cipa: 'Cipa',
      sexo: 'EC_Sexo',
      fechaNacimiento: 'Fecha de Nacimiento',
      cp: 'DEMOG-Código postal',
      edad: 'Edad',
      ambito: 'Ámbito',
      ciudad: 'EC_Ciudad_Paciente',
      estadoCivil: 'EC_Estado_Civil',
      unidadEnfermeria: 'Unidad de Enfermería'
    },
    visualCategories: {
      'CABECERA': [
        'N.H.C', 'Cipa', 'EC_Sexo', 'Fecha de Nacimiento', 'DEMOG-Código postal', 
        'EC_Ciudad_Paciente', 'EC_Estado_Civil', 'Unidad de Enfermería'
      ],
      'CONTROL': [
        'Id_Toma', 'Orden_Toma', 'EC_Fecha_Toma', 'EC_Proceso', 'EC_Proceso2', 
        'EC_Usuario_Creador', 'Ámbito', 'Contador'
      ],
      'ANTECEDENTES': [
        'Antecedentes de alergia:', 'Antecedentes Familiares Generales', 
        'Antecedentes Personales Generales', 'Antecedentes Quirúrgicos Generales', 
        'Motivo de la consulta', 'Tratamiento previo'
      ],
      'ANAMNESIS Y EXPLORACIÓN': [
        'Enfermedad actual', 'Exploración física', 'Observaciones', 'Peso:', 'Talla:', 
        'IMC:', 'Valoración IMC', 'Superficie Corporal', 'T', 'Edad', 
        'Grupo sanguineo y RH', 'Transfusiones'
      ],
      'DIAGNÓSTICO Y TRATAMIENTO': [
        'Diagnóstico', 'Tratamiento', 'Recomendaciones', 'Proxima revisión', 'Recetas prescritas'
      ],
      'RESULTADOS PRUEBAS': [
        'Resultado analítica', 'Resultado anatomía patológica', 'Resultado radiodiagnóstico', 
        'Otras pruebas realizadas', 'Pruebas solicitadas'
      ],
      'PROCESO HOSP/CEX': [
        'Juicio Diagnóstico Activo', 'Juicio Diagnóstico Secundario', 'Motivo de Alta', 
        'Motivo de ingreso', 'Resumen de evolución', 'Revisiones posteriores', 
        'Tipo de Ingreso:', 'Tratamiento recomendado', 'Evolución (CEX)'
      ]
    }
  },
  {
    id: 'hce_mir',
    name: 'HCE-MIR',
    keys: {
      nhc: 'NHC',
      idToma: 'Id_Toma',
      ordenToma: 'Orden_Toma',
      fechaToma: 'EC_Fecha_Toma',
    },
    demographics: {
      nhc: 'NHC',
      sexo: 'EC_Sexo',
      edad: 'Edad',
    },
    visualCategories: {
      'DATOS GENERALES': ['NHC', 'EC_Sexo', 'Edad', 'EC_Fecha_Toma'],
      'EVOLUCIÓN': ['Observaciones', 'Diagnóstico', 'Tratamiento']
    }
  },
  {
    id: 'hce_obs',
    name: 'HCE-OBS',
    keys: {
      nhc: 'NHC',
      idToma: 'Id_Toma',
      ordenToma: 'Orden_Toma',
      fechaToma: 'EC_Fecha_Toma',
    },
    demographics: {
      sexo: 'EC_Sexo',
      fechaNacimiento: 'Fecha de Nacimiento',
      edad: 'Edad Toma',
      cp: 'DEMOG-Código postal',
      ciudad: 'EC_Ciudad_Paciente',
      proceso: 'EC_Proceso',
    },
    visualCategories: {
      'Alergias y Motivo de consulta': [
        'Reacciones Adversas a fármacos', 'Motivo de consulta:', 'Motivo de ingreso:', 'Finalidad de la toma:'
      ],
      'Antecedentes': [
        'Antecedentes Familiares Generales', 'Antecedentes Personales Generales',
        'Antecedentes Quirúrgicos Generales', 'Años desde que dejo de fumar', 'Años desde que dejó de fumar', 'Años fumando',
        'Alcohol durante el embarazo?', 'Cigarrillos al dia', 'Cigarrillos al día',
        'Fumadora durante el embarazo?', 'Hábito Enólico', 'Hábito Tabáquico',
        'Hábitos tóxicos', 'Habitos tóxicos gestación', 'Paquetes año',
        'Procesos Ginecológicos Anteriores:'
      ],
      'Anamnesis y exploraciones': [
        'Abortos:', 'Actitud', 'Actividad', 'Altura Uterina', 'Anamnesis', 'Anexos:',
        'Aumento de peso desde el comienzo del embarazo', 'Bishop:', 'Borramiento:',
        'Cesáreas:', 'Consistencia:', 'Cuello', 'Datos prenatales a valorar por pediatra',
        'Dilatación:', 'Douglas:', 'Días de gestación', 'Ectópicos:',
        'Estado de la bolsa al ingreso', 'FPP', 'FPP (corregida por Eco)', 'FUR',
        'Fecha - Hora bolsa rota', 'Frecuencia  de contracciones', 'Fórmula Menstrual',
        'Fórmula Obstétrica', 'Gemelares:', 'Gestaciones:', 'Gestación Actual',
        'Menarquia', 'Menograma Tipo Actual$Amenorrea primaria', 'Menograma Tipo Actual$Amenorrea secundaria',
        'Menograma Tipo Actual$Ataxia menstrual / Baches amenorreicos', 'Menograma Tipo Actual$Braquimenorrea',
        'Menograma Tipo Actual$Dolicomenorrea Postmenstrual', 'Menograma Tipo Actual$Dolicomenorrea Premenstrual',
        'Menograma Tipo Actual$Eumenorrea', 'Menograma Tipo Actual$Hiperdolicomenorrea',
        'Menograma Tipo Actual$Hipermenorrea', 'Menograma Tipo Actual$Hipomenorrea',
        'Menograma Tipo Actual$Metrorragia', 'Menograma Tipo Actual$Opsomenorrea',
        'Menograma Tipo Actual$Polimenorrea', 'Partos:', 'Prematuros:', 'Presentación',
        'Semanas de gestación', 'Situación', 'Situación Basal (Otros)', 'Situación basal', 'Utero:',
        'FC', 'FCF$(Variables)', 'FCF$Bradicarda basal grave', 'FCF$Bradicardia basal leve',
        'FCF$Bradicardia basal moderada', 'FCF$Deceleraciones tipo I', 'FCF$Deceleraciones tipo II',
        'FCF$Deceleraciones tipo III (Variables)', 'FCF$Deceleración prolongada (calderon)',
        'FCF$I (Variables)', 'FCF$Patrón no reactivo', 'FCF$Patrón reactivo',
        'FCF$Ritmo Comprimido', 'FCF$Ritmo Saltatorio', 'FCF$Ritmo Silente',
        'FCF$Taquicardia grave', 'FCF$Taquicardia leve', 'FCF$Taquicardia moderada',
        'Movimientos Fetales', 'Vitalidad (F.C. F.)', 'Perfil Biofísico',
        'Plano presentación:', 'Posición', 'Posición:', 'Exploración general:',
        'Edad', 'Talla:', 'Peso 1ª Visita', 'Peso:', 'IMC:', 'Intensidad Dinámica',
        'Tipo de Dinámica', 'Tipo de Rotura de bolsa'
      ],
      'Exploraciones Complementarias solicitadas': [
        'Pruebas solicitadas', 'Otras Pruebas realizadas'
      ],
      'Diagnostico y TTO': [
        'Diagnóstico:', 'Juicio Diagnóstico Activo', 'Juicio Diagnóstico Secundario', 
        'Tratamiento crónico', 'Tratamiento:', 'Recomendaciones:', 'Resumen de evolución Paciente',
        'Especificar', 'Observaciones', 'Observaciones:', 'Procedimientos:', 'Otras',
        'Detalles Dislipemia', 'Diabetes Gestacional', 'Diabetes Mellitus', 'Dislipemia',
        'Edemas', 'Grado NYHA', 'HTA (Hipertensión Arterial)', 'Hemorroides',
        'Mutilación de genitales', 'S. Circulatorio Periférico', 'Tipo de HTA',
        'Motivos Transfusiones', 'Transfusiones', 'Valoración del Riesgo'
      ],
      'Resultado y pruebas': [
        '%INR', 'AGA Vaginal', 'Anormales', 'Bilirrubina Ind.', 'Bilirrubina Total',
        'Cociente albumina  creatinina en muestra de orina aislada', 'Curva de Glucemia',
        'Fe', 'Ferritina', 'Fibrinógeno', 'Fosfatasa alcalina', 'GOT', 'GTP', 'Gamma GT',
        'Germen', 'Glucemia Basal', 'Grupo Sanguíneo:', 'Grupo y RH', 'Grupo y RH:',
        'H', 'HB Glicosilada', 'Hb', 'Hbs  Ag', 'Htº', 'Leucocitos', 'Microalbuminuria',
        'Nº de colonias, 10 elevado a', 'Otras Analíticas',
        'PAD', 'PAS', 'PTTA', 'Plaquetas', 'Prueba Oxitocina',
        'RPR', 'Riesgo por Screening 2º Trimestre:', 'Riesgo por Screening Combinado:',
        'Rubeola', 'SCREENINIG ANEUPLODIAS', 'Saturación de transferrina', 'Sedimento',
        'Sensibilidad Antibióticos', 'T', 'T. Protrombinas', 'TPHA', 'Test de Coombs Indirecto',
        'Test de O,Sullivan', 'Toxoplasmosis', 'Transferrina', 'Título Test de Coombs',
        'Urocultivo', 'VCM', 'VHC', 'VIH', 'Á. Úrico', 'Resumen Analítica',
        'Perfil glucémico$Hiperglucemias leves', 'Perfil glucémico$Hiperglucemias moderada',
        'Perfil glucémico$Hiperglucemias severa', 'Perfil glucémico$Hipoglucemias',
        'Perfil glucémico$Normal', 'Perfil glucémico$Patológico'
      ],
      'Paciente hospitalizado': [
        'Tipo de Ingreso:', 'Motivo de Alta', 'Motivo de Alta (CEX):'
      ]
    }
  }
];
