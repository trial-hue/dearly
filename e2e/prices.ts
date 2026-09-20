/**
 * Prices asserted by the e2e specs come from the domain, never from literals, so the specs follow
 * src/domain/constants.ts.
 */
import {
  BUSINESS,
  DIGITAL,
  MODES,
  PICKUP_PROMISE,
  formatPence,
  quote,
  toPence,
} from '../src/domain';

const total = (input: Parameters<typeof quote>[0]) => formatPence(quote(input).totalPence);

export const PRICES = {
  regularSignatureAdvance: total({ size: 'regular', finish: 'signature', mode: 'advance' }),
  regularSignatureTracked: total({ size: 'regular', finish: 'signature', mode: 'tracked' }),
  regularClassicPickup: total({ size: 'regular', finish: 'classic', mode: 'pickup' }),
  largeSignatureAdvance: total({ size: 'large', finish: 'signature', mode: 'advance' }),
  largeSignatureTracked: total({ size: 'large', finish: 'signature', mode: 'tracked' }),
  regularSignatureAdvanceDigital: total({
    size: 'regular',
    finish: 'signature',
    mode: 'advance',
    digital: true,
  }),
  regularLuxeAdvance: total({ size: 'regular', finish: 'luxe', mode: 'advance' }),
  digitalCopy: formatPence(toPence(DIGITAL.paired)),
  businessPosted: formatPence(toPence(BUSINESS.posted)),
  businessTier250: formatPence(toPence(BUSINESS.tier250)),
  businessTier2000: formatPence(toPence(BUSINESS.tier2000)),
  businessOfficeDrop: formatPence(toPence(BUSINESS.officeDrop)),
  automateMonthly: formatPence(toPence(BUSINESS.automateMonthly)),
  moonpigBusiness: formatPence(toPence(BUSINESS.moonpigPerCard)),
  largeLuxeAdvance: total({ size: 'large', finish: 'luxe', mode: 'advance' }),
  ecard: total({ size: 'regular', finish: 'signature', mode: 'ecard' }),
  pickupDelivery: formatPence(toPence(MODES.pickup.price.regular)),
  giantTrackedDelivery: formatPence(toPence(MODES.tracked.price.giant)),
  moonpigAdvance: formatPence(
    quote({ size: 'regular', finish: 'signature', mode: 'advance' }).moonpigPence ?? 0,
  ),
  moonpigSavingSignatureAdvance: formatPence(
    quote({ size: 'regular', finish: 'signature', mode: 'advance' }).savingPence ?? 0,
  ),
  pickupPromise: PICKUP_PROMISE.replace(/\.$/, ''),
};
