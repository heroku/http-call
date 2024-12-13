import * as fs from 'node:fs'
import * as path from 'node:path'
import {URL} from 'node:url'

interface ProxyOptions {
  proxy: {
    host?: string
    port?: string
    proxyAuth?: string
  }
  ca?: Array<Buffer>
}

export default class ProxyUtil {
  static env = process.env
  static get httpProxy() {
    return this.env.HTTP_PROXY || this.env.http_proxy
  }

  static get httpsProxy() {
    return this.env.HTTPS_PROXY || this.env.https_proxy
  }

  static get noProxy() {
    return this.env.NO_PROXY || this.env.no_proxy
  }

  static shouldDodgeProxy(host: string): boolean {
    if (!this.noProxy) return false
    if (this.noProxy === '*') return true

    return this.noProxy
      .split(',')
      .map(p => p.trim())
      .some(p => (p[0] === '.' && host.endsWith(p.substr(1))) || host.endsWith(p))
  }

  static usingProxy(host?: string): boolean {
    if (host && this.shouldDodgeProxy(host)) return false
    if (this.httpProxy || this.httpsProxy) return true
    return false
  }

  static get sslCertDir(): Array<string> {
    const certDir = this.env.SSL_CERT_DIR
    if (certDir) {
      return fs.readdirSync(certDir)
        .map(f => path.join(certDir, f))
        .filter(f => fs.statSync(f).isFile())
    } else {
      return []
    }
  }

  static get sslCertFile(): Array<string> {
    return this.env.SSL_CERT_FILE ? ([this.env.SSL_CERT_FILE] as [string]) : []
  }

  static get certs(): Array<Buffer> {
    const filenames = this.sslCertFile.concat(this.sslCertDir)
    return filenames.map((filename): Buffer => fs.readFileSync(filename))
  }

  static agent(https: boolean, host?: string): any {
    if (!this.usingProxy(host)) return
    const u = https ? this.httpsProxy || this.httpProxy : this.httpProxy
    if (u) {
      const proxyParsed = new URL(u)
      const tunnel = require('tunnel-agent')
      const tunnelMethod = https ? tunnel.httpsOverHttp : tunnel.httpOverHttp
      const opts: ProxyOptions = {
        proxy: {
          host: proxyParsed.hostname || undefined,
          port: proxyParsed.port || '8080',
        },
      }

      if (proxyParsed.username) {
        const userInfo = proxyParsed.password ? `${proxyParsed.username}:${proxyParsed.password}` : proxyParsed.username
        opts.proxy.proxyAuth = userInfo
      }

      if (this.certs.length > 0) {
        opts.ca = this.certs
      }

      const tunnelAgent = tunnelMethod(opts)
      if (https) {
        tunnelAgent.defaultPort = 443
      }

      return tunnelAgent
    }
  }
}
