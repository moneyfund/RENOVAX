import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { GoogleMark } from "../src/components/GoogleMark";

it("renders a local four-colour Google identity mark without external requests", () => {
  const html = renderToStaticMarkup(<GoogleMark />);
  expect(html).toContain('aria-hidden="true"');
  for (const color of ["#4285F4", "#34A853", "#FBBC05", "#EA4335"]) {
    expect(html).toContain(color);
  }
});
