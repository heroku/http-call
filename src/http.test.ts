import * as nock from 'nock'
import * as querystring from 'node:querystring'
import * as sinon from 'sinon'
const stripAnsi = require('strip-ansi')
const debug = require('debug')

// eslint-disable-next-line node/no-missing-import
import {Global} from './global'
import {HTTP} from './http'

nock.disableNetConnect()

let api: nock.Scope

beforeEach(() => {
  api = nock('https://api.jdxcode.com')
})

afterEach(() => {
  api.done()
})
afterEach(() => {
  nock.cleanAll()
})

describe('HTTP.get()', () => {
  test('makes a GET request', async () => {
    api.get('/').reply(200, {message: 'ok'})
    const {body} = await HTTP.get('https://api.jdxcode.com')
    expect(body).toEqual({message: 'ok'})
  })

  test('makes a GET request', async () => {
    api.get('/').reply(
      200,
      {message: 'ok'},
      {
        'content-type': 'application/json; charset=UTF-8',
      },
    )
    const {body} = await HTTP.get('https://api.jdxcode.com')
    expect(body).toEqual({message: 'ok'})
  })

  test('gets headers', async () => {
    api.get('/').reply(200, {message: 'ok'}, {myheader: 'ok'})
    const {body, headers} = await HTTP.get('https://api.jdxcode.com')
    expect(body).toEqual({message: 'ok'})
    expect(headers).toMatchObject({myheader: 'ok'})
  })

  test('can build a new HTTP with defaults', async () => {
    const MyHTTP = HTTP.create({host: 'api.jdxcode.com'})
    api.get('/').reply(200, {message: 'ok'})
    const {body} = await MyHTTP.get('/')
    expect(body).toEqual({message: 'ok'})
  })

  test('makes a request to a port', async () => {
    api = nock('https://api.jdxcode.com:3000')
    api.get('/').reply(200, {message: 'ok'})
    const {body} = await HTTP.get('https://api.jdxcode.com:3000')
    expect(body).toEqual({message: 'ok'})
  })

  test('allows specifying the port', async () => {
    api = nock('https://api.jdxcode.com:3000')
    api.get('/').reply(200, {message: 'ok'})
    const {body} = await HTTP.get('https://api.jdxcode.com', {port: 3000})
    expect(body).toEqual({message: 'ok'})
  })

  test('makes a http GET request', async () => {
    api = nock('http://api.jdxcode.com')
    api.get('/').reply(200, {message: 'ok'})
    const {body} = await HTTP.get('http://api.jdxcode.com')
    expect(body).toEqual({message: 'ok'})
  })

  test('can set default user agent', async () => {
    HTTP.defaults.headers = {'user-agent': 'mynewuseragent'}
    api
      .matchHeader('user-agent', 'mynewuseragent')
      .get('/')
      .reply(200, {message: 'ok'})
    const {body} = await HTTP.get('https://api.jdxcode.com/')
    expect(body).toEqual({message: 'ok'})
    delete HTTP.defaults.headers['user-agent']
  })

  test('can set user agent as a global', async () => {
    (global as any).httpCall = {userAgent: 'mynewuseragent'}
    api
      .matchHeader('user-agent', 'mynewuseragent')
      .get('/')
      .reply(200, {message: 'ok'})
    const {body} = await HTTP.get('https://api.jdxcode.com/')
    expect(body).toEqual({message: 'ok'})
    delete (global as Global).httpCall
  })

  test('sets user-agent header', async () => {
    api
      .matchHeader('user-agent', `@heroku/http-call/${require('../package.json').version} node-${process.version}`)
      .get('/')
      .reply(200, {message: 'ok'})
    await HTTP.get('https://api.jdxcode.com')
  })

  test('sets custom headers', async () => {
    api
      .matchHeader('foo', 'bar')
      .get('/')
      .reply(200)
    const headers = {foo: 'bar'}
    await HTTP.get('https://api.jdxcode.com', {headers})
  })

  test('does not fail on undefined header', async () => {
    api.get('/').reply(200)
    const headers = {foo: undefined} as any
    await HTTP.get('https://api.jdxcode.com', {headers})
  })

  describe('wait mocked out', () => {
    const wait = (HTTP.prototype as any)._wait

    beforeAll(() => {
      (HTTP.prototype as any)._wait = jest.fn()
    })

    afterAll(() => {
      (HTTP.prototype as any)._wait = wait
    })

    test('retries then succeeds', async () => {
      api.get('/').replyWithError({message: 'timed out 1', code: 'ETIMEDOUT'})
      api.get('/').replyWithError({message: 'timed out 2', code: 'ETIMEDOUT'})
      api.get('/').replyWithError({message: 'timed out 3', code: 'ETIMEDOUT'})
      api.get('/').replyWithError({message: 'timed out 4', code: 'ETIMEDOUT'})
      api.get('/').reply(200, {message: 'foo'})
      const {body} = await HTTP.get('https://api.jdxcode.com')
      expect(body).toEqual({message: 'foo'})
    })

    test('retries 5 times on ETIMEDOUT', async () => {
      expect.assertions(1)
      api.get('/').replyWithError({message: 'timed out 1', code: 'ETIMEDOUT'})
      api.get('/').replyWithError({message: 'timed out 2', code: 'ETIMEDOUT'})
      api.get('/').replyWithError({message: 'timed out 3', code: 'ETIMEDOUT'})
      api.get('/').replyWithError({message: 'timed out 4', code: 'ETIMEDOUT'})
      api.get('/').replyWithError({message: 'timed out 5', code: 'ETIMEDOUT'})
      api.get('/').replyWithError({message: 'timed out 6', code: 'ETIMEDOUT'})
      try {
        await HTTP.get('https://api.jdxcode.com')
      } catch (error: any) {
        expect(error.message).toEqual('timed out 6')
      }
    })
  })

  test('retries on ENOTFOUND', async () => {
    api.get('/').replyWithError({message: 'not found', code: 'ENOTFOUND'})
    api.get('/').reply(200, {message: 'foo'})
    const {body} = await HTTP.get('https://api.jdxcode.com')
    expect(body).toMatchObject({message: 'foo'})
  })

  test('errors on EFOOBAR', async () => {
    expect.assertions(1)
    api.get('/').replyWithError({message: 'oom', code: 'OUT_OF_MEM'})
    try {
      await HTTP.get('https://api.jdxcode.com')
    } catch (error: any) {
      expect(error.message).toEqual('oom')
    }
  })

  test('displays 404 error', async () => {
    expect.assertions(2)
    api.get('/').reply(404, 'oops! not found')
    try {
      await HTTP.get('https://api.jdxcode.com')
    } catch (error: any) {
      expect(error.statusCode).toEqual(404)
      expect(error.message).toEqual(`HTTP Error 404 for GET https://api.jdxcode.com/
oops! not found`)
    }
  })

  test('displays error message', async () => {
    expect.assertions(3)
    api.get('/').reply(404, {message: 'uh oh', otherinfo: [1, 2, 3]})
    try {
      await HTTP.get('https://api.jdxcode.com')
    } catch (error: any) {
      expect(error.statusCode).toEqual(404)
      expect(error.message).toEqual(`HTTP Error 404 for GET https://api.jdxcode.com/
uh oh`)
      expect(error.body).toMatchObject({otherinfo: [1, 2, 3]})
    }
  })

  test('displays object error', async () => {
    expect.assertions(3)
    api.get('/').reply(404, {otherinfo: [1, 2, 3]})
    try {
      await HTTP.get('https://api.jdxcode.com')
    } catch (error: any) {
      expect(error.statusCode).toEqual(404)
      expect(error.message).toEqual(`HTTP Error 404 for GET https://api.jdxcode.com/
{ otherinfo: [ 1, 2, 3 ] }`)
      expect(error.body).toMatchObject({otherinfo: [1, 2, 3]})
    }
  })

  test('follows redirect', async () => {
    api.get('/foo1').reply(302, undefined, {Location: 'https://api.jdxcode.com/foo2'})
    api.get('/foo2').reply(302, undefined, {Location: 'https://api.jdxcode.com/foo3'})
    api.get('/foo3').reply(200, {success: true})
    await HTTP.get('https://api.jdxcode.com/foo1')
  })

  test('follows redirect only 10 times', async () => {
    api.get('/foo1').reply(302, undefined, {Location: 'https://api.jdxcode.com/foo2'})
    api.get('/foo2').reply(302, undefined, {Location: 'https://api.jdxcode.com/foo3'})
    api.get('/foo3').reply(302, undefined, {Location: 'https://api.jdxcode.com/foo4'})
    api.get('/foo4').reply(302, undefined, {Location: 'https://api.jdxcode.com/foo5'})
    api.get('/foo5').reply(302, undefined, {Location: 'https://api.jdxcode.com/foo6'})
    api.get('/foo6').reply(302, undefined, {Location: 'https://api.jdxcode.com/foo7'})
    api.get('/foo7').reply(302, undefined, {Location: 'https://api.jdxcode.com/foo8'})
    api.get('/foo8').reply(302, undefined, {Location: 'https://api.jdxcode.com/foo9'})
    api.get('/foo9').reply(302, undefined, {Location: 'https://api.jdxcode.com/foo10'})
    api.get('/foo10').reply(302, undefined, {Location: 'https://api.jdxcode.com/foo11'})
    api.get('/foo11').reply(302, undefined, {Location: 'https://api.jdxcode.com/foo12'})
    expect.assertions(1)
    try {
      await HTTP.get('https://api.jdxcode.com/foo1')
    } catch (error: any) {
      expect(error.message).toEqual('Redirect loop at https://api.jdxcode.com/foo11')
    }
  })
})

