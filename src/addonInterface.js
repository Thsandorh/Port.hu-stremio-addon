const { addonBuilder } = require('stremio-addon-sdk')
const { fetchCatalog, SOURCE_NAME } = require('./porthuAdapter')
const { manifest } = require('./manifest')

function createAddonInterface() {
  const builder = new addonBuilder(manifest)

  builder.defineCatalogHandler(async ({ type, id, extra = {} }) => {
    if (!['movie', 'series'].includes(type)) return { metas: [] }
    if (id !== `porthu-${type}`) return { metas: [] }

    const limit = Math.min(Number(process.env.CATALOG_LIMIT || 50), 100)
    const skip = Math.max(Number(extra.skip || 0), 0)

    try {
      const result = await fetchCatalog({
        type,
        genre: extra.genre,
        skip,
        limit
      })

      if (result.warnings?.length) {
        console.warn(`[${SOURCE_NAME}] catalog warnings:\n${result.warnings.join('\n')}`)
      }

      return { metas: result.metas }
    } catch (error) {
      console.error(`[${SOURCE_NAME}] catalog handler failed: ${error.message}`)
      return { metas: [] }
    }
  })

  return builder.getInterface()
}

module.exports = {
  manifest,
  createAddonInterface
}
