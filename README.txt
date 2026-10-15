DONNER TURISMO - APP DE GESTIÓN DE VIAJES
Versión 1

ARCHIVOS
- index.html: aplicación principal.
- Code.gs: backend para Google Apps Script.
- manifest.json + sw.js + iconos: permiten instalarla como PWA.

FUNCIONES INCLUIDAS
1. Crear viajes.
2. Cargar costos: hotel, transporte, chofer, coordinador, comidas, excursiones, etc.
3. Cálculo automático cantidad x precio unitario.
4. Registrar pagos por transferencia, efectivo u otro medio.
5. Registrar proveedores/agentes.
6. Calcular total del viaje, pagado, pendiente y costo por pasajero.
7. Exportar el resumen a PDF.
8. Exportar el resumen a Excel.
9. Guardado local automático.
10. Sincronización opcional con Google Sheets mediante Apps Script.

CÓMO SUBIR A GITHUB PAGES
1. Crear un repositorio, por ejemplo DONNER-TURISMO.
2. Subir index.html, manifest.json, sw.js, icon-192.png e icon-512.png.
3. Ir a Settings > Pages.
4. Elegir Deploy from a branch > main / root.
5. Esperar a que GitHub genere el enlace.

CÓMO CONFIGURAR GOOGLE APPS SCRIPT
1. Ir a https://script.google.com
2. Crear un proyecto nuevo.
3. Pegar el contenido de Code.gs.
4. Implementar > Nueva implementación > Aplicación web.
5. Ejecutar como: tú.
6. Quién tiene acceso: Cualquier usuario con el enlace.
7. Copiar la URL que termina en /exec.
8. Abrir Donner > Configuración.
9. Pegar la URL de Apps Script y guardar.

La primera sincronización crea automáticamente una planilla llamada:
"Donner Turismo - Base de datos"

IMPORTANTE
La versión local ya funciona sin Apps Script, pero para usar la misma información en PC y celular es recomendable configurar Apps Script.


NOVEDADES V4 - GESTIÓN DIRECTA DESDE CADA VIAJE
- La pantalla Viajes ahora es el punto de entrada principal.
- Cada viaje tiene un botón "Ingresar".
- Al ingresar a un viaje se abre su panel exclusivo.
- Desde ese panel se pueden cargar:
  * costos del viaje
  * pagos parciales
  * dólares rechazados
- También se visualizan:
  * costos previstos en ARS y USD
  * pagos realizados en ARS y USD
  * saldos pendientes
  * listado de cuentas del viaje
  * historial de pagos
  * dólares rechazados vinculados al viaje
- Ya no es necesario ir primero a las secciones generales para trabajar con un viaje.


NOVEDADES V5 - GASTOS PERSONALIZADOS
- Dentro de cada viaje el botón principal ahora dice "Agregar gasto".
- El nombre del gasto se escribe libremente.
- Ejemplos: estacionamiento, propina chofer, peaje extra, compra de agua, viáticos, etc.
- La categoría queda como una referencia opcional.
- Se agregó la categoría "Personalizado / Otro".


NOVEDADES V6 - COMPROBANTES EN GOOGLE DRIVE
- Dentro de cada viaje se agregó la sección "Comprobantes del viaje".
- Permite subir imágenes o archivos PDF.
- Cada comprobante registra:
  * fecha
  * gasto asociado (opcional)
  * detalle de lo que se está pagando
  * destinatario
  * moneda (ARS o USD)
  * monto
  * observaciones
  * enlace al archivo en Google Drive
- Los archivos se guardan en una carpeta raíz:
  "Donner Turismo - Comprobantes"
- Dentro de esa carpeta se crea automáticamente una subcarpeta por viaje.
- El archivo queda privado en Google Drive salvo que el propietario comparta la carpeta manualmente.
- La app reduce automáticamente las imágenes grandes antes de subirlas.
- Subir un comprobante NO suma un pago al saldo; el pago se registra por separado para evitar duplicaciones.
- La hoja "Comprobantes" en Google Sheets guarda los metadatos y enlaces.

