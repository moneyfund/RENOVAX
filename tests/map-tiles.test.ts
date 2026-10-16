import { describe, expect, it } from "vitest";
import { BASEMAPS } from "../src/lib/mapTiles";

describe("keyless map backgrounds", () => {
  it("never uses the CARTO endpoint that now renders API KEY REQUIRED", () => {
    for (const [name, layer] of Object.entries(BASEMAPS)) {
      expect(layer.url).toMatch(/^https:\/\//);
      expect(layer.url).not.toContain("cartocdn.com");
      expect(layer.url).not.toMatch(/\b(?:apiKey|access_token|token)=/i);
      expect(layer.options.attribution.length, name).toBeGreaterThan(20);
    }
  });
  it("uses natural color cartography with no dark variant", () => {
    expect(BASEMAPS.street.url).toContain("tile.openstreetmap.org");
    expect(BASEMAPS).not.toHaveProperty("dark");
    expect(Object.keys(BASEMAPS).sort()).toEqual(["satellite", "street"]);
  });
});
