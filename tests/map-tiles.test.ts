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
  it("shares a free OpenStreetMap raster for street and graphite modes", () => {
    expect(BASEMAPS.dark.url).toBe(BASEMAPS.street.url);
    expect(BASEMAPS.dark.url).toContain("tile.openstreetmap.org");
  });
});
