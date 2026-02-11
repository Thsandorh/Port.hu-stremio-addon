# Flix-Catalogs (Stremio Addon)

Configurable Stremio addon powered by **Mafab.hu** catalogs, with provider-split streaming catalogs and dynamic year-window catalogs.

## Highlights

- Addon name/branding: **Flix-Catalogs**
- Configure UI at `/configure` with source toggles and per-catalog toggles
- Source selection:
  - ✅ Mafab.hu
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
    "mafab": true
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

## Quick verification commands

```bash
git status --short
git log --oneline -n 5
npm test
```
