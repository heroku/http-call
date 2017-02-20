// @flow
/* global
  http$IncomingMessage
*/
import 'babel-polyfill'
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

/**
 * @typedef {Object} RequestOptions
 * @property {Object.<string, string>} headers - request headers
 * @property {(string|Object)} body - request body. Sets content-type to application/json and stringifies when object
 * @property {boolean} raw - do not parse body, instead just return node request object
 */
type RequestOptions = {
  headers?: {[key: string]: string}
}

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
  static get (url, options = {}) {
    let http = new this(url, {method: 'GET'}, options)
    return http.request()
  }

  response: http$IncomingMessage
  method = 'GET'
  host = 'localhost'
  port = 0
  protocol = 'https:'
  path = '/'
  headers = {
    'user-agent': `${pjson.name}/${pjson.version} node-${process.version}`
  }

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
      // TODO: handle raw stream
      return await this.parse(this.response)
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

  parse (response: http$IncomingMessage): Promise<JSON | string> {
    return concat(response).then(body => {
      return response.headers['content-type'] === 'application/json'
        ? JSON.parse(body) : body
    })
  }

  HTTPError = class HTTPError extends Error {
    statusCode: number

    constructor (http: HTTP, body: JSON | string) {
      body = `\n${util.inspect(body)}`
      super(`HTTP Error ${http.response.statusCode} for ${http.method} ${http.url}${body}`)
      this.statusCode = http.response.statusCode
    }
  }
}

export default HTTP
