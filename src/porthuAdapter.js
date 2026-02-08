const crypto = require('node:crypto')
const { URL } = require('node:url')

const axios = require('axios')
const cheerio = require('cheerio')

const SOURCE_NAME = 'port.hu'
const DEFAULT_TIMEOUT_MS = Number(process.env.PORT_HU_HTTP_TIMEOUT_MS || 12000)

const CATALOG_URLS = {
  movie: ['https://port.hu/film', 'https://port.hu/mozi', 'https://port.hu'],
  series: ['https://port.hu/sorozat', 'https://port.hu/tv', 'https://port.hu']
}

const META_CACHE = new Map()
const DETAIL_CACHE = new Map()

const http = axios.create({
  timeout: DEFAULT_TIMEOUT_MS,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,hu;q=0.8'
  },
  validateStatus: (s) => s >= 200 && s < 400
})

function sanitizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function canonicalizeUrl(value) {
  if (!value) return null
  try {
    const url = new URL(value)
    url.hash = ''
    url.search = ''
    return url.toString()
  } catch {
    return value.split('#')[0].split('?')[0]
  }
}

function absolutize(baseUrl, maybeRelative) {
  if (!maybeRelative) return null
  try {
    return canonicalizeUrl(new URL(maybeRelative, baseUrl).toString())
  } catch {
    return null
  }
}

function extractEntityId(url) {
  const text = String(url || '')
  const movie = text.match(/movie-([0-9]+)/i)
  if (movie) return `movie-${movie[1]}`
  const episode = text.match(/episode-([0-9]+)/i)
  if (episode) return `episode-${episode[1]}`
  const event = text.match(/event-([0-9]+)/i)
  if (event) return `event-${event[1]}`
  return null
}

function makeMetaId(type, canonicalUrl, name) {
  const entityId = extractEntityId(canonicalUrl)
  if (entityId) return `porthu:${type}:${entityId}`
  const hash = crypto
    .createHash('sha1')
    .update(`${type}:${canonicalUrl || name || ''}`)
    .digest('hex')
    .slice(0, 24)
  return `porthu:${type}:h-${hash}`
}

function parseJsonLdBlocks($, pageUrl) {
  const scripts = $('script[type="application/ld+json"]').toArray()
  const items = []

  for (const script of scripts) {
    const raw = $(script).contents().text()
    if (!raw) continue

    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      continue
    }

    const arr = Array.isArray(parsed) ? parsed : parsed['@graph'] ? parsed['@graph'] : [parsed]

    for (const entry of arr) {
      if (!entry || typeof entry !== 'object') continue

      if (Array.isArray(entry.itemListElement)) {
        for (const listEl of entry.itemListElement) {
          const item = listEl.item || listEl
          if (!item || typeof item !== 'object') continue
          items.push({
            name: sanitizeText(item.name || listEl.name),
            url: absolutize(pageUrl, item.url || listEl.url),
            poster: absolutize(pageUrl, item.image),
            description: sanitizeText(item.description),
            releaseInfo: sanitizeText(item.datePublished || item.releaseDate),
            genre: sanitizeText(Array.isArray(item.genre) ? item.genre.join(', ') : item.genre)
          })
        }
      }

      const type = entry['@type']
      const typeArr = Array.isArray(type) ? type : [type]
      if (typeArr.some((t) => ['Movie', 'TVSeries', 'CreativeWork'].includes(t))) {
        items.push({
          name: sanitizeText(entry.name),
          url: absolutize(pageUrl, entry.url),
          poster: absolutize(pageUrl, entry.image),
          description: sanitizeText(entry.description),
          releaseInfo: sanitizeText(entry.datePublished || entry.releaseDate),
          genre: sanitizeText(Array.isArray(entry.genre) ? entry.genre.join(', ') : entry.genre)
        })
      }
    }
  }

  return items
}

function isPosterUrl(url) {
  const u = String(url || '')
  if (!u) return false
  if (u.includes('/img/agelimit/')) return false
  return /\.(jpg|jpeg|png|webp)(\?|$)/i.test(u) || u.includes('/images/')
}

function parseDomCards($, pageUrl) {
  const items = []
  const cardSelectors = ['a[href*="/adatlap/film/"]', 'a[href*="/adatlap/sorozat/"]', 'article a[href]']

  for (const sel of cardSelectors) {
    $(sel).each((_, el) => {
      const href = $(el).attr('href')
      const canonical = absolutize(pageUrl, href)
      if (!canonical || !canonical.includes('/adatlap/')) return

      const root = $(el).closest('article, .event-holder, .event-card, .card, .item, li, div')
      const rawName =
        $(el).attr('title') ||
        $(el).attr('aria-label') ||
        root.find('h1, h2, h3, h4, .title').first().text() ||
        $(el).text()
      const name = sanitizeText(rawName)
      if (!name || name.length < 2) return

      const img = root.find('img').toArray().map((node) => $(node))
      let poster = null
      for (const tag of img) {
        const candidate = absolutize(
          pageUrl,
          tag.attr('src') || tag.attr('data-src') || tag.attr('data-original') || tag.attr('data-lazy')
        )
        if (isPosterUrl(candidate)) {
          poster = candidate
          break
        }
      }

      items.push({
        name,
        url: canonical,
        poster,
        description: sanitizeText(root.find('p, .description, .lead, [class*="desc"]').first().text()),
        releaseInfo: sanitizeText(
          root.find('time').attr('datetime') ||
            root.find('time').text() ||
            root.find('[class*="year"], [class*="date"]').first().text()
        ),
        genre: ''
      })
    })

    if (items.length >= 350) break
  }

  return items
}

