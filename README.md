http-call
=========

[![Greenkeeper badge](https://badges.greenkeeper.io/heroku/http-call.svg)](https://greenkeeper.io/)

Usage
-----

```js
const {HTTP} = require('http-call')
const {body: user} = await HTTP.get('https://api.github.com/users/me')
// do something with user
// automatically converts from json

// set headers
await HTTP.get('https://api.github.com', {headers: {authorization: 'bearer auth'}})
```
