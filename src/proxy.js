// @flow

import uri from 'url'
import fs from 'fs'
import path from 'path'

type ProxyOptions = {
  proxy: Object,
  ca?: Array<Buffer>
}

export default class ProxyUtil {
  static env = process.env
  static get httpProxy () { return this.env.HTTP_PROXY || this.env.http_proxy }
  static get httpsProxy () { return this.env.HTTPS_PROXY || this.env.https_proxy }

  static get usingProxy () : boolean {
    if (this.httpProxy || this.httpsProxy) return true
    return false
  }

  static get sslCertDir () : Array<string> {
    const certDir = this.env.SSL_CERT_DIR
    if (certDir) {
      return fs.readdirSync(certDir).map(f => path.join(certDir, f))
    } else {
      return []
    }
  }

  static get sslCertFile () : Array<string> {
    return this.env.SSL_CERT_FILE ? [this.env.SSL_CERT_FILE] : []
  }

  static get certs () : Array<Buffer> {
    let filenames = this.sslCertFile.concat(this.sslCertDir)
    return filenames.map(function (filename: string) : Buffer {
      return fs.readFileSync(filename)
    })
  }

  static agent (https: boolean) : any {
    if (!this.usingProxy) return
    const u = https ? (this.httpsProxy || this.httpProxy) : this.httpProxy
    if (u) {
      let proxyParsed = uri.parse(u)
      let tunnel = require('tunnel-agent')
      let tunnelMethod = https ? tunnel.httpsOverHttp : tunnel.httpOverHttp
      let opts: ProxyOptions = {
        proxy: {
          host: proxyParsed.hostname,
          port: proxyParsed.port || '8080'
        }
      }

      if (proxyParsed.auth) {
        opts.proxy.proxyAuth = proxyParsed.auth
      }

      if (this.certs.length > 0) {
        opts.ca = this.certs
      }

      let tunnelAgent = tunnelMethod(opts)
      if (https) {
        tunnelAgent.defaultPort = 443
      }
      return tunnelAgent
    }
  }
}
