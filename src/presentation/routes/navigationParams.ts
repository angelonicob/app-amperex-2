export type ProfileStackParams = {
  ProfileMain: undefined;
  EditProfile: undefined;
};

export type RootStackParams = {
  Auth: undefined;
  Loading: undefined;
  App: undefined;
  Offline: undefined;
  BackendError: undefined;
  Session: { screen?: keyof SessionStackParams } | undefined;
};

export type BottomTabStackParams = {
  Mapa: undefined;
  QR: undefined;
  /** Tab que abre el drawer lateral (no es una pantalla de contenido). */
  Menu: undefined;
};

export type CarStackParams = {
  'Mis autos': undefined;
  'Crear auto': undefined;
  'Solicitar vehículo': undefined;
};

export type ReservaStackParams = {
  'Mis reservas': undefined;
  'Crear reserva': undefined;
  'Editar reserva': undefined;
};

export type SessionStackParams = {
  Pago: undefined;
  Sesión: undefined;
  Parámetros: undefined;
};

/** Rutas del drawer principal (`DrawerHome`). El orden coincide con `Navigator` + ítems del menú. */
export type DrawerHomeParams = {
  Home: undefined;
  Reservas: undefined;
  Autos: undefined;
  Perfil: undefined;
  Historial: undefined;
  Tarjetas: undefined;
  Settings: undefined;
};
