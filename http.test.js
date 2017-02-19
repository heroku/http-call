/* globals test expect beforeAll */
const util = require('util')
const http = require('.')
const nock = require('nock')

nock('https://api.heroku.com')

test('makes a GET request', async () => {
  function renderHeaders (headers) {
    return Object.keys(headers).map(key => {
      let value = key.toUpperCase() === 'AUTHORIZATION' ? 'REDACTED' : headers[key]
      return '    ' + key + '=' + value
    }).join('\n')
  }

  function debugRequest (options) {
    // console.log(`--> ${options.method} ${options.host}${options.path}`)
    // console.log(renderHeaders(options.headers))
    // if (body) console.log(`--- BODY\n${util.inspect(body)}\n---`)
    return Promise.resolve(options)
  }

  function debugResponse ({response, body}) {
    let url = `${response.req._headers.host}${response.req.path}`
    // console.log(`<-- ${response.req.method} ${url} ${response.statusCode}`)
    // console.log(renderHeaders(response.headers))
    // console.log(`--- BODY\n${util.inspect(body)}\n---`)
  }

  let rsp = await http.get('https://api.heroku.com', {
    debug: 2,
    requestMiddleware: debugRequest,
    responseMiddleware: debugResponse,
    headers: {
      'Accept': 'application/vnd.heroku+json; version=3'
    }
  })
  expect(rsp).toEqual({
    links: [ { href: 'https://api.heroku.com/schema', rel: 'schema' } ]
  })
})
