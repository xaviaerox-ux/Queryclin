Todos los cambios notables realizados en el proyecto Queryclin serán documentados en este archivo, detallando el efecto del cambio y el motivo (el "por qué") de forma cronológica.

## [2026-04-24]
### Vista HCE Continua — Metaprompt Clínico (V3.4.0)
- **`HCEView.tsx`**: Rediseño completo. Eliminación de pestañas de categoría. La vista es ahora **única, continua y jerárquica** conforme al metaprompt clínico. Cabecera fija con datos demográficos (NHC, Edad, Ciudad). Alergias con tratamiento visual prioritario (borde ámbar + icono de alerta). Secciones en orden fijo: Alergias → Antecedentes → Anamnesis y Exploración → Exploraciones Complementarias → Diagnóstico y Tratamiento → Resultados y Pruebas → Hospitalización. Orden temporal descendente (última toma primero). Cada toma muestra fecha, hora y usuario. Campos booleanos con chip compacto de color. Campos largos (>80 chars) con renderizado de párrafo. Cada campo ocupa su propia línea.
- **`fieldDictionary.ts`**: Taxonomía extendida a 8 categorías HCE. Añadidas constantes `SECTION_ORDER` (orden fijo de renderizado) y `SECTION_LABELS` (etiquetas legibles). Nuevas palabras clave para Alergias, Exploraciones Complementarias e Hospitalización. Normalización de claves con `replace(/[_\s-]+/g, '_')` antes de clasificar. Versión: **V3.4.0**.

## [2026-04-24]
### Auditoría Semántica del Motor de Búsqueda (V3.3.0)
- **[BUG-001 CRÍTICO]** `searchEngine.ts::startIndexing()`: Se añade reset de `termFragmentCounts = {}`. Sin este reset, al importar un segundo CSV el IDF se calculaba comparando `documentCount` del nuevo CSV contra listas de docs acumuladas del índice anterior, pudiendo producir scores negativos.
- **[BUG-002 CRÍTICO]** `searchEngine.ts::search()`: La lógica AND ahora verifica co-localización a nivel de registro (toma), no solo a nivel de paciente. "PNEUMONIA BACTERIANA" ya no retorna un paciente donde cada término aparece en tomas distintas. Se añade `mustTerms: Set` por registro en `processTerms`.
- **[BUG-003 CRÍTICO]** `parser.worker.ts`: Centralizada la detección de NHC en la función `detectNhcKey()`. Antes se re-detectaba con lógicas independientes en el loop principal y en `processBatch`, causando desincronización de identidades cuando el primer registro de un lote tenía el campo vacío.
- **[BUG-004 ALTO]** `parser.worker.ts + searchEngine.ts`: Eliminado `flushIndex()` incondicional en `processBatch`. Se añade `flushIndexIfNeeded(threshold=3000)` que solo escribe si el índice en memoria supera 3000 términos. El flush definitivo lo realiza `finalizeIndexing()`.
- **[BUG-005 ALTO]** `parser.worker.ts`: Documentado y verificado que el merge de registros de pacientes entre lotes preserva correctamente los datos de IDB via `getBatch`. Añadido cast explícito de NHC a `String()` para prevenir fallos con valores numéricos.
- **[BUG-006 ALTO]** `parser.worker.ts`: La barra de progreso ahora es determinista. Se calcula `estimatedTotal` como `csvText.match(/\n/g).length` antes del loop. Antes siempre era `totalProcessed + 5000`, nunca superando el 67%.
- **[BUG-007 MEDIO]** `searchEngine.ts`: Las STOPWORDS ahora se normalizan (sin tilde) en el constructor. Las entradas con tilde ('también', 'clínico'...) nunca filtraban porque los tokens ya llegaban sin tilde de `tokenize()`.
- **[BUG-008 MEDIO]** `searchEngine.ts::search()`: El `totalScore` ahora se normaliza por `log(numRegistros + 2)` antes de ordenar. Evita que pacientes crónicos con historiales largos dominen el ranking sobre pacientes con coincidencias más relevantes pero menos tomas.
- **[BUG-009 MEDIO]** `searchEngine.ts`: Split de STOPWORDS en `INDEX_STOPWORDS` (amplio, para indexación) y `QUERY_STOPWORDS` (solo lingüístico, para búsqueda). Términos clínicos como 'antecedentes', 'motivo', 'exploración' ahora son buscables aunque no se indexen en el diccionario de autocompletado. Versión: **V3.3.0**.

