const test = require('node:test')
const assert = require('node:assert/strict')

const apiHandler = require('../api/index')
const { getRequestOrigin } = apiHandler._internals

test('getRequestOrigin prefers forwarded headers on deployment', () => {
  const origin = getRequestOrigin({
    headers: {
      'x-forwarded-proto': 'https',
      'x-forwarded-host': 'porthu-addon.vercel.app'
    }
  })

  assert.equal(origin, 'https://porthu-addon.vercel.app')
})

test('getRequestOrigin falls back to host header', () => {
  const origin = getRequestOrigin({
    headers: {
      host: 'localhost:7000'
    }
  })

  assert.equal(origin, 'http://localhost:7000')
})
