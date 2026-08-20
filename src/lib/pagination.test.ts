import { describe, expect, it } from "vitest";
import { getPaginationPages, paginateItems } from "./pagination";

describe("pagination helpers", () => {
  it("clamps pages and returns the requested slice", () => {
    const result = paginateItems([1, 2, 3, 4, 5], 9, 2);

    expect(result).toEqual({
      items: [5],
      currentPage: 3,
      totalPages: 3,
      pageSize: 2,
    });
  });

  it("keeps short pagination ranges fully visible", () => {
    expect(getPaginationPages(2, 4)).toEqual([1, 2, 3, 4]);
  });

  it("adds ellipses for long pagination ranges", () => {
    expect(getPaginationPages(5, 12)).toEqual([
      1,
      "ellipsis-start",
      4,
      5,
      6,
      "ellipsis-end",
      12,
    ]);
  });
});
