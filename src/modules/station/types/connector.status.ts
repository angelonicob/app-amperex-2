// Para mapas (estado simple: disponible u ocupado)
export enum ConnectorStatus {
  Available = 'Available',
  Occupied = 'Occupied',
}

// Para sesiones (estados OCPP detallados)
export enum StatusOCPP {
  Available = 'Available',
  Preparing = 'Preparing',
  Charging = 'Charging',
  SuspendedEV = 'SuspendedEV',
  SuspendedEVSE = 'SuspendedEVSE',
  Finishing = 'Finishing',
  Reserved = 'Reserved',
  Unavailable = 'Unavailable',
  Faulted = 'Faulted',
}
