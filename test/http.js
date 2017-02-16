const util = require('util')
const {describe, it} = require('mocha')

function renderHeaders (headers) {
  return Object.keys(headers).map(key => {
    let value = key.toUpperCase() === 'AUTHORIZATION' ? 'REDACTED' : headers[key]
    return '    ' + key + '=' + value
  }).join('\n')
}

function debugRequest (options) {
  console.error(`--> ${options.method} ${options.host}${options.path}`)
  console.error(renderHeaders(options.headers))
  // if (body) console.error(`--- BODY\n${util.inspect(body)}\n---`)
  return Promise.resolve(options)
}

function debugResponse ({response, body}) {
  let url = `${response.req._headers.host}${response.req.path}`
  console.error(`<-- ${response.req.method} ${url} ${response.statusCode}`)
  console.error(renderHeaders(response.headers))
  console.error(`--- BODY\n${util.inspect(body)}\n---`)
}

let http = require('..')

describe('http', () => {
  it('makes a GET request', () => {
    http.get('https://api.heroku.com', {
      debug: 2,
      requestMiddleware: debugRequest,
      responseMiddleware: debugResponse,
      headers: {
        'Accept': 'application/vnd.heroku+json; version=3'
      }
    })
    .then(rsp => {
      console.dir(rsp)
    })
    .catch(console.error)
  })
})
