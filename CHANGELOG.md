# CHANGELOG

Todos los cambios notables realizados en el proyecto Queryclin serán documentados en este archivo, detallando el efecto del cambio y el motivo (el "por qué") de forma cronológica.

## [2026-04-16]
### Agregado
- **Sistema de Temas Dinámico (Light/Dark):** Implementación de una arquitectura de temas profesional basada en variables CSS.
  - **Archivos Modificados:** `src/index.css`, `src/App.tsx`, `src/components/Home.tsx`, `src/components/Results.tsx`, `src/components/HCEView.tsx`.
  - **Motivo:** El usuario solicitó un sistema para alternar entre modos de visualización sin perder la "estética original". Se diseñó un Modo Oscuro "Deep Slate" que evita la fatiga visual en turnos nocturnos y un Modo Claro que limpia y refina el diseño original. Se añadió un toggle manual (icono Sun/Moon) con persistencia en LocalStorage.

### Mejorado
- **Legibilidad y UX Clínica:** Optimización global de fuentes, contrastes e interlineados.
  - **Archivos Modificados:** Todos los componentes visuales.
  - **Motivo:** Aumentar la velocidad de lectura de registros médicos mediante un interlineado mayor (1.6) y una jerarquía tipográfica más marcada (font-black para cabeceras).

### Corregido
- **Renombramiento del Proyecto:** Se actualizaron todas las referencias del proyecto de "HCE Core - Intelligence" (o "My Google AI Studio App") a "Queryclin".
  - **Archivos Modificados:** `index.html`, `package.json`, `README.md`, `src/App.tsx`.
  - **Motivo:** El usuario decidió establecer una nueva identidad oficial unificada para el proyecto. Esto asegura que la aplicación tenga una marca consistente desde las etiquetas HTML hasta la interfaz visual y la documentación.

### Agregado
- **Documento de Reglas Estrictas:** Se ha creado `RULES.md` en la raíz del proyecto.
  - **Archivos Modificados:** `RULES.md` (nuevo).
  - **Motivo:** Establecer un documento maestro, respaldado por la memoria persistente de la IA (Knowledge Items), donde habitarán las reglas estrictas e inviolables del sistema para guiar a los agentes de programación automática. La primera regla documentada exige actualizaciones continuas al Changelog.

### Modificado
- **Conversión Exhaustiva del README.md:** El archivo central fue reformulado por completo.
  - **Archivos Modificados:** `README.md`.
  - **Motivo:** Petición para transformar la cabecera del proyecto de una instrucción de uso estándar a un "Libro Blanco" estilo portafolio e índice estructurado (cubriendo concepto, IA, stack tecnológico y roadmap). Esto habilitará a cualquier tutor, auditor o examinador informático entender la trayectoria secuencial de la aplicación desde el *promt inicial* hasta pos-producción.

### Agregado
- **Exportación de Datos a CSV:** Se ha implementado un sistema nativo para descargar resultados filtrados en formato CSV.
  - **Archivos Modificados:** `src/components/Results.tsx`.
  - **Motivo:** El usuario marcó la finalización de la Fase 3 del Roadmap, solicitando un botón funcional que compile toda la metadata e información recuperada por el motor de búsqueda en un Blob plano, asegurando que el proceso clínico pueda trasladarse a excel sin pérdida de caracteres gracias a codificación BOM UTF-8.

### Modificado
- **Extensión Estricta y Sincronizaciones del Roadmap:** 
  - **Archivos Modificados:** `RULES.md`, `README.md`.
  - **Motivo:** El usuario instruyó que, tan importante como añadir detalles granulares al Changelog, es vital trasladar los progresos "macro" al propio documento principal. Se erigió la **Regla 2** estipulando la actualización innegociable de la sección de características del `README.md`. Concluyentemente, se adelantó la rúbrica del Roadmap declarando formalmente clausurada la Fase 3, e inicializando el hito productivo hacia la Fase 4.
