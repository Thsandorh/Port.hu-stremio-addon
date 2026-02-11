const { MAFAB_CATALOG_IDS } = require('./config')

const ICON_SVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 256 256'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#5b7cff'/><stop offset='100%' stop-color='#00c2ff'/></linearGradient></defs><rect width='256' height='256' rx='56' fill='#0f1530'/><path d='M58 62h140v36H98v28h84v34H98v36h100v36H58V62z' fill='url(#g)'/><rect x='170' y='62' width='28' height='170' fill='#ffffff' opacity='0.9'/></svg>`
const ICON_DATA_URI = `data:image/svg+xml;base64,${Buffer.from(ICON_SVG).toString('base64')}`

const MAFAB_CATALOGS = {
  'mafab-movies': { type: 'movie', name: 'Mafab: Movies' },
  'mafab-series': { type: 'series', name: 'Mafab: Series' },
  'mafab-streaming': { type: 'movie', name: 'Mafab: Top streaming' },
  'mafab-cinema': { type: 'movie', name: 'Mafab: In Cinemas Now' },
  'mafab-cinema-soon': { type: 'movie', name: 'Mafab: Coming Soon' },
  'mafab-tv': { type: 'series', name: 'Mafab: TV Catalog' },
  'mafab-movies-lists': { type: 'movie', name: 'Mafab: Movie Lists' },
  'mafab-series-lists': { type: 'series', name: 'Mafab: Series Lists' },
  'mafab-streaming-premieres': { type: 'movie', name: 'Mafab: Streaming Premieres' },
  'mafab-streaming-netflix': { type: 'movie', name: 'Mafab: Top streaming / Netflix' },
  'mafab-streaming-hbo': { type: 'movie', name: 'Mafab: Top streaming / HBO Max' },
  'mafab-streaming-telekom-tvgo': { type: 'movie', name: 'Mafab: Top streaming / Telekom TVGO' },
  'mafab-streaming-cinego': { type: 'movie', name: 'Mafab: Top streaming / Cinego' },
  'mafab-streaming-filmio': { type: 'movie', name: 'Mafab: Top streaming / Filmio' },
  'mafab-streaming-amazon': { type: 'movie', name: 'Mafab: Top streaming / Amazon Prime Video' },
  'mafab-streaming-apple-tv': { type: 'movie', name: 'Mafab: Top streaming / Apple TV+' },
  'mafab-streaming-disney': { type: 'movie', name: 'Mafab: Top streaming / Disney+' },
  'mafab-streaming-skyshowtime': { type: 'movie', name: 'Mafab: Top streaming / SkyShowtime' },
  'mafab-year-window': { type: 'movie', name: 'Mafab: Movies (previous + current year)' },
  'mafab-best-current-year': { type: 'movie', name: 'Mafab: Best Movies (current year)' },
  'mafab-total-gross': { type: 'movie', name: 'Mafab: Total Gross (previous + current year)' }
}

function createManifest(config) {
  const safeConfig = config && typeof config === 'object' ? config : {}
  const sourcesConfig = safeConfig.sources && typeof safeConfig.sources === 'object' ? safeConfig.sources : {}

  const sources = []
  if (sourcesConfig.mafab) sources.push('Mafab')

  const manifestCatalogs = []

  if (sourcesConfig.mafab) {
    const enabledCatalogIds = MAFAB_CATALOG_IDS.filter((id) => safeConfig?.mafabCatalogs?.[id] !== false)
    for (const id of enabledCatalogIds) {
      const def = MAFAB_CATALOGS[id]
      if (!def) continue
      manifestCatalogs.push({ type: def.type, id, name: def.name, extra: [{ name: 'genre' }, { name: 'skip' }] })
    }
  }


  return {
    id: 'community.flix.catalogs',
    version: '2.0.2',
    name: 'Flix-Catalogs',
    description: `Configurable catalogs from ${sources.length ? sources.join(' + ') : 'selected sources'}.`,
    resources: ['catalog', 'meta', 'stream'],
    types: ['movie', 'series'],
    idPrefixes: ['tt', 'mafab:'],
    logo: ICON_DATA_URI,
    catalogs: manifestCatalogs,
    behaviorHints: {
      configurable: true,
      configurationRequired: false
    }
  }
}

module.exports = { createManifest }
