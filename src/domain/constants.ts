// Product constants. Prices are in pounds as decided by the product team; the domain converts
// them to integer pence at the edge (see money.ts) so no arithmetic runs on floats.

export const SIZES = {
  regular: { label: 'Regular', note: '132 × 185 mm', minPx: 1200 },
  large: { label: 'Large', note: 'A4', minPx: 1800 },
  giant: { label: 'Giant', note: 'A3, tracked only', minPx: 2600 },
} as const;

export const FINISHES = {
  classic: { label: 'Classic', note: '300gsm, smooth' },
  signature: { label: 'Signature', note: '350gsm, matt varnish, writable inside' },
  luxe: { label: 'Luxe', note: '400gsm textured, lined envelope' },
} as const;

export const PRICE = {
  regular: { classic: 2.99, signature: 3.99, luxe: 6.49 },
  large: { classic: 4.99, signature: 6.49, luxe: 8.99 },
  giant: { classic: 9.99, signature: 11.99, luxe: 14.99 },
} as const; // inc VAT

export const PRINT_COST = {
  regular: { classic: 0.67, signature: 0.8, luxe: 1.45 },
  large: { classic: 1.22, signature: 1.45, luxe: 2.3 },
  giant: { classic: 3.3, signature: 3.6, luxe: 4.4 },
} as const; // ex VAT, includes mailer

export const MODES = {
  advance: {
    label: 'Advance post',
    desc: 'Second class, sent early',
    price: { regular: 0.95, large: 1.95 },
    cost: { regular: 0.88, large: 1.55 },
    guarantee: true,
  },
  tracked: {
    label: 'Tracked',
    desc: 'Next day, tracked',
    price: { regular: 2.75, large: 3.75, giant: 3.99 },
    cost: { regular: 2.3, large: 2.9, giant: 3.55 },
    guarantee: true,
  },
  pickup: {
    label: 'Pick-up',
    desc: 'Printed at a partner shop near them',
    price: { regular: 1.95 },
    cost: {},
    guarantee: false,
  },
  ecard: { label: 'eCard', desc: 'Sent by link today', price: {}, cost: {}, guarantee: false },
} as const;

/** What the customer is told about pick-up timing (never "arrives"). */
export const PICKUP_PROMISE = 'Ready today, within 2 hours';

/** Pick-up replaces the print cost: the partner shop's payout plus the stock Dearly supplies (ex VAT). */
export const PICKUP = {
  partnerPayout: 1.75,
  stock: 0.25,
  finishes: ['classic', 'signature'],
  sizes: ['regular'],
} as const;

export const DIGITAL = { paired: 0.29, standalone: 0.79 } as const;

/** First card free: once per account, Regular Classic or Signature, card price only, needs this many reminder dates. */
export const FIRST_CARD_FREE = {
  minReminders: 3,
  sizes: ['regular'],
  finishes: ['classic', 'signature'],
} as const;

export const GIFTS = [
  { id: 'none', label: 'No gift', price: 0 },
  { id: 'flowers', label: 'Letterbox flowers', price: 24 },
  { id: 'choc', label: 'Box of chocolates', price: 14 },
  { id: 'fizz', label: 'Mini fizz and truffles', price: 19 },
  { id: 'plant', label: 'Potted plant', price: 22 },
] as const;

export const GIFT_COST_SHARE = 0.62; // of ex-VAT gift price

export const BUSINESS = {
  posted: 3.3,
  officeDrop: 2.3,
  tier250: 3.1,
  tier2000: 2.8,
  automateMonthly: 49,
  freeCards: 25,
  moonpigPerCard: 3.6,
  paymentPct: 0.01, // of the invoice
  finishes: ['classic', 'signature'],
} as const; // ex VAT, Regular size

export const BUSINESS_COSTS = {
  officeDropDelivery: 0.18, // per card, ex VAT
} as const;

/** Florist partners: fee owed per new account, commission owed to Dearly on the flower basket. */
export const FLORIST = { referralFee: 1.5, commissionPct: 7, sampleBasket: 35 } as const;

/** The guarantee: a missed date refunds the order in full and issues a single-use code for this share off the card price of the next order. */
export const GUARANTEE = { nextCardDiscountPct: 0.5 } as const;

/** Royal Mail stamp prices used only for the "postage saved" estimate on Operations. */
export const STAMPS = { firstClass: 1.8, secondClass: 0.91 } as const;