- **Narrativa "Walkthrough" y Humanización del README.md:**
  - **Archivos Modificados:** `README.md`.
  - **Motivo:** El usuario percibió que el modelo estructurado previo, si bien riguroso, resultaba "seco". Solicitó que la redacción institucional se sustituyera por la misma calidez conversacional, claridad pedagógica y *storytelling* en secuencia con la que el Agente elabora sus entregas explicativas. De este modo, un auditor o examinador sentirá que está participando de las decisiones desde la incepción (Prompt Inicial) hasta el código final en curso.

### Refactorizado
- **Alineación Arquitectónica del Motor Clínico y Nomenclatura (Indexación por HCE):**
  - **Archivos Modificados:** `src/lib/dataStore.ts`, `src/lib/searchEngine.ts`, `src/components/Results.tsx`, `src/components/HCEView.tsx`.
  - **Motivo:** Auditoría manual exhaustiva por parte del usuario respecto al `METAPROMPT.md` original, detectando una infracción severa de diseño doble. Primero, manipulación de la AI inventando jerigonza como "Episodios y Versiones" en lugar del estricto dictamen clínico "Toma y Orden_Toma/Registro". Segundo, el motor de búsqueda indexaba resultados aislando cada parche `Orden_Toma`. Así, si un solo número de historia clínica (`NHC`) contenía el término en 10 tomas, arrojaba 10 tarjetas duplicadas del mismo paciente, minando la usabilidad.
  - **Solución Delineada y Aplicada:** Se saneó `dataStore` implementando la interfaz `Toma` y `RegistroToma`. Seguidamente se reensambló el método TF-IDF en `searchEngine` para que agrupe las puntuaciones encapsulando el retorno a nivel de Paciente (`PatientSearchResult`). En consecuencia, la lista visual en `Results` arroja ahora 1 tarjeta estricta por `NHC` e informa en cuántas Tomas existió coincidencia. Al abrir el `HCEView` el entorno ha limpiado las nomenclaturas y auto-salta al registro con el mejor _score_ detectado sin que el usuario sufra fatiga visual buscando aguja en el pajar.

### Corregido
- **Restauración de Filtrado Avanzado y Formalidad Clínica:**
  - **Archivos Modificados:** `src/components/Home.tsx`.
  - **Motivo:** Se detectó que el reciente refactor "Premium Glassmorphism" eliminó accidentalmente un requerimiento estricto del proyecto semilla: Los filtros por fecha y servicio. Del mismo modo, se advirtió el uso de lenguaje infantiloide, excesivamente comercial y anti-clínico (e.g. "Medical Data Intelligence", "Hiper Privado").
  - **Solución Aplicada:** Se rediseñó el buscador inicial (`Home.tsx`). Se reconstruyeron los estados React e interfaces visuales de filtros adaptándolas a la estética oscura sin perder operatividad. Y fundamentalmente, se re-escribió todo el _copywriting_ implementando terminología sobria de ingeniería hospitalaria ("100% Offline Local-First", "Procesamiento en RAM", "Sintaxis Booleana estricta").

- **Rollback "Clean Clinical" (Regreso a Estética Diurna Original):**
  - **Archivos Modificados:** `src/index.css`, `src/App.tsx`, `src/components/Home.tsx`, `src/components/Results.tsx`, `src/components/HCEView.tsx`.
  - **Motivo:** El usuario expresó severo disconfort frente a la alteración global del diseño (el llamado "Modo Oscuro Premium" con brillos de neón). Requirió que la plataforma volviese a verse idénticamente pacífica, neutra y burocrática a como era en el archivo ZIP inaugural, pero conservando los motores matemáticos indexados y exportadores CSV actuales.
  - **Solución Aplicada:** Una lobotomía de clases estilizadas (`.glass`, `premium-shadow`, oscuros abstractos) revirtiendo el total del proyecto al "Light Theme" prístino: fondos color `gris niebla (#f4f7f9)`, letras de `tinta plomiza (#1e293b)` y acentos en un simple y funcional `azul radiológico (#2563eb)`. La interfaz vuelve a relajar a la vista, garantizando compatibilidad impecable con la jerarquía funcional recientemente creada (Paciente -> Toma -> Registro).
