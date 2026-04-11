import { z } from "zod";

export const lineItemSchema = z.object({
  description: z.string().min(1).max(2000),
  amountCents: z.number().int().min(0).max(100_000_000),
});

export const lineItemsSchema = z.array(lineItemSchema).min(1).max(100);

export type EstimateLineItem = z.infer<typeof lineItemSchema>;

export function sumLineItemsCents(items: EstimateLineItem[]): number {
  return items.reduce((acc, x) => acc + x.amountCents, 0);
}
