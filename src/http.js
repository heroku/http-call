import util from 'util'
import uri from 'url'
import pjson from '../package.json'

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
 * @property {Function} requestMiddleware - called just before the request is made, returns a promise
 * @property {Function} responseMiddleware - called after a request is made, returns a promise
 */

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

  protocol = 'https:'
  headers = {
    'user-agent': `${pjson.name}/${pjson.version} node-${process.version}`
  }

  constructor (url, ...options) {
    for (let o of options) this.addOptions(o)
    let u = uri.parse(url)
    this.protocol = u.protocol || this.protocol
    this.host = u.host || this.host
    this.port = u.port || this.port || (this.protocol === 'https:' ? 443 : 80)
    this.path = u.path
  }

  addOptions (options) {
    for (let k of Object.keys(options)) {
      if (k !== 'headers') this[k] = options[k]
      else Object.assign(this.headers, options.headers)
    }
  }

  async request () {
    this.response = await this.performRequest()
    if (this.response.statusCode >= 200 && this.response.statusCode < 300) {
      // TODO: handle raw stream
      return await this.parse(this.response)
    } else throw new this.HTTPError(this, await this.parse(this.response))
  }

  get http () {
    return this.protocol === 'https:' ? require('https') : require('http')
  }

  get url () {
    return `${this.protocol}//${this.host}${this.path}`
  }

  performRequest () {
    return new Promise((resolve, reject) => {
      let request = this.http.request(this, resolve)
      request.on('error', reject)
      request.end()
    })
  }

  parse (response) {
    return concat(response).then(body => {
      return response.headers['content-type'] === 'application/json'
        ? JSON.parse(body) : body
    })
  }

  HTTPError = class HTTPError extends Error {
    constructor (http, body) {
      body = `\n${util.inspect(body)}`
      super(`HTTP Error ${http.response.statusCode} for ${http.method} ${http.url}${body}`)
      this.statusCode = http.response.statusCode
    }
  }
}

export default HTTP
