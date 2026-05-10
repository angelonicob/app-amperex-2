# AmperEX

App móvil [Expo](https://expo.dev) (React Native) para AmperEX.

## Requisitos

- Node.js y npm
- [EAS CLI](https://docs.expo.dev/build/setup/) (`npm install -g eas-cli`) para builds
- Cuenta en [Expo](https://expo.dev) y proyecto vinculado

## Desarrollo

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Arrancar el proyecto:

   ```bash
   npx expo start
   ```

   Luego puedes abrir en [development build](https://docs.expo.dev/develop/development-builds/introduction/), emulador Android, simulador iOS, etc.

## EAS Build

Builds en la nube con [Expo Application Services](https://docs.expo.dev/build/introduction/). Los perfiles están en `eas.json`.

| Perfil | Uso |
|--------|-----|
| `development` | Build de desarrollo (dev client), distribución interna |
| `preview` | Build de pruebas (internal testing) |
| `production` | Build para stores (auto-incremento de versión) |
| `development-simulator` | Build de desarrollo solo para simulador iOS |

Los perfiles `development`, `preview` y `production` usan `environment` en `eas.json` para enlazar variables en [expo.dev](https://expo.dev) (mismos nombres: `development`, `preview`, `production`).

### Android: `google-services.json` en EAS Build

El archivo en `keys/` no se sube a Git; en la nube hay que darlo a EAS como **variable de entorno tipo archivo**.

1. En **expo.dev** → tu proyecto → **Environment variables** → **Add variable** (o equivalente).
2. Rellena así:

| Campo | Qué poner |
|--------|-----------|
| **Name** | `GOOGLE_SERVICES_JSON` (exactamente; es lo que lee `app.config.js`) |
| **Type** | **File** (archivo), no “plain text”. |
| **Upload file** | Tu `google-services.json` descargado de Firebase (mismo package que `android.package` en `app.json`). |
| **Value** | Si la UI lo deja vacío al elegir File, déjalo vacío. Si obliga a texto, suele ignorarse en favor del archivo subido; lo importante es el **upload**. |
| **Visibility** | **Secret** (recomendado: no se muestra en logs ni en la UI pública). |

3. Asocia la variable al **entorno** que use el perfil del build:

| Perfil EAS (`eas build --profile …`) | Entorno en el que debe existir `GOOGLE_SERVICES_JSON` |
|--------------------------------------|--------------------------------------------------------|
| `development` | `development` |
| `preview` | `preview` |
| `production` | `production` |

Puedes usar el **mismo** archivo en los tres entornos o uno distinto por entorno.

4. Vuelve a lanzar `eas build`. En local sigue valiendo `./keys/google-services.json` si no defines la variable.

### Comandos

Build para ambas plataformas (te pregunta cuál elegir si no especificas):

```bash
eas build --profile development
eas build --profile preview
eas build --profile production
```

Solo Android:

```bash
eas build --profile development --platform android
eas build --profile preview --platform android
eas build --profile production --platform android
```

Solo iOS:

```bash
eas build --profile development --platform ios
eas build --profile preview --platform ios
eas build --profile production --platform ios
```

Simulador iOS (solo para desarrollo local):

```bash
eas build --profile development-simulator --platform ios
```

Build para Android e iOS en un solo comando:

```bash
eas build --profile production --platform all
```

### Envío a stores (submit)

```bash
eas submit --platform android   # o ios
eas submit --platform all
```

## Otros comandos

```bash
npm run reset-project   # Reinicia el proyecto (mueve código a app-example)
npm run lint            # Linter
npm run android         # expo run:android
npm run ios             # expo run:ios
```

## Documentación

- [Expo](https://docs.expo.dev/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [Development builds](https://docs.expo.dev/develop/development-builds/introduction/)
