import { create } from 'zustand';
import {
  Station,
  type ConnectionState,
  type OperativeStatus,
} from '../types/station';
import { fetchStationsMap } from '../station';

export interface StationState {
  stations: Station[];

  fetchStations: () => Promise<void>;
  /**
   * Aplica un update parcial desde el WS broadcast.
   * Campos `connectionState`, `chargePointOperativeStatus` y `connectorOperativeStatus`
   * son opcionales: cuando vienen, actualizan los flags del chargePoint/conector
   * para que la UI recalcule el estado "Inactivo" en tiempo real.
   */
  updateConnectorStatus: (update: {
    stationId: string;
    connectorId: string;
    connectorNumber: number;
    status: 'Available' | 'Occupied';
    chargePointId?: string;
    connectionState?: ConnectionState;
    chargePointOperativeStatus?: OperativeStatus;
    connectorOperativeStatus?: OperativeStatus;
    sessionPreparing?: boolean;
  }) => void;
}

export const useStationStore = create<StationState>()(set => ({
  stations: [],

  fetchStations: async () => {
    const stations = await fetchStationsMap();
    set({ stations });
  },

  updateConnectorStatus: update => {
    set(state => ({
      stations: state.stations.map(station => {
        if (station.id !== update.stationId) return station;

        const updatedChargePoints = station.chargePoints.map(chargePoint => {
          const chargePointMatches =
            update.chargePointId == null ||
            chargePoint.id === update.chargePointId;

          const updatedConnectors = chargePoint.connectors.map(connector => {
            if (connector.id !== update.connectorId) return connector;
            return {
              ...connector,
              status: update.status,
              operativeStatus:
                update.connectorOperativeStatus ?? connector.operativeStatus,
              ...(update.sessionPreparing !== undefined
                ? { sessionPreparing: update.sessionPreparing }
                : {}),
            };
          });

          const availableCount = updatedConnectors.filter(
            c => c.status === 'Available',
          ).length;

          return {
            ...chargePoint,
            connectors: updatedConnectors,
            availableConnectors: availableCount,
            operativeStatus: chargePointMatches
              ? (update.chargePointOperativeStatus ??
                chargePoint.operativeStatus)
              : chargePoint.operativeStatus,
            connectionState: chargePointMatches
              ? (update.connectionState ?? chargePoint.connectionState)
              : chargePoint.connectionState,
          };
        });

        const totalAvailable = updatedChargePoints.reduce(
          (sum, cp) => sum + cp.availableConnectors,
          0,
        );

        return {
          ...station,
          chargePoints: updatedChargePoints,
          availableConnectors: totalAvailable,
        };
      }),
    }));
  },
}));
