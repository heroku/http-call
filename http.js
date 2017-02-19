import util from 'util'
import uri from 'url'
import pjson from './package.json'

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

  headers = {
    'user-agent': `${pjson.name}/${pjson.version} node-${process.version}`
  }

  constructor (url, ...options) {
    for (let o of options) this.addOptions(o)
    let u = uri.parse(url)
    u.protocol = u.protocol || this.protocol
    this.host = u.host || this.host
    this.port = u.port || (u.protocol === 'https:' ? 443 : 80)
    this.path = u.path
    this.protocol = u.protocol
  }

  addOptions (options) {
    for (let k of Object.keys(options)) {
      if (k !== 'headers') this[k] = options[k]
      else Object.assign(this.headers, options.headers)
    }
  }

  async request () {
    let response = await this.performRequest()
    if (response.statusCode >= 200 && response.statusCode < 300) {
      // TODO: handle raw stream
      return await this._parse(response)
    } else throw new this.HTTPError(response, await this._parse(response))
  }

  get http () {
    return this.protocol === 'https:' ? require('https') : require('http')
  }

  performRequest () {
    return new Promise((resolve, reject) => {
      let request = this.http.request(this, resolve)
      request.on('error', reject)
      request.end()
    })
  }

  _parse (response) {
    return concat(response).then(body => {
      return response.headers['content-type'] === 'application/json'
        ? JSON.parse(body) : body
    })
  }

  static HTTPError = class HTTPError extends Error {
    constructor (response, body) {
      body = `\n${util.inspect(body)}`
      super(`HTTP Error ${response.statusCode} for ${response.req.method} ${response.req._headers.host}${response.req.path}${body}`)
      this.statusCode = response.statusCode
    }
  }
}

module.exports = HTTP
