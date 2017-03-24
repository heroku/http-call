// @flow

import HTTP from './http'
import nock from 'nock'
import pjson from '../package.json'

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

  test('displays 404 error', async () => {
    expect.assertions(1)
    api.get('/')
      .reply(404, 'oops! not found')
    try {
      await HTTP.get('https://api.dickeyxxx.com')
    } catch (err) {
      expect(err.message).toEqual(`HTTP Error 404 for GET https://api.dickeyxxx.com:443/
'oops! not found'`)
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
    http = new HTTP('www.duckduckgo.com', { 'body': body })
  })
  it('sets the Content-Length', () => {
    HTTP.parseBody(http)
    expect(http.headers['Content-Length']).toEqual(Buffer.byteLength(JSON.stringify(body)).toString())
  })
  it('sets the Content-Type to JSON', () => {
    HTTP.parseBody(http)
    expect(http.headers['Content-Type']).toEqual('application/json')
  })
  it('does not set the Content Type if it already exists', () => {
    let options = {
      'headers': {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      'body': body
    }
    http = new HTTP('www.duckduckgo.com', options)
    HTTP.parseBody(http)
    expect(http.headers['Content-Type']).toEqual(options.headers['Content-Type'])
  })
  it('resets the value for http.body object', () => {
    HTTP.parseBody(http)
    expect(http.body).toBe(undefined)
  })
  it('sets the requestBody to the body contents', () => {
    HTTP.parseBody(http)
    expect(http.requestBody).toBe(JSON.stringify(body))
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
