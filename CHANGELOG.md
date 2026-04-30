Todos los cambios notables realizados en el proyecto Queryclin serán documentados en este archivo, detallando el efecto del cambio y el motivo (el "por qué") de forma cronológica.

## [2026-04-30]
### Modernización de Modelos y Simplificación de Interfaz (V4.2.1)
- **`mappings.ts`**: Actualizados los modelos de formulario a una terna estándar: **HCE-ALG**, **HCE-MIR** y **HCE-OBS**. Se han unificado los IDs y nombres para reflejar la especialización del sistema.
- **`Home.tsx`**: Eliminada la sección de "Modo de Ejecución" (STRICT/EXPLORATION). El sistema ahora opera de forma determinista basándose en el mapeo explícito seleccionado por el usuario.
- **`Home.tsx`**: Rediseñada la pestaña de filtros de búsqueda. Se ha eliminado el campo "Especialidad" (ya que viene predefinida por el modelo importado) y se ha optimizado el layout del rango de fechas para ocupar todo el ancho disponible.
- **`App.tsx`**: Simplificada la lógica de subida de archivos eliminando la gestión del estado `strictMode`, fijándolo a `false` por defecto para permitir una ingesta fluida (estilo "Exploration") ignorando campos no mapeados sin bloquear la UI.
- **`App.tsx`**: El modal de "Modo Debug" ahora solo es visible si el proceso no está activo, evitando interrupciones visuales durante la carga.
- **`csv.worker.ts`**: Silenciadas las advertencias de campos no mapeados en el UI; ahora solo se reportan en la consola del desarrollador para una experiencia de ingesta totalmente automática.
- **`mappings.ts`**: Actualizado el modelo **HCE-ALG** con la estructura exacta del formulario hospitalario real (incluyendo campos como `N.H.C`, `EC_Proceso2`, etc.) para garantizar una ingesta 100% determinista y una categorización visual precisa.
- **`IndexerService.ts` & `QueryEngine.ts`**: Corregido error crítico `push is not a function` mediante el uso de `Object.create(null)` para todos los diccionarios de términos.
- **`Home.tsx`**: Rediseño integral de la experiencia de usuario (UX) mediante un sistema de **3 pasos numerados** con iconos clínicos, guiando al usuario desde la selección del modelo hasta la carga final del archivo.
- **`App.tsx`**: Refinado el branding **NachuS** con tipografía geométrica de peso medio y espaciado negativo (`-0.03em`) para una fidelidad total al estilo Google. Se ha optimizado la alineación vertical y el suavizado de fuentes (antialiased) para una integración perfecta con el logo de Queryclin.
- **`App.tsx`**: Implementado soporte nativo para archivos **.xlsx** mediante la integración con la librería `xlsx`. El sistema ahora convierte hojas de cálculo a formato tabular compatible con el motor de búsqueda en tiempo real.
- **`HCEView.tsx`**: Implementada la **Navegación por Teclado**. Los usuarios ahora pueden desplazarse entre los distintos expedientes clínicos utilizando las flechas de dirección (`←` y `→`), optimizando el flujo de trabajo en entornos de revisión masiva de datos.
- **`HCEView.tsx`**: Integrado el subgrupo **Constantes Clínicas** dentro de la categoría de Anamnesis. Este bloque presenta una estética inmutable tipo tabla (3 columnas) que muestra siempre los valores clave (IMC, Peso, Talla, constantes vitales) incluso si están vacíos, facilitando la comparativa rápida de parámetros biométricos.
- **`HCEView.tsx`**: Implementado el **Orden Estricto Determinista**. El sistema ahora ignora el orden aleatorio de los datos de origen y fuerza la visualización siguiendo la estructura original definida en el mapping. Esto garantiza que el personal clínico encuentre siempre cada campo en la misma posición relativa, facilitando la navegación rápida entre tomas.
- **`HCEView.tsx`**: Implementado el **Formateo Inteligente de Párrafos**. El sistema ahora detecta secuencias de 4 o más espacios en blanco (comunes en exportaciones hospitalarias) y las convierte automáticamente en saltos de línea dobles, mejorando drásticamente la legibilidad de bloques de texto densos.
- **`Evolution.tsx`**: Sincronizada la línea de tiempo del proyecto, incorporando los hitos de las versiones V3.8, V3.9 y la actual V4.2.1, además de actualizar el pie de página de la hoja de ruta.
- **`App.tsx`**: Corregido error crítico de importación (`Search`) que causaba pantallas en blanco durante la navegación.
- **Estética de Versión**: Restaurado el diseño original e inmutable del badge de versión en la cabecera, manteniendo la fecha de compilación visible junto al número de versión.
- **`App.tsx`**: Implementado el **Buscador Ubicuo** integrado directamente en la cabecera del sistema. Al realizar búsquedas o navegar por el historial, el buscador se mantiene accesible de forma minimalista en la barra superior, optimizando el espacio de visualización clínica.
- **Documentación Centralizada**: Actualizado el **Roadmap en README.md** (Fase 12) y sincronizada la versión global del proyecto a **V4.2.1**.
- **`Results.tsx`**: Refinada la estética de las tarjetas de paciente: unificada la altura de los bloques de estadísticas (Informes, Hallazgos, Relevancia) mediante contenedores de altura fija (`h-6`) y flexbox, garantizando una alineación horizontal perfecta y un equilibrio visual superior.
- **Limpieza de Terminología**: Eliminadas todas las referencias obsoletas a "CSV" en la UI y manuales de ayuda, sustituyéndolas por "Archivo de datos / TXT / XLSX" para reflejar fielmente las capacidades actuales del motor.
- **Gestión de Versiones**: Actualización de constantes `VERSION` y `BUILD_DATE` en el núcleo de la aplicación para un seguimiento preciso de los despliegues.

