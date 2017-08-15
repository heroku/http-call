// @flow

import util from 'util'
import uri from 'url'
import pjson from '../package.json'
import http from 'http'
import https from 'https'
import proxy from './proxy'
import isStream from 'is-stream'

const debug = require('debug')('http-call')

function concat (stream) {
  return new Promise(resolve => {
    let strings = []
    stream.on('data', data => strings.push(data))
    stream.on('end', () => resolve(strings.join('')))
  })
}

type Method = | 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
type Headers = { [key: string]: string }
type Protocol = | 'https:' | 'http:'

/**
 * @typedef {Object} HTTPRequestOptions
 * @property {Object.<string, string>} headers - request headers
 * @property {string} method - request method (GET/POST/etc)
 * @property {(string)} body - request body. Sets content-type to application/json and stringifies when object
 * @property {(boolean)} partial - do not make continuous requests while receiving a Next-Range header for GET requests
 * @property {(number)} port - port to use
 */
export type HTTPRequestOptions = $Shape<{
  method: Method,
  headers: Headers,
  raw?: boolean,
  host?: string,
  port?: number,
  protocol?: Protocol,
  body?: any,
  partial?: boolean
}>

/**
 * Utility for simple HTTP calls
 * @class
 */
export default class HTTP {
  /**
   * make an http GET request
   * @param {string} url - url or path to call
   * @param {HTTPRequestOptions} options
   * @returns {Promise}
   * @example
   * ```js
   * const http = require('http-call')
   * await http.get('https://google.com')
   * ```
   */
  static async get (url, options: HTTPRequestOptions = {}) {
    options.method = 'GET'
    let http = await this.request(url, options)
    return this._getNextBody(http)
  }

  /**
   * make an http POST request
   * @param {string} url - url or path to call
   * @param {HTTPRequestOptions} options
   * @returns {Promise}
   * @example
   * ```js
   * const http = require('http-call')
   * await http.post('https://google.com')
   * ```
   */
  static async post (url, options: HTTPRequestOptions = {}) {
    options.method = 'POST'
    let http = await this.request(url, options)
    return http.body
  }

  /**
   * make an http PUT request
   * @param {string} url - url or path to call
   * @param {HTTPRequestOptions} options
   * @returns {Promise}
   * @example
   * ```js
   * const http = require('http-call')
   * await http.put('https://google.com')
   * ```
   */
  static async put (url, options: HTTPRequestOptions = {}) {
    options.method = 'PUT'
    let http = await this.request(url, options)
    return http.body
  }

  /**
   * make an http PATCH request
   * @param {string} url - url or path to call
   * @param {HTTPRequestOptions} options
   * @returns {Promise}
   * @example
   * ```js
   * const http = require('http-call')
   * await http.patch('https://google.com')
   * ```
   */
  static async patch (url, options: HTTPRequestOptions = {}) {
    options.method = 'PATCH'
    let http = await this.request(url, options)
    return http.body
  }

  /**
   * make an http DELETE request
   * @param {string} url - url or path to call
   * @param {HTTPRequestOptions} options
   * @returns {Promise}
   * @example
   * ```js
   * const http = require('http-call')
   * await http.delete('https://google.com')
   * ```
   */
  static async delete (url, options: HTTPRequestOptions = {}) {
    options.method = 'DELETE'
    let http = await this.request(url, options)
    return http.body
  }

  /**
   * make a streaming request
   * @param {string} url - url or path to call
   * @param {HTTPRequestOptions} options
   * @returns {Promise}
   * @example
   * ```js
   * const http = require('http-call')
   * let rsp = await http.get('https://google.com')
   * rsp.on('data', console.log)
   * ```
   */
  static async stream (url: string, options: HTTPRequestOptions = {}) {
    options.method = options.method || 'GET'
    options.raw = true
    let http = await this.request(url, options)
    return http.response
  }

  static async request (url: string, options: HTTPRequestOptions = {}): Promise<this> {
    let http = new this(url, options)
    await http._request()
    return http
  }