IMPORTANTE AL ACTUALIZAR APPS SCRIPT:
1. Reemplazar el Code.gs anterior por el Code.gs de esta versión.
2. Ir a Implementar > Administrar implementaciones.
3. Editar la implementación.
4. Elegir "Nueva versión".
5. Implementar.
6. Mantener la misma URL /exec en la app.
7. La primera vez que se suba un comprobante, Google pedirá autorizar acceso a Drive.

Si se quiere usar una carpeta de Drive específica:
- Abrir Code.gs.
- Pegar su ID en RECEIPTS_ROOT_FOLDER_ID.
- Si se deja vacío, el sistema crea automáticamente "Donner Turismo - Comprobantes".


NOVEDADES V7 - APPS SCRIPT YA CONECTADO
La aplicación ya incluye por defecto esta URL:
https://script.google.com/macros/s/AKfycbzrD0_wO5CFsyGts6WrAEAsG4VGBa8a2y7Y-Htt46tndjR3BvwTqrijJGH5fqMqFhcGXA/exec

No hace falta copiarla manualmente en Configuración.

Se agregó el botón:
"Probar conexión"

IMPORTANTE:
La implementación de Apps Script debe estar configurada como aplicación web y permitir acceso a:
"Cualquier usuario" / "Anyone"

Si la implementación requiere inicio de sesión, una app alojada en GitHub Pages puede no lograr sincronizar correctamente.


NOVEDADES V8 - DISEÑO MÓVIL
- Se rediseñó la interfaz para usar Donner cómodamente desde celular.
- Ya no es necesario alejar/acercar con zoom para leer tablas.
- Las tablas se convierten automáticamente en tarjetas verticales en pantallas pequeñas.
- Los formularios pasan a una sola columna.
- Botones e inputs más grandes para tocar con el dedo.
- Menú superior desplazable horizontalmente.
- Mejor visualización de montos largos en ARS y USD.
- Los modales ocupan correctamente el ancho del teléfono.
- Se mantiene la versión de escritorio sin cambios importantes.


NOVEDADES V9 - GASTOS POR PASAJERO
- Al agregar un gasto se puede elegir:
  * Por pasajero
  * Total del grupo
- "Por pasajero" multiplica automáticamente el monto ingresado por la cantidad de pasajeros del viaje.
- Ejemplo: 40 pasajeros x $30.000 = $1.200.000 de costo total.
- "Total del grupo" toma el monto directamente, útil para colectivo, peajes, alquileres u otros gastos fijos.
- La app muestra el cálculo antes de guardar.
- PDF y Excel incluyen la forma en que se calculó cada gasto.


NOVEDADES V10 - CANTIDAD DE PASAJEROS POR CADA GASTO
- Al elegir "Por pasajero", la app pregunta cuántos pasajeros corresponden a ESE gasto.
- El campo se completa inicialmente con la cantidad total del viaje, pero se puede modificar.
- Ejemplo: 42 pasajeros x $30.000 = $1.260.000.
- Esto permite que algunos gastos correspondan a todos los pasajeros y otros solo a una parte del grupo.
- Al elegir "Total del grupo", no se pide cantidad de pasajeros.


NOVEDADES V11 - ACTUALIZACIÓN AUTOMÁTICA EN CELULAR
- Se corrigió el caché de la PWA.
- La app ahora busca la versión nueva del index.html antes de usar una copia vieja.
- Al instalar una nueva versión elimina los cachés anteriores.
- En Configuración se agregó "Actualizar app".
- El pie de pantalla muestra V11 para verificar que el celular está usando la versión correcta.
- Esta versión mantiene la carga de gastos por pasajero con cantidad editable.


NOVEDADES V12 - CORRECCIÓN REGISTRO DE PAGOS
- Se restauró la función savePayment, que se había perdido durante una actualización.
- Registrar pago vuelve a guardar correctamente:
  * viaje
  * gasto asociado
  * fecha
  * destinatario
  * concepto
  * medio de pago
  * moneda
  * monto
  * comprobante
  * observaciones
- Valida que el pago no supere el saldo pendiente.
- Después de guardar muestra una confirmación con:
  * monto pagado
  * saldo pendiente restante
- El pago se guarda localmente y se sincroniza con Google Sheets.
