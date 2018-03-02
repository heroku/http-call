http-call
=========

[![Greenkeeper badge](https://badges.greenkeeper.io/heroku/http-call.svg)](https://greenkeeper.io/)

Usage
-----

```js
const {HTTP} = require('http-call')
const {body} = await HTTP.get('https://api.github.com')

// set headers
await HTTP.get('https://api.github.com', {headers: {authorization: 'bearer auth'}})
```
