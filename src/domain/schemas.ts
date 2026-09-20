import { z } from 'zod';

import { AGENT_ACTIONS, DESIGNS, GIFTS, TITLES } from './constants';

export const SizeSchema = z.enum(['regular', 'large', 'giant']);
export const FinishSchema = z.enum(['classic', 'signature', 'luxe']);
/** Business cards are Regular Classic or Signature only. */
export const BusinessFinishSchema = z.enum(['classic', 'signature']);
export const ModeSchema = z.enum(['advance', 'tracked', 'pickup', 'ecard']);
export const DesignSchema = z.enum(DESIGNS);
export const GiftSchema = z.enum(GIFTS.map((g) => g.id) as [string, ...string[]]);
export const OccasionTypeSchema = z.enum(Object.keys(TITLES) as [string, ...string[]]);
export const AgentActionSchema = z.enum(AGENT_ACTIONS);
export const FontSchema = z.enum(['hand', 'print', 'serif', 'mono']);

export const CardSpecSchema = z.object({
  design: DesignSchema,
  size: SizeSchema,
  finish: FinishSchema,
  mode: ModeSchema,
  modeOverridden: z.boolean().default(false),
  digital: z.boolean().default(false),
  gift: GiftSchema.default('none'),
  message: z.string().max(600).default(''),
  font: FontSchema.default('hand'),
  customFront: z
    .union([
      z.object({ kind: z.literal('media'), mediaId: z.string(), url: z.string() }),
      z.object({ kind: z.literal('svg'), svg: z.string().max(25_000) }),
    ])
    .nullable()
    .optional(),
  handwriting: z
    .object({ mediaId: z.string(), url: z.string(), signatureOnly: z.boolean().default(false) })
    .nullable()
    .optional(),
  offerGiant: z.boolean().optional(),
  offerEcard: z.boolean().optional(),
  /** A validated guarantee code applied to this card (set by the service, never by the client). */
  guaranteeCode: z.string().max(24).nullable().optional(),
});

/** Media for a digital card: the eCard, or the 0.29 digital copy of a printed card. */
export const DigitalExtrasSchema = z.object({
  animation: z.enum(['envelope', 'flip', 'confetti']).default('envelope'),
  drawingMediaId: z.string().nullable().default(null),
  narrationMediaId: z.string().nullable().default(null),
  clipMediaId: z.string().nullable().default(null),
  wordTimings: z.array(z.number().nonnegative()).max(400).default([]),
});
export type DigitalExtras = z.infer<typeof DigitalExtrasSchema>;

export type CardSpecInput = z.input<typeof CardSpecSchema>;
