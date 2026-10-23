import { expect, it } from "vitest";
import { mapWithConcurrency } from "./concurrency";

it("preserves order and never exceeds the limit", async () => {
  let active = 0, peak = 0;
  const out = await mapWithConcurrency([1, 2, 3, 4, 5, 6, 7], 3, async (n) => {
    active++; peak = Math.max(peak, active);
    await new Promise((r) => setTimeout(r, 5));
    active--;
    return n * 2;
  });
  expect(out).toEqual([2, 4, 6, 8, 10, 12, 14]);
  expect(peak).toBe(3);
});
it("rejects when any call rejects", async () => {
  await expect(mapWithConcurrency([1, 2], 2, async (n) => { if (n === 2) throw new Error("boom"); return n; })).rejects.toThrow("boom");
});
