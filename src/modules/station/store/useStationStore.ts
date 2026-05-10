import { create } from 'zustand';
import { Station } from '../types/station';
import { fetchStationsMap } from '../station';

export interface StationState {
  stations: Station[];

  fetchStations: () => Promise<void>;
  updateConnectorStatus: (update: {
    stationId: string;
    connectorId: string;
    connectorNumber: number;
    status: 'Available' | 'Occupied';
  }) => void;
}

export const useStationStore = create<StationState>()(set => ({
  stations: [],

  fetchStations: async () => {
    const stations = await fetchStationsMap();
    set({ stations });
  },

  updateConnectorStatus: (update) => {
    set((state) => ({
      stations: state.stations.map((station) => {
        // Si no es la estación que se actualizó, retornar sin cambios
        if (station.id !== update.stationId) return station;

        // Actualizar la estación con el nuevo estado del conector
        const updatedChargePoints = station.chargePoints.map((chargePoint) => {
          const updatedConnectors = chargePoint.connectors.map((connector) => {
            // Si no es el conector que se actualizó, retornar sin cambios
            if (connector.id !== update.connectorId) return connector;

            // Actualizar el estado del conector
            return {
              ...connector,
              status: update.status,
            };
          });

          // Recalcular contadores de conectores disponibles para este charge point
          const availableCount = updatedConnectors.filter(
            (c) => c.status === 'Available',
          ).length;

          return {
            ...chargePoint,
            connectors: updatedConnectors,
            availableConnectors: availableCount,
          };
        });

        // Recalcular contadores a nivel de estación
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
