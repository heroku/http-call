// tslint:disable
declare namespace NodeJS {
  interface Global {
    httpCall?: {
      userAgent?: string
    }
  }
}

export interface Global extends NodeJS.Global {
  httpCall?: {
    userAgent?: string
  }
}
