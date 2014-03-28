
/* jslint bitwise: true */

var jsEncoder = (function() {

    //   Set strict mode, forced to
    //   fix up sloppy code
    'use strict';
    
    //
    //    All of these functions currently use strings and charCodeAt
    //    and assume a single byte character. Additional steps are needed
    //    to convert to byte arrays first.
    //

    //
    //    Base64 encode/decode functions
    //
    
    //    Base64 character array
    var repStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    
    
    //    Public
    //    Base64 encode
     
    var encode64 = function( data ) {
    
        var c1, c2, c3, e1, e2, e3, e4;
        var i   = 0;
        var out = "";
        var len = data.length;
        var rem = len % 3;
        
        //
        //  Pad with nulls until length is 
        //  a multiple of 3
        //
        if( rem === 1 ) {
            
            data = data.concat( "\x00\x00" );
            len += 2;
            
        } else if( rem === 2 ) {
            
            data = data.concat( "\x00" );
            len += 1;
        }             
        
        
        while( i < len ) {
            
            c1 = data.charCodeAt(i++);
            c2 = data.charCodeAt(i++);
            c3 = data.charCodeAt(i++);
            
            e1 = c1 >> 2;
            e2 = ((c1 << 4) & 48) | (c2 >> 4);
            e3 = ((c2 << 2) & 60) | (c3 >> 6);
            e4 = c3 & 63;
            
            out += (repStr.charAt(e1) + repStr.charAt(e2) + repStr.charAt(e3) + repStr.charAt(e4));
        }
        
        //
        //  Replace the last 1 or 2 characters with "=" if the original
        //  data length was not a multiple of 3
        //
        if( rem === 1 ) {
            
            out = out.substring(0, out.length - 2).concat("==");
            
        } else if( rem === 2 ) {
            
            out = out.substring(0, out.length - 1).concat("=");
        }
        
        return out;    
    };
    
    
    //
    //    Public
    //    Base64 decode
    // 
    var decode64 = function( data ) {
    
        var c1, c2, c3, e1, e2, e3, e4;
        var i   = 0;
        var out = "";
        var len = data.length;
        
        //
        //  Make sure input length is a multiple of 4 and only contains
        //  valid characters
        //
        if( (len % 4 !== 0) || (/[A-Za-z0-9+=\/]+/).test( data ) )  {
            
            throw new Error("Input not properly encoded");
            
        }
        
        while( i < len ) {
        
            e1 = repStr.indexOf(data.charAt(i++));
            e2 = repStr.indexOf(data.charAt(i++));
            e3 = repStr.indexOf(data.charAt(i++));
            e4 = repStr.indexOf(data.charAt(i++));
            
            c1 = (e1 << 2) | (e2 >> 4);
            c2 = ((e2 << 4) & 240) | (e3 >> 2);
            c3 = ((e3 << 6) & 192) |  e4;
            
            out += (String.fromCharCode(c1) + (e3 !== -1 ? String.fromCharCode(c2) : "") + (e4 !== -1 ? String.fromCharCode(c3) : ""));
        }
        
        return out;
    };
    
    
    //    Public
    //    Converts a string to an array of bytes
    //    representing it's utf8 equivalent
    //
    var strToUtf8Array = function( data ) {
        
        var i, c, len, out = [];
        
        if( typeof data === "string" ) {
            
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
                    
                    //
                    // charCodeAt always returns a value <= 0xFFFF
                    // but code points U+D800 through U+DFFF are 
                    // reserved for surrogate pairs. This grabs 
                    // those points from U+0800 through U+D7FF and
                    // U+E000 through U+FFFF
                    //
                    // Code point U+FFFF uses 16 bits, we need
                    // the first 4 for the leading byte 0x1110xxxx
                    // the next 6 for the first continuation 
                    // byte 0x10xxxxxx, and teh last 6 for the 
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
                    c = ((c - 0xd800) << 10)  & (data.charCodeAt(i++) - 0xdc00) + 0x10000;
                    
                    out.push( 0x1e | (c >> 18),
                              0x80 | ((c >> 12) & 0x3f),
                              0x80 | ((c >> 6) & 0x3f),
                              0x80 | (c & 0x3f) );                    
                }
                
            }
            
            return out;            
            
        } else {
            
            throw new Error("Input must be a string");
            
        }
        
    };
    
    //
    //    Public
    //    Convert a 32 bit number to a byte array
    //
    var intToByteArray = function( int ) {
        
        var out = [];
        
        if( int > 0xFFFFFF ) {
            
            out.push( int >>> 24 );
            
        }
        
        if( int > 0xFFFF ) {
            
            out.push( (int >>> 16) & 0xFF );
            
        }
        
        if( int > 0xFF ) {
            
            out.push( (int >> 8) & 0xFF );
            
        }
        
        out.push( int & 0xFF );
        
        return out;
        
    };
    
    //
    //     Public
    //     CRC function for varying widths up to 32 bits.
    //     For widths > 32 need to convert to use byte array for crc
    //     and operate one byte at a time.
    //
    var crc = function( options ) {
        
        if( options.width && options.poly ) {
        
            var len = options.data ? options.data.length : 0;
        
            var c, i, j;
        
            // To mask off any bits to the left of *width*
            var mask = (0xFFFFFFFF >>> (32 - options.width));     
        
            // If there's an initial value, mask and set initial CRC
            var crc = (typeof options.init) !== 'undefined' ? (options.init & mask) : (0xFFFFFFFF & mask);
        
        
            for(i = 0; i < len; i++) {
        
                c = options.data.charCodeAt(i);
            
                if( options.revData ) {
                
                    c = revbits(c, 8);
                
                }
                
                c <<= (options.width - 8);
            
                for(j = 0; j < 8; j++) {
            
                    crc = ((crc ^ c) & (1 << (options.width -1))) ? (crc << 1) ^ options.poly : crc << 1;
                    crc &= mask;
                    c <<= 1;
                }
            }
        
            if( options.revCrc ) {
            
                crc = revbits(crc, options.width);
            
            }
            
        
            return (crc ^ (options.xor || 0)) >>> 0;
            
        } else {
            
            throw new Error("Invalid options");
            
        }
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
            if(data & 0x1) reverse++;
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
    //    Return an object to expose the public
    //    functions and properties.
    // 
    return {
        encode64: encode64,
        decode64: decode64,
       crc_ccitt: crc_ccitt,
           crc32: crc32,
           crc16: crc16,
             crc: crc
    };
    
})();

