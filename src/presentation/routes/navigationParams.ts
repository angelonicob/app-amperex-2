import type { NavigatorScreenParams } from '@react-navigation/native';

export type ProfileFormStackParams = {
  'Editar perfil': undefined;
};

export type ProfileStackParams = {
  ProfileMain: undefined;
  Formularios: NavigatorScreenParams<ProfileFormStackParams>;
};

export type RootStackParams = {
  Auth: undefined;
  Loading: undefined;
  App: undefined;
  Offline: undefined;
  BackendError: undefined;
  Session: { screen?: keyof SessionStackParams } | undefined;
  CreateReserva: CreateReservationAgendaParams;
  PasswordResetSuccess: undefined;
  LegalDocument: { url: string; title: string };
};

export type CreateReservationAgendaParams = {
  stationId: string;
  stationName: string;
  chargePointConnectorId: string;
  connectorLabel: string;
};

export type BottomTabStackParams = {
  Mapa: { stationId?: string } | undefined;
  QR: undefined;
  /** Tab que abre el drawer lateral (no es una pantalla de contenido). */
  Menu: undefined;
};

export type CarFormStackParams = {
  /** `resumeQrSession`: tras crear vehículo, continuar flujo de carga iniciado por escaneo QR. */
  'Crear auto': { resumeQrSession?: boolean } | undefined;
  'Solicitar vehículo': undefined;
};

export type CarStackParams = {
  'Mis autos': undefined;
  Formularios: NavigatorScreenParams<CarFormStackParams>;
};

export type ReservaStackParams = {
  'Mis reservas': undefined;
};

export type SessionStackParams = {
  Pago: undefined;
  Resumen: undefined;
  Sesión: undefined;
  Parámetros: undefined;
};

/** Rutas del drawer principal (`DrawerHome`). El orden coincide con `Navigator` + ítems del menú. */
export type DrawerHomeParams = {
  Home: NavigatorScreenParams<BottomTabStackParams> | undefined;
  Reservas: undefined;
  Autos: NavigatorScreenParams<CarStackParams> | undefined;
  Perfil: NavigatorScreenParams<ProfileStackParams> | undefined;
  Historial: undefined;
  Tarjetas: undefined;
  Settings: undefined;
};