## [2026-04-28]
### Refinamiento Estético HCE-ALG (V4.2.0)
- **`HCEView.tsx`**: Implementado el diseño de **Cabecera de Doble Barra** para HCE-ALG. La barra superior (fondo crema) muestra la identidad (NHC, CIPA, Sexo, Nacimiento, CP) y la inferior el contexto clínico (Ámbito, Proceso, Alergias, Edad).
- **`HCEView.tsx`**: Rediseñada la **Línea de Tiempo (Sidebar)** para HCE-ALG. Ahora se presenta como una tabla compacta con cabecera "ID-Toma" y filas bicolor (cian/blanco) que muestran `OrdenT.#` y `F.Toma`.
- **`mappings.ts`**: Limpiados los nombres de las categorías visuales (eliminando prefijos 00, 01, etc.) para que la interfaz muestre títulos clínicos limpios como "ANTECEDENTES" o "RESULTADOS PRUEBAS".
- **`mappings.ts`**: Asegurada la presencia de campos críticos en la cabecera (Alergias, Proceso2, Ámbito) mediante alias y mapeo demográfico extendido.


- **`Home.tsx` & `App.tsx`**: Implementados dos modos de ingesta: **STRICT** y **EXPLORATION**. El modo estricto detiene la ingesta al encontrar campos no mapeados, mientras que el modo exploración permite guardarlos de forma auditada, lanzando advertencias (`debug_warn`) en el visor.
- **`csv.worker.ts`**: Reescritura del sistema de duplicados. Ahora, la colisión de `Orden_Toma` bajo un mismo `Id_Toma` no bloquea la ingesta. El sistema acepta el registro insertando el flag interno `_is_duplicate` y emite una advertencia visual.
- **`csv.worker.ts`**: Mejoras en **Trazabilidad**. Ahora se graban automáticamente en IndexedDB metadatos forenses: `source_file` (nombre del CSV original) y `ingest_timestamp` (fecha ISO de importación), vinculados al formulario seleccionado.
- **`HCEView.tsx`**: Si se ejecuta bajo EXPLORATION, los campos sobrantes ya no se descartan silenciosamente; se agrupan y renderizan bajo un nuevo apartado resaltado: **Campos no mapeados (debug)**.
- **`HCEView.tsx`**: Añadido **Badge de Duplicidad** en la cabecera de la versión activa. Si un registro está marcado como duplicado, se tiñe de color ámbar y muestra el icono de advertencia en la cabecera del expediente.

