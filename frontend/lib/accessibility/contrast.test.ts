import { contrastRatio } from "./contrast";

describe("Lesson flow contrast (WCAG 2.1 AA)", () => {
  test("primary button text contrast is >= 4.5:1", () => {
    const ratio = contrastRatio("#ffffff", "#2563eb");
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  test("secondary button text contrast is >= 4.5:1", () => {
    const ratio = contrastRatio("#1a1a18", "#ffffff");
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  test("error action button text contrast is >= 4.5:1", () => {
    const ratio = contrastRatio("#ffffff", "#dc2626");
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
});

