
JEncode = (function() {

    /* 
        All of these functions currently use strings and charCodeAt
        and assume a single byte character. Additional steps are needed
        to convert to byte arrays first.
    */

    
    /*
        Base64 encode/decode functions
    */
    
    // Base64 character array
    var repStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    
    // Base64 encode 
    var encode64 = function( data ) {
    
        var c1, c2, c3, e1, e2, e3, e4;
        var i   = 0;
        var out = "";
        var len = data.length;
        var rem = len % 3;
        
        // Pad with nulls until length is 
        // a multiple of 3
        if( rem == 1 ) {
            data = data.concat( "\x00\x00" );
            len += 2;
            
        } else if( rem == 2 ) {
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
        
        // Replace the last 1 or 2 characters with "=" if the original
        // data length was not a multiple of 3
        if( rem == 1 ) {
            out = out.substring(0, out.length - 2).concat("==");
        }
        else if( rem ==2 ) {
            out = out.substring(0, out.length - 1).concat("=");
        }
        
        return out;    
    };
    
    var decode64 = function( data ) {
    
        var c1, c2, c3, e1, e2, e3, e4;
        var i   = 0;
        var out = "";
        var len = data.length;
        
        // Make sure input length is a multiple of 4 and only contains
        // valid characters
        if( (len % 4 != 0) || (data.match(/[A-Za-z0-9+/=]+/)[0].length != len) ) {
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
            
            out += (String.fromCharCode(c1) + (e3 != -1 ? String.fromCharCode(c2) : "") + (e4 != -1 ? String.fromCharCode(c3) : ""));
        }
        
        return out;
    };
    
    /*
        Public
        CRC function for varying widths up to 32 bits.
        For widths > 32 need to convert to use byte array for crc
        and operate one byte at a time.
    */
    var crc = function( width, poly, data, init, reverse ) {
    
        var len = data.length;
        // Used to mask off any bits to the left of *width*
        var mask = (0xFFFFFFFF >>> (32 - width));
        // If there's an initial value, mask and set initial CRC
        var crc = typeof init != 'undefined' ? (init & mask) : (0xFFFFFFFF & mask);
        console.log( (crc >>> 0).toString(16) );
        var c, i, j;
        
        for(i = 0; i < len; i++) {
        
            c = data.charCodeAt(i);
            if( reverse )
                c = revbits(c, 8);
            c <<= (width - 8);
            
            for(j = 0; j < 8; j++) {
            
                crc = ((crc ^ c) & (1 << (width -1))) ? (crc << 1) ^ poly : crc << 1;
                crc &= mask;
                c <<= 1;
            }
        }

        return (crc >>> 0).toString(16);
    };
    
    /*
        Standard CRC32 function
    */
    var crc32 = function( data ) {
    
        return crc(32, 0x4C11DB7, data, 0xFFFFFFFF, true);
    };
    
    /*
        Standard CRC-CCITT
    */
    var crc_ccitt = function( data ) {
    
        return crc(16, 0x1021, data, 0xFFFF, false);
    };
    
    /*
        Standard CRC16
    */
    var crc16 = function( data ) {
    
        return crc(16, 0x8005, data, 0xFFFF, true);
    };
    
    /* 
        Private
        Reverse/reflect the bits. Used by generic CRC function.
    */
    function revbits( data, bits ) {
    
    var reverse = 0;
    var i;
    
    for(i = 0; i < bits; i++)
    {
        reverse <<= 1;
        if(data & 0x1) reverse++;
        data >>= 1;
    }
    
    return reverse;
}
    
    return {
        encode64: encode64,
        decode64: decode64,
       crc_ccitt: crc_ccitt,
           crc32: crc32,
           crc16: crc16,
             crc: crc
    };
})();

/*
 var crc32 = function( data ) {
    
        var len = data.length;
        var crc = 0xFFFFFFFF;
        var c, i, j, bit;
        
        for(i = 0; i < len; i++) {
            
            c = data.charCodeAt(i);
            //c = revbits(c,8);
            c <<= 24;            
            
            for(j = 0; j < 8; j++) {
                
                crc = ((crc ^ c) & (1 << 31)) ? (crc << 1) ^ 0x4C11DB7 : crc << 1;
                c <<= 1;
            }
        }
        return (crc >>> 0).toString(16);
    };

function pad_crc16(msg) {
    
    msg = msg.concat("\x00\x00");
    var len = msg.length;
    var crc = 0xFFFF;
    var poly = 0x1021;
    var i, j, bit;
    
    for(i = 0; i < len; i++)
    {
        ch = msg.charCodeAt(i);
        t = 0x80;
        
        for(j = 0; j < 8; j++)
        {
            bit = (crc & 0x8000);
            
            crc <<= 1;
            crc &= 0xFFFF;
            
            if(ch & t) crc += 1;
            t >>= 1;
            
            if( bit ) crc ^= poly;
        }       
    }
    
    return Number(crc).toString(16);
}


function crc16(msg) {
    
    var len = msg.length;
    var crc = 0xFFFF;
    var poly = 0x1021;
    var i, j, bit;
    
    for(i = 0; i < len; i++)
    {
        ch = msg.charCodeAt(i);
        ch = revbits(ch,8);
        ch <<= 8;
        ch &= 0xFFFF;
        
        for(j = 0; j < 8; j++)
        {
            
            bit = ((crc ^ ch) & 0x8000);
            
            crc <<= 1;
            crc &= 0xFFFF;
            
            if( bit ) crc ^= poly;
            
            ch <<= 1;
            ch &= 0xFFFF;
        }       
    }
    
    return revbits(crc,16).toString(16);
}

function revbits( data, bits ) {
    
    var reverse = 0;
    var i;
    
    for(i = 0; i < bits; i++)
    {
        reverse <<= 1;
        if(data & 0x1) reverse++;
        data >>= 1;
    }
    
    return reverse;
}
*/