function normalizeType(targetType, row) {
  if (targetType === 'series') return 'series'
  if (targetType === 'movie') return 'movie'

  const bucket = `${row.url || ''} ${row.name || ''} ${row.genre || ''}`.toLowerCase()
  if (bucket.includes('/adatlap/sorozat/') || bucket.includes('sorozat') || bucket.includes('series')) {
    return 'series'
  }
  return 'movie'
}

function toMeta(targetType, row) {
  const canonicalUrl = canonicalizeUrl(row.url) || `urn:porthu:${row.name}`
  const type = normalizeType(targetType, row)
  const name = sanitizeText(row.name)
  if (!name) return null

  return {
    id: makeMetaId(type, canonicalUrl, name),
    type,
    name,
    poster: row.poster || undefined,
    description: row.description || undefined,
    releaseInfo: row.releaseInfo || undefined,
    genres: row.genre ? row.genre.split(',').map((g) => sanitizeText(g)).filter(Boolean) : undefined,
    website: canonicalUrl || undefined
  }
}

function dedupeMetas(metas) {
  const byId = new Map()
  for (const meta of metas) {
    if (!meta) continue
    if (!byId.has(meta.id)) {
      byId.set(meta.id, meta)
      continue
    }

    const prev = byId.get(meta.id)
    byId.set(meta.id, {
      ...prev,
      name: prev.name.length >= meta.name.length ? prev.name : meta.name,
      poster: prev.poster || meta.poster,
      description: prev.description || meta.description,
      releaseInfo: prev.releaseInfo || meta.releaseInfo,
      genres: prev.genres || meta.genres,
      website: prev.website || meta.website
    })
  }

  return [...byId.values()]
}

async function fetchDetailHints(detailUrl) {
  const url = canonicalizeUrl(detailUrl)
  if (!url) return {}
  if (DETAIL_CACHE.has(url)) return DETAIL_CACHE.get(url)

  try {
    const { data } = await http.get(url)
    const $ = cheerio.load(data)
    const hint = {
      poster: absolutize(url, $('meta[property="og:image"]').attr('content')),
      description: sanitizeText(
        $('meta[property="og:description"]').attr('content') ||
          $('meta[name="description"]').attr('content')
      ),
      name: sanitizeText($('meta[property="og:title"]').attr('content') || $('h1').first().text())
    }
    DETAIL_CACHE.set(url, hint)
    return hint
  } catch {
    const empty = {}
    DETAIL_CACHE.set(url, empty)
    return empty
  }
}

async function enrichRows(rows) {
  const missing = rows.filter((r) => !r.poster && r.url).slice(0, 50)
  for (const row of missing) {
    const hint = await fetchDetailHints(row.url)
    if (!row.poster && isPosterUrl(hint.poster)) row.poster = hint.poster
    if (!row.description && hint.description) row.description = hint.description
    if ((!row.name || row.name.length < 2) && hint.name) row.name = hint.name
  }
}

async function fetchOneCatalogPage(url) {
  const { data } = await http.get(url)
  const $ = cheerio.load(data)
  const jsonLdItems = parseJsonLdBlocks($, url)
  const domItems = parseDomCards($, url)
  return [...jsonLdItems, ...domItems]
}

async function fetchCatalog({ type, genre, skip = 0, limit = 50 }) {
  const urls = CATALOG_URLS[type] || CATALOG_URLS.movie
  const rows = []
  const errors = []

  for (const url of urls) {
    try {
      const part = await fetchOneCatalogPage(url)
      rows.push(...part)
    } catch (error) {
      errors.push(`${url}: ${error.message}`)
    }
  }

  await enrichRows(rows)

  const metas = dedupeMetas(rows.map((r) => toMeta(type, r)).filter(Boolean))
    .filter((meta) => {
      if (!genre) return true
      const genreNeedle = genre.toLowerCase()
      return (meta.genres || []).some((g) => g.toLowerCase().includes(genreNeedle))
    })
    .filter((meta) => Boolean(meta.poster))
    .slice(skip, skip + limit)

  for (const meta of metas) {
    META_CACHE.set(meta.id, meta)
  }

  return {
    source: SOURCE_NAME,
    type,
    genre,
    skip,
    limit,
    metas,
    warnings: errors.length ? errors : undefined
  }
}

async function fetchMeta({ type, id }) {
  if (META_CACHE.has(id)) return { meta: META_CACHE.get(id) }

  const primary = await fetchCatalog({ type: type || 'movie', limit: 120, skip: 0 })
  const primaryMatch = primary.metas.find((m) => m.id === id)
  if (primaryMatch) return { meta: primaryMatch }

  const secondaryType = type === 'series' ? 'movie' : 'series'
  const secondary = await fetchCatalog({ type: secondaryType, limit: 120, skip: 0 })
  const secondaryMatch = secondary.metas.find((m) => m.id === id)
  if (secondaryMatch) return { meta: secondaryMatch }

  return { meta: null }
}

async function fetchStreams({ type, id }) {
  const { meta } = await fetchMeta({ type, id })
  if (!meta?.website) return { streams: [] }

  return {
    streams: [
      {
        name: 'Port.hu',
        title: 'Open on Port.hu',
        externalUrl: meta.website
      }
    ]
  }
}

module.exports = {
  fetchCatalog,
  fetchMeta,
  fetchStreams,
  fetchOneCatalogPage,
  parseJsonLdBlocks,
  parseDomCards,
  toMeta,
  dedupeMetas,
  SOURCE_NAME
}
