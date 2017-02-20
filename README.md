## Classes

<dl>
<dt><a href="#HTTP">HTTP</a></dt>
<dd></dd>
</dl>

## Functions

<dl>
<dt><a href="#value">value(url, options)</a> ⇒ <code>Promise</code></dt>
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

## value(url, options) ⇒ <code>Promise</code>
make an http GET request

**Kind**: global function  

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