describe('HTTP.post()', () => {
  test('makes a POST request', async () => {
    api.post('/', {foo: 'bar'}).reply(200, {message: 'ok'})
    const {body} = await HTTP.post('https://api.jdxcode.com', {body: {foo: 'bar'}})
    expect(body).toEqual({message: 'ok'})
  })
  test('does not include a body if no body is passed in', async () => {
    api.post('/').reply(200, {message: 'ok'})
    const {body} = await HTTP.post('https://api.jdxcode.com')
    expect(body).toEqual({message: 'ok'})
  })
  test('faithfully passes custom-encoded content-types', async () => {
    const apiEncoded = nock('https://api.jdxcode.com', {
      reqheaders: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    const body = {
      karate: 'chop',
      judo: 'throw',
      taewkondo: 'kick',
      jujitsu: 'strangle',
    }

    const options = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: querystring.stringify(body),
    }

    apiEncoded.post('/', querystring.stringify(body)).reply(200, {message: 'ok'})

    const rsp = await HTTP.post('https://api.jdxcode.com/', options)
    expect(rsp.body).toEqual({message: 'ok'})
  })
})
describe('HTTP.parseBody()', () => {
  let body: any
  let http: HTTP<any>
  beforeEach(() => {
    body = {
      karate: 'chop',
      judo: 'throw',
      taewkondo: 'kick',
      jujitsu: 'strangle',
    }
    http = new HTTP('www.duckduckgo.com', {body})
  })
  it('sets the Content-Length', () => {
    expect(http.options.headers['Content-Length']).toEqual(Buffer.byteLength(JSON.stringify(body)).toString())
  })
  it('sets the Content-Type to JSON when Content-Type is unspecified', () => {
    expect(http.options.headers['content-type']).toEqual('application/json')
  })
  it('does not set the Content Type if it already exists', () => {
    const options = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: querystring.stringify(body),
    }
    http = new HTTP('www.duckduckgo.com', options)
    expect(http.options.headers['content-type']).toEqual('application/x-www-form-urlencoded')
  })
  it('resets the value for http.body object', () => {
    expect(http.body).toBe(undefined)
  })
  it('sets the requestBody to the body contents', () => {
    expect(http.options.body).toBe(JSON.stringify(body))
  })

  describe('with next-range header', () => {
    beforeEach(() => {
      api
        .get('/')
        .reply(206, [1, 2, 3], {
          'next-range': '4',
        })
        .get('/')
        // .matchHeader('range', '4')
        .reply(206, [4, 5, 6], {
          'next-range': '7',
        })
        .get('/')
        // .matchHeader('range', '7')
        .reply(206, [7, 8, 9])
    })
    test('gets next body when next-range is set', async () => {
      const {body} = await HTTP.get<number[]>('https://api.jdxcode.com')
      expect(body).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    })
  })
})

