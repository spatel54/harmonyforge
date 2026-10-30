import { describe, expect, it } from "vitest";
import {
  deriveDisplayScoreTitle,
  isUsableScoreTitle,
  uploadedFileStem,
} from "./scoreDisplayTitle";

describe("uploadedFileStem", () => {
  it("strips the extension and path", () => {
    expect(uploadedFileStem("The First Noel.pdf")).toBe("The First Noel");
    expect(uploadedFileStem("C:/scores/carol.musicxml")).toBe("carol");
  });
});

describe("isUsableScoreTitle", () => {
  it("rejects generic, empty, and glyph-only titles", () => {
    expect(isUsableScoreTitle("")).toBe(false);
    expect(isUsableScoreTitle("Score")).toBe(false);
    expect(isUsableScoreTitle("|")).toBe(false);
    expect(isUsableScoreTitle("♩")).toBe(false);
  });

  it("accepts real titles", () => {
    expect(isUsableScoreTitle("The First Noel")).toBe(true);
    expect(isUsableScoreTitle("K. 331")).toBe(true);
  });
});

describe("deriveDisplayScoreTitle", () => {
  it("prefers the uploaded filename when MusicXML title is generic", () => {
    expect(
      deriveDisplayScoreTitle({
        fileName: "Silent Night.pdf",
        xmlTitle: "Score",
        xmlMeta: "Voice · Audiveris 5.9.0",
        partNames: ["Voice"],
      }),
    ).toBe("Silent Night");
  });

  it("prefers the filename when the XML title is a leftover glyph", () => {
    expect(
      deriveDisplayScoreTitle({
        fileName: "Carol.pdf",
        xmlTitle: "|",
        xmlMeta: "Voice · Audiveris 5.9.0",
      }),
    ).toBe("Carol");
  });

  it("prefers the filename when the XML title is a part name", () => {
    expect(
      deriveDisplayScoreTitle({
        fileName: "Ave Maria.xml",
        xmlTitle: "Voice",
        xmlMeta: "Voice · Audiveris 5.9.0",
        partNames: ["Voice"],
      }),
    ).toBe("Ave Maria");
  });

  it("keeps a real work title", () => {
    expect(
      deriveDisplayScoreTitle({
        fileName: "scan.pdf",
        xmlTitle: "Eine kleine Nachtmusik",
        partNames: ["Violin I"],
      }),
    ).toBe("Eine kleine Nachtmusik");
  });
});
