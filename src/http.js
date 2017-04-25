// @flow

import util from 'util'
import uri from 'url'
import pjson from '../package.json'
import http from 'http'
import https from 'https'
import proxyutil from './proxy-util'

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
 * @property {(number)} port - port to use
 */
export type HTTPRequestOptions = {
  method: Method,
  headers: Headers,
  raw?: boolean,
  host?: string,
  port?: number,
  protocol?: Protocol,
  body?: any
}

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
  static async get (url, options: $Shape<HTTPRequestOptions> = {}) {
    options.method = 'GET'
    let http = new this(url, options)
    await http.request()
    return http.body
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
  static async post (url, options: $Shape<HTTPRequestOptions> = {}) {
    options.method = 'POST'
    let http = new this(url, options)
    await http.request()
    return http.body
  }

  parseBody (body: Object) {
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
  static async stream (url: string, options: $Shape<HTTPRequestOptions> = {}) {
    options.method = 'GET'
    options.raw = true
    let http = new this(url, options)
    await http.request()
    return http.response
  }

  method: Method = 'GET'
  host = 'localhost'
  port = 0
  protocol = 'https:'
  path = '/'
  raw = false
  headers: Headers = {
    'user-agent': `${pjson.name}/${pjson.version} node-${process.version}`
  }
  response: http$IncomingMessage
  requestBody: any
  body: any
  agent: any

  constructor (url: string, options: $Shape<HTTPRequestOptions> = {}) {
    if (!url) throw new Error('no url provided')
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
    if (proxyutil.usingProxy) this.agent = proxyutil.agent(u)
  }

  async request () {
    this.response = await this.performRequest()
    if (this.response.statusCode >= 200 && this.response.statusCode < 300) {
      if (!this.raw) this.body = await this.parse(this.response)
    } else throw new this.HTTPError(this, await this.parse(this.response))
  }

  get http (): (typeof http | typeof https) {
    return this.protocol === 'https:' ? https : http
  }

  get url (): string {
    return `${this.protocol}//${this.host}${this.path}`
  }

  performRequest () {
    return new Promise((resolve, reject) => {
      let request = this.http.request(this, resolve)
      request.on('error', reject)
      if (this.requestBody) request.write(this.requestBody)
      request.end()
    })
  }

  async parse (response: http$IncomingMessage) {
    let body = await concat(response)
    return response.headers['content-type'] === 'application/json'
      ? JSON.parse(body) : body
  }

  HTTPError = class HTTPError extends Error {
    statusCode: number

    constructor (http: HTTP, body: any) {
      body = `\n${util.inspect(body)}`
      super(`HTTP Error ${http.response.statusCode} for ${http.method} ${http.url}${body}`)
      this.statusCode = http.response.statusCode
    }
  }
}
