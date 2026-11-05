import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import test from "node:test";

const apiUrl = "https://api.open-meteo.com/v1/forecast?latitude=29.3709&longitude=-100.8959&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FChicago";

test("live Open-Meteo endpoint returns valid current Del Rio weather", async () => {
  const { stdout } = await promisify(execFile)("curl", [
    "--fail",
    "--silent",
    "--show-error",
    "--max-time",
    "20",
    "--header",
    "Origin: https://localhost",
    "--dump-header",
    "-",
    apiUrl
  ], { maxBuffer: 1024 * 1024, timeout: 25_000 });
  const bodyStart = stdout.indexOf("{");
  assert.notEqual(bodyStart, -1, "weather service returns a JSON body");
  const headers = stdout.slice(0, bodyStart);
  assert.match(headers, /HTTP\/\d(?:\.\d)? 200/, "weather service returns HTTP 200");
  assert.match(headers, /access-control-allow-origin:\s*(\*|https:\/\/localhost)\s*/i, "weather API allows browser CORS requests");

  const payload = JSON.parse(stdout.slice(bodyStart));
  const current = payload.current;
  assert.ok(current && typeof current === "object", "response includes current conditions");
  for (const field of [
    "temperature_2m",
    "relative_humidity_2m",
    "apparent_temperature",
    "weather_code",
    "wind_speed_10m"
  ]) {
    assert.equal(typeof current[field], "number", `${field} is numeric`);
    assert.ok(Number.isFinite(current[field]), `${field} is finite`);
  }
  assert.ok(current.relative_humidity_2m >= 0 && current.relative_humidity_2m <= 100);
  assert.equal(typeof current.time, "string", "response includes the observation time");
  assert.equal(payload.timezone, "America/Chicago");
});
