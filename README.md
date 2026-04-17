# Queryclin — HCE Intelligence Dashboard

Queryclin es una plataforma de exploración y análisis de **Historias Clínicas Electrónicas (HCE)** diseñada bajo principios de **privacidad absoluta y rendimiento local**. Permite al personal clínico navegar, buscar y segmentar grandes volúmenes de datos directamente en el navegador sin dependencias de red.

---

## 1. El Problema y Nuestro Propósito
El personal médico se ve frecuentemente forzado a lidiar con exportaciones masivas de HCE en formatos crudos (CSV/Texto). Interpretar estas sábanas de datos genera una inmensa fatiga visual y riesgo de errores. 

**Queryclin** nació con la misión de construir un motor que permitiera la navegación fluida y la búsqueda contextual profunda en vastos expedientes en milisegundos.

> [!IMPORTANT]
> **Privacidad Local-First:** Debido a la sensibilidad de los datos médicos, la arquitectura es estrictamente local. Los datos jamás abandonan la computadora; todo el procesamiento se realiza en la base de datos del cliente (IndexedDB) y la memoria del navegador.

---

## 2. Génesis del Proyecto
La visión original se basó en transformar la experiencia de auditoría clínica:
- **Simplicidad de Uso:** Un buscador central limpio que acepta la carga de archivos por arrastre.
- **Arquitectura de Escala (v3):** Capacidad para gestionar hasta **100.000 pacientes** de forma fluida mediante procesamiento paralelo (Web Workers).
- **Sintaxis Booleana Estricta:** Motor de búsqueda que soporta lógica natural (`diabetes AND asma NOT fumador`).
- **Navegación Evolutiva:** Capacidad para recorrer cronológicamente las distintas versiones (Toma y Orden_Toma) de una historia clínica.

---

## 3. Arquitectura Tecnológica Actual
Tras las últimas refactorizaciones para asegurar la escalabilidad masiva, el stack se compone de:

- **React 19 + TypeScript:** Esquema de datos estricto para garantizar la integridad clínica.
- **IndexedDB (Persistencia):** Sustituye a localStorage para superar el límite de 5MB, permitiendo almacenar cientos de megabytes de datos clínicos de forma segura.
- **Web Workers:** Delegación del procesamiento intensivo (parsing e indexación) a hilos paralelos para mantener la interfaz a 60 FPS.
- **Librerías de Motor Interno:**
  - *`csvParser.ts`*: Escáner de caracteres asíncrono optimizado para separadores de tipo pipeline (`|`).
  - *`db.ts`*: Capa de abstracción para la base de datos fragmentada en IndexedDB.
  - *`searchEngine.ts`*: Buscador asíncrono basado en puntuación de relevancia (TF-IDF).

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

### Fase 5: Optimización de Ingesta y Versionado (V2.1 - Actual ✅)
- Adaptación del motor de ingesta para soportar separadores de pipeline (`|`) habituales en sistemas de exportación heredados.
- Implementación de un sistema de etiquetado de versiones visual en la interfaz.
- Organización del espacio de trabajo local (`local_workspace`) para pruebas controladas.

---

## 5. Instrucciones de Uso y Despliegue

### Entorno Local
1. Instalar dependencias: `npm install`
2. Iniciar servidor de desarrollo: `npm run dev`

### Red Local (Intranet)
La aplicación es accesible en red local compartiendo la IP del host en el puerto 3000, permitiendo el uso en diferentes dispositivos de la clínica simultáneamente.

---

## 6. Gobernanza y Desarrollo
El proyecto se rige por el documento **[RULES.md](file:///c:/Users/hrmadm/Documents/GitHub/Queryclin/RULES.md)**, que asegura que cualquier modificación mantenga la coherencia histórica de la documentación y la fidelidad absoluta a los datos clínicos originales. 

> [!IMPORTANT]
> **Instrucciones para Agentes de IA:** Cualquier asistente de IA que trabaje en este repositorio tiene la obligación de actualizar el `CHANGELOG.md` tras cada modificación y el Roadmap de este `README.md` tras alcanzar hitos significativos, siguiendo estrictamente las directrices de `RULES.md`.
