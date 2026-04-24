# Auditoría de Calidad Queryclin V3.0.0

Este documento detalla el análisis técnico exhaustivo del sistema tras la implementación de la arquitectura Solid-State, identificando riesgos y estableciendo el plan de pruebas de estrés.

## 🔍 Análisis de Riesgos (Arquitectura V3)

### 1. Mapeo de Cabeceras (parser.worker.ts)
- **Riesgo**: Aunque hay una lógica de `findValue`, el sistema depende de palabras clave. Si un CSV usa términos muy crípticos (ej: `COD_PAT`), el NHC fallará.
- **Estado**: **Mejorable**. Se ha añadido `IDENTIFICADOR` y `PACIENTE` a la lista de detección.
- **Acción**: Hemos incluido variaciones "trampa" en el nuevo dataset de test.

### 2. Integridad del Merge (Batalla 6/7)
- **Riesgo**: El ciclo Read-Merge-Write en el Web Worker es atómico por lote, pero si dos lotes procesan al mismo paciente simultáneamente (poco probable pero posible en Web Workers), podría haber colisión.
- **Estado**: **Estable**. IndexedDB maneja transacciones que mitigan esto.

### 3. Lógica Booleana "Strict MUST"
- **Riesgo**: La intersección se hace a nivel de **Paciente** (Skeleton). 
  - *Ejemplo*: Si un paciente tiene "Diabetes" en una toma de 2022 y "Fractura" en una de 2024, la búsqueda `Diabetes AND Fractura` lo encontrará.
- **Estado**: **Correcto**. En HCE se busca el historial global del paciente, no solo eventos aislados.

### 4. Fragmentación (Bucketing)
- **Riesgo**: Términos con más de 2000 coincidencias se dividen en fragmentos (`termino:0`, `termino:1`). Si el buscador falla al reconstruir la lista, perderemos resultados.
- **Estado**: **Crítico**. Requiere verificación exhaustiva con el nuevo dataset.

---

## 🛠️ Plan de Pruebas (Dataset TEST_SUITE_V3)

### T1: Carga y Mapeo
1. Importar `TEST_SUITE_V3.csv`.
2. Verificar que el contador de pacientes es exacto (**50 pacientes únicos**).
3. Entrar en el paciente `NHC-1002` (Lucía). Verificar que su edad (45) se ha extraído de la columna `Anos` y su sexo de la columna `Genero`.

### T2: Búsqueda Booleana y Precisión
| Consulta | Resultado Esperado | Objetivo |
| :--- | :--- | :--- |
| `PNEUMONIA` | 3 resultados | Coincidencia básica |
| `ASMA AND MURCIA` | 1 resultado (NHC-1001) | Intersección Estricta |
| `URGENCIAS NOT DOLOR` | Filtra registros sin dolor | Exclusión NOT |
| `COVID OR GRIPE` | Resultados que contengan cualquiera | Unión OR |
| `pH` | Detecta abreviaturas de 2 letras | Tokenización clínica |

### T3: Integridad de Tomas
1. Buscar `NHC-1001`.
2. Verificar que tiene **3 tomas** (una de 2023 y dos de 2024).
3. Verificar que las tomas aparecen ordenadas por `Orden_Toma`.

### T4: Filtros de Metadatos
1. Buscar nada (vacío).
2. Aplicar filtro de servicio: `ALERGOLOGIA`.
3. Verificar que solo aparecen pacientes que han pasado por ese servicio.

---
*Fin del Reporte de Auditoría - 2026-04-24*