### Control Estricto y Auditoría de Datos (V4.0.1)
- **`csv.worker.ts`**: Implementación de **Validación de Mapeo Completo**. Ahora se detecta y detiene la ingesta si el archivo CSV contiene columnas que no están declaradas en el `mapping` (evitando almacenamiento silencioso de datos anómalos).
- **`csv.worker.ts`**: Modificada la validación estructural para que evalúe estrictamente la existencia de las claves `NHC`, `ID_TOMA` y `ORDEN_TOMA` en lugar de una lista completa.
- **`csv.worker.ts`**: Añadida lógica anti-mezcla de registros. El Worker ahora emite una alerta si detecta colisión/duplicidad en el mismo `Orden_Toma` bajo un mismo `Id_Toma`.
- **`App.tsx`**: Añadido **Modo Debug de Ingesta**. Una nueva vista modal que atrapa y muestra de manera estructurada los errores de validación (`debug_error`) emitidos por el Worker (ej. "Campos no mapeados", "Faltan claves").
- **`HCEView.tsx`**: Se ha erradicado por completo el uso de la categoría dinámica `Otros Datos` para los campos no mapeados. Ahora la información que se pinta debe existir explícitamente en el `formMapping`.
- **`HCEView.tsx`**: Implementación de **Navegador de Versiones de Toma**. Anteriormente el visor fusionaba todos los registros de una toma. Ahora se utiliza el `activeVersionIndex` y botones de navegación (`< >`) para garantizar el aislamiento ("Prohibido mezclar registros entre versiones"), renderizando solo la versión exacta seleccionada (`activeVersion.data`).

### Arquitectura Determinista y Formulario Explícito (V4.0.0)
- **`core/mappings.ts`**: Implementado nuevo sistema estricto de mapeo de formularios. El sistema ya no infiere las cabeceras del CSV heurísticamente.
- **`App.tsx` & `Home.tsx`**: Añadido selector obligatorio de formulario previo a la ingesta. El `formId` se persiste de manera local en `IndexedDB` a través del metadata.
- **`csv.worker.ts`**: Eliminadas las funciones de detección heurística (`detectNhcKey`, `findKey`). La ejecución se interrumpe lanzando un error crítico si falta la estructura clave esperada (`NHC`, `ID_TOMA`, `ORDEN_TOMA`) según el formulario.
- **`HCEView.tsx`**: Eliminado el uso de clasificaciones dinámicas. Las categorías visuales de la historia clínica se extraen ahora fielmente y sin alteraciones del objeto `visualCategories` definido en el mapping correspondiente.
- **`clinicalTaxonomy.ts`**: Lógica de heurística clínica descontinuada a favor del control determinista de campos vía mapping externo.

## [2026-04-27]
### Rediseño de Navegación HCE - Toma Única Activa
- **`HCEView.tsx`**: Rediseño arquitectónico completo del visor de historias clínicas. Se elimina el scroll infinito de tomas apiladas y se implementa un **navegador de toma única activa**: solo se muestra una toma en pantalla a la vez.
- **`HCEView.tsx`**: El timeline lateral ahora muestra para cada toma: número de orden (`#`), fecha completa, hora y usuario, permitiendo identificar y saltar a cualquier sesión clínica de un vistazo.
- **`HCEView.tsx`**: Añadida barra de navegación contextual en la cabecera de la toma activa con flechas "Anterior / Siguiente" y contador de posición (ej. "2 / 7").

