# FA Aquavolt Hydropure LLC

Owner: Fabian Athayde

Location: Del Rio, Texas

The website displays current weather for Del Rio using the Open-Meteo API. It loads in the visitor's browser, refreshes automatically every 15 minutes, and can be refreshed manually. A network or service error is shown on the page. Business availability and turbine operating data are not displayed because no live data source has been provided.

## Testing

Requires Node.js 18 or newer. Run `npm test` for local frontend, axe WCAG 2.1 A/AA, and color-contrast checks. Run `npm run test:live` to run those checks plus a live request to the Open-Meteo API; the live check requires internet access. axe runs in jsdom, so rendered color contrast is verified separately by the contrast test.
