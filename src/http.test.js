// @flow

/* globals
  afterEach
  beforeEach
  expect
  test
*/

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
