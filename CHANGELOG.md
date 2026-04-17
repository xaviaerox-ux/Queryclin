# CHANGELOG

Todos los cambios notables realizados en el proyecto Queryclin serán documentados en este archivo, detallando el efecto del cambio y el motivo (el "por qué") de forma cronológica.

## [2026-04-17]
### Agregado (Despliegue y CI/CD)
- **Habilitación de GitHub Pages:**
  - **Archivos Modificados:** `vite.config.ts`, `.github/workflows/deploy.yml` (nuevo).
  - **Detalle:** Configuración de la ruta base y creación de un Workflow de GitHub Actions para el despliegue automático de la aplicación.
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