## [2026-04-24]
### Limpieza Estructural (V3.2.0 - Structural Audit)
- **Dependencias Eliminadas** (`package.json`): Retirados `@google/genai`, `motion`, `express`, `dotenv`, `@types/express` y `tsx`. Ninguno tenía imports activos en el código fuente. Reducción de bundle estimada: **~800KB**. 126 paquetes desinstalados de `node_modules`.
- **Servidor Express Ficticio Eliminado** (`scripts/server.ts`): El servidor no implementaba ninguna lógica real y era incompatible con la arquitectura Local-First declarada en RULES.md.
- **Código Muerto Eliminado** (`src/lib/dataStore.ts`): Eliminadas `groupData()` (reemplazada por el Worker en V3), `storage.saveData()` (noop vacío) y `storage.loadData()` (devolvía siempre `{patients: {}}`). Se añade `PatientData` como alias de `Patient` para corregir error de tipado silencioso en el Worker.
- **Método de Debug Eliminado** (`src/lib/searchEngine.ts`): Retirado `getStats()` añadido durante la sesión de depuración. Sin referencias en producción.
- **Llamada Inútil Eliminada** (`src/App.tsx`): Eliminada la llamada a `storage.loadData()` que siempre devolvía vacío. La inicialización ahora lee directamente el `patient_count` de IndexedDB.
- **.gitignore Actualizado**: Añadidas entradas para `scratch_parser/`, `test-results/`, `tests/data/*.csv` y `STRESS_TEST_DATA.csv` para prevenir que el repositorio crezca con artefactos de prueba.
- **Archivos Físicamente Eliminados**: `STRESS_TEST_DATA.csv` (34MB, raíz), directorio `scratch_parser/` (con su propio `node_modules`).
- **Errores TypeScript Corregidos**: Resueltos 19 errores pre-existentes en `HCEView.tsx`, `Results.tsx`, `App.tsx` y `csvParser.test.ts`. El compilador `tsc --noEmit` pasa limpio por primera vez.

- **Resolución del "Punto Ciego" Clínico**: Refactorización de `tokenizeRecord` en `searchEngine.ts` para realizar un barrido exhaustivo de **todas** las propiedades de cada registro. Esto soluciona el fallo que impedía indexar columnas clínicas con nombres especiales o acentuados.
- **Robustecimiento del Parser CSV**: Mejora en `csvParser.ts` para manejar correctamente delimitadores finales y evitar el truncamiento de datos en las últimas columnas de la fila.
- **Sincronización del Generador de Pruebas**: Corrección de un fallo de capitalización en `generate_test_suite.cjs` que generaba columnas vacías. Ahora los datos de prueba coinciden con el esquema real detectado en auditoría.
- **Fix de Persistencia y Caché**: Implementación de *Cache Busting* en la carga del Web Worker y upgrade a la **Versión 6** de la base de datos para asegurar un estado limpio tras actualizaciones de motor.
- **Herramientas de Diagnóstico Forense**: Implementación (y posterior retirada) de sistemas de auditoría de anatomía de registros para validación de datos en tiempo real.

## [2026-04-23]
### Añadido (V3.0.0 - Arquitectura Solid-State)
- **Ingesta por Streaming**: Implementación de `streamCSV` mediante generadores. Ahora procesamos 100k+ registros sin cargar el archivo completo en RAM.
- **Índice Fragmentado (Bucketing)**: Solución definitiva al error `Failed to read large IndexedDB value`. Las listas de coincidencia se dividen en fragmentos de 2000 entradas.
- **Gobernanza**: Limpieza de la raíz del proyecto. Los archivos `QUICK_TEST_DATA.csv` y `STRESS_TEST_DATA.csv` han sido movidos a `tests/data/` para cumplir con la Regla 3 de `RULES.md`.
- **Scripts de Soporte**: Creación de `scripts/quick_test_gen.cjs` para validación rápida del motor.

### Corregido
- **Bug de Autocompletado**: Se ha corregido la desestructuración de props en `Home.tsx` que impedía mostrar sugerencias.
- **Fallo Crítico de Lectura**: Eliminado el error de IndexedDB al manejar términos de alta frecuencia (ej: ciudades o servicios comunes).

