import { describe, it, expect } from "vitest";
import { cn } from "../utils";

/**
 * Unit tests for the cn() class-name utility (tailwind-merge + clsx wrapper).
 */
describe("cn (class name merger)", () => {
  it("merges simple strings with a single space", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("filters falsy values", () => {
    expect(cn("foo", false, null, undefined, "", "bar")).toBe("foo bar");
  });

  it("handles conditional classes via object syntax", () => {
    expect(cn("foo", { bar: true, baz: false })).toBe("foo bar");
  });

  it("deduplicates conflicting Tailwind padding utilities (last wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("deduplicates conflicting Tailwind text-color utilities (last wins)", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("preserves non-conflicting utilities", () => {
    const result = cn("p-2", "m-4", "text-center");
    expect(result).toContain("p-2");
    expect(result).toContain("m-4");
    expect(result).toContain("text-center");
  });

  it("returns an empty string for no input", () => {
    expect(cn()).toBe("");
  });

  it("accepts arrays of class names", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });
});
