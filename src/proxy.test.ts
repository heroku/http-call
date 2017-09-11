import Proxy from './proxy'

beforeEach(() => {
  Proxy.env = {}
})

test('returns nothing', () => {
  expect(Proxy.agent(true)).toBeUndefined()
})

describe('with proxies', () => {
  beforeEach(() => {
    Proxy.env.HTTP_PROXY = 'http://user:pass@foo.com'
    Proxy.env.HTTPS_PROXY = 'https://user:pass@bar.com'
  })

  test('has http properties', () => {
    expect(Proxy.agent(false)).toMatchObject({
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
    expect(Proxy.agent(true)).toMatchObject({
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

describe('with http proxy only', () => {
  beforeEach(() => {
    Proxy.env.HTTP_PROXY = 'http://user:pass@foo.com'
  })

  test('has agent', () => {
    expect(Proxy.agent(true)).toMatchObject({
      defaultPort: 443,
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
})
