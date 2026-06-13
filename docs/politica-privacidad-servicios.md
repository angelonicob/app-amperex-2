# Política de privacidad — referencia técnica (AmperEX)

Borrador de apoyo para la política de privacidad pública de la app móvil **AmperEX**. Debe revisarse y completarse con asesoría jurídica antes de publicar en web o tiendas.

| | |
|---|---|
| **Responsable del tratamiento** | **AmperEX SpA** |
| **Producto** | App móvil AmperEX (`com.amperexspa.AmperEX`) |
| **País de operación** | Chile |
| **Stack** | React Native + [Expo](https://expo.dev) SDK 55 |
| **Última revisión** | Junio 2026 |

---

## 1. Qué datos recopila la app

AmperEX SpA trata los siguientes datos cuando usas la aplicación. Algunos los ingresas tú; otros se generan al usar el servicio; otros son técnicos y necesarios para el funcionamiento.

### 1.1 Datos de registro y perfil

| Dato | Origen | Uso |
|------|--------|-----|
| Correo electrónico | Registro / perfil | Cuenta, inicio de sesión, recuperación de contraseña |
| Contraseña | Registro | Autenticación (gestionada por Firebase; no en texto plano en servidores AmperEX) |
| Nombre y apellido | Registro / perfil | Identificación en la cuenta |
| Teléfono | Perfil (opcional) | Contacto asociado a la cuenta |
| Identificador de usuario | Sistema | UUID interno en plataforma AmperEX + UID en Firebase |

### 1.2 Datos del servicio de carga

| Dato | Origen | Uso |
|------|--------|-----|
| Vehículos (marca, modelo, variante, batería) | Perfil / selección en carga | Asociar sesiones y estimaciones |
| Historial de sesiones | Uso del servicio | Energía (kWh), duración, costo, estación, fechas |
| Reservas | Uso del servicio | Horario, estación, conector, confirmación de asistencia |
| Token QR escaneado | Cámara | Iniciar sesión en un punto de carga (no se suben fotos ni vídeo) |
| Estado del conector | Backend / tiempo real | Flujo de conexión del vehículo al cargador |

### 1.3 Datos de pago

| Dato | Origen | Uso |
|------|--------|-----|
| Tarjetas inscritas (últimos 4 dígitos, tipo, alias) | Transbank One Click | Cobro de cargas |
| Montos y estado de transacciones | Uso del servicio | Facturación, deudas pendientes, historial de pago |

**No se almacenan en el dispositivo** el número completo de tarjeta (PAN) ni el CVV.

### 1.4 Datos técnicos y del dispositivo

| Dato | Origen | Uso |
|------|--------|-----|
| Token de notificaciones push (Expo / FCM / APNs) | Permiso de notificaciones | Avisos de reservas y carga |
| Identificador de dispositivo por instalación | Generado en el teléfono | Una sesión de carga activa por dispositivo |
| Tokens de sesión (Firebase) | Inicio de sesión | Autenticación con la API AmperEX |
| Plataforma y versión de la app | Sistema | Soporte y pantalla de ajustes |
| Preferencia de tema (claro / oscuro) | Ajustes | Experiencia de usuario en el dispositivo |

### 1.5 Ubicación

| Dato | Origen | Uso |
|------|--------|-----|
| Coordenadas GPS (en uso) | Permiso de ubicación | Centrar el mapa y ver estaciones cercanas **en el dispositivo** |

Hoy **no** existe un envío continuo de ubicación al servidor; el permiso sirve para la experiencia del mapa en la app.

### 1.6 Permisos del dispositivo (sin datos biométricos en servidor)

| Permiso | Para qué | ¿Se envía al servidor? |
|---------|----------|-------------------------|
| Cámara | Escanear QR en estaciones | Solo el token del QR |
| Ubicación | Mapa de estaciones | No de forma continua |
| Notificaciones | Avisos operativos | Token push |
| Face ID / huella / PIN del equipo | Confirmar pagos One Click | No (validación solo local) |

**No se solicita:** micrófono, contactos, galería ni Bluetooth.

### 1.7 Lo que la app no recopila activamente

- Publicidad ni seguimiento entre apps  
- Analítica de producto (no hay SDK de analytics activo en el código actual)  
- Imágenes ni grabaciones de la cámara (solo lectura de códigos QR)

---

## 2. Servicios que utiliza la app

Además de la **plataforma propia de AmperEX SpA** (API REST y WebSocket en `app.amperex.cl`), la app integra los proveedores siguientes.

### 2.1 Servicios documentados en el README del proyecto

Estos aparecen en [`README.md`](../README.md) como parte del stack de desarrollo y distribución:

| Servicio | Uso en AmperEX |
|----------|----------------|
| **[Expo](https://expo.dev)** | Framework de la app React Native, notificaciones, cámara, ubicación, almacenamiento seguro, builds |
| **[Expo Application Services (EAS)](https://docs.expo.dev/build/introduction/)** | Compilación en la nube (`eas build`), perfiles `development`, `preview`, `production` |
| **[expo.dev](https://expo.dev)** | Proyecto vinculado, variables de entorno y secretos de build |
| **[EAS CLI](https://docs.expo.dev/build/setup/)** | Herramienta de línea de comandos para builds y submit a tiendas |
| **[Development builds](https://docs.expo.dev/develop/development-builds/introduction/)** | Entorno de desarrollo y pruebas en dispositivo |
| **[Firebase](https://firebase.google.com)** (`google-services.json`) | Cloud Messaging en Android para notificaciones push; proyecto Firebase asociado al package de la app |
| **App Store / Google Play** (vía `eas submit`) | Distribución de la app en tiendas oficiales |

### 2.2 Servicios de terceros en tiempo de ejecución

| Servicio | Finalidad | Datos compartidos (resumen) | Política del proveedor |
|----------|-----------|----------------------------|------------------------|
| **Google Firebase Authentication** | Registro e inicio de sesión con correo y contraseña | Email, credenciales de acceso, UID, tokens | [Firebase Privacy](https://firebase.google.com/support/privacy) |
| **Expo Push Notifications** | Envío de notificaciones desde el backend | Token push Expo | [Expo Privacy](https://expo.dev/privacy) |
| **Firebase Cloud Messaging (FCM)** | Canal push en Android | Token FCM | [Google Privacy](https://policies.google.com/privacy) |
| **Apple Push Notification service (APNs)** | Canal push en iOS | Token APNs | [Apple Privacy](https://www.apple.com/legal/privacy/) |
| **Google Maps Platform** | Mapa de estaciones de carga | Peticiones de mapa, región visible | [Google Maps Terms](https://cloud.google.com/maps-platform/terms) |
| **Transbank — Webpay One Click** | Inscripción de tarjetas y cobro | Datos de pago tokenizados, montos (vía backend AmperEX) | [Transbank](https://www.transbank.cl) |
| **Correo transaccional** (backend AmperEX) | Recuperación de contraseña | Correo electrónico | Definir proveedor de correo en política corporativa |

### 2.3 Plataforma propia — AmperEX SpA

| Componente | Descripción |
|------------|-------------|
| **API móvil** | `https://app.amperex.cl/api/v1/mobile` — usuario, vehículos, estaciones, reservas, sesiones, pagos, notificaciones |
| **WebSocket** | `wss://…/sessions` — progreso de carga en tiempo real |
| **Cabeceras de seguridad** | `Authorization` (token Firebase), `X-Amperex-Client: mobile`, `X-Amperex-Device-Id` |

---

## 3. Finalidades del tratamiento

AmperEX SpA usa los datos para:

1. Crear y administrar tu cuenta  
2. Permitir reservas, inicio y fin de sesiones de carga  
3. Mostrar estaciones en el mapa y escanear QR en puntos de carga  
4. Cobrar las cargas y gestionar deudas pendientes  
5. Enviar notificaciones sobre reservas y sesiones  
6. Proteger el servicio (autenticación, un dispositivo activo por sesión, límites de uso)  
7. Cumplir obligaciones legales (p. ej. conservación de datos de facturación)

---

## 4. Almacenamiento en tu dispositivo

| Tecnología | Qué guarda localmente |
|------------|----------------------|
| **Secure Store (Expo)** | ID de dispositivo, preferencia de tema |
| **AsyncStorage** | Sesión Firebase |
| **Memoria de la app** | Estado temporal de carga, reservas y notificaciones visibles |

Al cerrar sesión se revoca la autenticación Firebase. Parte de la información puede permanecer hasta desinstalar la app.

---

## 5. Conservación, eliminación y derechos

| Acción en la app | Efecto |
|------------------|--------|
| **Eliminar cuenta** (Ajustes) | Desactivación en servidores AmperEX; reautenticación en Firebase si aplica; el historial de cargas puede conservarse de forma anonimizada según política interna |
| **Cerrar sesión** | Fin de sesión Firebase y limpieza de estado de carga activa |
| **Revocar permisos** | Desde ajustes del sistema operativo (cámara, ubicación, notificaciones) |

Los titulares pueden solicitar acceso, rectificación o supresión contactando a AmperEX SpA (completar correo de privacidad en la versión publicada).

**Transferencias internacionales:** al usar Google (Firebase, Maps, FCM), Apple (APNs, App Store) y Expo, algunos datos pueden procesarse fuera de Chile. La política pública debe describir las salvaguardas aplicables.

---

## 6. Textos mostrados al usuario (coherencia con tiendas)

| Permiso | Mensaje en la app |
|---------|-------------------|
| Cámara | «La app necesita acceso a la cámara para escanear códigos QR.» |
| Ubicación | «La app necesita tu ubicación para mostrarla en el mapa.» |
| Face ID | «Usar Face ID para autorizar pagos con tu tarjeta inscrita.» |

---

## 7. Pendiente para la política publicada

Completar con asesoría legal de **AmperEX SpA**:

- [ ] RUT y domicilio social  
- [ ] Correo de contacto de privacidad (p. ej. `privacidad@amperex.cl`)  
- [ ] URL pública de la política y fecha de vigencia  
- [ ] Plazos de retención de historial de carga y pagos  
- [ ] Proveedor de correo transaccional del backend  
- [ ] Edad mínima de uso  
- [ ] Revisión si se incorporan analytics, crash reporting u otros SDKs

---

*Documento basado en el código de `app-amperex-2`, el [`README.md`](../README.md) del proyecto y la integración con `amperex-backend`. Actualizar cuando cambien permisos, proveedores o flujos de datos.*