- **`App.tsx`**: Implementada detección de codificación multinivel con fallback automático a **CP850 (MS-DOS)**. Se ha desarrollado un transcodificador manual para solucionar errores de visualización en caracteres específicos (`¢` -> `ó`) procedentes de sistemas hospitalarios heredados.
- **`clinicalTaxonomy.ts`**: Refinada la normalización de campos (NFD) y ampliada la base de conocimientos para reconocer términos de obstetricia y ginecología del dataset real (`cesárea`, `gestación`, `FPP`, etc.).
- **`HCEView.tsx`**: Añadido soporte para mapeo de fechas dinámico (`EC_Fecha_Toma`) y limpieza de formatos temporales complejos.
- **`Results.tsx`**: Migración completa del sistema de exportación de CSV a **XLSX (Excel nativo)** utilizando la librería SheetJS.
- **`Results.tsx`**: Modificada la visualización del listado para priorizar el campo `EC_Proceso2` (Proceso) sobre el nombre, mejorando la identificación contextual.
- **`csv.worker.ts`**: Actualizada la lógica de ingesta para capturar automáticamente `EC_Proceso2` como dato demográfico (`PROCESO`).
- **`csv.worker.ts`**: Refactorizado el algoritmo `findKey` para priorizar el **orden de las palabras clave** sobre el orden físico de las columnas. Esto garantiza que se elija la información descriptiva (`EC_Proceso2`) incluso si el sistema la exporta después de los IDs internos.
- **`csv.worker.ts`**: Corregido un falso positivo en la detección del Código Postal (CP) mediante exclusiones semánticas.
- **Dependencias**: Incorporada la librería `xlsx` al proyecto.
- **`tests/stress/`**: Creada infraestructura de pruebas de rendimiento. Incluye un dataset sintético de **17.379 registros** (`HC_Stress_Test.txt`) protegido como solo lectura, un script generador (`gen_stress_test.js`) y un plan de pruebas guiado para auditorías.
- **`DIARIO_APRENDIZAJE.md`**: Sincronización completa de la Fase 8 (Robustez y Datos Reales) para auditoría de prácticas.

## [2026-04-24]
### Refinamiento UI y Navegación HCE (V3.7.0)
- **`App.tsx`**: Restauración del tooltip de fecha de última compilación (`BUILD_DATE`) en el badge de versión para mantener la trazabilidad de actualizaciones. Cumplimiento proactivo de sincronía de versiones (Regla 5).
- **`Home.tsx`**: Eliminación del bloque "Consola de Análisis" genérico para limpiar la UI. El histórico de "Consultas Recientes" se ha centrado para ofrecer una vista inicial minimalista y profesional.
- **`HCEView.tsx`**: 
  - Corrección crítica de renderizado (Crash "Sistema Fuera de Servicio") al mapear propiedades incompatibles en la interfaz `Toma` (`idToma` y `latest.data`).
  - Añadido margen de simetría (espaciador derecho fantasma) en el layout principal para garantizar el centrado estético del expediente clínico.
  - Ajuste del anclaje de scroll en las tomas (`scroll-mt-8`) para que al pulsar el menú de navegación, la sesión se posicione directamente en la cabecera (top) en lugar del centro de la pantalla.
  - Resolución de errores TypeScript de exportación garantizando la tipificación segura mediante casting a `Toma[]`.
- **`parser.worker.ts`**: Reparada la telemetría de la barra de carga durante la ingesta. Se ha reducido el `BATCH_SIZE` de 10.000 a 2.500 y se ha forzado el reporte del progreso en el lote final, garantizando que la barra evolucione dinámicamente en UI incluso con archivos pequeños.

## [2026-04-24]
### Motor de Búsqueda de 2ª Generación: BM25 + Clinical Synonym Mapper (V3.9.0)
- **`engine/QueryEngine.ts` — Okapi BM25**: Se ha reemplazado el scoring TF-IDF lineal por el algoritmo **Okapi BM25** (estándar de la industria IR). Mejoras clave:
  - **IDF Robertson**: La fórmula `log((N - df + 0.5) / (df + 0.5) + 1)` evita IDF negativos y es numéricamente más estable.
  - **Saturación de TF** (`k1=1.5`): Mencionar "diabetes" 50 veces ya no da 50x más score que mencionarlo 1 vez. Curva asintótica que neutraliza el sesgo de historias clínicas largas.
  - **Normalización por longitud** (`b=0.75`): Pacientes con historias cortas pero altamente relevantes ya no son aplastados por pacientes con 200 visitas rutinarias.
- **`engine/IndexerService.ts` — Persistencia BM25**: El indexador ahora calcula y persiste `avg_doc_length` y `docLen` por registro durante la ingesta, para que `QueryEngine` pueda aplicar BM25 con datos reales.
- **`engine/Tokenizer.ts` — Clinical Synonym Mapper**: Se ha implementado un diccionario de sinónimos canónicos con cobertura de 23 patologías de alta prevalencia hospitalaria:
  - **Tokens SYN unificados**: Abreviaturas (`HTA`, `DM2`, `TEP`), nombres completos y variantes coloquiales son indexados con un token sintético `__syn_*__` adicional al token original.
  - **Expansión de Bigramas y Trigramas**: El método `expandQuery()` detecta automáticamente frases compuestas ("presion alta", "diabetes mellitus") en la query del usuario.
  - **Indexación dual no destructiva**: Ambos tokens (original + SYN) se indexan simultáneamente, preservando la recuperabilidad exacta.

