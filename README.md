# HCE Core - Intelligence

Aplicación web local-first premium para la gestión, búsqueda avanzada y visualización de Historias Clínicas Electrónicas (HCE) a partir de archivos CSV.

## Características de Depuración y UX (v2.0)

- **Modo Oscuro Integrado**: Soporte nativo para temas claro y oscuro para reducir la fatiga visual en entornos clínicos.
- **Navegación Fluida**: Botones de "Anterior" y "Siguiente" dentro de la vista de detalle para saltar entre resultados de búsqueda sin volver al listado.
- **Resaltado Inteligente**: Las palabras clave de la búsqueda se resaltan visualmente en todos los campos de la HCE para una identificación rápida.
- **Arquitectura Local-First**: Máxima privacidad; los datos nunca abandonan el navegador.

## Arquitectura

La aplicación está construida como una SPA estática de alto rendimiento.

### Stack Tecnológico
- **Frontend:** React 19 + TypeScript
- **Estilos:** Tailwind CSS 4 (Glassmorphism & High-Visibility)
- **Iconos:** Lucide React
- **Almacenamiento:** `localStorage` para índice y datos cargados.

## Acceso en Red Local (LAN)

Si deseas acceder a esta aplicación desde otros dispositivos (tablets, móviles u otros PC) dentro de la misma red:

1. **Obtener IP**: En el ordenador donde corre el servidor, abre una terminal y escribe `ipconfig`. Busca la "Dirección IPv4" (ej: `192.168.1.45`).
2. **Acceder**: Desde el otro dispositivo, abre un navegador y navega a `http://<TU_IP_LOCAL>:3000`.

> [!WARNING]
> Si el acceso falla, asegúrate de que el **Firewall** de Windows o de tu organización permite conexiones entrantes en el puerto 3000. En entornos corporativos, esto puede requerir permisos de administrador.

## Uso

1. **Importar Datos:** Sube tu archivo CSV en la pantalla principal.
2. **Buscar:** Usa términos sencillos o complejos (`operación AND corazón`).
3. **Navegar:** Visualiza el detalle y muévete entre pacientes con los controles superiores.
4. **Analizar:** Localiza rápidamente la información crítica gracias al resaltado automático.

## Seguridad
- **Cero APIs Externas:** Procesamiento 100% en el cliente.
- **Privacidad:** Cumple con criterios de seguridad al no transmitir datos sensibles por la red.
