# Queryclin — HCE Intelligence Dashboard (V4.2.1)

Queryclin es una plataforma de exploración y análisis de **Historias Clínicas Electrónicas (HCE)** diseñada bajo principios de **privacidad absoluta y rendimiento local**. Permite al personal clínico navegar, buscar y segmentar grandes volúmenes de datos directamente en el navegador sin dependencias de red.

---

## 1. El Problema y Nuestro Propósito
El personal médico se ve frecuentemente forzado a lidiar con exportaciones masivas de HCE en formatos crudos (Texto plano o Excel). Interpretar estas sábanas de datos genera una inmensa fatiga visual y riesgo de errores. 

**Queryclin** nació con la misión de construir un motor que permitiera la navegación fluida y la búsqueda contextual profunda en vastos expedientes en milisegundos.

> [!IMPORTANT]
> **Privacidad Local-First:** Debido a la sensibilidad de los datos médicos, la arquitectura es estrictamente local. Los datos jamás abandonan la computadora; todo el procesamiento se realiza en la base de datos del cliente (IndexedDB) y la memoria del navegador.

---

## 2. Génesis del Proyecto
La visión original se basó en transformar la experiencia de auditoría clínica:
- **Simplicidad de Uso:** Un buscador central limpio que acepta la carga de archivos por arrastre.
- **Arquitectura de Escala (v3):** Capacidad para gestionar hasta **100.000 pacientes** de forma fluida mediante procesamiento paralelo (Web Workers).
- **Sintaxis Booleana Estricta:** Motor de búsqueda que soporta lógica natural (`diabetes AND asma NOT fumador`).
- **Navegación de Toma Única Activa (v4):** Rediseño del visor HCE para centrar la atención en una única sesión clínica, con timeline lateral para navegación cronológica rápida.
- **Exportación Profesional (v4):** Motor de exportación nativo a formato **Excel (.xlsx)** para facilitar el análisis externo por parte de los facultativos.
- **Resiliencia de Codificación:** Transcodificación automática (UTF8/Windows-1252/CP850) para archivos heredados de sistemas hospitalarios antiguos.

---

Tras las últimas refactorizaciones para asegurar la escalabilidad masiva y estabilidad ante la auditoría, el stack se compone de una **Arquitectura Limpia (Clean Architecture)** desacoplada:

- **React 19 + TypeScript:** Esquema de datos estricto para garantizar la integridad clínica.
- **Capa de Dominio (`src/core/`):** Modelos de datos y taxonomía clínica unificada.
- **Capa de Aplicación e Ingesta (`src/ingestion/`):** Workers de procesamiento paralelo y streaming de datos tabulares.
- **Capa de Infraestructura y Storage (`src/storage/`):** Persistencia en IndexedDB con fragmentación inteligente.
- **Motor de Búsqueda Clínico (`src/engine/`):** 
  - *`IndexerService.ts`*: Ingesta asíncrona con seguimiento de longitudes para BM25.
  - *`QueryEngine.ts`*: Motor de recuperación de información basado en **Okapi BM25**.
  - *`Tokenizer.ts`*: Procesamiento lingüístico con **Clinical Synonym Mapper** y expansión de consultas.
- **Fachada de Integración (`src/lib/searchEngine.ts`):** Punto único de contacto para la UI que delega en los micro-servicios del motor, garantizando una transición transparente desde la arquitectura anterior.


---

## 4. Evolución de Características (Roadmap)

### Fase 1: Arquitectura Base (Completada ✅)
- Entorno de desarrollo en Vite y definición de interfaces clínicas.

### Fase 2: Experiencia UI/UX (Completada ✅)
- Diseño del visor HCEView con resaltado inteligente de sintaxis.

### Fase 3: Gestión de Bases Exportables (Completada ✅)
- Implementación de la exportación de resultados filtrados a CSV con codificación BOM UTF-8.

### Fase 4: Escalabilidad Big Data (Completada ✅)
- Migración a arquitectura asíncrona para soportar 100.000 pacientes sin errores de memoria (Versión 2.0).
- Implementación de paginación virtual y carga diferida de registros.

### Fase 5: Optimización de Ingesta y Versionado (✅)
- Adaptación del motor de ingesta para soportar separadores de pipeline (`|`) habituales en sistemas de exportación heredados.
- Implementación de un sistema de etiquetado de versiones visual en la interfaz.

### Fase 6: Ultra-Escalabilidad y Precisión Clínica (✅)
- **Fragmentación de Metadatos**: División del padrón de pacientes en fragmentos para superar los límites de IndexedDB.
- **Búsqueda Booleana Persistente**: Corrección del operador `NOT` para consultas a base de datos.
- **Precisión Clínica**: Tokenización de corto espectro (`pH`, `O2`, `Na`, `K`).

