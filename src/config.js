function defaultConfig() {
  return {
    sources: {
      mafab: true,
      porthu: false
    }
  }
}

function normalizeConfig(input = {}) {
  const d = defaultConfig()
  return {
    sources: {
      mafab: input?.sources?.mafab !== undefined ? Boolean(input.sources.mafab) : d.sources.mafab,
      porthu: input?.sources?.porthu !== undefined ? Boolean(input.sources.porthu) : d.sources.porthu
    }
  }
}

function encodeConfig(config) {
  const json = JSON.stringify(normalizeConfig(config))
  return Buffer.from(json, 'utf8').toString('base64url')
}

function decodeConfig(token) {
  if (!token) return defaultConfig()
  try {
    const json = Buffer.from(token, 'base64url').toString('utf8')
    return normalizeConfig(JSON.parse(json))
  } catch {
    return defaultConfig()
  }
}

module.exports = {
  defaultConfig,
  normalizeConfig,
  encodeConfig,
  decodeConfig
}
