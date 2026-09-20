import { randomUUID } from 'node:crypto';

export interface TrackingEvent {
  at: string;
  status: string;
}

export interface CarrierAdapter {
  readonly simulated: boolean;
  label(
    orderId: string,
    service: 'second_class' | 'tracked24',
  ): Promise<{ trackingId: string; carrier: string }>;
  track(trackingId: string): Promise<TrackingEvent[]>;
}

/** Simulated carrier: labels are issued instantly, tracking is a fixed ladder. */
export class SimulatedCarrier implements CarrierAdapter {
  readonly simulated = true;
  async label(orderId: string, service: 'second_class' | 'tracked24') {
    const prefix = service === 'tracked24' ? 'TK' : 'SC';
    return {
      trackingId: `${prefix}${orderId.slice(-4).toUpperCase()}${randomUUID().slice(0, 6).toUpperCase()}`,
      carrier: 'Royal Mail (simulated)',
    };
  }
  async track(trackingId: string): Promise<TrackingEvent[]> {
    const now = new Date().toISOString();
    return [{ at: now, status: `Item ${trackingId} accepted at the sorting office (simulated)` }];
  }
}

export function getCarrier(): CarrierAdapter {
  return new SimulatedCarrier();
}
