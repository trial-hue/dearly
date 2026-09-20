import { randomUUID } from 'node:crypto';

export interface PrintJobRef {
  jobId: string;
  printerId: string;
}

export interface PrinterAdapter {
  readonly simulated: boolean;
  submit(orderId: string, printerId: string): Promise<PrintJobRef>;
  status(job: PrintJobRef): Promise<'queued' | 'printing' | 'printed'>;
  inspectionPhoto(job: PrintJobRef): Promise<{ score: number; note: string }>;
}

/** Simulated partner printers: instant acceptance, a deterministic inspection score. */
export class SimulatedPrinters implements PrinterAdapter {
  readonly simulated = true;
  async submit(orderId: string, printerId: string): Promise<PrintJobRef> {
    return { jobId: `prt_${orderId.slice(-4)}_${randomUUID().slice(0, 4)}`, printerId };
  }
  async status(): Promise<'printed'> {
    return 'printed';
  }
  async inspectionPhoto(job: PrintJobRef) {
    // Deterministic per job so re-runs look consistent: 0.93 to 0.99.
    let h = 0;
    for (const ch of job.jobId) h = (h * 31 + ch.charCodeAt(0)) % 7;
    const score = 0.93 + h / 100;
    return {
      score,
      note: 'Colour, alignment and fold checked against the proof (simulated photo).',
    };
  }
}

export function getPrinters(): PrinterAdapter {
  return new SimulatedPrinters();
}