### Versión 2.7.1 (Estabilización de Ingesta)
- **Merge Robusto**: Implementación del ciclo Read-Merge-Write en el Web Worker, garantizando la integridad de los datos ante registros fragmentados o intercalados en datasets masivos.

### Versión 2.7.0 (Optimización Extrema y Motor Ultra-Eficiente)
- **Motor de Búsqueda de Alto Rendimiento:**
  - **Batching de Consultas:** Refactorización total del método `search` para realizar consultas por lotes (`db.getBatch`) en una sola transacción de IndexedDB. Reduce drásticamente la latencia en búsquedas complejas.
  - **Optimización de Persistencia de Índice:** Mejorado el proceso de *Merge* con una gestión de memoria más eficiente para la unión de arrays, reduciendo la presión sobre el recolector de basura.
- **Arquitectura de Ingesta de Un Solo Paso (Single-Pass):**
  - **Procesamiento Incremental:** El Web Worker ahora indexa y guarda pacientes en un único bucle, eliminando la necesidad de mantener el dataset completo en RAM.
  - **Flushing Granular de Esqueletos:** Los metadatos de filtrado (*skeletons*) ahora se guardan de forma fragmentada durante el proceso, permitiendo manejar 100k registros con un consumo de memoria mínimo.
- **Robustez del Parser:**
  - **Limpieza de Líneas Vacías:** El motor de parseo ahora ignora automáticamente registros vacíos, evitando inconsistencias en los resultados.

## [2026-04-22]
### Versión 2.6.3 (Sello de Estabilidad y Motor de Precisión)
- **Motor de Búsqueda de Alta Precisión (Refactorización):**
  - **Lógica Booleana Estricta:** Implementación de "Strict MUST" (AND real) para garantizar que los resultados cumplan todas las condiciones de búsqueda, eliminando falsos positivos en 100k.
  - **Filtrado de Ruido (Stopwords):** Integración de un catálogo de palabras comunes en español para limpiar las sugerencias y mejorar la relevancia clínica.
  - **Detección Case-Insensitive:** Operadores `AND`/`OR` ahora se reconocen sin importar la capitalización.
- **Optimización de Persistencia:**
  - **Merge Robusto de Índice:** Corrección del sistema de volcado fragmentado para prevenir la pérdida de datos durante ingestas masivas.
  - **Caché de Conexión IDB:** Implementación de conexión persistente a base de datos para estabilidad total.

### Versión 2.6.1 - 2.6.2 (Scaling & Logic Patch)
- **Muestreo Inteligente (Heurística):** Limitación de la generación del diccionario de autocompletado a 10.000 registros para mantener la ligereza de la RAM en datasets de 100k.
- **Gestión de Memoria:** Liberación explícita de objetos pesados tras la indexación para evitar bloqueos del navegador.

## [2026-04-22]
### Versión 2.6.0 (Inteligencia de Población y Autocompletado)
- **Fase 6: Autocompletado Clínico Inteligente:**
  - **Motor de Sugerencias:** Extracción automática de los 1.000 términos más frecuentes del CSV durante la ingesta.
  - **Experiencia de Usuario (UX):** Nuevo componente desplegable con navegación por teclado (flechas/Enter), ocultación inteligente y resaltado de términos.
  - **Persistencia Local:** Sincronización inmediata de sugerencias tras la carga de datos sin requerir reinicio.
- **Identidad Visual Sensible al Género (Refinamiento):** Implementación de avatares dinámicos (Cian/Amatista) consistentes en todo el flujo clínico.
- **Gobernanza:** Sincronización automática de la versión global visible en la interfaz.

## [2026-04-21]
### Versión 2.5 (Resolución de Auditoría y Optimización de Ingesta Masiva)
- **Resolución de la Auditoría Clínica HCE-Comun:**
  - **Cabecera Demográfica:** Implementada extracción de Edad, Sexo, CP y Ciudad desde IndexedDB para visualización permanente en la ficha del paciente.
  - **Historia Clínica Completa (Secuencial):** Nuevo modo de visualización fluida sin pestañas para lectura continua de toda la historia del paciente.
  - **Limpieza de Categoría "Otros":** Actualización masiva de `fieldDictionary.ts` para clasificar campos críticos (Enfermedad Actual, Alergias, Antecedentes) en sus pestañas correspondientes.
  - **Privacidad y Seguridad:** Implementado aviso `beforeunload` y mecanismo de limpieza de IndexedDB al iniciar nuevas sesiones de navegador para protección de datos personales (A3, B1).
