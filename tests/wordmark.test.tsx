import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Brand } from "../src/components/Brand";
import { Wordmark } from "../src/components/Wordmark";

describe("official RENOVAX lettering", () => {
  it("uses a proportional SVG crop that excludes the separate R and retains the final X", () => {
    const html = renderToStaticMarkup(<Wordmark className="hero-wordmark" />);
    expect(html).toContain('viewBox="1460 2000 2610 800"');
    expect(html).toContain('/renovax-logo.png');
    expect(html).toContain('aria-label="Renovax"');
    expect(html).not.toContain('hero-brand-image img');
  });
  it("reuses the owner-supplied lettering in the sidebar", () => {
    const html = renderToStaticMarkup(<Brand />);
    expect(html).toContain('navigation-wordmark');
    expect(html).toContain('/renovax-logo.png');
  });
});
