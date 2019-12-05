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
          proxyAuth: 'user:pass',
        },
      },
      proxyOptions: {
        host: 'foo.com',
        port: '8080',
        proxyAuth: 'user:pass',
      },
    })
  })

  test('has https properties', () => {
    expect(Proxy.agent(true)).toMatchObject({
      defaultPort: 443,
      options: {
        proxy: {
          host: 'bar.com',
          port: '8080',
          proxyAuth: 'user:pass',
        },
      },
      proxyOptions: {
        host: 'bar.com',
        port: '8080',
        proxyAuth: 'user:pass',
      },
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
          proxyAuth: 'user:pass',
        },
      },
      proxyOptions: {
        host: 'foo.com',
        port: '8080',
        proxyAuth: 'user:pass',
      },
    })
  })
})

describe('with no_proxy', () => {
  beforeEach(() => {
    Proxy.env.HTTP_PROXY = 'http://user:pass@foo.com'
    Proxy.env.NO_PROXY = 'some.com,test-domain.com'
  })

  test('is an exact match of no_proxy', () => {
    expect(Proxy.agent(false, 'test-domain.com')).toBeUndefined()
  })

  test('is a subdomain of no_proxy', () => {
    expect(Proxy.agent(false, 'something.prod.test-domain.com')).toBeUndefined()
  })

  test('should be proxied', () => {
    expect(Proxy.agent(false, 'proxied-domain.com')).toMatchObject({
      options: {
        proxy: {
          host: 'foo.com',
          port: '8080',
          proxyAuth: 'user:pass',
        },
      },
      proxyOptions: {
        host: 'foo.com',
        port: '8080',
        proxyAuth: 'user:pass',
      },
    })
  })
})

describe('proxy dodging', () => {
  test('not set should proxy', () => {
    Proxy.env.NO_PROXY = ''
    expect(Proxy.shouldDodgeProxy('test-domain.com')).toBe(false)
    expect(Proxy.shouldDodgeProxy('other-domain.com')).toBe(false)
  })

  test('wildcard proxies any', () => {
    Proxy.env.NO_PROXY = '*'
    expect(Proxy.shouldDodgeProxy('test-domain.com')).toBe(true)
    expect(Proxy.shouldDodgeProxy('anything.other-domain.com')).toBe(true)
  })

  test('exact domain should also match subdomains', () => {
    Proxy.env.NO_PROXY = 'test-domain.com'
    expect(Proxy.shouldDodgeProxy('test-domain.com')).toBe(true)
    expect(Proxy.shouldDodgeProxy('anything.test-domain.com')).toBe(true)
    expect(Proxy.shouldDodgeProxy('other-domain.com')).toBe(false)
    expect(Proxy.shouldDodgeProxy('anything.other-domain.com')).toBe(false)
  })

  test('any sub domain should include the domain itself', () => {
    Proxy.env.NO_PROXY = '.test-domain.com'
    expect(Proxy.shouldDodgeProxy('test-domain.com')).toBe(true)
    expect(Proxy.shouldDodgeProxy('anything.test-domain.com')).toBe(true)
    expect(Proxy.shouldDodgeProxy('other-domain.com')).toBe(false)
    expect(Proxy.shouldDodgeProxy('anything.other-domain.com')).toBe(false)
  })

  test('multiple domains', () => {
    Proxy.env.NO_PROXY = '.test-domain.com, .other-domain.com'
    expect(Proxy.shouldDodgeProxy('test-domain.com')).toBe(true)
    expect(Proxy.shouldDodgeProxy('anything.test-domain.com')).toBe(true)
    expect(Proxy.shouldDodgeProxy('other-domain.com')).toBe(true)
    expect(Proxy.shouldDodgeProxy('anything.other-domain.com')).toBe(true)
  })

  test('match any subdomains', () => {
    Proxy.env.NO_PROXY = '.test-domain.com, other-domain.com'
    expect(Proxy.shouldDodgeProxy('test-domain.com')).toBe(true)
    expect(Proxy.shouldDodgeProxy('something.something-else.anything.test-domain.com')).toBe(true)
    expect(Proxy.shouldDodgeProxy('other-domain.com')).toBe(true)
    expect(Proxy.shouldDodgeProxy('something.anything.other-domain.com')).toBe(true)
  })
})
