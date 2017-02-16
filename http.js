const util = require('util')

function concat (stream) {
  return new Promise(resolve => {
    let strings = []
    stream.on('data', data => strings.push(data))
    stream.on('end', () => resolve(strings.join('')))
  })
}

function renderHeaders (headers) {
  return Object.keys(headers).map(key => {
    let value = key.toUpperCase() === 'AUTHORIZATION' ? 'REDACTED' : headers[key]
    return '    ' + key + '=' + value
  }).join('\n')
}

class HTTPError extends Error {
  constructor (http) {
    super(`HTTP Error ${http.response.statusCode} for ${http.method} ${http.url.href}\n${util.inspect(http.response.body)}`)
    this.http = http
  }
}

class HTTP {
  static get (url, options = {}) {
    let http = new HTTP(Object.assign({}, options, {
      method: 'GET',
      url
    }))
    return http._request()
  }

  constructor (options = {}) {
    this.options = options
  }

  get debug () {
    return this.options.debug
  }

  get method () {
    return this.options.method
  }

  get url () {
    const url = require('url')
    return url.parse(this.options.url)
  }

  get headers () {
    return Object.assign({
      'User-Agent': this._userAgent
    }, this.options.headers)
  }

  _request () {
    return new Promise((resolve, reject) => {
      let requestOptions = {
        host: this.url.host,
        port: this.url.port,
        path: this.url.path,
        headers: this.headers,
        method: this.method
      }
      this._resolve = resolve
      this._reject = reject
      this.request = this._http.request(requestOptions, rsp => {
        this.response = rsp
        if (!this.options.raw) {
          concat(rsp)
            .then(body => { rsp.body = this._parse(body) })
            .then(() => this._handleResponse())
        } else this._handleResponse()
      })
      this._debugRequest()
      this.request.on('error', reject)
      this.request.end()
    })
  }

  _parse (body) {
    if (this.response.headers['content-type'] === 'application/json') {
      return JSON.parse(body)
    } else {
      return body
    }
  }

  _handleResponse () {
    this._debugResponse()
    if (this.response.statusCode >= 200 && this.response.statusCode < 300) {
      this._resolve(this.options.raw ? this.response : this.response.body)
    } else {
      this._reject(new HTTPError(this))
    }
  }

  _debugRequest () {
    if (!this.debug) return
    console.error(`--> ${this.method} ${this.url.href}`)
    if (this.debug > 1) {
      console.error(renderHeaders(this.request._headers))
      if (this.body) console.error(`--- BODY\n${util.inspect(this.body)}\n---`)
    }
  }

  _debugResponse () {
    if (!this.debug) return
    console.error(`<-- ${this.method} ${this.url.href}`)
    if (this.debug > 1) {
      console.error(renderHeaders(this.response.headers))
      console.error(`--- BODY\n${util.inspect(this.response.body)}\n---`)
    }
  }

  get _http () {
    return this.url.protocol === 'https:'
      ? require('https')
      : require('http')
  }

  get _userAgent () {
    const version = require('./package.json').version
    return `http-call/${version}`
  }

}

module.exports = HTTP
