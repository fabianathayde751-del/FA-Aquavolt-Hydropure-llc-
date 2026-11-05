import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { JSDOM } from "jsdom";

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = await readFile(resolve(root, "index.html"), "utf8");
const axeSource = await readFile(require.resolve("axe-core"), "utf8");
const style = html.match(/<style>([\s\S]*?)<\/style>/)?.[1];
assert.ok(style, "page includes its styles");

function cssColor(variable) {
  const match = style.match(new RegExp(`--${variable}:\\s*(#[\\da-fA-F]{6})`));
  assert.ok(match, `CSS variable --${variable} is defined as a hex color`);
  return match[1];
}

function contrastRatio(foreground, background) {
  function luminance(hex) {
    const rgb = hex.match(/[\da-f]{2}/gi).map((channel) => parseInt(channel, 16) / 255);
    const linear = rgb.map((channel) => channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4);
    return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
  }

  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
    / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
}

test("axe reports no WCAG 2.1 A/AA violations", async (t) => {
  const dom = new JSDOM(html, { runScripts: "outside-only", url: "http://localhost/" });
  t.after(() => dom.window.close());
  dom.window.eval(axeSource);

  const results = await dom.window.axe.run(dom.window.document, {
    runOnly: {
      type: "tag",
      values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]
    },
    rules: {
      "color-contrast": { enabled: false }
    }
  });
  assert.deepEqual(
    Array.from(results.violations, ({ id, impact, description, nodes }) => ({
      id,
      impact,
      description,
      elements: Array.from(nodes, ({ target }) => target)
    })),
    [],
    "axe found WCAG 2.1 A/AA violations"
  );
});

test("text and focus colors meet WCAG AA contrast thresholds", () => {
  const paper = cssColor("paper");
  const ink = cssColor("ink");
  const green = cssColor("green");
  const aqua = cssColor("aqua");
  const coral = cssColor("coral");
  const white = "#ffffff";
  const textPairs = [
    ["section labels", green, paper],
    ["owner detail labels", "#64736f", paper],
    ["weather metric labels", "#64736f", white],
    ["weather button", white, green],
    ["hero eyebrow", aqua, ink],
    ["hero map button", ink, aqua],
    ["weather summary", "#435553", white],
    ["weather update text", "#52635f", white],
    ["footer text", "#52635f", paper],
    ["weather error", "#a13e2d", white]
  ];

  for (const [label, foreground, background] of textPairs) {
    assert.ok(
      contrastRatio(foreground, background) >= 4.5,
      `${label} contrast is ${contrastRatio(foreground, background).toFixed(2)}:1; expected at least 4.5:1`
    );
  }

  assert.ok(contrastRatio(coral, white) >= 3, "weather button focus outline is visible on white");
  assert.ok(contrastRatio(white, ink) >= 3, "hero link focus outline is visible on the hero");
});
