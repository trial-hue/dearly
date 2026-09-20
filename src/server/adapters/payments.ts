import { randomUUID } from 'node:crypto';

export interface PaymentsAdapter {
  readonly name: string;
  readonly simulated: boolean;
  authorise(amountPence: number, reference: string): Promise<{ authId: string }>;
  capture(authId: string, amountPence: number): Promise<{ paymentId: string }>;
  refund(paymentId: string, amountPence: number): Promise<{ refundId: string }>;
}

/** Default adapter: records nothing outside the database. A real PSP implements the same interface. */
export class SimulatedPayments implements PaymentsAdapter {
  readonly name = 'Simulated payments';
  readonly simulated = true;
  async authorise(_amountPence: number, _reference: string) {
    return { authId: `auth_${randomUUID().slice(0, 8)}` };
  }
  async capture(_authId: string, _amountPence: number) {
    return { paymentId: `pay_${randomUUID().slice(0, 8)}` };
  }
  async refund(_paymentId: string, _amountPence: number) {
    return { refundId: `ref_${randomUUID().slice(0, 8)}` };
  }
}

export function getPayments(): PaymentsAdapter {
  return new SimulatedPayments();
}
