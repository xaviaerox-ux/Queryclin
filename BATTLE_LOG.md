# BATTLE_LOG.md - Diario de Combate Técnico

Este documento registra los desafíos más críticos encontrados durante el desarrollo de Queryclin, el proceso de resolución y las lecciones aprendidas. Aquí vive la narrativa de la lucha contra los bugs.

---

## 🛡️ Batalla 1: El Desbordamiento de Memoria (100k registros)
- **El Enemigo**: La memoria RAM del navegador. Al intentar cargar 34MB de CSV en un solo objeto JSON, el navegador colapsaba (Out of Memory).
- **La Estrategia**: Migrar a IndexedDB y Web Workers.
- **La Victoria**: Implementamos una arquitectura "Streaming" donde los datos se guardan en disco local (browser) y solo se pide lo necesario.
- **Lección**: "No confíes en la RAM para datos médicos masivos".

## 🛡️ Batalla 2: El Misterio de los 0 Pacientes (V2.5.1)
- **El Enemigo**: Caracteres invisibles (BOM) y finales de línea de Windows (`\r\n`).
- **El Fracaso**: Tras una ingesta exitosa, el sistema reportaba 0 pacientes. El parser se perdía en la primera línea.
- **La Victoria**: Refactorización del parser para detectar automáticamente el delimitador y limpiar el BOM. Añadimos normalización estricta de NHC.
- **Lección**: "La higiene del dato es el 90% del éxito de un analizador".

## 🛡️ Batalla 3: El Error del Sistema Fuera de Servicio (V2.5.2)
- **El Enemigo**: Un error `undefined` que bloqueaba toda la interfaz al cargar un paciente.
- **El Origen**: Discrepancia entre el diccionario de campos (que clasificaba como "Demografía") y la interfaz (que no tenía pestaña para ello).
- **La Victoria**: Implementación de una "Interfaz Resiliente" que inicializa categorías bajo demanda. Si el dato existe, el sistema le hace sitio.
- **Lección**: "El frontend debe ser defensivo ante la incertidumbre del dato".

## 🛡️ Batalla 4: La API Fantasma (V2.6)
- **El Enemigo**: Error `db.saveToStore is not a function`.
- **El Origen**: Intento de usar un método inexistente durante la implementación del autocompletado por confusión con la API estándar de IndexedDB (hallucinación de API).
- **La Victoria**: Reemplazo por `db.saveBatch`, el método interno correcto de nuestra capa de datos optimizada.
- **Lección**: "Verifica siempre la firma de los métodos en la capa de persistencia antes de implementar nuevas funciones".

## 🛡️ Batalla 5: La Gran Ingesta (V2.6.2)
- **El Enemigo**: Corrupción de datos y falsos positivos en búsquedas masivas (100k).
- **El Origen**: 1) Sobrescritura de datos en flushes parciales de IndexedDB. 2) Carga de 100k conexiones IDB simultáneas. 3) Lógica AND que actuaba como OR.
- **La Victoria**: Implementación de un "Merge" robusto (Leer-Combinar-Escribir), caché de conexión de base de datos y filtrado por Intersección Estrictas (Strict MUST).
- **Lección**: "La persistencia masiva requiere atomicidad y una lógica de unión que no deje a ningún paciente atrás".

## 🛡️ Batalla 6: Los Pacientes Intercalados (V2.7.1)
- **El Enemigo**: Pérdida silenciosa de datos durante la ingesta por lotes.
- **El Origen**: El procesamiento por lotes de 5,000 registros sobrescribía los datos del paciente si este aparecía en diferentes bloques del CSV, ya que `IndexedDB.put` no fusiona objetos.
- **La Victoria**: Implementación de un ciclo "Read-Merge-Write" en el Web Worker. Ahora el sistema lee el estado previo del paciente, fusiona las nuevas tomas y actualiza el registro completo de forma atómica.
- **Lección**: "En arquitecturas local-first por lotes, el 'Merge' manual es obligatorio para garantizar la integridad de la historia clínica".

## 🛡️ Batalla 7: La Guerra de los Límites (V3.0.0 Solid-State)
- **El Enemigo**: Errores `Failed to read large IndexedDB value` y `Out of Memory`.
- **El Origen**: Listas de coincidencia de palabras comunes que superaban los límites físicos de IndexedDB y saturación de RAM al cargar archivos CSV masivos.
- **La Victoria**: Salto generacional a **Bucketing** (índice fragmentado) e **Ingesta por Streaming**. El sistema ahora es virtualmente inquebrantable ante el volumen de datos.
- **Lección**: "La verdadera escalabilidad no es procesar más rápido, sino fragmentar de forma que el hardware nunca sienta el peso".

---
*Queryclin Evolución - Arquitectura Solid-State alcanzada.*
