http-call
=========

[![codecov](https://codecov.io/gh/dickeyxxx/http-call/branch/master/graph/badge.svg)](https://codecov.io/gh/dickeyxxx/http-call)
[![Build Status](https://semaphoreci.com/api/v1/dickeyxxx/http-call/branches/master/badge.svg)](https://semaphoreci.com/dickeyxxx/http-call)

node utility for simple http calls

# API Reference

<a name="HTTP"></a>

## HTTP
Utility for simple HTTP calls

**Kind**: global class  
<a name="HTTP.get"></a>

### HTTP.get(url, options)
make a simple http request

**Kind**: static method of <code>[HTTP](#HTTP)</code>  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>string</code> | url or path to call |
| options | <code>object</code> |  |

**Example**  
```js
const http = require('http-call')
await http.get('https://google.com')
```
