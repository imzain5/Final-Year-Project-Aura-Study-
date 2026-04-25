import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateNotePdf } from "../generateNotePdf";

/**
 * Unit tests for the Markdown-to-PDF generator used by the Notes page.
 *
 * These tests cover the edge conditions described in §6.1 of the dissertation:
 *   - an empty note body,
 *   - a note containing only headings,
 *   - a long note that spans multiple pages,
 *   - notes with bullet points and numbered lists.
 *
 * generateNotePdf() internally calls jsPDF#save(), which in a non-browser
 * environment (jsdom) attempts to trigger a download. We stub that call to
 * prevent the test runner from failing on that side-effect while still
 * exercising the full generation pipeline.
 */
describe("generateNotePdf", () => {
  beforeEach(() => {
    // jsdom does not implement URL.createObjectURL fully; stub it so jsPDF.save() does not throw
    if (typeof URL.createObjectURL !== "function") {
      (URL as unknown as { createObjectURL: (b: Blob) => string }).createObjectURL =
        () => "blob:mock";
    }
    // Stub the download link click to a no-op
    const origCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = origCreate(tag);
      if (tag === "a") {
        (el as HTMLAnchorElement).click = () => {};
      }
      return el;
    });
  });

  it("generates a PDF from a simple note without throwing", () => {
    expect(() =>
      generateNotePdf({
        title: "Test Note",
        subject: "Biology",
        summary: "Short summary",
        content: "# Heading\n\nSome body text.",
      })
    ).not.toThrow();
  });

  it("handles an empty content body", () => {
    expect(() =>
      generateNotePdf({
        title: "Empty",
        subject: "",
        summary: "",
        content: "",
      })
    ).not.toThrow();
  });

  it("handles a note that is only headings", () => {
    expect(() =>
      generateNotePdf({
        title: "Headings Only",
        subject: "Test",
        content: "# H1\n## H2\n### H3",
      })
    ).not.toThrow();
  });

  it("handles a long content body that spans multiple pages", () => {
    const longContent = Array.from(
      { length: 200 },
      (_, i) => `Paragraph ${i}: ${"lorem ipsum ".repeat(10)}`
    ).join("\n\n");

    expect(() =>
      generateNotePdf({
        title: "Long Note",
        subject: "Test",
        content: longContent,
      })
    ).not.toThrow();
  });

  it("handles bullet points and numbered lists", () => {
    expect(() =>
      generateNotePdf({
        title: "Lists",
        subject: "Test",
        content: "- bullet one\n- bullet two\n\n1. numbered\n2. list",
      })
    ).not.toThrow();
  });

  it("handles special characters in title (sanitised for filename)", () => {
    expect(() =>
      generateNotePdf({
        title: "Title / with ! special @ characters?",
        subject: "Test",
        content: "Test content.",
      })
    ).not.toThrow();
  });
});
