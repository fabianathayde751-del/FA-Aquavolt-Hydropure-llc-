import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import test from "node:test";
import vm from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const html = await readFile(resolve(root, "index.html"), "utf8");
const inlineScript = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(inlineScript, "page includes its weather script");
new vm.Script(inlineScript);

test("homepage and hero image are served successfully", async (t) => {
  const files = new Map([
    ["/", { body: html, contentType: "text/html; charset=utf-8" }],
    ["/index.html", { body: html, contentType: "text/html; charset=utf-8" }],
    ["/water-turbine-cc-by-sa-2.jpg", {
      body: await readFile(resolve(root, "water-turbine-cc-by-sa-2.jpg")),
      contentType: "image/jpeg"
    }]
  ]);
  const server = createServer((request, response) => {
    const file = files.get(new URL(request.url, "http://localhost").pathname);
    if (!file) {
      response.writeHead(404).end("Not found");
      return;
    }
    response.writeHead(200, { "content-type": file.contentType }).end(file.body);
  });
  await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
  t.after(() => new Promise((resolveClose, rejectClose) => {
    server.close((error) => error ? rejectClose(error) : resolveClose());
  }));

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const pageResponse = await fetch(baseUrl);
  assert.equal(pageResponse.status, 200);
  const page = await pageResponse.text();
  assert.match(page, /id="weather-refresh"/);
  assert.match(page, /id="main" tabindex="-1"/);

  const imageResponse = await fetch(`${baseUrl}/water-turbine-cc-by-sa-2.jpg`);
  assert.equal(imageResponse.status, 200);
  assert.match(imageResponse.headers.get("content-type"), /image\/jpeg/);
});

function createElement() {
  const listeners = new Map();
  const classes = new Set();
  return {
    textContent: "",
    disabled: false,
    classList: {
      add: (value) => classes.add(value),
      remove: (value) => classes.delete(value),
      contains: (value) => classes.has(value)
    },
    addEventListener: (name, callback) => listeners.set(name, callback),
    trigger: (name) => listeners.get(name)?.()
  };
}

async function startWeatherWidget(fetchImpl) {
  const ids = [
    "weather-refresh",
    "weather-condition",
    "weather-updated",
    "weather-temperature",
    "weather-feels-like",
    "weather-humidity",
    "weather-wind"
  ];
  const elements = Object.fromEntries(ids.map((id) => [id, createElement()]));
  let interval;
  const document = { getElementById: (id) => elements[id] };
  const window = {
    setInterval: (callback, delay) => {
      interval = { callback, delay };
    }
  };

  vm.runInNewContext(inlineScript, { document, window, fetch: fetchImpl, Error });
  await new Promise((resolveTurn) => setImmediate(resolveTurn));
  assert.equal(interval.delay, 15 * 60 * 1000);
  assert.equal(elements["weather-refresh"].disabled, false);
  return { elements, interval };
}

const validResponse = {
  current: {
    temperature_2m: 67.3,
    apparent_temperature: 66.8,
    relative_humidity_2m: 42,
    wind_speed_10m: 8.4,
    weather_code: 0,
    time: "2026-11-05T09:45"
  },
  utc_offset_seconds: -21600
};

test("weather success renders measurements and refreshes on demand and on schedule", async () => {
  let requestCount = 0;
  const { elements, interval } = await startWeatherWidget(async (url, options) => {
    requestCount += 1;
    assert.match(url, /^https:\/\/api\.open-meteo\.com\/v1\/forecast\?/);
    assert.equal(options.cache, "no-store");
    return { ok: true, json: async () => validResponse };
  });

  assert.equal(elements["weather-condition"].textContent, "Clear sky");
  assert.equal(elements["weather-temperature"].textContent, "67°F");
  assert.equal(elements["weather-feels-like"].textContent, "67°F");
  assert.equal(elements["weather-humidity"].textContent, "42%");
  assert.equal(elements["weather-wind"].textContent, "8 mph");
  assert.match(elements["weather-updated"].textContent, /Observed .*Auto-refreshes every 15 minutes/);

  await elements["weather-refresh"].trigger("click");
  await interval.callback();
  assert.equal(requestCount, 3);
});

test("weather HTTP errors clear measurements and display an error", async () => {
  let requestCount = 0;
  const { elements } = await startWeatherWidget(async () => {
    requestCount += 1;
    return requestCount === 1
      ? { ok: true, json: async () => validResponse }
      : { ok: false, status: 503 };
  });

  await elements["weather-refresh"].trigger("click");
  assert.match(elements["weather-condition"].textContent, /temporarily unavailable/);
  assert.ok(elements["weather-condition"].classList.contains("weather-error"));
  for (const id of ["weather-temperature", "weather-feels-like", "weather-humidity", "weather-wind"]) {
    assert.equal(elements[id].textContent, "—");
  }
  assert.equal(elements["weather-updated"].textContent, "Weather service returned HTTP 503.");
  assert.equal(elements["weather-refresh"].disabled, false);
});

test("weather network and malformed-data errors are visible", async (t) => {
  const failures = [
    ["network failure", async () => {
      throw new Error("Network unavailable");
    }, "Network unavailable"],
    ["malformed measurement", async () => ({
      ok: true,
      json: async () => ({
        ...validResponse,
        current: { ...validResponse.current, temperature_2m: null }
      })
    }), "Weather service returned an invalid measurement."],
    ["invalid weather code", async () => ({
      ok: true,
      json: async () => ({
        ...validResponse,
        current: { ...validResponse.current, weather_code: 123 }
      })
    }), "Weather service returned an invalid measurement."],
    ["out-of-range humidity", async () => ({
      ok: true,
      json: async () => ({
        ...validResponse,
        current: { ...validResponse.current, relative_humidity_2m: 180 }
      })
    }), "Weather service returned an invalid measurement."]
  ];

  for (const [name, fetchImpl, message] of failures) {
    await t.test(name, async () => {
      const { elements } = await startWeatherWidget(fetchImpl);
      assert.match(elements["weather-condition"].textContent, /temporarily unavailable/);
      assert.equal(elements["weather-updated"].textContent, message);
      assert.ok(elements["weather-condition"].classList.contains("weather-error"));
    });
  }
});
