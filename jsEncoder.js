
/* jslint bitwise: true */

var jsEncoder = (function() {

    //   Set strict mode, forced to
    //   fix up sloppy code
    'use strict';
    
    //
    //    Base64 encode/decode functions
    //
    
    //    Base64 character array
    var b64Str = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    
    //
    //    Public
    //    Base64 encode
    //
    var encode64 = function( data ) {
    
        var c1, c2, c3, e1, e2, e3, e4,
            i   = 0,
            out = "",
            len = data.length,
            rem = len % 3;
        
        if( !isArray( data ) ) {
            
            throw new Error( "TypeError - Input must be an array" );
        }
        
        //
        //  Pad with nulls until length is 
        //  a multiple of 3
        //
        if( rem === 1 ) {
            
            data.push( 0, 0 );
            len += 2;
            
        } else if( rem === 2 ) {
            
            data.push( 0 );
            len += 1;
        }             
        
        while( i < len ) {
            
            c1 = data[ i++ ];
            c2 = data[ i++ ];
            c3 = data[ i++ ];
            
            e1 = c1 >> 2;
            e2 = ((c1 << 4) & 48) | (c2 >> 4);
            e3 = ((c2 << 2) & 60) | (c3 >> 6);
            e4 = c3 & 63;
            
            out += ( b64Str.charAt( e1 ) + b64Str.charAt( e2 ) + b64Str.charAt( e3 ) + b64Str.charAt( e4 ) );
        }
        
        //
        //  Replace the last 1 or 2 characters with "=" if the original
        //  data length was not a multiple of 3
        //
        if( rem === 1 ) {
            
            out = out.substring( 0, out.length - 2 ).concat( "==" );
            
        } else if( rem === 2 ) {
            
            out = out.substring( 0, out.length - 1 ).concat( "=" );
        }
        
        return out;    
    };
    
    
    //
    //    Public
    //    Base64 decode
    // 
    var decode64 = function( data ) {
    
        var e1, e2, e3, e4,
            i   = 0,
            len,
            out = [];
        
        //
        //  Make sure input length is a multiple of 4 and only contains
        //  valid characters
        //
        if( typeof data !== 'string' || ( len % 4 !== 0 ) || !(/[A-Za-z0-9+=\/]+/).test( data ) )  {
            
            throw new Error( "Input not properly encoded" );            
        }
        
        len = data.length;
        
        while( i < len ) {
        
            e1 = b64Str.indexOf( data.charAt( i++ ) );
            e2 = b64Str.indexOf( data.charAt( i++ ) );
            e3 = b64Str.indexOf( data.charAt( i++ ) );
            e4 = b64Str.indexOf( data.charAt( i++ ) );
            
            out.push( ( e1 << 2 ) | ( e2 >> 4 ) );
            if( e3 !== -1 ) {
                
                out.push( ((e2 << 4) & 0xf0) | (e3 >> 2) );
            }
            
            if( e4 !== -1 ) {
                
                out.push( ((e3 << 6) & 0xc0 ) |  e4 );
            }
        }
        
        return out;
    };
    
    
    //    Public
    //    Converts a string to an array of bytes
    //    representing it's utf8 equivalent
    //
    //    In:: String
    //   Out:: UTF-8 encoded array of bytes
    //
    var strToUtf8Array = function( data ) {
        
        var i, c,
            len,
            out = [];
        
        if( typeof data !== "string" ) {
            
            throw new Error( "Input must be a string" );            
        }
            
        len = data.length;
            
        for( i = 0; i < len; i++ ) {
                
            c = data.charCodeAt(i);
                
            if( c < 0x80 ) {
                
                // UTF-8 encodes all codepoints < 128 as
                // their ASCII equivalent
                out.push( c );
                    
            } else if( c < 0x800 ) {
                    
                //
                // Code point U+07FF uses 11 bits,
                // we need the first 5 bits for byte 1,
                // so shift right by 6 and add to the leading 
                // byte 110xxxxx.
                //
                // Then  take the last 6 bits and 
                // add it to the leading bits for
                // the continuation byte 10xxxxxx
                //
                out.push( 0xc0 | (c >> 6),
                          0x80 | (c & 0x3f) );
                    
             } else if ( c < 0xd800 || c > 0xdfff ) {
                    
                 // charCodeAt always returns a value <= 0xFFFF
                 // but code points U+D800 through U+DFFF are 
                 // reserved for surrogate pairs. This grabs 
                 // those points from U+0800 through U+D7FF and
                 // U+E000 through U+FFFF
                 //
                 // Code point U+FFFF uses 16 bits, we need
                 // the first 4 for the leading byte 0x1110xxxx
                 // the next 6 for the first continuation 
                 // byte 0x10xxxxxx, and the last 6 for the 
                 // second continuation byte 0x10xxxxxx
                 //
                 out.push( 0xe0 | (c >> 12),
                           0x80 | ((c >> 6) & 0x3f),
                           0x80 | (c & 0x3f) );
              } else {
                    
                  // Surrogate pair
                  // The code point is broken into two pieces, by first 
                  // subtracting 0x10000 leaving you with a 20 bit number.
                  //
                  // The first 10 bits are are added to the 0xD800 and the 
                  // last 10 bits are added to 0xDC00. This results in two
                  // separate 2 byte values in the reserved range 
                  // U+D800 through U+DFFF.
                  //
                  // Reverse the process to get the code point, up 
                  // to U+1FFFFF which uses 21 bits, so we encode 
                  // by combining first 3 bits with leading byte 0x11110xxx,
                  // next 6 bits with continuation byte 0x10xxxxxx,
                  // next 6 bits with continuation byte 0x10xxxxxx,
                  // and last 6 bits with continuation byte 0x10xxxxxx
                  //
                  c = (((c - 0xd800) << 10) | (data.charCodeAt(++i) - 0xdc00)) + 0x10000;
                  
                  out.push( 0xf0 | (c >> 18),
                            0x80 | ((c >> 12) & 0x3f),
                            0x80 | ((c >> 6) & 0x3f),
                            0x80 | (c & 0x3f) );                    
              }
        }
        
        return out; 
    };
    
    //
    //    Public
    //    Convert an array of bytes that represent utf-8 encoding
    //    to a string
    //
    //     In:: UTF-8 encoded array of bytes
    //    Out:: String
    //
    var utf8ArrayToStr = function( data ) {
        
        var i, c, u,
            len,
            out = "";
        
          if( !isArray( data ) ) {
            
            throw new Error( "TypeError - Input must be an array" );
        }
          
          len = data.length;
          
          for( i=0; i < len; i++ ) {
              
              c = data[ i ];
              
              if( c >= 0xf0 ) {
                  
                  u  = (c & 0x07) << 18;
                  u |= ((data[ ++i ] & 0x3f) << 12);
                  u |= ((data[ ++i ] & 0x3f) << 6);
                  u |= (data[ ++i ] & 0x3f);
                  
              } else if( c > 0xe0 ) {
                  
                  u  = (c & 0x0f) << 12;
                  u |= ((data[ ++i ] & 0x3f) << 6);
                  u |= (data[ ++i ] & 0x3f);
                  
              } else if( c > 0xc0 ) {
                  
                  u  = (c & 0x1f) << 6;
                  u |= (data[ ++i ] & 0x3f);
              } else {
                  
                  u = c;
              }
              
              // If our code point is < U+10000 then we
              // can just concatenate \uXXXX.
              //
              // Otherwise, we have to calculate the 
              // surrogate pair which is done by 
              // subtracting 0x10000, leaving a 20 bit
              // number. The leading surrogate is the first
              // 10 bits added to U+D800, and the trailing
              // surrogate is the last 10 bits added to U+DC00
              //
              if( u < 0x10000 ) {
                  
                  out += String.fromCharCode( u );
                  
              } else {
                  
                  u -= 0x10000;
                  out += String.fromCharCode( 0xd800 + (u >>> 10), 0xdc00 + (u & 0x3ff) );
              }
          }
          
          return out;
    };
    
    //
    //    Public
    //    Convert a 32 bit number to a byte array
    //
    //    In:: Integer
    //   Out:: Byte array representation
    //
    var intToByteArray = function( int, len ) {
        
        var out = [], len = len || 0;
        
        if ( typeof int !== 'number' ) {
            
            throw new Error( "TypeError - must be a number" );
        }
        
        if ( int > 0xFFFFFF ) {
            
            out.push( int >>> 24 );            
        }
        
        if ( int > 0xFFFF ) {
            
            out.push( (int >>> 16) & 0xFF );            
        }
        
        if ( int > 0xFF ) {
            
            out.push( (int >> 8) & 0xFF );            
        }
        
        out.push( int & 0xFF );
        
        while ( out.length < len ) {
        
            out.unshift( 0 );        
        }            
        
        return out;
        
    };
    
    //
    //     Public
    //     CRC function for varying widths up to 32 bits.
    //     For widths > 32 need to convert to use byte array for crc
    //     and operate one byte at a time.
    //
    var crc = function( options ) {
        
        var c, i, j, len, mask, crc;
        
        if( !(options.width && options.poly) ) {
            
            throw new Error( "Error - Invalid options: must provide width and poly" );
            
        } else if( !isArray( options.data ) ) {
            
            throw new Error( "TypeError - data must be an array" );
        }        
            
        len = options.data ? options.data.length : 0;
                     
        // To mask off any bits to the left of *width*
        mask = (0xFFFFFFFF >>> (32 - options.width));     
        
        // If there's an initial value, mask and set initial CRC
        crc = typeof options.init !== 'undefined' ? (options.init & mask) : (0xFFFFFFFF & mask);
        
        
        for( i = 0; i < len; i++ ) {
        
            c = options.data[ i ];
            
            if( options.revData ) {
                
                c = revbits( c, 8 );                
            }
                
            c <<= (options.width - 8);
            
            for( j = 0; j < 8; j++ ) {
            
                crc = ((crc ^ c) & (1 << (options.width -1))) ? (crc << 1) ^ options.poly : crc << 1;
                crc &= mask;
                c <<= 1;
            }
        }
        
        if( options.revCrc ) {
            
            crc = revbits( crc, options.width );            
        }
            
        
        return (crc ^ (options.xor || 0)) >>> 0;
    };
    
    //
    //    Public
    //    Standard CRC32 function
    //
    var crc32 = function( data ) {
    
        var options = {
            width: 32,
             poly: 0x4C11DB7,
             data: data,
             init: 0xFFFFFFFF,
          revData: true,
           revCrc: true,
              xor: 0xFFFFFFFF
        };
        
        return crc( options );
    };
    
    //
    //    Public
    //    Standard CRC-CCITT
    //
    var crc_ccitt = function( data ) {
        
        var options = {
            width: 16,
             poly: 0x1021,
             data: data,
             init: 0xFFFF,
          revData: false,
           revCrc: false,
              xor: 0x0000
        };
        
        return crc( options );
    };
    
    //
    //    Public
    //    Standard CRC16
    //
    var crc16 = function( data ) {
        
        var options = {
            width: 16,
             poly: 0x8005,
             data: data,
             init: 0xFFFF,
          revData: true,
           revCrc: true,
              xor: 0x0000
        };
        
        return crc( options );
    };
    
    //
    //    Private
    //    Reverse the bits. Used by generic CRC function.
    //
    function revbits( data, width ) {
    
        var reverse = 0;
        var i;
    
        for(i = 0; i < width; i++)
        {
            reverse <<= 1;
            if( data & 0x1 ) reverse++;
            data >>= 1;
        }
    
        return reverse;
    }
    
    //
    //    Reciprocal of polynomial.
    //    Ends up being the reverse, left-shifted by 1 and
    //    then tack on the + 1 since we shifted off        
    //
    function recip( poly, width ) {
        
        return ((revbits( poly, width ) << 1 & (0xFFFFFFFF >>> (32 - width)) ) + 1);
    }
    
    //
    //    Private function to determine array
    //    Thanks to http://perfectionkills.com/instanceof-considered-harmful-or-how-to-write-a-robust-isarray/
    //
    function isArray( object ) {
        
        return Object.prototype.toString.call( object ) === '[object Array]';        
    }
    
    //
    //    Return an object to expose the public
    //    functions and properties.
    // 
    return {
        encode64: encode64,
        decode64: decode64,
  strToUtf8Array: strToUtf8Array,
  utf8ArrayToStr: utf8ArrayToStr,
  intToByteArray: intToByteArray,
       crc_ccitt: crc_ccitt,
           crc32: crc32,
           crc16: crc16,
             crc: crc
    };
    
})();

