const manifest = {
  id: 'community.porthu.catalog',
  version: '1.5.0',
  name: 'Port.hu Catalog',
  description: 'Stremio catalog addon for Port.hu movie and series listings.',
  resources: ['catalog', 'meta', 'stream'],
  types: ['movie', 'series'],
  idPrefixes: ['tt', 'porthu:'],
  catalogs: [
    {
      type: 'movie',
      id: 'porthu-movie',
      name: 'Port.hu Movies',
      extra: [{ name: 'genre' }, { name: 'skip' }]
    },
    {
      type: 'series',
      id: 'porthu-series',
      name: 'Port.hu Series',
      extra: [{ name: 'genre' }, { name: 'skip' }]
    }
  ]
}

module.exports = { manifest }
