import type {
  AGENT_ACTIONS,
  DESIGNS,
  FINISHES,
  GIFTS,
  MODES,
  SIZES,
  STAGES,
  TITLES,
} from './constants';

export type Size = keyof typeof SIZES;
export type Finish = keyof typeof FINISHES;
export type Mode = keyof typeof MODES;
export type PrintedMode = Exclude<Mode, 'ecard'>;
export type OccasionType = keyof typeof TITLES;
export type DesignId = (typeof DESIGNS)[number];
export type GiftId = (typeof GIFTS)[number]['id'];
export type AgentAction = (typeof AGENT_ACTIONS)[number];
export type Stage =
  (typeof STAGES.post)[number] | (typeof STAGES.pickup)[number] | (typeof STAGES.ecard)[number];
export type Actor = 'ai' | 'rule' | 'person';
export type CardFont = 'hand' | 'print' | 'serif' | 'mono';

export interface CustomFrontMedia {
  kind: 'media';
  mediaId: string;
  url: string;
}
export interface CustomFrontSvg {
  kind: 'svg';
  svg: string;
}

export interface CardSpec {
  design: DesignId;
  size: Size;
  finish: Finish;
  mode: Mode;
  modeOverridden: boolean;
  digital: boolean;
  gift: GiftId;
  message: string;
  font: CardFont;
  customFront?: CustomFrontMedia | CustomFrontSvg | null;
  handwriting?: { mediaId: string; url: string; signatureOnly: boolean } | null;
  offerGiant?: boolean;
  offerEcard?: boolean;
}

export interface Costs {
  payPct: number;
  payFixed: number;
  ai: number;
  service: number;
  guarantee: number;
  teamPerYear: number;
}

export interface QuoteLine {
  label: string;
  pence: number;
}

export interface QuoteCosts {
  printPence: number;
  deliveryPence: number;
  paymentPence: number;
  aiPence: number;
  servicePence: number;
  guaranteePence: number;
  giftPence: number;
  totalPence: number;
}

export interface Quote {
  lines: QuoteLine[];
  totalPence: number;
  exVatPence: number;
  cardPence: number;
  deliveryPence: number;
  moonpigPence: number | null;
  savingPence: number | null;
  moonpigNote: string | null;
  costs: QuoteCosts;
  contributionPence: number;
  guarantee: boolean;
}

export interface PersonLike {
  id: string;
  name: string;
  relationship: string;
  postcode?: string | null;
  addrCheckedAt: Date | string | null;
  pausedReason?: string | null;
}

export interface OccasionLike {
  id: string;
  type: OccasionType;
  monthDay: string | null; // 'MM-DD'
  startYear: number | null; // birth year, wedding year or start year
  adhocDate: string | null; // 'YYYY-MM-DD'
}

export interface PrinterLike {
  id: string;
  name: string;
  city: string;
  sizes: readonly string[];
  finishes: readonly string[];
  areas: readonly string[];
  capacity: number;
  score: number;
}

export interface OrderForRecovery {
  id: string;
  mode: Mode;
  guarantee: boolean;
  totalPence: number;
  occasionDate: Date | string;
}

export interface RecoveryAction {
  type: 'ecard' | 'refund' | 'discount' | 'reprint';
  label: string;
  pence: number;
  detail?: string;
}

export interface ProposalDraft {
  key: string;
  personId: string;
  occasionId: string;
  occasionType: OccasionType;
  dueDate: Date;
  daysLeft: number;
  card: CardSpec;
  reason: string;
  flags: string[];
  age: number | null;
}

export interface WeekForecast {
  weekStart: Date;
  total: number;
  advance: number;
  tracked: number;
  pickup: number;
  peak: string | null;
  multiplier: number;
}

export interface ContributionRow {
  size: Size;
  finish: Finish;
  mode: PrintedMode;
  pricePence: number;
  exVatPence: number;
  costPence: number;
  contributionPence: number;
  marginPct: number;
}