  method: Method = 'GET'
  host = 'localhost'
  port = 0
  protocol = 'https:'
  path = '/'
  raw = false
  partial = false
  headers: Headers = {
    'user-agent': `${pjson.name}/${pjson.version} node-${process.version}`
  }
  response: http$IncomingMessage
  request: http$ClientRequest
  requestBody: any
  body: any
  agent: any
  options: HTTPRequestOptions

  constructor (url: string, options: HTTPRequestOptions = {}) {
    if (!url) throw new Error('no url provided')
    this.options = options
    let headers = Object.assign(this.headers, options.headers)
    Object.assign(this, options)
    this.headers = headers
    let u = uri.parse(url)
    this.protocol = u.protocol || this.protocol
    this.host = u.hostname || this.host
    this.port = u.port || this.port || (this.protocol === 'https:' ? 443 : 80)
    this.path = u.path || this.path
    if (options.body) this.parseBody(options.body)
    this.body = undefined
    this.agent = proxy.agent(this.protocol === 'https:')
    if (this.agent) debug('proxy: %j', this.agent.options)
  }

  async _request (retries: number = 0) {
    try {
      debug(`--> ${this.method} ${this.url}`)
      this.response = await this.performRequest()
      debug(`<-- ${this.method} ${this.url} ${this.response.statusCode}`)
    } catch (err) {
      return this.maybeRetry(err, retries)
    }
    if (this.response.statusCode >= 200 && this.response.statusCode < 300) {
      if (!this.raw) this.body = await this.parse(this.response)
    } else throw new HTTPError(this, await this.parse(this.response))
  }

  async maybeRetry (err: Error, retries: number) {
    const allowed = (err: Error): boolean => {
      if (retries >= 5) return false
      if (!err.code) return false
      if (err.code === 'ENOTFOUND') return true
      return require('is-retry-allowed')(err)
    }
    if (allowed(err)) {
      let noise = Math.random() * 100
      await this._wait((1 << retries) * 1000 + noise)
      await this._request(retries + 1)
      return
    }
    throw err
  }

  get http (): (typeof http | typeof https) {
    return this.protocol === 'https:' ? https : http
  }

  get url (): string {
    return `${this.protocol}//${this.host}${this.path}`
  }

  performRequest () {
    return new Promise((resolve, reject) => {
      this.request = this.http.request(this, resolve)
      this.request.on('error', reject)
      if (isStream.readable(this.requestBody)) {
        this.requestBody.pipe(this.request)
      } else {
        this.request.end(this.requestBody)
      }
    })
  }

  async parse (response: http$IncomingMessage) {
    let body = await concat(response)
    return response.headers['content-type'] === 'application/json'
      ? JSON.parse(body) : body
  }

  parseBody (body: Object) {
    if (isStream.readable(body)) {
      this.requestBody = body
      return
    }
    if (!this.headers['Content-Type']) {
      this.headers['Content-Type'] = 'application/json'
    }

    if (this.headers['Content-Type'] === 'application/json') {
      this.requestBody = JSON.stringify(body)
    } else {
      this.requestBody = body
    }
    this.headers['Content-Length'] = Buffer.byteLength(this.requestBody).toString()
  }

  static async _getNextBody (http: this) {
    if (http.partial || !http.response.headers['next-range'] || !(http.body instanceof Array)) return http.body
    let opts: HTTPRequestOptions = {headers: {}}
    opts = Object.assign(opts, http.options)
    opts.headers['range'] = http.response.headers['next-range']
    let next = await this.get(http.url, opts)
    return http.body.concat(next)
  }

  _wait (ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

export class HTTPError extends Error {
  statusCode: number
  http: HTTP
  body: any
  __httpcall = true

  constructor (http: HTTP, body: any) {
    let message
    if (typeof body === 'string' || typeof body.message === 'string') message = body.message || body
    else message = util.inspect(body)
    super(`HTTP Error ${http.response.statusCode} for ${http.method} ${http.url}\n${message}`)
    this.statusCode = http.response.statusCode
    this.http = http
    this.body = body
  }
}