/** The finish mix behind the blended contribution and break-even on Operations (Regular, advance post). */
export const BLEND = { classic: 0.2, signature: 0.6, luxe: 0.2 } as const;

export const MOONPIG = { card: 3.99, firstClass: 1.9, tracked: 2.79 } as const; // printed Regular cards only; never Large or Giant

export const DEFAULT_COSTS = {
  payPct: 0.015,
  payFixed: 0.2,
  ai: 0.05,
  service: 0.08,
  guarantee: 0.1,
  teamPerYear: 330000,
};

export const RULES = {
  proposalWindowDays: 35,
  laterWindowDays: 150,
  inventoryYears: 3,
  inventoryWarnDays: 20,
  addressStaleDays: 365,
  ratingWeight: 20,
} as const;

export const FORECAST = {
  ordersPerCustomerYear: 4,
  split: { advance: 0.72, tracked: 0.2, pickup: 0.08 },
  peaks: {
    christmas: { from: '11-24', to: '12-14', multiplier: 2.6, label: 'Christmas ordering' },
    valentine: { from: '02-07', to: '02-13', multiplier: 1.8, label: 'Valentine week' },
    mothersDay: { daysBefore: 7, multiplier: 2.4, label: "Week before Mother's Day" },
  },
} as const;

export const FEASTS = {
  // approximate; label Eid "subject to moon sighting"
  diwali: ['2026-11-08', '2027-10-29', '2028-10-17', '2029-11-05'],
  hanukkah: ['2026-12-04', '2027-12-24', '2028-12-12', '2029-12-01'],
  eid: ['2027-03-10', '2028-02-27', '2029-02-14'],
  mothers_day: ['2027-03-07', '2028-03-26', '2029-03-11'],
} as const;

export const FIXED = { christmas: '12-25', womens_day: '03-08' } as const;

export const TITLES = {
  birthday: 'Happy birthday',
  anniversary: 'Happy anniversary',
  mothers_day: "Happy Mother's Day",
  womens_day: "Happy Women's Day",
  eid: 'Eid Mubarak',
  hanukkah: 'Happy Hanukkah',
  diwali: 'Happy Diwali',
  christmas: 'Merry Christmas',
  thank_you: 'Thank you',
  work_anniversary: 'Happy work anniversary',
  leaving: 'Good luck',
} as const;

export const DESIGN_FOR = {
  birthday: 'balloons',
  anniversary: 'hearts',
  mothers_day: 'tulips',
  womens_day: 'tulips',
  eid: 'crescent',
  hanukkah: 'menorah',
  diwali: 'diya',
  christmas: 'tree',
  thank_you: 'wreath',
  work_anniversary: 'confetti',
  leaving: 'sun',
} as const;

export const DESIGNS = [
  'balloons',
  'confetti',
  'bignumber',
  'wreath',
  'tulips',
  'crescent',
  'menorah',
  'diya',
  'tree',
  'hearts',
  'sun',
  'stripes',
] as const;

export const COMMUNITY_OCCASIONS = ['eid', 'hanukkah', 'diwali'] as const;

export const FAMILY_RELATIONSHIPS = [
  'mother',
  'father',
  'partner',
  'grandmother',
  'grandfather',
  'aunt',
  'uncle',
  'sister',
  'brother',
  'son',
  'daughter',
] as const;

export const MILESTONE_CLOSE_FAMILY = [
  'mother',
  'father',
  'partner',
  'grandmother',
  'grandfather',
] as const;

export const AGENT_ACTIONS = [
  'refund',
  'reprint',
  'upgrade',
  'send_ecard',
  'escalate',
  'none',
] as const;

export const STAGES = {
  post: ['checked', 'routed', 'printed', 'inspected', 'posted', 'delivered'],
  pickup: ['checked', 'routed', 'printed', 'ready_for_pickup', 'collected'],
  ecard: ['delivered'],
} as const;

export const STAGE_LABELS: Record<string, string> = {
  checked: 'Checked',
  routed: 'Routed',
  printed: 'Printed',
  inspected: 'Inspected',
  posted: 'Posted',
  ready_for_pickup: 'Ready for pick-up',
  delivered: 'Delivered',
  collected: 'Collected',
};