describe('debug logs', () => {
  let debugSpy: sinon.SinonSpy
  beforeEach(() => {
    debugSpy = sinon.spy(debug, 'log')
    debug.enable('*')
  })
  afterEach(() => {
    debug.disable('*')
    debugSpy.restore()
  })

  it('redacts authorization header from debug logs', async () => {
    api.get('/').reply(200, {message: 'ok'}, {authorization: '1234567890'})
    await HTTP.get('https://api.jdxcode.com')
    expect(stripAnsi(debugSpy.secondCall.firstArg)).toContain('authorization: \'[REDACTED]\'')
  })

  it('redacts x-addon-sso header from debug logs', async () => {
    api.get('/').reply(200, {message: 'ok'}, {'x-addon-sso': '1234567890'})
    await HTTP.get('https://api.jdxcode.com')
    expect(stripAnsi(debugSpy.secondCall.firstArg)).toContain('x-addon-sso: \'[REDACTED]\'')
  })

  it('redacts the response from endpoints ending in /sso from debug logs', async () => {
    api.get('/sso').reply(200, {message: 'ok'})
    await HTTP.get('https://api.jdxcode.com/sso')
    expect(stripAnsi(debugSpy.secondCall.firstArg)).toContain('[REDACTED]')
  })
})

describe('HTTP.put()', () => {
  test('makes a PUT request', async () => {
    api.put('/', {foo: 'bar'}).reply(200, {message: 'ok'})
    const {body} = await HTTP.put('https://api.jdxcode.com', {body: {foo: 'bar'}})
    expect(body).toEqual({message: 'ok'})
  })
})

describe('HTTP.patch()', () => {
  test('makes a PATCH request', async () => {
    api.patch('/', {foo: 'bar'}).reply(200, {message: 'ok'})
    const {body} = await HTTP.patch('https://api.jdxcode.com', {body: {foo: 'bar'}})
    expect(body).toEqual({message: 'ok'})
  })
})

describe('HTTP.delete()', () => {
  test('makes a DELETE request', async () => {
    api.delete('/', {foo: 'bar'}).reply(200, {message: 'ok'})
    const {body} = await HTTP.delete('https://api.jdxcode.com', {body: {foo: 'bar'}})
    expect(body).toEqual({message: 'ok'})
  })
})

describe('HTTP.stream()', () => {
  test('streams a response', async () => {
    api = nock('http://api.jdxcode.com')
    api.get('/').reply(200, {message: 'ok'})
    const {response} = await HTTP.stream('http://api.jdxcode.com')
    response.setEncoding('utf8')
    response.on('data', data => expect(data).toEqual('{"message":"ok"}'))
  })
})
