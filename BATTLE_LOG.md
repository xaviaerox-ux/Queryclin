# Battle Log - Queryclin Technical Challenges

Este documento registra los desafíos técnicos más críticos enfrentados durante el desarrollo de Queryclin y las soluciones implementadas para superarlos.

---

## ⚔️ Desafío: El Error del Prototipo (`push is not a function`)
**Fecha**: 2026-04-30
**Problema**: Durante la ingesta de datasets reales, el motor de búsqueda colapsaba con el error `this.tempIndex[term].push is not a function`.
**Causa**: Los datasets clínicos contenían términos como "constructor", "toString" o "hasOwnProperty". Al usarlos como llaves en un objeto plano `{}`, JavaScript accedía a las funciones del prototipo en lugar de a los arrays de índices.
**Solución**: Migración de todos los diccionarios de términos a objetos sin prototipo mediante `Object.create(null)`. Esto blindó al motor contra cualquier término clínico que colisione con palabras reservadas del lenguaje.

## ⚔️ Desafío: El Límite de 133MB de IndexedDB
**Fecha**: 2026-04-20
**Problema**: Al intentar guardar índices de búsqueda para 100,000 registros, el navegador lanzaba un error de cuota o fallaba al leer valores grandes.
**Causa**: Chrome impone límites al tamaño de un único registro en IndexedDB. Un índice masivo serializado superaba este límite.
**Solución**: Implementación de **Fragmentación (Bucketing)**. El índice se divide en fragmentos lógicos menores a 50MB que se reconstruyen en memoria mediante streams, permitiendo el manejo de GBs de datos sin colapsar el almacenamiento local.

## ⚔️ Desafío: Ingesta Masiva y Bloqueo de UI
**Fecha**: 2026-04-18
**Problema**: La carga de archivos de 50MB+ congelaba la pestaña del navegador durante minutos.
**Causa**: El procesamiento de texto y la inserción en BD ocurrían en el hilo principal de ejecución (Main Thread).
**Solución**: Delegación total del motor de ingesta y el indexador a **Web Workers**. La comunicación mediante `postMessage` permite que la interfaz muestre KPIs y progreso en tiempo real (60 FPS) mientras el motor trabaja en segundo plano.

## ⚔️ Desafío: Codificación Hospitalaria Heredada (Legacy)
**Fecha**: 2026-04-27
**Problema**: Caracteres especiales como "ó", "ñ" o "¢" aparecían corruptos en las historias clínicas.
**Causa**: Los sistemas hospitalarios antiguos exportan en formatos como CP850 o ISO-8859-1 en lugar de UTF-8.
**Solución**: Implementación de un detector de codificación resiliente y transcodificadores manuales para mapas de caracteres extendidos, asegurando la integridad semántica del dato clínico.

---
*Este log es un documento vivo de la soberanía técnica de Queryclin.*
