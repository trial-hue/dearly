import { z } from 'zod';

import { AGENT_ACTIONS, DESIGNS, GIFTS, TITLES } from './constants';

export const SizeSchema = z.enum(['regular', 'large', 'giant']);
export const FinishSchema = z.enum(['classic', 'signature', 'luxe']);
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
});

export type CardSpecInput = z.input<typeof CardSpecSchema>;
