import contentType = require('content-type')
import http = require('http')
import https = require('https')
import isStream = require('is-stream')

import proxy = require('./proxy')

export const deps = {
  get proxy(): typeof proxy.default {
    return fetch('./proxy').default
  },
  get isStream(): typeof isStream {
    return fetch('is-stream')
  },
  get contentType(): typeof contentType {
    return fetch('content-type')
  },
  get http(): typeof http {
    return fetch('http')
  },
  get https(): typeof https {
    return fetch('https')
  },
}

const cache: any = {}

function fetch(s: string) {
  if (!cache[s]) {
    cache[s] = require(s)
  }

  return cache[s]
}
