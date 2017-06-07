// @flow

import Proxy from './proxy'
import uri from 'url'

beforeEach(() => {
  Proxy.env = {}
})

const u = uri.parse('https://api.heroku.com/apps')

test('returns nothing', () => {
  expect(Proxy.agent(u)).toBeUndefined()
})

describe('with proxies', () => {
  beforeEach(() => {
    Proxy.env.HTTP_PROXY = 'http://user:pass@foo.com'
    Proxy.env.HTTPS_PROXY = 'https://user:pass@bar.com'
  })

  test('has http properties', () => {
    let u = uri.parse('http://api.heroku.com/apps')
    expect(Proxy.agent(u)).toMatchObject({
      options: {
        proxy: {
          host: 'foo.com',
          port: '8080',
          proxyAuth: 'user:pass'
        }
      },
      proxyOptions: {
        host: 'foo.com',
        port: '8080',
        proxyAuth: 'user:pass'
      }
    })
  })

  test('has https properties', () => {
    let u = uri.parse('https://api.heroku.com/apps')
    expect(Proxy.agent(u)).toMatchObject({
      defaultPort: 443,
      options: {
        proxy: {
          host: 'bar.com',
          port: '8080',
          proxyAuth: 'user:pass'
        }
      },
      proxyOptions: {
        host: 'bar.com',
        port: '8080',
        proxyAuth: 'user:pass'
      }
    })
  })
})