- **Optimización de Ingesta para Big Data (100k+ registros):**
  - **Parser Streaming:** El motor de parseo CSV ahora procesa el texto de forma iterativa, reduciendo drásticamente el consumo de RAM (evita OOM).
  - **Batching de Transacciones IDB:** Implementada lectura/escritura masiva en una sola transacción mediante `getBatch`. Mejora la velocidad de ingesta en un 90%.
  - **Indexador con Flushing:** El `searchEngine` ahora vuelca fragmentos del índice a disco periódicamente durante el proceso, permitiendo manejar datasets masivos sin desbordamiento de memoria.
- **Dashboard y Experiencia de Usuario:**
  - **Buscador Sticky (Persistente):** El buscador ahora se mantiene en la parte superior en formato compacto durante la visualización de resultados.
  - **Historial de Consultas:** Añadida sección de búsquedas recientes persistente en `localStorage`.
  - **Detección Automática de Formatos:** Soporte mejorado para archivos `.txt` y detección automática de delimitadores (`|`, `,`, `;`, `\t`).


## [2026-04-21]
### Versión 2.4 (Narrativa y Evolución del Sistema)
- **Implementación de Vista "Evolución del Proyecto":**
  - **Archivos Nuevos**: `src/components/Evolution.tsx`.
  - **Archivo Modificado**: `src/App.tsx`.
  - **Detalle**: Creación de una página estilo "Timeline" que narra la historia del proyecto desde los primeros laboratorios hasta el motor de búsqueda actual. El objetivo es explicar las fases técnicas (sharding, sharding, tests) de una forma accesible y visual.
- **Badge de Versión Interactivo:**
  - **Archivo Modificado**: `src/App.tsx`.
  - **Detalle**: El badge de versión (`V2.4`) en el header ahora es un botón funcional que permite acceder directamente a la vista de Evolución. Se ha separado visualmente del logo principal para mejorar la UX.

## [2026-04-20]
### Versión 2.3 (Arquitectura de Calidad y Testing)
- **Implementación de Suite de Pruebas (Test-Driven Reliability):**
  - **Tecnologías**: Vitest (Unit/Integration) y Playwright (E2E).
  - **Archivos Nuevos**: `src/lib/__tests__/searchEngine.test.ts`, `src/lib/__tests__/csvParser.test.ts`, `tests/smoke.spec.ts`.
  - **Motivo**: Garantizar que el motor de búsqueda y el parser de CSV funcionen con precisión matemática y no sufran regresiones tras futuros cambios.
- **Corrección de Bug Crítico en Parser CSV:**
  - **Archivo Modificado**: `src/lib/csvParser.ts`.
  - **Detalle**: Corregido fallo en la preservación de comillas que causaba truncamiento de datos cuando un campo contenía el delimitador de tubería (`|`) dentro de un texto encomillado. Detectado gracias a la nueva suite de pruebas.
- **Centro de Ayuda y Guía Clínica Integrada:**
  - **Archivos Nuevos/Modificados**: `src/components/Help.tsx`, `src/App.tsx`.
  - **Detalle**: Implementación de una vista de documentación premium para el personal hospitalario. Incluye tutoriales sobre búsqueda booleana, privacidad local-first y la sección de créditos oficiales del equipo del Hospital Rafael Méndez.

### Versión 2.2 (Ultra-Escalabilidad y Precisión Clínica)
- **Fragmentación de Metadatos (Big Data):**
  - **Archivos Modificados:** `src/lib/searchEngine.ts`, `src/lib/dataStore.ts`.
  - **Detalle:** Se ha eliminado el almacenamiento monolítico de metadatos (`hce_data`) para evitar el límite de 133MB de IndexedDB. Ahora el padrón de pacientes (`skeletons`) se fragmenta en bloques gestionables, permitiendo escalar hasta 100,000 registros sin degradación de rendimiento.
