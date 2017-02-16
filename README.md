http-call
=========

[![codecov](https://codecov.io/gh/dickeyxxx/http-call/branch/master/graph/badge.svg)](https://codecov.io/gh/dickeyxxx/http-call)
[![Build Status](https://semaphoreci.com/api/v1/dickeyxxx/http-call/branches/master/badge.svg)](https://semaphoreci.com/dickeyxxx/http-call)

node utility for simple http calls

# API Reference

## Classes

<dl>
<dt><a href="#HTTP">HTTP</a></dt>
<dd><p>Utility for simple HTTP calls</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#RequestOptions">RequestOptions</a> : <code>Object</code></dt>
<dd></dd>
</dl>

<a name="HTTP"></a>

## HTTP
Utility for simple HTTP calls

**Kind**: global class  

* [HTTP](#HTTP)
    * _instance_
        * [.get(url, options)](#HTTP+get) ⇒ <code>Promise</code>
    * _static_
        * [.get(url, options)](#HTTP.get) ⇒ <code>Promise</code>

<a name="HTTP+get"></a>

### httP.get(url, options) ⇒ <code>Promise</code>
make a simple http request with initialized object
use this for setting some defaults

**Kind**: instance method of <code>[HTTP](#HTTP)</code>  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>string</code> | url or path to call |
| options | <code>[RequestOptions](#RequestOptions)</code> |  |

**Example**  
```js
const HTTP = require('http-call')
let client = new HTTP({headers: 'user-agent': 'my-unique-agent/1.0.0'})
await client.get('https://google.com')
```
<a name="HTTP.get"></a>

### HTTP.get(url, options) ⇒ <code>Promise</code>
make a simple http request

**Kind**: static method of <code>[HTTP](#HTTP)</code>  

| Param | Type | Description |
| --- | --- | --- |
| url | <code>string</code> | url or path to call |
| options | <code>[RequestOptions](#RequestOptions)</code> |  |

**Example**  
```js
const http = require('http-call')
await http.get('https://google.com')
```
<a name="RequestOptions"></a>

## RequestOptions : <code>Object</code>
**Kind**: global typedef  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| headers | <code>Object.&lt;string, string&gt;</code> | request headers |
| body | <code>string</code> &#124; <code>Object</code> | request body. Sets content-type to application/json and stringifies when object |
| raw | <code>boolean</code> | do not parse body, instead just return node request object |
| requestMiddleware | <code>function</code> | called just before the request is made, returns a promise |
| responseMiddleware | <code>function</code> | called after a request is made, returns a promise |