// Simulated printers. Postcode areas are the leading letters of a UK postcode.
export const PRINTERS = [
  {
    id: 'leeds',
    name: 'Aire Street Press',
    city: 'Leeds',
    sizes: ['regular', 'large'],
    finishes: ['classic', 'signature'],
    score: 4.7,
    capacity: 1800,
    areas: 'LS BD HX YO HU S DN NE DH SR TS DL HG WF HD'.split(' '),
  },
  {
    id: 'mcr',
    name: 'Ancoats Digital',
    city: 'Manchester',
    sizes: ['regular', 'large'],
    finishes: ['classic', 'signature'],
    score: 4.8,
    capacity: 2200,
    areas: 'M SK OL BL WN WA L CH PR BB LA FY CW SY ST TF'.split(' '),
  },
  {
    id: 'brum',
    name: 'Jewellery Quarter Print',
    city: 'Birmingham',
    sizes: ['regular', 'large', 'giant'],
    finishes: ['classic', 'signature', 'luxe'],
    score: 4.9,
    capacity: 2600,
    areas: 'B CV WV WS DY LE NG DE NN WR HR GL OX'.split(' '),
  },
  {
    id: 'ldn',
    name: 'Bermondsey Print Works',
    city: 'London',
    sizes: ['regular', 'large'],
    finishes: ['classic', 'signature'],
    score: 4.6,
    capacity: 3000,
    areas:
      'E EC N NW SE SW W WC BR CR DA EN HA IG KT RM SM TW UB WD SL RG GU BN TN ME CT CM SS CO IP NR CB SG AL LU MK HP'.split(
        ' ',
      ),
  },
  {
    id: 'bris',
    name: 'Harbourside Press',
    city: 'Bristol',
    sizes: ['regular', 'large'],
    finishes: ['classic', 'signature'],
    score: 4.7,
    capacity: 1500,
    areas: 'BS BA SN TA EX PL TQ TR DT BH SO PO SP CF NP SA'.split(' '),
  },
  {
    id: 'gla',
    name: 'Clydeside Cards',
    city: 'Glasgow',
    sizes: ['regular', 'large'],
    finishes: ['classic', 'signature'],
    score: 4.5,
    capacity: 1200,
    areas: 'G EH PA KA ML FK KY DD PH AB IV DG TD BT'.split(' '),
  },
] as const;

export const SPECIALIST_PRINTER_ID = 'brum';

// Fallback messages when no AI is configured. {name} is the first name, {age} the ordinal age.
export const TEMPLATES: Record<string, readonly string[]> = {
  birthday: [
    'Happy birthday, {name}. Hope the day is full of the people and things you love.',
    'Wishing you a very happy birthday, {name}. Here is to the year ahead.',
  ],
  milestone: [
    'A big birthday deserves a big card. Happy {age} birthday, {name}.',
    'Happy {age} birthday, {name}. What a lot to celebrate.',
  ],
  anniversary: [
    'Happy anniversary, {name}. Another year of the two of you is worth celebrating.',
    'Wishing you both a very happy anniversary.',
  ],
  mothers_day: [
    "Happy Mother's Day, {name}. Thank you for everything, today and every day.",
    "To the best mum, with all my love this Mother's Day.",
  ],
  womens_day: [
    "Happy International Women's Day, {name}. Thinking of you today.",
    "To a woman who makes everything better. Happy Women's Day, {name}.",
  ],
  eid: [
    'Eid Mubarak, {name}. Wishing you and your family peace and happiness.',
    'Eid Mubarak. May the day bring you joy and good company, {name}.',
  ],
  hanukkah: [
    'Happy Hanukkah, {name}. Wishing you light and warmth for all eight nights.',
    'Wishing you a bright and happy Hanukkah, {name}.',
  ],
  diwali: [
    'Happy Diwali, {name}. Wishing you light, joy and a wonderful year ahead.',
    'May Diwali bring you brightness and good fortune, {name}.',
  ],
  christmas: [
    'Merry Christmas, {name}. Wishing you a restful break and a happy new year.',
    'Happy Christmas, {name}. Thinking of you this festive season.',
  ],
  thank_you: [
    'Thank you, {name}. It meant a great deal.',
    'A small card to say a big thank you, {name}.',
  ],
  work_anniversary: [
    'Happy work anniversary, {name}. Thank you for another great year.',
    'Congratulations on another year, {name}. It is a pleasure working with you.',
  ],
  leaving: [
    'Good luck, {name}. It has been a pleasure working with you.',
    'All the best for the next chapter, {name}. We will miss you.',
  ],
};

export const SIGNOFF = {
  family: 'Love, {sender}',
  friend: 'Love, {sender}',
  colleague: 'Best wishes, {sender}',
} as const;
