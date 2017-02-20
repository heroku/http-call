## Classes

<dl>
<dt><a href="#HTTP">HTTP</a></dt>
<dd></dd>
</dl>

## Members

<dl>
<dt><a href="#value">value</a> ⇒ <code>Promise</code></dt>
<dd><p>make an http GET request</p>
</dd>
</dl>

## Typedefs

<dl>
<dt><a href="#RequestOptions">RequestOptions</a> : <code>Object</code></dt>
<dd></dd>
</dl>

<a name="HTTP"></a>

## HTTP
**Kind**: global class  
<a name="new_HTTP_new"></a>

### new HTTP()
Utility for simple HTTP calls

<a name="value"></a>

## value ⇒ <code>Promise</code>
make an http GET request

**Kind**: global variable  

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
| method | <code>string</code> | request method (GET/POST/etc) |
| body | <code>string</code> | request body. Sets content-type to application/json and stringifies when object |

