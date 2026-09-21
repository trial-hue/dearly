import { describe, expect, it } from 'vitest';

import { addDays } from '../calendar';
import { scheduleFor } from '../notifications';

const today = new Date(2026, 8, 23);

describe('scheduleFor', () => {
  it('gives five steps for an occasion 30 days away', () => {
    const steps = scheduleFor(addDays(today, 30), today, false);
    expect(steps.map((s) => s.step)).toEqual(['d21', 'd14', 'd7', 'd3', 'd1']);
    expect(steps[0]!.scheduledFor).toEqual(new Date(2026, 9, 2, 9, 0, 0));
  });
  it('drops steps already in the past: 10 days away gives d7, d3, d1', () => {
    expect(scheduleFor(addDays(today, 10), today, false).map((s) => s.step)).toEqual([
      'd7',
      'd3',
      'd1',
    ]);
  });
  it('gives nothing for an occasion today', () => {
    expect(scheduleFor(today, today, false)).toEqual([]);
  });
  it('gives nothing for a paused person', () => {
    expect(scheduleFor(addDays(today, 30), today, true)).toEqual([]);
  });
  it('keeps a step that falls today', () => {
    expect(scheduleFor(addDays(today, 7), today, false).map((s) => s.step)).toEqual([
      'd7',
      'd3',
      'd1',
    ]);
  });
});
