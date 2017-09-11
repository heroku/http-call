import proxy = require('./proxy')
import mime = require('mime-types')
import http = require('http')
import https = require('https')

export const deps = {
  get proxy(): typeof proxy.default {
    return fetch('./proxy').default
  },
  get isStream(): any {
    return fetch('is-stream')
  },
  get mime(): typeof mime {
    return fetch('mime-types')
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
