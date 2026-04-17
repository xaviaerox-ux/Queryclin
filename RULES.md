# Reglas Estrictas del Proyecto (Queryclin)

Este documento contiene las directrices fundamentales e inviolables para el desarrollo de este proyecto. Ningún agente ni desarrollador debe ignorar estas reglas. Este archivo actúa como la "Constitución" del repositorio.

## 1. Actualización Continua del Changelog
- **Regla:** Todo cambio procesado (bugs, features, refactorizaciones) **DEBE** registrarse de manera autónoma en `CHANGELOG.md`.
- **Formato:** Los registros deben ser cronológicos, detallando archivos modificados y el motivo técnico/clínico de la decisión.

## 2. Actualización Incremental del Roadmap (README.md)
- **Regla:** Cada hito superado debe trasladarse de "En Progreso" a "Completado" en el `README.md` de forma inmediata. El README debe ser una radiografía veraz del estado tecnológico actual.

## 3. Identidad del Proyecto (Queryclin)
- **Regla:** El proyecto tiene el nombre oficial y exclusivo de **Queryclin**. No se deben usar nombres anteriores (HCE Core, etc.) en código, comentarios o documentación.

## 4. Persistencia e Interoperabilidad (IA)
- **Regla:** Cualquier asistente de IA que acceda a este repositorio debe leer este archivo `RULES.md` y el archivo `.cursorrules` para configurar su comportamiento según estas directrices.

## 5. Principio de Escala y Resiliencia (v3)
- **Regla:** Dado el volumen de datos objetivo (100k registros), se priorizará siempre el procesamiento asíncrono y la persistencia fragmentada en base de datos local.

## 6. Fidelidad del Dato Clínico
- **Regla:** Se prohíbe renombrar, traducir o normalizar destructivamente los campos originales del CSV. El sistema debe ser un reflejo exacto de la fuente de datos.
- **Lenguaje:** La comunicación debe ser siempre sobria, profesional y técnica.
