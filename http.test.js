/* globals
  afterEach
  beforeEach
  expect
  jest
  test
*/

import http from './http'
import nock from 'nock'
import pjson from './package.json'

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
  let rsp = await http.get('https://api.dickeyxxx.com')
  expect(rsp).toEqual({message: 'ok'})
})

test('sets user-agent header', async () => {
  api.get('/')
    .matchHeader('user-agent', `http-call/${pjson.version} node-${process.version}`)
    .reply(200, {message: 'ok'})
  await http.get('https://api.dickeyxxx.com')
})

test('sets custom headers', async () => {
  api.get('/')
    .matchHeader('foo', 'bar')
    .reply(200)
  let headers = {foo: 'bar'}
  await http.get('https://api.dickeyxxx.com', {headers})
})

test.skip('uses requestMiddleware', async () => {
  api.get('/')
    .reply(200, {message: 'ok'})

  let requestMiddleware = jest.fn()
  await http.get('https://api.dickeyxxx.com', {requestMiddleware})
  expect(requestMiddleware.mock.calls.length).toBe(1)
})