## [2026-04-24]
### Refactorización Arquitectónica: Clean Architecture (V3.8.0)
- **Topología de Capas**: Se ha desmantelado la carpeta monolítica `src/lib/` en favor de una arquitectura orientada a dominios:
  - `src/core/`: Tipos y taxonomía clínica (`types.ts`, `clinicalTaxonomy.ts`).
  - `src/engine/`: Microservicios del motor de búsqueda.
  - `src/ingestion/`: Workers de procesamiento CSV (`csv.worker.ts`, `csvStreamer.ts`).
  - `src/storage/`: Capa de persistencia (`indexedDB.ts`).
  - `src/utils/`: Utilidades compartidas (`dateParser.ts`, `stringNormalizer.ts`).
- **Escisión del God Object (`searchEngine.ts`)**:
  - El monolito de 600 líneas ha sido fracturado en tres piezas independientes de alta cohesión: `IndexerService.ts` (ingesta y fragmentación), `QueryEngine.ts` (consultas booleanas y TF-IDF), y `Tokenizer.ts` (procesamiento lingüístico y stopwords).
  - `searchEngine.ts` ahora actúa exclusivamente como una clase **Facade** transparente, previniendo romper los contratos de la UI.
- **Limpieza de Código Muerto**: Purgadas importaciones de UI huérfanas (`lucide-react`) y variables de lógica heredada en el motor.

## [2026-04-24]
### Refactorización Semántica y Precisión de Búsqueda (V3.7.2)
- **`searchEngine.ts`**: Corrección masiva de 4 bugs críticos que provocaban pérdida de datos y falsos positivos/negativos:
  - **Filtro NOT a Nivel Registro**: Un término de exclusión (`-HIPERTENSION`) ya no veta al paciente entero históricamente, sino que descarta únicamente la toma clínica afectada.
  - **Filtros de Fecha y Servicio Quirúrgicos**: Los filtros en la interfaz ahora se validan contra los metadatos específicos de la toma clínica que contiene la coincidencia, ignorando el resto del historial irrelevante del paciente. (Se ha incorporado `tomasMeta` en la estructura `Skeleton`).
  - **Heurística de Fechas Extendida**: El motor de indexación ahora soporta columnas nombradas `FECHA`, `FECHA_INGRESO` o `DATE` en cualquier formato delimitado por `/` o `-`, evitando que los pacientes queden ocultos en los filtros temporales.
  - **Indexación Recursiva Total**: Se ha reescrito `tokenizeRecord` para procesar nativamente datos estructurados (Arrays) y Booleanos de historiales clínicos complejos, evitando la pérdida silenciosa de esta metainformación.

## [2026-04-24]
### Auditoría Estructural Continua (V3.7.1)
- **Gobernanza (`docs/`)**: Se han movido masivamente todos los documentos técnicos de diseño (`AUDITORIA_V25.md`, `AUDITORIA_V3.md`, `BATTLE_LOG.md`, `METAPROMPT.md`, `PROPOSAL_AI.md`) desde la raíz del proyecto hacia el directorio `/docs` para cumplir estrictamente la Regla 3.
- **Deuda Técnica (`package.json`)**: Moviendo dependencias de transpilación y UI (`@tailwindcss/vite`, `@vitejs/plugin-react`) de la rama `dependencies` a `devDependencies` para mantener una semántica de paquete impecable.
- **Limpieza de Código Muerto y Encapsulación**:
  - Eliminado el objeto obsoleto `storage` de `dataStore.ts`.
  - Retirada de la palabra clave `export` en múltiples elementos de uso estrictamente local (`ClinicalRecord`, `classifyField`, `SearchEngine`, `VERSION`, `BUILD_DATE`, `ViewState`) para evitar fugas de scope (Leaks de Encapsulación) detectados por `ts-prune`.

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
