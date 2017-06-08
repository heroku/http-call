// @flow

import HTTP from './http'
import nock from 'nock'
import pjson from '../package.json'
import querystring from 'querystring'

nock.disableNetConnect()

let api

beforeEach(() => {
  api = nock('https://api.dickeyxxx.com')
})

afterEach(() => {
  api.done()
})

describe('HTTP.get()', () => {
  test('makes a GET request', async () => {
    api.get('/')
      .reply(200, {message: 'ok'})
    let rsp = await HTTP.get('https://api.dickeyxxx.com')
    expect(rsp).toEqual({message: 'ok'})
  })

  test('makes a request to a port', async () => {
    api = nock('https://api.dickeyxxx.com:3000')
    api.get('/')
      .reply(200, {message: 'ok'})
    let rsp = await HTTP.get('https://api.dickeyxxx.com:3000')
    expect(rsp).toEqual({message: 'ok'})
  })

  test('makes a http GET request', async () => {
    api = nock('http://api.dickeyxxx.com')
    api.get('/')
      .reply(200, {message: 'ok'})
    let rsp = await HTTP.get('http://api.dickeyxxx.com')
    expect(rsp).toEqual({message: 'ok'})
  })

  test('can default host by subclassing', async () => {
    class MyHTTP extends HTTP {host = 'api.dickeyxxx.com'}
    api.get('/')
      .reply(200, {message: 'ok'})
    let rsp = await MyHTTP.get('/')
    expect(rsp).toEqual({message: 'ok'})
  })

  test('sets user-agent header', async () => {
    api.get('/')
      .matchHeader('user-agent', `http-call/${pjson.version} node-${process.version}`)
      .reply(200, {message: 'ok'})
    await HTTP.get('https://api.dickeyxxx.com')
  })

  test('sets custom headers', async () => {
    api.get('/')
      .matchHeader('foo', 'bar')
      .reply(200)
    let headers = {foo: 'bar'}
    await HTTP.get('https://api.dickeyxxx.com', {headers})
  })

  describe('wait mocked out', () => {
    let wait = HTTP.prototype._wait

    beforeAll(() => {
      ;(HTTP.prototype: any)._wait = jest.fn()
    })

    afterAll(() => {
      ;(HTTP.prototype: any)._wait = wait
    })

    test('retries then succeeds', async () => {
      api.get('/').replyWithError({message: 'timed out 1', code: 'ETIMEDOUT'})
      api.get('/').replyWithError({message: 'timed out 2', code: 'ETIMEDOUT'})
      api.get('/').replyWithError({message: 'timed out 3', code: 'ETIMEDOUT'})
      api.get('/').replyWithError({message: 'timed out 4', code: 'ETIMEDOUT'})
      api.get('/').reply(200, {message: 'foo'})
      let rsp = await HTTP.get('https://api.dickeyxxx.com')
      expect(rsp).toEqual({message: 'foo'})
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
        await HTTP.get('https://api.dickeyxxx.com')
      } catch (err) {
        expect(err.message).toEqual('timed out 6')
      }
    })
  })

  test('errors on ENOTFOUND', async () => {
    expect.assertions(1)
    api.get('/').replyWithError({message: 'not found', code: 'ENOTFOUND'})
    try {
      await HTTP.get('https://api.dickeyxxx.com')
    } catch (err) {
      expect(err.message).toEqual('not found')
    }
  })

  test('displays 404 error', async () => {
    expect.assertions(2)
    api.get('/')
      .reply(404, 'oops! not found')
    try {
      await HTTP.get('https://api.dickeyxxx.com')
    } catch (err) {
      expect(err.statusCode).toEqual(404)
      expect(err.message).toEqual(`HTTP Error 404 for GET https://api.dickeyxxx.com:443/
oops! not found`)
    }
  })

  test('displays error message', async () => {
    expect.assertions(3)
    api.get('/')
      .reply(404, {message: 'uh oh', otherinfo: [1, 2, 3]})
    try {
      await HTTP.get('https://api.dickeyxxx.com')
    } catch (err) {
      expect(err.statusCode).toEqual(404)
      expect(err.message).toEqual(`HTTP Error 404 for GET https://api.dickeyxxx.com:443/
uh oh`)
      expect(err.body).toMatchObject({otherinfo: [1, 2, 3]})
    }
  })

  test('displays object error', async () => {
    expect.assertions(3)
    api.get('/')
      .reply(404, {otherinfo: [1, 2, 3]})
    try {
      await HTTP.get('https://api.dickeyxxx.com')
    } catch (err) {
      expect(err.statusCode).toEqual(404)
      expect(err.message).toEqual(`HTTP Error 404 for GET https://api.dickeyxxx.com:443/
{ otherinfo: [ 1, 2, 3 ] }`)
      expect(err.body).toMatchObject({otherinfo: [1, 2, 3]})
    }
  })
})