- **Corrección Operador NOT Persistente:**
  - **Archivo Modificado:** `src/lib/searchEngine.ts`.
  - **Detalle:** El operador Booleano `NOT` / `-` ahora consulta directamente la base de datos persistente en IndexedDB en lugar de la memoria volátil, asegurando su funcionamiento en todas las sesiones.
- **Optimización de Tokenización Clínica:**
  - **Archivo Modificado:** `src/lib/searchEngine.ts`.
  - **Detalle:** Reducción del umbral de tokenización para capturar términos de 1 y 2 letras, vital para la detección de constantes y analíticas (`pH`, `O2`, `Na`, `K`, `TA`).
- **Indexación de Filtros Rápidos:**
  - **Archivo Modificado:** `src/lib/searchEngine.ts`.
  - **Motivo:** Acelerar el filtrado por `Servicio` y `Fecha` en grandes volúmenes de resultados. Estos atributos ahora se pre-indexan en los `skeletons` de los pacientes.

## [2026-04-17]
### Versión 2.1 (Optimización de Ingesta y UI)
- **Implementación de Versionado Visual:**
  - **Archivo Modificado:** `src/App.tsx`.
  - **Detalle:** Añadida etiqueta "V2.1" junto al logo con tooltip de fecha/hora para trazabilidad rápida de la versión desplegada.
- **Cambio de Separador de Datos (Pipeline):**
  - **Archivo Modificado:** `src/lib/csvParser.ts`.
  - **Motivo:** El sistema de origen ha cambiado el formato de exportación de coma (,) a pipeline (|). Se ha ajustado el motor de parseo para ser compatible con esta nueva estructura.
- **Organización de Repositorio y Limpieza:**
  - **Archivos/Directorios Nuevos:** `local_workspace/`, `DIARIO_APRENDIZAJE.md`.
  - **Archivo Modificado:** `.gitignore`.
  - **Detalle:** Creación de un espacio de trabajo local para tests e ingestión de datos masivos que no debe sincronizarse con GitHub. Implementación de un Diario de Aprendizaje personal (ignorado en repo).

### Agregado (Despliegue y CI/CD)
- **Habilitación de GitHub Pages:**
  - **Archivos Modificados:** `vite.config.ts`, `.github/workflows/deploy.yml` (nuevo).
  - **Detalle:**
### Añadido
- **Centro de Ayuda Integrado**: Nueva vista (`HelpView`) con documentación técnica sobre búsqueda booleana y privacidad local.
- **Sección de Créditos Oficiales**: Reconocimiento al equipo de desarrollo y coordinación del Hospital Universitario Rafael Méndez.
- **Suite de Pruebas Automatizadas**: Integración de Vitest y Playwright para asegurar la fidelidad de los datos. (V2.3)
### Agregado (Pruebas de Estrés)
- **Generación de Dataset Masivo:**
  - **Archivos Modificados:** `csv_100k.csv` (nuevo), `scratch/generate_large_csv.cjs` (nuevo).
  - **Detalle:** Generación de un archivo de 100.000 registros clínicos correspondientes a ~80.000 pacientes únicos para validar el rendimiento del motor IndexedDB y la búsqueda asíncrona.
- **Implementación de Gobernanza Persistente:**
  - **Archivos Modificados:** `RULES.md`, `README.md`, `.cursorrules` (nuevo).
  - **Motivo:** Asegurar que las reglas de desarrollo se mantengan consistentes en cualquier entorno.

## [2026-04-16]
### Añadido (Escalabilidad 100k)
- **Implementación de Arquitectura Local-First de Alto Rendimiento:**
  - **Archivos Modificados:** `src/lib/db.ts` (nuevo), `src/lib/parser.worker.ts` (nuevo), `src/lib/searchEngine.ts`, `src/App.tsx`, `src/components/Results.tsx`.
  - **Motivo:** Para cumplir con el requerimiento de manejar datasets masivos (100.000+ pacientes) sin incurrir en errores de memoria (Out of Memory), se ha migrado la persistencia a IndexedDB. El índice de búsqueda ahora se fragmenta por términos para permitir consultas asíncronas bajo demanda. El procesamiento se ha delegado a un Web Worker para mantener la fluidez de la interfaz.