### Fase 7: Calidad y Gobernanza de Datos (V2.3 ✅)
- **Suite de Pruebas Automatizadas**: Integración de Vitest y Playwright para asegurar la fidelidad absoluta de la Historia Clínica Electrónica.
- **Auditoría de Ingesta**: Resolución de bugs de parseo mediante tests de regresión.

### Fase 8: Resolución de Auditoría Clínica y Big Data (V2.5 - V2.6 ✅)
- **Reestructuración HCE-Comun**: Rediseño de la interfaz visual con cabecera demográfica persistente.
- **Historia Completa (Modo Lectura)**: Visualización secuencial de registros para revisión continuada.
- **Inmunidad a OOM (100k+ registros)**: Refactorización de ingesta mediante flushing incremental.
- **Inteligencia Clínica**: Sugerencias de autocompletado y filtrado de ruido (Stopwords).

### Fase 9: Optimización Extrema y Motor Ultra-Eficiente (V2.7 - V3.0 ✅)
- **Arquitectura de Ingesta Single-Pass**: El sistema procesa, indexa y guarda registros en un único flujo lineal, minimizando el consumo de RAM.
- **Batching de Consultas**: Refactorización del motor de búsqueda para realizar consultas por lotes, reduciendo las transacciones de IndexedDB en un 80% en búsquedas complejas.
- **Robustez de Datos**: Implementación de filtrado de líneas vacías y normalización estricta durante el parseo masivo.

### Fase 10: Refactorización a Clean Architecture (V3.8 ✅)
- **Desacoplamiento Total**: Migración de una estructura plana a capas funcionales (`core`, `engine`, `ingestion`, `storage`).
- **Patrón Facade**: Implementación de una interfaz unificada para el motor de búsqueda que oculta la complejidad interna de los micro-servicios.
- **Purga de Deuda Técnica**: Eliminación de código muerto y optimización de dependencias visuales.

### Fase 11: Recuperación de Información de 2ª Generación (V3.9 - ACTUAL ✅)
- **Algoritmo BM25**: Implementación de **Okapi BM25** con saturación de frecuencia y normalización por longitud de documento, superando al TF-IDF tradicional.
- **Clinical Synonym Mapper**: Diccionario integrado de 23 patologías de alta prevalencia para expansión automática de consultas (ej. `HTA` → `Hipertensión`).
- **Expansión de Bigramas**: Detección de frases clínicas compuestas en la búsqueda del usuario.

### Fase 12: Modernización y Soporte Excel (V4.2.1 - ACTUAL ✅)
- **Soporte Nativo XLSX**: Integración con motores de procesamiento de hojas de cálculo para ingesta directa de Excel.
- **Modelos Deterministas**: Implementación de esquemas clínicos rígidos (HCE-ALG, MIR, OBS) para garantizar el mapeo de campos críticos como `N.H.C`.
- **Rediseño UX Step-by-Step**: Transformación del proceso de carga en un asistente de 3 pasos intuitivo.
- **Buscador Ubicuo**: Integración del motor de búsqueda en la cabecera principal para maximizar el espacio de análisis clínico.
- **Inmunidad a Conflictos**: Uso de diccionarios `Object.create(null)` para prevenir colisiones con palabras reservadas en datos reales.


---

## 5. Instrucciones de Uso y Despliegue

### Entorno Local
1. Instalar dependencias: `npm install`
2. Iniciar servidor de desarrollo: `npm run dev`

### Red Local (Intranet)
La aplicación es accesible en red local compartiendo la IP del host en el puerto 3000, permitiendo el uso en diferentes dispositivos de la clínica simultáneamente.

---

## 6. Estructura y Gobernanza

El proyecto está organizado para garantizar el orden y la escalabilidad:

-   `scripts/`: Herramientas de generación y diagnóstico técnico.
-   `tests/data/`: Datasets de prueba controlados.
-   `docs/`: Diseños y especificaciones originales.
-   **[RULES.md](file:///c:/Users/hrmadm/Documents/GitHub/Queryclin/RULES.md)**: El marco de gobernanza estricta ("Constitución").
-   **[BATTLE_LOG.md](file:///c:/Users/hrmadm/Documents/GitHub/Queryclin/BATTLE_LOG.md)**: Diario narrativo de desafíos técnicos y soluciones.
-   **[CHANGELOG.md](file:///c:/Users/hrmadm/Documents/GitHub/Queryclin/CHANGELOG.md)**: Registro histórico de modificaciones.

> [!IMPORTANT]
> **Instrucciones para Agentes de IA:** Cualquier asistente de IA que trabaje en este repositorio tiene la obligación de actualizar el `CHANGELOG.md` tras cada modificación y el historial de `TASKS.md`, siguiendo estrictamente las directrices de `RULES.md`.
