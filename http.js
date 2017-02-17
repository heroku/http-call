const util = require('util')
const url = require('url')

function concat (stream) {
  return new Promise(resolve => {
    let strings = []
    stream.on('data', data => strings.push(data))
    stream.on('end', () => resolve(strings.join('')))
  })
}

function mergeOptions (...optionses) {
  let options = {headers: {}}
  for (let o of optionses) {
    for (let k of Object.keys(o)) {
      if (k === 'headers') Object.assign(options.headers, o.headers)
      else options[k] = o[k]
    }
  }
  return options
}

class HTTPError extends Error {
  constructor (response, body) {
    super(`HTTP Error ${response.statusCode} for ${response.req.method} ${response.req._headers.host}${response.req.path}\n${util.inspect(body)}`)
  }
}

function performRequest (options) {
  let http = options.protocol === 'https:'
    ? require('https')
    : require('http')

  return new Promise((resolve, reject) => {
    let request = http.request(options, response => resolve({response, options}))
    request.on('error', reject)
    request.end()
  })
}

function parse ({response, options}) {
  if (options.raw) return Promise.resolve(response)
  return concat(response).then(body => {
    return response.headers['content-type'] === 'application/json'
      ? JSON.parse(body)
      : body
  })
}

function handleResponse (r) {
  return parse(r)
  .then(body => {
    r.body = body
    return Promise.resolve(r.options.responseMiddleware ? r.options.responseMiddleware(r) : r)
  }).then(() => {
    if (r.response.statusCode >= 200 && r.response.statusCode < 300) {
      return r.body
    } else {
      throw new HTTPError(r, r.body)
    }
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
  constructor (options = {}) {
    this.options = options
  }

  /**
   * make a simple http request
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
    const http = new HTTP()
    return http._request(Object.assign({}, options, {
      method: 'GET',
      url
    }))
  }

  /**
   * make a simple http request with initialized object
   * use this for setting some defaults
   * @param url {string} - url or path to call
   * @param options {RequestOptions}
   * @returns {Promise}
   * @example
   * ```js
   * const HTTP = require('http-call')
   * let client = new HTTP({headers: 'user-agent': 'my-unique-agent/1.0.0'})
   * await client.get('https://google.com')
   * ```
   */
  get (url, options = {}) {
    return this._request(Object.assign({}, options, {
      method: 'GET',
      url
    }))
  }

  _request (options) {
    options = mergeOptions({
      headers: {'User-Agent': this._userAgent}
    }, this.options, options)

    let u = url.parse(options.url)
    u.protocol = u.protocol || options.protocol
    options.host = u.host || options.host
    options.port = u.port || (u.protocol === 'https:' ? 443 : 80)
    options.path = u.path
    options.protocol = u.protocol

    return Promise.resolve(options.requestMiddleware ? options.requestMiddleware(options) : options)
    .then(() => performRequest(options))
    .then(response => handleResponse(response))
  }

  get _userAgent () {
    const version = require('./package.json').version
    return `http-call/${version}`
  }
}

module.exports = HTTP
