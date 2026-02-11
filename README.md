# Flix-Catalogs (Stremio Addon)

Configurable Stremio addon for Hungarian-focused catalogs from **Mafab.hu** and **Port.hu**, with provider-split streaming catalogs and dynamic year-window catalogs.

## Highlights

- Addon name/branding: **Flix-Catalogs**
- Configure UI at `/configure` with source toggles and per-catalog toggles
- Source selection:
  - ✅ Mafab.hu (enabled by default)
  - ⬜ Port.hu (disabled by default)
- Provider-split Mafab streaming catalogs:
  - Netflix, HBO Max, Telekom TVGO, Cinego, Filmio, Amazon Prime Video, Apple TV+, Disney+, SkyShowtime
- Dynamic Mafab year catalogs:
  - Movies (previous + current year)
  - Best Movies (current year)
  - Total Gross (previous + current year)
- Resources: `catalog`, `meta`, `stream`

## Run locally

```bash
npm install
npm run check
npm test
npm start
```

Open:

- Configure page: `http://127.0.0.1:7000/configure`
- Manifest: `http://127.0.0.1:7000/manifest.json`

## Configured manifest URL format

`http://host/<base64url-config>/manifest.json`

Example config object:

```json
{
  "sources": {
    "mafab": true,
    "porthu": false
  },
  "mafabCatalogs": {
    "mafab-movies": true,
    "mafab-streaming-netflix": true,
    "mafab-total-gross": true
  },
  "features": {
    "externalLinks": true
  }
}
```

## Environment variables

- `PORT` (default: `7000`)
- `CATALOG_LIMIT` (default: `50`, max: `100`)
- `MAFAB_HTTP_TIMEOUT_MS` (default: `12000`)
- `MAFAB_ENRICH_MAX` (default: `200`)
- `MAFAB_ENRICH_CONCURRENCY` (default: `8`)
- `MAFAB_YEAR_FROM` (optional override for previous year boundary)
- `MAFAB_YEAR_TO` (optional override for current year boundary)
- `TMDB_API_KEY` (preferred TMDB key)
- `MAFAB_TMDB_API_KEY` (fallback TMDB key)
- `PORT_HU_HTTP_TIMEOUT_MS` (default: `12000`)
- `PORT_HU_PAGE_CACHE_TTL_MS` (default: `600000`)
- `PORT_HU_CATALOG_CACHE_TTL_MS` (default: `300000`)
- `PORT_HU_DETAIL_CONCURRENCY` (default: `8`)

## Quick verification commands

```bash
git status --short
git log --oneline -n 5
npm test
```
