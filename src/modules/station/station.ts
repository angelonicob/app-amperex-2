import { api } from '../../infrastructure/http/Api';
import { Station } from './types/station';
import type { StationResponse } from './station.responses';

export const fetchStationsMap = async (): Promise<Station[]> => {
  try {
    const { data } = await api.get<StationResponse[]>('stations/map');
    if (!data || !Array.isArray(data)) {
      return [];
    }

    // El backend ya devuelve los datos en el formato correcto
    // Solo necesitamos mapear los campos que vienen como string/number
    return data.map(station => ({
      id: station.id,
      name: station.name,
      token: station.token,
      latitude: station.latitude,
      longitude: station.longitude,
      openAt: station.openAt ?? null,
      closeAt: station.closeAt ?? null,
      operativeStatus: station.operativeStatus,
      chargePoints: station.chargePoints.map(chargePoint => ({
        id: chargePoint.id,
        name: (chargePoint.name ?? '').trim() || chargePoint.ocppId,
        ocppId: chargePoint.ocppId,
        connectors: chargePoint.connectors.map(connector => ({
          id: connector.id,
          connectorId: connector.connectorId,
          status: connector.status,
          powerKw: connector.powerKw || null,
          price: connector.price ?? null,
          connectorType: connector.connectorType ?? null,
        })),
        availableConnectors: chargePoint.availableConnectors,
        totalConnectors: chargePoint.totalConnectors,
      })),
      totalChargePoints: station.totalChargePoints,
      totalConnectors: station.totalConnectors,
      availableConnectors: station.availableConnectors,
    }));
  } catch (error) {
    console.error('Error fetching stations map:', error);
    return [];
  }
};
