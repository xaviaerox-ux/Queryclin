# 🏥 Queryclin (Medical Data Intelligence)

*Anteriormente conocido como HCE Core - Intelligence*

Bienvenido al historial vivo de **Queryclin**. Este documento actúa como el "Libro Blanco" y diario de ingeniería de todo el ciclo de vida del proyecto. Ha sido redactado cuidadosamente como una narrativa progresiva para que cualquier tutor, auditor arquitecto de software o desarrollador externo pueda sumergirse y comprender la totalidad del sistema: desde nuestra lluvia de ideas conceptual inicial, pasando por los distintos desafíos técnicos, hasta nuestro estado actual de desarrollo. No omitiremos ninguna etapa.

---

## 📌 Índice del Viaje

1. [El Problema y Nuestro Propósito](#1-el-problema-y-nuestro-propósito)
2. [Génesis del Proyecto (El Prompt Inicial)](#2-génesis-del-proyecto-el-prompt-inicial)
3. [Arquitectura y Decisiones Tecnológicas](#3-arquitectura-y-decisiones-tecnológicas)
4. [La Bitácora de Desarrollo (Roadmap Activo)](#4-la-bitácora-de-desarrollo-roadmap-activo)
5. [Guía de Instalación para Auditores](#5-guía-de-instalación-para-auditores)
6. [Gobernanza de Inteligencia Artificial](#6-gobernanza-de-inteligencia-artificial)

---

## 1. El Problema y Nuestro Propósito
**Queryclin** no es tan solo otra aplicación médica; nace de observar un enorme problema en el día a día hospitalario: el personal médico se ve frecuentemente forzado a lidiar con exportaciones masivas de Historias Clínicas Electrónicas (HCE) en archivos de texto plano o CSV crudos. Interpretar sábanas clínicas interminables en hojas de cálculo tradicionales genera una inmensa fatiga visual y errores de apreciación.

Nuestra misión fue clara: **Construir un motor que permitiera la navegación fluida, la búsqueda contextual profunda y el acceso ordenado a vastos expedientes en micro-segundos.**

> [!IMPORTANT]
> **Confidencialidad como Pilar (Local-First):** Debido a las estrictas leyes de protección de datos médicos, tomamos una decisión arquitectónica radical: **Cero APIs de Base de Datos externas**. Los datos analizados jamás abandonan la computadora del hospital. Todo (importación, indexación, búsquedas complejas) se procesa en la memoria RAM y el `localStorage` del navegador cliente, garantizando seguridad absoluta frente a filtraciones de red.

---

## 2. Génesis del Proyecto (El Prompt Inicial)
Todo proyecto tiene un origen. Queryclin arrancó con una directiva inicial ambiciosa (nuestro primer *prompt*): Necesitamos escapar de las típicas interfaces burocráticas grises de los años 90.

La visión consistió en:
- **Simplicidad Google:** Plantear la interfaz central como un buscador limpio y minimalista. Un lienzo vacío donde el doctor solo necesita escribir lo que busca.
- **Sistema de Temas Dual (Light/Dark):** Implementación de una arquitectura de diseño que permite alternar entre el modo "Clean Clinical" original (claro) y un nuevo modo "Deep Slate" (oscuro), adaptado para reducir la fatiga visual en entornos hospitalarios de 24h.
- **Cerebro Booleano Avanzado:** Un motor de búsqueda que procesa sintaxis lógica natural (`diabetes AND asma NOT fumador`), permitiendo segmentaciones complejas de la población clínica sin dependencias de red.
- **Legibilidad Crítica:** Diseño centrado en el dato médico, optimizando interlineados y jerarquías tipográficas para una lectura rápida y precisa.

---

## 3. Arquitectura y Decisiones Tecnológicas
Para materializar esta visión sin un servidor back-end, apostamos por construir una robusta **SPA (Single Page Application)**.

- **React 19 + TypeScript (El Esqueleto):** Requeríamos asegurar que no hubiese errores fatales al cruzar millones de filas de datos clínicos. TypeScript nos brindó un tipado estricto (Pacientes → Tomas Médicas → Versiones del Documento).
- **Vite (El Motor de Construcción):** Seleccionado por su ridículamente rápido Hot Module Replacement (HMR).
- **Tailwind CSS 4 (El Pintor):** Usado para inyectar todas nuestras intrincadas variables CSS de _Glassmorphism_ sin escribir miles de líneas de estilo a mano. Lo acompañamos con `Lucide React` para lograr iconografía elegante.
- **Micro-Sistemas Lógicos (`src/lib/`):**
  - *`csvParser.ts`*: Escanea y fragmenta la data independientemente de la codificación local.
  - *`dataStore.ts`*: Es nuestra base de datos relacional fabricada. Agrupa filas enteras comprimiéndolas inteligentemente basándose en el Número de Historia Clínica (NHC).
  - *`searchEngine.ts`*: Nuestro buscador integrado. Aplica fórmulas de recuento de palabras TF-IDF (Frecuencia de término / Documento inverso) para evaluar inteligentemente qué paciente entra más en la descripción buscada, asignando un `Score`.

---

## 4. La Bitácora de Desarrollo (Roadmap Activo)
Así es como hemos ido escalando el proyecto, paso a paso. (Para ver los _commits_ exactos con explicaciones, puedes auditar nuestro archivo `CHANGELOG.md`).

### Fase 1: Arquitectura Base (Completada ✅)
*Comenzamos levantando las vigas estructurales.*
- Desplegamos el entorno en Vite.
- Escribimos las arduas librerías matemáticas en TypeScript para lograr que el navegador pudiese analizar archivos CSV y aguantar la compresión hacia `localStorage` sin colgar la pestaña.

### Fase 2: Experiencia Clínica UI/UX (Completada ✅)
*Con los datos guardados, necesitábamos mostrarlos de forma "Premium".*
- **La Página de Inicio:** Diseñamos una interfaz central tipo megabuscador que invita al usuario a "soltar" su CSV.
- **Visor HCEView:** Creamos un explorador de expedientes dinámico. En lugar de bloques de texto, diseñamos tarjetas que se pueden navegar con flechas; e integramos un **Resaltado Inteligente de Sintaxis en color ámbar**. Esto último permite al médico ver inmediatamente por qué el algoritmo trajo ese paciente frente al millar de registros irrelevantes.

### Fase 3: Gestión de Bases Exportables (Completada ✅)
*Surgió un reto funcional: Una vez que el estadístico encuentra sus 50 pacientes ideales, ¿cómo los saca de la App?*
- Fabricamos un botón nativo inyectado limpiamente en nuestra interfaz con un logo de descarga (Lucide). Este iterador captura todos los diccionarios mostrados, crea un archivo Blob, inserta directrices estrictas *BOM UTF-8* (para evitar que programas como Excel destruyan acentos o eñes) y le devuelve al usuario un CSV recién horneado con la información condensada y filtrada.

### Fase 4: Refinamiento de Interfaz y Legibilidad (Completada ✅)
*Enfocada en convertir la herramienta en un producto de alta precisión.*
- **Motor Booleano Profesional:** Refactorización del parser para soportar intersecciones, uniones y exclusiones (`AND`, `OR`, `NOT`) con diagnóstico de filtrado en tiempo real.
- **Arquitectura de Temas:** Implementación de variables CSS dinámicas y un sistema de persistencia para alternar entre modos visuales (Claro/Oscuro).
- **UX de Navegación:** Introducción de autoscroll y detección automática de pestañas para dirigir al médico directamente al hallazgo resaltado dentro de la historia clínica.

### Fase 5: Estabilización y Despliegue (En Progreso 🚧)
*El paso final hacia el entorno productivo.*
- Auditando la integridad de los datos en datasets complejos.
- Elaboración del Pipeline de compilación final estático (`npm run build`).
- Integración en un entorno de acceso unificado basado en políticas Local-First.
- Elaboración del Pipeline o canal de compilación final estático (`npm run build`).
- Integración en un CDN de acceso libre, pregonando exactamente nuestras mismas políticas Local-First sin servidor transaccional, para que un doctor acceda vía web en su clínica sin ninguna instalación de base.

---

## 5. Guía de Instalación para Auditores
Para aquellos examinadores, tutores u operarios IT que necesiten levantar nuestra aplicación para auditarla (incluso en versiones portátiles locales):

### En Entorno Local (Desarrollo y Revisión)
1. Extrae o clona el repositorio del proyecto en tu máquina general.
2. Usando tu terminal (o tu entorno Node Portable si requieres permisos estáticos), instala el ecosistema:
   ```bash
   npm install
   ```
3. Lánzalo ejecutando el entorno de desarrollo:
   ```bash
   npm run dev
   ```

### En Red Intranet Clínica (LAN)
El proyecto cuenta con el parámetro `--host=0.0.0.0` ya expuesto gracias a configuraciones integradas. Para que otros médicos con tablets puedan verlo en vivo mientras compartan WiFi:
1. Extrae la IP de tu servidor ejecutando `ipconfig` en Windows (ej: `IPv4: 192.168.1.150`).
2. Digítela en el navegador del iPad o computadora remota del paciente: `http://<IP_LOCAL>:3000`.

---

## 6. Gobernanza de Inteligencia Artificial
El desarrollo central actual subyace mediante Agentes dotados de Inteligencia Artificial y protocolos de contexto en tiempo real (**Gemini AI** / **MCP**). 

Para sostener el orden corporativo, el núcleo del proyecto contiene el archivo sagrado **`RULES.md`**. Todo agente automatizado de código está inherentemente blindado en memoria para acatar las leyes dictadas allí (lo que garantiza, por ejemplo, que al finalizar cada arreglo o adición en el código, el agente auto-escriba su trabajo detalladamente en el `CHANGELOG.md` sin que el operador humano se lo ordene).
