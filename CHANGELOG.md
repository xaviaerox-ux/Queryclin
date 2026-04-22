Todos los cambios notables realizados en el proyecto Queryclin serán documentados en este archivo, detallando el efecto del cambio y el motivo (el "por qué") de forma cronológica.

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