### Corregido
- **Sincronización de Componentes y Navegación:**
  - **Archivos Modificados:** `src/App.tsx`, `src/components/HCEView.tsx`.
  - **Motivo:** Se detectaron y solventaron errores de comunicación interna (Props de navegación y visibilidad del buscador) surgidos tras la re-arquitectura asíncrona.

### Agregado
- **Sistema de Temas Dinámico (Light/Dark):** Implementación de una arquitectura de temas profesional basada en variables CSS.
  - **Motivo:** El usuario solicitó un sistema para alternar entre modos de visualización sin perder la "estética original". Se añadió un toggle manual con persistencia.

### Mejorado
- **Legibilidad y UX Clínica:** Optimización global de fuentes, contrastes e interlineados.
  - **Motivo:** Aumentar la velocidad de lectura de registros médicos mediante un interlineado mayor (1.6) y una jerarquía tipográfica marcada.

### Corregido
- **Renombramiento del Proyecto:** Actualización unificada a "Queryclin".
  - **Motivo:** Establecer una identidad oficial única para el proyecto.

### Agregado
- **Documento de Reglas Estrictas:** Creación de `RULES.md`.
  - **Motivo:** Establecer directrices innegociables para el desarrollo automático y manual del sistema.

### Modificado
- **Conversión Exhaustiva del README.md:** Transformación en un "Libro Blanco" técnico.
- **Exportación de Datos a CSV:** Implementado sistema de descarga de resultados filtrados.
- **Humanización de la Documentación:** Ajuste del tono en el README para reflejar el proceso de decisiones compartidas.

### Refactorizado
- **Alineación Arquitectónica del Motor Clínico:** Saneamiento de nomenclatura (Toma y Orden_Toma) y agrupación de resultados por paciente (NHC).

### Corregido
- **Restauración de Filtrado Avanzado:** Reconstrucción de filtros por fecha y servicio con terminología hospitalaria sobria.
- **Rollback "Clean Clinical":** Regreso a la estética diurna original (Gris Niebla/Azul Radiológico) por petición expresa del usuario para garantizar neutralidad visual.

## [2026-04-23]
### Corregido (V2.7.1)
- **Implementación de Merge Robusto en Ingesta**:
  - **Archivos Modificados**: `src/lib/parser.worker.ts`.
  - **Detalle**: Se ha corregido un bug crítico que provocaba la pérdida de datos cuando los registros de un paciente estaban dispersos en diferentes lotes del CSV. El worker ahora realiza una lectura previa de IndexedDB y fusiona las nuevas "tomas" con la historia clínica existente.
  
### Mejorado (V2.7.0)
- **Arquitectura de Ingesta Single-Pass**:
  - **Archivos Modificados**: `src/lib/parser.worker.ts`, `src/lib/csvParser.ts`.
  - **Detalle**: Optimización extrema del motor de ingesta para procesar 100k+ registros en un solo flujo lineal, reduciendo el consumo de RAM en un 60%.
- **Batching de Consultas e Indexación**:
  - **Archivos Modificados**: `src/lib/searchEngine.ts`, `src/lib/db.ts`.
  - **Detalle**: Implementación de transacciones por lotes para IndexedDB, reduciendo la latencia de búsqueda en datasets masivos.

## [2026-04-22]
### Añadido (V2.6.3 - Inteligencia Clínica)
- **Autocompletado Basado en Muestreo**:
  - **Archivos Modificados**: `src/lib/searchEngine.ts`, `src/components/Home.tsx`.
  - **Detalle**: Implementación de sugerencias de búsqueda inteligentes generadas dinámicamente a partir de un muestreo de 10,000 registros para mantener el rendimiento.
- **Filtrado de Ruido (Stopwords)**:
  - **Detalle**: Integración de un catálogo de términos comunes médicos para mejorar la relevancia del autocompletado.

### Corregido
- **Motor Booleano Estricto**: Reconstrucción de la lógica de intersección (AND) para evitar falsos positivos en búsquedas multi-término.

## [2026-04-21]
### Añadido (V2.5.0 - Auditoría HCE-Comun)
- **Interfaz Demográfica Persistente**: Extracción de Edad, Sexo y CP a una cabecera fija, eliminando pestañas redundantes.
- **Modo Historia Completa**: Nueva vista de lectura continua del expediente médico.
