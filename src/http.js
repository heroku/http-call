// @flow
/* global
  http$IncomingMessage
*/
import util from 'util'
import uri from 'url'
import pjson from '../package.json'
import http from 'http'
import https from 'https'

function concat (stream) {
  return new Promise(resolve => {
    let strings = []
    stream.on('data', data => strings.push(data))
    stream.on('end', () => resolve(strings.join('')))
  })
}

type Method = | "GET" | "POST" | "PATCH" | "PUT" | "DELETE"
type Headers = {[key: string]: string}

/**
 * @typedef {Object} RequestOptions
 * @property {Object.<string, string>} headers - request headers
 * @property {string} method - request method (GET/POST/etc)
 * @property {(string)} body - request body. Sets content-type to application/json and stringifies when object
 */
type RequestOptions = {
  headers?: Headers
}

type Json = | string | number | boolean | null | JsonObject | JsonArray
type JsonObject = { [key:string]: Json }
type JsonArray = Json[]

/**
 * Utility for simple HTTP calls
 * @class
 */
class HTTP {
  /**
   * make an http GET request
   * @param {string} url - url or path to call
   * @param {RequestOptions} options
   * @returns {Promise}
   * @example
   * ```js
   * const http = require('http-call')
   * await http.get('https://google.com')
   * ```
   */
  static async get (url, options = {}) {
    let http = new this(url, {method: 'GET'}, options)
    await http.request()
    return http.body
  }

  /**
   * make a streaming request
   * @param {string} url - url or path to call
   * @param {RequestOptions} options
   * @returns {Promise}
   * @example
   * ```js
   * const http = require('http-call')
   * let rsp = await http.get('https://google.com')
   * rsp.on('data', console.log)
   * ```
   */
  static async stream (url, options = {}) {
    let http = new this(url, {method: 'GET', raw: true}, options)
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
  body: Json

  constructor (url: string, ...options: RequestOptions[]) {
    for (let o of options) this.addOptions(o)
    let u = uri.parse(url)
    this.protocol = u.protocol || this.protocol
    this.host = u.host || this.host
    this.port = u.port || this.port || (this.protocol === 'https:' ? 443 : 80)
    this.path = u.path || this.path
  }

  addOptions (options: RequestOptions) {
    let headers = Object.assign(this.headers, options.headers)
    Object.assign(this, options)
    this.headers = headers
  }

  async request () {
    this.response = await this.performRequest()
    if (this.response.statusCode >= 200 && this.response.statusCode < 300) {
      if (!this.raw) this.body = this.parse(this.response)
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

    constructor (http: HTTP, body: Json) {
      body = `\n${util.inspect(body)}`
      super(`HTTP Error ${http.response.statusCode} for ${http.method} ${http.url}${body}`)
      this.statusCode = http.response.statusCode
    }
  }
}

export default HTTP