describe('HTTP.post()', () => {
  test('makes a POST request', async () => {
    api.post('/', {'foo': 'bar'})
      .reply(200, {message: 'ok'})
    let rsp = await HTTP.post('https://api.dickeyxxx.com', {body: {'foo': 'bar'}})
    expect(rsp).toEqual({message: 'ok'})
  })
  test('does not include a body if no body is passed in', async () => {
    api.post('/')
      .reply(200, {message: 'ok'})
    let rsp = await HTTP.post('https://api.dickeyxxx.com')
    expect(rsp).toEqual({message: 'ok'})
  })
  test('faithfully passes custom-encoded content-types', async () => {
    let apiEncoded = nock('https://api.dickeyxxx.com', {
      reqheaders: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    let body = {
      'karate': 'chop',
      'judo': 'throw',
      'taewkondo': 'kick',
      'jujitsu': 'strangle'
    }

    let options = {
      'headers': {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      'body': querystring.stringify(body)
    }

    apiEncoded
      .post('/', querystring.stringify(body))
      .reply(200, {message: 'ok'})

    let rsp = await HTTP.post('https://api.dickeyxxx.com/', options)
    expect(rsp).toEqual({message: 'ok'})
  })
})
describe('HTTP.parseBody()', () => {
  let body
  let http
  beforeEach(() => {
    body = {
      'karate': 'chop',
      'judo': 'throw',
      'taewkondo': 'kick',
      'jujitsu': 'strangle'
    }
    http = new HTTP('www.duckduckgo.com', {'body': body})
  })
  it('sets the Content-Length', () => {
    expect(http.headers['Content-Length']).toEqual(Buffer.byteLength(JSON.stringify(body)).toString())
  })
  it('sets the Content-Type to JSON when Content-Type is unspecificed', () => {
    expect(http.headers['Content-Type']).toEqual('application/json')
  })
  it('does not set the Content Type if it already exists', () => {
    let options = {
      'headers': {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      'body': querystring.stringify(body)
    }
    http = new HTTP('www.duckduckgo.com', options)
    expect(http.headers['Content-Type']).toEqual(options.headers['Content-Type'])
  })
  it('resets the value for http.body object', () => {
    expect(http.body).toBe(undefined)
  })
  it('sets the requestBody to the body contents', () => {
    expect(http.requestBody).toBe(JSON.stringify(body))
  })

  describe('with next-range header', () => {
    beforeEach(() => {
      api.get('/')
        .reply(206, [1, 2, 3], {
          'next-range': '4'
        })
      .get('/')
        .matchHeader('range', '4')
        .reply(206, [4, 5, 6], {
          'next-range': '7'
        })
      .get('/')
        .matchHeader('range', '7')
        .reply(206, [7, 8, 9])
    })
    test('gets next body when next-range is set', async () => {
      let rsp = await HTTP.get('https://api.dickeyxxx.com')
      expect(rsp).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    })
  })
})

describe('HTTP.put()', () => {
  test('makes a PUT request', async () => {
    api.put('/', {'foo': 'bar'})
      .reply(200, {message: 'ok'})
    let rsp = await HTTP.put('https://api.dickeyxxx.com', {body: {'foo': 'bar'}})
    expect(rsp).toEqual({message: 'ok'})
  })
})

describe('HTTP.patch()', () => {
  test('makes a PATCH request', async () => {
    api.patch('/', {'foo': 'bar'})
      .reply(200, {message: 'ok'})
    let rsp = await HTTP.patch('https://api.dickeyxxx.com', {body: {'foo': 'bar'}})
    expect(rsp).toEqual({message: 'ok'})
  })
})

describe('HTTP.delete()', () => {
  test('makes a DELETE request', async () => {
    api.delete('/', {'foo': 'bar'})
      .reply(200, {message: 'ok'})
    let rsp = await HTTP.delete('https://api.dickeyxxx.com', {body: {'foo': 'bar'}})
    expect(rsp).toEqual({message: 'ok'})
  })
})

describe('HTTP.stream()', () => {
  test('streams a response', async done => {
    api = nock('http://api.dickeyxxx.com')
    api.get('/')
      .reply(200, {message: 'ok'})
    let rsp = await HTTP.stream('http://api.dickeyxxx.com')
    rsp.setEncoding('utf8')
    rsp.on('data', data => expect(data).toEqual('{"message":"ok"}'))
    rsp.on('end', done)
  })
})
