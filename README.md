### jsEncoder

A simple utility for base 64 encoding/decoding and CRC calculations.

I wrote this for an older non-browser environment which did not have the btoa and atob, which should perform faster if available. I wrote out the full CRC calculation in order to fully understand the algorithm, but a table lookup will be much faster so I plan to add that soon.

### Examples

#### CRC

Some of the common CRCs are built in:

```javascript
jsEncoder.crc16( jsEncoder.strToUtf8Array("hello") ).toString(16)         //  "34f6"
jsEncoder.crc_ccitt( jsEncoder.strToUtf8Array("hello") ).toString(16)     //  "d26e"
jsEncoder.crc32( jsEncoder.strToUtf8Array("hello") ).toString(16)         //  "3610a686"
```

Or you can also pass in options:

```javascript

// Same as crc16 except the CRC s initialized to 0 instead of 0xFFFF
var options = {
      width: 16,
      poly: 0x8005,
      init: 0,
      revData: true,
      revCrc: true,
      xor: 0x0000
    };

options.data = jsEncoder.strToUtf8Array("hello");

jsEncoder.crc( options ).toString(16);         //  "34f6"

```

#### Base 64

```javascript
jsEncoder.encode64( jsEncoder.strToUtf8Array("hello") )                   //  "aGVsbG8="
jsEncoder.utf8ArrayToStr( jsEncoder.decode64( "aGVsbG8=" ) )              //  "hello"
```
