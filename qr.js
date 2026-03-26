/* =========================================================
   QR Code Generator — Versão corrigida com Quiet Zone
   Baseado em ISO/IEC 18004 | Byte Mode | ECC Level M
   ========================================================= */
(function(root){
'use strict';

// ---- Galois Field GF(256) ----
var GF_EXP = new Uint8Array(512),
    GF_LOG = new Uint8Array(256);

(function(){
  var x = 1;
  for(var i = 0; i < 255; i++){
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if(x & 256) x ^= 285;
  }
  for(var i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i-255];
})();

function gfMul(a, b){
  if(a === 0 || b === 0) return 0;
  return GF_EXP[(GF_LOG[a] + GF_LOG[b]) % 255];
}

function gfPoly(n){
  var p = [1];
  for(var i = 0; i < n; i++){
    var q = [1, GF_EXP[i]];
    var r = new Uint8Array(p.length + q.length - 1);
    for(var j = 0; j < p.length; j++)
      for(var k = 0; k < q.length; k++)
        r[j+k] ^= gfMul(p[j], q[k]);
    p = Array.from(r);
  }
  return p;
}

function rsEncode(data, eclen){
  var gen = gfPoly(eclen);
  var out = new Uint8Array(data.length + eclen);
  for(var i = 0; i < data.length; i++) out[i] = data[i];
  for(var i = 0; i < data.length; i++){
    var c = out[i];
    if(c !== 0)
      for(var j = 0; j < gen.length; j++)
        out[i+j] ^= gfMul(gen[j], c);
  }
  return out.slice(data.length);
}

// ---- Version Table (Byte mode, ECC M) ----
var VERSIONS = [
  null,
  [1,26,16,10,1],[2,44,28,16,1],[3,70,44,26,1],[4,100,64,18,2],
  [5,134,86,24,2],[6,172,108,16,4],[7,196,124,18,4],[8,242,154,22,4],
  [9,292,182,22,5],[10,346,216,26,5],[11,404,254,30,5],[12,466,290,22,8],
  [13,532,334,22,8],[14,581,365,24,8],[15,655,415,24,8],[16,733,453,28,8],
  [17,815,507,28,8],[18,901,563,26,10],[19,991,627,26,10],[20,1085,669,34,10],
  [21,1156,714,34,10],[22,1258,782,26,12],[23,1364,860,26,12],[24,1474,914,30,12],
  [25,1588,1000,30,12],[26,1706,1062,28,14],[27,1828,1128,28,14],[28,1921,1193,30,14],
  [29,2051,1267,24,18],[30,2185,1373,24,18],[31,2323,1455,30,18],[32,2465,1541,24,20],
  [33,2611,1631,30,20],[34,2761,1725,24,22],[35,2876,1812,30,22],[36,3034,1914,24,24],
  [37,3196,1992,30,24],[38,3362,2102,26,26],[39,3532,2216,28,26],[40,3706,2334,28,26]
];

function getVersion(len){
  for(var v = 1; v <= 40; v++){
    var bits = (v < 10 ? 4 + 8 : 4 + 16) + 8 * len;
    if(bits + 4 <= VERSIONS[v][2] * 8) return v;
  }
  return 40;
}

// ---- Encode Data ----
function encodeData(text, version){
  var bytes = [];
  for(var i = 0; i < text.length; i++){
    var c = text.charCodeAt(i);
    if(c < 128) bytes.push(c);
    else if(c < 2048){
      bytes.push(0xC0 | (c >> 6));
      bytes.push(0x80 | (c & 63));
    } else {
      bytes.push(0xE0 | (c >> 12));
      bytes.push(0x80 | ((c >> 6) & 63));
      bytes.push(0x80 | (c & 63));
    }
  }
  var n = bytes.length;
  var ccBits = version < 10 ? 8 : 16;
  var bits = [0,1,0,0]; // Byte mode indicator

  for(var i = ccBits-1; i >= 0; i--) bits.push((n >> i) & 1);
  for(var i = 0; i < n; i++)
    for(var j = 7; j >= 0; j--) bits.push((bytes[i] >> j) & 1);

  var totalBits = VERSIONS[version][2] * 8;
  for(var i = 0; i < 4 && bits.length < totalBits; i++) bits.push(0);
  while(bits.length % 8) bits.push(0);

  var pads = [0xEC, 0x11], pi = 0;
  while(bits.length < totalBits){
    for(var j = 7; j >= 0; j--) bits.push((pads[pi] >> j) & 1);
    pi ^= 1;
  }

  var cw = [];
  for(var i = 0; i < bits.length; i += 8){
    var b = 0;
    for(var j = 0; j < 8; j++) b = (b << 1) | bits[i+j];
    cw.push(b);
  }
  return cw;
}

// ---- Interleave + Error Correction ----
function buildFinal(cw, version){
  var vt = VERSIONS[version];
  var dcw = vt[2], ecpb = vt[3], blocks = vt[4];
  var blockSize = Math.floor(dcw / blocks);
  var extra = dcw % blocks;
  var dataBlocks = [], ecBlocks = [];
  var pos = 0;

  for(var b = 0; b < blocks; b++){
    var len = blockSize + (b >= blocks - extra ? 1 : 0);
    dataBlocks.push(cw.slice(pos, pos + len));
    ecBlocks.push(Array.from(rsEncode(new Uint8Array(cw.slice(pos, pos + len)), ecpb)));
    pos += len;
  }

  var result = [];
  var maxLen = dataBlocks[dataBlocks.length-1].length;
  for(var i = 0; i < maxLen; i++)
    for(var b = 0; b < blocks; b++)
      if(i < dataBlocks[b].length) result.push(dataBlocks[b][i]);

  for(var i = 0; i < ecpb; i++)
    for(var b = 0; b < blocks; b++)
      result.push(ecBlocks[b][i]);

  return result;
}

// ---- Matrix Construction (mantido igual, só toSVG foi melhorado) ----
function makeMatrix(version){ /* ... seu código original ... */ }
function setFinder(m,r,c){ /* ... seu código original ... */ }
function setTiming(m){ /* ... seu código original ... */ }
function setAlignment(m,version){ /* ... seu código original ... */ }
function setFormatReserved(m){ /* ... seu código original ... */ }
function placeData(m,data){ /* ... seu código original ... */ }
var MASK_FN = [ /* ... seu código original ... */ ];
function applyMask(m,mask){ /* ... seu código original ... */ }
function writeFormat(m,version,mask){ /* ... seu código original ... */ }
function penalty(m){ /* ... seu código original ... */ }
function encode(text){ /* ... seu código original ... */ }

// ---- TO SVG com Quiet Zone (PRINCIPAL CORREÇÃO) ----
function toSVG(text, px = 280){
  var qr = encode(text);
  var size = qr.size;
  var quiet = 4;                    // Quiet Zone obrigatória
  var mod = Math.floor(px / (size + quiet * 2));
  if(mod < 2) mod = 2;

  var off = mod * quiet;
  var total = mod * (size + quiet * 2);

  var parts = [`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${total}" height="${total}">
    <rect width="${total}" height="${total}" fill="#fff"/>`];

  for(var r = 0; r < size; r++){
    for(var c = 0; c < size; c++){
      if((qr.matrix[r][c] & 1) === 1){
        parts.push(`<rect x="${off + c*mod}" y="${off + r*mod}" width="${mod}" height="${mod}" fill="#000"/>`);
      }
    }
  }
  parts.push('</svg>');
  return parts.join('');
}

root.BaillaQR = { toSVG: toSVG };

})(window);
