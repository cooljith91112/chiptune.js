// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
try {
  this['Module'] = Module;
} catch(e) {
  this['Module'] = Module = {};
}
// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function(x) {
    process['stderr'].write(x + '\n');
  };
  var nodeFS = require('fs');
  var nodePath = require('path');
  Module['read'] = function(filename) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename).toString();
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename).toString();
    }
    return ret;
  };
  Module['load'] = function(f) {
    globalEval(read(f));
  };
  if (!Module['arguments']) {
    Module['arguments'] = process['argv'].slice(2);
  }
}
if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  // Polyfill over SpiderMonkey/V8 differences
  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function(f) { snarf(f) };
  }
  if (!Module['arguments']) {
    if (typeof scriptArgs != 'undefined') {
      Module['arguments'] = scriptArgs;
    } else if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
}
if (ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER) {
  if (!Module['print']) {
    Module['print'] = function(x) {
      console.log(x);
    };
  }
  if (!Module['printErr']) {
    Module['printErr'] = function(x) {
      console.log(x);
    };
  }
}
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (!Module['arguments']) {
    if (typeof arguments != 'undefined') {
      Module['arguments'] = arguments;
    }
  }
}
if (ENVIRONMENT_IS_WORKER) {
  // We can do very little here...
  var TRY_USE_DUMP = false;
  if (!Module['print']) {
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }
  Module['load'] = importScripts;
}
if (!ENVIRONMENT_IS_WORKER && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_SHELL) {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}
function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***
// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];
// Callbacks
if (!Module['preRun']) Module['preRun'] = [];
if (!Module['postRun']) Module['postRun'] = [];
// === Auto-generated preamble library stuff ===
//========================================
// Runtime code shared with compiler
//========================================
var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      var logg = log2(quantum);
      return '((((' +target + ')+' + (quantum-1) + ')>>' + logg + ')<<' + logg + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (/^\[\d+\ x\ (.*)\]/.test(type)) return true; // [15 x ?] blocks. Like structs
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type, quantumSize) {
    if (Runtime.QUANTUM_SIZE == 1) return 1;
    var size = {
      '%i1': 1,
      '%i8': 1,
      '%i16': 2,
      '%i32': 4,
      '%i64': 8,
      "%float": 4,
      "%double": 8
    }['%'+type]; // add '%' since float and double confuse Closure compiler as keys, and also spidermonkey as a compiler will remove 's from '_i8' etc
    if (!size) {
      if (type.charAt(type.length-1) == '*') {
        size = Runtime.QUANTUM_SIZE; // A pointer
      } else if (type[0] == 'i') {
        var bits = parseInt(type.substr(1));
        assert(bits % 8 == 0);
        size = bits/8;
      }
    }
    return size;
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    type.flatIndexes = type.fields.map(function(field) {
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = size;
      } else if (Runtime.isStructType(field)) {
        size = Types.types[field].flatSize;
        alignSize = Types.types[field].alignSize;
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else {
        throw 'Unclear type in struct: ' + field + ', in ' + type.name_ + ' :: ' + dump(Types.types[type.name_]);
      }
      alignSize = type.packed ? 1 : Math.min(alignSize, Runtime.QUANTUM_SIZE);
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      return FUNCTION_TABLE[ptr].apply(null, args);
    } else {
      return FUNCTION_TABLE[ptr]();
    }
  },
  addFunction: function (func, sig) {
    //assert(sig); // TODO: support asm
    var table = FUNCTION_TABLE; // TODO: support asm
    var ret = table.length;
    table.push(func);
    table.push(0);
    return ret;
  },
  removeFunction: function (index) {
    var table = FUNCTION_TABLE; // TODO: support asm
    table[index] = null;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function() {
        Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xff;
      if (needed) {
        buffer.push(code);
        needed--;
      }
      if (buffer.length == 0) {
        if (code < 128) return String.fromCharCode(code);
        buffer.push(code);
        if (code > 191 && code < 224) {
          needed = 1;
        } else {
          needed = 2;
        }
        return '';
      }
      if (needed > 0) return '';
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var ret;
      if (c1 > 191 && c1 < 224) {
        ret = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
      } else {
        ret = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = ((((STACKTOP)+3)>>2)<<2); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = ((((STATICTOP)+3)>>2)<<2); if (STATICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 4))*(quantum ? quantum : 4); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? (((low)>>>(0))+(((high)>>>(0))*4294967296)) : (((low)>>>(0))+(((high)|(0))*4294967296))); return ret; },
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var setjmpId = 1; // Used in setjmp/longjmp
var setjmpLabels = {};
var ABORT = false;
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function abort(text) {
  Module.print(text + ':\n' + (new Error).stack);
  ABORT = true;
  throw "Assertion: " + text;
}
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}
var globalScope = this;
// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;
// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = globalScope['Module']['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}
// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length+1);
      writeStringToMemory(value, ret);
      return ret;
    } else if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}
// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;
// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,Math.min(Math.floor((value)/4294967296), 4294967295)>>>0],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': (HEAPF64[(tempDoublePtr)>>3]=value,HEAP32[((ptr)>>2)]=HEAP32[((tempDoublePtr)>>2)],HEAP32[(((ptr)+(4))>>2)]=HEAP32[(((tempDoublePtr)+(4))>>2)]); break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;
// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return (HEAP32[((tempDoublePtr)>>2)]=HEAP32[((ptr)>>2)],HEAP32[(((tempDoublePtr)+(4))>>2)]=HEAP32[(((ptr)+(4))>>2)],HEAPF64[(tempDoublePtr)>>3]);
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_NONE = 3; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_NONE'] = ALLOC_NONE;
// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }
  var singleType = typeof types === 'string' ? types : null;
  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }
  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }
  if (singleType === 'i8') {
    HEAPU8.set(new Uint8Array(slab), ret);
    return ret;
  }
  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];
    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }
    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later
    setValue(ret+i, curr, type);
    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}
Module['allocate'] = allocate;
function Pointer_stringify(ptr, /* optional */ length) {
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = '';
  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return ((x+4095)>>12)<<12;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STACK_ROOT, STACKTOP, STACK_MAX;
var STATICTOP;
function enlargeMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value, (2) compile with ALLOW_MEMORY_GROWTH which adjusts the size at runtime but prevents some optimizations, or (3) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(!!Int32Array && !!Float64Array && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');
var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');
Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;
STACK_ROOT = STACKTOP = Runtime.alignMemory(1);
STACK_MAX = TOTAL_STACK; // we lose a little stack here, but TOTAL_STACK is nice and round so use that as the max
var tempDoublePtr = Runtime.alignMemory(allocate(12, 'i8', ALLOC_STACK), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}
STATICTOP = STACK_MAX;
assert(STATICTOP < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY
var nullString = allocate(intArrayFromString('(null)'), 'i8', ALLOC_STACK);
function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}
var __ATINIT__ = []; // functions called during startup
var __ATMAIN__ = []; // functions called when main() is to be run
var __ATEXIT__ = []; // functions called during shutdown
function initRuntime() {
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}
// Tools
// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;
function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;
// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;
function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}
if (!Math.imul) Math.imul = function(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyTracking = {};
var calledRun = false;
var runDependencyWatcher = null;
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval !== 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(function() {
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            Module.printErr('still waiting on run dependencies:');
          }
          Module.printErr('dependency: ' + dep);
        }
        if (shown) {
          Module.printErr('(end of list)');
        }
      }, 6000);
    }
  } else {
    Module.printErr('warning: run dependency added without ID');
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    Module.printErr('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    } 
    // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
    if (!calledRun && shouldRunNow) run();
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
// === Body ===
assert(STATICTOP == STACK_MAX); assert(STACK_MAX == TOTAL_STACK);
STATICTOP += 27380;
assert(STATICTOP < TOTAL_MEMORY);
var _stderr;
var __ZTVN10__cxxabiv120__si_class_type_infoE;
var __ZTVN10__cxxabiv117__class_type_infoE;
var __ZTISt9exception;
allocate([62,0,0,0,161,0,0,0,9,1,0,0,121,1,0,0,68,2,0,0,6,3,0,0,131,4,0,0,39,6,0,0,212,8,0,0,16,12,0,0,218,17,0,0,89,24,0,0,114,36,0,0,131,51,0,0,228,82,0,0,255,127,0,0], "i8", ALLOC_NONE, 5242880);
allocate([87,1,0,0,107,1,0,0,129,1,0,0,152,1,0,0,176,1,0,0,202,1,0,0,229,1,0,0,2,2,0,0,32,2,0,0,65,2,0,0,99,2,0,0,135,2,0,0,174,2,0,0], "i8", ALLOC_NONE, 5242944);
allocate([0,0,0,0,404,0,0,0,232,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5242996);
allocate([0,0,0,0,24,0,0,0,49,0,0,0,74,0,0,0,97,0,0,0,120,0,0,0,141,0,0,0,161,0,0,0,180,0,0,0,197,0,0,0,212,0,0,0,224,0,0,0,235,0,0,0,244,0,0,0,250,0,0,0,253,0,0,0,255,0,0,0,253,0,0,0,250,0,0,0,244,0,0,0,235,0,0,0,224,0,0,0,212,0,0,0,197,0,0,0,180,0,0,0,161,0,0,0,141,0,0,0,120,0,0,0,97,0,0,0,74,0,0,0,49,0,0,0,24,0,0,0,0,0,0,0,232,255,255,255,207,255,255,255,182,255,255,255,159,255,255,255,136,255,255,255,115,255,255,255,95,255,255,255,76,255,255,255,59,255,255,255,44,255,255,255,32,255,255,255,21,255,255,255,12,255,255,255,6,255,255,255,3,255,255,255,1,255,255,255,3,255,255,255,6,255,255,255,12,255,255,255,21,255,255,255,32,255,255,255,44,255,255,255,59,255,255,255,76,255,255,255,95,255,255,255,115,255,255,255,136,255,255,255,159,255,255,255,182,255,255,255,207,255,255,255,232,255,255,255,0,0,0,0,248,255,255,255,240,255,255,255,232,255,255,255,224,255,255,255,216,255,255,255,208,255,255,255,200,255,255,255,192,255,255,255,184,255,255,255,176,255,255,255,168,255,255,255,160,255,255,255,152,255,255,255,144,255,255,255,136,255,255,255,128,255,255,255,120,255,255,255,112,255,255,255,104,255,255,255,96,255,255,255,88,255,255,255,80,255,255,255,72,255,255,255,64,255,255,255,56,255,255,255,48,255,255,255,40,255,255,255,32,255,255,255,24,255,255,255,16,255,255,255,8,255,255,255,255,0,0,0,248,0,0,0,240,0,0,0,232,0,0,0,224,0,0,0,216,0,0,0,208,0,0,0,200,0,0,0,192,0,0,0,184,0,0,0,176,0,0,0,168,0,0,0,160,0,0,0,152,0,0,0,144,0,0,0,136,0,0,0,128,0,0,0,120,0,0,0,112,0,0,0,104,0,0,0,96,0,0,0,88,0,0,0,80,0,0,0,72,0,0,0,64,0,0,0,56,0,0,0,48,0,0,0,40,0,0,0,32,0,0,0,24,0,0,0,16,0,0,0,8,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,1,255,255,255,1,255,255,255,1,255,255,255,1,255,255,255,1,255,255,255,1,255,255,255,1,255,255,255,1,255,255,255,1,255,255,255,1,255,255,255,1,255,255,255,1,255,255,255,1,255,255,255,1,255,255,255,1,255,255,255,1,255,255,255,1,255,255,255,1,255,255,255,1,255,255,255,1,255,255,255,1,255,255,255,1,255,255,255,1,255,255,255,1,255,255,255,1,255,255,255,1,255,255,255,1,255,255,255,1,255,255,255,1,255,255,255,1,255,255,255,1,255,255,255,1,255,255,255,0,0,0,0,8,0,0,0,16,0,0,0,24,0,0,0,32,0,0,0,40,0,0,0,48,0,0,0,56,0,0,0,64,0,0,0,72,0,0,0,80,0,0,0,88,0,0,0,96,0,0,0,104,0,0,0,112,0,0,0,120,0,0,0,128,0,0,0,136,0,0,0,144,0,0,0,152,0,0,0,160,0,0,0,168,0,0,0,176,0,0,0,184,0,0,0,192,0,0,0,200,0,0,0,208,0,0,0,216,0,0,0,224,0,0,0,232,0,0,0,240,0,0,0,248,0,0,0,1,255,255,255,8,255,255,255,16,255,255,255,24,255,255,255,32,255,255,255,40,255,255,255,48,255,255,255,56,255,255,255,64,255,255,255,72,255,255,255,80,255,255,255,88,255,255,255,96,255,255,255,104,255,255,255,112,255,255,255,120,255,255,255,128,255,255,255,136,255,255,255,144,255,255,255,152,255,255,255,160,255,255,255,168,255,255,255,176,255,255,255,184,255,255,255,192,255,255,255,200,255,255,255,208,255,255,255,216,255,255,255,224,255,255,255,232,255,255,255,240,255,255,255,248,255,255,255], "i8", ALLOC_NONE, 5243008);
allocate([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,2,3,3,3,3,3,3,4,4,4,4,5,5,5,5,6,6,6,6,7,7,7,8,8,9,9,10,10,11,11,12,12,13,13,14,14,15,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,33,34,36,38,40,42,44,46,48,50,52,54,56,58,60,62,65,68,72,77,80,84,91,95,98,103,109,114,120,126,127] /* \00\00\00\00\00\00\0 */, "i8", ALLOC_NONE, 5244032);
allocate([0,0,0,0,170,0,0,0,474,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5244160);
allocate([0,0,0,0,430,0,0,0,134,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5244172);
allocate(16, "i8", ALLOC_NONE, 5244184);
allocate([88,3,40,3,250,2,208,2,166,2,128,2,92,2,58,2,26,2,252,1,224,1,197,1,172,1,148,1,125,1,104,1,83,1,64,1,46,1,29,1,13,1,254,0,240,0,226,0,214,0,202,0,190,0,180,0,170,0,160,0,151,0,143,0,135,0,127,0,120,0,113,0,82,3,34,3,245,2,203,2,162,2,125,2,89,2,55,2,23,2,249,1,221,1,194,1,169,1,145,1,123,1,101,1,81,1,62,1,44,1,28,1,12,1,253,0,239,0,225,0,213,0,201,0,189,0,179,0,169,0,159,0,150,0,142,0,134,0,126,0,119,0,113,0,76,3,28,3,240,2,197,2,158,2,120,2,85,2,51,2,20,2,246,1,218,1,191,1,166,1,142,1,120,1,99,1,79,1,60,1,42,1,26,1,10,1,251,0,237,0,224,0,211,0,199,0,188,0,177,0,167,0,158,0,149,0,141,0,133,0,125,0,118,0,112,0,70,3,23,3,234,2,192,2,153,2,116,2,80,2,47,2,16,2,242,1,214,1,188,1,163,1,139,1,117,1,96,1,76,1,58,1,40,1,24,1,8,1,249,0,235,0,222,0,209,0,198,0,187,0,176,0,166,0,157,0,148,0,140,0,132,0,125,0,118,0,111,0,64,3,17,3,229,2,187,2,148,2,111,2,76,2,43,2,12,2,239,1,211,1,185,1,160,1,136,1,114,1,94,1,74,1,56,1,38,1,22,1,6,1,247,0,233,0,220,0,208,0,196,0,185,0,175,0,165,0,156,0,147,0,139,0,131,0,124,0,117,0,110,0,58,3,11,3,224,2,182,2,143,2,107,2,72,2,39,2,8,2,235,1,207,1,181,1,157,1,134,1,112,1,91,1,72,1,53,1,36,1,20,1,4,1,245,0,232,0,219,0,206,0,195,0,184,0,174,0,164,0,155,0,146,0,138,0,130,0,123,0,116,0,109,0,52,3,6,3,218,2,177,2,139,2,102,2,68,2,35,2,4,2,231,1,204,1,178,1,154,1,131,1,109,1,89,1,69,1,51,1,34,1,18,1,2,1,244,0,230,0,217,0,205,0,193,0,183,0,172,0,163,0,154,0,145,0,137,0,129,0,122,0,115,0,109,0,46,3,0,3,213,2,172,2,134,2,98,2,63,2,31,2,1,2,228,1,201,1,175,1,151,1,128,1,107,1,86,1,67,1,49,1,32,1,16,1,0,1,242,0,228,0,216,0,204,0,192,0,181,0,171,0,161,0,152,0,144,0,136,0,128,0,121,0,114,0,108,0,139,3,88,3,40,3,250,2,208,2,166,2,128,2,92,2,58,2,26,2,252,1,224,1,197,1,172,1,148,1,125,1,104,1,83,1,64,1,46,1,29,1,13,1,254,0,240,0,226,0,214,0,202,0,190,0,180,0,170,0,160,0,151,0,143,0,135,0,127,0,120,0,132,3,82,3,34,3,245,2,203,2,163,2,124,2,89,2,55,2,23,2,249,1,221,1,194,1,169,1,145,1,123,1,101,1,81,1,62,1,44,1,28,1,12,1,253,0,238,0,225,0,212,0,200,0,189,0,179,0,169,0,159,0,150,0,142,0,134,0,126,0,119,0,126,3,76,3,28,3,240,2,197,2,158,2,120,2,85,2,51,2,20,2,246,1,218,1,191,1,166,1,142,1,120,1,99,1,79,1,60,1,42,1,26,1,10,1,251,0,237,0,223,0,211,0,199,0,188,0,177,0,167,0,158,0,149,0,141,0,133,0,125,0,118,0,119,3,70,3,23,3,234,2,192,2,153,2,116,2,80,2,47,2,16,2,242,1,214,1,188,1,163,1,139,1,117,1,96,1,76,1,58,1,40,1,24,1,8,1,249,0,235,0,222,0,209,0,198,0,187,0,176,0,166,0,157,0,148,0,140,0,132,0,125,0,118,0,113,3,64,3,17,3,229,2,187,2,148,2,111,2,76,2,43,2,12,2,238,1,211,1,185,1,160,1,136,1,114,1,94,1,74,1,56,1,38,1,22,1,6,1,247,0,233,0,220,0,208,0,196,0,185,0,175,0,165,0,156,0,147,0,139,0,131,0,123,0,117,0,107,3,58,3,11,3,224,2,182,2,143,2,107,2,72,2,39,2,8,2,235,1,207,1,181,1,157,1,134,1,112,1,91,1,72,1,53,1,36,1,20,1,4,1,245,0,232,0,219,0,206,0,195,0,184,0,174,0,164,0,155,0,146,0,138,0,130,0,123,0,116,0,100,3,52,3,6,3,218,2,177,2,139,2,102,2,68,2,35,2,4,2,231,1,204,1,178,1,154,1,131,1,109,1,89,1,69,1,51,1,34,1,18,1,2,1,244,0,230,0,217,0,205,0,193,0,183,0,172,0,163,0,154,0,145,0,137,0,129,0,122,0,115,0,94,3,46,3,0,3,213,2,172,2,134,2,98,2,63,2,31,2,1,2,228,1,201,1,175,1,151,1,128,1,107,1,86,1,67,1,49,1,32,1,16,1,0,1,242,0,228,0,216,0,203,0,192,0,181,0,171,0,161,0,152,0,144,0,136,0,128,0,121,0,114,0], "i8", ALLOC_NONE, 5244200);
allocate([96,56,96,0,0,160,96,0,1,62,96,0,1,12,72,231] /* `8`\00\00\A0`\00\01_ */, "i8", ALLOC_NONE, 5245352);
allocate(1536, "i8", ALLOC_NONE, 5245368);
allocate([0,0,0,0,168,0,0,0,24,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5246904);
allocate([40,0,0,0,258,0,0,0,26,0,0,0,20,0,0,0,82,0,0,0,66,0,0,0,534,0,0,0,496,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5246916);
allocate([236,0,0,0,300,0,0,0,100,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5246948);
allocate([278,0,0,0,532,0,0,0,346,0,0,0,518,0,0,0,336,0,0,0,540,0,0,0,68,0,0,0,206,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5246980);
allocate([0,0,0,0,290,0,0,0,406,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5247012);
allocate([0,0,0,0,14,0,0,0,268,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5247024);
allocate([97,115,100,0] /* asd\00 */, "i8", ALLOC_NONE, 5247036);
allocate([0,0,0,0,226,0,0,0,6,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5247040);
allocate([0,0,0,0,410,0,0,0,194,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5247052);
allocate([0,0,0,0,542,0,0,0,590,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5247064);
allocate([0,0,0,0,118,0,0,0,582,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5247076);
allocate([0,0,0,0,104,0,0,0,98,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5247088);
allocate(32, "i8", ALLOC_NONE, 5247100);
allocate([0,0,0,0,2,0,0,0,4,0,0,0,1,0,0,0,3,0,0,0,5,0,0,0,255,255,255,255,255,255,255,255,6,0,0,0,8,0,0,0,10,0,0,0,7,0,0,0,9,0,0,0,11,0,0,0,255,255,255,255,255,255,255,255,12,0,0,0,14,0,0,0,16,0,0,0,13,0,0,0,15,0,0,0,17,0,0,0,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255], "i8", ALLOC_NONE, 5247132);
allocate([0,0,0,0,49,0,0,0,97,0,0,0,141,0,0,0,180,0,0,0,212,0,0,0,235,0,0,0,250,0,0,0,255,0,0,0,250,0,0,0,235,0,0,0,212,0,0,0,180,0,0,0,141,0,0,0,97,0,0,0,49,0,0,0,0,0,0,0,207,255,255,255,159,255,255,255,115,255,255,255,76,255,255,255,44,255,255,255,21,255,255,255,6,255,255,255,1,255,255,255,6,255,255,255,21,255,255,255,44,255,255,255,76,255,255,255,115,255,255,255,159,255,255,255,207,255,255,255], "i8", ALLOC_NONE, 5247260);
allocate([0,0,0,0,112,0,0,0,36,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5247388);
allocate([0,0,0,0,44,0,0,0,332,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5247400);
allocate([0,0,0,0,1,0,0,0,1,0,0,0,255,255,255,255,1,0,0,0,1,0,0,0,254,255,255,255,1,0,0,0,1,0,0,0,252,255,255,255,1,0,0,0,1,0,0,0,248,255,255,255,1,0,0,0,1,0,0,0,240,255,255,255,1,0,0,0,1,0,0,0,0,0,0,0,2,0,0,0,3,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,2,0,0,0,1,0,0,0,1,0,0,0,4,0,0,0,1,0,0,0,1,0,0,0,8,0,0,0,1,0,0,0,1,0,0,0,16,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,3,0,0,0,2,0,0,0,0,0,0,0,2,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0], "i8", ALLOC_NONE, 5247412);
allocate([0,0,0,0,324,0,0,0,522,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5247616);
allocate([0,0,0,0,1,0,0,0,2,0,0,0,8,0,0,0,9,0,0,0,10,0,0,0,16,0,0,0,17,0,0,0,18,0,0,0,3,0,0,0,4,0,0,0,5,0,0,0,11,0,0,0,12,0,0,0,13,0,0,0,19,0,0,0,20,0,0,0,21,0,0,0], "i8", ALLOC_NONE, 5247628);
allocate([32,0,0,0,32,0,0,0,64,0,0,0,64,0,0,0,96,0,0,0,96,0,0,0,128,0,0,0,128,0,0,0,224,0,0,0,224,0,0,0,192,0,0,0], "i8", ALLOC_NONE, 5247700);
allocate(4, "i8", ALLOC_NONE, 5247744);
allocate([0,0,0,0,360,0,0,0,120,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5247748);
allocate([0,0,0,0,394,0,0,0,234,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5247760);
allocate([0,0,0,0,364,0,0,0,138,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5247780);
allocate([0,0,0,0,144,0,0,0,366,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5247800);
allocate([0,0,0,0,274,0,0,0,440,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5247820);
allocate([0,0,0,0,426,0,0,0,440,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5247840);
allocate([0,0,0,0,10,0,0,0,440,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5247860);
allocate([0,0,0,0,160,0,0,0,72,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5247880);
allocate([0,0,0,0,88,0,0,0,276,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5247900);
allocate([0,0,0,0,8,0,0,0,288,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5247920);
allocate([0,0,0,0,320,0,0,0,562,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5247940);
allocate([0,0,0,0,214,0,0,0,354,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5247960);
allocate([0,0,0,0,434,0,0,0,76,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5247980);
allocate([0,0,0,0,114,0,0,0,256,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5248000);
allocate([0,0,0,0,438,0,0,0,250,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5248020);
allocate([0,0,0,0,442,0,0,0,18,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5248040);
allocate([0,0,0,0,480,0,0,0,180,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5248060);
allocate([0,0,0,0,172,0,0,0,286,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5248080);
allocate([0,0,0,0,380,0,0,0,58,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5248100);
allocate([0,0,0,0,142,0,0,0,110,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5248120);
allocate([0,0,0,0,606,0,0,0,530,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5248140);
allocate([0,0,0,0,462,0,0,0,222,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5248160);
allocate([0,0,0,0,486,0,0,0,596,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5248180);
allocate([0,0,0,0,388,0,0,0,92,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5248200);
allocate([0,0,0,0,52,0,0,0,238,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5248220);
allocate([0,0,0,0,340,0,0,0,318,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5248240);
allocate([0,0,0,0,544,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5248260);
allocate([0,0,0,0,624,0,0,0,314,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5248280);
allocate([0,0,0,0,500,0,0,0,454,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5248300);
allocate([0,0,0,0,94,0,0,0,454,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5248320);
allocate([0,0,0,0,418,0,0,0,392,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5248340);
allocate([0,0,0,0,526,0,0,0,42,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5248352);
allocate([0,0,0,0,240,0,0,0,580,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5248372);
allocate([0,0,0,0,538,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5248392);
allocate([0,0,0,0,48,0,0,0,632,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5248412);
allocate([0,0,0,0,408,0,0,0,622,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5248432);
allocate([204,22,80,0,124,22,80,0,104,22,80,0,176,21,80,0,136,21,80,0,116,21,80,0,96,21,80,0,64,21,80,0,200,20,80,0,160,20,80,0,180,20,80,0,20,20,80,0,0,20,80,0,60,20,80,0,56,19,80,0,96,19,80,0,156,19,80,0,236,19,80,0,36,19,80,0,44,21,80,0,164,22,80,0,144,22,80,0,140,20,80,0,40,20,80,0,120,20,80,0,100,20,80,0,80,20,80,0,220,20,80,0,4,21,80,0,24,21,80,0,240,20,80,0,16,19,80,0,116,19,80,0,76,19,80,0,136,19,80,0,184,22,80,0,196,19,80,0,216,19,80,0,156,21,80,0,176,19,80,0,0,0,0,0], "i8", ALLOC_NONE, 5248452);
allocate([0,0,0,0,218,0,0,0,422,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5248616);
allocate([0,0,0,0,264,0,0,0,616,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5248636);
allocate([0,0,0,0,608,0,0,0,152,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5248656);
allocate([0,0,0,0,374,0,0,0,292,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5248676);
allocate([0,0,0,0,282,0,0,0,242,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5248696);
allocate([0,0,0,0,614,0,0,0,362,0,0,0,0,0,0,0,0,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5248716);
allocate([0,0,0,0,5,0,0,0,8,0,0,0,10,0,0,0,12,0,0,0,14,0,0,0,15,0,0,0,17,0,0,0,18,0,0,0,20,0,0,0,21,0,0,0,22,0,0,0,23,0,0,0,25,0,0,0,26,0,0,0,27,0,0,0,28,0,0,0,29,0,0,0,30,0,0,0,31,0,0,0,32,0,0,0,33,0,0,0,34,0,0,0,35,0,0,0,36,0,0,0,37,0,0,0,37,0,0,0,38,0,0,0,39,0,0,0,40,0,0,0,41,0,0,0,42,0,0,0,42,0,0,0,43,0,0,0,44,0,0,0,45,0,0,0,46,0,0,0,46,0,0,0,47,0,0,0,48,0,0,0,49,0,0,0,49,0,0,0,50,0,0,0,51,0,0,0,51,0,0,0,52,0,0,0,53,0,0,0,54,0,0,0,54,0,0,0,55,0,0,0,56,0,0,0,56,0,0,0,57,0,0,0,58,0,0,0,58,0,0,0,59,0,0,0,59,0,0,0,60,0,0,0,61,0,0,0,61,0,0,0,62,0,0,0,63,0,0,0,63,0,0,0,64,0,0,0,64,0,0,0], "i8", ALLOC_NONE, 5248736);
allocate([0,0,0,0,370,0,0,0,488,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5248996);
allocate([0,0,3,88,3,40,2,250,2,208,2,166,2,128,2,92,2,58,2,26,1,252,1,224,1,197,1,172,1,148,1,125,1,104,1,83,1,64,1,46,1,29,1,13,0,254,0,240,0,226,0,214,0,202,0,190,0,180,0,170,0,160,0,151,0,143,0,135,0,127,0,120,0,113], "i8", ALLOC_NONE, 5249008);
allocate([0,0,0,0,334,0,0,0,166,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5249084);
allocate([0,0,0,0,504,0,0,0,176,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5249096);
allocate([0,0,0,0,70,0,0,0,330,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5249108);
allocate([86,28,0,0,34,28,0,0,238,27,0,0,187,27,0,0,135,27,0,0,85,27,0,0,34,27,0,0,240,26,0,0,191,26,0,0,142,26,0,0,93,26,0,0,44,26,0,0,252,25,0,0,204,25,0,0,156,25,0,0,109,25,0,0,62,25,0,0,16,25,0,0,226,24,0,0,180,24,0,0,134,24,0,0,89,24,0,0,44,24,0,0,0,24,0,0,212,23,0,0,168,23,0,0,124,23,0,0,81,23,0,0,38,23,0,0,251,22,0,0,209,22,0,0,167,22,0,0,125,22,0,0,84,22,0,0,43,22,0,0,2,22,0,0,217,21,0,0,177,21,0,0,137,21,0,0,98,21,0,0,58,21,0,0,19,21,0,0,236,20,0,0,198,20,0,0,159,20,0,0,121,20,0,0,84,20,0,0,46,20,0,0,9,20,0,0,228,19,0,0,192,19,0,0,155,19,0,0,119,19,0,0,83,19,0,0,48,19,0,0,12,19,0,0,233,18,0,0,198,18,0,0,164,18,0,0,130,18,0,0,95,18,0,0,62,18,0,0,28,18,0,0,251,17,0,0,218,17,0,0,185,17,0,0,152,17,0,0,120,17,0,0,87,17,0,0,55,17,0,0,24,17,0,0,248,16,0,0,217,16,0,0,186,16,0,0,155,16,0,0,125,16,0,0,94,16,0,0,64,16,0,0,34,16,0,0,4,16,0,0,231,15,0,0,202,15,0,0,173,15,0,0,144,15,0,0,115,15,0,0,87,15,0,0,58,15,0,0,30,15,0,0,2,15,0,0,231,14,0,0,203,14,0,0,176,14,0,0,149,14,0,0,122,14,0,0,95,14,0,0,69,14,0,0,43,14,0,0,17,14,0,0,247,13,0,0,221,13,0,0,195,13,0,0,170,13,0,0,145,13,0,0,120,13,0,0], "i8", ALLOC_NONE, 5249120);
allocate([88,3,0,0,40,3,0,0,250,2,0,0,208,2,0,0,166,2,0,0,128,2,0,0,92,2,0,0,58,2,0,0,26,2,0,0,252,1,0,0,224,1,0,0,197,1,0,0,172,1,0,0,148,1,0,0,125,1,0,0,104,1,0,0,83,1,0,0,64,1,0,0,46,1,0,0,29,1,0,0,13,1,0,0,254,0,0,0,240,0,0,0,226,0,0,0,214,0,0,0,202,0,0,0,190,0,0,0,180,0,0,0,170,0,0,0,160,0,0,0,151,0,0,0,143,0,0,0,135,0,0,0,127,0,0,0,120,0,0,0,113,0,0,0,255,255,255,255], "i8", ALLOC_NONE, 5249536);
allocate([0,0,0,0,96,0,0,0,148,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5249684);
allocate([0,0,0,0,164,0,0,0,116,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5249696);
allocate(32, "i8", ALLOC_NONE, 5249708);
allocate([0,0,0,0,80,0,0,0,322,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5249740);
allocate([0,0,0,0,150,0,0,0,262,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5249752);
allocate([54,110,192,250,150,42,235,238,3,74,162,219,170,73,170,234,2,0,0,0,147,241,70,174,183,88,195,157,139,95,188,152,191,35,122,67,4,0,0,0,112,170,3,77,251,47,31,115,217,253,186,254,19,27,183,1,1,0,0,0,233,152,1,44,112,14,180,58,240,50,23,17,48,88,41,178,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5249764);
allocate(24, "i8", ALLOC_NONE, 5249864);
allocate([0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5249888);
allocate([0,0,0,0,524,0,0,0,30,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5250168);
allocate([47,0,0,0,43,0,0,0,40,0,0,0,37,0,0,0,35,0,0,0,32,0,0,0,30,0,0,0,29,0,0,0,27,0,0,0,26,0,0,0], "i8", ALLOC_NONE, 5250180);
allocate([0,0,0,0,618,0,0,0,132,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5250220);
allocate([0,0,0,0,174,0,0,0,636,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5250232);
allocate([0,0,0,0,212,0,0,0,224,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5250244);
allocate([0,0,0,0,468,0,0,0,200,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5250256);
allocate([0,0,0,0,182,0,0,0,546,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5250268);
allocate([0,0,0,0,156,0,0,0,352,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5250280);
allocate([0,0,0,0,402,0,0,0,228,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5250292);
allocate([0,0,0,0,416,0,0,0,252,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5250304);
allocate([0,0,0,0,472,0,0,0,556,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5250316);
allocate([0,0,0,0,140,0,0,0,348,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5250328);
allocate(32, "i8", ALLOC_NONE, 5250340);
allocate([0,72,100,116,130,138,146,154,162,166,170,174,178,182,234,190,194,196,198,200,202,204,206,208,210,212,214,216,218,220,222,224,226,226,228,228,230,230,232,232,234,234,236,236,238,238,240,240,242,242,244,244,246,246,248,248,250,250,252,252,254,254,254,254,254] /* \00Hdt\82\8A\92\9A\A */, "i8", ALLOC_NONE, 5250372);
allocate([0,0,0,0,272,0,0,0,572,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5250440);
allocate([0,0,0,0,2,0,0,0,3,0,0,0], "i8", ALLOC_NONE, 5250452);
allocate([0,0,0,0,5,0,0,0,6,0,0,0,7,0,0,0,8,0,0,0,10,0,0,0,11,0,0,0,13,0,0,0,16,0,0,0,19,0,0,0,22,0,0,0,26,0,0,0,32,0,0,0,43,0,0,0,64,0,0,0,128,0,0,0], "i8", ALLOC_NONE, 5250464);
allocate([0,0,0,0,86,0,0,0,490,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5250528);
allocate([0,0,0,0,612,0,0,0,248,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5250540);
allocate([0,0,0,0,246,0,0,0,642,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5250552);
allocate([0,0,0,0,552,0,0,0,122,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5250564);
allocate([1,0,0,0,2,0,0,0,3,0,0,0,4,0,0,0,5,0,0,0,6,0,0,0,7,0,0,0,8,0,0,0,9,0,0,0], "i8", ALLOC_NONE, 5250576);
allocate([0,0,0,0,396,0,0,0,450,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5250612);
allocate(4, "i8", ALLOC_NONE, 5250624);
allocate(4, "i8", ALLOC_NONE, 5250628);
allocate(4, "i8", ALLOC_NONE, 5250632);
allocate(4, "i8", ALLOC_NONE, 5250636);
allocate([0,0,0,0,600,0,0,0,208,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5250640);
allocate([0,0,0,0,484,0,0,0,386,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5250652);
allocate([0,0,0,0,626,0,0,0,124,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5250664);
allocate([255,15,11,13,10,2,1,3,4,29,0] /* \FF\0F\0B\0D\0A\02\0 */, "i8", ALLOC_NONE, 5250676);
allocate([255,163,11,13,10,2,1,3,4,29,0,6,5,255,255,9,255,27,7,254,171,172,16,255,255,255,255] /* \FF\A3\0B\0D\0A\02\0 */, "i8", ALLOC_NONE, 5250688);
allocate([255,0,0,0,1,0,0,0,2,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,112,0,0,0,113,0,0,0,114,0,0,0,156,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,157,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,117,0,0,0,255,0,0,0,255,0,0,0,255,0,0,0,11,0,0,0,255,0,0,0,255,0,0,0,15,0,0,0,255,0,0,0,118,0,0,0,12,0,0,0], "i8", ALLOC_NONE, 5250716);
allocate([0,0,13,0,0,0,0,0,0,0,0,0,0,0,0] /* \00\00\0D\00\00\00\0 */, "i8", ALLOC_NONE, 5250844);
allocate([0,171,13,2,255,172,255,255,255,11,255,10,14,3,9,255,255,255,163,7,1,4,255,5,6] /* \00\AB\0D\02\FF\AC\F */, "i8", ALLOC_NONE, 5250860);
allocate([255,163,11,13,10,2,1,3,4,29,0,6,5,128,129,9,137,27,7,254,135,172,16,17,8,138,132] /* \FF\A3\0B\0D\0A\02\0 */, "i8", ALLOC_NONE, 5250888);
allocate([255,163,171,3,5,4,6,172,7,0,8,25,12,10,165,166,157,156,1,2,254,253,132,133,9,255,20,27,29,11,13,16,17,14,169,170] /* \FF\A3\AB\03\05\04\0 */, "i8", ALLOC_NONE, 5250916);
allocate([255,249,248,122,251,254,4,253,252,123,255,255,250,255,255,15] /* \FF\F9\F8z\FB\FE\04\ */, "i8", ALLOC_NONE, 5250952);
allocate([121,120,122,166,123,126] /* yxz\A6{~ */, "i8", ALLOC_NONE, 5250968);
allocate([116,0,80,0,120,28,80,0,156,32,80,0,100,16,80,0,136,29,80,0,168,17,80,0,64,16,80,0,48,16,80,0,216,26,80,0,248,29,80,0,236,29,80,0,228,23,80,0,0,29,80,0,12,5,80,0,24,29,80,0,160,26,80,0,12,29,80,0,92,30,80,0,104,30,80,0,72,24,80,0,108,75,80,0,80,71,80,0,80,30,80,0,184,28,80,0,172,28,80,0,244,28,80,0,232,28,80,0,220,28,80,0,32,39,80,0,128,18,80,0,60,24,80,0,184,15,80,0,20,37,80,0,52,30,80,0,8,37,80,0,196,28,80,0,96,75,80,0,36,16,80,0,44,39,80,0,56,39,80,0,252,36,80,0,148,26,80,0,156,17,80,0,232,36,80,0,0,5,80,0,76,16,80,0,68,71,80,0,204,26,80,0,224,29,80,0,112,16,80,0,144,32,80,0,120,75,80,0,4,19,80,0,4,30,80,0,208,28,80,0,228,75,80,0,84,24,80,0,88,16,80,0,84,21,80,0,0,0,0,0], "i8", ALLOC_NONE, 5250976);
allocate([0,0,0,0,22,0,0,0,644,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5251216);
allocate([0,0,0,0,284,0,0,0,108,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5251228);
allocate([0,0,0,0,184,255,0,0,112,255,0,0,40,255,0,0,224,254,0,0,152,254,0,0,80,254,0,0,8,254,0,0,192,253,0,0,120,253,0,0,48,253,0,0,232,252,0,0,160,252,0,0,88,252,0,0,16,252,0,0,200,251,0,0], "i8", ALLOC_NONE, 5251240);
allocate([130,0,0,0,132,0,0,0,134,0,0,0,136,0,0,0,138,0,0,0,140,0,0,0,142,0,0,0,144,0,0,0,146,0,0,0,148,0,0,0,151,0,0,0,153,0,0,0,155,0,0,0,157,0,0,0,160,0,0,0,162,0,0,0,164,0,0,0,167,0,0,0,169,0,0,0,172,0,0,0,174,0,0,0,177,0,0,0,179,0,0,0,182,0,0,0,184,0,0,0,187,0,0,0,190,0,0,0,193,0,0,0,195,0,0,0,198,0,0,0,201,0,0,0,204,0,0,0,207,0,0,0,210,0,0,0,213,0,0,0,216,0,0,0,220,0,0,0,223,0,0,0,226,0,0,0,229,0,0,0,233,0,0,0,236,0,0,0,239,0,0,0,243,0,0,0,246,0,0,0,250,0,0,0,254,0,0,0,1,1,0,0,5,1,0,0,9,1,0,0,13,1,0,0,17,1,0,0,21,1,0,0,25,1,0,0,29,1,0,0,33,1,0,0,37,1,0,0,41,1,0,0,46,1,0,0,50,1,0,0,55,1,0,0,59,1,0,0,64,1,0,0,68,1,0,0,73,1,0,0,78,1,0,0,83,1,0,0,88,1,0,0,93,1,0,0,98,1,0,0,103,1,0,0,108,1,0,0,113,1,0,0,119,1,0,0,124,1,0,0,130,1,0,0,135,1,0,0,141,1,0,0,147,1,0,0,153,1,0,0,159,1,0,0,165,1,0,0,171,1,0,0,177,1,0,0,184,1,0,0,190,1,0,0,196,1,0,0,203,1,0,0,210,1,0,0,216,1,0,0,223,1,0,0,230,1,0,0,237,1,0,0,245,1,0,0,252,1,0,0,3,2,0,0,11,2,0,0,18,2,0,0,26,2,0,0,34,2,0,0,42,2,0,0,50,2,0,0,58,2,0,0,66,2,0,0,75,2,0,0,83,2,0,0,92,2,0,0,101,2,0,0,110,2,0,0,119,2,0,0,128,2,0,0,137,2,0,0,147,2,0,0,156,2,0,0,166,2,0,0,176,2,0,0,186,2,0,0,196,2,0,0,206,2,0,0,217,2,0,0,227,2,0,0,238,2,0,0,249,2,0,0,4,3,0,0,15,3,0,0,27,3,0,0,38,3,0,0,50,3,0,0,62,3,0,0,74,3,0,0,86,3,0,0,99,3,0,0,112,3,0,0,124,3,0,0,137,3,0,0,150,3,0,0,164,3,0,0,177,3,0,0,191,3,0,0,205,3,0,0,219,3,0,0,234,3,0,0,248,3,0,0,7,4,0,0,22,4,0,0,37,4,0,0,53,4,0,0,68,4,0,0,84,4,0,0,100,4,0,0,117,4,0,0,133,4,0,0,150,4,0,0,167,4,0,0,185,4,0,0,202,4,0,0,220,4,0,0,238,4,0,0,0,5,0,0,19,5,0,0,38,5,0,0,57,5,0,0,77,5,0,0,96,5,0,0,116,5,0,0,137,5,0,0,157,5,0,0,178,5,0,0,199,5,0,0,221,5,0,0,243,5,0,0,9,6,0,0,31,6,0,0,54,6,0,0,77,6,0,0,101,6,0,0,125,6,0,0,149,6,0,0,173,6,0,0,198,6,0,0,224,6,0,0,249,6,0,0,19,7,0,0,45,7,0,0,72,7,0,0,99,7,0,0,127,7,0,0,155,7,0,0,183,7,0,0,212,7,0,0,241,7,0,0,14,8,0,0,45,8,0,0,75,8,0,0,106,8,0,0,137,8,0,0,169,8,0,0,201,8,0,0,234,8,0,0,11,9,0,0,45,9,0,0,79,9,0,0,114,9,0,0,149,9,0,0,185,9,0,0,221,9,0,0,1,10,0,0,39,10,0,0,77,10,0,0,115,10,0,0,154,10,0,0,193,10,0,0,233,10,0,0,18,11,0,0,59,11,0,0,101,11,0,0,143,11,0,0,187,11,0,0,230,11,0,0,19,12,0,0,63,12,0,0,109,12,0,0,155,12,0,0,202,12,0,0,250,12,0,0,42,13,0,0,91,13,0,0,141,13,0,0,192,13,0,0,243,13,0,0,39,14,0,0,91,14,0,0,145,14,0,0,199,14,0,0,254,14,0,0,54,15,0,0,111,15,0,0,168,15,0,0,226,15,0,0,29,16,0,0,90,16,0,0,150,16,0,0,212,16,0,0,19,17,0,0,82,17,0,0,147,17,0,0,212,17,0,0,23,18,0,0,90,18,0,0,158,18,0,0,228,18,0,0,42,19,0,0,114,19,0,0,186,19,0,0,3,20,0,0,78,20,0,0], "i8", ALLOC_NONE, 5251304);
allocate([0,0,0,0,574,0,0,0,516,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5252328);
allocate(8, "i8", ALLOC_NONE, 5252340);
allocate([0,0,0,0,270,0,0,0,368,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5252348);
allocate([0,0,0,0,398,0,0,0,510,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5252360);
allocate([0,0,0,0,390,0,0,0,592,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5252372);
allocate([0,0,128,63,191,53,123,63,113,130,118,63,166,229,113,63,243,94,109,63,238,237,104,63,48,146,100,63,82,75,96,63,241,24,92,63,170,250,87,63,29,240,83,63,236,248,79,63,185,20,76,63,42,67,72,63,230,131,68,63,149,214,64,63,225,58,61,63,117,176,57,63,255,54,54,63,46,206,50,63,177,117,47,63,59,45,44,63,127,244,40,63,50,203,37,63,9,177,34,63,188,165,31,63,4,169,28,63,155,186,25,63,60,218,22,63,165,7,20,63,147,66,17,63,198,138,14,63,253,223,11,63,251,65,9,63,131,176,6,63,87,43,4,63,62,178,1,63,252,137,254,62,187,198,249,62,74,26,245,62,60,132,240,62,38,4,236,62,159,153,231,62,63,68,227,62,161,3,223,62,97,215,218,62,30,191,214,62,121,186,210,62,19,201,206,62,144,234,202,62,149,30,199,62,202,100,195,62,216,188,191,62,106,38,188,62,42,161,184,62,200,44,181,62,242,200,177,62,88,117,174,62,174,49,171,62,167,253,167,62,248,216,164,62,87,195,161,62,125,188,158,62,34,196,155,62,2,218,152,62,215,253,149,62,96,47,147,62,90,110,144,62,133,186,141,62,162,19,139,62,115,121,136,62,187,235,133,62,62,106,131,62,194,244,128,62,26,22,125,62,207,89,120,62,50,180,115,62,216,36,111,62,85,171,106,62,65,71,102,62,54,248,97,62,206,189,93,62,167,151,89,62,96,133,85,62,153,134,81,62,246,154,77,62,26,194,73,62,171,251,69,62,82,71,66,62,183,164,62,62,135,19,59,62,108,147,55,62,22,36,52,62,51,197,48,62,118,118,45,62,145,55,42,62,56,8,39,62,33,232,35,62,2,215,32,62,147,212,29,62,143,224,26,62,177,250,23,62,180,34,21,62,86,88,18,62,86,155,15,62,116,235,12,62,113,72,10,62,15,178,7,62,18,40,5,62,63,170,2,62,90,56,0,62,88,164,251,61,248,238,246,61,37,80,242,61,116,199,237,61,123,84,233,61,209,246,228,61,17,174,224,61,215,121,220,61,192,89,216,61,108,77,212,61,123,84,208,61,146,110,204,61,85,155,200,61,107,218,196,61,123,43,193,61,48,142,189,61,53,2,186,61], "i8", ALLOC_NONE, 5252384);
allocate([0,0,0,0,628,0,0,0,84,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5252896);
allocate([0,0,0,0,38,0,0,0,306,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5252908);
allocate([0,0,0,0,502,0,0,0,382,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5252920);
allocate([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,255,255,254,255,254,255,254,255,254,255,254,255,253,255,253,255,253,255,252,255,252,255,252,255,251,255,251,255,250,255,250,255,250,255,249,255,249,255,248,255,248,255,247,255,247,255,246,255,246,255,245,255,245,255,244,255,243,255,243,255,242,255,242,255,241,255,240,255,240,255,239,255,238,255,237,255,237,255,236,255,235,255,234,255,234,255,233,255,232,255,231,255,230,255,230,255,229,255,228,255,227,255,226,255,225,255,224,255,223,255,222,255,221,255,220,255,219,255,218,255,217,255,216,255,215,255,214,255,213,255,212,255,211,255,210,255,209,255,208,255,207,255,205,255,204,255,203,255,202,255,201,255,199,255,198,255,197,255,196,255,195,255,193,255,192,255,191,255,189,255,188,255,187,255,186,255,184,255,183,255,181,255,180,255,179,255,177,255,176,255,174,255,173,255,172,255,170,255,169,255,167,255,166,255,164,255,163,255,161,255,160,255,158,255,157,255,155,255,154,255,152,255,150,255,149,255,147,255,146,255,144,255,142,255,141,255,139,255,137,255,136,255,134,255,132,255,131,255,129,255,127,255,126,255,124,255,122,255,120,255,119,255,117,255,115,255,113,255,111,255,110,255,108,255,106,255,104,255,102,255,100,255,99,255,97,255,95,255,93,255,91,255,89,255,87,255,85,255,83,255,81,255,80,255,78,255,76,255,74,255,72,255,70,255,68,255,66,255,64,255,62,255,60,255,58,255,56,255,54,255,51,255,49,255,47,255,45,255,43,255,41,255,39,255,37,255,35,255,33,255,31,255,28,255,26,255,24,255,22,255,20,255,18,255,16,255,13,255,11,255,9,255,7,255,5,255,2,255,0,255,254,254,252,254,249,254,247,254,245,254,243,254,240,254,238,254,236,254,234,254,231,254,229,254,227,254,224,254,222,254,220,254,217,254,215,254,213,254,210,254,208,254,206,254,203,254,201,254,199,254,196,254,194,254,192,254,189,254,187,254,184,254,182,254,180,254,177,254,175,254,172,254,170,254,167,254,165,254,163,254,160,254,158,254,155,254,153,254,150,254,148,254,145,254,143,254,140,254,138,254,135,254,133,254,130,254,128,254,125,254,123,254,120,254,118,254,115,254,113,254,110,254,108,254,105,254,103,254,100,254,98,254,95,254,93,254,90,254,88,254,85,254,82,254,80,254,77,254,75,254,72,254,70,254,67,254,64,254,62,254,59,254,57,254,54,254,51,254,49,254,46,254,44,254,41,254,38,254,36,254,33,254,31,254,28,254,25,254,23,254,20,254,17,254,15,254,12,254,10,254,7,254,4,254,2,254,255,253,252,253,250,253,247,253,245,253,242,253,239,253,237,253,234,253,231,253,229,253,226,253,223,253,221,253,218,253,215,253,213,253,210,253,207,253,205,253,202,253,199,253,197,253,194,253,191,253,189,253,186,253,183,253,181,253,178,253,175,253,173,253,170,253,167,253,165,253,162,253,159,253,157,253,154,253,151,253,149,253,146,253,143,253,141,253,138,253,135,253,133,253,130,253,127,253,125,253,122,253,119,253,117,253,114,253,111,253,109,253,106,253,103,253,101,253,98,253,96,253,93,253,90,253,88,253,85,253,82,253,80,253,77,253,74,253,72,253,69,253,66,253,64,253,61,253,59,253,56,253,53,253,51,253,48,253,45,253,43,253,40,253,38,253,35,253,32,253,30,253,27,253,24,253,22,253,19,253,17,253,14,253,11,253,9,253,6,253,4,253,1,253,255,252,252,252,249,252,247,252,244,252,242,252,239,252,237,252,234,252,231,252,229,252,226,252,224,252,221,252,219,252,216,252,214,252,211,252,209,252,206,252,204,252,201,252,199,252,196,252,194,252,191,252,189,252,186,252,184,252,181,252,179,252,176,252,174,252,171,252,169,252,166,252,164,252,161,252,159,252,157,252,154,252,152,252,149,252,147,252,144,252,142,252,140,252,137,252,135,252,132,252,130,252,128,252,125,252,123,252,121,252,118,252,116,252,113,252,111,252,109,252,106,252,104,252,102,252,100,252,97,252,95,252,93,252,90,252,88,252,86,252,83,252,81,252,79,252,77,252,74,252,72,252,70,252,68,252,66,252,63,252,61,252,59,252,57,252,55,252,52,252,50,252,48,252,46,252,44,252,42,252,39,252,37,252,35,252,33,252,31,252,29,252,27,252,25,252,22,252,20,252,18,252,16,252,14,252,12,252,10,252,8,252,6,252,4,252,2,252,0,252,254,251,252,251,250,251,248,251,246,251,244,251,242,251,240,251,238,251,236,251,234,251,233,251,231,251,229,251,227,251,225,251,223,251,221,251,219,251,218,251,216,251,214,251,212,251,210,251,209,251,207,251,205,251,203,251,201,251,200,251,198,251,196,251,195,251,193,251,191,251,189,251,188,251,186,251,184,251,183,251,181,251,179,251,178,251,176,251,175,251,173,251,171,251,170,251,168,251,167,251,165,251,164,251,162,251,161,251,159,251,158,251,156,251,155,251,153,251,152,251,150,251,149,251,147,251,146,251,145,251,143,251,142,251,140,251,139,251,138,251,136,251,135,251,134,251,132,251,131,251,130,251,129,251,127,251,126,251,125,251,124,251,122,251,121,251,120,251,119,251,118,251,117,251,115,251,114,251,113,251,112,251,111,251,110,251,109,251,108,251,107,251,106,251,105,251,104,251,103,251,102,251,101,251,100,251,99,251,98,251,97,251,96,251,95,251,94,251,93,251,93,251,92,251,91,251,90,251,89,251,88,251,88,251,87,251,86,251,85,251,85,251,84,251,83,251,83,251,82,251,81,251,81,251,80,251,79,251,79,251,78,251,78,251,77,251,76,251,76,251,75,251,75,251,74,251,74,251,73,251,73,251,73,251,72,251,72,251,71,251,71,251,71,251,70,251,70,251,70,251,69,251,69,251,69,251,69,251,68,251,68,251,68,251,68,251,67,251,67,251,67,251,67,251,67,251,67,251,67,251,67,251,66,251,66,251,66,251,66,251,66,251,66,251,66,251,66,251,67,251,67,251,67,251,67,251,67,251,67,251,67,251,67,251,68,251,68,251,68,251,68,251,68,251,69,251,69,251,69,251,70,251,70,251,70,251,71,251,71,251,72,251,72,251,72,251,73,251,73,251,74,251,74,251,75,251,75,251,76,251,76,251,77,251,78,251,78,251,79,251,80,251,80,251,81,251,82,251,82,251,83,251,84,251,85,251,85,251,86,251,87,251,88,251,89,251,90,251,91,251,92,251,93,251,93,251,94,251,95,251,96,251,98,251,99,251,100,251,101,251,102,251,103,251,104,251,105,251,106,251,108,251,109,251,110,251,111,251,113,251,114,251,115,251,117,251,118,251,119,251,121,251,122,251,124,251,125,251,127,251,128,251,130,251,131,251,133,251,134,251,136,251,137,251,139,251,141,251,142,251,144,251,146,251,147,251,149,251,151,251,153,251,155,251,156,251,158,251,160,251,162,251,164,251,166,251,168,251,170,251,172,251,174,251,176,251,178,251,180,251,182,251,184,251,186,251,188,251,191,251,193,251,195,251,197,251,200,251,202,251,204,251,206,251,209,251,211,251,214,251,216,251,218,251,221,251,223,251,226,251,228,251,231,251,233,251,236,251,239,251,241,251,244,251,247,251,249,251,252,251,255,251,2,252,4,252,7,252,10,252,13,252,16,252,19,252,22,252,25,252,27,252,30,252,33,252,37,252,40,252,43,252,46,252,49,252,52,252,55,252,58,252,62,252,65,252,68,252,71,252,75,252,78,252,81,252,85,252,88,252,92,252,95,252,99,252,102,252,106,252,109,252,113,252,116,252,120,252,124,252,127,252,131,252,135,252,138,252,142,252,146,252,150,252,154,252,158,252,161,252,165,252,169,252,173,252,177,252,181,252,185,252,189,252,193,252,198,252,202,252,206,252,210,252,214,252,218,252,223,252,227,252,231,252,236,252,240,252,244,252,249,252,253,252,2,253,6,253,11,253,15,253,20,253,24,253,29,253,34,253,38,253,43,253,48,253,53,253,57,253,62,253,67,253,72,253,77,253,82,253,86,253,91,253,96,253,101,253,106,253,112,253,117,253,122,253,127,253,132,253,137,253,142,253,148,253,153,253,158,253,164,253,169,253,174,253,180,253,185,253,191,253,196,253,202,253,207,253,213,253,218,253,224,253,230,253,235,253,241,253,247,253,253,253,2,254,8,254,14,254,20,254,26,254,32,254,38,254,44,254,50,254,56,254,62,254,68,254,74,254,80,254,87,254,93,254,99,254,105,254,112,254,118,254,124,254,131,254,137,254,144,254,150,254,157,254,163,254,170,254,176,254,183,254,190,254,196,254,203,254,210,254,217,254,223,254,230,254,237,254,244,254,251,254,2,255,9,255,16,255,23,255,30,255,37,255,44,255,51,255,58,255,66,255,73,255,80,255,87,255,95,255,102,255,110,255,117,255,124,255,132,255,139,255,147,255,155,255,162,255,170,255,178,255,185,255,193,255,201,255,209,255,216,255,224,255,232,255,240,255,248,255], "i8", ALLOC_NONE, 5252932);
allocate([0,0,8,0,16,0,24,0,32,0,41,0,49,0,58,0,66,0,75,0,83,0,92,0,100,0,109,0,118,0,127,0,136,0,145,0,154,0,163,0,172,0,182,0,191,0,200,0,210,0,219,0,229,0,238,0,248,0,2,1,12,1,21,1,31,1,41,1,51,1,61,1,71,1,82,1,92,1,102,1,113,1,123,1,133,1,144,1,155,1,165,1,176,1,187,1,197,1,208,1,219,1,230,1,241,1,252,1,8,2,19,2,30,2,41,2,53,2,64,2,76,2,87,2,99,2,110,2,122,2,134,2,146,2,157,2,169,2,181,2,193,2,205,2,217,2,230,2,242,2,254,2,10,3,23,3,35,3,48,3,60,3,73,3,86,3,98,3,111,3,124,3,137,3,149,3,162,3,175,3,188,3,202,3,215,3,228,3,241,3,254,3,12,4,25,4,39,4,52,4,66,4,79,4,93,4,107,4,120,4,134,4,148,4,162,4,176,4,190,4,204,4,218,4,232,4,246,4,4,5,18,5,33,5,47,5,62,5,76,5,90,5,105,5,120,5,134,5,149,5,164,5,178,5,193,5,208,5,223,5,238,5,253,5,12,6,27,6,42,6,57,6,72,6,88,6,103,6,118,6,134,6,149,6,165,6,180,6,196,6,211,6,227,6,243,6,2,7,18,7,34,7,50,7,66,7,82,7,98,7,114,7,130,7,146,7,162,7,178,7,194,7,211,7,227,7,243,7,4,8,20,8,36,8,53,8,69,8,86,8,103,8,119,8,136,8,153,8,170,8,186,8,203,8,220,8,237,8,254,8,15,9,32,9,49,9,66,9,83,9,101,9,118,9,135,9,152,9,170,9,187,9,205,9,222,9,239,9,1,10,19,10,36,10,54,10,71,10,89,10,107,10,125,10,142,10,160,10,178,10,196,10,214,10,232,10,250,10,12,11,30,11,48,11,66,11,85,11,103,11,121,11,139,11,158,11,176,11,194,11,213,11,231,11,250,11,12,12,31,12,49,12,68,12,87,12,105,12,124,12,143,12,161,12,180,12,199,12,218,12,237,12,0,13,19,13,38,13,57,13,76,13,95,13,114,13,133,13,152,13,171,13,190,13,210,13,229,13,248,13,11,14,31,14,50,14,70,14,89,14,109,14,128,14,148,14,167,14,187,14,206,14,226,14,245,14,9,15,29,15,49,15,68,15,88,15,108,15,128,15,148,15,167,15,187,15,207,15,227,15,247,15,11,16,31,16,51,16,71,16,92,16,112,16,132,16,152,16,172,16,192,16,213,16,233,16,253,16,18,17,38,17,58,17,79,17,99,17,119,17,140,17,160,17,181,17,201,17,222,17,243,17,7,18,28,18,48,18,69,18,90,18,110,18,131,18,152,18,172,18,193,18,214,18,235,18,0,19,21,19,41,19,62,19,83,19,104,19,125,19,146,19,167,19,188,19,209,19,230,19,251,19,16,20,37,20,58,20,79,20,101,20,122,20,143,20,164,20,185,20,207,20,228,20,249,20,14,21,36,21,57,21,78,21,100,21,121,21,142,21,164,21,185,21,206,21,228,21,249,21,15,22,36,22,58,22,79,22,101,22,122,22,144,22,165,22,187,22,209,22,230,22,252,22,17,23,39,23,61,23,82,23,104,23,126,23,147,23,169,23,191,23,213,23,234,23,0,24,22,24,44,24,65,24,87,24,109,24,131,24,153,24,174,24,196,24,218,24,240,24,6,25,28,25,50,25,72,25,93,25,115,25,137,25,159,25,181,25,203,25,225,25,247,25,13,26,35,26,57,26,79,26,101,26,123,26,145,26,167,26,189,26,211,26,233,26,255,26,22,27,44,27,66,27,88,27,110,27,132,27,154,27,176,27,198,27,220,27,243,27,9,28,31,28,53,28,75,28,97,28,120,28,142,28,164,28,186,28,208,28,230,28,253,28,19,29,41,29,63,29,85,29,107,29,130,29,152,29,174,29,196,29,219,29,241,29,7,30,29,30,51,30,74,30,96,30,118,30,140,30,162,30,185,30,207,30,229,30,251,30,18,31,40,31,62,31,84,31,106,31,129,31,151,31,173,31,195,31,218,31,240,31,6,32,28,32,50,32,73,32,95,32,117,32,139,32,161,32,184,32,206,32,228,32,250,32,16,33,39,33,61,33,83,33,105,33,127,33,149,33,172,33,194,33,216,33,238,33,4,34,26,34,48,34,71,34,93,34,115,34,137,34,159,34,181,34,203,34,225,34,247,34,14,35,36,35,58,35,80,35,102,35,124,35,146,35,168,35,190,35,212,35,234,35,0,36,22,36,44,36,66,36,88,36,110,36,132,36,154,36,176,36,198,36,220,36,242,36,7,37,29,37,51,37,73,37,95,37,117,37,139,37,161,37,181,37,204,37,226,37,248,37,14,38,35,38,56,38,78,38,101,38,123,38,144,38,165,38,187,38,208,38,231,38,253,38,18,39,39,39,61,39,84,39,104,39,126,39,148,39,168,39,191,39,212,39,233,39,255,39,20,40,43,40,63,40,85,40,106,40,128,40,149,40,170,40,191,40,213,40,234,40,0,41,21,41,42,41,64,41,85,41,106,41,127,41,148,41,170,41,191,41,212,41,232,41,254,41,20,42,40,42,62,42,82,42,104,42,124,42,146,42,166,42,187,42,207,42,230,42,250,42,15,43,35,43,56,43,76,43,99,43,119,43,140,43,160,43,181,43,201,43,223,43,243,43,8,44,28,44,49,44,69,44,90,44,110,44,130,44,151,44,172,44,193,44,213,44,234,44,254,44,18,45,39,45,58,45,79,45,99,45,120,45,140,45,160,45,180,45,200,45,221,45,241,45,4,46,25,46,45,46,63,46,84,46,104,46,124,46,144,46,164,46,184,46,204,46,222,46,243,46,7,47,27,47,47,47,65,47,86,47,105,47,125,47,144,47,163,47,183,47,203,47,222,47,241,47,5,48,24,48,44,48,63,48,82,48,102,48,120,48,139,48,160,48,178,48,197,48,216,48,236,48,254,48,18,49,36,49,55,49,74,49,93,49,111,49,131,49,150,49,168,49,187,49,206,49,224,49,243,49,6,50,23,50,42,50,60,50,79,50,98,50,116,50,134,50,153,50,171,50,189,50,208,50,226,50,244,50,6,51,24,51,42,51,60,51,78,51,96,51,114,51,132,51,149,51,168,51,185,51,202,51,221,51,238,51,0,52,18,52,35,52,53,52,71,52,87,52,105,52,123,52,139,52,157,52,174,52,192,52,209,52,226,52,244,52,4,53,21,53,39,53,55,53,73,53,89,53,105,53,123,53,139,53,156,53,173,53,190,53,207,53,223,53,240,53,255,53,16,54,33,54,49,54,66,54,82,54,99,54,115,54,131,54,147,54,162,54,179,54,195,54,211,54,227,54,243,54,2,55,19,55,35,55,50,55,66,55,81,55,97,55,112,55,128,55,143,55,159,55,174,55,190,55,205,55,221,55,236,55,250,55,10,56,25,56,40,56,55,56,70,56,84,56,99,56,114,56,129,56,144,56,158,56,173,56,187,56,202,56,217,56,231,56,246,56,3,57,18,57,33,57,46,57,61,57,76,57,89,57,104,57,117,57,131,57,145,57,160,57,172,57,186,57,201,57,214,57,227,57,241,57,254,57,12,58,26,58,39,58,52,58,65,58,79,58,92,58,105,58,118,58,131,58,144,58,156,58,169,58,183,58,195,58,208,58,219,58,233,58,246,58,2,59,14,59,27,59,39,59,51,59,63,59,76,59,88,59,101,59,112,59,124,59,136,59,148,59,160,59,172,59,183,59,195,59,206,59,217,59,229,59,241,59,252,59,7,60,19,60,30,60,41,60,52,60,63,60,73,60,86,60,96,60,107,60,118,60,129,60,139,60,149,60,160,60,170,60,180,60,192,60,202,60,212,60,222,60,232,60,242,60,253,60,7,61,17,61,26,61,36,61,46,61,56,61,65,61,75,61,84,61,93,61,103,61,113,61,122,61,131,61,140,61,149,61,158,61,167,61,176,61,185,61,194,61,202,61,211,61,220,61,227,61,237,61,245,61,254,61,5,62,14,62,22,62,31,62,38,62,46,62,54,62,62,62,69,62,77,62,85,62,92,62,101,62,108,62,116,62,123,62,130,62,137,62,143,62,151,62,158,62,166,62,172,62,180,62,186,62,192,62,199,62,205,62,213,62,220,62,225,62,232,62,237,62,244,62,250,62,0,63,5,63,12,63,18,63,23,63,30,63,35,63,41,63,46,63,52,63,57,63,63,63,68,63,73,63,78,63,83,63,88,63,92,63,97,63,102,63,107,63,111,63,116,63,119,63,125,63,129,63,134,63,137,63,141,63,146,63,150,63,154,63,157,63,162,63,165,63,169,63,171,63,176,63,179,63,181,63,186,63,189,63,192,63,194,63,198,63,201,63,203,63,207,63,209,63,212,63,214,63,217,63,219,63,221,63,223,63,226,63,229,63,230,63,232,63,233,63,236,63,238,63,238,63,241,63,242,63,243,63,245,63,246,63,248,63,249,63,249,63,251,63,251,63,252,63,253,63,253,63,253,63,254,63,255,63,0,64,0,64,0,64,0,64], "i8", ALLOC_NONE, 5254980);
allocate([0,64,0,64,0,64,0,64,0,64,255,63,254,63,253,63,253,63,253,63,252,63,251,63,251,63,249,63,249,63,248,63,246,63,245,63,243,63,242,63,241,63,238,63,238,63,236,63,233,63,232,63,230,63,229,63,226,63,223,63,221,63,219,63,217,63,214,63,212,63,209,63,207,63,203,63,201,63,198,63,194,63,192,63,189,63,186,63,181,63,179,63,176,63,171,63,169,63,165,63,162,63,157,63,154,63,150,63,146,63,141,63,137,63,134,63,129,63,125,63,119,63,116,63,111,63,107,63,102,63,97,63,92,63,88,63,83,63,78,63,73,63,68,63,63,63,57,63,52,63,46,63,41,63,35,63,30,63,23,63,18,63,12,63,5,63,0,63,250,62,244,62,237,62,232,62,225,62,220,62,213,62,205,62,199,62,192,62,186,62,180,62,172,62,166,62,158,62,151,62,143,62,137,62,130,62,123,62,116,62,108,62,101,62,92,62,85,62,77,62,69,62,62,62,54,62,46,62,38,62,31,62,22,62,14,62,5,62,254,61,245,61,237,61,227,61,220,61,211,61,202,61,194,61,185,61,176,61,167,61,158,61,149,61,140,61,131,61,122,61,113,61,103,61,93,61,84,61,75,61,65,61,56,61,46,61,36,61,26,61,17,61,7,61,253,60,242,60,232,60,222,60,212,60,202,60,192,60,180,60,170,60,160,60,149,60,139,60,129,60,118,60,107,60,96,60,86,60,73,60,63,60,52,60,41,60,30,60,19,60,7,60,252,59,241,59,229,59,217,59,206,59,195,59,183,59,172,59,160,59,148,59,136,59,124,59,112,59,101,59,88,59,76,59,63,59,51,59,39,59,27,59,14,59,2,59,246,58,233,58,219,58,208,58,195,58,183,58,169,58,156,58,144,58,131,58,118,58,105,58,92,58,79,58,65,58,52,58,39,58,26,58,12,58,254,57,241,57,227,57,214,57,201,57,186,57,172,57,160,57,145,57,131,57,117,57,104,57,89,57,76,57,61,57,46,57,33,57,18,57,3,57,246,56,231,56,217,56,202,56,187,56,173,56,158,56,144,56,129,56,114,56,99,56,84,56,70,56,55,56,40,56,25,56,10,56,250,55,236,55,221,55,205,55,190,55,174,55,159,55,143,55,128,55,112,55,97,55,81,55,66,55,50,55,35,55,19,55,2,55,243,54,227,54,211,54,195,54,179,54,162,54,147,54,131,54,115,54,99,54,82,54,66,54,49,54,33,54,16,54,255,53,240,53,223,53,207,53,190,53,173,53,156,53,139,53,123,53,105,53,89,53,73,53,55,53,39,53,21,53,4,53,244,52,226,52,209,52,192,52,174,52,157,52,139,52,123,52,105,52,87,52,71,52,53,52,35,52,18,52,0,52,238,51,221,51,202,51,185,51,168,51,149,51,132,51,114,51,96,51,78,51,60,51,42,51,24,51,6,51,244,50,226,50,208,50,189,50,171,50,153,50,134,50,116,50,98,50,79,50,60,50,42,50,23,50,6,50,243,49,224,49,206,49,187,49,168,49,150,49,131,49,111,49,93,49,74,49,55,49,36,49,18,49,254,48,236,48,216,48,197,48,178,48,160,48,139,48,120,48,102,48,82,48,63,48,44,48,24,48,5,48,241,47,222,47,203,47,183,47,163,47,144,47,125,47,105,47,86,47,65,47,47,47,27,47,7,47,243,46,222,46,204,46,184,46,164,46,144,46,124,46,104,46,84,46,63,46,45,46,25,46,4,46,241,45,221,45,200,45,180,45,160,45,140,45,120,45,99,45,79,45,58,45,39,45,18,45,254,44,234,44,213,44,193,44,172,44,151,44,130,44,110,44,90,44,69,44,49,44,28,44,8,44,243,43,223,43,201,43,181,43,160,43,140,43,119,43,99,43,76,43,56,43,35,43,15,43,250,42,230,42,207,42,187,42,166,42,146,42,124,42,104,42,82,42,62,42,40,42,20,42,254,41,232,41,212,41,191,41,170,41,148,41,127,41,106,41,85,41,64,41,42,41,21,41,0,41,234,40,213,40,191,40,170,40,149,40,128,40,106,40,85,40,63,40,43,40,20,40,255,39,233,39,212,39,191,39,168,39,148,39,126,39,104,39,84,39,61,39,39,39,18,39,253,38,231,38,208,38,187,38,165,38,144,38,123,38,101,38,78,38,56,38,35,38,14,38,248,37,226,37,204,37,181,37,161,37,139,37,117,37,95,37,73,37,51,37,29,37,7,37,242,36,220,36,198,36,176,36,154,36,132,36,110,36,88,36,66,36,44,36,22,36,0,36,234,35,212,35,190,35,168,35,146,35,124,35,102,35,80,35,58,35,36,35,14,35,247,34,225,34,203,34,181,34,159,34,137,34,115,34,93,34,71,34,48,34,26,34,4,34,238,33,216,33,194,33,172,33,149,33,127,33,105,33,83,33,61,33,39,33,16,33,250,32,228,32,206,32,184,32,161,32,139,32,117,32,95,32,73,32,50,32,28,32,6,32,240,31,218,31,195,31,173,31,151,31,129,31,106,31,84,31,62,31,40,31,18,31,251,30,229,30,207,30,185,30,162,30,140,30,118,30,96,30,74,30,51,30,29,30,7,30,241,29,219,29,196,29,174,29,152,29,130,29,107,29,85,29,63,29,41,29,19,29,253,28,230,28,208,28,186,28,164,28,142,28,120,28,97,28,75,28,53,28,31,28,9,28,243,27,220,27,198,27,176,27,154,27,132,27,110,27,88,27,66,27,44,27,22,27,255,26,233,26,211,26,189,26,167,26,145,26,123,26,101,26,79,26,57,26,35,26,13,26,247,25,225,25,203,25,181,25,159,25,137,25,115,25,93,25,72,25,50,25,28,25,6,25,240,24,218,24,196,24,174,24,153,24,131,24,109,24,87,24,65,24,44,24,22,24,0,24,234,23,213,23,191,23,169,23,147,23,126,23,104,23,82,23,61,23,39,23,17,23,252,22,230,22,209,22,187,22,165,22,144,22,122,22,101,22,79,22,58,22,36,22,15,22,249,21,228,21,206,21,185,21,164,21,142,21,121,21,100,21,78,21,57,21,36,21,14,21,249,20,228,20,207,20,185,20,164,20,143,20,122,20,101,20,79,20,58,20,37,20,16,20,251,19,230,19,209,19,188,19,167,19,146,19,125,19,104,19,83,19,62,19,41,19,21,19,0,19,235,18,214,18,193,18,172,18,152,18,131,18,110,18,90,18,69,18,48,18,28,18,7,18,243,17,222,17,201,17,181,17,160,17,140,17,119,17,99,17,79,17,58,17,38,17,18,17,253,16,233,16,213,16,192,16,172,16,152,16,132,16,112,16,92,16,71,16,51,16,31,16,11,16,247,15,227,15,207,15,187,15,167,15,148,15,128,15,108,15,88,15,68,15,49,15,29,15,9,15,245,14,226,14,206,14,187,14,167,14,148,14,128,14,109,14,89,14,70,14,50,14,31,14,11,14,248,13,229,13,210,13,190,13,171,13,152,13,133,13,114,13,95,13,76,13,57,13,38,13,19,13,0,13,237,12,218,12,199,12,180,12,161,12,143,12,124,12,105,12,87,12,68,12,49,12,31,12,12,12,250,11,231,11,213,11,194,11,176,11,158,11,139,11,121,11,103,11,85,11,66,11,48,11,30,11,12,11,250,10,232,10,214,10,196,10,178,10,160,10,142,10,125,10,107,10,89,10,71,10,54,10,36,10,19,10,1,10,239,9,222,9,205,9,187,9,170,9,152,9,135,9,118,9,101,9,83,9,66,9,49,9,32,9,15,9,254,8,237,8,220,8,203,8,186,8,170,8,153,8,136,8,119,8,103,8,86,8,69,8,53,8,36,8,20,8,4,8,243,7,227,7,211,7,194,7,178,7,162,7,146,7,130,7,114,7,98,7,82,7,66,7,50,7,34,7,18,7,2,7,243,6,227,6,211,6,196,6,180,6,165,6,149,6,134,6,118,6,103,6,88,6,72,6,57,6,42,6,27,6,12,6,253,5,238,5,223,5,208,5,193,5,178,5,164,5,149,5,134,5,120,5,105,5,90,5,76,5,62,5,47,5,33,5,18,5,4,5,246,4,232,4,218,4,204,4,190,4,176,4,162,4,148,4,134,4,120,4,107,4,93,4,79,4,66,4,52,4,39,4,25,4,12,4,254,3,241,3,228,3,215,3,202,3,188,3,175,3,162,3,149,3,137,3,124,3,111,3,98,3,86,3,73,3,60,3,48,3,35,3,23,3,10,3,254,2,242,2,230,2,217,2,205,2,193,2,181,2,169,2,157,2,146,2,134,2,122,2,110,2,99,2,87,2,76,2,64,2,53,2,41,2,30,2,19,2,8,2,252,1,241,1,230,1,219,1,208,1,197,1,187,1,176,1,165,1,155,1,144,1,133,1,123,1,113,1,102,1,92,1,82,1,71,1,61,1,51,1,41,1,31,1,21,1,12,1,2,1,248,0,238,0,229,0,219,0,210,0,200,0,191,0,182,0,172,0,163,0,154,0,145,0,136,0,127,0,118,0,109,0,100,0,92,0,83,0,75,0,66,0,58,0,49,0,41,0,32,0,24,0,16,0,8,0], "i8", ALLOC_NONE, 5257028);
allocate([0,0,248,255,240,255,232,255,224,255,216,255,209,255,201,255,193,255,185,255,178,255,170,255,162,255,155,255,147,255,139,255,132,255,124,255,117,255,110,255,102,255,95,255,87,255,80,255,73,255,66,255,58,255,51,255,44,255,37,255,30,255,23,255,16,255,9,255,2,255,251,254,244,254,237,254,230,254,223,254,217,254,210,254,203,254,196,254,190,254,183,254,176,254,170,254,163,254,157,254,150,254,144,254,137,254,131,254,124,254,118,254,112,254,105,254,99,254,93,254,87,254,80,254,74,254,68,254,62,254,56,254,50,254,44,254,38,254,32,254,26,254,20,254,14,254,8,254,2,254,253,253,247,253,241,253,235,253,230,253,224,253,218,253,213,253,207,253,202,253,196,253,191,253,185,253,180,253,174,253,169,253,164,253,158,253,153,253,148,253,142,253,137,253,132,253,127,253,122,253,117,253,112,253,106,253,101,253,96,253,91,253,86,253,82,253,77,253,72,253,67,253,62,253,57,253,53,253,48,253,43,253,38,253,34,253,29,253,24,253,20,253,15,253,11,253,6,253,2,253,253,252,249,252,244,252,240,252,236,252,231,252,227,252,223,252,218,252,214,252,210,252,206,252,202,252,198,252,193,252,189,252,185,252,181,252,177,252,173,252,169,252,165,252,161,252,158,252,154,252,150,252,146,252,142,252,138,252,135,252,131,252,127,252,124,252,120,252,116,252,113,252,109,252,106,252,102,252,99,252,95,252,92,252,88,252,85,252,81,252,78,252,75,252,71,252,68,252,65,252,62,252,58,252,55,252,52,252,49,252,46,252,43,252,40,252,37,252,33,252,30,252,27,252,25,252,22,252,19,252,16,252,13,252,10,252,7,252,4,252,2,252,255,251,252,251,249,251,247,251,244,251,241,251,239,251,236,251,233,251,231,251,228,251,226,251,223,251,221,251,218,251,216,251,214,251,211,251,209,251,206,251,204,251,202,251,200,251,197,251,195,251,193,251,191,251,188,251,186,251,184,251,182,251,180,251,178,251,176,251,174,251,172,251,170,251,168,251,166,251,164,251,162,251,160,251,158,251,156,251,155,251,153,251,151,251,149,251,147,251,146,251,144,251,142,251,141,251,139,251,137,251,136,251,134,251,133,251,131,251,130,251,128,251,127,251,125,251,124,251,122,251,121,251,119,251,118,251,117,251,115,251,114,251,113,251,111,251,110,251,109,251,108,251,106,251,105,251,104,251,103,251,102,251,101,251,100,251,99,251,98,251,96,251,95,251,94,251,93,251,93,251,92,251,91,251,90,251,89,251,88,251,87,251,86,251,85,251,85,251,84,251,83,251,82,251,82,251,81,251,80,251,80,251,79,251,78,251,78,251,77,251,76,251,76,251,75,251,75,251,74,251,74,251,73,251,73,251,72,251,72,251,72,251,71,251,71,251,70,251,70,251,70,251,69,251,69,251,69,251,68,251,68,251,68,251,68,251,68,251,67,251,67,251,67,251,67,251,67,251,67,251,67,251,67,251,66,251,66,251,66,251,66,251,66,251,66,251,66,251,66,251,67,251,67,251,67,251,67,251,67,251,67,251,67,251,67,251,68,251,68,251,68,251,68,251,69,251,69,251,69,251,69,251,70,251,70,251,70,251,71,251,71,251,71,251,72,251,72,251,73,251,73,251,73,251,74,251,74,251,75,251,75,251,76,251,76,251,77,251,78,251,78,251,79,251,79,251,80,251,81,251,81,251,82,251,83,251,83,251,84,251,85,251,85,251,86,251,87,251,88,251,88,251,89,251,90,251,91,251,92,251,93,251,93,251,94,251,95,251,96,251,97,251,98,251,99,251,100,251,101,251,102,251,103,251,104,251,105,251,106,251,107,251,108,251,109,251,110,251,111,251,112,251,113,251,114,251,115,251,117,251,118,251,119,251,120,251,121,251,122,251,124,251,125,251,126,251,127,251,129,251,130,251,131,251,132,251,134,251,135,251,136,251,138,251,139,251,140,251,142,251,143,251,145,251,146,251,147,251,149,251,150,251,152,251,153,251,155,251,156,251,158,251,159,251,161,251,162,251,164,251,165,251,167,251,168,251,170,251,171,251,173,251,175,251,176,251,178,251,179,251,181,251,183,251,184,251,186,251,188,251,189,251,191,251,193,251,195,251,196,251,198,251,200,251,201,251,203,251,205,251,207,251,209,251,210,251,212,251,214,251,216,251,218,251,219,251,221,251,223,251,225,251,227,251,229,251,231,251,233,251,234,251,236,251,238,251,240,251,242,251,244,251,246,251,248,251,250,251,252,251,254,251,0,252,2,252,4,252,6,252,8,252,10,252,12,252,14,252,16,252,18,252,20,252,22,252,25,252,27,252,29,252,31,252,33,252,35,252,37,252,39,252,42,252,44,252,46,252,48,252,50,252,52,252,55,252,57,252,59,252,61,252,63,252,66,252,68,252,70,252,72,252,74,252,77,252,79,252,81,252,83,252,86,252,88,252,90,252,93,252,95,252,97,252,100,252,102,252,104,252,106,252,109,252,111,252,113,252,116,252,118,252,121,252,123,252,125,252,128,252,130,252,132,252,135,252,137,252,140,252,142,252,144,252,147,252,149,252,152,252,154,252,157,252,159,252,161,252,164,252,166,252,169,252,171,252,174,252,176,252,179,252,181,252,184,252,186,252,189,252,191,252,194,252,196,252,199,252,201,252,204,252,206,252,209,252,211,252,214,252,216,252,219,252,221,252,224,252,226,252,229,252,231,252,234,252,237,252,239,252,242,252,244,252,247,252,249,252,252,252,255,252,1,253,4,253,6,253,9,253,11,253,14,253,17,253,19,253,22,253,24,253,27,253,30,253,32,253,35,253,38,253,40,253,43,253,45,253,48,253,51,253,53,253,56,253,59,253,61,253,64,253,66,253,69,253,72,253,74,253,77,253,80,253,82,253,85,253,88,253,90,253,93,253,96,253,98,253,101,253,103,253,106,253,109,253,111,253,114,253,117,253,119,253,122,253,125,253,127,253,130,253,133,253,135,253,138,253,141,253,143,253,146,253,149,253,151,253,154,253,157,253,159,253,162,253,165,253,167,253,170,253,173,253,175,253,178,253,181,253,183,253,186,253,189,253,191,253,194,253,197,253,199,253,202,253,205,253,207,253,210,253,213,253,215,253,218,253,221,253,223,253,226,253,229,253,231,253,234,253,237,253,239,253,242,253,245,253,247,253,250,253,252,253,255,253,2,254,4,254,7,254,10,254,12,254,15,254,17,254,20,254,23,254,25,254,28,254,31,254,33,254,36,254,38,254,41,254,44,254,46,254,49,254,51,254,54,254,57,254,59,254,62,254,64,254,67,254,70,254,72,254,75,254,77,254,80,254,82,254,85,254,88,254,90,254,93,254,95,254,98,254,100,254,103,254,105,254,108,254,110,254,113,254,115,254,118,254,120,254,123,254,125,254,128,254,130,254,133,254,135,254,138,254,140,254,143,254,145,254,148,254,150,254,153,254,155,254,158,254,160,254,163,254,165,254,167,254,170,254,172,254,175,254,177,254,180,254,182,254,184,254,187,254,189,254,192,254,194,254,196,254,199,254,201,254,203,254,206,254,208,254,210,254,213,254,215,254,217,254,220,254,222,254,224,254,227,254,229,254,231,254,234,254,236,254,238,254,240,254,243,254,245,254,247,254,249,254,252,254,254,254,0,255,2,255,5,255,7,255,9,255,11,255,13,255,16,255,18,255,20,255,22,255,24,255,26,255,28,255,31,255,33,255,35,255,37,255,39,255,41,255,43,255,45,255,47,255,49,255,51,255,54,255,56,255,58,255,60,255,62,255,64,255,66,255,68,255,70,255,72,255,74,255,76,255,78,255,80,255,81,255,83,255,85,255,87,255,89,255,91,255,93,255,95,255,97,255,99,255,100,255,102,255,104,255,106,255,108,255,110,255,111,255,113,255,115,255,117,255,119,255,120,255,122,255,124,255,126,255,127,255,129,255,131,255,132,255,134,255,136,255,137,255,139,255,141,255,142,255,144,255,146,255,147,255,149,255,150,255,152,255,154,255,155,255,157,255,158,255,160,255,161,255,163,255,164,255,166,255,167,255,169,255,170,255,172,255,173,255,174,255,176,255,177,255,179,255,180,255,181,255,183,255,184,255,186,255,187,255,188,255,189,255,191,255,192,255,193,255,195,255,196,255,197,255,198,255,199,255,201,255,202,255,203,255,204,255,205,255,207,255,208,255,209,255,210,255,211,255,212,255,213,255,214,255,215,255,216,255,217,255,218,255,219,255,220,255,221,255,222,255,223,255,224,255,225,255,226,255,227,255,228,255,229,255,230,255,230,255,231,255,232,255,233,255,234,255,234,255,235,255,236,255,237,255,237,255,238,255,239,255,240,255,240,255,241,255,242,255,242,255,243,255,243,255,244,255,245,255,245,255,246,255,246,255,247,255,247,255,248,255,248,255,249,255,249,255,250,255,250,255,250,255,251,255,251,255,252,255,252,255,252,255,253,255,253,255,253,255,254,255,254,255,254,255,254,255,254,255,255,255,255,255,255,255,255,255,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5259076);
allocate([0,0,0,0,456,0,0,0,310,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5261124);
allocate([0,0,0,0,358,0,0,0,646,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5261136);
allocate([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,3,0,0,0,3,0,0,0,3,0,0,0,3,0,0,0,3,0,0,0,3,0,0,0,3,0,0,0,3,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,4,0,0,0,5,0,0,0,5,0,0,0,5,0,0,0,5,0,0,0,5,0,0,0,5,0,0,0,5,0,0,0,5,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,7,0,0,0,7,0,0,0,7,0,0,0,7,0,0,0,8,0,0,0,8,0,0,0,8,0,0,0,8,0,0,0,9,0,0,0,9,0,0,0,9,0,0,0,9,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,10,0,0,0,11,0,0,0,11,0,0,0,11,0,0,0,11,0,0,0,12,0,0,0,12,0,0,0,12,0,0,0,12,0,0,0,13,0,0,0,13,0,0,0,13,0,0,0,13,0,0,0,14,0,0,0,14,0,0,0,14,0,0,0,14,0,0,0,15,0,0,0,15,0,0,0,16,0,0,0,16,0,0,0,17,0,0,0,17,0,0,0,18,0,0,0,18,0,0,0,19,0,0,0,19,0,0,0,20,0,0,0,20,0,0,0,21,0,0,0,21,0,0,0,22,0,0,0,22,0,0,0,23,0,0,0,23,0,0,0,24,0,0,0,24,0,0,0,25,0,0,0,25,0,0,0,26,0,0,0,26,0,0,0,27,0,0,0,27,0,0,0,28,0,0,0,28,0,0,0,29,0,0,0,29,0,0,0,30,0,0,0,30,0,0,0,31,0,0,0,32,0,0,0,33,0,0,0,34,0,0,0,35,0,0,0,36,0,0,0,37,0,0,0,38,0,0,0,39,0,0,0,40,0,0,0,41,0,0,0,42,0,0,0,43,0,0,0,44,0,0,0,45,0,0,0,46,0,0,0,47,0,0,0,48,0,0,0,49,0,0,0,50,0,0,0,51,0,0,0,52,0,0,0,53,0,0,0,54,0,0,0,55,0,0,0,56,0,0,0,57,0,0,0,58,0,0,0,59,0,0,0,60,0,0,0,61,0,0,0,62,0,0,0,64,0,0,0,65,0,0,0,67,0,0,0,69,0,0,0,71,0,0,0,73,0,0,0,75,0,0,0,77,0,0,0,79,0,0,0,81,0,0,0,83,0,0,0,85,0,0,0,87,0,0,0,89,0,0,0,91,0,0,0,93,0,0,0,96,0,0,0,98,0,0,0,100,0,0,0,102,0,0,0,104,0,0,0,106,0,0,0,108,0,0,0,110,0,0,0,112,0,0,0,114,0,0,0,116,0,0,0,118,0,0,0,120,0,0,0,122,0,0,0,124,0,0,0,126,0,0,0,129,0,0,0,131,0,0,0,135,0,0,0,139,0,0,0,143,0,0,0,147,0,0,0,151,0,0,0,155,0,0,0,160,0,0,0,164,0,0,0,168,0,0,0,172,0,0,0,176,0,0,0,180,0,0,0,184,0,0,0,188,0,0,0,193,0,0,0,197,0,0,0,201,0,0,0,205,0,0,0,209,0,0,0,213,0,0,0,217,0,0,0,221,0,0,0,226,0,0,0,230,0,0,0,234,0,0,0,238,0,0,0,242,0,0,0,246,0,0,0,250,0,0,0,255,0,0,0,255,0,0,0], "i8", ALLOC_NONE, 5261148);
allocate([0,0,0,0,54,0,0,0,594,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5262176);
allocate([0,0,0,0,414,0,0,0,162,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5262188);
allocate([0,0,0,0,630,0,0,0,448,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5262200);
allocate([0,25,49,71,90,106,117,125,127,125,117,106,90,71,49,25,0,231,207,185,166,150,139,131,129,131,139,150,166,185,207,231,128,136,144,152,160,168,176,184,192,200,208,216,224,232,240,248,0,8,16,24,32,40,48,56,64,72,80,88,96,104,112,120,128,128,128,128,128,128,128,128,128,128,128,128,128,128,128,128,127,127,127,127,127,127,127,127,127,127,127,127,127,127,127,127], "i8", ALLOC_NONE, 5262212);
allocate([0,0,0,0,74,0,0,0,64,0,0,0], ["*",0,0,0,"*",0,0,0,"*",0,0,0], ALLOC_NONE, 5262308);
allocate([78,111,118,111,116,114,97,100,101,32,80,97,99,107,101,114,0] /* Novotrade Packer\00 */, "i8", ALLOC_NONE, 5262320);
allocate([78,111,105,115,101,82,117,110,110,101,114,0] /* NoiseRunner\00 */, "i8", ALLOC_NONE, 5262340);
allocate([77,111,100,117,108,101,32,80,114,111,116,101,99,116,111,114,0] /* Module Protector\00 */, "i8", ALLOC_NONE, 5262352);
allocate([75,101,102,114,101,110,115,32,83,111,117,110,100,32,77,97,99,104,105,110,101,0] /* Kefrens Sound Machin */, "i8", ALLOC_NONE, 5262372);
allocate([67,104,105,112,84,114,97,99,107,101,114,0] /* ChipTracker\00 */, "i8", ALLOC_NONE, 5262396);
allocate([72,111,114,110,101,116,32,80,97,99,107,101,114,0] /* Hornet Packer\00 */, "i8", ALLOC_NONE, 5262408);
allocate([72,101,97,116,115,101,101,107,101,114,32,49,46,48,0] /* Heatseeker 1.0\00 */, "i8", ALLOC_NONE, 5262424);
allocate([71,97,109,101,32,77,117,115,105,99,32,67,114,101,97,116,111,114,0] /* Game Music Creator\0 */, "i8", ALLOC_NONE, 5262440);
allocate([70,117,122,122,97,99,32,80,97,99,107,101,114,0] /* Fuzzac Packer\00 */, "i8", ALLOC_NONE, 5262460);
allocate([70,117,99,104,115,32,84,114,97,99,107,101,114,0] /* Fuchs Tracker\00 */, "i8", ALLOC_NONE, 5262476);
allocate([70,67,45,77,32,80,97,99,107,101,114,0] /* FC-M Packer\00 */, "i8", ALLOC_NONE, 5262492);
allocate([69,117,114,101,107,97,32,80,97,99,107,101,114,0] /* Eureka Packer\00 */, "i8", ALLOC_NONE, 5262504);
allocate([68,105,103,105,116,97,108,32,73,108,108,117,115,105,111,110,115,0] /* Digital Illusions\00 */, "i8", ALLOC_NONE, 5262520);
allocate([65,67,49,68,32,80,97,99,107,101,114,0] /* AC1D Packer\00 */, "i8", ALLOC_NONE, 5262540);
allocate([37,115,32,83,51,77,0] /* %s S3M\00 */, "i8", ALLOC_NONE, 5262552);
allocate([79,75,84,65,83,79,78,71,0] /* OKTASONG\00 */, "i8", ALLOC_NONE, 5262560);
allocate([67,68,54,49,0] /* CD61\00 */, "i8", ALLOC_NONE, 5262572);
allocate([73,83,0] /* IS\00 */, "i8", ALLOC_NONE, 5262580);
allocate([112,37,100,32,114,37,100,32,99,37,100,58,32,117,110,107,110,111,119,110,32,101,102,102,101,99,116,32,37,48,50,120,32,37,48,50,120,10,0] /* p%d r%d c%d: unknown */, "i8", ALLOC_NONE, 5262584);
allocate([98,91,48,93,32,61,61,32,39,76,39,32,38,38,32,98,91,49,93,32,61,61,32,39,68,39,32,38,38,32,98,91,50,93,32,61,61,32,39,83,39,32,38,38,32,98,91,51,93,32,61,61,32,39,83,39,0] /* b[0] == 'L' && b[1]  */, "i8", ALLOC_NONE, 5262624);
allocate([79,112,101,110,77,80,84,32,49,46,49,55,43,0] /* OpenMPT 1.17+\00 */, "i8", ALLOC_NONE, 5262684);
allocate([83,84,49,46,51,32,77,111,100,117,108,101,73,78,70,79,0] /* ST1.3 ModuleINFO\00 */, "i8", ALLOC_NONE, 5262700);
allocate([65,114,99,104,105,109,101,100,101,115,32,84,114,97,99,107,101,114,0] /* Archimedes Tracker\0 */, "i8", ALLOC_NONE, 5262720);
allocate([69,120,116,101,110,100,101,100,32,77,111,100,117,108,101,58,32,0] /* Extended Module: \00 */, "i8", ALLOC_NONE, 5262740);
allocate([117,110,107,110,111,119,110,32,40,37,48,52,120,41,0] /* unknown (%04x)\00 */, "i8", ALLOC_NONE, 5262760);
allocate([83,66,79,68,0] /* SBOD\00 */, "i8", ALLOC_NONE, 5262776);
allocate([56,67,72,78,0] /* 8CHN\00 */, "i8", ALLOC_NONE, 5262784);
allocate([114,101,97,100,95,108,122,119,95,100,121,110,97,109,105,99,0] /* read_lzw_dynamic\00 */, "i8", ALLOC_NONE, 5262792);
allocate([80,65,0] /* PA\00 */, "i8", ALLOC_NONE, 5262812);
allocate([112,37,100,32,114,37,100,32,99,37,100,58,32,99,111,109,112,114,101,115,115,101,100,32,101,118,101,110,116,32,37,48,50,120,32,37,48,50,120,10,0] /* p%d r%d c%d: compres */, "i8", ALLOC_NONE, 5262816);
allocate([101,118,101,110,116,45,62,118,111,108,32,60,61,32,54,53,0] /* event-_vol _= 65\00 */, "i8", ALLOC_NONE, 5262860);
allocate([68,83,77,73,32,65,100,118,97,110,99,101,100,32,77,111,100,117,108,101,32,70,111,114,109,97,116,32,40,65,77,70,41,0] /* DSMI Advanced Module */, "i8", ALLOC_NONE, 5262880);
allocate([83,116,97,114,116,114,101,107,107,101,114,32,49,46,50,0] /* Startrekker 1.2\00 */, "i8", ALLOC_NONE, 5262916);
allocate([105,98,117,102,32,33,61,32,78,85,76,76,0] /* ibuf != NULL\00 */, "i8", ALLOC_NONE, 5262932);
allocate([80,78,85,77,0] /* PNUM\00 */, "i8", ALLOC_NONE, 5262948);
allocate([65,109,117,115,105,99,32,65,100,108,105,98,32,84,114,97,99,107,101,114,32,40,65,77,68,41,0] /* Amusic Adlib Tracker */, "i8", ALLOC_NONE, 5262956);
allocate([37,115,32,88,77,32,37,100,46,37,48,50,100,0] /* %s XM %d.%02d\00 */, "i8", ALLOC_NONE, 5262984);
allocate([79,112,101,110,77,80,84,32,37,100,46,37,48,50,120,0] /* OpenMPT %d.%02x\00 */, "i8", ALLOC_NONE, 5263000);
allocate([80,66,79,68,0] /* PBOD\00 */, "i8", ALLOC_NONE, 5263016);
allocate([70,97,115,116,32,84,114,97,99,107,101,114,0] /* Fast Tracker\00 */, "i8", ALLOC_NONE, 5263024);
allocate([73,73,0] /* II\00 */, "i8", ALLOC_NONE, 5263040);
allocate([69,112,105,99,32,77,101,103,97,71,97,109,101,115,32,77,65,83,73,32,80,83,77,0] /* Epic MegaGames MASI  */, "i8", ALLOC_NONE, 5263044);
allocate([101,118,101,110,116,45,62,105,110,115,32,60,61,32,49,48,48,0] /* event-_ins _= 100\00 */, "i8", ALLOC_NONE, 5263068);
allocate([67,104,105,98,105,32,84,114,97,99,107,101,114,0] /* Chibi Tracker\00 */, "i8", ALLOC_NONE, 5263088);
allocate([83,84,49,46,50,32,77,111,100,117,108,101,73,78,70,79,0] /* ST1.2 ModuleINFO\00 */, "i8", ALLOC_NONE, 5263104);
allocate([68,105,103,105,116,97,108,32,84,114,97,99,107,101,114,32,68,84,77,0] /* Digital Tracker DTM\ */, "i8", ALLOC_NONE, 5263124);
allocate([115,98,117,102,32,33,61,32,78,85,76,76,0] /* sbuf != NULL\00 */, "i8", ALLOC_NONE, 5263144);
allocate([68,105,103,105,66,111,111,115,116,101,114,32,80,114,111,32,37,100,46,37,48,50,120,32,68,66,77,48,0] /* DigiBooster Pro %d.% */, "i8", ALLOC_NONE, 5263160);
allocate([77,76,69,78,0] /* MLEN\00 */, "i8", ALLOC_NONE, 5263192);
allocate([65,108,101,121,32,75,101,112,116,114,32,40,65,76,77,41,0] /* Aley Keptr (ALM)\00 */, "i8", ALLOC_NONE, 5263200);
allocate([65,76,69,89,32,77,79,0] /* ALEY MO\00 */, "i8", ALLOC_NONE, 5263220);
allocate([69,120,116,101,110,100,101,100,32,77,111,100,117,108,101,58,0] /* Extended Module:\00 */, "i8", ALLOC_NONE, 5263228);
allocate([111,108,100,32,77,111,100,80,108,117,103,32,84,114,97,99,107,101,114,0] /* old ModPlug Tracker\ */, "i8", ALLOC_NONE, 5263248);
allocate([77,65,83,95,85,84,114,97,99,107,95,86,48,48,48,0] /* MAS_UTrack_V000\00 */, "i8", ALLOC_NONE, 5263268);
allocate([47,116,109,112,0] /* /tmp\00 */, "i8", ALLOC_NONE, 5263284);
allocate([114,98,0] /* rb\00 */, "i8", ALLOC_NONE, 5263292);
allocate([83,99,104,105,115,109,32,84,114,97,99,107,101,114,32,37,100,46,37,48,50,120,0] /* Schism Tracker %d.%0 */, "i8", ALLOC_NONE, 5263296);
allocate([80,65,84,84,0] /* PATT\00 */, "i8", ALLOC_NONE, 5263320);
allocate([70,97,115,116,32,84,114,97,99,107,101,114,32,73,73,32,40,88,77,41,0] /* Fast Tracker II (XM) */, "i8", ALLOC_NONE, 5263328);
allocate([54,67,72,78,0] /* 6CHN\00 */, "i8", ALLOC_NONE, 5263352);
allocate([69,112,105,99,32,71,97,109,101,115,32,85,77,88,0] /* Epic Games UMX\00 */, "i8", ALLOC_NONE, 5263360);
allocate([108,105,98,120,109,112,58,32,99,97,110,39,116,32,111,112,101,110,32,115,97,109,112,108,101,32,102,105,108,101,32,37,115,10,0] /* libxmp: can't open s */, "i8", ALLOC_NONE, 5263376);
allocate([70,69,0] /* FE\00 */, "i8", ALLOC_NONE, 5263412);
allocate([83,105,110,97,114,105,97,32,80,83,77,0] /* Sinaria PSM\00 */, "i8", ALLOC_NONE, 5263416);
allocate([101,118,101,110,116,45,62,110,111,116,101,32,60,61,32,49,49,57,32,124,124,32,101,118,101,110,116,45,62,110,111,116,101,32,61,61,32,88,77,80,95,75,69,89,95,79,70,70,0] /* event-_note _= 119 | */, "i8", ALLOC_NONE, 5263428);
allocate([85,108,116,114,97,32,84,114,97,99,107,101,114,32,40,85,76,84,41,0] /* Ultra Tracker (ULT)\ */, "i8", ALLOC_NONE, 5263480);
allocate([67,111,109,112,111,115,101,114,32,54,54,57,0] /* Composer 669\00 */, "i8", ALLOC_NONE, 5263500);
allocate([67,72,66,73,0] /* CHBI\00 */, "i8", ALLOC_NONE, 5263516);
allocate([84,67,66,32,84,114,97,99,107,101,114,0] /* TCB Tracker\00 */, "i8", ALLOC_NONE, 5263524);
allocate([71,97,108,97,120,121,32,77,117,115,105,99,32,83,121,115,116,101,109,32,53,46,48,0] /* Galaxy Music System  */, "i8", ALLOC_NONE, 5263536);
allocate([68,105,103,105,116,97,108,32,83,121,109,112,104,111,110,121,0] /* Digital Symphony\00 */, "i8", ALLOC_NONE, 5263560);
allocate([83,116,97,114,116,114,101,107,107,101,114,0] /* Startrekker\00 */, "i8", ALLOC_NONE, 5263580);
allocate([68,65,73,84,0] /* DAIT\00 */, "i8", ALLOC_NONE, 5263592);
allocate([115,114,99,47,108,111,97,100,101,114,115,47,100,109,102,95,108,111,97,100,46,99,0] /* src/loaders/dmf_load */, "i8", ALLOC_NONE, 5263600);
allocate([86,69,78,86,0] /* VENV\00 */, "i8", ALLOC_NONE, 5263624);
allocate([83,84,77,73,75,32,48,46,50,32,40,83,84,88,41,0] /* STMIK 0.2 (STX)\00 */, "i8", ALLOC_NONE, 5263632);
allocate([83,99,114,101,97,109,32,84,114,97,99,107,101,114,32,50,32,40,83,84,77,41,0] /* Scream Tracker 2 (ST */, "i8", ALLOC_NONE, 5263648);
allocate([83,108,97,109,116,105,108,116,0] /* Slamtilt\00 */, "i8", ALLOC_NONE, 5263672);
allocate([90,88,32,83,112,101,99,116,114,117,109,32,83,111,117,110,100,32,84,114,97,99,107,101,114,32,40,83,84,67,41,0] /* ZX Spectrum Sound Tr */, "i8", ALLOC_NONE, 5263684);
allocate([65,78,65,77,0] /* ANAM\00 */, "i8", ALLOC_NONE, 5263716);
allocate([110,111,109,97,114,99,104,58,32,111,117,116,32,111,102,32,109,101,109,111,114,121,33,10,0] /* nomarch: out of memo */, "i8", ALLOC_NONE, 5263724);
allocate([83,111,117,110,100,116,114,97,99,107,101,114,32,40,77,79,68,41,0] /* Soundtracker (MOD)\0 */, "i8", ALLOC_NONE, 5263752);
allocate([83,111,117,110,100,115,109,105,116,104,47,77,101,103,97,84,114,97,99,107,101,114,32,40,77,84,80,41,0] /* Soundsmith/MegaTrack */, "i8", ALLOC_NONE, 5263772);
allocate([83,111,117,110,100,70,88,0] /* SoundFX\00 */, "i8", ALLOC_NONE, 5263804);
allocate([65,68,80,67,77,0] /* ADPCM\00 */, "i8", ALLOC_NONE, 5263812);
allocate([70,97,115,116,84,114,97,99,107,101,114,32,118,32,50,46,48,48,0] /* FastTracker v 2.00\0 */, "i8", ALLOC_NONE, 5263820);
allocate([85,108,116,114,97,32,84,114,97,99,107,101,114,32,37,115,32,85,76,84,32,86,37,48,52,100,0] /* Ultra Tracker %s ULT */, "i8", ALLOC_NONE, 5263840);
allocate([83,67,82,77,0] /* SCRM\00 */, "i8", ALLOC_NONE, 5263868);
allocate([37,115,0] /* %s\00 */, "i8", ALLOC_NONE, 5263876);
allocate([73,109,112,117,108,115,101,32,84,114,97,99,107,101,114,32,37,100,46,37,48,50,120,0] /* Impulse Tracker %d.% */, "i8", ALLOC_NONE, 5263880);
allocate([82,84,83,77,0] /* RTSM\00 */, "i8", ALLOC_NONE, 5263904);
allocate([83,99,114,101,97,109,32,84,114,97,99,107,101,114,32,51,32,40,83,51,77,41,0] /* Scream Tracker 3 (S3 */, "i8", ALLOC_NONE, 5263912);
allocate([80,76,69,78,0] /* PLEN\00 */, "i8", ALLOC_NONE, 5263936);
allocate([82,101,97,108,32,84,114,97,99,107,101,114,32,40,82,84,77,41,0] /* Real Tracker (RTM)\0 */, "i8", ALLOC_NONE, 5263944);
allocate([78,46,84,46,0] /* N.T.\00 */, "i8", ALLOC_NONE, 5263964);
allocate([82,101,97,108,105,116,121,32,65,100,108,105,98,32,84,114,97,99,107,101,114,32,40,82,65,68,41,0] /* Reality Adlib Tracke */, "i8", ALLOC_NONE, 5263972);
allocate([77,77,68,49,0] /* MMD1\00 */, "i8", ALLOC_NONE, 5264000);
allocate([80,69,0] /* PE\00 */, "i8", ALLOC_NONE, 5264008);
allocate([112,114,111,119,105,122,97,114,100,0] /* prowizard\00 */, "i8", ALLOC_NONE, 5264012);
allocate([101,118,101,110,116,45,62,102,120,116,32,60,61,32,50,54,0] /* event-_fxt _= 26\00 */, "i8", ALLOC_NONE, 5264024);
allocate([80,111,108,121,32,84,114,97,99,107,101,114,32,40,80,84,77,41,0] /* Poly Tracker (PTM)\0 */, "i8", ALLOC_NONE, 5264044);
allocate([117,110,107,110,111,119,110,32,101,102,102,101,99,116,32,37,48,50,120,32,37,48,50,120,10,0] /* unknown effect %02x  */, "i8", ALLOC_NONE, 5264064);
allocate([80,114,111,116,114,97,99,107,101,114,32,51,0] /* Protracker 3\00 */, "i8", ALLOC_NONE, 5264092);
allocate([37,115,37,115,46,97,115,0] /* %s%s.as\00 */, "i8", ALLOC_NONE, 5264108);
allocate([68,65,80,84,0] /* DAPT\00 */, "i8", ALLOC_NONE, 5264116);
allocate([80,114,111,116,114,97,99,107,101,114,32,83,116,117,100,105,111,32,40,80,83,77,41,0] /* Protracker Studio (P */, "i8", ALLOC_NONE, 5264124);
allocate([83,77,80,68,0] /* SMPD\00 */, "i8", ALLOC_NONE, 5264148);
allocate([83,77,80,76,0] /* SMPL\00 */, "i8", ALLOC_NONE, 5264156);
allocate([90,101,110,32,80,97,99,107,101,114,0] /* Zen Packer\00 */, "i8", ALLOC_NONE, 5264164);
allocate([88,65,78,78,32,80,97,99,107,101,114,0] /* XANN Packer\00 */, "i8", ALLOC_NONE, 5264176);
allocate([87,97,110,116,111,110,32,80,97,99,107,101,114,0] /* Wanton Packer\00 */, "i8", ALLOC_NONE, 5264188);
allocate([85,110,105,99,32,84,114,97,99,107,101,114,32,50,0] /* Unic Tracker 2\00 */, "i8", ALLOC_NONE, 5264204);
allocate([85,78,73,67,32,84,114,97,99,107,101,114,0] /* UNIC Tracker\00 */, "i8", ALLOC_NONE, 5264220);
allocate([77,78,65,77,0] /* MNAM\00 */, "i8", ALLOC_NONE, 5264236);
allocate([84,114,97,99,107,101,114,32,80,97,99,107,101,114,32,118,51,0] /* Tracker Packer v3\00 */, "i8", ALLOC_NONE, 5264244);
allocate([84,105,116,97,110,105,99,115,32,80,108,97,121,101,114,0] /* Titanics Player\00 */, "i8", ALLOC_NONE, 5264264);
allocate([84,104,101,32,68,97,114,107,32,68,101,109,111,110,0] /* The Dark Demon\00 */, "i8", ALLOC_NONE, 5264280);
allocate([83,116,97,114,116,114,101,107,107,101,114,32,80,97,99,107,101,114,0] /* Startrekker Packer\0 */, "i8", ALLOC_NONE, 5264296);
allocate([83,75,89,84,32,80,97,99,107,101,114,0] /* SKYT Packer\00 */, "i8", ALLOC_NONE, 5264316);
allocate([37,115,46,37,100,0] /* %s.%d\00 */, "i8", ALLOC_NONE, 5264328);
allocate([80,114,111,114,117,110,110,101,114,32,50,46,48,0] /* Prorunner 2.0\00 */, "i8", ALLOC_NONE, 5264336);
allocate([80,114,111,114,117,110,110,101,114,32,49,46,48,0] /* Prorunner 1.0\00 */, "i8", ALLOC_NONE, 5264352);
allocate([77,69,68,50,88,77,32,98,121,32,74,46,80,121,110,110,111,110,101,0] /* MED2XM by J.Pynnone\ */, "i8", ALLOC_NONE, 5264368);
allocate([49,46,54,0] /* 1.6\00 */, "i8", ALLOC_NONE, 5264388);
allocate([80,111,108,108,121,32,84,114,97,99,107,101,114,0] /* Polly Tracker\00 */, "i8", ALLOC_NONE, 5264392);
allocate([33,83,99,114,101,97,109,33,0] /* !Scream!\00 */, "i8", ALLOC_NONE, 5264408);
allocate([73,73,103,115,32,77,101,103,97,84,114,97,99,107,101,114,0] /* IIgs MegaTracker\00 */, "i8", ALLOC_NONE, 5264420);
allocate([73,109,112,117,108,115,101,32,84,114,97,99,107,101,114,32,50,46,49,52,118,53,0] /* Impulse Tracker 2.14 */, "i8", ALLOC_NONE, 5264440);
allocate([82,84,73,78,0] /* RTIN\00 */, "i8", ALLOC_NONE, 5264464);
allocate([80,84,68,84,0] /* PTDT\00 */, "i8", ALLOC_NONE, 5264472);
allocate([83,76,69,78,0] /* SLEN\00 */, "i8", ALLOC_NONE, 5264480);
allocate([79,107,116,97,108,121,122,101,114,0] /* Oktalyzer\00 */, "i8", ALLOC_NONE, 5264488);
allocate([76,105,113,117,105,100,32,84,114,97,99,107,101,114,32,78,79,32,40,76,73,81,41,0] /* Liquid Tracker NO (L */, "i8", ALLOC_NONE, 5264500);
allocate([78,111,105,115,101,116,114,97,99,107,101,114,0] /* Noisetracker\00 */, "i8", ALLOC_NONE, 5264524);
allocate([77,77,68,51,0] /* MMD3\00 */, "i8", ALLOC_NONE, 5264540);
allocate([77,77,68,48,0] /* MMD0\00 */, "i8", ALLOC_NONE, 5264548);
allocate([108,105,98,120,109,112,58,32,109,105,115,115,105,110,103,32,102,105,108,101,32,37,115,10,0] /* libxmp: missing file */, "i8", ALLOC_NONE, 5264556);
allocate([116,111,0] /* to\00 */, "i8", ALLOC_NONE, 5264584);
allocate([77,117,108,116,105,116,114,97,99,107,101,114,32,40,77,84,77,41,0] /* Multitracker (MTM)\0 */, "i8", ALLOC_NONE, 5264588);
allocate([86,69,0] /* VE\00 */, "i8", ALLOC_NONE, 5264608);
allocate([68,83,77,80,0] /* DSMP\00 */, "i8", ALLOC_NONE, 5264612);
allocate([102,116,101,108,108,32,40,102,41,32,45,32,99,111,117,110,116,32,61,61,32,108,112,46,115,105,122,101,0] /* ftell (f) - count == */, "i8", ALLOC_NONE, 5264620);
allocate([40,99,32,38,32,48,120,49,102,41,32,60,32,109,111,100,45,62,99,104,110,0] /* (c & 0x1f) _ mod-_ch */, "i8", ALLOC_NONE, 5264652);
allocate([73,78,83,84,0] /* INST\00 */, "i8", ALLOC_NONE, 5264676);
allocate([37,115,37,115,46,65,83,0] /* %s%s.AS\00 */, "i8", ALLOC_NONE, 5264684);
allocate([81,117,97,100,114,97,32,67,111,109,112,111,115,101,114,32,69,77,79,68,32,118,37,100,0] /* Quadra Composer EMOD */, "i8", ALLOC_NONE, 5264692);
allocate([83,77,80,73,0] /* SMPI\00 */, "i8", ALLOC_NONE, 5264720);
allocate([83,84,69,82,0] /* STER\00 */, "i8", ALLOC_NONE, 5264728);
allocate([79,99,116,97,77,69,68,32,40,77,69,68,41,0] /* OctaMED (MED)\00 */, "i8", ALLOC_NONE, 5264736);
allocate([82,111,82,0] /* RoR\00 */, "i8", ALLOC_NONE, 5264752);
allocate([37,115,37,115,0] /* %s%s\00 */, "i8", ALLOC_NONE, 5264756);
allocate([77,69,68,32,50,46,49,48,47,79,99,116,97,77,69,68,32,40,77,69,68,41,0] /* MED 2.10/OctaMED (ME */, "i8", ALLOC_NONE, 5264764);
allocate([37,115,32,40,37,115,41,0] /* %s (%s)\00 */, "i8", ALLOC_NONE, 5264788);
allocate([65,108,101,121,39,115,32,77,111,100,117,108,101,0] /* Aley's Module\00 */, "i8", ALLOC_NONE, 5264796);
allocate([77,101,103,97,116,114,97,99,107,101,114,32,40,77,71,84,41,0] /* Megatracker (MGT)\00 */, "i8", ALLOC_NONE, 5264812);
allocate([68,105,103,105,116,114,97,107,107,101,114,0] /* Digitrakker\00 */, "i8", ALLOC_NONE, 5264832);
allocate([117,110,107,110,111,119,110,47,99,111,110,118,101,114,116,101,100,0] /* unknown/converted\00 */, "i8", ALLOC_NONE, 5264844);
allocate([49,46,53,0] /* 1.5\00 */, "i8", ALLOC_NONE, 5264864);
allocate([77,97,103,110,101,116,105,99,32,70,105,101,108,100,115,32,80,97,99,107,101,114,0] /* Magnetic Fields Pack */, "i8", ALLOC_NONE, 5264868);
allocate([65,78,32,67,79,79,76,33,0] /* AN COOL!\00 */, "i8", ALLOC_NONE, 5264892);
allocate([83,84,77,50,83,84,88,32,49,46,37,100,0] /* STM2STX 1.%d\00 */, "i8", ALLOC_NONE, 5264904);
allocate([83,99,114,101,97,109,32,84,114,97,99,107,101,114,32,37,100,46,37,48,50,100,32,83,84,77,0] /* Scream Tracker %d.%0 */, "i8", ALLOC_NONE, 5264920);
allocate([68,46,79,46,67,32,83,111,117,110,100,116,114,97,99,107,101,114,32,50,46,48,0] /* D.O.C Soundtracker 2 */, "i8", ALLOC_NONE, 5264948);
allocate([73,65,78,57,50,97,0] /* IAN92a\00 */, "i8", ALLOC_NONE, 5264972);
allocate([77,69,68,32,50,46,49,48,32,77,69,68,52,32,40,77,69,68,41,0] /* MED 2.10 MED4 (MED)\ */, "i8", ALLOC_NONE, 5264980);
allocate([73,109,112,117,108,115,101,32,84,114,97,99,107,101,114,32,50,46,49,52,118,51,0] /* Impulse Tracker 2.14 */, "i8", ALLOC_NONE, 5265000);
allocate([82,84,78,68,0] /* RTND\00 */, "i8", ALLOC_NONE, 5265024);
allocate([99,111,110,118,101,114,116,101,100,32,49,53,32,105,110,115,116,114,117,109,101,110,116,0] /* converted 15 instrum */, "i8", ALLOC_NONE, 5265032);
allocate([77,46,75,46,0] /* M.K.\00 */, "i8", ALLOC_NONE, 5265056);
allocate([67,77,78,84,0] /* CMNT\00 */, "i8", ALLOC_NONE, 5265064);
allocate([77,69,68,32,50,46,48,48,32,77,69,68,51,32,40,77,69,68,41,0] /* MED 2.00 MED3 (MED)\ */, "i8", ALLOC_NONE, 5265072);
allocate([83,80,69,69,0] /* SPEE\00 */, "i8", ALLOC_NONE, 5265092);
allocate([70,97,115,116,84,114,97,99,107,101,114,32,49,46,48,49,63,0] /* FastTracker 1.01?\00 */, "i8", ALLOC_NONE, 5265100);
allocate([77,69,68,32,49,46,49,50,32,77,69,68,50,32,40,77,69,68,41,0] /* MED 1.12 MED2 (MED)\ */, "i8", ALLOC_NONE, 5265120);
allocate([77,38,75,33,0] /* M&K!\00 */, "i8", ALLOC_NONE, 5265140);
allocate([77,77,68,50,0] /* MMD2\00 */, "i8", ALLOC_NONE, 5265148);
allocate([79,99,116,97,77,69,68,32,52,46,48,48,32,77,77,68,49,0] /* OctaMED 4.00 MMD1\00 */, "i8", ALLOC_NONE, 5265156);
allocate([46,115,101,116,0] /* .set\00 */, "i8", ALLOC_NONE, 5265176);
allocate([99,111,110,118,0] /* conv\00 */, "i8", ALLOC_NONE, 5265184);
allocate([83,65,0] /* SA\00 */, "i8", ALLOC_NONE, 5265192);
allocate([83,79,78,71,0] /* SONG\00 */, "i8", ALLOC_NONE, 5265196);
allocate([68,105,103,105,116,114,97,107,107,101,114,32,40,77,68,76,41,0] /* Digitrakker (MDL)\00 */, "i8", ALLOC_NONE, 5265204);
allocate([112,109,97,103,32,61,61,32,48,120,52,99,53,48,48,48,48,48,0] /* pmag == 0x4c500000\0 */, "i8", ALLOC_NONE, 5265224);
allocate([77,111,100,80,108,117,103,32,84,114,97,99,107,101,114,32,49,46,49,54,0] /* ModPlug Tracker 1.16 */, "i8", ALLOC_NONE, 5265244);
allocate([80,114,111,98,97,98,108,121,32,99,111,110,118,101,114,116,101,100,0] /* Probably converted\0 */, "i8", ALLOC_NONE, 5265268);
allocate([115,114,99,47,108,111,97,100,101,114,115,47,103,100,109,95,108,111,97,100,46,99,0] /* src/loaders/gdm_load */, "i8", ALLOC_NONE, 5265288);
allocate([70,117,110,107,116,114,97,99,107,101,114,32,68,79,83,51,50,0] /* Funktracker DOS32\00 */, "i8", ALLOC_NONE, 5265312);
allocate([37,115,37,115,46,110,116,0] /* %s%s.nt\00 */, "i8", ALLOC_NONE, 5265332);
allocate([69,112,105,99,32,77,101,103,97,71,97,109,101,115,32,77,65,83,73,32,40,80,83,77,41,0] /* Epic MegaGames MASI  */, "i8", ALLOC_NONE, 5265340);
allocate([56,83,77,80,0] /* 8SMP\00 */, "i8", ALLOC_NONE, 5265368);
allocate([80,114,111,116,114,97,99,107,101,114,32,99,108,111,110,101,0] /* Protracker clone\00 */, "i8", ALLOC_NONE, 5265376);
allocate([115,116,100,58,58,98,97,100,95,97,108,108,111,99,0] /* std::bad_alloc\00 */, "i8", ALLOC_NONE, 5265396);
allocate([70,97,105,108,32,51,32,111,110,32,109,32,61,32,37,100,0] /* Fail 3 on m = %d\00 */, "i8", ALLOC_NONE, 5265412);
allocate([83,99,114,101,97,109,32,84,114,97,99,107,101,114,32,51,32,77,79,68,0] /* Scream Tracker 3 MOD */, "i8", ALLOC_NONE, 5265432);
allocate([76,105,113,117,105,100,32,84,114,97,99,107,101,114,32,40,76,73,81,41,0] /* Liquid Tracker (LIQ) */, "i8", ALLOC_NONE, 5265456);
allocate([77,86,79,88,0] /* MVOX\00 */, "i8", ALLOC_NONE, 5265480);
allocate([83,111,117,110,100,116,114,97,99,107,101,114,0] /* Soundtracker\00 */, "i8", ALLOC_NONE, 5265488);
allocate([60,111,0] /* _o\00 */, "i8", ALLOC_NONE, 5265504);
allocate([77,111,100,39,115,32,71,114,97,118,101,0] /* Mod's Grave\00 */, "i8", ALLOC_NONE, 5265508);
allocate([73,109,112,117,108,115,101,32,84,114,97,99,107,101,114,32,40,73,84,41,0] /* Impulse Tracker (IT) */, "i8", ALLOC_NONE, 5265520);
allocate([73,109,97,103,101,115,32,77,117,115,105,99,32,83,121,115,116,101,109,32,40,73,77,83,41,0] /* Images Music System  */, "i8", ALLOC_NONE, 5265544);
allocate([85,78,73,83,32,54,54,57,0] /* UNIS 669\00 */, "i8", ALLOC_NONE, 5265572);
allocate([117,110,107,110,111,119,110,32,116,114,97,99,107,101,114,0] /* unknown tracker\00 */, "i8", ALLOC_NONE, 5265584);
allocate([70,108,101,120,116,114,97,120,0] /* Flextrax\00 */, "i8", ALLOC_NONE, 5265600);
allocate([73,109,97,103,111,32,79,114,112,104,101,117,115,32,40,73,77,70,41,0] /* Imago Orpheus (IMF)\ */, "i8", ALLOC_NONE, 5265612);
allocate([49,46,52,0] /* 1.4\00 */, "i8", ALLOC_NONE, 5265632);
allocate([65,78,32,67,79,79,76,46,0] /* AN COOL.\00 */, "i8", ALLOC_NONE, 5265636);
allocate([66,77,79,68,50,83,84,77,32,83,84,88,0] /* BMOD2STM STX\00 */, "i8", ALLOC_NONE, 5265648);
allocate([66,77,79,68,50,83,84,77,32,83,84,77,0] /* BMOD2STM STM\00 */, "i8", ALLOC_NONE, 5265664);
allocate([83,111,117,110,100,116,114,97,99,107,101,114,32,73,88,0] /* Soundtracker IX\00 */, "i8", ALLOC_NONE, 5265680);
allocate([73,73,103,115,32,83,111,117,110,100,83,109,105,116,104,0] /* IIgs SoundSmith\00 */, "i8", ALLOC_NONE, 5265696);
allocate([83,111,117,110,100,70,88,32,50,46,48,0] /* SoundFX 2.0\00 */, "i8", ALLOC_NONE, 5265712);
allocate([73,109,97,103,111,32,79,114,112,104,101,117,115,32,37,100,46,37,48,50,120,0] /* Imago Orpheus %d.%02 */, "i8", ALLOC_NONE, 5265724);
allocate([37,115,32,82,84,77,32,37,120,46,37,48,50,120,0] /* %s RTM %x.%02x\00 */, "i8", ALLOC_NONE, 5265748);
allocate([82,65,68,32,98,121,32,82,69,65,76,105,84,89,33,33,0] /* RAD by REALiTY!!\00 */, "i8", ALLOC_NONE, 5265764);
allocate([70,76,69,88,0] /* FLEX\00 */, "i8", ALLOC_NONE, 5265784);
allocate([119,43,98,0] /* w+b\00 */, "i8", ALLOC_NONE, 5265792);
allocate([73,78,70,79,0] /* INFO\00 */, "i8", ALLOC_NONE, 5265796);
allocate([85,78,73,67,32,84,114,97,99,107,101,114,32,105,100,48,0] /* UNIC Tracker id0\00 */, "i8", ALLOC_NONE, 5265804);
allocate([82,73,70,70,0] /* RIFF\00 */, "i8", ALLOC_NONE, 5265824);
allocate([67,111,117,108,100,110,39,116,32,97,108,108,111,99,97,116,101,32,109,101,109,111,114,121,0] /* Couldn't allocate me */, "i8", ALLOC_NONE, 5265832);
allocate([83,65,77,80,0] /* SAMP\00 */, "i8", ALLOC_NONE, 5265860);
allocate([84,97,107,101,84,114,97,99,107,101,114,47,70,97,115,116,84,114,97,99,107,101,114,32,73,73,0] /* TakeTracker/FastTrac */, "i8", ALLOC_NONE, 5265868);
allocate([83,111,117,110,100,116,114,97,99,107,101,114,32,50,46,54,47,73,99,101,32,84,114,97,99,107,101,114,32,40,77,84,78,41,0] /* Soundtracker 2.6/Ice */, "i8", ALLOC_NONE, 5265896);
allocate([77,84,77,0] /* MTM\00 */, "i8", ALLOC_NONE, 5265932);
allocate([72,83,67,45,84,114,97,99,107,101,114,0] /* HSC-Tracker\00 */, "i8", ALLOC_NONE, 5265936);
allocate([77,33,75,33,0] /* M!K!\00 */, "i8", ALLOC_NONE, 5265948);
allocate([79,99,116,97,77,69,68,32,83,111,117,110,100,115,116,117,100,105,111,32,77,77,68,37,99,0] /* OctaMED Soundstudio  */, "i8", ALLOC_NONE, 5265956);
allocate([77,69,68,32,50,46,49,48,32,77,77,68,48,0] /* MED 2.10 MMD0\00 */, "i8", ALLOC_NONE, 5265984);
allocate([77,69,68,32,37,100,46,37,48,50,100,32,77,69,68,52,0] /* MED %d.%02d MED4\00 */, "i8", ALLOC_NONE, 5266000);
allocate([71,114,97,111,117,109,102,32,84,114,97,99,107,101,114,32,40,71,84,75,41,0] /* Graoumf Tracker (GTK */, "i8", ALLOC_NONE, 5266020);
allocate([115,114,99,47,108,111,97,100,101,114,115,47,109,101,100,51,95,108,111,97,100,46,99,0] /* src/loaders/med3_loa */, "i8", ALLOC_NONE, 5266044);
allocate([37,115,47,37,115,0] /* %s/%s\00 */, "i8", ALLOC_NONE, 5266068);
allocate([67,72,78,0] /* CHN\00 */, "i8", ALLOC_NONE, 5266076);
allocate([84,82,0] /* TR\00 */, "i8", ALLOC_NONE, 5266080);
allocate([83,68,70,84,0] /* SDFT\00 */, "i8", ALLOC_NONE, 5266084);
allocate([115,114,99,47,108,111,97,100,101,114,115,47,108,105,113,95,108,111,97,100,46,99,0] /* src/loaders/liq_load */, "i8", ALLOC_NONE, 5266092);
allocate([79,112,101,110,83,80,67,32,99,111,110,118,101,114,115,105,111,110,0] /* OpenSPC conversion\0 */, "i8", ALLOC_NONE, 5266116);
allocate([71,101,110,101,114,105,99,32,68,105,103,105,116,97,108,32,77,117,115,105,99,32,40,71,68,77,41,0] /* Generic Digital Musi */, "i8", ALLOC_NONE, 5266136);
allocate([83,111,117,110,100,116,114,97,99,107,101,114,32,50,46,54,32,77,84,78,0] /* Soundtracker 2.6 MTN */, "i8", ALLOC_NONE, 5266164);
allocate([67,72,0] /* CH\00 */, "i8", ALLOC_NONE, 5266188);
allocate([71,84,75,0] /* GTK\00 */, "i8", ALLOC_NONE, 5266192);
allocate([71,68,77,32,37,100,46,37,48,50,100,32,40,117,110,107,110,111,119,110,32,116,114,97,99,107,101,114,32,37,100,46,37,48,50,100,41,0] /* GDM %d.%02d (unknown */, "i8", ALLOC_NONE, 5266196);
allocate([79,82,68,82,0] /* ORDR\00 */, "i8", ALLOC_NONE, 5266236);
allocate([70,117,110,107,116,114,97,99,107,101,114,0] /* Funktracker\00 */, "i8", ALLOC_NONE, 5266244);
allocate([83,46,81,46,0] /* S.Q.\00 */, "i8", ALLOC_NONE, 5266256);
allocate([80,114,111,116,114,97,99,107,101,114,32,40,77,79,68,41,0] /* Protracker (MOD)\00 */, "i8", ALLOC_NONE, 5266264);
allocate([83,69,81,85,0] /* SEQU\00 */, "i8", ALLOC_NONE, 5266284);
allocate([68,73,71,73,32,66,111,111,115,116,101,114,32,109,111,100,117,108,101,0] /* DIGI Booster module\ */, "i8", ALLOC_NONE, 5266292);
allocate([71,97,108,97,120,121,32,77,117,115,105,99,32,83,121,115,116,101,109,32,53,46,48,32,40,74,50,66,41,0] /* Galaxy Music System  */, "i8", ALLOC_NONE, 5266312);
allocate([65,83,89,76,85,77,32,77,117,115,105,99,32,70,111,114,109,97,116,32,86,49,46,48,0,0,0,0,0,0,0,0,0] /* ASYLUM Music Format  */, "i8", ALLOC_NONE, 5266344);
allocate([70,97,105,108,32,50,32,111,110,32,109,32,61,32,37,100,0] /* Fail 2 on m = %d\00 */, "i8", ALLOC_NONE, 5266380);
allocate([71,97,108,97,120,121,32,77,117,115,105,99,32,83,121,115,116,101,109,32,52,46,48,0] /* Galaxy Music System  */, "i8", ALLOC_NONE, 5266400);
allocate([77,111,100,117,108,101,32,80,114,111,116,101,99,116,111,114,32,110,111,73,68,0] /* Module Protector noI */, "i8", ALLOC_NONE, 5266424);
allocate([70,117,110,107,116,114,97,99,107,101,114,32,40,70,78,75,41,0] /* Funktracker (FNK)\00 */, "i8", ALLOC_NONE, 5266448);
allocate([117,110,107,110,111,119,110,0] /* unknown\00 */, "i8", ALLOC_NONE, 5266468);
allocate([84,73,78,70,0] /* TINF\00 */, "i8", ALLOC_NONE, 5266476);
allocate([68,83,77,73,32,37,100,46,37,100,32,65,77,70,0] /* DSMI %d.%d AMF\00 */, "i8", ALLOC_NONE, 5266484);
allocate([78,83,77,83,0] /* NSMS\00 */, "i8", ALLOC_NONE, 5266500);
allocate([65,109,117,115,105,99,0] /* Amusic\00 */, "i8", ALLOC_NONE, 5266508);
allocate([83,116,97,114,116,114,101,107,107,101,114,32,40,77,79,68,41,0] /* Startrekker (MOD)\00 */, "i8", ALLOC_NONE, 5266516);
allocate([70,65,48,56,0] /* FA08\00 */, "i8", ALLOC_NONE, 5266536);
allocate([37,115,32,73,84,32,37,100,46,37,48,50,120,0] /* %s IT %d.%02x\00 */, "i8", ALLOC_NONE, 5266544);
allocate([70,97,114,97,110,100,111,108,101,32,67,111,109,112,111,115,101,114,32,40,70,65,82,41,0] /* Farandole Composer ( */, "i8", ALLOC_NONE, 5266560);
allocate([65,76,69,89,77,79,68,0] /* ALEYMOD\00 */, "i8", ALLOC_NONE, 5266588);
allocate([84,77,80,68,73,82,0] /* TMPDIR\00 */, "i8", ALLOC_NONE, 5266596);
allocate([105,102,0] /* if\00 */, "i8", ALLOC_NONE, 5266604);
allocate([37,45,50,48,46,50,48,115,0] /* %-20.20s\00 */, "i8", ALLOC_NONE, 5266608);
allocate([70,65,48,54,0] /* FA06\00 */, "i8", ALLOC_NONE, 5266620);
allocate([60,32,49,46,52,0] /* _ 1.4\00 */, "i8", ALLOC_NONE, 5266628);
allocate([81,117,97,100,114,97,32,67,111,109,112,111,115,101,114,32,40,69,77,79,68,41,0] /* Quadra Composer (EMO */, "i8", ALLOC_NONE, 5266636);
allocate([32,40,99,111,109,112,97,116,46,41,0] /*  (compat.)\00 */, "i8", ALLOC_NONE, 5266660);
allocate([45,45,45,62,32,37,48,50,120,10,0] /* ---_ %02x\0A\00 */, "i8", ALLOC_NONE, 5266672);
allocate([108,105,98,120,109,112,58,32,117,110,115,117,112,112,111,114,116,101,100,32,115,97,109,112,108,101,32,116,121,112,101,10,0] /* libxmp: unsupported  */, "i8", ALLOC_NONE, 5266684);
allocate([69,88,79,0] /* EXO\00 */, "i8", ALLOC_NONE, 5266720);
allocate([66,77,79,68,50,83,84,77,0] /* BMOD2STM\00 */, "i8", ALLOC_NONE, 5266724);
allocate(1, "i8", ALLOC_NONE, 5266736);
allocate([90,88,32,83,112,101,99,116,114,117,109,32,83,111,117,110,100,32,84,114,97,99,107,101,114,0] /* ZX Spectrum Sound Tr */, "i8", ALLOC_NONE, 5266740);
allocate([68,101,115,107,116,111,112,32,84,114,97,99,107,101,114,32,40,68,84,84,41,0] /* Desktop Tracker (DTT */, "i8", ALLOC_NONE, 5266768);
allocate([85,108,116,105,109,97,116,101,32,83,111,117,110,100,116,114,97,99,107,101,114,0] /* Ultimate Soundtracke */, "i8", ALLOC_NONE, 5266792);
allocate([83,79,78,71,79,75,0] /* SONGOK\00 */, "i8", ALLOC_NONE, 5266816);
allocate([83,111,117,110,100,70,88,32,49,46,51,0] /* SoundFX 1.3\00 */, "i8", ALLOC_NONE, 5266824);
allocate([108,105,98,120,109,112,58,32,115,104,111,114,116,32,114,101,97,100,32,40,37,100,41,32,105,110,32,115,97,109,112,108,101,32,108,111,97,100,10,0] /* libxmp: short read ( */, "i8", ALLOC_NONE, 5266836);
allocate([83,99,114,101,97,109,32,84,114,97,99,107,101,114,32,37,100,46,37,48,50,120,0] /* Scream Tracker %d.%0 */, "i8", ALLOC_NONE, 5266876);
allocate([82,84,77,77,0] /* RTMM\00 */, "i8", ALLOC_NONE, 5266900);
allocate([82,65,68,32,37,100,46,37,100,0] /* RAD %d.%d\00 */, "i8", ALLOC_NONE, 5266908);
allocate([68,105,103,105,116,97,108,32,84,114,97,99,107,101,114,0] /* Digital Tracker\00 */, "i8", ALLOC_NONE, 5266920);
allocate([120,109,112,95,88,88,88,88,88,88,0] /* xmp_XXXXXX\00 */, "i8", ALLOC_NONE, 5266936);
allocate([80,111,108,121,32,84,114,97,99,107,101,114,32,80,84,77,32,37,100,46,37,48,50,120,0] /* Poly Tracker PTM %d. */, "i8", ALLOC_NONE, 5266948);
allocate([79,77,80,84,0] /* OMPT\00 */, "i8", ALLOC_NONE, 5266976);
allocate([37,45,54,46,54,115,32,73,70,70,77,79,68,76,0] /* %-6.6s IFFMODL\00 */, "i8", ALLOC_NONE, 5266984);
allocate([70,76,84,0] /* FLT\00 */, "i8", ALLOC_NONE, 5267000);
allocate([80,114,111,116,114,97,99,107,101,114,32,83,116,117,100,105,111,32,80,83,77,32,37,100,46,37,48,50,100,0] /* Protracker Studio PS */, "i8", ALLOC_NONE, 5267004);
allocate([85,78,73,67,32,84,114,97,99,107,101,114,32,110,111,105,100,0] /* UNIC Tracker noid\00 */, "i8", ALLOC_NONE, 5267036);
allocate([67,80,76,88,95,84,80,51,0] /* CPLX_TP3\00 */, "i8", ALLOC_NONE, 5267056);
allocate([68,105,103,105,116,97,108,32,84,114,97,99,107,101,114,32,40,68,84,77,41,0] /* Digital Tracker (DTM */, "i8", ALLOC_NONE, 5267068);
allocate([67,77,79,68,0] /* CMOD\00 */, "i8", ALLOC_NONE, 5267092);
allocate([76,105,113,117,105,100,32,84,114,97,99,107,101,114,0] /* Liquid Tracker\00 */, "i8", ALLOC_NONE, 5267100);
allocate([70,65,48,52,0] /* FA04\00 */, "i8", ALLOC_NONE, 5267116);
allocate([77,117,108,116,105,84,114,97,99,107,101,114,32,37,100,46,37,48,50,100,32,77,84,77,0] /* MultiTracker %d.%02d */, "i8", ALLOC_NONE, 5267124);
allocate([65,77,0] /* AM\00 */, "i8", ALLOC_NONE, 5267152);
allocate([80,114,111,116,114,97,99,107,101,114,0] /* Protracker\00 */, "i8", ALLOC_NONE, 5267156);
allocate([79,99,116,97,77,69,68,32,118,53,32,77,77,68,50,0] /* OctaMED v5 MMD2\00 */, "i8", ALLOC_NONE, 5267168);
allocate([79,99,116,97,77,69,68,32,50,46,48,48,32,77,77,68,48,0] /* OctaMED 2.00 MMD0\00 */, "i8", ALLOC_NONE, 5267184);
allocate([77,101,103,97,116,114,97,99,107,101,114,32,77,71,84,32,118,37,100,46,37,100,0] /* Megatracker MGT v%d. */, "i8", ALLOC_NONE, 5267204);
allocate([108,105,98,120,109,112,58,32,105,110,118,97,108,105,100,32,102,105,108,101,110,97,109,101,32,37,115,10,0] /* libxmp: invalid file */, "i8", ALLOC_NONE, 5267228);
allocate([77,69,68,86,0,0,0,4,0] /* MEDV\00\00\00\04\00 */, "i8", ALLOC_NONE, 5267260);
allocate([77,69,68,32,50,46,48,48,32,77,69,68,51,0] /* MED 2.00 MED3\00 */, "i8", ALLOC_NONE, 5267272);
allocate([77,69,68,32,49,46,49,50,32,77,69,68,50,0] /* MED 1.12 MED2\00 */, "i8", ALLOC_NONE, 5267288);
allocate([84,97,107,101,84,114,97,99,107,101,114,0] /* TakeTracker\00 */, "i8", ALLOC_NONE, 5267304);
allocate([88,45,84,114,97,99,107,101,114,32,40,68,77,70,41,0] /* X-Tracker (DMF)\00 */, "i8", ALLOC_NONE, 5267316);
allocate([73,78,0] /* IN\00 */, "i8", ALLOC_NONE, 5267332);
allocate([83,99,104,105,115,109,32,84,114,97,99,107,101,114,32,48,46,37,120,0] /* Schism Tracker 0.%x\ */, "i8", ALLOC_NONE, 5267336);
allocate([84,73,84,76,0] /* TITL\00 */, "i8", ALLOC_NONE, 5267356);
allocate([37,115,32,40,37,52,46,52,115,41,0] /* %s (%4.4s)\00 */, "i8", ALLOC_NONE, 5267364);
allocate([37,115,32,76,73,81,32,37,100,46,37,48,50,100,0] /* %s LIQ %d.%02d\00 */, "i8", ALLOC_NONE, 5267376);
allocate([68,73,71,73,32,66,111,111,115,116,101,114,0] /* DIGI Booster\00 */, "i8", ALLOC_NONE, 5267392);
allocate([117,110,109,111,51,0] /* unmo3\00 */, "i8", ALLOC_NONE, 5267408);
allocate([73,109,97,103,101,115,32,77,117,115,105,99,32,83,121,115,116,101,109,0] /* Images Music System\ */, "i8", ALLOC_NONE, 5267416);
allocate([73,109,97,103,111,32,79,114,112,104,101,117,115,32,49,46,48,32,73,77,70,0] /* Imago Orpheus 1.0 IM */, "i8", ALLOC_NONE, 5267436);
allocate([73,99,101,32,84,114,97,99,107,101,114,32,73,84,49,48,0] /* Ice Tracker IT10\00 */, "i8", ALLOC_NONE, 5267460);
allocate([84,68,90,52,0] /* TDZ4\00 */, "i8", ALLOC_NONE, 5267480);
allocate([71,114,97,111,117,109,102,32,84,114,97,99,107,101,114,32,71,84,75,32,118,37,100,0] /* Graoumf Tracker GTK  */, "i8", ALLOC_NONE, 5267488);
allocate([76,105,113,117,105,100,32,77,111,100,117,108,101,58,0] /* Liquid Module:\00 */, "i8", ALLOC_NONE, 5267512);
allocate([71,68,77,32,37,100,46,37,48,50,100,32,40,50,71,68,77,32,37,100,46,37,48,50,100,41,0] /* GDM %d.%02d (2GDM %d */, "i8", ALLOC_NONE, 5267528);
allocate([83,99,104,105,115,109,32,84,114,97,99,107,101,114,32,37,48,52,100,45,37,48,50,100,45,37,48,50,100,0] /* Schism Tracker %04d- */, "i8", ALLOC_NONE, 5267556);
allocate([65,117,100,105,111,83,99,117,108,112,116,117,114,101,32,49,46,48,0] /* AudioSculpture 1.0\0 */, "i8", ALLOC_NONE, 5267588);
allocate([73,78,73,84,0] /* INIT\00 */, "i8", ALLOC_NONE, 5267608);
allocate([77,65,73,78,0] /* MAIN\00 */, "i8", ALLOC_NONE, 5267616);
allocate([70,117,110,107,116,114,97,99,107,101,114,71,79,76,68,0] /* FunktrackerGOLD\00 */, "i8", ALLOC_NONE, 5267624);
allocate([37,115,37,115,46,78,84,0] /* %s%s.NT\00 */, "i8", ALLOC_NONE, 5267640);
allocate([68,105,103,105,66,111,111,115,116,101,114,32,80,114,111,32,40,68,66,77,41,0] /* DigiBooster Pro (DBM */, "i8", ALLOC_NONE, 5267648);
allocate([70,97,114,97,110,100,111,108,101,32,67,111,109,112,111,115,101,114,32,37,100,46,37,100,0] /* Farandole Composer % */, "i8", ALLOC_NONE, 5267672);
allocate([69,77,73,67,0] /* EMIC\00 */, "i8", ALLOC_NONE, 5267700);
allocate([68,101,115,107,116,111,112,32,84,114,97,99,107,101,114,0] /* Desktop Tracker\00 */, "i8", ALLOC_NONE, 5267708);
allocate([68,46,84,46,0] /* D.T.\00 */, "i8", ALLOC_NONE, 5267724);
allocate([67,68,56,49,0] /* CD81\00 */, "i8", ALLOC_NONE, 5267732);
allocate([37,115,32,68,77,70,32,118,37,100,0] /* %s DMF v%d\00 */, "i8", ALLOC_NONE, 5267740);
allocate([68,73,71,73,32,66,111,111,115,116,101,114,32,37,45,52,46,52,115,0] /* DIGI Booster %-4.4s\ */, "i8", ALLOC_NONE, 5267752);
allocate([101,118,101,110,116,45,62,118,111,108,32,60,61,32,54,52,0] /* event-_vol _= 64\00 */, "i8", ALLOC_NONE, 5267772);
allocate([65,117,100,105,111,83,99,117,108,112,116,117,114,101,49,48,0] /* AudioSculpture10\00 */, "i8", ALLOC_NONE, 5267792);
allocate([46,0] /* .\00 */, "i8", ALLOC_NONE, 5267812);
allocate([115,105,122,101,32,60,61,32,88,77,80,95,77,65,88,95,70,82,65,77,69,83,73,90,69,0] /* size _= XMP_MAX_FRAM */, "i8", ALLOC_NONE, 5267816);
allocate([65,115,121,108,117,109,32,77,117,115,105,99,32,70,111,114,109,97,116,32,86,49,46,48,0] /* Asylum Music Format  */, "i8", ALLOC_NONE, 5267844);
allocate([70,97,105,108,32,49,32,111,110,32,109,32,61,32,37,100,10,0] /* Fail 1 on m = %d\0A\ */, "i8", ALLOC_NONE, 5267872);
allocate([88,77,80,95,73,78,83,84,82,85,77,69,78,84,95,80,65,84,72,0] /* XMP_INSTRUMENT_PATH\ */, "i8", ALLOC_NONE, 5267892);
allocate([67,111,99,111,110,105,122,101,114,0] /* Coconizer\00 */, "i8", ALLOC_NONE, 5267912);
allocate([115,114,99,47,109,105,120,101,114,46,99,0] /* src/mixer.c\00 */, "i8", ALLOC_NONE, 5267924);
allocate([79,99,116,97,108,121,115,101,114,0] /* Octalyser\00 */, "i8", ALLOC_NONE, 5267936);
allocate([80,114,111,80,97,99,107,101,114,32,50,46,49,0] /* ProPacker 2.1\00 */, "i8", ALLOC_NONE, 5267948);
allocate([68,105,103,105,116,114,97,107,107,101,114,32,77,68,76,32,37,100,46,37,100,0] /* Digitrakker MDL %d.% */, "i8", ALLOC_NONE, 5267964);
allocate([80,114,111,109,105,122,101,114,32,49,46,56,97,0] /* Promizer 1.8a\00 */, "i8", ALLOC_NONE, 5267988);
allocate([99,104,97,110,110,101,108,32,37,100,58,32,37,48,50,120,32,37,48,50,120,10,0] /* channel %d: %02x %02 */, "i8", ALLOC_NONE, 5268004);
allocate([101,118,101,110,116,45,62,110,111,116,101,32,60,61,32,49,48,55,32,124,124,32,101,118,101,110,116,45,62,110,111,116,101,32,61,61,32,88,77,80,95,75,69,89,95,79,70,70,0] /* event-_note _= 107 | */, "i8", ALLOC_NONE, 5268028);
allocate([80,114,111,109,105,122,101,114,32,49,46,48,99,0] /* Promizer 1.0c\00 */, "i8", ALLOC_NONE, 5268080);
allocate([109,117,110,99,104,46,112,121,0] /* munch.py\00 */, "i8", ALLOC_NONE, 5268096);
allocate([80,104,97,32,80,97,99,107,101,114,0] /* Pha Packer\00 */, "i8", ALLOC_NONE, 5268108);
allocate([84,104,101,32,80,108,97,121,101,114,32,54,46,49,97,0] /* The Player 6.1a\00 */, "i8", ALLOC_NONE, 5268120);
allocate([84,104,101,32,80,108,97,121,101,114,32,54,46,48,97,0] /* The Player 6.0a\00 */, "i8", ALLOC_NONE, 5268136);
allocate([83,116,97,114,116,114,101,107,107,101,114,32,49,46,51,0] /* Startrekker 1.3\00 */, "i8", ALLOC_NONE, 5268152);
allocate([84,104,101,32,80,108,97,121,101,114,32,53,46,48,97,0] /* The Player 5.0a\00 */, "i8", ALLOC_NONE, 5268168);
allocate([84,104,101,32,80,108,97,121,101,114,32,52,46,120,0] /* The Player 4.x\00 */, "i8", ALLOC_NONE, 5268184);
allocate([78,111,105,115,101,112,97,99,107,101,114,32,118,51,0] /* Noisepacker v3\00 */, "i8", ALLOC_NONE, 5268200);
allocate([65,115,121,108,117,109,32,77,117,115,105,99,32,70,111,114,109,97,116,32,40,65,77,70,41,0] /* Asylum Music Format  */, "i8", ALLOC_NONE, 5268216);
allocate([78,111,105,115,101,112,97,99,107,101,114,32,118,50,0] /* Noisepacker v2\00 */, "i8", ALLOC_NONE, 5268244);
allocate([78,111,105,115,101,80,97,99,107,101,114,32,118,49,0] /* NoisePacker v1\00 */, "i8", ALLOC_NONE, 5268260);
allocate(472, "i8", ALLOC_NONE, 5268276);
allocate([117,110,112,97,99,107,95,98,108,111,99,107,0] /* unpack_block\00 */, "i8", ALLOC_NONE, 5268748);
allocate([109,105,120,101,114,95,115,111,102,116,109,105,120,101,114,0] /* mixer_softmixer\00 */, "i8", ALLOC_NONE, 5268764);
allocate([109,101,100,51,95,108,111,97,100,0] /* med3_load\00 */, "i8", ALLOC_NONE, 5268780);
allocate([108,105,113,95,108,111,97,100,0] /* liq_load\00 */, "i8", ALLOC_NONE, 5268792);
allocate([103,101,116,95,115,109,112,100,0] /* get_smpd\00 */, "i8", ALLOC_NONE, 5268804);
allocate([103,100,109,95,108,111,97,100,0] /* gdm_load\00 */, "i8", ALLOC_NONE, 5268816);
allocate([100,101,99,111,100,101,95,101,118,101,110,116,0] /* decode_event\00 */, "i8", ALLOC_NONE, 5268828);
allocate([0,0,0,0,56,102,80,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5268844);
allocate(1, "i8", ALLOC_NONE, 5268864);
__ZTVN10__cxxabiv120__si_class_type_infoE=allocate([0,0,0,0,68,102,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
allocate(1, "i8", ALLOC_STATIC);
__ZTVN10__cxxabiv117__class_type_infoE=allocate([0,0,0,0,80,102,80,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_STATIC);
allocate(1, "i8", ALLOC_STATIC);
allocate([0,0,0,0,104,102,80,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5268868);
allocate(1, "i8", ALLOC_NONE, 5268884);
allocate([83,116,57,116,121,112,101,95,105,110,102,111,0] /* St9type_info\00 */, "i8", ALLOC_NONE, 5268888);
allocate([83,116,57,98,97,100,95,97,108,108,111,99,0] /* St9bad_alloc\00 */, "i8", ALLOC_NONE, 5268904);
allocate([78,49,48,95,95,99,120,120,97,98,105,118,49,50,48,95,95,115,105,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0] /* N10__cxxabiv120__si_ */, "i8", ALLOC_NONE, 5268920);
allocate([78,49,48,95,95,99,120,120,97,98,105,118,49,49,55,95,95,99,108,97,115,115,95,116,121,112,101,95,105,110,102,111,69,0] /* N10__cxxabiv117__cla */, "i8", ALLOC_NONE, 5268960);
allocate([78,49,48,95,95,99,120,120,97,98,105,118,49,49,54,95,95,115,104,105,109,95,116,121,112,101,95,105,110,102,111,69,0] /* N10__cxxabiv116__shi */, "i8", ALLOC_NONE, 5268996);
allocate([54,112,108,97,121,101,114,0] /* 6player\00 */, "i8", ALLOC_NONE, 5269032);
allocate(8, "i8", ALLOC_NONE, 5269040);
allocate(12, "i8", ALLOC_NONE, 5269048);
allocate([0,0,0,0,0,0,0,0,80,102,80,0], "i8", ALLOC_NONE, 5269060);
allocate([0,0,0,0,0,0,0,0,92,102,80,0], "i8", ALLOC_NONE, 5269072);
allocate([0,0,0,0,0,0,0,0,48,102,80,0], "i8", ALLOC_NONE, 5269084);
allocate(8, "i8", ALLOC_NONE, 5269096);
allocate(4, "i8", ALLOC_NONE, 5269104);
allocate([0,0,0,16,0,0,128,16,0,0,0,17,0,0,128,17,0,0,0,18,0,0,128,18,0,0,0,19,0,0,128,19,0,0,0,20,0,0,128,20,0,0,0,21,0,0,128,21,0,0,0,22,0,0,128,22,0,0,0,23,0,0,128,31], "i8", ALLOC_NONE, 5269108);
allocate(64, "i8", ALLOC_NONE, 5269172);
allocate([128,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] /* \80\00\00\00\00\00\0 */, "i8", ALLOC_NONE, 5269236);
allocate([1,0,0,0,2,0,0,0,4,0,0,0,6,0,0,0,8,0,0,0,10,0,0,0,12,0,0,0,14,0,0,0,16,0,0,0,18,0,0,0,20,0,0,0,20,0,0,0,24,0,0,0,24,0,0,0,30,0,0,0,30,0,0,0], "i8", ALLOC_NONE, 5269300);
allocate([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,0,0,0,96,0,0,0,128,0,0,0,160,0,0,0,192,0,0,0,224,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,96,0,0,0,160,0,0,0,224,0,0,0,0,1,0,0,64,1,0,0,96,1,0,0,128,1,0,0,160,1,0,0,192,1,0,0,224,1,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,160,0,0,0,0,1,0,0,96,1,0,0,160,1,0,0,224,1,0,0,0,2,0,0,64,2,0,0,96,2,0,0,128,2,0,0,160,2,0,0,192,2,0,0,224,2,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,1,0,0,160,1,0,0,0,2,0,0,96,2,0,0,160,2,0,0,224,2,0,0,0,3,0,0,64,3,0,0,96,3,0,0,128,3,0,0,160,3,0,0,192,3,0,0,224,3,0,0,0,4,0,0,0,0,0,0,0,1,0,0,0,2,0,0,160,2,0,0,0,3,0,0,96,3,0,0,160,3,0,0,224,3,0,0,0,4,0,0,64,4,0,0,96,4,0,0,128,4,0,0,160,4,0,0,192,4,0,0,224,4,0,0,0,5,0,0,0,0,0,0,0,2,0,0,0,3,0,0,160,3,0,0,0,4,0,0,96,4,0,0,160,4,0,0,224,4,0,0,0,5,0,0,64,5,0,0,96,5,0,0,128,5,0,0,160,5,0,0,192,5,0,0,224,5,0,0,0,6,0,0,0,0,0,0,0,3,0,0,0,4,0,0,160,4,0,0,0,5,0,0,96,5,0,0,160,5,0,0,224,5,0,0,0,6,0,0,64,6,0,0,96,6,0,0,128,6,0,0,160,6,0,0,192,6,0,0,224,6,0,0,0,7,0,0], "i8", ALLOC_NONE, 5269364);
allocate(64, "i8", ALLOC_NONE, 5269876);
allocate([0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5269940);
allocate([0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5269972);
allocate([0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0], "i8", ALLOC_NONE, 5270004);
allocate([0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0], "i8", ALLOC_NONE, 5270036);
allocate([1,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0], "i8", ALLOC_NONE, 5270068);
allocate([1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0], "i8", ALLOC_NONE, 5270100);
allocate([1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5270132);
allocate([1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5270164);
allocate([0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5270196);
allocate([1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_NONE, 5270228);
HEAP32[((5242996)>>2)]=((5263328)|0);
HEAP32[((5244160)>>2)]=((5263360)|0);
HEAP32[((5244172)>>2)]=((5263480)|0);
HEAP32[((5244184)>>2)]=((5266628)|0);
HEAP32[((5244188)>>2)]=((5265632)|0);
HEAP32[((5244192)>>2)]=((5264864)|0);
HEAP32[((5244196)>>2)]=((5264388)|0);
HEAP32[((5246904)>>2)]=((5263524)|0);
HEAP32[((5247012)>>2)]=((5263560)|0);
HEAP32[((5247024)>>2)]=((5263632)|0);
HEAP32[((5247040)>>2)]=((5263648)|0);
HEAP32[((5247052)>>2)]=((5263672)|0);
HEAP32[((5247064)>>2)]=((5263684)|0);
HEAP32[((5247076)>>2)]=((5263752)|0);
HEAP32[((5247088)>>2)]=((5263500)|0);
HEAP32[((5247100)>>2)]=(146);
HEAP32[((5247104)>>2)]=(60);
HEAP32[((5247108)>>2)]=(302);
HEAP32[((5247112)>>2)]=(154);
HEAP32[((5247116)>>2)]=(588);
HEAP32[((5247120)>>2)]=(512);
HEAP32[((5247124)>>2)]=(46);
HEAP32[((5247128)>>2)]=(178);
HEAP32[((5247388)>>2)]=((5263804)|0);
HEAP32[((5247400)>>2)]=((5263912)|0);
HEAP32[((5247616)>>2)]=((5263944)|0);
HEAP32[((5247748)>>2)]=((5263972)|0);
HEAP32[((5247760)>>2)]=((5264164)|0);
HEAP32[((5247780)>>2)]=((5264176)|0);
HEAP32[((5247800)>>2)]=((5264188)|0);
HEAP32[((5247820)>>2)]=((5267036)|0);
HEAP32[((5247840)>>2)]=((5264220)|0);
HEAP32[((5247860)>>2)]=((5265804)|0);
HEAP32[((5247880)>>2)]=((5264204)|0);
HEAP32[((5247900)>>2)]=((5264244)|0);
HEAP32[((5247920)>>2)]=((5264264)|0);
HEAP32[((5247940)>>2)]=((5264280)|0);
HEAP32[((5247960)>>2)]=((5264296)|0);
HEAP32[((5247980)>>2)]=((5264316)|0);
HEAP32[((5248000)>>2)]=((5264336)|0);
HEAP32[((5248020)>>2)]=((5264352)|0);
HEAP32[((5248040)>>2)]=((5267948)|0);
HEAP32[((5248060)>>2)]=((5268108)|0);
HEAP32[((5248080)>>2)]=((5268120)|0);
HEAP32[((5248100)>>2)]=((5268136)|0);
HEAP32[((5248120)>>2)]=((5268168)|0);
HEAP32[((5248140)>>2)]=((5268184)|0);
HEAP32[((5248160)>>2)]=((5267988)|0);
HEAP32[((5248180)>>2)]=((5268080)|0);
HEAP32[((5248200)>>2)]=((5262320)|0);
HEAP32[((5248220)>>2)]=((5262340)|0);
HEAP32[((5248240)>>2)]=((5268200)|0);
HEAP32[((5248260)>>2)]=((5268244)|0);
HEAP32[((5248280)>>2)]=((5268260)|0);
HEAP32[((5248300)>>2)]=((5266424)|0);
HEAP32[((5248320)>>2)]=((5262352)|0);
HEAP32[((5248340)>>2)]=((5264012)|0);
HEAP32[((5248352)>>2)]=((5262372)|0);
HEAP32[((5248372)>>2)]=((5262396)|0);
HEAP32[((5248392)>>2)]=((5262408)|0);
HEAP32[((5248412)>>2)]=((5262440)|0);
HEAP32[((5248432)>>2)]=((5262460)|0);
HEAP32[((5248616)>>2)]=((5262492)|0);
HEAP32[((5248636)>>2)]=((5262476)|0);
HEAP32[((5248656)>>2)]=((5262504)|0);
HEAP32[((5248676)>>2)]=((5262520)|0);
HEAP32[((5248696)>>2)]=((5262424)|0);
HEAP32[((5248716)>>2)]=((5262540)|0);
HEAP32[((5248996)>>2)]=((5264044)|0);
HEAP32[((5249084)>>2)]=((5264092)|0);
HEAP32[((5249096)>>2)]=((5264124)|0);
HEAP32[((5249108)>>2)]=((5264392)|0);
HEAP32[((5249684)>>2)]=((5264488)|0);
HEAP32[((5249696)>>2)]=((5264500)|0);
HEAP32[((5249708)>>2)]=(28);
HEAP32[((5249712)>>2)]=(254);
HEAP32[((5249716)>>2)]=(56);
HEAP32[((5249720)>>2)]=(412);
HEAP32[((5249724)>>2)]=(28);
HEAP32[((5249728)>>2)]=(254);
HEAP32[((5249732)>>2)]=(56);
HEAP32[((5249736)>>2)]=(412);
HEAP32[((5249740)>>2)]=((5263772)|0);
HEAP32[((5249752)>>2)]=((5264588)|0);
HEAP32[((5249888)>>2)]=((5265056)|0);
HEAP32[((5249900)>>2)]=((5267156)|0);
HEAP32[((5249908)>>2)]=((5265948)|0);
HEAP32[((5249920)>>2)]=((5267156)|0);
HEAP32[((5249928)>>2)]=((5265140)|0);
HEAP32[((5249940)>>2)]=((5264524)|0);
HEAP32[((5249948)>>2)]=((5263964)|0);
HEAP32[((5249960)>>2)]=((5264524)|0);
HEAP32[((5249968)>>2)]=((5263352)|0);
HEAP32[((5249980)>>2)]=((5263024)|0);
HEAP32[((5249988)>>2)]=((5262784)|0);
HEAP32[((5250000)>>2)]=((5263024)|0);
HEAP32[((5250008)>>2)]=((5262572)|0);
HEAP32[((5250020)>>2)]=((5267936)|0);
HEAP32[((5250028)>>2)]=((5267732)|0);
HEAP32[((5250040)>>2)]=((5267936)|0);
HEAP32[((5250048)>>2)]=((5267480)|0);
HEAP32[((5250060)>>2)]=((5267304)|0);
HEAP32[((5250068)>>2)]=((5267116)|0);
HEAP32[((5250080)>>2)]=((5266920)|0);
HEAP32[((5250088)>>2)]=((5266620)|0);
HEAP32[((5250100)>>2)]=((5266920)|0);
HEAP32[((5250108)>>2)]=((5266536)|0);
HEAP32[((5250120)>>2)]=((5266920)|0);
HEAP32[((5250128)>>2)]=((5266500)|0);
HEAP32[((5250140)>>2)]=((5266468)|0);
HEAP32[((5250148)>>2)]=((5266736)|0);
HEAP32[((5250168)>>2)]=((5266264)|0);
HEAP32[((5250220)>>2)]=((5264736)|0);
HEAP32[((5250232)>>2)]=((5264764)|0);
HEAP32[((5250244)>>2)]=((5264812)|0);
HEAP32[((5250256)>>2)]=((5264868)|0);
HEAP32[((5250268)>>2)]=((5264980)|0);
HEAP32[((5250280)>>2)]=((5265072)|0);
HEAP32[((5250292)>>2)]=((5265120)|0);
HEAP32[((5250304)>>2)]=((5265204)|0);
HEAP32[((5250316)>>2)]=((5265340)|0);
HEAP32[((5250328)>>2)]=((5265456)|0);
HEAP32[((5250340)>>2)]=(506);
HEAP32[((5250344)>>2)]=(452);
HEAP32[((5250348)>>2)]=(128);
HEAP32[((5250352)>>2)]=(586);
HEAP32[((5250356)>>2)]=(326);
HEAP32[((5250360)>>2)]=(106);
HEAP32[((5250364)>>2)]=(244);
HEAP32[((5250368)>>2)]=(294);
HEAP32[((5250440)>>2)]=((5265520)|0);
HEAP32[((5250528)>>2)]=((5265544)|0);
HEAP32[((5250540)>>2)]=((5265612)|0);
HEAP32[((5250552)>>2)]=((5265896)|0);
HEAP32[((5250564)>>2)]=((5265936)|0);
HEAP32[((5250612)>>2)]=((5266020)|0);
HEAP32[((5250640)>>2)]=((5266136)|0);
HEAP32[((5250652)>>2)]=((5266312)|0);
HEAP32[((5250664)>>2)]=((5266400)|0);
HEAP32[((5251216)>>2)]=((5266448)|0);
HEAP32[((5251228)>>2)]=((5266516)|0);
HEAP32[((5252328)>>2)]=((5266560)|0);
HEAP32[((5252348)>>2)]=((5266636)|0);
HEAP32[((5252360)>>2)]=((5266768)|0);
HEAP32[((5252372)>>2)]=((5267068)|0);
HEAP32[((5252896)>>2)]=((5267316)|0);
HEAP32[((5252908)>>2)]=((5267392)|0);
HEAP32[((5252920)>>2)]=((5267648)|0);
HEAP32[((5261124)>>2)]=((5267912)|0);
HEAP32[((5261136)>>2)]=((5268216)|0);
HEAP32[((5262176)>>2)]=((5262720)|0);
HEAP32[((5262188)>>2)]=((5262880)|0);
HEAP32[((5262200)>>2)]=((5262956)|0);
HEAP32[((5262308)>>2)]=((5263200)|0);
HEAP32[((5268852)>>2)]=(216);
HEAP32[((5268856)>>2)]=(494);
HEAP32[((5268860)>>2)]=(280);
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(8))>>2)]=(550);
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(12))>>2)]=(372);
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(16))>>2)]=(576);
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(20))>>2)]=(126);
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(24))>>2)]=(62);
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(28))>>2)]=(378);
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(32))>>2)]=(188);
HEAP32[(((__ZTVN10__cxxabiv120__si_class_type_infoE)+(36))>>2)]=(312);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(8))>>2)]=(550);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(12))>>2)]=(508);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(16))>>2)]=(576);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(20))>>2)]=(126);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(24))>>2)]=(62);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(28))>>2)]=(12);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(32))>>2)]=(558);
HEAP32[(((__ZTVN10__cxxabiv117__class_type_infoE)+(36))>>2)]=(184);
HEAP32[((5268876)>>2)]=(90);
HEAP32[((5268880)>>2)]=(598);
HEAP32[((5269040)>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((5269044)>>2)]=((5268888)|0);
HEAP32[((5269048)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5269052)>>2)]=((5268904)|0);
HEAP32[((5269056)>>2)]=__ZTISt9exception;
HEAP32[((5269060)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5269064)>>2)]=((5268920)|0);
HEAP32[((5269072)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5269076)>>2)]=((5268960)|0);
HEAP32[((5269084)>>2)]=(((__ZTVN10__cxxabiv120__si_class_type_infoE+8)|0));
HEAP32[((5269088)>>2)]=((5268996)|0);
HEAP32[((5269096)>>2)]=(((__ZTVN10__cxxabiv117__class_type_infoE+8)|0));
HEAP32[((5269100)>>2)]=((5269032)|0);
HEAP32[((5269876)>>2)]=((5270228)|0);
HEAP32[((5269880)>>2)]=((5270228)|0);
HEAP32[((5269884)>>2)]=((5270228)|0);
HEAP32[((5269888)>>2)]=((5270228)|0);
HEAP32[((5269892)>>2)]=((5270196)|0);
HEAP32[((5269896)>>2)]=((5270196)|0);
HEAP32[((5269900)>>2)]=((5270196)|0);
HEAP32[((5269904)>>2)]=((5270196)|0);
HEAP32[((5269908)>>2)]=((5270164)|0);
HEAP32[((5269912)>>2)]=((5270132)|0);
HEAP32[((5269916)>>2)]=((5270100)|0);
HEAP32[((5269920)>>2)]=((5270068)|0);
HEAP32[((5269924)>>2)]=((5270036)|0);
HEAP32[((5269928)>>2)]=((5270004)|0);
HEAP32[((5269932)>>2)]=((5269972)|0);
HEAP32[((5269936)>>2)]=((5269940)|0);
  function ___gxx_personality_v0() {
    }
  function _memset(ptr, value, num) {
      ptr = ptr|0; value = value|0; num = num|0;
      var stop = 0, value4 = 0, stop4 = 0, unaligned = 0;
      stop = (ptr + num)|0;
      if ((num|0) >= 20) {
        // This is unaligned, but quite large, so work hard to get to aligned settings
        value = value & 0xff;
        unaligned = ptr & 3;
        value4 = value | (value << 8) | (value << 16) | (value << 24);
        stop4 = stop & ~3;
        if (unaligned) {
          unaligned = (ptr + 4 - unaligned)|0;
          while ((ptr|0) < (unaligned|0)) { // no need to check for stop, since we have large num
            HEAP8[(ptr)]=value;
            ptr = (ptr+1)|0;
          }
        }
        while ((ptr|0) < (stop4|0)) {
          HEAP32[((ptr)>>2)]=value4;
          ptr = (ptr+4)|0;
        }
      }
      while ((ptr|0) < (stop|0)) {
        HEAP8[(ptr)]=value;
        ptr = (ptr+1)|0;
      }
    }var _llvm_memset_p0i8_i32=_memset;
  function _llvm_umul_with_overflow_i32(x, y) {
      x = x>>>0;
      y = y>>>0;
      return tempRet0 = x*y > 4294967295,(x*y)>>>0;
    }
  var ERRNO_CODES={E2BIG:7,EACCES:13,EADDRINUSE:98,EADDRNOTAVAIL:99,EAFNOSUPPORT:97,EAGAIN:11,EALREADY:114,EBADF:9,EBADMSG:74,EBUSY:16,ECANCELED:125,ECHILD:10,ECONNABORTED:103,ECONNREFUSED:111,ECONNRESET:104,EDEADLK:35,EDESTADDRREQ:89,EDOM:33,EDQUOT:122,EEXIST:17,EFAULT:14,EFBIG:27,EHOSTUNREACH:113,EIDRM:43,EILSEQ:84,EINPROGRESS:115,EINTR:4,EINVAL:22,EIO:5,EISCONN:106,EISDIR:21,ELOOP:40,EMFILE:24,EMLINK:31,EMSGSIZE:90,EMULTIHOP:72,ENAMETOOLONG:36,ENETDOWN:100,ENETRESET:102,ENETUNREACH:101,ENFILE:23,ENOBUFS:105,ENODATA:61,ENODEV:19,ENOENT:2,ENOEXEC:8,ENOLCK:37,ENOLINK:67,ENOMEM:12,ENOMSG:42,ENOPROTOOPT:92,ENOSPC:28,ENOSR:63,ENOSTR:60,ENOSYS:38,ENOTCONN:107,ENOTDIR:20,ENOTEMPTY:39,ENOTRECOVERABLE:131,ENOTSOCK:88,ENOTSUP:95,ENOTTY:25,ENXIO:6,EOVERFLOW:75,EOWNERDEAD:130,EPERM:1,EPIPE:32,EPROTO:71,EPROTONOSUPPORT:93,EPROTOTYPE:91,ERANGE:34,EROFS:30,ESPIPE:29,ESRCH:3,ESTALE:116,ETIME:62,ETIMEDOUT:110,ETXTBSY:26,EWOULDBLOCK:11,EXDEV:18};
  function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      if (!___setErrNo.ret) ___setErrNo.ret = allocate([0], 'i32', ALLOC_STATIC);
      HEAP32[((___setErrNo.ret)>>2)]=value
      return value;
    }
  var _stdin=allocate(1, "i32*", ALLOC_STACK);
  var _stdout=allocate(1, "i32*", ALLOC_STACK);
  var _stderr=allocate(1, "i32*", ALLOC_STACK);
  var __impure_ptr=allocate(1, "i32*", ALLOC_STACK);var FS={currentPath:"/",nextInode:2,streams:[null],ignorePermissions:true,joinPath:function (parts, forceRelative) {
        var ret = parts[0];
        for (var i = 1; i < parts.length; i++) {
          if (ret[ret.length-1] != '/') ret += '/';
          ret += parts[i];
        }
        if (forceRelative && ret[0] == '/') ret = ret.substr(1);
        return ret;
      },absolutePath:function (relative, base) {
        if (typeof relative !== 'string') return null;
        if (base === undefined) base = FS.currentPath;
        if (relative && relative[0] == '/') base = '';
        var full = base + '/' + relative;
        var parts = full.split('/').reverse();
        var absolute = [''];
        while (parts.length) {
          var part = parts.pop();
          if (part == '' || part == '.') {
            // Nothing.
          } else if (part == '..') {
            if (absolute.length > 1) absolute.pop();
          } else {
            absolute.push(part);
          }
        }
        return absolute.length == 1 ? '/' : absolute.join('/');
      },analyzePath:function (path, dontResolveLastLink, linksVisited) {
        var ret = {
          isRoot: false,
          exists: false,
          error: 0,
          name: null,
          path: null,
          object: null,
          parentExists: false,
          parentPath: null,
          parentObject: null
        };
        path = FS.absolutePath(path);
        if (path == '/') {
          ret.isRoot = true;
          ret.exists = ret.parentExists = true;
          ret.name = '/';
          ret.path = ret.parentPath = '/';
          ret.object = ret.parentObject = FS.root;
        } else if (path !== null) {
          linksVisited = linksVisited || 0;
          path = path.slice(1).split('/');
          var current = FS.root;
          var traversed = [''];
          while (path.length) {
            if (path.length == 1 && current.isFolder) {
              ret.parentExists = true;
              ret.parentPath = traversed.length == 1 ? '/' : traversed.join('/');
              ret.parentObject = current;
              ret.name = path[0];
            }
            var target = path.shift();
            if (!current.isFolder) {
              ret.error = ERRNO_CODES.ENOTDIR;
              break;
            } else if (!current.read) {
              ret.error = ERRNO_CODES.EACCES;
              break;
            } else if (!current.contents.hasOwnProperty(target)) {
              ret.error = ERRNO_CODES.ENOENT;
              break;
            }
            current = current.contents[target];
            if (current.link && !(dontResolveLastLink && path.length == 0)) {
              if (linksVisited > 40) { // Usual Linux SYMLOOP_MAX.
                ret.error = ERRNO_CODES.ELOOP;
                break;
              }
              var link = FS.absolutePath(current.link, traversed.join('/'));
              ret = FS.analyzePath([link].concat(path).join('/'),
                                   dontResolveLastLink, linksVisited + 1);
              return ret;
            }
            traversed.push(target);
            if (path.length == 0) {
              ret.exists = true;
              ret.path = traversed.join('/');
              ret.object = current;
            }
          }
        }
        return ret;
      },findObject:function (path, dontResolveLastLink) {
        FS.ensureRoot();
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },createObject:function (parent, name, properties, canRead, canWrite) {
        if (!parent) parent = '/';
        if (typeof parent === 'string') parent = FS.findObject(parent);
        if (!parent) {
          ___setErrNo(ERRNO_CODES.EACCES);
          throw new Error('Parent path must exist.');
        }
        if (!parent.isFolder) {
          ___setErrNo(ERRNO_CODES.ENOTDIR);
          throw new Error('Parent must be a folder.');
        }
        if (!parent.write && !FS.ignorePermissions) {
          ___setErrNo(ERRNO_CODES.EACCES);
          throw new Error('Parent folder must be writeable.');
        }
        if (!name || name == '.' || name == '..') {
          ___setErrNo(ERRNO_CODES.ENOENT);
          throw new Error('Name must not be empty.');
        }
        if (parent.contents.hasOwnProperty(name)) {
          ___setErrNo(ERRNO_CODES.EEXIST);
          throw new Error("Can't overwrite object.");
        }
        parent.contents[name] = {
          read: canRead === undefined ? true : canRead,
          write: canWrite === undefined ? false : canWrite,
          timestamp: Date.now(),
          inodeNumber: FS.nextInode++
        };
        for (var key in properties) {
          if (properties.hasOwnProperty(key)) {
            parent.contents[name][key] = properties[key];
          }
        }
        return parent.contents[name];
      },createFolder:function (parent, name, canRead, canWrite) {
        var properties = {isFolder: true, isDevice: false, contents: {}};
        return FS.createObject(parent, name, properties, canRead, canWrite);
      },createPath:function (parent, path, canRead, canWrite) {
        var current = FS.findObject(parent);
        if (current === null) throw new Error('Invalid parent.');
        path = path.split('/').reverse();
        while (path.length) {
          var part = path.pop();
          if (!part) continue;
          if (!current.contents.hasOwnProperty(part)) {
            FS.createFolder(current, part, canRead, canWrite);
          }
          current = current.contents[part];
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        properties.isFolder = false;
        return FS.createObject(parent, name, properties, canRead, canWrite);
      },createDataFile:function (parent, name, data, canRead, canWrite) {
        if (typeof data === 'string') {
          var dataArray = new Array(data.length);
          for (var i = 0, len = data.length; i < len; ++i) dataArray[i] = data.charCodeAt(i);
          data = dataArray;
        }
        var properties = {
          isDevice: false,
          contents: data.subarray ? data.subarray(0) : data // as an optimization, create a new array wrapper (not buffer) here, to help JS engines understand this object
        };
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
          var LazyUint8Array = function(chunkSize, length) {
            this.length = length;
            this.chunkSize = chunkSize;
            this.chunks = []; // Loaded chunks. Index is the chunk number
          }
          LazyUint8Array.prototype.get = function(idx) {
            if (idx > this.length-1 || idx < 0) {
              return undefined;
            }
            var chunkOffset = idx % chunkSize;
            var chunkNum = Math.floor(idx / chunkSize);
            return this.getter(chunkNum)[chunkOffset];
          }
          LazyUint8Array.prototype.setDataGetter = function(getter) {
            this.getter = getter;
          }
          // Find length
          var xhr = new XMLHttpRequest();
          xhr.open('HEAD', url, false);
          xhr.send(null);
          if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
          var datalength = Number(xhr.getResponseHeader("Content-length"));
          var header;
          var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
          var chunkSize = 1024*1024; // Chunk size in bytes
          if (!hasByteServing) chunkSize = datalength;
          // Function to get a range from the remote URL.
          var doXHR = (function(from, to) {
            if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
            if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
            // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
            // Some hints to the browser that we want binary data.
            if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
            if (xhr.overrideMimeType) {
              xhr.overrideMimeType('text/plain; charset=x-user-defined');
            }
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            if (xhr.response !== undefined) {
              return new Uint8Array(xhr.response || []);
            } else {
              return intArrayFromString(xhr.responseText || '', true);
            }
          });
          var lazyArray = new LazyUint8Array(chunkSize, datalength);
          lazyArray.setDataGetter(function(chunkNum) {
            var start = chunkNum * lazyArray.chunkSize;
            var end = (chunkNum+1) * lazyArray.chunkSize - 1; // including this byte
            end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
              lazyArray.chunks[chunkNum] = doXHR(start, end);
            }
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
            return lazyArray.chunks[chunkNum];
          });
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile) {
        Browser.init();
        var fullname = FS.joinPath([parent, name], true);
        function processData(byteArray) {
          function finish(byteArray) {
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite);
            }
            if (onload) onload();
            removeRunDependency('cp ' + fullname);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency('cp ' + fullname);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency('cp ' + fullname);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },createLink:function (parent, name, target, canRead, canWrite) {
        var properties = {isDevice: false, link: target};
        return FS.createFile(parent, name, properties, canRead, canWrite);
      },createDevice:function (parent, name, input, output) {
        if (!(input || output)) {
          throw new Error('A device must have at least one callback defined.');
        }
        var ops = {isDevice: true, input: input, output: output};
        return FS.createFile(parent, name, ops, Boolean(input), Boolean(output));
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },ensureRoot:function () {
        if (FS.root) return;
        // The main file system tree. All the contents are inside this.
        FS.root = {
          read: true,
          write: true,
          isFolder: true,
          isDevice: false,
          timestamp: Date.now(),
          inodeNumber: 1,
          contents: {}
        };
      },init:function (input, output, error) {
        // Make sure we initialize only once.
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
        FS.ensureRoot();
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        input = input || Module['stdin'];
        output = output || Module['stdout'];
        error = error || Module['stderr'];
        // Default handlers.
        var stdinOverridden = true, stdoutOverridden = true, stderrOverridden = true;
        if (!input) {
          stdinOverridden = false;
          input = function() {
            if (!input.cache || !input.cache.length) {
              var result;
              if (typeof window != 'undefined' &&
                  typeof window.prompt == 'function') {
                // Browser.
                result = window.prompt('Input: ');
                if (result === null) result = String.fromCharCode(0); // cancel ==> EOF
              } else if (typeof readline == 'function') {
                // Command line.
                result = readline();
              }
              if (!result) result = '';
              input.cache = intArrayFromString(result + '\n', true);
            }
            return input.cache.shift();
          };
        }
        var utf8 = new Runtime.UTF8Processor();
        function simpleOutput(val) {
          if (val === null || val === 10) {
            output.printer(output.buffer.join(''));
            output.buffer = [];
          } else {
            output.buffer.push(utf8.processCChar(val));
          }
        }
        if (!output) {
          stdoutOverridden = false;
          output = simpleOutput;
        }
        if (!output.printer) output.printer = Module['print'];
        if (!output.buffer) output.buffer = [];
        if (!error) {
          stderrOverridden = false;
          error = simpleOutput;
        }
        if (!error.printer) error.printer = Module['print'];
        if (!error.buffer) error.buffer = [];
        // Create the temporary folder, if not already created
        try {
          FS.createFolder('/', 'tmp', true, true);
        } catch(e) {}
        // Create the I/O devices.
        var devFolder = FS.createFolder('/', 'dev', true, true);
        var stdin = FS.createDevice(devFolder, 'stdin', input);
        var stdout = FS.createDevice(devFolder, 'stdout', null, output);
        var stderr = FS.createDevice(devFolder, 'stderr', null, error);
        FS.createDevice(devFolder, 'tty', input, output);
        // Create default streams.
        FS.streams[1] = {
          path: '/dev/stdin',
          object: stdin,
          position: 0,
          isRead: true,
          isWrite: false,
          isAppend: false,
          isTerminal: !stdinOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        FS.streams[2] = {
          path: '/dev/stdout',
          object: stdout,
          position: 0,
          isRead: false,
          isWrite: true,
          isAppend: false,
          isTerminal: !stdoutOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        FS.streams[3] = {
          path: '/dev/stderr',
          object: stderr,
          position: 0,
          isRead: false,
          isWrite: true,
          isAppend: false,
          isTerminal: !stderrOverridden,
          error: false,
          eof: false,
          ungotten: []
        };
        assert(Math.max(_stdin, _stdout, _stderr) < 128); // make sure these are low, we flatten arrays with these
        HEAP32[((_stdin)>>2)]=1;
        HEAP32[((_stdout)>>2)]=2;
        HEAP32[((_stderr)>>2)]=3;
        // Other system paths
        FS.createPath('/', 'dev/shm/tmp', true, true); // temp files
        // Newlib initialization
        for (var i = FS.streams.length; i < Math.max(_stdin, _stdout, _stderr) + 4; i++) {
          FS.streams[i] = null; // Make sure to keep FS.streams dense
        }
        FS.streams[_stdin] = FS.streams[1];
        FS.streams[_stdout] = FS.streams[2];
        FS.streams[_stderr] = FS.streams[3];
        allocate([ allocate(
          [0, 0, 0, 0, _stdin, 0, 0, 0, _stdout, 0, 0, 0, _stderr, 0, 0, 0],
          'void*', ALLOC_STATIC) ], 'void*', ALLOC_NONE, __impure_ptr);
      },quit:function () {
        if (!FS.init.initialized) return;
        // Flush any partially-printed lines in stdout and stderr. Careful, they may have been closed
        if (FS.streams[2] && FS.streams[2].object.output.buffer.length > 0) FS.streams[2].object.output(10);
        if (FS.streams[3] && FS.streams[3].object.output.buffer.length > 0) FS.streams[3].object.output(10);
      },standardizePath:function (path) {
        if (path.substr(0, 2) == './') path = path.substr(2);
        return path;
      },deleteFile:function (path) {
        path = FS.analyzePath(path);
        if (!path.parentExists || !path.exists) {
          throw 'Invalid path ' + path;
        }
        delete path.parentObject.contents[path.name];
      }};
  var ___dirent_struct_layout={__size__:1040,d_ino:0,d_name:4,d_off:1028,d_reclen:1032,d_type:1036};function _open(path, oflag, varargs) {
      // int open(const char *path, int oflag, ...);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/open.html
      // NOTE: This implementation tries to mimic glibc rather than strictly
      // following the POSIX standard.
      var mode = HEAP32[((varargs)>>2)];
      // Simplify flags.
      var accessMode = oflag & 3;
      var isWrite = accessMode != 0;
      var isRead = accessMode != 1;
      var isCreate = Boolean(oflag & 512);
      var isExistCheck = Boolean(oflag & 2048);
      var isTruncate = Boolean(oflag & 1024);
      var isAppend = Boolean(oflag & 8);
      // Verify path.
      var origPath = path;
      path = FS.analyzePath(Pointer_stringify(path));
      if (!path.parentExists) {
        ___setErrNo(path.error);
        return -1;
      }
      var target = path.object || null;
      var finalPath;
      // Verify the file exists, create if needed and allowed.
      if (target) {
        if (isCreate && isExistCheck) {
          ___setErrNo(ERRNO_CODES.EEXIST);
          return -1;
        }
        if ((isWrite || isCreate || isTruncate) && target.isFolder) {
          ___setErrNo(ERRNO_CODES.EISDIR);
          return -1;
        }
        if (isRead && !target.read || isWrite && !target.write) {
          ___setErrNo(ERRNO_CODES.EACCES);
          return -1;
        }
        if (isTruncate && !target.isDevice) {
          target.contents = [];
        } else {
          if (!FS.forceLoadFile(target)) {
            ___setErrNo(ERRNO_CODES.EIO);
            return -1;
          }
        }
        finalPath = path.path;
      } else {
        if (!isCreate) {
          ___setErrNo(ERRNO_CODES.ENOENT);
          return -1;
        }
        if (!path.parentObject.write) {
          ___setErrNo(ERRNO_CODES.EACCES);
          return -1;
        }
        target = FS.createDataFile(path.parentObject, path.name, [],
                                   mode & 0x100, mode & 0x80);  // S_IRUSR, S_IWUSR.
        finalPath = path.parentPath + '/' + path.name;
      }
      // Actually create an open stream.
      var id = FS.streams.length; // Keep dense
      if (target.isFolder) {
        var entryBuffer = 0;
        if (___dirent_struct_layout) {
          entryBuffer = _malloc(___dirent_struct_layout.__size__);
        }
        var contents = [];
        for (var key in target.contents) contents.push(key);
        FS.streams[id] = {
          path: finalPath,
          object: target,
          // An index into contents. Special values: -2 is ".", -1 is "..".
          position: -2,
          isRead: true,
          isWrite: false,
          isAppend: false,
          error: false,
          eof: false,
          ungotten: [],
          // Folder-specific properties:
          // Remember the contents at the time of opening in an array, so we can
          // seek between them relying on a single order.
          contents: contents,
          // Each stream has its own area for readdir() returns.
          currentEntry: entryBuffer
        };
      } else {
        FS.streams[id] = {
          path: finalPath,
          object: target,
          position: 0,
          isRead: isRead,
          isWrite: isWrite,
          isAppend: isAppend,
          error: false,
          eof: false,
          ungotten: []
        };
      }
      return id;
    }function _fopen(filename, mode) {
      // FILE *fopen(const char *restrict filename, const char *restrict mode);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fopen.html
      var flags;
      mode = Pointer_stringify(mode);
      if (mode[0] == 'r') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 0;
        }
      } else if (mode[0] == 'w') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 512;
        flags |= 1024;
      } else if (mode[0] == 'a') {
        if (mode.indexOf('+') != -1) {
          flags = 2;
        } else {
          flags = 1;
        }
        flags |= 512;
        flags |= 8;
      } else {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return 0;
      }
      var ret = _open(filename, flags, allocate([0x1FF, 0, 0, 0], 'i32', ALLOC_STACK));  // All creation permissions.
      return (ret == -1) ? 0 : ret;
    }
  function _pwrite(fildes, buf, nbyte, offset) {
      // ssize_t pwrite(int fildes, const void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.streams[fildes];
      if (!stream || stream.object.isDevice) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isWrite) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (stream.object.isFolder) {
        ___setErrNo(ERRNO_CODES.EISDIR);
        return -1;
      } else if (nbyte < 0 || offset < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        var contents = stream.object.contents;
        while (contents.length < offset) contents.push(0);
        for (var i = 0; i < nbyte; i++) {
          contents[offset + i] = HEAPU8[(((buf)+(i))|0)];
        }
        stream.object.timestamp = Date.now();
        return i;
      }
    }function _write(fildes, buf, nbyte) {
      // ssize_t write(int fildes, const void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/write.html
      var stream = FS.streams[fildes];
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isWrite) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (nbyte < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        if (stream.object.isDevice) {
          if (stream.object.output) {
            for (var i = 0; i < nbyte; i++) {
              try {
                stream.object.output(HEAP8[(((buf)+(i))|0)]);
              } catch (e) {
                ___setErrNo(ERRNO_CODES.EIO);
                return -1;
              }
            }
            stream.object.timestamp = Date.now();
            return i;
          } else {
            ___setErrNo(ERRNO_CODES.ENXIO);
            return -1;
          }
        } else {
          var bytesWritten = _pwrite(fildes, buf, nbyte, stream.position);
          if (bytesWritten != -1) stream.position += bytesWritten;
          return bytesWritten;
        }
      }
    }function _fwrite(ptr, size, nitems, stream) {
      // size_t fwrite(const void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fwrite.html
      var bytesToWrite = nitems * size;
      if (bytesToWrite == 0) return 0;
      var bytesWritten = _write(stream, ptr, bytesToWrite);
      if (bytesWritten == -1) {
        if (FS.streams[stream]) FS.streams[stream].error = true;
        return 0;
      } else {
        return Math.floor(bytesWritten / size);
      }
    }
  function _close(fildes) {
      // int close(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/close.html
      if (FS.streams[fildes]) {
        if (FS.streams[fildes].currentEntry) {
          _free(FS.streams[fildes].currentEntry);
        }
        FS.streams[fildes] = null;
        return 0;
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }
  function _fsync(fildes) {
      // int fsync(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fsync.html
      if (FS.streams[fildes]) {
        // We write directly to the file system, so there's nothing to do here.
        return 0;
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }function _fclose(stream) {
      // int fclose(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fclose.html
      _fsync(stream);
      return _close(stream);
    }
  function _memcpy(dest, src, num) {
      dest = dest|0; src = src|0; num = num|0;
      var ret = 0;
      ret = dest|0;
      if ((dest&3) == (src&3)) {
        while (dest & 3) {
          if ((num|0) == 0) return ret|0;
          HEAP8[(dest)]=HEAP8[(src)];
          dest = (dest+1)|0;
          src = (src+1)|0;
          num = (num-1)|0;
        }
        while ((num|0) >= 4) {
          HEAP32[((dest)>>2)]=HEAP32[((src)>>2)];
          dest = (dest+4)|0;
          src = (src+4)|0;
          num = (num-4)|0;
        }
      }
      while ((num|0) > 0) {
        HEAP8[(dest)]=HEAP8[(src)];
        dest = (dest+1)|0;
        src = (src+1)|0;
        num = (num-1)|0;
      }
      return ret|0;
    }var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  function _strlen(ptr) {
      ptr = ptr|0;
      var curr = 0;
      curr = ptr;
      while (HEAP8[(curr)]|0 != 0) {
        curr = (curr + 1)|0;
      }
      return (curr - ptr)|0;
    }function _strdup(ptr) {
      var len = _strlen(ptr);
      var newStr = _malloc(len + 1);
      _memcpy(newStr, ptr, len);
      HEAP8[(((newStr)+(len))|0)]=0;
      return newStr;
    }
  function _strncmp(px, py, n) {
      var i = 0;
      while (i < n) {
        var x = HEAPU8[(((px)+(i))|0)];
        var y = HEAPU8[(((py)+(i))|0)];
        if (x == y && x == 0) return 0;
        if (x == 0) return -1;
        if (y == 0) return 1;
        if (x == y) {
          i ++;
          continue;
        } else {
          return x > y ? 1 : -1;
        }
      }
      return 0;
    }function _strcmp(px, py) {
      return _strncmp(px, py, TOTAL_MEMORY);
    }
  var ___stat_struct_layout={__size__:68,st_dev:0,st_ino:4,st_mode:8,st_nlink:12,st_uid:16,st_gid:20,st_rdev:24,st_size:28,st_atime:32,st_spare1:36,st_mtime:40,st_spare2:44,st_ctime:48,st_spare3:52,st_blksize:56,st_blocks:60,st_spare4:64};function _stat(path, buf, dontResolveLastLink) {
      // http://pubs.opengroup.org/onlinepubs/7908799/xsh/stat.html
      // int stat(const char *path, struct stat *buf);
      // NOTE: dontResolveLastLink is a shortcut for lstat(). It should never be
      //       used in client code.
      var obj = FS.findObject(Pointer_stringify(path), dontResolveLastLink);
      if (obj === null || !FS.forceLoadFile(obj)) return -1;
      var offsets = ___stat_struct_layout;
      // Constants.
      HEAP32[(((buf)+(offsets.st_nlink))>>2)]=1
      HEAP32[(((buf)+(offsets.st_uid))>>2)]=0
      HEAP32[(((buf)+(offsets.st_gid))>>2)]=0
      HEAP32[(((buf)+(offsets.st_blksize))>>2)]=4096
      // Variables.
      HEAP32[(((buf)+(offsets.st_ino))>>2)]=obj.inodeNumber
      var time = Math.floor(obj.timestamp / 1000);
      if (offsets.st_atime === undefined) {
        offsets.st_atime = offsets.st_atim.tv_sec;
        offsets.st_mtime = offsets.st_mtim.tv_sec;
        offsets.st_ctime = offsets.st_ctim.tv_sec;
        var nanosec = (obj.timestamp % 1000) * 1000;
        HEAP32[(((buf)+(offsets.st_atim.tv_nsec))>>2)]=nanosec
        HEAP32[(((buf)+(offsets.st_mtim.tv_nsec))>>2)]=nanosec
        HEAP32[(((buf)+(offsets.st_ctim.tv_nsec))>>2)]=nanosec
      }
      HEAP32[(((buf)+(offsets.st_atime))>>2)]=time
      HEAP32[(((buf)+(offsets.st_mtime))>>2)]=time
      HEAP32[(((buf)+(offsets.st_ctime))>>2)]=time
      var mode = 0;
      var size = 0;
      var blocks = 0;
      var dev = 0;
      var rdev = 0;
      if (obj.isDevice) {
        //  Device numbers reuse inode numbers.
        dev = rdev = obj.inodeNumber;
        size = blocks = 0;
        mode = 0x2000;  // S_IFCHR.
      } else {
        dev = 1;
        rdev = 0;
        // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
        //       but this is not required by the standard.
        if (obj.isFolder) {
          size = 4096;
          blocks = 1;
          mode = 0x4000;  // S_IFDIR.
        } else {
          var data = obj.contents || obj.link;
          size = data.length;
          blocks = Math.ceil(data.length / 4096);
          mode = obj.link === undefined ? 0x8000 : 0xA000;  // S_IFREG, S_IFLNK.
        }
      }
      HEAP32[(((buf)+(offsets.st_dev))>>2)]=dev;
      HEAP32[(((buf)+(offsets.st_rdev))>>2)]=rdev;
      HEAP32[(((buf)+(offsets.st_size))>>2)]=size
      HEAP32[(((buf)+(offsets.st_blocks))>>2)]=blocks
      if (obj.read) mode |= 0x16D;  // S_IRUSR | S_IXUSR | S_IRGRP | S_IXGRP | S_IROTH | S_IXOTH.
      if (obj.write) mode |= 0x92;  // S_IWUSR | S_IWGRP | S_IWOTH.
      HEAP32[(((buf)+(offsets.st_mode))>>2)]=mode
      return 0;
    }
  function ___errno_location() {
      return ___setErrNo.ret;
    }var ___errno=___errno_location;
  function _fstat(fildes, buf) {
      // int fstat(int fildes, struct stat *buf);
      // http://pubs.opengroup.org/onlinepubs/7908799/xsh/fstat.html
      if (!FS.streams[fildes]) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else {
        var pathArray = intArrayFromString(FS.streams[fildes].path);
        return _stat(allocate(pathArray, 'i8', ALLOC_STACK), buf);
      }
    }
  function _fileno(stream) {
      // int fileno(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fileno.html
      // We use file descriptor numbers and FILE* streams interchangeably.
      return stream;
    }
  function _lseek(fildes, offset, whence) {
      // off_t lseek(int fildes, off_t offset, int whence);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/lseek.html
      if (FS.streams[fildes] && !FS.streams[fildes].object.isDevice) {
        var stream = FS.streams[fildes];
        var position = offset;
        if (whence === 1) {  // SEEK_CUR.
          position += stream.position;
        } else if (whence === 2) {  // SEEK_END.
          position += stream.object.contents.length;
        }
        if (position < 0) {
          ___setErrNo(ERRNO_CODES.EINVAL);
          return -1;
        } else {
          stream.ungotten = [];
          stream.position = position;
          return position;
        }
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }function _fseek(stream, offset, whence) {
      // int fseek(FILE *stream, long offset, int whence);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fseek.html
      var ret = _lseek(stream, offset, whence);
      if (ret == -1) {
        return -1;
      } else {
        FS.streams[stream].eof = false;
        return 0;
      }
    }
  function _strncpy(pdest, psrc, num) {
      pdest = pdest|0; psrc = psrc|0; num = num|0;
      var padding = 0, curr = 0, i = 0;
      while ((i|0) < (num|0)) {
        curr = padding ? 0 : HEAP8[(((psrc)+(i))|0)];
        HEAP8[(((pdest)+(i))|0)]=curr
        padding = padding ? 1 : (HEAP8[(((psrc)+(i))|0)] == 0);
        i = (i+1)|0;
      }
      return pdest|0;
    }
  function _pread(fildes, buf, nbyte, offset) {
      // ssize_t pread(int fildes, void *buf, size_t nbyte, off_t offset);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.streams[fildes];
      if (!stream || stream.object.isDevice) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isRead) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (stream.object.isFolder) {
        ___setErrNo(ERRNO_CODES.EISDIR);
        return -1;
      } else if (nbyte < 0 || offset < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        var bytesRead = 0;
        while (stream.ungotten.length && nbyte > 0) {
          HEAP8[((buf++)|0)]=stream.ungotten.pop()
          nbyte--;
          bytesRead++;
        }
        var contents = stream.object.contents;
        var size = Math.min(contents.length - offset, nbyte);
        if (contents.subarray) { // typed array
          HEAPU8.set(contents.subarray(offset, offset+size), buf);
        } else
        if (contents.slice) { // normal array
          for (var i = 0; i < size; i++) {
            HEAP8[(((buf)+(i))|0)]=contents[offset + i]
          }
        } else {
          for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
            HEAP8[(((buf)+(i))|0)]=contents.get(offset + i)
          }
        }
        bytesRead += size;
        return bytesRead;
      }
    }function _read(fildes, buf, nbyte) {
      // ssize_t read(int fildes, void *buf, size_t nbyte);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/read.html
      var stream = FS.streams[fildes];
      if (!stream) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      } else if (!stream.isRead) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else if (nbyte < 0) {
        ___setErrNo(ERRNO_CODES.EINVAL);
        return -1;
      } else {
        var bytesRead;
        if (stream.object.isDevice) {
          if (stream.object.input) {
            bytesRead = 0;
            while (stream.ungotten.length && nbyte > 0) {
              HEAP8[((buf++)|0)]=stream.ungotten.pop()
              nbyte--;
              bytesRead++;
            }
            for (var i = 0; i < nbyte; i++) {
              try {
                var result = stream.object.input();
              } catch (e) {
                ___setErrNo(ERRNO_CODES.EIO);
                return -1;
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              HEAP8[(((buf)+(i))|0)]=result
            }
            return bytesRead;
          } else {
            ___setErrNo(ERRNO_CODES.ENXIO);
            return -1;
          }
        } else {
          var ungotSize = stream.ungotten.length;
          bytesRead = _pread(fildes, buf, nbyte, stream.position);
          if (bytesRead != -1) {
            stream.position += (stream.ungotten.length - ungotSize) + bytesRead;
          }
          return bytesRead;
        }
      }
    }function _fread(ptr, size, nitems, stream) {
      // size_t fread(void *restrict ptr, size_t size, size_t nitems, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fread.html
      var bytesToRead = nitems * size;
      if (bytesToRead == 0) return 0;
      var bytesRead = _read(stream, ptr, bytesToRead);
      var streamObj = FS.streams[stream];
      if (bytesRead == -1) {
        if (streamObj) streamObj.error = true;
        return 0;
      } else {
        if (bytesRead < bytesToRead) streamObj.eof = true;
        return Math.floor(bytesRead / size);
      }
    }
  function _strrchr(ptr, chr) {
      var ptr2 = ptr + _strlen(ptr);
      do {
        if (HEAP8[(ptr2)] == chr) return ptr2;
        ptr2--;
      } while (ptr2 >= ptr);
      return 0;
    }
  function _unlink(path) {
      // int unlink(const char *path);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/unlink.html
      path = FS.analyzePath(Pointer_stringify(path));
      if (!path.parentExists || !path.exists) {
        ___setErrNo(path.error);
        return -1;
      } else if (path.object.isFolder) {
        ___setErrNo(ERRNO_CODES.EISDIR);
        return -1;
      } else if (!path.object.write) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return -1;
      } else {
        delete path.parentObject.contents[path.name];
        return 0;
      }
    }
  function _strncat(pdest, psrc, num) {
      var len = _strlen(pdest);
      var i = 0;
      while(1) {
        HEAP8[((pdest+len+i)|0)]=HEAP8[((psrc+i)|0)];
        if (HEAP8[(((pdest)+(len+i))|0)] == 0) break;
        i ++;
        if (i == num) {
          HEAP8[(((pdest)+(len+i))|0)]=0
          break;
        }
      }
      return pdest;
    }
  function _memcmp(p1, p2, num) {
      p1 = p1|0; p2 = p2|0; num = num|0;
      var i = 0, v1 = 0, v2 = 0;
      while ((i|0) < (num|0)) {
        var v1 = HEAPU8[(((p1)+(i))|0)];
        var v2 = HEAPU8[(((p2)+(i))|0)];
        if ((v1|0) != (v2|0)) return ((v1|0) > (v2|0) ? 1 : -1)|0;
        i = (i+1)|0;
      }
      return 0;
    }
  function _isprint(chr) {
      return 0x1F < chr && chr < 0x7F;
    }
  function _creat(path, mode) {
      // int creat(const char *path, mode_t mode);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/creat.html
      return _open(path, 1 | 512 | 1024, allocate([mode, 0, 0, 0], 'i32', ALLOC_STACK));
    }function _mkstemp(template) {
      if (!_mkstemp.counter) _mkstemp.counter = 0;
      var c = (_mkstemp.counter++).toString();
      var rep = 'XXXXXX';
      while (c.length < rep.length) c = '0' + c;
      writeArrayToMemory(intArrayFromString(c), template + Pointer_stringify(template).indexOf(rep));
      return _creat(template, 0600);
    }
  function _fdopen(fildes, mode) {
      // FILE *fdopen(int fildes, const char *mode);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fdopen.html
      if (FS.streams[fildes]) {
        var stream = FS.streams[fildes];
        mode = Pointer_stringify(mode);
        if ((mode.indexOf('w') != -1 && !stream.isWrite) ||
            (mode.indexOf('r') != -1 && !stream.isRead) ||
            (mode.indexOf('a') != -1 && !stream.isAppend) ||
            (mode.indexOf('+') != -1 && (!stream.isRead || !stream.isWrite))) {
          ___setErrNo(ERRNO_CODES.EINVAL);
          return 0;
        } else {
          stream.error = false;
          stream.eof = false;
          return fildes;
        }
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return 0;
      }
    }
  function __reallyNegative(x) {
      return x < 0 || (x === 0 && (1/x) === -Infinity);
    }function __formatString(format, varargs) {
      var textIndex = format;
      var argIndex = 0;
      function getNextArg(type) {
        // NOTE: Explicitly ignoring type safety. Otherwise this fails:
        //       int x = 4; printf("%c\n", (char)x);
        var ret;
        if (type === 'double') {
          ret = (HEAP32[((tempDoublePtr)>>2)]=HEAP32[(((varargs)+(argIndex))>>2)],HEAP32[(((tempDoublePtr)+(4))>>2)]=HEAP32[(((varargs)+((argIndex)+(4)))>>2)],HEAPF64[(tempDoublePtr)>>3]);
        } else if (type == 'i64') {
          ret = [HEAP32[(((varargs)+(argIndex))>>2)],
                 HEAP32[(((varargs)+(argIndex+4))>>2)]];
        } else {
          type = 'i32'; // varargs are always i32, i64, or double
          ret = HEAP32[(((varargs)+(argIndex))>>2)];
        }
        argIndex += Runtime.getNativeFieldSize(type);
        return ret;
      }
      var ret = [];
      var curr, next, currArg;
      while(1) {
        var startTextIndex = textIndex;
        curr = HEAP8[(textIndex)];
        if (curr === 0) break;
        next = HEAP8[((textIndex+1)|0)];
        if (curr == 37) {
          // Handle flags.
          var flagAlwaysSigned = false;
          var flagLeftAlign = false;
          var flagAlternative = false;
          var flagZeroPad = false;
          flagsLoop: while (1) {
            switch (next) {
              case 43:
                flagAlwaysSigned = true;
                break;
              case 45:
                flagLeftAlign = true;
                break;
              case 35:
                flagAlternative = true;
                break;
              case 48:
                if (flagZeroPad) {
                  break flagsLoop;
                } else {
                  flagZeroPad = true;
                  break;
                }
              default:
                break flagsLoop;
            }
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          }
          // Handle width.
          var width = 0;
          if (next == 42) {
            width = getNextArg('i32');
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
          } else {
            while (next >= 48 && next <= 57) {
              width = width * 10 + (next - 48);
              textIndex++;
              next = HEAP8[((textIndex+1)|0)];
            }
          }
          // Handle precision.
          var precisionSet = false;
          if (next == 46) {
            var precision = 0;
            precisionSet = true;
            textIndex++;
            next = HEAP8[((textIndex+1)|0)];
            if (next == 42) {
              precision = getNextArg('i32');
              textIndex++;
            } else {
              while(1) {
                var precisionChr = HEAP8[((textIndex+1)|0)];
                if (precisionChr < 48 ||
                    precisionChr > 57) break;
                precision = precision * 10 + (precisionChr - 48);
                textIndex++;
              }
            }
            next = HEAP8[((textIndex+1)|0)];
          } else {
            var precision = 6; // Standard default.
          }
          // Handle integer sizes. WARNING: These assume a 32-bit architecture!
          var argSize;
          switch (String.fromCharCode(next)) {
            case 'h':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 104) {
                textIndex++;
                argSize = 1; // char (actually i32 in varargs)
              } else {
                argSize = 2; // short (actually i32 in varargs)
              }
              break;
            case 'l':
              var nextNext = HEAP8[((textIndex+2)|0)];
              if (nextNext == 108) {
                textIndex++;
                argSize = 8; // long long
              } else {
                argSize = 4; // long
              }
              break;
            case 'L': // long long
            case 'q': // int64_t
            case 'j': // intmax_t
              argSize = 8;
              break;
            case 'z': // size_t
            case 't': // ptrdiff_t
            case 'I': // signed ptrdiff_t or unsigned size_t
              argSize = 4;
              break;
            default:
              argSize = null;
          }
          if (argSize) textIndex++;
          next = HEAP8[((textIndex+1)|0)];
          // Handle type specifier.
          switch (String.fromCharCode(next)) {
            case 'd': case 'i': case 'u': case 'o': case 'x': case 'X': case 'p': {
              // Integer.
              var signed = next == 100 || next == 105;
              argSize = argSize || 4;
              var currArg = getNextArg('i' + (argSize * 8));
              var origArg = currArg;
              var argText;
              // Flatten i64-1 [low, high] into a (slightly rounded) double
              if (argSize == 8) {
                currArg = Runtime.makeBigInt(currArg[0], currArg[1], next == 117);
              }
              // Truncate to requested size.
              if (argSize <= 4) {
                var limit = Math.pow(256, argSize) - 1;
                currArg = (signed ? reSign : unSign)(currArg & limit, argSize * 8);
              }
              // Format the number.
              var currAbsArg = Math.abs(currArg);
              var prefix = '';
              if (next == 100 || next == 105) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], null); else
                argText = reSign(currArg, 8 * argSize, 1).toString(10);
              } else if (next == 117) {
                if (argSize == 8 && i64Math) argText = i64Math.stringify(origArg[0], origArg[1], true); else
                argText = unSign(currArg, 8 * argSize, 1).toString(10);
                currArg = Math.abs(currArg);
              } else if (next == 111) {
                argText = (flagAlternative ? '0' : '') + currAbsArg.toString(8);
              } else if (next == 120 || next == 88) {
                prefix = flagAlternative ? '0x' : '';
                if (argSize == 8 && i64Math) {
                  if (origArg[1]) {
                    argText = (origArg[1]>>>0).toString(16);
                    var lower = (origArg[0]>>>0).toString(16);
                    while (lower.length < 8) lower = '0' + lower;
                    argText += lower;
                  } else {
                    argText = (origArg[0]>>>0).toString(16);
                  }
                } else
                if (currArg < 0) {
                  // Represent negative numbers in hex as 2's complement.
                  currArg = -currArg;
                  argText = (currAbsArg - 1).toString(16);
                  var buffer = [];
                  for (var i = 0; i < argText.length; i++) {
                    buffer.push((0xF - parseInt(argText[i], 16)).toString(16));
                  }
                  argText = buffer.join('');
                  while (argText.length < argSize * 2) argText = 'f' + argText;
                } else {
                  argText = currAbsArg.toString(16);
                }
                if (next == 88) {
                  prefix = prefix.toUpperCase();
                  argText = argText.toUpperCase();
                }
              } else if (next == 112) {
                if (currAbsArg === 0) {
                  argText = '(nil)';
                } else {
                  prefix = '0x';
                  argText = currAbsArg.toString(16);
                }
              }
              if (precisionSet) {
                while (argText.length < precision) {
                  argText = '0' + argText;
                }
              }
              // Add sign if needed
              if (flagAlwaysSigned) {
                if (currArg < 0) {
                  prefix = '-' + prefix;
                } else {
                  prefix = '+' + prefix;
                }
              }
              // Add padding.
              while (prefix.length + argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad) {
                    argText = '0' + argText;
                  } else {
                    prefix = ' ' + prefix;
                  }
                }
              }
              // Insert the result into the buffer.
              argText = prefix + argText;
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 'f': case 'F': case 'e': case 'E': case 'g': case 'G': {
              // Float.
              var currArg = getNextArg('double');
              var argText;
              if (isNaN(currArg)) {
                argText = 'nan';
                flagZeroPad = false;
              } else if (!isFinite(currArg)) {
                argText = (currArg < 0 ? '-' : '') + 'inf';
                flagZeroPad = false;
              } else {
                var isGeneral = false;
                var effectivePrecision = Math.min(precision, 20);
                // Convert g/G to f/F or e/E, as per:
                // http://pubs.opengroup.org/onlinepubs/9699919799/functions/printf.html
                if (next == 103 || next == 71) {
                  isGeneral = true;
                  precision = precision || 1;
                  var exponent = parseInt(currArg.toExponential(effectivePrecision).split('e')[1], 10);
                  if (precision > exponent && exponent >= -4) {
                    next = ((next == 103) ? 'f' : 'F').charCodeAt(0);
                    precision -= exponent + 1;
                  } else {
                    next = ((next == 103) ? 'e' : 'E').charCodeAt(0);
                    precision--;
                  }
                  effectivePrecision = Math.min(precision, 20);
                }
                if (next == 101 || next == 69) {
                  argText = currArg.toExponential(effectivePrecision);
                  // Make sure the exponent has at least 2 digits.
                  if (/[eE][-+]\d$/.test(argText)) {
                    argText = argText.slice(0, -1) + '0' + argText.slice(-1);
                  }
                } else if (next == 102 || next == 70) {
                  argText = currArg.toFixed(effectivePrecision);
                  if (currArg === 0 && __reallyNegative(currArg)) {
                    argText = '-' + argText;
                  }
                }
                var parts = argText.split('e');
                if (isGeneral && !flagAlternative) {
                  // Discard trailing zeros and periods.
                  while (parts[0].length > 1 && parts[0].indexOf('.') != -1 &&
                         (parts[0].slice(-1) == '0' || parts[0].slice(-1) == '.')) {
                    parts[0] = parts[0].slice(0, -1);
                  }
                } else {
                  // Make sure we have a period in alternative mode.
                  if (flagAlternative && argText.indexOf('.') == -1) parts[0] += '.';
                  // Zero pad until required precision.
                  while (precision > effectivePrecision++) parts[0] += '0';
                }
                argText = parts[0] + (parts.length > 1 ? 'e' + parts[1] : '');
                // Capitalize 'E' if needed.
                if (next == 69) argText = argText.toUpperCase();
                // Add sign.
                if (flagAlwaysSigned && currArg >= 0) {
                  argText = '+' + argText;
                }
              }
              // Add padding.
              while (argText.length < width) {
                if (flagLeftAlign) {
                  argText += ' ';
                } else {
                  if (flagZeroPad && (argText[0] == '-' || argText[0] == '+')) {
                    argText = argText[0] + '0' + argText.slice(1);
                  } else {
                    argText = (flagZeroPad ? '0' : ' ') + argText;
                  }
                }
              }
              // Adjust case.
              if (next < 97) argText = argText.toUpperCase();
              // Insert the result into the buffer.
              argText.split('').forEach(function(chr) {
                ret.push(chr.charCodeAt(0));
              });
              break;
            }
            case 's': {
              // String.
              var arg = getNextArg('i8*') || nullString;
              var argLength = _strlen(arg);
              if (precisionSet) argLength = Math.min(argLength, precision);
              if (!flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              for (var i = 0; i < argLength; i++) {
                ret.push(HEAPU8[((arg++)|0)]);
              }
              if (flagLeftAlign) {
                while (argLength < width--) {
                  ret.push(32);
                }
              }
              break;
            }
            case 'c': {
              // Character.
              if (flagLeftAlign) ret.push(getNextArg('i8'));
              while (--width > 0) {
                ret.push(32);
              }
              if (!flagLeftAlign) ret.push(getNextArg('i8'));
              break;
            }
            case 'n': {
              // Write the length written so far to the next parameter.
              var ptr = getNextArg('i32*');
              HEAP32[((ptr)>>2)]=ret.length
              break;
            }
            case '%': {
              // Literal percent sign.
              ret.push(curr);
              break;
            }
            default: {
              // Unknown specifiers remain untouched.
              for (var i = startTextIndex; i < textIndex + 2; i++) {
                ret.push(HEAP8[(i)]);
              }
            }
          }
          textIndex += 2;
          // TODO: Support a/A (hex float) and m (last error) specifiers.
          // TODO: Support %1${specifier} for arg selection.
        } else {
          ret.push(curr);
          textIndex += 1;
        }
      }
      return ret;
    }function _snprintf(s, n, format, varargs) {
      // int snprintf(char *restrict s, size_t n, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var limit = (n === undefined) ? result.length
                                    : Math.min(result.length, Math.max(n - 1, 0));
      if (s < 0) {
        s = -s;
        var buf = _malloc(limit+1);
        HEAP32[((s)>>2)]=buf;
        s = buf;
      }
      for (var i = 0; i < limit; i++) {
        HEAP8[(((s)+(i))|0)]=result[i];
      }
      if (limit < n || (n === undefined)) HEAP8[(((s)+(i))|0)]=0;
      return result.length;
    }
  var ___strtok_state=0;
  function _strtok_r(s, delim, lasts) {
      var skip_leading_delim = 1;
      var spanp;
      var c, sc;
      var tok;
      if (s == 0 && (s = getValue(lasts, 'i8*')) == 0) {
        return 0;
      }
      cont: while (1) {
        c = getValue(s++, 'i8');
        for (spanp = delim; (sc = getValue(spanp++, 'i8')) != 0;) {
          if (c == sc) {
            if (skip_leading_delim) {
              continue cont;
            } else {
              setValue(lasts, s, 'i8*');
              setValue(s - 1, 0, 'i8');
              return s - 1;
            }
          }
        }
        break;
      }
      if (c == 0) {
        setValue(lasts, 0, 'i8*');
        return 0;
      }
      tok = s - 1;
      for (;;) {
        c = getValue(s++, 'i8');
        spanp = delim;
        do {
          if ((sc = getValue(spanp++, 'i8')) == c) {
            if (c == 0) {
              s = 0;
            } else {
              setValue(s - 1, 0, 'i8');
            }
            setValue(lasts, s, 'i8*');
            return tok;
          }
        } while (sc != 0);
      }
      abort('strtok_r error!');
    }function _strtok(s, delim) {
      return _strtok_r(s, delim, ___strtok_state);
    }
  function _ftell(stream) {
      // long ftell(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/ftell.html
      if (FS.streams[stream]) {
        stream = FS.streams[stream];
        if (stream.object.isDevice) {
          ___setErrNo(ERRNO_CODES.ESPIPE);
          return -1;
        } else {
          return stream.position;
        }
      } else {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
    }
  function _feof(stream) {
      // int feof(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/feof.html
      return Number(FS.streams[stream] && FS.streams[stream].eof);
    }
  function _opendir(dirname) {
      // DIR *opendir(const char *dirname);
      // http://pubs.opengroup.org/onlinepubs/007908799/xsh/opendir.html
      // NOTE: Calculating absolute path redundantly since we need to associate it
      //       with the opened stream.
      var path = FS.absolutePath(Pointer_stringify(dirname));
      if (path === null) {
        ___setErrNo(ERRNO_CODES.ENOENT);
        return 0;
      }
      var target = FS.findObject(path);
      if (target === null) return 0;
      if (!target.isFolder) {
        ___setErrNo(ERRNO_CODES.ENOTDIR);
        return 0;
      } else if (!target.read) {
        ___setErrNo(ERRNO_CODES.EACCES);
        return 0;
      }
      var id = FS.streams.length; // Keep dense
      var contents = [];
      for (var key in target.contents) contents.push(key);
      FS.streams[id] = {
        path: path,
        object: target,
        // An index into contents. Special values: -2 is ".", -1 is "..".
        position: -2,
        isRead: true,
        isWrite: false,
        isAppend: false,
        error: false,
        eof: false,
        ungotten: [],
        // Folder-specific properties:
        // Remember the contents at the time of opening in an array, so we can
        // seek between them relying on a single order.
        contents: contents,
        // Each stream has its own area for readdir() returns.
        currentEntry: _malloc(___dirent_struct_layout.__size__)
      };
      return id;
    }
  function _readdir_r(dirp, entry, result) {
      // int readdir_r(DIR *dirp, struct dirent *entry, struct dirent **result);
      // http://pubs.opengroup.org/onlinepubs/007908799/xsh/readdir_r.html
      if (!FS.streams[dirp] || !FS.streams[dirp].object.isFolder) {
        return ___setErrNo(ERRNO_CODES.EBADF);
      }
      var stream = FS.streams[dirp];
      var loc = stream.position;
      var entries = 0;
      for (var key in stream.contents) entries++;
      if (loc < -2 || loc >= entries) {
        HEAP32[((result)>>2)]=0
      } else {
        var name, inode, type;
        if (loc === -2) {
          name = '.';
          inode = 1;  // Really undefined.
          type = 4; //DT_DIR
        } else if (loc === -1) {
          name = '..';
          inode = 1;  // Really undefined.
          type = 4; //DT_DIR
        } else {
          var object;
          name = stream.contents[loc];
          object = stream.object.contents[name];
          inode = object.inodeNumber;
          type = object.isDevice ? 2 // DT_CHR, character device.
                : object.isFolder ? 4 // DT_DIR, directory.
                : object.link !== undefined ? 10 // DT_LNK, symbolic link.
                : 8; // DT_REG, regular file.
        }
        stream.position++;
        var offsets = ___dirent_struct_layout;
        HEAP32[(((entry)+(offsets.d_ino))>>2)]=inode
        HEAP32[(((entry)+(offsets.d_off))>>2)]=stream.position
        HEAP32[(((entry)+(offsets.d_reclen))>>2)]=name.length + 1
        for (var i = 0; i < name.length; i++) {
          HEAP8[(((entry + offsets.d_name)+(i))|0)]=name.charCodeAt(i)
        }
        HEAP8[(((entry + offsets.d_name)+(i))|0)]=0
        HEAP8[(((entry)+(offsets.d_type))|0)]=type
        HEAP32[((result)>>2)]=entry
      }
      return 0;
    }function _readdir(dirp) {
      // struct dirent *readdir(DIR *dirp);
      // http://pubs.opengroup.org/onlinepubs/007908799/xsh/readdir_r.html
      if (!FS.streams[dirp] || !FS.streams[dirp].object.isFolder) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return 0;
      } else {
        if (!_readdir.result) _readdir.result = _malloc(4);
        _readdir_r(dirp, FS.streams[dirp].currentEntry, _readdir.result);
        if (HEAP32[((_readdir.result)>>2)] === 0) {
          return 0;
        } else {
          return FS.streams[dirp].currentEntry;
        }
      }
    }
  function _tolower(chr) {
      chr = chr|0;
      if ((chr|0) < 65) return chr|0;
      if ((chr|0) > 90) return chr|0;
      return (chr - 65 + 97)|0;
    }function _strncasecmp(px, py, n) {
      px = px|0; py = py|0; n = n|0;
      var i = 0, x = 0, y = 0;
      while ((i>>>0) < (n>>>0)) {
        x = _tolower(HEAP8[(((px)+(i))|0)]);
        y = _tolower(HEAP8[(((py)+(i))|0)]);
        if (((x|0) == (y|0)) & ((x|0) == 0)) return 0;
        if ((x|0) == 0) return -1;
        if ((y|0) == 0) return 1;
        if ((x|0) == (y|0)) {
          i = (i + 1)|0;
          continue;
        } else {
          return ((x>>>0) > (y>>>0) ? 1 : -1)|0;
        }
      }
      return 0;
    }function _strcasecmp(px, py) {
      px = px|0; py = py|0;
      return _strncasecmp(px, py, -1)|0;
    }
  function _closedir(dirp) {
      // int closedir(DIR *dirp);
      // http://pubs.opengroup.org/onlinepubs/007908799/xsh/closedir.html
      if (!FS.streams[dirp] || !FS.streams[dirp].object.isFolder) {
        return ___setErrNo(ERRNO_CODES.EBADF);
      } else {
        _free(FS.streams[dirp].currentEntry);
        FS.streams[dirp] = null;
        return 0;
      }
    }
  var _environ=allocate(1, "i32*", ALLOC_STACK);var ___environ=_environ;function ___buildEnvironment(env) {
      // WARNING: Arbitrary limit!
      var MAX_ENV_VALUES = 64;
      var TOTAL_ENV_SIZE = 1024;
      // Statically allocate memory for the environment.
      var poolPtr;
      var envPtr;
      if (!___buildEnvironment.called) {
        ___buildEnvironment.called = true;
        // Set default values. Use string keys for Closure Compiler compatibility.
        ENV['USER'] = 'root';
        ENV['PATH'] = '/';
        ENV['PWD'] = '/';
        ENV['HOME'] = '/home/emscripten';
        ENV['LANG'] = 'en_US.UTF-8';
        ENV['_'] = './this.program';
        // Allocate memory.
        poolPtr = allocate(TOTAL_ENV_SIZE, 'i8', ALLOC_STATIC);
        envPtr = allocate(MAX_ENV_VALUES * 4,
                          'i8*', ALLOC_STATIC);
        HEAP32[((envPtr)>>2)]=poolPtr
        HEAP32[((_environ)>>2)]=envPtr;
      } else {
        envPtr = HEAP32[((_environ)>>2)];
        poolPtr = HEAP32[((envPtr)>>2)];
      }
      // Collect key=value lines.
      var strings = [];
      var totalSize = 0;
      for (var key in env) {
        if (typeof env[key] === 'string') {
          var line = key + '=' + env[key];
          strings.push(line);
          totalSize += line.length;
        }
      }
      if (totalSize > TOTAL_ENV_SIZE) {
        throw new Error('Environment size exceeded TOTAL_ENV_SIZE!');
      }
      // Make new.
      var ptrSize = 4;
      for (var i = 0; i < strings.length; i++) {
        var line = strings[i];
        for (var j = 0; j < line.length; j++) {
          HEAP8[(((poolPtr)+(j))|0)]=line.charCodeAt(j);
        }
        HEAP8[(((poolPtr)+(j))|0)]=0;
        HEAP32[(((envPtr)+(i * ptrSize))>>2)]=poolPtr;
        poolPtr += line.length + 1;
      }
      HEAP32[(((envPtr)+(strings.length * ptrSize))>>2)]=0;
    }var ENV={};function _getenv(name) {
      // char *getenv(const char *name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/getenv.html
      if (name === 0) return 0;
      name = Pointer_stringify(name);
      if (!ENV.hasOwnProperty(name)) return 0;
      if (_getenv.ret) _free(_getenv.ret);
      _getenv.ret = allocate(intArrayFromString(ENV[name]), 'i8', ALLOC_NORMAL);
      return _getenv.ret;
    }
  var _vsnprintf=_snprintf;
  function _llvm_va_end() {}
  function ___assert_func(filename, line, func, condition) {
      throw 'Assertion failed: ' + (condition ? Pointer_stringify(condition) : 'unknown condition') + ', at: ' + [filename ? Pointer_stringify(filename) : 'unknown filename', line, func ? Pointer_stringify(func) : 'unknown function'] + ' at ' + new Error().stack;
    }
  function _rand() {
      return Math.floor(Math.random()*0x80000000);
    }
  function _fprintf(stream, format, varargs) {
      // int fprintf(FILE *restrict stream, const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var result = __formatString(format, varargs);
      var stack = Runtime.stackSave();
      var ret = _fwrite(allocate(result, 'i8', ALLOC_STACK), 1, result.length, stream);
      Runtime.stackRestore(stack);
      return ret;
    }function _printf(format, varargs) {
      // int printf(const char *restrict format, ...);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/printf.html
      var stdout = HEAP32[((_stdout)>>2)];
      return _fprintf(stdout, format, varargs);
    }
  function _memmove(dest, src, num) {
      dest = dest|0; src = src|0; num = num|0;
      if (((src|0) < (dest|0)) & ((dest|0) < ((src + num)|0))) {
        // Unlikely case: Copy backwards in a safe manner
        src = (src + num)|0;
        dest = (dest + num)|0;
        while ((num|0) > 0) {
          dest = (dest - 1)|0;
          src = (src - 1)|0;
          num = (num - 1)|0;
          HEAP8[(dest)]=HEAP8[(src)];
        }
      } else {
        _memcpy(dest, src, num);
      }
    }var _llvm_memmove_p0i8_p0i8_i32=_memmove;
  var ___tm_struct_layout={__size__:44,tm_sec:0,tm_min:4,tm_hour:8,tm_mday:12,tm_mon:16,tm_year:20,tm_wday:24,tm_yday:28,tm_isdst:32,tm_gmtoff:36,tm_zone:40};
  var ___tm_timezones={};
  var __tzname=allocate(8, "i32*", ALLOC_STACK);
  var __daylight=allocate(1, "i32*", ALLOC_STACK);
  var __timezone=allocate(1, "i32*", ALLOC_STACK);function _tzset() {
      // TODO: Use (malleable) environment variables instead of system settings.
      if (_tzset.called) return;
      _tzset.called = true;
      HEAP32[((__timezone)>>2)]=-(new Date()).getTimezoneOffset() * 60
      var winter = new Date(2000, 0, 1);
      var summer = new Date(2000, 6, 1);
      HEAP32[((__daylight)>>2)]=Number(winter.getTimezoneOffset() != summer.getTimezoneOffset())
      var winterName = 'GMT'; // XXX do not rely on browser timezone info, it is very unpredictable | winter.toString().match(/\(([A-Z]+)\)/)[1];
      var summerName = 'GMT'; // XXX do not rely on browser timezone info, it is very unpredictable | summer.toString().match(/\(([A-Z]+)\)/)[1];
      var winterNamePtr = allocate(intArrayFromString(winterName), 'i8', ALLOC_NORMAL);
      var summerNamePtr = allocate(intArrayFromString(summerName), 'i8', ALLOC_NORMAL);
      HEAP32[((__tzname)>>2)]=winterNamePtr
      HEAP32[(((__tzname)+(4))>>2)]=summerNamePtr
    }function _localtime_r(time, tmPtr) {
      _tzset();
      var offsets = ___tm_struct_layout;
      var date = new Date(HEAP32[((time)>>2)]*1000);
      HEAP32[(((tmPtr)+(offsets.tm_sec))>>2)]=date.getSeconds()
      HEAP32[(((tmPtr)+(offsets.tm_min))>>2)]=date.getMinutes()
      HEAP32[(((tmPtr)+(offsets.tm_hour))>>2)]=date.getHours()
      HEAP32[(((tmPtr)+(offsets.tm_mday))>>2)]=date.getDate()
      HEAP32[(((tmPtr)+(offsets.tm_mon))>>2)]=date.getMonth()
      HEAP32[(((tmPtr)+(offsets.tm_year))>>2)]=date.getFullYear()-1900
      HEAP32[(((tmPtr)+(offsets.tm_wday))>>2)]=date.getDay()
      var start = new Date(date.getFullYear(), 0, 1);
      var yday = Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      HEAP32[(((tmPtr)+(offsets.tm_yday))>>2)]=yday
      HEAP32[(((tmPtr)+(offsets.tm_gmtoff))>>2)]=start.getTimezoneOffset() * 60
      var dst = Number(start.getTimezoneOffset() != date.getTimezoneOffset());
      HEAP32[(((tmPtr)+(offsets.tm_isdst))>>2)]=dst
      var timezone = 'GMT'; // XXX do not rely on browser timezone info, it is very unpredictable | date.toString().match(/\(([A-Z]+)\)/)[1];
      if (!(timezone in ___tm_timezones)) {
        ___tm_timezones[timezone] = allocate(intArrayFromString(timezone), 'i8', ALLOC_NORMAL);
      }
      HEAP32[(((tmPtr)+(offsets.tm_zone))>>2)]=___tm_timezones[timezone]
      return tmPtr;
    }
  function _strchr(ptr, chr) {
      ptr--;
      do {
        ptr++;
        var val = HEAP8[(ptr)];
        if (val == chr) return ptr;
      } while (val);
      return 0;
    }
  var ___flock_struct_layout={__size__:16,l_type:0,l_whence:2,l_start:4,l_len:8,l_pid:12,l_xxx:14};function _fcntl(fildes, cmd, varargs, dup2) {
      // int fcntl(int fildes, int cmd, ...);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/fcntl.html
      if (!FS.streams[fildes]) {
        ___setErrNo(ERRNO_CODES.EBADF);
        return -1;
      }
      var stream = FS.streams[fildes];
      switch (cmd) {
        case 0:
          var arg = HEAP32[((varargs)>>2)];
          if (arg < 0) {
            ___setErrNo(ERRNO_CODES.EINVAL);
            return -1;
          }
          var newStream = {};
          for (var member in stream) {
            newStream[member] = stream[member];
          }
          arg = dup2 ? arg : Math.max(arg, FS.streams.length); // dup2 wants exactly arg; fcntl wants a free descriptor >= arg
          for (var i = FS.streams.length; i < arg; i++) {
            FS.streams[i] = null; // Keep dense
          }
          FS.streams[arg] = newStream;
          return arg;
        case 1:
        case 2:
          return 0;  // FD_CLOEXEC makes no sense for a single process.
        case 3:
          var flags = 0;
          if (stream.isRead && stream.isWrite) flags = 2;
          else if (!stream.isRead && stream.isWrite) flags = 1;
          else if (stream.isRead && !stream.isWrite) flags = 0;
          if (stream.isAppend) flags |= 8;
          // Synchronization and blocking flags are irrelevant to us.
          return flags;
        case 4:
          var arg = HEAP32[((varargs)>>2)];
          stream.isAppend = Boolean(arg | 8);
          // Synchronization and blocking flags are irrelevant to us.
          return 0;
        case 7:
        case 20:
          var arg = HEAP32[((varargs)>>2)];
          var offset = ___flock_struct_layout.l_type;
          // We're always unlocked.
          HEAP16[(((arg)+(offset))>>1)]=3
          return 0;
        case 8:
        case 9:
        case 21:
        case 22:
          // Pretend that the locking is successful.
          return 0;
        case 6:
        case 5:
          // These are for sockets. We don't have them fully implemented yet.
          ___setErrNo(ERRNO_CODES.EINVAL);
          return -1;
        default:
          ___setErrNo(ERRNO_CODES.EINVAL);
          return -1;
      }
      // Should never be reached. Only to silence strict warnings.
      return -1;
    }function _dup(fildes) {
      // int dup(int fildes);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/dup.html
      return _fcntl(fildes, 0, allocate([0, 0, 0, 0], 'i32', ALLOC_STACK));  // F_DUPFD.
    }
  function _fputs(s, stream) {
      // int fputs(const char *restrict s, FILE *restrict stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputs.html
      return _write(stream, s, _strlen(s));
    }
  function _fputc(c, stream) {
      // int fputc(int c, FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fputc.html
      var chr = unSign(c & 0xFF);
      HEAP8[((_fputc.ret)|0)]=chr
      var ret = _write(stream, _fputc.ret, 1);
      if (ret == -1) {
        if (FS.streams[stream]) FS.streams[stream].error = true;
        return -1;
      } else {
        return chr;
      }
    }function _puts(s) {
      // int puts(const char *s);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/puts.html
      // NOTE: puts() always writes an extra newline.
      var stdout = HEAP32[((_stdout)>>2)];
      var ret = _fputs(s, stdout);
      if (ret < 0) {
        return ret;
      } else {
        var newlineRet = _fputc(10, stdout);
        return (newlineRet < 0) ? -1 : ret + 1;
      }
    }
  var ERRNO_MESSAGES={1:"Operation not permitted",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"Input/output error",6:"No such device or address",8:"Exec format error",9:"Bad file descriptor",10:"No child processes",11:"Resource temporarily unavailable",12:"Cannot allocate memory",13:"Permission denied",14:"Bad address",16:"Device or resource busy",17:"File exists",18:"Invalid cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Inappropriate ioctl for device",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read-only file system",31:"Too many links",32:"Broken pipe",33:"Numerical argument out of domain",34:"Numerical result out of range",35:"Resource deadlock avoided",36:"File name too long",37:"No locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many levels of symbolic links",42:"No message of desired type",43:"Identifier removed",60:"Device not a stream",61:"No data available",62:"Timer expired",63:"Out of streams resources",67:"Link has been severed",71:"Protocol error",72:"Multihop attempted",74:"Bad message",75:"Value too large for defined data type",84:"Invalid or incomplete multibyte or wide character",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Protocol not supported",95:"Operation not supported",97:"Address family not supported by protocol",98:"Address already in use",99:"Cannot assign requested address",100:"Network is down",101:"Network is unreachable",102:"Network dropped connection on reset",103:"Software caused connection abort",104:"Connection reset by peer",105:"No buffer space available",106:"Transport endpoint is already connected",107:"Transport endpoint is not connected",110:"Connection timed out",111:"Connection refused",113:"No route to host",114:"Operation already in progress",115:"Operation now in progress",116:"Stale NFS file handle",122:"Disk quota exceeded",125:"Operation canceled",130:"Owner died",131:"State not recoverable"};function _strerror_r(errnum, strerrbuf, buflen) {
      if (errnum in ERRNO_MESSAGES) {
        if (ERRNO_MESSAGES[errnum].length > buflen - 1) {
          return ___setErrNo(ERRNO_CODES.ERANGE);
        } else {
          var msg = ERRNO_MESSAGES[errnum];
          for (var i = 0; i < msg.length; i++) {
            HEAP8[(((strerrbuf)+(i))|0)]=msg.charCodeAt(i)
          }
          HEAP8[(((strerrbuf)+(i))|0)]=0
          return 0;
        }
      } else {
        return ___setErrNo(ERRNO_CODES.EINVAL);
      }
    }function _strerror(errnum) {
      if (!_strerror.buffer) _strerror.buffer = _malloc(256);
      _strerror_r(errnum, _strerror.buffer, 256);
      return _strerror.buffer;
    }function _perror(s) {
      // void perror(const char *s);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/perror.html
      var stdout = HEAP32[((_stdout)>>2)];
      if (s) {
        _fputs(s, stdout);
        _fputc(58, stdout);
        _fputc(32, stdout);
      }
      var errnum = HEAP32[((___errno_location())>>2)];
      _puts(_strerror(errnum));
    }
  function _qsort(base, num, size, cmp) {
      if (num == 0 || size == 0) return;
      // forward calls to the JavaScript sort method
      // first, sort the items logically
      var comparator = function(x, y) {
        return Runtime.dynCall('iii', cmp, [x, y]);
      }
      var keys = [];
      for (var i = 0; i < num; i++) keys.push(i);
      keys.sort(function(a, b) {
        return comparator(base+a*size, base+b*size);
      });
      // apply the sort
      var temp = _malloc(num*size);
      _memcpy(temp, base, num*size);
      for (var i = 0; i < num; i++) {
        if (keys[i] == i) continue; // already in place
        _memcpy(base+i*size, temp+keys[i]*size, size);
      }
      _free(temp);
    }
  var _llvm_pow_f64=Math.pow;
  function _round(x) {
      return (x < 0) ? -Math.round(-x) : Math.round(x);
    }
  var _log=Math.log;
  var _sin=Math.sin;
  function _fgetc(stream) {
      // int fgetc(FILE *stream);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/fgetc.html
      if (!FS.streams[stream]) return -1;
      var streamObj = FS.streams[stream];
      if (streamObj.eof || streamObj.error) return -1;
      var ret = _read(stream, _fgetc.ret, 1);
      if (ret == 0) {
        streamObj.eof = true;
        return -1;
      } else if (ret == -1) {
        streamObj.error = true;
        return -1;
      } else {
        return HEAPU8[((_fgetc.ret)|0)];
      }
    }
  function _log10(x) {
      return Math.log(x) / Math.LN10;
    }
  function __ZNSt9exceptionD2Ev(){}
  var _llvm_memset_p0i8_i64=_memset;
  function _abort() {
      ABORT = true;
      throw 'abort() at ' + (new Error().stack);
    }
  function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 8: return PAGE_SIZE;
        case 54:
        case 56:
        case 21:
        case 61:
        case 63:
        case 22:
        case 67:
        case 23:
        case 24:
        case 25:
        case 26:
        case 27:
        case 69:
        case 28:
        case 101:
        case 70:
        case 71:
        case 29:
        case 30:
        case 199:
        case 75:
        case 76:
        case 32:
        case 43:
        case 44:
        case 80:
        case 46:
        case 47:
        case 45:
        case 48:
        case 49:
        case 42:
        case 82:
        case 33:
        case 7:
        case 108:
        case 109:
        case 107:
        case 112:
        case 119:
        case 121:
          return 200809;
        case 13:
        case 104:
        case 94:
        case 95:
        case 34:
        case 35:
        case 77:
        case 81:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
        case 91:
        case 94:
        case 95:
        case 110:
        case 111:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 120:
        case 40:
        case 16:
        case 79:
        case 19:
          return -1;
        case 92:
        case 93:
        case 5:
        case 72:
        case 6:
        case 74:
        case 92:
        case 93:
        case 96:
        case 97:
        case 98:
        case 99:
        case 102:
        case 103:
        case 105:
          return 1;
        case 38:
        case 66:
        case 50:
        case 51:
        case 4:
          return 1024;
        case 15:
        case 64:
        case 41:
          return 32;
        case 55:
        case 37:
        case 17:
          return 2147483647;
        case 18:
        case 1:
          return 47839;
        case 59:
        case 57:
          return 99;
        case 68:
        case 58:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 14: return 32768;
        case 73: return 32767;
        case 39: return 16384;
        case 60: return 1000;
        case 106: return 700;
        case 52: return 256;
        case 62: return 255;
        case 2: return 100;
        case 65: return 64;
        case 36: return 20;
        case 100: return 16;
        case 20: return 6;
        case 53: return 4;
        case 10: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We need to make sure no one else allocates unfreeable memory!
      // We must control this entirely. So we don't even need to do
      // unfreeable allocations - the HEAP is ours, from STATICTOP up.
      // TODO: We could in theory slice off the top of the HEAP when
      //       sbrk gets a negative increment in |bytes|...
      var self = _sbrk;
      if (!self.called) {
        STATICTOP = alignMemoryPage(STATICTOP); // make sure we start out aligned
        self.called = true;
        _sbrk.DYNAMIC_START = STATICTOP;
      }
      var ret = STATICTOP;
      if (bytes != 0) Runtime.staticAlloc(bytes);
      return ret;  // Previous break location.
    }
  function ___cxa_allocate_exception(size) {
      return _malloc(size);
    }
  function _llvm_eh_exception() {
      return HEAP32[((_llvm_eh_exception.buf)>>2)];
    }
  function __ZSt18uncaught_exceptionv() { // std::uncaught_exception()
      return !!__ZSt18uncaught_exceptionv.uncaught_exception;
    }
  function ___cxa_is_number_type(type) {
      var isNumber = false;
      try { if (type == __ZTIi) isNumber = true } catch(e){}
      try { if (type == __ZTIj) isNumber = true } catch(e){}
      try { if (type == __ZTIl) isNumber = true } catch(e){}
      try { if (type == __ZTIm) isNumber = true } catch(e){}
      try { if (type == __ZTIx) isNumber = true } catch(e){}
      try { if (type == __ZTIy) isNumber = true } catch(e){}
      try { if (type == __ZTIf) isNumber = true } catch(e){}
      try { if (type == __ZTId) isNumber = true } catch(e){}
      try { if (type == __ZTIe) isNumber = true } catch(e){}
      try { if (type == __ZTIc) isNumber = true } catch(e){}
      try { if (type == __ZTIa) isNumber = true } catch(e){}
      try { if (type == __ZTIh) isNumber = true } catch(e){}
      try { if (type == __ZTIs) isNumber = true } catch(e){}
      try { if (type == __ZTIt) isNumber = true } catch(e){}
      return isNumber;
    }function ___cxa_does_inherit(definiteType, possibilityType, possibility) {
      if (possibility == 0) return false;
      if (possibilityType == 0 || possibilityType == definiteType)
        return true;
      var possibility_type_info;
      if (___cxa_is_number_type(possibilityType)) {
        possibility_type_info = possibilityType;
      } else {
        var possibility_type_infoAddr = HEAP32[((possibilityType)>>2)] - 8;
        possibility_type_info = HEAP32[((possibility_type_infoAddr)>>2)];
      }
      switch (possibility_type_info) {
      case 0: // possibility is a pointer
        // See if definite type is a pointer
        var definite_type_infoAddr = HEAP32[((definiteType)>>2)] - 8;
        var definite_type_info = HEAP32[((definite_type_infoAddr)>>2)];
        if (definite_type_info == 0) {
          // Also a pointer; compare base types of pointers
          var defPointerBaseAddr = definiteType+8;
          var defPointerBaseType = HEAP32[((defPointerBaseAddr)>>2)];
          var possPointerBaseAddr = possibilityType+8;
          var possPointerBaseType = HEAP32[((possPointerBaseAddr)>>2)];
          return ___cxa_does_inherit(defPointerBaseType, possPointerBaseType, possibility);
        } else
          return false; // one pointer and one non-pointer
      case 1: // class with no base class
        return false;
      case 2: // class with base class
        var parentTypeAddr = possibilityType + 8;
        var parentType = HEAP32[((parentTypeAddr)>>2)];
        return ___cxa_does_inherit(definiteType, parentType, possibility);
      default:
        return false; // some unencountered type
      }
    }function ___cxa_find_matching_catch(thrown, throwntype, typeArray) {
      // If throwntype is a pointer, this means a pointer has been
      // thrown. When a pointer is thrown, actually what's thrown
      // is a pointer to the pointer. We'll dereference it.
      if (throwntype != 0 && !___cxa_is_number_type(throwntype)) {
        var throwntypeInfoAddr= HEAP32[((throwntype)>>2)] - 8;
        var throwntypeInfo= HEAP32[((throwntypeInfoAddr)>>2)];
        if (throwntypeInfo == 0)
          thrown = HEAP32[((thrown)>>2)];
      }
      // The different catch blocks are denoted by different types.
      // Due to inheritance, those types may not precisely match the
      // type of the thrown object. Find one which matches, and
      // return the type of the catch block which should be called.
      for (var i = 0; i < typeArray.length; i++) {
        if (___cxa_does_inherit(typeArray[i], throwntype, thrown))
          return tempRet0 = typeArray[i],thrown;
      }
      // Shouldn't happen unless we have bogus data in typeArray
      // or encounter a type for which emscripten doesn't have suitable
      // typeinfo defined. Best-efforts match just in case.
      return tempRet0 = throwntype,thrown;
    }function ___cxa_throw(ptr, type, destructor) {
      if (!___cxa_throw.initialized) {
        try {
          HEAP32[((__ZTVN10__cxxabiv119__pointer_type_infoE)>>2)]=0; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv117__class_type_infoE)>>2)]=1; // Workaround for libcxxabi integration bug
        } catch(e){}
        try {
          HEAP32[((__ZTVN10__cxxabiv120__si_class_type_infoE)>>2)]=2; // Workaround for libcxxabi integration bug
        } catch(e){}
        ___cxa_throw.initialized = true;
      }
      HEAP32[((_llvm_eh_exception.buf)>>2)]=ptr
      HEAP32[(((_llvm_eh_exception.buf)+(4))>>2)]=type
      HEAP32[(((_llvm_eh_exception.buf)+(8))>>2)]=destructor
      if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
        __ZSt18uncaught_exceptionv.uncaught_exception = 1;
      } else {
        __ZSt18uncaught_exceptionv.uncaught_exception++;
      }
      throw ptr + " - Exception catching is disabled, this exception cannot be caught. Compile with -s DISABLE_EXCEPTION_CATCHING=0 or DISABLE_EXCEPTION_CATCHING=2 to catch.";;
    }
  function ___cxa_call_unexpected(exception) {
      Module.printErr('Unexpected exception thrown, this is not properly supported - aborting');
      ABORT = true;
      throw exception;
    }
  function _llvm_uadd_with_overflow_i32(x, y) {
      x = x>>>0;
      y = y>>>0;
      return tempRet0 = x+y > 4294967295,(x+y)>>>0;
    }
  function _llvm_lifetime_start() {}
  function _llvm_lifetime_end() {}
  function _exp2(x) {
      return Math.pow(2, x);
    }
  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (Browser.initted) return;
        Browser.initted = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : console.log("warning: cannot create object URLs");
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
        function getMimetype(name) {
          return {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'bmp': 'image/bmp',
            'ogg': 'audio/ogg',
            'wav': 'audio/wav',
            'mp3': 'audio/mpeg'
          }[name.substr(-3)];
          return ret;
        }
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = [];
        var imagePlugin = {};
        imagePlugin['canHandle'] = function(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/.exec(name);
        };
        imagePlugin['handle'] = function(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: getMimetype(name) });
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin['canHandle'] = function(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            setTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
        // Canvas event setup
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'];
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule) {
        var ctx;
        try {
          if (useWebGL) {
            ctx = canvas.getContext('experimental-webgl', {
              alpha: false
            });
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas - ' + e);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        this.lockPointer = lockPointer;
        this.resizeCanvas = resizeCanvas;
        if (typeof this.lockPointer === 'undefined') this.lockPointer = true;
        if (typeof this.resizeCanvas === 'undefined') this.resizeCanvas = false;
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
        if (!this.fullScreenHandlersInstalled) {
          this.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen(); 
      },requestAnimationFrame:function (func) {
        if (!window.requestAnimationFrame) {
          window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                         window['mozRequestAnimationFrame'] ||
                                         window['webkitRequestAnimationFrame'] ||
                                         window['msRequestAnimationFrame'] ||
                                         window['oRequestAnimationFrame'] ||
                                         window['setTimeout'];
        }
        window.requestAnimationFrame(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
          if (xhr.status == 200) {
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        Browser.updateResizeListeners();
      }};
__ATINIT__.unshift({ func: function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() } });__ATMAIN__.push({ func: function() { FS.ignorePermissions = false } });__ATEXIT__.push({ func: function() { FS.quit() } });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;
___setErrNo(0);
___strtok_state = Runtime.staticAlloc(4);
___buildEnvironment(ENV);
_fputc.ret = allocate([0], "i8", ALLOC_STATIC);
_fgetc.ret = allocate([0], "i8", ALLOC_STATIC);
_llvm_eh_exception.buf = allocate(12, "void*", ALLOC_STATIC);
Module["requestFullScreen"] = function(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function(func) { Browser.requestAnimationFrame(func) };
  Module["pauseMainLoop"] = function() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function() { Browser.mainLoop.resume() };
var FUNCTION_TABLE = [0,0,_depack_np2,0,_get_cmnt,0,_stm_load,0,_test_titanics,0,_test_unic_emptyid
,0,__ZNK10__cxxabiv117__class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib,0,_stx_test,0,_depack_hrt,0,_depack_pp21,0,_synth_setpatch
,0,_fnk_test,0,_tcb_load,0,_synth_reset,0,_smix_mono_8bit_nearest,0,_mod_load
,0,_get_samp458,0,_get_chunk_sa,0,_sfx_load,0,_digi_test,0,_synth_init
,0,_depack_ksm,0,_s3m_test,0,_smix_stereo_8bit_spline_filter,0,_test_GMC,0,_get_8smp
,0,_test_nru,0,_arch_test,0,_smix_stereo_8bit_nearest,0,_depack_p60a,0,_smix_mono_16bit_spline
,0,__ZNK10__cxxabiv117__class_type_info9can_catchEPKNS_16__shim_type_infoERPv,0,_alm_load,0,_synth_setvol,0,_synth_seteffect763,0,_polly_test
,0,_depack_unic2,0,_alm_test,0,_depack_skyt,0,_get_dsmp,0,_mtp_test
,0,_synth_setnote,0,_dmf_load,0,_ims_test,0,_test_tp3,0,__ZN6playerD2Ev
,0,_depack_ntp,0,_test_mp_id,0,_okt_test,0,_ssn_load,0,_synth_reset698
,0,_get_ordr,0,_ssn_test,0,_smix_mono_16bit_linear_filter,0,_flt_load,0,_depack_p50a
,0,_sfx_test,0,_test_pru2,0,_no_load,0,_st_test,0,_rad_load
,0,_hsc_load,0,_gal4_load,0,__ZNK10__cxxabiv116__shim_type_info5noop2Ev,0,_smix_stereo_8bit_linear,0,_get_patt_cnt
,0,_mmd3_load,0,_ult_load,0,_get_patt460,0,_depack_xann,0,_liq_test
,0,_test_p50a,0,_test_wn,0,_smix_mono_8bit_spline,0,_okt_load,0,_mtm_test
,0,_depack_eu,0,_smix_stereo_16bit_spline,0,_med3_test,0,_get_cmod,0,_test_unic2
,0,_amf_load,0,_no_test,0,_pt3_load,0,_tcb_test,0,_umx_test
,0,_test_p61a,0,_mmd1_test,0,_psm_load,0,_smix_stereo_16bit_spline_filter,0,_depack_pha
,0,_med4_test,0,__ZNK10__cxxabiv117__class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi,0,_get_patt,0,__ZNK10__cxxabiv120__si_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib,0,_get_pbod461
,0,_get_mlen,0,_stim_load,0,_get_sdft,0,_get_chunk_p0,0,_mfp_load
,0,_get_d_t_,0,_get_plen,0,_synth_mixer764,0,_gdm_load,0,_get_patt128
,0,_mgt_test,0,_test_starpack,0,__ZNSt9bad_allocD2Ev,0,_test_fcm,0,_get_ordr222
,0,_depack_p18a,0,_mgt_load,0,_stm_test,0,_med2_load,0,_get_inst226
,0,_xm_load,0,_depack_zen,0,_synth_init696,0,_depack_nru,0,_test_kris
,0,_depack_crb,0,_smix_stereo_8bit_linear_filter,0,_ice_test,0,_imf_load,0,_depack_pru1
,0,_mdl_load,0,_smix_mono_16bit_nearest,0,_depack_pru2,0,_synth_deinit,0,_get_sbod
,0,_mtm_load,0,_test_fuchs,0,_get_inst_cnt,0,_stx_load,0,_emod_test
,0,_it_test,0,_test_unic_noid,0,_depack_tp3,0,_synth_init757,0,__ZNKSt9bad_alloc4whatEv
,0,_test_crb,0,_flt_test,0,_depack_p61a,0,_depack_titanics,0,_sym_test
,0,_depack_di,0,_smix_stereo_16bit_linear_filter,0,_get_inst158,0,_get_dait,0,_synth_deinit697
,0,_smix_stereo_8bit_spline,0,_get_chunk_pe,0,_digi_load,0,_get_ptdt,0,_coco_load
,0,__ZNK10__cxxabiv120__si_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi,0,_depack_np1,0,_get_plen459,0,_depack_np3,0,_test_tdd
,0,_mtp_load,0,_rtm_test,0,_smix_mono_8bit_linear_filter,0,_get_mnam,0,_polly_load
,0,_s3m_load,0,_pt3_test,0,_synth_setnote761,0,_get_inst_cnt224,0,_test_np3
,0,_get_info,0,_get_samp,0,_synth_reset759,0,_liq_load,0,_get_tinf
,0,_med3_load,0,_depack_starpack,0,_get_chunk_i0,0,_asylum_test,0,_rad_test
,0,_depack_AC1D,0,_test_xann,0,_depack_wn,0,_emod_load,0,_ptm_test
,0,__ZN10__cxxabiv120__si_class_type_infoD0Ev,0,_test_di,0,_get_inst,0,__ZNK10__cxxabiv120__si_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib,0,_test_p60a
,0,_dbm_load,0,_get_ster,0,_gal5_load,0,_test_ntp,0,_dt_test
,0,_pw_load,0,_test_zen,0,_gtk_test,0,_dtt_test,0,_get_pbod_cnt
,0,_med2_test,0,_xm_test,0,_sym_load,0,_test_fuzz,0,_stim_test
,0,_smix_stereo_16bit_nearest,0,_amf_test,0,_mdl_test,0,_pw_test,0,_get_chunk_fe
,0,_depack_fcm,0,_get_song_2,0,_test_unic_id,0,_get_patt225,0,_ult_test
,0,_get_s_q_,0,_test_skyt,0,_get_chunk_is,0,_test_pru1,0,_depack_unic
,0,_test_pp21,0,_get_chunk_ve,0,_get_patt146,0,_amd_load,0,_gtk_load
,0,_smix_mono_16bit_linear,0,_depack_mp,0,_coco_test,0,_get_patt157,0,_get_slen
,0,_test_p18a,0,_get_chunk_ii,0,_get_patt210,0,_mfp_test,0,_get_chunk_in
,0,_masi_test,0,_umx_load,0,_get_titl,0,_get_spee,0,_test_pha
,0,_get_song330,0,_gal5_test,0,_test_p10c,0,_ptm_load,0,_ims_load
,0,_get_dapt,0,__ZNSt9bad_allocD0Ev,0,_synth_mixer,0,_get_main,0,_test_mp_noid
,0,_dbm_test,0,_psm_test,0,_smix_mono_8bit_linear,0,__ZN10__cxxabiv117__class_type_infoD0Ev,0,_dtt_load
,0,_smix_mono_16bit_spline_filter,0,_get_init,0,_far_load,0,_synth_setpatch760,0,_cmplong
,0,_rtm_load,0,_mod_test,0,_test_ksm,0,_get_pnum,0,_depack_p4x
,0,_synth_deinit758,0,_synth_seteffect,0,_get_dsmp_cnt,0,_test_hrt,0,_synth_setvol762
,0,_stc_test,0,_test_np2,0,_med4_load,0,_get_pbod,0,__ZN10__cxxabiv116__shim_type_infoD2Ev
,0,_hsc_test,0,_get_patt_cnt223,0,_masi_load,0,__ZNK10__cxxabiv117__class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib,0,_get_smpl
,0,_depack_tdd,0,_get_smpi,0,_get_info526,0,_get_emic,0,_get_smpd
,0,_it_load,0,_far_test,0,__ZNK10__cxxabiv116__shim_type_info5noop1Ev,0,_get_song,0,_depack_kris
,0,_st_load,0,_get_anam,0,_smix_stereo_16bit_linear,0,_smix_mono_8bit_spline_filter,0,_stc_load
,0,_dt_load,0,_arch_load,0,_depack_p10c,0,__ZN6playerD0Ev,0,_gdm_test
,0,_get_sequ,0,_get_sequ145,0,_test_p4x,0,_test_eu,0,_get_mvox
,0,_imf_test,0,_test_AC1D,0,_depack_fuchs,0,_mmd3_test,0,_get_venv
,0,_depack_fuzz,0,_test_np1,0,_gal4_test,0,_dmf_test,0,_amd_test
,0,_depack_GMC,0,_get_chunk_pa,0,_mmd1_load,0,_get_inst211,0,_get_chunk_tr,0,_ice_load,0,_fnk_load,0,_asylum_load,0,_get_patt170,0];
// EMSCRIPTEN_START_FUNCS
function __ZN6playerD0Ev(r1){var r2,r3,r4;HEAP32[r1>>2]=5268876;r2=(r1+4|0)>>2;r3=HEAP32[r2];if((r3|0)==0){r4=r1;__ZdlPv(r4);return}_xmp_end_player(r3);_xmp_release_module(HEAP32[r2]);_free(HEAP32[r2]);r4=r1;__ZdlPv(r4);return}function __ZN6playerD2Ev(r1){var r2;HEAP32[r1>>2]=5268876;r2=(r1+4|0)>>2;r1=HEAP32[r2];if((r1|0)==0){return}_xmp_end_player(r1);_xmp_release_module(HEAP32[r2]);_free(HEAP32[r2]);return}function __ZN6player4readEv(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10;r2=__Znwj(8);r3=r2;r4=r2;HEAP32[r4>>2]=0;HEAP32[r4+4>>2]=0;r4=r2>>2;HEAP32[r4]=0;r5=(r2+4|0)>>2;HEAP32[r5]=0;r2=r1+4|0;do{if((_xmp_play_frame(HEAP32[r2>>2])|0)==0){_xmp_get_frame_info(HEAP32[r2>>2],r1+12|0);if((HEAP32[r1+68>>2]|0)>0){return r3}else{r6=HEAP32[r1+52>>2];HEAP32[r4]=r6;r7=HEAP32[r1+56>>2];HEAP32[r5]=r7;r8=r7;r9=r6;break}}else{r8=0;r9=0}}while(0);r1=(r8|0)/2&-1;r2=_llvm_umul_with_overflow_i32(r1,4);r6=__Znaj(tempRet0?-1:r2);r2=r6;L17:do{if((r8|0)>1){r7=0;while(1){HEAPF32[r2+(r7<<2)>>2]=(HEAP16[r9+(r7<<1)>>1]<<16>>16)*30517578125e-15;r10=r7+1|0;if((r10|0)<(r1|0)){r7=r10}else{break L17}}}}while(0);HEAP32[r5]=r8<<1;HEAP32[r4]=r6;return r3}function _initialize_player(r1){var r2,r3,r4,r5,r6;r2=__Znwj(1620),r3=r2>>2;HEAP32[r3]=5268876;r4=r2+8|0;HEAP8[r4]=0;r5=_calloc(1,8096);HEAP32[r3+1]=r5;if((_xmp_load_module(r5,r1)|0)==0){_xmp_start_player(r5,44100,4)}else{HEAP8[r4]=1;_free(r5)}if((HEAP8[r4]&1)<<24>>24==0){r6=r2;return r6}if((r2|0)==0){r6=0;return r6}FUNCTION_TABLE[HEAP32[HEAP32[r3]+4>>2]](r2);r6=0;return r6}function _free_player(r1){if((r1|0)==0){return}FUNCTION_TABLE[HEAP32[HEAP32[r1>>2]+4>>2]](r1);return}function _read_from_player(r1){return __ZN6player4readEv(r1)}function _free_buffer(r1){var r2;r2=HEAP32[r1>>2];if((r2|0)!=0){__ZdaPv(r2)}__ZdlPv(r1);return}function _xmp_load_module(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29;r3=r1>>2;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+16568|0;r6=r5;r7=r5+16384,r8=r7>>2;r9=r5+16488;r10=r5+16560;r11=r1,r12=r11>>2;r13=r1+1536|0;r14=r13;if((_stat(r2,r9)|0)<0){r15=-6;STACKTOP=r5;return r15}if((HEAP32[r9+8>>2]&61440|0)==16384){HEAP32[___errno_location()>>2]=21;r15=-6;STACKTOP=r5;return r15}r16=_fopen(r2,5263292);if((r16|0)==0){r15=-6;STACKTOP=r5;return r15}r17=r10|0;HEAP32[r17>>2]=r10;HEAP32[r10+4>>2]=r10;r18=(r1+2744|0)>>2;r19=(r1+2748|0)>>2;r20=_strrchr(r2,47);if((r20|0)==0){HEAP32[r18]=_strdup(5266736);r21=_strdup(r2)}else{r22=r20-r2|0;r23=r22+1|0;r24=_malloc(r22+2|0);HEAP32[r18]=r24;_memcpy(r24,r2,r23);HEAP8[HEAP32[r18]+r23|0]=0;r21=_strdup(r20+1|0)}HEAP32[r19]=r21;HEAP32[r3+688]=r2;HEAP32[r3+694]=HEAP32[r9+28>>2];r9=r1+2780|0;_memset(r13,0,128);HEAPF64[tempDoublePtr>>3]=250,HEAP32[r9>>2]=HEAP32[tempDoublePtr>>2],HEAP32[r9+4>>2]=HEAP32[tempDoublePtr+4>>2];HEAP32[r3+699]=8287;HEAP32[r3+700]=64;HEAP32[r3+701]=64;HEAP32[r3+702]=0;HEAP32[r3+703]=0;HEAP32[r3+704]=0;HEAP32[r3+689]=0;HEAP32[r3+416]=0;HEAP32[r3+417]=0;HEAP32[r3+418]=4;HEAP32[r3+419]=0;HEAP32[r3+420]=0;HEAP32[r3+421]=6;HEAP32[r3+422]=125;HEAP32[r3+423]=0;HEAP32[r3+424]=0;HEAP32[r3+2022]=5246948;HEAP32[r3+2021]=0;r9=r1+2788|0;HEAPF64[tempDoublePtr>>3]=10,HEAP32[r9>>2]=HEAP32[tempDoublePtr>>2],HEAP32[r9+4>>2]=HEAP32[tempDoublePtr+4>>2];HEAP32[r3+2019]=0;HEAP32[r3+2020]=0;r3=0;while(1){r9=r3+1|0;HEAP32[((r3*12&-1)+1720>>2)+r12]=((r9|0)/2&-1|0)%2*255&-1;HEAP32[((r3*12&-1)+1724>>2)+r12]=64;HEAP32[((r3*12&-1)+1728>>2)+r12]=0;if((r9|0)==64){r25=-1;r26=0;break}else{r3=r9}}while(1){if((r26|0)==59){r27=-1;r28=r25;break}_fseek(r16,0,0);r29=HEAP32[(r26<<2)+5250976>>2];r3=FUNCTION_TABLE[HEAP32[r29+4>>2]](r16,0,0);if((r3|0)==0){r4=50;break}else{r25=r3;r26=r26+1|0}}if(r4==50){_fseek(r16,0,0);r27=FUNCTION_TABLE[HEAP32[r29+8>>2]](r14,r16,0);r28=0}r14=r1+2760|0;r29=r6|0;_fseek(r16,0,0);HEAP32[r8+1]=0;HEAP32[r8]=0;HEAP32[r8+2]=1732584193;HEAP32[r8+3]=-271733879;HEAP32[r8+4]=-1732584194;HEAP32[r8+5]=271733878;r8=_fread(r29,1,16384,r16);L67:do{if((r8|0)>0){r6=r8;while(1){_MD5Update(r7,r29,r6);r26=_fread(r29,1,16384,r16);if((r26|0)>0){r6=r26}else{break L67}}}}while(0);_MD5Final(r7);_memcpy(r14,r7+88|0,16);_fclose(r16);r16=HEAP32[r17>>2];L71:do{if((r16|0)!=(r10|0)){r17=r16;while(1){r7=r17-8+4|0,r14=r7>>2;_unlink(HEAP32[r14]);_free(HEAP32[r14]);r29=HEAP32[r14+1];r8=HEAP32[r14+2];HEAP32[r29+4>>2]=r8;HEAP32[r8>>2]=r29;r29=HEAP32[r17>>2];_free(r7);if((r29|0)==(r10|0)){break L71}else{r17=r29}}}}while(0);if((r28|0)<0){_free(HEAP32[r19]);_free(HEAP32[r18]);r15=-3;STACKTOP=r5;return r15}if((r27|0)<0){_free(HEAP32[r19]);_free(HEAP32[r18]);r15=-4;STACKTOP=r5;return r15}r18=HEAP8[r13];L83:do{if(r18<<24>>24==0){r4=68}else{r27=0;r28=r18;while(1){r10=r27+(r1+1536)|0;do{if((_isprint(r28<<24>>24)|0)==0){r4=63}else{if(HEAP8[r10]<<24>>24<0){r4=63;break}else{break}}}while(0);if(r4==63){r4=0;HEAP8[r10]=32}r16=r27+1|0;if(r16>>>0>=_strlen(r13)>>>0){break}r17=HEAP8[r27+(r1+1537)|0];r27=r16;r28=r17}if(HEAP8[r13]<<24>>24==0){r4=68;break}while(1){r28=r1+_strlen(r13)+1535|0;if(HEAP8[r28]<<24>>24!=32){break L83}HEAP8[r28]=0;if(HEAP8[r13]<<24>>24==0){r4=68;break L83}}}}while(0);if(r4==68){_strncpy(r13,HEAP32[r19],64)}_load_epilogue(r11);r15=0;STACKTOP=r5;return r15}function _xmp_release_module(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24;r2=r1>>2;r3=HEAP32[r2+2021];if((r3|0)!=0){_free(r3)}r3=r1+8076|0;r4=HEAP32[r3>>2];if((r4|0)!=0){r5=r1+1676|0;r6=HEAP32[r5>>2];L106:do{if((r6|0)>0){r7=0;r8=r4;r9=r6;while(1){r10=HEAP32[r8+(r7<<2)>>2];if((r10|0)==0){r11=r9;r12=r8}else{_free(r10);r11=HEAP32[r5>>2];r12=HEAP32[r3>>2]}r10=r7+1|0;if((r10|0)<(r11|0)){r7=r10;r8=r12;r9=r11}else{r13=r12;break L106}}}else{r13=r4}}while(0);_free(r13)}r13=r1+8080|0;r4=HEAP32[r13>>2];if((r4|0)!=0){r12=r1+1676|0;r11=HEAP32[r12>>2];L116:do{if((r11|0)>0){r3=0;r5=r4;r6=r11;while(1){r9=HEAP32[r5+(r3<<2)>>2];if((r9|0)==0){r14=r6;r15=r5}else{_free(r9);r14=HEAP32[r12>>2];r15=HEAP32[r13>>2]}r9=r3+1|0;if((r9|0)<(r14|0)){r3=r9;r5=r15;r6=r14}else{r16=r15;break L116}}}else{r16=r4}}while(0);_free(r16)}r16=r1+1668|0;L124:do{if((HEAP32[r16>>2]|0)>0){r4=r1+1708|0;r15=0;while(1){_free(HEAP32[HEAP32[r4>>2]+(r15<<2)>>2]);r14=r15+1|0;if((r14|0)<(HEAP32[r16>>2]|0)){r15=r14}else{break L124}}}}while(0);r16=r1+1664|0;L129:do{if((HEAP32[r16>>2]|0)>0){r15=r1+1704|0;r4=0;while(1){_free(HEAP32[HEAP32[r15>>2]+(r4<<2)>>2]);r14=r4+1|0;if((r14|0)<(HEAP32[r16>>2]|0)){r4=r14}else{break L129}}}}while(0);r16=r1+1676|0;L134:do{if((HEAP32[r16>>2]|0)>0){r4=r1+1712|0;r15=0;while(1){_free(HEAP32[HEAP32[r4>>2]+(r15*764&-1)+756>>2]);r14=HEAP32[HEAP32[r4>>2]+(r15*764&-1)+760>>2];if((r14|0)!=0){_free(r14)}r14=r15+1|0;if((r14|0)<(HEAP32[r16>>2]|0)){r15=r14}else{break L134}}}}while(0);_free(HEAP32[r2+427]);_free(HEAP32[r2+426]);r16=r1+1680|0;r15=HEAP32[r16>>2];if((r15|0)>0){r4=r1+1716|0;r14=0;r13=HEAP32[r4>>2];r12=r15;while(1){r15=HEAP32[r13+(r14*52&-1)+48>>2];if((r15|0)==0){r17=r12;r18=r13}else{_free(r15-4|0);r17=HEAP32[r16>>2];r18=HEAP32[r4>>2]}r15=r14+1|0;if((r15|0)<(r17|0)){r14=r15;r13=r18;r12=r17}else{break}}_free(r18|0)}_free(HEAP32[r2+428]|0);r18=HEAP32[r2+689];if((r18|0)==0){r19=r1+2744|0;r20=r19;r21=HEAP32[r20>>2];_free(r21);r22=r1+2748|0;r23=r22;r24=HEAP32[r23>>2];_free(r24);return}_free(r18);r19=r1+2744|0;r20=r19;r21=HEAP32[r20>>2];_free(r21);r22=r1+2748|0;r23=r22;r24=HEAP32[r23>>2];_free(r24);return}function _load_epilogue(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r2=0;HEAP32[r1+1700>>2]=HEAP32[r1+2804>>2];r3=r1+1696|0;if((HEAP32[r3>>2]|0)>=(HEAP32[r1+1692>>2]|0)){HEAP32[r3>>2]=0}r3=r1+1684|0;if((HEAP32[r3>>2]|0)==0){HEAP32[r3>>2]=6}r3=r1+1688|0;if((HEAP32[r3>>2]|0)==0){HEAP32[r3>>2]=125}r3=r1+1676|0;L165:do{if((HEAP32[r3>>2]|0)>0){r4=r1+2812|0;r5=r1+2800|0;r6=(r1+1712|0)>>2;r7=0;while(1){if((HEAP32[r4>>2]&16384|0)==0){HEAP32[HEAP32[r6]+(r7*764&-1)+32>>2]=HEAP32[r5>>2]}r8=HEAP32[r6];L172:do{if((HEAP32[r8+(r7*764&-1)+36>>2]|0)>0){r9=0;r10=r8;while(1){if((HEAP32[r4>>2]&16384|0)==0){HEAP32[HEAP32[r10+(r7*764&-1)+756>>2]+(r9<<6)+4>>2]=HEAP32[r5>>2];r11=HEAP32[r6]}else{r11=r10}r12=r9+1|0;if((r12|0)<(HEAP32[r11+(r7*764&-1)+36>>2]|0)){r9=r12;r10=r11}else{break L172}}}}while(0);r8=r7+1|0;if((r8|0)<(HEAP32[r3>>2]|0)){r7=r8}else{break L165}}}}while(0);r3=HEAP32[r1+24>>2];r11=r1+28|0;HEAP32[r11>>2]=r3;r7=r1+2760|0;r6=0;while(1){if((r6|0)==4){r2=134;break}if((_memcmp(r7,(r6*20&-1)+5249764|0,16)|0)==0){break}else{r6=r6+1|0}}if(r2==134){r13=_scan_sequences(r1);return}HEAP32[r11>>2]=r3|HEAP32[(r6*20&-1)+5249780>>2];if((r6-2|0)>>>0>=2){r13=_scan_sequences(r1);return}_scan_sequences(r1);r13=_scan_sequences(r1);return}function _ssn_test(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+64|0;r6=r5;r7=_fgetc(r1)&65535;r8=_fgetc(r1)&255|r7<<8;L191:do{if(r8<<16>>16==26982|r8<<16>>16==19022){_fseek(r1,238,1);if((_fgetc(r1)&255)<<24>>24!=-1){r9=-1;break}_fseek(r1,r3+2|0,0);r7=r6|0;if((r2|0)==0){r9=0;break}_memset(r2,0,37);_fread(r7,1,36,r1);HEAP8[r6+36|0]=0;_memset(r2,0,37);_strncpy(r2,r7,36);r7=HEAP8[r2];if(r7<<24>>24==0){r9=0;break}else{r10=0;r11=r2;r12=r7}while(1){do{if((_isprint(r12<<24>>24)|0)==0){r4=144}else{if(HEAP8[r11]<<24>>24<0){r4=144;break}else{break}}}while(0);if(r4==144){r4=0;HEAP8[r11]=46}r7=r10+1|0;r13=r2+r7|0;r14=HEAP8[r13];if(r14<<24>>24!=0&(r7|0)<36){r10=r7;r11=r13;r12=r14}else{break}}if(HEAP8[r2]<<24>>24==0){r9=0;break}while(1){r14=r2+(_strlen(r2)-1)|0;if(HEAP8[r14]<<24>>24!=32){r9=0;break L191}HEAP8[r14]=0;if(HEAP8[r2]<<24>>24==0){r9=0;break L191}}}else{r9=-1}}while(0);STACKTOP=r5;return r9}function _ssn_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33;r4=r1>>2;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+532|0;r7=r6;r8=r6+500;r9=r6+528;_fseek(r2,r3,0);r3=r7|0;_fread(r3,2,1,r2);r10=r7+2|0;_fread(r10,108,1,r2);r11=r7+110|0;HEAP8[r11]=_fgetc(r2)&255;r12=r7+111|0;HEAP8[r12]=_fgetc(r2)&255;HEAP8[r7+112|0]=_fgetc(r2)&255;r13=r7+113|0;_fread(r13,128,1,r2);_fread(r7+241|0,128,1,r2);_fread(r7+369|0,128,1,r2);r14=(r1+136|0)>>2;HEAP32[r14]=8;r15=HEAPU8[r11];r11=(r1+140|0)>>2;HEAP32[r11]=r15;r16=HEAP8[r12];r12=r16&255;r17=(r1+128|0)>>2;HEAP32[r17]=r12;r18=r1+132|0;HEAP32[r18>>2]=r12<<3;r12=0;while(1){if((r12|0)>=128){break}if(HEAPU8[r7+(r12+113)|0]>(r16&255)){break}else{r12=r12+1|0}}HEAP32[r4+39]=r12;_memcpy(r1+952|0,r13,r12);HEAP32[r4+37]=6;HEAP32[r4+38]=76;r12=r1+144|0;HEAP32[r12>>2]=r15;r15=(r1+1276|0)>>2;HEAP32[r15]=HEAP32[r15]|4096;r13=r1|0;_memset(r13,0,37);_strncpy(r13,r10,36);r16=HEAP8[r13];L212:do{if(r16<<24>>24!=0){r19=0;r20=r13;r21=r16;while(1){do{if((_isprint(r21<<24>>24)|0)==0){r5=156}else{if(HEAP8[r20]<<24>>24<0){r5=156;break}else{break}}}while(0);if(r5==156){r5=0;HEAP8[r20]=46}r22=r19+1|0;r23=r1+r22|0;r24=HEAP8[r23];if(r24<<24>>24!=0&(r22|0)<36){r19=r22;r20=r23;r21=r24}else{break}}if(HEAP8[r13]<<24>>24==0){break}while(1){r21=r1+(_strlen(r13)-1)|0;if(HEAP8[r21]<<24>>24!=32){break L212}HEAP8[r21]=0;if(HEAP8[r13]<<24>>24==0){break L212}}}}while(0);_set_type(r1,(_strncmp(r3,5266604,2)|0)!=0?5265572:5263500,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r3=_malloc(109);r13=r1+1220|0;HEAP32[r13>>2]=r3;_memcpy(r3,r10,108);HEAP8[HEAP32[r13>>2]+108|0]=0;r13=(r1+176|0)>>2;HEAP32[r13]=_calloc(764,HEAP32[r11]);r10=HEAP32[r12>>2];if((r10|0)!=0){HEAP32[r4+45]=_calloc(52,r10)}L228:do{if((HEAP32[r11]|0)>0){r10=r8|0;r12=r8+16|0;r3=r8+20|0;r16=r8+24|0;r21=(r1+180|0)>>2;r20=0;while(1){r19=_calloc(64,1);HEAP32[HEAP32[r13]+(r20*764&-1)+756>>2]=r19;_fread(r10,13,1,r2);r19=_fgetc(r2)&255;r24=_fgetc(r2);r23=r24<<8&65280|r19|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;HEAP32[r12>>2]=r23;r19=_fgetc(r2)&255;r24=_fgetc(r2);r22=r24<<8&65280|r19|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;HEAP32[r3>>2]=r22;r19=_fgetc(r2)&255;r24=_fgetc(r2);r25=r24<<8&65280|r19|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;HEAP32[r16>>2]=r25;HEAP32[HEAP32[r21]+(r20*52&-1)+32>>2]=r23;HEAP32[HEAP32[r13]+(r20*764&-1)+36>>2]=(r23|0)!=0&1;HEAP32[HEAP32[r21]+(r20*52&-1)+36>>2]=r22;HEAP32[HEAP32[r21]+(r20*52&-1)+40>>2]=r25>>>0>1048574?0:r25;r25=HEAP32[r21];HEAP32[r25+(r20*52&-1)+44>>2]=(HEAP32[r25+(r20*52&-1)+40>>2]|0)!=0?2:0;HEAP32[HEAP32[HEAP32[r13]+(r20*764&-1)+756>>2]>>2]=64;HEAP32[HEAP32[HEAP32[r13]+(r20*764&-1)+756>>2]+8>>2]=128;HEAP32[HEAP32[HEAP32[r13]+(r20*764&-1)+756>>2]+40>>2]=r20;r25=HEAP32[r13];r22=r25+(r20*764&-1)|0;_memset(r22,0,14);_strncpy(r22,r10,13);r23=HEAP8[r22];L232:do{if(r23<<24>>24!=0){r19=0;r24=r22;r26=r23;while(1){do{if((_isprint(r26<<24>>24)|0)==0){r5=168}else{if(HEAP8[r24]<<24>>24<0){r5=168;break}else{break}}}while(0);if(r5==168){r5=0;HEAP8[r24]=46}r27=r19+1|0;r28=r25+(r20*764&-1)+r27|0;r29=HEAP8[r28];if(r29<<24>>24!=0&(r27|0)<13){r19=r27;r24=r28;r26=r29}else{break}}if(HEAP8[r22]<<24>>24==0){break}while(1){r26=_strlen(r22)-1+r25+(r20*764&-1)|0;if(HEAP8[r26]<<24>>24!=32){break L232}HEAP8[r26]=0;if(HEAP8[r22]<<24>>24==0){break L232}}}}while(0);r22=r20+1|0;if((r22|0)<(HEAP32[r11]|0)){r20=r22}else{break L228}}}}while(0);r5=(r1+172|0)>>2;HEAP32[r5]=_calloc(4,HEAP32[r18>>2]);r18=(r1+168|0)>>2;HEAP32[r18]=_calloc(4,HEAP32[r17]+1|0);L246:do{if((HEAP32[r17]|0)>0){r13=r9|0;r8=r9+2|0;r20=r9+1|0;r10=0;while(1){r21=_calloc(1,(HEAP32[r14]<<2)+4|0);HEAP32[HEAP32[r18]+(r10<<2)>>2]=r21;HEAP32[HEAP32[HEAP32[r18]+(r10<<2)>>2]>>2]=64;r21=HEAP32[r14];L250:do{if((r21|0)>0){r16=0;r3=r21;while(1){r12=Math.imul(r3,r10)+r16|0;HEAP32[HEAP32[HEAP32[r18]+(r10<<2)>>2]+(r16<<2)+4>>2]=r12;r12=_calloc(HEAP32[HEAP32[HEAP32[r18]+(r10<<2)>>2]>>2]<<3|4,1);r22=Math.imul(HEAP32[r14],r10)+r16|0;HEAP32[HEAP32[r5]+(r22<<2)>>2]=r12;r12=HEAP32[HEAP32[HEAP32[r18]+(r10<<2)>>2]>>2];r22=Math.imul(HEAP32[r14],r10)+r16|0;HEAP32[HEAP32[HEAP32[r5]+(r22<<2)>>2]>>2]=r12;r12=r16+1|0;r22=HEAP32[r14];if((r12|0)<(r22|0)){r16=r12;r3=r22}else{break L250}}}}while(0);HEAP8[HEAP32[HEAP32[r5]+(HEAP32[HEAP32[HEAP32[r18]+(r10<<2)>>2]+4>>2]<<2)>>2]+9|0]=126;HEAP8[HEAP32[HEAP32[r5]+(HEAP32[HEAP32[HEAP32[r18]+(r10<<2)>>2]+4>>2]<<2)>>2]+10|0]=HEAP8[r7+(r10+241)|0];r21=HEAPU8[r7+(r10+369)|0];HEAP8[(r21<<3)+HEAP32[HEAP32[r5]+(HEAP32[HEAP32[HEAP32[r18]+(r10<<2)>>2]+8>>2]<<2)>>2]+9|0]=13;HEAP8[(r21<<3)+HEAP32[HEAP32[r5]+(HEAP32[HEAP32[HEAP32[r18]+(r10<<2)>>2]+8>>2]<<2)>>2]+10|0]=0;r21=0;while(1){r3=(r21|0)/8&-1;r16=HEAP32[HEAP32[r5]+(HEAP32[HEAP32[HEAP32[r18]+(r10<<2)>>2]+((r21|0)%8<<2)+4>>2]<<2)>>2];_fread(r13,1,3,r2);r22=HEAP8[r13];if((r22&-2)<<24>>24!=-2){HEAP8[(r3<<3)+r16+4|0]=((r22&255)>>>2)+37&255;HEAP8[(r3<<3)+r16+5|0]=((HEAPU8[r20]>>>4)+1&255)+(r22<<4&48)&255}if(r22<<24>>24!=-1){HEAP8[(r3<<3)+r16+6|0]=HEAP8[r20]<<2&60|1}r22=HEAP8[r8];do{if((r22&255)<=95){r12=HEAP8[((r22&255)>>>4)+5250968|0];HEAP8[(r3<<3)+r16+7|0]=r12;r25=r12&255;if((r25|0)==121|(r25|0)==120|(r25|0)==122){HEAP8[(r3<<3)+r16+8|0]=r22&15;break}else if((r25|0)==123){HEAP8[(r3<<3)+r16+8|0]=1;break}else if((r25|0)==166){HEAP8[(r3<<3)+r16+8|0]=r22<<4^-128;break}else if((r25|0)==126){HEAP8[(r3<<3)+r16+8|0]=r22&15;HEAP8[(r3<<3)+r16+9|0]=127;break}else{break}}}while(0);r16=r21+1|0;if((r16|0)==512){break}else{r21=r16}}r21=r10+1|0;if((r21|0)<(HEAP32[r17]|0)){r10=r21}else{break L246}}}}while(0);r17=HEAP32[r11];L272:do{if((r17|0)>0){r18=r1+180|0;r5=0;r7=r17;while(1){r9=HEAP32[r18>>2];if((HEAP32[r9+(r5*52&-1)+32>>2]|0)<3){r30=r7}else{_load_sample(r2,2,r9+(r5*52&-1)|0,0);r30=HEAP32[r11]}r9=r5+1|0;if((r9|0)<(r30|0)){r5=r9;r7=r30}else{break L272}}}}while(0);if((HEAP32[r14]|0)>0){r31=0}else{r32=HEAP32[r15];r33=r32|256;HEAP32[r15]=r33;STACKTOP=r6;return 0}while(1){HEAP32[((r31*12&-1)+184>>2)+r4]=(r31|0)%2*255&-1;r30=r31+1|0;if((r30|0)<(HEAP32[r14]|0)){r31=r30}else{break}}r32=HEAP32[r15];r33=r32|256;HEAP32[r15]=r33;STACKTOP=r6;return 0}function _alm_test(r1,r2,r3){var r4,r5,r6,r7;r3=STACKTOP;STACKTOP=STACKTOP+72|0;r4=r3;r5=r3+64|0;L286:do{if(_fread(r5,1,7,r1)>>>0<7){r6=-1}else{if((_memcmp(r5,5266588,7)|0)!=0){if((_memcmp(r5,5263220,7)|0)!=0){r6=-1;break}}r7=r4|0;if((r2|0)==0){r6=0;break}HEAP8[r2]=0;_fread(r7,1,0,r1);HEAP8[r7]=0;HEAP8[r2]=0;_strncpy(r2,r7,0);if(HEAP8[r2]<<24>>24==0){r6=0;break}while(1){r7=r2+(_strlen(r2)-1)|0;if(HEAP8[r7]<<24>>24!=32){r6=0;break L286}HEAP8[r7]=0;if(HEAP8[r2]<<24>>24==0){r6=0;break L286}}}}while(0);STACKTOP=r3;return r6}function _alm_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26;r4=r1>>2;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+724|0;r7=r6;r8=r6+140;r9=r6+212;_fseek(r2,r3,0);r3=r7|0;_fread(r3,7,1,r2);r10=r7+7|0;if((_strncmp(r3,5266588,7)|0)==0){HEAP32[r4+37]=HEAPU8[r10]>>>1}r3=r6+468|0;_strncpy(r3,HEAP32[r4+304],255);r11=_strtok(r3,5267812);HEAP8[r10]=_fgetc(r2)&255;r10=r7+8|0;HEAP8[r10]=_fgetc(r2)&255;r3=r7+9|0;HEAP8[r3]=_fgetc(r2)&255;r12=r7+10|0;_fread(r12,128,1,r2);r13=HEAP8[r10];r10=r13&255;HEAP32[r4+39]=r10;HEAP32[r4+40]=HEAPU8[r3];_memcpy(r1+952|0,r12,r10);r12=(r1+128|0)>>2;HEAP32[r12]=0;if(r13<<24>>24==0){r14=1}else{r13=0;r3=0;while(1){r15=HEAPU8[r7+(r13+10)|0];if((r3|0)<(r15|0)){HEAP32[r12]=r15;r16=r15}else{r16=r3}r15=r13+1|0;if((r15|0)<(r10|0)){r13=r15;r3=r16}else{break}}r14=r16+1|0}HEAP32[r12]=r14;r16=(r1+140|0)>>2;HEAP32[r16]=31;r3=(r1+136|0)>>2;r13=r1+132|0;HEAP32[r13>>2]=Math.imul(HEAP32[r3],r14);r14=r1+144|0;HEAP32[r14>>2]=31;HEAP32[r4+315]=8363;_set_type(r1,5264796,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r10=(r1+172|0)>>2;HEAP32[r10]=_calloc(4,HEAP32[r13>>2]);r13=(r1+168|0)>>2;HEAP32[r13]=_calloc(4,HEAP32[r12]+1|0);L308:do{if((HEAP32[r12]|0)>0){r7=0;r15=HEAP32[r3];while(1){r17=_calloc(1,(r15<<2)+4|0);HEAP32[HEAP32[r13]+(r7<<2)>>2]=r17;HEAP32[HEAP32[HEAP32[r13]+(r7<<2)>>2]>>2]=64;r17=HEAP32[r3];L312:do{if((r17|0)>0){r18=0;r19=r17;while(1){r20=Math.imul(r19,r7)+r18|0;HEAP32[HEAP32[HEAP32[r13]+(r7<<2)>>2]+(r18<<2)+4>>2]=r20;r20=_calloc(HEAP32[HEAP32[HEAP32[r13]+(r7<<2)>>2]>>2]<<3|4,1);r21=Math.imul(HEAP32[r3],r7)+r18|0;HEAP32[HEAP32[r10]+(r21<<2)>>2]=r20;r20=HEAP32[HEAP32[HEAP32[r13]+(r7<<2)>>2]>>2];r21=Math.imul(HEAP32[r3],r7)+r18|0;HEAP32[HEAP32[HEAP32[r10]+(r21<<2)>>2]>>2]=r20;r20=r18+1|0;r21=HEAP32[r3];if((r20|0)<(r21|0)){r18=r20;r19=r21}else{r22=r21;break L312}}}else{r22=r17}}while(0);L316:do{if((r22<<6|0)>0){r17=0;r19=r22;while(1){r18=(r17|0)/(r19|0)&-1;r21=HEAP32[HEAP32[r10]+(HEAP32[HEAP32[HEAP32[r13]+(r7<<2)>>2]+((r17|0)%(r19|0)<<2)+4>>2]<<2)>>2];r20=_fgetc(r2)&255;do{if(r20<<24>>24==37){r23=97;r5=222}else if(r20<<24>>24!=0){r23=r20+48&255;r5=222;break}}while(0);if(r5==222){r5=0;HEAP8[(r18<<3)+r21+4|0]=r23}HEAP8[(r18<<3)+r21+5|0]=_fgetc(r2)&255;r20=r17+1|0;r24=HEAP32[r3];if((r20|0)<(r24<<6|0)){r17=r20;r19=r24}else{r25=r24;break L316}}}else{r25=r22}}while(0);r19=r7+1|0;if((r19|0)<(HEAP32[r12]|0)){r7=r19;r15=r25}else{break L308}}}}while(0);r25=(r1+176|0)>>2;HEAP32[r25]=_calloc(764,HEAP32[r16]);r12=HEAP32[r14>>2];if((r12|0)!=0){HEAP32[r4+45]=_calloc(52,r12)}L329:do{if((HEAP32[r16]|0)>0){r12=r9|0;r14=r8+28|0;r22=(r1+180|0)>>2;r23=0;while(1){r5=_calloc(64,1);HEAP32[HEAP32[r25]+(r23*764&-1)+756>>2]=r5;r5=r23+1|0;_snprintf(r12,255,5264328,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r11,HEAP32[tempInt+4>>2]=r5,tempInt));r13=_fopen(r12,5263292);r10=(r13|0)!=0;HEAP32[HEAP32[r25]+(r23*764&-1)+36>>2]=r10&1;if(r10){_fstat(_fileno(r13),r8);r10=(_fgetc(r13)&255)<<24>>24!=0;HEAP32[HEAP32[r22]+(r23*52&-1)+32>>2]=HEAP32[r14>>2]-(-(r10&1^1)&5)|0;if(r10){_fseek(r13,0,0)}else{r10=_fgetc(r2)&255|_fgetc(r2)<<8&65280;HEAP32[HEAP32[r22]+(r23*52&-1)+36>>2]=r10;r10=_fgetc(r2)&255|_fgetc(r2)<<8&65280;HEAP32[HEAP32[r22]+(r23*52&-1)+40>>2]=r10;r10=HEAP32[r22]>>2;HEAP32[((r23*52&-1)+44>>2)+r10]=(HEAP32[((r23*52&-1)+40>>2)+r10]|0)>(HEAP32[((r23*52&-1)+36>>2)+r10]|0)?2:0}HEAP32[HEAP32[HEAP32[r25]+(r23*764&-1)+756>>2]+8>>2]=128;HEAP32[HEAP32[HEAP32[r25]+(r23*764&-1)+756>>2]>>2]=64;HEAP32[HEAP32[HEAP32[r25]+(r23*764&-1)+756>>2]+40>>2]=r23;_load_sample(r13,2,HEAP32[r22]+(HEAP32[HEAP32[HEAP32[r25]+(r23*764&-1)+756>>2]+40>>2]*52&-1)|0,0);_fclose(r13)}if((r5|0)<(HEAP32[r16]|0)){r23=r5}else{break L329}}}}while(0);if((HEAP32[r3]|0)>0){r26=0}else{STACKTOP=r6;return 0}while(1){HEAP32[((r26*12&-1)+184>>2)+r4]=(r26|0)%2*255&-1;r16=r26+1|0;if((r16|0)<(HEAP32[r3]|0)){r26=r16}else{break}}STACKTOP=r6;return 0}function _amd_test(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+76|0;r6=r5;r7=r5+64;_fseek(r1,r3+1062|0,0);r8=r7|0;L347:do{if(_fread(r8,1,9,r1)>>>0<9){r9=-1}else{if((_memcmp(r8,5265504,2)|0)!=0){r9=-1;break}if((_memcmp(r7+6|0,5264752,3)|0)!=0){r9=-1;break}_fseek(r1,r3,0);r10=r6|0;if((r2|0)==0){r9=0;break}_memset(r2,0,25);_fread(r10,1,24,r1);HEAP8[r6+24|0]=0;_memset(r2,0,25);_strncpy(r2,r10,24);r10=HEAP8[r2];if(r10<<24>>24==0){r9=0;break}else{r11=0;r12=r2;r13=r10}while(1){do{if((_isprint(r13<<24>>24)|0)==0){r4=248}else{if(HEAP8[r12]<<24>>24<0){r4=248;break}else{break}}}while(0);if(r4==248){r4=0;HEAP8[r12]=46}r10=r11+1|0;r14=r2+r10|0;r15=HEAP8[r14];if(r15<<24>>24!=0&(r10|0)<24){r11=r10;r12=r14;r13=r15}else{break}}if(HEAP8[r2]<<24>>24==0){r9=0;break}while(1){r15=r2+(_strlen(r2)-1)|0;if(HEAP8[r15]<<24>>24!=32){r9=0;break L347}HEAP8[r15]=0;if(HEAP8[r2]<<24>>24==0){r9=0;break L347}}}}while(0);STACKTOP=r5;return r9}function _amd_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28;r4=r1>>2;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+1084|0;r7=r6;r8=r6+1072;_fseek(r2,r3,0);r3=r7|0;_fread(r3,24,1,r2);_fread(r7+24|0,24,1,r2);r9=0;while(1){_fread(r7+(r9*34&-1)+48|0,23,1,r2);_fread(r7+(r9*34&-1)+71|0,11,1,r2);r10=r9+1|0;if((r10|0)==26){break}else{r9=r10}}r9=r7+932|0;HEAP8[r9]=_fgetc(r2)&255;r10=r7+933|0;HEAP8[r10]=_fgetc(r2)&255;r11=r7+934|0;_fread(r11,128,1,r2);_fread(r7+1062|0,9,1,r2);r12=r7+1071|0;HEAP8[r12]=_fgetc(r2)&255;r13=(r1+136|0)>>2;HEAP32[r13]=9;HEAP32[r4+38]=125;HEAP32[r4+37]=6;r14=HEAPU8[r9];HEAP32[r4+39]=r14;r9=(r1+128|0)>>2;HEAP32[r9]=HEAPU8[r10]+1|0;r10=(r1+140|0)>>2;HEAP32[r10]=26;r15=r1+144|0;HEAP32[r15>>2]=0;_memcpy(r1+952|0,r11,r14);_set_type(r1,5266508,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));_strncpy(r1|0,r3,24);r3=(r1+176|0)>>2;HEAP32[r3]=_calloc(764,HEAP32[r10]);r14=HEAP32[r15>>2];if((r14|0)!=0){HEAP32[r4+45]=_calloc(52,r14)}L371:do{if((HEAP32[r10]|0)>0){r14=r8|0;r15=0;while(1){r11=_calloc(64,1);HEAP32[HEAP32[r3]+(r15*764&-1)+756>>2]=r11;r11=HEAP32[r3];r16=r11+(r15*764&-1)|0;_memset(r16,0,24);_strncpy(r16,r7+(r15*34&-1)+48|0,23);r17=HEAP8[r16];L375:do{if(r17<<24>>24!=0){r18=0;r19=r16;r20=r17;while(1){do{if((_isprint(r20<<24>>24)|0)==0){r5=263}else{if(HEAP8[r19]<<24>>24<0){r5=263;break}else{break}}}while(0);if(r5==263){r5=0;HEAP8[r19]=46}r21=r18+1|0;r22=r11+(r15*764&-1)+r21|0;r23=HEAP8[r22];if(r23<<24>>24!=0&(r21|0)<23){r18=r21;r19=r22;r20=r23}else{break}}if(HEAP8[r16]<<24>>24==0){break}while(1){r20=_strlen(r16)-1+r11+(r15*764&-1)|0;if(HEAP8[r20]<<24>>24!=32){break L375}HEAP8[r20]=0;if(HEAP8[r16]<<24>>24==0){break L375}}}}while(0);HEAP32[HEAP32[r3]+(r15*764&-1)+36>>2]=1;HEAP32[HEAP32[HEAP32[r3]+(r15*764&-1)+756>>2]>>2]=64;HEAP32[HEAP32[HEAP32[r3]+(r15*764&-1)+756>>2]+8>>2]=128;HEAP32[HEAP32[HEAP32[r3]+(r15*764&-1)+756>>2]+40>>2]=r15;HEAP32[HEAP32[HEAP32[r3]+(r15*764&-1)+756>>2]+12>>2]=-1;HEAP8[r14]=HEAP8[r7+(r15*34&-1)+71|0];HEAP8[r8+1|0]=HEAP8[r7+(r15*34&-1)+76|0];HEAP8[r8+2|0]=HEAP8[r7+(r15*34&-1)+72|0];HEAP8[r8+3|0]=HEAP8[r7+(r15*34&-1)+77|0];HEAP8[r8+4|0]=HEAP8[r7+(r15*34&-1)+73|0];HEAP8[r8+5|0]=HEAP8[r7+(r15*34&-1)+78|0];HEAP8[r8+6|0]=HEAP8[r7+(r15*34&-1)+74|0];HEAP8[r8+7|0]=HEAP8[r7+(r15*34&-1)+79|0];HEAP8[r8+8|0]=HEAP8[r7+(r15*34&-1)+75|0];HEAP8[r8+9|0]=HEAP8[r7+(r15*34&-1)+80|0];HEAP8[r8+10|0]=HEAP8[r7+(r15*34&-1)+81|0];r16=_malloc(15);HEAP32[12]=r16;if((r16|0)!=0){HEAP32[r16>>2]=0;throw"fault on read from 48";r16=$44+4|0;HEAP32[12]=r16;_memcpy(r16,r14,11);throw"fault on read from 44";HEAP32[11]=$45|32768;HEAP32[8]=11}r16=r15+1|0;if((r16|0)<(HEAP32[r10]|0)){r15=r16}else{break L371}}}}while(0);if(HEAP8[r12]<<24>>24==0){r24=-1;STACKTOP=r6;return r24}r12=(r1+168|0)>>2;HEAP32[r12]=_calloc(4,HEAP32[r9]+1|0);r10=(r1+132|0)>>2;L395:do{if((HEAP32[r9]|0)>0){r7=0;while(1){r8=_calloc(1,(HEAP32[r13]<<2)+4|0);HEAP32[HEAP32[r12]+(r7<<2)>>2]=r8;r8=0;while(1){r3=_fgetc(r2)&255|_fgetc(r2)<<8&65280;HEAP32[HEAP32[HEAP32[r12]+(r7<<2)>>2]+(r8<<2)+4>>2]=r3;if((r3|0)>(HEAP32[r10]|0)){HEAP32[r10]=r3}r3=r8+1|0;if((r3|0)==9){break}else{r8=r3}}HEAP32[HEAP32[HEAP32[r12]+(r7<<2)>>2]>>2]=64;r8=r7+1|0;if((r8|0)<(HEAP32[r9]|0)){r7=r8}else{break L395}}}}while(0);HEAP32[r10]=HEAP32[r10]+1|0;r9=_fgetc(r2)&255;r12=_fgetc(r2)<<8;r7=(r1+172|0)>>2;HEAP32[r7]=_calloc(4,HEAP32[r10]);r1=r12&65280|r9;HEAP32[r10]=r1;L405:do{if((r1|0)!=0){r9=0;r12=1;while(1){r8=_fgetc(r2)&255;r3=_fgetc(r2)<<8;r5=_calloc(524,1);r15=r3&65280|r8;HEAP32[HEAP32[r7]+(r15<<2)>>2]=r5;HEAP32[HEAP32[HEAP32[r7]+(r15<<2)>>2]>>2]=64;r5=0;r8=r12;while(1){r3=HEAP32[HEAP32[r7]+(r15<<2)>>2];r14=_fgetc(r2);do{if((r14&128|0)==0){r16=(r5<<3)+r3+8|0;HEAP8[r16]=r14&255;r11=_fgetc(r2)&255;r17=(r5<<3)+r3+5|0;HEAP8[r17]=(r11&255)>>>4;r20=r11&15;r11=r20&255;do{if((r11|0)==4){r25=12;r26=r8}else if((r11|0)==1|(r11|0)==2|(r11|0)==3|(r11|0)==8|(r11|0)==9){HEAP8[r16]=0;r25=0;r26=r8}else if((r11|0)==5){r25=11;r26=r8}else if((r11|0)==6){r25=13;r26=r8}else if((r11|0)==7){r19=HEAP8[r16];r18=r19<<24>>24==0?3:r8;if((r19&255)>31){HEAP8[r16]=0;r25=0;r26=r18;break}else{HEAP8[r16]=Math.imul(r18,r19&255)&255;r25=15;r26=r18;break}}else{r25=r20;r26=r8}}while(0);HEAP8[(r5<<3)+r3+7|0]=r25;r20=_fgetc(r2)&255;HEAP8[r17]=r20<<4&16|HEAP8[r17];r16=(r20&255)>>>4;r11=(r5<<3)+r3+4|0;HEAP8[r11]=r16;if(r16<<24>>24==0){r27=r26;r28=r5;break}HEAP8[r11]=(r16+24&255)+(((r20&255)>>>1&7)*12&255)&255;r27=r26;r28=r5}else{r27=r8;r28=r5-1+(r14&127)|0}}while(0);r14=r28+1|0;if((r14|0)<64){r5=r14;r8=r27}else{break}}r8=r9+1|0;if((r8|0)<(HEAP32[r10]|0)){r9=r8;r12=r27}else{break L405}}}}while(0);L427:do{if((HEAP32[r13]|0)>0){r27=0;while(1){HEAP32[((r27*12&-1)+184>>2)+r4]=128;HEAP32[((r27*12&-1)+192>>2)+r4]=1;r10=r27+1|0;if((r10|0)<(HEAP32[r13]|0)){r27=r10}else{break L427}}}}while(0);HEAP32[r4+1638]=5246980;r24=0;STACKTOP=r6;return r24}function _amf_test(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+68|0;r5=r4;r6=r4+64;r7=r6|0;L433:do{if(_fread(r7,1,3,r1)>>>0>2&HEAP8[r7]<<24>>24==65){if(HEAP8[r6+1|0]<<24>>24!=77){r8=-1;break}if(HEAP8[r6+2|0]<<24>>24!=70){r8=-1;break}if(((_fgetc(r1)&255)-10&255)>4){r8=-1;break}r9=r5|0;if((r2|0)==0){r8=0;break}_memset(r2,0,33);_fread(r9,1,32,r1);HEAP8[r5+32|0]=0;_memset(r2,0,33);_strncpy(r2,r9,32);r9=HEAP8[r2];if(r9<<24>>24==0){r8=0;break}else{r10=0;r11=r2;r12=r9}while(1){do{if((_isprint(r12<<24>>24)|0)==0){r3=308}else{if(HEAP8[r11]<<24>>24<0){r3=308;break}else{break}}}while(0);if(r3==308){r3=0;HEAP8[r11]=46}r9=r10+1|0;r13=r2+r9|0;r14=HEAP8[r13];if(r14<<24>>24!=0&(r9|0)<32){r10=r9;r11=r13;r12=r14}else{break}}if(HEAP8[r2]<<24>>24==0){r8=0;break}while(1){r14=r2+(_strlen(r2)-1)|0;if(HEAP8[r14]<<24>>24!=32){r8=0;break L433}HEAP8[r14]=0;if(HEAP8[r2]<<24>>24==0){r8=0;break L433}}}else{r8=-1}}while(0);STACKTOP=r4;return r8}function _amf_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+1024|0;r6=r5;_fseek(r2,r3,0);r3=r6|0;_fread(r3,1,3,r2);r7=_fgetc(r2);r8=r7&255;r9=r7&255;_fread(r3,1,32,r2);_strncpy(r1|0,r3,32);r7=Math.floor((r8&255)/10)&255;_set_type(r1,5266484,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r7,HEAP32[tempInt+4>>2]=(r8&255)%10&255,tempInt));r7=(r1+140|0)>>2;HEAP32[r7]=_fgetc(r2)&255;r10=(r1+156|0)>>2;HEAP32[r10]=_fgetc(r2)&255;r11=(r1+132|0)>>2;HEAP32[r11]=_fgetc(r2)&255|_fgetc(r2)<<8&65280;r12=(r1+136|0)>>2;HEAP32[r12]=_fgetc(r2)&255;r13=r1+144|0;HEAP32[r13>>2]=HEAP32[r7];r14=(r1+128|0)>>2;HEAP32[r14]=HEAP32[r10];do{if(r8<<24>>24==10){_fread(r3,1,16,r2)}else{if((r8&255)>12){_fread(r3,1,32,r2);HEAP32[r1+184>>2]=(HEAP8[r6+31|0]<<24>>24<<1)+128|0;HEAP32[r1+152>>2]=_fgetc(r2)&255;HEAP32[r1+148>>2]=_fgetc(r2)&255;break}if((r8&255)<=10){break}_fread(r3,1,16,r2)}}while(0);L460:do{if((HEAP32[r10]|0)>0){r6=0;while(1){HEAP8[r1+(r6+952)|0]=r6&255;r15=r6+1|0;if((r15|0)<(HEAP32[r10]|0)){r6=r15}else{break L460}}}}while(0);r10=(r1+168|0)>>2;HEAP32[r10]=_calloc(4,HEAP32[r14]+1|0);L464:do{if((HEAP32[r14]|0)>0){r6=(r8&255)>13;r15=0;r16=HEAP32[r12];while(1){r17=_calloc(1,(r16<<2)+4|0);HEAP32[HEAP32[r10]+(r15<<2)>>2]=r17;if(r6){r18=_fgetc(r2)&255|_fgetc(r2)<<8&65280}else{r18=64}HEAP32[HEAP32[HEAP32[r10]+(r15<<2)>>2]>>2]=r18;r17=HEAP32[r12];L471:do{if((r17|0)>0){r19=0;while(1){r20=_fgetc(r2)&255|_fgetc(r2)<<8&65280;HEAP32[HEAP32[HEAP32[r10]+(r15<<2)>>2]+(r19<<2)+4>>2]=r20;r20=r19+1|0;r21=HEAP32[r12];if((r20|0)<(r21|0)){r19=r20}else{r22=r21;break L471}}}else{r22=r17}}while(0);r17=r15+1|0;if((r17|0)<(HEAP32[r14]|0)){r15=r17;r16=r22}else{break L464}}}}while(0);r22=(r1+176|0)>>2;HEAP32[r22]=_calloc(764,HEAP32[r7]);r18=HEAP32[r13>>2];if((r18|0)!=0){HEAP32[r1+180>>2]=_calloc(52,r18)}if((r8&255)<11){r8=_ftell(r2);r18=0;while(1){if((r18|0)>=(HEAP32[r7]|0)){r23=r9;break}if((_fgetc(r2)&255)>=2){r23=9;break}_fseek(r2,45,1);r13=_fgetc(r2)&255;r16=_fgetc(r2);if((r16<<8&65280|r13|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24)>>>0>1048576){r23=9;break}r13=_fgetc(r2)&255;r16=_fgetc(r2);r15=r16<<8&65280|r13|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;if((r15|0)>1048576){r23=9;break}if((_fgetc(r2)&255|(_fgetc(r2)&65535)<<8)<<16>>16==0){r23=9;break}if((_fgetc(r2)&255)>64){r23=9;break}r13=_fgetc(r2)&255;r16=_fgetc(r2);if((r16<<8&65280|r13|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24|0)>(r15|0)){r23=9;break}r13=_fgetc(r2)&255;r16=_fgetc(r2);if((r16<<8&65280|r13|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24|0)>(r15|0)){r23=9;break}else{r18=r18+1|0}}_fseek(r2,r8,0);r24=r23}else{r24=r9}L492:do{if((HEAP32[r7]|0)>0){r9=(r1+180|0)>>2;r23=(r24|0)<10;r8=0;while(1){r18=_calloc(64,1);HEAP32[HEAP32[r22]+(r8*764&-1)+756>>2]=r18;r18=(_fgetc(r2)&255)<<24>>24!=0&1;HEAP32[HEAP32[r22]+(r8*764&-1)+36>>2]=r18;_fread(r3,1,32,r2);r18=HEAP32[r22];r15=r18+(r8*764&-1)|0;_memset(r15,0,33);_strncpy(r15,r3,32);r13=HEAP8[r15];L496:do{if(r13<<24>>24!=0){r16=0;r6=r15;r17=r13;while(1){do{if((_isprint(r17<<24>>24)|0)==0){r4=347}else{if(HEAP8[r6]<<24>>24<0){r4=347;break}else{break}}}while(0);if(r4==347){r4=0;HEAP8[r6]=46}r19=r16+1|0;r21=r18+(r8*764&-1)+r19|0;r20=HEAP8[r21];if(r20<<24>>24!=0&(r19|0)<32){r16=r19;r6=r21;r17=r20}else{break}}if(HEAP8[r15]<<24>>24==0){break}while(1){r17=_strlen(r15)-1+r18+(r8*764&-1)|0;if(HEAP8[r17]<<24>>24!=32){break L496}HEAP8[r17]=0;if(HEAP8[r15]<<24>>24==0){break L496}}}}while(0);_fread(r3,1,13,r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);HEAP32[HEAP32[HEAP32[r22]+(r8*764&-1)+756>>2]+40>>2]=r8;HEAP32[HEAP32[HEAP32[r22]+(r8*764&-1)+756>>2]+8>>2]=128;r15=_fgetc(r2)&255;r18=_fgetc(r2);r13=r18<<8&65280|r15|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;HEAP32[HEAP32[r9]+(r8*52&-1)+32>>2]=r13;r13=_fgetc(r2)&255|_fgetc(r2)<<8&65280;r15=HEAP32[HEAP32[r22]+(r8*764&-1)+756>>2];r18=r15+12|0;r17=r15+16|0;if((r13|0)==0){HEAP32[r17>>2]=0;HEAP32[r18>>2]=0}else{r15=Math.log((r13|0)/8363)*1536/.6931471805599453&-1;HEAP32[r18>>2]=(r15|0)/128&-1;HEAP32[r17>>2]=(r15|0)%128}r15=_fgetc(r2)&255;HEAP32[HEAP32[HEAP32[r22]+(r8*764&-1)+756>>2]>>2]=r15;r15=_fgetc(r2)&255;r17=_fgetc(r2);if(r23){HEAP32[HEAP32[r9]+(r8*52&-1)+36>>2]=r17<<8&65280|r15;r18=HEAP32[r9];HEAP32[r18+(r8*52&-1)+40>>2]=HEAP32[r18+(r8*52&-1)+32>>2]-1|0;r18=HEAP32[r9];HEAP32[r18+(r8*52&-1)+44>>2]=(HEAP32[r18+(r8*52&-1)+36>>2]|0)>0?2:0}else{r18=r17<<8&65280|r15|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;HEAP32[HEAP32[r9]+(r8*52&-1)+36>>2]=r18;r18=_fgetc(r2)&255;r15=_fgetc(r2);r17=r15<<8&65280|r18|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;HEAP32[HEAP32[r9]+(r8*52&-1)+40>>2]=r17;r17=HEAP32[r9]>>2;HEAP32[((r8*52&-1)+44>>2)+r17]=(HEAP32[((r8*52&-1)+40>>2)+r17]|0)>(HEAP32[((r8*52&-1)+36>>2)+r17]|0)?2:0}r17=r8+1|0;if((r17|0)<(HEAP32[r7]|0)){r8=r17}else{break L492}}}}while(0);r3=_calloc(4,HEAP32[r11]);r24=r3;L518:do{if((HEAP32[r11]|0)>0){r8=0;r9=0;while(1){r23=_fgetc(r2)&255|_fgetc(r2)<<8&65280;HEAP32[r24+(r9<<2)>>2]=r23;r17=(r23|0)>(r8|0)?r23:r8;r23=r9+1|0;if((r23|0)<(HEAP32[r11]|0)){r8=r17;r9=r23}else{r25=r17;break L518}}}else{r25=0}}while(0);r9=HEAP32[r14];L522:do{if((r9|0)>0){r8=0;r17=HEAP32[r12];r23=r9;while(1){if((r17|0)>0){r18=0;while(1){r15=(r18<<2)+HEAP32[HEAP32[r10]+(r8<<2)>>2]+4|0;r13=HEAP32[r15>>2]-1|0;do{if((r13|0)<0){r4=365}else{if((r13|0)>(HEAP32[r11]|0)){r4=365;break}else{r26=r13;break}}}while(0);if(r4==365){r4=0;r26=0}HEAP32[r15>>2]=HEAP32[r24+(r26<<2)>>2];r13=r18+1|0;r27=HEAP32[r12];if((r13|0)<(r27|0)){r18=r13}else{break}}r28=r27;r29=HEAP32[r14]}else{r28=r17;r29=r23}r18=r8+1|0;if((r18|0)<(r29|0)){r8=r18;r17=r28;r23=r29}else{break L522}}}}while(0);HEAP32[r11]=r25;_free(r3);r3=HEAP32[r11]+1|0;HEAP32[r11]=r3;r25=(r1+172|0)>>2;HEAP32[r25]=_calloc(4,r3);r3=_calloc(523,1);HEAP32[HEAP32[r25]>>2]=r3;HEAP32[HEAP32[HEAP32[r25]>>2]>>2]=64;L537:do{if((HEAP32[r11]|0)>1){r3=1;while(1){r29=_calloc(523,1);HEAP32[HEAP32[r25]+(r3<<2)>>2]=r29;HEAP32[HEAP32[HEAP32[r25]+(r3<<2)>>2]>>2]=64;r29=_fgetc(r2)&255;r28=_fgetc(r2)<<8&65280|r29|_fgetc(r2)<<16&16711680;L540:do{if((r28|0)!=0){r29=0;while(1){r14=_fgetc(r2);r27=_fgetc(r2);r12=r27&255;r26=_fgetc(r2);r24=r26&255;r4=r14&255;if((r14&255)<<24>>24==-1&r12<<24>>24==-1&r24<<24>>24==-1){break L540}r14=HEAP32[HEAP32[r25]+(r3<<2)>>2];r10=(r4<<3)+r14+4|0;r9=r27&255;do{if((r12&255)<127){if(r12<<24>>24!=0){HEAP8[r10|0]=r12+1&255}HEAP8[(r4<<3)+r14+6|0]=r24}else{if(r12<<24>>24==127){r27=(r4-1<<3)+r14+4|0;r23=r10;r17=r27|0;r8=r27+4|0;r27=HEAPU8[r8]|HEAPU8[r8+1|0]<<8|HEAPU8[r8+2|0]<<16|HEAPU8[r8+3|0]<<24|0;r8=r23|0;tempBigInt=HEAPU8[r17]|HEAPU8[r17+1|0]<<8|HEAPU8[r17+2|0]<<16|HEAPU8[r17+3|0]<<24|0;HEAP8[r8]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r8+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r8+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r8+3|0]=tempBigInt&255;r8=r23+4|0;tempBigInt=r27;HEAP8[r8]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r8+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r8+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r8+3|0]=tempBigInt&255;break}else if(r12<<24>>24==-128){HEAP8[(r4<<3)+r14+5|0]=r24+1&255;break}else{do{if((r9|0)==140){r30=13;r31=r24}else if((r9|0)==141){r30=11;r31=r24}else if((r9|0)==143){r30=14;r31=r24&15|-112}else if((r9|0)==144){r30=9;r31=r24}else if((r9|0)==145){r8=r26&15;if(r24<<24>>24>0){r30=14;r31=(r8|160)&255;break}else{r30=14;r31=(r8|176)&255;break}}else if((r9|0)==146){r30=r24<<24>>24>0?2:1;r31=-16}else if((r9|0)==147){r30=14;r31=r24&15|-48}else if((r9|0)==148){r30=14;r31=r24&15|-64}else if((r9|0)==149){r30=15;r31=(r24&255)<33?33:r24}else if((r9|0)==150){r30=r24<<24>>24>0?2:1;r31=-32}else if((r9|0)==151){r30=8;r31=r24<<1^-128}else if((r9|0)==129){r30=15;r31=r24}else if((r9|0)==130){if(r24<<24>>24>0){r30=10;r31=r24<<4;break}else{r30=10;r31=-r24&15;break}}else if((r9|0)==131){HEAP8[(r4<<3)+r14+6|0]=r24;r30=0;r31=0}else if((r9|0)==132){r30=1;r31=r24<<24>>24==-128?0:-r24&255}else if((r9|0)==134){r30=3;r31=r24}else if((r9|0)==135){r30=7;r31=r24}else if((r9|0)==136){r30=0;r31=r24}else if((r9|0)==137){r30=4;r31=r24}else if((r9|0)==138){if(r24<<24>>24>0){r30=5;r31=r24<<4;break}else{r30=5;r31=-r24&15;break}}else if((r9|0)==139){if(r24<<24>>24>0){r30=6;r31=r24<<4;break}else{r30=6;r31=-r24&15;break}}else{r30=0;r31=0}}while(0);HEAP8[(r4<<3)+r14+7|0]=r30;HEAP8[(r4<<3)+r14+8|0]=r31;break}}}while(0);r14=r29+1|0;if((r14|0)<(r28|0)){r29=r14}else{break L540}}}}while(0);r28=r3+1|0;if((r28|0)<(HEAP32[r11]|0)){r3=r28}else{break L537}}}}while(0);if((HEAP32[r7]|0)<=0){r32=r1+1276|0,r33=r32>>2;r34=HEAP32[r33];r35=r34|32;HEAP32[r33]=r35;STACKTOP=r5;return 0}r11=r1+180|0;r31=0;while(1){_load_sample(r2,2,HEAP32[r11>>2]+(HEAP32[HEAP32[HEAP32[r22]+(r31*764&-1)+756>>2]+40>>2]*52&-1)|0,0);r30=r31+1|0;if((r30|0)<(HEAP32[r7]|0)){r31=r30}else{break}}r32=r1+1276|0,r33=r32>>2;r34=HEAP32[r33];r35=r34|32;HEAP32[r33]=r35;STACKTOP=r5;return 0}function _get_anam(r1,r2,r3,r4){return}function _arch_test(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+64|0;r5=r4;r6=_fgetc(r1);r7=_fgetc(r1);if((r7<<16&16711680|r6<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255|0)!=1297437528){r8=-1;STACKTOP=r4;return r8}_fgetc(r1);_fgetc(r1);_fgetc(r1);_fgetc(r1);L603:do{if((_feof(r1)|0)==0){while(1){r6=_fgetc(r1);r7=_fgetc(r1);r9=r7<<16&16711680|r6<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255;r6=_fgetc(r1);r7=_fgetc(r1);r10=_fgetc(r1);r11=_fgetc(r1);if((r9|0)==1296974157){break}_fseek(r1,r7<<8&65280|r6&255|r10<<16&16711680|r11<<24,1);if((_feof(r1)|0)!=0){break L603}}r11=r5|0;if((r2|0)==0){r8=0;STACKTOP=r4;return r8}_memset(r2,0,33);_fread(r11,1,32,r1);HEAP8[r5+32|0]=0;_memset(r2,0,33);_strncpy(r2,r11,32);r11=HEAP8[r2];if(r11<<24>>24==0){r8=0;STACKTOP=r4;return r8}else{r12=0;r13=r2;r14=r11}while(1){do{if((_isprint(r14<<24>>24)|0)==0){r3=427}else{if(HEAP8[r13]<<24>>24<0){r3=427;break}else{break}}}while(0);if(r3==427){r3=0;HEAP8[r13]=46}r11=r12+1|0;r10=r2+r11|0;r6=HEAP8[r10];if(r6<<24>>24!=0&(r11|0)<32){r12=r11;r13=r10;r14=r6}else{break}}if(HEAP8[r2]<<24>>24==0){r8=0;STACKTOP=r4;return r8}while(1){r6=r2+(_strlen(r2)-1)|0;if(HEAP8[r6]<<24>>24!=32){r8=0;r3=446;break}HEAP8[r6]=0;if(HEAP8[r2]<<24>>24==0){r8=0;r3=442;break}}if(r3==442){STACKTOP=r4;return r8}else if(r3==446){STACKTOP=r4;return r8}}}while(0);r14=r5|0;if((r2|0)==0){r8=0;STACKTOP=r4;return r8}HEAP8[r2]=0;_fread(r14,1,0,r1);HEAP8[r14]=0;HEAP8[r2]=0;_strncpy(r2,r14,0);if(HEAP8[r2]<<24>>24==0){r8=0;STACKTOP=r4;return r8}while(1){r14=r2+(_strlen(r2)-1)|0;if(HEAP8[r14]<<24>>24!=32){r8=0;r3=438;break}HEAP8[r14]=0;if(HEAP8[r2]<<24>>24==0){r8=0;r3=441;break}}if(r3==438){STACKTOP=r4;return r8}else if(r3==441){STACKTOP=r4;return r8}}function _arch_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r4=STACKTOP;STACKTOP=STACKTOP+96|0;r5=r4;_fseek(r2,r3,0);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r3=r5>>2;HEAP32[r3]=0;HEAP32[r3+1]=0;HEAP32[r3+2]=0;HEAP32[r3+3]=0;HEAP32[r3+4]=0;r3=_malloc(16);if((r3|0)==0){r6=-1;STACKTOP=r4;return r6}r7=r3;r8=r3;HEAP32[r8>>2]=r7;r9=(r3+4|0)>>2;HEAP32[r9]=r7;HEAP32[r3+8>>2]=4;r10=(r3+12|0)>>2;HEAP32[r10]=0;r11=_malloc(20);HEAP8[r11]=HEAP8[5266476];HEAP8[r11+1|0]=HEAP8[5266477|0];HEAP8[r11+2|0]=HEAP8[5266478|0];HEAP8[r11+3|0]=HEAP8[5266479|0];HEAP8[r11+4|0]=HEAP8[5266480|0];HEAP32[r11+8>>2]=350;r12=r11+12|0;r13=r12;r14=HEAP32[r9];HEAP32[r9]=r13;HEAP32[r12>>2]=r7;HEAP32[r11+16>>2]=r14;HEAP32[r14>>2]=r13;r13=_malloc(20);HEAP8[r13]=HEAP8[5265480];HEAP8[r13+1|0]=HEAP8[5265481|0];HEAP8[r13+2|0]=HEAP8[5265482|0];HEAP8[r13+3|0]=HEAP8[5265483|0];HEAP8[r13+4|0]=HEAP8[5265484|0];HEAP32[r13+8>>2]=610;r14=r13+12|0;r11=r14;r12=HEAP32[r9];HEAP32[r9]=r11;HEAP32[r14>>2]=r7;HEAP32[r13+16>>2]=r12;HEAP32[r12>>2]=r11;r11=_malloc(20);HEAP8[r11]=HEAP8[5264728];HEAP8[r11+1|0]=HEAP8[5264729|0];HEAP8[r11+2|0]=HEAP8[5264730|0];HEAP8[r11+3|0]=HEAP8[5264731|0];HEAP8[r11+4|0]=HEAP8[5264732|0];HEAP32[r11+8>>2]=384;r12=r11+12|0;r13=r12;r14=HEAP32[r9];HEAP32[r9]=r13;HEAP32[r12>>2]=r7;HEAP32[r11+16>>2]=r14;HEAP32[r14>>2]=r13;r13=_malloc(20);HEAP8[r13]=HEAP8[5264236];HEAP8[r13+1|0]=HEAP8[5264237|0];HEAP8[r13+2|0]=HEAP8[5264238|0];HEAP8[r13+3|0]=HEAP8[5264239|0];HEAP8[r13+4|0]=HEAP8[5264240|0];HEAP32[r13+8>>2]=328;r14=r13+12|0;r11=r14;r12=HEAP32[r9];HEAP32[r9]=r11;HEAP32[r14>>2]=r7;HEAP32[r13+16>>2]=r12;HEAP32[r12>>2]=r11;r11=_malloc(20);HEAP8[r11]=HEAP8[5263716];HEAP8[r11+1|0]=HEAP8[5263717|0];HEAP8[r11+2|0]=HEAP8[5263718|0];HEAP8[r11+3|0]=HEAP8[5263719|0];HEAP8[r11+4|0]=HEAP8[5263720|0];HEAP32[r11+8>>2]=584;r12=r11+12|0;r13=r12;r14=HEAP32[r9];HEAP32[r9]=r13;HEAP32[r12>>2]=r7;HEAP32[r11+16>>2]=r14;HEAP32[r14>>2]=r13;r13=_malloc(20);HEAP8[r13]=HEAP8[5263192];HEAP8[r13+1|0]=HEAP8[5263193|0];HEAP8[r13+2|0]=HEAP8[5263194|0];HEAP8[r13+3|0]=HEAP8[5263195|0];HEAP8[r13+4|0]=HEAP8[5263196|0];HEAP32[r13+8>>2]=192;r14=r13+12|0;r11=r14;r12=HEAP32[r9];HEAP32[r9]=r11;HEAP32[r14>>2]=r7;HEAP32[r13+16>>2]=r12;HEAP32[r12>>2]=r11;r11=_malloc(20);HEAP8[r11]=HEAP8[5262948];HEAP8[r11+1|0]=HEAP8[5262949|0];HEAP8[r11+2|0]=HEAP8[5262950|0];HEAP8[r11+3|0]=HEAP8[5262951|0];HEAP8[r11+4|0]=HEAP8[5262952|0];HEAP32[r11+8>>2]=528;r12=r11+12|0;r13=r12;r14=HEAP32[r9];HEAP32[r9]=r13;HEAP32[r12>>2]=r7;HEAP32[r11+16>>2]=r14;HEAP32[r14>>2]=r13;r13=_malloc(20);HEAP8[r13]=HEAP8[5263936];HEAP8[r13+1|0]=HEAP8[5263937|0];HEAP8[r13+2|0]=HEAP8[5263938|0];HEAP8[r13+3|0]=HEAP8[5263939|0];HEAP8[r13+4|0]=HEAP8[5263940|0];HEAP32[r13+8>>2]=204;r14=r13+12|0;r11=r14;r12=HEAP32[r9];HEAP32[r9]=r11;HEAP32[r14>>2]=r7;HEAP32[r13+16>>2]=r12;HEAP32[r12>>2]=r11;r11=_malloc(20);HEAP8[r11]=HEAP8[5266284];HEAP8[r11+1|0]=HEAP8[5266285|0];HEAP8[r11+2|0]=HEAP8[5266286|0];HEAP8[r11+3|0]=HEAP8[5266287|0];HEAP8[r11+4|0]=HEAP8[5266288|0];HEAP32[r11+8>>2]=602;r12=r11+12|0;r13=r12;r14=HEAP32[r9];HEAP32[r9]=r13;HEAP32[r12>>2]=r7;HEAP32[r11+16>>2]=r14;HEAP32[r14>>2]=r13;r13=_malloc(20);HEAP8[r13]=HEAP8[5263320];HEAP8[r13+1|0]=HEAP8[5263321|0];HEAP8[r13+2|0]=HEAP8[5263322|0];HEAP8[r13+3|0]=HEAP8[5263323|0];HEAP8[r13+4|0]=HEAP8[5263324|0];HEAP32[r13+8>>2]=186;r14=r13+12|0;r11=r14;r12=HEAP32[r9];HEAP32[r9]=r11;HEAP32[r14>>2]=r7;HEAP32[r13+16>>2]=r12;HEAP32[r12>>2]=r11;r11=_malloc(20);HEAP8[r11]=HEAP8[5265860];HEAP8[r11+1|0]=HEAP8[5265861|0];HEAP8[r11+2|0]=HEAP8[5265862|0];HEAP8[r11+3|0]=HEAP8[5265863|0];HEAP8[r11+4|0]=HEAP8[5265864|0];HEAP32[r11+8>>2]=344;r12=r11+12|0;r13=r12;r14=HEAP32[r9];HEAP32[r9]=r13;HEAP32[r12>>2]=r7;HEAP32[r11+16>>2]=r14;HEAP32[r14>>2]=r13;HEAP32[r10]=HEAP32[r10]|1;L645:do{if((_feof(r2)|0)==0){r10=r5;while(1){_iff_chunk(r3,r1,r2,r10);if((_feof(r2)|0)!=0){break L645}}}}while(0);r2=HEAP32[r8>>2];L650:do{if((r2|0)!=(r7|0)){r8=r2;while(1){r5=r8-16+4|0;r10=HEAP32[r5+12>>2];r13=HEAP32[r5+16>>2];HEAP32[r10+4>>2]=r13;HEAP32[r13>>2]=r10;r10=HEAP32[r8>>2];_free(r5);if((r10|0)==(r7|0)){break L650}else{r8=r10}}}}while(0);_free(r3);r3=r1+136|0;if((HEAP32[r3>>2]|0)>0){r15=0}else{r6=0;STACKTOP=r4;return r6}while(1){HEAP32[r1+(r15*12&-1)+184>>2]=((r15+3|0)/2&-1|0)%2*255&-1;r7=r15+1|0;if((r7|0)<(HEAP32[r3>>2]|0)){r15=r7}else{r6=0;break}}STACKTOP=r4;return r6}function _get_tinf(r1,r2,r3,r4){r2=_fgetc(r3);r1=r4>>2;HEAP32[r1]=((r2>>>4&15)*10&-1)+(r2&15)|0;r2=_fgetc(r3);HEAP32[r1]=((r2&15)*100&-1)+HEAP32[r1]+((r2>>>4&15)*1e3&-1)|0;r2=_fgetc(r3);HEAP32[r4+4>>2]=((r2>>>4&15)*10&-1)+(r2&15)|0;r2=_fgetc(r3);HEAP32[r4+8>>2]=((r2>>>4&15)*10&-1)+(r2&15)|0;return}function _get_mvox(r1,r2,r3,r4){r4=_fgetc(r3)&255;r2=_fgetc(r3);HEAP32[r1+136>>2]=r2<<8&65280|r4|_fgetc(r3)<<16&16711680|_fgetc(r3)<<24;return}function _get_ster(r1,r2,r3,r4){var r5,r6,r7;_fread(r4+24|0,1,8,r3);r3=r1+136|0;r2=HEAP32[r3>>2];if((r2|0)>0){r5=0;r6=r2}else{return}while(1){r2=HEAP8[r5+(r4+24)|0];if(r2<<24>>24!=0&(r2&255)<8){HEAP32[r1+(r5*12&-1)+184>>2]=((r2&255)*42&-1)-40|0;r7=HEAP32[r3>>2]}else{r7=r6}r2=r5+1|0;if((r2|0)<(r7|0)){r5=r2;r6=r7}else{break}}return}function _get_mnam(r1,r2,r3,r4){_fread(r1|0,1,32,r3);return}function _get_mlen(r1,r2,r3,r4){r4=_fgetc(r3)&255;r2=_fgetc(r3);HEAP32[r1+156>>2]=r2<<8&65280|r4|_fgetc(r3)<<16&16711680|_fgetc(r3)<<24;return}function _get_pnum(r1,r2,r3,r4){r4=_fgetc(r3)&255;r2=_fgetc(r3);HEAP32[r1+128>>2]=r2<<8&65280|r4|_fgetc(r3)<<16&16711680|_fgetc(r3)<<24;return}function _get_plen(r1,r2,r3,r4){_fread(r4+32|0,1,64,r3);return}function _get_sequ(r1,r2,r3,r4){r4=STACKTOP;_fread(r1+952|0,1,128,r3);_set_type(r1,5262720,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r4;return}function _get_patt(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r2=r4+12|0;if((HEAP32[r2>>2]|0)==0){HEAP32[r2>>2]=1;HEAP32[1312657]=0;r2=r1+128|0;r5=r1+136|0;r6=Math.imul(HEAP32[r5>>2],HEAP32[r2>>2]);HEAP32[r1+132>>2]=r6;HEAP32[r1+172>>2]=_calloc(4,r6);r6=r1+168|0;HEAP32[r6>>2]=_calloc(4,HEAP32[r2>>2]+1|0);r2=r5,r7=r2>>2;r5=r6,r8=r5>>2}else{r2=r1+136|0,r7=r2>>2;r5=r1+168|0,r8=r5>>2}r5=_calloc(1,(HEAP32[r7]<<2)+4|0);HEAP32[HEAP32[r8]+(HEAP32[1312657]<<2)>>2]=r5;r5=HEAP32[1312657];HEAP32[HEAP32[HEAP32[r8]+(r5<<2)>>2]>>2]=HEAPU8[r5+(r4+32)|0];r5=HEAP32[r7];L680:do{if((r5|0)>0){r2=r1+172|0;r6=0;r9=r5;while(1){r10=HEAP32[1312657];r11=Math.imul(r10,r9)+r6|0;HEAP32[HEAP32[HEAP32[r8]+(r10<<2)>>2]+(r6<<2)+4>>2]=r11;r11=_calloc(HEAP32[HEAP32[HEAP32[r8]+(HEAP32[1312657]<<2)>>2]>>2]<<3|4,1);r10=Math.imul(HEAP32[r7],HEAP32[1312657])+r6|0;HEAP32[HEAP32[r2>>2]+(r10<<2)>>2]=r11;r11=HEAP32[1312657];r10=HEAP32[HEAP32[HEAP32[r8]+(r11<<2)>>2]>>2];r12=Math.imul(HEAP32[r7],r11)+r6|0;HEAP32[HEAP32[HEAP32[r2>>2]+(r12<<2)>>2]>>2]=r10;r10=r6+1|0;r12=HEAP32[r7];if((r10|0)<(r12|0)){r6=r10;r9=r12}else{r13=r12;break L680}}}else{r13=r5}}while(0);r5=HEAP32[1312657];if(HEAP8[r5+(r4+32)|0]<<24>>24==0){r14=r5;r15=r14+1|0;HEAP32[1312657]=r15;return}r9=r1+172|0;r1=0;r6=r13;r13=r5;while(1){L690:do{if((r6|0)>0){r5=0;r2=r13;while(1){r12=HEAP32[HEAP32[r9>>2]+(HEAP32[HEAP32[HEAP32[r8]+(r2<<2)>>2]+(r5<<2)+4>>2]<<2)>>2];r10=(r1<<3)+r12+8|0;HEAP8[r10]=_fgetc(r3)&255;r11=(r1<<3)+r12+7|0;HEAP8[r11]=_fgetc(r3)&255;HEAP8[(r1<<3)+r12+5|0]=_fgetc(r3)&255;r16=_fgetc(r3)&255;HEAP8[(r1<<3)+r12+4|0]=r16<<24>>24==0?0:r16+48&255;r16=HEAPU8[r11];do{if((r16|0)==0){HEAP8[r11]=0}else if((r16|0)==2){HEAP8[r11]=2}else if((r16|0)==11){HEAP8[r11]=13}else if((r16|0)==12){r12=HEAP8[r10];if((r12&255)<65){HEAP8[r11]=12;HEAP8[r10]=HEAP8[(r12&255)+5250372|0];break}else{HEAP8[r11]=0;HEAP8[r10]=0;break}}else if((r16|0)==3){HEAP8[r11]=3}else if((r16|0)==1){HEAP8[r11]=1}else if((r16|0)==16){HEAP8[r11]=-96}else if((r16|0)==17){HEAP8[r11]=-95}else if((r16|0)==19){HEAP8[r11]=11}else if((r16|0)==14|(r16|0)==25){r12=HEAP8[r10];if(r12<<24>>24!=0&(r12&255)<8){HEAP8[r11]=8;HEAP8[r10]=(r12*42&255)-40&255;break}else{HEAP8[r10]=0;HEAP8[r11]=0;break}}else if((r16|0)==21){HEAP8[r10]=0;HEAP8[r11]=0}else if((r16|0)==28){HEAP8[r11]=15}else if((r16|0)==31){HEAP8[r11]=12}else{HEAP8[r10]=0;HEAP8[r11]=0}}while(0);r11=r5+1|0;r10=HEAP32[r7];r16=HEAP32[1312657];if((r11|0)<(r10|0)){r5=r11;r2=r16}else{r17=r10;r18=r16;break L690}}}else{r17=r6;r18=r13}}while(0);r2=r1+1|0;if((r2|0)<(HEAPU8[r18+(r4+32)|0]|0)){r1=r2;r6=r17;r13=r18}else{r14=r18;break}}r15=r14+1|0;HEAP32[1312657]=r15;return}function _get_samp(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10;r2=r4+16|0;do{if((HEAP32[r2>>2]|0)==0){HEAP32[r1+140>>2]=36;r5=r1+144|0;HEAP32[r5>>2]=36;r6=r1+176|0;HEAP32[r6>>2]=_calloc(764,36);r7=HEAP32[r5>>2];if((r7|0)!=0){HEAP32[r1+180>>2]=_calloc(52,r7)}HEAP32[r2>>2]=1;HEAP32[r4+20>>2]=0;HEAP32[1312656]=0;r7=r6,r8=r7>>2}else{if((HEAP32[1312656]|0)>35){return}else{r7=r1+176|0,r8=r7>>2;break}}}while(0);r2=_calloc(64,1);HEAP32[HEAP32[r8]+(HEAP32[1312656]*764&-1)+756>>2]=r2;_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);r2=_fgetc(r3)&255;r7=_fgetc(r3);r6=r7<<8&65280|r2|_fgetc(r3)<<16&16711680|_fgetc(r3)<<24;if((r6|0)<32){_fread(HEAP32[r8]+(HEAP32[1312656]*764&-1)|0,1,r6,r3)}_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);r6=_fgetc(r3)&255;_fgetc(r3);_fgetc(r3);_fgetc(r3);HEAP32[HEAP32[HEAP32[r8]+(HEAP32[1312656]*764&-1)+756>>2]>>2]=r6;_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);r6=_fgetc(r3)&255;r2=_fgetc(r3);r7=r2<<8&65280|r6|_fgetc(r3)<<16&16711680|_fgetc(r3)<<24;r6=(r1+180|0)>>2;HEAP32[HEAP32[r6]+(HEAP32[1312656]*52&-1)+32>>2]=r7;_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);r7=_fgetc(r3)&255;r2=_fgetc(r3);r5=r2<<8&65280|r7|_fgetc(r3)<<16&16711680|_fgetc(r3)<<24;HEAP32[HEAP32[r6]+(HEAP32[1312656]*52&-1)+36>>2]=r5;_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);r5=_fgetc(r3)&255;r7=_fgetc(r3);r2=r7<<8&65280|r5|_fgetc(r3)<<16&16711680|_fgetc(r3)<<24;HEAP32[HEAP32[r6]+(HEAP32[1312656]*52&-1)+40>>2]=r2;_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);HEAP32[HEAP32[r8]+(HEAP32[1312656]*764&-1)+36>>2]=1;r2=HEAP32[1312656];HEAP32[HEAP32[HEAP32[r8]+(r2*764&-1)+756>>2]+40>>2]=r2;HEAP32[HEAP32[HEAP32[r8]+(HEAP32[1312656]*764&-1)+756>>2]+8>>2]=128;HEAP32[r1+1272>>2]=5261148;HEAP32[r1+1264>>2]=255;r1=HEAP32[1312656];r2=HEAP32[r6]>>2;r5=HEAP32[((r1*52&-1)+40>>2)+r2];do{if((r5|0)>2){HEAP32[((r1*52&-1)+44>>2)+r2]=2;r7=HEAP32[1312656];r9=HEAP32[r6];r10=r9+(r7*52&-1)+40|0;HEAP32[r10>>2]=HEAP32[r10>>2]+HEAP32[r9+(r7*52&-1)+36>>2]|0}else{if((r5|0)!=2){break}if((HEAP32[((r1*52&-1)+36>>2)+r2]|0)<=0){break}HEAP32[((r1*52&-1)+44>>2)+r2]=2;r7=HEAP32[1312656];r9=HEAP32[r6];HEAP32[r9+(r7*52&-1)+40>>2]=HEAP32[r9+(r7*52&-1)+32>>2]}}while(0);_load_sample(r3,128,HEAP32[r6]+(HEAP32[HEAP32[HEAP32[r8]+(HEAP32[1312656]*764&-1)+756>>2]+40>>2]*52&-1)|0,0);HEAP32[1312656]=HEAP32[1312656]+1|0;r8=r4+20|0;HEAP32[r8>>2]=HEAP32[r8>>2]+1|0;return}function _asylum_test(r1,r2,r3){var r4,r5,r6,r7;r3=STACKTOP;STACKTOP=STACKTOP+96|0;r4=r3;r5=r3+64|0;L739:do{if(_fread(r5,1,32,r1)>>>0<32){r6=-1}else{if((_memcmp(r5,5266344,32)|0)!=0){r6=-1;break}r7=r4|0;if((r2|0)==0){r6=0;break}HEAP8[r2]=0;_fread(r7,1,0,r1);HEAP8[r7]=0;HEAP8[r2]=0;_strncpy(r2,r7,0);if(HEAP8[r2]<<24>>24==0){r6=0;break}while(1){r7=r2+(_strlen(r2)-1)|0;if(HEAP8[r7]<<24>>24!=32){r6=0;break L739}HEAP8[r7]=0;if(HEAP8[r2]<<24>>24==0){r6=0;break L739}}}}while(0);STACKTOP=r3;return r6}function _asylum_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+40|0;r6=r5;_fseek(r2,r3,0);_fseek(r2,32,1);HEAP32[r1+148>>2]=_fgetc(r2)&255;HEAP32[r1+152>>2]=_fgetc(r2)&255;r7=(r1+140|0)>>2;HEAP32[r7]=_fgetc(r2)&255;r8=(r1+128|0)>>2;HEAP32[r8]=_fgetc(r2)&255;r9=r1+156|0;HEAP32[r9>>2]=_fgetc(r2)&255;_fgetc(r2);_fread(r1+952|0,1,HEAP32[r9>>2],r2);_fseek(r2,r3+294|0,0);r3=(r1+136|0)>>2;HEAP32[r3]=8;r9=r1+144|0;HEAP32[r9>>2]=HEAP32[r7];r10=r1+132|0;HEAP32[r10>>2]=HEAP32[r8]<<3;_snprintf(r1+64|0,64,5267844,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r11=(r1+176|0)>>2;HEAP32[r11]=_calloc(764,HEAP32[r7]);r12=HEAP32[r9>>2];if((r12|0)!=0){HEAP32[r1+180>>2]=_calloc(52,r12)}r12=HEAP32[r7];L751:do{if((r12|0)>0){r9=r6|0;r13=r6+22|0;r14=r6+23|0;r15=r6+24|0;r16=r6+25|0;r17=r6+26|0;r18=r6+27|0;r19=r6+28|0;r20=(r1+180|0)>>2;r21=r6+29|0;r22=r6+30|0;r23=r6+31|0;r24=r6+32|0;r25=r6+33|0;r26=r6+34|0;r27=r6+35|0;r28=r6+36|0;r29=0;while(1){r30=_calloc(64,1);HEAP32[HEAP32[r11]+(r29*764&-1)+756>>2]=r30;_fread(r9,1,37,r2);r30=HEAP32[r11];r31=r30+(r29*764&-1)|0;_memset(r31,0,23);_strncpy(r31,r9,22);r32=HEAP8[r31];L755:do{if(r32<<24>>24!=0){r33=0;r34=r31;r35=r32;while(1){do{if((_isprint(r35<<24>>24)|0)==0){r4=538}else{if(HEAP8[r34]<<24>>24<0){r4=538;break}else{break}}}while(0);if(r4==538){r4=0;HEAP8[r34]=46}r36=r33+1|0;r37=r30+(r29*764&-1)+r36|0;r38=HEAP8[r37];if(r38<<24>>24!=0&(r36|0)<22){r33=r36;r34=r37;r35=r38}else{break}}if(HEAP8[r31]<<24>>24==0){break}while(1){r35=_strlen(r31)-1+r30+(r29*764&-1)|0;if(HEAP8[r35]<<24>>24!=32){break L755}HEAP8[r35]=0;if(HEAP8[r31]<<24>>24==0){break L755}}}}while(0);HEAP32[HEAP32[HEAP32[r11]+(r29*764&-1)+756>>2]+16>>2]=HEAP8[r13]<<28>>24;HEAP32[HEAP32[HEAP32[r11]+(r29*764&-1)+756>>2]>>2]=HEAPU8[r14];HEAP32[HEAP32[HEAP32[r11]+(r29*764&-1)+756>>2]+12>>2]=HEAP8[r15]<<24>>24;HEAP32[HEAP32[HEAP32[r11]+(r29*764&-1)+756>>2]+8>>2]=128;HEAP32[HEAP32[HEAP32[r11]+(r29*764&-1)+756>>2]+40>>2]=r29;HEAP32[HEAP32[r20]+(r29*52&-1)+32>>2]=HEAPU8[r17]<<8|HEAPU8[r16]|HEAPU8[r18]<<16|HEAPU8[r19]<<24;HEAP32[HEAP32[r20]+(r29*52&-1)+36>>2]=HEAPU8[r22]<<8|HEAPU8[r21]|HEAPU8[r23]<<16|HEAPU8[r24]<<24;r31=HEAP32[r20];HEAP32[r31+(r29*52&-1)+40>>2]=(HEAPU8[r26]<<8|HEAPU8[r25]|HEAPU8[r27]<<16|HEAPU8[r28]<<24)+HEAP32[r31+(r29*52&-1)+36>>2]|0;HEAP32[HEAP32[r11]+(r29*764&-1)+36>>2]=(HEAP32[HEAP32[r20]+(r29*52&-1)+32>>2]|0)!=0&1;r31=HEAP32[r20];HEAP32[r31+(r29*52&-1)+44>>2]=(HEAP32[r31+(r29*52&-1)+40>>2]|0)>2?2:0;r31=r29+1|0;r30=HEAP32[r7];if((r31|0)<(r30|0)){r29=r31}else{r39=r30;break L751}}}else{r39=r12}}while(0);_fseek(r2,(64-r39)*37&-1,1);r39=(r1+172|0)>>2;HEAP32[r39]=_calloc(4,HEAP32[r10>>2]);r10=(r1+168|0)>>2;HEAP32[r10]=_calloc(4,HEAP32[r8]+1|0);L769:do{if((HEAP32[r8]|0)>0){r12=0;r4=HEAP32[r3];while(1){r6=_calloc(1,(r4<<2)+4|0);HEAP32[HEAP32[r10]+(r12<<2)>>2]=r6;HEAP32[HEAP32[HEAP32[r10]+(r12<<2)>>2]>>2]=64;r6=HEAP32[r3];L773:do{if((r6|0)>0){r29=0;r20=r6;while(1){r28=Math.imul(r20,r12)+r29|0;HEAP32[HEAP32[HEAP32[r10]+(r12<<2)>>2]+(r29<<2)+4>>2]=r28;r28=_calloc(HEAP32[HEAP32[HEAP32[r10]+(r12<<2)>>2]>>2]<<3|4,1);r27=Math.imul(HEAP32[r3],r12)+r29|0;HEAP32[HEAP32[r39]+(r27<<2)>>2]=r28;r28=HEAP32[HEAP32[HEAP32[r10]+(r12<<2)>>2]>>2];r27=Math.imul(HEAP32[r3],r12)+r29|0;HEAP32[HEAP32[HEAP32[r39]+(r27<<2)>>2]>>2]=r28;r28=r29+1|0;r27=HEAP32[r3];if((r28|0)<(r27|0)){r29=r28;r20=r27}else{r40=r27;break L773}}}else{r40=r6}}while(0);L777:do{if((r40<<6|0)>0){r6=0;r20=r40;while(1){r29=(r6|0)/(r20|0)&-1;r27=HEAP32[HEAP32[r39]+(HEAP32[HEAP32[HEAP32[r10]+(r12<<2)>>2]+((r6|0)%(r20|0)<<2)+4>>2]<<2)>>2];r28=(r29<<3)+r27+4|0;r25=r28;r26=r25|0;tempBigInt=0;HEAP8[r26]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r26+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r26+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r26+3|0]=tempBigInt&255;r26=r25+4|0;tempBigInt=0;HEAP8[r26]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r26+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r26+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r26+3|0]=tempBigInt&255;r26=_fgetc(r2)&255;if(r26<<24>>24!=0){HEAP8[r28|0]=r26+13&255}HEAP8[(r29<<3)+r27+5|0]=_fgetc(r2)&255;HEAP8[(r29<<3)+r27+7|0]=_fgetc(r2)&255;HEAP8[(r29<<3)+r27+8|0]=_fgetc(r2)&255;r27=r6+1|0;r29=HEAP32[r3];if((r27|0)<(r29<<6|0)){r6=r27;r20=r29}else{r41=r29;break L777}}}else{r41=r40}}while(0);r20=r12+1|0;if((r20|0)<(HEAP32[r8]|0)){r12=r20;r4=r41}else{break L769}}}}while(0);if((HEAP32[r7]|0)<=0){STACKTOP=r5;return 0}r41=r1+180|0;r1=0;while(1){r8=HEAP32[r41>>2];if((HEAP32[r8+(r1*52&-1)+32>>2]|0)>1){_load_sample(r2,0,r8+(r1*52&-1)|0,0)}else{HEAP32[HEAP32[r11]+(r1*764&-1)+36>>2]=0}r8=r1+1|0;if((r8|0)<(HEAP32[r7]|0)){r1=r8}else{break}}STACKTOP=r5;return 0}function _coco_test(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+84|0;r6=r5;r7=_fgetc(r1)&255;if(!(r7<<24>>24==-124|r7<<24>>24==-120)){r8=-1;STACKTOP=r5;return r8}r7=r5+64|0;_fread(r7,1,20,r1);r9=20;r10=r7;while(1){if((r9|0)==0){r8=-1;r4=586;break}if(HEAP8[r10]<<24>>24==13){break}else{r9=r9-1|0;r10=r10+1|0}}if(r4==586){STACKTOP=r5;return r8}r10=_fgetc(r1);r9=r10&255;if((r10&255)>100){r8=-1;STACKTOP=r5;return r8}_fgetc(r1);_fgetc(r1);r10=_fgetc(r1)&255;r11=_fgetc(r1);if(((r11<<8&65280|r10|_fgetc(r1)<<16&16711680|_fgetc(r1)<<24)-64|0)>>>0>1048512){r8=-1;STACKTOP=r5;return r8}r10=_fgetc(r1)&255;r11=_fgetc(r1);if(((r11<<8&65280|r10|_fgetc(r1)<<16&16711680|_fgetc(r1)<<24)-64|0)>>>0>1048512){r8=-1;STACKTOP=r5;return r8}L814:do{if((r9|0)!=0){r10=0;L815:while(1){r11=_fgetc(r1)&255;r12=_fgetc(r1);r13=r12<<8&65280|r11|_fgetc(r1)<<16&16711680|_fgetc(r1)<<24;r11=_fgetc(r1)&255;r12=_fgetc(r1);r14=r12<<8&65280|r11|_fgetc(r1)<<16&16711680|_fgetc(r1)<<24;r11=_fgetc(r1)&255;r12=_fgetc(r1);r15=r12<<8&65280|r11|_fgetc(r1)<<16&16711680|_fgetc(r1)<<24;r11=_fgetc(r1)&255;r12=_fgetc(r1);r16=r12<<8&65280|r11|_fgetc(r1)<<16&16711680|_fgetc(r1)<<24;r11=_fgetc(r1)&255;r12=_fgetc(r1);r17=r12<<8&65280|r11|_fgetc(r1)<<16&16711680|_fgetc(r1)<<24;if((r13-64|0)>>>0>1048512|(r15|0)>255){r8=-1;r4=592;break}if((r14|0)>1048576|(r16|0)>1048576|(r17|0)>1048576){r8=-1;r4=593;break}if((r16-1+r17|0)>(r14|0)){r8=-1;r4=594;break}_fread(r7,1,11,r1);r14=11;r17=r7;while(1){if((r14|0)==0){r8=-1;r4=595;break L815}if(HEAP8[r17]<<24>>24==13){break}else{r14=r14-1|0;r17=r17+1|0}}_fgetc(r1);r17=r10+1|0;if((r17|0)<(r9|0)){r10=r17}else{break L814}}if(r4==592){STACKTOP=r5;return r8}else if(r4==593){STACKTOP=r5;return r8}else if(r4==594){STACKTOP=r5;return r8}else if(r4==595){STACKTOP=r5;return r8}}}while(0);_fseek(r1,r3+1|0,0);r3=r6|0;if((r2|0)==0){r8=0;STACKTOP=r5;return r8}_memset(r2,0,21);_fread(r3,1,20,r1);HEAP8[r6+20|0]=0;_memset(r2,0,21);_strncpy(r2,r3,20);r3=HEAP8[r2];if(r3<<24>>24==0){r8=0;STACKTOP=r5;return r8}else{r18=0;r19=r2;r20=r3}while(1){do{if((_isprint(r20<<24>>24)|0)==0){r4=581}else{if(HEAP8[r19]<<24>>24<0){r4=581;break}else{break}}}while(0);if(r4==581){r4=0;HEAP8[r19]=46}r3=r18+1|0;r6=r2+r3|0;r1=HEAP8[r6];if(r1<<24>>24!=0&(r3|0)<20){r18=r3;r19=r6;r20=r1}else{break}}if(HEAP8[r2]<<24>>24==0){r8=0;STACKTOP=r5;return r8}while(1){r20=r2+(_strlen(r2)-1)|0;if(HEAP8[r20]<<24>>24!=32){r8=0;r4=587;break}HEAP8[r20]=0;if(HEAP8[r2]<<24>>24==0){r8=0;r4=588;break}}if(r4==587){STACKTOP=r5;return r8}else if(r4==588){STACKTOP=r5;return r8}}function _coco_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35;r4=r1>>2;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+464|0;r7=r6;r8=r6+64;_fseek(r2,r3,0);r9=(r1+136|0)>>2;HEAP32[r9]=_fgetc(r2)&63;r10=r1|0;r11=r7|0;L852:do{if((r1|0)==0){r12=0}else{_memset(r10,0,21);_fread(r11,1,20,r2);HEAP8[r7+20|0]=0;_memset(r10,0,21);_strncpy(r10,r11,20);r13=HEAP8[r10];if(r13<<24>>24==0){r12=0;break}else{r14=0;r15=r10;r16=r13}while(1){do{if((_isprint(r16<<24>>24)|0)==0){r5=605}else{if(HEAP8[r15]<<24>>24<0){r5=605;break}else{break}}}while(0);if(r5==605){r5=0;HEAP8[r15]=46}r13=r14+1|0;r17=r1+r13|0;r18=HEAP8[r17];if(r18<<24>>24!=0&(r13|0)<20){r14=r13;r15=r17;r16=r18}else{break}}if(HEAP8[r10]<<24>>24==0){r12=0;break}while(1){r18=r1+(_strlen(r10)-1)|0;if(HEAP8[r18]<<24>>24!=32){r12=0;break L852}HEAP8[r18]=0;if(HEAP8[r10]<<24>>24==0){r12=0;break L852}}}}while(0);while(1){r10=r1+r12|0;if(HEAP8[r10]<<24>>24==13){HEAP8[r10]=0}r10=r12+1|0;if((r10|0)==20){break}else{r12=r10}}_set_type(r1,5267912,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r12=_fgetc(r2)&255;r10=r1+144|0;HEAP32[r10>>2]=r12;r16=(r1+140|0)>>2;HEAP32[r16]=r12;HEAP32[r4+39]=_fgetc(r2)&255;r12=_fgetc(r2)&255;r15=(r1+128|0)>>2;HEAP32[r15]=r12;r14=r1+132|0;HEAP32[r14>>2]=Math.imul(r12,HEAP32[r9]);r12=_fgetc(r2)&255;r11=_fgetc(r2);r7=r11<<8&65280|r12|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r12=(r1+176|0)>>2;HEAP32[r12]=_calloc(764,HEAP32[r16]);r11=HEAP32[r10>>2];if((r11|0)!=0){HEAP32[r4+45]=_calloc(52,r11)}HEAP32[r4+318]=5261148;HEAP32[r4+316]=255;L874:do{if((HEAP32[r16]|0)>0){r11=(r1+180|0)>>2;r10=0;while(1){r18=_calloc(64,1);HEAP32[HEAP32[r12]+(r10*764&-1)+756>>2]=r18;r18=_fgetc(r2)&255;r17=_fgetc(r2);HEAP32[r8+(r10<<2)>>2]=r17<<8&65280|r18|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r18=_fgetc(r2)&255;r17=_fgetc(r2);r13=r17<<8&65280|r18|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;HEAP32[HEAP32[r11]+(r10*52&-1)+32>>2]=r13;r13=_fgetc(r2)&255;r18=_fgetc(r2);r17=255-(r18<<8&65280|r13|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24)|0;HEAP32[HEAP32[HEAP32[r12]+(r10*764&-1)+756>>2]>>2]=r17;HEAP32[HEAP32[HEAP32[r12]+(r10*764&-1)+756>>2]+8>>2]=128;r17=_fgetc(r2)&255;r13=_fgetc(r2);r18=r13<<8&65280|r17|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;HEAP32[HEAP32[r11]+(r10*52&-1)+36>>2]=r18;r18=HEAP32[HEAP32[r11]+(r10*52&-1)+36>>2];r17=_fgetc(r2)&255;r13=_fgetc(r2);r19=(r13<<8&65280|r17|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24)+r18|0;HEAP32[HEAP32[r11]+(r10*52&-1)+40>>2]=r19;r19=HEAP32[r11];r18=r19+(r10*52&-1)+40|0;r17=HEAP32[r18>>2];if((r17|0)==0){r20=r19}else{HEAP32[r18>>2]=r17-1|0;r20=HEAP32[r11]}HEAP32[r20+(r10*52&-1)+44>>2]=(HEAP32[r20+(r10*52&-1)+36>>2]|0)>0?2:0;_fread(HEAP32[r12]+(r10*764&-1)|0,1,11,r2);r17=HEAP32[r12];r18=r17+(r10*764&-1)|0;if(HEAP8[r18]<<24>>24==13){HEAP8[r18]=0;r21=HEAP32[r12]}else{r21=r17}r17=r21+(r10*764&-1)+1|0;if(HEAP8[r17]<<24>>24==13){HEAP8[r17]=0;r22=HEAP32[r12]}else{r22=r21}r17=r22+(r10*764&-1)+2|0;if(HEAP8[r17]<<24>>24==13){HEAP8[r17]=0;r23=HEAP32[r12]}else{r23=r22}r17=r23+(r10*764&-1)+3|0;if(HEAP8[r17]<<24>>24==13){HEAP8[r17]=0;r24=HEAP32[r12]}else{r24=r23}r17=r24+(r10*764&-1)+4|0;if(HEAP8[r17]<<24>>24==13){HEAP8[r17]=0;r25=HEAP32[r12]}else{r25=r24}r17=r25+(r10*764&-1)+5|0;if(HEAP8[r17]<<24>>24==13){HEAP8[r17]=0;r26=HEAP32[r12]}else{r26=r25}r17=r26+(r10*764&-1)+6|0;if(HEAP8[r17]<<24>>24==13){HEAP8[r17]=0;r27=HEAP32[r12]}else{r27=r26}r17=r27+(r10*764&-1)+7|0;if(HEAP8[r17]<<24>>24==13){HEAP8[r17]=0;r28=HEAP32[r12]}else{r28=r27}r17=r28+(r10*764&-1)+8|0;if(HEAP8[r17]<<24>>24==13){HEAP8[r17]=0;r29=HEAP32[r12]}else{r29=r28}r17=r29+(r10*764&-1)+9|0;if(HEAP8[r17]<<24>>24==13){HEAP8[r17]=0;r30=HEAP32[r12]}else{r30=r29}r17=r30+(r10*764&-1)+10|0;if(HEAP8[r17]<<24>>24==13){HEAP8[r17]=0}_fgetc(r2);HEAP32[HEAP32[r12]+(r10*764&-1)+36>>2]=(HEAP32[HEAP32[r11]+(r10*52&-1)+32>>2]|0)!=0&1;HEAP32[HEAP32[HEAP32[r12]+(r10*764&-1)+756>>2]+40>>2]=r10;r17=r10+1|0;if((r17|0)<(HEAP32[r16]|0)){r10=r17}else{break L874}}}}while(0);_fseek(r2,r7+r3|0,0);r7=_fgetc(r2)&255;do{if(r7<<24>>24==-1){r31=1;r5=624}else{r30=0;r29=r7;while(1){HEAP8[r1+(r30+952)|0]=r29;r28=_fgetc(r2)&255;if(r28<<24>>24==-1){break}else{r30=r30+1|0;r29=r28}}r29=r30+2|0;if((r29&3|0)==0){break}else{r31=r29;r5=624;break}}}while(0);L919:do{if(r5==624){while(1){r5=0;_fgetc(r2);r7=r31+1|0;if((r7&3|0)==0){break L919}else{r31=r7;r5=624}}}}while(0);r5=(r1+172|0)>>2;HEAP32[r5]=_calloc(4,HEAP32[r14>>2]);r14=(r1+168|0)>>2;HEAP32[r14]=_calloc(4,HEAP32[r15]+1|0);L923:do{if((HEAP32[r15]|0)>0){r31=0;r30=HEAP32[r9];while(1){r7=_calloc(1,(r30<<2)+4|0);HEAP32[HEAP32[r14]+(r31<<2)>>2]=r7;HEAP32[HEAP32[HEAP32[r14]+(r31<<2)>>2]>>2]=64;r7=HEAP32[r9];L927:do{if((r7|0)>0){r29=0;r28=r7;while(1){r27=Math.imul(r28,r31)+r29|0;HEAP32[HEAP32[HEAP32[r14]+(r31<<2)>>2]+(r29<<2)+4>>2]=r27;r27=_calloc(HEAP32[HEAP32[HEAP32[r14]+(r31<<2)>>2]>>2]<<3|4,1);r26=Math.imul(HEAP32[r9],r31)+r29|0;HEAP32[HEAP32[r5]+(r26<<2)>>2]=r27;r27=HEAP32[HEAP32[HEAP32[r14]+(r31<<2)>>2]>>2];r26=Math.imul(HEAP32[r9],r31)+r29|0;HEAP32[HEAP32[HEAP32[r5]+(r26<<2)>>2]>>2]=r27;r27=r29+1|0;r26=HEAP32[r9];if((r27|0)<(r26|0)){r29=r27;r28=r26}else{r32=r26;break L927}}}else{r32=r7}}while(0);L931:do{if((r32<<6|0)>0){r7=0;r28=r32;while(1){r29=(r7|0)/(r28|0)&-1;r26=HEAP32[HEAP32[r5]+(HEAP32[HEAP32[HEAP32[r14]+(r31<<2)>>2]+((r7|0)%(r28|0)<<2)+4>>2]<<2)>>2];r27=(r29<<3)+r26+8|0;HEAP8[r27]=_fgetc(r2)&255;r25=(r29<<3)+r26+7|0;HEAP8[r25]=_fgetc(r2)&255;HEAP8[(r29<<3)+r26+5|0]=_fgetc(r2)&255;r24=_fgetc(r2)&255;HEAP8[(r29<<3)+r26+4|0]=r24<<24>>24==0?0:r24+12&255;r24=HEAPU8[r25];if((r24|0)==15){HEAP8[r25]=15}else if((r24|0)==16){HEAP8[r27]=0;HEAP8[r25]=0}else if((r24|0)==14){HEAP8[r25]=11}else if((r24|0)==13){HEAP8[r25]=13}else if((r24|0)==3){HEAP8[r25]=-96}else if((r24|0)==0){HEAP8[r25]=0}else if((r24|0)==19){HEAP8[r25]=-96}else if((r24|0)==20){HEAP8[r25]=-95}else if((r24|0)==17|(r24|0)==18){HEAP8[r27]=0;HEAP8[r25]=0}else if((r24|0)==8|(r24|0)==9|(r24|0)==10|(r24|0)==11){HEAP8[r27]=0;HEAP8[r25]=0}else if((r24|0)==2|(r24|0)==6){HEAP8[r25]=2}else if((r24|0)==12){HEAP8[r25]=12;HEAP8[r27]=HEAP8[r27]^-1}else if((r24|0)==4){HEAP8[r25]=-95}else if((r24|0)==7){HEAP8[r25]=8}else if((r24|0)==1|(r24|0)==5){HEAP8[r25]=1}else{HEAP8[r27]=0;HEAP8[r25]=0}r25=r7+1|0;r27=HEAP32[r9];if((r25|0)<(r27<<6|0)){r7=r25;r28=r27}else{r33=r27;break L931}}}else{r33=r32}}while(0);r28=r31+1|0;if((r28|0)<(HEAP32[r15]|0)){r31=r28;r30=r33}else{break L923}}}}while(0);r33=HEAP32[r16];L954:do{if((r33|0)>0){r15=r1+180|0;r32=0;r14=r33;while(1){if((HEAP32[HEAP32[r12]+(r32*764&-1)+36>>2]|0)==0){r34=r14}else{_fseek(r2,HEAP32[r8+(r32<<2)>>2]+r3|0,0);_load_sample(r2,128,HEAP32[r15>>2]+(HEAP32[HEAP32[HEAP32[r12]+(r32*764&-1)+756>>2]+40>>2]*52&-1)|0,0);r34=HEAP32[r16]}r5=r32+1|0;if((r5|0)<(r34|0)){r32=r5;r14=r34}else{break L954}}}}while(0);if((HEAP32[r9]|0)>0){r35=0}else{STACKTOP=r6;return 0}while(1){HEAP32[((r35*12&-1)+184>>2)+r4]=((r35+3|0)/2&-1|0)%2*255&-1;r34=r35+1|0;if((r34|0)<(HEAP32[r9]|0)){r35=r34}else{break}}STACKTOP=r6;return 0}function _copy_adjust(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r4=0;_memset(r1,0,r3+1|0);_strncpy(r1,r2,r3);r2=HEAP8[r1];if(r2<<24>>24!=0&(r3|0)>0){r5=0;r6=r1;r7=r2;while(1){do{if((_isprint(r7<<24>>24)|0)==0){r4=684}else{if(HEAP8[r6]<<24>>24<0){r4=684;break}else{break}}}while(0);if(r4==684){r4=0;HEAP8[r6]=46}r8=r5+1|0;r9=r1+r8|0;r10=HEAP8[r9];if(r10<<24>>24!=0&(r8|0)<(r3|0)){r5=r8;r6=r9;r7=r10}else{break}}r11=HEAP8[r1]}else{r11=r2}if(r11<<24>>24==0){return r1}while(1){r11=r1+(_strlen(r1)-1)|0;if(HEAP8[r11]<<24>>24!=32){r4=691;break}HEAP8[r11]=0;if(HEAP8[r1]<<24>>24==0){r4=690;break}}if(r4==690){return r1}else if(r4==691){return r1}}function _set_type(r1,r2,r3){var r4,r5;r4=STACKTOP;STACKTOP=STACKTOP+4|0;r5=r4;HEAP32[r5>>2]=r3;_snprintf(r1+64|0,64,r2,HEAP32[r5>>2]);STACKTOP=r4;return}function _dbm_test(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+64|0;r5=r4;r6=_fgetc(r1);r7=_fgetc(r1);if((r7<<16&16711680|r6<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255|0)!=1145195824){r8=-1;STACKTOP=r4;return r8}_fseek(r1,12,1);r6=r5|0;if((r2|0)==0){r8=0;STACKTOP=r4;return r8}_memset(r2,0,45);_fread(r6,1,44,r1);HEAP8[r5+44|0]=0;_memset(r2,0,45);_strncpy(r2,r6,44);r6=HEAP8[r2];if(r6<<24>>24==0){r8=0;STACKTOP=r4;return r8}else{r9=0;r10=r2;r11=r6}while(1){do{if((_isprint(r11<<24>>24)|0)==0){r3=699}else{if(HEAP8[r10]<<24>>24<0){r3=699;break}else{break}}}while(0);if(r3==699){r3=0;HEAP8[r10]=46}r6=r9+1|0;r5=r2+r6|0;r1=HEAP8[r5];if(r1<<24>>24!=0&(r6|0)<44){r9=r6;r10=r5;r11=r1}else{break}}if(HEAP8[r2]<<24>>24==0){r8=0;STACKTOP=r4;return r8}while(1){r11=r2+(_strlen(r2)-1)|0;if(HEAP8[r11]<<24>>24!=32){r8=0;r3=707;break}HEAP8[r11]=0;if(HEAP8[r2]<<24>>24==0){r8=0;r3=709;break}}if(r3==709){STACKTOP=r4;return r8}else if(r3==707){STACKTOP=r4;return r8}}function _dbm_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r4=STACKTOP;STACKTOP=STACKTOP+48|0;r5=r4+44;_fseek(r2,r3,0);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);HEAP32[r5>>2]=0;r3=_fgetc(r2);r6=_fgetc(r2);_fseek(r2,10,1);r7=r4|0;_fread(r7,1,44,r2);r8=_malloc(16);if((r8|0)==0){r9=-1;STACKTOP=r4;return r9}r10=r8;r11=r8;HEAP32[r11>>2]=r10;r12=(r8+4|0)>>2;HEAP32[r12]=r10;HEAP32[r8+8>>2]=4;HEAP32[r8+12>>2]=0;r13=_malloc(20);HEAP8[r13]=HEAP8[5265796];HEAP8[r13+1|0]=HEAP8[5265797|0];HEAP8[r13+2|0]=HEAP8[5265798|0];HEAP8[r13+3|0]=HEAP8[5265799|0];HEAP8[r13+4|0]=HEAP8[5265800|0];HEAP32[r13+8>>2]=342;r14=r13+12|0;r15=r14;r16=HEAP32[r12];HEAP32[r12]=r15;HEAP32[r14>>2]=r10;HEAP32[r13+16>>2]=r16;HEAP32[r16>>2]=r15;r15=_malloc(20);HEAP8[r15]=HEAP8[5265196];HEAP8[r15+1|0]=HEAP8[5265197|0];HEAP8[r15+2|0]=HEAP8[5265198|0];HEAP8[r15+3|0]=HEAP8[5265199|0];HEAP8[r15+4|0]=HEAP8[5265200|0];HEAP32[r15+8>>2]=578;r16=r15+12|0;r13=r16;r14=HEAP32[r12];HEAP32[r12]=r13;HEAP32[r16>>2]=r10;HEAP32[r15+16>>2]=r14;HEAP32[r14>>2]=r13;r13=_malloc(20);HEAP8[r13]=HEAP8[5264676];HEAP8[r13+1|0]=HEAP8[5264677|0];HEAP8[r13+2|0]=HEAP8[5264678|0];HEAP8[r13+3|0]=HEAP8[5264679|0];HEAP8[r13+4|0]=HEAP8[5264680|0];HEAP32[r13+8>>2]=376;r14=r13+12|0;r15=r14;r16=HEAP32[r12];HEAP32[r12]=r15;HEAP32[r14>>2]=r10;HEAP32[r13+16>>2]=r16;HEAP32[r16>>2]=r15;r15=_malloc(20);HEAP8[r15]=HEAP8[5263320];HEAP8[r15+1|0]=HEAP8[5263321|0];HEAP8[r15+2|0]=HEAP8[5263322|0];HEAP8[r15+3|0]=HEAP8[5263323|0];HEAP8[r15+4|0]=HEAP8[5263324|0];HEAP32[r15+8>>2]=210;r16=r15+12|0;r13=r16;r14=HEAP32[r12];HEAP32[r12]=r13;HEAP32[r16>>2]=r10;HEAP32[r15+16>>2]=r14;HEAP32[r14>>2]=r13;r13=_malloc(20);HEAP8[r13]=HEAP8[5264156];HEAP8[r13+1|0]=HEAP8[5264157|0];HEAP8[r13+2|0]=HEAP8[5264158|0];HEAP8[r13+3|0]=HEAP8[5264159|0];HEAP8[r13+4|0]=HEAP8[5264160|0];HEAP32[r13+8>>2]=560;r14=r13+12|0;r15=r14;r16=HEAP32[r12];HEAP32[r12]=r15;HEAP32[r14>>2]=r10;HEAP32[r13+16>>2]=r16;HEAP32[r16>>2]=r15;r15=_malloc(20);HEAP8[r15]=HEAP8[5263624];HEAP8[r15+1|0]=HEAP8[5263625|0];HEAP8[r15+2|0]=HEAP8[5263626|0];HEAP8[r15+3|0]=HEAP8[5263627|0];HEAP8[r15+4|0]=HEAP8[5263628|0];HEAP32[r15+8>>2]=620;r16=r15+12|0;r13=r16;r14=HEAP32[r12];HEAP32[r12]=r13;HEAP32[r16>>2]=r10;HEAP32[r15+16>>2]=r14;HEAP32[r14>>2]=r13;_strncpy(r1|0,r7,64);_snprintf(r1+64|0,64,5263160,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r3&255,HEAP32[tempInt+4>>2]=r6&255,tempInt));L1016:do{if((_feof(r2)|0)==0){r6=r5;while(1){_iff_chunk(r8,r1,r2,r6);if((_feof(r2)|0)!=0){break L1016}}}}while(0);r2=HEAP32[r11>>2];L1021:do{if((r2|0)!=(r10|0)){r11=r2;while(1){r5=r11-16+4|0;r6=HEAP32[r5+12>>2];r3=HEAP32[r5+16>>2];HEAP32[r6+4>>2]=r3;HEAP32[r3>>2]=r6;r6=HEAP32[r11>>2];_free(r5);if((r6|0)==(r10|0)){break L1021}else{r11=r6}}}}while(0);_free(r8);r8=r1+136|0;if((HEAP32[r8>>2]|0)>0){r17=0}else{r9=0;STACKTOP=r4;return r9}while(1){HEAP32[r1+(r17*12&-1)+184>>2]=128;r10=r17+1|0;if((r10|0)<(HEAP32[r8>>2]|0)){r17=r10}else{r9=0;break}}STACKTOP=r4;return r9}function _get_info(r1,r2,r3,r4){var r5,r6,r7;r4=_fgetc(r3);r2=r1+140|0;HEAP32[r2>>2]=_fgetc(r3)&255|r4<<8&65280;r4=_fgetc(r3);r5=r1+144|0;HEAP32[r5>>2]=_fgetc(r3)&255|r4<<8&65280;_fgetc(r3);_fgetc(r3);r4=_fgetc(r3);r6=r1+128|0;HEAP32[r6>>2]=_fgetc(r3)&255|r4<<8&65280;r4=_fgetc(r3);r7=_fgetc(r3)&255|r4<<8&65280;HEAP32[r1+136>>2]=r7;HEAP32[r1+132>>2]=Math.imul(r7,HEAP32[r6>>2]);HEAP32[r1+176>>2]=_calloc(764,HEAP32[r2>>2]);r2=HEAP32[r5>>2];if((r2|0)==0){return}HEAP32[r1+180>>2]=_calloc(52,r2);return}function _get_song(r1,r2,r3,r4){var r5,r6;r2=STACKTOP;STACKTOP=STACKTOP+52|0;r5=r4;if((HEAP32[r5>>2]|0)!=0){STACKTOP=r2;return}HEAP32[r5>>2]=1;_fread(r2|0,44,1,r3);r5=_fgetc(r3);r4=_fgetc(r3)&255|r5<<8&65280;r5=r1+156|0;HEAP32[r5>>2]=r4;if((r4|0)==0){STACKTOP=r2;return}else{r6=0}while(1){_fgetc(r3);HEAP8[r1+(r6+952)|0]=_fgetc(r3)&255;r4=r6+1|0;if((r4|0)<(HEAP32[r5>>2]|0)){r6=r4}else{break}}STACKTOP=r2;return}function _get_inst(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r4=0;r2=STACKTOP;STACKTOP=STACKTOP+52|0;r5=r1+140|0;if((HEAP32[r5>>2]|0)<=0){STACKTOP=r2;return}r6=(r1+176|0)>>2;r7=r2|0;r8=r1+144|0;r9=(r1+180|0)>>2;r1=0;while(1){r10=_calloc(64,1);HEAP32[HEAP32[r6]+(r1*764&-1)+756>>2]=r10;HEAP32[HEAP32[r6]+(r1*764&-1)+36>>2]=1;_fread(r7,30,1,r3);r10=HEAP32[r6];r11=r10+(r1*764&-1)|0;_memset(r11,0,31);_strncpy(r11,r7,30);r12=HEAP8[r11];L1050:do{if(r12<<24>>24!=0){r13=0;r14=r11;r15=r12;while(1){do{if((_isprint(r15<<24>>24)|0)==0){r4=740}else{if(HEAP8[r14]<<24>>24<0){r4=740;break}else{break}}}while(0);if(r4==740){r4=0;HEAP8[r14]=46}r16=r13+1|0;r17=r10+(r1*764&-1)+r16|0;r18=HEAP8[r17];if(r18<<24>>24!=0&(r16|0)<30){r13=r16;r14=r17;r15=r18}else{break}}if(HEAP8[r11]<<24>>24==0){break}while(1){r15=_strlen(r11)-1+r10+(r1*764&-1)|0;if(HEAP8[r15]<<24>>24!=32){break L1050}HEAP8[r15]=0;if(HEAP8[r11]<<24>>24==0){break L1050}}}}while(0);r11=_fgetc(r3)&65535;r10=_fgetc(r3)&255|r11<<8;r11=r10&65535;do{if(r10<<16>>16!=0){if((r11|0)>(HEAP32[r8>>2]|0)){break}r12=r11-1|0;HEAP32[HEAP32[HEAP32[r6]+(r1*764&-1)+756>>2]+40>>2]=r12;r15=_fgetc(r3);r14=_fgetc(r3)&255|r15<<8&65280;HEAP32[HEAP32[HEAP32[r6]+(r1*764&-1)+756>>2]>>2]=r14;r14=_fgetc(r3);r15=_fgetc(r3);r13=r15<<16&16711680|r14<<24|_fgetc(r3)<<8&65280|_fgetc(r3)&255;r14=_fgetc(r3);r15=_fgetc(r3);r18=r15<<16&16711680|r14<<24|_fgetc(r3)<<8&65280|_fgetc(r3)&255;HEAP32[HEAP32[r9]+(r12*52&-1)+36>>2]=r18;r18=HEAP32[HEAP32[r9]+(r1*52&-1)+36>>2];r14=_fgetc(r3);r15=_fgetc(r3);r17=(r15<<16&16711680|r14<<24|_fgetc(r3)<<8&65280|_fgetc(r3)&255)+r18|0;HEAP32[HEAP32[r9]+(r12*52&-1)+40>>2]=r17;r17=_fgetc(r3)&65535;r18=((_fgetc(r3)&255|r17<<8)<<16>>16)+128|0;HEAP32[HEAP32[HEAP32[r6]+(r1*764&-1)+756>>2]+8>>2]=r18;r18=HEAP32[HEAP32[r6]+(r1*764&-1)+756>>2]+8|0;if((HEAP32[r18>>2]|0)>255){HEAP32[r18>>2]=255}_fgetc(r3);r18=_fgetc(r3);HEAP32[HEAP32[r9]+(r12*52&-1)+44>>2]=(r18&3|0)!=0?2:0;r17=HEAP32[r9]+(r12*52&-1)+44|0;HEAP32[r17>>2]=HEAP32[r17>>2]|r18<<1&4;r18=HEAP32[HEAP32[r6]+(r1*764&-1)+756>>2];r17=r18+12|0;r12=r18+16|0;if((r13|0)==0){HEAP32[r12>>2]=0;HEAP32[r17>>2]=0;break}else{r18=Math.log((r13|0)/8363)*1536/.6931471805599453&-1;HEAP32[r17>>2]=(r18|0)/128&-1;HEAP32[r12>>2]=(r18|0)%128;break}}}while(0);r11=r1+1|0;if((r11|0)<(HEAP32[r5>>2]|0)){r1=r11}else{break}}STACKTOP=r2;return}function _get_patt128(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25;r4=0;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r2;r6=(r1+172|0)>>2;HEAP32[r6]=_calloc(4,HEAP32[r1+132>>2]);r7=(r1+128|0)>>2;r8=(r1+168|0)>>2;HEAP32[r8]=_calloc(4,HEAP32[r7]+1|0);if((HEAP32[r7]|0)<=0){STACKTOP=r2;return}r9=(r1+136|0)>>2;r1=0;while(1){r10=_calloc(1,(HEAP32[r9]<<2)+4|0);HEAP32[HEAP32[r8]+(r1<<2)>>2]=r10;r10=_fgetc(r3);r11=_fgetc(r3)&255|r10<<8&65280;HEAP32[HEAP32[HEAP32[r8]+(r1<<2)>>2]>>2]=r11;r11=HEAP32[r9];L1080:do{if((r11|0)>0){r10=0;r12=r11;while(1){r13=Math.imul(r12,r1)+r10|0;HEAP32[HEAP32[HEAP32[r8]+(r1<<2)>>2]+(r10<<2)+4>>2]=r13;r13=_calloc(HEAP32[HEAP32[HEAP32[r8]+(r1<<2)>>2]>>2]<<3|4,1);r14=Math.imul(HEAP32[r9],r1)+r10|0;HEAP32[HEAP32[r6]+(r14<<2)>>2]=r13;r13=HEAP32[HEAP32[HEAP32[r8]+(r1<<2)>>2]>>2];r14=Math.imul(HEAP32[r9],r1)+r10|0;HEAP32[HEAP32[HEAP32[r6]+(r14<<2)>>2]>>2]=r13;r13=r10+1|0;r14=HEAP32[r9];if((r13|0)<(r14|0)){r10=r13;r12=r14}else{break L1080}}}}while(0);r11=_fgetc(r3);r12=_fgetc(r3);r10=r12<<16&16711680|r11<<24|_fgetc(r3)<<8&65280|_fgetc(r3)&255;L1084:do{if((r10|0)>0){r11=0;r12=r10;while(1){r14=r12;while(1){r13=_fgetc(r3);r15=r14-1|0;if((r15|0)<1){break L1084}if((r13&255)<<24>>24==0){break}r16=(r13&255)-1|0;r13=_fgetc(r3);r17=r14-2|0;if((r17|0)<1){break L1084}do{if((r16|0)<(HEAP32[r9]|0)){r18=HEAP32[HEAP32[r8]+(r1<<2)>>2];if((r11|0)>=(HEAP32[r18>>2]|0)){r19=r5;break}r19=(r11<<3)+HEAP32[HEAP32[r6]+(HEAP32[r18+(r16<<2)+4>>2]<<2)>>2]+4|0}else{r19=r5}}while(0);if((r13&1|0)==0){r20=r17}else{r16=_fgetc(r3)&255;HEAP8[r19|0]=((r16&15)+13&255)+(((r16&255)>>>4)*12&255)&255;r16=r14-3|0;if((r16|0)<1){break L1084}else{r20=r16}}if((r13&2|0)==0){r21=r20}else{HEAP8[r19+1|0]=_fgetc(r3)&255;r16=r20-1|0;if((r16|0)<1){break L1084}else{r21=r16}}if((r13&4|0)==0){r22=r21}else{HEAP8[r19+3|0]=_fgetc(r3)&255;r16=r21-1|0;if((r16|0)<1){break L1084}else{r22=r16}}if((r13&8|0)==0){r23=r22}else{HEAP8[r19+4|0]=_fgetc(r3)&255;r16=r22-1|0;if((r16|0)<1){break L1084}else{r23=r16}}if((r13&16|0)==0){r24=r23}else{HEAP8[r19+5|0]=_fgetc(r3)&255;r16=r23-1|0;if((r16|0)<1){break L1084}else{r24=r16}}if((r13&32|0)==0){r25=r24}else{HEAP8[r19+6|0]=_fgetc(r3)&255;r16=r24-1|0;if((r16|0)<1){break L1084}else{r25=r16}}r16=r19+3|0;r18=HEAP8[r16];do{if(r18<<24>>24==28){HEAP8[r16]=-85;r4=783;break}else{if((r18&255)>28){r4=783;break}else{break}}}while(0);if(r4==783){r4=0;HEAP8[r19+6|0]=0;HEAP8[r16]=0}r18=r19+5|0;r13=HEAP8[r18];do{if(r13<<24>>24==28){HEAP8[r18]=-85;r4=787;break}else{if((r13&255)>28){r4=787;break}else{break}}}while(0);if(r4==787){r4=0;HEAP8[r19+6|0]=0;HEAP8[r18]=0}if((r25|0)>0){r14=r25}else{break L1084}}if((r15|0)>0){r11=r11+1|0;r12=r15}else{break L1084}}}}while(0);r10=r1+1|0;if((r10|0)<(HEAP32[r7]|0)){r1=r10}else{break}}STACKTOP=r2;return}function _get_smpl(r1,r2,r3,r4){var r5,r6,r7,r8;r4=r1+144|0;if((HEAP32[r4>>2]|0)<=0){return}r2=(r1+180|0)>>2;r1=0;while(1){_fgetc(r3);_fgetc(r3);_fgetc(r3);r5=_fgetc(r3);r6=_fgetc(r3);r7=_fgetc(r3);r8=r7<<16&16711680|r6<<24|_fgetc(r3)<<8&65280|_fgetc(r3)&255;HEAP32[HEAP32[r2]+(r1*52&-1)+32>>2]=r8;if((r5&2|0)!=0){r8=HEAP32[r2]+(r1*52&-1)+44|0;HEAP32[r8>>2]=HEAP32[r8>>2]|1}r8=HEAP32[r2];if((r5&4|0)==0){_load_sample(r3,64,r8+(r1*52&-1)|0,0)}else{r5=r8+(r1*52&-1)+32|0;HEAP32[r5>>2]=HEAP32[r5>>2]<<2;_fseek(r3,HEAP32[HEAP32[r2]+(r1*52&-1)+32>>2],1)}r5=r1+1|0;if((r5|0)<(HEAP32[r4>>2]|0)){r1=r5}else{break}}return}function _get_venv(r1,r2,r3,r4){var r5,r6,r7,r8,r9;r4=_fgetc(r3);r2=_fgetc(r3)&255|r4<<8&65280;if((r2|0)==0){return}r4=(r1+176|0)>>2;r1=0;while(1){r5=_fgetc(r3);r6=(_fgetc(r3)&255|r5<<8&65280)-1|0;r5=_fgetc(r3)&7;HEAP32[HEAP32[r4]+(r6*764&-1)+44>>2]=r5;r5=_fgetc(r3)&255;HEAP32[HEAP32[r4]+(r6*764&-1)+48>>2]=r5;r5=_fgetc(r3)&255;HEAP32[HEAP32[r4]+(r6*764&-1)+56>>2]=r5;r5=_fgetc(r3)&255;HEAP32[HEAP32[r4]+(r6*764&-1)+64>>2]=r5;r5=_fgetc(r3)&255;HEAP32[HEAP32[r4]+(r6*764&-1)+68>>2]=r5;_fgetc(r3);r5=0;while(1){r7=_fgetc(r3)&65535;r8=_fgetc(r3)&255|r7<<8;r7=r5<<1;HEAP16[HEAP32[r4]+(r6*764&-1)+(r7<<1)+72>>1]=r8;r8=_fgetc(r3)&65535;r9=_fgetc(r3)&255|r8<<8;HEAP16[HEAP32[r4]+(r6*764&-1)+((r7|1)<<1)+72>>1]=r9;r9=r5+1|0;if((r9|0)==32){break}else{r5=r9}}r5=r1+1|0;if((r5|0)<(r2|0)){r1=r5}else{break}}return}function _digi_test(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+84|0;r5=r4;r6=r4+64|0;L1154:do{if(_fread(r6,1,20,r1)>>>0<20){r7=-1}else{if((_memcmp(r6,5266292,19)|0)!=0){r7=-1;break}_fseek(r1,156,1);_fseek(r1,384,1);_fseek(r1,64,1);r8=r5|0;if((r2|0)==0){r7=0;break}_memset(r2,0,33);_fread(r8,1,32,r1);HEAP8[r5+32|0]=0;_memset(r2,0,33);_strncpy(r2,r8,32);r8=HEAP8[r2];if(r8<<24>>24==0){r7=0;break}else{r9=0;r10=r2;r11=r8}while(1){do{if((_isprint(r11<<24>>24)|0)==0){r3=819}else{if(HEAP8[r10]<<24>>24<0){r3=819;break}else{break}}}while(0);if(r3==819){r3=0;HEAP8[r10]=46}r8=r9+1|0;r12=r2+r8|0;r13=HEAP8[r12];if(r13<<24>>24!=0&(r8|0)<32){r9=r8;r10=r12;r11=r13}else{break}}if(HEAP8[r2]<<24>>24==0){r7=0;break}while(1){r13=r2+(_strlen(r2)-1)|0;if(HEAP8[r13]<<24>>24!=32){r7=0;break L1154}HEAP8[r13]=0;if(HEAP8[r2]<<24>>24==0){r7=0;break L1154}}}}while(0);STACKTOP=r4;return r7}function _digi_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+1640|0;r6=r5,r7=r6>>2;r8=r5+1572;r9=r5+1576;_fseek(r2,r3,0);_fread(r6|0,20,1,r2);r3=r6+20|0;_fread(r3,4,1,r2);HEAP8[r6+24|0]=_fgetc(r2)&255;r10=r6+25|0;HEAP8[r10]=_fgetc(r2)&255;r11=r6+26|0;HEAP8[r11]=_fgetc(r2)&255;_fread(r6+27|0,19,1,r2);r12=r6+46|0;HEAP8[r12]=_fgetc(r2)&255;HEAP8[r6+47|0]=_fgetc(r2)&255;_fread(r6+48|0,128,1,r2);r13=0;while(1){r14=_fgetc(r2);r15=_fgetc(r2);HEAP32[((r13<<2)+176>>2)+r7]=r15<<16&16711680|r14<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;r14=r13+1|0;if((r14|0)==31){r16=0;break}else{r13=r14}}while(1){r13=_fgetc(r2);r14=_fgetc(r2);HEAP32[((r16<<2)+300>>2)+r7]=r14<<16&16711680|r13<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;r13=r16+1|0;if((r13|0)==31){r17=0;break}else{r16=r13}}while(1){r16=_fgetc(r2);r13=_fgetc(r2);HEAP32[((r17<<2)+424>>2)+r7]=r13<<16&16711680|r16<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;r16=r17+1|0;if((r16|0)==31){r18=0;break}else{r17=r16}}while(1){HEAP8[r6+(r18+548)|0]=_fgetc(r2)&255;r17=r18+1|0;if((r17|0)==31){r19=0;break}else{r18=r17}}while(1){HEAP8[r6+(r19+579)|0]=_fgetc(r2)&255;r18=r19+1|0;if((r18|0)==31){break}else{r19=r18}}r19=r6+610|0;_fread(r19,32,1,r2);r18=0;while(1){_fread(r6+(r18*30&-1)+642|0,30,1,r2);r17=r18+1|0;if((r17|0)==31){break}else{r18=r17}}r18=(r1+140|0)>>2;HEAP32[r18]=31;r17=r1+144|0;HEAP32[r17>>2]=31;r16=HEAP16[r12>>1];r12=(r16&255)+1|0;r13=(r1+128|0)>>2;HEAP32[r13]=r12;r14=HEAPU8[r10];r10=(r1+136|0)>>2;HEAP32[r10]=r14;r15=r1+132|0;HEAP32[r15>>2]=Math.imul(r12,r14);r14=(r1+156|0)>>2;HEAP32[r14]=((r16&65535)>>>8&65535)+1|0;r16=r1+1276|0;HEAP32[r16>>2]=HEAP32[r16>>2]|8192;r16=r1|0;_memset(r16,0,33);_strncpy(r16,r19,32);r19=HEAP8[r16];L1185:do{if(r19<<24>>24!=0){r12=0;r20=r16;r21=r19;while(1){do{if((_isprint(r21<<24>>24)|0)==0){r4=836}else{if(HEAP8[r20]<<24>>24<0){r4=836;break}else{break}}}while(0);if(r4==836){r4=0;HEAP8[r20]=46}r22=r12+1|0;r23=r1+r22|0;r24=HEAP8[r23];if(r24<<24>>24!=0&(r22|0)<32){r12=r22;r20=r23;r21=r24}else{break}}if(HEAP8[r16]<<24>>24==0){break}while(1){r21=r1+(_strlen(r16)-1)|0;if(HEAP8[r21]<<24>>24!=32){break L1185}HEAP8[r21]=0;if(HEAP8[r16]<<24>>24==0){break L1185}}}}while(0);_set_type(r1,5267752,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r3,tempInt));L1198:do{if((HEAP32[r14]|0)>0){r3=0;while(1){HEAP8[r1+(r3+952)|0]=HEAP8[r6+(r3+48)|0];r16=r3+1|0;if((r16|0)<(HEAP32[r14]|0)){r3=r16}else{break L1198}}}}while(0);r14=(r1+176|0)>>2;HEAP32[r14]=_calloc(764,HEAP32[r18]);r3=HEAP32[r17>>2];if((r3|0)!=0){HEAP32[r1+180>>2]=_calloc(52,r3)}L1205:do{if((HEAP32[r18]|0)>0){r3=(r1+180|0)>>2;r17=0;while(1){r16=_calloc(64,1);HEAP32[HEAP32[r14]+(r17*764&-1)+756>>2]=r16;r16=HEAP32[((r17<<2)+176>>2)+r7];HEAP32[HEAP32[r3]+(r17*52&-1)+32>>2]=r16;HEAP32[HEAP32[r14]+(r17*764&-1)+36>>2]=(r16|0)!=0&1;r16=(r17<<2)+r6+300|0;HEAP32[HEAP32[r3]+(r17*52&-1)+36>>2]=HEAP32[r16>>2];HEAP32[HEAP32[r3]+(r17*52&-1)+40>>2]=HEAP32[((r17<<2)+424>>2)+r7]+HEAP32[r16>>2]|0;r16=HEAP32[r3];HEAP32[r16+(r17*52&-1)+44>>2]=(HEAP32[r16+(r17*52&-1)+40>>2]|0)>0?2:0;HEAP32[HEAP32[HEAP32[r14]+(r17*764&-1)+756>>2]>>2]=HEAPU8[r6+(r17+548)|0];HEAP32[HEAP32[HEAP32[r14]+(r17*764&-1)+756>>2]+16>>2]=HEAPU8[r6+(r17+579)|0];HEAP32[HEAP32[HEAP32[r14]+(r17*764&-1)+756>>2]+8>>2]=128;HEAP32[HEAP32[HEAP32[r14]+(r17*764&-1)+756>>2]+40>>2]=r17;r16=HEAP32[r14];r19=r16+(r17*764&-1)|0;_memset(r19,0,31);_strncpy(r19,r6+(r17*30&-1)+642|0,30);r21=HEAP8[r19];L1209:do{if(r21<<24>>24!=0){r20=0;r12=r19;r24=r21;while(1){do{if((_isprint(r24<<24>>24)|0)==0){r4=850}else{if(HEAP8[r12]<<24>>24<0){r4=850;break}else{break}}}while(0);if(r4==850){r4=0;HEAP8[r12]=46}r23=r20+1|0;r22=r16+(r17*764&-1)+r23|0;r25=HEAP8[r22];if(r25<<24>>24!=0&(r23|0)<30){r20=r23;r12=r22;r24=r25}else{break}}if(HEAP8[r19]<<24>>24==0){break}while(1){r24=_strlen(r19)-1+r16+(r17*764&-1)|0;if(HEAP8[r24]<<24>>24!=32){break L1209}HEAP8[r24]=0;if(HEAP8[r19]<<24>>24==0){break L1209}}}}while(0);r19=r17+1|0;if((r19|0)<(HEAP32[r18]|0)){r17=r19}else{break L1205}}}}while(0);r4=(r1+172|0)>>2;HEAP32[r4]=_calloc(4,HEAP32[r15>>2]);r15=(r1+168|0)>>2;HEAP32[r15]=_calloc(4,HEAP32[r13]+1|0);L1223:do{if((HEAP32[r13]|0)>0){r6=r9|0;r7=r8|0;r17=r8+1|0;r3=r8+2|0;r19=r8+3|0;r16=0;r21=HEAP32[r10];while(1){r24=_calloc(1,(r21<<2)+4|0);HEAP32[HEAP32[r15]+(r16<<2)>>2]=r24;HEAP32[HEAP32[HEAP32[r15]+(r16<<2)>>2]>>2]=64;r24=HEAP32[r10];L1227:do{if((r24|0)>0){r12=0;r20=r24;while(1){r25=Math.imul(r20,r16)+r12|0;HEAP32[HEAP32[HEAP32[r15]+(r16<<2)>>2]+(r12<<2)+4>>2]=r25;r25=_calloc(HEAP32[HEAP32[HEAP32[r15]+(r16<<2)>>2]>>2]<<3|4,1);r22=Math.imul(HEAP32[r10],r16)+r12|0;HEAP32[HEAP32[r4]+(r22<<2)>>2]=r25;r25=HEAP32[HEAP32[HEAP32[r15]+(r16<<2)>>2]>>2];r22=Math.imul(HEAP32[r10],r16)+r12|0;HEAP32[HEAP32[HEAP32[r4]+(r22<<2)>>2]>>2]=r25;r25=r12+1|0;r22=HEAP32[r10];if((r25|0)<(r22|0)){r12=r25;r20=r22}else{r26=r22;break L1227}}}else{r26=r24}}while(0);do{if(HEAP8[r11]<<24>>24==0){_memset(r6,-1,64);r27=0;r28=r26;break}else{_fgetc(r2);_fgetc(r2);_fread(r6,1,64,r2);r27=0;r28=HEAP32[r10];break}}while(0);while(1){L1236:do{if((r28|0)>0){r24=HEAP8[r9+r27|0];r20=128;r12=0;r22=r28;while(1){if((r24&255&r20|0)==0){r29=r22}else{_fread(r7,4,1,r2);r25=HEAP32[HEAP32[r4]+(HEAP32[HEAP32[HEAP32[r15]+(r16<<2)>>2]+(r12<<2)+4>>2]<<2)>>2];r23=HEAP8[r7];r30=(r23&255)<<8&3840|HEAPU8[r17];if((r30|0)==0){r31=0}else{L1244:do{if(r30>>>0<3628){r32=r30;r33=24;while(1){r34=r33+12|0;r35=r32<<1;if((r35|0)<3628){r32=r35;r33=r34}else{r36=r35;r37=r34;break L1244}}}else{r36=r30;r37=24}}while(0);L1248:do{if((r36|0)>3842){r30=r37;r33=5249472;while(1){r32=r33-32|0;r34=r30-1|0;r35=HEAP32[r32>>2];if((r36|0)>(r35|0)){r30=r34;r33=r32}else{r38=r34;r39=r32,r40=r39>>2;r41=r35;break L1248}}}else{r38=r37;r39=5249472,r40=r39>>2;r41=3842}}while(0);do{if((r41|0)>(r36|0)){if((HEAP32[r40+1]|0)<=(r36|0)){r42=1;break}if((HEAP32[r40+2]|0)<=(r36|0)){r42=1;break}r42=(HEAP32[r40+3]|0)<=(r36|0)&1}else{r42=1}}while(0);r31=r38-r42&255}HEAP8[(r27<<3)+r25+4|0]=r31;r33=HEAP8[r3];HEAP8[(r27<<3)+r25+5|0]=(r33&255)>>>4|r23&-16;r30=r33&15;r33=(r27<<3)+r25+7|0;HEAP8[r33]=r30;r35=HEAP8[r19];r32=(r27<<3)+r25+8|0;HEAP8[r32]=r35;do{if(r35<<24>>24==0){r34=r30&255;if((r34|0)==5){HEAP8[r33]=3;r43=3;break}else if((r34|0)==6){HEAP8[r33]=4;r43=4;break}else if((r34|0)==1|(r34|0)==2|(r34|0)==10){HEAP8[r33]=0;r43=0;break}else{r43=r30;break}}else{r43=r30}}while(0);r30=r43&255;do{if((r30|0)==8){HEAP8[r32]=0;HEAP8[r33]=0}else if((r30|0)==14){r25=(r35&255)>>>4;if((r25|0)==0|(r25|0)==3|(r25|0)==8|(r25|0)==9){HEAP8[r32]=0;HEAP8[r33]=0;break}else if((r25|0)==4){HEAP8[r33]=12;HEAP8[r32]=0;break}else{break}}}while(0);r29=HEAP32[r10]}r32=r12+1|0;if((r32|0)<(r29|0)){r20=r20>>1;r12=r32;r22=r29}else{r44=r29;break L1236}}}else{r44=r28}}while(0);r22=r27+1|0;if((r22|0)==64){break}else{r27=r22;r28=r44}}r22=r16+1|0;if((r22|0)<(HEAP32[r13]|0)){r16=r22;r21=r44}else{break L1223}}}}while(0);if((HEAP32[r18]|0)<=0){STACKTOP=r5;return 0}r44=r1+180|0;r1=0;while(1){_load_sample(r2,0,HEAP32[r44>>2]+(HEAP32[HEAP32[HEAP32[r14]+(r1*764&-1)+756>>2]+40>>2]*52&-1)|0,0);r13=r1+1|0;if((r13|0)<(HEAP32[r18]|0)){r1=r13}else{break}}STACKTOP=r5;return 0}function _dmf_test(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+64|0;r5=r4;r6=_fgetc(r1);r7=_fgetc(r1);if((r7<<16&16711680|r6<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255|0)!=1145326918){r8=-1;STACKTOP=r4;return r8}_fseek(r1,9,1);r6=r5|0;if((r2|0)==0){r8=0;STACKTOP=r4;return r8}_memset(r2,0,31);_fread(r6,1,30,r1);HEAP8[r5+30|0]=0;_memset(r2,0,31);_strncpy(r2,r6,30);r6=HEAP8[r2];if(r6<<24>>24==0){r8=0;STACKTOP=r4;return r8}else{r9=0;r10=r2;r11=r6}while(1){do{if((_isprint(r11<<24>>24)|0)==0){r3=901}else{if(HEAP8[r10]<<24>>24<0){r3=901;break}else{break}}}while(0);if(r3==901){r3=0;HEAP8[r10]=46}r6=r9+1|0;r5=r2+r6|0;r1=HEAP8[r5];if(r1<<24>>24!=0&(r6|0)<30){r9=r6;r10=r5;r11=r1}else{break}}if(HEAP8[r2]<<24>>24==0){r8=0;STACKTOP=r4;return r8}while(1){r11=r2+(_strlen(r2)-1)|0;if(HEAP8[r11]<<24>>24!=32){r8=0;r3=908;break}HEAP8[r11]=0;if(HEAP8[r2]<<24>>24==0){r8=0;r3=911;break}}if(r3==908){STACKTOP=r4;return r8}else if(r3==911){STACKTOP=r4;return r8}}function _dmf_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r4=STACKTOP;STACKTOP=STACKTOP+276|0;r5=r4+4;r6=r4+16;_fseek(r2,r3,0);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r3=_fgetc(r2)&255;HEAP32[r6>>2]=r3;r7=r5|0;_fread(r7,8,1,r2);r8=r5+8|0;HEAP8[r8]=0;_snprintf(r1+64|0,64,5267740,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r7,HEAP32[tempInt+4>>2]=r3,tempInt));HEAP8[r8]=0;_fread(r1|0,30,1,r2);_fseek(r2,20,1);_fread(r4|0,3,1,r2);r8=_malloc(16);if((r8|0)==0){r9=-1;STACKTOP=r4;return r9}r3=r8;r7=r8;HEAP32[r7>>2]=r3;r5=(r8+4|0)>>2;HEAP32[r5]=r3;HEAP32[r8+8>>2]=4;r10=(r8+12|0)>>2;HEAP32[r10]=0;r11=_malloc(20);HEAP8[r11]=HEAP8[5266284];HEAP8[r11+1|0]=HEAP8[5266285|0];HEAP8[r11+2|0]=HEAP8[5266286|0];HEAP8[r11+3|0]=HEAP8[5266287|0];HEAP8[r11+4|0]=HEAP8[5266288|0];HEAP32[r11+8>>2]=604;r12=r11+12|0;r13=r12;r14=HEAP32[r5];HEAP32[r5]=r13;HEAP32[r12>>2]=r3;HEAP32[r11+16>>2]=r14;HEAP32[r14>>2]=r13;r13=_malloc(20);HEAP8[r13]=HEAP8[5263320];HEAP8[r13+1|0]=HEAP8[5263321|0];HEAP8[r13+2|0]=HEAP8[5263322|0];HEAP8[r13+3|0]=HEAP8[5263323|0];HEAP8[r13+4|0]=HEAP8[5263324|0];HEAP32[r13+8>>2]=446;r14=r13+12|0;r11=r14;r12=HEAP32[r5];HEAP32[r5]=r11;HEAP32[r14>>2]=r3;HEAP32[r13+16>>2]=r12;HEAP32[r12>>2]=r11;r11=_malloc(20);HEAP8[r11]=HEAP8[5264720];HEAP8[r11+1|0]=HEAP8[5264721|0];HEAP8[r11+2|0]=HEAP8[5264722|0];HEAP8[r11+3|0]=HEAP8[5264723|0];HEAP8[r11+4|0]=HEAP8[5264724|0];HEAP32[r11+8>>2]=564;r12=r11+12|0;r13=r12;r14=HEAP32[r5];HEAP32[r5]=r13;HEAP32[r12>>2]=r3;HEAP32[r11+16>>2]=r14;HEAP32[r14>>2]=r13;r13=_malloc(20);HEAP8[r13]=HEAP8[5264148];HEAP8[r13+1|0]=HEAP8[5264149|0];HEAP8[r13+2|0]=HEAP8[5264150|0];HEAP8[r13+3|0]=HEAP8[5264151|0];HEAP8[r13+4|0]=HEAP8[5264152|0];HEAP32[r13+8>>2]=570;r14=r13+12|0;r11=r14;r12=HEAP32[r5];HEAP32[r5]=r11;HEAP32[r14>>2]=r3;HEAP32[r13+16>>2]=r12;HEAP32[r12>>2]=r11;HEAP32[r10]=HEAP32[r10]|1;L1311:do{if((_feof(r2)|0)==0){r10=r6;while(1){_iff_chunk(r8,r1,r2,r10);if((_feof(r2)|0)!=0){break L1311}}}}while(0);HEAP32[r1+1264>>2]=255;r1=HEAP32[r7>>2];L1316:do{if((r1|0)!=(r3|0)){r7=r1;while(1){r2=r7-16+4|0;r6=HEAP32[r2+12>>2];r10=HEAP32[r2+16>>2];HEAP32[r6+4>>2]=r10;HEAP32[r10>>2]=r6;r6=HEAP32[r7>>2];_free(r2);if((r6|0)==(r3|0)){break L1316}else{r7=r6}}}}while(0);_free(r8);r9=0;STACKTOP=r4;return r9}function _get_sequ145(r1,r2,r3,r4){var r5,r6;_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);r4=r2-4|0;r2=r1+156|0;r5=(r4|0)>511?255:(r4|0)/2&-1;HEAP32[r2>>2]=r5;if((r5|0)>0){r6=0}else{return}while(1){r5=_fgetc(r3);_fgetc(r3);HEAP8[r1+(r6+952)|0]=r5&255;r5=r6+1|0;if((r5|0)<(HEAP32[r2>>2]|0)){r6=r5}else{break}}return}function _get_patt146(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22;r4=STACKTOP;STACKTOP=STACKTOP+128|0;r2=r4;r5=r2;r6=(r1+128|0)>>2;HEAP32[r6]=_fgetc(r3)&255|_fgetc(r3)<<8&65280;r7=_fgetc(r3)&255;r8=(r1+136|0)>>2;HEAP32[r8]=r7;r9=Math.imul(r7,HEAP32[r6]);HEAP32[r1+132>>2]=r9;r7=(r1+172|0)>>2;HEAP32[r7]=_calloc(4,r9);r9=(r1+168|0)>>2;HEAP32[r9]=_calloc(4,HEAP32[r6]+1|0);if((HEAP32[r6]|0)>0){r10=0}else{STACKTOP=r4;return}while(1){r1=_calloc(1,(HEAP32[r8]<<2)+4|0);HEAP32[HEAP32[r9]+(r10<<2)>>2]=r1;r1=_fgetc(r3);r11=r1&255;_fgetc(r3);r12=_fgetc(r3)&255|_fgetc(r3)<<8&65280;HEAP32[HEAP32[HEAP32[r9]+(r10<<2)>>2]>>2]=r12;r12=HEAP32[r8];L1332:do{if((r12|0)>0){r13=0;r14=r12;while(1){r15=Math.imul(r14,r10)+r13|0;HEAP32[HEAP32[HEAP32[r9]+(r10<<2)>>2]+(r13<<2)+4>>2]=r15;r15=_calloc(HEAP32[HEAP32[HEAP32[r9]+(r10<<2)>>2]>>2]<<3|4,1);r16=Math.imul(HEAP32[r8],r10)+r13|0;HEAP32[HEAP32[r7]+(r16<<2)>>2]=r15;r15=HEAP32[HEAP32[HEAP32[r9]+(r10<<2)>>2]>>2];r16=Math.imul(HEAP32[r8],r10)+r13|0;HEAP32[HEAP32[HEAP32[r7]+(r16<<2)>>2]>>2]=r15;r15=r13+1|0;r16=HEAP32[r8];if((r15|0)<(r16|0)){r13=r15;r14=r16}else{break L1332}}}}while(0);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);r12=(r11|0)==0;if(!r12){r14=r1&255;_memset(r5,0,r14>>>0>1?r14<<2:4)}L1339:do{if((HEAP32[HEAP32[HEAP32[r9]+(r10<<2)>>2]>>2]|0)>0){r14=0;r13=0;while(1){do{if((r14|0)==0){r16=_fgetc(r3);if((r16&128|0)==0){r17=0}else{r17=_fgetc(r3)&255}if((r16&63|0)==0){r18=r17;break}_fgetc(r3);r18=r17}else{r18=r14-1|0}}while(0);L1350:do{if(!r12){r16=0;while(1){r15=HEAP32[HEAP32[r7]+(HEAP32[HEAP32[HEAP32[r9]+(r10<<2)>>2]+(r16<<2)+4>>2]<<2)>>2];r19=((r16<<2)+r2|0)>>2;r20=HEAP32[r19];do{if((r20|0)==0){r21=_fgetc(r3);if((r21&128|0)!=0){HEAP32[r19]=_fgetc(r3)&255}if((r21&64|0)!=0){HEAP8[(r13<<3)+r15+5|0]=_fgetc(r3)&255}if((r21&32|0)!=0){HEAP8[(r13<<3)+r15+4|0]=(_fgetc(r3)&255)+24&255}if((r21&16|0)!=0){HEAP8[(r13<<3)+r15+6|0]=_fgetc(r3)&255}if((r21&8|0)!=0){_fgetc(r3);_fgetc(r3)}if((r21&4|0)!=0){_fgetc(r3);_fgetc(r3)}if((r21&2|0)==0){break}r21=_fgetc(r3)&255;r22=_fgetc(r3);if(r21<<24>>24!=2){break}HEAP8[(r13<<3)+r15+7|0]=-95;HEAP8[(r13<<3)+r15+8|0]=r22&255}else{HEAP32[r19]=r20-1|0}}while(0);r20=r16+1|0;if((r20|0)<(r11|0)){r16=r20}else{break L1350}}}}while(0);r16=r13+1|0;if((r16|0)<(HEAP32[HEAP32[HEAP32[r9]+(r10<<2)>>2]>>2]|0)){r14=r18;r13=r16}else{break L1339}}}}while(0);r11=r10+1|0;if((r11|0)<(HEAP32[r6]|0)){r10=r11}else{break}}STACKTOP=r4;return}function _get_smpi(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r2=STACKTOP;STACKTOP=STACKTOP+32|0;r5=r2;r6=_fgetc(r3)&255;r7=r1+144|0;HEAP32[r7>>2]=r6;r8=(r1+140|0)>>2;HEAP32[r8]=r6;r9=(r1+176|0)>>2;HEAP32[r9]=_calloc(764,r6);r6=HEAP32[r7>>2];if((r6|0)!=0){HEAP32[r1+180>>2]=_calloc(52,r6)}if((HEAP32[r8]|0)<=0){STACKTOP=r2;return}r6=r5|0;r7=(r1+180|0)>>2;r1=r4;r10=0;while(1){r11=_calloc(64,1);HEAP32[HEAP32[r9]+(r10*764&-1)+756>>2]=r11;r11=_fgetc(r3)&255;r12=_fread(r6,1,r11>>>0>30?30:r11,r3);_copy_adjust(HEAP32[r9]+(r10*764&-1)|0,r6,r11);HEAP8[r5+r11|0]=0;L1389:do{if((r11|0)!=(r12|0)){r13=r11-r12|0;while(1){r14=r13-1|0;_fgetc(r3);if((r14|0)==0){break L1389}else{r13=r14}}}}while(0);r12=_fgetc(r3)&255;r11=_fgetc(r3);r13=r11<<8&65280|r12|_fgetc(r3)<<16&16711680|_fgetc(r3)<<24;HEAP32[HEAP32[r7]+(r10*52&-1)+32>>2]=r13;r13=_fgetc(r3)&255;r12=_fgetc(r3);r11=r12<<8&65280|r13|_fgetc(r3)<<16&16711680|_fgetc(r3)<<24;HEAP32[HEAP32[r7]+(r10*52&-1)+36>>2]=r11;r11=_fgetc(r3)&255;r13=_fgetc(r3);r12=r13<<8&65280|r11|_fgetc(r3)<<16&16711680|_fgetc(r3)<<24;HEAP32[HEAP32[r7]+(r10*52&-1)+40>>2]=r12;HEAP32[HEAP32[r9]+(r10*764&-1)+36>>2]=(HEAP32[HEAP32[r7]+(r10*52&-1)+32>>2]|0)!=0&1;r12=_fgetc(r3)&255|_fgetc(r3)<<8&65280;r11=HEAP32[HEAP32[r9]+(r10*764&-1)+756>>2];r13=r11+12|0;r14=r11+16|0;if((r12|0)==0){HEAP32[r14>>2]=0;HEAP32[r13>>2]=0}else{r11=Math.log((r12|0)/8363)*1536/.6931471805599453&-1;HEAP32[r13>>2]=(r11|0)/128&-1;HEAP32[r14>>2]=(r11|0)%128}r11=_fgetc(r3)&255;HEAP32[HEAP32[HEAP32[r9]+(r10*764&-1)+756>>2]>>2]=r11;HEAP32[HEAP32[HEAP32[r9]+(r10*764&-1)+756>>2]+8>>2]=128;HEAP32[HEAP32[HEAP32[r9]+(r10*764&-1)+756>>2]+40>>2]=r10;r11=_fgetc(r3);HEAP32[HEAP32[r7]+(r10*52&-1)+44>>2]=r11<<1&2;if((HEAP32[r1>>2]|0)>7){_fseek(r3,8,1)}_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);HEAP8[r10+(r4+4)|0]=(r11&255)>>>2&3;r11=r10+1|0;if((r11|0)<(HEAP32[r8]|0)){r10=r11}else{break}}STACKTOP=r2;return}function _get_smpd(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38;r2=STACKTOP;STACKTOP=STACKTOP+1560|0;r5=r2;r6=(r1+144|0)>>2;r7=HEAP32[r6];L1403:do{if((r7|0)>0){r8=HEAP32[r1+180>>2];r9=0;r10=0;while(1){r11=HEAP32[r8+(r10*52&-1)+32>>2];r12=(r11|0)>(r9|0)?r11:r9;r11=r10+1|0;if((r11|0)<(r7|0)){r9=r12;r10=r11}else{r13=r12;break L1403}}}else{r13=0}}while(0);r7=_malloc(r13);if((r7|0)==0){___assert_func(5263600,326,5268804,5263144)}r10=_malloc(r13);if((r10|0)==0){___assert_func(5263600,328,5268804,5262932)}if((HEAP32[r6]|0)<=0){_free(r10);_free(r7);STACKTOP=r2;return}r13=r1+176|0;r9=(r1+180|0)>>2;r1=r5;r8=(r5|0)>>2;r12=(r5+4|0)>>2;r11=(r5+12|0)>>2;r14=(r5+8|0)>>2;r15=0;while(1){r16=_fgetc(r3)&255;r17=_fgetc(r3);r18=r17<<8&65280|r16|_fgetc(r3)<<16&16711680|_fgetc(r3)<<24;do{if((r18|0)!=0){r16=HEAPU8[r15+(r4+4)|0];if((r16|0)==1){_fread(r10,r18,1,r3);r17=HEAP32[HEAP32[r9]+(r15*52&-1)+32>>2];_memset(r1,0,1560);HEAP32[r8]=r10;HEAP32[r12]=r10+r18|0;_new_node(r5);L1424:do{if((r17|0)!=0){r19=0;r20=0;r21=0;r22=HEAP32[r11];while(1){if((r22|0)==0){r23=HEAP32[r8];if(r23>>>0<HEAP32[r12]>>>0){HEAP32[r8]=r23+1|0;r24=HEAPU8[r23]}else{r24=0}HEAP32[r14]=r24;r25=7;r26=r24}else{r25=r22-1|0;r26=HEAP32[r14]}HEAP32[r11]=r25;r23=r26>>>1;HEAP32[r14]=r23;r27=r21;r28=0;r29=r25;r30=r23;while(1){if((r29|0)==0){r23=HEAP32[r8];if(r23>>>0<HEAP32[r12]>>>0){HEAP32[r8]=r23+1|0;r31=HEAPU8[r23]}else{r31=0}HEAP32[r14]=r31;r32=7;r33=r31}else{r32=r29-1|0;r33=r30}HEAP32[r11]=r32;r23=r33>>>1;HEAP32[r14]=r23;if((r33&1|0)==0){r34=r5+(r28*6&-1)+24|0}else{r34=r5+(r28*6&-1)+26|0}r35=HEAP16[r34>>1];r36=r35<<16>>16;if(r35<<16>>16>255){r37=r27;r38=r32;break}r35=HEAP8[r5+(r36*6&-1)+28|0];if(HEAP32[r8]>>>0>=HEAP32[r12]>>>0&(r32|0)==0){r37=r35;r38=0;break}if(HEAP16[r5+(r36*6&-1)+24>>1]<<16>>16<=-1){r37=r35;r38=r32;break}if(HEAP16[r5+(r36*6&-1)+26>>1]<<16>>16>-1){r27=r35;r28=r36;r29=r32;r30=r23}else{r37=r35;r38=r32;break}}r30=r37^r26<<31>>31&255;r29=(r30&255)+r19|0;HEAP8[r7+r20|0]=(r20|0)==0?0:r29&255;r28=r20+1|0;if((r28|0)==(r17|0)){break L1424}else{r19=r29&255;r20=r28;r21=r30;r22=r38}}}}while(0);_load_sample(0,16,HEAP32[r9]+(r15*52&-1)|0,r7);break}else if((r16|0)==0){_load_sample(r3,0,HEAP32[r9]+(HEAP32[HEAP32[HEAP32[r13>>2]+(r15*764&-1)+756>>2]+40>>2]*52&-1)|0,0);break}else{_fseek(r3,r18,1);break}}}while(0);r18=r15+1|0;if((r18|0)<(HEAP32[r6]|0)){r15=r18}else{break}}_free(r10);_free(r7);STACKTOP=r2;return}function _new_node(r1){var r2,r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28;r2=0;r3=(r1+20|0)>>2;r4=HEAP32[r3];if((r4|0)>255){return}r5=(r1+12|0)>>2;r6=(r1|0)>>2;r7=(r1+4|0)>>2;r8=(r1+8|0)>>2;r9=(r1+16|0)>>2;r10=r4;while(1){r4=0;r11=1;r12=7;r13=HEAP32[r5];while(1){r14=r12-1|0;if((r13|0)==0){r15=HEAP32[r6];if(r15>>>0<HEAP32[r7]>>>0){HEAP32[r6]=r15+1|0;r16=HEAPU8[r15]}else{r16=0}HEAP32[r8]=r16;r17=7;r18=r16}else{r17=r13-1|0;r18=HEAP32[r8]}HEAP32[r5]=r17;r19=((r18&1|0)==0?0:r11)|r4;HEAP32[r8]=r18>>>1;if((r14|0)==0){break}else{r4=r19;r11=r11<<1;r12=r14;r13=r17}}HEAP8[r1+(r10*6&-1)+28|0]=r19;r13=HEAP32[r5];do{if((r13|0)==0){r12=HEAP32[r6];if(r12>>>0<HEAP32[r7]>>>0){HEAP32[r6]=r12+1|0;r20=HEAPU8[r12]}else{r20=0}HEAP32[r5]=7;r12=r20>>>1;HEAP32[r8]=r12;r21=7;r22=(r20&1|0)==0;r23=r12;r2=1032;break}else{r12=r13-1|0;r11=HEAP32[r8];HEAP32[r5]=r12;r4=(r11&1|0)==0;r14=r11>>>1;HEAP32[r8]=r14;if((r12|0)!=0){r21=r12;r22=r4;r23=r14;r2=1032;break}r14=HEAP32[r6];if(r14>>>0<HEAP32[r7]>>>0){HEAP32[r6]=r14+1|0;r24=HEAPU8[r14]}else{r24=0}HEAP32[r8]=r24;r25=7;r26=r24;r27=r4;break}}while(0);if(r2==1032){r2=0;r25=r21-1|0;r26=r23;r27=r22}HEAP32[r5]=r25;HEAP32[r8]=r26>>>1;r28=HEAP32[r9];if((r28|0)>255){r2=1045;break}r13=HEAP32[r3]+1|0;HEAP32[r3]=r13;HEAP32[r9]=r13;if(r27){HEAP16[r1+(r28*6&-1)+24>>1]=-1}else{HEAP16[r1+(r28*6&-1)+24>>1]=r13&65535;_new_node(r1)}r13=HEAP32[r3];HEAP32[r9]=r13;if((r26&1|0)==0){r2=1042;break}HEAP16[r1+(r28*6&-1)+26>>1]=r13&65535;r13=HEAP32[r3];if((r13|0)>255){r2=1046;break}else{r10=r13}}if(r2==1046){return}else if(r2==1042){HEAP16[r1+(r28*6&-1)+26>>1]=-1;return}else if(r2==1045){return}}function _dt_test(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+64|0;r5=r4;r6=_fgetc(r1);r7=_fgetc(r1);if((r7<<16&16711680|r6<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255|0)!=1143886894){r8=-1;STACKTOP=r4;return r8}_fgetc(r1);_fgetc(r1);_fgetc(r1);_fgetc(r1);_fgetc(r1);_fgetc(r1);_fgetc(r1);_fgetc(r1);_fgetc(r1);_fgetc(r1);_fgetc(r1);_fgetc(r1);_fgetc(r1);_fgetc(r1);_fgetc(r1);_fgetc(r1);_fgetc(r1);_fgetc(r1);r6=r5|0;if((r2|0)==0){r8=0;STACKTOP=r4;return r8}_memset(r2,0,33);_fread(r6,1,32,r1);HEAP8[r5+32|0]=0;_memset(r2,0,33);_strncpy(r2,r6,32);r6=HEAP8[r2];if(r6<<24>>24==0){r8=0;STACKTOP=r4;return r8}else{r9=0;r10=r2;r11=r6}while(1){do{if((_isprint(r11<<24>>24)|0)==0){r3=1054}else{if(HEAP8[r10]<<24>>24<0){r3=1054;break}else{break}}}while(0);if(r3==1054){r3=0;HEAP8[r10]=46}r6=r9+1|0;r5=r2+r6|0;r1=HEAP8[r5];if(r1<<24>>24!=0&(r6|0)<32){r9=r6;r10=r5;r11=r1}else{break}}if(HEAP8[r2]<<24>>24==0){r8=0;STACKTOP=r4;return r8}while(1){r11=r2+(_strlen(r2)-1)|0;if(HEAP8[r11]<<24>>24!=32){r8=0;r3=1060;break}HEAP8[r11]=0;if(HEAP8[r2]<<24>>24==0){r8=0;r3=1063;break}}if(r3==1060){STACKTOP=r4;return r8}else if(r3==1063){STACKTOP=r4;return r8}}function _dt_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r4=STACKTOP;STACKTOP=STACKTOP+12|0;r5=r4;_fseek(r2,r3,0);HEAP32[r5+4>>2]=0;HEAP32[r5>>2]=0;r3=_malloc(16);if((r3|0)==0){r6=-1;STACKTOP=r4;return r6}r7=r3;r8=r3;HEAP32[r8>>2]=r7;r9=(r3+4|0)>>2;HEAP32[r9]=r7;HEAP32[r3+8>>2]=4;HEAP32[r3+12>>2]=0;r10=_malloc(20);HEAP8[r10]=HEAP8[5267724];HEAP8[r10+1|0]=HEAP8[5267725|0];HEAP8[r10+2|0]=HEAP8[5267726|0];HEAP8[r10+3|0]=HEAP8[5267727|0];HEAP8[r10+4|0]=HEAP8[5267728|0];HEAP32[r10+8>>2]=202;r11=r10+12|0;r12=r11;r13=HEAP32[r9];HEAP32[r9]=r12;HEAP32[r11>>2]=r7;HEAP32[r10+16>>2]=r13;HEAP32[r13>>2]=r12;r12=_malloc(20);HEAP8[r12]=HEAP8[5266256];HEAP8[r12+1|0]=HEAP8[5266257|0];HEAP8[r12+2|0]=HEAP8[5266258|0];HEAP8[r12+3|0]=HEAP8[5266259|0];HEAP8[r12+4|0]=HEAP8[5266260|0];HEAP32[r12+8>>2]=432;r13=r12+12|0;r10=r13;r11=HEAP32[r9];HEAP32[r9]=r10;HEAP32[r13>>2]=r7;HEAP32[r12+16>>2]=r11;HEAP32[r11>>2]=r10;r10=_malloc(20);HEAP8[r10]=HEAP8[5263320];HEAP8[r10+1|0]=HEAP8[5263321|0];HEAP8[r10+2|0]=HEAP8[5263322|0];HEAP8[r10+3|0]=HEAP8[5263323|0];HEAP8[r10+4|0]=HEAP8[5263324|0];HEAP32[r10+8>>2]=458;r11=r10+12|0;r12=r11;r13=HEAP32[r9];HEAP32[r9]=r12;HEAP32[r11>>2]=r7;HEAP32[r10+16>>2]=r13;HEAP32[r13>>2]=r12;r12=_malloc(20);HEAP8[r12]=HEAP8[5264676];HEAP8[r12+1|0]=HEAP8[5264677|0];HEAP8[r12+2|0]=HEAP8[5264678|0];HEAP8[r12+3|0]=HEAP8[5264679|0];HEAP8[r12+4|0]=HEAP8[5264680|0];HEAP32[r12+8>>2]=296;r13=r12+12|0;r10=r13;r11=HEAP32[r9];HEAP32[r9]=r10;HEAP32[r13>>2]=r7;HEAP32[r12+16>>2]=r11;HEAP32[r11>>2]=r10;r10=_malloc(20);HEAP8[r10]=HEAP8[5264116];HEAP8[r10+1|0]=HEAP8[5264117|0];HEAP8[r10+2|0]=HEAP8[5264118|0];HEAP8[r10+3|0]=HEAP8[5264119|0];HEAP8[r10+4|0]=HEAP8[5264120|0];HEAP32[r10+8>>2]=492;r11=r10+12|0;r12=r11;r13=HEAP32[r9];HEAP32[r9]=r12;HEAP32[r11>>2]=r7;HEAP32[r10+16>>2]=r13;HEAP32[r13>>2]=r12;r12=_malloc(20);HEAP8[r12]=HEAP8[5263592];HEAP8[r12+1|0]=HEAP8[5263593|0];HEAP8[r12+2|0]=HEAP8[5263594|0];HEAP8[r12+3|0]=HEAP8[5263595|0];HEAP8[r12+4|0]=HEAP8[5263596|0];HEAP32[r12+8>>2]=298;r13=r12+12|0;r10=r13;r11=HEAP32[r9];HEAP32[r9]=r10;HEAP32[r13>>2]=r7;HEAP32[r12+16>>2]=r11;HEAP32[r11>>2]=r10;L1525:do{if((_feof(r2)|0)==0){r10=r5;while(1){_iff_chunk(r3,r1,r2,r10);if((_feof(r2)|0)!=0){break L1525}}}}while(0);r2=HEAP32[r8>>2];L1530:do{if((r2|0)!=(r7|0)){r8=r2;while(1){r1=r8-16+4|0;r5=HEAP32[r1+12>>2];r10=HEAP32[r1+16>>2];HEAP32[r5+4>>2]=r10;HEAP32[r10>>2]=r5;r5=HEAP32[r8>>2];_free(r1);if((r5|0)==(r7|0)){break L1530}else{r8=r5}}}}while(0);_free(r3);r6=0;STACKTOP=r4;return r6}function _get_d_t_(r1,r2,r3,r4){var r5;r4=STACKTOP;_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);r2=_fgetc(r3);HEAP32[r1+148>>2]=_fgetc(r3)&255|r2<<8&65280;r2=_fgetc(r3)&65535;r5=_fgetc(r3)&255|r2<<8;if(r5<<16>>16!=0){HEAP32[r1+152>>2]=r5&65535}_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fread(r1|0,32,1,r3);_set_type(r1,5263124,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));STACKTOP=r4;return}function _get_s_q_(r1,r2,r3,r4){var r5,r6,r7;r4=_fgetc(r3);HEAP32[r1+156>>2]=_fgetc(r3)&255|r4<<8&65280;r4=_fgetc(r3);HEAP32[r1+160>>2]=_fgetc(r3)&255|r4<<8&65280;_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);r4=0;r2=0;while(1){r5=_fgetc(r3);HEAP8[r1+(r4+952)|0]=r5&255;r6=r5&255;r7=(r6|0)>(r2|0)?r6:r2;r6=r4+1|0;if((r6|0)==128){break}else{r4=r6;r2=r7}}HEAP32[r1+128>>2]=r7+1|0;return}function _get_patt157(r1,r2,r3,r4){var r5;r2=_fgetc(r3);r5=r1+136|0;HEAP32[r5>>2]=_fgetc(r3)&255|r2<<8&65280;r2=_fgetc(r3);HEAP32[r4+8>>2]=_fgetc(r3)&255|r2<<8&65280;HEAP32[r1+132>>2]=Math.imul(HEAP32[r1+128>>2],HEAP32[r5>>2]);return}function _get_inst158(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r4=0;r2=STACKTOP;STACKTOP=STACKTOP+32|0;r5=_fgetc(r3);r6=_fgetc(r3)&255|r5<<8&65280;r5=r1+144|0;HEAP32[r5>>2]=r6;r7=(r1+140|0)>>2;HEAP32[r7]=r6;r8=(r1+176|0)>>2;HEAP32[r8]=_calloc(764,r6);r6=HEAP32[r5>>2];if((r6|0)!=0){HEAP32[r1+180>>2]=_calloc(52,r6)}if((HEAP32[r7]|0)<=0){STACKTOP=r2;return}r6=(r1+180|0)>>2;r1=r2|0;r5=0;while(1){r9=_calloc(64,1);HEAP32[HEAP32[r8]+(r5*764&-1)+756>>2]=r9;_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);r9=_fgetc(r3);r10=_fgetc(r3);r11=r10<<16&16711680|r9<<24|_fgetc(r3)<<8&65280|_fgetc(r3)&255;HEAP32[HEAP32[r6]+(r5*52&-1)+32>>2]=r11;HEAP32[HEAP32[r8]+(r5*764&-1)+36>>2]=(HEAP32[HEAP32[r6]+(r5*52&-1)+32>>2]|0)!=0&1;r11=_fgetc(r3)<<24>>24;r9=_fgetc(r3)&255;HEAP32[HEAP32[HEAP32[r8]+(r5*764&-1)+756>>2]>>2]=r9;HEAP32[HEAP32[HEAP32[r8]+(r5*764&-1)+756>>2]+8>>2]=128;r9=_fgetc(r3);r10=_fgetc(r3);r12=r10<<16&16711680|r9<<24|_fgetc(r3)<<8&65280|_fgetc(r3)&255;HEAP32[HEAP32[r6]+(r5*52&-1)+36>>2]=r12;r12=_fgetc(r3);r9=_fgetc(r3);r10=r9<<16&16711680|r12<<24|_fgetc(r3)<<8&65280|_fgetc(r3)&255;r12=HEAP32[r6];HEAP32[r12+(r5*52&-1)+40>>2]=HEAP32[r12+(r5*52&-1)+36>>2]-1+r10|0;HEAP32[HEAP32[r6]+(r5*52&-1)+44>>2]=(r10|0)>2?2:0;_fread(r1,22,1,r3);r10=HEAP32[r8];r12=r10+(r5*764&-1)|0;_memset(r12,0,23);_strncpy(r12,r1,22);r9=HEAP8[r12];L1553:do{if(r9<<24>>24!=0){r13=0;r14=r12;r15=r9;while(1){do{if((_isprint(r15<<24>>24)|0)==0){r4=1090}else{if(HEAP8[r14]<<24>>24<0){r4=1090;break}else{break}}}while(0);if(r4==1090){r4=0;HEAP8[r14]=46}r16=r13+1|0;r17=r10+(r5*764&-1)+r16|0;r18=HEAP8[r17];if(r18<<24>>24!=0&(r16|0)<22){r13=r16;r14=r17;r15=r18}else{break}}if(HEAP8[r12]<<24>>24==0){break}while(1){r15=_strlen(r12)-1+r10+(r5*764&-1)|0;if(HEAP8[r15]<<24>>24!=32){break L1553}HEAP8[r15]=0;if(HEAP8[r12]<<24>>24==0){break L1553}}}}while(0);_fgetc(r3);if((_fgetc(r3)&255)>>>0>8){r12=HEAP32[r6]+(r5*52&-1)+44|0;HEAP32[r12>>2]=HEAP32[r12>>2]|1;r12=HEAP32[r6]+(r5*52&-1)+32|0;HEAP32[r12>>2]=HEAP32[r12>>2]>>1;r12=HEAP32[r6]+(r5*52&-1)+36|0;HEAP32[r12>>2]=HEAP32[r12>>2]>>1;r12=HEAP32[r6]+(r5*52&-1)+40|0;HEAP32[r12>>2]=HEAP32[r12>>2]>>1}_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);r12=_fgetc(r3);r10=_fgetc(r3);r9=r10<<16&16711680|r12<<24|_fgetc(r3)<<8&65280|_fgetc(r3)&255;r12=HEAP32[HEAP32[r8]+(r5*764&-1)+756>>2];r10=r12+12|0;r15=r12+16|0;if((r9|0)==0){HEAP32[r15>>2]=0;HEAP32[r10>>2]=0}else{r12=Math.log((r9|0)/8363)*1536/.6931471805599453&-1;HEAP32[r10>>2]=(r12|0)/128&-1;HEAP32[r15>>2]=(r12|0)%128}r12=HEAP32[HEAP32[r8]+(r5*764&-1)+756>>2]+16|0;HEAP32[r12>>2]=HEAP32[r12>>2]+r11|0;HEAP32[HEAP32[HEAP32[r8]+(r5*764&-1)+756>>2]+40>>2]=r5;r12=r5+1|0;if((r12|0)<(HEAP32[r7]|0)){r5=r12}else{break}}STACKTOP=r2;return}function _get_dapt(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;r2=r4;if((HEAP32[r2>>2]|0)==0){HEAP32[r2>>2]=1;HEAP32[1312658]=0;HEAP32[r1+172>>2]=_calloc(4,HEAP32[r1+132>>2]);HEAP32[r1+168>>2]=_calloc(4,HEAP32[r1+128>>2]+1|0)}_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);r2=_fgetc(r3);r4=_fgetc(r3)&255|r2<<8&65280;r2=_fgetc(r3);r5=_fgetc(r3)&255|r2<<8&65280;r2=HEAP32[1312658];L1578:do{if((r2|0)>(r4|0)){r6=r4+1|0}else{r7=(r1+136|0)>>2;r8=(r1+168|0)>>2;r9=r1+172|0;r10=r4+1|0;r11=r2;r12=HEAP32[r7];while(1){r13=_calloc(1,(r12<<2)+4|0);HEAP32[HEAP32[r8]+(r11<<2)>>2]=r13;HEAP32[HEAP32[HEAP32[r8]+(r11<<2)>>2]>>2]=r5;r13=HEAP32[r7];L1583:do{if((r13|0)>0){r14=0;r15=r13;while(1){r16=Math.imul(r15,r11)+r14|0;HEAP32[HEAP32[HEAP32[r8]+(r11<<2)>>2]+(r14<<2)+4>>2]=r16;r16=_calloc(HEAP32[HEAP32[HEAP32[r8]+(r11<<2)>>2]>>2]<<3|4,1);r17=Math.imul(HEAP32[r7],r11)+r14|0;HEAP32[HEAP32[r9>>2]+(r17<<2)>>2]=r16;r16=HEAP32[HEAP32[HEAP32[r8]+(r11<<2)>>2]>>2];r17=Math.imul(HEAP32[r7],r11)+r14|0;HEAP32[HEAP32[HEAP32[r9>>2]+(r17<<2)>>2]>>2]=r16;r16=r14+1|0;r17=HEAP32[r7];if((r16|0)<(r17|0)){r14=r16;r15=r17}else{r18=r17;break L1583}}}else{r18=r13}}while(0);r13=r11+1|0;if((r13|0)==(r10|0)){r6=r10;break L1578}else{r11=r13;r12=r18}}}}while(0);HEAP32[1312658]=r6;if((r5|0)==0){return}r6=r1+136|0;r18=r1+168|0;r2=r1+172|0;r1=0;r12=HEAP32[r6>>2];while(1){L1593:do{if((r12|0)>0){r11=0;while(1){r10=HEAP32[HEAP32[r2>>2]+(HEAP32[HEAP32[HEAP32[r18>>2]+(r4<<2)>>2]+(r11<<2)+4>>2]<<2)>>2];r7=_fgetc(r3)&255;r9=_fgetc(r3)&255;r8=_fgetc(r3)&255;r13=_fgetc(r3)&255;if(r7<<24>>24!=0){r15=r7-1&255;HEAP8[(r1<<3)+r10+4|0]=((r15&15)+12&255)+(((r15&255)>>>4)*12&255)&255}HEAP8[(r1<<3)+r10+6|0]=(r9&255)>>>2;HEAP8[(r1<<3)+r10+5|0]=r9<<4&48|(r8&255)>>>4;HEAP8[(r1<<3)+r10+7|0]=r8&15;HEAP8[(r1<<3)+r10+8|0]=r13;r13=r11+1|0;r10=HEAP32[r6>>2];if((r13|0)<(r10|0)){r11=r13}else{r19=r10;break L1593}}}else{r19=r12}}while(0);r11=r1+1|0;if((r11|0)<(r5|0)){r1=r11;r12=r19}else{break}}return}function _get_dait(r1,r2,r3,r4){var r5,r6,r7;r5=r4+4|0;if((HEAP32[r5>>2]|0)==0){HEAP32[r5>>2]=1;HEAP32[1312659]=0}if((r2|0)<=2){r6=HEAP32[1312659];r7=r6+1|0;HEAP32[1312659]=r7;return}_load_sample(r3,64,HEAP32[r1+180>>2]+(HEAP32[HEAP32[HEAP32[r1+176>>2]+(HEAP32[1312659]*764&-1)+756>>2]+40>>2]*52&-1)|0,0);r6=HEAP32[1312659];r7=r6+1|0;HEAP32[1312659]=r7;return}function _dtt_test(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+64|0;r5=r4;r6=_fgetc(r1);r7=_fgetc(r1);if((r7<<16&16711680|r6<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255|0)!=1148414804){r8=-1;STACKTOP=r4;return r8}r6=r5|0;if((r2|0)==0){r8=0;STACKTOP=r4;return r8}_memset(r2,0,64);_fread(r6,1,63,r1);HEAP8[r5+63|0]=0;_memset(r2,0,64);_strncpy(r2,r6,63);r6=HEAP8[r2];if(r6<<24>>24==0){r8=0;STACKTOP=r4;return r8}else{r9=0;r10=r2;r11=r6}while(1){do{if((_isprint(r11<<24>>24)|0)==0){r3=1134}else{if(HEAP8[r10]<<24>>24<0){r3=1134;break}else{break}}}while(0);if(r3==1134){r3=0;HEAP8[r10]=46}r6=r9+1|0;r5=r2+r6|0;r1=HEAP8[r5];if(r1<<24>>24!=0&(r6|0)<63){r9=r6;r10=r5;r11=r1}else{break}}if(HEAP8[r2]<<24>>24==0){r8=0;STACKTOP=r4;return r8}while(1){r11=r2+(_strlen(r2)-1)|0;if(HEAP8[r11]<<24>>24!=32){r8=0;r3=1142;break}HEAP8[r11]=0;if(HEAP8[r2]<<24>>24==0){r8=0;r3=1139;break}}if(r3==1139){STACKTOP=r4;return r8}else if(r3==1142){STACKTOP=r4;return r8}}function _dtt_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+1636|0;r6=r5+100;r7=r5+1124;r8=r5+1380;_fseek(r2,r3,0);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_set_type(r1,5267708,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r9=r5|0;_fread(r9,1,64,r2);_strncpy(r1|0,r9,64);_fread(r9,1,64,r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r10=_fgetc(r2)&255;r11=_fgetc(r2);r12=(r1+136|0)>>2;HEAP32[r12]=r11<<8&65280|r10|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r10=_fgetc(r2)&255;r11=_fgetc(r2);r13=r1+156|0;HEAP32[r13>>2]=r11<<8&65280|r10|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;_fread(r9,1,8,r2);r10=_fgetc(r2)&255;r11=_fgetc(r2);HEAP32[r1+148>>2]=r11<<8&65280|r10|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r10=_fgetc(r2)&255;r11=_fgetc(r2);HEAP32[r1+160>>2]=r11<<8&65280|r10|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r10=_fgetc(r2)&255;r11=_fgetc(r2);r14=(r1+128|0)>>2;HEAP32[r14]=r11<<8&65280|r10|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r10=_fgetc(r2)&255;r11=_fgetc(r2);r15=r11<<8&65280|r10|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r10=r1+144|0;HEAP32[r10>>2]=r15;r11=(r1+140|0)>>2;HEAP32[r11]=r15;r15=r1+132|0;HEAP32[r15>>2]=Math.imul(HEAP32[r12],HEAP32[r14]);_fread(r1+952|0,1,HEAP32[r13>>2]+3&-4,r2);r13=HEAP32[r14];L1635:do{if((r13|0)>0){r16=0;while(1){r17=_fgetc(r2);r18=_fgetc(r2);r19=_fgetc(r2);r20=_fgetc(r2);if((r16|0)<256){HEAP32[r6+(r16<<2)>>2]=r18<<8&65280|r17&255|r19<<16&16711680|r20<<24}r20=r16+1|0;r19=HEAP32[r14];if((r20|0)<(r19|0)){r16=r20}else{r21=r19;break L1635}}}else{r21=r13}}while(0);r13=r21+3&-4;L1642:do{if((r13|0)>0){r21=0;while(1){r16=_fgetc(r2);if((r21|0)<256){HEAP8[r7+r21|0]=r16&255}r16=r21+1|0;if((r16|0)==(r13|0)){break L1642}else{r21=r16}}}}while(0);r13=(r1+176|0)>>2;HEAP32[r13]=_calloc(764,HEAP32[r11]);r21=HEAP32[r10>>2];if((r21|0)!=0){HEAP32[r1+180>>2]=_calloc(52,r21)}L1652:do{if((HEAP32[r11]|0)>0){r21=(r1+180|0)>>2;r10=0;while(1){r16=_calloc(64,1);HEAP32[HEAP32[r13]+(r10*764&-1)+756>>2]=r16;_fgetc(r2);r16=_fgetc(r2)>>>1&127;HEAP32[HEAP32[HEAP32[r13]+(r10*764&-1)+756>>2]>>2]=r16;HEAP32[HEAP32[HEAP32[r13]+(r10*764&-1)+756>>2]+8>>2]=128;_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r16=_fgetc(r2)&255;r19=_fgetc(r2);r20=r19<<8&65280|r16|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;HEAP32[HEAP32[r21]+(r10*52&-1)+36>>2]=r20;r20=_fgetc(r2)&255;r16=_fgetc(r2);r19=r16<<8&65280|r20|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;HEAP32[HEAP32[r21]+(r10*52&-1)+44>>2]=(r19|0)>0?2:0;r20=HEAP32[r21];HEAP32[r20+(r10*52&-1)+40>>2]=HEAP32[r20+(r10*52&-1)+36>>2]+r19|0;r19=_fgetc(r2)&255;r20=_fgetc(r2);r16=r20<<8&65280|r19|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;HEAP32[HEAP32[r21]+(r10*52&-1)+32>>2]=r16;_fread(r9,1,32,r2);r16=HEAP32[r13];r19=r16+(r10*764&-1)|0;_memset(r19,0,33);_strncpy(r19,r9,32);r20=HEAP8[r19];L1656:do{if(r20<<24>>24!=0){r17=0;r18=r19;r22=r20;while(1){do{if((_isprint(r22<<24>>24)|0)==0){r4=1161}else{if(HEAP8[r18]<<24>>24<0){r4=1161;break}else{break}}}while(0);if(r4==1161){r4=0;HEAP8[r18]=46}r23=r17+1|0;r24=r16+(r10*764&-1)+r23|0;r25=HEAP8[r24];if(r25<<24>>24!=0&(r23|0)<32){r17=r23;r18=r24;r22=r25}else{break}}if(HEAP8[r19]<<24>>24==0){break}while(1){r22=_strlen(r19)-1+r16+(r10*764&-1)|0;if(HEAP8[r22]<<24>>24!=32){break L1656}HEAP8[r22]=0;if(HEAP8[r19]<<24>>24==0){break L1656}}}}while(0);r19=_fgetc(r2)&255;r16=_fgetc(r2);HEAP32[r8+(r10<<2)>>2]=r16<<8&65280|r19|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;HEAP32[HEAP32[r13]+(r10*764&-1)+36>>2]=(HEAP32[HEAP32[r21]+(r10*52&-1)+32>>2]|0)!=0&1;HEAP32[HEAP32[HEAP32[r13]+(r10*764&-1)+756>>2]+40>>2]=r10;r19=r10+1|0;if((r19|0)<(HEAP32[r11]|0)){r10=r19}else{break L1652}}}}while(0);r4=(r1+172|0)>>2;HEAP32[r4]=_calloc(4,HEAP32[r15>>2]);r15=(r1+168|0)>>2;HEAP32[r15]=_calloc(4,HEAP32[r14]+1|0);L1670:do{if((HEAP32[r14]|0)>0){r9=0;while(1){r10=_calloc(1,(HEAP32[r12]<<2)+4|0);HEAP32[HEAP32[r15]+(r9<<2)>>2]=r10;HEAP32[HEAP32[HEAP32[r15]+(r9<<2)>>2]>>2]=HEAPU8[r7+r9|0];r10=HEAP32[r12];L1673:do{if((r10|0)>0){r21=0;r19=r10;while(1){r16=Math.imul(r19,r9)+r21|0;HEAP32[HEAP32[HEAP32[r15]+(r9<<2)>>2]+(r21<<2)+4>>2]=r16;r16=_calloc(HEAP32[HEAP32[HEAP32[r15]+(r9<<2)>>2]>>2]<<3|4,1);r20=Math.imul(HEAP32[r12],r9)+r21|0;HEAP32[HEAP32[r4]+(r20<<2)>>2]=r16;r16=HEAP32[HEAP32[HEAP32[r15]+(r9<<2)>>2]>>2];r20=Math.imul(HEAP32[r12],r9)+r21|0;HEAP32[HEAP32[HEAP32[r4]+(r20<<2)>>2]>>2]=r16;r16=r21+1|0;r20=HEAP32[r12];if((r16|0)<(r20|0)){r21=r16;r19=r20}else{break L1673}}}}while(0);_fseek(r2,HEAP32[r6+(r9<<2)>>2]+r3|0,0);r10=HEAP32[r15];L1677:do{if((HEAP32[HEAP32[r10+(r9<<2)>>2]>>2]|0)>0){r19=0;r21=HEAP32[r12];r20=r10;while(1){L1681:do{if((r21|0)>0){r16=0;r22=r20;while(1){r18=HEAP32[HEAP32[r4]+(HEAP32[HEAP32[r22+(r9<<2)>>2]+(r16<<2)+4>>2]<<2)>>2];r17=_fgetc(r2);r25=_fgetc(r2);r24=_fgetc(r2);_fgetc(r2);r23=r24<<16;r24=r25<<8;HEAP8[(r19<<3)+r18+5|0]=r17&63;r25=(r24|r17&192)>>>6&63;r17=(r19<<3)+r18+4|0;HEAP8[r17]=r25;HEAP8[(r19<<3)+r18+7|0]=(r24&61440|r23)>>>12&31;if(r25<<24>>24!=0){HEAP8[r17]=r25+48&255}r25=r23&4063232;if((r25|0)==0){HEAP8[(r19<<3)+r18+8|0]=0}else{r23=(r19<<3)+r18+10|0;HEAP8[r23]=r25>>>17&255;r25=_fgetc(r2);r17=_fgetc(r2);_fgetc(r2);_fgetc(r2);HEAP8[(r19<<3)+r18+8|0]=r25&255;HEAP8[r23]=r17&255}r17=r16+1|0;r23=HEAP32[r12];r25=HEAP32[r15];if((r17|0)<(r23|0)){r16=r17;r22=r25}else{r26=r23;r27=r25;break L1681}}}else{r26=r21;r27=r20}}while(0);r22=r19+1|0;if((r22|0)<(HEAP32[HEAP32[r27+(r9<<2)>>2]>>2]|0)){r19=r22;r21=r26;r20=r27}else{break L1677}}}}while(0);r10=r9+1|0;if((r10|0)<(HEAP32[r14]|0)){r9=r10}else{break L1670}}}}while(0);if((HEAP32[r11]|0)<=0){STACKTOP=r5;return 0}r14=r1+180|0;r1=0;while(1){_fseek(r2,HEAP32[r8+(r1<<2)>>2]+r3|0,0);_load_sample(r2,128,HEAP32[r14>>2]+(HEAP32[HEAP32[HEAP32[r13]+(r1*764&-1)+756>>2]+40>>2]*52&-1)|0,0);r27=r1+1|0;if((r27|0)<(HEAP32[r11]|0)){r1=r27}else{break}}STACKTOP=r5;return 0}function _emod_test(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+64|0;r5=r4;r6=_fgetc(r1);r7=_fgetc(r1);if((r7<<16&16711680|r6<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255|0)!=1179603533){r8=-1;STACKTOP=r4;return r8}_fgetc(r1);_fgetc(r1);_fgetc(r1);_fgetc(r1);r6=_fgetc(r1);r7=_fgetc(r1);if((r7<<16&16711680|r6<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255|0)!=1162694468){r8=-1;STACKTOP=r4;return r8}r6=_fgetc(r1);r7=_fgetc(r1);if((r7<<16&16711680|r6<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255|0)!=1162692931){r6=r5|0;if((r2|0)==0){r8=0;STACKTOP=r4;return r8}HEAP8[r2]=0;_fread(r6,1,0,r1);HEAP8[r6]=0;HEAP8[r2]=0;_strncpy(r2,r6,0);if(HEAP8[r2]<<24>>24==0){r8=0;STACKTOP=r4;return r8}while(1){r6=r2+(_strlen(r2)-1)|0;if(HEAP8[r6]<<24>>24!=32){r8=0;r3=1206;break}HEAP8[r6]=0;if(HEAP8[r2]<<24>>24==0){r8=0;r3=1207;break}}if(r3==1207){STACKTOP=r4;return r8}else if(r3==1206){STACKTOP=r4;return r8}}_fgetc(r1);_fgetc(r1);_fgetc(r1);_fgetc(r1);_fgetc(r1);_fgetc(r1);r6=r5|0;if((r2|0)==0){r8=0;STACKTOP=r4;return r8}_memset(r2,0,21);_fread(r6,1,20,r1);HEAP8[r5+20|0]=0;_memset(r2,0,21);_strncpy(r2,r6,20);r6=HEAP8[r2];if(r6<<24>>24==0){r8=0;STACKTOP=r4;return r8}else{r9=0;r10=r2;r11=r6}while(1){do{if((_isprint(r11<<24>>24)|0)==0){r3=1194}else{if(HEAP8[r10]<<24>>24<0){r3=1194;break}else{break}}}while(0);if(r3==1194){r3=0;HEAP8[r10]=46}r6=r9+1|0;r5=r2+r6|0;r1=HEAP8[r5];if(r1<<24>>24!=0&(r6|0)<20){r9=r6;r10=r5;r11=r1}else{break}}if(HEAP8[r2]<<24>>24==0){r8=0;STACKTOP=r4;return r8}while(1){r11=r2+(_strlen(r2)-1)|0;if(HEAP8[r11]<<24>>24!=32){r8=0;r3=1211;break}HEAP8[r11]=0;if(HEAP8[r2]<<24>>24==0){r8=0;r3=1203;break}}if(r3==1211){STACKTOP=r4;return r8}else if(r3==1203){STACKTOP=r4;return r8}}function _emod_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;_fseek(r2,r3,0);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r3=_malloc(16);if((r3|0)==0){r4=-1;return r4}r5=r3;r6=r3;HEAP32[r6>>2]=r5;r7=(r3+4|0)>>2;HEAP32[r7]=r5;HEAP32[r3+8>>2]=4;HEAP32[r3+12>>2]=0;r8=_malloc(20);HEAP8[r8]=HEAP8[5267700];HEAP8[r8+1|0]=HEAP8[5267701|0];HEAP8[r8+2|0]=HEAP8[5267702|0];HEAP8[r8+3|0]=HEAP8[5267703|0];HEAP8[r8+4|0]=HEAP8[5267704|0];HEAP32[r8+8>>2]=568;r9=r8+12|0;r10=r9;r11=HEAP32[r7];HEAP32[r7]=r10;HEAP32[r9>>2]=r5;HEAP32[r8+16>>2]=r11;HEAP32[r11>>2]=r10;r10=_malloc(20);HEAP8[r10]=HEAP8[5263320];HEAP8[r10+1|0]=HEAP8[5263321|0];HEAP8[r10+2|0]=HEAP8[5263322|0];HEAP8[r10+3|0]=HEAP8[5263323|0];HEAP8[r10+4|0]=HEAP8[5263324|0];HEAP32[r10+8>>2]=648;r11=r10+12|0;r8=r11;r9=HEAP32[r7];HEAP32[r7]=r8;HEAP32[r11>>2]=r5;HEAP32[r10+16>>2]=r9;HEAP32[r9>>2]=r8;r8=_malloc(20);HEAP8[r8]=HEAP8[5265368];HEAP8[r8+1|0]=HEAP8[5265369|0];HEAP8[r8+2|0]=HEAP8[5265370|0];HEAP8[r8+3|0]=HEAP8[5265371|0];HEAP8[r8+4|0]=HEAP8[5265372|0];HEAP32[r8+8>>2]=50;r9=r8+12|0;r10=r9;r11=HEAP32[r7];HEAP32[r7]=r10;HEAP32[r9>>2]=r5;HEAP32[r8+16>>2]=r11;HEAP32[r11>>2]=r10;L1746:do{if((_feof(r2)|0)==0){while(1){_iff_chunk(r3,r1,r2,0);if((_feof(r2)|0)!=0){break L1746}}}}while(0);r2=HEAP32[r6>>2];L1750:do{if((r2|0)!=(r5|0)){r6=r2;while(1){r1=r6-16+4|0;r10=HEAP32[r1+12>>2];r11=HEAP32[r1+16>>2];HEAP32[r10+4>>2]=r11;HEAP32[r11>>2]=r10;r10=HEAP32[r6>>2];_free(r1);if((r10|0)==(r5|0)){break L1750}else{r6=r10}}}}while(0);_free(r3);r4=0;return r4}function _get_emic(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r4=STACKTOP;STACKTOP=STACKTOP+256|0;r2=r4;r5=_fgetc(r3);r6=_fgetc(r3)&255|r5<<8&65280;_fread(r1|0,1,20,r3);_fseek(r3,20,1);HEAP32[r1+152>>2]=_fgetc(r3)&255;r5=_fgetc(r3)&255;r7=(r1+140|0)>>2;HEAP32[r7]=r5;r8=r1+144|0;HEAP32[r8>>2]=r5;r5=r1+1276|0;HEAP32[r5>>2]=HEAP32[r5>>2]|8192;_snprintf(r1+64|0,64,5264692,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r6,tempInt));r6=(r1+176|0)>>2;HEAP32[r6]=_calloc(764,HEAP32[r7]);r5=HEAP32[r8>>2];if((r5|0)!=0){HEAP32[r1+180>>2]=_calloc(52,r5)}L1759:do{if((HEAP32[r7]|0)>0){r5=(r1+180|0)>>2;r8=0;while(1){r9=_calloc(64,1);HEAP32[HEAP32[r6]+(r8*764&-1)+756>>2]=r9;_fgetc(r3);r9=_fgetc(r3)&255;HEAP32[HEAP32[HEAP32[r6]+(r8*764&-1)+756>>2]>>2]=r9;r9=_fgetc(r3);r10=(_fgetc(r3)&255|r9<<8&65280)<<1;HEAP32[HEAP32[r5]+(r8*52&-1)+32>>2]=r10;_fread(HEAP32[r6]+(r8*764&-1)|0,1,20,r3);r10=_fgetc(r3)<<1&2;HEAP32[HEAP32[r5]+(r8*52&-1)+44>>2]=r10;r10=_fgetc(r3)&255;HEAP32[HEAP32[HEAP32[r6]+(r8*764&-1)+756>>2]+16>>2]=r10;r10=_fgetc(r3);r9=(_fgetc(r3)&255|r10<<8&65280)<<1;HEAP32[HEAP32[r5]+(r8*52&-1)+36>>2]=r9;r9=HEAP32[HEAP32[r5]+(r8*52&-1)+36>>2];r10=_fgetc(r3);r11=((_fgetc(r3)&255|r10<<8&65280)<<1)+r9|0;HEAP32[HEAP32[r5]+(r8*52&-1)+40>>2]=r11;_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);HEAP32[HEAP32[r6]+(r8*764&-1)+36>>2]=1;HEAP32[HEAP32[HEAP32[r6]+(r8*764&-1)+756>>2]+8>>2]=128;HEAP32[HEAP32[HEAP32[r6]+(r8*764&-1)+756>>2]+40>>2]=r8;r11=r8+1|0;if((r11|0)<(HEAP32[r7]|0)){r8=r11}else{break L1759}}}}while(0);_fgetc(r3);r7=_fgetc(r3)&255;r6=(r1+128|0)>>2;HEAP32[r6]=r7;r8=(r1+136|0)>>2;r5=Math.imul(r7,HEAP32[r8]);HEAP32[r1+132>>2]=r5;r7=(r1+172|0)>>2;HEAP32[r7]=_calloc(4,r5);r5=(r1+168|0)>>2;HEAP32[r5]=_calloc(4,HEAP32[r6]+1|0);_memset(r2|0,0,256);L1764:do{if((HEAP32[r6]|0)>0){r11=0;while(1){HEAP8[r2+(_fgetc(r3)&255)|0]=r11&255;r9=_calloc(1,(HEAP32[r8]<<2)+4|0);HEAP32[HEAP32[r5]+(r11<<2)>>2]=r9;r9=(_fgetc(r3)&255)+1|0;HEAP32[HEAP32[HEAP32[r5]+(r11<<2)>>2]>>2]=r9;r9=HEAP32[r8];L1767:do{if((r9|0)>0){r10=0;r12=r9;while(1){r13=Math.imul(r12,r11)+r10|0;HEAP32[HEAP32[HEAP32[r5]+(r11<<2)>>2]+(r10<<2)+4>>2]=r13;r13=_calloc(HEAP32[HEAP32[HEAP32[r5]+(r11<<2)>>2]>>2]<<3|4,1);r14=Math.imul(HEAP32[r8],r11)+r10|0;HEAP32[HEAP32[r7]+(r14<<2)>>2]=r13;r13=HEAP32[HEAP32[HEAP32[r5]+(r11<<2)>>2]>>2];r14=Math.imul(HEAP32[r8],r11)+r10|0;HEAP32[HEAP32[HEAP32[r7]+(r14<<2)>>2]>>2]=r13;r13=r10+1|0;r14=HEAP32[r8];if((r13|0)<(r14|0)){r10=r13;r12=r14}else{break L1767}}}}while(0);_fseek(r3,20,1);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);r9=r11+1|0;if((r9|0)<(HEAP32[r6]|0)){r11=r9}else{break L1764}}}}while(0);r6=_fgetc(r3)&255;r8=r1+156|0;HEAP32[r8>>2]=r6;if((r6|0)==0){STACKTOP=r4;return}else{r15=0}while(1){HEAP8[r1+(r15+952)|0]=HEAP8[r2+(_fgetc(r3)&255)|0];r6=r15+1|0;if((r6|0)<(HEAP32[r8>>2]|0)){r15=r6}else{break}}STACKTOP=r4;return}function _get_patt170(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22;r4=r1+128|0;r2=HEAP32[r4>>2];if((r2|0)<=0){return}r5=r1+168|0;r6=r1+136|0;r7=r1+172|0;r1=0;r8=HEAP32[r5>>2];r9=r2;while(1){if((HEAP32[HEAP32[r8+(r1<<2)>>2]>>2]|0)>0){r2=0;r10=HEAP32[r6>>2];r11=r8;while(1){L1787:do{if((r10|0)>0){r12=0;r13=r11;while(1){r14=HEAP32[HEAP32[r7>>2]+(HEAP32[HEAP32[r13+(r1<<2)>>2]+(r12<<2)+4>>2]<<2)>>2];HEAP8[(r2<<3)+r14+5|0]=_fgetc(r3)&255;r15=_fgetc(r3)&255;HEAP8[(r2<<3)+r14+4|0]=r15<<24>>24==-1?0:r15+49&255;r15=(r2<<3)+r14+7|0;HEAP8[r15]=_fgetc(r3)&15;r16=_fgetc(r3)&255;r17=(r2<<3)+r14+8|0;HEAP8[r17]=r16;r14=HEAP8[r15];r18=r14&255;if((r18|0)==4){HEAP8[r17]=r16<<1&14|r16&-16}else if((r18|0)==9){HEAP8[r15]=r14<<1}else if((r18|0)==11){HEAP8[r15]=Math.floor((r14&255)/10)<<4|(r14&255)%10}r14=r12+1|0;r15=HEAP32[r6>>2];r18=HEAP32[r5>>2];if((r14|0)<(r15|0)){r12=r14;r13=r18}else{r19=r15;r20=r18;break L1787}}}else{r19=r10;r20=r11}}while(0);r13=r2+1|0;if((r13|0)<(HEAP32[HEAP32[r20+(r1<<2)>>2]>>2]|0)){r2=r13;r10=r19;r11=r20}else{break}}r21=r20;r22=HEAP32[r4>>2]}else{r21=r8;r22=r9}r11=r1+1|0;if((r11|0)<(r22|0)){r1=r11;r8=r21;r9=r22}else{break}}return}function _get_8smp(r1,r2,r3,r4){var r5;r4=r1+144|0;if((HEAP32[r4>>2]|0)<=0){return}r2=r1+180|0;r1=0;while(1){_load_sample(r3,0,HEAP32[r2>>2]+(r1*52&-1)|0,0);r5=r1+1|0;if((r5|0)<(HEAP32[r4>>2]|0)){r1=r5}else{break}}return}function _far_test(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+64|0;r5=r4;r6=_fgetc(r1);r7=_fgetc(r1);if((r7<<16&16711680|r6<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255|0)!=1178686206){r8=-1;STACKTOP=r4;return r8}r6=r5|0;if((r2|0)==0){r8=0;STACKTOP=r4;return r8}_memset(r2,0,41);_fread(r6,1,40,r1);HEAP8[r5+40|0]=0;_memset(r2,0,41);_strncpy(r2,r6,40);r6=HEAP8[r2];if(r6<<24>>24==0){r8=0;STACKTOP=r4;return r8}else{r9=0;r10=r2;r11=r6}while(1){do{if((_isprint(r11<<24>>24)|0)==0){r3=1265}else{if(HEAP8[r10]<<24>>24<0){r3=1265;break}else{break}}}while(0);if(r3==1265){r3=0;HEAP8[r10]=46}r6=r9+1|0;r5=r2+r6|0;r1=HEAP8[r5];if(r1<<24>>24!=0&(r6|0)<40){r9=r6;r10=r5;r11=r1}else{break}}if(HEAP8[r2]<<24>>24==0){r8=0;STACKTOP=r4;return r8}while(1){r11=r2+(_strlen(r2)-1)|0;if(HEAP8[r11]<<24>>24!=32){r8=0;r3=1270;break}HEAP8[r11]=0;if(HEAP8[r2]<<24>>24==0){r8=0;r3=1273;break}}if(r3==1273){STACKTOP=r4;return r8}else if(r3==1270){STACKTOP=r4;return r8}}function _far_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+932|0;r6=r5;r7=r5+100,r8=r7>>1;r9=r5+872;r10=r5+924;_fseek(r2,r3,0);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r3=r6+4|0;_fread(r3,40,1,r2);_fread(r6+44|0,3,1,r2);HEAP16[r6+48>>1]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;r11=r6+50|0;HEAP8[r11]=_fgetc(r2)&255;_fread(r6+51|0,16,1,r2);_fseek(r2,9,1);r12=r6+76|0;HEAP8[r12]=_fgetc(r2)&255;_fread(r6+77|0,16,1,r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r13=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;HEAP16[r6+98>>1]=r13;_fseek(r2,r13&65535,1);r13=r7|0;_fread(r13,256,1,r2);HEAP8[r7+256|0]=_fgetc(r2)&255;r6=r7+257|0;HEAP8[r6]=_fgetc(r2)&255;HEAP8[r7+258|0]=_fgetc(r2)&255;r7=0;while(1){HEAP16[((r7<<1)+260>>1)+r8]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;r14=r7+1|0;if((r14|0)==256){break}else{r7=r14}}r7=(r1+136|0)>>2;HEAP32[r7]=16;r14=HEAPU8[r6];HEAP32[r1+156>>2]=r14;HEAP32[r1+148>>2]=6;HEAP32[r1+152>>2]=Math.floor(480/(HEAPU8[r12]>>>0));_memcpy(r1+952|0,r13,r14);r14=(r1+128|0)>>2;HEAP32[r14]=0;r13=0;r12=0;while(1){r6=r13+1|0;if(HEAP16[((r13<<1)+260>>1)+r8]<<16>>16==0){r15=r12}else{HEAP32[r14]=r6;r15=r6}if((r6|0)==256){break}else{r13=r6;r12=r15}}r12=r1+132|0;HEAP32[r12>>2]=r15<<4;_strncpy(r1|0,r3,40);r3=HEAPU8[r11];_set_type(r1,5267672,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r3>>>4,HEAP32[tempInt+4>>2]=r3&15,tempInt));r3=(r1+172|0)>>2;HEAP32[r3]=_calloc(4,HEAP32[r12>>2]);r12=(r1+168|0)>>2;HEAP32[r12]=_calloc(4,HEAP32[r14]+1|0);L1841:do{if((HEAP32[r14]|0)>0){r11=0;r15=0;while(1){r13=_calloc(1,(HEAP32[r7]<<2)+4|0);HEAP32[HEAP32[r12]+(r15<<2)>>2]=r13;r13=HEAP16[((r15<<1)+260>>1)+r8];L1844:do{if(r13<<16>>16==0){r16=r11}else{HEAP32[HEAP32[HEAP32[r12]+(r15<<2)>>2]>>2]=((r13&65535)-2|0)/64&-1;r6=HEAP32[r7];L1846:do{if((r6|0)>0){r17=0;r18=r6;while(1){r19=Math.imul(r18,r15)+r17|0;HEAP32[HEAP32[HEAP32[r12]+(r15<<2)>>2]+(r17<<2)+4>>2]=r19;r19=_calloc(HEAP32[HEAP32[HEAP32[r12]+(r15<<2)>>2]>>2]<<3|4,1);r20=Math.imul(HEAP32[r7],r15)+r17|0;HEAP32[HEAP32[r3]+(r20<<2)>>2]=r19;r19=HEAP32[HEAP32[HEAP32[r12]+(r15<<2)>>2]>>2];r20=Math.imul(HEAP32[r7],r15)+r17|0;HEAP32[HEAP32[HEAP32[r3]+(r20<<2)>>2]>>2]=r19;r19=r17+1|0;r20=HEAP32[r7];if((r19|0)<(r20|0)){r17=r19;r18=r20}else{break L1846}}}}while(0);r6=_fgetc(r2);_fgetc(r2);r18=HEAP32[HEAP32[r12]+(r15<<2)>>2];r17=HEAP32[r7];if((Math.imul(r17,HEAP32[r18>>2])|0)<=0){r16=r11;break}r20=r6+1&255;r6=r11;r19=0;r21=r18;r18=r17;while(1){r17=(r19|0)/(r18|0)&-1;r22=(r19|0)%(r18|0);r23=HEAP32[HEAP32[r3]+(HEAP32[r21+(r22<<2)+4>>2]<<2)>>2];r24=(r17<<3)+r23+4|0;if((r22|0)==0&(r17|0)==(r20|0)){HEAP8[(r20<<3)+r23+9|0]=13}r22=_fgetc(r2)&255;r25=_fgetc(r2)&255;r26=_fgetc(r2);r27=_fgetc(r2);if(r22<<24>>24==0){r28=HEAP8[r24|0]}else{r29=r22+48&255;HEAP8[r24|0]=r29;r28=r29}if((r28|r25)<<24>>24!=0){HEAP8[(r17<<3)+r23+5|0]=r25+1&255}r25=r26&255;r26=r25<<4|r25>>>4;if((r26&255)<<24>>24!=0){HEAP8[(r17<<3)+r23+6|0]=r26+240&255}r26=r27&255;r25=HEAP8[(r26>>>4)+5250952|0];r29=(r17<<3)+r23+7|0;HEAP8[r29]=r25;r24=r27&15;r22=(r17<<3)+r23+8|0;HEAP8[r22]=r24;r23=r25&255;if((r23|0)==4){HEAP8[r22]=(r26<<4)+r6&255;r30=r6}else if((r23|0)==123){HEAP8[r22]=(r26<<4)+r6&255;r30=r6}else if((r23|0)==251){HEAP8[r29]=14;HEAP8[r22]=r24|-112;r30=r6}else if((r23|0)==255){HEAP8[r22]=0;HEAP8[r29]=0;r30=r6}else if((r23|0)==254){HEAP8[r22]=0;HEAP8[r29]=0;r30=r27&15}else if((r23|0)==253){HEAP8[r29]=14;HEAP8[r22]=r24|-96;r30=r6}else if((r23|0)==249){HEAP8[r29]=14;HEAP8[r22]=r24|16;r30=r6}else if((r23|0)==248){HEAP8[r29]=14;HEAP8[r22]=r24|32;r30=r6}else if((r23|0)==252){HEAP8[r29]=14;HEAP8[r22]=r24|-80;r30=r6}else if((r23|0)==15){HEAP8[r22]=Math.floor(480/((r24&255)>>>0))&255;r30=r6}else if((r23|0)==250){HEAP8[r29]=14;HEAP8[r22]=r24|-48;r30=r6}else{r30=r6}r24=r19+1|0;r22=HEAP32[HEAP32[r12]+(r15<<2)>>2];r29=HEAP32[r7];if((r24|0)<(Math.imul(r29,HEAP32[r22>>2])|0)){r6=r30;r19=r24;r21=r22;r18=r29}else{r16=r30;break L1844}}}}while(0);r13=r15+1|0;if((r13|0)<(HEAP32[r14]|0)){r11=r16;r15=r13}else{break L1841}}}}while(0);r16=(r1+140|0)>>2;HEAP32[r16]=-1;_fread(r10|0,1,8,r2);r14=0;while(1){if((HEAPU8[r10+((r14|0)/8&-1)|0]&1<<(r14&7)|0)!=0){HEAP32[r16]=r14}r30=r14+1|0;if((r30|0)==64){break}else{r14=r30}}r14=HEAP32[r16]+1|0;HEAP32[r16]=r14;r30=r1+144|0;HEAP32[r30>>2]=r14;r7=(r1+176|0)>>2;HEAP32[r7]=_calloc(764,r14);r14=HEAP32[r30>>2];if((r14|0)!=0){HEAP32[r1+180>>2]=_calloc(52,r14)}r14=HEAP32[r16];if((r14|0)<=0){r31=r1+1264|0;HEAP32[r31>>2]=255;STACKTOP=r5;return 0}r30=r9|0;r12=r9+32|0;r28=r9+36|0;r3=r9+37|0;r8=r9+40|0;r15=r9+44|0;r11=r9+48|0;r13=r9+49|0;r9=(r1+180|0)>>2;r18=0;r21=r14;while(1){if((HEAPU8[r10+((r18|0)/8&-1)|0]&1<<(r18&7)|0)==0){r32=r21}else{r14=_calloc(64,1);HEAP32[HEAP32[r7]+(r18*764&-1)+756>>2]=r14;_fread(r30,32,1,r2);r14=_fgetc(r2)&255;r19=_fgetc(r2);_fgetc(r2);_fgetc(r2);r6=r19<<8&65280|r14;HEAP8[r28]=_fgetc(r2)&255;HEAP8[r3]=_fgetc(r2)&255;r14=_fgetc(r2)&255;r19=_fgetc(r2);_fgetc(r2);_fgetc(r2);r20=r19<<8&65280|r14;r14=_fgetc(r2)&255;r19=_fgetc(r2);_fgetc(r2);_fgetc(r2);r29=r19<<8&65280|r14;r14=_fgetc(r2)&255;HEAP8[r11]=r14;r19=_fgetc(r2)&255;HEAP8[r13]=r19;HEAP32[r12>>2]=r6;HEAP32[r8>>2]=r20;HEAP32[r15>>2]=r29;HEAP32[HEAP32[r9]+(r18*52&-1)+32>>2]=r6;HEAP32[HEAP32[r7]+(r18*764&-1)+36>>2]=(r6|0)!=0&1;HEAP32[HEAP32[r9]+(r18*52&-1)+36>>2]=r20;HEAP32[HEAP32[r9]+(r18*52&-1)+40>>2]=r29;HEAP32[HEAP32[r9]+(r18*52&-1)+44>>2]=0;if(r14<<24>>24!=0){r14=HEAP32[r9]+(r18*52&-1)+44|0;HEAP32[r14>>2]=HEAP32[r14>>2]|1;r14=HEAP32[r9]+(r18*52&-1)+32|0;HEAP32[r14>>2]=HEAP32[r14>>2]>>1;r14=HEAP32[r9]+(r18*52&-1)+36|0;HEAP32[r14>>2]=HEAP32[r14>>2]>>1;r14=HEAP32[r9]+(r18*52&-1)+40|0;HEAP32[r14>>2]=HEAP32[r14>>2]>>1}r14=HEAP32[r9]+(r18*52&-1)+44|0;HEAP32[r14>>2]=HEAP32[r14>>2]|(r19<<24>>24!=0?2:0);HEAP32[HEAP32[HEAP32[r7]+(r18*764&-1)+756>>2]>>2]=255;HEAP32[HEAP32[HEAP32[r7]+(r18*764&-1)+756>>2]+40>>2]=r18;r19=HEAP32[r7];r14=r19+(r18*764&-1)|0;_memset(r14,0,33);_strncpy(r14,r30,32);r29=HEAP8[r14];L1900:do{if(r29<<24>>24!=0){r20=0;r6=r14;r22=r29;while(1){do{if((_isprint(r22<<24>>24)|0)==0){r4=1326}else{if(HEAP8[r6]<<24>>24<0){r4=1326;break}else{break}}}while(0);if(r4==1326){r4=0;HEAP8[r6]=46}r24=r20+1|0;r23=r19+(r18*764&-1)+r24|0;r27=HEAP8[r23];if(r27<<24>>24!=0&(r24|0)<32){r20=r24;r6=r23;r22=r27}else{break}}if(HEAP8[r14]<<24>>24==0){break}while(1){r22=_strlen(r14)-1+r19+(r18*764&-1)|0;if(HEAP8[r22]<<24>>24!=32){break L1900}HEAP8[r22]=0;if(HEAP8[r14]<<24>>24==0){break L1900}}}}while(0);_load_sample(r2,0,HEAP32[r9]+(r18*52&-1)|0,0);r32=HEAP32[r16]}r14=r18+1|0;if((r14|0)<(r32|0)){r18=r14;r21=r32}else{break}}r31=r1+1264|0;HEAP32[r31>>2]=255;STACKTOP=r5;return 0}function _flt_test(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+68|0;r6=r5;r7=r5+64;_fseek(r1,r3+1080|0,0);r8=r7|0;L1916:do{if(_fread(r8,1,4,r1)>>>0<4){r9=-1}else{if((_memcmp(r8,5267e3,3)|0)!=0){if((_memcmp(r8,5266720,3)|0)!=0){r9=-1;break}}r10=HEAP8[r7+3|0];if(!(r10<<24>>24==52|r10<<24>>24==56|r10<<24>>24==77)){r9=-1;break}_fseek(r1,r3,0);r10=r6|0;if((r2|0)==0){r9=0;break}_memset(r2,0,21);_fread(r10,1,20,r1);HEAP8[r6+20|0]=0;_memset(r2,0,21);_strncpy(r2,r10,20);r10=HEAP8[r2];if(r10<<24>>24==0){r9=0;break}else{r11=0;r12=r2;r13=r10}while(1){do{if((_isprint(r13<<24>>24)|0)==0){r4=1344}else{if(HEAP8[r12]<<24>>24<0){r4=1344;break}else{break}}}while(0);if(r4==1344){r4=0;HEAP8[r12]=46}r10=r11+1|0;r14=r2+r10|0;r15=HEAP8[r14];if(r15<<24>>24!=0&(r10|0)<20){r11=r10;r12=r14;r13=r15}else{break}}if(HEAP8[r2]<<24>>24==0){r9=0;break}while(1){r15=r2+(_strlen(r2)-1)|0;if(HEAP8[r15]<<24>>24!=32){r9=0;break L1916}HEAP8[r15]=0;if(HEAP8[r2]<<24>>24==0){r9=0;break L1916}}}}while(0);STACKTOP=r5;return r9}function _flt_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+3156|0;r6=r5;r7=r5+1024;r8=r5+1028,r9=r8>>1;r10=r5+2112;r11=r5+3140;_fseek(r2,r3,0);r3=r5+2116|0;r12=(r1+1208|0)>>2;r13=(r1+1212|0)>>2;r14=HEAP32[r13];_snprintf(r3,1024,5267640,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[r12],HEAP32[tempInt+4>>2]=r14,tempInt));r14=_fopen(r3,5263292);do{if((r14|0)==0){r15=HEAP32[r13];_snprintf(r3,1024,5265332,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[r12],HEAP32[tempInt+4>>2]=r15,tempInt));r15=_fopen(r3,5263292);if((r15|0)!=0){r16=r15;r4=1352;break}r15=HEAP32[r13];_snprintf(r3,1024,5264684,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[r12],HEAP32[tempInt+4>>2]=r15,tempInt));r15=_fopen(r3,5263292);if((r15|0)!=0){r16=r15;r4=1352;break}r15=HEAP32[r13];_snprintf(r3,1024,5264108,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[r12],HEAP32[tempInt+4>>2]=r15,tempInt));r15=_fopen(r3,5263292);if((r15|0)==0){r17=0;r18=5263580;r19=0;r20=0;break}else{r21=r15;r22=1;r4=1354;break}}else{r16=r14;r4=1352}}while(0);do{if(r4==1352){r21=r16;r22=(r16|0)!=0;r4=1354;break}}while(0);do{if(r4==1354){r16=r11|0;_fread(r16,1,16,r21);if((_memcmp(r16,5263104,16)|0)==0){r17=1;r18=5262916;r19=r21;r20=r22;break}if((_memcmp(r16,5262700,16)|0)==0){r17=1;r18=5268152;r19=r21;r20=r22;break}r14=(_memcmp(r16,5267792,16)|0)==0;r17=r14&1;r18=r14?5267588:5263580;r19=r21;r20=r22}}while(0);r22=r8|0;_fread(r22,20,1,r2);r21=0;while(1){_fread(r8+(r21*30&-1)+20|0,22,1,r2);r11=_fgetc(r2)&65535;HEAP16[((r21*30&-1)+42>>1)+r9]=_fgetc(r2)&255|r11<<8;HEAP8[r8+(r21*30&-1)+44|0]=_fgetc(r2)&255;HEAP8[r8+(r21*30&-1)+45|0]=_fgetc(r2)&255;r11=_fgetc(r2)&65535;HEAP16[((r21*30&-1)+46>>1)+r9]=_fgetc(r2)&255|r11<<8;r11=_fgetc(r2)&65535;HEAP16[((r21*30&-1)+48>>1)+r9]=_fgetc(r2)&255|r11<<8;r11=r21+1|0;if((r11|0)==31){break}else{r21=r11}}r21=r8+950|0;HEAP8[r21]=_fgetc(r2)&255;HEAP8[r8+951|0]=_fgetc(r2)&255;r11=r8+952|0;_fread(r11,128,1,r2);r14=r8+1080|0;_fread(r14,4,1,r2);r16=(r1+136|0)>>2;r3=HEAP8[r8+1083|0]<<24>>24==52?4:8;HEAP32[r16]=r3;r12=(r1+140|0)>>2;HEAP32[r12]=31;r13=(r1+144|0)>>2;HEAP32[r13]=31;r15=HEAP16[r21>>1];HEAP32[r1+156>>2]=r15&255;HEAP32[r1+160>>2]=(r15&65535)>>>8&65535;_memcpy(r1+952|0,r11,128);r11=(r1+128|0)>>2;r15=0;r21=r3;while(1){r3=r1+(r15+952)|0;r23=HEAP8[r3];if((r21|0)>4){r24=(r23&255)>>>1;HEAP8[r3]=r24;r25=r24}else{r25=r23}r23=r25&255;r24=HEAP32[r11];if((r23|0)>(r24|0)){HEAP32[r11]=r23;r26=r23}else{r26=r24}r24=r15+1|0;if((r24|0)==128){break}r15=r24;r21=HEAP32[r16]}r21=r26+1|0;HEAP32[r11]=r21;r26=r1+132|0;HEAP32[r26>>2]=Math.imul(HEAP32[r16],r21);_strncpy(r1|0,r22,20);_set_type(r1,5267364,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r18,HEAP32[tempInt+4>>2]=r14,tempInt));r14=(r1+176|0)>>2;HEAP32[r14]=_calloc(764,HEAP32[r12]);r18=HEAP32[r13];if((r18|0)!=0){HEAP32[r1+180>>2]=_calloc(52,r18)}L1963:do{if((HEAP32[r12]|0)>0){r18=(r1+180|0)>>2;r22=(r17|0)==0;r21=r7|0;r15=0;while(1){r25=_calloc(64,1);HEAP32[HEAP32[r14]+(r15*764&-1)+756>>2]=r25;HEAP32[HEAP32[r18]+(r15*52&-1)+32>>2]=HEAPU16[((r15*30&-1)+42>>1)+r9]<<1;HEAP32[HEAP32[r18]+(r15*52&-1)+36>>2]=HEAPU16[((r15*30&-1)+46>>1)+r9]<<1;r25=HEAP32[r18];r24=r8+(r15*30&-1)+48|0;HEAP32[r25+(r15*52&-1)+40>>2]=(HEAPU16[r24>>1]<<1)+HEAP32[r25+(r15*52&-1)+36>>2]|0;HEAP32[HEAP32[r18]+(r15*52&-1)+44>>2]=HEAPU16[r24>>1]>1?2:0;HEAP32[HEAP32[HEAP32[r14]+(r15*764&-1)+756>>2]+16>>2]=HEAP8[r8+(r15*30&-1)+44|0]<<28>>24;HEAP32[HEAP32[HEAP32[r14]+(r15*764&-1)+756>>2]>>2]=HEAP8[r8+(r15*30&-1)+45|0]<<24>>24;HEAP32[HEAP32[HEAP32[r14]+(r15*764&-1)+756>>2]+8>>2]=128;HEAP32[HEAP32[HEAP32[r14]+(r15*764&-1)+756>>2]+40>>2]=r15;HEAP32[HEAP32[r14]+(r15*764&-1)+36>>2]=(HEAP32[HEAP32[r18]+(r15*52&-1)+32>>2]|0)!=0&1;HEAP32[HEAP32[r14]+(r15*764&-1)+40>>2]=4095;r24=HEAP32[r14];r25=r24+(r15*764&-1)|0;_memset(r25,0,23);_strncpy(r25,r8+(r15*30&-1)+20|0,22);r23=HEAP8[r25];L1967:do{if(r23<<24>>24!=0){r3=0;r27=r25;r28=r23;while(1){do{if((_isprint(r28<<24>>24)|0)==0){r4=1374}else{if(HEAP8[r27]<<24>>24<0){r4=1374;break}else{break}}}while(0);if(r4==1374){r4=0;HEAP8[r27]=46}r29=r3+1|0;r30=r24+(r15*764&-1)+r29|0;r31=HEAP8[r30];if(r31<<24>>24!=0&(r29|0)<22){r3=r29;r27=r30;r28=r31}else{break}}if(HEAP8[r25]<<24>>24==0){break}while(1){r28=_strlen(r25)-1+r24+(r15*764&-1)|0;if(HEAP8[r28]<<24>>24!=32){break L1967}HEAP8[r28]=0;if(HEAP8[r25]<<24>>24==0){break L1967}}}}while(0);do{if(!r22){_fseek(r19,(r15*120&-1)+144|0,0);if(_fread(r21,1,2,r19)>>>0<2){break}if((_memcmp(r21,5267152,2)|0)!=0){break}_fseek(r19,24,1);_fgetc(r19);_fgetc(r19)}}while(0);r25=r15+1|0;if((r25|0)<(HEAP32[r12]|0)){r15=r25}else{break L1963}}}}while(0);r12=(r1+172|0)>>2;HEAP32[r12]=_calloc(4,HEAP32[r26>>2]);r26=(r1+168|0)>>2;HEAP32[r26]=_calloc(4,HEAP32[r11]+1|0);L1986:do{if((HEAP32[r11]|0)>0){r8=r10|0;r9=r10+1|0;r15=r10+2|0;r21=r10+3|0;r22=0;while(1){r18=_calloc(1,(HEAP32[r16]<<2)+4|0);HEAP32[HEAP32[r26]+(r22<<2)>>2]=r18;HEAP32[HEAP32[HEAP32[r26]+(r22<<2)>>2]>>2]=64;r18=HEAP32[r16];L1990:do{if((r18|0)>0){r25=0;r24=r18;while(1){r23=Math.imul(r24,r22)+r25|0;HEAP32[HEAP32[HEAP32[r26]+(r22<<2)>>2]+(r25<<2)+4>>2]=r23;r23=_calloc(HEAP32[HEAP32[HEAP32[r26]+(r22<<2)>>2]>>2]<<3|4,1);r28=Math.imul(HEAP32[r16],r22)+r25|0;HEAP32[HEAP32[r12]+(r28<<2)>>2]=r23;r23=HEAP32[HEAP32[HEAP32[r26]+(r22<<2)>>2]>>2];r28=Math.imul(HEAP32[r16],r22)+r25|0;HEAP32[HEAP32[HEAP32[r12]+(r28<<2)>>2]>>2]=r23;r23=r25+1|0;r28=HEAP32[r16];if((r23|0)<(r28|0)){r25=r23;r24=r28}else{r32=0;break L1990}}}else{r32=0}}while(0);while(1){r18=(r32|0)/4&-1;r24=HEAP32[HEAP32[r12]+(HEAP32[HEAP32[HEAP32[r26]+(r22<<2)>>2]+((r32|0)%4<<2)+4>>2]<<2)>>2];_fread(r8,1,4,r2);r25=HEAP8[r8];r28=(r25&255)<<8&3840|HEAPU8[r9];if((r28|0)==0){r33=0}else{L1997:do{if(r28>>>0<3628){r23=r28;r27=24;while(1){r3=r27+12|0;r31=r23<<1;if((r31|0)<3628){r23=r31;r27=r3}else{r34=r31;r35=r3;break L1997}}}else{r34=r28;r35=24}}while(0);L2001:do{if((r34|0)>3842){r28=r35;r27=5249472;while(1){r23=r27-32|0;r3=r28-1|0;r31=HEAP32[r23>>2];if((r34|0)>(r31|0)){r28=r3;r27=r23}else{r36=r3;r37=r23,r38=r37>>2;r39=r31;break L2001}}}else{r36=r35;r37=5249472,r38=r37>>2;r39=3842}}while(0);do{if((r39|0)>(r34|0)){if((HEAP32[r38+1]|0)<=(r34|0)){r40=1;break}if((HEAP32[r38+2]|0)<=(r34|0)){r40=1;break}r40=(HEAP32[r38+3]|0)<=(r34|0)&1}else{r40=1}}while(0);r33=r36-r40&255}HEAP8[(r18<<3)+r24+4|0]=r33;r27=HEAP8[r15];HEAP8[(r18<<3)+r24+5|0]=(r27&255)>>>4|r25&-16;r28=r27&15;r27=(r18<<3)+r24+7|0;HEAP8[r27]=r28;r31=HEAP8[r21];HEAP8[(r18<<3)+r24+8|0]=r31;do{if(r31<<24>>24==0){r23=r28&255;if((r23|0)==5){HEAP8[r27]=3;break}else if((r23|0)==6){HEAP8[r27]=4;break}else if((r23|0)==1|(r23|0)==2|(r23|0)==10){HEAP8[r27]=0;break}else{break}}}while(0);r27=r32+1|0;if((r27|0)==256){break}else{r32=r27}}L2019:do{if((HEAP32[r16]|0)>4){r27=0;while(1){r28=(r27|0)/4&-1;r31=HEAP32[HEAP32[r12]+(HEAP32[HEAP32[HEAP32[r26]+(r22<<2)>>2]+((r27|0)%4+4<<2)+4>>2]<<2)>>2];_fread(r8,1,4,r2);r24=HEAP8[r8];r18=(r24&255)<<8&3840|HEAPU8[r9];if((r18|0)==0){r41=0}else{L2024:do{if(r18>>>0<3628){r25=r18;r23=24;while(1){r3=r23+12|0;r30=r25<<1;if((r30|0)<3628){r25=r30;r23=r3}else{r42=r30;r43=r3;break L2024}}}else{r42=r18;r43=24}}while(0);L2028:do{if((r42|0)>3842){r18=r43;r23=5249472;while(1){r25=r23-32|0;r3=r18-1|0;r30=HEAP32[r25>>2];if((r42|0)>(r30|0)){r18=r3;r23=r25}else{r44=r3;r45=r25,r46=r45>>2;r47=r30;break L2028}}}else{r44=r43;r45=5249472,r46=r45>>2;r47=3842}}while(0);do{if((r47|0)>(r42|0)){if((HEAP32[r46+1]|0)<=(r42|0)){r48=1;break}if((HEAP32[r46+2]|0)<=(r42|0)){r48=1;break}r48=(HEAP32[r46+3]|0)<=(r42|0)&1}else{r48=1}}while(0);r41=r44-r48&255}HEAP8[(r28<<3)+r31+4|0]=r41;r23=HEAP8[r15];HEAP8[(r28<<3)+r31+5|0]=(r23&255)>>>4|r24&-16;r18=r23&15;r23=(r28<<3)+r31+7|0;HEAP8[r23]=r18;r30=HEAP8[r21];r25=(r28<<3)+r31+8|0;HEAP8[r25]=r30;do{if(r30<<24>>24==0){r3=r18&255;if((r3|0)==5){HEAP8[r23]=3;break}else if((r3|0)==6){HEAP8[r23]=4;break}else if((r3|0)==1|(r3|0)==2|(r3|0)==10){HEAP8[r23]=0;break}else{r4=1421;break}}else{r4=1421}}while(0);do{if(r4==1421){r4=0;if(r18<<24>>24!=14){break}HEAP8[r25]=0;HEAP8[r23]=0}}while(0);r23=r27+1|0;if((r23|0)==256){break L2019}else{r27=r23}}}}while(0);r27=r22+1|0;if((r27|0)<(HEAP32[r11]|0)){r22=r27}else{break L1986}}}}while(0);L2050:do{if((HEAP32[r13]|0)>0){r11=(r1+180|0)>>2;r4=(r17|0)==0;r41=r7|0;r48=r6|0;r44=0;while(1){r42=HEAP32[r11];do{if((HEAP32[r42+(r44*52&-1)+32>>2]|0)==0){if(r4){break}r46=r44*120&-1;_fseek(r19,r46+144|0,0);if(_fread(r41,1,2,r19)>>>0<2){break}if((_memcmp(r41,5267152,2)|0)!=0){break}_fseek(r19,24,1);r47=_fgetc(r19)&65535;if(((_fgetc(r19)&252|r47<<8)&65535)>=4){break}_fseek(r19,r46+150|0,0);r46=_fgetc(r19)&65535;r47=_fgetc(r19)&255|r46<<8;r46=_fgetc(r19)&65535;r45=_fgetc(r19)&255|r46<<8;r46=_fgetc(r19)&65535;r43=_fgetc(r19)&255|r46<<8;r46=_fgetc(r19)&65535;r26=_fgetc(r19)&255|r46<<8;r46=_fgetc(r19)&65535;r12=_fgetc(r19)&255|r46<<8;r46=_fgetc(r19)&65535;r16=_fgetc(r19)&255|r46<<8;r46=_fgetc(r19)&65535;r32=_fgetc(r19)&255|r46<<8;r46=_fgetc(r19)&65535;r33=_fgetc(r19)&255|r46<<8;_fgetc(r19);_fgetc(r19);r46=_fgetc(r19)&65535;r40=_fgetc(r19)&255|r46<<8;r46=_fgetc(r19)&65535;r36=_fgetc(r19)&255|r46<<8;r46=_fgetc(r19)&65535;r34=_fgetc(r19)&255|r46<<8;r46=-r34&65535;r38=_fgetc(r19)&65535;r39=_fgetc(r19)&255|r38<<8;r38=_fgetc(r19)&65535;r37=_fgetc(r19)&255|r38<<8;r38=_fgetc(r19)&65535;r35=_fgetc(r19)&255|r38<<8;r38=HEAP32[r11]+(r44*52&-1)+32|0;L2061:do{if(r36<<16>>16<3){HEAP32[r38>>2]=32;HEAP32[HEAP32[r11]+(r44*52&-1)+36>>2]=0;HEAP32[HEAP32[r11]+(r44*52&-1)+40>>2]=32;r49=(r36<<16>>16<<5)+5262212|0}else{HEAP32[r38>>2]=1024;HEAP32[HEAP32[r11]+(r44*52&-1)+36>>2]=0;HEAP32[HEAP32[r11]+(r44*52&-1)+40>>2]=1024;r10=0;while(1){HEAP8[r6+r10|0]=_rand()&255;r22=r10+1|0;if((r22|0)==1024){r49=r48;break L2061}else{r10=r22}}}}while(0);HEAP32[HEAP32[r11]+(r44*52&-1)+44>>2]=2;HEAP32[HEAP32[HEAP32[r14]+(r44*764&-1)+756>>2]>>2]=64;HEAP32[HEAP32[r14]+(r44*764&-1)+36>>2]=1;HEAP32[HEAP32[HEAP32[r14]+(r44*764&-1)+756>>2]+12>>2]=(r35<<16>>16)*-12&-1;HEAP32[HEAP32[HEAP32[r14]+(r44*764&-1)+756>>2]+20>>2]=0;HEAP32[HEAP32[HEAP32[r14]+(r44*764&-1)+756>>2]+24>>2]=r39<<16>>16;HEAP32[HEAP32[HEAP32[r14]+(r44*764&-1)+756>>2]+28>>2]=r37<<16>>16;HEAP32[HEAP32[r14]+(r44*764&-1)+48>>2]=6;HEAP32[HEAP32[r14]+(r44*764&-1)+44>>2]=1;HEAP16[HEAP32[r14]+(r44*764&-1)+72>>1]=0;r38=r47<<16>>16;HEAP16[HEAP32[r14]+(r44*764&-1)+74>>1]=(r38|0)/4&-1&65535;r36=r45<<16>>16;if(r45<<16>>16>r47<<16>>16){r50=256-r38|0;r51=r36-r38|0}else{r50=r38;r51=r38-r36|0}r38=HEAP32[r14];HEAP16[r38+(r44*764&-1)+76>>1]=HEAPU16[r38+(r44*764&-1)+72>>1]+((r51<<8|0)/(Math.imul((r50|0)==0?1:r50,r43<<16>>16==0?1:r43<<16>>16)|0)&-1)&65535;HEAP16[HEAP32[r14]+(r44*764&-1)+78>>1]=(r36|0)/4&-1&65535;r38=r26<<16>>16;if(r26<<16>>16>r45<<16>>16){r52=256-r36|0;r53=r38-r36|0}else{r52=r36;r53=r36-r38|0}r36=HEAP32[r14];HEAP16[r36+(r44*764&-1)+80>>1]=HEAPU16[r36+(r44*764&-1)+76>>1]+((r53<<8|0)/(Math.imul((r52|0)==0?1:r52,r12<<16>>16==0?1:r12<<16>>16)|0)&-1)&65535;HEAP16[HEAP32[r14]+(r44*764&-1)+82>>1]=(r38|0)/4&-1&65535;r36=r16<<16>>16;if(r16<<16>>16>r26<<16>>16){r54=256-r38|0;r55=r36-r38|0}else{r54=r38;r55=r38-r36|0}r38=HEAP32[r14];HEAP16[r38+(r44*764&-1)+84>>1]=HEAPU16[r38+(r44*764&-1)+80>>1]+((r55<<8|0)/(Math.imul((r54|0)==0?1:r54,r32<<16>>16==0?1:r32<<16>>16)|0)&-1)&65535;r38=(r36|0)/4&-1&65535;HEAP16[HEAP32[r14]+(r44*764&-1)+86>>1]=r38;r36=HEAP32[r14];HEAP16[r36+(r44*764&-1)+88>>1]=HEAP16[r36+(r44*764&-1)+84>>1]+r33&65535;HEAP16[HEAP32[r14]+(r44*764&-1)+90>>1]=r38;r38=HEAP32[r14];HEAP16[r38+(r44*764&-1)+92>>1]=HEAPU16[r38+(r44*764&-1)+88>>1]+(256/((r40<<16>>16==0?1:r40<<16>>16)|0)&-1)&65535;HEAP16[HEAP32[r14]+(r44*764&-1)+94>>1]=0;if(r34<<16>>16!=0){HEAP32[HEAP32[r14]+(r44*764&-1)+360>>2]=2;HEAP32[HEAP32[r14]+(r44*764&-1)+356>>2]=1;HEAP16[HEAP32[r14]+(r44*764&-1)+384>>1]=0;HEAP16[HEAP32[r14]+(r44*764&-1)+386>>1]=0;r38=r46<<16>>16;HEAP16[HEAP32[r14]+(r44*764&-1)+388>>1]=1024/((r46<<16>>16>-1?r38:-r38|0)|0)&-1&65535;HEAP16[HEAP32[r14]+(r44*764&-1)+390>>1]=(r46<<16>>31&-5120)+2560&65535}_load_sample(0,16,HEAP32[r11]+(HEAP32[HEAP32[HEAP32[r14]+(r44*764&-1)+756>>2]+40>>2]*52&-1)|0,r49)}else{_load_sample(r2,512,r42+(HEAP32[HEAP32[HEAP32[r14]+(r44*764&-1)+756>>2]+40>>2]*52&-1)|0,0)}}while(0);r42=r44+1|0;if((r42|0)<(HEAP32[r13]|0)){r44=r42}else{break L2050}}}}while(0);if(!r20){STACKTOP=r5;return 0}_fclose(r19);STACKTOP=r5;return 0}function _fnk_test(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r3=STACKTOP;STACKTOP=STACKTOP+136|0;r4=r3;r5=r3+64;r6=_fgetc(r1);r7=_fgetc(r1);L2089:do{if((r7<<16&16711680|r6<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255|0)==1182101099){_fgetc(r1);r8=_fgetc(r1)&255;r9=_fgetc(r1);_fgetc(r1);if((r8&255)<20|(r9&255)<<24>>24<0|(r9&14)>>>0>9){r10=-1;break}r9=_fgetc(r1)&255;r8=_fgetc(r1);r11=r8<<8&65280|r9|_fgetc(r1)<<16&16711680|_fgetc(r1)<<24;if((r11|0)<1024){r10=-1;break}_fstat(_fileno(r1),r5);if((r11|0)!=(HEAP32[r5+28>>2]|0)){r10=-1;break}r11=r4|0;if((r2|0)==0){r10=0;break}HEAP8[r2]=0;_fread(r11,1,0,r1);HEAP8[r11]=0;HEAP8[r2]=0;_strncpy(r2,r11,0);if(HEAP8[r2]<<24>>24==0){r10=0;break}while(1){r11=r2+(_strlen(r2)-1)|0;if(HEAP8[r11]<<24>>24!=32){r10=0;break L2089}HEAP8[r11]=0;if(HEAP8[r2]<<24>>24==0){r10=0;break L2089}}}else{r10=-1}}while(0);STACKTOP=r3;return r10}function _fnk_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+2712|0;r6=r5;r7=r5+2708;_fseek(r2,r3,0);_fread(r6|0,4,1,r2);_fread(r6+4|0,4,1,r2);r3=_fgetc(r2)&255;r8=_fgetc(r2);HEAP32[r6+8>>2]=r8<<8&65280|r3|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r3=r6+12|0;_fread(r3,4,1,r2);HEAP8[r6+16|0]=_fgetc(r2)&255;r8=r6+17|0;_fread(r8,256,1,r2);_fread(r6+273|0,128,1,r2);r9=0;while(1){_fread(r6+(r9*36&-1)+404|0,19,1,r2);r10=_fgetc(r2)&255;r11=_fgetc(r2);HEAP32[r6+(r9*36&-1)+424>>2]=r11<<8&65280|r10|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r10=_fgetc(r2)&255;r11=_fgetc(r2);HEAP32[r6+(r9*36&-1)+428>>2]=r11<<8&65280|r10|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;HEAP8[r6+(r9*36&-1)+432|0]=_fgetc(r2)&255;HEAP8[r6+(r9*36&-1)+433|0]=_fgetc(r2)&255;HEAP8[r6+(r9*36&-1)+434|0]=_fgetc(r2)&255;HEAP8[r6+(r9*36&-1)+435|0]=_fgetc(r2)&255;HEAP8[r6+(r9*36&-1)+436|0]=_fgetc(r2)&255;r10=r9+1|0;if((r10|0)==64){break}else{r9=r10}}r9=(r1+140|0)>>2;HEAP32[r9]=64;r10=r1+144|0;HEAP32[r10>>2]=64;r11=(r1+128|0)>>2;r12=0;while(1){r13=HEAP8[r6+(r12+17)|0];r14=r13&255;r15=HEAP32[r11];if(r13<<24>>24==-1){r16=r12;r17=r15;break}if((r14|0)>(r15|0)){HEAP32[r11]=r14;r18=r14}else{r18=r15}r15=r12+1|0;if((r15|0)<256){r12=r15}else{r16=r15;r17=r18;break}}HEAP32[r11]=r17+1|0;HEAP32[r1+156>>2]=r16;_memcpy(r1+952|0,r8,r16);HEAP32[r1+148>>2]=4;r16=(r1+152|0)>>2;HEAP32[r16]=125;r8=(r1+136|0)>>2;HEAP32[r8]=0;r17=HEAP16[r3>>1];do{if((r17&255)<<24>>24==70){r3=(r17&65535)>>>8&255;if(r3<<24>>24==50){r18=HEAP8[r6+7|0];r12=(r18&255)>>>1&63;HEAP32[r16]=(r18<<24>>24>-1?r12:-r12|0)+125|0;_set_type(r1,5267624,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));break}else if(r3<<24>>24==118|r3<<24>>24==107){_set_type(r1,5266244,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));break}else{r4=1473;break}}else{r4=1473}}while(0);if(r4==1473){HEAP32[r8]=8;_set_type(r1,5265312,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}r17=HEAP32[r8];if((r17|0)==0){r3=HEAP16[r6+14>>1];r12=r3&255;r18=(r3&65535)>>>8;do{if(((r3&255)-48&255)>9){r19=8}else{if(((r18&255)-48&255)>9){r19=8;break}r19=(r12*10&-1)-528+(r18&65535)|0}}while(0);HEAP32[r8]=r19;r20=r19}else{r20=r17}HEAP32[r16]=(HEAP32[r16]<<2|0)/5&-1;r16=r1+132|0;HEAP32[r16>>2]=Math.imul(HEAP32[r11],r20);r20=(r1+1276|0)>>2;HEAP32[r20]=HEAP32[r20]|4096;r17=(r1+176|0)>>2;HEAP32[r17]=_calloc(764,HEAP32[r9]);r19=HEAP32[r10>>2];if((r19|0)!=0){HEAP32[r1+180>>2]=_calloc(52,r19)}L2128:do{if((HEAP32[r9]|0)>0){r19=(r1+180|0)>>2;r10=0;while(1){r18=_calloc(64,1);HEAP32[HEAP32[r17]+(r10*764&-1)+756>>2]=r18;r18=r6+(r10*36&-1)+428|0;r12=HEAP32[r18>>2];HEAP32[HEAP32[r19]+(r10*52&-1)+32>>2]=r12;HEAP32[HEAP32[r17]+(r10*764&-1)+36>>2]=(r12|0)!=0&1;r12=r6+(r10*36&-1)+424|0;HEAP32[HEAP32[r19]+(r10*52&-1)+36>>2]=HEAP32[r12>>2];r3=HEAP32[r19];r15=r3+(r10*52&-1)+36|0;if((HEAP32[r15>>2]|0)==-1){HEAP32[r15>>2]=0;r21=HEAP32[r19]}else{r21=r3}HEAP32[r21+(r10*52&-1)+40>>2]=HEAP32[r18>>2];HEAP32[HEAP32[r19]+(r10*52&-1)+44>>2]=(HEAP32[r12>>2]|0)!=-1?2:0;HEAP32[HEAP32[HEAP32[r17]+(r10*764&-1)+756>>2]>>2]=HEAPU8[r6+(r10*36&-1)+432|0];HEAP32[HEAP32[HEAP32[r17]+(r10*764&-1)+756>>2]+8>>2]=HEAPU8[r6+(r10*36&-1)+433|0];HEAP32[HEAP32[HEAP32[r17]+(r10*764&-1)+756>>2]+40>>2]=r10;r12=HEAP32[r17];r18=r12+(r10*764&-1)|0;_memset(r18,0,20);_strncpy(r18,r6+(r10*36&-1)+404|0,19);r3=HEAP8[r18];L2135:do{if(r3<<24>>24!=0){r15=0;r14=r18;r13=r3;while(1){do{if((_isprint(r13<<24>>24)|0)==0){r4=1489}else{if(HEAP8[r14]<<24>>24<0){r4=1489;break}else{break}}}while(0);if(r4==1489){r4=0;HEAP8[r14]=46}r22=r15+1|0;r23=r12+(r10*764&-1)+r22|0;r24=HEAP8[r23];if(r24<<24>>24!=0&(r22|0)<19){r15=r22;r14=r23;r13=r24}else{break}}if(HEAP8[r18]<<24>>24==0){break}while(1){r13=_strlen(r18)-1+r12+(r10*764&-1)|0;if(HEAP8[r13]<<24>>24!=32){break L2135}HEAP8[r13]=0;if(HEAP8[r18]<<24>>24==0){break L2135}}}}while(0);r18=r10+1|0;if((r18|0)<(HEAP32[r9]|0)){r10=r18}else{break L2128}}}}while(0);r4=(r1+172|0)>>2;HEAP32[r4]=_calloc(4,HEAP32[r16>>2]);r16=(r1+168|0)>>2;HEAP32[r16]=_calloc(4,HEAP32[r11]+1|0);L2149:do{if((HEAP32[r11]|0)>0){r17=r7|0;r21=r7+1|0;r10=r7+2|0;r19=0;r18=HEAP32[r8];while(1){r12=_calloc(1,(r18<<2)+4|0);HEAP32[HEAP32[r16]+(r19<<2)>>2]=r12;HEAP32[HEAP32[HEAP32[r16]+(r19<<2)>>2]>>2]=64;r12=HEAP32[r8];L2153:do{if((r12|0)>0){r3=0;r13=r12;while(1){r14=Math.imul(r13,r19)+r3|0;HEAP32[HEAP32[HEAP32[r16]+(r19<<2)>>2]+(r3<<2)+4>>2]=r14;r14=_calloc(HEAP32[HEAP32[HEAP32[r16]+(r19<<2)>>2]>>2]<<3|4,1);r15=Math.imul(HEAP32[r8],r19)+r3|0;HEAP32[HEAP32[r4]+(r15<<2)>>2]=r14;r14=HEAP32[HEAP32[HEAP32[r16]+(r19<<2)>>2]>>2];r15=Math.imul(HEAP32[r8],r19)+r3|0;HEAP32[HEAP32[HEAP32[r4]+(r15<<2)>>2]>>2]=r14;r14=r3+1|0;r15=HEAP32[r8];if((r14|0)<(r15|0)){r3=r14;r13=r15}else{break L2153}}}}while(0);HEAP8[(HEAPU8[r6+(r19+273)|0]<<3)+HEAP32[HEAP32[r4]+(HEAP32[HEAP32[HEAP32[r16]+(r19<<2)>>2]+8>>2]<<2)>>2]+9|0]=13;r12=HEAP32[r8];L2157:do{if((r12<<6|0)>0){r13=0;r3=r12;while(1){r15=(r13|0)/(r3|0)&-1;r14=HEAP32[HEAP32[r4]+(HEAP32[HEAP32[HEAP32[r16]+(r19<<2)>>2]+((r13|0)%(r3|0)<<2)+4>>2]<<2)>>2];_fread(r17,1,3,r2);r24=HEAP8[r17];r23=(r24&255)>>>2;if((r23-61|0)>>>0<3){r25=HEAP8[r21]}else{HEAP8[(r15<<3)+r14+4|0]=r23+37&255;r23=HEAP8[r21];r22=(((r23&255)>>>4)+1&255)+(r24<<4&48)&255;HEAP8[(r15<<3)+r14+5|0]=r22;HEAP8[(r15<<3)+r14+6|0]=HEAP8[r6+(((r22&255)-1)*36&-1)+432|0];r25=r23}r23=r25&15;do{if((r23|0)==14){r22=HEAP8[r10];if((r22-10&255)<3){HEAP8[(r15<<3)+r14+7|0]=127;break}r24=(r22&255)>>>4;if((r24|0)==2){HEAP8[(r15<<3)+r14+7|0]=14;HEAP8[(r15<<3)+r14+8|0]=r22&15|-48;break}else if((r24|0)==13){HEAP8[(r15<<3)+r14+7|0]=14;HEAP8[(r15<<3)+r14+8|0]=r22&15|-112;break}else if((r24|0)==14){HEAP8[(r15<<3)+r14+7|0]=8;HEAP8[(r15<<3)+r14+8|0]=r22<<4|8;break}else if((r24|0)==1){HEAP8[(r15<<3)+r14+7|0]=14;HEAP8[(r15<<3)+r14+8|0]=r22&15|-64;break}else if((r24|0)==15){HEAP8[(r15<<3)+r14+7|0]=15;HEAP8[(r15<<3)+r14+8|0]=r22&15;break}else{break}}else if((r23|0)==6){HEAP8[(r15<<3)+r14+7|0]=124;HEAP8[(r15<<3)+r14+8|0]=HEAP8[r10]<<1}else if((r23|0)==7){HEAP8[(r15<<3)+r14+7|0]=125;HEAP8[(r15<<3)+r14+8|0]=HEAP8[r10]<<1}else if((r23|0)==13){HEAP8[(r15<<3)+r14+7|0]=12;HEAP8[(r15<<3)+r14+8|0]=HEAP8[r10]}else if((r23|0)==1){HEAP8[(r15<<3)+r14+7|0]=120;HEAP8[(r15<<3)+r14+8|0]=HEAP8[r10]}else if((r23|0)==2){HEAP8[(r15<<3)+r14+7|0]=122;HEAP8[(r15<<3)+r14+8|0]=HEAP8[r10]}else if((r23|0)==3){HEAP8[(r15<<3)+r14+7|0]=123;HEAP8[(r15<<3)+r14+8|0]=HEAP8[r10]}else if((r23|0)==0){HEAP8[(r15<<3)+r14+7|0]=121;HEAP8[(r15<<3)+r14+8|0]=HEAP8[r10]}else if((r23|0)==11){HEAP8[(r15<<3)+r14+7|0]=0;HEAP8[(r15<<3)+r14+8|0]=HEAP8[r10]}}while(0);r14=r13+1|0;r15=HEAP32[r8];if((r14|0)<(r15<<6|0)){r13=r14;r3=r15}else{r26=r15;break L2157}}}else{r26=r12}}while(0);r12=r19+1|0;if((r12|0)<(HEAP32[r11]|0)){r19=r12;r18=r26}else{break L2149}}}}while(0);r26=HEAP32[r9];L2186:do{if((r26|0)>0){r11=r1+180|0;r25=0;r6=r26;while(1){r16=HEAP32[r11>>2];if((HEAP32[r16+(r25*52&-1)+32>>2]|0)<3){r27=r6}else{_load_sample(r2,0,r16+(r25*52&-1)|0,0);r27=HEAP32[r9]}r16=r25+1|0;if((r16|0)<(r27|0)){r25=r16;r6=r27}else{break L2186}}}}while(0);if((HEAP32[r8]|0)>0){r28=0}else{r29=r1+1264|0;HEAP32[r29>>2]=255;HEAP32[r20]=64;STACKTOP=r5;return 0}while(1){HEAP32[r1+(r28*12&-1)+184>>2]=128;r27=r28+1|0;if((r27|0)<(HEAP32[r8]|0)){r28=r27}else{break}}r29=r1+1264|0;HEAP32[r29>>2]=255;HEAP32[r20]=64;STACKTOP=r5;return 0}function _gal4_test(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+64|0;r5=r4;r6=_fgetc(r1);r7=_fgetc(r1);if((r7<<16&16711680|r6<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255|0)!=1380533830){r8=-1;STACKTOP=r4;return r8}_fgetc(r1);_fgetc(r1);_fgetc(r1);_fgetc(r1);r6=_fgetc(r1);r7=_fgetc(r1);if((r7<<16&16711680|r6<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255|0)!=1095583302){r8=-1;STACKTOP=r4;return r8}r6=_fgetc(r1);r7=_fgetc(r1);if((r7<<16&16711680|r6<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255|0)!=1296124238){r8=-1;STACKTOP=r4;return r8}_fgetc(r1);_fgetc(r1);_fgetc(r1);_fgetc(r1);r6=r5|0;if((r2|0)==0){r8=0;STACKTOP=r4;return r8}_memset(r2,0,64);_fread(r6,1,63,r1);HEAP8[r5+63|0]=0;_memset(r2,0,64);_strncpy(r2,r6,63);r6=HEAP8[r2];if(r6<<24>>24==0){r8=0;STACKTOP=r4;return r8}else{r9=0;r10=r2;r11=r6}while(1){do{if((_isprint(r11<<24>>24)|0)==0){r3=1539}else{if(HEAP8[r10]<<24>>24<0){r3=1539;break}else{break}}}while(0);if(r3==1539){r3=0;HEAP8[r10]=46}r6=r9+1|0;r5=r2+r6|0;r1=HEAP8[r5];if(r1<<24>>24!=0&(r6|0)<63){r9=r6;r10=r5;r11=r1}else{break}}if(HEAP8[r2]<<24>>24==0){r8=0;STACKTOP=r4;return r8}while(1){r11=r2+(_strlen(r2)-1)|0;if(HEAP8[r11]<<24>>24!=32){r8=0;r3=1548;break}HEAP8[r11]=0;if(HEAP8[r2]<<24>>24==0){r8=0;r3=1547;break}}if(r3==1547){STACKTOP=r4;return r8}else if(r3==1548){STACKTOP=r4;return r8}}function _gal4_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;r4=r1>>2;r5=STACKTOP;STACKTOP=STACKTOP+4|0;r6=r5;_fseek(r2,r3,0);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r7=_ftell(r2);r8=r1+140|0;HEAP32[r8>>2]=0;r9=r1+144|0;HEAP32[r9>>2]=0;r10=_malloc(16);if((r10|0)==0){r11=-1;STACKTOP=r5;return r11}r12=r10;r13=r10;HEAP32[r13>>2]=r12;r14=(r10+4|0)>>2;HEAP32[r14]=r12;HEAP32[r10+8>>2]=4;r15=(r10+12|0)>>2;HEAP32[r15]=0;r16=_malloc(20);HEAP8[r16]=HEAP8[5267616];HEAP8[r16+1|0]=HEAP8[5267617|0];HEAP8[r16+2|0]=HEAP8[5267618|0];HEAP8[r16+3|0]=HEAP8[5267619|0];HEAP8[r16+4|0]=HEAP8[5267620|0];HEAP32[r16+8>>2]=498;r17=r16+12|0;r18=r17;r19=HEAP32[r14];HEAP32[r14]=r18;HEAP32[r17>>2]=r12;HEAP32[r16+16>>2]=r19;HEAP32[r19>>2]=r18;r18=_malloc(20);HEAP8[r18]=HEAP8[5266236];HEAP8[r18+1|0]=HEAP8[5266237|0];HEAP8[r18+2|0]=HEAP8[5266238|0];HEAP8[r18+3|0]=HEAP8[5266239|0];HEAP8[r18+4|0]=HEAP8[5266240|0];HEAP32[r18+8>>2]=102;r19=r18+12|0;r16=r19;r17=HEAP32[r14];HEAP32[r14]=r16;HEAP32[r19>>2]=r12;HEAP32[r18+16>>2]=r17;HEAP32[r17>>2]=r16;r16=_malloc(20);HEAP8[r16]=HEAP8[5263320];HEAP8[r16+1|0]=HEAP8[5263321|0];HEAP8[r16+2|0]=HEAP8[5263322|0];HEAP8[r16+3|0]=HEAP8[5263323|0];HEAP8[r16+4|0]=HEAP8[5263324|0];HEAP32[r16+8>>2]=130;r17=r16+12|0;r18=r17;r19=HEAP32[r14];HEAP32[r14]=r18;HEAP32[r17>>2]=r12;HEAP32[r16+16>>2]=r19;HEAP32[r19>>2]=r18;r18=_malloc(20);HEAP8[r18]=HEAP8[5264676];HEAP8[r18+1|0]=HEAP8[5264677|0];HEAP8[r18+2|0]=HEAP8[5264678|0];HEAP8[r18+3|0]=HEAP8[5264679|0];HEAP8[r18+4|0]=HEAP8[5264680|0];HEAP32[r18+8>>2]=266;r19=r18+12|0;r16=r19;r17=HEAP32[r14];HEAP32[r14]=r16;HEAP32[r19>>2]=r12;HEAP32[r18+16>>2]=r17;HEAP32[r17>>2]=r16;HEAP32[r15]=HEAP32[r15]|33;L2234:do{if((_feof(r2)|0)==0){r15=r6;while(1){_iff_chunk(r10,r1,r2,r15);if((_feof(r2)|0)!=0){break L2234}}}}while(0);r15=HEAP32[r13>>2];L2239:do{if((r15|0)!=(r12|0)){r13=r15;while(1){r16=r13-16+4|0;r17=HEAP32[r16+12>>2];r18=HEAP32[r16+16>>2];HEAP32[r17+4>>2]=r18;HEAP32[r18>>2]=r17;r17=HEAP32[r13>>2];_free(r16);if((r17|0)==(r12|0)){break L2239}else{r13=r17}}}}while(0);_free(r10);r10=r1+128|0;r12=(r1+136|0)>>2;r15=r1+132|0;HEAP32[r15>>2]=Math.imul(HEAP32[r12],HEAP32[r10>>2]);HEAP32[r4+44]=_calloc(764,HEAP32[r8>>2]);r8=HEAP32[r9>>2];if((r8|0)!=0){HEAP32[r4+45]=_calloc(52,r8)}HEAP32[r4+43]=_calloc(4,HEAP32[r15>>2]);HEAP32[r4+42]=_calloc(4,HEAP32[r10>>2]+1|0);_fseek(r2,r7+r3|0,0);HEAP32[r6>>2]=0;r3=_malloc(16);if((r3|0)==0){r11=-1;STACKTOP=r5;return r11}r7=r3;r10=r3;HEAP32[r10>>2]=r7;r15=(r3+4|0)>>2;HEAP32[r15]=r7;HEAP32[r3+8>>2]=4;r8=(r3+12|0)>>2;HEAP32[r8]=0;r9=_malloc(20);HEAP8[r9]=HEAP8[5263320];HEAP8[r9+1|0]=HEAP8[5263321|0];HEAP8[r9+2|0]=HEAP8[5263322|0];HEAP8[r9+3|0]=HEAP8[5263323|0];HEAP8[r9+4|0]=HEAP8[5263324|0];HEAP32[r9+8>>2]=466;r13=r9+12|0;r17=r13;r16=HEAP32[r15];HEAP32[r15]=r17;HEAP32[r13>>2]=r7;HEAP32[r9+16>>2]=r16;HEAP32[r16>>2]=r17;r17=_malloc(20);HEAP8[r17]=HEAP8[5264676];HEAP8[r17+1|0]=HEAP8[5264677|0];HEAP8[r17+2|0]=HEAP8[5264678|0];HEAP8[r17+3|0]=HEAP8[5264679|0];HEAP8[r17+4|0]=HEAP8[5264680|0];HEAP32[r17+8>>2]=638;r16=r17+12|0;r9=r16;r13=HEAP32[r15];HEAP32[r15]=r9;HEAP32[r16>>2]=r7;HEAP32[r17+16>>2]=r13;HEAP32[r13>>2]=r9;HEAP32[r8]=HEAP32[r8]|33;L2249:do{if((_feof(r2)|0)==0){r8=r6;while(1){_iff_chunk(r3,r1,r2,r8);if((_feof(r2)|0)!=0){break L2249}}}}while(0);r2=HEAP32[r10>>2];L2254:do{if((r2|0)!=(r7|0)){r10=r2;while(1){r6=r10-16+4|0;r8=HEAP32[r6+12>>2];r9=HEAP32[r6+16>>2];HEAP32[r8+4>>2]=r9;HEAP32[r9>>2]=r8;r8=HEAP32[r10>>2];_free(r6);if((r8|0)==(r7|0)){break L2254}else{r10=r8}}}}while(0);_free(r3);L2258:do{if((HEAP32[r12]|0)>0){r3=0;while(1){HEAP32[((r3*12&-1)+184>>2)+r4]=128;r7=r3+1|0;if((r7|0)<(HEAP32[r12]|0)){r3=r7}else{break L2258}}}}while(0);r12=r1+1276|0;HEAP32[r12>>2]=HEAP32[r12>>2]|32;HEAP32[r4+320]=1;r11=0;STACKTOP=r5;return r11}function _get_main(r1,r2,r3,r4){r4=STACKTOP;STACKTOP=STACKTOP+64|0;r2=r4|0;_fread(r2,1,64,r3);_strncpy(r1|0,r2,64);_set_type(r1,5266400,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));if((_fgetc(r3)&1|0)==0){HEAP32[r1+1276>>2]=4096}HEAP32[r1+136>>2]=_fgetc(r3)&255;HEAP32[r1+148>>2]=_fgetc(r3)&255;HEAP32[r1+152>>2]=_fgetc(r3)&255;_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);STACKTOP=r4;return}function _get_ordr(r1,r2,r3,r4){var r5;r4=_fgetc(r3)&255;r2=r1+156|0;HEAP32[r2>>2]=r4;if((r4|0)==0){return}else{r5=0}while(1){HEAP8[r1+(r5+952)|0]=_fgetc(r3)&255;r4=r5+1|0;if((r4|0)<(HEAP32[r2>>2]|0)){r5=r4}else{break}}return}function _get_patt_cnt(r1,r2,r3,r4){r4=(_fgetc(r3)&255)+1|0;r3=r1+128|0;if((r4|0)<=(HEAP32[r3>>2]|0)){return}HEAP32[r3>>2]=r4;return}function _get_inst_cnt(r1,r2,r3,r4){_fgetc(r3);r4=(_fgetc(r3)&255)+1|0;r2=r1+140|0;if((r4|0)>(HEAP32[r2>>2]|0)){HEAP32[r2>>2]=r4}_fseek(r3,28,1);r4=r1+144|0;HEAP32[r4>>2]=(_fgetc(r3)&255)+HEAP32[r4>>2]|0;return}function _get_patt210(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r4=STACKTOP;STACKTOP=STACKTOP+8|0;r2=r4;r5=_fgetc(r3)&255;_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);r6=(_fgetc(r3)&255)+1|0;r7=(r1+136|0)>>2;r8=_calloc(1,(HEAP32[r7]<<2)+4|0);r9=(r1+168|0)>>2;HEAP32[HEAP32[r9]+(r5<<2)>>2]=r8;HEAP32[HEAP32[HEAP32[r9]+(r5<<2)>>2]>>2]=r6;r8=HEAP32[r7];r10=(r1+172|0)>>2;L2283:do{if((r8|0)>0){r1=0;r11=r8;while(1){r12=Math.imul(r11,r5)+r1|0;HEAP32[HEAP32[HEAP32[r9]+(r5<<2)>>2]+(r1<<2)+4>>2]=r12;r12=_calloc(HEAP32[HEAP32[HEAP32[r9]+(r5<<2)>>2]>>2]<<3|4,1);r13=Math.imul(HEAP32[r7],r5)+r1|0;HEAP32[HEAP32[r10]+(r13<<2)>>2]=r12;r12=HEAP32[HEAP32[HEAP32[r9]+(r5<<2)>>2]>>2];r13=Math.imul(HEAP32[r7],r5)+r1|0;HEAP32[HEAP32[HEAP32[r10]+(r13<<2)>>2]>>2]=r12;r12=r1+1|0;r13=HEAP32[r7];if((r12|0)<(r13|0)){r1=r12;r11=r13}else{break L2283}}}}while(0);r8=0;while(1){while(1){r11=_fgetc(r3);if((r11&255)<<24>>24==0){break}r1=r11&31;if((r1|0)<(HEAP32[r7]|0)){r14=(r8<<3)+HEAP32[HEAP32[r10]+(HEAP32[HEAP32[HEAP32[r9]+(r5<<2)>>2]+(r1<<2)+4>>2]<<2)>>2]+4|0}else{r14=r2}if((r11&128|0)!=0){r1=_fgetc(r3);r13=r1&255;r12=_fgetc(r3);r15=r12&255;r16=r12&255;do{if(r15<<24>>24==20){r17=-93;r18=r13}else{if((r15&255)<=15){r17=r15;r18=r13;break}_printf(5264064,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r16,HEAP32[tempInt+4>>2]=r1&255,tempInt));r17=0;r18=0}}while(0);HEAP8[r14+3|0]=r17;HEAP8[r14+4|0]=r18}do{if((r11&64|0)!=0){HEAP8[r14+1|0]=_fgetc(r3)&255;r1=_fgetc(r3)&255;r16=r14|0;HEAP8[r16]=r1;if(r1<<24>>24!=-128){break}HEAP8[r16]=-127}}while(0);if((r11&32|0)==0){continue}HEAP8[r14+2|0]=((_fgetc(r3)&255)>>>1)+1&255}r16=r8+1|0;if((r16|0)<(r6|0)){r8=r16}else{break}}STACKTOP=r4;return}function _get_inst211(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22;r2=0;r5=STACKTOP;STACKTOP=STACKTOP+32|0;r6=r5;_fgetc(r3);r7=_fgetc(r3)&255;r8=(r1+176|0)>>2;_fread(HEAP32[r8]+(r7*764&-1)|0,1,28,r3);r9=HEAP32[r8];r10=r9+(r7*764&-1)|0;r11=HEAP8[r10];L2310:do{if(r11<<24>>24!=0){r12=0;r13=r11;while(1){r14=r9+(r7*764&-1)+r12|0;do{if((_isprint(r13<<24>>24)|0)==0){r2=1612}else{if(HEAP8[r14]<<24>>24<0){r2=1612;break}else{break}}}while(0);if(r2==1612){r2=0;HEAP8[r14]=32}r15=r12+1|0;if(r15>>>0>=_strlen(r10)>>>0){break}r12=r15;r13=HEAP8[r9+(r7*764&-1)+r15|0]}if(HEAP8[r10]<<24>>24==0){break}while(1){r13=_strlen(r10)-1+r9+(r7*764&-1)|0;if(HEAP8[r13]<<24>>24!=32){break L2310}HEAP8[r13]=0;if(HEAP8[r10]<<24>>24==0){break L2310}}}}while(0);r10=_fgetc(r3)&255;HEAP32[HEAP32[r8]+(r7*764&-1)+36>>2]=r10;r10=0;while(1){r9=_fgetc(r3)&255;HEAP8[(r10<<1)+HEAP32[r8]+(r7*764&-1)+512|0]=r9;r9=r10+1|0;if((r9|0)==108){break}else{r10=r9}}_fseek(r3,11,1);r10=_fgetc(r3)&255;r9=_fgetc(r3)&255;_fgetc(r3);_fgetc(r3);r11=_fgetc(r3)>>>2&63;r13=(_fgetc(r3)&240|_fgetc(r3)<<8&65280)>>>4;_fgetc(r3);r12=_fgetc(r3);if((r12&1|0)!=0){r15=HEAP32[r8]+(r7*764&-1)+44|0;HEAP32[r15>>2]=HEAP32[r15>>2]|1}if((r12&2|0)!=0){r15=HEAP32[r8]+(r7*764&-1)+44|0;HEAP32[r15>>2]=HEAP32[r15>>2]|2}if((r12&4|0)!=0){r15=HEAP32[r8]+(r7*764&-1)+44|0;HEAP32[r15>>2]=HEAP32[r15>>2]|4}r15=r12>>>4;if((r15&1|0)!=0){r12=HEAP32[r8]+(r7*764&-1)+200|0;HEAP32[r12>>2]=HEAP32[r12>>2]|1}if((r15&2|0)!=0){r12=HEAP32[r8]+(r7*764&-1)+200|0;HEAP32[r12>>2]=HEAP32[r12>>2]|2}if((r15&4|0)!=0){r15=HEAP32[r8]+(r7*764&-1)+200|0;HEAP32[r15>>2]=HEAP32[r15>>2]|4}r15=_fgetc(r3);HEAP32[HEAP32[r8]+(r7*764&-1)+48>>2]=(r15&15)+1|0;HEAP32[HEAP32[r8]+(r7*764&-1)+204>>2]=(r15>>>4&15)+1|0;r15=_fgetc(r3);HEAP32[HEAP32[r8]+(r7*764&-1)+56>>2]=r15&15;HEAP32[HEAP32[r8]+(r7*764&-1)+212>>2]=r15>>>4&15;r15=_fgetc(r3);r12=r15&15;HEAP32[HEAP32[r8]+(r7*764&-1)+64>>2]=r12;r16=r15>>>4&15;HEAP32[HEAP32[r8]+(r7*764&-1)+220>>2]=r16;_fgetc(r3);HEAP32[HEAP32[r8]+(r7*764&-1)+68>>2]=r12;HEAP32[HEAP32[r8]+(r7*764&-1)+224>>2]=r16;r16=HEAP32[r8];if((HEAP32[r16+(r7*764&-1)+48>>2]-1|0)>>>0>30){r12=r16+(r7*764&-1)+44|0;HEAP32[r12>>2]=HEAP32[r12>>2]&-2;r17=HEAP32[r8]}else{r17=r16}if((HEAP32[r17+(r7*764&-1)+204>>2]-1|0)>>>0>30){r16=r17+(r7*764&-1)+200|0;HEAP32[r16>>2]=HEAP32[r16>>2]&-2}r16=r6|0;_fread(r16,1,30,r3);r17=HEAP32[r8];L2351:do{if((HEAP32[r17+(r7*764&-1)+48>>2]|0)>0){r12=0;r15=r17;while(1){r18=r12*3&-1;r19=r12<<1;HEAP16[r15+(r7*764&-1)+(r19<<1)+72>>1]=((HEAPU8[r18+(r6+1)|0]<<8|HEAPU8[r6+r18|0])&65535)>>>4;HEAP16[HEAP32[r8]+(r7*764&-1)+((r19|1)<<1)+72>>1]=HEAPU8[r18+(r6+2)|0];r18=r12+1|0;r19=HEAP32[r8];if((r18|0)<(HEAP32[r19+(r7*764&-1)+48>>2]|0)){r12=r18;r15=r19}else{break L2351}}}}while(0);_fread(r16,1,30,r3);r16=HEAP32[r8];L2355:do{if((HEAP32[r16+(r7*764&-1)+204>>2]|0)>0){r17=0;r15=r16;while(1){r12=r17*3&-1;r19=r17<<1;HEAP16[r15+(r7*764&-1)+(r19<<1)+228>>1]=((HEAPU8[r12+(r6+1)|0]<<8|HEAPU8[r6+r12|0])&65535)>>>4;HEAP16[HEAP32[r8]+(r7*764&-1)+((r19|1)<<1)+228>>1]=HEAPU8[r12+(r6+2)|0];r12=r17+1|0;r19=HEAP32[r8];if((r12|0)<(HEAP32[r19+(r7*764&-1)+204>>2]|0)){r17=r12;r15=r19}else{break L2355}}}}while(0);_fgetc(r3);_fgetc(r3);r6=HEAP32[HEAP32[r8]+(r7*764&-1)+36>>2];if((r6|0)==0){STACKTOP=r5;return}r16=_calloc(64,r6);HEAP32[HEAP32[r8]+(r7*764&-1)+756>>2]=r16;if((HEAP32[HEAP32[r8]+(r7*764&-1)+36>>2]|0)<=0){STACKTOP=r5;return}r16=r4>>2;r4=(r1+180|0)>>2;r1=0;while(1){_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fread(HEAP32[r4]+(HEAP32[r16]*52&-1)|0,1,28,r3);r6=HEAP32[r16];r15=HEAP32[r4];r17=r15+(r6*52&-1)|0;r19=HEAP8[r17];L2367:do{if(r19<<24>>24!=0){r12=0;r18=r19;while(1){r20=r15+(r6*52&-1)+r12|0;do{if((_isprint(r18<<24>>24)|0)==0){r2=1646}else{if(HEAP8[r20]<<24>>24<0){r2=1646;break}else{break}}}while(0);if(r2==1646){r2=0;HEAP8[r20]=32}r21=r12+1|0;if(r21>>>0>=_strlen(r17)>>>0){break}r12=r21;r18=HEAP8[r15+(r6*52&-1)+r21|0]}if(HEAP8[r17]<<24>>24==0){break}while(1){r18=_strlen(r17)-1+r15+(r6*52&-1)|0;if(HEAP8[r18]<<24>>24!=32){break L2367}HEAP8[r18]=0;if(HEAP8[r17]<<24>>24==0){break L2367}}}}while(0);r17=_fgetc(r3)<<2&1020;HEAP32[HEAP32[HEAP32[r8]+(r7*764&-1)+756>>2]+(r1<<6)+8>>2]=r17;r17=(r1<<6)+HEAP32[HEAP32[r8]+(r7*764&-1)+756>>2]+8|0;if((HEAP32[r17>>2]|0)==0){HEAP32[r17>>2]=128}r17=_fgetc(r3)&255;HEAP32[HEAP32[HEAP32[r8]+(r7*764&-1)+756>>2]+(r1<<6)>>2]=r17;r17=_fgetc(r3);_fgetc(r3);HEAP32[HEAP32[HEAP32[r8]+(r7*764&-1)+756>>2]+(r1<<6)+20>>2]=r10;HEAP32[HEAP32[HEAP32[r8]+(r7*764&-1)+756>>2]+(r1<<6)+24>>2]=r11;HEAP32[HEAP32[HEAP32[r8]+(r7*764&-1)+756>>2]+(r1<<6)+28>>2]=r13;HEAP32[HEAP32[HEAP32[r8]+(r7*764&-1)+756>>2]+(r1<<6)+32>>2]=r9;HEAP32[HEAP32[HEAP32[r8]+(r7*764&-1)+756>>2]+(r1<<6)+40>>2]=HEAP32[r16];r6=_fgetc(r3)&255;r15=_fgetc(r3);r19=r15<<8&65280|r6|_fgetc(r3)<<16&16711680|_fgetc(r3)<<24;HEAP32[HEAP32[r4]+(HEAP32[r16]*52&-1)+32>>2]=r19;r19=_fgetc(r3)&255;r6=_fgetc(r3);r15=r6<<8&65280|r19|_fgetc(r3)<<16&16711680|_fgetc(r3)<<24;HEAP32[HEAP32[r4]+(HEAP32[r16]*52&-1)+36>>2]=r15;r15=_fgetc(r3)&255;r19=_fgetc(r3);r6=r19<<8&65280|r15|_fgetc(r3)<<16&16711680|_fgetc(r3)<<24;HEAP32[HEAP32[r4]+(HEAP32[r16]*52&-1)+40>>2]=r6;HEAP32[HEAP32[r4]+(HEAP32[r16]*52&-1)+44>>2]=0;if((r17&4|0)!=0){r6=HEAP32[r4]+(HEAP32[r16]*52&-1)+44|0;HEAP32[r6>>2]=HEAP32[r6>>2]|1}if((r17&8|0)!=0){r6=HEAP32[r4]+(HEAP32[r16]*52&-1)+44|0;HEAP32[r6>>2]=HEAP32[r6>>2]|2}if((r17&16|0)!=0){r17=HEAP32[r4]+(HEAP32[r16]*52&-1)+44|0;HEAP32[r17>>2]=HEAP32[r17>>2]|4}r17=_fgetc(r3)&255;r6=_fgetc(r3);r15=r6<<8&65280|r17|_fgetc(r3)<<16&16711680|_fgetc(r3)<<24;r17=HEAP32[HEAP32[r8]+(r7*764&-1)+756>>2];r6=(r1<<6)+r17+12|0;r19=(r1<<6)+r17+16|0;if((r15|0)==0){HEAP32[r19>>2]=0;HEAP32[r6>>2]=0}else{r17=Math.log((r15|0)/8363)*1536/.6931471805599453&-1;HEAP32[r6>>2]=(r17|0)/128&-1;HEAP32[r19>>2]=(r17|0)%128}_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);r17=HEAP32[r16];r19=HEAP32[r4];if((HEAP32[r19+(r17*52&-1)+32>>2]|0)>1){_load_sample(r3,0,r19+(r17*52&-1)|0,0);r22=HEAP32[r16]}else{r22=r17}r17=r1+1|0;HEAP32[r16]=r22+1|0;if((r17|0)<(HEAP32[HEAP32[r8]+(r7*764&-1)+36>>2]|0)){r1=r17}else{break}}STACKTOP=r5;return}function _gal5_test(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+64|0;r5=r4;r6=_fgetc(r1);r7=_fgetc(r1);if((r7<<16&16711680|r6<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255|0)!=1380533830){r8=-1;STACKTOP=r4;return r8}_fgetc(r1);_fgetc(r1);_fgetc(r1);_fgetc(r1);r6=_fgetc(r1);r7=_fgetc(r1);if((r7<<16&16711680|r6<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255|0)!=1095573536){r8=-1;STACKTOP=r4;return r8}r6=_fgetc(r1);r7=_fgetc(r1);if((r7<<16&16711680|r6<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255|0)!=1229867348){r8=-1;STACKTOP=r4;return r8}_fgetc(r1);_fgetc(r1);_fgetc(r1);_fgetc(r1);r6=r5|0;if((r2|0)==0){r8=0;STACKTOP=r4;return r8}_memset(r2,0,64);_fread(r6,1,63,r1);HEAP8[r5+63|0]=0;_memset(r2,0,64);_strncpy(r2,r6,63);r6=HEAP8[r2];if(r6<<24>>24==0){r8=0;STACKTOP=r4;return r8}else{r9=0;r10=r2;r11=r6}while(1){do{if((_isprint(r11<<24>>24)|0)==0){r3=1677}else{if(HEAP8[r10]<<24>>24<0){r3=1677;break}else{break}}}while(0);if(r3==1677){r3=0;HEAP8[r10]=46}r6=r9+1|0;r5=r2+r6|0;r1=HEAP8[r5];if(r1<<24>>24!=0&(r6|0)<63){r9=r6;r10=r5;r11=r1}else{break}}if(HEAP8[r2]<<24>>24==0){r8=0;STACKTOP=r4;return r8}while(1){r11=r2+(_strlen(r2)-1)|0;if(HEAP8[r11]<<24>>24!=32){r8=0;r3=1684;break}HEAP8[r11]=0;if(HEAP8[r2]<<24>>24==0){r8=0;r3=1682;break}}if(r3==1684){STACKTOP=r4;return r8}else if(r3==1682){STACKTOP=r4;return r8}}function _gal5_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;r4=r1>>2;r5=STACKTOP;STACKTOP=STACKTOP+64|0;r6=r5;_fseek(r2,r3,0);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r7=_ftell(r2);r8=r1+140|0;HEAP32[r8>>2]=0;r9=(r1+144|0)>>2;HEAP32[r9]=0;r10=_malloc(16);if((r10|0)==0){r11=-1;STACKTOP=r5;return r11}r12=r10;r13=r10;HEAP32[r13>>2]=r12;r14=(r10+4|0)>>2;HEAP32[r14]=r12;HEAP32[r10+8>>2]=4;r15=(r10+12|0)>>2;HEAP32[r15]=0;r16=_malloc(20);HEAP8[r16]=HEAP8[5267608];HEAP8[r16+1|0]=HEAP8[5267609|0];HEAP8[r16+2|0]=HEAP8[5267610|0];HEAP8[r16+3|0]=HEAP8[5267611|0];HEAP8[r16+4|0]=HEAP8[5267612|0];HEAP32[r16+8>>2]=514;r17=r16+12|0;r18=r17;r19=HEAP32[r14];HEAP32[r14]=r18;HEAP32[r17>>2]=r12;HEAP32[r16+16>>2]=r19;HEAP32[r19>>2]=r18;r18=_malloc(20);HEAP8[r18]=HEAP8[5266236];HEAP8[r18+1|0]=HEAP8[5266237|0];HEAP8[r18+2|0]=HEAP8[5266238|0];HEAP8[r18+3|0]=HEAP8[5266239|0];HEAP8[r18+4|0]=HEAP8[5266240|0];HEAP32[r18+8>>2]=220;r19=r18+12|0;r16=r19;r17=HEAP32[r14];HEAP32[r14]=r16;HEAP32[r19>>2]=r12;HEAP32[r18+16>>2]=r17;HEAP32[r17>>2]=r16;r16=_malloc(20);HEAP8[r16]=HEAP8[5263320];HEAP8[r16+1|0]=HEAP8[5263321|0];HEAP8[r16+2|0]=HEAP8[5263322|0];HEAP8[r16+3|0]=HEAP8[5263323|0];HEAP8[r16+4|0]=HEAP8[5263324|0];HEAP32[r16+8>>2]=554;r17=r16+12|0;r18=r17;r19=HEAP32[r14];HEAP32[r14]=r18;HEAP32[r17>>2]=r12;HEAP32[r16+16>>2]=r19;HEAP32[r19>>2]=r18;r18=_malloc(20);HEAP8[r18]=HEAP8[5264676];HEAP8[r18+1|0]=HEAP8[5264677|0];HEAP8[r18+2|0]=HEAP8[5264678|0];HEAP8[r18+3|0]=HEAP8[5264679|0];HEAP8[r18+4|0]=HEAP8[5264680|0];HEAP32[r18+8>>2]=338;r19=r18+12|0;r16=r19;r17=HEAP32[r14];HEAP32[r14]=r16;HEAP32[r19>>2]=r12;HEAP32[r18+16>>2]=r17;HEAP32[r17>>2]=r16;HEAP32[r15]=HEAP32[r15]|21;L2436:do{if((_feof(r2)|0)==0){r15=r6|0;while(1){_iff_chunk(r10,r1,r2,r15);if((_feof(r2)|0)!=0){break L2436}}}}while(0);r15=HEAP32[r13>>2];L2441:do{if((r15|0)!=(r12|0)){r13=r15;while(1){r16=r13-16+4|0;r17=HEAP32[r16+12>>2];r18=HEAP32[r16+16>>2];HEAP32[r17+4>>2]=r18;HEAP32[r18>>2]=r17;r17=HEAP32[r13>>2];_free(r16);if((r17|0)==(r12|0)){break L2441}else{r13=r17}}}}while(0);_free(r10);r10=r1+128|0;r12=(r1+136|0)>>2;r15=r1+132|0;HEAP32[r15>>2]=Math.imul(HEAP32[r12],HEAP32[r10>>2]);r13=HEAP32[r8>>2];HEAP32[r9]=r13;HEAP32[r4+44]=_calloc(764,r13);r13=HEAP32[r9];if((r13|0)!=0){HEAP32[r4+45]=_calloc(52,r13)}HEAP32[r4+43]=_calloc(4,HEAP32[r15>>2]);HEAP32[r4+42]=_calloc(4,HEAP32[r10>>2]+1|0);_fseek(r2,r7+r3|0,0);r3=_malloc(16);if((r3|0)==0){r11=-1;STACKTOP=r5;return r11}r7=r3;r10=r3;HEAP32[r10>>2]=r7;r15=(r3+4|0)>>2;HEAP32[r15]=r7;HEAP32[r3+8>>2]=4;r13=(r3+12|0)>>2;HEAP32[r13]=0;r9=_malloc(20);HEAP8[r9]=HEAP8[5263320];HEAP8[r9+1|0]=HEAP8[5263321|0];HEAP8[r9+2|0]=HEAP8[5263322|0];HEAP8[r9+3|0]=HEAP8[5263323|0];HEAP8[r9+4|0]=HEAP8[5263324|0];HEAP32[r9+8>>2]=428;r8=r9+12|0;r17=r8;r16=HEAP32[r15];HEAP32[r15]=r17;HEAP32[r8>>2]=r7;HEAP32[r9+16>>2]=r16;HEAP32[r16>>2]=r17;r17=_malloc(20);HEAP8[r17]=HEAP8[5264676];HEAP8[r17+1|0]=HEAP8[5264677|0];HEAP8[r17+2|0]=HEAP8[5264678|0];HEAP8[r17+3|0]=HEAP8[5264679|0];HEAP8[r17+4|0]=HEAP8[5264680|0];HEAP32[r17+8>>2]=230;r16=r17+12|0;r9=r16;r8=HEAP32[r15];HEAP32[r15]=r9;HEAP32[r16>>2]=r7;HEAP32[r17+16>>2]=r8;HEAP32[r8>>2]=r9;HEAP32[r13]=HEAP32[r13]|21;L2451:do{if((_feof(r2)|0)==0){r13=r6|0;while(1){_iff_chunk(r3,r1,r2,r13);if((_feof(r2)|0)!=0){break L2451}}}}while(0);r2=HEAP32[r10>>2];L2456:do{if((r2|0)!=(r7|0)){r10=r2;while(1){r13=r10-16+4|0;r9=HEAP32[r13+12>>2];r8=HEAP32[r13+16>>2];HEAP32[r9+4>>2]=r8;HEAP32[r8>>2]=r9;r9=HEAP32[r10>>2];_free(r13);if((r9|0)==(r7|0)){break L2456}else{r10=r9}}}}while(0);_free(r3);L2460:do{if((HEAP32[r12]|0)>0){r3=0;while(1){HEAP32[((r3*12&-1)+184>>2)+r4]=HEAPU8[r6+r3|0]<<1;r7=r3+1|0;if((r7|0)<(HEAP32[r12]|0)){r3=r7}else{break L2460}}}}while(0);r12=r1+1276|0;HEAP32[r12>>2]=HEAP32[r12>>2]|32;HEAP32[r4+320]=1;r11=0;STACKTOP=r5;return r11}function _get_init(r1,r2,r3,r4){var r5;r2=STACKTOP;STACKTOP=STACKTOP+64|0;r5=r2|0;_fread(r5,1,64,r3);_strncpy(r1|0,r5,64);_set_type(r1,5263536,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));if((_fgetc(r3)&1|0)==0){r5=r1+1276|0;HEAP32[r5>>2]=HEAP32[r5>>2]|4096}HEAP32[r1+136>>2]=_fgetc(r3)&255;HEAP32[r1+148>>2]=_fgetc(r3)&255;HEAP32[r1+152>>2]=_fgetc(r3)&255;_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fread(r4,1,64,r3);STACKTOP=r2;return}function _get_ordr222(r1,r2,r3,r4){var r5;r4=r1+156|0;HEAP32[r4>>2]=(_fgetc(r3)&255)+1|0;r2=0;while(1){HEAP8[r1+(r2+952)|0]=_fgetc(r3)&255;r5=r2+1|0;if((r5|0)<(HEAP32[r4>>2]|0)){r2=r5}else{break}}return}function _get_patt_cnt223(r1,r2,r3,r4){r4=(_fgetc(r3)&255)+1|0;r3=r1+128|0;if((r4|0)<=(HEAP32[r3>>2]|0)){return}HEAP32[r3>>2]=r4;return}function _get_inst_cnt224(r1,r2,r3,r4){_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);r4=(_fgetc(r3)&255)+1|0;r3=r1+140|0;if((r4|0)<=(HEAP32[r3>>2]|0)){return}HEAP32[r3>>2]=r4;return}function _get_patt225(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r4=STACKTOP;STACKTOP=STACKTOP+8|0;r2=r4;r5=_fgetc(r3)&255;_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);r6=(_fgetc(r3)&255)+1|0;r7=(r1+136|0)>>2;r8=_calloc(1,(HEAP32[r7]<<2)+4|0);r9=(r1+168|0)>>2;HEAP32[HEAP32[r9]+(r5<<2)>>2]=r8;HEAP32[HEAP32[HEAP32[r9]+(r5<<2)>>2]>>2]=r6;r8=HEAP32[r7];r10=(r1+172|0)>>2;L2484:do{if((r8|0)>0){r1=0;r11=r8;while(1){r12=Math.imul(r11,r5)+r1|0;HEAP32[HEAP32[HEAP32[r9]+(r5<<2)>>2]+(r1<<2)+4>>2]=r12;r12=_calloc(HEAP32[HEAP32[HEAP32[r9]+(r5<<2)>>2]>>2]<<3|4,1);r13=Math.imul(HEAP32[r7],r5)+r1|0;HEAP32[HEAP32[r10]+(r13<<2)>>2]=r12;r12=HEAP32[HEAP32[HEAP32[r9]+(r5<<2)>>2]>>2];r13=Math.imul(HEAP32[r7],r5)+r1|0;HEAP32[HEAP32[HEAP32[r10]+(r13<<2)>>2]>>2]=r12;r12=r1+1|0;r13=HEAP32[r7];if((r12|0)<(r13|0)){r1=r12;r11=r13}else{break L2484}}}}while(0);r8=0;while(1){while(1){r11=_fgetc(r3);if((r11&255)<<24>>24==0){break}r1=r11&31;if((r1|0)<(HEAP32[r7]|0)){r14=(r8<<3)+HEAP32[HEAP32[r10]+(HEAP32[HEAP32[HEAP32[r9]+(r5<<2)>>2]+(r1<<2)+4>>2]<<2)>>2]+4|0}else{r14=r2}if((r11&128|0)!=0){r1=_fgetc(r3);r13=r1&255;r12=_fgetc(r3);r15=r12&255;r16=r12&255;do{if(r15<<24>>24==20){r17=-93;r18=r13}else{if((r15&255)<=15){r17=r15;r18=r13;break}_printf(5264064,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r16,HEAP32[tempInt+4>>2]=r1&255,tempInt));r17=0;r18=0}}while(0);HEAP8[r14+3|0]=r17;HEAP8[r14+4|0]=r18}do{if((r11&64|0)!=0){HEAP8[r14+1|0]=_fgetc(r3)&255;r1=_fgetc(r3)&255;r16=r14|0;HEAP8[r16]=r1;if(r1<<24>>24!=-128){break}HEAP8[r16]=-127}}while(0);if((r11&32|0)==0){continue}HEAP8[r14+2|0]=((_fgetc(r3)&255)>>>1)+1&255}r16=r8+1|0;if((r16|0)<(r6|0)){r8=r16}else{break}}STACKTOP=r4;return}function _get_inst226(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12;r4=0;_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);r2=_fgetc(r3)&255;r5=(r1+176|0)>>2;_fread(HEAP32[r5]+(r2*764&-1)|0,1,28,r3);r6=HEAP32[r5];r7=r6+(r2*764&-1)|0;r8=HEAP8[r7];L2511:do{if(r8<<24>>24!=0){r9=0;r10=r8;while(1){r11=r6+(r2*764&-1)+r9|0;do{if((_isprint(r10<<24>>24)|0)==0){r4=1750}else{if(HEAP8[r11]<<24>>24<0){r4=1750;break}else{break}}}while(0);if(r4==1750){r4=0;HEAP8[r11]=32}r12=r9+1|0;if(r12>>>0>=_strlen(r7)>>>0){break}r9=r12;r10=HEAP8[r6+(r2*764&-1)+r12|0]}if(HEAP8[r7]<<24>>24==0){break}while(1){r10=_strlen(r7)-1+r6+(r2*764&-1)|0;if(HEAP8[r10]<<24>>24!=32){break L2511}HEAP8[r10]=0;if(HEAP8[r7]<<24>>24==0){break L2511}}}}while(0);_fseek(r3,290,1);r7=_fgetc(r3)&255|_fgetc(r3)<<8&65280;HEAP32[HEAP32[r5]+(r2*764&-1)+36>>2]=r7;r7=HEAP32[HEAP32[r5]+(r2*764&-1)+36>>2];if((r7|0)==0){return}r6=_calloc(64,r7);HEAP32[HEAP32[r5]+(r2*764&-1)+756>>2]=r6;_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);r6=(r1+180|0)>>2;_fread(HEAP32[r6]+(r2*52&-1)|0,1,28,r3);r1=HEAP32[r6];r7=r1+(r2*52&-1)|0;r8=HEAP8[r7];L2528:do{if(r8<<24>>24!=0){r10=0;r9=r8;while(1){r12=r1+(r2*52&-1)+r10|0;do{if((_isprint(r9<<24>>24)|0)==0){r4=1760}else{if(HEAP8[r12]<<24>>24<0){r4=1760;break}else{break}}}while(0);if(r4==1760){r4=0;HEAP8[r12]=32}r11=r10+1|0;if(r11>>>0>=_strlen(r7)>>>0){break}r10=r11;r9=HEAP8[r1+(r2*52&-1)+r11|0]}if(HEAP8[r7]<<24>>24==0){break}while(1){r9=_strlen(r7)-1+r1+(r2*52&-1)|0;if(HEAP8[r9]<<24>>24!=32){break L2528}HEAP8[r9]=0;if(HEAP8[r7]<<24>>24==0){break L2528}}}}while(0);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);HEAP32[HEAP32[HEAP32[r5]+(r2*764&-1)+756>>2]+40>>2]=r2;r7=_fgetc(r3)&255;HEAP32[HEAP32[r5]+(r2*764&-1)+32>>2]=r7;HEAP32[HEAP32[HEAP32[r5]+(r2*764&-1)+756>>2]+8>>2]=128;r7=((_fgetc(r3)&255|_fgetc(r3)<<8&65280)+1|0)>>>9;HEAP32[HEAP32[HEAP32[r5]+(r2*764&-1)+756>>2]>>2]=r7;r7=_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);r1=_fgetc(r3)&255;r4=_fgetc(r3);r8=r4<<8&65280|r1|_fgetc(r3)<<16&16711680|_fgetc(r3)<<24;HEAP32[HEAP32[r6]+(r2*52&-1)+32>>2]=r8;r8=_fgetc(r3)&255;r1=_fgetc(r3);r4=r1<<8&65280|r8|_fgetc(r3)<<16&16711680|_fgetc(r3)<<24;HEAP32[HEAP32[r6]+(r2*52&-1)+36>>2]=r4;r4=_fgetc(r3)&255;r8=_fgetc(r3);r1=r8<<8&65280|r4|_fgetc(r3)<<16&16711680|_fgetc(r3)<<24;HEAP32[HEAP32[r6]+(r2*52&-1)+40>>2]=r1;HEAP32[HEAP32[r6]+(r2*52&-1)+44>>2]=0;if((r7&4|0)!=0){r1=HEAP32[r6]+(r2*52&-1)+44|0;HEAP32[r1>>2]=HEAP32[r1>>2]|1}if((r7&8|0)!=0){r1=HEAP32[r6]+(r2*52&-1)+44|0;HEAP32[r1>>2]=HEAP32[r1>>2]|2}if((r7&16|0)!=0){r1=HEAP32[r6]+(r2*52&-1)+44|0;HEAP32[r1>>2]=HEAP32[r1>>2]|6}r1=_fgetc(r3)&255;r4=_fgetc(r3);r8=r4<<8&65280|r1|_fgetc(r3)<<16&16711680|_fgetc(r3)<<24;r1=HEAP32[HEAP32[r5]+(r2*764&-1)+756>>2];r5=r1+12|0;r4=r1+16|0;if((r8|0)==0){HEAP32[r4>>2]=0;HEAP32[r5>>2]=0}else{r1=Math.log((r8|0)/8363)*1536/.6931471805599453&-1;HEAP32[r5>>2]=(r1|0)/128&-1;HEAP32[r4>>2]=(r1|0)%128}_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);r1=HEAP32[r6];if((HEAP32[r1+(r2*52&-1)+32>>2]|0)<=1){return}_load_sample(r3,r7>>>6&2^2,r1+(r2*52&-1)|0,0);return}function _gdm_test(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+64|0;r6=r5;r7=_fgetc(r1);r8=_fgetc(r1);if((r8<<16&16711680|r7<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255|0)!=1195658750){r9=-1;STACKTOP=r5;return r9}_fseek(r1,r3+71|0,0);r7=_fgetc(r1);r8=_fgetc(r1);if((r8<<16&16711680|r7<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255|0)!=1196246611){r9=-1;STACKTOP=r5;return r9}_fseek(r1,r3+4|0,0);r3=r6|0;if((r2|0)==0){r9=0;STACKTOP=r5;return r9}_memset(r2,0,33);_fread(r3,1,32,r1);HEAP8[r6+32|0]=0;_memset(r2,0,33);_strncpy(r2,r3,32);r3=HEAP8[r2];if(r3<<24>>24==0){r9=0;STACKTOP=r5;return r9}else{r10=0;r11=r2;r12=r3}while(1){do{if((_isprint(r12<<24>>24)|0)==0){r4=1787}else{if(HEAP8[r11]<<24>>24<0){r4=1787;break}else{break}}}while(0);if(r4==1787){r4=0;HEAP8[r11]=46}r3=r10+1|0;r6=r2+r3|0;r1=HEAP8[r6];if(r1<<24>>24!=0&(r3|0)<32){r10=r3;r11=r6;r12=r1}else{break}}if(HEAP8[r2]<<24>>24==0){r9=0;STACKTOP=r5;return r9}while(1){r12=r2+(_strlen(r2)-1)|0;if(HEAP8[r12]<<24>>24!=32){r9=0;r4=1792;break}HEAP8[r12]=0;if(HEAP8[r2]<<24>>24==0){r9=0;r4=1794;break}}if(r4==1794){STACKTOP=r5;return r9}else if(r4==1792){STACKTOP=r5;return r9}}function _gdm_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33;r4=r1>>2;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+64|0;r7=r6;r8=r6+32;_fseek(r2,r3,0);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fread(r1|0,1,32,r2);_fseek(r2,32,1);_fseek(r2,7,1);r9=_fgetc(r2)&255;r10=_fgetc(r2)&255;r11=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;r12=_fgetc(r2)&255;r13=_fgetc(r2)&255;if(r11<<16>>16==0){_set_type(r1,5267528,(tempInt=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[tempInt>>2]=r9,HEAP32[tempInt+4>>2]=r10,HEAP32[tempInt+8>>2]=r12,HEAP32[tempInt+12>>2]=r13,tempInt))}else{_set_type(r1,5266196,(tempInt=STACKTOP,STACKTOP=STACKTOP+16|0,HEAP32[tempInt>>2]=r9,HEAP32[tempInt+4>>2]=r10,HEAP32[tempInt+8>>2]=r12,HEAP32[tempInt+12>>2]=r13,tempInt))}_fread(r8|0,32,1,r2);r13=(r1+136|0)>>2;r12=0;while(1){r10=r8+r12|0;r9=HEAP8[r10];r11=r12+1|0;do{if(r9<<24>>24==-1){r14=-1}else{HEAP32[r13]=r11;if(r9<<24>>24!=16){r14=r9;break}HEAP8[r10]=8;r14=8}}while(0);HEAP32[((r12*12&-1)+184>>2)+r4]=(r14&255)<<4;if((r11|0)==32){break}else{r12=r11}}HEAP32[r4+41]=_fgetc(r2)&255;HEAP32[r4+37]=_fgetc(r2)&255;HEAP32[r4+38]=_fgetc(r2)&255;_fgetc(r2);_fgetc(r2);r12=_fgetc(r2)&255;r14=_fgetc(r2);r8=r14<<8&65280|r12|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r12=(r1+156|0)>>2;HEAP32[r12]=(_fgetc(r2)&255)+1|0;r14=_fgetc(r2)&255;r10=_fgetc(r2);r9=r10<<8&65280|r14|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r14=(r1+128|0)>>2;HEAP32[r14]=(_fgetc(r2)&255)+1|0;r10=_fgetc(r2)&255;r15=_fgetc(r2);r16=r15<<8&65280|r10|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r10=_fgetc(r2)&255;r15=_fgetc(r2);r17=r15<<8&65280|r10|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r10=(_fgetc(r2)&255)+1|0;r15=r1+144|0;HEAP32[r15>>2]=r10;r18=(r1+140|0)>>2;HEAP32[r18]=r10;r10=r1+132|0;HEAP32[r10>>2]=Math.imul(HEAP32[r13],HEAP32[r14]);_fseek(r2,r8+r3|0,0);L2599:do{if((HEAP32[r12]|0)>0){r8=0;while(1){HEAP8[r1+(r8+952)|0]=_fgetc(r2)&255;r19=r8+1|0;if((r19|0)<(HEAP32[r12]|0)){r8=r19}else{break L2599}}}}while(0);_fseek(r2,r16+r3|0,0);r16=(r1+176|0)>>2;HEAP32[r16]=_calloc(764,HEAP32[r18]);r12=HEAP32[r15>>2];if((r12|0)!=0){HEAP32[r4+45]=_calloc(52,r12)}L2606:do{if((HEAP32[r18]|0)>0){r12=r7|0;r4=(r1+180|0)>>2;r15=0;while(1){r8=_calloc(64,1);HEAP32[HEAP32[r16]+(r15*764&-1)+756>>2]=r8;_fread(r12,32,1,r2);r8=HEAP32[r16];r11=r8+(r15*764&-1)|0;_memset(r11,0,33);_strncpy(r11,r12,32);r19=HEAP8[r11];L2610:do{if(r19<<24>>24!=0){r20=0;r21=r11;r22=r19;while(1){do{if((_isprint(r22<<24>>24)|0)==0){r5=1817}else{if(HEAP8[r21]<<24>>24<0){r5=1817;break}else{break}}}while(0);if(r5==1817){r5=0;HEAP8[r21]=46}r23=r20+1|0;r24=r8+(r15*764&-1)+r23|0;r25=HEAP8[r24];if(r25<<24>>24!=0&(r23|0)<32){r20=r23;r21=r24;r22=r25}else{break}}if(HEAP8[r11]<<24>>24==0){break}while(1){r22=_strlen(r11)-1+r8+(r15*764&-1)|0;if(HEAP8[r22]<<24>>24!=32){break L2610}HEAP8[r22]=0;if(HEAP8[r11]<<24>>24==0){break L2610}}}}while(0);_fseek(r2,12,1);_fgetc(r2);r11=_fgetc(r2)&255;r8=_fgetc(r2);r19=r8<<8&65280|r11|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;HEAP32[HEAP32[r4]+(r15*52&-1)+32>>2]=r19;r19=_fgetc(r2)&255;r11=_fgetc(r2);r8=r11<<8&65280|r19|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;HEAP32[HEAP32[r4]+(r15*52&-1)+36>>2]=r8;r8=_fgetc(r2)&255;r19=_fgetc(r2);r11=r19<<8&65280|r8|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;HEAP32[HEAP32[r4]+(r15*52&-1)+40>>2]=r11;r11=_fgetc(r2);r8=_fgetc(r2)&255|_fgetc(r2)<<8&65280;r19=_fgetc(r2)&255;r22=_fgetc(r2);HEAP32[HEAP32[HEAP32[r16]+(r15*764&-1)+756>>2]>>2]=r19>>>0>64?64:r19;if((r22&255)>15){r26=128}else{r26=r22<<4&4080}HEAP32[HEAP32[HEAP32[r16]+(r15*764&-1)+756>>2]+8>>2]=r26;r22=HEAP32[HEAP32[r16]+(r15*764&-1)+756>>2];r19=r22+12|0;r21=r22+16|0;if((r8|0)==0){HEAP32[r21>>2]=0;HEAP32[r19>>2]=0}else{r22=Math.log((r8|0)/8363)*1536/.6931471805599453&-1;HEAP32[r19>>2]=(r22|0)/128&-1;HEAP32[r21>>2]=(r22|0)%128}HEAP32[HEAP32[r16]+(r15*764&-1)+36>>2]=(HEAP32[HEAP32[r4]+(r15*52&-1)+32>>2]|0)!=0&1;HEAP32[HEAP32[HEAP32[r16]+(r15*764&-1)+756>>2]+40>>2]=r15;HEAP32[HEAP32[r4]+(r15*52&-1)+44>>2]=0;if((r11&1|0)!=0){r22=HEAP32[r4]+(r15*52&-1)+44|0;HEAP32[r22>>2]=HEAP32[r22>>2]|2}if((r11&2|0)!=0){r11=HEAP32[r4]+(r15*52&-1)+44|0;HEAP32[r11>>2]=HEAP32[r11>>2]|1;r11=HEAP32[r4]+(r15*52&-1)+32|0;HEAP32[r11>>2]=HEAP32[r11>>2]>>1;r11=HEAP32[r4]+(r15*52&-1)+36|0;HEAP32[r11>>2]=HEAP32[r11>>2]>>1;r11=HEAP32[r4]+(r15*52&-1)+40|0;HEAP32[r11>>2]=HEAP32[r11>>2]>>1}r11=r15+1|0;if((r11|0)<(HEAP32[r18]|0)){r15=r11}else{break L2606}}}}while(0);_fseek(r2,r9+r3|0,0);r9=(r1+172|0)>>2;HEAP32[r9]=_calloc(4,HEAP32[r10>>2]);r10=(r1+168|0)>>2;HEAP32[r10]=_calloc(4,HEAP32[r14]+1|0);L2637:do{if((HEAP32[r14]|0)>0){r26=0;L2638:while(1){r5=_calloc(1,(HEAP32[r13]<<2)+4|0);HEAP32[HEAP32[r10]+(r26<<2)>>2]=r5;HEAP32[HEAP32[HEAP32[r10]+(r26<<2)>>2]>>2]=64;r5=HEAP32[r13];L2640:do{if((r5|0)>0){r7=0;r15=r5;while(1){r4=Math.imul(r15,r26)+r7|0;HEAP32[HEAP32[HEAP32[r10]+(r26<<2)>>2]+(r7<<2)+4>>2]=r4;r4=_calloc(HEAP32[HEAP32[HEAP32[r10]+(r26<<2)>>2]>>2]<<3|4,1);r12=Math.imul(HEAP32[r13],r26)+r7|0;HEAP32[HEAP32[r9]+(r12<<2)>>2]=r4;r4=HEAP32[HEAP32[HEAP32[r10]+(r26<<2)>>2]>>2];r12=Math.imul(HEAP32[r13],r26)+r7|0;HEAP32[HEAP32[HEAP32[r9]+(r12<<2)>>2]>>2]=r4;r4=r7+1|0;r12=HEAP32[r13];if((r4|0)<(r12|0)){r7=r4;r15=r12}else{break L2640}}}}while(0);r5=(_fgetc(r2)&255|_fgetc(r2)<<8&65280)-2|0;L2644:do{if((r5|0)>0){r15=r5;r7=0;while(1){r12=r15;while(1){r4=_fgetc(r2);r27=r12-1|0;if((r4&255)<<24>>24==0){break}r11=r4&31;if((r11|0)>=(HEAP32[r13]|0)){break L2638}r22=HEAP32[HEAP32[r9]+(HEAP32[HEAP32[HEAP32[r10]+(r26<<2)>>2]+(r11<<2)+4>>2]<<2)>>2];if((r4&32|0)==0){r28=r27}else{r11=_fgetc(r2)&255;HEAP8[(r7<<3)+r22+4|0]=((r11&15)+12&255)+(((r11&255)>>>4&7)*12&255)&255;HEAP8[(r7<<3)+r22+5|0]=_fgetc(r2)&255;r28=r12-3|0}L2654:do{if((r4&64|0)==0){r29=r28}else{r11=(r7<<3)+r22+7|0;r21=(r7<<3)+r22+8|0;r19=(r7<<3)+r22+9|0;r8=(r7<<3)+r22+10|0;r20=r28;while(1){r25=_fgetc(r2);r24=r25&255;r23=r20-1|0;r30=r25>>>6&3;do{if((r30|0)==1){HEAP8[r19]=r24&31;HEAP8[r8]=_fgetc(r2)&255;r31=r20-2|0;r32=HEAPU8[r19];if((r32|0)==19){HEAP8[r19]=16;r33=r31;break}else if((r32|0)==20){HEAP8[r19]=-84;r33=r31;break}else if((r32|0)==30){HEAP8[r8]=0;HEAP8[r19]=0;r33=r31;break}else if((r32|0)==31){HEAP8[r19]=-85;r33=r31;break}else if((r32|0)==0){HEAP8[r8]=0;r33=r31;break}else if((r32|0)==8){HEAP8[r19]=29;r33=r31;break}else if((r32|0)==16){HEAP8[r19]=0;r33=r31;break}else if((r32|0)==17){HEAP8[r8]=0;HEAP8[r19]=0;r33=r31;break}else if((r32|0)==18){HEAP8[r19]=27;r33=r31;break}else if((r32|0)==1|(r32|0)==2|(r32|0)==3|(r32|0)==4|(r32|0)==5|(r32|0)==6|(r32|0)==7|(r32|0)==9|(r32|0)==10|(r32|0)==11|(r32|0)==12|(r32|0)==13|(r32|0)==14|(r32|0)==15){r33=r31;break}else{HEAP8[r8]=0;HEAP8[r19]=0;r33=r31;break}}else if((r30|0)==2){_fgetc(r2);r33=r20-2|0}else if((r30|0)==0){HEAP8[r11]=r24&31;HEAP8[r21]=_fgetc(r2)&255;r31=r20-2|0;r32=HEAPU8[r11];if((r32|0)==0){HEAP8[r21]=0;r33=r31;break}else if((r32|0)==18){HEAP8[r11]=27;r33=r31;break}else if((r32|0)==19){HEAP8[r11]=16;r33=r31;break}else if((r32|0)==20){HEAP8[r11]=-84;r33=r31;break}else if((r32|0)==30){HEAP8[r21]=0;HEAP8[r11]=0;r33=r31;break}else if((r32|0)==31){HEAP8[r11]=-85;r33=r31;break}else if((r32|0)==8){HEAP8[r11]=29;r33=r31;break}else if((r32|0)==16){HEAP8[r11]=0;r33=r31;break}else if((r32|0)==17){HEAP8[r21]=0;HEAP8[r11]=0;r33=r31;break}else if((r32|0)==1|(r32|0)==2|(r32|0)==3|(r32|0)==4|(r32|0)==5|(r32|0)==6|(r32|0)==7|(r32|0)==9|(r32|0)==10|(r32|0)==11|(r32|0)==12|(r32|0)==13|(r32|0)==14|(r32|0)==15){r33=r31;break}else{HEAP8[r21]=0;HEAP8[r11]=0;r33=r31;break}}else{r33=r23}}while(0);if((r25&32|0)==0){r29=r33;break L2654}else{r20=r33}}}}while(0);if((r29|0)>0){r12=r29}else{break L2644}}if((r27|0)>0){r15=r27;r7=r7+1|0}else{break L2644}}}}while(0);r5=r26+1|0;if((r5|0)<(HEAP32[r14]|0)){r26=r5}else{break L2637}}___assert_func(5265288,239,5268816,5264652)}}while(0);_fseek(r2,r17+r3|0,0);if((HEAP32[r18]|0)<=0){STACKTOP=r6;return 0}r3=r1+180|0;r1=0;while(1){_load_sample(r2,2,HEAP32[r3>>2]+(HEAP32[HEAP32[HEAP32[r16]+(r1*764&-1)+756>>2]+40>>2]*52&-1)|0,0);r17=r1+1|0;if((r17|0)<(HEAP32[r18]|0)){r1=r17}else{break}}STACKTOP=r6;return 0}function _gtk_test(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+68|0;r5=r4;r6=r4+64;r7=r6|0;L2697:do{if(_fread(r7,1,4,r1)>>>0<4){r8=-1}else{if((_memcmp(r7,5266192,3)|0)!=0){r8=-1;break}if(HEAP8[r6+3|0]<<24>>24>4){r8=-1;break}r9=r5|0;if((r2|0)==0){r8=0;break}_memset(r2,0,33);_fread(r9,1,32,r1);HEAP8[r5+32|0]=0;_memset(r2,0,33);_strncpy(r2,r9,32);r9=HEAP8[r2];if(r9<<24>>24==0){r8=0;break}else{r10=0;r11=r2;r12=r9}while(1){do{if((_isprint(r12<<24>>24)|0)==0){r3=1885}else{if(HEAP8[r11]<<24>>24<0){r3=1885;break}else{break}}}while(0);if(r3==1885){r3=0;HEAP8[r11]=46}r9=r10+1|0;r13=r2+r9|0;r14=HEAP8[r13];if(r14<<24>>24!=0&(r9|0)<32){r10=r9;r11=r13;r12=r14}else{break}}if(HEAP8[r2]<<24>>24==0){r8=0;break}while(1){r14=r2+(_strlen(r2)-1)|0;if(HEAP8[r14]<<24>>24!=32){r8=0;break L2697}HEAP8[r14]=0;if(HEAP8[r2]<<24>>24==0){r8=0;break L2697}}}}while(0);STACKTOP=r4;return r8}function _gtk_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+40|0;r6=r5;_fseek(r2,r3,0);r3=r6|0;_fread(r3,4,1,r2);r7=HEAP8[r6+3|0];_fread(r1|0,32,1,r2);_set_type(r1,5267488,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r7&255,tempInt));_fseek(r2,160,1);r6=_fgetc(r2);r8=_fgetc(r2)&255|r6<<8&65280;r6=(r1+140|0)>>2;HEAP32[r6]=r8;r9=r1+144|0;HEAP32[r9>>2]=r8;r8=_fgetc(r2);r10=_fgetc(r2)&255|r8<<8&65280;r8=_fgetc(r2);r11=(r1+136|0)>>2;HEAP32[r11]=_fgetc(r2)&255|r8<<8&65280;r8=_fgetc(r2);r12=r1+156|0;HEAP32[r12>>2]=_fgetc(r2)&255|r8<<8&65280;r8=_fgetc(r2);HEAP32[r1+160>>2]=_fgetc(r2)&255|r8<<8&65280;r8=(r1+176|0)>>2;HEAP32[r8]=_calloc(764,HEAP32[r6]);r13=HEAP32[r9>>2];if((r13|0)!=0){HEAP32[r1+180>>2]=_calloc(52,r13)}L2718:do{if((HEAP32[r6]|0)>0){r13=r7<<24>>24==1;r9=(r1+180|0)>>2;r14=0;while(1){r15=_calloc(64,1);HEAP32[HEAP32[r8]+(r14*764&-1)+756>>2]=r15;_fread(r3,28,1,r2);r15=HEAP32[r8];r16=r15+(r14*764&-1)|0;_memset(r16,0,29);_strncpy(r16,r3,28);r17=HEAP8[r16];L2722:do{if(r17<<24>>24!=0){r18=0;r19=r16;r20=r17;while(1){do{if((_isprint(r20<<24>>24)|0)==0){r4=1898}else{if(HEAP8[r19]<<24>>24<0){r4=1898;break}else{break}}}while(0);if(r4==1898){r4=0;HEAP8[r19]=46}r21=r18+1|0;r22=r15+(r14*764&-1)+r21|0;r23=HEAP8[r22];if(r23<<24>>24!=0&(r21|0)<28){r18=r21;r19=r22;r20=r23}else{break}}if(HEAP8[r16]<<24>>24==0){break}while(1){r20=_strlen(r16)-1+r15+(r14*764&-1)|0;if(HEAP8[r20]<<24>>24!=32){break L2722}HEAP8[r20]=0;if(HEAP8[r16]<<24>>24==0){break L2722}}}}while(0);if(r13){_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r16=_fgetc(r2);r15=_fgetc(r2);r17=r15<<16&16711680|r16<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;HEAP32[HEAP32[r9]+(r14*52&-1)+32>>2]=r17;r17=_fgetc(r2);r16=_fgetc(r2);r15=r16<<16&16711680|r17<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;HEAP32[HEAP32[r9]+(r14*52&-1)+36>>2]=r15;r15=_fgetc(r2);r17=_fgetc(r2);r16=r17<<16&16711680|r15<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;r15=HEAP32[r9];HEAP32[r15+(r14*52&-1)+40>>2]=HEAP32[r15+(r14*52&-1)+36>>2]-1+r16|0;_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);HEAP32[HEAP32[HEAP32[r8]+(r14*764&-1)+756>>2]>>2]=64;HEAP32[HEAP32[HEAP32[r8]+(r14*764&-1)+756>>2]+8>>2]=128;r24=r16;r25=0}else{_fseek(r2,14,1);_fgetc(r2);_fgetc(r2);r16=_fgetc(r2)&65535;r15=_fgetc(r2)&254|r16<<8;r16=_fgetc(r2);r17=_fgetc(r2)&255|r16<<8&65280;r16=HEAP32[HEAP32[r8]+(r14*764&-1)+756>>2];r20=r16+12|0;r19=r16+16|0;if((r17|0)==0){HEAP32[r19>>2]=0;HEAP32[r20>>2]=0}else{r16=Math.log((r17|0)/8363)*1536/.6931471805599453&-1;HEAP32[r20>>2]=(r16|0)/128&-1;HEAP32[r19>>2]=(r16|0)%128}r16=_fgetc(r2);r19=_fgetc(r2);r20=r19<<16&16711680|r16<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;HEAP32[HEAP32[r9]+(r14*52&-1)+32>>2]=r20;r20=_fgetc(r2);r16=_fgetc(r2);r19=r16<<16&16711680|r20<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;HEAP32[HEAP32[r9]+(r14*52&-1)+36>>2]=r19;r19=_fgetc(r2);r20=_fgetc(r2);r16=r20<<16&16711680|r19<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;r19=HEAP32[r9];HEAP32[r19+(r14*52&-1)+40>>2]=HEAP32[r19+(r14*52&-1)+36>>2]-1+r16|0;r19=_fgetc(r2);r20=(_fgetc(r2)&252|r19<<8&65280)>>>2;HEAP32[HEAP32[HEAP32[r8]+(r14*764&-1)+756>>2]>>2]=r20;_fgetc(r2);r20=_fgetc(r2)<<24>>24;HEAP32[HEAP32[HEAP32[r8]+(r14*764&-1)+756>>2]+16>>2]=r20;r24=r16;r25=(r15&65535)>1}HEAP32[HEAP32[r8]+(r14*764&-1)+36>>2]=(HEAP32[HEAP32[r9]+(r14*52&-1)+32>>2]|0)!=0&1;HEAP32[HEAP32[HEAP32[r8]+(r14*764&-1)+756>>2]+40>>2]=r14;HEAP32[HEAP32[r9]+(r14*52&-1)+44>>2]=(r24|0)>2?2:0;if(r25){r15=HEAP32[r9]+(r14*52&-1)+44|0;HEAP32[r15>>2]=HEAP32[r15>>2]|1;r15=HEAP32[r9]+(r14*52&-1)+32|0;HEAP32[r15>>2]=HEAP32[r15>>2]>>1;r15=HEAP32[r9]+(r14*52&-1)+36|0;HEAP32[r15>>2]=HEAP32[r15>>2]>>1;r15=HEAP32[r9]+(r14*52&-1)+40|0;HEAP32[r15>>2]=HEAP32[r15>>2]>>1}r15=r14+1|0;if((r15|0)<(HEAP32[r6]|0)){r14=r15}else{r26=0;break L2718}}}else{r26=0}}while(0);while(1){_fgetc(r2);HEAP8[r1+(r26+952)|0]=_fgetc(r2)&255;r25=r26+1|0;if((r25|0)==256){break}else{r26=r25}}r26=HEAP32[r12>>2];if((r26|0)>0){r12=0;r25=0;while(1){r24=HEAPU8[r1+(r12+952)|0];r27=(r24|0)>(r25|0)?r24:r25;r24=r12+1|0;if((r24|0)<(r26|0)){r12=r24;r25=r27}else{break}}r28=r27+1|0}else{r28=1}r27=(r1+128|0)>>2;HEAP32[r27]=r28;r25=Math.imul(HEAP32[r11],r28);HEAP32[r1+132>>2]=r25;r28=(r1+172|0)>>2;HEAP32[r28]=_calloc(4,r25);r25=(r1+168|0)>>2;HEAP32[r25]=_calloc(4,HEAP32[r27]+1|0);L2754:do{if((HEAP32[r27]|0)>0){r12=(r7&255)>3;r26=0;r24=HEAP32[r11];while(1){r3=_calloc(1,(r24<<2)+4|0);HEAP32[HEAP32[r25]+(r26<<2)>>2]=r3;HEAP32[HEAP32[HEAP32[r25]+(r26<<2)>>2]>>2]=r10;r3=HEAP32[r11];L2758:do{if((r3|0)>0){r14=0;r9=r3;while(1){r13=Math.imul(r9,r26)+r14|0;HEAP32[HEAP32[HEAP32[r25]+(r26<<2)>>2]+(r14<<2)+4>>2]=r13;r13=_calloc(HEAP32[HEAP32[HEAP32[r25]+(r26<<2)>>2]>>2]<<3|4,1);r15=Math.imul(HEAP32[r11],r26)+r14|0;HEAP32[HEAP32[r28]+(r15<<2)>>2]=r13;r13=HEAP32[HEAP32[HEAP32[r25]+(r26<<2)>>2]>>2];r15=Math.imul(HEAP32[r11],r26)+r14|0;HEAP32[HEAP32[HEAP32[r28]+(r15<<2)>>2]>>2]=r13;r13=r14+1|0;r15=HEAP32[r11];if((r13|0)<(r15|0)){r14=r13;r9=r15}else{r29=r15;break L2758}}}else{r29=r3}}while(0);r3=HEAP32[r25];L2762:do{if((HEAP32[HEAP32[r3+(r26<<2)>>2]>>2]|0)>0){r9=0;r14=r29;r15=r3;while(1){L2765:do{if((r14|0)>0){r13=0;r16=r15;while(1){r20=HEAP32[HEAP32[r28]+(HEAP32[HEAP32[r16+(r26<<2)>>2]+(r13<<2)+4>>2]<<2)>>2];r19=_fgetc(r2)&255;HEAP8[(r9<<3)+r20+4|0]=r19<<24>>24==0?0:r19+12&255;HEAP8[(r9<<3)+r20+5|0]=_fgetc(r2)&255;r19=(r9<<3)+r20+7|0;HEAP8[r19]=_fgetc(r2)&255;r17=(r9<<3)+r20+8|0;HEAP8[r17]=_fgetc(r2)&255;if(r12){HEAP8[(r9<<3)+r20+6|0]=_fgetc(r2)&255}r20=HEAP8[r19];do{if((r20&255)>15){r4=1927}else{if(r20<<24>>24==14|r20<<24>>24==12){r4=1927;break}else{break}}}while(0);if(r4==1927){r4=0;HEAP8[r19]=0;HEAP8[r17]=0}r20=r13+1|0;r18=HEAP32[r11];r23=HEAP32[r25];if((r20|0)<(r18|0)){r13=r20;r16=r23}else{r30=r18;r31=r23;break L2765}}}else{r30=r14;r31=r15}}while(0);r16=r9+1|0;if((r16|0)<(HEAP32[HEAP32[r31+(r26<<2)>>2]>>2]|0)){r9=r16;r14=r30;r15=r31}else{r32=r30;break L2762}}}else{r32=r29}}while(0);r3=r26+1|0;if((r3|0)<(HEAP32[r27]|0)){r26=r3;r24=r32}else{break L2754}}}}while(0);r32=HEAP32[r6];if((r32|0)<=0){STACKTOP=r5;return 0}r27=r1+180|0;r1=0;r29=r32;while(1){r32=HEAP32[r27>>2];if((HEAP32[r32+(r1*52&-1)+32>>2]|0)==0){r33=r29}else{_load_sample(r2,0,r32+(HEAP32[HEAP32[HEAP32[r8]+(r1*764&-1)+756>>2]+40>>2]*52&-1)|0,0);r33=HEAP32[r6]}r32=r1+1|0;if((r32|0)<(r33|0)){r1=r32;r29=r33}else{break}}STACKTOP=r5;return 0}function _hsc_test(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+1264|0;r5=r4;r6=r4+64;_fseek(r1,1536,1);r7=r6|0;if((_fread(r7,1,51,r1)|0)==51){r8=0;r9=0}else{r10=-1;STACKTOP=r4;return r10}while(1){r11=HEAP8[r6+r8|0];r12=r11&255;if(r11<<24>>24==-1){r13=r8;r14=r9;break}r11=(r12|0)>(r9|0)?r12:r9;r12=r8+1|0;if((r12|0)<51){r8=r12;r9=r11}else{r13=r12;r14=r11;break}}if((r13|0)==0|(r14|0)==0|(r13|0)>50|(r14|0)>50){r10=-1;STACKTOP=r4;return r10}L2798:do{if((r14|0)>0){r13=0;L2799:while(1){_fread(r7,1,1152,r1);r9=0;while(1){r8=r9*18&-1;r11=0;while(1){if((r11|0)>=9){break}r12=(r11<<1)+r8|0;r15=HEAP8[r6+(r12|1)|0];if(HEAP8[r6+r12|0]<<24>>24!=-128&(r15-7&255)<9|(r15-112&255)<48){r10=-1;break L2799}else{r11=r11+1|0}}r11=r9+1|0;if((r11|0)<64){r9=r11}else{break}}r9=r13+1|0;if((r9|0)<(r14|0)){r13=r9}else{break L2798}}STACKTOP=r4;return r10}}while(0);r14=r5|0;if((r2|0)==0){r10=0;STACKTOP=r4;return r10}HEAP8[r2]=0;_fread(r14,1,0,r1);HEAP8[r14]=0;HEAP8[r2]=0;_strncpy(r2,r14,0);if(HEAP8[r2]<<24>>24==0){r10=0;STACKTOP=r4;return r10}while(1){r14=r2+(_strlen(r2)-1)|0;if(HEAP8[r14]<<24>>24!=32){r10=0;r3=1954;break}HEAP8[r14]=0;if(HEAP8[r2]<<24>>24==0){r10=0;r3=1957;break}}if(r3==1954){STACKTOP=r4;return r10}else if(r3==1957){STACKTOP=r4;return r10}}function _hsc_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24;r4=r1>>2;r5=STACKTOP;STACKTOP=STACKTOP+1576|0;r6=r5;r7=r5+1540;_fseek(r2,r3,0);r8=r5+4|0;_fread(r8,1,1536,r2);r9=0;r10=r8;while(1){if(HEAPU8[r10+9|0]>3){r11=r9;break}if(HEAPU8[r10+10|0]>3){r11=r9;break}if(HEAPU8[r10+8|0]>15){r11=r9;break}r12=r9+1|0;if((r12|0)<128){r9=r12;r10=r10+12|0}else{r11=r12;break}}r10=(r1+140|0)>>2;HEAP32[r10]=r11;_fseek(r2,r3,0);r3=(r1+136|0)>>2;HEAP32[r3]=9;HEAP32[r4+38]=135;HEAP32[r4+37]=6;r11=r1+144|0;HEAP32[r11>>2]=HEAP32[r10];r9=r1+1276|0;HEAP32[r9>>2]=HEAP32[r9>>2]|4096;_set_type(r1,5265936,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r9=(r1+176|0)>>2;HEAP32[r9]=_calloc(764,HEAP32[r10]);r12=HEAP32[r11>>2];if((r12|0)!=0){HEAP32[r4+45]=_calloc(52,r12)}_fread(r8,1,1536,r2);L2831:do{if((HEAP32[r10]|0)>0){r12=r1+180|0;r11=0;r13=r8;while(1){r14=_calloc(64,1);HEAP32[HEAP32[r9]+(r11*764&-1)+756>>2]=r14;HEAP32[HEAP32[r9]+(r11*764&-1)+36>>2]=1;HEAP32[HEAP32[HEAP32[r9]+(r11*764&-1)+756>>2]>>2]=64;HEAP32[HEAP32[HEAP32[r9]+(r11*764&-1)+756>>2]+16>>2]=(HEAP8[r13+11|0]<<24>>24|0)/4&-1;HEAP32[HEAP32[HEAP32[r9]+(r11*764&-1)+756>>2]+8>>2]=128;HEAP32[HEAP32[HEAP32[r9]+(r11*764&-1)+756>>2]+12>>2]=0;HEAP32[HEAP32[HEAP32[r9]+(r11*764&-1)+756>>2]+40>>2]=r11;r14=r13+7|0;HEAP32[HEAP32[r9]+(r11*764&-1)+40>>2]=HEAPU8[r14]<<5&480;r15=HEAP32[r12>>2];r16=HEAP8[r13];r17=r13+1|0;HEAP8[r13]=HEAP8[r17];HEAP8[r17]=r16;r16=r13+2|0;r17=HEAP8[r16];r18=r13+3|0;HEAP8[r16]=HEAP8[r18];HEAP8[r18]=r17;r17=r13+4|0;r18=HEAP8[r17];r16=r13+5|0;HEAP8[r17]=HEAP8[r16];HEAP8[r16]=r18;r18=r13+6|0;r16=HEAP8[r18];HEAP8[r18]=HEAP8[r14];HEAP8[r14]=r16;r16=r13+8|0;r14=HEAP8[r16];r18=r13+10|0;HEAP8[r16]=HEAP8[r18];HEAP8[r18]=r14;r14=_malloc(15);r18=(r15+(r11*52&-1)+48|0)>>2;HEAP32[r18]=r14;if((r14|0)!=0){HEAP32[r14>>2]=0;r14=HEAP32[r18]+4|0;HEAP32[r18]=r14;_memcpy(r14,r13,11);r14=r15+(r11*52&-1)+44|0;HEAP32[r14>>2]=HEAP32[r14>>2]|32768;HEAP32[r15+(r11*52&-1)+32>>2]=11}r15=r11+1|0;if((r15|0)<(HEAP32[r10]|0)){r11=r15;r13=r13+12|0}else{r19=0;r20=0;break L2831}}}else{r19=0;r20=0}}while(0);while(1){r10=r1+(r19+952)|0;_fread(r10,1,1,r2);r9=HEAPU8[r10];if((r9&128|0)!=0){r21=r19;r22=r20;break}r10=(r9|0)>(r20|0)?r9:r20;r9=r19+1|0;if((r9|0)<51){r19=r9;r20=r10}else{r21=r9;r22=r10;break}}_fseek(r2,50-r21|0,1);HEAP32[r4+39]=r21;r21=r22+1|0;r22=(r1+128|0)>>2;HEAP32[r22]=r21;r20=Math.imul(HEAP32[r3],r21);HEAP32[r4+33]=r20;r21=(r1+172|0)>>2;HEAP32[r21]=_calloc(4,r20);r20=(r1+168|0)>>2;HEAP32[r20]=_calloc(4,HEAP32[r22]+1|0);L2842:do{if((HEAP32[r22]|0)>0){r19=r7;r10=r6|0;r9=r6+1|0;r8=0;while(1){_memcpy(r19,5250576,36);r13=_calloc(1,(HEAP32[r3]<<2)+4|0);HEAP32[HEAP32[r20]+(r8<<2)>>2]=r13;HEAP32[HEAP32[HEAP32[r20]+(r8<<2)>>2]>>2]=64;r13=HEAP32[r3];L2846:do{if((r13|0)>0){r11=0;r12=r13;while(1){r15=Math.imul(r12,r8)+r11|0;HEAP32[HEAP32[HEAP32[r20]+(r8<<2)>>2]+(r11<<2)+4>>2]=r15;r15=_calloc(HEAP32[HEAP32[HEAP32[r20]+(r8<<2)>>2]>>2]<<3|4,1);r14=Math.imul(HEAP32[r3],r8)+r11|0;HEAP32[HEAP32[r21]+(r14<<2)>>2]=r15;r15=HEAP32[HEAP32[HEAP32[r20]+(r8<<2)>>2]>>2];r14=Math.imul(HEAP32[r3],r8)+r11|0;HEAP32[HEAP32[HEAP32[r21]+(r14<<2)>>2]>>2]=r15;r15=r11+1|0;r14=HEAP32[r3];if((r15|0)<(r14|0)){r11=r15;r12=r14}else{break L2846}}}}while(0);L2850:do{if((HEAP32[HEAP32[HEAP32[r20]+(r8<<2)>>2]>>2]|0)>0){r13=0;while(1){r12=0;while(1){_fread(r10,1,2,r2);r11=HEAP32[HEAP32[r21]+(HEAP32[HEAP32[HEAP32[r20]+(r8<<2)>>2]+(r12<<2)+4>>2]<<2)>>2];r14=(r13<<3)+r11+4|0;r15=HEAP8[r10];do{if(r15<<24>>24>-1){if(r15<<24>>24==127){HEAP8[r14|0]=-127;break}else if(r15<<24>>24==0){break}else{HEAP8[r14|0]=r15+25&255;HEAP8[(r13<<3)+r11+5|0]=HEAP32[r7+(r12<<2)>>2]&255;break}}else{HEAP32[r7+(r12<<2)>>2]=HEAPU8[r9]+1|0}}while(0);r15=(r13<<3)+r11+7|0;HEAP8[r15]=0;r14=(r13<<3)+r11+8|0;HEAP8[r14]=0;if(HEAP8[r9]<<24>>24==1){HEAP8[r15]=13;HEAP8[r14]=0}r14=r12+1|0;if((r14|0)==9){break}else{r12=r14}}r12=r13+1|0;if((r12|0)<(HEAP32[HEAP32[HEAP32[r20]+(r8<<2)>>2]>>2]|0)){r13=r12}else{break L2850}}}}while(0);r13=r8+1|0;if((r13|0)<(HEAP32[r22]|0)){r8=r13}else{break L2842}}}}while(0);if((HEAP32[r3]|0)>0){r23=0}else{r24=r1+6552|0;HEAP32[r24>>2]=5246980;STACKTOP=r5;return 0}while(1){HEAP32[((r23*12&-1)+184>>2)+r4]=128;HEAP32[((r23*12&-1)+192>>2)+r4]=1;r22=r23+1|0;if((r22|0)<(HEAP32[r3]|0)){r23=r22}else{break}}r24=r1+6552|0;HEAP32[r24>>2]=5246980;STACKTOP=r5;return 0}function _ice_test(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+64|0;r6=r5;_fseek(r1,r3+1464|0,0);r7=_fgetc(r1);r8=_fgetc(r1);r9=r8<<16&16711680|r7<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255;if(!((r9|0)==1297370624|(r9|0)==1230254384)){r10=-1;STACKTOP=r5;return r10}_fseek(r1,r3,0);r3=r6|0;if((r2|0)==0){r10=0;STACKTOP=r5;return r10}_memset(r2,0,29);_fread(r3,1,28,r1);HEAP8[r6+28|0]=0;_memset(r2,0,29);_strncpy(r2,r3,28);r3=HEAP8[r2];if(r3<<24>>24==0){r10=0;STACKTOP=r5;return r10}else{r11=0;r12=r2;r13=r3}while(1){do{if((_isprint(r13<<24>>24)|0)==0){r4=2001}else{if(HEAP8[r12]<<24>>24<0){r4=2001;break}else{break}}}while(0);if(r4==2001){r4=0;HEAP8[r12]=46}r3=r11+1|0;r6=r2+r3|0;r1=HEAP8[r6];if(r1<<24>>24!=0&(r3|0)<28){r11=r3;r12=r6;r13=r1}else{break}}if(HEAP8[r2]<<24>>24==0){r10=0;STACKTOP=r5;return r10}while(1){r13=r2+(_strlen(r2)-1)|0;if(HEAP8[r13]<<24>>24!=32){r10=0;r4=2006;break}HEAP8[r13]=0;if(HEAP8[r2]<<24>>24==0){r10=0;r4=2008;break}}if(r4==2006){STACKTOP=r5;return r10}else if(r4==2008){STACKTOP=r5;return r10}}function _ice_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31;r4=STACKTOP;STACKTOP=STACKTOP+1472|0;r5=r4;r6=r4+1468;_fseek(r2,r3,0);r3=r5|0;_fread(r3,20,1,r2);r7=0;while(1){_fread(r5+(r7*30&-1)+20|0,22,1,r2);r8=_fgetc(r2)&65535;HEAP16[r5+(r7*30&-1)+42>>1]=_fgetc(r2)&255|r8<<8;HEAP8[r5+(r7*30&-1)+44|0]=_fgetc(r2)&255;HEAP8[r5+(r7*30&-1)+45|0]=_fgetc(r2)&255;r8=_fgetc(r2)&65535;HEAP16[r5+(r7*30&-1)+46>>1]=_fgetc(r2)&255|r8<<8;r8=_fgetc(r2)&65535;HEAP16[r5+(r7*30&-1)+48>>1]=_fgetc(r2)&255|r8<<8;r8=r7+1|0;if((r8|0)==31){break}else{r7=r8}}r7=r5+950|0;HEAP8[r7]=_fgetc(r2)&255;HEAP8[r5+951|0]=_fgetc(r2)&255;_fread(r5+952|0,512,1,r2);r8=_fgetc(r2);r9=_fgetc(r2);r10=r9<<16&16711680|r8<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;HEAP32[r5+1464>>2]=r10;if((r10|0)==1297370624){_set_type(r1,5266164,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}else if((r10|0)==1230254384){_set_type(r1,5267460,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}else{r11=-1;STACKTOP=r4;return r11}r10=(r1+140|0)>>2;HEAP32[r10]=31;r8=r1+144|0;HEAP32[r8>>2]=31;r9=HEAP16[r7>>1];r7=r9&255;r12=(r1+128|0)>>2;HEAP32[r12]=r7;HEAP32[r1+156>>2]=r7;r7=(r1+132|0)>>2;HEAP32[r7]=(r9&65535)>>>8&65535;_strncpy(r1|0,r3,20);r3=(r1+176|0)>>2;HEAP32[r3]=_calloc(764,HEAP32[r10]);r9=HEAP32[r8>>2];if((r9|0)!=0){HEAP32[r1+180>>2]=_calloc(52,r9)}L2910:do{if((HEAP32[r10]|0)>0){r9=(r1+180|0)>>2;r8=0;while(1){r13=_calloc(64,1);HEAP32[HEAP32[r3]+(r8*764&-1)+756>>2]=r13;r13=HEAP16[r5+(r8*30&-1)+42>>1];HEAP32[HEAP32[r9]+(r8*52&-1)+32>>2]=(r13&65535)<<1;HEAP32[HEAP32[r3]+(r8*764&-1)+36>>2]=r13<<16>>16!=0&1;HEAP32[HEAP32[r9]+(r8*52&-1)+36>>2]=HEAPU16[r5+(r8*30&-1)+46>>1]<<1;r13=HEAP32[r9];r14=HEAP16[r5+(r8*30&-1)+48>>1];HEAP32[r13+(r8*52&-1)+40>>2]=((r14&65535)<<1)+HEAP32[r13+(r8*52&-1)+36>>2]|0;HEAP32[HEAP32[r9]+(r8*52&-1)+44>>2]=(r14&65535)>1?2:0;HEAP32[HEAP32[HEAP32[r3]+(r8*764&-1)+756>>2]>>2]=HEAPU8[r5+(r8*30&-1)+45|0];r14=(Math.floor(HEAPU8[r5+(r8*30&-1)+44|0]/72)&255)<<4;HEAP32[HEAP32[HEAP32[r3]+(r8*764&-1)+756>>2]+16>>2]=r14;HEAP32[HEAP32[HEAP32[r3]+(r8*764&-1)+756>>2]+8>>2]=128;HEAP32[HEAP32[HEAP32[r3]+(r8*764&-1)+756>>2]+40>>2]=r8;r14=r8+1|0;if((r14|0)<(HEAP32[r10]|0)){r8=r14}else{break L2910}}}}while(0);r3=(r1+172|0)>>2;HEAP32[r3]=_calloc(4,HEAP32[r7]);r8=(r1+168|0)>>2;HEAP32[r8]=_calloc(4,HEAP32[r12]+1|0);L2915:do{if((HEAP32[r12]|0)>0){r9=(r1+136|0)>>2;r14=0;while(1){r13=_calloc(1,(HEAP32[r9]<<2)+4|0);HEAP32[HEAP32[r8]+(r14<<2)>>2]=r13;HEAP32[HEAP32[HEAP32[r8]+(r14<<2)>>2]>>2]=64;L2919:do{if((HEAP32[r9]|0)>0){r13=0;while(1){HEAP32[HEAP32[HEAP32[r8]+(r14<<2)>>2]+(r13<<2)+4>>2]=HEAPU8[(r14<<2)+r5+r13+952|0];r15=r13+1|0;if((r15|0)<(HEAP32[r9]|0)){r13=r15}else{break L2919}}}}while(0);HEAP8[r1+(r14+952)|0]=r14&255;r13=r14+1|0;if((r13|0)<(HEAP32[r12]|0)){r14=r13}else{break L2915}}}}while(0);L2924:do{if((HEAP32[r7]|0)>0){r12=r6|0;r5=r6+1|0;r8=r6+2|0;r14=r6+3|0;r9=0;while(1){r13=_calloc(524,1);HEAP32[HEAP32[r3]+(r9<<2)>>2]=r13;HEAP32[HEAP32[HEAP32[r3]+(r9<<2)>>2]>>2]=64;r13=HEAP32[HEAP32[r3]+(r9<<2)>>2];L2928:do{if((HEAP32[r13>>2]|0)>0){r15=0;r16=r13;while(1){_fread(r12,1,4,r2);r17=HEAP8[r12];r18=(r17&255)<<8&3840|HEAPU8[r5];if((r18|0)==0){r19=0}else{L2933:do{if(r18>>>0<3628){r20=r18;r21=24;while(1){r22=r21+12|0;r23=r20<<1;if((r23|0)<3628){r20=r23;r21=r22}else{r24=r23;r25=r22;break L2933}}}else{r24=r18;r25=24}}while(0);L2937:do{if((r24|0)>3842){r18=r25;r21=5249472;while(1){r20=r21-32|0;r22=r18-1|0;r23=HEAP32[r20>>2];if((r24|0)>(r23|0)){r18=r22;r21=r20}else{r26=r22;r27=r20,r28=r27>>2;r29=r23;break L2937}}}else{r26=r25;r27=5249472,r28=r27>>2;r29=3842}}while(0);do{if((r29|0)>(r24|0)){if((HEAP32[r28+1]|0)<=(r24|0)){r30=1;break}if((HEAP32[r28+2]|0)<=(r24|0)){r30=1;break}r30=(HEAP32[r28+3]|0)<=(r24|0)&1}else{r30=1}}while(0);r19=r26-r30&255}HEAP8[(r15<<3)+r16+4|0]=r19;r21=HEAP8[r8];HEAP8[(r15<<3)+r16+5|0]=(r21&255)>>>4|r17&-16;r18=r21&15;r21=(r15<<3)+r16+7|0;HEAP8[r21]=r18;r23=HEAP8[r14];HEAP8[(r15<<3)+r16+8|0]=r23;do{if(r23<<24>>24==0){r20=r18&255;if((r20|0)==5){HEAP8[r21]=3;break}else if((r20|0)==6){HEAP8[r21]=4;break}else if((r20|0)==1|(r20|0)==2|(r20|0)==10){HEAP8[r21]=0;break}else{break}}}while(0);r21=r15+1|0;r18=HEAP32[HEAP32[r3]+(r9<<2)>>2];if((r21|0)<(HEAP32[r18>>2]|0)){r15=r21;r16=r18}else{break L2928}}}}while(0);r13=r9+1|0;if((r13|0)<(HEAP32[r7]|0)){r9=r13}else{break L2924}}}}while(0);r7=r1+1276|0;HEAP32[r7>>2]=HEAP32[r7>>2]|8192;r7=HEAP32[r10];if((r7|0)<=0){r11=0;STACKTOP=r4;return r11}r3=r1+180|0;r1=0;r19=r7;while(1){r7=HEAP32[r3>>2];if((HEAP32[r7+(r1*52&-1)+32>>2]|0)<5){r31=r19}else{_load_sample(r2,0,r7+(r1*52&-1)|0,0);r31=HEAP32[r10]}r7=r1+1|0;if((r7|0)<(r31|0)){r1=r7;r19=r31}else{r11=0;break}}STACKTOP=r4;return r11}function _iff_chunk(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r5=STACKTOP;STACKTOP=STACKTOP+20|0;r6=r5|0;_memset(r6,0,17);r7=(r1+8|0)>>2;if((_fread(r6,1,HEAP32[r7],r3)|0)!=(HEAP32[r7]|0)){STACKTOP=r5;return}r8=(r1+12|0)>>2;r9=HEAP32[r8];do{if((r9&16|0)==0){r10=r9}else{if((_strncmp(r6,5265824,4)|0)!=0){r10=r9;break}_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fread(r6,1,HEAP32[r7],r3);r10=HEAP32[r8]}}while(0);r9=_fgetc(r3);if((r10&1|0)==0){r10=_fgetc(r3);r11=r10<<16&16711680|r9<<24|_fgetc(r3)<<8&65280|_fgetc(r3)&255}else{r10=_fgetc(r3);r11=r10<<8&65280|r9&255|_fgetc(r3)<<16&16711680|_fgetc(r3)<<24}r9=HEAP32[r8];if((r9&4|0)==0){r12=r11}else{r12=r11+1&-2}if((r9&8|0)==0){r13=r12}else{r13=r12+3&-4}if((r9&2|0)==0){r14=r13}else{r14=r13-4-HEAP32[r7]|0}r13=_ftell(r3);r9=r1;r12=HEAP32[r1>>2];L2986:do{if((r12|0)!=(r9|0)){r1=HEAP32[r7];r11=r12;while(1){r15=r11-16+4|0;if((_strncmp(r6,r15,r1)|0)==0){break}r8=HEAP32[r11>>2];if((r8|0)==(r9|0)){break L2986}else{r11=r8}}FUNCTION_TABLE[HEAP32[r15+8>>2]](r2,r14,r3,r4)}}while(0);_fseek(r3,r13+r14|0,0);STACKTOP=r5;return}function _imf_test(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+64|0;r6=r5;_fseek(r1,r3+60|0,0);r7=_fgetc(r1);r8=_fgetc(r1);if((r8<<16&16711680|r7<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255|0)!=1229795632){r9=-1;STACKTOP=r5;return r9}_fseek(r1,r3,0);r3=r6|0;if((r2|0)==0){r9=0;STACKTOP=r5;return r9}_memset(r2,0,33);_fread(r3,1,32,r1);HEAP8[r6+32|0]=0;_memset(r2,0,33);_strncpy(r2,r3,32);r3=HEAP8[r2];if(r3<<24>>24==0){r9=0;STACKTOP=r5;return r9}else{r10=0;r11=r2;r12=r3}while(1){do{if((_isprint(r12<<24>>24)|0)==0){r4=2084}else{if(HEAP8[r11]<<24>>24<0){r4=2084;break}else{break}}}while(0);if(r4==2084){r4=0;HEAP8[r11]=46}r3=r10+1|0;r6=r2+r3|0;r1=HEAP8[r6];if(r1<<24>>24!=0&(r3|0)<32){r10=r3;r11=r6;r12=r1}else{break}}if(HEAP8[r2]<<24>>24==0){r9=0;STACKTOP=r5;return r9}while(1){r12=r2+(_strlen(r2)-1)|0;if(HEAP8[r12]<<24>>24!=32){r9=0;r4=2092;break}HEAP8[r12]=0;if(HEAP8[r2]<<24>>24==0){r9=0;r4=2089;break}}if(r4==2089){STACKTOP=r5;return r9}else if(r4==2092){STACKTOP=r5;return r9}}function _imf_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54;r4=r1>>2;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+1320|0;r7=r6;r8=r6+8;r9=r6+840,r10=r9>>1;r11=r6+1224;r12=r6+1288;_fseek(r2,r3,0);r3=r8|0;_fread(r3,32,1,r2);r13=r8+32|0;HEAP16[r13>>1]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;HEAP16[r8+34>>1]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;r14=r8+36|0;HEAP16[r14>>1]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;HEAP16[r8+38>>1]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;_fread(r8+40|0,8,1,r2);r15=r8+48|0;HEAP8[r15]=_fgetc(r2)&255;HEAP8[r8+49|0]=_fgetc(r2)&255;HEAP8[r8+50|0]=_fgetc(r2)&255;HEAP8[r8+51|0]=_fgetc(r2)&255;_fread(r8+52|0,8,1,r2);r16=_fgetc(r2);r17=_fgetc(r2);HEAP32[r8+60>>2]=r17<<16&16711680|r16<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;r16=0;while(1){_fread((r16<<4)+r8+64|0,12,1,r2);HEAP8[(r16<<4)+r8+76|0]=_fgetc(r2)&255;HEAP8[(r16<<4)+r8+77|0]=_fgetc(r2)&255;HEAP8[(r16<<4)+r8+78|0]=_fgetc(r2)&255;HEAP8[(r16<<4)+r8+79|0]=_fgetc(r2)&255;r17=r16+1|0;if((r17|0)==32){break}else{r16=r17}}r16=r8+576|0;_fread(r16,256,1,r2);r17=r1|0;_memset(r17,0,33);_strncpy(r17,r3,32);r3=HEAP8[r17];L3023:do{if(r3<<24>>24!=0){r18=0;r19=r17;r20=r3;while(1){do{if((_isprint(r20<<24>>24)|0)==0){r5=2101}else{if(HEAP8[r19]<<24>>24<0){r5=2101;break}else{break}}}while(0);if(r5==2101){r5=0;HEAP8[r19]=46}r21=r18+1|0;r22=r1+r21|0;r23=HEAP8[r22];if(r23<<24>>24!=0&(r21|0)<32){r18=r21;r19=r22;r20=r23}else{break}}if(HEAP8[r17]<<24>>24==0){break}while(1){r20=r1+(_strlen(r17)-1)|0;if(HEAP8[r20]<<24>>24!=32){break L3023}HEAP8[r20]=0;if(HEAP8[r17]<<24>>24==0){break L3023}}}}while(0);r17=HEAP32[r13>>2];r13=(r1+156|0)>>2;HEAP32[r13]=r17&65535;r3=HEAP32[r14>>2];r14=(r1+140|0)>>2;HEAP32[r14]=r3&65535;r20=(r1+144|0)>>2;HEAP32[r20]=1024;r19=(r1+128|0)>>2;HEAP32[r19]=r17>>>16;if((r3&65536|0)!=0){r3=r1+1276|0;HEAP32[r3>>2]=HEAP32[r3>>2]|4096}r3=HEAP16[r15>>1];HEAP32[r4+37]=r3&255;HEAP32[r4+38]=(r3&65535)>>>8&65535;_set_type(r1,5267436,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r3=(r1+136|0)>>2;HEAP32[r3]=0;r15=0;while(1){r17=r15+1|0;if(HEAP8[(r15<<4)+r8+76|0]<<24>>24!=0){HEAP32[r3]=r17;HEAP32[((r15*12&-1)+184>>2)+r4]=HEAPU8[(r15<<4)+r8+77|0]}if((r17|0)==32){break}else{r15=r17}}r15=Math.imul(HEAP32[r3],HEAP32[r19]);r8=r1+132|0;HEAP32[r8>>2]=r15;r17=HEAP32[r13];_memcpy(r1+952|0,r16,r17);if((r17|0)>0){r16=0;r18=r17;while(1){r17=r1+(r16+952)|0;if(HEAP8[r17]<<24>>24==-1){HEAP8[r17]=-2;r24=HEAP32[r13]}else{r24=r18}r17=r16+1|0;if((r17|0)<(r24|0)){r16=r17;r18=r24}else{break}}r25=HEAP32[r8>>2]}else{r25=r15}HEAP32[r4+315]=8363;r15=(r1+172|0)>>2;HEAP32[r15]=_calloc(4,r25);r25=(r1+168|0)>>2;HEAP32[r25]=_calloc(4,HEAP32[r19]+1|0);r8=r12|0;_memset(r8,0,32);L3053:do{if((HEAP32[r19]|0)>0){r12=0;while(1){r24=_calloc(1,(HEAP32[r3]<<2)+4|0);HEAP32[HEAP32[r25]+(r12<<2)>>2]=r24;r24=_fgetc(r2)&255|_fgetc(r2)<<8&65280;r18=r24-4|0;r16=_fgetc(r2)&255|_fgetc(r2)<<8&65280;HEAP32[HEAP32[HEAP32[r25]+(r12<<2)>>2]>>2]=r16;r16=HEAP32[r3];L3056:do{if((r16|0)>0){r13=0;r17=r16;while(1){r23=Math.imul(r17,r12)+r13|0;HEAP32[HEAP32[HEAP32[r25]+(r12<<2)>>2]+(r13<<2)+4>>2]=r23;r23=_calloc(HEAP32[HEAP32[HEAP32[r25]+(r12<<2)>>2]>>2]<<3|4,1);r22=Math.imul(HEAP32[r3],r12)+r13|0;HEAP32[HEAP32[r15]+(r22<<2)>>2]=r23;r23=HEAP32[HEAP32[HEAP32[r25]+(r12<<2)>>2]>>2];r22=Math.imul(HEAP32[r3],r12)+r13|0;HEAP32[HEAP32[HEAP32[r15]+(r22<<2)>>2]>>2]=r23;r23=r13+1|0;r22=HEAP32[r3];if((r23|0)<(r22|0)){r13=r23;r17=r22}else{break L3056}}}}while(0);L3060:do{if((r18|0)>0){r16=0;r17=r18;r13=r24-5|0;while(1){r22=r17;r23=r13;while(1){r21=_fgetc(r2);if((r21&255)<<24>>24==0){break}r26=r21&31;if((r26|0)<(HEAP32[r3]|0)){r27=(r16<<3)+HEAP32[HEAP32[r15]+(HEAP32[HEAP32[HEAP32[r25]+(r12<<2)>>2]+(r26<<2)+4>>2]<<2)>>2]+4|0}else{r27=r7}if((r21&32|0)==0){r28=r23}else{r29=_fgetc(r2);r30=r29&255;r31=r29&255;if((r31|0)==255|(r31|0)==160){r32=-127}else{r32=((r30&15)+13&255)+(((r30&255)>>>4)*12&255)&255}HEAP8[r27|0]=r32;HEAP8[r27+1|0]=_fgetc(r2)&255;r28=r22-3|0}if((r21&128|0)==0){r33=r28}else{r30=r27+3|0;HEAP8[r30]=_fgetc(r2)&255;r31=r27+4|0;HEAP8[r31]=_fgetc(r2)&255;_xlat_fx(r26,r30,r31,r8);r33=r28-2|0}if((r21&64|0)==0){r34=r33}else{r21=r27+5|0;HEAP8[r21]=_fgetc(r2)&255;r31=r27+6|0;HEAP8[r31]=_fgetc(r2)&255;_xlat_fx(r26,r21,r31,r8);r34=r33-2|0}if((r34|0)>0){r22=r34;r23=r34-1|0}else{break L3060}}if((r23|0)>0){r16=r16+1|0;r17=r23;r13=r23-1|0}else{break L3060}}}}while(0);r24=r12+1|0;if((r24|0)<(HEAP32[r19]|0)){r12=r24}else{break L3053}}}}while(0);r19=(r1+176|0)>>2;HEAP32[r19]=_calloc(764,HEAP32[r14]);r34=HEAP32[r20];if((r34|0)!=0){HEAP32[r4+45]=_calloc(52,r34)}L3088:do{if((HEAP32[r14]|0)>0){r34=r9|0;r33=r9+32|0;r8=r9+152|0;r27=r9+376|0;r28=(r9+378|0)>>1;r32=r9+380|0;r7=r9+352|0;r25=r9+353|0;r15=r9+354|0;r3=r9+355|0;r12=r9+356|0;r24=r11|0;r18=r11+13|0;r13=r11+16|0;r17=r11+20|0;r16=r11+24|0;r22=r11+28|0;r31=r11+32|0;r21=r11+33|0;r26=r11+34|0;r30=r11+48|0;r29=r11+49|0;r35=r11+54|0;r36=r11+56|0;r37=r11+60|0;r38=r1+180|0,r39=r38>>2;r40=0;r41=0;while(1){_fread(r34,32,1,r2);_fread(r33,120,1,r2);_fread(r8,8,1,r2);r42=0;while(1){HEAP16[((r42<<1)+160>>1)+r10]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;r43=r42+1|0;if((r43|0)==32){r44=0;break}else{r42=r43}}while(1){HEAP16[((r44<<1)+224>>1)+r10]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;r42=r44+1|0;if((r42|0)==32){r45=0;break}else{r44=r42}}while(1){HEAP16[((r45<<1)+288>>1)+r10]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;r42=r45+1|0;if((r42|0)==32){break}else{r45=r42}}HEAP8[r7]=_fgetc(r2)&255;HEAP8[r25]=_fgetc(r2)&255;HEAP8[r15]=_fgetc(r2)&255;HEAP8[r3]=_fgetc(r2)&255;HEAP8[r12]=_fgetc(r2)&255;_fread(r9+357|0,3,1,r2);HEAP8[r9+360|0]=_fgetc(r2)&255;HEAP8[r9+361|0]=_fgetc(r2)&255;HEAP8[r9+362|0]=_fgetc(r2)&255;HEAP8[r9+363|0]=_fgetc(r2)&255;HEAP8[r9+364|0]=_fgetc(r2)&255;_fread(r9+365|0,3,1,r2);HEAP8[r9+368|0]=_fgetc(r2)&255;HEAP8[r9+369|0]=_fgetc(r2)&255;HEAP8[r9+370|0]=_fgetc(r2)&255;HEAP8[r9+371|0]=_fgetc(r2)&255;HEAP8[r9+372|0]=_fgetc(r2)&255;_fread(r9+373|0,3,1,r2);HEAP16[r27>>1]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;HEAP16[r28]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;r42=_fgetc(r2);r43=_fgetc(r2);r46=r43<<16&16711680|r42<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;HEAP32[r32>>2]=r46;if((r46|0)!=1229533488){r47=-2;break}r46=HEAP16[r28];if(r46<<16>>16==0){r48=0}else{r42=_calloc(64,r46&65535);HEAP32[HEAP32[r19]+(r40*764&-1)+756>>2]=r42;r48=HEAPU16[r28]}HEAP32[HEAP32[r19]+(r40*764&-1)+36>>2]=r48;r42=HEAP8[r34];L3104:do{if(r42<<24>>24!=0){r46=0;r43=r42;while(1){r49=r9+r46|0;do{if((_isprint(r43<<24>>24)|0)==0){r5=2152}else{if(HEAP8[r49]<<24>>24<0){r5=2152;break}else{break}}}while(0);if(r5==2152){r5=0;HEAP8[r49]=32}r23=r46+1|0;if(r23>>>0>=_strlen(r34)>>>0){break}r46=r23;r43=HEAP8[r9+r23|0]}if(HEAP8[r34]<<24>>24==0){break}while(1){r43=r9+(_strlen(r34)-1)|0;if(HEAP8[r43]<<24>>24!=32){break L3104}HEAP8[r43]=0;if(HEAP8[r34]<<24>>24==0){break L3104}}}}while(0);_strncpy(HEAP32[r19]+(r40*764&-1)|0,r34,24);r42=0;while(1){HEAP8[(r42+12<<1)+HEAP32[r19]+(r40*764&-1)+512|0]=HEAP8[r9+(r42+32)|0];r43=r42+1|0;if((r43|0)==108){break}else{r42=r43}}HEAP32[HEAP32[r19]+(r40*764&-1)+48>>2]=HEAPU8[r7];HEAP32[HEAP32[r19]+(r40*764&-1)+56>>2]=HEAPU8[r25];HEAP32[HEAP32[r19]+(r40*764&-1)+64>>2]=HEAPU8[r15];HEAP32[HEAP32[r19]+(r40*764&-1)+68>>2]=HEAPU8[r3];HEAP32[HEAP32[r19]+(r40*764&-1)+44>>2]=HEAP8[r12]&1;r42=HEAP32[r19]+(r40*764&-1)+44|0;HEAP32[r42>>2]=((HEAP8[r12]&2)<<24>>24!=0?2:0)|HEAP32[r42>>2];r42=HEAP32[r19]+(r40*764&-1)+44|0;HEAP32[r42>>2]=((HEAP8[r12]&4)<<24>>24!=0?4:0)|HEAP32[r42>>2];r42=HEAP32[r19];L3121:do{if((HEAP32[r42+(r40*764&-1)+48>>2]|0)>0){r43=0;r46=r42;while(1){r23=r43<<1;HEAP16[r46+(r40*764&-1)+(r23<<1)+72>>1]=HEAP16[((r23<<1)+160>>1)+r10];r50=r23|1;HEAP16[HEAP32[r19]+(r40*764&-1)+(r50<<1)+72>>1]=HEAP16[((r50<<1)+160>>1)+r10];r50=r43+1|0;r23=HEAP32[r19];if((r50|0)<(HEAP32[r23+(r40*764&-1)+48>>2]|0)){r43=r50;r46=r23}else{break L3121}}}}while(0);L3125:do{if(HEAP16[r28]<<16>>16==0){r51=r41}else{r42=0;r46=r41;while(1){_fread(r24,13,1,r2);_fread(r18,3,1,r2);r43=_fgetc(r2)&255;r23=_fgetc(r2);HEAP32[r13>>2]=r23<<8&65280|r43|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r43=_fgetc(r2)&255;r23=_fgetc(r2);HEAP32[r17>>2]=r23<<8&65280|r43|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r43=_fgetc(r2)&255;r23=_fgetc(r2);HEAP32[r16>>2]=r23<<8&65280|r43|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r43=_fgetc(r2)&255;r23=_fgetc(r2);HEAP32[r22>>2]=r23<<8&65280|r43|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;HEAP8[r31]=_fgetc(r2)&255;HEAP8[r21]=_fgetc(r2)&255;_fread(r26,14,1,r2);HEAP8[r30]=_fgetc(r2)&255;_fread(r29,5,1,r2);HEAP16[r35>>1]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;r43=_fgetc(r2)&255;r23=_fgetc(r2);HEAP32[r36>>2]=r23<<8&65280|r43|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r43=_fgetc(r2);r23=_fgetc(r2);HEAP32[r37>>2]=r23<<16&16711680|r43<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;HEAP32[HEAP32[HEAP32[r19]+(r40*764&-1)+756>>2]+(r42<<6)+40>>2]=r46;r43=HEAP16[r31>>1];HEAP32[HEAP32[HEAP32[r19]+(r40*764&-1)+756>>2]+(r42<<6)>>2]=r43&255;HEAP32[HEAP32[HEAP32[r19]+(r40*764&-1)+756>>2]+(r42<<6)+8>>2]=(r43&65535)>>>8&65535;HEAP32[HEAP32[r39]+(r46*52&-1)+32>>2]=HEAP32[r13>>2];HEAP32[HEAP32[r39]+(r46*52&-1)+36>>2]=HEAP32[r17>>2];HEAP32[HEAP32[r39]+(r46*52&-1)+40>>2]=HEAP32[r16>>2];r43=HEAP8[r30];HEAP32[HEAP32[r39]+(r46*52&-1)+44>>2]=(r43&1)<<24>>24!=0?2:0;if((r43&4)<<24>>24!=0){r43=HEAP32[r39]+(r46*52&-1)+44|0;HEAP32[r43>>2]=HEAP32[r43>>2]|1;r43=HEAP32[r39]+(r46*52&-1)+32|0;HEAP32[r43>>2]=HEAP32[r43>>2]>>1;r43=HEAP32[r39]+(r46*52&-1)+36|0;HEAP32[r43>>2]=HEAP32[r43>>2]>>1;r43=HEAP32[r39]+(r46*52&-1)+40|0;HEAP32[r43>>2]=HEAP32[r43>>2]>>1}r43=HEAP32[r22>>2];r23=HEAP32[HEAP32[r19]+(r40*764&-1)+756>>2];r50=(r42<<6)+r23+12|0;r52=(r42<<6)+r23+16|0;if((r43|0)==0){HEAP32[r52>>2]=0;HEAP32[r50>>2]=0}else{r23=Math.log((r43|0)/8363)*1536/.6931471805599453&-1;HEAP32[r50>>2]=(r23|0)/128&-1;HEAP32[r52>>2]=(r23|0)%128}r23=HEAP32[r39];if((HEAP32[r23+(r46*52&-1)+32>>2]|0)!=0){_load_sample(r2,0,r23+(HEAP32[HEAP32[HEAP32[r19]+(r40*764&-1)+756>>2]+(r42<<6)+40>>2]*52&-1)|0,0)}r23=r42+1|0;r52=r46+1|0;if((r23|0)<(HEAPU16[r28]|0)){r42=r23;r46=r52}else{r51=r52;break L3125}}}}while(0);r46=r40+1|0;if((r46|0)<(HEAP32[r14]|0)){r40=r46;r41=r51}else{r53=r51;r54=r38;break L3088}}STACKTOP=r6;return r47}else{r53=0;r54=r1+180|0}}while(0);HEAP32[r20]=r53;HEAP32[r54>>2]=_realloc(HEAP32[r54>>2]|0,r53*52&-1);r53=r1+1276|0;HEAP32[r53>>2]=HEAP32[r53>>2]|66081;HEAP32[r4+320]=2;r47=0;STACKTOP=r6;return r47}function _xlat_fx(r1,r2,r3,r4){var r5,r6,r7,r8,r9;r5=HEAP8[r3];r6=r5&15;r7=HEAP8[HEAPU8[r2]+5250916|0];HEAP8[r2]=r7;r8=r7&255;if((r8|0)==0){r7=HEAP8[r3];r9=r4+r1|0;if(r7<<24>>24==0){HEAP8[r3]=HEAP8[r9];return}else{HEAP8[r9]=r7;return}}else if((r8|0)==255){HEAP8[r3]=0;HEAP8[r2]=0;return}else if((r8|0)==253){HEAP8[r2]=2;r7=HEAP8[r3];if((r7&255)<48){HEAP8[r3]=(r7&255)>>>2&15|-32;return}else{HEAP8[r3]=(r7&255)>>>4|-16;return}}else if((r8|0)==14){r7=(r5&255)>>>4&255;if((r7|0)==11){HEAP8[r3]=r6|-32;return}else if((r7|0)==1|(r7|0)==2|(r7|0)==4|(r7|0)==6|(r7|0)==7|(r7|0)==9|(r7|0)==14|(r7|0)==15){HEAP8[r2]=0;HEAP8[r3]=0;return}else if((r7|0)==8){HEAP8[r3]=r6|112;return}else if((r7|0)==5){HEAP8[r3]=r6|64;return}else if((r7|0)==3){HEAP8[r3]=r6|48;return}else if((r7|0)==12){if(r6<<24>>24!=0){return}HEAP8[r3]=0;HEAP8[r2]=0;return}else if((r7|0)==10){HEAP8[r3]=r6|96;return}else{return}}else if((r8|0)==254){HEAP8[r2]=1;r2=HEAP8[r3];if((r2&255)<48){HEAP8[r3]=(r2&255)>>>2&15|-32;return}else{HEAP8[r3]=(r2&255)>>>4|-16;return}}else{return}}function _ims_test(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+1148|0;r6=r5;r7=r5+64,r8=r7>>1;_fread(r7|0,20,1,r1);r9=0;r10=0;L3186:while(1){if(_fread(r7+(r9*30&-1)+20|0,1,20,r1)>>>0<20){r11=-1;r4=2242;break}r12=_fgetc(r1)&65535;HEAP16[((r9*30&-1)+40>>1)+r8]=_fgetc(r1)&255|r12<<8;r12=_fgetc(r1)&65535;r13=_fgetc(r1)&255|r12<<8;HEAP16[((r9*30&-1)+42>>1)+r8]=r13;HEAP8[r7+(r9*30&-1)+44|0]=_fgetc(r1)&255;r12=_fgetc(r1)&255;HEAP8[r7+(r9*30&-1)+45|0]=r12;r14=_fgetc(r1)&65535;r15=_fgetc(r1)&255|r14<<8;HEAP16[((r9*30&-1)+46>>1)+r8]=r15;r14=_fgetc(r1)&65535;r16=_fgetc(r1)&255|r14<<8;HEAP16[((r9*30&-1)+48>>1)+r8]=r16;r14=(r13&65535)<<1;r17=r14+r10|0;r18=0;while(1){if((r18|0)>=20){break}r19=HEAP8[r7+(r9*30&-1)+r18+20|0];if(r19<<24>>24<0){r11=-1;r4=2253;break L3186}if(r19<<24>>24!=0&(r19&255)<32){r11=-1;r4=2244;break L3186}else{r18=r18+1|0}}if((r12&255)>64|(r13&65535)>32768|(r15&65535)>(r13&65535)){r11=-1;r4=2249;break}if(r13<<16>>16!=0){if((r16&65535)>>>0>r14>>>0){r11=-1;r4=2241;break}}r18=r9+1|0;if((r18|0)<31){r9=r18;r10=r17}else{r4=2223;break}}if(r4==2249){STACKTOP=r5;return r11}else if(r4==2223){if((r17|0)<8){r11=-1;STACKTOP=r5;return r11}r17=r7+950|0;HEAP8[r17]=_fgetc(r1)&255;r10=r7+951|0;HEAP8[r10]=_fgetc(r1)&255;_fread(r7+952|0,128,1,r1);_fread(r7+1080|0,4,1,r1);if(HEAPU8[r10]>1){r11=-1;STACKTOP=r5;return r11}if(HEAP8[r7+1083|0]<<24>>24!=60){r11=-1;STACKTOP=r5;return r11}r10=HEAP8[r17];if(r10<<24>>24<1){r11=-1;STACKTOP=r5;return r11}r17=r10&255;r9=0;r8=0;while(1){r18=HEAPU8[r7+(r9+952)|0];r20=(r18|0)>(r8|0)?r18:r8;r18=r9+1|0;if((r18|0)<(r17|0)){r9=r18;r8=r20}else{break}}if((r20+1|0)>127|r10<<24>>24==0|r10<<24>>24<0){r11=-1;STACKTOP=r5;return r11}_fseek(r1,r3,0);r3=r6|0;if((r2|0)==0){r11=0;STACKTOP=r5;return r11}_memset(r2,0,21);_fread(r3,1,20,r1);HEAP8[r6+20|0]=0;_memset(r2,0,21);_strncpy(r2,r3,20);r3=HEAP8[r2];if(r3<<24>>24==0){r11=0;STACKTOP=r5;return r11}else{r21=0;r22=r2;r23=r3}while(1){do{if((_isprint(r23<<24>>24)|0)==0){r4=2235}else{if(HEAP8[r22]<<24>>24<0){r4=2235;break}else{break}}}while(0);if(r4==2235){r4=0;HEAP8[r22]=46}r14=r21+1|0;r16=r2+r14|0;r13=HEAP8[r16];if(r13<<24>>24!=0&(r14|0)<20){r21=r14;r22=r16;r23=r13}else{break}}if(HEAP8[r2]<<24>>24==0){r11=0;STACKTOP=r5;return r11}while(1){r23=r2+(_strlen(r2)-1)|0;if(HEAP8[r23]<<24>>24!=32){r11=0;r4=2247;break}HEAP8[r23]=0;if(HEAP8[r2]<<24>>24==0){r11=0;r4=2248;break}}if(r4==2248){STACKTOP=r5;return r11}else if(r4==2247){STACKTOP=r5;return r11}}else if(r4==2241){STACKTOP=r5;return r11}else if(r4==2244){STACKTOP=r5;return r11}else if(r4==2253){STACKTOP=r5;return r11}else if(r4==2242){STACKTOP=r5;return r11}}function _ims_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+1088|0;r6=r5,r7=r6>>1;r8=r5+1084;_fseek(r2,r3,0);r3=(r1+140|0)>>2;HEAP32[r3]=31;r9=(r1+144|0)>>2;HEAP32[r9]=31;r10=r6|0;_fread(r10,20,1,r2);r11=0;while(1){_fread(r6+(r11*30&-1)+20|0,20,1,r2);r12=_fgetc(r2)&65535;HEAP16[((r11*30&-1)+40>>1)+r7]=_fgetc(r2)&255|r12<<8;r12=_fgetc(r2)&65535;HEAP16[((r11*30&-1)+42>>1)+r7]=_fgetc(r2)&255|r12<<8;HEAP8[r6+(r11*30&-1)+44|0]=_fgetc(r2)&255;HEAP8[r6+(r11*30&-1)+45|0]=_fgetc(r2)&255;r12=_fgetc(r2)&65535;HEAP16[((r11*30&-1)+46>>1)+r7]=_fgetc(r2)&255|r12<<8;r12=_fgetc(r2)&65535;HEAP16[((r11*30&-1)+48>>1)+r7]=_fgetc(r2)&255|r12<<8;r12=r11+1|0;if((r12|0)==31){break}else{r11=r12}}r11=r6+950|0;HEAP8[r11]=_fgetc(r2)&255;HEAP8[r6+951|0]=_fgetc(r2)&255;r12=r6+952|0;_fread(r12,128,1,r2);_fread(r6+1080|0,4,1,r2);r13=HEAP8[r11];r11=r13&255;HEAP32[r1+156>>2]=r11;_memcpy(r1+952|0,r12,r11);r12=r1+128|0;r14=HEAP32[r12>>2];L3248:do{if(r13<<24>>24==0){r15=r14}else{r16=0;r17=r14;while(1){r18=HEAPU8[r1+(r16+952)|0];if((r18|0)>(r17|0)){HEAP32[r12>>2]=r18;r19=r18}else{r19=r17}r18=r16+1|0;if((r18|0)<(r11|0)){r16=r18;r17=r19}else{r15=r19;break L3248}}}}while(0);r19=(r1+128|0)>>2;r11=r15+1|0;HEAP32[r19]=r11;r15=(r1+136|0)>>2;r12=r1+132|0;HEAP32[r12>>2]=Math.imul(HEAP32[r15],r11);_strncpy(r1|0,r10,20);_set_type(r1,5267416,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r10=(r1+176|0)>>2;HEAP32[r10]=_calloc(764,HEAP32[r3]);r11=HEAP32[r9];if((r11|0)!=0){HEAP32[r1+180>>2]=_calloc(52,r11)}L3258:do{if((HEAP32[r3]|0)>0){r11=(r1+180|0)>>2;r14=0;while(1){r13=_calloc(64,1);HEAP32[HEAP32[r10]+(r14*764&-1)+756>>2]=r13;HEAP32[HEAP32[r11]+(r14*52&-1)+32>>2]=HEAPU16[((r14*30&-1)+42>>1)+r7]<<1;r13=HEAP32[r11];r17=HEAP16[((r14*30&-1)+48>>1)+r7];HEAP32[r13+(r14*52&-1)+40>>2]=((r17&65535)<<1)+HEAP32[r13+(r14*52&-1)+36>>2]|0;HEAP32[HEAP32[r11]+(r14*52&-1)+44>>2]=(r17&65535)>1?2:0;HEAP32[HEAP32[HEAP32[r10]+(r14*764&-1)+756>>2]+16>>2]=0;HEAP32[HEAP32[HEAP32[r10]+(r14*764&-1)+756>>2]>>2]=HEAPU8[r6+(r14*30&-1)+45|0];HEAP32[HEAP32[HEAP32[r10]+(r14*764&-1)+756>>2]+8>>2]=128;HEAP32[HEAP32[HEAP32[r10]+(r14*764&-1)+756>>2]+40>>2]=r14;HEAP32[HEAP32[r10]+(r14*764&-1)+36>>2]=(HEAP32[HEAP32[r11]+(r14*52&-1)+32>>2]|0)!=0&1;HEAP32[HEAP32[r10]+(r14*764&-1)+40>>2]=4095;r17=HEAP32[r10];r13=r17+(r14*764&-1)|0;_memset(r13,0,21);_strncpy(r13,r6+(r14*30&-1)+20|0,20);r16=HEAP8[r13];L3262:do{if(r16<<24>>24!=0){r18=0;r20=r13;r21=r16;while(1){do{if((_isprint(r21<<24>>24)|0)==0){r4=2269}else{if(HEAP8[r20]<<24>>24<0){r4=2269;break}else{break}}}while(0);if(r4==2269){r4=0;HEAP8[r20]=46}r22=r18+1|0;r23=r17+(r14*764&-1)+r22|0;r24=HEAP8[r23];if(r24<<24>>24!=0&(r22|0)<20){r18=r22;r20=r23;r21=r24}else{break}}if(HEAP8[r13]<<24>>24==0){break}while(1){r21=_strlen(r13)-1+r17+(r14*764&-1)|0;if(HEAP8[r21]<<24>>24!=32){break L3262}HEAP8[r21]=0;if(HEAP8[r13]<<24>>24==0){break L3262}}}}while(0);r13=r14+1|0;if((r13|0)<(HEAP32[r3]|0)){r14=r13}else{break L3258}}}}while(0);r3=(r1+172|0)>>2;HEAP32[r3]=_calloc(4,HEAP32[r12>>2]);r12=(r1+168|0)>>2;HEAP32[r12]=_calloc(4,HEAP32[r19]+1|0);L3276:do{if((HEAP32[r19]|0)>0){r6=r8|0;r7=r8+1|0;r14=r8+2|0;r11=0;while(1){r13=_calloc(1,(HEAP32[r15]<<2)+4|0);HEAP32[HEAP32[r12]+(r11<<2)>>2]=r13;HEAP32[HEAP32[HEAP32[r12]+(r11<<2)>>2]>>2]=64;r13=HEAP32[r15];L3280:do{if((r13|0)>0){r17=0;r16=r13;while(1){r21=Math.imul(r16,r11)+r17|0;HEAP32[HEAP32[HEAP32[r12]+(r11<<2)>>2]+(r17<<2)+4>>2]=r21;r21=_calloc(HEAP32[HEAP32[HEAP32[r12]+(r11<<2)>>2]>>2]<<3|4,1);r20=Math.imul(HEAP32[r15],r11)+r17|0;HEAP32[HEAP32[r3]+(r20<<2)>>2]=r21;r21=HEAP32[HEAP32[HEAP32[r12]+(r11<<2)>>2]>>2];r20=Math.imul(HEAP32[r15],r11)+r17|0;HEAP32[HEAP32[HEAP32[r3]+(r20<<2)>>2]>>2]=r21;r21=r17+1|0;r20=HEAP32[r15];if((r21|0)<(r20|0)){r17=r21;r16=r20}else{r25=0;break L3280}}}else{r25=0}}while(0);while(1){r13=r25>>2;r16=HEAP32[HEAP32[r3]+(HEAP32[HEAP32[HEAP32[r12]+(r11<<2)>>2]+((r25&3)<<2)+4>>2]<<2)>>2];_fread(r6,1,3,r2);r17=HEAP8[r6];r20=r17&63;r21=(r13<<3)+r16+4|0;HEAP8[r21]=r20;if(r20<<24>>24==0|r20<<24>>24==63){r26=0}else{r26=r20+33&255}HEAP8[r21]=r26;r21=HEAP8[r7];HEAP8[(r13<<3)+r16+5|0]=(r17&255)>>>2&16|(r21&255)>>>4;r17=r21&15;r21=(r13<<3)+r16+7|0;HEAP8[r21]=r17;r20=HEAP8[r14];r18=(r13<<3)+r16+8|0;HEAP8[r18]=r20;do{if(r20<<24>>24==0){r16=r17&255;if((r16|0)==5){HEAP8[r21]=3;break}else if((r16|0)==6){HEAP8[r21]=4;break}else if((r16|0)==1|(r16|0)==2|(r16|0)==10){HEAP8[r21]=0;break}else{r4=2285;break}}else{r4=2285}}while(0);do{if(r4==2285){r4=0;if(r17<<24>>24!=13){break}HEAP8[r18]=Math.floor((r20&255)/10)<<4|(r20&255)%10}}while(0);r20=r25+1|0;if((r20|0)==256){break}else{r25=r20}}r20=r11+1|0;if((r20|0)<(HEAP32[r19]|0)){r11=r20}else{break L3276}}}}while(0);r19=r1+1276|0;HEAP32[r19>>2]=HEAP32[r19>>2]|8192;r19=HEAP32[r9];if((r19|0)<=0){STACKTOP=r5;return 0}r25=r1+180|0;r1=0;r4=r19;while(1){r19=HEAP32[r25>>2];if((HEAP32[r19+(r1*52&-1)+32>>2]|0)==0){r27=r4}else{_load_sample(r2,0,r19+(HEAP32[HEAP32[HEAP32[r10]+(r1*764&-1)+756>>2]+40>>2]*52&-1)|0,0);r27=HEAP32[r9]}r19=r1+1|0;if((r19|0)<(r27|0)){r1=r19;r4=r27}else{break}}STACKTOP=r5;return 0}function _it_test(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+64|0;r5=r4;r6=_fgetc(r1);r7=_fgetc(r1);if((r7<<16&16711680|r6<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255|0)!=1229803597){r8=-1;STACKTOP=r4;return r8}r6=r5|0;if((r2|0)==0){r8=0;STACKTOP=r4;return r8}_memset(r2,0,27);_fread(r6,1,26,r1);HEAP8[r5+26|0]=0;_memset(r2,0,27);_strncpy(r2,r6,26);r6=HEAP8[r2];if(r6<<24>>24==0){r8=0;STACKTOP=r4;return r8}else{r9=0;r10=r2;r11=r6}while(1){do{if((_isprint(r11<<24>>24)|0)==0){r3=2303}else{if(HEAP8[r10]<<24>>24<0){r3=2303;break}else{break}}}while(0);if(r3==2303){r3=0;HEAP8[r10]=46}r6=r9+1|0;r5=r2+r6|0;r1=HEAP8[r5];if(r1<<24>>24!=0&(r6|0)<26){r9=r6;r10=r5;r11=r1}else{break}}if(HEAP8[r2]<<24>>24==0){r8=0;STACKTOP=r4;return r8}while(1){r11=r2+(_strlen(r2)-1)|0;if(HEAP8[r11]<<24>>24!=32){r8=0;r3=2313;break}HEAP8[r11]=0;if(HEAP8[r2]<<24>>24==0){r8=0;r3=2309;break}}if(r3==2313){STACKTOP=r4;return r8}else if(r3==2309){STACKTOP=r4;return r8}}function _it_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92,r93,r94,r95,r96,r97,r98,r99,r100,r101,r102,r103,r104,r105,r106,r107,r108,r109,r110,r111,r112,r113,r114,r115,r116,r117,r118,r119,r120,r121,r122,r123,r124,r125,r126,r127,r128,r129,r130,r131,r132,r133,r134,r135,r136,r137,r138,r139,r140,r141,r142,r143,r144,r145,r146,r147,r148,r149,r150,r151,r152,r153;r4=r1>>2;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+2304|0;r7=r6;r8=r6+8;r9=r6+520;r10=r6+712;r11=r6+1268;r12=r6+1572;r13=r6+1652,r14=r13>>1;r15=r6+1760;r16=r6+1824;r17=r16;r18=STACKTOP>>2;STACKTOP=STACKTOP+484|0;r19=STACKTOP;STACKTOP=STACKTOP+40|0;r20=STACKTOP;STACKTOP=STACKTOP+64|0;r21=STACKTOP;STACKTOP=STACKTOP+64|0;r22=STACKTOP,r23=r22>>2;STACKTOP=STACKTOP+44|0;r24=STACKTOP;STACKTOP=STACKTOP+4|0;_fseek(r2,r3,0);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r25=r9+4|0;_fread(r25,26,1,r2);r26=r9+30|0;HEAP8[r26]=_fgetc(r2)&255;r27=r9+31|0;HEAP8[r27]=_fgetc(r2)&255;r28=r9+32|0;HEAP16[r28>>1]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;r29=r9+34|0;HEAP16[r29>>1]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;r30=r9+36|0;HEAP16[r30>>1]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;r31=r9+38|0;HEAP16[r31>>1]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;r32=r9+40|0;HEAP16[r32>>1]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;r33=(r9+42|0)>>1;HEAP16[r33]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;r34=r9+44|0;HEAP16[r34>>1]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;HEAP16[r9+46>>1]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;r35=r9+48|0;HEAP8[r35]=_fgetc(r2)&255;HEAP8[r9+49|0]=_fgetc(r2)&255;r36=r9+50|0;HEAP8[r36]=_fgetc(r2)&255;HEAP8[r9+51|0]=_fgetc(r2)&255;r37=r9+52|0;HEAP8[r37]=_fgetc(r2)&255;HEAP8[r9+53|0]=_fgetc(r2)&255;r38=(r9+54|0)>>1;HEAP16[r38]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;r39=_fgetc(r2)&255;r40=_fgetc(r2);r41=(r9+56|0)>>2;HEAP32[r41]=r40<<8&65280|r39|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r39=_fgetc(r2)&255;r40=_fgetc(r2);r42=r9+60|0;HEAP32[r42>>2]=r40<<8&65280|r39|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;_fread(r9+64|0,64,1,r2);_fread(r9+128|0,64,1,r2);_strncpy(r1|0,r25,64);r25=HEAP32[r28>>2];r39=(r1+156|0)>>2;HEAP32[r39]=r25&65535;r40=r25>>>16;r25=(r1+140|0)>>2;HEAP32[r25]=r40;r43=HEAP32[r30>>2];r30=r43&65535;r44=(r1+144|0)>>2;HEAP32[r44]=r30;r45=(r1+128|0)>>2;HEAP32[r45]=r43>>>16;if((r40|0)==0){r46=0;r47=r30}else{r46=_calloc(4,r40);r47=HEAP32[r44]}r40=_calloc(4,r47);r47=r40;r30=_calloc(4,HEAP32[r45]);r43=r30;r48=HEAP16[r36>>1];HEAP32[r4+37]=r48&255;HEAP32[r4+38]=(r48&65535)>>>8&65535;r48=HEAP16[r34>>1];if((r48&8)<<16>>16!=0){r36=r1+1276|0;HEAP32[r36>>2]=HEAP32[r36>>2]|4096}do{if((r48&4)<<16>>16!=0){if(HEAPU16[r33]<=511){break}r36=r1+1276|0;HEAP32[r36>>2]=HEAP32[r36>>2]|16384}}while(0);r48=(r1+136|0)>>2;HEAP32[r48]=64;r36=0;while(1){r49=r9+(r36+64)|0;r50=HEAP8[r49];do{if(r50<<24>>24==100){HEAP8[r49]=32;r51=32}else{if(r50<<24>>24>=0){r51=r50;break}HEAP8[r9+(r36+128)|0]=0;r52=r1+(r36*12&-1)+192|0;HEAP32[r52>>2]=HEAP32[r52>>2]|2;r51=r50}}while(0);do{if((HEAP16[r34>>1]&1)<<16>>16==0){HEAP32[((r36*12&-1)+184>>2)+r4]=128}else{r50=(r51&255)<<2;r49=r1+(r36*12&-1)+184|0;HEAP32[r49>>2]=r50;if(r50>>>0<=255){break}HEAP32[r49>>2]=255}}while(0);HEAP32[((r36*12&-1)+188>>2)+r4]=HEAPU8[r9+(r36+128)|0];r49=r36+1|0;if((r49|0)==64){break}else{r36=r49}}_fread(r1+952|0,1,HEAP32[r39],r2);r36=HEAP16[r34>>1]&16;r9=HEAP32[r39];L3358:do{if((r9-1|0)>0){r51=0;r49=r9;while(1){r50=r1+(r51+952)|0;r52=r51+1|0;if(HEAP8[r50]<<24>>24==-2){_memmove(r50,r1+(r52+952)|0,r49+(r51^-1)|0,1,0);r50=HEAP32[r39]-1|0;HEAP32[r39]=r50;r53=r50}else{r53=r49}if((r52|0)<(r53-1|0)){r51=r52;r49=r53}else{break L3358}}}}while(0);L3365:do{if((HEAP32[r25]|0)>0){r53=0;while(1){r39=_fgetc(r2)&255;r9=_fgetc(r2);HEAP32[r46+(r53<<2)>>2]=r9<<8&65280|r39|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r39=r53+1|0;if((r39|0)<(HEAP32[r25]|0)){r53=r39}else{break L3365}}}}while(0);L3369:do{if((HEAP32[r44]|0)>0){r53=0;while(1){r39=_fgetc(r2)&255;r9=_fgetc(r2);HEAP32[r47+(r53<<2)>>2]=r9<<8&65280|r39|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r39=r53+1|0;if((r39|0)<(HEAP32[r44]|0)){r53=r39}else{break L3369}}}}while(0);L3373:do{if((HEAP32[r45]|0)>0){r53=0;while(1){r39=_fgetc(r2)&255;r9=_fgetc(r2);HEAP32[r43+(r53<<2)>>2]=r9<<8&65280|r39|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r39=r53+1|0;if((r39|0)<(HEAP32[r45]|0)){r53=r39}else{break L3373}}}}while(0);HEAP32[r4+315]=8363;r53=HEAP32[r32>>2];r32=r53&65535;r39=r53&65535;r9=r39>>>8;L3377:do{if((r9|0)==8|(r9|0)==127){if(r32<<16>>16==2184){r49=r19|0;_memcpy(r49,5262684,14);r54=r49;break}r49=r19|0;if(r32<<16>>16==32767){_memcpy(r49,5268096,9);r54=r49;break}else{_snprintf(r49,40,5262760,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r39,tempInt));r54=r49;break}}else if((r9|0)==0){r49=r19|0;HEAP8[r49]=HEAP8[5267408];HEAP8[r49+1|0]=HEAP8[5267409|0];HEAP8[r49+2|0]=HEAP8[5267410|0];HEAP8[r49+3|0]=HEAP8[5267411|0];HEAP8[r49+4|0]=HEAP8[5267412|0];HEAP8[r49+5|0]=HEAP8[5267413|0];r54=r49}else if((r9|0)==1|(r9|0)==2){do{if((r53&-65536|0)==33554432){if(r32<<16>>16==535){r49=r19|0;_memcpy(r49,5265244,21);HEAP16[r33]=(HEAP16[r34>>1]&4)<<16>>16!=0?532:256;r54=r49;break L3377}else if(r32<<16>>16==534){r5=2357;break}else if(r32<<16>>16!=532){break}r49=HEAP32[r34>>2];if(!((r49&65535)<<16>>16==9&r49>>>0<65536)){r5=2359;break}if(HEAP8[r27]<<24>>24!=0){r5=2359;break}if(HEAP8[r26]<<24>>24!=0){r5=2359;break}if(HEAP16[r29>>1]<<16>>16!=0){r5=2359;break}if((HEAPU16[r31>>1]+1|0)!=(HEAPU16[r28>>1]|0)){r5=2359;break}if((HEAP32[r35>>2]&16777215|0)!=91264){r5=2359;break}r49=HEAP32[r37>>2];if(!((r49&65535|0)==128&r49>>>0<65536)){r5=2359;break}if((HEAP32[r41]|0)!=0){r5=2359;break}if((HEAP32[r42>>2]|0)!=0){r5=2359;break}r49=r19|0;_memcpy(r49,5266116,19);r54=r49;break L3377}else{if(r32<<16>>16==532){r5=2359;break}else if(r32<<16>>16==534){r5=2357;break}else if(r32<<16>>16!=535){break}r49=r19|0;_memcpy(r49,5264440,23);r54=r49;break L3377}}while(0);if(r5==2357){r49=r19|0;_memcpy(r49,5265e3,23);r54=r49;break}do{if(r5==2359){if((_memcmp(r42,5263516,4)|0)!=0){break}r49=r19|0;_memcpy(r49,5263088,14);r54=r49;break L3377}}while(0);r49=r19|0;_snprintf(r49,40,5263880,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r9&15,HEAP32[tempInt+4>>2]=r53&255,tempInt));r54=r49}else{r49=r39>>>12;if((r49|0)==1){r51=r32&4095;r52=r51&65535;if((r51&65535)<=80){r51=r19|0;_snprintf(r51,40,5267336,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r52,tempInt));r54=r51;break}HEAP32[r24>>2]=(r52*86400&-1)+1247443200|0;r52=r19|0;if((_localtime_r(r24,r22)|0)==0){r54=r52;break}r51=HEAP32[r23+4]+1|0;r50=HEAP32[r23+3];_snprintf(r52,40,5267556,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=HEAP32[r23+5]+1900|0,HEAP32[tempInt+4>>2]=r51,HEAP32[tempInt+8>>2]=r50,tempInt));r54=r52;break}else if((r49|0)==5){r49=r19|0;_snprintf(r49,40,5263e3,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r9&15,HEAP32[tempInt+4>>2]=r53&255,tempInt));if((_memcmp(r42,5266976,4)|0)==0){r54=r49;break}_memcpy(r19+_strlen(r49)|0,5266660,11);r54=r49;break}else{r49=r19|0;_snprintf(r49,40,5262760,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r39,tempInt));r54=r49;break}}}while(0);r39=HEAPU16[r33];_set_type(r1,5266544,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=r54,HEAP32[tempInt+4>>2]=r39>>>8,HEAP32[tempInt+8>>2]=r39&255,tempInt));r39=HEAP32[r34>>2];if((r39&4|0)==0){HEAP32[r25]=HEAP32[r44]}if((r39&65536|0)!=0){r39=_malloc(HEAPU16[r38]+1|0);r54=(r1+1220|0)>>2;HEAP32[r54]=r39;if((r39|0)==0){r55=-1;STACKTOP=r6;return r55}r39=_ftell(r2);_fseek(r2,HEAP32[r41]+r3|0,0);L3428:do{if(HEAP16[r38]<<16>>16==0){r56=0}else{r41=0;while(1){r19=_fgetc(r2)&255;r42=r19<<24>>24==13?10:r19;HEAP8[HEAP32[r54]+r41|0]=r42<<24>>24>-1&(r42&255)>31|r42<<24>>24==10|r42<<24>>24==9?r42:46;r42=r41+1|0;if((r42|0)<(HEAPU16[r38]|0)){r41=r42}else{r56=r42;break L3428}}}}while(0);HEAP8[HEAP32[r54]+r56|0]=0;_fseek(r2,r39,0)}r39=(r1+176|0)>>2;HEAP32[r39]=_calloc(764,HEAP32[r25]);r56=HEAP32[r44];if((r56|0)!=0){HEAP32[r4+45]=_calloc(52,r56)}L3436:do{if((HEAP32[r25]|0)>0){r56=r10|0;r54=r10+4|0;r38=r10+16|0;r41=r10+17|0;r42=r10+18|0;r19=r10+19|0;r53=r10+20|0;r9=r10+21|0;r23=r10+22|0;r22=r10+24|0;r24=r10+26|0;r32=r10+27|0;r37=r10+28|0;r35=r10+30|0;r28=r10+31|0;r31=r10+32|0;r29=r10+58|0;r26=r10+64|0;r27=r10+304|0;r49=r10+504|0;r52=r11+24|0;r50=r11|0;r51=r11+4|0;r57=r11+16|0;r58=r11+17|0;r59=r11+18|0;r60=r11+19|0;r61=r11+20|0;r62=r11+22|0;r63=r11+23|0;r64=r11+25|0;r65=r11+26|0;r66=r11+27|0;r67=r11+28|0;r68=r11+30|0;r69=r11+31|0;r70=r11+32|0;r71=r11+58|0;r72=r11+59|0;r73=r11+60|0;r74=r11+61|0;r75=r11+62|0;r76=r11+64|0;r77=r13|0;r78=r13+1|0;r79=r13+2|0;r80=r13+3|0;r81=r13+4|0;r82=r13+5|0;r83=r13+106|0;r84=0;while(1){r85=HEAP32[r39];r86=r85+(r84*764&-1)|0;L3440:do{if((HEAP16[r34>>1]&4)<<16>>16!=0){r87=HEAPU16[r33]>511;_fseek(r2,HEAP32[r46+(r84<<2)>>2]+r3|0,0);r88=_fgetc(r2);r89=_fgetc(r2);r90=r89<<16&16711680|r88<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;if(!r87){HEAP32[r56>>2]=r90;_fread(r54,12,1,r2);HEAP8[r38]=_fgetc(r2)&255;HEAP8[r41]=_fgetc(r2)&255;HEAP8[r42]=_fgetc(r2)&255;HEAP8[r19]=_fgetc(r2)&255;HEAP8[r53]=_fgetc(r2)&255;HEAP8[r9]=_fgetc(r2)&255;HEAP16[r23>>1]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;HEAP16[r22>>1]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;HEAP8[r24]=_fgetc(r2)&255;HEAP8[r32]=_fgetc(r2)&255;HEAP16[r37>>1]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;HEAP8[r35]=_fgetc(r2)&255;HEAP8[r28]=_fgetc(r2)&255;_fread(r31,26,1,r2);r87=0;while(1){r88=r10+(r87+32)|0;if(HEAP8[r88]<<24>>24==0){HEAP8[r88]=32}r88=r87+1|0;if((r88|0)==25){r91=24;break}else{r87=r88}}while(1){r87=r10+(r91+32)|0;if(HEAP8[r87]<<24>>24!=32){break}HEAP8[r87]=0;if((r91|0)>0){r91=r91-1|0}else{break}}_fread(r29,6,1,r2);_fread(r26,240,1,r2);_fread(r27,200,1,r2);_fread(r49,50,1,r2);r87=r86|0;_memset(r87,0,26);_strncpy(r87,r31,25);r88=HEAP8[r87];L3453:do{if(r88<<24>>24!=0){r89=0;r92=r87;r93=r88;while(1){do{if((_isprint(r93<<24>>24)|0)==0){r5=2446}else{if(HEAP8[r92]<<24>>24<0){r5=2446;break}else{break}}}while(0);if(r5==2446){r5=0;HEAP8[r92]=46}r94=r89+1|0;r95=r85+(r84*764&-1)+r94|0;r96=HEAP8[r95];if(r96<<24>>24!=0&(r94|0)<25){r89=r94;r92=r95;r93=r96}else{break}}if(HEAP8[r87]<<24>>24==0){break}while(1){r93=_strlen(r87)-1+r85+(r84*764&-1)|0;if(HEAP8[r93]<<24>>24!=32){break L3453}HEAP8[r93]=0;if(HEAP8[r87]<<24>>24==0){break L3453}}}}while(0);HEAP32[r85+(r84*764&-1)+40>>2]=HEAPU16[r22>>1]<<6;r87=(r85+(r84*764&-1)+44|0)>>2;HEAP32[r87]=0;r88=HEAP8[r41];if((r88&1)<<24>>24==0){r97=r88;r98=0}else{HEAP32[r87]=1;r97=HEAP8[r41];r98=1}if((r97&2)<<24>>24==0){r99=r97;r100=r98}else{r88=r98|4;HEAP32[r87]=r88;r99=HEAP8[r41];r100=r88}if((r99&4)<<24>>24==0){r101=r99;r102=r100}else{r88=r100|18;HEAP32[r87]=r88;r101=HEAP8[r41];r102=r88}if((r101&8)<<24>>24!=0){HEAP32[r87]=r102|34}HEAP32[r85+(r84*764&-1)+64>>2]=HEAPU8[r42];HEAP32[r85+(r84*764&-1)+68>>2]=HEAPU8[r19];HEAP32[r85+(r84*764&-1)+56>>2]=HEAPU8[r53];HEAP32[r85+(r84*764&-1)+60>>2]=HEAPU8[r9];r87=0;while(1){if(HEAP8[(r87<<1)+r10+504|0]<<24>>24==-1){break}else{r87=r87+1|0}}HEAP32[r85+(r84*764&-1)+48>>2]=r87;L3481:do{if((r87|0)!=0){r88=r87;while(1){r93=r88-1|0;r92=r93<<1;HEAP16[r85+(r84*764&-1)+(r92<<1)+72>>1]=HEAPU8[r10+(r92+504)|0];r89=r92|1;HEAP16[r85+(r84*764&-1)+(r89<<1)+72>>1]=HEAPU8[r10+(r89+504)|0];if((r93|0)==0){break L3481}else{r88=r93}}}}while(0);_memset(r17,-1,484);r87=0;r88=0;while(1){r93=r88<<1;r89=HEAPU8[r10+(r93+89)|0]-1|0;if((r89|0)<0){HEAP8[(r88<<1)+r85+(r84*764&-1)+512|0]=-1;HEAP8[(r88<<1)+r85+(r84*764&-1)+513|0]=0;r103=r87}else{r92=(r89<<2)+r16|0;r96=HEAP32[r92>>2];if((r96|0)==-1){HEAP32[r92>>2]=r87;HEAP32[(r87<<2>>2)+r18]=r89;r104=r87+1|0;r105=r87}else{r104=r87;r105=r96}HEAP8[(r88<<1)+r85+(r84*764&-1)+512|0]=r105&255;HEAP8[(r88<<1)+r85+(r84*764&-1)+513|0]=-12-r88+HEAPU8[r10+(r93+88)|0]&255;r103=r104}r93=r88+1|0;if((r93|0)==121){break}else{r87=r103;r88=r93}}HEAP32[r85+(r84*764&-1)+36>>2]=r103;HEAP32[r85+(r84*764&-1)+32>>2]=HEAPU8[r52]>>>1;if((r103|0)==0){break}r88=_calloc(64,r103);r87=(r85+(r84*764&-1)+756|0)>>2;HEAP32[r87]=r88;if((r103|0)>0){r106=0;r107=r88}else{break}while(1){HEAP32[r107+(r106<<6)+40>>2]=HEAP32[(r106<<2>>2)+r18];HEAP32[HEAP32[r87]+(r106<<6)+44>>2]=HEAPU8[r24];HEAP32[HEAP32[r87]+(r106<<6)+48>>2]=HEAP8[r32]<<24>>24!=0&1;HEAP32[HEAP32[r87]+(r106<<6)+52>>2]=0;HEAP32[HEAP32[r87]+(r106<<6)+8>>2]=128;r88=r106+1|0;if((r88|0)==(r103|0)){break L3440}r106=r88;r107=HEAP32[r87]}}HEAP32[r50>>2]=r90;_fread(r51,12,1,r2);HEAP8[r57]=_fgetc(r2)&255;HEAP8[r58]=_fgetc(r2)&255;HEAP8[r59]=_fgetc(r2)&255;HEAP8[r60]=_fgetc(r2)&255;HEAP16[r61>>1]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;HEAP8[r62]=_fgetc(r2)&255;HEAP8[r63]=_fgetc(r2)&255;HEAP8[r52]=_fgetc(r2)&255;HEAP8[r64]=_fgetc(r2)&255;HEAP8[r65]=_fgetc(r2)&255;HEAP8[r66]=_fgetc(r2)&255;HEAP16[r67>>1]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;HEAP8[r68]=_fgetc(r2)&255;HEAP8[r69]=_fgetc(r2)&255;_fread(r70,26,1,r2);r87=0;while(1){r88=r11+(r87+32)|0;if(HEAP8[r88]<<24>>24==0){HEAP8[r88]=32}r88=r87+1|0;if((r88|0)==25){r108=24;break}else{r87=r88}}while(1){r87=r11+(r108+32)|0;if(HEAP8[r87]<<24>>24!=32){break}HEAP8[r87]=0;if((r108|0)>0){r108=r108-1|0}else{break}}HEAP8[r71]=_fgetc(r2)&255;HEAP8[r72]=_fgetc(r2)&255;HEAP8[r73]=_fgetc(r2)&255;HEAP8[r74]=_fgetc(r2)&255;HEAP16[r75>>1]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;_fread(r76,240,1,r2);r87=r86|0;_memset(r87,0,26);_strncpy(r87,r70,25);r90=HEAP8[r87];L3509:do{if(r90<<24>>24!=0){r88=0;r93=r87;r96=r90;while(1){do{if((_isprint(r96<<24>>24)|0)==0){r5=2400}else{if(HEAP8[r93]<<24>>24<0){r5=2400;break}else{break}}}while(0);if(r5==2400){r5=0;HEAP8[r93]=46}r89=r88+1|0;r92=r85+(r84*764&-1)+r89|0;r95=HEAP8[r92];if(r95<<24>>24!=0&(r89|0)<25){r88=r89;r93=r92;r96=r95}else{break}}if(HEAP8[r87]<<24>>24==0){break}while(1){r96=_strlen(r87)-1+r85+(r84*764&-1)|0;if(HEAP8[r96]<<24>>24!=32){break L3509}HEAP8[r96]=0;if(HEAP8[r87]<<24>>24==0){break L3509}}}}while(0);HEAP32[r85+(r84*764&-1)+40>>2]=HEAPU16[r61>>1]<<5;HEAP8[r77]=_fgetc(r2)&255;HEAP8[r78]=_fgetc(r2)&255;HEAP8[r79]=_fgetc(r2)&255;HEAP8[r80]=_fgetc(r2)&255;HEAP8[r81]=_fgetc(r2)&255;HEAP8[r82]=_fgetc(r2)&255;r87=0;r90=_fgetc(r2)&255;while(1){HEAP8[(r87<<2)+r13+6|0]=r90;HEAP16[((r87<<2)+8>>1)+r14]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;r96=r87+1|0;r109=_fgetc(r2)&255;if((r96|0)==25){break}else{r87=r96;r90=r109}}HEAP8[r83]=r109;r90=r13>>1;r87=HEAP16[r90];r96=r87&255;HEAP32[r85+(r84*764&-1)+44>>2]=((r96&2)<<24>>24!=0?4:0)|r96&1|((r96&4)<<24>>24!=0?18:0)|((r96&8)<<24>>24!=0?32:0);r96=(r87&65535)>>>8;r87=r96&65535;HEAP32[r85+(r84*764&-1)+48>>2]=r87;r93=r81>>1;r88=HEAP16[r93];HEAP32[r85+(r84*764&-1)+56>>2]=r88&255;HEAP32[r85+(r84*764&-1)+60>>2]=(r88&65535)>>>8&65535;r88=r79>>1;r95=HEAP16[r88];HEAP32[r85+(r84*764&-1)+64>>2]=r95&255;HEAP32[r85+(r84*764&-1)+68>>2]=(r95&65535)>>>8&65535;L3525:do{if(r96<<16>>16!=0){r95=0;while(1){r92=r95<<1;HEAP16[r85+(r84*764&-1)+(r92<<1)+72>>1]=HEAP16[((r95<<2)+8>>1)+r14];HEAP16[r85+(r84*764&-1)+((r92|1)<<1)+72>>1]=HEAP8[(r95<<2)+r13+6|0]<<24>>24;r92=r95+1|0;if((r92|0)<(r87|0)){r95=r92}else{break L3525}}}}while(0);HEAP8[r77]=_fgetc(r2)&255;HEAP8[r78]=_fgetc(r2)&255;HEAP8[r79]=_fgetc(r2)&255;HEAP8[r80]=_fgetc(r2)&255;HEAP8[r81]=_fgetc(r2)&255;HEAP8[r82]=_fgetc(r2)&255;r87=0;r96=_fgetc(r2)&255;while(1){HEAP8[(r87<<2)+r13+6|0]=r96;HEAP16[((r87<<2)+8>>1)+r14]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;r95=r87+1|0;r110=_fgetc(r2)&255;if((r95|0)==25){break}else{r87=r95;r96=r110}}HEAP8[r83]=r110;r96=HEAP16[r90];r87=r96&255;r95=r85+(r84*764&-1)+200|0;HEAP32[r95>>2]=((r87&2)<<24>>24!=0?4:0)|r87&1|((r87&4)<<24>>24!=0?18:0)|((r87&8)<<24>>24!=0?32:0);r87=(r96&65535)>>>8;r96=r87&65535;r92=(r85+(r84*764&-1)+204|0)>>2;HEAP32[r92]=r96;r89=HEAP16[r93];HEAP32[r85+(r84*764&-1)+212>>2]=r89&255;HEAP32[r85+(r84*764&-1)+216>>2]=(r89&65535)>>>8&65535;r89=HEAP16[r88];HEAP32[r85+(r84*764&-1)+220>>2]=r89&255;HEAP32[r85+(r84*764&-1)+224>>2]=(r89&65535)>>>8&65535;L3532:do{if(r87<<16>>16!=0){r89=0;while(1){r94=r89<<1;HEAP16[r85+(r84*764&-1)+(r94<<1)+228>>1]=HEAP16[((r89<<2)+8>>1)+r14];HEAP16[r85+(r84*764&-1)+((r94|1)<<1)+228>>1]=HEAP8[(r89<<2)+r13+6|0]<<24>>24;r94=r89+1|0;if((r94|0)<(r96|0)){r89=r94}else{break L3532}}}}while(0);HEAP8[r77]=_fgetc(r2)&255;HEAP8[r78]=_fgetc(r2)&255;HEAP8[r79]=_fgetc(r2)&255;HEAP8[r80]=_fgetc(r2)&255;HEAP8[r81]=_fgetc(r2)&255;HEAP8[r82]=_fgetc(r2)&255;r96=0;r87=_fgetc(r2)&255;while(1){HEAP8[(r96<<2)+r13+6|0]=r87;HEAP16[((r96<<2)+8>>1)+r14]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;r89=r96+1|0;r111=_fgetc(r2)&255;if((r89|0)==25){break}else{r96=r89;r87=r111}}HEAP8[r83]=r111;r87=HEAP16[r90];r96=r87&255;r89=(r85+(r84*764&-1)+356|0)>>2;HEAP32[r89]=((r96&2)<<24>>24!=0?4:0)|r96&1|((r96&4)<<24>>24!=0?18:0)|((r96&8)<<24>>24!=0?32:0);r94=(r87&65535)>>>8;r87=r94&255;r112=r94&65535;HEAP32[r85+(r84*764&-1)+360>>2]=r112;r113=HEAP16[r93];HEAP32[r85+(r84*764&-1)+368>>2]=r113&255;HEAP32[r85+(r84*764&-1)+372>>2]=(r113&65535)>>>8&65535;r113=HEAP16[r88];HEAP32[r85+(r84*764&-1)+376>>2]=r113&255;HEAP32[r85+(r84*764&-1)+380>>2]=(r113&65535)>>>8&65535;if(r87<<24>>24==0){r114=0;r115=0;r116=0}else{r113=0;while(1){r117=r113<<1;HEAP16[r85+(r84*764&-1)+(r117<<1)+384>>1]=HEAP16[((r113<<2)+8>>1)+r14];HEAP16[r85+(r84*764&-1)+((r117|1)<<1)+384>>1]=HEAP8[(r113<<2)+r13+6|0]<<24>>24;r117=r113+1|0;if((r117|0)<(r112|0)){r113=r117}else{break}}r114=r94&65535;r115=r87;r116=r94&65535}L3544:do{if((HEAP32[r95>>2]&1|0)!=0){if((HEAP32[r92]|0)>0){r118=0}else{break}while(1){r113=((r118<<1|1)<<1)+r85+(r84*764&-1)+228|0;HEAP16[r113>>1]=HEAP16[r113>>1]+32&65535;r113=r118+1|0;if((r113|0)<(HEAP32[r92]|0)){r118=r113}else{break L3544}}}}while(0);L3549:do{if(r96<<24>>24<0){HEAP32[r89]=HEAP32[r89]|8;if(r115<<24>>24==0){break}else{r119=0}while(1){r92=((r119<<1|1)<<1)+r85+(r84*764&-1)+384|0;HEAP16[r92>>1]=(HEAP16[r92>>1]<<2)+128&65535;r92=r119+1|0;if((r92|0)<(r114|0)){r119=r92}else{break L3549}}}else{if(r115<<24>>24==0){break}else{r120=0}while(1){r92=((r120<<1|1)<<1)+r85+(r84*764&-1)+384|0;HEAP16[r92>>1]=HEAP16[r92>>1]*50&65535;r92=r120+1|0;if((r92|0)<(r116|0)){r120=r92}else{break L3549}}}}while(0);_memset(r17,-1,484);r89=0;r96=0;while(1){r92=r96<<1;r95=HEAPU8[(r92|1)+r11+64|0]-1|0;if((r95|0)<0){HEAP8[(r96<<1)+r85+(r84*764&-1)+512|0]=-1;HEAP8[(r96<<1)+r85+(r84*764&-1)+513|0]=0;r121=r89}else{r94=(r95<<2)+r16|0;r87=HEAP32[r94>>2];if((r87|0)==-1){HEAP32[r94>>2]=r89;HEAP32[(r89<<2>>2)+r18]=r95;r122=r89+1|0;r123=r89}else{r122=r89;r123=r87}HEAP8[(r96<<1)+r85+(r84*764&-1)+512|0]=r123&255;HEAP8[(r96<<1)+r85+(r84*764&-1)+513|0]=HEAPU8[r11+(r92+64)|0]-r96&255;r121=r122}r92=r96+1|0;if((r92|0)==120){break}else{r89=r121;r96=r92}}HEAP32[r85+(r84*764&-1)+36>>2]=r121;HEAP32[r85+(r84*764&-1)+32>>2]=HEAPU8[r52]>>>1;if((r121|0)==0){break}r96=_calloc(64,r121);r89=(r85+(r84*764&-1)+756|0)>>2;HEAP32[r89]=r96;if((r121|0)>0){r124=0;r125=r96}else{break}while(1){HEAP32[r125+(r124<<6)+40>>2]=HEAP32[(r124<<2>>2)+r18];HEAP32[HEAP32[r89]+(r124<<6)+44>>2]=HEAPU8[r58];HEAP32[HEAP32[r89]+(r124<<6)+48>>2]=HEAPU8[r59];HEAP32[HEAP32[r89]+(r124<<6)+52>>2]=HEAP32[((HEAP8[r60]&3)<<2)+5250452>>2];r96=HEAPU8[r64];HEAP32[HEAP32[r89]+(r124<<6)+8>>2]=(r96&128|0)==0?r96<<2:128;HEAP32[HEAP32[r89]+(r124<<6)+56>>2]=HEAPU8[r71];HEAP32[HEAP32[r89]+(r124<<6)+60>>2]=HEAPU8[r72];r96=r124+1|0;if((r96|0)==(r121|0)){break L3440}r124=r96;r125=HEAP32[r89]}}}while(0);r85=r84+1|0;if((r85|0)<(HEAP32[r25]|0)){r84=r85}else{break L3436}}}}while(0);L3573:do{if((HEAP32[r44]|0)>0){r125=(r1+180|0)>>2;r124=r12|0;r121=r12+4|0;r18=r12+16|0;r122=r12+17|0;r11=r12+18|0;r123=r12+19|0;r16=r12+20|0;r17=r12+46|0;r120=r12+47|0;r116=r12+48|0;r115=r12+52|0;r119=r12+56|0;r114=r12+60|0;r118=r12+64|0;r13=r12+68|0;r14=r12+72|0;r111=r12+76|0;r110=r12+77|0;r109=r12+78|0;r108=r12+79|0;r107=0;while(1){r106=HEAP32[r125];if((HEAP16[r34>>1]&4)<<16>>16==0){r103=_calloc(64,1);HEAP32[HEAP32[r39]+(r107*764&-1)+756>>2]=r103}_fseek(r2,HEAP32[r47+(r107<<2)>>2]+r3|0,0);r103=_fgetc(r2);r104=_fgetc(r2);HEAP32[r124>>2]=r104<<16&16711680|r103<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;_fread(r121,12,1,r2);HEAP8[r18]=_fgetc(r2)&255;HEAP8[r122]=_fgetc(r2)&255;HEAP8[r11]=_fgetc(r2)&255;HEAP8[r123]=_fgetc(r2)&255;_fread(r16,26,1,r2);r103=0;while(1){r104=r12+(r103+20)|0;if(HEAP8[r104]<<24>>24==0){HEAP8[r104]=32}r104=r103+1|0;if((r104|0)==25){r126=24;break}else{r103=r104}}while(1){r103=r12+(r126+20)|0;if(HEAP8[r103]<<24>>24!=32){break}HEAP8[r103]=0;if((r126|0)>0){r126=r126-1|0}else{break}}HEAP8[r17]=_fgetc(r2)&255;HEAP8[r120]=_fgetc(r2)&255;r103=_fgetc(r2)&255;r104=_fgetc(r2);HEAP32[r116>>2]=r104<<8&65280|r103|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r103=_fgetc(r2)&255;r104=_fgetc(r2);HEAP32[r115>>2]=r104<<8&65280|r103|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r103=_fgetc(r2)&255;r104=_fgetc(r2);HEAP32[r119>>2]=r104<<8&65280|r103|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r103=_fgetc(r2)&255;r104=_fgetc(r2);HEAP32[r114>>2]=r104<<8&65280|r103|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r103=_fgetc(r2)&255;r104=_fgetc(r2);HEAP32[r118>>2]=r104<<8&65280|r103|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r103=_fgetc(r2)&255;r104=_fgetc(r2);HEAP32[r13>>2]=r104<<8&65280|r103|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r103=_fgetc(r2)&255;r104=_fgetc(r2);HEAP32[r14>>2]=r104<<8&65280|r103|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;HEAP8[r111]=_fgetc(r2)&255;HEAP8[r110]=_fgetc(r2)&255;HEAP8[r109]=_fgetc(r2)&255;HEAP8[r108]=_fgetc(r2)&255;do{if((HEAP32[r124>>2]|0)==1229803603){r103=r106+(r107*52&-1)+44|0;if((HEAP8[r11]&2)<<24>>24==0){r127=HEAP32[r103>>2]}else{HEAP32[r103>>2]=1;r127=1}r103=(r106+(r107*52&-1)+32|0)>>2;HEAP32[r103]=HEAP32[r116>>2];HEAP32[r106+(r107*52&-1)+36>>2]=HEAP32[r115>>2];HEAP32[r106+(r107*52&-1)+40>>2]=HEAP32[r119>>2];r104=r106+(r107*52&-1)+44|0;r10=((HEAP8[r11]&16)<<24>>24!=0?2:0)|r127;HEAP32[r104>>2]=r10;HEAP32[r104>>2]=((HEAP8[r11]&64)<<24>>24!=0?4:0)|r10;L3595:do{if((HEAP16[r34>>1]&4)<<16>>16==0){HEAP32[HEAP32[HEAP32[r39]+(r107*764&-1)+756>>2]>>2]=HEAPU8[r123];HEAP32[HEAP32[HEAP32[r39]+(r107*764&-1)+756>>2]+8>>2]=128;HEAP32[HEAP32[HEAP32[r39]+(r107*764&-1)+756>>2]+40>>2]=r107;HEAP32[HEAP32[r39]+(r107*764&-1)+36>>2]=(HEAP32[r103]|0)!=0&1;r10=HEAP32[r39];r104=r10+(r107*764&-1)|0;_memset(r104,0,26);_strncpy(r104,r16,25);r105=HEAP8[r104];if(r105<<24>>24==0){break}else{r128=0;r129=r104;r130=r105}while(1){do{if((_isprint(r130<<24>>24)|0)==0){r5=2491}else{if(HEAP8[r129]<<24>>24<0){r5=2491;break}else{break}}}while(0);if(r5==2491){r5=0;HEAP8[r129]=46}r105=r128+1|0;r102=r10+(r107*764&-1)+r105|0;r101=HEAP8[r102];if(r101<<24>>24!=0&(r105|0)<25){r128=r105;r129=r102;r130=r101}else{break}}if(HEAP8[r104]<<24>>24==0){break}while(1){r101=_strlen(r104)-1+r10+(r107*764&-1)|0;if(HEAP8[r101]<<24>>24!=32){break L3595}HEAP8[r101]=0;if(HEAP8[r104]<<24>>24==0){break L3595}}}else{r104=r106+(r107*52&-1)|0;_memset(r104,0,26);_strncpy(r104,r16,25);r10=HEAP8[r104];if(r10<<24>>24==0){break}else{r131=0;r132=r104;r133=r10}while(1){do{if((_isprint(r133<<24>>24)|0)==0){r5=2499}else{if(HEAP8[r132]<<24>>24<0){r5=2499;break}else{break}}}while(0);if(r5==2499){r5=0;HEAP8[r132]=46}r10=r131+1|0;r101=r106+(r107*52&-1)+r10|0;r102=HEAP8[r101];if(r102<<24>>24!=0&(r10|0)<25){r131=r10;r132=r101;r133=r102}else{break}}if(HEAP8[r104]<<24>>24==0){break}while(1){r102=_strlen(r104)-1+r106+(r107*52&-1)|0;if(HEAP8[r102]<<24>>24!=32){break L3595}HEAP8[r102]=0;if(HEAP8[r104]<<24>>24==0){break L3595}}}}while(0);r104=HEAP32[r25];L3621:do{if((r104|0)>0){r102=0;r101=HEAP32[r39];r10=r104;while(1){if((HEAP32[r101+(r102*764&-1)+36>>2]|0)>0){r105=0;r100=r101;while(1){r99=HEAP32[r100+(r102*764&-1)+756>>2]>>2;do{if((HEAP32[((r105<<6)+40>>2)+r99]|0)==(r107|0)){HEAP32[(r105<<6>>2)+r99]=HEAPU8[r123];HEAP32[((r105<<6)+4>>2)+r99]=HEAPU8[r122];HEAP32[((r105<<6)+28>>2)+r99]=HEAPU8[r111];HEAP32[((r105<<6)+24>>2)+r99]=HEAPU8[r110]>>>1;HEAP32[((r105<<6)+20>>2)+r99]=HEAPU8[r108];HEAP32[((r105<<6)+32>>2)+r99]=HEAPU8[r109]>>>1^127;r98=HEAP32[r114>>2];r97=HEAP32[HEAP32[r39]+(r102*764&-1)+756>>2];r91=(r105<<6)+r97+12|0;r33=(r105<<6)+r97+16|0;if((r98|0)==0){HEAP32[r33>>2]=0;HEAP32[r91>>2]=0;break}else{r97=Math.log((r98|0)/8363)*1536/.6931471805599453&-1;HEAP32[r91>>2]=(r97|0)/128&-1;HEAP32[r33>>2]=(r97|0)%128;break}}}while(0);r99=r105+1|0;r134=HEAP32[r39];if((r99|0)<(HEAP32[r134+(r102*764&-1)+36>>2]|0)){r105=r99;r100=r134}else{break}}r135=r134;r136=HEAP32[r25]}else{r135=r101;r136=r10}r100=r102+1|0;if((r100|0)<(r136|0)){r102=r100;r101=r135;r10=r136}else{break L3621}}}}while(0);if((HEAP8[r11]&1)<<24>>24==0){break}if((HEAP32[r103]|0)<=1){break}_fseek(r2,HEAP32[r14>>2]+r3|0,0);r104=(HEAP8[r17]&1)<<24>>24==0?2:0;if((HEAP8[r11]&8)<<24>>24==0){_load_sample(r2,r104,HEAP32[r125]+(r107*52&-1)|0,0);break}r10=_calloc(1,HEAP32[r103]<<1);r101=HEAP32[r103];r102=HEAP8[r17]&4;if((HEAP8[r11]&2)<<24>>24==0){_itsex_decompress8(r2,r10,r101,r102)}else{_itsex_decompress16(r2,r10,r101,r102)}_load_sample(0,r104|16,HEAP32[r125]+(r107*52&-1)|0,r10);_free(r10)}}while(0);r106=r107+1|0;if((r106|0)<(HEAP32[r44]|0)){r107=r106}else{break L3573}}}}while(0);r44=Math.imul(HEAP32[r48],HEAP32[r45]);HEAP32[r4+33]=r44;_memset(r20|0,0,64);_memset(r21|0,0,64);r136=(r1+172|0)>>2;HEAP32[r136]=_calloc(4,r44);r44=(r1+168|0)>>2;HEAP32[r44]=_calloc(4,HEAP32[r45]+1|0);L3648:do{if((HEAP32[r45]|0)>0){r135=r15|0;r25=r36<<16>>16==0;r134=0;r39=0;r133=HEAP32[r48];while(1){r132=_calloc(1,(r133<<2)+4|0);HEAP32[HEAP32[r44]+(r39<<2)>>2]=r132;r132=HEAP32[r43+(r39<<2)>>2];L3652:do{if((r132|0)==0){HEAP32[HEAP32[HEAP32[r44]+(r39<<2)>>2]>>2]=64;r131=_calloc(524,1);r5=Math.imul(HEAP32[r48],r39);HEAP32[HEAP32[r136]+(r5<<2)>>2]=r131;r131=Math.imul(HEAP32[r48],r39);HEAP32[HEAP32[HEAP32[r136]+(r131<<2)>>2]>>2]=64;r131=HEAP32[r48];if((r131|0)>0){r137=0;r138=r131}else{r139=r134;r140=r131;break}while(1){r131=Math.imul(r138,r39);HEAP32[HEAP32[HEAP32[r44]+(r39<<2)>>2]+(r137<<2)+4>>2]=r131;r131=r137+1|0;r5=HEAP32[r48];if((r131|0)<(r5|0)){r137=r131;r138=r5}else{r139=r134;r140=r5;break L3652}}}else{_fseek(r2,r132+r3|0,0);r103=_fgetc(r2)&255|_fgetc(r2)<<8&65280;r5=_fgetc(r2)&255|_fgetc(r2)<<8&65280;HEAP32[HEAP32[HEAP32[r44]+(r39<<2)>>2]>>2]=r5;r5=HEAP32[r48];L3657:do{if((r5|0)>0){r131=0;r130=r5;while(1){r129=Math.imul(r130,r39)+r131|0;HEAP32[HEAP32[HEAP32[r44]+(r39<<2)>>2]+(r131<<2)+4>>2]=r129;r129=_calloc(HEAP32[HEAP32[HEAP32[r44]+(r39<<2)>>2]>>2]<<3|4,1);r128=Math.imul(HEAP32[r48],r39)+r131|0;HEAP32[HEAP32[r136]+(r128<<2)>>2]=r129;r129=HEAP32[HEAP32[HEAP32[r44]+(r39<<2)>>2]>>2];r128=Math.imul(HEAP32[r48],r39)+r131|0;HEAP32[HEAP32[HEAP32[r136]+(r128<<2)>>2]>>2]=r129;r129=r131+1|0;r128=HEAP32[r48];if((r129|0)<(r128|0)){r131=r129;r130=r128}else{break L3657}}}}while(0);_memset(r135,0,64);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);L3661:do{if((r103|0)!=0){r5=0;r130=r103;while(1){r131=r130;while(1){r141=r131-1|0;r128=_fgetc(r2);if((r128&255)<<24>>24==0){break}r129=r128+63&63;if((r128&128|0)==0){r142=r141}else{HEAP8[r15+r129|0]=_fgetc(r2)&255;r142=r131-2|0}if((r129|0)<(HEAP32[r48]|0)){r143=(r5<<3)+HEAP32[HEAP32[r136]+(HEAP32[HEAP32[HEAP32[r44]+(r39<<2)>>2]+(r129<<2)+4>>2]<<2)>>2]+4|0}else{r143=r7}r128=HEAP8[r15+r129|0];if((r128&1)<<24>>24==0){r144=r142}else{r127=_fgetc(r2);r126=r127&255;r12=r127&255;if((r12|0)==254){r145=-126}else if((r12|0)==255){r145=-127}else{r145=(r126&255)>119?-125:r126+1&255}HEAP8[r143|0]=r145;HEAP8[(r129<<3)+r8|0]=r145;r144=r142-1|0}if((r128&2)<<24>>24==0){r146=r144}else{r126=_fgetc(r2)&255;HEAP8[r143+1|0]=r126;HEAP8[(r129<<3)+r8+1|0]=r126;r146=r144-1|0}if((r128&4)<<24>>24==0){r147=r146}else{r126=_fgetc(r2)&255;HEAP8[r143+2|0]=r126;HEAP8[(r129<<3)+r8+2|0]=r126;_xlat_volfx(r143);r147=r146-1|0}if((r128&8)<<24>>24==0){r148=r147}else{r126=r143+3|0;HEAP8[r126]=_fgetc(r2)&255;r12=_fgetc(r2)&255;r127=r143+4|0;HEAP8[r127]=r12;r47=(r12&255)>>>4;r107=HEAP8[HEAPU8[r126]+5250888|0];HEAP8[r126]=r107;r125=r107&255;do{if((r125|0)==0){r11=r20+r129|0;if(r12<<24>>24==0){r17=HEAP8[r11];HEAP8[r127]=r17;r149=r107;r150=r17;break}else{HEAP8[r11]=r12;r149=r107;r150=r12;break}}else if((r125|0)==4){if(!r25){r149=r107;r150=r12;break}HEAP8[r126]=-122;r149=-122;r150=r12}else if((r125|0)==254){HEAP8[r126]=14;r11=r21+r129|0;if((r47|r12)<<24>>24==0){r17=HEAP8[r11];HEAP8[r127]=r17;r151=r17;r152=(r17&255)>>>4}else{HEAP8[r11]=r12;r151=r12;r152=r47}r11=r151&15;r17=r152&255;if((r17|0)==1){r14=r11|48;HEAP8[r127]=r14;r149=14;r150=r14;break}else if((r17|0)==2){r14=r11|80;HEAP8[r127]=r14;r149=14;r150=r14;break}else if((r17|0)==3){r14=r11|64;HEAP8[r127]=r14;r149=14;r150=r14;break}else if((r17|0)==4){r14=r11|112;HEAP8[r127]=r14;r149=14;r150=r14;break}else if((r17|0)==5){HEAP8[r127]=0;HEAP8[r126]=0;r149=0;r150=0;break}else if((r17|0)==6){r14=r11|-32;HEAP8[r127]=r14;r149=14;r150=r14;break}else if((r17|0)==7){HEAP8[r126]=-125;HEAP8[r127]=r11;r149=-125;r150=r11;break}else if((r17|0)==8){HEAP8[r126]=8;r14=r151<<4;HEAP8[r127]=r14;r149=8;r150=r14;break}else if((r17|0)==9){HEAP8[r127]=0;HEAP8[r126]=0;r149=0;r150=0;break}else if((r17|0)==11){r14=r11|96;HEAP8[r127]=r14;r149=14;r150=r14;break}else if((r17|0)==12|(r17|0)==13){r14=(r11<<24>>24==0&1)+r11&255|r152<<4;HEAP8[r127]=r14;r149=14;r150=r14;break}else if((r17|0)==14){HEAP8[r126]=-120;HEAP8[r127]=r11;r149=-120;r150=r11;break}else{HEAP8[r127]=0;HEAP8[r126]=0;r149=0;r150=0;break}}else if((r125|0)==132){if(r12<<24>>24<0&(r12&255)<144){HEAP8[r126]=-123;r11=r12<<4;HEAP8[r127]=r11;r149=-123;r150=r11;break}else{r11=r12<<1;HEAP8[r127]=r11;r149=r107;r150=r11;break}}else if((r125|0)==29){if(r25|r12<<24>>24==0){r149=r107;r150=r12;break}r11=r12+16&255&-16|(r12&15)+1&255;HEAP8[r127]=r11;r149=r107;r150=r11}else if((r125|0)==16){if((r12&255)<=128){r149=r107;r150=r12;break}HEAP8[r127]=0;HEAP8[r126]=0;r149=0;r150=0}else if((r125|0)==255){HEAP8[r127]=0;HEAP8[r126]=0;r149=0;r150=0}else{r149=r107;r150=r12}}while(0);HEAP8[(r129<<3)+r8+3|0]=r149;HEAP8[(r129<<3)+r8+4|0]=r150;r148=r147-2|0}if((r128&16)<<24>>24!=0){HEAP8[r143|0]=HEAP8[(r129<<3)+r8|0]}if((r128&32)<<24>>24!=0){HEAP8[r143+1|0]=HEAP8[(r129<<3)+r8+1|0]}if((r128&64)<<24>>24!=0){HEAP8[r143+2|0]=HEAP8[(r129<<3)+r8+2|0];_xlat_volfx(r143)}if(r128<<24>>24<0){HEAP8[r143+3|0]=HEAP8[(r129<<3)+r8+3|0];HEAP8[r143+4|0]=HEAP8[(r129<<3)+r8+4|0]}if((r148|0)>0){r131=r148}else{break L3661}}if((r141|0)>0){r5=r5+1|0;r130=r141}else{break L3661}}}}while(0);r103=HEAP32[r48];r130=r103-1|0;if((r130|0)<(r134|0)){r139=r134;r140=r103;break}r5=HEAP32[HEAP32[r44]+(r39<<2)>>2];r131=HEAP32[r136];r12=r134;r107=r130;while(1){r130=r107;L3742:while(1){r126=HEAP32[r131+(HEAP32[r5+(r130<<2)+4>>2]<<2)>>2];r127=HEAP32[r126>>2];r125=0;while(1){if((r125|0)>=(r127|0)){break}if(HEAP8[(r125<<3)+r126+4|0]<<24>>24!=0){break L3742}if(HEAP8[(r125<<3)+r126+6|0]<<24>>24!=0){break L3742}if(HEAP8[(r125<<3)+r126+5|0]<<24>>24!=0){break L3742}if(HEAP8[(r125<<3)+r126+7|0]<<24>>24!=0){break L3742}if(HEAP8[(r125<<3)+r126+8|0]<<24>>24!=0){break L3742}if(HEAP8[(r125<<3)+r126+9|0]<<24>>24!=0){break L3742}if(HEAP8[(r125<<3)+r126+10|0]<<24>>24==0){r125=r125+1|0}else{break L3742}}r125=r130-1|0;if((r125|0)<(r12|0)){r139=r12;r140=r103;break L3652}else{r130=r125}}r125=(r130|0)>(r12|0)?r130:r12;r126=r130-1|0;if((r126|0)<(r125|0)){r139=r125;r140=r103;break L3652}else{r12=r125;r107=r126}}}}while(0);r132=r39+1|0;if((r132|0)<(HEAP32[r45]|0)){r134=r139;r39=r132;r133=r140}else{r153=r139;break L3648}}}else{r153=0}}while(0);_free(r30);_free(r40);if((r46|0)!=0){_free(r46)}HEAP32[r48]=r153+1|0;r153=(r1+1276|0)>>2;r1=HEAP32[r153];HEAP32[r153]=r1|494115;if((HEAP16[r34>>1]&32)<<16>>16==0){HEAP32[r153]=r1|495139}HEAP32[r4+317]=128;HEAP32[r4+320]=3;r55=0;STACKTOP=r6;return r55}function _xlat_volfx(r1){var r2,r3;r2=r1+2|0;r3=HEAP8[r2];HEAP8[r2]=0;if((r3&255)<65){HEAP8[r2]=r3+1&255;return}if((r3-65&255)<10){HEAP8[r1+5|0]=14;HEAP8[r1+6|0]=r3+63&255|-96;return}if((r3-75&255)<10){HEAP8[r1+5|0]=14;HEAP8[r1+6|0]=r3+53&255|-80;return}if((r3-85&255)<10){HEAP8[r1+5|0]=-92;HEAP8[r1+6|0]=(r3<<4)-80&255;return}r2=r3-95&255;if((r2&255)<10){HEAP8[r1+5|0]=-92;HEAP8[r1+6|0]=r2;return}if((r3-105&255)<10){HEAP8[r1+5|0]=2;HEAP8[r1+6|0]=(r3<<2)+92&255;return}if((r3-115&255)<10){HEAP8[r1+5|0]=1;HEAP8[r1+6|0]=(r3<<2)+52&255;return}if(r3<<24>>24<0&(r3&255)<193){HEAP8[r1+5|0]=8;HEAP8[r1+6|0]=r3<<24>>24==-64?-4:r3<<2;return}if((r3+63&255)<10){HEAP8[r1+5|0]=3;HEAP8[r1+6|0]=1<<(r3&255)-193&255;return}r2=r3+53&255;if((r2&255)>=10){return}HEAP8[r1+5|0]=4;HEAP8[r1+6|0]=r2;return}function _itsex_decompress8(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54;r5=0;if((r3|0)==0){r6=0;return r6}r7=(r4|0)!=0;r4=0;r8=0;r9=0;r10=0;r11=0;r12=0;r13=r3;r3=r2;L3809:while(1){if((r12|0)==0){_fgetc(r1);_fgetc(r1);r14=32768;r15=9;r16=0;r17=0;r18=0;r19=0}else{r14=r12;r15=r11;r16=r10;r17=r9;r18=r8;r19=r4}r2=r14>>>0>r13>>>0?r13:r14;r20=r15;r21=0;r22=r16;r23=r17;r24=r18;r25=r19;while(1){r26=r20&255;L3816:do{if(r20<<24>>24==0){r27=0;r28=r24;r29=r25}else{r30=r25;r31=r24;r32=r26;r33=0;while(1){if((r31|0)==0){r34=_fgetc(r1)&255;r35=8}else{r34=r30;r35=r31}r36=r34<<31|r33>>>1;r37=r34>>1;r38=r35-1|0;r39=r32-1|0;if((r39|0)==0){r27=r36;r28=r38;r29=r37;break L3816}else{r30=r37;r31=r38;r32=r39;r33=r36}}}}while(0);r33=r27>>>((32-r26|0)>>>0);if((_feof(r1)|0)!=0){r6=-1;r5=2680;break L3809}L3824:do{if((r20&255)<7){r32=r33&65535;if((1<<r26-1|0)!=(r32|0)){r40=r32;r5=2668;break}do{if((r28|0)==0){r32=_fgetc(r1)&255;r41=r32>>>1;r42=7;r43=r32}else{r32=r28-1|0;if((r32|0)!=0){r41=r29>>1;r42=r32;r43=r29;break}r41=_fgetc(r1)&255;r42=8;r43=r29}}while(0);r32=r42-1|0;if((r32|0)==0){r44=_fgetc(r1)&255;r45=8}else{r44=r41>>1;r45=r32}r32=(r44<<31|(r41<<31|r43<<30&1073741824)>>>1)>>>29;r31=r32+1|0;if((_feof(r1)|0)!=0){r6=-1;r5=2681;break L3809}r46=((r31&255)>>>0<r26>>>0?r31:r32+2|0)&255;r47=r21;r48=r22;r49=r23;r50=r45-1|0;r51=r44>>1;break}else{do{if((r20&255)<9){r32=255>>>((9-r26|0)>>>0);r31=r32+65532|0;r30=r33&65535;if(r30>>>0<=(r31&65535)>>>0){break}if(r30>>>0>(r32+4&65535)>>>0){break}r32=r33-r31|0;r46=((r32&255)>>>0>=r26>>>0&1)+r32&255;r47=r21;r48=r22;r49=r23;r50=r28;r51=r29;break L3824}else{if((r20&255)>9){r52=r22;r53=r23;r5=2670;break L3824}if((r33&65280)>>>0<=255){break}r46=r33+1&255;r47=r21;r48=r22;r49=r23;r50=r28;r51=r29;break L3824}}while(0);if((r20&255)>=8){r54=r33;r5=2669;break}r40=r33&65535;r5=2668;break}}while(0);do{if(r5==2668){r5=0;r33=8-r20&255;r54=r40<<r33<<24>>24>>r33;r5=2669;break}}while(0);do{if(r5==2669){r5=0;r33=r54+(r23&255)|0;r26=r33&255;r32=r33+(r22&255)&255;HEAP8[r3+r21|0]=r7?r32:r26;r52=r32;r53=r26;r5=2670;break}}while(0);if(r5==2670){r5=0;r46=r20;r47=r21+1|0;r48=r52;r49=r53;r50=r28;r51=r29}if(r47>>>0<r2>>>0){r20=r46;r21=r47;r22=r48;r23=r49;r24=r50;r25=r51}else{break}}if((r13|0)==(r2|0)){r6=0;r5=2679;break}else{r4=r51;r8=r50;r9=r49;r10=r48;r11=r46;r12=r14-r2|0;r13=r13-r2|0;r3=r3+r2|0}}if(r5==2680){return r6}else if(r5==2681){return r6}else if(r5==2679){return r6}}function _itsex_decompress16(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54;r5=0;if((r3|0)==0){r6=0;return r6}r7=(r4|0)!=0;r4=r2;r2=r3;r3=0;r8=0;r9=0;r10=0;r11=0;r12=0;L3862:while(1){if((r3|0)==0){_fgetc(r1);_fgetc(r1);r13=16384;r14=17;r15=0;r16=0;r17=0;r18=0}else{r13=r3;r14=r8;r15=r9;r16=r10;r17=r11;r18=r12}r19=r13>>>0>r2>>>0?r2:r13;r20=r14;r21=0;r22=r15;r23=r16;r24=r17;r25=r18;while(1){r26=r20&255;L3869:do{if(r20<<24>>24==0){r27=0;r28=r24;r29=r25}else{r30=r25;r31=r24;r32=r26;r33=0;while(1){if((r31|0)==0){r34=_fgetc(r1)&255;r35=8}else{r34=r30;r35=r31}r36=r34<<31|r33>>>1;r37=r34>>1;r38=r35-1|0;r39=r32-1|0;if((r39|0)==0){r27=r36;r28=r38;r29=r37;break L3869}else{r30=r37;r31=r38;r32=r39;r33=r36}}}}while(0);r33=r27>>>((32-r26|0)>>>0);if((_feof(r1)|0)!=0){r6=-1;r5=2721;break L3862}L3877:do{if((r20&255)<7){if((1<<r26-1|0)!=(r33|0)){r5=2706;break}do{if((r28|0)==0){r32=_fgetc(r1)&255;r40=r32>>>1;r41=7;r42=r32}else{r32=r28-1|0;if((r32|0)!=0){r40=r29>>1;r41=r32;r42=r29;break}r40=_fgetc(r1)&255;r41=8;r42=r29}}while(0);r32=r40<<31|r42<<30&1073741824;do{if((r41|0)==1){r31=_fgetc(r1);r43=r31>>>1&127;r44=7;r45=r31<<31|r32>>>1}else{r31=r40>>>1<<31|r32>>>1;r30=r41-2|0;if((r30|0)!=0){r43=r40>>2;r44=r30;r45=r31;break}r43=_fgetc(r1)&255;r44=8;r45=r31}}while(0);r32=(r43<<31|r45>>>1)>>>28;r31=r32+1|0;if((_feof(r1)|0)!=0){r6=-1;r5=2718;break L3862}r46=((r31&255)>>>0<r26>>>0?r31:r32+2|0)&255;r47=r21;r48=r22;r49=r23;r50=r44-1|0;r51=r43>>1;break}else{do{if((r20&255)<17){r32=65535>>>((17-r26|0)>>>0);r31=r32+65528&65535;if(r33>>>0<=r31>>>0){break}if(r33>>>0>(r32+8&65535)>>>0){break}r32=r33-r31|0;r46=((r32&255)>>>0>=r26>>>0&1)+r32&255;r47=r21;r48=r22;r49=r23;r50=r28;r51=r29;break L3877}else{if((r20&255)>17){r52=r22;r53=r23;r5=2708;break L3877}if(r33>>>0<=65535){break}r46=r33+1&255;r47=r21;r48=r22;r49=r23;r50=r28;r51=r29;break L3877}}while(0);if((r20&255)<16){r5=2706;break}else{r54=r33;r5=2707;break}}}while(0);do{if(r5==2706){r5=0;r26=16-r20&255;r54=r33<<r26<<16>>16>>r26;r5=2707;break}}while(0);do{if(r5==2707){r5=0;r33=r54+(r23&65535)|0;r26=r33&65535;r32=r33+(r22&65535)&65535;HEAP16[r4+(r21<<1)>>1]=r7?r32:r26;r52=r32;r53=r26;r5=2708;break}}while(0);if(r5==2708){r5=0;r46=r20;r47=r21+1|0;r48=r52;r49=r53;r50=r28;r51=r29}if(r47>>>0<r19>>>0){r20=r46;r21=r47;r22=r48;r23=r49;r24=r50;r25=r51}else{break}}r25=r2-r19|0;if((r25|0)>0&(r2|0)!=(r19|0)){r4=(r19<<1)+r4|0;r2=r25;r3=r13-r19|0;r8=r46;r9=r48;r10=r49;r11=r50;r12=r51}else{r6=0;r5=2719;break}}if(r5==2718){return r6}else if(r5==2719){return r6}else if(r5==2721){return r6}}function _liq_test(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+80|0;r5=r4;r6=r4+64|0;L3913:do{if(_fread(r6,1,14,r1)>>>0<14){r7=-1}else{if((_memcmp(r6,5267512,14)|0)!=0){r7=-1;break}r8=r5|0;if((r2|0)==0){r7=0;break}_memset(r2,0,31);_fread(r8,1,30,r1);HEAP8[r5+30|0]=0;_memset(r2,0,31);_strncpy(r2,r8,30);r8=HEAP8[r2];if(r8<<24>>24==0){r7=0;break}else{r9=0;r10=r2;r11=r8}while(1){do{if((_isprint(r11<<24>>24)|0)==0){r3=2729}else{if(HEAP8[r10]<<24>>24<0){r3=2729;break}else{break}}}while(0);if(r3==2729){r3=0;HEAP8[r10]=46}r8=r9+1|0;r12=r2+r8|0;r13=HEAP8[r12];if(r13<<24>>24!=0&(r8|0)<30){r9=r8;r10=r12;r11=r13}else{break}}if(HEAP8[r2]<<24>>24==0){r7=0;break}while(1){r13=r2+(_strlen(r2)-1)|0;if(HEAP8[r13]<<24>>24!=32){r7=0;break L3913}HEAP8[r13]=0;if(HEAP8[r2]<<24>>24==0){r7=0;break L3913}}}}while(0);STACKTOP=r4;return r7}function _liq_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57;r4=r1>>2;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+328|0;r7=r6;r8=r6+112;r9=r6+260;r10=r6+300;r11=r6+324;_fseek(r2,r3,0);_fread(r7|0,14,1,r2);r12=r7+14|0;_fread(r12,30,1,r2);_fread(r7+44|0,20,1,r2);_fgetc(r2);r13=r7+65|0;_fread(r13,20,1,r2);r14=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;r15=r7+86|0;HEAP16[r15>>1]=r14;r16=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;HEAP16[r7+88>>1]=r16;r17=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;HEAP16[r7+90>>1]=r17;HEAP16[r7+92>>1]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;HEAP16[r7+94>>1]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;r18=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;HEAP16[r7+96>>1]=r18;r19=_fgetc(r2)&255;r20=_fgetc(r2);HEAP32[r7+100>>2]=r20<<8&65280|r19|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r19=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;HEAP16[r7+104>>1]=r19;r20=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;HEAP16[r7+106>>1]=r20;r21=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;r22=r7+108|0;HEAP16[r22>>1]=r21;r23=(r7+110|0)>>1;HEAP16[r23]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;if((r14&65535)<256){HEAP16[r23]=r21;HEAP16[r22>>1]=0;_fseek(r2,-2,1);r24=0}else{r24=r21}HEAP32[r4+37]=r16&65535;HEAP32[r4+38]=r17&65535;r17=r18&65535;r18=(r1+136|0)>>2;HEAP32[r18]=r17;r16=r19&65535;r19=(r1+128|0)>>2;HEAP32[r19]=r16;r21=r20&65535;r20=r1+144|0;HEAP32[r20>>2]=r21;r22=(r1+140|0)>>2;HEAP32[r22]=r21;r21=(r1+156|0)>>2;HEAP32[r21]=r24&65535;r24=r1+132|0;HEAP32[r24>>2]=Math.imul(r16,r17);r17=(r1+1276|0)>>2;HEAP32[r17]=HEAP32[r17]|16384;_strncpy(r1|0,r12,30);r12=r10|0;_strncpy(r12,r13,20);HEAP8[r10+20|0]=0;r13=20;r16=0;while(1){if(r16<<24>>24==32){HEAP8[r10+r13|0]=0}else if(r16<<24>>24!=0){break}r14=r13-1|0;if((r13|0)<=0){break}r13=r14;r16=HEAP8[r10+r14|0]}r10=HEAP16[r15>>1];r15=r10&65535;_snprintf(r1+64|0,64,5267376,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=r12,HEAP32[tempInt+4>>2]=r15>>>8,HEAP32[tempInt+8>>2]=r15&255,tempInt));if(r10<<16>>16==0){_fseek(r2,r3+240|0,0);_fread(r1+952|0,1,256,r2);_fseek(r2,HEAPU16[r23]+r3|0,0);r3=0;while(1){if((r3|0)>=256){break}if(HEAP8[r1+(r3+952)|0]<<24>>24==-1){break}else{r3=r3+1|0}}HEAP32[r21]=r3}else{L3942:do{if((HEAP32[r18]|0)>0){r3=0;while(1){HEAP32[((r3*12&-1)+184>>2)+r4]=_fgetc(r2)<<2&1020;r10=r3+1|0;r25=HEAP32[r18];if((r10|0)<(r25|0)){r3=r10}else{break}}if((r25|0)>0){r26=0}else{break}while(1){HEAP32[((r26*12&-1)+188>>2)+r4]=_fgetc(r2)&255;r3=r26+1|0;if((r3|0)<(HEAP32[r18]|0)){r26=r3}else{break L3942}}}}while(0);_fread(r1+952|0,1,HEAP32[r21],r2);_fseek(r2,HEAPU16[r23]-109-(HEAP32[r18]<<1)-HEAP32[r21]|0,1)}r21=(r1+172|0)>>2;HEAP32[r21]=_calloc(4,HEAP32[r24>>2]);r24=(r1+168|0)>>2;HEAP32[r24]=_calloc(4,HEAP32[r19]+1|0);L3955:do{if((HEAP32[r19]|0)>0){r23=r9|0;r26=r9+30|0;r25=r9+32|0;r3=r9+36|0;r10=0;r15=0;L3957:while(1){r12=_calloc(1,(HEAP32[r18]<<2)+4|0);HEAP32[HEAP32[r24]+(r15<<2)>>2]=r12;r12=_fgetc(r2);r16=_fgetc(r2);r13=r16<<16&16711680|r12<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;if((r13|0)==1280311296){_fread(r23,30,1,r2);r12=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;HEAP16[r26>>1]=r12;r16=_fgetc(r2)&255;r14=_fgetc(r2);r7=r14<<8&65280|r16|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;HEAP32[r25>>2]=r7;r16=_fgetc(r2)&255;r14=_fgetc(r2);HEAP32[r3>>2]=r14<<8&65280|r16|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;HEAP32[HEAP32[HEAP32[r24]+(r15<<2)>>2]>>2]=r12&65535;r12=HEAP32[r18];L3961:do{if((r12|0)>0){r16=0;r14=r12;while(1){r27=Math.imul(r14,r15)+r16|0;HEAP32[HEAP32[HEAP32[r24]+(r15<<2)>>2]+(r16<<2)+4>>2]=r27;r27=_calloc(HEAP32[HEAP32[HEAP32[r24]+(r15<<2)>>2]>>2]<<3|4,1);r28=Math.imul(HEAP32[r18],r15)+r16|0;HEAP32[HEAP32[r21]+(r28<<2)>>2]=r27;r27=HEAP32[HEAP32[HEAP32[r24]+(r15<<2)>>2]>>2];r28=Math.imul(HEAP32[r18],r15)+r16|0;HEAP32[HEAP32[HEAP32[r21]+(r28<<2)>>2]>>2]=r27;r27=r16+1|0;r28=HEAP32[r18];if((r27|0)<(r28|0)){r16=r27;r14=r28}else{break L3961}}}}while(0);r12=_ftell(r2);r14=0;r16=0;r28=0;r27=r10;r29=HEAP32[HEAP32[r24]+(r15<<2)>>2];L3965:while(1){r30=HEAP32[HEAP32[r21]+(HEAP32[r29+(r14<<2)+4>>2]<<2)>>2];L3967:do{if(r28<<24>>24==0){r31=r16;r32=_fgetc(r2)&255;while(1){r33=HEAP32[HEAP32[r21]+(HEAP32[HEAP32[HEAP32[r24]+(r15<<2)>>2]+(r14<<2)+4>>2]<<2)>>2];r34=(r31<<3)+r33+4|0;r35=r32&255;if((r35|0)==128){r36=r14;r37=r31;r38=0;r39=r32;break L3967}else if((r35|0)==192){break L3965}else if((r35|0)==225){r5=2776;break}else if((r35|0)==160){r40=r14;r41=r32;break}else if((r35|0)==224){r5=2778;break}if((r32+63&255)<31){r5=2780;break}if((r32+95&255)<31){r5=2793;break}if((r32+127&255)<31){r5=2806;break}if(r32<<24>>24!=-1){HEAP8[r34|0]=r32+37&255}r42=_fgetc(r2)&255;if((r42&255)>100){r31=r31+1|0;r32=r42}else{r5=2824;break}}if(r5==2824){r5=0;r35=(r31<<3)+r33+5|0;HEAP8[r35]=r42+1&255;r43=_fgetc(r2)&255;if(r43<<24>>24!=-1){HEAP8[(r31<<3)+r33+6|0]=r43}r43=_fgetc(r2)&255;if(r43<<24>>24==-1){r44=(r31<<3)+r33+7|0}else{r45=(r31<<3)+r33+7|0;HEAP8[r45]=r43-65&255;r44=r45}r45=_fgetc(r2);r43=r45&255;r46=(r31<<3)+r33+8|0;HEAP8[r46]=r43;r47=HEAP8[r44];if((r47&255)>=27){r5=2830;break L3957}r48=r43&15;r49=HEAP8[(r47&255)+5250860|0];HEAP8[r44]=r49;r47=r49&255;do{if((r47|0)==255){HEAP8[r46]=0;HEAP8[r44]=0}else if((r47|0)==14){r49=r45>>>4&15;if((r49|0)==13){HEAP8[r46]=r48|-48;break}else if((r49|0)==14){HEAP8[r46]=r48|-32;break}else if((r49|0)==3){HEAP8[r46]=r48|48;break}else if((r49|0)==4){HEAP8[r46]=r48|64;break}else if((r49|0)==5){HEAP8[r46]=r48|80;break}else if((r49|0)==6){HEAP8[r46]=r48|96;break}else if((r49|0)==7){HEAP8[r46]=r48|112;break}else if((r49|0)==12){HEAP8[r46]=r48|-64;break}else{HEAP8[r46]=0;HEAP8[r44]=0;break}}}while(0);r46=HEAP8[r34|0];if(!((r46&255)<120|r46<<24>>24==-127)){r5=2844;break L3957}if(HEAPU8[r35]>=101){r5=2846;break L3957}if(HEAPU8[(r31<<3)+r33+6|0]<66){r36=r14;r37=r31;r38=0;r39=r43;break}else{r5=2848;break L3957}}else if(r5==2780){r5=0;_decode_event(r32,r34,r2);r46=(r31<<3)+r33+8|0;r48=HEAP8[r46];r45=r48&15;r47=(r31<<3)+r33+7|0;r49=HEAP8[HEAPU8[r47]+5250860|0];HEAP8[r47]=r49;r50=r49&255;if((r50|0)==255){HEAP8[r46]=0;HEAP8[r47]=0;r36=r14;r37=r31;r38=0;r39=r32;break}else if((r50|0)!=14){r36=r14;r37=r31;r38=0;r39=r32;break}r50=(r48&255)>>>4&255;if((r50|0)==12){HEAP8[r46]=r45|-64;r36=r14;r37=r31;r38=0;r39=r32;break}else if((r50|0)==3){HEAP8[r46]=r45|48;r36=r14;r37=r31;r38=0;r39=r32;break}else if((r50|0)==6){HEAP8[r46]=r45|96;r36=r14;r37=r31;r38=0;r39=r32;break}else if((r50|0)==7){HEAP8[r46]=r45|112;r36=r14;r37=r31;r38=0;r39=r32;break}else if((r50|0)==13){HEAP8[r46]=r45|-48;r36=r14;r37=r31;r38=0;r39=r32;break}else if((r50|0)==14){HEAP8[r46]=r45|-32;r36=r14;r37=r31;r38=0;r39=r32;break}else if((r50|0)==4){HEAP8[r46]=r45|64;r36=r14;r37=r31;r38=0;r39=r32;break}else if((r50|0)==5){HEAP8[r46]=r45|80;r36=r14;r37=r31;r38=0;r39=r32;break}else{HEAP8[r46]=0;HEAP8[r47]=0;r36=r14;r37=r31;r38=0;r39=r32;break}}else if(r5==2793){r5=0;r47=_fgetc(r2)&255;_decode_event(r32,r34,r2);r46=(r31<<3)+r33+8|0;r45=HEAP8[r46];r50=r45&15;r48=(r31<<3)+r33+7|0;r49=HEAP8[HEAPU8[r48]+5250860|0];HEAP8[r48]=r49;r51=r49&255;if((r51|0)==255){HEAP8[r46]=0;HEAP8[r48]=0;r36=r14;r37=r31;r38=r47;r39=r32;break}else if((r51|0)!=14){r36=r14;r37=r31;r38=r47;r39=r32;break}r51=(r45&255)>>>4&255;if((r51|0)==6){HEAP8[r46]=r50|96;r36=r14;r37=r31;r38=r47;r39=r32;break}else if((r51|0)==4){HEAP8[r46]=r50|64;r36=r14;r37=r31;r38=r47;r39=r32;break}else if((r51|0)==5){HEAP8[r46]=r50|80;r36=r14;r37=r31;r38=r47;r39=r32;break}else if((r51|0)==7){HEAP8[r46]=r50|112;r36=r14;r37=r31;r38=r47;r39=r32;break}else if((r51|0)==12){HEAP8[r46]=r50|-64;r36=r14;r37=r31;r38=r47;r39=r32;break}else if((r51|0)==3){HEAP8[r46]=r50|48;r36=r14;r37=r31;r38=r47;r39=r32;break}else if((r51|0)==13){HEAP8[r46]=r50|-48;r36=r14;r37=r31;r38=r47;r39=r32;break}else if((r51|0)==14){HEAP8[r46]=r50|-32;r36=r14;r37=r31;r38=r47;r39=r32;break}else{HEAP8[r46]=0;HEAP8[r48]=0;r36=r14;r37=r31;r38=r47;r39=r32;break}}else if(r5==2776){r5=0;r47=_fgetc(r2);r40=(r47&255)+r14|0;r41=r47&255}else if(r5==2806){r5=0;r47=_fgetc(r2);r48=r47&255;_decode_event(r32,r34,r2);r46=(r31<<3)+r33+8|0;r50=HEAP8[r46];r51=r50&15;r45=(r31<<3)+r33+7|0;r49=HEAP8[HEAPU8[r45]+5250860|0];HEAP8[r45]=r49;r52=r49&255;do{if((r52|0)==255){HEAP8[r46]=0;HEAP8[r45]=0}else if((r52|0)==14){r49=(r50&255)>>>4&255;if((r49|0)==3){HEAP8[r46]=r51|48;break}else if((r49|0)==4){HEAP8[r46]=r51|64;break}else if((r49|0)==5){HEAP8[r46]=r51|80;break}else if((r49|0)==6){HEAP8[r46]=r51|96;break}else if((r49|0)==7){HEAP8[r46]=r51|112;break}else if((r49|0)==12){HEAP8[r46]=r51|-64;break}else if((r49|0)==13){HEAP8[r46]=r51|-48;break}else if((r49|0)==14){HEAP8[r46]=r51|-32;break}else{HEAP8[r46]=0;HEAP8[r45]=0;break}}}while(0);if(r48<<24>>24==0){r36=r14;r37=r31;r38=0;r39=r32;break}r45=r34;r46=r47+255&255;r51=r48;r50=r31;while(1){r52=r50+1|0;r43=(r52<<3)+HEAP32[HEAP32[r21]+(HEAP32[HEAP32[HEAP32[r24]+(r15<<2)>>2]+(r14<<2)+4>>2]<<2)>>2]+4|0;r35=r45|0;r49=r45+4|0;r53=HEAPU8[r49]|HEAPU8[r49+1|0]<<8|HEAPU8[r49+2|0]<<16|HEAPU8[r49+3|0]<<24|0;r49=r43|0;tempBigInt=HEAPU8[r35]|HEAPU8[r35+1|0]<<8|HEAPU8[r35+2|0]<<16|HEAPU8[r35+3|0]<<24|0;HEAP8[r49]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r49+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r49+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r49+3|0]=tempBigInt&255;r49=r43+4|0;tempBigInt=r53;HEAP8[r49]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r49+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r49+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r49+3|0]=tempBigInt&255;r49=r51-1&255;if(r49<<24>>24==0){break}else{r51=r49;r50=r52}}r36=r14;r37=r46+(r31+1)|0;r38=0;r39=r32;break}else if(r5==2778){r5=0;r50=_fgetc(r2);r36=r14;r37=(r50&255)+r31|0;r38=0;r39=r50&255;break}r50=r40+1|0;r36=(r50|0)<(HEAP32[r18]|0)?r50:r40;r37=-1;r38=0;r39=r41}else{_decode_event(r27,(r16<<3)+r30+4|0,r2);r50=(r16<<3)+r30+8|0;r51=HEAP8[r50];r45=r51&15;r48=(r16<<3)+r30+7|0;r47=HEAP8[HEAPU8[r48]+5250860|0];HEAP8[r48]=r47;r52=r47&255;do{if((r52|0)==14){r47=(r51&255)>>>4&255;if((r47|0)==4){HEAP8[r50]=r45|64;break}else if((r47|0)==6){HEAP8[r50]=r45|96;break}else if((r47|0)==12){HEAP8[r50]=r45|-64;break}else if((r47|0)==5){HEAP8[r50]=r45|80;break}else if((r47|0)==7){HEAP8[r50]=r45|112;break}else if((r47|0)==3){HEAP8[r50]=r45|48;break}else if((r47|0)==13){HEAP8[r50]=r45|-48;break}else if((r47|0)==14){HEAP8[r50]=r45|-32;break}else{HEAP8[r50]=0;HEAP8[r48]=0;break}}else if((r52|0)==255){HEAP8[r50]=0;HEAP8[r48]=0}}while(0);r36=r14;r37=r16;r38=r28-1&255;r39=r27}}while(0);r30=r37+1|0;r48=HEAP32[HEAP32[r24]+(r15<<2)>>2];if((r30|0)<(HEAP32[r48>>2]|0)){r14=r36;r16=r30;r28=r38;r27=r39;r29=r48;continue}r30=r36+1|0;r14=(r30|0)<(HEAP32[r18]|0)?r30:0;r16=0;r28=0;r27=r39;r29=r48}if((_ftell(r2)-r12|0)==(r7|0)){r54=r32}else{r5=2775;break}}else if((r13|0)==555819297){r54=r10}else{r5=2754;break}r29=r15+1|0;if((r29|0)<(HEAP32[r19]|0)){r10=r54;r15=r29}else{break L3955}}if(r5==2754){___assert_func(5266092,312,5268792,5265224)}else if(r5==2830){___assert_func(5266092,435,5268792,5264024)}else if(r5==2844){___assert_func(5266092,442,5268792,5263428)}else if(r5==2846){___assert_func(5266092,443,5268792,5263068)}else if(r5==2848){___assert_func(5266092,444,5268792,5262860)}else if(r5==2775){___assert_func(5266092,355,5268792,5264620)}}}while(0);r54=(r1+176|0)>>2;HEAP32[r54]=_calloc(764,HEAP32[r22]);r19=HEAP32[r20>>2];if((r19|0)!=0){HEAP32[r4+45]=_calloc(52,r19)}if((HEAP32[r22]|0)<=0){r55=HEAP32[r17];r56=r55|545;HEAP32[r17]=r56;r57=r1+1280|0;HEAP32[r57>>2]=2;STACKTOP=r6;return 0}r19=r11|0;r4=r11+1|0;r20=r11+2|0;r32=r11+3|0;r11=r8|0;r39=r8+2|0;r18=r8+32|0;r36=r8+52|0;r38=r8+72|0;r24=(r8+76|0)>>2;r37=r8+80|0;r41=(r8+84|0)>>2;r40=r8+88|0;r21=r8+92|0;r34=r8+93|0;r33=r8+94|0;r44=r8+95|0;r42=r8+96|0;r9=r8+97|0;r15=r8+98|0;r10=r8+100|0;r3=r8+104|0;r25=r8+108|0;r26=r8+109|0;r23=r8+120|0;r8=(r1+180|0)>>2;r29=0;L4087:while(1){r27=_calloc(64,1);HEAP32[HEAP32[r54]+(r29*764&-1)+756>>2]=r27;_fread(r19,1,4,r2);r27=HEAP8[r19];do{if(r27<<24>>24==63){if(HEAP8[r4]<<24>>24!=63){r5=2886;break L4087}if(HEAP8[r20]<<24>>24==63){if(HEAP8[r32]<<24>>24==63){break}}if(r27<<24>>24==76){r5=2862;break}else{r5=2887;break L4087}}else if(r27<<24>>24==76){r5=2862}else{r5=2885;break L4087}}while(0);do{if(r5==2862){r5=0;if(HEAP8[r4]<<24>>24!=68){r5=2888;break L4087}if(HEAP8[r20]<<24>>24!=83){r5=2889;break L4087}if(HEAP8[r32]<<24>>24!=83){r5=2890;break L4087}HEAP16[r11>>1]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;_fread(r39,30,1,r2);_fread(r18,20,1,r2);_fread(r36,20,1,r2);HEAP8[r38]=_fgetc(r2)&255;r27=_fgetc(r2)&255;r28=_fgetc(r2);HEAP32[r24]=r28<<8&65280|r27|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r27=_fgetc(r2)&255;r28=_fgetc(r2);HEAP32[r37>>2]=r28<<8&65280|r27|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r27=_fgetc(r2)&255;r28=_fgetc(r2);HEAP32[r41]=r28<<8&65280|r27|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r27=_fgetc(r2)&255;r28=_fgetc(r2);HEAP32[r40>>2]=r28<<8&65280|r27|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;HEAP8[r21]=_fgetc(r2)&255;HEAP8[r34]=_fgetc(r2)&255;HEAP8[r33]=_fgetc(r2)&255;HEAP8[r44]=_fgetc(r2)&255;HEAP8[r42]=_fgetc(r2)&255;HEAP8[r9]=_fgetc(r2)&255;HEAP16[r15>>1]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;HEAP16[r10>>1]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;r27=_fgetc(r2)&255;r28=_fgetc(r2);HEAP32[r3>>2]=r28<<8&65280|r27|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;HEAP8[r25]=_fgetc(r2)&255;_fread(r26,11,1,r2);_fread(r23,25,1,r2);HEAP32[HEAP32[r54]+(r29*764&-1)+36>>2]=(HEAP32[r24]|0)!=0&1;HEAP32[HEAP32[r54]+(r29*764&-1)+32>>2]=64;HEAP32[HEAP32[r8]+(r29*52&-1)+32>>2]=HEAP32[r24];HEAP32[HEAP32[r8]+(r29*52&-1)+36>>2]=HEAP32[r37>>2];HEAP32[HEAP32[r8]+(r29*52&-1)+40>>2]=HEAP32[r41];if((HEAP8[r34]&1)<<24>>24!=0){HEAP32[HEAP32[r8]+(r29*52&-1)+44>>2]=1;r27=HEAP32[r8]+(r29*52&-1)+32|0;HEAP32[r27>>2]=HEAP32[r27>>2]>>1;r27=HEAP32[r8]+(r29*52&-1)+36|0;HEAP32[r27>>2]=HEAP32[r27>>2]>>1;r27=HEAP32[r8]+(r29*52&-1)+40|0;HEAP32[r27>>2]=HEAP32[r27>>2]>>1}if((HEAP32[r41]|0)!=0){HEAP32[HEAP32[r8]+(r29*52&-1)+44>>2]=2}HEAP8[r42]=64;HEAP32[HEAP32[HEAP32[r54]+(r29*764&-1)+756>>2]>>2]=HEAPU8[r21];HEAP32[HEAP32[HEAP32[r54]+(r29*764&-1)+756>>2]+4>>2]=HEAPU8[r42];HEAP32[HEAP32[HEAP32[r54]+(r29*764&-1)+756>>2]+8>>2]=HEAPU8[r33];HEAP32[HEAP32[HEAP32[r54]+(r29*764&-1)+756>>2]+40>>2]=r29;r27=HEAP32[r54];r28=r27+(r29*764&-1)|0;_memset(r28,0,32);_strncpy(r28,r39,31);r16=HEAP8[r28];L4106:do{if(r16<<24>>24!=0){r14=0;r48=r28;r30=r16;while(1){do{if((_isprint(r30<<24>>24)|0)==0){r5=2874}else{if(HEAP8[r48]<<24>>24<0){r5=2874;break}else{break}}}while(0);if(r5==2874){r5=0;HEAP8[r48]=46}r50=r14+1|0;r52=r27+(r29*764&-1)+r50|0;r45=HEAP8[r52];if(r45<<24>>24!=0&(r50|0)<31){r14=r50;r48=r52;r30=r45}else{break}}if(HEAP8[r28]<<24>>24==0){break}while(1){r30=_strlen(r28)-1+r27+(r29*764&-1)|0;if(HEAP8[r30]<<24>>24!=32){break L4106}HEAP8[r30]=0;if(HEAP8[r28]<<24>>24==0){break L4106}}}}while(0);r28=HEAP32[r40>>2];r27=HEAP32[HEAP32[r54]+(r29*764&-1)+756>>2];r16=r27+12|0;r13=r27+16|0;if((r28|0)==0){HEAP32[r13>>2]=0;HEAP32[r16>>2]=0}else{r27=Math.log((r28|0)/8363)*1536/.6931471805599453&-1;HEAP32[r16>>2]=(r27|0)/128&-1;HEAP32[r13>>2]=(r27|0)%128}_fseek(r2,HEAPU16[r15>>1]-144|0,1);r27=HEAP32[r8];if((HEAP32[r27+(r29*52&-1)+32>>2]|0)==0){break}_load_sample(r2,0,r27+(r29*52&-1)|0,0)}}while(0);r27=r29+1|0;if((r27|0)<(HEAP32[r22]|0)){r29=r27}else{r5=2892;break}}if(r5==2885){___assert_func(5266092,479,5268792,5262624)}else if(r5==2886){___assert_func(5266092,479,5268792,5262624)}else if(r5==2887){___assert_func(5266092,479,5268792,5262624)}else if(r5==2888){___assert_func(5266092,479,5268792,5262624)}else if(r5==2889){___assert_func(5266092,479,5268792,5262624)}else if(r5==2890){___assert_func(5266092,479,5268792,5262624)}else if(r5==2892){r55=HEAP32[r17];r56=r55|545;HEAP32[r17]=r56;r57=r1+1280|0;HEAP32[r57>>2]=2;STACKTOP=r6;return 0}}function _get_sdft(r1,r2,r3,r4){return}function _get_dsmp_cnt(r1,r2,r3,r4){r4=r1+140|0;r3=HEAP32[r4>>2]+1|0;HEAP32[r4>>2]=r3;HEAP32[r1+144>>2]=r3;return}function _masi_test(r1,r2,r3){var r4,r5,r6,r7,r8,r9;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+64|0;r5=r4;r6=_fgetc(r1);r7=_fgetc(r1);if((r7<<16&16711680|r6<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255|0)!=1347636512){r8=-1;STACKTOP=r4;return r8}_fgetc(r1);_fgetc(r1);_fgetc(r1);if((_fgetc(r1)&255)<<24>>24!=0){r8=-1;STACKTOP=r4;return r8}r6=_fgetc(r1);r7=_fgetc(r1);if((r7<<16&16711680|r6<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255|0)!=1179208773){r8=-1;STACKTOP=r4;return r8}_fgetc(r1);_fgetc(r1);_fgetc(r1);_fgetc(r1);r6=_fgetc(r1)&255;r7=_fgetc(r1);_fseek(r1,r7<<8&65280|r6|_fgetc(r1)<<16&16711680|_fgetc(r1)<<24,1);r6=_fgetc(r1);r7=_fgetc(r1);if((r7<<16&16711680|r6<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255|0)==1414091852){r6=_fgetc(r1)&255;r7=_fgetc(r1);r9=r7<<8&65280|r6|_fgetc(r1)<<16&16711680|_fgetc(r1)<<24;r6=r5|0;if((r2|0)==0){r8=0;STACKTOP=r4;return r8}r7=(r9|0)>63?63:r9;_memset(r2,0,r7+1|0);_fread(r6,1,r7,r1);HEAP8[r5+r7|0]=0;_copy_adjust(r2,r6,r7);r8=0;STACKTOP=r4;return r8}r7=r5|0;if((r2|0)==0){r8=0;STACKTOP=r4;return r8}HEAP8[r2]=0;_fread(r7,1,0,r1);HEAP8[r7]=0;HEAP8[r2]=0;_strncpy(r2,r7,0);if(HEAP8[r2]<<24>>24==0){r8=0;STACKTOP=r4;return r8}while(1){r7=r2+(_strlen(r2)-1)|0;if(HEAP8[r7]<<24>>24!=32){r8=0;r3=2906;break}HEAP8[r7]=0;if(HEAP8[r2]<<24>>24==0){r8=0;r3=2908;break}}if(r3==2906){STACKTOP=r4;return r8}else if(r3==2908){STACKTOP=r4;return r8}}function _masi_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23;r4=r1>>2;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+20|0;r7=r6;_fseek(r2,r3,0);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r8=(r7|0)>>2;HEAP32[r8]=0;HEAP8[r1|0]=0;_fseek(r2,8,1);r9=r1+140|0;HEAP32[r9>>2]=0;r10=r1+144|0;HEAP32[r10>>2]=0;HEAP32[r7+4>>2]=0;HEAP32[r7+8>>2]=0;r11=_ftell(r2);r12=_malloc(16);if((r12|0)==0){r13=-1;STACKTOP=r6;return r13}r14=r12;r15=r12;HEAP32[r15>>2]=r14;r16=(r12+4|0)>>2;HEAP32[r16]=r14;HEAP32[r12+8>>2]=4;r17=(r12+12|0)>>2;HEAP32[r17]=0;r18=_malloc(20);HEAP8[r18]=HEAP8[5267356];HEAP8[r18+1|0]=HEAP8[5267357|0];HEAP8[r18+2|0]=HEAP8[5267358|0];HEAP8[r18+3|0]=HEAP8[5267359|0];HEAP8[r18+4|0]=HEAP8[5267360|0];HEAP32[r18+8>>2]=476;r19=r18+12|0;r20=r19;r21=HEAP32[r16];HEAP32[r16]=r20;HEAP32[r19>>2]=r14;HEAP32[r18+16>>2]=r21;HEAP32[r21>>2]=r20;r20=_malloc(20);HEAP8[r20]=HEAP8[5266084];HEAP8[r20+1|0]=HEAP8[5266085|0];HEAP8[r20+2|0]=HEAP8[5266086|0];HEAP8[r20+3|0]=HEAP8[5266087|0];HEAP8[r20+4|0]=HEAP8[5266088|0];HEAP32[r20+8>>2]=196;r21=r20+12|0;r18=r21;r19=HEAP32[r16];HEAP32[r16]=r18;HEAP32[r21>>2]=r14;HEAP32[r20+16>>2]=r19;HEAP32[r19>>2]=r18;r18=_malloc(20);HEAP8[r18]=HEAP8[5265196];HEAP8[r18+1|0]=HEAP8[5265197|0];HEAP8[r18+2|0]=HEAP8[5265198|0];HEAP8[r18+3|0]=HEAP8[5265199|0];HEAP8[r18+4|0]=HEAP8[5265200|0];HEAP32[r18+8>>2]=482;r19=r18+12|0;r20=r19;r21=HEAP32[r16];HEAP32[r16]=r20;HEAP32[r19>>2]=r14;HEAP32[r18+16>>2]=r21;HEAP32[r21>>2]=r20;r20=_malloc(20);HEAP8[r20]=HEAP8[5264612];HEAP8[r20+1|0]=HEAP8[5264613|0];HEAP8[r20+2|0]=HEAP8[5264614|0];HEAP8[r20+3|0]=HEAP8[5264615|0];HEAP8[r20+4|0]=HEAP8[5264616|0];HEAP32[r20+8>>2]=536;r21=r20+12|0;r18=r21;r19=HEAP32[r16];HEAP32[r16]=r18;HEAP32[r21>>2]=r14;HEAP32[r20+16>>2]=r19;HEAP32[r19>>2]=r18;r18=_malloc(20);HEAP8[r18]=HEAP8[5263016];HEAP8[r18+1|0]=HEAP8[5263017|0];HEAP8[r18+2|0]=HEAP8[5263018|0];HEAP8[r18+3|0]=HEAP8[5263019|0];HEAP8[r18+4|0]=HEAP8[5263020|0];HEAP32[r18+8>>2]=400;r19=r18+12|0;r20=r19;r21=HEAP32[r16];HEAP32[r16]=r20;HEAP32[r19>>2]=r14;HEAP32[r18+16>>2]=r21;HEAP32[r21>>2]=r20;HEAP32[r17]=HEAP32[r17]|1;L4167:do{if((_feof(r2)|0)==0){r17=r7;while(1){_iff_chunk(r12,r1,r2,r17);if((_feof(r2)|0)!=0){break L4167}}}}while(0);r17=HEAP32[r15>>2];L4172:do{if((r17|0)!=(r14|0)){r15=r17;while(1){r20=r15-16+4|0;r21=HEAP32[r20+12>>2];r18=HEAP32[r20+16>>2];HEAP32[r21+4>>2]=r18;HEAP32[r18>>2]=r21;r21=HEAP32[r15>>2];_free(r20);if((r21|0)==(r14|0)){break L4172}else{r15=r21}}}}while(0);_free(r12);r12=(r1+128|0)>>2;r14=HEAP32[r12];r17=r1+132|0;HEAP32[r17>>2]=Math.imul(HEAP32[r4+34],r14);r15=(r7+12|0)>>2;HEAP32[r15]=_malloc(r14<<3);r14=(r7+16|0)>>2;HEAP32[r14]=_malloc(2040);_set_type(r1,(HEAP32[r8]|0)!=0?5263416:5263044,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));HEAP32[r4+44]=_calloc(764,HEAP32[r9>>2]);r9=HEAP32[r10>>2];if((r9|0)!=0){HEAP32[r4+45]=_calloc(52,r9)}HEAP32[r4+43]=_calloc(4,HEAP32[r17>>2]);HEAP32[r4+42]=_calloc(4,HEAP32[r12]+1|0);_fseek(r2,r11+r3|0,0);r3=r1+156|0;HEAP32[r3>>2]=0;r11=_malloc(16);if((r11|0)==0){r13=-1;STACKTOP=r6;return r13}r4=r11;r17=r11;HEAP32[r17>>2]=r4;r9=(r11+4|0)>>2;HEAP32[r9]=r4;HEAP32[r11+8>>2]=4;r10=(r11+12|0)>>2;HEAP32[r10]=0;r21=_malloc(20);HEAP8[r21]=HEAP8[5265196];HEAP8[r21+1|0]=HEAP8[5265197|0];HEAP8[r21+2|0]=HEAP8[5265198|0];HEAP8[r21+3|0]=HEAP8[5265199|0];HEAP8[r21+4|0]=HEAP8[5265200|0];HEAP32[r21+8>>2]=424;r20=r21+12|0;r18=r20;r19=HEAP32[r9];HEAP32[r9]=r18;HEAP32[r20>>2]=r4;HEAP32[r21+16>>2]=r19;HEAP32[r19>>2]=r18;r18=_malloc(20);HEAP8[r18]=HEAP8[5264612];HEAP8[r18+1|0]=HEAP8[5264613|0];HEAP8[r18+2|0]=HEAP8[5264614|0];HEAP8[r18+3|0]=HEAP8[5264615|0];HEAP8[r18+4|0]=HEAP8[5264616|0];HEAP32[r18+8>>2]=78;r19=r18+12|0;r21=r19;r20=HEAP32[r9];HEAP32[r9]=r21;HEAP32[r19>>2]=r4;HEAP32[r18+16>>2]=r20;HEAP32[r20>>2]=r21;r21=_malloc(20);HEAP8[r21]=HEAP8[5263016];HEAP8[r21+1|0]=HEAP8[5263017|0];HEAP8[r21+2|0]=HEAP8[5263018|0];HEAP8[r21+3|0]=HEAP8[5263019|0];HEAP8[r21+4|0]=HEAP8[5263020|0];HEAP32[r21+8>>2]=548;r20=r21+12|0;r18=r20;r19=HEAP32[r9];HEAP32[r9]=r18;HEAP32[r20>>2]=r4;HEAP32[r21+16>>2]=r19;HEAP32[r19>>2]=r18;HEAP32[r10]=HEAP32[r10]|1;L4182:do{if((_feof(r2)|0)==0){r10=r7;while(1){_iff_chunk(r11,r1,r2,r10);if((_feof(r2)|0)!=0){break L4182}}}}while(0);r2=HEAP32[r17>>2];L4187:do{if((r2|0)!=(r4|0)){r17=r2;while(1){r7=r17-16+4|0;r10=HEAP32[r7+12>>2];r18=HEAP32[r7+16>>2];HEAP32[r10+4>>2]=r18;HEAP32[r18>>2]=r10;r10=HEAP32[r17>>2];_free(r7);if((r10|0)==(r4|0)){break L4187}else{r17=r10}}}}while(0);_free(r11);r11=0;while(1){if((r11|0)>=(HEAP32[r3>>2]|0)){r5=2931;break}r4=HEAP32[r12];r2=(r11<<3)+HEAP32[r14]|0;r17=HEAP32[r15];r10=(HEAP32[r8]|0)!=0?8:4;r7=0;while(1){if((r7|0)>=(r4|0)){r22=r4;break}if((_memcmp(r2,(r7<<3)+r17|0,r10)|0)==0){r5=2935;break}else{r7=r7+1|0}}if(r5==2935){r5=0;HEAP8[r1+(r11+952)|0]=r7&255;r22=HEAP32[r12]}if((r7|0)==(r22|0)){r23=r17;break}r11=r11+1|0}if(r5==2931){r23=HEAP32[r15]}_free(r23);_free(HEAP32[r14]);r13=0;STACKTOP=r6;return r13}function _get_titl(r1,r2,r3,r4){var r5;r4=STACKTOP;STACKTOP=STACKTOP+40|0;r5=r4|0;_fread(r5,1,40,r3);_strncpy(r1|0,r5,(r2|0)>32?32:r2);STACKTOP=r4;return}function _get_song330(r1,r2,r3,r4){_fseek(r3,10,1);HEAP32[r1+136>>2]=_fgetc(r3)&255;return}function _get_pbod_cnt(r1,r2,r3,r4){var r5,r6;r2=STACKTOP;STACKTOP=STACKTOP+20|0;r5=r2;r6=r1+128|0;HEAP32[r6>>2]=HEAP32[r6>>2]+1|0;_fread(r5|0,1,20,r3);if(HEAP8[r5+9|0]<<24>>24==0){STACKTOP=r2;return}if(HEAP8[r5+13|0]<<24>>24!=0){STACKTOP=r2;return}HEAP32[r4>>2]=1;STACKTOP=r2;return}function _get_song_2(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;r2=STACKTOP;STACKTOP=STACKTOP+20|0;_fread(r2|0,1,9,r3);_fgetc(r3);_fgetc(r3);r5=_fgetc(r3);r6=_fgetc(r3);r7=(r6<<16&16711680|r5<<24|_fgetc(r3)<<8&65280|_fgetc(r3)&255|0)==1330662472;r5=_fgetc(r3);r6=_fgetc(r3);r8=_fgetc(r3);r9=_fgetc(r3);L4216:do{if(!r7){r10=r5;r11=r6;r12=r8;r13=r9;while(1){_fseek(r3,r11<<8&65280|r10&255|r12<<16&16711680|r13<<24,1);r14=_fgetc(r3);r15=_fgetc(r3);r16=(r15<<16&16711680|r14<<24|_fgetc(r3)<<8&65280|_fgetc(r3)&255|0)==1330662472;r14=_fgetc(r3);r15=_fgetc(r3);r17=_fgetc(r3);r18=_fgetc(r3);if(r16){break L4216}else{r10=r14;r11=r15;r12=r17;r13=r18}}}}while(0);_fseek(r3,9,1);r9=_fgetc(r3);L4220:do{if((r9&255)<<24>>24!=1){r8=r1+148|0;r6=r1+152|0;r5=0;r7=r9;while(1){r13=r7<<24>>24;if((r13|0)==14){_fgetc(r3);_fgetc(r3);r19=r5}else if((r13|0)==13){_fgetc(r3);HEAP32[r1+(r5*12&-1)+184>>2]=_fgetc(r3)&255;_fgetc(r3);r19=r5+1|0}else if((r13|0)==7){HEAP32[r8>>2]=_fgetc(r3)&255;_fgetc(r3);HEAP32[r6>>2]=_fgetc(r3)&255;r19=r5}else{r12=_fgetc(r3)&255;_printf(5268004,(tempInt=STACKTOP,STACKTOP=STACKTOP+12|0,HEAP32[tempInt>>2]=r5,HEAP32[tempInt+4>>2]=r13,HEAP32[tempInt+8>>2]=r12,tempInt));r19=r5}r12=_fgetc(r3);if((r12&255)<<24>>24==1){break L4220}else{r5=r19;r7=r12}}}}while(0);r19=r4+16|0;r9=(r1+156|0)>>2;r1=r4;while(1){_fread((HEAP32[r9]<<3)+HEAP32[r19>>2]|0,1,(HEAP32[r1>>2]|0)!=0?8:4,r3);HEAP32[r9]=HEAP32[r9]+1|0;if((_fgetc(r3)&255)<<24>>24!=1){break}}STACKTOP=r2;return}
function _decode_event(r1,r2,r3){var r4,r5;r4=r2;r5=r4|0;tempBigInt=0;HEAP8[r5]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt&255;r5=r4+4|0;tempBigInt=0;HEAP8[r5]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r5+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r5+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r5+3|0]=tempBigInt&255;r5=r1&255;do{if((r5&1|0)!=0){r1=_fgetc(r3)&255;if(r1<<24>>24==-2){HEAP8[r2|0]=-127;break}else{HEAP8[r2|0]=r1+37&255;break}}}while(0);if((r5&2|0)!=0){HEAP8[r2+1|0]=(_fgetc(r3)&255)+1&255}if((r5&4|0)!=0){HEAP8[r2+2|0]=_fgetc(r3)&255}if((r5&8|0)!=0){HEAP8[r2+3|0]=(_fgetc(r3)&255)-65&255}if((r5&16|0)!=0){HEAP8[r2+4|0]=_fgetc(r3)&255}r3=HEAP8[r2|0];if(!((r3&255)<108|r3<<24>>24==-127)){___assert_func(5266092,205,5268828,5268028)}if(HEAPU8[r2+1|0]>=101){___assert_func(5266092,206,5268828,5263068)}if(HEAPU8[r2+2|0]>=65){___assert_func(5266092,207,5268828,5267772)}if(HEAPU8[r2+3|0]<27){return}else{___assert_func(5266092,208,5268828,5264024)}}function _get_dsmp(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24;r2=0;_fgetc(r3);_fseek(r3,8,1);r5=r4;_fseek(r3,(HEAP32[r5>>2]|0)!=0?8:4,1);r6=(r4+8|0)>>2;r4=HEAP32[r6];r7=_calloc(64,1);r8=(r1+176|0)>>2;HEAP32[HEAP32[r8]+(r4*764&-1)+756>>2]=r7;_fread(HEAP32[r8]+(r4*764&-1)|0,1,34,r3);r7=HEAP32[r8];r9=r7+(r4*764&-1)|0;r10=HEAP8[r9];L4266:do{if(r10<<24>>24!=0){r11=0;r12=r10;while(1){r13=r7+(r4*764&-1)+r11|0;do{if((_isprint(r12<<24>>24)|0)==0){r2=2990}else{if(HEAP8[r13]<<24>>24<0){r2=2990;break}else{break}}}while(0);if(r2==2990){r2=0;HEAP8[r13]=32}r14=r11+1|0;if(r14>>>0>=_strlen(r9)>>>0){break}r11=r14;r12=HEAP8[r7+(r4*764&-1)+r14|0]}if(HEAP8[r9]<<24>>24==0){break}while(1){r12=_strlen(r9)-1+r7+(r4*764&-1)|0;if(HEAP8[r12]<<24>>24!=32){break L4266}HEAP8[r12]=0;if(HEAP8[r9]<<24>>24==0){break L4266}}}}while(0);_fseek(r3,5,1);_fgetc(r3);_fgetc(r3);r9=_fgetc(r3)&255;r7=_fgetc(r3);r2=r7<<8&65280|r9|_fgetc(r3)<<16&16711680|_fgetc(r3)<<24;r9=(r1+180|0)>>2;HEAP32[HEAP32[r9]+(r4*52&-1)+32>>2]=r2;HEAP32[HEAP32[r8]+(r4*764&-1)+36>>2]=(HEAP32[HEAP32[r9]+(r4*52&-1)+32>>2]|0)!=0&1;r2=_fgetc(r3)&255;r1=_fgetc(r3);r7=r1<<8&65280|r2|_fgetc(r3)<<16&16711680|_fgetc(r3)<<24;HEAP32[HEAP32[r9]+(r4*52&-1)+36>>2]=r7;r7=_fgetc(r3)&255;r2=_fgetc(r3);r1=r2<<8&65280|r7|_fgetc(r3)<<16&16711680|_fgetc(r3)<<24;HEAP32[HEAP32[r9]+(r4*52&-1)+40>>2]=r1;r1=HEAP32[r9];HEAP32[r1+(r4*52&-1)+44>>2]=(HEAP32[r1+(r4*52&-1)+40>>2]|0)>2?2:0;_fgetc(r3);_fgetc(r3);r1=HEAP32[r9]+(r4*52&-1)+40|0;if((HEAP32[r1>>2]|0)<0){HEAP32[r1>>2]=0}if((HEAP32[r5>>2]|0)==0){r15=0}else{r5=HEAP32[r9];r1=r5+(r4*52&-1)+32|0;r7=HEAP32[r1>>2];if((r7|0)>2){HEAP32[r1>>2]=r7-2|0;r16=HEAP32[r9]}else{r16=r5}r5=r16+(r4*52&-1)+40|0;r16=HEAP32[r5>>2];if((r16|0)>2){HEAP32[r5>>2]=r16-2|0}r15=(_fgetc(r3)&255)<<28>>24}r16=(_fgetc(r3)>>>1&127)+1|0;HEAP32[HEAP32[HEAP32[r8]+(r4*764&-1)+756>>2]>>2]=r16;_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);HEAP32[HEAP32[HEAP32[r8]+(r4*764&-1)+756>>2]+8>>2]=128;HEAP32[HEAP32[HEAP32[r8]+(r4*764&-1)+756>>2]+40>>2]=r4;r16=_fgetc(r3)&255;r5=_fgetc(r3);r7=(r5<<8&65280|r16|_fgetc(r3)<<16&16711680|_fgetc(r3)<<24)*8363&-1;r16=HEAP32[HEAP32[r8]+(r4*764&-1)+756>>2];r5=r16+12|0;r1=r16+16|0;if((r7+8447|0)>>>0<16895){HEAP32[r1>>2]=0;HEAP32[r5>>2]=0;r16=HEAP32[r8];r2=r16+(r4*764&-1)+756|0;r10=HEAP32[r2>>2];r12=r10+16|0,r11=r12>>2;r14=HEAP32[r11];r17=r14+r15|0;HEAP32[r11]=r17;r18=_fseek(r3,16,1);r19=HEAP32[r9];r20=r19+(r4*52&-1)|0;r21=_load_sample(r3,4,r20,0);r22=HEAP32[r6];r23=r22+1|0;HEAP32[r6]=r23;return}else{r24=Math.log(((r7|0)/8448&-1|0)/8363)*1536/.6931471805599453&-1;HEAP32[r5>>2]=(r24|0)/128&-1;HEAP32[r1>>2]=(r24|0)%128;r16=HEAP32[r8];r2=r16+(r4*764&-1)+756|0;r10=HEAP32[r2>>2];r12=r10+16|0,r11=r12>>2;r14=HEAP32[r11];r17=r14+r15|0;HEAP32[r11]=r17;r18=_fseek(r3,16,1);r19=HEAP32[r9];r20=r19+(r4*52&-1)|0;r21=_load_sample(r3,4,r20,0);r22=HEAP32[r6];r23=r22+1|0;HEAP32[r6]=r23;return}}function _get_pbod(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29;r2=STACKTOP;STACKTOP=STACKTOP+8|0;r5=r2;r6=(r4+4|0)>>2;r7=HEAP32[r6];_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);r8=r4>>2;_fread((r7<<3)+HEAP32[r4+12>>2]|0,1,(HEAP32[r8]|0)!=0?8:4,r3);r4=_fgetc(r3)&255|_fgetc(r3)<<8&65280;r9=(r1+136|0)>>2;r10=_calloc(1,(HEAP32[r9]<<2)+4|0);r11=(r1+168|0)>>2;HEAP32[HEAP32[r11]+(r7<<2)>>2]=r10;HEAP32[HEAP32[HEAP32[r11]+(r7<<2)>>2]>>2]=r4;r10=HEAP32[r9];r12=(r1+172|0)>>2;L4298:do{if((r10|0)>0){r1=0;r13=r10;while(1){r14=Math.imul(r13,r7)+r1|0;HEAP32[HEAP32[HEAP32[r11]+(r7<<2)>>2]+(r1<<2)+4>>2]=r14;r14=_calloc(HEAP32[HEAP32[HEAP32[r11]+(r7<<2)>>2]>>2]<<3|4,1);r15=Math.imul(HEAP32[r9],r7)+r1|0;HEAP32[HEAP32[r12]+(r15<<2)>>2]=r14;r14=HEAP32[HEAP32[HEAP32[r11]+(r7<<2)>>2]>>2];r15=Math.imul(HEAP32[r9],r7)+r1|0;HEAP32[HEAP32[HEAP32[r12]+(r15<<2)>>2]>>2]=r14;r14=r1+1|0;r15=HEAP32[r9];if((r14|0)<(r15|0)){r1=r14;r13=r15}else{break L4298}}}}while(0);r10=0;while(1){r13=(_fgetc(r3)&255|_fgetc(r3)<<8&65280)-2|0;L4304:do{if((r13|0)>0){r1=r13;while(1){r15=_fgetc(r3);if((r1|0)==1){break L4304}r14=_fgetc(r3)&255;if((r14|0)<(HEAP32[r9]|0)){r16=(r10<<3)+HEAP32[HEAP32[r12]+(HEAP32[HEAP32[HEAP32[r11]+(r7<<2)>>2]+(r14<<2)+4>>2]<<2)>>2]+4|0}else{r16=r5}if((r15&128|0)==0){r17=r1-2|0}else{r18=_fgetc(r3)&255;if((HEAP32[r8]|0)==0){r19=((r18&15)+14&255)+(((r18&255)>>>4)*12&255)&255}else{r19=r18+37&255}HEAP8[r16|0]=r19;r17=r1-3|0}if((r15&64|0)==0){r20=r17}else{HEAP8[r16+1|0]=(_fgetc(r3)&255)+1&255;r20=r17-1|0}if((r15&32|0)==0){r21=r20}else{HEAP8[r16+2|0]=(_fgetc(r3)&255)>>>1;r21=r20-1|0}if((r15&16|0)==0){r22=r21}else{r15=_fgetc(r3);r18=r15&255;r23=_fgetc(r3);r24=r23&255;r25=r21-2|0;r26=r15&255;do{if((r18&255)>63){if((r23&240|0)==0){HEAP8[r16|0]=((r18&15)+2&255)+(((r18&255)>>>4)*12&255)&255;r27=(r24<<1)+2&255;r28=3;r29=r25;break}else{_printf(5262816,(tempInt=STACKTOP,STACKTOP=STACKTOP+20|0,HEAP32[tempInt>>2]=r7,HEAP32[tempInt+4>>2]=r10,HEAP32[tempInt+8>>2]=r14,HEAP32[tempInt+12>>2]=r26,HEAP32[tempInt+16>>2]=r23&255,tempInt));r27=r24;r28=r18;r29=r25;break}}else{if((r26|0)==1){r27=(r24&255)>>>1&15|-96;r28=14;r29=r25;break}else if((r26|0)==2){r27=(r24&255)>>>1<<4;r28=10;r29=r25;break}else if((r26|0)==3){r27=(r24&255)>>>1&15|-80;r28=14;r29=r25;break}else if((r26|0)==4){r27=(r24&255)>>>1;r28=10;r29=r25;break}else if((r26|0)==12){r27=((r23&255)-1|0)/2&-1&255;r28=1;r29=r25;break}else if((r26|0)==14){r27=((r23&255)-1|0)/2&-1&255;r28=2;r29=r25;break}else if((r26|0)==15){r27=(r24&255)>>>2;r28=3;r29=r25;break}else if((r26|0)==21){r27=r24;r28=(HEAP32[r8]|0)!=0?4:-84;r29=r25;break}else if((r26|0)==42){r27=r24&15|-112;r28=14;r29=r25;break}else if((r26|0)==41){_fgetc(r3);_fgetc(r3);r27=r24;r28=r18;r29=r21-4|0;break}else if((r26|0)==52){r27=r24;r28=13;r29=r25;break}else if((r26|0)==61){r27=r24;r28=15;r29=r25;break}else if((r26|0)==62){r27=r24;r28=15;r29=r25;break}else if((r26|0)==51){r27=r24;r28=11;r29=r25;break}else{_printf(5262584,(tempInt=STACKTOP,STACKTOP=STACKTOP+20|0,HEAP32[tempInt>>2]=r7,HEAP32[tempInt+4>>2]=r10,HEAP32[tempInt+8>>2]=r14,HEAP32[tempInt+12>>2]=r26,HEAP32[tempInt+16>>2]=r23&255,tempInt));r27=0;r28=0;r29=r25;break}}}while(0);HEAP8[r16+3|0]=r28;HEAP8[r16+4|0]=r27;r22=r29}if((r22|0)>0){r1=r22}else{break L4304}}}}while(0);r13=r10+1|0;if((r13|0)<(r4|0)){r10=r13}else{break}}HEAP32[r6]=HEAP32[r6]+1|0;STACKTOP=r2;return}function _mdl_test(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+64|0;r5=r4;r6=_fgetc(r1);r7=_fgetc(r1);L4352:do{if((r7<<16&16711680|r6<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255|0)==1145914444){_fgetc(r1);r8=_fgetc(r1)&65535;if((_fgetc(r1)&255|r8<<8)<<16>>16!=18766){r8=r5|0;if((r2|0)==0){r9=0;break}HEAP8[r2]=0;_fread(r8,1,0,r1);HEAP8[r8]=0;HEAP8[r2]=0;_strncpy(r2,r8,0);if(HEAP8[r2]<<24>>24==0){r9=0;break}while(1){r8=r2+(_strlen(r2)-1)|0;if(HEAP8[r8]<<24>>24!=32){r9=0;break L4352}HEAP8[r8]=0;if(HEAP8[r2]<<24>>24==0){r9=0;break L4352}}}_fgetc(r1);_fgetc(r1);_fgetc(r1);_fgetc(r1);r8=r5|0;if((r2|0)==0){r9=0;break}_memset(r2,0,33);_fread(r8,1,32,r1);HEAP8[r5+32|0]=0;_memset(r2,0,33);_strncpy(r2,r8,32);r8=HEAP8[r2];if(r8<<24>>24==0){r9=0;break}else{r10=0;r11=r2;r12=r8}while(1){do{if((_isprint(r12<<24>>24)|0)==0){r3=3056}else{if(HEAP8[r11]<<24>>24<0){r3=3056;break}else{break}}}while(0);if(r3==3056){r3=0;HEAP8[r11]=46}r8=r10+1|0;r13=r2+r8|0;r14=HEAP8[r13];if(r14<<24>>24!=0&(r8|0)<32){r10=r8;r11=r13;r12=r14}else{break}}if(HEAP8[r2]<<24>>24==0){r9=0;break}while(1){r14=r2+(_strlen(r2)-1)|0;if(HEAP8[r14]<<24>>24!=32){r9=0;break L4352}HEAP8[r14]=0;if(HEAP8[r2]<<24>>24==0){r9=0;break L4352}}}else{r9=-1}}while(0);STACKTOP=r4;return r9}function _mdl_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+60|0;r6=r5+8,r7=r6>>2;_fseek(r2,r3,0);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r3=r5|0;_fread(r3,1,1,r2);r8=_malloc(16);if((r8|0)==0){r9=-1;STACKTOP=r5;return r9}r10=r8;r11=r8;HEAP32[r11>>2]=r10;r12=(r8+4|0)>>2;HEAP32[r12]=r10;r13=r8+8|0;HEAP32[r13>>2]=4;r14=(r8+12|0)>>2;HEAP32[r14]=0;r15=_malloc(20);_strncpy(r15,5267332,5);HEAP32[r15+8>>2]=470;r16=r15+12|0;r17=r16;r18=HEAP32[r12];HEAP32[r12]=r17;HEAP32[r16>>2]=r10;HEAP32[r15+16>>2]=r18;HEAP32[r18>>2]=r17;r17=_malloc(20);_strncpy(r17,5266080,5);HEAP32[r17+8>>2]=640;r18=r17+12|0;r15=r18;r16=HEAP32[r12];HEAP32[r12]=r15;HEAP32[r18>>2]=r10;HEAP32[r17+16>>2]=r16;HEAP32[r16>>2]=r15;r15=_malloc(20);_strncpy(r15,5265192,5);HEAP32[r15+8>>2]=34;r16=r15+12|0;r17=r16;r18=HEAP32[r12];HEAP32[r12]=r17;HEAP32[r16>>2]=r10;HEAP32[r15+16>>2]=r18;HEAP32[r18>>2]=r17;r17=_malloc(20);_strncpy(r17,5264608,5);HEAP32[r17+8>>2]=444;r18=r17+12|0;r15=r18;r16=HEAP32[r12];HEAP32[r12]=r15;HEAP32[r18>>2]=r10;HEAP32[r17+16>>2]=r16;HEAP32[r16>>2]=r15;r15=_malloc(20);_strncpy(r15,5264008,5);HEAP32[r15+8>>2]=304;r16=r15+12|0;r17=r16;r18=HEAP32[r12];HEAP32[r12]=r17;HEAP32[r16>>2]=r10;HEAP32[r15+16>>2]=r18;HEAP32[r18>>2]=r17;r17=_malloc(20);_strncpy(r17,5263412,5);HEAP32[r17+8>>2]=420;r18=r17+12|0;r15=r18;r16=HEAP32[r12];HEAP32[r12]=r15;HEAP32[r18>>2]=r10;HEAP32[r17+16>>2]=r16;HEAP32[r16>>2]=r15;r15=HEAP8[r3];r3=_malloc(20),r16=r3>>2;if((r15&255)<16){_strncpy(r3,5262812,5);HEAP32[r16+2]=198;r17=r3+12|0;r18=r17;r19=HEAP32[r12];HEAP32[r12]=r18;HEAP32[r17>>2]=r10;HEAP32[r16+4]=r19;HEAP32[r19>>2]=r18;r18=_malloc(20);_strncpy(r18,5262580,5);HEAP32[r18+8>>2]=356;r19=r18+12|0;r17=r19;r20=HEAP32[r12];HEAP32[r12]=r17;HEAP32[r19>>2]=r10;HEAP32[r18+16>>2]=r20;HEAP32[r20>>2]=r17}else{_strncpy(r3,5263040,5);HEAP32[r16+2]=464;r17=r3+12|0;r3=r17;r20=HEAP32[r12];HEAP32[r12]=r3;HEAP32[r17>>2]=r10;HEAP32[r16+4]=r20;HEAP32[r20>>2]=r3;r3=_malloc(20);_strncpy(r3,5262812,5);HEAP32[r3+8>>2]=634;r20=r3+12|0;r16=r20;r17=HEAP32[r12];HEAP32[r12]=r16;HEAP32[r20>>2]=r10;HEAP32[r3+16>>2]=r17;HEAP32[r17>>2]=r16;r16=_malloc(20);_strncpy(r16,5262580,5);HEAP32[r16+8>>2]=436;r17=r16+12|0;r3=r17;r20=HEAP32[r12];HEAP32[r12]=r3;HEAP32[r17>>2]=r10;HEAP32[r16+16>>2]=r20;HEAP32[r20>>2]=r3}HEAP32[r13>>2]=2;HEAP32[r14]=HEAP32[r14]|1;r14=r15<<24>>24;_set_type(r1,5267964,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r14>>>4&15,HEAP32[tempInt+4>>2]=r14&15,tempInt));HEAP32[r1+1264>>2]=255;HEAP32[r1+1260>>2]=8363;r14=(r6+36|0)>>2;HEAP32[r14]=0;r15=(r6+32|0)>>2;HEAP32[r15]=0;r13=(r6+28|0)>>2;HEAP32[r13]=0;r3=(r6+4|0)>>2;HEAP32[r3]=_calloc(256,4);r20=(r6|0)>>2;HEAP32[r20]=_calloc(256,4);r16=(r6+8|0)>>2;HEAP32[r16]=_malloc(1024);r17=(r6+12|0)>>2;HEAP32[r17]=_malloc(1024);r12=_malloc(1024);r18=(r6+16|0)>>2;HEAP32[r18]=r12;r19=(r6+20|0)>>2;HEAP32[r19]=_calloc(256,4);r21=0;r22=r12;while(1){HEAP32[r22+(r21<<2)>>2]=-1;HEAP32[HEAP32[r17]+(r21<<2)>>2]=-1;HEAP32[HEAP32[r16]+(r21<<2)>>2]=-1;r12=r21+1|0;if((r12|0)==256){break}r21=r12;r22=HEAP32[r18]}L4386:do{if((_feof(r2)|0)==0){r22=r6;while(1){_iff_chunk(r8,r1,r2,r22);if((_feof(r2)|0)!=0){break L4386}}}}while(0);r2=HEAP32[r11>>2];L4391:do{if((r2|0)!=(r10|0)){r11=r2;while(1){r22=r11-16+4|0;r21=HEAP32[r22+12>>2];r12=HEAP32[r22+16>>2];HEAP32[r21+4>>2]=r12;HEAP32[r12>>2]=r21;r21=HEAP32[r11>>2];_free(r22);if((r21|0)==(r10|0)){break L4391}else{r11=r21}}}}while(0);_free(r8);r8=r1+128|0;r10=HEAP32[r8>>2];L4395:do{if((r10|0)>0){r2=(r1+168|0)>>2;r11=r1+136|0;r21=r1+140|0;r22=r1+172|0;r12=0;r23=HEAP32[r2];r24=r10;while(1){if((HEAP32[HEAP32[r23+(r12<<2)>>2]>>2]|0)>0){r25=0;r26=HEAP32[r11>>2];r27=r23;while(1){if((r26|0)>0){r28=0;r29=r26;while(1){r30=HEAP32[r21>>2];L4406:do{if((r30|0)>0){r31=HEAP32[HEAP32[r22>>2]+(HEAP32[HEAP32[HEAP32[r2]+(r12<<2)>>2]+(r28<<2)+4>>2]<<2)>>2];r32=(r25|0)<(HEAP32[r31>>2]|0);r33=(r25<<3)+r31+5|0;r31=HEAP32[r20];r34=0;L4408:while(1){do{if(r32){r35=HEAP8[r33];if(r35<<24>>24==0){break}if((r35&255|0)==(HEAP32[r31+(r34<<2)>>2]|0)){break L4408}}}while(0);r35=r34+1|0;if((r35|0)<(r30|0)){r34=r35}else{r36=r29;break L4406}}HEAP8[r33]=r34+1&255;r36=HEAP32[r11>>2]}else{r36=r29}}while(0);r30=r28+1|0;if((r30|0)<(r36|0)){r28=r30;r29=r36}else{break}}r37=r36;r38=HEAP32[r2]}else{r37=r26;r38=r27}r29=r25+1|0;if((r29|0)<(HEAP32[HEAP32[r38+(r12<<2)>>2]>>2]|0)){r25=r29;r26=r37;r27=r38}else{break}}r39=r38;r40=HEAP32[r8>>2]}else{r39=r23;r40=r24}r27=r12+1|0;if((r27|0)<(r40|0)){r12=r27;r23=r39;r24=r40}else{r41=r21;break L4395}}}else{r41=r1+140|0}}while(0);L4422:do{if((HEAP32[r41>>2]|0)>0){r40=(r1+176|0)>>2;r39=(r6+40|0)>>2;r8=(r6+44|0)>>2;r38=(r6+48|0)>>2;r37=r1+144|0;r36=0;while(1){L4426:do{if((HEAP32[HEAP32[r16]+(r36<<2)>>2]|0)>-1){HEAP32[HEAP32[r40]+(r36*764&-1)+44>>2]=1;HEAP32[HEAP32[r40]+(r36*764&-1)+48>>2]=16;r10=HEAP32[r13];r21=(r36<<2)+HEAP32[r16]|0;r24=0;while(1){if((r24|0)>=(r10|0)){break L4426}if((HEAP32[r21>>2]|0)==(r24|0)){break}else{r24=r24+1|0}}r21=HEAP32[r40]+(r36*764&-1)+44|0;HEAP32[r21>>2]=((HEAP8[HEAP32[r39]+(r24*33&-1)+31|0]&16)<<24>>24!=0?2:0)|HEAP32[r21>>2];r21=HEAP32[r40]+(r36*764&-1)+44|0;HEAP32[r21>>2]=((HEAP8[HEAP32[r39]+(r24*33&-1)+31|0]&32)<<24>>24!=0?4:0)|HEAP32[r21>>2];HEAP32[HEAP32[r40]+(r36*764&-1)+56>>2]=HEAP8[HEAP32[r39]+(r24*33&-1)+31|0]&15;HEAP32[HEAP32[r40]+(r36*764&-1)+64>>2]=HEAP8[HEAP32[r39]+(r24*33&-1)+32|0]&15;HEAP32[HEAP32[r40]+(r36*764&-1)+68>>2]=HEAP8[HEAP32[r39]+(r24*33&-1)+32|0]&240;HEAP16[HEAP32[r40]+(r36*764&-1)+72>>1]=0;r21=HEAP32[r40];L4432:do{if((HEAP32[r21+(r36*764&-1)+48>>2]|0)>1){r10=1;r23=r21;while(1){r12=r10<<1;r2=r12-2|0;HEAP16[r23+(r36*764&-1)+(r12<<1)+72>>1]=HEAPU8[HEAP32[r39]+(r24*33&-1)+r2+1|0]+HEAP16[r23+(r36*764&-1)+(r2<<1)+72>>1]&65535;r2=HEAP32[r39];if(HEAP8[r2+(r24*33&-1)+r12+1|0]<<24>>24==0){break}HEAP16[HEAP32[r40]+(r36*764&-1)+((r12|1)<<1)+72>>1]=HEAPU8[r12-1+r2+(r24*33&-1)+1|0];r2=r10+1|0;r12=HEAP32[r40];if((r2|0)<(HEAP32[r12+(r36*764&-1)+48>>2]|0)){r10=r2;r23=r12}else{r42=r2;r43=r12;break L4432}}r42=r10;r43=HEAP32[r40]}else{r42=1;r43=r21}}while(0);HEAP32[r43+(r36*764&-1)+48>>2]=r42}}while(0);L4439:do{if((HEAP32[HEAP32[r17]+(r36<<2)>>2]|0)>-1){HEAP32[HEAP32[r40]+(r36*764&-1)+200>>2]=1;HEAP32[HEAP32[r40]+(r36*764&-1)+204>>2]=16;r21=HEAP32[r15];r24=(r36<<2)+HEAP32[r17]|0;r23=0;while(1){if((r23|0)>=(r21|0)){break L4439}if((HEAP32[r24>>2]|0)==(r23|0)){break}else{r23=r23+1|0}}r24=HEAP32[r40]+(r36*764&-1)+200|0;HEAP32[r24>>2]=((HEAP8[HEAP32[r8]+(r23*33&-1)+31|0]&16)<<24>>24!=0?2:0)|HEAP32[r24>>2];r24=HEAP32[r40]+(r36*764&-1)+200|0;HEAP32[r24>>2]=((HEAP8[HEAP32[r8]+(r23*33&-1)+31|0]&32)<<24>>24!=0?4:0)|HEAP32[r24>>2];HEAP32[HEAP32[r40]+(r36*764&-1)+212>>2]=HEAP8[HEAP32[r8]+(r23*33&-1)+31|0]&15;HEAP32[HEAP32[r40]+(r36*764&-1)+220>>2]=HEAP8[HEAP32[r8]+(r23*33&-1)+32|0]&15;HEAP32[HEAP32[r40]+(r36*764&-1)+224>>2]=HEAP8[HEAP32[r8]+(r23*33&-1)+32|0]&240;HEAP16[HEAP32[r40]+(r36*764&-1)+228>>1]=0;r24=HEAP32[r40];L4445:do{if((HEAP32[r24+(r36*764&-1)+204>>2]|0)>1){r21=1;r12=r24;while(1){r2=r21<<1;r11=r2-2|0;HEAP16[r12+(r36*764&-1)+(r2<<1)+228>>1]=HEAPU8[HEAP32[r8]+(r23*33&-1)+r11+1|0]+HEAP16[r12+(r36*764&-1)+(r11<<1)+228>>1]&65535;r11=HEAP32[r8];if(HEAP8[r11+(r23*33&-1)+r2+1|0]<<24>>24==0){break}HEAP16[HEAP32[r40]+(r36*764&-1)+((r2|1)<<1)+228>>1]=HEAPU8[r2-1+r11+(r23*33&-1)+1|0];r11=r21+1|0;r2=HEAP32[r40];if((r11|0)<(HEAP32[r2+(r36*764&-1)+204>>2]|0)){r21=r11;r12=r2}else{r44=r11;r45=r2;break L4445}}r44=r21;r45=HEAP32[r40]}else{r44=1;r45=r24}}while(0);HEAP32[r45+(r36*764&-1)+204>>2]=r44}}while(0);L4452:do{if((HEAP32[HEAP32[r18]+(r36<<2)>>2]|0)>-1){HEAP32[HEAP32[r40]+(r36*764&-1)+356>>2]=1;HEAP32[HEAP32[r40]+(r36*764&-1)+360>>2]=16;r24=HEAP32[r14];r23=(r36<<2)+HEAP32[r18]|0;r12=0;while(1){if((r12|0)>=(r24|0)){break L4452}if((HEAP32[r23>>2]|0)==(r12|0)){break}else{r12=r12+1|0}}r23=HEAP32[r40]+(r36*764&-1)+356|0;HEAP32[r23>>2]=((HEAP8[HEAP32[r38]+(r12*33&-1)+31|0]&16)<<24>>24!=0?2:0)|HEAP32[r23>>2];r23=HEAP32[r40]+(r36*764&-1)+356|0;HEAP32[r23>>2]=((HEAP8[HEAP32[r38]+(r12*33&-1)+31|0]&32)<<24>>24!=0?4:0)|HEAP32[r23>>2];HEAP32[HEAP32[r40]+(r36*764&-1)+368>>2]=HEAP8[HEAP32[r38]+(r12*33&-1)+31|0]&15;HEAP32[HEAP32[r40]+(r36*764&-1)+376>>2]=HEAP8[HEAP32[r38]+(r12*33&-1)+32|0]&15;HEAP32[HEAP32[r40]+(r36*764&-1)+380>>2]=HEAP8[HEAP32[r38]+(r12*33&-1)+32|0]&240;HEAP16[HEAP32[r40]+(r36*764&-1)+384>>1]=0;HEAP16[HEAP32[r40]+(r36*764&-1)+386>>1]=32;r23=HEAP32[r40];L4458:do{if((HEAP32[r23+(r36*764&-1)+360>>2]|0)>1){r24=1;r10=r23;while(1){r2=r24<<1;r11=r2-2|0;HEAP16[r10+(r36*764&-1)+(r2<<1)+384>>1]=HEAPU8[HEAP32[r38]+(r12*33&-1)+r11+1|0]+HEAP16[r10+(r36*764&-1)+(r11<<1)+384>>1]&65535;r11=HEAP32[r38];if(HEAP8[r11+(r12*33&-1)+r2+1|0]<<24>>24==0){break}HEAP16[HEAP32[r40]+(r36*764&-1)+((r2|1)<<1)+384>>1]=HEAPU8[r2-1+r11+(r12*33&-1)+1|0]<<2;r11=r24+1|0;r2=HEAP32[r40];if((r11|0)<(HEAP32[r2+(r36*764&-1)+360>>2]|0)){r24=r11;r10=r2}else{r46=r11;r47=r2;break L4458}}r46=r24;r47=HEAP32[r40]}else{r46=1;r47=r23}}while(0);HEAP32[r47+(r36*764&-1)+360>>2]=r46}}while(0);r23=HEAP32[r40];L4465:do{if((HEAP32[r23+(r36*764&-1)+36>>2]|0)>0){r12=0;r10=r23;while(1){r21=HEAP32[r37>>2];r2=HEAP32[r3];r11=0;while(1){if((r11|0)>=(r21|0)){break}r48=(r12<<6)+HEAP32[r10+(r36*764&-1)+756>>2]+40|0;if((HEAP32[r48>>2]|0)==(HEAP32[r2+(r11<<2)>>2]|0)){r4=3128;break}else{r11=r11+1|0}}do{if(r4==3128){r4=0;HEAP32[r48>>2]=r11;r2=HEAP32[HEAP32[r19]+(r11<<2)>>2];r21=HEAP32[HEAP32[r40]+(r36*764&-1)+756>>2];r24=(r12<<6)+r21+12|0;r22=(r12<<6)+r21+16|0;if((r2|0)==0){HEAP32[r22>>2]=0;HEAP32[r24>>2]=0;break}else{r21=Math.log((r2|0)/8363)*1536/.6931471805599453&-1;HEAP32[r24>>2]=(r21|0)/128&-1;HEAP32[r22>>2]=(r21|0)%128;break}}}while(0);r11=r12+1|0;r21=HEAP32[r40];if((r11|0)<(HEAP32[r21+(r36*764&-1)+36>>2]|0)){r12=r11;r10=r21}else{break L4465}}}}while(0);r23=r36+1|0;if((r23|0)<(HEAP32[r41>>2]|0)){r36=r23}else{break L4422}}}}while(0);_free(HEAP32[r19]);_free(HEAP32[r18]);_free(HEAP32[r17]);_free(HEAP32[r16]);_free(HEAP32[r20]);_free(HEAP32[r3]);if((HEAP32[r13]|0)!=0){_free(HEAP32[r7+10]|0)}if((HEAP32[r15]|0)!=0){_free(HEAP32[r7+11]|0)}if((HEAP32[r14]|0)!=0){_free(HEAP32[r7+12]|0)}r7=r1+1276|0;HEAP32[r7>>2]=HEAP32[r7>>2]|32;HEAP32[r1+1280>>2]=1;r9=0;STACKTOP=r5;return r9}function _get_chunk_in(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11;r4=0;_fread(r1|0,1,32,r3);_fseek(r3,20,1);r2=(r1+156|0)>>2;HEAP32[r2]=_fgetc(r3)&255|_fgetc(r3)<<8&65280;HEAP32[r1+160>>2]=_fgetc(r3)&255|_fgetc(r3)<<8&65280;_fgetc(r3);HEAP32[r1+148>>2]=_fgetc(r3)&255;HEAP32[r1+152>>2]=_fgetc(r3)&255;r5=0;while(1){r6=_fgetc(r3);if((r6&128|0)!=0){r7=r5;r4=3147;break}HEAP32[r1+(r5*12&-1)+184>>2]=r6<<1&510;r6=r5+1|0;if((r6|0)<32){r5=r6}else{r7=r6;r4=3148;break}}if(r4==3147){r5=r1+136|0;HEAP32[r5>>2]=r7;r6=31-r7|0;r8=_fseek(r3,r6,1);r9=r1+952|0;r10=HEAP32[r2];r11=_fread(r9,1,r10,r3);return}else if(r4==3148){r5=r1+136|0;HEAP32[r5>>2]=r7;r6=31-r7|0;r8=_fseek(r3,r6,1);r9=r1+952|0;r10=HEAP32[r2];r11=_fread(r9,1,r10,r3);return}}function _get_chunk_tr(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31;r4=(_fgetc(r3)&255|_fgetc(r3)<<8&65280)+1|0;r2=(r1+132|0)>>2;HEAP32[r2]=r4;r5=(r1+172|0)>>2;HEAP32[r5]=_realloc(HEAP32[r5],r4<<2);r4=_calloc(1,2060);r1=_calloc(1,2060);HEAP32[HEAP32[r5]>>2]=r1;HEAP32[HEAP32[HEAP32[r5]>>2]>>2]=256;if((HEAP32[r2]|0)<=1){_free(r4);return}r1=r4+4|0;r6=1;while(1){r7=_fgetc(r3)&255|_fgetc(r3)<<8&65280;_memset(r4,0,2060);do{if((r7|0)==0){r8=64}else{r9=0;r10=r7;while(1){r11=_fgetc(r3);r12=r11&255;r13=r10-1|0;r14=r11&3;do{if((r14|0)==3){if((r11&4|0)==0){r15=r13}else{r16=_fgetc(r3)&255;HEAP8[(r9<<3)+r1|0]=r16<<24>>24==-1?-127:r16+12&255;r15=r10-2|0}if((r11&8|0)==0){r17=r15}else{HEAP8[(r9<<3)+r1+1|0]=_fgetc(r3)&255;r17=r15-1|0}if((r11&16|0)==0){r18=r17}else{HEAP8[(r9<<3)+r1+2|0]=_fgetc(r3)&255;r18=r17-1|0}if((r11&32|0)==0){r19=r18}else{r16=_fgetc(r3)&255;HEAP8[(r9<<3)+r1+3|0]=r16&15;HEAP8[(r9<<3)+r1+5|0]=(r16&255)>>>4;r19=r18-1|0}if((r11&64|0)==0){r20=r19}else{HEAP8[(r9<<3)+r1+4|0]=_fgetc(r3)&255;r20=r19-1|0}if((r11&128|0)==0){r21=r20;r22=r9;break}HEAP8[(r9<<3)+r1+6|0]=_fgetc(r3)&255;r21=r20-1|0;r22=r9}else if((r14|0)==0){r21=r13;r22=(r12>>>2)+r9|0}else if((r14|0)==1){r16=r12>>>2;r23=(r9-1<<3)+r1|0;r24=0;while(1){r25=(r24+r9<<3)+r1|0;r26=r23|0;r27=r23+4|0;r28=HEAPU8[r27]|HEAPU8[r27+1|0]<<8|HEAPU8[r27+2|0]<<16|HEAPU8[r27+3|0]<<24|0;r27=r25|0;tempBigInt=HEAPU8[r26]|HEAPU8[r26+1|0]<<8|HEAPU8[r26+2|0]<<16|HEAPU8[r26+3|0]<<24|0;HEAP8[r27]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r27+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r27+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r27+3|0]=tempBigInt&255;r27=r25+4|0;tempBigInt=r28;HEAP8[r27]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r27+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r27+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r27+3|0]=tempBigInt&255;r27=r24+1|0;if((r27|0)>(r16|0)){break}else{r24=r27}}r21=r13;r22=r9+(r11>>>2&63)|0}else if((r14|0)==2){r24=(r12>>>2<<3)+r1|0;r16=(r9<<3)+r1|0;r23=r24|0;r27=r24+4|0;r24=HEAPU8[r27]|HEAPU8[r27+1|0]<<8|HEAPU8[r27+2|0]<<16|HEAPU8[r27+3|0]<<24|0;r27=r16|0;tempBigInt=HEAPU8[r23]|HEAPU8[r23+1|0]<<8|HEAPU8[r23+2|0]<<16|HEAPU8[r23+3|0]<<24|0;HEAP8[r27]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r27+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r27+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r27+3|0]=tempBigInt&255;r27=r16+4|0;tempBigInt=r24;HEAP8[r27]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r27+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r27+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r27+3|0]=tempBigInt&255;r21=r13;r22=r9}else{r21=r13;r22=r9}}while(0);r13=(r22<<3)+r1+3|0;r12=(r22<<3)+r1+4|0;r14=HEAP8[r13];r11=r14&255;if((r11|0)==5){HEAP8[r13]=0;r29=0}else if((r11|0)==6){HEAP8[r12]=0;HEAP8[r13]=0;r29=0}else{r29=r14}r14=r29&255;do{if((r14|0)==0){HEAP8[r12]=0}else if((r14|0)==7){HEAP8[r13]=-85}else if((r14|0)==8|(r14|0)==9|(r14|0)==10){HEAP8[r12]=0;HEAP8[r13]=0}else if((r14|0)==14){r11=HEAP8[r12];r27=(r11&255)>>>4;if((r27|0)==0|(r27|0)==3|(r27|0)==8){HEAP8[r12]=0;HEAP8[r13]=0;break}else if((r27|0)==1){HEAP8[r13]=25;HEAP8[r12]=r11<<4;break}else if((r27|0)==2){HEAP8[r13]=25;HEAP8[r12]=r11&15;break}else{break}}else if((r14|0)==15){HEAP8[r13]=-93}}while(0);r13=(r22<<3)+r1+5|0;r14=(r22<<3)+r1+6|0;r12=HEAP8[r13];r11=r12&255;if((r11|0)==1){HEAP8[r13]=-96;r30=-96}else if((r11|0)==2){HEAP8[r13]=-95;r30=-95}else if((r11|0)==3){HEAP8[r13]=27;r30=27}else if((r11|0)==4){HEAP8[r13]=7;r30=7}else if((r11|0)==5){HEAP8[r13]=29;r30=29}else if((r11|0)==6){HEAP8[r14]=0;HEAP8[r13]=0;r30=0}else{r30=r12}r12=r30&255;do{if((r12|0)==0){HEAP8[r14]=0}else if((r12|0)==7){HEAP8[r13]=-85}else if((r12|0)==8|(r12|0)==9|(r12|0)==10){HEAP8[r14]=0;HEAP8[r13]=0}else if((r12|0)==14){r11=HEAP8[r14];r27=(r11&255)>>>4;if((r27|0)==0|(r27|0)==3|(r27|0)==8){HEAP8[r14]=0;HEAP8[r13]=0;break}else if((r27|0)==1){HEAP8[r13]=25;HEAP8[r14]=r11<<4;break}else if((r27|0)==2){HEAP8[r13]=25;HEAP8[r14]=r11&15;break}else{break}}else if((r12|0)==15){HEAP8[r13]=-93}}while(0);r31=r22+1|0;if((r21|0)==0){break}else{r9=r31;r10=r21}}if((r31|0)<65){r8=64;break}r8=(r31|0)<129?128:256}}while(0);r7=r8<<3|12;r10=_calloc(1,r7);HEAP32[HEAP32[r5]+(r6<<2)>>2]=r10;_memcpy(HEAP32[HEAP32[r5]+(r6<<2)>>2],r4,r7);HEAP32[HEAP32[HEAP32[r5]+(r6<<2)>>2]>>2]=r8;r7=r6+1|0;if((r7|0)<(HEAP32[r2]|0)){r6=r7}else{break}}_free(r4);return}function _get_chunk_sa(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90,r91,r92;r2=r1+144|0;if((HEAP32[r2>>2]|0)<=0){r5=r4+24|0;r6=HEAP32[r5>>2];r7=r6;_free(r7);return}r8=(r1+180|0)>>2;r1=r4+24|0;r4=0;while(1){r9=HEAP32[r8];r10=_calloc(1,HEAP32[r9+(r4*52&-1)+32>>2]<<(HEAP32[r9+(r4*52&-1)+44>>2]&1));r9=HEAP32[HEAP32[r1>>2]+(r4<<2)>>2];if((r9|0)==0){_fread(r10,1,HEAP32[HEAP32[r8]+(r4*52&-1)+32>>2],r3)}else if((r9|0)==1){r11=_fgetc(r3)&255;r12=_fgetc(r3);r13=r12<<8&65280|r11|_fgetc(r3)<<16&16711680|_fgetc(r3)<<24;r11=_malloc(r13+4|0);_fread(r11,1,r13,r3);r12=HEAP32[HEAP32[r8]+(r4*52&-1)+32>>2];L10:do{if((r12|0)>0){r14=r11+4|0;r15=r13-4|0;r16=32;r17=HEAPU8[r11]|HEAPU8[r11+1|0]<<8|HEAPU8[r11+2|0]<<16|HEAPU8[r11+3|0]<<24;r18=0;r19=r10;r20=0;while(1){r21=r17&1;r22=r17>>>1;r23=r16-1|0;do{if(r23>>>0<25){if((r15|0)==0){r24=r22;r25=r23;r26=0;r27=r14;break}r28=r14+1|0;r24=(HEAPU8[r28]<<8|HEAPU8[r14]|HEAPU8[r14+2|0]<<16|HEAPU8[r14+3|0]<<24)<<r23|r22;r25=r16+7|0;r26=r15-1|0;r27=r28}else{r24=r22;r25=r23;r26=r15;r27=r14}}while(0);r23=r24&1;r22=r24>>>1;r28=r25-1|0;do{if(r28>>>0<25){if((r26|0)==0){r29=r22;r30=r28;r31=0;r32=r27;break}r33=r27+1|0;r29=(HEAPU8[r33]<<8|HEAPU8[r27]|HEAPU8[r27+2|0]<<16|HEAPU8[r27+3|0]<<24)<<r28|r22;r30=r25+7|0;r31=r26-1|0;r32=r33}else{r29=r22;r30=r28;r31=r26;r32=r27}}while(0);do{if((r23|0)==0){L24:do{if((r31|0)>-1){r28=r32;r22=r31;r33=r30;r34=r29;r35=8;while(1){r36=r34&1;r37=r34>>>1;r38=r33-1|0;do{if(r38>>>0<25){if((r22|0)==0){r39=r37;r40=r38;r41=0;r42=r28;break}r43=r28+1|0;r39=(HEAPU8[r43]<<8|HEAPU8[r28]|HEAPU8[r28+2|0]<<16|HEAPU8[r28+3|0]<<24)<<r38|r37;r40=r33+7|0;r41=r22-1|0;r42=r43}else{r39=r37;r40=r38;r41=r22;r42=r28}}while(0);if((r36|0)!=0){r44=r39;r45=r40;r46=r41;r47=r42;r48=r35;break L24}r38=r35+16&255;if((r41|0)>-1){r28=r42;r22=r41;r33=r40;r34=r39;r35=r38}else{r44=r39;r45=r40;r46=r41;r47=r42;r48=r38;break L24}}}else{r44=r29;r45=r30;r46=r31;r47=r32;r48=8}}while(0);r35=r44&15;r34=r44>>>4;r33=r45-4|0;do{if(r33>>>0<25){if((r46|0)==0){r49=r34;r50=r33;r51=0;r52=r47;break}r22=r47+1|0;r49=(HEAPU8[r22]<<8|HEAPU8[r47]|HEAPU8[r47+2|0]<<16|HEAPU8[r47+3|0]<<24)<<r33|r34;r50=r45+4|0;r51=r46-1|0;r52=r22}else{r49=r34;r50=r33;r51=r46;r52=r47}}while(0);r53=r35+r48|0;r54=r49;r55=r50;r56=r51;r57=r52}else{r33=r29&7;r34=r29>>>3;r22=r30-3|0;if(r22>>>0>=25){r53=r33;r54=r34;r55=r22;r56=r31;r57=r32;break}if((r31|0)==0){r53=r33;r54=r34;r55=r22;r56=0;r57=r32;break}r28=r32+1|0;r53=r33;r54=(HEAPU8[r28]<<8|HEAPU8[r32]|HEAPU8[r32+2|0]<<16|HEAPU8[r32+3|0]<<24)<<r22|r34;r55=r30+5|0;r56=r31-1|0;r57=r28}}while(0);if((r21|0)==0){r58=r53}else{r58=r53&255^255}r23=(r58&255)+(r20&255)|0;HEAP8[r19]=r23&255;r28=r18+1|0;if((r28|0)==(r12|0)){break L10}else{r14=r57;r15=r56;r16=r55;r17=r54;r18=r28;r19=r19+1|0;r20=r23}}}}while(0);_free(r11)}else if((r9|0)==2){r12=_fgetc(r3)&255;r13=_fgetc(r3);r20=r13<<8&65280|r12|_fgetc(r3)<<16&16711680|_fgetc(r3)<<24;r12=_malloc(r20+4|0);_fread(r12,1,r20,r3);r13=HEAP32[HEAP32[r8]+(r4*52&-1)+32>>2];L46:do{if((r13|0)>0){r19=r12+4|0;r18=r20-4|0;r17=32;r16=HEAPU8[r12]|HEAPU8[r12+1|0]<<8|HEAPU8[r12+2|0]<<16|HEAPU8[r12+3|0]<<24;r15=0;r14=r10;r23=0;while(1){r28=r16>>>8;r34=r17-8|0;do{if(r34>>>0<25){if((r18|0)==0){r59=r28;r60=r34;r61=0;r62=r19;break}r22=r19+1|0;r59=(HEAPU8[r22]<<8|HEAPU8[r19]|HEAPU8[r19+2|0]<<16|HEAPU8[r19+3|0]<<24)<<r34|r28;r60=r17;r61=r18-1|0;r62=r22}else{r59=r28;r60=r34;r61=r18;r62=r19}}while(0);r34=r59&1;r28=r59>>>1;r21=r60-1|0;do{if(r21>>>0<25){if((r61|0)==0){r63=r28;r64=r21;r65=0;r66=r62;break}r22=r62+1|0;r63=(HEAPU8[r22]<<8|HEAPU8[r62]|HEAPU8[r62+2|0]<<16|HEAPU8[r62+3|0]<<24)<<r21|r28;r64=r60+7|0;r65=r61-1|0;r66=r22}else{r63=r28;r64=r21;r65=r61;r66=r62}}while(0);r21=r63&1;r28=r63>>>1;r22=r64-1|0;do{if(r22>>>0<25){if((r65|0)==0){r67=r28;r68=r22;r69=0;r70=r66;break}r33=r66+1|0;r67=(HEAPU8[r33]<<8|HEAPU8[r66]|HEAPU8[r66+2|0]<<16|HEAPU8[r66+3|0]<<24)<<r22|r28;r68=r64+7|0;r69=r65-1|0;r70=r33}else{r67=r28;r68=r22;r69=r65;r70=r66}}while(0);do{if((r21|0)==0){L64:do{if((r69|0)>-1){r22=r70;r28=r69;r33=r68;r38=r67;r37=8;while(1){r43=r38&1;r71=r38>>>1;r72=r33-1|0;do{if(r72>>>0<25){if((r28|0)==0){r73=r71;r74=r72;r75=0;r76=r22;break}r77=r22+1|0;r73=(HEAPU8[r77]<<8|HEAPU8[r22]|HEAPU8[r22+2|0]<<16|HEAPU8[r22+3|0]<<24)<<r72|r71;r74=r33+7|0;r75=r28-1|0;r76=r77}else{r73=r71;r74=r72;r75=r28;r76=r22}}while(0);if((r43|0)!=0){r78=r73;r79=r74;r80=r75;r81=r76;r82=r37;break L64}r72=r37+16&255;if((r75|0)>-1){r22=r76;r28=r75;r33=r74;r38=r73;r37=r72}else{r78=r73;r79=r74;r80=r75;r81=r76;r82=r72;break L64}}}else{r78=r67;r79=r68;r80=r69;r81=r70;r82=8}}while(0);r35=r78&15;r37=r78>>>4;r38=r79-4|0;do{if(r38>>>0<25){if((r80|0)==0){r83=r37;r84=r38;r85=0;r86=r81;break}r33=r81+1|0;r83=(HEAPU8[r33]<<8|HEAPU8[r81]|HEAPU8[r81+2|0]<<16|HEAPU8[r81+3|0]<<24)<<r38|r37;r84=r79+4|0;r85=r80-1|0;r86=r33}else{r83=r37;r84=r38;r85=r80;r86=r81}}while(0);r87=r35+r82|0;r88=r83;r89=r84;r90=r85;r91=r86}else{r38=r67&7;r37=r67>>>3;r33=r68-3|0;if(r33>>>0>=25){r87=r38;r88=r37;r89=r33;r90=r69;r91=r70;break}if((r69|0)==0){r87=r38;r88=r37;r89=r33;r90=0;r91=r70;break}r28=r70+1|0;r87=r38;r88=(HEAPU8[r28]<<8|HEAPU8[r70]|HEAPU8[r70+2|0]<<16|HEAPU8[r70+3|0]<<24)<<r33|r37;r89=r68+5|0;r90=r69-1|0;r91=r28}}while(0);if((r34|0)==0){r92=r87}else{r92=r87&255^255}r21=(r92&255)+(r23&255)|0;HEAP8[r14]=r16&255;HEAP8[r14+1|0]=r21&255;r28=r15+1|0;if((r28|0)==(r13|0)){break L46}else{r19=r91;r18=r90;r17=r89;r16=r88;r15=r28;r14=r14+2|0;r23=r21}}}}while(0);_free(r12)}_load_sample(0,16,HEAP32[r8]+(r4*52&-1)|0,r10);_free(r10);r13=r4+1|0;if((r13|0)<(HEAP32[r2>>2]|0)){r4=r13}else{r5=r1;break}}r6=HEAP32[r5>>2];r7=r6;_free(r7);return}function _get_chunk_ve(r1,r2,r3,r4){var r5,r6;r2=_fgetc(r3);r1=r2&255;r5=(r4+28|0)>>2;HEAP32[r5]=r1;if((r2&255)<<24>>24==0){return}r2=(r4+40|0)>>2;HEAP32[r2]=_calloc(r1,33);if((HEAP32[r5]|0)>0){r6=0}else{return}while(1){r1=_fgetc(r3)&255;HEAP8[HEAP32[r2]+(r6*33&-1)|0]=r1;_fread(HEAP32[r2]+(r6*33&-1)+1|0,1,30,r3);r1=_fgetc(r3)&255;HEAP8[HEAP32[r2]+(r6*33&-1)+31|0]=r1;r1=_fgetc(r3)&255;HEAP8[HEAP32[r2]+(r6*33&-1)+32|0]=r1;r1=r6+1|0;if((r1|0)<(HEAP32[r5]|0)){r6=r1}else{break}}return}function _get_chunk_pe(r1,r2,r3,r4){var r5,r6;r2=_fgetc(r3);r1=r2&255;r5=(r4+32|0)>>2;HEAP32[r5]=r1;if((r2&255)<<24>>24==0){return}r2=(r4+44|0)>>2;HEAP32[r2]=_calloc(r1,33);if((HEAP32[r5]|0)>0){r6=0}else{return}while(1){r1=_fgetc(r3)&255;HEAP8[HEAP32[r2]+(r6*33&-1)|0]=r1;_fread(HEAP32[r2]+(r6*33&-1)+1|0,1,30,r3);r1=_fgetc(r3)&255;HEAP8[HEAP32[r2]+(r6*33&-1)+31|0]=r1;r1=_fgetc(r3)&255;HEAP8[HEAP32[r2]+(r6*33&-1)+32|0]=r1;r1=r6+1|0;if((r1|0)<(HEAP32[r5]|0)){r6=r1}else{break}}return}function _get_chunk_fe(r1,r2,r3,r4){var r5,r6;r2=_fgetc(r3);r1=r2&255;r5=(r4+36|0)>>2;HEAP32[r5]=r1;if((r2&255)<<24>>24==0){return}r2=(r4+48|0)>>2;HEAP32[r2]=_calloc(r1,33);if((HEAP32[r5]|0)>0){r6=0}else{return}while(1){r1=_fgetc(r3)&255;HEAP8[HEAP32[r2]+(r6*33&-1)|0]=r1;_fread(HEAP32[r2]+(r6*33&-1)+1|0,1,30,r3);r1=_fgetc(r3)&255;HEAP8[HEAP32[r2]+(r6*33&-1)+31|0]=r1;r1=_fgetc(r3)&255;HEAP8[HEAP32[r2]+(r6*33&-1)+32|0]=r1;r1=r6+1|0;if((r1|0)<(HEAP32[r5]|0)){r6=r1}else{break}}return}function _get_chunk_ii(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r2=STACKTOP;STACKTOP=STACKTOP+40|0;r5=r2;r6=_fgetc(r3)&255;r7=(r1+140|0)>>2;HEAP32[r7]=r6;r8=(r1+176|0)>>2;HEAP32[r8]=_calloc(764,r6);r6=HEAP32[r1+144>>2];if((r6|0)!=0){HEAP32[r1+180>>2]=_calloc(52,r6)}if((HEAP32[r7]|0)<=0){STACKTOP=r2;return}r6=r4;r1=r5|0;r9=r5+32|0;r10=r4+8|0;r11=r4+12|0;r12=r4+16|0;r4=0;while(1){r13=_fgetc(r3)&255;HEAP32[HEAP32[r6>>2]+(r4<<2)>>2]=r13;r13=_fgetc(r3)&255;HEAP32[HEAP32[r8]+(r4*764&-1)+36>>2]=r13;_fread(r1,1,32,r3);HEAP8[r9]=0;r13=HEAP8[r1];L123:do{if(r13<<24>>24!=0){r14=0;r15=r13;while(1){if((_isprint(r15<<24>>24)|0)==0|r15<<24>>24<0){HEAP8[r5+r14|0]=32}r16=r14+1|0;if(r16>>>0>=_strlen(r1)>>>0){break}r14=r16;r15=HEAP8[r5+r16|0]}if(HEAP8[r1]<<24>>24==0){break}while(1){r15=r5+(_strlen(r1)-1)|0;if(HEAP8[r15]<<24>>24!=32){break L123}HEAP8[r15]=0;if(HEAP8[r1]<<24>>24==0){break L123}}}}while(0);_strncpy(HEAP32[r8]+(r4*764&-1)|0,r1,32);r13=_calloc(64,HEAP32[HEAP32[r8]+(r4*764&-1)+36>>2]);HEAP32[HEAP32[r8]+(r4*764&-1)+756>>2]=r13;r13=0;while(1){HEAP8[(r13<<1)+HEAP32[r8]+(r4*764&-1)+512|0]=-1;r15=r13+1|0;if((r15|0)==121){break}else{r13=r15}}L138:do{if((HEAP32[HEAP32[r8]+(r4*764&-1)+36>>2]|0)>0){r13=0;r15=0;while(1){r14=_fgetc(r3)&255;HEAP32[HEAP32[HEAP32[r8]+(r4*764&-1)+756>>2]+(r13<<6)+40>>2]=r14;r14=_fgetc(r3);r16=r14&255;r17=_fgetc(r3)&255;HEAP32[HEAP32[HEAP32[r8]+(r4*764&-1)+756>>2]+(r13<<6)>>2]=r17;L141:do{if((r15|0)<=(r16+12|0)){r17=r13&255;r18=(r14&255)+13|0;r19=r15;while(1){if((r19|0)<121){HEAP8[(r19<<1)+HEAP32[r8]+(r4*764&-1)+512|0]=r17}r20=r19+1|0;if((r20|0)==(r18|0)){break L141}else{r19=r20}}}}while(0);r14=_fgetc(r3);r19=(r13|0)==0;if(r19){HEAP32[HEAP32[r10>>2]+(r4<<2)>>2]=(r14&128|0)==0?-1:r14&63}if((r14&64|0)==0){HEAP32[HEAP32[HEAP32[r8]+(r4*764&-1)+756>>2]+(r13<<6)>>2]=255}r14=_fgetc(r3)<<1&510;HEAP32[HEAP32[HEAP32[r8]+(r4*764&-1)+756>>2]+(r13<<6)+8>>2]=r14;r14=_fgetc(r3);if(r19){HEAP32[HEAP32[r11>>2]+(r4<<2)>>2]=(r14&128|0)==0?-1:r14&63}if((r14&64|0)==0){HEAP32[HEAP32[HEAP32[r8]+(r4*764&-1)+756>>2]+(r13<<6)+8>>2]=128}r14=_fgetc(r3);r18=_fgetc(r3);if(r19){HEAP32[HEAP32[r8]+(r4*764&-1)+40>>2]=r18<<8&65280|r14&255}r14=_fgetc(r3)&255;HEAP32[HEAP32[HEAP32[r8]+(r4*764&-1)+756>>2]+(r13<<6)+28>>2]=r14;r14=_fgetc(r3)&255;HEAP32[HEAP32[HEAP32[r8]+(r4*764&-1)+756>>2]+(r13<<6)+24>>2]=r14;r14=_fgetc(r3)&255;HEAP32[HEAP32[HEAP32[r8]+(r4*764&-1)+756>>2]+(r13<<6)+32>>2]=r14;r14=_fgetc(r3)&255;HEAP32[HEAP32[HEAP32[r8]+(r4*764&-1)+756>>2]+(r13<<6)+20>>2]=r14;_fgetc(r3);r14=_fgetc(r3);if(r19){HEAP32[HEAP32[r12>>2]+(r4<<2)>>2]=(r14&128|0)==0?-1:r14&63}r14=r13+1|0;if((r14|0)<(HEAP32[HEAP32[r8]+(r4*764&-1)+36>>2]|0)){r13=r14;r15=r16+13|0}else{break L138}}}}while(0);r15=r4+1|0;if((r15|0)<(HEAP32[r7]|0)){r4=r15}else{break}}STACKTOP=r2;return}function _get_chunk_pa(r1,r2,r3,r4){var r5,r6,r7,r8,r9;r4=_fgetc(r3)&255;r2=(r1+128|0)>>2;HEAP32[r2]=r4;r5=(r1+136|0)>>2;r6=Math.imul(r4,HEAP32[r5])+1|0;HEAP32[r1+132>>2]=r6;HEAP32[r1+172>>2]=_calloc(4,r6);r6=(r1+168|0)>>2;HEAP32[r6]=_calloc(4,HEAP32[r2]+1|0);if((HEAP32[r2]|0)>0){r7=0}else{return}while(1){r1=_calloc(1,(HEAP32[r5]<<2)+4|0);HEAP32[HEAP32[r6]+(r7<<2)>>2]=r1;r1=_fgetc(r3)&255;r4=(_fgetc(r3)&255)+1|0;HEAP32[HEAP32[HEAP32[r6]+(r7<<2)>>2]>>2]=r4;_fseek(r3,16,1);L174:do{if((r1|0)!=0){r4=0;while(1){r8=_fgetc(r3);r9=_fgetc(r3);if((r4|0)<(HEAP32[r5]|0)){HEAP32[HEAP32[HEAP32[r6]+(r7<<2)>>2]+(r4<<2)+4>>2]=r9<<8&65280|r8&255}r8=r4+1|0;if((r8|0)<(r1|0)){r4=r8}else{break L174}}}}while(0);r1=r7+1|0;if((r1|0)<(HEAP32[r2]|0)){r7=r1}else{break}}return}function _get_chunk_is(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r2=STACKTOP;STACKTOP=STACKTOP+64|0;r5=r2;r6=_fgetc(r3)&255;r7=(r1+144|0)>>2;HEAP32[r7]=r6;r8=(r1+180|0)>>2;HEAP32[r8]=_calloc(52,r6);r6=r4+24|0;HEAP32[r6>>2]=_calloc(4,HEAP32[r7]);if((HEAP32[r7]|0)<=0){STACKTOP=r2;return}r1=r4+4|0;r9=r5|0;r10=r5+32|0;r11=r4+20|0;r4=0;while(1){r12=_fgetc(r3)&255;HEAP32[HEAP32[r1>>2]+(r4<<2)>>2]=r12;_fread(r9,1,32,r3);HEAP8[r10]=0;r12=HEAP8[r9];L188:do{if(r12<<24>>24!=0){r13=0;r14=r12;while(1){if((_isprint(r14<<24>>24)|0)==0|r14<<24>>24<0){HEAP8[r5+r13|0]=32}r15=r13+1|0;if(r15>>>0>=_strlen(r9)>>>0){break}r13=r15;r14=HEAP8[r5+r15|0]}if(HEAP8[r9]<<24>>24==0){break}while(1){r14=r5+(_strlen(r9)-1)|0;if(HEAP8[r14]<<24>>24!=32){break L188}HEAP8[r14]=0;if(HEAP8[r9]<<24>>24==0){break L188}}}}while(0);_fseek(r3,8,1);r12=_fgetc(r3)&255;r14=_fgetc(r3);r13=r14<<8&65280|r12|_fgetc(r3)<<16&16711680|_fgetc(r3)<<24;HEAP32[HEAP32[r11>>2]+(r4<<2)>>2]=r13;r13=_fgetc(r3)&255;r12=_fgetc(r3);r14=r12<<8&65280|r13|_fgetc(r3)<<16&16711680|_fgetc(r3)<<24;HEAP32[HEAP32[r8]+(r4*52&-1)+32>>2]=r14;r14=_fgetc(r3)&255;r13=_fgetc(r3);r12=r13<<8&65280|r14|_fgetc(r3)<<16&16711680|_fgetc(r3)<<24;HEAP32[HEAP32[r8]+(r4*52&-1)+36>>2]=r12;r12=_fgetc(r3)&255;r14=_fgetc(r3);r13=r14<<8&65280|r12|_fgetc(r3)<<16&16711680|_fgetc(r3)<<24;HEAP32[HEAP32[r8]+(r4*52&-1)+40>>2]=r13;r13=HEAP32[r8];HEAP32[r13+(r4*52&-1)+44>>2]=(HEAP32[r13+(r4*52&-1)+40>>2]|0)>0?2:0;r13=HEAP32[r8];r12=r13+(r4*52&-1)+40|0;HEAP32[r12>>2]=HEAP32[r12>>2]+HEAP32[r13+(r4*52&-1)+36>>2]|0;r13=HEAP32[r8]+(r4*52&-1)+40|0;r12=HEAP32[r13>>2];if((r12|0)>0){HEAP32[r13>>2]=r12-1|0}_fgetc(r3);r12=_fgetc(r3);if((r12&1|0)!=0){r13=HEAP32[r8]+(r4*52&-1)+44|0;HEAP32[r13>>2]=HEAP32[r13>>2]|1;r13=HEAP32[r8]+(r4*52&-1)+32|0;HEAP32[r13>>2]=HEAP32[r13>>2]>>1;r13=HEAP32[r8]+(r4*52&-1)+36|0;HEAP32[r13>>2]=HEAP32[r13>>2]>>1;r13=HEAP32[r8]+(r4*52&-1)+40|0;HEAP32[r13>>2]=HEAP32[r13>>2]>>1}r13=HEAP32[r8]+(r4*52&-1)+44|0;HEAP32[r13>>2]=HEAP32[r13>>2]|r12<<1&4;HEAP32[HEAP32[r6>>2]+(r4<<2)>>2]=r12>>>2&3;r12=r4+1|0;if((r12|0)<(HEAP32[r7]|0)){r4=r12}else{break}}STACKTOP=r2;return}function _get_chunk_p0(r1,r2,r3,r4){var r5,r6,r7,r8;r4=_fgetc(r3)&255;r2=(r1+128|0)>>2;HEAP32[r2]=r4;r5=(r1+136|0)>>2;r6=Math.imul(r4,HEAP32[r5])+1|0;HEAP32[r1+132>>2]=r6;HEAP32[r1+172>>2]=_calloc(4,r6);r6=(r1+168|0)>>2;HEAP32[r6]=_calloc(4,HEAP32[r2]+1|0);if((HEAP32[r2]|0)>0){r7=0}else{return}while(1){r1=_calloc(1,(HEAP32[r5]<<2)+4|0);HEAP32[HEAP32[r6]+(r7<<2)>>2]=r1;HEAP32[HEAP32[HEAP32[r6]+(r7<<2)>>2]>>2]=64;r1=0;while(1){r4=_fgetc(r3);r8=_fgetc(r3);if((r1|0)<(HEAP32[r5]|0)){HEAP32[HEAP32[HEAP32[r6]+(r7<<2)>>2]+(r1<<2)+4>>2]=r8<<8&65280|r4&255}r4=r1+1|0;if((r4|0)==32){break}else{r1=r4}}r1=r7+1|0;if((r1|0)<(HEAP32[r2]|0)){r7=r1}else{break}}return}function _get_chunk_i0(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17;r2=STACKTOP;STACKTOP=STACKTOP+64|0;r5=r2;r6=_fgetc(r3)&255;r7=(r1+144|0)>>2;HEAP32[r7]=r6;r8=(r1+140|0)>>2;HEAP32[r8]=r6;r9=(r1+176|0)>>2;HEAP32[r9]=_calloc(764,r6);r6=HEAP32[r7];if((r6|0)==0){r10=0}else{HEAP32[r1+180>>2]=_calloc(52,r6);r10=HEAP32[r7]}r7=r4+24|0;HEAP32[r7>>2]=_calloc(4,r10);if((HEAP32[r8]|0)<=0){STACKTOP=r2;return}r10=r4+4|0;r6=r4;r11=r5|0;r12=r5+32|0;r13=r4+20|0;r4=(r1+180|0)>>2;r1=0;while(1){HEAP32[HEAP32[r9]+(r1*764&-1)+36>>2]=1;r14=_calloc(64,1);HEAP32[HEAP32[r9]+(r1*764&-1)+756>>2]=r14;r14=_fgetc(r3)&255;HEAP32[HEAP32[r10>>2]+(r1<<2)>>2]=r14;HEAP32[HEAP32[r6>>2]+(r1<<2)>>2]=r14;HEAP32[HEAP32[HEAP32[r9]+(r1*764&-1)+756>>2]+40>>2]=r14;_fread(r11,1,32,r3);HEAP8[r12]=0;r14=HEAP8[r11];L228:do{if(r14<<24>>24!=0){r15=0;r16=r14;while(1){if((_isprint(r16<<24>>24)|0)==0|r16<<24>>24<0){HEAP8[r5+r15|0]=32}r17=r15+1|0;if(r17>>>0>=_strlen(r11)>>>0){break}r15=r17;r16=HEAP8[r5+r17|0]}if(HEAP8[r11]<<24>>24==0){break}while(1){r16=r5+(_strlen(r11)-1)|0;if(HEAP8[r16]<<24>>24!=32){break L228}HEAP8[r16]=0;if(HEAP8[r11]<<24>>24==0){break L228}}}}while(0);_fseek(r3,8,1);r14=_fgetc(r3)&255|_fgetc(r3)<<8&65280;HEAP32[HEAP32[r13>>2]+(r1<<2)>>2]=r14;r14=_fgetc(r3)&255;r16=_fgetc(r3);r15=r16<<8&65280|r14|_fgetc(r3)<<16&16711680|_fgetc(r3)<<24;HEAP32[HEAP32[r4]+(r1*52&-1)+32>>2]=r15;r15=_fgetc(r3)&255;r14=_fgetc(r3);r16=r14<<8&65280|r15|_fgetc(r3)<<16&16711680|_fgetc(r3)<<24;HEAP32[HEAP32[r4]+(r1*52&-1)+36>>2]=r16;r16=_fgetc(r3)&255;r15=_fgetc(r3);r14=r15<<8&65280|r16|_fgetc(r3)<<16&16711680|_fgetc(r3)<<24;HEAP32[HEAP32[r4]+(r1*52&-1)+40>>2]=r14;r14=HEAP32[r4];HEAP32[r14+(r1*52&-1)+44>>2]=(HEAP32[r14+(r1*52&-1)+40>>2]|0)>0?2:0;r14=HEAP32[r4];r16=r14+(r1*52&-1)+40|0;HEAP32[r16>>2]=HEAP32[r16>>2]+HEAP32[r14+(r1*52&-1)+36>>2]|0;r14=_fgetc(r3)&255;HEAP32[HEAP32[HEAP32[r9]+(r1*764&-1)+756>>2]>>2]=r14;HEAP32[HEAP32[HEAP32[r9]+(r1*764&-1)+756>>2]+8>>2]=128;r14=_fgetc(r3);if((r14&1|0)!=0){r16=HEAP32[r4]+(r1*52&-1)+44|0;HEAP32[r16>>2]=HEAP32[r16>>2]|1;r16=HEAP32[r4]+(r1*52&-1)+32|0;HEAP32[r16>>2]=HEAP32[r16>>2]>>1;r16=HEAP32[r4]+(r1*52&-1)+36|0;HEAP32[r16>>2]=HEAP32[r16>>2]>>1;r16=HEAP32[r4]+(r1*52&-1)+40|0;HEAP32[r16>>2]=HEAP32[r16>>2]>>1}r16=HEAP32[r4]+(r1*52&-1)+44|0;HEAP32[r16>>2]=HEAP32[r16>>2]|r14<<1&4;HEAP32[HEAP32[r7>>2]+(r1<<2)>>2]=r14>>>2&3;r14=r1+1|0;if((r14|0)<(HEAP32[r8]|0)){r1=r14}else{break}}STACKTOP=r2;return}function _med2_test(r1,r2,r3){var r4,r5,r6,r7;r3=STACKTOP;STACKTOP=STACKTOP+64|0;r4=_fgetc(r1);r5=_fgetc(r1);L245:do{if((r5<<16&16711680|r4<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255|0)==1296385026){r6=r3|0;if((r2|0)==0){r7=0;break}HEAP8[r2]=0;_fread(r6,1,0,r1);HEAP8[r6]=0;HEAP8[r2]=0;_strncpy(r2,r6,0);if(HEAP8[r2]<<24>>24==0){r7=0;break}while(1){r6=r2+(_strlen(r2)-1)|0;if(HEAP8[r6]<<24>>24!=32){r7=0;break L245}HEAP8[r6]=0;if(HEAP8[r2]<<24>>24==0){r7=0;break L245}}}else{r7=-1}}while(0);STACKTOP=r3;return r7}function _med2_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+4720|0;r6=r5+40;r7=r5+4136;r8=r5+4392;r9=r5+4648;_fseek(r2,r3,0);r3=_fgetc(r2);r10=_fgetc(r2);if((r10<<16&16711680|r3<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255|0)!=1296385026){r11=-1;STACKTOP=r5;return r11}_set_type(r1,5267288,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r3=r1+144|0;HEAP32[r3>>2]=32;HEAP32[r1+140>>2]=32;r10=(r1+176|0)>>2;HEAP32[r10]=_calloc(764,32);r12=HEAP32[r3>>2];if((r12|0)!=0){HEAP32[r1+180>>2]=_calloc(52,r12)}r12=r5|0;_fread(r12,1,40,r2);r3=0;while(1){_fread(r12,1,40,r2);r13=HEAP32[r10];r14=r13+(r3*764&-1)|0;_memset(r14,0,33);_strncpy(r14,r12,32);r15=HEAP8[r14];L261:do{if(r15<<24>>24!=0){r16=0;r17=r14;r18=r15;while(1){do{if((_isprint(r18<<24>>24)|0)==0){r4=191}else{if(HEAP8[r17]<<24>>24<0){r4=191;break}else{break}}}while(0);if(r4==191){r4=0;HEAP8[r17]=46}r19=r16+1|0;r20=r13+(r3*764&-1)+r19|0;r21=HEAP8[r20];if(r21<<24>>24!=0&(r19|0)<32){r16=r19;r17=r20;r18=r21}else{break}}if(HEAP8[r14]<<24>>24==0){break}while(1){r18=_strlen(r14)-1+r13+(r3*764&-1)|0;if(HEAP8[r18]<<24>>24!=32){break L261}HEAP8[r18]=0;if(HEAP8[r14]<<24>>24==0){break L261}}}}while(0);r14=_calloc(64,1);HEAP32[HEAP32[r10]+(r3*764&-1)+756>>2]=r14;r14=r3+1|0;if((r14|0)==31){break}else{r3=r14}}_fgetc(r2);r3=0;r12=_fgetc(r2);while(1){HEAP32[HEAP32[HEAP32[r10]+(r3*764&-1)+756>>2]>>2]=r12&255;HEAP32[HEAP32[HEAP32[r10]+(r3*764&-1)+756>>2]+8>>2]=128;HEAP32[HEAP32[HEAP32[r10]+(r3*764&-1)+756>>2]+16>>2]=0;HEAP32[HEAP32[HEAP32[r10]+(r3*764&-1)+756>>2]+40>>2]=r3;r14=r3+1|0;r13=_fgetc(r2);if((r14|0)==31){break}else{r3=r14;r12=r13}}_fgetc(r2);r12=(r1+180|0)>>2;r3=0;r13=_fgetc(r2);r14=_fgetc(r2);while(1){HEAP32[HEAP32[r12]+(r3*52&-1)+36>>2]=r14&255|r13<<8&65280;r15=r3+1|0;r18=_fgetc(r2);r17=_fgetc(r2);if((r15|0)==31){r22=0;break}else{r3=r15;r13=r18;r14=r17}}while(1){r14=_fgetc(r2)&65535;r13=_fgetc(r2)&255|r14<<8;r14=HEAP32[r12];HEAP32[r14+(r22*52&-1)+40>>2]=(r13&65535)+HEAP32[r14+(r22*52&-1)+36>>2]|0;HEAP32[HEAP32[r12]+(r22*52&-1)+44>>2]=(r13&65535)>1?2:0;r13=r22+1|0;if((r13|0)==31){break}else{r22=r13}}r22=(r1+136|0)>>2;HEAP32[r22]=4;r13=_fgetc(r2);r14=_fgetc(r2)&255|r13<<8&65280;r13=(r1+128|0)>>2;HEAP32[r13]=r14;r3=r1+132|0;HEAP32[r3>>2]=Math.imul(r14,HEAP32[r22]);_fread(r1+952|0,1,100,r2);r14=_fgetc(r2);HEAP32[r1+156>>2]=_fgetc(r2)&255|r14<<8&65280;r14=_fgetc(r2);HEAP32[r1+148>>2]=Math.floor(192/((_fgetc(r2)&255|r14<<8&65280)>>>0));_fgetc(r2);_fgetc(r2);r14=_fgetc(r2)&65535;r17=_fgetc(r2)&255|r14<<8;_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fseek(r2,16,1);if(r17<<16>>16==6){r17=r1+1276|0;HEAP32[r17>>2]=HEAP32[r17>>2]|192}r17=(r1+172|0)>>2;HEAP32[r17]=_calloc(4,HEAP32[r3>>2]);r3=(r1+168|0)>>2;HEAP32[r3]=_calloc(4,HEAP32[r13]+1|0);L286:do{if((HEAP32[r13]|0)>0){r14=0;while(1){r18=_calloc(1,(HEAP32[r22]<<2)+4|0);HEAP32[HEAP32[r3]+(r14<<2)>>2]=r18;HEAP32[HEAP32[HEAP32[r3]+(r14<<2)>>2]>>2]=64;r18=HEAP32[r22];L289:do{if((r18|0)>0){r15=0;r16=r18;while(1){r21=Math.imul(r16,r14)+r15|0;HEAP32[HEAP32[HEAP32[r3]+(r14<<2)>>2]+(r15<<2)+4>>2]=r21;r21=_calloc(HEAP32[HEAP32[HEAP32[r3]+(r14<<2)>>2]>>2]<<3|4,1);r20=Math.imul(HEAP32[r22],r14)+r15|0;HEAP32[HEAP32[r17]+(r20<<2)>>2]=r21;r21=HEAP32[HEAP32[HEAP32[r3]+(r14<<2)>>2]>>2];r20=Math.imul(HEAP32[r22],r14)+r15|0;HEAP32[HEAP32[HEAP32[r17]+(r20<<2)>>2]>>2]=r21;r21=r15+1|0;r20=HEAP32[r22];if((r21|0)<(r20|0)){r15=r21;r16=r20}else{break L289}}}}while(0);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r18=0;while(1){r16=0;while(1){r15=HEAP32[HEAP32[r17]+(HEAP32[HEAP32[HEAP32[r3]+(r14<<2)>>2]+(r16<<2)+4>>2]<<2)>>2];r20=_fgetc(r2);r21=_fgetc(r2)&255|r20<<8&65280;if((r21|0)==0){r23=0}else{L299:do{if(r21>>>0<3628){r20=r21;r19=24;while(1){r24=r19+12|0;r25=r20<<1;if((r25|0)<3628){r20=r25;r19=r24}else{r26=r25;r27=r24;break L299}}}else{r26=r21;r27=24}}while(0);L303:do{if((r26|0)>3842){r21=r27;r19=5249472;while(1){r20=r19-32|0;r24=r21-1|0;r25=HEAP32[r20>>2];if((r26|0)>(r25|0)){r21=r24;r19=r20}else{r28=r24;r29=r20,r30=r29>>2;r31=r25;break L303}}}else{r28=r27;r29=5249472,r30=r29>>2;r31=3842}}while(0);do{if((r31|0)>(r26|0)){if((HEAP32[r30+1]|0)<=(r26|0)){r32=1;break}if((HEAP32[r30+2]|0)<=(r26|0)){r32=1;break}r32=(HEAP32[r30+3]|0)<=(r26|0)&1}else{r32=1}}while(0);r23=r28-r32&255}HEAP8[(r18<<3)+r15+4|0]=r23;r19=_fgetc(r2)&255;HEAP8[(r18<<3)+r15+5|0]=(r19&255)>>>4;r21=(r18<<3)+r15+7|0;HEAP8[r21]=r19&15;HEAP8[(r18<<3)+r15+8|0]=_fgetc(r2)&255;r19=HEAP8[r21];r25=r19&255;if((r25|0)==3){HEAP8[r21]=4}else if((r25|0)==14|(r25|0)==13){HEAP8[r21]=10}else if((r25|0)==15){HEAP8[r21]=Math.floor(192/(r19&255))}r19=r16+1|0;if((r19|0)==4){break}else{r16=r19}}r16=r18+1|0;if((r16|0)==64){break}else{r18=r16}}r18=r14+1|0;if((r18|0)<(HEAP32[r13]|0)){r14=r18}else{break L286}}}}while(0);r13=r7|0;r7=r1+6536|0;r1=r8|0;r8=r6|0;r6=r9+28|0;r2=0;while(1){r23=HEAP32[r7>>2];do{if((r23|0)==0){r32=_getenv(5267892);if((r32|0)==0){_strncpy(r13,5267812,256);break}else{_strncpy(r13,r32,256);break}}else{_strncpy(r13,r23,256)}}while(0);r23=HEAP32[r10]+(r2*764&-1)|0;r32=_opendir(r13);do{if((r32|0)==0){r33=0;r34=0}else{while(1){r28=_readdir(r32);if((r28|0)==0){r4=233;break}r35=r28+4|0;if((_strcasecmp(r35,r23)|0)==0){break}}if(r4==233){r4=0;_closedir(r32);r33=0;r34=0;break}_strncpy(r1,r35,256);_closedir(r32);_snprintf(r8,4096,5266068,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r13,HEAP32[tempInt+4>>2]=r1,tempInt));r28=_fopen(r8,5263292);if((r28|0)==0){r33=0;r34=1;break}_fstat(_fileno(r28),r9);HEAP32[HEAP32[r12]+(r2*52&-1)+32>>2]=HEAP32[r6>>2];r33=r28;r34=1}}while(0);HEAP32[HEAP32[r10]+(r2*764&-1)+36>>2]=(HEAP32[HEAP32[r12]+(r2*52&-1)+32>>2]|0)!=0&1;r32=HEAP32[r10];do{if(HEAP8[r32+(r2*764&-1)|0]<<24>>24==0){r23=HEAP32[r12];if((HEAP32[r23+(r2*52&-1)+32>>2]|0)==0|r34^1){break}else{r36=r23;r4=241;break}}else{if(!r34){break}r36=HEAP32[r12];r4=241;break}}while(0);if(r4==241){r4=0;_load_sample(r33,0,r36+(HEAP32[HEAP32[r32+(r2*764&-1)+756>>2]+40>>2]*52&-1)|0,0);_fclose(r33)}r23=r2+1|0;if((r23|0)==31){r11=0;break}else{r2=r23}}STACKTOP=r5;return r11}function _med3_test(r1,r2,r3){var r4,r5,r6,r7;r3=STACKTOP;STACKTOP=STACKTOP+64|0;r4=_fgetc(r1);r5=_fgetc(r1);L348:do{if((r5<<16&16711680|r4<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255|0)==1296385027){r6=r3|0;if((r2|0)==0){r7=0;break}HEAP8[r2]=0;_fread(r6,1,0,r1);HEAP8[r6]=0;HEAP8[r2]=0;_strncpy(r2,r6,0);if(HEAP8[r2]<<24>>24==0){r7=0;break}while(1){r6=r2+(_strlen(r2)-1)|0;if(HEAP8[r6]<<24>>24!=32){r7=0;break L348}HEAP8[r6]=0;if(HEAP8[r2]<<24>>24==0){r7=0;break L348}}}else{r7=-1}}while(0);STACKTOP=r3;return r7}function _med3_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+56|0;r6=r5;r7=r5+4;r8=r5+8;r9=r5+12;r10=r5+16;_fseek(r2,r3,0);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_set_type(r1,5267272,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r3=r1+144|0;HEAP32[r3>>2]=32;HEAP32[r1+140>>2]=32;r11=(r1+176|0)>>2;HEAP32[r11]=_calloc(764,32);r12=HEAP32[r3>>2];if((r12|0)!=0){HEAP32[r1+180>>2]=_calloc(52,r12)}r12=r10|0;r3=0;while(1){r13=0;while(1){if((r13|0)>=40){break}r14=_fgetc(r2)&255;HEAP8[r10+r13|0]=r14;if(r14<<24>>24==0){break}else{r13=r13+1|0}}r13=HEAP32[r11];r14=r13+(r3*764&-1)|0;_memset(r14,0,33);_strncpy(r14,r12,32);r15=HEAP8[r14];L365:do{if(r15<<24>>24!=0){r16=0;r17=r14;r18=r15;while(1){do{if((_isprint(r18<<24>>24)|0)==0){r4=262}else{if(HEAP8[r17]<<24>>24<0){r4=262;break}else{break}}}while(0);if(r4==262){r4=0;HEAP8[r17]=46}r19=r16+1|0;r20=r13+(r3*764&-1)+r19|0;r21=HEAP8[r20];if(r21<<24>>24!=0&(r19|0)<32){r16=r19;r17=r20;r18=r21}else{break}}if(HEAP8[r14]<<24>>24==0){break}while(1){r18=_strlen(r14)-1+r13+(r3*764&-1)|0;if(HEAP8[r18]<<24>>24!=32){break L365}HEAP8[r18]=0;if(HEAP8[r14]<<24>>24==0){break L365}}}}while(0);r14=_calloc(64,1);HEAP32[HEAP32[r11]+(r3*764&-1)+756>>2]=r14;r14=r3+1|0;if((r14|0)==32){break}else{r3=r14}}r3=_fgetc(r2);r12=_fgetc(r2);r10=r12<<16&16711680|r3<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;r3=0;while(1){if((r10|0)<0){r22=_fgetc(r2)&255}else{r22=0}HEAP32[HEAP32[HEAP32[r11]+(r3*764&-1)+756>>2]>>2]=r22;HEAP32[HEAP32[HEAP32[r11]+(r3*764&-1)+756>>2]+8>>2]=128;HEAP32[HEAP32[HEAP32[r11]+(r3*764&-1)+756>>2]+16>>2]=0;HEAP32[HEAP32[HEAP32[r11]+(r3*764&-1)+756>>2]+40>>2]=r3;r12=r3+1|0;if((r12|0)==32){break}else{r10=r10<<1;r3=r12}}r3=_fgetc(r2);r10=_fgetc(r2);r22=(r1+180|0)>>2;r12=r10<<16&16711680|r3<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;r3=0;while(1){if((r12|0)<0){r10=_fgetc(r2);r23=_fgetc(r2)&255|r10<<8&65280}else{r23=0}HEAP32[HEAP32[r22]+(r3*52&-1)+36>>2]=r23;r10=r3+1|0;if((r10|0)==32){break}else{r12=r12<<1;r3=r10}}r3=_fgetc(r2);r12=_fgetc(r2);r23=r12<<16&16711680|r3<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;r3=0;while(1){if((r23|0)<0){r12=_fgetc(r2);r24=_fgetc(r2)&255|r12<<8&65280}else{r24=0}r12=HEAP32[r22];HEAP32[r12+(r3*52&-1)+32>>2]=HEAP32[r12+(r3*52&-1)+36>>2]+r24|0;r12=HEAP32[r22];HEAP32[r12+(r3*52&-1)+40>>2]=HEAP32[r12+(r3*52&-1)+36>>2]+r24|0;HEAP32[HEAP32[r22]+(r3*52&-1)+44>>2]=r24>>>0>1?2:0;r12=r3+1|0;if((r12|0)==32){break}else{r23=r23<<1;r3=r12}}r3=(r1+136|0)>>2;HEAP32[r3]=4;r23=_fgetc(r2);r24=_fgetc(r2)&255|r23<<8&65280;r23=(r1+128|0)>>2;HEAP32[r23]=r24;r12=r1+132|0;HEAP32[r12>>2]=Math.imul(r24,HEAP32[r3]);r24=_fgetc(r2);r10=_fgetc(r2)&255|r24<<8&65280;HEAP32[r1+156>>2]=r10;_fread(r1+952|0,1,r10,r2);r10=_fgetc(r2)&65535;r24=_fgetc(r2)&255|r10<<8;r10=r24&65535;r14=r1+148|0;HEAP32[r14>>2]=r10;if((r24&65535)>10){HEAP32[r1+152>>2]=Math.floor(((r10*125&-1)>>>0)/33);HEAP32[r14>>2]=6}r14=_fgetc(r2)<<24;_fgetc(r2);r10=_fgetc(r2)&65535;r24=_fgetc(r2)&65535;r13=r10<<8;_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fseek(r2,16,1);r10=_fgetc(r2);r15=_fgetc(r2);r18=r15<<16&16711680|r10<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;r10=0;while(1){if((r18|0)<0){_fgetc(r2)}r15=r10+1|0;if((r15|0)==32){break}else{r18=r18<<1;r10=r15}}r10=r14>>24;r14=r24&255|r13;r13=_fgetc(r2);r24=_fgetc(r2);r18=r24<<16&16711680|r13<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;r13=0;while(1){if((r18|0)<0){_fgetc(r2)}r24=r13+1|0;if((r24|0)==32){break}else{r18=r18<<1;r13=r24}}do{if(r14<<16>>16==6){r13=r1+1276|0;HEAP32[r13>>2]=HEAP32[r13>>2]|192;r25=0;break}else{r25=0}}while(0);while(1){HEAP32[HEAP32[HEAP32[r11]+(r25*764&-1)+756>>2]+12>>2]=r10;r14=r25+1|0;if((r14|0)==32){break}else{r25=r14}}r25=(r1+172|0)>>2;HEAP32[r25]=_calloc(4,HEAP32[r12>>2]);r12=(r1+168|0)>>2;HEAP32[r12]=_calloc(4,HEAP32[r23]+1|0);L417:do{if((HEAP32[r23]|0)>0){r1=0;while(1){r10=_calloc(1,(HEAP32[r3]<<2)+4|0);HEAP32[HEAP32[r12]+(r1<<2)>>2]=r10;HEAP32[HEAP32[HEAP32[r12]+(r1<<2)>>2]>>2]=64;r10=HEAP32[r3];L421:do{if((r10|0)>0){r14=0;r13=r10;while(1){r18=Math.imul(r13,r1)+r14|0;HEAP32[HEAP32[HEAP32[r12]+(r1<<2)>>2]+(r14<<2)+4>>2]=r18;r18=_calloc(HEAP32[HEAP32[HEAP32[r12]+(r1<<2)>>2]>>2]<<3|4,1);r24=Math.imul(HEAP32[r3],r1)+r14|0;HEAP32[HEAP32[r25]+(r24<<2)>>2]=r18;r18=HEAP32[HEAP32[HEAP32[r12]+(r1<<2)>>2]>>2];r24=Math.imul(HEAP32[r3],r1)+r14|0;HEAP32[HEAP32[HEAP32[r25]+(r24<<2)>>2]>>2]=r18;r18=r14+1|0;r24=HEAP32[r3];if((r18|0)<(r24|0)){r14=r18;r13=r24}else{break L421}}}}while(0);_fgetc(r2);r10=_fgetc(r2);r13=_fgetc(r2);r14=_fgetc(r2)&255|r13<<8&65280;r13=_calloc(1,r14+16|0),r24=r13>>2;r18=r13>>2;if((r13|0)==0){r4=297;break}do{if((r10&16|0)==0){if((r10&1|0)==0){r15=_fgetc(r2);r17=_fgetc(r2);HEAP32[r18]=r17<<16&16711680|r15<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;break}else{HEAP32[r18]=-1;break}}else{HEAP32[r18]=0}}while(0);do{if((r10&32|0)==0){if((r10&2|0)==0){r15=_fgetc(r2);r17=_fgetc(r2);HEAP32[r24+1]=r17<<16&16711680|r15<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;break}else{HEAP32[r24+1]=-1;break}}else{HEAP32[r24+1]=0}}while(0);do{if((r10&64|0)==0){if((r10&4|0)==0){r15=_fgetc(r2);r17=_fgetc(r2);HEAP32[r24+2]=r17<<16&16711680|r15<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;break}else{HEAP32[r24+2]=-1;break}}else{HEAP32[r24+2]=0}}while(0);do{if((r10&128|0)==0){if((r10&8|0)==0){r15=_fgetc(r2);r17=_fgetc(r2);HEAP32[r24+3]=r17<<16&16711680|r15<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;break}else{HEAP32[r24+3]=-1;break}}else{HEAP32[r24+3]=0}}while(0);_fread(r13+16|0,1,r14,r2);HEAP32[r6>>2]=HEAP32[r18];HEAP32[r7>>2]=HEAP32[r24+1];HEAP32[r8>>2]=HEAP32[r24+2];HEAP32[r9>>2]=HEAP32[r24+3];r10=HEAP32[r3];r15=_calloc(3,256);if((r15|0)==0){r4=320;break}r17=(r10|0)/4&-1&255;r16=r17<<24>>24==0;r21=16-r10|0;r20=(r10|0)>0;r19=r10*3&-1;r26=(r17-1&255)+1&65535;r27=0;r28=r8;r29=r15;r30=0;r31=r6;while(1){r32=(r30|0)==32;r33=r32?r9:r28,r34=r33>>2;r35=r32?r7:r31,r32=r35>>2;L457:do{if((HEAP32[r32]|0)<0){if(r16){r36=0;r37=r27}else{r38=r17;r39=0;r40=r27;while(1){r41=r38-1&255;r42=r40&65535;r43=HEAP8[r13+(r42>>>1)+16|0];r44=((r42&1|0)==0?(r43&255)>>>4:r43&15)&255|r39<<4;if(r41<<24>>24==0){break}else{r38=r41;r39=r44;r40=r40+1&65535}}r36=r44&65535;r37=r27+r26&65535}if(!r20){r45=r37;break}r40=r37;r39=r36<<r21;r38=0;r41=r29;while(1){if((r39&32768|0)==0){r46=r40}else{r43=r40&65535;r42=HEAP8[r13+(r43>>>1)+16|0];r47=r40+1&65535;r48=HEAP8[r13+(r47>>>1)+16|0];HEAP8[r41]=((r47&1|0)==0?(r48&255)>>>4:r48&15)|((r43&1|0)==0?(r42&255)>>>4:r42)<<4;r42=r40+2&65535;r43=HEAP8[r13+(r42>>>1)+16|0];HEAP8[r41+1|0]=((r42&1|0)==0?(r43&255)>>>4:r43)<<4;r46=r40+3&65535}r43=r38+1&255;if((r43&255|0)<(r10|0)){r40=r46;r39=r39<<1&131070;r38=r43;r41=r41+3|0}else{r45=r46;break L457}}}else{r45=r27}}while(0);L471:do{if((HEAP32[r34]|0)<0){if(r16){r49=0;r50=r45}else{r41=r17;r38=0;r39=r45;while(1){r40=r41-1&255;r43=r39&65535;r42=HEAP8[r13+(r43>>>1)+16|0];r51=((r43&1|0)==0?(r42&255)>>>4:r42&15)&255|r38<<4;if(r40<<24>>24==0){break}else{r41=r40;r38=r51;r39=r39+1&65535}}r49=r51&65535;r50=r45+r26&65535}if(!r20){r52=r50;break}r39=r50;r38=r49<<r21;r41=0;r40=r29;while(1){if((r38&32768|0)==0){r53=r39}else{r42=r39&65535;r43=HEAP8[r13+(r42>>>1)+16|0];r48=r40+1|0;HEAP8[r48]=((r42&1|0)==0?(r43&255)>>>4:r43&15)|HEAP8[r48];r48=r39+1&65535;r43=HEAP8[r13+(r48>>>1)+16|0];r42=r39+2&65535;r47=HEAP8[r13+(r42>>>1)+16|0];HEAP8[r40+2|0]=((r42&1|0)==0?(r47&255)>>>4:r47&15)|((r48&1|0)==0?(r43&255)>>>4:r43)<<4;r53=r39+3&65535}r43=r41+1&255;if((r43&255|0)<(r10|0)){r39=r53;r38=r38<<1&131070;r41=r43;r40=r40+3|0}else{r52=r53;break L471}}}else{r52=r45}}while(0);HEAP32[r32]=HEAP32[r32]<<1;HEAP32[r34]=HEAP32[r34]<<1;r40=r30+1|0;if((r40|0)==64){break}else{r27=r52;r28=r33;r29=r29+r19|0;r30=r40;r31=r35}}r31=r1&65535;r30=0;while(1){r19=r30*12&-1;r29=0;while(1){r28=HEAP32[HEAP32[r25]+(HEAP32[HEAP32[HEAP32[r12]+(r31<<2)>>2]+(r29<<2)+4>>2]<<2)>>2];r27=(r29*3&-1)+r19|0;r10=HEAP8[r15+r27|0];HEAP8[(r30<<3)+r28+4|0]=r10<<24>>24==0?0:r10+48&255;r10=r27+(r15+1)|0;r21=HEAPU8[r10]>>>4;HEAP8[(r30<<3)+r28+5|0]=r21<<24>>24==0?0:r21+1&255;r21=HEAP8[r10]&15;r10=(r30<<3)+r28+7|0;HEAP8[r10]=r21;r20=HEAP8[r27+(r15+2)|0];r27=(r30<<3)+r28+8|0;HEAP8[r27]=r20;r26=r21&255;do{if((r26|0)==3){HEAP8[r10]=4}else if((r26|0)==12){HEAP8[r27]=(((r20&255)>>>4)*10&255)+(r20&15)&255}else if((r26|0)==13){HEAP8[r10]=10}else if((r26|0)==15){if(r20<<24>>24==0){HEAP8[r10]=13;break}else if(r20<<24>>24==-1){HEAP8[r10]=0;HEAP8[r27]=0;HEAP8[(r30<<3)+r28+6|0]=1;break}else if(r20<<24>>24==-2){HEAP8[r10]=0;HEAP8[r27]=0;break}else if(r20<<24>>24==-15){HEAP8[r10]=14;HEAP8[r27]=-109;break}else if(r20<<24>>24==-14){HEAP8[r10]=14;HEAP8[r27]=-61;break}else if(r20<<24>>24==-13){HEAP8[r10]=14;HEAP8[r27]=-45;break}else{if((r20&255)<=10){break}HEAP8[r10]=-85;HEAP8[r27]=Math.floor((((r20&255)*125&-1)>>>0)/33)&255;break}}else if(!((r26|0)==0|(r26|0)==1|(r26|0)==2)){HEAP8[r10]=0;HEAP8[r27]=0}}while(0);r27=r29+1|0;if((r27|0)==4){break}else{r29=r27}}r29=r30+1|0;if((r29|0)==64){break}else{r30=r29}}_free(r15);_free(r13);r30=r1+1|0;if((r30|0)<(HEAP32[r23]|0)){r1=r30}else{break L417}}if(r4==297){___assert_func(5266044,318,5268780,5265184)}else if(r4==320){___assert_func(5266044,98,5268748,5264584)}}}while(0);r4=_fgetc(r2);r23=_fgetc(r2);r12=r23<<16&16711680|r4<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;r4=0;while(1){do{if((r12|0)<=-1){r23=_fgetc(r2);r25=_fgetc(r2);r52=r25<<16&16711680|r23<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;HEAP32[HEAP32[r22]+(r4*52&-1)+32>>2]=r52;r52=_fgetc(r2)&65535;if((_fgetc(r2)&255|r52<<8)<<16>>16!=0){break}HEAP32[HEAP32[r11]+(r4*764&-1)+36>>2]=(HEAP32[HEAP32[r22]+(r4*52&-1)+32>>2]|0)!=0&1;_load_sample(r2,0,HEAP32[r22]+(HEAP32[HEAP32[HEAP32[r11]+(r4*764&-1)+756>>2]+40>>2]*52&-1)|0,0)}}while(0);r52=r4+1|0;if((r52|0)==32){break}else{r12=r12<<1;r4=r52}}STACKTOP=r5;return 0}function _med4_test(r1,r2,r3){var r4,r5,r6,r7;r3=STACKTOP;STACKTOP=STACKTOP+64|0;r4=_fgetc(r1);r5=_fgetc(r1);L520:do{if((r5<<16&16711680|r4<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255|0)==1296385028){r6=r3|0;if((r2|0)==0){r7=0;break}HEAP8[r2]=0;_fread(r6,1,0,r1);HEAP8[r6]=0;HEAP8[r2]=0;_strncpy(r2,r6,0);if(HEAP8[r2]<<24>>24==0){r7=0;break}while(1){r6=r2+(_strlen(r2)-1)|0;if(HEAP8[r6]<<24>>24!=32){r7=0;break L520}HEAP8[r6]=0;if(HEAP8[r2]<<24>>24==0){r7=0;break L520}}}else{r7=-1}}while(0);STACKTOP=r3;return r7}function _med4_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71,r72,r73,r74,r75,r76,r77,r78,r79,r80,r81,r82,r83,r84,r85,r86,r87,r88,r89,r90;r4=r1>>2;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+1616|0;r7=r6;r8=r6+16;r9=r6+1040;r10=r6+1080;_fseek(r2,r3,0);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r11=_ftell(r2);_fseek(r2,0,2);L528:do{if((_ftell(r2)|0)>2e3){_fseek(r2,-1023,1);_fread(r8|0,1,1024,r2);r12=0;while(1){if((r12|0)>=1012){r13=2;r14=10;break L528}if((_memcmp(r8+r12|0,5267260,8)|0)==0){break}else{r12=r12+1|0}}r13=HEAPU8[r12+(r8+10)|0];r14=HEAPU8[r12+(r8+11)|0]}else{r13=2;r14=10}}while(0);_fseek(r2,r11+r3|0,0);_snprintf(r1+64|0,64,5266e3,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r13,HEAP32[tempInt+4>>2]=r14,tempInt));r14=_fgetc(r2);if((r14&128|0)==0){r15=0;r16=0}else{r15=_fgetc(r2)&255;r16=1}if((r14&64|0)==0){r17=r15;r18=r16}else{r17=_fgetc(r2)&255|r15<<8;r18=r16+1|0}if((r14&32|0)==0){r19=r17;r20=r18}else{r19=_fgetc(r2)&255|r17<<8;r20=r18+1|0}if((r14&16|0)==0){r21=r19;r22=r20}else{r21=_fgetc(r2)&255|r19<<8;r22=r20+1|0}if((r14&8|0)==0){r23=r21;r24=r22}else{r23=_fgetc(r2)&255|r21<<8;r24=r22+1|0}if((r14&4|0)==0){r25=r23;r26=r24}else{r25=_fgetc(r2)&255|r23<<8;r26=r24+1|0}if((r14&2|0)==0){r27=r25;r28=r26}else{r27=_fgetc(r2)&255|r25<<8;r28=r26+1|0}if((r14&1|0)==0){r29=r27;r30=r28}else{r29=_fgetc(r2)&255|r27<<8;r30=r28+1|0}r28=r9|0;r27=0;r14=r29<<32-(r30<<3);r30=0;while(1){r29=(r30*48&-1)+5245368|0;_memset(r29,0,48);if((r14|0)>-1){r31=r27}else{r26=_fgetc(r2);r25=_fgetc(r2);r24=r25&255;if((r24|0)==0){r32=0}else{r23=r25&255;r25=r23>>>0>1;r22=0;while(1){HEAP8[r9+r22|0]=_fgetc(r2)&255;r21=r22+1|0;if((r21|0)<(r24|0)){r22=r21}else{break}}r32=r25?r23:1}HEAP8[r9+r32|0]=0;r22=(r30*48&-1)+5245408|0;HEAP32[r22>>2]=64;if((r26&1|0)==0){r24=_fgetc(r2);HEAP32[(r30*48&-1)+5245400>>2]=(_fgetc(r2)&255|r24<<8&65280)<<1}if((r26&2|0)==0){r24=_fgetc(r2);r33=(_fgetc(r2)&255|r24<<8&32512)<<1&65534}else{r33=0}if((r26&4|0)==0){_fgetc(r2)}if((r26&8|0)==0){_fgetc(r2)}if((r26&32|0)==0){HEAP32[r22>>2]=_fgetc(r2)&255}if((r26&64|0)==0){HEAP32[(r30*48&-1)+5245412>>2]=_fgetc(r2)<<24>>24}HEAP32[(r30*48&-1)+5245404>>2]=HEAP32[(r30*48&-1)+5245400>>2]+r33|0;_memset(r29,0,33);_strncpy(r29,r28,32);r22=HEAP8[r29];L587:do{if(r22<<24>>24!=0){r24=0;r12=r29;r21=r22;while(1){do{if((_isprint(r21<<24>>24)|0)==0){r5=400}else{if(HEAP8[r12]<<24>>24<0){r5=400;break}else{break}}}while(0);if(r5==400){r5=0;HEAP8[r12]=46}r20=r24+1|0;r19=(r30*48&-1)+r20+5245368|0;r18=HEAP8[r19];if(r18<<24>>24!=0&(r20|0)<32){r24=r20;r12=r19;r21=r18}else{break}}if(HEAP8[r29]<<24>>24==0){break}while(1){r21=_strlen(r29)-1+(r30*48&-1)+5245368|0;if(HEAP8[r21]<<24>>24!=32){break L587}HEAP8[r21]=0;if(HEAP8[r29]<<24>>24==0){break L587}}}}while(0);r31=r27+1|0}r29=r30+1|0;if((r29|0)==32){break}else{r27=r31;r14=r14<<1;r30=r29}}r30=_fgetc(r2);r14=(r1+128|0)>>2;HEAP32[r14]=_fgetc(r2)&255|r30<<8&65280;r30=_fgetc(r2);r27=_fgetc(r2)&255|r30<<8&65280;HEAP32[r4+39]=r27;_fread(r1+952|0,1,r27,r2);r27=_fgetc(r2)&65535;r30=_fgetc(r2)&255|r27<<8;r27=r30&65535;if((r30&65535)<11){r30=r1+148|0;HEAP32[r30>>2]=r27;HEAP32[r4+38]=125;r34=r30}else{HEAP32[r4+38]=Math.floor(((r27*125&-1)>>>0)/33);r34=r1+148|0}r27=_fgetc(r2)<<24>>24;_fgetc(r2);r30=_fgetc(r2)<<24>>24;HEAP32[r34>>2]=_fgetc(r2)&255;if((r30&32|0)==0){r28=r1+1276|0;HEAP32[r28>>2]=HEAP32[r28>>2]|192}if((r13|0)==2){HEAP32[r34>>2]=6-(r30>>>5&1)|0}_fseek(r2,20,1);_fread(r7|0,1,16,r2);_fgetc(r2);r7=0;while(1){r30=(r7*48&-1)+5245412|0;HEAP32[r30>>2]=HEAP32[r30>>2]+r27|0;r30=r7+1|0;if((r30|0)==32){break}else{r7=r30}}_fgetc(r2);r7=(r1+136|0)>>2;HEAP32[r7]=_fgetc(r2)&255;_fseek(r2,-2,1);r27=Math.imul(HEAP32[r14],HEAP32[r7]);HEAP32[r4+33]=r27;r30=(r1+172|0)>>2;HEAP32[r30]=_calloc(4,r27);r27=(r1+168|0)>>2;HEAP32[r27]=_calloc(4,HEAP32[r14]+1|0);L615:do{if((HEAP32[r14]|0)>0){r34=0;while(1){_fgetc(r2);_fgetc(r2);r13=(_fgetc(r2)&255)+1&255;_fgetc(r2);_fgetc(r2);r28=_fgetc(r2);r33=_calloc(1,(HEAP32[r7]<<2)+4|0);HEAP32[HEAP32[r27]+(r34<<2)>>2]=r33;HEAP32[HEAP32[HEAP32[r27]+(r34<<2)>>2]>>2]=r13&255;r33=HEAP32[r7];L618:do{if((r33|0)>0){r32=0;r9=r33;while(1){r29=Math.imul(r9,r34)+r32|0;HEAP32[HEAP32[HEAP32[r27]+(r34<<2)>>2]+(r32<<2)+4>>2]=r29;r29=_calloc(HEAP32[HEAP32[HEAP32[r27]+(r34<<2)>>2]>>2]<<3|4,1);r22=Math.imul(HEAP32[r7],r34)+r32|0;HEAP32[HEAP32[r30]+(r22<<2)>>2]=r29;r29=HEAP32[HEAP32[HEAP32[r27]+(r34<<2)>>2]>>2];r22=Math.imul(HEAP32[r7],r34)+r32|0;HEAP32[HEAP32[HEAP32[r30]+(r22<<2)>>2]>>2]=r29;r29=r32+1|0;r22=HEAP32[r7];if((r29|0)<(r22|0)){r32=r29;r9=r22}else{break L618}}}}while(0);do{if((r28&128|0)==0){if((r28&64|0)!=0){r35=0;break}r33=_fgetc(r2);r9=_fgetc(r2);r35=r9<<16&16711680|r33<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255}else{r35=-1}}while(0);do{if((r28&32|0)==0){if((r28&16|0)!=0){r36=0;break}r33=_fgetc(r2);r9=_fgetc(r2);r36=r9<<16&16711680|r33<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255}else{r36=-1}}while(0);do{if((r13&255)>32){do{if((r28&8|0)==0){if((r28&4|0)!=0){r37=0;break}r33=_fgetc(r2);r9=_fgetc(r2);r37=r9<<16&16711680|r33<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255}else{r37=-1}}while(0);if((r28&2|0)!=0){r38=-1;r39=r37;break}if((r28&1|0)!=0){r38=0;r39=r37;break}r33=_fgetc(r2);r9=_fgetc(r2);r38=r9<<16&16711680|r33<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;r39=r37}else{r38=0;r39=0}}while(0);if((_fgetc(r2)&255)<<24>>24==-1){r40=0;r41=r35;r42=r36;r43=0}else{break}while(1){L641:do{if((r41|0)<0){if((r40&1|0)==0){r28=_fgetc(r2)&255;HEAP8[5247744]=r28;r44=(r28&255)>>>4}else{r44=HEAP8[5247744]&15}r28=r40^1;r13=r44;r33=0;while(1){r9=HEAP32[HEAP32[r30]+(HEAP32[HEAP32[HEAP32[r27]+(r34<<2)>>2]+(r33<<2)+4>>2]<<2)>>2];if((r13&8)<<24>>24==0){r45=r28}else{r32=(r28&1|0)==0;if(r32){r22=_fgetc(r2)&255;HEAP8[5247744]=r22;r46=(r22&255)>>>4;r47=r22}else{r22=HEAP8[5247744];r46=r22&15;r47=r22}r22=r28^1;if((r22&1|0)==0){r29=_fgetc(r2)&255;HEAP8[5247744]=r29;r48=(r29&255)>>>4;r49=r29}else{r48=r47&15;r49=r47}if(r32){r32=_fgetc(r2)&255;HEAP8[5247744]=r32;r50=(r32&255)>>>4}else{r50=r49&15}r32=r48|r46<<4;HEAP8[(r43<<3)+r9+4|0]=r32<<24>>24==0?0:r32+48&255;HEAP8[(r43<<3)+r9+5|0]=r50;r45=r22}r22=r33+1|0;if((r22|0)==4){r51=r45;break L641}r28=r45;r13=r13<<1;r33=r22}}else{r51=r40}}while(0);L666:do{if((r42|0)<0){if((r51&1|0)==0){r33=_fgetc(r2)&255;HEAP8[5247744]=r33;r52=(r33&255)>>>4}else{r52=HEAP8[5247744]&15}r33=r51^1;r13=r52;r28=0;while(1){r22=HEAP32[HEAP32[r30]+(HEAP32[HEAP32[HEAP32[r27]+(r34<<2)>>2]+(r28<<2)+4>>2]<<2)>>2];do{if((r13&8)<<24>>24==0){r53=r33}else{r9=(r33&1|0)==0;if(r9){r32=_fgetc(r2)&255;HEAP8[5247744]=r32;r54=(r32&255)>>>4;r55=r32}else{r32=HEAP8[5247744];r54=r32&15;r55=r32}r32=r33^1;if((r32&1|0)==0){r29=_fgetc(r2)&255;HEAP8[5247744]=r29;r56=(r29&255)>>>4;r57=r29}else{r56=r55&15;r57=r55}if(r9){r9=_fgetc(r2)&255;HEAP8[5247744]=r9;r58=(r9&255)>>>4}else{r58=r57&15}r9=r58|r56<<4;r29=(r43<<3)+r22+7|0;HEAP8[r29]=r54;r26=(r43<<3)+r22+8|0;HEAP8[r26]=r9;r23=r54&255;if((r23|0)==3){HEAP8[r29]=4;r53=r32;break}else if((r23|0)==12){HEAP8[r26]=(r56*10&255)+r58&255;r53=r32;break}else if((r23|0)==13){HEAP8[r29]=10;r53=r32;break}else if((r23|0)==15){if(r9<<24>>24==0){HEAP8[r29]=13;r53=r32;break}else if(r9<<24>>24==-1){HEAP8[r29]=0;HEAP8[r26]=0;HEAP8[(r43<<3)+r22+6|0]=1;r53=r32;break}else if(r9<<24>>24==-2){HEAP8[r29]=0;HEAP8[r26]=0;r53=r32;break}else if(r9<<24>>24==-15){HEAP8[r29]=14;HEAP8[r26]=-109;r53=r32;break}else if(r9<<24>>24==-14){HEAP8[r29]=14;HEAP8[r26]=-61;r53=r32;break}else if(r9<<24>>24==-13){HEAP8[r29]=14;HEAP8[r26]=-45;r53=r32;break}else{if((r9&255)<=10){r53=r32;break}HEAP8[r29]=-85;HEAP8[r26]=Math.floor((((r9&255)*125&-1)>>>0)/33)&255;r53=r32;break}}else if((r23|0)==0|(r23|0)==1|(r23|0)==2){r53=r32;break}else{HEAP8[r29]=0;HEAP8[r26]=0;r53=r32;break}}}while(0);r22=r28+1|0;if((r22|0)==4){r59=r53;break L666}r33=r53;r13=r13<<1;r28=r22}}else{r59=r51}}while(0);r28=r43+1|0;if((r28|0)==32){r60=r59;r61=r39;r62=r38;r63=32;break}else{r40=r59;r41=r41<<1;r42=r42<<1;r43=r28}}while(1){L708:do{if((r61|0)<0){if((r60&1|0)==0){r28=_fgetc(r2)&255;HEAP8[5247744]=r28;r64=(r28&255)>>>4}else{r64=HEAP8[5247744]&15}r28=r60^1;r13=r64;r33=0;while(1){r22=HEAP32[HEAP32[r30]+(HEAP32[HEAP32[HEAP32[r27]+(r34<<2)>>2]+(r33<<2)+4>>2]<<2)>>2];if((r13&8)<<24>>24==0){r65=r28}else{r32=(r28&1|0)==0;if(r32){r26=_fgetc(r2)&255;HEAP8[5247744]=r26;r66=(r26&255)>>>4;r67=r26}else{r26=HEAP8[5247744];r66=r26&15;r67=r26}r26=r28^1;if((r26&1|0)==0){r29=_fgetc(r2)&255;HEAP8[5247744]=r29;r68=(r29&255)>>>4;r69=r29}else{r68=r67&15;r69=r67}if(r32){r32=_fgetc(r2)&255;HEAP8[5247744]=r32;r70=(r32&255)>>>4}else{r70=r69&15}r32=r68|r66<<4;HEAP8[(r63<<3)+r22+4|0]=r32<<24>>24==0?0:r32+48&255;HEAP8[(r63<<3)+r22+5|0]=r70;r65=r26}r26=r33+1|0;if((r26|0)==4){r71=r65;break L708}r28=r65;r13=r13<<1;r33=r26}}else{r71=r60}}while(0);L733:do{if((r62|0)<0){if((r71&1|0)==0){r33=_fgetc(r2)&255;HEAP8[5247744]=r33;r72=(r33&255)>>>4}else{r72=HEAP8[5247744]&15}r33=r71^1;r13=r72;r28=0;while(1){r26=HEAP32[HEAP32[r30]+(HEAP32[HEAP32[HEAP32[r27]+(r34<<2)>>2]+(r28<<2)+4>>2]<<2)>>2];do{if((r13&8)<<24>>24==0){r73=r33}else{r22=(r33&1|0)==0;if(r22){r32=_fgetc(r2)&255;HEAP8[5247744]=r32;r74=(r32&255)>>>4;r75=r32}else{r32=HEAP8[5247744];r74=r32&15;r75=r32}r32=r33^1;if((r32&1|0)==0){r29=_fgetc(r2)&255;HEAP8[5247744]=r29;r76=(r29&255)>>>4;r77=r29}else{r76=r75&15;r77=r75}if(r22){r22=_fgetc(r2)&255;HEAP8[5247744]=r22;r78=(r22&255)>>>4}else{r78=r77&15}r22=r78|r76<<4;r29=(r63<<3)+r26+7|0;HEAP8[r29]=r74;r23=(r63<<3)+r26+8|0;HEAP8[r23]=r22;r9=r74&255;if((r9|0)==13){HEAP8[r29]=10;r73=r32;break}else if((r9|0)==15){if(r22<<24>>24==0){HEAP8[r29]=13;r73=r32;break}else if(r22<<24>>24==-1){HEAP8[r29]=0;HEAP8[r23]=0;HEAP8[(r63<<3)+r26+6|0]=1;r73=r32;break}else if(r22<<24>>24==-2){HEAP8[r29]=0;HEAP8[r23]=0;r73=r32;break}else if(r22<<24>>24==-15){HEAP8[r29]=14;HEAP8[r23]=-109;r73=r32;break}else if(r22<<24>>24==-14){HEAP8[r29]=14;HEAP8[r23]=-61;r73=r32;break}else if(r22<<24>>24==-13){HEAP8[r29]=14;HEAP8[r23]=-45;r73=r32;break}else{if((r22&255)<=10){r73=r32;break}HEAP8[r29]=-85;HEAP8[r23]=Math.floor((((r22&255)*125&-1)>>>0)/33)&255;r73=r32;break}}else if((r9|0)==0|(r9|0)==1|(r9|0)==2){r73=r32;break}else if((r9|0)==12){HEAP8[r23]=(r76*10&255)+r78&255;r73=r32;break}else if((r9|0)==3){HEAP8[r29]=4;r73=r32;break}else{HEAP8[r29]=0;HEAP8[r23]=0;r73=r32;break}}}while(0);r26=r28+1|0;if((r26|0)==4){r79=r73;break L733}r33=r73;r13=r13<<1;r28=r26}}else{r79=r71}}while(0);r28=r63+1|0;if((r28|0)==64){break}else{r60=r79;r61=r61<<1;r62=r62<<1;r63=r28}}r28=r34+1|0;if((r28|0)<(HEAP32[r14]|0)){r34=r28}else{break L615}}r28=(r34|0)>-1;L775:do{if(r28){r13=r34;r33=HEAP32[r7];while(1){L780:do{if((r33|0)>0){r26=0;r32=r33;while(1){r23=Math.imul(r32,r13)+r26|0;_free(HEAP32[HEAP32[r30]+(r23<<2)>>2]);r23=r26+1|0;r29=HEAP32[r7];if((r23|0)<(r29|0)){r26=r23;r32=r29}else{r80=r29;break L780}}}else{r80=r33}}while(0);if((r13|0)>0){r13=r13-1|0;r33=r80}else{break}}_free(HEAP32[r30]);r33=HEAP32[r27];if(r28){r81=r34;r82=r33}else{r83=r33;break}while(1){_free(HEAP32[r82+(r81<<2)>>2]);r33=HEAP32[r27];if((r81|0)>0){r81=r81-1|0;r82=r33}else{r83=r33;break L775}}}else{_free(HEAP32[r30]);r83=HEAP32[r27]}}while(0);_free(r83);r84=-1;STACKTOP=r6;return r84}}while(0);r83=(r1+140|0)>>2;HEAP32[r83]=r31;r27=(r1+6540|0)>>2;HEAP32[r27]=_calloc(4,r31);r30=(r1+6544|0)>>2;HEAP32[r30]=_calloc(4,HEAP32[r83]);r82=_fgetc(r2);r81=_fgetc(r2);r80=r81<<16&16711680|r82<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r82=r80<<1;r80=_ftell(r2);r81=0;r7=r82;r14=0;while(1){if((r7|0)>-1){r85=r81}else{_fgetc(r2);_fgetc(r2);r63=_fgetc(r2);r62=_fgetc(r2)&255|r63<<8&65280;r63=_fgetc(r2)&65535;r61=_fgetc(r2)&255|r63<<8;r63=_ftell(r2);if(r61<<16>>16==-2|r61<<16>>16==0){r86=r81+1|0}else if(r61<<16>>16==-1){_fseek(r2,20,1);r61=_fgetc(r2);r86=(_fgetc(r2)&255|r61<<8&65280)+r81|0}else{r86=r81}_fseek(r2,r63+r62|0,0);r85=r86}r62=r14+1|0;if((r62|0)==32){break}else{r81=r85;r7=r7<<1;r14=r62}}_fseek(r2,r80,0);r80=r1+144|0;HEAP32[r80>>2]=r85;r85=(r1+176|0)>>2;HEAP32[r85]=_calloc(764,HEAP32[r83]);r83=HEAP32[r80>>2];if((r83|0)!=0){HEAP32[r4+45]=_calloc(52,r83)}L803:do{if((r31|0)>0){r83=r10+10|0;r4=r10+12|0;r80=(r10+14|0)>>1;r14=(r10+16|0)>>1;r7=r10+18|0;r81=r10+19|0;r86=(r10+20|0)>>1;r62=r10+22|0;r63=r10+150|0;r61=(r1+180|0)>>2;r79=0;r60=r82;r71=0;L805:while(1){do{if((r60|0)>-1){r87=r79}else{_fgetc(r2);_fgetc(r2);r73=_fgetc(r2);r78=_fgetc(r2)&255|r73<<8&65280;r73=_fgetc(r2)&65535;r76=_fgetc(r2)&255|r73<<8;_strncpy(HEAP32[r85]+(r71*764&-1)|0,(r71*48&-1)+5245368|0,32);if(r76<<16>>16==-2){r73=_ftell(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r74=_fgetc(r2)&65535;HEAP16[r83>>1]=_fgetc(r2)&255|r74<<8;r74=_fgetc(r2)&65535;HEAP16[r4>>1]=_fgetc(r2)&255|r74<<8;r74=_fgetc(r2)&65535;r77=_fgetc(r2)&255|r74<<8;HEAP16[r80]=r77;r74=_fgetc(r2)&65535;HEAP16[r14]=_fgetc(r2)&255|r74<<8;HEAP8[r7]=_fgetc(r2)&255;HEAP8[r81]=_fgetc(r2)&255;r74=_fgetc(r2)&65535;HEAP16[r86]=_fgetc(r2)&255|r74<<8;_fread(r62,1,r77&65535,r2);_fread(r63,1,HEAPU16[r14],r2);r77=_fgetc(r2);r74=_fgetc(r2);_fseek(r2,(r74<<16&16711680|r77<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255)+r73|0,0);r73=_fgetc(r2);r77=_fgetc(r2);r74=r77<<16&16711680|r73<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;_fgetc(r2);_fgetc(r2);r73=_malloc(8);HEAP32[HEAP32[r85]+(r71*764&-1)+760>>2]=r73;if((HEAP32[HEAP32[r85]+(r71*764&-1)+760>>2]|0)==0){r84=-1;r5=595;break L805}r73=_calloc(64,1);HEAP32[HEAP32[r85]+(r71*764&-1)+756>>2]=r73;r73=HEAP32[r85];if((HEAP32[r73+(r71*764&-1)+756>>2]|0)==0){r84=-1;r5=596;break L805}HEAP32[r73+(r71*764&-1)+36>>2]=1;r73=HEAP16[r7>>1];HEAP32[HEAP32[HEAP32[r85]+(r71*764&-1)+760>>2]>>2]=r73&255;HEAP32[HEAP32[HEAP32[r85]+(r71*764&-1)+760>>2]+4>>2]=(r73&65535)>>>8&65535;HEAP32[HEAP32[HEAP32[r85]+(r71*764&-1)+756>>2]+8>>2]=128;HEAP32[HEAP32[HEAP32[r85]+(r71*764&-1)+756>>2]>>2]=HEAP32[(r71*48&-1)+5245408>>2];HEAP32[HEAP32[HEAP32[r85]+(r71*764&-1)+756>>2]+12>>2]=HEAP32[(r71*48&-1)+5245412>>2];HEAP32[HEAP32[HEAP32[r85]+(r71*764&-1)+756>>2]+40>>2]=r79;HEAP32[HEAP32[HEAP32[r85]+(r71*764&-1)+756>>2]+16>>2]=0;HEAP32[HEAP32[r61]+(r79*52&-1)+32>>2]=r74;HEAP32[HEAP32[r61]+(r79*52&-1)+36>>2]=HEAP32[(r71*48&-1)+5245400>>2];r74=(r71*48&-1)+5245404|0;HEAP32[HEAP32[r61]+(r79*52&-1)+40>>2]=HEAP32[r74>>2];HEAP32[HEAP32[r61]+(r79*52&-1)+44>>2]=(HEAP32[r74>>2]|0)>1?2:0;_load_sample(r2,0,HEAP32[r61]+(r79*52&-1)|0,0);r74=HEAPU16[r80];r73=_calloc(1,r74);HEAP32[HEAP32[r27]+(r71<<2)>>2]=r73;_memcpy(HEAP32[HEAP32[r27]+(r71<<2)>>2],r62,r74);r74=HEAPU16[r14];r73=_calloc(1,r74);HEAP32[HEAP32[r30]+(r71<<2)>>2]=r73;_memcpy(HEAP32[HEAP32[r30]+(r71<<2)>>2],r63,r74);r87=r79+1|0;break}else if(r76<<16>>16==-1){r74=_ftell(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r73=_fgetc(r2)&65535;HEAP16[r83>>1]=_fgetc(r2)&255|r73<<8;r73=_fgetc(r2)&65535;HEAP16[r4>>1]=_fgetc(r2)&255|r73<<8;r73=_fgetc(r2)&65535;r77=_fgetc(r2)&255|r73<<8;HEAP16[r80]=r77;r73=_fgetc(r2)&65535;HEAP16[r14]=_fgetc(r2)&255|r73<<8;HEAP8[r7]=_fgetc(r2)&255;HEAP8[r81]=_fgetc(r2)&255;r73=_fgetc(r2)&65535;HEAP16[r86]=_fgetc(r2)&255|r73<<8;_fread(r62,1,r77&65535,r2);_fread(r63,1,HEAPU16[r14],r2);if(HEAP16[r86]<<16>>16==0){r88=0}else{r77=0;while(1){r73=_fgetc(r2);r75=_fgetc(r2);HEAP32[r10+(r77<<2)+280>>2]=r75<<16&16711680|r73<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;r73=r77+1|0;r89=HEAP16[r86];if((r73|0)<(r89&65535|0)){r77=r73}else{break}}if(r89<<16>>16==-1){r87=r79;break}else{r88=r89}}r77=_malloc(8);HEAP32[HEAP32[r85]+(r71*764&-1)+760>>2]=r77;if((HEAP32[HEAP32[r85]+(r71*764&-1)+760>>2]|0)==0){r84=-1;r5=597;break L805}r77=r88&65535;r73=_calloc(64,r77);HEAP32[HEAP32[r85]+(r71*764&-1)+756>>2]=r73;r73=HEAP32[r85];if((HEAP32[r73+(r71*764&-1)+756>>2]|0)==0){r84=-1;r5=598;break L805}HEAP32[r73+(r71*764&-1)+36>>2]=r77;r73=HEAP16[r7>>1];HEAP32[HEAP32[HEAP32[r85]+(r71*764&-1)+760>>2]>>2]=r73&255;HEAP32[HEAP32[HEAP32[r85]+(r71*764&-1)+760>>2]+4>>2]=(r73&65535)>>>8&65535;if(r88<<16>>16==0){r90=r79}else{r73=(r71*48&-1)+5245408|0;r75=(r71*48&-1)+5245412|0;r72=r77>>>0>1?r77:1;r65=r79;r70=0;while(1){HEAP32[HEAP32[HEAP32[r85]+(r71*764&-1)+756>>2]+(r70<<6)+8>>2]=128;HEAP32[HEAP32[HEAP32[r85]+(r71*764&-1)+756>>2]+(r70<<6)>>2]=HEAP32[r73>>2];HEAP32[HEAP32[HEAP32[r85]+(r71*764&-1)+756>>2]+(r70<<6)+12>>2]=HEAP32[r75>>2]-24|0;HEAP32[HEAP32[HEAP32[r85]+(r71*764&-1)+756>>2]+(r70<<6)+40>>2]=r65;HEAP32[HEAP32[HEAP32[r85]+(r71*764&-1)+756>>2]+(r70<<6)+16>>2]=0;_fseek(r2,HEAP32[r10+(r70<<2)+280>>2]+r74|0,0);r66=_fgetc(r2);r68=(_fgetc(r2)&255|r66<<8&65280)<<1;HEAP32[HEAP32[r61]+(r65*52&-1)+32>>2]=r68;HEAP32[HEAP32[r61]+(r65*52&-1)+36>>2]=0;r68=HEAP32[r61];HEAP32[r68+(r65*52&-1)+40>>2]=HEAP32[r68+(r65*52&-1)+32>>2];HEAP32[HEAP32[r61]+(r65*52&-1)+44>>2]=2;_load_sample(r2,0,HEAP32[r61]+(r65*52&-1)|0,0);r68=r70+1|0;if((r68|0)<(r77|0)){r65=r65+1|0;r70=r68}else{break}}r90=r79+r72|0}r70=HEAPU16[r80];r65=_calloc(1,r70);HEAP32[HEAP32[r27]+(r71<<2)>>2]=r65;_memcpy(HEAP32[HEAP32[r27]+(r71<<2)>>2],r62,r70);r70=HEAPU16[r14];r65=_calloc(1,r70);HEAP32[HEAP32[r30]+(r71<<2)>>2]=r65;_memcpy(HEAP32[HEAP32[r30]+(r71<<2)>>2],r63,r70);_fseek(r2,r74+r78|0,0);r87=r90;break}else if(r76<<16>>16==0){r70=_calloc(64,1);HEAP32[HEAP32[r85]+(r71*764&-1)+756>>2]=r70;HEAP32[HEAP32[r85]+(r71*764&-1)+36>>2]=1;HEAP32[HEAP32[HEAP32[r85]+(r71*764&-1)+756>>2]>>2]=HEAP32[(r71*48&-1)+5245408>>2];HEAP32[HEAP32[HEAP32[r85]+(r71*764&-1)+756>>2]+8>>2]=128;HEAP32[HEAP32[HEAP32[r85]+(r71*764&-1)+756>>2]+12>>2]=HEAP32[(r71*48&-1)+5245412>>2];HEAP32[HEAP32[HEAP32[r85]+(r71*764&-1)+756>>2]+40>>2]=r79;HEAP32[HEAP32[r61]+(r79*52&-1)+32>>2]=r78;HEAP32[HEAP32[r61]+(r79*52&-1)+36>>2]=HEAP32[(r71*48&-1)+5245400>>2];r70=(r71*48&-1)+5245404|0;HEAP32[HEAP32[r61]+(r79*52&-1)+40>>2]=HEAP32[r70>>2];HEAP32[HEAP32[r61]+(r79*52&-1)+44>>2]=(HEAP32[r70>>2]|0)>1?2:0;_load_sample(r2,0,HEAP32[r61]+(HEAP32[HEAP32[HEAP32[r85]+(r71*764&-1)+756>>2]+40>>2]*52&-1)|0,0);r87=r79+1|0;break}else{_fseek(r2,r78,1);r87=r79;break}}}while(0);r70=r71+1|0;if((r70|0)<(r31|0)){r79=r87;r60=r60<<1;r71=r70}else{break L803}}if(r5==595){STACKTOP=r6;return r84}else if(r5==596){STACKTOP=r6;return r84}else if(r5==597){STACKTOP=r6;return r84}else if(r5==598){STACKTOP=r6;return r84}}}while(0);_fgetc(r2);_fgetc(r2);if((_feof(r2)|0)!=0){r84=0;STACKTOP=r6;return r84}r87=r8|0;while(1){r31=_fgetc(r2);r85=_fgetc(r2);r90=r85<<16&16711680|r31<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;if((r90|0)<0){r84=0;r5=600;break}r31=_fgetc(r2);r85=_fgetc(r2);r30=r85<<16&16711680|r31<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;if((r30|0)<0){r84=0;r5=601;break}r31=_ftell(r2);if((r90|0)==1296385110){_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2)}else if((r90|0)==1095650895){r90=(r30|0)<1023?r30:1023;_fread(r87,1,r90,r2);HEAP8[r8+r90|0]=0}_fseek(r2,r31+r30|0,0);if((_feof(r2)|0)!=0){r84=0;r5=602;break}}if(r5==600){STACKTOP=r6;return r84}else if(r5==601){STACKTOP=r6;return r84}else if(r5==602){STACKTOP=r6;return r84}}function _mfp_test(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r3=STACKTOP;STACKTOP=STACKTOP+448|0;r4=r3;r5=r3+64;L852:do{if(_fread(r5|0,1,384,r1)>>>0<384){r6=-1}else{if(HEAP8[r5+249|0]<<24>>24==127){r7=0}else{r6=-1;break}while(1){if((r7|0)>=31){break}r8=r7<<3;r9=HEAPU8[r5+r8|0]<<8|HEAPU8[r5+(r8|1)|0];if(r9<<16>>16<0){r6=-1;break L852}if(HEAPU8[r5+(r8|2)|0]>15){r6=-1;break L852}if(HEAPU8[r5+(r8|3)|0]>64){r6=-1;break L852}r10=HEAPU8[r5+(r8|4)|0]<<8|HEAPU8[r5+(r8|5)|0];if((r10&65535)>(r9&65535)){r6=-1;break L852}r11=HEAPU8[r5+(r8|6)|0]<<8|HEAPU8[r5+(r8|7)|0];if(((r10&65535)-1+(r11&65535)|0)>(r9&65535|0)){r6=-1;break L852}if(r9<<16>>16!=0&r11<<16>>16==0){r6=-1;break L852}else{r7=r7+1|0}}r11=HEAPU8[r5+378|0]<<8|HEAPU8[r5+379|0];if((HEAPU8[r5+248|0]|0)!=(r11&65535|0)){r6=-1;break}if(r11<<16>>16!=(HEAPU8[r5+380|0]<<8|HEAPU8[r5+381|0])<<16>>16){r6=-1;break}r11=r4|0;if((r2|0)==0){r6=0;break}HEAP8[r2]=0;_fread(r11,1,0,r1);HEAP8[r11]=0;HEAP8[r2]=0;_strncpy(r2,r11,0);if(HEAP8[r2]<<24>>24==0){r6=0;break}while(1){r11=r2+(_strlen(r2)-1)|0;if(HEAP8[r11]<<24>>24!=32){r6=0;break L852}HEAP8[r11]=0;if(HEAP8[r2]<<24>>24==0){r6=0;break L852}}}}while(0);STACKTOP=r3;return r6}function _mfp_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+7240|0;r6=r5;r7=r5+72;r8=r5+4168>>2;r9=r5+6216;_fseek(r2,r3,0);_set_type(r1,5264868,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r3=(r1+136|0)>>2;HEAP32[r3]=4;r10=r1+144|0;HEAP32[r10>>2]=31;r11=(r1+140|0)>>2;HEAP32[r11]=31;r12=(r1+176|0)>>2;HEAP32[r12]=_calloc(764,31);r13=HEAP32[r10>>2];if((r13|0)==0){r10=r1+180|0,r14=r10>>2}else{r15=r1+180|0;HEAP32[r15>>2]=_calloc(52,r13);r10=r15,r14=r10>>2}r10=0;while(1){r15=_calloc(64,1);HEAP32[HEAP32[r12]+(r10*764&-1)+756>>2]=r15;r15=_fgetc(r2);r13=(_fgetc(r2)&255|r15<<8&65280)<<1;HEAP32[HEAP32[r14]+(r10*52&-1)+32>>2]=r13;r13=(_fgetc(r2)&255)<<28>>24;HEAP32[HEAP32[HEAP32[r12]+(r10*764&-1)+756>>2]+16>>2]=r13;r13=_fgetc(r2)&255;HEAP32[HEAP32[HEAP32[r12]+(r10*764&-1)+756>>2]>>2]=r13;r13=_fgetc(r2);r15=(_fgetc(r2)&255|r13<<8&65280)<<1;HEAP32[HEAP32[r14]+(r10*52&-1)+36>>2]=r15;r15=_fgetc(r2)&65535;r13=_fgetc(r2)&255|r15<<8;r15=HEAP32[r14];HEAP32[r15+(r10*52&-1)+40>>2]=((r13&65535)<<1)+HEAP32[r15+(r10*52&-1)+36>>2]|0;HEAP32[HEAP32[r14]+(r10*52&-1)+44>>2]=(r13&65535)>1?2:0;HEAP32[HEAP32[HEAP32[r12]+(r10*764&-1)+756>>2]+8>>2]=128;HEAP32[HEAP32[HEAP32[r12]+(r10*764&-1)+756>>2]+40>>2]=r10;HEAP32[HEAP32[r12]+(r10*764&-1)+36>>2]=(HEAP32[HEAP32[r14]+(r10*52&-1)+32>>2]|0)!=0&1;HEAP32[HEAP32[r12]+(r10*764&-1)+40>>2]=4095;r13=r10+1|0;if((r13|0)==31){break}else{r10=r13}}r10=_fgetc(r2)&255;r13=(r1+128|0)>>2;HEAP32[r13]=r10;HEAP32[r1+156>>2]=r10;_fgetc(r2);r10=0;while(1){HEAP8[r1+(r10+952)|0]=_fgetc(r2)&255;r15=r10+1|0;if((r15|0)==128){break}else{r10=r15}}r10=Math.imul(HEAP32[r3],HEAP32[r13]);HEAP32[r1+132>>2]=r10;r15=(r1+172|0)>>2;HEAP32[r15]=_calloc(4,r10);r10=(r1+168|0)>>2;HEAP32[r10]=_calloc(4,HEAP32[r13]+1|0);r16=_fgetc(r2);r17=_fgetc(r2)&255|r16<<8&65280;_fgetc(r2);_fgetc(r2);L881:do{if((r17|0)!=0){r16=0;while(1){r18=_fgetc(r2);HEAP32[(r16<<4>>2)+r8]=_fgetc(r2)&255|r18<<8&65280;r18=_fgetc(r2);HEAP32[((r16<<4)+4>>2)+r8]=_fgetc(r2)&255|r18<<8&65280;r18=_fgetc(r2);HEAP32[((r16<<4)+8>>2)+r8]=_fgetc(r2)&255|r18<<8&65280;r18=_fgetc(r2);HEAP32[((r16<<4)+12>>2)+r8]=_fgetc(r2)&255|r18<<8&65280;r18=r16+1|0;if((r18|0)<(r17|0)){r16=r18}else{break L881}}}}while(0);r17=_ftell(r2);L885:do{if((HEAP32[r13]|0)>0){r16=r9|0;r18=0;while(1){r19=_calloc(1,(HEAP32[r3]<<2)+4|0);HEAP32[HEAP32[r10]+(r18<<2)>>2]=r19;HEAP32[HEAP32[HEAP32[r10]+(r18<<2)>>2]>>2]=64;r19=HEAP32[r3];L889:do{if((r19|0)>0){r20=0;r21=r19;while(1){r22=Math.imul(r21,r18)+r20|0;HEAP32[HEAP32[HEAP32[r10]+(r18<<2)>>2]+(r20<<2)+4>>2]=r22;r22=_calloc(HEAP32[HEAP32[HEAP32[r10]+(r18<<2)>>2]>>2]<<3|4,1);r23=Math.imul(HEAP32[r3],r18)+r20|0;HEAP32[HEAP32[r15]+(r23<<2)>>2]=r22;r22=HEAP32[HEAP32[HEAP32[r10]+(r18<<2)>>2]>>2];r23=Math.imul(HEAP32[r3],r18)+r20|0;HEAP32[HEAP32[HEAP32[r15]+(r23<<2)>>2]>>2]=r22;r22=r20+1|0;r23=HEAP32[r3];if((r22|0)<(r23|0)){r20=r22;r21=r23}else{r24=0;break L889}}}else{r24=0}}while(0);while(1){_fseek(r2,HEAP32[((r18<<4)+(r24<<2)>>2)+r8]+r17|0,0);_fread(r16,1,1024,r2);r19=0;r21=0;while(1){r20=HEAP8[r9+r19|0];r23=0;r22=r21;while(1){r25=0;r26=r22;while(1){r27=HEAP32[HEAP32[r15]+(HEAP32[HEAP32[HEAP32[r10]+(r18<<2)>>2]+(r24<<2)+4>>2]<<2)>>2];r28=(HEAPU8[r9+HEAPU8[r9+(r20&255)+r23|0]+r25|0]<<1)+r9|0;r29=HEAPU8[r28]|HEAPU8[r28+1|0]<<8|HEAPU8[r28+2|0]<<16|HEAPU8[r28+3|0]<<24|0;r28=r29&255;r30=r29>>>16&255;r31=r29>>>24&255;r32=r29<<8&3840|r29>>>8&255;if((r32|0)==0){r33=0}else{L902:do{if(r32>>>0<3628){r34=r32;r35=24;while(1){r36=r35+12|0;r37=r34<<1;if((r37|0)<3628){r34=r37;r35=r36}else{r38=r37;r39=r36;break L902}}}else{r38=r32;r39=24}}while(0);L906:do{if((r38|0)>3842){r32=r39;r35=5249472;while(1){r34=r35-32|0;r36=r32-1|0;r37=HEAP32[r34>>2];if((r38|0)>(r37|0)){r32=r36;r35=r34}else{r40=r36;r41=r34,r42=r41>>2;r43=r37;break L906}}}else{r40=r39;r41=5249472,r42=r41>>2;r43=3842}}while(0);do{if((r43|0)>(r38|0)){if((HEAP32[r42+1]|0)<=(r38|0)){r44=1;break}if((HEAP32[r42+2]|0)<=(r38|0)){r44=1;break}r44=(HEAP32[r42+3]|0)<=(r38|0)&1}else{r44=1}}while(0);r33=r40-r44&255}HEAP8[(r26<<3)+r27+4|0]=r33;HEAP8[(r26<<3)+r27+5|0]=r29>>>20&15|r28&-16;r35=r30&15;r32=(r26<<3)+r27+7|0;HEAP8[r32]=r35;HEAP8[(r26<<3)+r27+8|0]=r31;do{if(r31<<24>>24==0){r37=r35&255;if((r37|0)==6){HEAP8[r32]=4;break}else if((r37|0)==1|(r37|0)==2|(r37|0)==10){HEAP8[r32]=0;break}else if((r37|0)==5){HEAP8[r32]=3;break}else{break}}}while(0);r32=r25+1|0;if((r32|0)==4){break}else{r25=r32;r26=r26+1|0}}r26=r23+1|0;if((r26|0)==4){break}else{r23=r26;r22=r22+4|0}}r22=r19+1|0;if((r22|0)==4){break}else{r19=r22;r21=r21+16|0}}r21=r24+1|0;if((r21|0)==4){break}else{r24=r21}}r21=r18+1|0;if((r21|0)<(HEAP32[r13]|0)){r18=r21}else{break L885}}}}while(0);r13=(r1+1212|0)>>2;r24=HEAP32[r13];L928:do{if(_strlen(r24)>>>0<5){r4=657}else{if(HEAP8[r24+3|0]<<24>>24!=46){r4=657;break}HEAP8[r24]=115;HEAP8[HEAP32[r13]+1|0]=109;HEAP8[HEAP32[r13]+2|0]=112;r33=r7|0;r44=HEAP32[r13];_snprintf(r33,4096,5264756,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAP32[r1+1208>>2],HEAP32[tempInt+4>>2]=r44,tempInt));do{if((_stat(r33,r6)|0)<0){do{if((_strchr(HEAP32[r13],45)|0)!=0){r44=_strrchr(r33,45);if((r44|0)==0){break}HEAP8[r44]=HEAP8[5265176];HEAP8[r44+1|0]=HEAP8[5265177|0];HEAP8[r44+2|0]=HEAP8[5265178|0];HEAP8[r44+3|0]=HEAP8[5265179|0];HEAP8[r44+4|0]=HEAP8[5265180|0]}}while(0);if((_stat(r33,r6)|0)>=0){break}_fprintf(HEAP32[_stderr>>2],5264556,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r33,tempInt));break L928}}while(0);r44=_fopen(r33,5263292);if((r44|0)==0){_fprintf(HEAP32[_stderr>>2],5263376,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r33,tempInt));break}L942:do{if((HEAP32[r11]|0)>0){r40=0;while(1){_load_sample(r44,512,HEAP32[r14]+(HEAP32[HEAP32[HEAP32[r12]+(r40*764&-1)+756>>2]+40>>2]*52&-1)|0,0);r38=r40+1|0;if((r38|0)<(HEAP32[r11]|0)){r40=r38}else{break L942}}}}while(0);_fclose(r44);r33=r1+1276|0;HEAP32[r33>>2]=HEAP32[r33>>2]|8192;STACKTOP=r5;return 0}}while(0);if(r4==657){_fprintf(HEAP32[_stderr>>2],5267228,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r24,tempInt))}if((HEAP32[r11]|0)>0){r45=0}else{STACKTOP=r5;return 0}while(1){HEAP32[HEAP32[r12]+(r45*764&-1)+36>>2]=0;_memset(HEAP32[r14]+(r45*52&-1)|0,0,52);r24=r45+1|0;if((r24|0)<(HEAP32[r11]|0)){r45=r24}else{break}}STACKTOP=r5;return 0}function _mgt_test(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+64|0;r6=r5;r7=_fgetc(r1);if((_fgetc(r1)<<8&65280|r7<<16&16711680|_fgetc(r1)&255|0)!=5064532){r8=-1;STACKTOP=r5;return r8}_fgetc(r1);r7=_fgetc(r1);r9=_fgetc(r1);if((r9<<16&16711680|r7<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255|0)!=-1119009965){r8=-1;STACKTOP=r5;return r8}_fseek(r1,18,1);r7=_fgetc(r1);r9=_fgetc(r1);_fseek(r1,(r9<<16&16711680|r7<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255)+r3|0,0);r3=r6|0;if((r2|0)==0){r8=0;STACKTOP=r5;return r8}_memset(r2,0,33);_fread(r3,1,32,r1);HEAP8[r6+32|0]=0;_memset(r2,0,33);_strncpy(r2,r3,32);r3=HEAP8[r2];if(r3<<24>>24==0){r8=0;STACKTOP=r5;return r8}else{r10=0;r11=r2;r12=r3}while(1){do{if((_isprint(r12<<24>>24)|0)==0){r4=682}else{if(HEAP8[r11]<<24>>24<0){r4=682;break}else{break}}}while(0);if(r4==682){r4=0;HEAP8[r11]=46}r3=r10+1|0;r6=r2+r3|0;r1=HEAP8[r6];if(r1<<24>>24!=0&(r3|0)<32){r10=r3;r11=r6;r12=r1}else{break}}if(HEAP8[r2]<<24>>24==0){r8=0;STACKTOP=r5;return r8}while(1){r12=r2+(_strlen(r2)-1)|0;if(HEAP8[r12]<<24>>24!=32){r8=0;r4=691;break}HEAP8[r12]=0;if(HEAP8[r2]<<24>>24==0){r8=0;r4=692;break}}if(r4==691){STACKTOP=r5;return r8}else if(r4==692){STACKTOP=r5;return r8}}function _mgt_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27;r4=STACKTOP;STACKTOP=STACKTOP+256|0;r5=r4;_fseek(r2,r3,0);_fgetc(r2);_fgetc(r2);_fgetc(r2);r6=_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_set_type(r1,5267204,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r6>>>4&15,HEAP32[tempInt+4>>2]=r6&15,tempInt));r6=_fgetc(r2);r7=(r1+136|0)>>2;HEAP32[r7]=_fgetc(r2)&255|r6<<8&65280;_fgetc(r2);_fgetc(r2);r6=_fgetc(r2);r8=(r1+156|0)>>2;HEAP32[r8]=_fgetc(r2)&255|r6<<8&65280;r6=_fgetc(r2);r9=(r1+128|0)>>2;HEAP32[r9]=_fgetc(r2)&255|r6<<8&65280;r6=_fgetc(r2);r10=(r1+132|0)>>2;HEAP32[r10]=_fgetc(r2)&255|r6<<8&65280;r6=_fgetc(r2);r11=_fgetc(r2)&255|r6<<8&65280;r6=r1+144|0;HEAP32[r6>>2]=r11;r12=(r1+140|0)>>2;HEAP32[r12]=r11;_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r11=_fgetc(r2);r13=_fgetc(r2);r14=r13<<16&16711680|r11<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r11=_fgetc(r2);r13=_fgetc(r2);r15=r13<<16&16711680|r11<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;r11=_fgetc(r2);r13=_fgetc(r2);r16=r13<<16&16711680|r11<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;r11=_fgetc(r2);r13=_fgetc(r2);r17=r13<<16&16711680|r11<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fseek(r2,r14+r3|0,0);_fread(r1|0,1,32,r2);r14=_fgetc(r2);r11=_fgetc(r2);r13=r11<<16&16711680|r14<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;r14=_fgetc(r2);HEAP32[r8]=_fgetc(r2)&255|r14<<8&65280;r14=_fgetc(r2);HEAP32[r1+160>>2]=_fgetc(r2)&255|r14<<8&65280;HEAP32[r1+152>>2]=_fgetc(r2)&255;HEAP32[r1+148>>2]=_fgetc(r2)&255;_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);L984:do{if((HEAP32[r7]|0)>0){r14=0;while(1){_fgetc(r2);_fgetc(r2);r11=r14+1|0;if((r11|0)<(HEAP32[r7]|0)){r14=r11}else{break L984}}}}while(0);_fseek(r2,r13+r3|0,0);L988:do{if((HEAP32[r8]|0)>0){r13=0;while(1){_fgetc(r2);HEAP8[r1+(r13+952)|0]=_fgetc(r2)&255;r14=r13+1|0;if((r14|0)<(HEAP32[r8]|0)){r13=r14}else{break L988}}}}while(0);r8=(r1+176|0)>>2;HEAP32[r8]=_calloc(764,HEAP32[r12]);r13=HEAP32[r6>>2];if((r13|0)!=0){HEAP32[r1+180>>2]=_calloc(52,r13)}_fseek(r2,r15+r3|0,0);L995:do{if((HEAP32[r12]|0)>0){r15=(r1+180|0)>>2;r13=0;while(1){r6=_calloc(64,1);HEAP32[HEAP32[r8]+(r13*764&-1)+756>>2]=r6;_fread(HEAP32[r8]+(r13*764&-1)|0,1,32,r2);r6=_fgetc(r2);r14=_fgetc(r2);HEAP32[r5+(r13<<2)>>2]=r14<<16&16711680|r6<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;r6=_fgetc(r2);r14=_fgetc(r2);r11=r14<<16&16711680|r6<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;HEAP32[HEAP32[r15]+(r13*52&-1)+32>>2]=r11;r11=_fgetc(r2);r6=_fgetc(r2);r14=r6<<16&16711680|r11<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;HEAP32[HEAP32[r15]+(r13*52&-1)+36>>2]=r14;r14=HEAP32[HEAP32[r15]+(r13*52&-1)+36>>2];r11=_fgetc(r2);r6=_fgetc(r2);r18=(r6<<16&16711680|r11<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255)+r14|0;HEAP32[HEAP32[r15]+(r13*52&-1)+40>>2]=r18;_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r18=_fgetc(r2);r14=_fgetc(r2);r11=r14<<16&16711680|r18<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;r18=HEAP32[HEAP32[r8]+(r13*764&-1)+756>>2];r14=r18+12|0;r6=r18+16|0;if((r11|0)==0){HEAP32[r6>>2]=0;HEAP32[r14>>2]=0}else{r18=Math.log((r11|0)/8363)*1536/.6931471805599453&-1;HEAP32[r14>>2]=(r18|0)/128&-1;HEAP32[r6>>2]=(r18|0)%128}r18=_fgetc(r2);r6=(_fgetc(r2)&240|r18<<8&65280)>>>4;HEAP32[HEAP32[HEAP32[r8]+(r13*764&-1)+756>>2]>>2]=r6;_fgetc(r2);_fgetc(r2);HEAP32[HEAP32[HEAP32[r8]+(r13*764&-1)+756>>2]+8>>2]=128;r6=_fgetc(r2);HEAP32[HEAP32[r15]+(r13*52&-1)+44>>2]=(r6&3|0)!=0?2:0;r18=HEAP32[r15]+(r13*52&-1)+44|0;HEAP32[r18>>2]=HEAP32[r18>>2]|r6<<1&4;_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);HEAP32[HEAP32[r8]+(r13*764&-1)+36>>2]=(HEAP32[HEAP32[r15]+(r13*52&-1)+32>>2]|0)!=0&1;HEAP32[HEAP32[HEAP32[r8]+(r13*764&-1)+756>>2]+40>>2]=r13;r6=r13+1|0;if((r6|0)<(HEAP32[r12]|0)){r13=r6}else{break L995}}}}while(0);r13=(r1+172|0)>>2;HEAP32[r13]=_calloc(4,HEAP32[r10]);r15=(r1+168|0)>>2;HEAP32[r15]=_calloc(4,HEAP32[r9]+1|0);L1004:do{if((HEAP32[r10]|0)>1){r6=r17+r3|0;r18=1;while(1){_fseek(r2,(r18<<2)+r6|0,0);r14=_fgetc(r2);r11=_fgetc(r2);_fseek(r2,(r11<<16&16711680|r14<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255)+r3|0,0);r14=_fgetc(r2);r11=_fgetc(r2)&255|r14<<8&65280;r14=_calloc((r11<<3)+12|0,1);HEAP32[HEAP32[r13]+(r18<<2)>>2]=r14;HEAP32[HEAP32[HEAP32[r13]+(r18<<2)>>2]>>2]=r11;L1008:do{if((r11|0)!=0){r14=0;while(1){r19=_fgetc(r2);r20=(r19&3)+r14|0;r21=HEAP32[HEAP32[r13]+(r18<<2)>>2];r22=(r20<<3)+r21+4|0;if((r19&4|0)==0){r23=0}else{r23=_fgetc(r2)&255}if((r19&8|0)!=0){HEAP8[(r20<<3)+r21+5|0]=_fgetc(r2)&255}if((r19&16|0)!=0){HEAP8[(r20<<3)+r21+6|0]=_fgetc(r2)&255}if((r19&32|0)!=0){HEAP8[(r20<<3)+r21+7|0]=_fgetc(r2)&255}if((r19&64|0)!=0){HEAP8[(r20<<3)+r21+8|0]=_fgetc(r2)&255}if((r19&128|0)!=0){_fgetc(r2)}do{if((r23|0)==1){HEAP8[r22|0]=-127}else{if(r23>>>0<=11){break}HEAP8[r22|0]=r23+1&255}}while(0);r22=(r20<<3)+r21+7|0;r19=HEAP8[r22];do{if((r19&255)>=16){r24=r19&255;if((r24|0)==19|(r24|0)==20|(r24|0)==21|(r24|0)==23|(r24|0)==28|(r24|0)==29|(r24|0)==30){HEAP8[r22]=14;r24=(r20<<3)+r21+8|0;HEAP8[r24]=HEAP8[r24]&15|-32;break}else{HEAP8[(r20<<3)+r21+8|0]=0;HEAP8[r22]=0;break}}}while(0);r22=(r20<<3)+r21+6|0;r19=HEAP8[r22];do{if((r19-16&255)<65){r25=r19-15&255}else{r24=(r19&255)>>>4;if((r24|0)==11){HEAP8[(r20<<3)+r21+9|0]=4;HEAP8[(r20<<3)+r21+10|0]=r19+80&255;r25=0;break}else if((r24|0)==12){HEAP8[(r20<<3)+r21+9|0]=8;HEAP8[(r20<<3)+r21+10|0]=r19<<4|8;r25=0;break}else if((r24|0)==6){HEAP8[(r20<<3)+r21+9|0]=-92;HEAP8[(r20<<3)+r21+10|0]=r19-96&255;r25=0;break}else if((r24|0)==15){HEAP8[(r20<<3)+r21+9|0]=3;HEAP8[(r20<<3)+r21+10|0]=r19<<4;r25=0;break}else if((r24|0)==7){HEAP8[(r20<<3)+r21+9|0]=-92;HEAP8[(r20<<3)+r21+10|0]=r19<<4;r25=0;break}else if((r24|0)==8){HEAP8[(r20<<3)+r21+9|0]=14;HEAP8[(r20<<3)+r21+10|0]=r19|-80;r25=0;break}else if((r24|0)==13){HEAP8[(r20<<3)+r21+9|0]=25;HEAP8[(r20<<3)+r21+10|0]=r19<<4;r25=0;break}else if((r24|0)==14){HEAP8[(r20<<3)+r21+9|0]=25;HEAP8[(r20<<3)+r21+10|0]=r19+32&255;r25=0;break}else if((r24|0)==9){HEAP8[(r20<<3)+r21+9|0]=14;HEAP8[(r20<<3)+r21+10|0]=r19+112&255|-96;r25=0;break}else if((r24|0)==10){HEAP8[(r20<<3)+r21+9|0]=4;HEAP8[(r20<<3)+r21+10|0]=r19<<4;r25=0;break}else{r25=0;break}}}while(0);HEAP8[r22]=r25;r19=r20+1|0;if((r19|0)<(r11|0)){r14=r19}else{break L1008}}}}while(0);r11=r18+1|0;if((r11|0)<(HEAP32[r10]|0)){r18=r11}else{break L1004}}}}while(0);r10=_calloc(523,1);HEAP32[HEAP32[r13]>>2]=r10;HEAP32[HEAP32[HEAP32[r13]>>2]>>2]=64;_fseek(r2,r16+r3|0,0);L1057:do{if((HEAP32[r9]|0)>0){r16=0;r13=HEAP32[r7];while(1){r10=_calloc(1,(r13<<2)+4|0);HEAP32[HEAP32[r15]+(r16<<2)>>2]=r10;r10=_fgetc(r2);r25=_fgetc(r2)&255|r10<<8&65280;HEAP32[HEAP32[HEAP32[r15]+(r16<<2)>>2]>>2]=r25;r25=HEAP32[r7];L1061:do{if((r25|0)>0){r10=0;while(1){r23=_fgetc(r2);r17=(_fgetc(r2)&255|r23<<8&65280)-1|0;HEAP32[HEAP32[HEAP32[r15]+(r16<<2)>>2]+(r10<<2)+4>>2]=r17;r17=r10+1|0;r23=HEAP32[r7];if((r17|0)<(r23|0)){r10=r17}else{r26=r23;break L1061}}}else{r26=r25}}while(0);r25=r16+1|0;if((r25|0)<(HEAP32[r9]|0)){r16=r25;r13=r26}else{break L1057}}}}while(0);r26=HEAP32[r12];if((r26|0)<=0){STACKTOP=r4;return 0}r9=r1+180|0;r1=0;r7=r26;while(1){if((HEAP32[HEAP32[r8]+(r1*764&-1)+36>>2]|0)==0){r27=r7}else{_fseek(r2,HEAP32[r5+(r1<<2)>>2]+r3|0,0);_load_sample(r2,0,HEAP32[r9>>2]+(HEAP32[HEAP32[HEAP32[r8]+(r1*764&-1)+756>>2]+40>>2]*52&-1)|0,0);r27=HEAP32[r12]}r26=r1+1|0;if((r26|0)<(r27|0)){r1=r26;r7=r27}else{break}}STACKTOP=r4;return 0}function _mmd1_test(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+68|0;r6=r5;r7=r5+64|0;if(_fread(r7,1,4,r1)>>>0<4){r8=-1;STACKTOP=r5;return r8}do{if((_memcmp(r7,5264548,4)|0)!=0){if((_memcmp(r7,5264e3,4)|0)==0){break}else{r8=-1}STACKTOP=r5;return r8}}while(0);_fseek(r1,28,1);r7=_fgetc(r1);r9=_fgetc(r1);r10=r9<<16&16711680|r7<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255;if((r10|0)!=0){_fseek(r1,r10+(r3+44)|0,0);r10=_fgetc(r1);r7=_fgetc(r1);r9=r7<<16&16711680|r10<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255;r10=_fgetc(r1);r7=_fgetc(r1);r11=r7<<16&16711680|r10<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255;_fseek(r1,r9+r3|0,0);r3=r6|0;if((r2|0)==0){r8=0;STACKTOP=r5;return r8}r9=(r11|0)>63?63:r11;_memset(r2,0,r9+1|0);_fread(r3,1,r9,r1);HEAP8[r6+r9|0]=0;_copy_adjust(r2,r3,r9);r8=0;STACKTOP=r5;return r8}r9=r6|0;if((r2|0)==0){r8=0;STACKTOP=r5;return r8}HEAP8[r2]=0;_fread(r9,1,0,r1);HEAP8[r9]=0;HEAP8[r2]=0;_strncpy(r2,r9,0);if(HEAP8[r2]<<24>>24==0){r8=0;STACKTOP=r5;return r8}while(1){r9=r2+(_strlen(r2)-1)|0;if(HEAP8[r9]<<24>>24!=32){r8=0;r4=773;break}HEAP8[r9]=0;if(HEAP8[r2]<<24>>24==0){r8=0;r4=774;break}}if(r4==773){STACKTOP=r5;return r8}else if(r4==774){STACKTOP=r5;return r8}}function _mmd1_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64;r4=r1>>2;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+1416|0;r7=r6;r8=r6+52,r9=r8>>1;r10=r6+840;r11=r6+1376;_fseek(r2,r3,0);r12=r7;_fread(r12,4,1,r2);r13=HEAP8[r12+3|0]<<24>>24;r12=_fgetc(r2);r14=_fgetc(r2);HEAP32[r7+4>>2]=r14<<16&16711680|r12<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;r12=_fgetc(r2);r14=_fgetc(r2);r15=r14<<16&16711680|r12<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r12=_fgetc(r2);r14=_fgetc(r2);r16=_fgetc(r2);r17=_fgetc(r2);r18=r14<<16&16711680|r12<<24|r16<<8&65280;_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r16=_fgetc(r2);r12=_fgetc(r2);r14=_fgetc(r2);r19=_fgetc(r2);r20=r12<<16&16711680|r16<<24|r14<<8&65280;_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r14=_fgetc(r2);r16=_fgetc(r2);r12=_fgetc(r2);r21=_fgetc(r2);r22=r16<<16&16711680|r14<<24|r12<<8&65280;_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r12=_fgetc(r2)&65535;HEAP16[r7+40>>1]=_fgetc(r2)&255|r12<<8;r12=_fgetc(r2)&65535;HEAP16[r7+42>>1]=_fgetc(r2)&255|r12<<8;r12=_fgetc(r2)&65535;HEAP16[r7+44>>1]=_fgetc(r2)&255|r12<<8;r12=_fgetc(r2)&65535;HEAP16[r7+46>>1]=_fgetc(r2)&255|r12<<8;r12=_fgetc(r2)&65535;HEAP16[r7+48>>1]=_fgetc(r2)&255|r12<<8;HEAP8[r7+50|0]=_fgetc(r2)&255;HEAP8[r7+51|0]=_fgetc(r2)&255;_fseek(r2,r15+r3|0,0);r15=_fgetc(r2)&65535;r7=0;r12=_fgetc(r2)&255|r15<<8;while(1){HEAP16[(r7<<3>>1)+r9]=r12;r15=_fgetc(r2)&65535;HEAP16[((r7<<3)+2>>1)+r9]=_fgetc(r2)&255|r15<<8;HEAP8[(r7<<3)+r8+4|0]=_fgetc(r2)&255;HEAP8[(r7<<3)+r8+5|0]=_fgetc(r2)&255;HEAP8[(r7<<3)+r8+6|0]=_fgetc(r2)&255;HEAP8[(r7<<3)+r8+7|0]=_fgetc(r2)&255;r15=r7+1|0;r14=_fgetc(r2)&65535;r23=_fgetc(r2)&255|r14<<8;if((r15|0)==63){break}else{r7=r15;r12=r23}}r12=r13-48|0;r13=r18|r17&255;r17=r20|r19&255;r19=r22|r21&255;r21=r8+504|0;HEAP16[r21>>1]=r23;r23=_fgetc(r2)&65535;r22=r8+506|0;HEAP16[r22>>1]=_fgetc(r2)&255|r23<<8;r23=0;r20=_fgetc(r2);while(1){HEAP8[r8+(r23+508)|0]=r20&255;r18=r23+1|0;r24=_fgetc(r2);if((r18|0)==256){break}else{r23=r18;r20=r24}}r20=(r8+764|0)>>1;HEAP16[r20]=_fgetc(r2)&255|(r24&65535)<<8;r24=r8+766|0;HEAP8[r24]=_fgetc(r2)&255;r23=r8+767|0;HEAP8[r23]=_fgetc(r2)&255;r18=r8+768|0;HEAP8[r18]=_fgetc(r2)&255;HEAP8[r8+769|0]=_fgetc(r2)&255;HEAP8[r8+770|0]=_fgetc(r2)&255;HEAP8[r8+771|0]=_fgetc(r2)&255;HEAP8[r8+772|0]=_fgetc(r2)&255;HEAP8[r8+773|0]=_fgetc(r2)&255;HEAP8[r8+774|0]=_fgetc(r2)&255;HEAP8[r8+775|0]=_fgetc(r2)&255;HEAP8[r8+776|0]=_fgetc(r2)&255;HEAP8[r8+777|0]=_fgetc(r2)&255;HEAP8[r8+778|0]=_fgetc(r2)&255;HEAP8[r8+779|0]=_fgetc(r2)&255;HEAP8[r8+780|0]=_fgetc(r2)&255;HEAP8[r8+781|0]=_fgetc(r2)&255;HEAP8[r8+782|0]=_fgetc(r2)&255;HEAP8[r8+783|0]=_fgetc(r2)&255;HEAP8[r8+784|0]=_fgetc(r2)&255;HEAP8[r8+785|0]=_fgetc(r2)&255;HEAP8[r8+786|0]=_fgetc(r2)&255;r7=_fgetc(r2);HEAP8[r8+787|0]=r7&255;HEAP32[r4+315]=8363;r15=HEAP8[r23];r23=r1+1276|0;HEAP32[r23>>2]=((r15&32)<<24>>24!=0?0:64)|HEAP32[r23>>2];r23=r15&64;r15=HEAP16[r18>>1];r18=r15&65535;r14=r18&32;r16=(r18&31)+1|0;r18=r1+1252|0;HEAPF64[tempDoublePtr>>3]=2.64,HEAP32[r18>>2]=HEAP32[tempDoublePtr>>2],HEAP32[r18+4>>2]=HEAP32[tempDoublePtr+4>>2];HEAP32[r4+37]=(r15&65535)>>>8&65535;do{if((r23|0)==0){r15=HEAPU16[r20];if((r14|0)==0){r25=r15;break}r25=Math.imul(r15,r16)>>>4}else{r15=HEAP16[r20];r18=r15&65535;if(r15<<16>>16==0){r25=r18;break}r25=HEAP32[(((r15&65535)>10?9:r18-1|0)<<2)+5250180>>2]}}while(0);HEAP32[r4+38]=r25;r25=(r1+128|0)>>2;HEAP32[r25]=HEAPU16[r21>>1];r21=r7&255;r7=(r1+140|0)>>2;HEAP32[r7]=r21;r20=HEAPU16[r22>>1];HEAP32[r4+39]=r20;HEAP32[r4+40]=0;r22=(r1+136|0)>>2;HEAP32[r22]=0;_memcpy(r1+952|0,r8+508|0,r20);HEAP8[r1|0]=0;r20=(r1+144|0)>>2;HEAP32[r20]=0;L1114:do{if((r21|0)!=0){r18=r17+r3|0;r15=0;while(1){_fseek(r2,(r15<<2)+r18|0,0);r26=_fgetc(r2);r27=_fgetc(r2);r28=r27<<16&16711680|r26<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;do{if((r28|0)!=0){_fseek(r2,r28+r3|0,0);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r26=_fgetc(r2)&65535;if((_fgetc(r2)&255|r26<<8)<<16>>16==-1){_fseek(r2,14,1);r26=_fgetc(r2);HEAP32[r20]=(_fgetc(r2)&255|r26<<8&65280)+HEAP32[r20]|0;break}else{HEAP32[r20]=HEAP32[r20]+1|0;break}}}while(0);r28=r15+1|0;if((r28|0)<(HEAP32[r7]|0)){r15=r28}else{break L1114}}}}while(0);r21=(r19|0)!=0;if(r21){_fseek(r2,r19+r3|0,0);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r19=_fgetc(r2);r15=_fgetc(r2);r18=r15<<16&16711680|r19<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;r19=_fgetc(r2);r15=_fgetc(r2)&255;r28=r19<<8;r19=_fgetc(r2);r26=_fgetc(r2)&255;r27=r19<<8;_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r19=_fgetc(r2);r29=_fgetc(r2);r30=r29<<16&16711680|r19<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;r19=_fgetc(r2);r29=_fgetc(r2)&255;r31=r19<<8;r19=_fgetc(r2);r32=_fgetc(r2)&255;r33=r19<<8;_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r19=_fgetc(r2);r34=_fgetc(r2);r35=r34<<16&16711680|r19<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;r19=_fgetc(r2);r34=_fgetc(r2);r36=r34<<16&16711680|r19<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;_fseek(r2,r35+r3|0,0);L1127:do{if((r36|0)!=0){r35=(-r36|0)>>>0>4294967232?r36:64;r19=0;while(1){HEAP8[r1+r19|0]=_fgetc(r2)&255;r34=r19+1|0;if((r34|0)==(r35|0)){break L1127}else{r19=r34}}}}while(0);r37=r32|r33&65280;r38=r29|r31&65280;r39=r26|r27&65280;r40=r15|r28&65280;r41=r30;r42=r18}else{r37=0;r38=0;r39=0;r40=0;r41=0;r42=0}r18=HEAP32[r25];L1133:do{if((r18|0)>0){r30=r13+r3|0;r28=(r12|0)>0;r15=0;while(1){_fseek(r2,(r15<<2)+r30|0,0);r27=_fgetc(r2);r26=_fgetc(r2);r31=r26<<16&16711680|r27<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;do{if((r31|0)!=0){_fseek(r2,r31+r3|0,0);r27=_fgetc(r2);if(r28){r26=_fgetc(r2)&255|r27<<8;_fgetc(r2);_fgetc(r2);r43=r26}else{_fgetc(r2);r43=r27&255}r27=r43&65535;if((r27|0)<=(HEAP32[r22]|0)){break}HEAP32[r22]=r27}}while(0);r31=r15+1|0;r27=HEAP32[r25];if((r31|0)<(r27|0)){r15=r31}else{r44=r27;break L1133}}}else{r44=r18}}while(0);r18=HEAP32[r22];r43=r1+132|0;HEAP32[r43>>2]=Math.imul(r18,r44);if((r12|0)==0){r45=(r18|0)>4?5267184:5265984}else{r45=5265156}_set_type(r1,r45,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r45=(r1+172|0)>>2;HEAP32[r45]=_calloc(4,HEAP32[r43>>2]);r43=(r1+168|0)>>2;HEAP32[r43]=_calloc(4,HEAP32[r25]+1|0);L1149:do{if((HEAP32[r25]|0)>0){r18=r13+r3|0;r44=(r12|0)>0;r15=0;while(1){_fseek(r2,(r15<<2)+r18|0,0);r28=_fgetc(r2);r30=_fgetc(r2);r27=r30<<16&16711680|r28<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;L1153:do{if((r27|0)!=0){_fseek(r2,r27+r3|0,0);r28=_fgetc(r2)&65535;if(r44){r30=_fgetc(r2)&255|r28<<8;r31=_fgetc(r2);r26=_fgetc(r2)&255|r31<<8;_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r46=r26;r47=r30}else{r46=_fgetc(r2)&255;r47=r28&255}r28=_calloc(1,(HEAP32[r22]<<2)+4|0);HEAP32[HEAP32[r43]+(r15<<2)>>2]=r28;HEAP32[HEAP32[HEAP32[r43]+(r15<<2)>>2]>>2]=(r46&65535)+1|0;r28=HEAP32[r22];L1159:do{if((r28|0)>0){r30=0;r26=r28;while(1){r31=Math.imul(r26,r15)+r30|0;HEAP32[HEAP32[HEAP32[r43]+(r15<<2)>>2]+(r30<<2)+4>>2]=r31;r31=_calloc(HEAP32[HEAP32[HEAP32[r43]+(r15<<2)>>2]>>2]<<3|4,1);r29=Math.imul(HEAP32[r22],r15)+r30|0;HEAP32[HEAP32[r45]+(r29<<2)>>2]=r31;r31=HEAP32[HEAP32[HEAP32[r43]+(r15<<2)>>2]>>2];r29=Math.imul(HEAP32[r22],r15)+r30|0;HEAP32[HEAP32[HEAP32[r45]+(r29<<2)>>2]>>2]=r31;r31=r30+1|0;r29=HEAP32[r22];if((r31|0)<(r29|0)){r30=r31;r26=r29}else{break L1159}}}}while(0);r28=HEAP32[r43];r26=(HEAP32[HEAP32[r28+(r15<<2)>>2]>>2]|0)>0;if(!r44){if(!r26){break}r30=r47&65535;r29=r47<<16>>16==0;r31=0;r33=r28;while(1){if(r29){r48=r33}else{r32=0;while(1){r36=_fgetc(r2)&255;r19=_fgetc(r2)&255;r35=_fgetc(r2)&255;r34=HEAP32[HEAP32[r45]+(HEAP32[HEAP32[HEAP32[r43]+(r15<<2)>>2]+(r32<<2)+4>>2]<<2)>>2];r49=(r31<<3)+r34+4|0;r50=r36&63;HEAP8[r49|0]=r50<<24>>24==0?0:r50+48&255;HEAP8[(r31<<3)+r34+5|0]=(r19&255)>>>4|(r36&255)>>>3&16|(r36&255)>>>1&32;HEAP8[(r31<<3)+r34+7|0]=r19&15;HEAP8[(r31<<3)+r34+8|0]=r35;_mmd_xlat_fx(r49,r14,r16,r23);r49=r32+1|0;if((r49|0)<(r30|0)){r32=r49}else{break}}r48=HEAP32[r43]}r32=r31+1|0;if((r32|0)<(HEAP32[HEAP32[r48+(r15<<2)>>2]>>2]|0)){r31=r32;r33=r48}else{break L1153}}}if(!r26){break}r33=r47&65535;r31=r47<<16>>16==0;r30=0;r29=r28;while(1){if(r31){r51=r29}else{r32=0;while(1){r49=_fgetc(r2)&255;r35=_fgetc(r2)&255;r34=_fgetc(r2)&255;r19=_fgetc(r2)&255;r36=HEAP32[HEAP32[r45]+(HEAP32[HEAP32[HEAP32[r43]+(r15<<2)>>2]+(r32<<2)+4>>2]<<2)>>2];r50=(r30<<3)+r36+4|0;r52=r49&127;r49=r50|0;HEAP8[r49]=r52;if(r52<<24>>24!=0){HEAP8[r49]=(r52+48&255)+HEAP8[r24]&255}HEAP8[(r30<<3)+r36+5|0]=r35&63;HEAP8[(r30<<3)+r36+7|0]=r34;HEAP8[(r30<<3)+r36+8|0]=r19;_mmd_xlat_fx(r50,r14,r16,r23);r50=r32+1|0;if((r50|0)<(r33|0)){r32=r50}else{break}}r51=HEAP32[r43]}r32=r30+1|0;if((r32|0)<(HEAP32[HEAP32[r51+(r15<<2)>>2]>>2]|0)){r30=r32;r29=r51}else{break L1153}}}}while(0);r27=r15+1|0;if((r27|0)<(HEAP32[r25]|0)){r15=r27}else{break L1149}}}}while(0);r51=(r1+6540|0)>>2;HEAP32[r51]=_calloc(4,HEAP32[r7]);r23=(r1+6544|0)>>2;HEAP32[r23]=_calloc(4,HEAP32[r7]);r16=(r1+176|0)>>2;HEAP32[r16]=_calloc(764,HEAP32[r7]);r14=HEAP32[r20];if((r14|0)!=0){HEAP32[r4+45]=_calloc(52,r14)}L1190:do{if((HEAP32[r7]|0)>0){r14=r11|0;r20=r17+r3|0;r24=r10+6|0;r47=r10+10|0;r48=r10+12|0;r46=(r10+14|0)>>1;r12=(r10+16|0)>>1;r13=r10+18|0;r15=r10+19|0;r44=(r10+20|0)>>1;r18=r10+22|0;r27=r10+150|0;r29=(r1+180|0)>>2;r30=0;r33=0;L1192:while(1){_memset(r14,0,40);_fseek(r2,(r33<<2)+r20|0,0);r31=_fgetc(r2);r28=_fgetc(r2);r26=r28<<16&16711680|r31<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;do{if((r26|0)==0){r53=r30}else{r31=r26+r3|0;_fseek(r2,r31,0);r28=_fgetc(r2);r32=_fgetc(r2);r50=r32<<16&16711680|r28<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;r28=_fgetc(r2)&65535;r32=_fgetc(r2)&255|r28<<8;r28=_ftell(r2);do{if(r21){if((r33|0)<(r38|0)){_fseek(r2,Math.imul(r33,r37)+r41|0,0);_fread(r14,40,1,r2)}if((r33|0)>=(r40|0)){r54=0;break}_fseek(r2,Math.imul(r33,r39)+r42|0,0);_fgetc(r2);_fgetc(r2);_fgetc(r2);r54=_fgetc(r2)<<24>>24}else{r54=0}}while(0);_fseek(r2,r28,0);if(r32<<16>>16==-2){r19=_ftell(r2);HEAP8[r24]=_fgetc(r2)&255;_fseek(r2,3,1);r36=_fgetc(r2)&65535;HEAP16[r47>>1]=_fgetc(r2)&255|r36<<8;r36=_fgetc(r2)&65535;HEAP16[r48>>1]=_fgetc(r2)&255|r36<<8;r36=_fgetc(r2)&65535;HEAP16[r46]=_fgetc(r2)&255|r36<<8;r36=_fgetc(r2)&65535;HEAP16[r12]=_fgetc(r2)&255|r36<<8;HEAP8[r13]=_fgetc(r2)&255;HEAP8[r15]=_fgetc(r2)&255;r36=_fgetc(r2)&65535;HEAP16[r44]=_fgetc(r2)&255|r36<<8;_fread(r18,1,128,r2);_fread(r27,1,128,r2);r36=_fgetc(r2);r34=_fgetc(r2);_fseek(r2,r19-6+(r34<<16&16711680|r36<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255)|0,0);r36=_fgetc(r2);r34=_fgetc(r2);r19=r34<<16&16711680|r36<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;_fgetc(r2);_fgetc(r2);r36=_malloc(8);HEAP32[HEAP32[r16]+(r33*764&-1)+760>>2]=r36;if((HEAP32[HEAP32[r16]+(r33*764&-1)+760>>2]|0)==0){r55=-1;r5=876;break L1192}r36=_calloc(64,1);HEAP32[HEAP32[r16]+(r33*764&-1)+756>>2]=r36;r36=HEAP32[r16];if((HEAP32[r36+(r33*764&-1)+756>>2]|0)==0){r55=-1;r5=877;break L1192}HEAP32[r36+(r33*764&-1)+36>>2]=1;r36=HEAP16[r13>>1];HEAP32[HEAP32[HEAP32[r16]+(r33*764&-1)+760>>2]>>2]=r36&255;HEAP32[HEAP32[HEAP32[r16]+(r33*764&-1)+760>>2]+4>>2]=(r36&65535)>>>8&65535;HEAP32[HEAP32[HEAP32[r16]+(r33*764&-1)+756>>2]+8>>2]=128;HEAP32[HEAP32[HEAP32[r16]+(r33*764&-1)+756>>2]>>2]=HEAPU8[(r33<<3)+r8+6|0];HEAP32[HEAP32[HEAP32[r16]+(r33*764&-1)+756>>2]+12>>2]=HEAP8[(r33<<3)+r8+7|0]<<24>>24;HEAP32[HEAP32[HEAP32[r16]+(r33*764&-1)+756>>2]+40>>2]=r30;HEAP32[HEAP32[HEAP32[r16]+(r33*764&-1)+756>>2]+16>>2]=r54;HEAP32[HEAP32[r29]+(r30*52&-1)+32>>2]=r19;HEAP32[HEAP32[r29]+(r30*52&-1)+36>>2]=HEAPU16[(r33<<3>>1)+r9]<<1;r19=HEAP32[r29];r36=(r33<<3)+r8+2|0;HEAP32[r19+(r30*52&-1)+40>>2]=(HEAPU16[r36>>1]<<1)+HEAP32[r19+(r30*52&-1)+36>>2]|0;HEAP32[HEAP32[r29]+(r30*52&-1)+44>>2]=HEAPU16[r36>>1]>1?2:0;_load_sample(r2,0,HEAP32[r29]+(r30*52&-1)|0,0);r36=HEAPU16[r46];r19=_calloc(1,r36);HEAP32[HEAP32[r51]+(r33<<2)>>2]=r19;_memcpy(HEAP32[HEAP32[r51]+(r33<<2)>>2],r18,r36);r36=HEAPU16[r12];r19=_calloc(1,r36);HEAP32[HEAP32[r23]+(r33<<2)>>2]=r19;_memcpy(HEAP32[HEAP32[r23]+(r33<<2)>>2],r27,r36);r53=r30+1|0;break}else if(r32<<16>>16==0){r36=_calloc(64,1);HEAP32[HEAP32[r16]+(r33*764&-1)+756>>2]=r36;HEAP32[HEAP32[r16]+(r33*764&-1)+36>>2]=1;HEAP32[HEAP32[HEAP32[r16]+(r33*764&-1)+756>>2]>>2]=HEAPU8[(r33<<3)+r8+6|0];HEAP32[HEAP32[HEAP32[r16]+(r33*764&-1)+756>>2]+8>>2]=128;HEAP32[HEAP32[HEAP32[r16]+(r33*764&-1)+756>>2]+12>>2]=HEAP8[(r33<<3)+r8+7|0]<<24>>24;HEAP32[HEAP32[HEAP32[r16]+(r33*764&-1)+756>>2]+40>>2]=r30;HEAP32[HEAP32[HEAP32[r16]+(r33*764&-1)+756>>2]+16>>2]=r54<<4;HEAP32[HEAP32[r29]+(r30*52&-1)+32>>2]=r50;HEAP32[HEAP32[r29]+(r30*52&-1)+36>>2]=HEAPU16[(r33<<3>>1)+r9]<<1;r36=HEAP32[r29];r19=(r33<<3)+r8+2|0;HEAP32[r36+(r30*52&-1)+40>>2]=(HEAPU16[r19>>1]<<1)+HEAP32[r36+(r30*52&-1)+36>>2]|0;HEAP32[HEAP32[r29]+(r30*52&-1)+44>>2]=0;if(HEAPU16[r19>>1]>1){r19=HEAP32[r29]+(r30*52&-1)+44|0;HEAP32[r19>>2]=HEAP32[r19>>2]|2}_fseek(r2,r31+6|0,0);_load_sample(r2,0,HEAP32[r29]+(r30*52&-1)|0,0);r53=r30+1|0;break}else if(r32<<16>>16==-1){r19=_ftell(r2);HEAP8[r24]=_fgetc(r2)&255;_fseek(r2,3,1);r36=_fgetc(r2)&65535;HEAP16[r47>>1]=_fgetc(r2)&255|r36<<8;r36=_fgetc(r2)&65535;HEAP16[r48>>1]=_fgetc(r2)&255|r36<<8;r36=_fgetc(r2)&65535;HEAP16[r46]=_fgetc(r2)&255|r36<<8;r36=_fgetc(r2)&65535;HEAP16[r12]=_fgetc(r2)&255|r36<<8;HEAP8[r13]=_fgetc(r2)&255;HEAP8[r15]=_fgetc(r2)&255;r36=_fgetc(r2)&65535;HEAP16[r44]=_fgetc(r2)&255|r36<<8;_fread(r18,1,128,r2);_fread(r27,1,128,r2);r36=0;while(1){r34=_fgetc(r2);r35=_fgetc(r2);HEAP32[r10+(r36<<2)+280>>2]=r35<<16&16711680|r34<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;r34=r36+1|0;if((r34|0)==64){break}else{r36=r34}}r36=HEAP16[r44];if(r36<<16>>16==-1){r53=r30;break}r32=_malloc(8);HEAP32[HEAP32[r16]+(r33*764&-1)+760>>2]=r32;if((HEAP32[HEAP32[r16]+(r33*764&-1)+760>>2]|0)==0){r55=-1;r5=880;break L1192}r32=r36&65535;r31=_calloc(64,r32);HEAP32[HEAP32[r16]+(r33*764&-1)+756>>2]=r31;r31=HEAP32[r16];if((HEAP32[r31+(r33*764&-1)+756>>2]|0)==0){r55=-1;r5=881;break L1192}HEAP32[r31+(r33*764&-1)+36>>2]=r32;r31=HEAP16[r13>>1];HEAP32[HEAP32[HEAP32[r16]+(r33*764&-1)+760>>2]>>2]=r31&255;HEAP32[HEAP32[HEAP32[r16]+(r33*764&-1)+760>>2]+4>>2]=(r31&65535)>>>8&65535;L1218:do{if(r36<<16>>16==0){r56=r30}else{r31=(r33<<3)+r8+6|0;r50=(r33<<3)+r8+7|0;r28=r19-6|0;r34=r30;r35=0;while(1){HEAP32[HEAP32[HEAP32[r16]+(r33*764&-1)+756>>2]+(r35<<6)+8>>2]=128;HEAP32[HEAP32[HEAP32[r16]+(r33*764&-1)+756>>2]+(r35<<6)>>2]=HEAPU8[r31];HEAP32[HEAP32[HEAP32[r16]+(r33*764&-1)+756>>2]+(r35<<6)+12>>2]=(HEAP8[r50]<<24>>24)-24|0;HEAP32[HEAP32[HEAP32[r16]+(r33*764&-1)+756>>2]+(r35<<6)+40>>2]=r34;HEAP32[HEAP32[HEAP32[r16]+(r33*764&-1)+756>>2]+(r35<<6)+16>>2]=r54;_fseek(r2,r28+HEAP32[r10+(r35<<2)+280>>2]|0,0);r52=_fgetc(r2);r49=(_fgetc(r2)&255|r52<<8&65280)<<1;HEAP32[HEAP32[r29]+(r34*52&-1)+32>>2]=r49;HEAP32[HEAP32[r29]+(r34*52&-1)+36>>2]=0;r49=HEAP32[r29];HEAP32[r49+(r34*52&-1)+40>>2]=HEAP32[r49+(r34*52&-1)+32>>2];HEAP32[HEAP32[r29]+(r34*52&-1)+44>>2]=2;_load_sample(r2,0,HEAP32[r29]+(r34*52&-1)|0,0);r49=r34+1|0;r52=r35+1|0;if((r52|0)<(r32|0)){r34=r49;r35=r52}else{r56=r49;break L1218}}}}while(0);r32=HEAPU16[r46];r19=_calloc(1,r32);HEAP32[HEAP32[r51]+(r33<<2)>>2]=r19;_memcpy(HEAP32[HEAP32[r51]+(r33<<2)>>2],r18,r32);r32=HEAPU16[r12];r19=_calloc(1,r32);HEAP32[HEAP32[r23]+(r33<<2)>>2]=r19;_memcpy(HEAP32[HEAP32[r23]+(r33<<2)>>2],r27,r32);r53=r56;break}else{r53=r30;break}}}while(0);r26=r33+1|0;if((r26|0)<(HEAP32[r7]|0)){r30=r53;r33=r26}else{break L1190}}if(r5==881){STACKTOP=r6;return r55}else if(r5==876){STACKTOP=r6;return r55}else if(r5==877){STACKTOP=r6;return r55}else if(r5==880){STACKTOP=r6;return r55}}}while(0);r5=HEAP32[r25];L1230:do{if((r5|0)>0){r53=0;r7=HEAP32[r43];r56=r5;while(1){if((HEAP32[HEAP32[r7+(r53<<2)>>2]>>2]|0)>0){r51=0;r2=HEAP32[r22];r10=r7;while(1){L1238:do{if((r2|0)>0){r54=0;r16=r2;r9=r10;while(1){r42=HEAP32[HEAP32[r45]+(HEAP32[HEAP32[r9+(r53<<2)>>2]+(r54<<2)+4>>2]<<2)>>2];r39=(r51<<3)+r42+4|0;r40=HEAP8[r39];do{if(r40<<24>>24==0){r57=r16}else{r41=HEAP8[(r51<<3)+r42+5|0];if(r41<<24>>24==0){r57=r16;break}if((HEAP32[HEAP32[r23]+((r41&255)-1<<2)>>2]|0)==0&(r40&255)>84){r58=r40}else{r57=r16;break}while(1){r59=r58-12&255;if((r59&255)>84){r58=r59}else{break}}HEAP8[r39]=r59;r57=HEAP32[r22]}}while(0);r39=r54+1|0;r40=HEAP32[r43];if((r39|0)<(r57|0)){r54=r39;r16=r57;r9=r40}else{r60=r57;r61=r40;break L1238}}}else{r60=r2;r61=r10}}while(0);r9=r51+1|0;if((r9|0)<(HEAP32[HEAP32[r61+(r53<<2)>>2]>>2]|0)){r51=r9;r2=r60;r10=r61}else{break}}r62=r61;r63=HEAP32[r25]}else{r62=r7;r63=r56}r10=r53+1|0;if((r10|0)<(r63|0)){r53=r10;r7=r62;r56=r63}else{break L1230}}}}while(0);if((HEAP32[r22]|0)>0){r64=0}else{r55=0;STACKTOP=r6;return r55}while(1){HEAP32[((r64*12&-1)+188>>2)+r4]=HEAPU8[r8+(r64+770)|0];r63=r64+1|0;HEAP32[((r64*12&-1)+184>>2)+r4]=((r63|0)/2&-1|0)%2*255&-1;if((r63|0)<(HEAP32[r22]|0)){r64=r63}else{r55=0;break}}STACKTOP=r6;return r55}function _mmd3_test(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+68|0;r6=r5;r7=r5+64|0;if(_fread(r7,1,4,r1)>>>0<4){r8=-1;STACKTOP=r5;return r8}do{if((_memcmp(r7,5265148,4)|0)!=0){if((_memcmp(r7,5264540,4)|0)==0){break}else{r8=-1}STACKTOP=r5;return r8}}while(0);_fseek(r1,28,1);r7=_fgetc(r1);r9=_fgetc(r1);r10=r9<<16&16711680|r7<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255;if((r10|0)!=0){_fseek(r1,r10+(r3+44)|0,0);r10=_fgetc(r1);r7=_fgetc(r1);r9=r7<<16&16711680|r10<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255;r10=_fgetc(r1);r7=_fgetc(r1);r11=r7<<16&16711680|r10<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255;_fseek(r1,r9+r3|0,0);r3=r6|0;if((r2|0)==0){r8=0;STACKTOP=r5;return r8}r9=(r11|0)>63?63:r11;_memset(r2,0,r9+1|0);_fread(r3,1,r9,r1);HEAP8[r6+r9|0]=0;_copy_adjust(r2,r3,r9);r8=0;STACKTOP=r5;return r8}r9=r6|0;if((r2|0)==0){r8=0;STACKTOP=r5;return r8}HEAP8[r2]=0;_fread(r9,1,0,r1);HEAP8[r9]=0;HEAP8[r2]=0;_strncpy(r2,r9,0);if(HEAP8[r2]<<24>>24==0){r8=0;STACKTOP=r5;return r8}while(1){r9=r2+(_strlen(r2)-1)|0;if(HEAP8[r9]<<24>>24!=32){r8=0;r4=899;break}HEAP8[r9]=0;if(HEAP8[r2]<<24>>24==0){r8=0;r4=900;break}}if(r4==899){STACKTOP=r5;return r8}else if(r4==900){STACKTOP=r5;return r8}}function _mmd3_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63;r4=r1>>2;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+1416|0;r7=r6;r8=r6+52;r9=r6+840;r10=r6+1376;_fseek(r2,r3,0);r11=r7;_fread(r11,4,1,r2);r12=HEAP8[r11+3|0];r11=_fgetc(r2);r13=_fgetc(r2);HEAP32[r7+4>>2]=r13<<16&16711680|r11<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;r11=_fgetc(r2);r13=_fgetc(r2);r14=r13<<16&16711680|r11<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r11=_fgetc(r2);r13=_fgetc(r2);r15=_fgetc(r2);r16=_fgetc(r2);r17=r13<<16&16711680|r11<<24|r15<<8&65280;_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r15=_fgetc(r2);r11=_fgetc(r2);r13=_fgetc(r2);r18=_fgetc(r2);r19=r11<<16&16711680|r15<<24|r13<<8&65280;_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r13=_fgetc(r2);r15=_fgetc(r2);r11=_fgetc(r2);r20=_fgetc(r2);r21=r15<<16&16711680|r13<<24|r11<<8&65280;_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r11=_fgetc(r2)&65535;HEAP16[r7+40>>1]=_fgetc(r2)&255|r11<<8;r11=_fgetc(r2)&65535;HEAP16[r7+42>>1]=_fgetc(r2)&255|r11<<8;r11=_fgetc(r2)&65535;HEAP16[r7+44>>1]=_fgetc(r2)&255|r11<<8;r11=_fgetc(r2)&65535;HEAP16[r7+46>>1]=_fgetc(r2)&255|r11<<8;r11=_fgetc(r2)&65535;HEAP16[r7+48>>1]=_fgetc(r2)&255|r11<<8;HEAP8[r7+50|0]=_fgetc(r2)&255;HEAP8[r7+51|0]=_fgetc(r2)&255;_fseek(r2,r14+r3|0,0);r14=_fgetc(r2)&65535;r7=0;r11=_fgetc(r2)&255|r14<<8;while(1){HEAP16[r8+(r7<<3)>>1]=r11;r14=_fgetc(r2)&65535;HEAP16[r8+(r7<<3)+2>>1]=_fgetc(r2)&255|r14<<8;HEAP8[(r7<<3)+r8+4|0]=_fgetc(r2)&255;HEAP8[(r7<<3)+r8+5|0]=_fgetc(r2)&255;HEAP8[(r7<<3)+r8+6|0]=_fgetc(r2)&255;HEAP8[(r7<<3)+r8+7|0]=_fgetc(r2)&255;r14=r7+1|0;r13=_fgetc(r2)&65535;r22=_fgetc(r2)&255|r13<<8;if((r14|0)==63){break}else{r7=r14;r11=r22}}r11=r12<<24>>24;r7=r17|r16&255;r16=r19|r18&255;r18=r21|r20&255;r20=r8+504|0;HEAP16[r20>>1]=r22;r22=_fgetc(r2)&65535;HEAP16[r8+506>>1]=_fgetc(r2)&255|r22<<8;r22=_fgetc(r2);r21=_fgetc(r2);r19=_fgetc(r2);r17=_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r14=_fgetc(r2);r13=_fgetc(r2);r15=_fgetc(r2);r23=_fgetc(r2);r24=_fgetc(r2)&65535;HEAP16[r8+520>>1]=_fgetc(r2)&255|r24<<8;r24=_fgetc(r2)&65535;HEAP16[r8+522>>1]=_fgetc(r2)&255|r24<<8;r24=_fgetc(r2);r25=_fgetc(r2);r26=_fgetc(r2);r27=_fgetc(r2);r28=_fgetc(r2);r29=_fgetc(r2);HEAP32[r8+528>>2]=r29<<16&16711680|r28<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;r28=_fgetc(r2)&65535;HEAP16[r8+532>>1]=_fgetc(r2)&255|r28<<8;r28=_fgetc(r2)&65535;HEAP16[r8+534>>1]=_fgetc(r2)&255|r28<<8;HEAP8[r8+536|0]=_fgetc(r2)&255;HEAP8[r8+537|0]=_fgetc(r2)&255;r28=_fgetc(r2)&65535;HEAP16[r8+538>>1]=_fgetc(r2)&255|r28<<8;HEAP8[r8+540|0]=_fgetc(r2)&255;_fseek(r2,223,1);r28=_fgetc(r2)&65535;r29=(r8+764|0)>>1;HEAP16[r29]=_fgetc(r2)&255|r28<<8;r28=r8+766|0;HEAP8[r28]=_fgetc(r2)&255;r30=r8+767|0;HEAP8[r30]=_fgetc(r2)&255;r31=r8+768|0;HEAP8[r31]=_fgetc(r2)&255;HEAP8[r8+769|0]=_fgetc(r2)&255;_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r32=r13<<16&16711680|r14<<24|r15<<8&65280|r23&255;r23=r25<<16&16711680|r24<<24|r26<<8&65280|r27&255;HEAP8[r8+786|0]=_fgetc(r2)&255;r27=r8+787|0;HEAP8[r27]=_fgetc(r2)&255;_fseek(r2,(r21<<16&16711680|r22<<24|r19<<8&65280|r17&255)+r3|0,0);r17=_fgetc(r2);r19=_fgetc(r2);_fseek(r2,(r19<<16&16711680|r17<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255)+r3|0,0);_fseek(r2,32,1);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r17=_fgetc(r2);r19=_fgetc(r2)&255|r17<<8&65280;r17=r1+156|0;HEAP32[r17>>2]=r19;L1287:do{if((r19|0)!=0){r22=0;while(1){_fgetc(r2);HEAP8[r1+(r22+952)|0]=_fgetc(r2)&255;r21=r22+1|0;if((r21|0)<(HEAP32[r17>>2]|0)){r22=r21}else{break L1287}}}}while(0);HEAP32[r4+315]=8363;r17=HEAP8[r30];r30=r1+1276|0;HEAP32[r30>>2]=((r17&32)<<24>>24!=0?0:64)|HEAP32[r30>>2];r30=r17&64;r17=HEAP16[r31>>1];r31=r17&65535;r19=r31&32;r22=(r31&31)+1|0;r31=r1+1252|0;HEAPF64[tempDoublePtr>>3]=2.64,HEAP32[r31>>2]=HEAP32[tempDoublePtr>>2],HEAP32[r31+4>>2]=HEAP32[tempDoublePtr+4>>2];HEAP32[r4+37]=(r17&65535)>>>8&65535;do{if((r30|0)==0){r17=HEAPU16[r29];if((r19|0)==0){r33=r17;break}r33=Math.imul(r17,r22)>>>4}else{r17=HEAP16[r29];r31=r17&65535;if(r17<<16>>16==0){r33=r31;break}r33=HEAP32[(((r17&65535)>10?9:r31-1|0)<<2)+5250180>>2]}}while(0);HEAP32[r4+38]=r33;r33=(r1+128|0)>>2;HEAP32[r33]=HEAPU16[r20>>1];r20=HEAP8[r27];r27=(r1+140|0)>>2;HEAP32[r27]=r20&255;HEAP32[r4+40]=0;r29=(r1+136|0)>>2;HEAP32[r29]=0;HEAP8[r1|0]=0;r31=(r1+144|0)>>2;HEAP32[r31]=0;L1297:do{if(r20<<24>>24!=0){r17=r16+r3|0;r21=0;while(1){_fseek(r2,(r21<<2)+r17|0,0);r26=_fgetc(r2);r24=_fgetc(r2);r25=r24<<16&16711680|r26<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;do{if((r25|0)!=0){_fseek(r2,r25+r3|0,0);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r26=_fgetc(r2)&65535;if((_fgetc(r2)&255|r26<<8)<<16>>16==-1){_fseek(r2,14,1);r26=_fgetc(r2);HEAP32[r31]=(_fgetc(r2)&255|r26<<8&65280)+HEAP32[r31]|0;break}else{HEAP32[r31]=HEAP32[r31]+1|0;break}}}while(0);r25=r21+1|0;if((r25|0)<(HEAP32[r27]|0)){r21=r25}else{break L1297}}}}while(0);r20=(r18|0)!=0;if(r20){_fseek(r2,r18+r3|0,0);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r18=_fgetc(r2);r21=_fgetc(r2);r17=r21<<16&16711680|r18<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;r18=_fgetc(r2);r21=_fgetc(r2)&255;r25=r18<<8;r18=_fgetc(r2)&65535;r26=_fgetc(r2)&255|r18<<8;_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r18=_fgetc(r2);r24=_fgetc(r2);r15=r24<<16&16711680|r18<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;r18=_fgetc(r2);r24=_fgetc(r2)&255;r14=r18<<8;r18=_fgetc(r2);r13=_fgetc(r2)&255;r34=r18<<8;_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r18=_fgetc(r2);r35=_fgetc(r2);r36=r35<<16&16711680|r18<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;r18=_fgetc(r2);r35=_fgetc(r2);r37=r35<<16&16711680|r18<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;_fseek(r2,r36+r3|0,0);L1310:do{if((r37|0)!=0){r36=(-r37|0)>>>0>4294967232?r37:64;r18=0;while(1){HEAP8[r1+r18|0]=_fgetc(r2)&255;r35=r18+1|0;if((r35|0)==(r36|0)){break L1310}else{r18=r35}}}}while(0);r38=r13|r34&65280;r39=r24|r14&65280;r40=r26;r41=r21|r25&65280;r42=r17;r43=r15}else{r38=0;r39=0;r40=0;r41=0;r42=0;r43=0}r15=HEAP32[r33];L1316:do{if((r15|0)>0){r17=r7+r3|0;r25=0;while(1){_fseek(r2,(r25<<2)+r17|0,0);r21=_fgetc(r2);r26=_fgetc(r2);r14=r26<<16&16711680|r21<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;do{if((r14|0)!=0){_fseek(r2,r14+r3|0,0);r21=_fgetc(r2);r26=_fgetc(r2)&255;_fgetc(r2);_fgetc(r2);r24=r26|r21<<8&65280;if((r24|0)<=(HEAP32[r29]|0)){break}HEAP32[r29]=r24}}while(0);r14=r25+1|0;r24=HEAP32[r33];if((r14|0)<(r24|0)){r25=r14}else{r44=r24;break L1316}}}else{r44=r15}}while(0);r15=r1+132|0;HEAP32[r15>>2]=Math.imul(HEAP32[r29],r44);if(r12<<24>>24==50){_set_type(r1,5267168,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt))}else{_set_type(r1,5265956,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r11,tempInt))}r11=(r1+172|0)>>2;HEAP32[r11]=_calloc(4,HEAP32[r15>>2]);r15=(r1+168|0)>>2;HEAP32[r15]=_calloc(4,HEAP32[r33]+1|0);L1329:do{if((HEAP32[r33]|0)>0){r12=r7+r3|0;r44=0;while(1){_fseek(r2,(r44<<2)+r12|0,0);r25=_fgetc(r2);r17=_fgetc(r2);r24=r17<<16&16711680|r25<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;L1333:do{if((r24|0)!=0){_fseek(r2,r24+r3|0,0);r25=_fgetc(r2);r17=_fgetc(r2)&255;r14=r25<<8;r25=_fgetc(r2);r21=_fgetc(r2)&255;_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r26=_calloc(1,(HEAP32[r29]<<2)+4|0);HEAP32[HEAP32[r15]+(r44<<2)>>2]=r26;HEAP32[HEAP32[HEAP32[r15]+(r44<<2)>>2]>>2]=(r21|r25<<8&65280)+1|0;r25=HEAP32[r29];L1335:do{if((r25|0)>0){r21=0;r26=r25;while(1){r34=Math.imul(r26,r44)+r21|0;HEAP32[HEAP32[HEAP32[r15]+(r44<<2)>>2]+(r21<<2)+4>>2]=r34;r34=_calloc(HEAP32[HEAP32[HEAP32[r15]+(r44<<2)>>2]>>2]<<3|4,1);r13=Math.imul(HEAP32[r29],r44)+r21|0;HEAP32[HEAP32[r11]+(r13<<2)>>2]=r34;r34=HEAP32[HEAP32[HEAP32[r15]+(r44<<2)>>2]>>2];r13=Math.imul(HEAP32[r29],r44)+r21|0;HEAP32[HEAP32[HEAP32[r11]+(r13<<2)>>2]>>2]=r34;r34=r21+1|0;r13=HEAP32[r29];if((r34|0)<(r13|0)){r21=r34;r26=r13}else{break L1335}}}}while(0);r25=HEAP32[r15];if((HEAP32[HEAP32[r25+(r44<<2)>>2]>>2]|0)<=0){break}r26=r17|r14&65280;r21=(r26|0)==0;r13=0;r34=r25;while(1){if(r21){r45=r34}else{r25=0;while(1){r37=_fgetc(r2)&255;r18=_fgetc(r2)&255;r36=_fgetc(r2)&255;r35=_fgetc(r2)&255;r46=HEAP32[HEAP32[r11]+(HEAP32[HEAP32[HEAP32[r15]+(r44<<2)>>2]+(r25<<2)+4>>2]<<2)>>2];r47=(r13<<3)+r46+4|0;r48=r37&127;r37=r47|0;HEAP8[r37]=r48;if(r48<<24>>24!=0){HEAP8[r37]=(r48+24&255)+HEAP8[r28]&255}HEAP8[(r13<<3)+r46+5|0]=r18&63;HEAP8[(r13<<3)+r46+7|0]=r36;HEAP8[(r13<<3)+r46+8|0]=r35;_mmd_xlat_fx(r47,r19,r22,r30);r47=r25+1|0;if((r47|0)<(r26|0)){r25=r47}else{break}}r45=HEAP32[r15]}r25=r13+1|0;if((r25|0)<(HEAP32[HEAP32[r45+(r44<<2)>>2]>>2]|0)){r13=r25;r34=r45}else{break L1333}}}}while(0);r24=r44+1|0;if((r24|0)<(HEAP32[r33]|0)){r44=r24}else{break L1329}}}}while(0);r33=(r1+6540|0)>>2;HEAP32[r33]=_calloc(4,HEAP32[r27]);r45=(r1+6544|0)>>2;HEAP32[r45]=_calloc(4,HEAP32[r27]);r15=(r1+176|0)>>2;HEAP32[r15]=_calloc(764,HEAP32[r27]);r30=HEAP32[r31];if((r30|0)!=0){HEAP32[r4+45]=_calloc(52,r30)}L1355:do{if((HEAP32[r27]|0)>0){r30=r10|0;r31=r16+r3|0;r22=r40&65535;r19=(r40&65535)>4;r28=(r1+180|0)>>2;r11=r9+6|0;r7=r9+10|0;r44=r9+12|0;r12=(r9+14|0)>>1;r24=(r9+16|0)>>1;r34=r9+18|0;r13=r9+19|0;r26=(r9+20|0)>>1;r21=r9+22|0;r14=r9+150|0;r17=0;r25=0;L1357:while(1){_memset(r30,0,40);_fseek(r2,(r25<<2)+r31|0,0);r47=_fgetc(r2);r35=_fgetc(r2);r46=r35<<16&16711680|r47<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;do{if((r46|0)==0){r49=r17}else{r47=r46+r3|0;_fseek(r2,r47,0);r35=_fgetc(r2);r36=_fgetc(r2);r18=r36<<16&16711680|r35<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;r35=_fgetc(r2)&65535;r36=_fgetc(r2)&255|r35<<8;r35=_ftell(r2);do{if(r20){if((r25|0)<(r39|0)){_fseek(r2,Math.imul(r25,r38)+r43|0,0);_fread(r30,40,1,r2)}if((r25|0)>=(r41|0)){r50=0;break}_fseek(r2,Math.imul(r25,r22)+r42|0,0);_fgetc(r2);_fgetc(r2);_fgetc(r2);r48=_fgetc(r2)&255;if(!r19){r50=r48;break}_fgetc(r2);_fgetc(r2);r50=r48}else{r50=0}}while(0);_fseek(r2,r35,0);r48=r36<<16>>16;if(r36<<16>>16==-2){r37=_ftell(r2);HEAP8[r11]=_fgetc(r2)&255;_fseek(r2,3,1);r51=_fgetc(r2)&65535;HEAP16[r7>>1]=_fgetc(r2)&255|r51<<8;r51=_fgetc(r2)&65535;HEAP16[r44>>1]=_fgetc(r2)&255|r51<<8;r51=_fgetc(r2)&65535;HEAP16[r12]=_fgetc(r2)&255|r51<<8;r51=_fgetc(r2)&65535;HEAP16[r24]=_fgetc(r2)&255|r51<<8;HEAP8[r34]=_fgetc(r2)&255;HEAP8[r13]=_fgetc(r2)&255;r51=_fgetc(r2)&65535;HEAP16[r26]=_fgetc(r2)&255|r51<<8;_fread(r21,1,128,r2);_fread(r14,1,128,r2);r51=_fgetc(r2);r52=_fgetc(r2);_fseek(r2,r37-6+(r52<<16&16711680|r51<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255)|0,0);r51=_fgetc(r2);r52=_fgetc(r2);r37=r52<<16&16711680|r51<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;_fgetc(r2);_fgetc(r2);r51=_malloc(8);HEAP32[HEAP32[r15]+(r25*764&-1)+760>>2]=r51;if((HEAP32[HEAP32[r15]+(r25*764&-1)+760>>2]|0)==0){r53=-1;r5=984;break L1357}r51=_calloc(64,1);HEAP32[HEAP32[r15]+(r25*764&-1)+756>>2]=r51;r51=HEAP32[r15];if((HEAP32[r51+(r25*764&-1)+756>>2]|0)==0){r53=-1;r5=985;break L1357}HEAP32[r51+(r25*764&-1)+36>>2]=1;r51=HEAP16[r34>>1];HEAP32[HEAP32[HEAP32[r15]+(r25*764&-1)+760>>2]>>2]=r51&255;HEAP32[HEAP32[HEAP32[r15]+(r25*764&-1)+760>>2]+4>>2]=(r51&65535)>>>8&65535;HEAP32[HEAP32[HEAP32[r15]+(r25*764&-1)+756>>2]+8>>2]=128;HEAP32[HEAP32[HEAP32[r15]+(r25*764&-1)+756>>2]>>2]=HEAPU8[(r25<<3)+r8+6|0];HEAP32[HEAP32[HEAP32[r15]+(r25*764&-1)+756>>2]+12>>2]=HEAP8[(r25<<3)+r8+7|0]<<24>>24;HEAP32[HEAP32[HEAP32[r15]+(r25*764&-1)+756>>2]+40>>2]=r17;HEAP32[HEAP32[HEAP32[r15]+(r25*764&-1)+756>>2]+16>>2]=r50<<24>>24;HEAP32[HEAP32[r28]+(r17*52&-1)+32>>2]=r37;HEAP32[HEAP32[r28]+(r17*52&-1)+36>>2]=HEAPU16[r8+(r25<<3)>>1]<<1;r37=HEAP32[r28];r51=(r25<<3)+r8+2|0;HEAP32[r37+(r17*52&-1)+40>>2]=(HEAPU16[r51>>1]<<1)+HEAP32[r37+(r17*52&-1)+36>>2]|0;HEAP32[HEAP32[r28]+(r17*52&-1)+44>>2]=HEAPU16[r51>>1]>1?2:0;_load_sample(r2,0,HEAP32[r28]+(r17*52&-1)|0,0);r51=HEAPU16[r12];r37=_calloc(1,r51);HEAP32[HEAP32[r33]+(r25<<2)>>2]=r37;_memcpy(HEAP32[HEAP32[r33]+(r25<<2)>>2],r21,r51);r51=HEAPU16[r24];r37=_calloc(1,r51);HEAP32[HEAP32[r45]+(r25<<2)>>2]=r37;_memcpy(HEAP32[HEAP32[r45]+(r25<<2)>>2],r14,r51);r49=r17+1|0;break}else if(r36<<16>>16==-1){r51=_ftell(r2);HEAP8[r11]=_fgetc(r2)&255;_fseek(r2,3,1);r37=_fgetc(r2)&65535;HEAP16[r7>>1]=_fgetc(r2)&255|r37<<8;r37=_fgetc(r2)&65535;HEAP16[r44>>1]=_fgetc(r2)&255|r37<<8;r37=_fgetc(r2)&65535;HEAP16[r12]=_fgetc(r2)&255|r37<<8;r37=_fgetc(r2)&65535;HEAP16[r24]=_fgetc(r2)&255|r37<<8;HEAP8[r34]=_fgetc(r2)&255;HEAP8[r13]=_fgetc(r2)&255;r37=_fgetc(r2)&65535;HEAP16[r26]=_fgetc(r2)&255|r37<<8;_fread(r21,1,128,r2);_fread(r14,1,128,r2);r37=0;while(1){r52=_fgetc(r2);r54=_fgetc(r2);HEAP32[r9+(r37<<2)+280>>2]=r54<<16&16711680|r52<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;r52=r37+1|0;if((r52|0)==64){break}else{r37=r52}}r37=HEAP16[r26];if(r37<<16>>16==-1){r49=r17;break}r36=_malloc(8);HEAP32[HEAP32[r15]+(r25*764&-1)+760>>2]=r36;if((HEAP32[HEAP32[r15]+(r25*764&-1)+760>>2]|0)==0){r53=-1;r5=986;break L1357}r36=r37&65535;r35=_calloc(64,r36);HEAP32[HEAP32[r15]+(r25*764&-1)+756>>2]=r35;r35=HEAP32[r15];if((HEAP32[r35+(r25*764&-1)+756>>2]|0)==0){r53=-1;r5=987;break L1357}HEAP32[r35+(r25*764&-1)+36>>2]=r36;r35=HEAP16[r34>>1];HEAP32[HEAP32[HEAP32[r15]+(r25*764&-1)+760>>2]>>2]=r35&255;HEAP32[HEAP32[HEAP32[r15]+(r25*764&-1)+760>>2]+4>>2]=(r35&65535)>>>8&65535;L1380:do{if(r37<<16>>16==0){r55=r17}else{r35=(r25<<3)+r8+6|0;r52=(r25<<3)+r8+7|0;r54=r50<<24>>24;r56=r51-6|0;r57=r17;r58=0;while(1){HEAP32[HEAP32[HEAP32[r15]+(r25*764&-1)+756>>2]+(r58<<6)+8>>2]=128;HEAP32[HEAP32[HEAP32[r15]+(r25*764&-1)+756>>2]+(r58<<6)>>2]=HEAPU8[r35];HEAP32[HEAP32[HEAP32[r15]+(r25*764&-1)+756>>2]+(r58<<6)+12>>2]=(HEAP8[r52]<<24>>24)-24|0;HEAP32[HEAP32[HEAP32[r15]+(r25*764&-1)+756>>2]+(r58<<6)+40>>2]=r57;HEAP32[HEAP32[HEAP32[r15]+(r25*764&-1)+756>>2]+(r58<<6)+16>>2]=r54;_fseek(r2,r56+HEAP32[r9+(r58<<2)+280>>2]|0,0);r59=_fgetc(r2);r60=(_fgetc(r2)&255|r59<<8&65280)<<1;HEAP32[HEAP32[r28]+(r57*52&-1)+32>>2]=r60;HEAP32[HEAP32[r28]+(r57*52&-1)+36>>2]=0;r60=HEAP32[r28];HEAP32[r60+(r57*52&-1)+40>>2]=HEAP32[r60+(r57*52&-1)+32>>2];HEAP32[HEAP32[r28]+(r57*52&-1)+44>>2]=2;_load_sample(r2,0,HEAP32[r28]+(r57*52&-1)|0,0);r60=r57+1|0;r59=r58+1|0;if((r59|0)<(r36|0)){r57=r60;r58=r59}else{r55=r60;break L1380}}}}while(0);r36=HEAPU16[r12];r51=_calloc(1,r36);HEAP32[HEAP32[r33]+(r25<<2)>>2]=r51;_memcpy(HEAP32[HEAP32[r33]+(r25<<2)>>2],r21,r36);r36=HEAPU16[r24];r51=_calloc(1,r36);HEAP32[HEAP32[r45]+(r25<<2)>>2]=r51;_memcpy(HEAP32[HEAP32[r45]+(r25<<2)>>2],r14,r36);r49=r55;break}else{if((r48&-49|0)!=0){r49=r17;break}r36=_calloc(64,1);HEAP32[HEAP32[r15]+(r25*764&-1)+756>>2]=r36;HEAP32[HEAP32[r15]+(r25*764&-1)+36>>2]=1;HEAP32[HEAP32[HEAP32[r15]+(r25*764&-1)+756>>2]>>2]=HEAPU8[(r25<<3)+r8+6|0];HEAP32[HEAP32[HEAP32[r15]+(r25*764&-1)+756>>2]+8>>2]=128;HEAP32[HEAP32[HEAP32[r15]+(r25*764&-1)+756>>2]+12>>2]=HEAP8[(r25<<3)+r8+7|0]<<24>>24;HEAP32[HEAP32[HEAP32[r15]+(r25*764&-1)+756>>2]+40>>2]=r17;HEAP32[HEAP32[HEAP32[r15]+(r25*764&-1)+756>>2]+16>>2]=r50<<24>>24<<4;HEAP32[HEAP32[r28]+(r17*52&-1)+32>>2]=r18;HEAP32[HEAP32[r28]+(r17*52&-1)+36>>2]=HEAPU16[r8+(r25<<3)>>1]<<1;r36=HEAP32[r28];r51=(r25<<3)+r8+2|0;HEAP32[r36+(r17*52&-1)+40>>2]=(HEAPU16[r51>>1]<<1)+HEAP32[r36+(r17*52&-1)+36>>2]|0;HEAP32[HEAP32[r28]+(r17*52&-1)+44>>2]=0;if(HEAPU16[r51>>1]>1){r51=HEAP32[r28]+(r17*52&-1)+44|0;HEAP32[r51>>2]=HEAP32[r51>>2]|2}if((r48&16|0)!=0){r51=HEAP32[r28]+(r17*52&-1)+44|0;HEAP32[r51>>2]=HEAP32[r51>>2]|1;r51=HEAP32[r28]+(r17*52&-1)+32|0;HEAP32[r51>>2]=HEAP32[r51>>2]>>1;r51=HEAP32[r28]+(r17*52&-1)+36|0;HEAP32[r51>>2]=HEAP32[r51>>2]>>1;r51=HEAP32[r28]+(r17*52&-1)+40|0;HEAP32[r51>>2]=HEAP32[r51>>2]>>1}_fseek(r2,r47+6|0,0);_load_sample(r2,64,HEAP32[r28]+(r17*52&-1)|0,0);r49=r17+1|0;break}}}while(0);r46=r25+1|0;if((r46|0)<(HEAP32[r27]|0)){r17=r49;r25=r46}else{break L1355}}if(r5==984){STACKTOP=r6;return r53}else if(r5==985){STACKTOP=r6;return r53}else if(r5==986){STACKTOP=r6;return r53}else if(r5==987){STACKTOP=r6;return r53}}}while(0);_fseek(r2,r32+r3|0,0);r32=HEAP32[r29];L1400:do{if((r32|0)>0){r5=0;while(1){HEAP32[((r5*12&-1)+188>>2)+r4]=_fgetc(r2)&255;r49=r5+1|0;r27=HEAP32[r29];if((r49|0)<(r27|0)){r5=r49}else{r61=r27;break L1400}}}else{r61=r32}}while(0);if((r23|0)==0){if((r61|0)>0){r62=0}else{r53=0;STACKTOP=r6;return r53}while(1){HEAP32[((r62*12&-1)+184>>2)+r4]=128;r61=r62+1|0;if((r61|0)<(HEAP32[r29]|0)){r62=r61}else{r53=0;break}}STACKTOP=r6;return r53}else{_fseek(r2,r23+r3|0,0);if((HEAP32[r29]|0)>0){r63=0}else{r53=0;STACKTOP=r6;return r53}while(1){r3=_fgetc(r2)<<24;HEAP32[((r63*12&-1)+184>>2)+r4]=(r3|0)>266338304?255:(r3>>21)+128|0;r3=r63+1|0;if((r3|0)<(HEAP32[r29]|0)){r63=r3}else{r53=0;break}}STACKTOP=r6;return r53}}function _mmd_xlat_fx(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10;r5=r1+3|0;r6=HEAP8[r5];if((r6&255)>15){HEAP8[r1+4|0]=0;HEAP8[r5]=0;return}r7=r6&255;if((r7|0)==15){r6=r1+4|0;r8=HEAP8[r6];r9=r8&255;if(r8<<24>>24==0){HEAP8[r5]=13;return}if((r8&255)<241){HEAP8[r5]=-85;do{if((r4|0)==0){if((r2|0)==0){r10=r9;break}r10=(r9|0)/(r3|0)&-1}else{r10=HEAP32[(((r8&255)>10?9:r9-1|0)<<2)+5250180>>2]}}while(0);HEAP8[r6]=r10&255;return}if((r9|0)==242){HEAP8[r5]=14;HEAP8[r6]=-45;return}else if((r9|0)==255){HEAP8[r5]=14;HEAP8[r6]=-61;return}else if((r9|0)==248|(r9|0)==249|(r9|0)==250|(r9|0)==251|(r9|0)==253|(r9|0)==254){HEAP8[r6]=0;HEAP8[r5]=0;return}else if((r9|0)==243){HEAP8[r5]=14;HEAP8[r6]=-110;return}else if((r9|0)==241){HEAP8[r5]=14;HEAP8[r6]=-109;return}else{HEAP8[r6]=0;HEAP8[r5]=0;return}}else if((r7|0)==13){HEAP8[r5]=10;return}else if((r7|0)==5){r6=r1+4|0;r1=HEAP8[r6];HEAP8[r6]=r1<<4|(r1&255)>>>4;return}else if((r7|0)==9){HEAP8[r5]=15;return}else{return}}function _mod_test(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+140|0;r6=r5;r7=r5+64;r8=r5+68;_fseek(r1,r3+1080|0,0);r9=r7|0;if(_fread(r9,1,4,r1)>>>0<4){r10=-1;STACKTOP=r5;return r10}do{if((_strncmp(r7+2|0,5266188,2)|0)==0){r11=HEAP8[r9]<<24>>24;if((r11-48|0)>>>0>=10){r4=1032;break}r12=HEAP8[r7+1|0]<<24>>24;if((r12-48|0)>>>0>=10){r4=1032;break}if(((r11*10&-1)-529+r12|0)>>>0<32){break}else{r4=1032;break}}else{r4=1032}}while(0);L1465:do{if(r4==1032){do{if((_strncmp(r7+1|0,5266076,3)|0)==0){r12=HEAP8[r9];if(((r12<<24>>24)-48|0)>>>0>9|r12<<24>>24==48){r13=0;break}else{break L1465}}else{r13=0}}while(0);while(1){if((r13|0)==13){r10=-1;r4=1067;break}if((_memcmp(r9,HEAP32[(r13*20&-1)+5249888>>2],4)|0)==0){break}else{r13=r13+1|0}}if(r4==1067){STACKTOP=r5;return r10}r12=r3+20|0;_fseek(r1,r12,0);r11=0;while(1){if((r11|0)>=31){r4=1043;break}_fseek(r1,22,1);r14=_fgetc(r1);_fgetc(r1);if((r14&128|0)!=0){r10=-1;r4=1061;break}if((_fgetc(r1)&255)>15){r10=-1;r4=1062;break}if((_fgetc(r1)&255)>64){r10=-1;r4=1069;break}r14=_fgetc(r1);_fgetc(r1);if((r14&128|0)!=0){r10=-1;r4=1060;break}r14=_fgetc(r1);_fgetc(r1);if((r14&128|0)==0){r11=r11+1|0}else{r10=-1;r4=1066;break}}if(r4==1069){STACKTOP=r5;return r10}else if(r4==1060){STACKTOP=r5;return r10}else if(r4==1061){STACKTOP=r5;return r10}else if(r4==1043){_fstat(_fileno(r1),r8);_fseek(r1,r12,0);r11=0;r14=0;while(1){_fseek(r1,22,1);r15=_fgetc(r1);r16=((_fgetc(r1)&255|r15<<8&65280)<<1)+r14|0;_fseek(r1,6,1);r15=r11+1|0;if((r15|0)==31){break}else{r11=r15;r14=r16}}_fseek(r1,r3+952|0,0);r14=0;r11=0;while(1){r12=_fgetc(r1);r15=r12&255;if((r12&255)<<24>>24<0){r17=r11;break}r12=(r15|0)>(r11|0)?r15:r11;r15=r14+1|0;if((r15|0)<128){r14=r15;r11=r12}else{r17=r12;break}}if((r3+r16+(r17*768&-1)+1852|0)==(HEAP32[r8+28>>2]|0)){r10=-1}else{break}STACKTOP=r5;return r10}else if(r4==1062){STACKTOP=r5;return r10}else if(r4==1066){STACKTOP=r5;return r10}}}while(0);_fseek(r1,r3,0);r3=r6|0;if((r2|0)==0){r10=0;STACKTOP=r5;return r10}_memset(r2,0,21);_fread(r3,1,20,r1);HEAP8[r6+20|0]=0;_memset(r2,0,21);_strncpy(r2,r3,20);r3=HEAP8[r2];if(r3<<24>>24==0){r10=0;STACKTOP=r5;return r10}else{r18=0;r19=r2;r20=r3}while(1){do{if((_isprint(r20<<24>>24)|0)==0){r4=1054}else{if(HEAP8[r19]<<24>>24<0){r4=1054;break}else{break}}}while(0);if(r4==1054){r4=0;HEAP8[r19]=46}r3=r18+1|0;r6=r2+r3|0;r1=HEAP8[r6];if(r1<<24>>24!=0&(r3|0)<20){r18=r3;r19=r6;r20=r1}else{break}}if(HEAP8[r2]<<24>>24==0){r10=0;STACKTOP=r5;return r10}while(1){r20=r2+(_strlen(r2)-1)|0;if(HEAP8[r20]<<24>>24!=32){r10=0;r4=1063;break}HEAP8[r20]=0;if(HEAP8[r2]<<24>>24==0){r10=0;r4=1064;break}}if(r4==1063){STACKTOP=r5;return r10}else if(r4==1064){STACKTOP=r5;return r10}}function _mod_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68;r4=r1>>2;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+5480|0;r7=r6,r8=r7>>1;r9=r6+1084;r10=r6+5184;r11=r6+5192;r12=r6+5224;r13=r6+1088|0;_memset(r13,0,4096);_fseek(r2,r3,0);r14=(r1+140|0)>>2;HEAP32[r14]=31;r15=(r1+144|0)>>2;HEAP32[r15]=31;r16=(r1+136|0)>>2;HEAP32[r16]=0;r17=(r1+1276|0)>>2;HEAP32[r17]=HEAP32[r17]|8192;r18=r7|0;_fread(r18,20,1,r2);r19=0;r20=0;while(1){_fread(r7+(r20*30&-1)+20|0,22,1,r2);r21=_fgetc(r2)&65535;r22=r7+(r20*30&-1)+42|0;HEAP16[r22>>1]=_fgetc(r2)&255|r21<<8;HEAP8[r7+(r20*30&-1)+44|0]=_fgetc(r2)&255;HEAP8[r7+(r20*30&-1)+45|0]=_fgetc(r2)&255;r21=_fgetc(r2)&65535;HEAP16[((r20*30&-1)+46>>1)+r8]=_fgetc(r2)&255|r21<<8;r21=_fgetc(r2)&65535;HEAP16[((r20*30&-1)+48>>1)+r8]=_fgetc(r2)&255|r21<<8;r23=(HEAPU16[r22>>1]<<1)+r19|0;r22=r20+1|0;if((r22|0)==31){break}else{r19=r23;r20=r22}}r20=r7+950|0;HEAP8[r20]=_fgetc(r2)&255;r19=r7+951|0;HEAP8[r19]=_fgetc(r2)&255;r22=r7+952|0;_fread(r22,128,1,r2);HEAP32[r10>>2]=0;HEAP32[r10+4>>2]=0;r21=r10;_fread(r21,4,1,r2);r24=0;while(1){if((r24|0)==13){r25=0;r26=0;r27=5266736;break}if((_strncmp(r21,HEAP32[(r24*20&-1)+5249888>>2],4)|0)==0){r5=1077;break}else{r24=r24+1|0}}if(r5==1077){HEAP32[r16]=HEAP32[(r24*20&-1)+5249904>>2];r25=HEAP32[(r24*20&-1)+5249896>>2];r26=HEAP32[(r24*20&-1)+5249892>>2];r27=HEAP32[(r24*20&-1)+5249900>>2]}if((HEAP32[r16]|0)==0){do{if((_strncmp(r21+2|0,5266188,2)|0)==0){r24=HEAP16[r10>>1];r28=(r24&65535)<<24>>24;if((r28-48|0)>>>0>=10){r5=1083;break}r29=((r24&65535)>>>8&65535)<<24>>24;if((r29-48|0)>>>0>=10){r5=1083;break}r24=(r28*10&-1)-528+r29|0;HEAP32[r16]=r24;if((r24|0)>32){r30=-1}else{break}STACKTOP=r6;return r30}else{r5=1083}}while(0);do{if(r5==1083){if((_strncmp(r21+1|0,5266076,3)|0)!=0){r30=-1;STACKTOP=r6;return r30}r24=(HEAP8[r21]<<24>>24)-48|0;if(r24>>>0>=10){r30=-1;STACKTOP=r6;return r30}HEAP32[r16]=r24;if((r24|0)==0){r30=-1}else{break}STACKTOP=r6;return r30}}while(0);HEAP32[r17]=HEAP32[r17]&-8193;r31=1;r32=5265868}else{r31=r26;r32=r27}_strncpy(r1|0,r18,20);r18=HEAPU8[r20];HEAP32[r4+39]=r18;r20=(r1+160|0)>>2;if((HEAP32[r20]|0)>=(r18|0)){HEAP32[r20]=0}_memcpy(r1+952|0,r22,128);r22=(r1+128|0)>>2;r18=0;while(1){r27=HEAP8[r1+(r18+952)|0];r26=r27&255;r24=HEAP32[r22];if(r27<<24>>24<0){r33=r24;break}if((r26|0)>(r24|0)){HEAP32[r22]=r26;r34=r26}else{r34=r24}r24=r18+1|0;if((r24|0)<128){r18=r24}else{r33=r34;break}}HEAP32[r22]=r33+1|0;r33=(r1+176|0)>>2;HEAP32[r33]=_calloc(764,HEAP32[r14]);r34=HEAP32[r15];if((r34|0)!=0){HEAP32[r4+45]=_calloc(52,r34)}L1560:do{if((HEAP32[r14]|0)>0){r34=(r1+180|0)>>2;r18=0;while(1){r24=_calloc(64,1);HEAP32[HEAP32[r33]+(r18*764&-1)+756>>2]=r24;HEAP32[HEAP32[r34]+(r18*52&-1)+32>>2]=HEAPU16[((r18*30&-1)+42>>1)+r8]<<1;HEAP32[HEAP32[r34]+(r18*52&-1)+36>>2]=HEAPU16[((r18*30&-1)+46>>1)+r8]<<1;r24=HEAP32[r34];r26=r7+(r18*30&-1)+48|0;HEAP32[r24+(r18*52&-1)+40>>2]=(HEAPU16[r26>>1]<<1)+HEAP32[r24+(r18*52&-1)+36>>2]|0;r24=HEAP32[r34];r27=r24+(r18*52&-1)+40|0;r29=HEAP32[r24+(r18*52&-1)+32>>2];if((HEAP32[r27>>2]|0)>(r29|0)){HEAP32[r27>>2]=r29}r29=HEAP32[r34];if(HEAPU16[r26>>1]>1){r35=(HEAP32[r29+(r18*52&-1)+40>>2]|0)>8?2:0}else{r35=0}HEAP32[r29+(r18*52&-1)+44>>2]=r35;HEAP32[HEAP32[HEAP32[r33]+(r18*764&-1)+756>>2]+16>>2]=HEAP8[r7+(r18*30&-1)+44|0]<<28>>24;HEAP32[HEAP32[HEAP32[r33]+(r18*764&-1)+756>>2]>>2]=HEAP8[r7+(r18*30&-1)+45|0]<<24>>24;HEAP32[HEAP32[HEAP32[r33]+(r18*764&-1)+756>>2]+8>>2]=128;HEAP32[HEAP32[HEAP32[r33]+(r18*764&-1)+756>>2]+40>>2]=r18;HEAP32[HEAP32[r33]+(r18*764&-1)+36>>2]=(HEAP32[HEAP32[r34]+(r18*52&-1)+32>>2]|0)!=0&1;r29=HEAP32[r33];r26=r29+(r18*764&-1)|0;_memset(r26,0,23);_strncpy(r26,r7+(r18*30&-1)+20|0,22);r27=HEAP8[r26];L1570:do{if(r27<<24>>24!=0){r24=0;r28=r26;r36=r27;while(1){do{if((_isprint(r36<<24>>24)|0)==0){r5=1106}else{if(HEAP8[r28]<<24>>24<0){r5=1106;break}else{break}}}while(0);if(r5==1106){r5=0;HEAP8[r28]=46}r37=r24+1|0;r38=r29+(r18*764&-1)+r37|0;r39=HEAP8[r38];if(r39<<24>>24!=0&(r37|0)<22){r24=r37;r28=r38;r36=r39}else{break}}if(HEAP8[r26]<<24>>24==0){break}while(1){r36=_strlen(r26)-1+r29+(r18*764&-1)|0;if(HEAP8[r36]<<24>>24!=32){break L1570}HEAP8[r36]=0;if(HEAP8[r26]<<24>>24==0){break L1570}}}}while(0);r26=r18+1|0;if((r26|0)<(HEAP32[r14]|0)){r18=r26}else{break L1560}}}}while(0);L1584:do{if((r31|0)==0){r14=(r1+1240|0)>>2;if((r23+Math.imul(HEAP32[r22]<<8,HEAP32[r16])+1084|0|0)<(HEAP32[r14]|0)){r35=_ftell(r2);_fseek(r2,r3+r23+Math.imul(HEAP32[r22]<<8,HEAP32[r16])+1084|0,0);r18=r11|0;_fread(r18,1,4,r2);_fseek(r2,r35+r3|0,0);if((_memcmp(r18,5265784,4)|0)==0){r40=0;r41=5265600;r42=0;break}}do{if((_strncmp(r21,5265056,4)|0)==0){if(((HEAP32[r22]<<11|1084)+r23|0)!=(HEAP32[r14]|0)){break}HEAP32[r16]=8;r40=0;r41=5265508;r42=0;break L1584}}while(0);if((_strncmp(r21,5265056,4)|0)==0){r18=((HEAP32[r22]<<10)+1084|0)==(HEAP32[r14]|0);r35=r18&1;if(r18){r40=r25;r41=5267156;r42=r35;break}else{r43=r35}}else{r43=0}r35=HEAP32[r16];r18=(r35|0)==4;r34=HEAP8[r19];do{if(r18){if((r34&255|0)==(HEAP32[r22]|0)){r44=5265488;r45=r25;r5=1127;break}if(r34<<24>>24==120){r40=1;r41=5264524;r42=r43;break L1584}else{r5=1122;break}}else{r5=1122}}while(0);do{if(r5==1122){if((r34&255)<127){HEAP32[r20]=r34&255;r46=r18&1;r47=r18?5264524:5265584}else{r46=r25;r47=r32}if((r35|0)==4){r44=r47;r45=r46;r5=1127;break}if(r34<<24>>24!=127){r48=r46;r49=r47;r50=r35;break}HEAP32[r17]=HEAP32[r17]&-8193;HEAP32[r4+320]=2;r40=0;r41=5265432;r42=r43;break L1584}}while(0);do{if(r5==1127){if(r34<<24>>24==127){r51=0}else{r48=r45;r49=r44;r50=4;break}while(1){if((r51|0)>=31){r52=0;break}if(HEAP16[((r51*30&-1)+48>>1)+r8]<<16>>16==0){r52=1;break}else{r51=r51+1|0}}r40=r52?0:r45;r41=r52?5265376:r44;r42=r43;break L1584}}while(0);if(r34<<24>>24!=120&(r34&255)<127){r53=0}else{r40=r48;r41=r49;r42=r43;break}while(1){if((r53|0)>=31){break}if(HEAP16[((r53*30&-1)+48>>1)+r8]<<16>>16==0){break}else{r53=r53+1|0}}if((r53|0)==31){r54=0}else{r34=15;while(1){if((r34|0)>=31){break}if(HEAP8[r7+(r34*30&-1)+20|0]<<24>>24!=0){break}if(HEAP16[((r34*30&-1)+42>>1)+r8]<<16>>16==0){r34=r34+1|0}else{break}}do{if((r34|0)==31){r35=HEAP16[r8+220];r18=r35&255;r14=(r35&65535)>>>8&255;if(!(r18<<24>>24==115|r18<<24>>24==83)){r55=0;break}if(!(r14<<24>>24==116|r14<<24>>24==84)){r55=0;break}r14=HEAP16[r8+221];if((r14&255)<<24>>24!=45){r55=0;break}if(HEAP8[r7+445|0]<<24>>24!=58){r55=0;break}if(((((r14&65535)>>>8&65535)<<24>>24)-48|0)>>>0>=10){r55=0;break}if(((HEAP8[r7+444|0]<<24>>24)-48|0)>>>0<10){r40=0;r41=5265032;r42=r43;break L1584}else{r55=0;break}}else{r55=0}}while(0);while(1){r34=HEAP8[r7+(r55*30&-1)+20|0];do{if(r34<<24>>24==115|r34<<24>>24==83){r14=HEAP8[r7+(r55*30&-1)+21|0];if(!(r14<<24>>24==116|r14<<24>>24==84)){break}if(HEAP8[r7+(r55*30&-1)+22|0]<<24>>24!=45){break}if(HEAP8[r7+(r55*30&-1)+25|0]<<24>>24!=58){break}if(((HEAP8[r7+(r55*30&-1)+23|0]<<24>>24)-48|0)>>>0>=10){break}if(((HEAP8[r7+(r55*30&-1)+24|0]<<24>>24)-48|0)>>>0<10){r40=0;r41=5264844;r42=r43;break L1584}}}while(0);r34=r55+1|0;if((r34|0)<31){r55=r34}else{break}}if(!((r50|0)==4|(r50|0)==6|(r50|0)==8)){r40=0;r41=5265584;r42=r43;break}HEAP32[r17]=HEAP32[r17]&-8193;r40=0;r41=5263024;r42=r43;break}while(1){if(HEAP16[((r54*30&-1)+42>>1)+r8]<<16>>16==1){if(HEAP8[r7+(r54*30&-1)+45|0]<<24>>24==0){r40=0;r41=5265268;r42=r43;break L1584}}r34=r54+1|0;if((r34|0)<31){r54=r34}else{r56=0;break}}L1646:while(1){r34=HEAP8[r7+(r56*30&-1)+20|0];do{if(r34<<24>>24==115|r34<<24>>24==83){r14=HEAP8[r7+(r56*30&-1)+21|0];if(!(r14<<24>>24==116|r14<<24>>24==84)){break}if(HEAP8[r7+(r56*30&-1)+22|0]<<24>>24!=45){break}if(HEAP8[r7+(r56*30&-1)+25|0]<<24>>24!=58){break}if(((HEAP8[r7+(r56*30&-1)+23|0]<<24>>24)-48|0)>>>0>=10){break}if(((HEAP8[r7+(r56*30&-1)+24|0]<<24>>24)-48|0)>>>0<10){r57=r56;break L1646}}}while(0);r34=r56+1|0;if((r34|0)<31){r56=r34}else{r57=r34;break}}if((r57|0)==31){r58=0}else{r40=r48;r41=r49;r42=r43;break}while(1){if(HEAP16[((r58*30&-1)+42>>1)+r8]<<16>>16==0){if(HEAP16[((r58*30&-1)+48>>1)+r8]<<16>>16==1){r5=1148;break}}r34=r58+1|0;if((r34|0)<31){r58=r34}else{r5=1152;break}}if(r5==1148){if((r50|0)==6|(r50|0)==8){r40=0;r41=5267936;r42=r43;break}else if((r50|0)==4){r40=r48;r41=5264524;r42=r43;break}else{r40=0;r41=5265584;r42=r43;break}}else if(r5==1152){if((r50|0)==4){_puts(5247036);r40=r48;r41=5267156;r42=r43;break}else if((r50|0)==6|(r50|0)==8){HEAP32[r17]=HEAP32[r17]&-8193;r40=0;r41=5265100;r42=r43;break}else{r40=0;r41=5265584;r42=r43;break}}}else{r40=r25;r41=r32;r42=0}}while(0);r32=r1+132|0;HEAP32[r32>>2]=Math.imul(HEAP32[r22],HEAP32[r16]);_snprintf(r1+64|0,64,5264788,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r41,HEAP32[tempInt+4>>2]=r10,tempInt));r10=(r1+172|0)>>2;HEAP32[r10]=_calloc(4,HEAP32[r32>>2]);r32=(r1+168|0)>>2;HEAP32[r32]=_calloc(4,HEAP32[r22]+1|0);L1671:do{if((HEAP32[r22]|0)>0){r25=r9|0;r43=r9+1|0;r50=r9+2|0;r48=r9+3|0;r5=0;r58=HEAP32[r16];while(1){r8=_calloc(1,(r58<<2)+4|0);HEAP32[HEAP32[r32]+(r5<<2)>>2]=r8;HEAP32[HEAP32[HEAP32[r32]+(r5<<2)>>2]>>2]=64;r8=HEAP32[r16];L1675:do{if((r8|0)>0){r49=0;r57=r8;while(1){r56=Math.imul(r57,r5)+r49|0;HEAP32[HEAP32[HEAP32[r32]+(r5<<2)>>2]+(r49<<2)+4>>2]=r56;r56=_calloc(HEAP32[HEAP32[HEAP32[r32]+(r5<<2)>>2]>>2]<<3|4,1);r7=Math.imul(HEAP32[r16],r5)+r49|0;HEAP32[HEAP32[r10]+(r7<<2)>>2]=r56;r56=HEAP32[HEAP32[HEAP32[r32]+(r5<<2)>>2]>>2];r7=Math.imul(HEAP32[r16],r5)+r49|0;HEAP32[HEAP32[HEAP32[r10]+(r7<<2)>>2]>>2]=r56;r56=r49+1|0;r7=HEAP32[r16];if((r56|0)<(r7|0)){r49=r56;r57=r7}else{r59=r7;break L1675}}}else{r59=r8}}while(0);L1679:do{if((r59<<6|0)>0){r8=0;r57=r59;while(1){r49=(r8|0)/(r57|0)&-1;r7=HEAP32[HEAP32[r10]+(HEAP32[HEAP32[HEAP32[r32]+(r5<<2)>>2]+((r8|0)%(r57|0)<<2)+4>>2]<<2)>>2];_fread(r25,1,4,r2);r56=HEAP8[r25];r54=(r56&255)<<8&3840|HEAPU8[r43];if((r54|0)==0){r60=0}else{L1684:do{if(r54>>>0<3628){r55=r54;r53=24;while(1){r44=r53+12|0;r52=r55<<1;if((r52|0)<3628){r55=r52;r53=r44}else{r61=r52;r62=r44;break L1684}}}else{r61=r54;r62=24}}while(0);L1688:do{if((r61|0)>3842){r54=r62;r53=5249472;while(1){r55=r53-32|0;r44=r54-1|0;r52=HEAP32[r55>>2];if((r61|0)>(r52|0)){r54=r44;r53=r55}else{r63=r44;r64=r55,r65=r64>>2;r66=r52;break L1688}}}else{r63=r62;r64=5249472,r65=r64>>2;r66=3842}}while(0);do{if((r66|0)>(r61|0)){if((HEAP32[r65+1]|0)<=(r61|0)){r67=1;break}if((HEAP32[r65+2]|0)<=(r61|0)){r67=1;break}r67=(HEAP32[r65+3]|0)<=(r61|0)&1}else{r67=1}}while(0);r60=r63-r67&255}HEAP8[(r49<<3)+r7+4|0]=r60;r53=HEAP8[r50];HEAP8[(r49<<3)+r7+5|0]=(r53&255)>>>4|r56&-16;r54=r53&15;r53=(r49<<3)+r7+7|0;HEAP8[r53]=r54;r52=HEAP8[r48];HEAP8[(r49<<3)+r7+8|0]=r52;do{if(r52<<24>>24==0){r55=r54&255;if((r55|0)==6){HEAP8[r53]=4;break}else if((r55|0)==1|(r55|0)==2|(r55|0)==10){HEAP8[r53]=0;break}else if((r55|0)==5){HEAP8[r53]=3;break}else{break}}}while(0);r53=r8+1|0;r54=HEAP32[r16];if((r53|0)<(r54<<6|0)){r8=r53;r57=r54}else{r68=r54;break L1679}}}else{r68=r59}}while(0);r57=r5+1|0;if((r57|0)<(HEAP32[r22]|0)){r5=r57;r58=r68}else{break L1671}}}}while(0);r68=HEAP32[r4+304];r22=_strrchr(r68,47);if((r22|0)!=0){_strncpy(r13,r68,r22-r68|0)}L1710:do{if((HEAP32[r15]|0)>0){r68=r1+180|0;r22=(r40|0)!=0?512:0;r59=(r42|0)==0;r60=r12|0;r67=0;while(1){r63=HEAP32[r68>>2];do{if((HEAP32[r63+(r67*52&-1)+32>>2]|0)!=0){r61=HEAP32[r33];if(r59){_load_sample(r2,r22,r63+(HEAP32[HEAP32[r61+(r67*764&-1)+756>>2]+40>>2]*52&-1)|0,0);break}_snprintf(r60,64,5264756,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r13,HEAP32[tempInt+4>>2]=r61+(r67*764&-1)|0,tempInt));r61=_fopen(r60,5263292);if((r61|0)==0){break}_load_sample(r61,r22,HEAP32[r68>>2]+(HEAP32[HEAP32[HEAP32[r33]+(r67*764&-1)+756>>2]+40>>2]*52&-1)|0,0)}}while(0);r63=r67+1|0;if((r63|0)<(HEAP32[r15]|0)){r67=r63}else{break L1710}}}}while(0);if((HEAP32[r16]|0)>4){HEAP32[r17]=HEAP32[r17]&-8225|32;HEAP32[r4+320]=1;r30=0;STACKTOP=r6;return r30}if((_strcmp(r41,5267156)|0)!=0){r30=0;STACKTOP=r6;return r30}HEAP32[r17]=HEAP32[r17]|4;r30=0;STACKTOP=r6;return r30}function _mtm_test(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+68|0;r5=r4;r6=r4+64;r7=r6|0;L1731:do{if(_fread(r7,1,4,r1)>>>0<4){r8=-1}else{if((_memcmp(r7,5265932,3)|0)!=0){r8=-1;break}if(HEAP8[r6+3|0]<<24>>24!=16){r8=-1;break}r9=r5|0;if((r2|0)==0){r8=0;break}_memset(r2,0,21);_fread(r9,1,20,r1);HEAP8[r5+20|0]=0;_memset(r2,0,21);_strncpy(r2,r9,20);r9=HEAP8[r2];if(r9<<24>>24==0){r8=0;break}else{r10=0;r11=r2;r12=r9}while(1){do{if((_isprint(r12<<24>>24)|0)==0){r3=1226}else{if(HEAP8[r11]<<24>>24<0){r3=1226;break}else{break}}}while(0);if(r3==1226){r3=0;HEAP8[r11]=46}r9=r10+1|0;r13=r2+r9|0;r14=HEAP8[r13];if(r14<<24>>24!=0&(r9|0)<20){r10=r9;r11=r13;r12=r14}else{break}}if(HEAP8[r2]<<24>>24==0){r8=0;break}while(1){r14=r2+(_strlen(r2)-1)|0;if(HEAP8[r14]<<24>>24!=32){r8=0;break L1731}HEAP8[r14]=0;if(HEAP8[r2]<<24>>24==0){r8=0;break L1731}}}}while(0);STACKTOP=r4;return r8}function _mtm_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40;r4=r1>>2;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+364|0;r7=r6;r8=r6+68;r9=r6+108;r10=r6+300;_fseek(r2,r3,0);_fread(r7|0,3,1,r2);r3=r7+3|0;HEAP8[r3]=_fgetc(r2)&255;r11=r7+4|0;_fread(r11,20,1,r2);r12=r7+24|0;HEAP16[r12>>1]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;r13=r7+26|0;HEAP8[r13]=_fgetc(r2)&255;HEAP8[r7+27|0]=_fgetc(r2)&255;r14=r7+28|0;HEAP16[r14>>1]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;r15=r7+30|0;HEAP8[r15]=_fgetc(r2)&255;r16=r7+31|0;HEAP8[r16]=_fgetc(r2)&255;r17=r7+32|0;HEAP8[r17]=_fgetc(r2)&255;r18=r7+33|0;HEAP8[r18]=_fgetc(r2)&255;_fread(r7+34|0,32,1,r2);r19=(r1+132|0)>>2;HEAP32[r19]=HEAPU16[r12>>1]+1|0;r12=HEAP16[r13>>1];r13=(r1+128|0)>>2;HEAP32[r13]=(r12&255)+1|0;HEAP32[r4+39]=((r12&65535)>>>8&65535)+1|0;r12=HEAPU8[r15];r15=(r1+140|0)>>2;HEAP32[r15]=r12;r20=r1+144|0;HEAP32[r20>>2]=r12;r12=(r1+136|0)>>2;HEAP32[r12]=HEAPU8[r18];HEAP32[r4+37]=6;HEAP32[r4+38]=125;_strncpy(r1|0,r11,20);r11=HEAPU8[r3];_set_type(r1,5267124,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r11>>>4,HEAP32[tempInt+4>>2]=r11&15,tempInt));r11=(r1+176|0)>>2;HEAP32[r11]=_calloc(764,HEAP32[r15]);r3=HEAP32[r20>>2];if((r3|0)!=0){HEAP32[r4+45]=_calloc(52,r3)}L1752:do{if((HEAP32[r15]|0)>0){r3=r8|0;r20=r8+24|0;r18=r8+28|0;r21=r8+32|0;r22=r8+36|0;r23=r8+37|0;r24=r8+38|0;r25=(r1+180|0)>>2;r26=(HEAP8[r16]&1)<<24>>24==0;r27=0;while(1){r28=_calloc(64,1);HEAP32[HEAP32[r11]+(r27*764&-1)+756>>2]=r28;_fread(r3,22,1,r2);r28=_fgetc(r2)&255;r29=_fgetc(r2);r30=r29<<8&65280|r28|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;HEAP32[r20>>2]=r30;r28=_fgetc(r2)&255;r29=_fgetc(r2);r31=r29<<8&65280|r28|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;HEAP32[r18>>2]=r31;r28=_fgetc(r2)&255;r29=_fgetc(r2);r32=r29<<8&65280|r28|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;HEAP32[r21>>2]=r32;r28=_fgetc(r2)&255;HEAP8[r22]=r28;r29=_fgetc(r2);HEAP8[r23]=r29&255;HEAP8[r24]=_fgetc(r2)&255;HEAP32[HEAP32[r25]+(r27*52&-1)+32>>2]=r30;HEAP32[HEAP32[r11]+(r27*764&-1)+36>>2]=(r30|0)!=0&1;HEAP32[HEAP32[r25]+(r27*52&-1)+36>>2]=r31;HEAP32[HEAP32[r25]+(r27*52&-1)+40>>2]=r32;r32=HEAP32[r25];HEAP32[r32+(r27*52&-1)+44>>2]=(HEAP32[r32+(r27*52&-1)+40>>2]|0)!=0?2:0;if(!r26){r32=HEAP32[r25]+(r27*52&-1)+44|0;HEAP32[r32>>2]=HEAP32[r32>>2]|1;r32=HEAP32[r25]+(r27*52&-1)+32|0;HEAP32[r32>>2]=HEAP32[r32>>2]>>1;r32=HEAP32[r25]+(r27*52&-1)+36|0;HEAP32[r32>>2]=HEAP32[r32>>2]>>1;r32=HEAP32[r25]+(r27*52&-1)+40|0;HEAP32[r32>>2]=HEAP32[r32>>2]>>1}HEAP32[HEAP32[HEAP32[r11]+(r27*764&-1)+756>>2]>>2]=r29&255;HEAP32[HEAP32[HEAP32[r11]+(r27*764&-1)+756>>2]+16>>2]=(r28<<28>>24)+128|0;HEAP32[HEAP32[HEAP32[r11]+(r27*764&-1)+756>>2]+8>>2]=128;HEAP32[HEAP32[HEAP32[r11]+(r27*764&-1)+756>>2]+40>>2]=r27;r28=HEAP32[r11];r29=r28+(r27*764&-1)|0;_memset(r29,0,23);_strncpy(r29,r3,22);r32=HEAP8[r29];L1759:do{if(r32<<24>>24!=0){r31=0;r30=r29;r33=r32;while(1){do{if((_isprint(r33<<24>>24)|0)==0){r5=1241}else{if(HEAP8[r30]<<24>>24<0){r5=1241;break}else{break}}}while(0);if(r5==1241){r5=0;HEAP8[r30]=46}r34=r31+1|0;r35=r28+(r27*764&-1)+r34|0;r36=HEAP8[r35];if(r36<<24>>24!=0&(r34|0)<22){r31=r34;r30=r35;r33=r36}else{break}}if(HEAP8[r29]<<24>>24==0){break}while(1){r33=_strlen(r29)-1+r28+(r27*764&-1)|0;if(HEAP8[r33]<<24>>24!=32){break L1759}HEAP8[r33]=0;if(HEAP8[r29]<<24>>24==0){break L1759}}}}while(0);r29=r27+1|0;if((r29|0)<(HEAP32[r15]|0)){r27=r29}else{break L1752}}}}while(0);_fread(r1+952|0,1,128,r2);r5=(r1+172|0)>>2;HEAP32[r5]=_calloc(4,HEAP32[r19]);r16=(r1+168|0)>>2;HEAP32[r16]=_calloc(4,HEAP32[r13]+1|0);L1773:do{if((HEAP32[r19]|0)>0){r8=HEAPU8[r17];r27=(r8<<3)+12|0;r3=r9|0;r25=0;while(1){r26=_calloc(r27,1);HEAP32[HEAP32[r5]+(r25<<2)>>2]=r26;HEAP32[HEAP32[HEAP32[r5]+(r25<<2)>>2]>>2]=r8;L1777:do{if((r25|0)!=0){_fread(r3,3,64,r2);r26=0;while(1){r24=r26*3&-1;r23=HEAP8[r9+r24|0];r22=(r23&255)>>>2;HEAP8[(r26<<3)+HEAP32[HEAP32[r5]+(r25<<2)>>2]+4|0]=r22;if(r22<<24>>24!=0){r22=(r26<<3)+HEAP32[HEAP32[r5]+(r25<<2)>>2]+4|0;HEAP8[r22]=HEAP8[r22]+37&255}r22=HEAP8[r24+(r9+1)|0];HEAP8[(r26<<3)+HEAP32[HEAP32[r5]+(r25<<2)>>2]+5|0]=r23<<4&48|(r22&255)>>>4;HEAP8[(r26<<3)+HEAP32[HEAP32[r5]+(r25<<2)>>2]+7|0]=r22&15;HEAP8[(r26<<3)+HEAP32[HEAP32[r5]+(r25<<2)>>2]+8|0]=HEAP8[r24+(r9+2)|0];r24=HEAP32[HEAP32[r5]+(r25<<2)>>2];r22=HEAP8[(r26<<3)+r24+7|0];if((r22&255)>15){HEAP8[(r26<<3)+r24+8|0]=0;HEAP8[(r26<<3)+HEAP32[HEAP32[r5]+(r25<<2)>>2]+7|0]=0;r23=HEAP32[HEAP32[r5]+(r25<<2)>>2];r37=r23;r38=HEAP8[(r26<<3)+r23+7|0]}else{r37=r24;r38=r22}r22=(r26<<3)+r37+7|0;do{if(r38<<24>>24==14){if((HEAP8[(r26<<3)+r37+8|0]&-16)<<24>>24!=-128){break}HEAP8[r22]=8;r24=(r26<<3)+HEAP32[HEAP32[r5]+(r25<<2)>>2]+8|0;HEAP8[r24]=HEAP8[r24]<<4}}while(0);r22=r26+1|0;if((r22|0)==64){break L1777}else{r26=r22}}}}while(0);r26=r25+1|0;if((r26|0)<(HEAP32[r19]|0)){r25=r26}else{break L1773}}}}while(0);L1793:do{if((HEAP32[r13]|0)>0){r19=0;r5=HEAP32[r12];while(1){r37=_calloc(1,(r5<<2)+4|0);HEAP32[HEAP32[r16]+(r19<<2)>>2]=r37;HEAP32[HEAP32[HEAP32[r16]+(r19<<2)>>2]>>2]=64;r37=0;while(1){HEAP16[r10+(r37<<1)>>1]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;r38=r37+1|0;if((r38|0)==32){break}else{r37=r38}}r37=HEAP32[r12];L1800:do{if((r37|0)>0){r38=0;while(1){HEAP32[HEAP32[HEAP32[r16]+(r19<<2)>>2]+(r38<<2)+4>>2]=HEAPU16[r10+(r38<<1)>>1];r9=r38+1|0;r17=HEAP32[r12];if((r9|0)<(r17|0)){r38=r9}else{r39=r17;break L1800}}}else{r39=r37}}while(0);r37=r19+1|0;if((r37|0)<(HEAP32[r13]|0)){r19=r37;r5=r39}else{break L1793}}}}while(0);_fseek(r2,HEAPU16[r14>>1],1);L1805:do{if((HEAP32[r15]|0)>0){r14=r1+180|0;r39=0;while(1){_load_sample(r2,2,HEAP32[r14>>2]+(HEAP32[HEAP32[HEAP32[r11]+(r39*764&-1)+756>>2]+40>>2]*52&-1)|0,0);r13=r39+1|0;if((r13|0)<(HEAP32[r15]|0)){r39=r13}else{break L1805}}}}while(0);if((HEAP32[r12]|0)>0){r40=0}else{STACKTOP=r6;return 0}while(1){HEAP32[((r40*12&-1)+184>>2)+r4]=HEAPU8[r7+(r40+34)|0]<<4;r15=r40+1|0;if((r15|0)<(HEAP32[r12]|0)){r40=r15}else{break}}STACKTOP=r6;return 0}function _no_test(r1,r2,r3){var r4,r5,r6,r7,r8;r3=STACKTOP;STACKTOP=STACKTOP+64|0;r4=r3;r5=_fgetc(r1);r6=_fgetc(r1);if((r6<<16&16711680|r5<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255|0)!=1313800192){r7=-1;STACKTOP=r3;return r7}r5=_fgetc(r1)&255;r6=r4|0;if((r2|0)==0){r7=0;STACKTOP=r3;return r7}r8=r5>>>0>63?63:r5;_memset(r2,0,r8+1|0);_fread(r6,1,r8,r1);HEAP8[r4+r8|0]=0;_copy_adjust(r2,r6,r8);r7=0;STACKTOP=r3;return r7}function _no_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34;r4=0;r5=STACKTOP;_fseek(r2,r3,0);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_set_type(r1,5267100,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));r3=_fgetc(r2)&255;r6=_fgetc(r2);L1824:do{if((r3|0)!=0){r7=0;r8=r6;while(1){if((r7|0)<64){HEAP8[r1+r7|0]=r8&255}r9=r7+1|0;r10=_fgetc(r2);if((r9|0)<(r3|0)){r7=r9;r8=r10}else{break L1824}}}}while(0);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r3=(r1+128|0)>>2;HEAP32[r3]=_fgetc(r2)&255;_fgetc(r2);r6=_fgetc(r2)&255;r8=(r1+136|0)>>2;HEAP32[r8]=r6;r7=r1+132|0;HEAP32[r7>>2]=Math.imul(HEAP32[r3],r6);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r6=r1+144|0;HEAP32[r6>>2]=63;r10=(r1+140|0)>>2;HEAP32[r10]=63;r9=0;while(1){r11=_fgetc(r2)&255;if(r11<<24>>24==-1){r12=r9;break}HEAP8[r1+(r9+952)|0]=r11;r11=r9+1|0;if((r11|0)<256){r9=r11}else{r12=r11;break}}_fseek(r2,255-r12|0,1);HEAP32[r1+156>>2]=r12;r12=(r1+176|0)>>2;HEAP32[r12]=_calloc(764,HEAP32[r10]);r9=HEAP32[r6>>2];if((r9|0)!=0){HEAP32[r1+180>>2]=_calloc(52,r9)}L1838:do{if((HEAP32[r10]|0)>0){r9=(r1+180|0)>>2;r6=0;while(1){r11=_calloc(64,1);HEAP32[HEAP32[r12]+(r6*764&-1)+756>>2]=r11;r11=_fgetc(r2)&255;do{if((r11|0)==0){r4=1297}else{r13=0;r14=0;while(1){r15=_fgetc(r2)&255;r16=r15<<24>>24==32?r13:1;if((r14|0)<32){HEAP8[HEAP32[r12]+(r6*764&-1)+r14|0]=r15}r15=r14+1|0;if((r15|0)<(r11|0)){r13=r16;r14=r15}else{break}}if((r16|0)==0){r4=1297;break}else{break}}}while(0);if(r4==1297){r4=0;HEAP8[HEAP32[r12]+(r6*764&-1)|0]=0}_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r11=_fgetc(r2)&255;HEAP32[HEAP32[HEAP32[r12]+(r6*764&-1)+756>>2]>>2]=r11;r11=_fgetc(r2)&255|_fgetc(r2)<<8&65280;r14=_fgetc(r2)&255|_fgetc(r2)<<8&65280;HEAP32[HEAP32[r9]+(r6*52&-1)+32>>2]=r14;r14=_fgetc(r2)&255|_fgetc(r2)<<8&65280;HEAP32[HEAP32[r9]+(r6*52&-1)+36>>2]=r14;r14=_fgetc(r2)&255|_fgetc(r2)<<8&65280;HEAP32[HEAP32[r9]+(r6*52&-1)+40>>2]=r14;_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);HEAP32[HEAP32[r12]+(r6*764&-1)+36>>2]=(HEAP32[HEAP32[r9]+(r6*52&-1)+32>>2]|0)!=0&1;HEAP32[HEAP32[r9]+(r6*52&-1)+36>>2]=0;HEAP32[HEAP32[r9]+(r6*52&-1)+40>>2]=0;r14=HEAP32[r9];HEAP32[r14+(r6*52&-1)+44>>2]=(HEAP32[r14+(r6*52&-1)+40>>2]|0)>0?2:0;HEAP32[HEAP32[HEAP32[r12]+(r6*764&-1)+756>>2]+16>>2]=0;HEAP32[HEAP32[HEAP32[r12]+(r6*764&-1)+756>>2]+8>>2]=128;HEAP32[HEAP32[HEAP32[r12]+(r6*764&-1)+756>>2]+40>>2]=r6;r14=r11*8363&-1;r11=HEAP32[HEAP32[r12]+(r6*764&-1)+756>>2];r13=r11+12|0;r15=r11+16|0;if(r14>>>0<8448){HEAP32[r15>>2]=0;HEAP32[r13>>2]=0}else{r11=Math.log((Math.floor((r14>>>0)/8448)|0)/8363)*1536/.6931471805599453&-1;HEAP32[r13>>2]=(r11|0)/128&-1;HEAP32[r15>>2]=(r11|0)%128}r11=r6+1|0;if((r11|0)<(HEAP32[r10]|0)){r6=r11}else{break L1838}}}}while(0);r4=(r1+172|0)>>2;HEAP32[r4]=_calloc(4,HEAP32[r7>>2]);r7=(r1+168|0)>>2;HEAP32[r7]=_calloc(4,HEAP32[r3]+1|0);L1857:do{if((HEAP32[r3]|0)>0){r16=0;r6=HEAP32[r8];while(1){r9=_calloc(1,(r6<<2)+4|0);HEAP32[HEAP32[r7]+(r16<<2)>>2]=r9;HEAP32[HEAP32[HEAP32[r7]+(r16<<2)>>2]>>2]=64;r9=HEAP32[r8];L1861:do{if((r9|0)>0){r11=0;r15=r9;while(1){r13=Math.imul(r15,r16)+r11|0;HEAP32[HEAP32[HEAP32[r7]+(r16<<2)>>2]+(r11<<2)+4>>2]=r13;r13=_calloc(HEAP32[HEAP32[HEAP32[r7]+(r16<<2)>>2]>>2]<<3|4,1);r14=Math.imul(HEAP32[r8],r16)+r11|0;HEAP32[HEAP32[r4]+(r14<<2)>>2]=r13;r13=HEAP32[HEAP32[HEAP32[r7]+(r16<<2)>>2]>>2];r14=Math.imul(HEAP32[r8],r16)+r11|0;HEAP32[HEAP32[HEAP32[r4]+(r14<<2)>>2]>>2]=r13;r13=r11+1|0;r14=HEAP32[r8];if((r13|0)<(r14|0)){r11=r13;r15=r14}else{r17=r14;break L1861}}}else{r17=r9}}while(0);r9=HEAP32[r7];L1865:do{if((HEAP32[HEAP32[r9+(r16<<2)>>2]>>2]|0)>0){r15=0;r11=r17;r14=r9;while(1){L1868:do{if((r11|0)>0){r13=0;r18=r14;while(1){r19=HEAP32[HEAP32[r4]+(HEAP32[HEAP32[r18+(r16<<2)>>2]+(r13<<2)+4>>2]<<2)>>2];r20=_fgetc(r2);r21=_fgetc(r2);r22=_fgetc(r2);r23=_fgetc(r2);r24=r21<<8;r21=r20&63;r25=(r24|r20&192)>>>6&127;r20=(r24&57344|r22<<16)>>>13&127;r24=r22>>>4&15;if((r21|0)!=63){HEAP8[(r15<<3)+r19+4|0]=r21+36&255}if((r25|0)!=127){HEAP8[(r15<<3)+r19+5|0]=r25+1&255}if((r20|0)!=127){HEAP8[(r15<<3)+r19+6|0]=r20&255}if((r24|0)!=15){HEAP8[(r15<<3)+r19+7|0]=HEAP8[r24+5250844|0];HEAP8[(r15<<3)+r19+8|0]=r23&255}r23=r13+1|0;r19=HEAP32[r8];r24=HEAP32[r7];if((r23|0)<(r19|0)){r13=r23;r18=r24}else{r26=r19;r27=r24;break L1868}}}else{r26=r11;r27=r14}}while(0);r18=r15+1|0;if((r18|0)<(HEAP32[HEAP32[r27+(r16<<2)>>2]>>2]|0)){r15=r18;r11=r26;r14=r27}else{r28=r26;break L1865}}}else{r28=r17}}while(0);r9=r16+1|0;if((r9|0)<(HEAP32[r3]|0)){r16=r9;r6=r28}else{break L1857}}}}while(0);r28=HEAP32[r10];if((r28|0)<=0){r29=r1+1276|0,r30=r29>>2;r31=HEAP32[r30];r32=r31|545;HEAP32[r30]=r32;r33=r1+1280|0;HEAP32[r33>>2]=2;STACKTOP=r5;return 0}r3=r1+180|0;r17=0;r26=r28;while(1){r28=HEAP32[r3>>2];if((HEAP32[r28+(r17*52&-1)+32>>2]|0)==0){r34=r26}else{_load_sample(r2,2,r28+(HEAP32[HEAP32[HEAP32[r12]+(r17*764&-1)+756>>2]+40>>2]*52&-1)|0,0);r34=HEAP32[r10]}r28=r17+1|0;if((r28|0)<(r34|0)){r17=r28;r26=r34}else{break}}r29=r1+1276|0,r30=r29>>2;r31=HEAP32[r30];r32=r31|545;HEAP32[r30]=r32;r33=r1+1280|0;HEAP32[r33>>2]=2;STACKTOP=r5;return 0}function _okt_test(r1,r2,r3){var r4,r5,r6,r7;r3=STACKTOP;STACKTOP=STACKTOP+72|0;r4=r3;r5=r3+64|0;L1896:do{if(_fread(r5,1,8,r1)>>>0<8){r6=-1}else{if((_strncmp(r5,5262560,8)|0)!=0){r6=-1;break}r7=r4|0;if((r2|0)==0){r6=0;break}HEAP8[r2]=0;_fread(r7,1,0,r1);HEAP8[r7]=0;HEAP8[r2]=0;_strncpy(r2,r7,0);if(HEAP8[r2]<<24>>24==0){r6=0;break}while(1){r7=r2+(_strlen(r2)-1)|0;if(HEAP8[r7]<<24>>24!=32){r6=0;break L1896}HEAP8[r7]=0;if(HEAP8[r2]<<24>>24==0){r6=0;break L1896}}}}while(0);STACKTOP=r3;return r6}function _okt_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r4=STACKTOP;STACKTOP=STACKTOP+296|0;_fseek(r2,r3,0);_fseek(r2,8,1);r3=_malloc(16);if((r3|0)==0){r5=-1;STACKTOP=r4;return r5}r6=r3;r7=r3;HEAP32[r7>>2]=r6;r8=(r3+4|0)>>2;HEAP32[r8]=r6;HEAP32[r3+8>>2]=4;HEAP32[r3+12>>2]=0;r9=r4;_memset(r9,0,296);r10=_malloc(20);HEAP8[r10]=HEAP8[5267092];HEAP8[r10+1|0]=HEAP8[5267093|0];HEAP8[r10+2|0]=HEAP8[5267094|0];HEAP8[r10+3|0]=HEAP8[5267095|0];HEAP8[r10+4|0]=HEAP8[5267096|0];HEAP32[r10+8>>2]=158;r11=r10+12|0;r12=r11;r13=HEAP32[r8];HEAP32[r8]=r12;HEAP32[r11>>2]=r6;HEAP32[r10+16>>2]=r13;HEAP32[r13>>2]=r12;r12=_malloc(20);HEAP8[r12]=HEAP8[5265860];HEAP8[r12+1|0]=HEAP8[5265861|0];HEAP8[r12+2|0]=HEAP8[5265862|0];HEAP8[r12+3|0]=HEAP8[5265863|0];HEAP8[r12+4|0]=HEAP8[5265864|0];HEAP32[r12+8>>2]=32;r13=r12+12|0;r10=r13;r11=HEAP32[r8];HEAP32[r8]=r10;HEAP32[r13>>2]=r6;HEAP32[r12+16>>2]=r11;HEAP32[r11>>2]=r10;r10=_malloc(20);HEAP8[r10]=HEAP8[5265092];HEAP8[r10+1|0]=HEAP8[5265093|0];HEAP8[r10+2|0]=HEAP8[5265094|0];HEAP8[r10+3|0]=HEAP8[5265095|0];HEAP8[r10+4|0]=HEAP8[5265096|0];HEAP32[r10+8>>2]=478;r11=r10+12|0;r12=r11;r13=HEAP32[r8];HEAP32[r8]=r12;HEAP32[r11>>2]=r6;HEAP32[r10+16>>2]=r13;HEAP32[r13>>2]=r12;r12=_malloc(20);HEAP8[r12]=HEAP8[5264480];HEAP8[r12+1|0]=HEAP8[5264481|0];HEAP8[r12+2|0]=HEAP8[5264482|0];HEAP8[r12+3|0]=HEAP8[5264483|0];HEAP8[r12+4|0]=HEAP8[5264484|0];HEAP32[r12+8>>2]=460;r13=r12+12|0;r10=r13;r11=HEAP32[r8];HEAP32[r8]=r10;HEAP32[r13>>2]=r6;HEAP32[r12+16>>2]=r11;HEAP32[r11>>2]=r10;r10=_malloc(20);HEAP8[r10]=HEAP8[5263936];HEAP8[r10+1|0]=HEAP8[5263937|0];HEAP8[r10+2|0]=HEAP8[5263938|0];HEAP8[r10+3|0]=HEAP8[5263939|0];HEAP8[r10+4|0]=HEAP8[5263940|0];HEAP32[r10+8>>2]=316;r11=r10+12|0;r12=r11;r13=HEAP32[r8];HEAP32[r8]=r12;HEAP32[r11>>2]=r6;HEAP32[r10+16>>2]=r13;HEAP32[r13>>2]=r12;r12=_malloc(20);HEAP8[r12]=HEAP8[5263320];HEAP8[r12+1|0]=HEAP8[5263321|0];HEAP8[r12+2|0]=HEAP8[5263322|0];HEAP8[r12+3|0]=HEAP8[5263323|0];HEAP8[r12+4|0]=HEAP8[5263324|0];HEAP32[r12+8>>2]=136;r13=r12+12|0;r10=r13;r11=HEAP32[r8];HEAP32[r8]=r10;HEAP32[r13>>2]=r6;HEAP32[r12+16>>2]=r11;HEAP32[r11>>2]=r10;r10=_malloc(20);HEAP8[r10]=HEAP8[5263016];HEAP8[r10+1|0]=HEAP8[5263017|0];HEAP8[r10+2|0]=HEAP8[5263018|0];HEAP8[r10+3|0]=HEAP8[5263019|0];HEAP8[r10+4|0]=HEAP8[5263020|0];HEAP32[r10+8>>2]=190;r11=r10+12|0;r12=r11;r13=HEAP32[r8];HEAP32[r8]=r12;HEAP32[r11>>2]=r6;HEAP32[r10+16>>2]=r13;HEAP32[r13>>2]=r12;r12=_malloc(20);HEAP8[r12]=HEAP8[5262776];HEAP8[r12+1|0]=HEAP8[5262777|0];HEAP8[r12+2|0]=HEAP8[5262778|0];HEAP8[r12+3|0]=HEAP8[5262779|0];HEAP8[r12+4|0]=HEAP8[5262780|0];HEAP32[r12+8>>2]=260;r13=r12+12|0;r10=r13;r11=HEAP32[r8];HEAP32[r8]=r10;HEAP32[r13>>2]=r6;HEAP32[r12+16>>2]=r11;HEAP32[r11>>2]=r10;_set_type(r1,5264488,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));L1908:do{if((_feof(r2)|0)==0){while(1){_iff_chunk(r3,r1,r2,r9);if((_feof(r2)|0)!=0){break L1908}}}}while(0);r2=HEAP32[r7>>2];L1912:do{if((r2|0)!=(r6|0)){r7=r2;while(1){r9=r7-16+4|0;r1=HEAP32[r9+12>>2];r10=HEAP32[r9+16>>2];HEAP32[r1+4>>2]=r10;HEAP32[r10>>2]=r1;r1=HEAP32[r7>>2];_free(r9);if((r1|0)==(r6|0)){break L1912}else{r7=r1}}}}while(0);_free(r3);r5=0;STACKTOP=r4;return r5}function _get_cmod(r1,r2,r3,r4){var r5,r6;r4=(r1+136|0)>>2;HEAP32[r4]=0;r2=_fgetc(r3)&65535;r5=(_fgetc(r3)&255|r2<<8)<<16>>16!=0&1;r2=HEAP32[r4];while(1){HEAP32[r1+(r2*12&-1)+184>>2]=0;r6=HEAP32[r4]+1|0;HEAP32[r4]=r6;if((r5|0)>0){r5=r5-1|0;r2=r6}else{break}}r2=_fgetc(r3)&65535;r5=(_fgetc(r3)&255|r2<<8)<<16>>16!=0&1;r2=HEAP32[r4];while(1){HEAP32[r1+(r2*12&-1)+184>>2]=255;r6=HEAP32[r4]+1|0;HEAP32[r4]=r6;if((r5|0)>0){r5=r5-1|0;r2=r6}else{break}}r2=_fgetc(r3)&65535;r5=(_fgetc(r3)&255|r2<<8)<<16>>16!=0&1;r2=HEAP32[r4];while(1){HEAP32[r1+(r2*12&-1)+184>>2]=255;r6=HEAP32[r4]+1|0;HEAP32[r4]=r6;if((r5|0)>0){r5=r5-1|0;r2=r6}else{break}}r2=_fgetc(r3)&65535;r5=(_fgetc(r3)&255|r2<<8)<<16>>16!=0&1;r2=HEAP32[r4];while(1){HEAP32[r1+(r2*12&-1)+184>>2]=0;r3=HEAP32[r4]+1|0;HEAP32[r4]=r3;if((r5|0)>0){r5=r5-1|0;r2=r3}else{break}}return}function _get_samp458(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16;r5=0;r6=(r2|0)/32&-1;r2=(r1+140|0)>>2;HEAP32[r2]=r6;r7=r1+144|0;HEAP32[r7>>2]=r6;r8=(r1+176|0)>>2;HEAP32[r8]=_calloc(764,r6);r6=HEAP32[r7>>2];if((r6|0)!=0){HEAP32[r1+180>>2]=_calloc(52,r6)}if((HEAP32[r2]|0)<=0){return}r6=(r1+180|0)>>2;r1=r4;r7=r4+144|0;r4=0;r9=0;while(1){r10=_calloc(64,1);HEAP32[HEAP32[r8]+(r9*764&-1)+756>>2]=r10;_fread(HEAP32[r8]+(r9*764&-1)|0,1,20,r3);r10=HEAP32[r8];r11=r10+(r9*764&-1)|0;r12=HEAP8[r11];L1939:do{if(r12<<24>>24!=0){r13=0;r14=r12;while(1){r15=r10+(r9*764&-1)+r13|0;do{if((_isprint(r14<<24>>24)|0)==0){r5=1360}else{if(HEAP8[r15]<<24>>24<0){r5=1360;break}else{break}}}while(0);if(r5==1360){r5=0;HEAP8[r15]=32}r16=r13+1|0;if(r16>>>0>=_strlen(r11)>>>0){break}r13=r16;r14=HEAP8[r10+(r9*764&-1)+r16|0]}if(HEAP8[r11]<<24>>24==0){break}while(1){r14=_strlen(r11)-1+r10+(r9*764&-1)|0;if(HEAP8[r14]<<24>>24!=32){break L1939}HEAP8[r14]=0;if(HEAP8[r11]<<24>>24==0){break L1939}}}}while(0);r11=_fgetc(r3);r10=_fgetc(r3);r12=r10<<16&16711680|r11<<24|_fgetc(r3)<<8&65280|_fgetc(r3)&254;HEAP32[HEAP32[r6]+(r9*52&-1)+32>>2]=r12;r12=_fgetc(r3);r11=_fgetc(r3)&255|r12<<8&65280;HEAP32[HEAP32[r6]+(r9*52&-1)+36>>2]=r11;r11=_fgetc(r3)&65535;r12=_fgetc(r3)&255|r11<<8;r11=HEAP32[r6];HEAP32[r11+(r9*52&-1)+40>>2]=(r12&65535)+HEAP32[r11+(r9*52&-1)+36>>2]|0;r11=_fgetc(r3);r10=_fgetc(r3)&255|r11<<8&65280;HEAP32[HEAP32[HEAP32[r8]+(r9*764&-1)+756>>2]>>2]=r10;r10=_fgetc(r3);HEAP32[r1+(r9<<2)>>2]=_fgetc(r3)&255|r10<<8&65280;HEAP32[HEAP32[r8]+(r9*764&-1)+36>>2]=(HEAP32[HEAP32[r6]+(r9*52&-1)+32>>2]|0)!=0&1;HEAP32[HEAP32[r6]+(r9*52&-1)+44>>2]=(r12&65535)>2?2:0;HEAP32[HEAP32[HEAP32[r8]+(r9*764&-1)+756>>2]+8>>2]=128;HEAP32[HEAP32[HEAP32[r8]+(r9*764&-1)+756>>2]+40>>2]=r4;HEAP32[r7+(r4<<2)>>2]=r9;r12=r9+1|0;if((r12|0)<(HEAP32[r2]|0)){r4=((HEAP32[HEAP32[r8]+(r9*764&-1)+36>>2]|0)!=0&1)+r4|0;r9=r12}else{break}}return}function _get_spee(r1,r2,r3,r4){r4=_fgetc(r3);HEAP32[r1+148>>2]=_fgetc(r3)&255|r4<<8&65280;HEAP32[r1+152>>2]=125;return}function _get_slen(r1,r2,r3,r4){r4=_fgetc(r3);r2=_fgetc(r3)&255|r4<<8&65280;HEAP32[r1+128>>2]=r2;HEAP32[r1+132>>2]=Math.imul(r2,HEAP32[r1+136>>2]);return}function _get_plen459(r1,r2,r3,r4){r4=_fgetc(r3);HEAP32[r1+156>>2]=_fgetc(r3)&255|r4<<8&65280;return}function _get_patt460(r1,r2,r3,r4){_fread(r1+952|0,1,HEAP32[r1+156>>2],r3);return}function _get_pbod461(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r2=(r4+288|0)>>2;r4=HEAP32[r2];r5=r1+128|0;if((r4|0)>=(HEAP32[r5>>2]|0)){return}if((r4|0)==0){HEAP32[r1+172>>2]=_calloc(4,HEAP32[r1+132>>2]);r4=r1+168|0;HEAP32[r4>>2]=_calloc(4,HEAP32[r5>>2]+1|0);r5=r4,r6=r5>>2}else{r5=r1+168|0,r6=r5>>2}r5=_fgetc(r3);r4=_fgetc(r3)&255;r7=(r1+136|0)>>2;r8=_calloc(1,(HEAP32[r7]<<2)+4|0);HEAP32[HEAP32[r6]+(HEAP32[r2]<<2)>>2]=r8;r8=r4|r5<<8&65280;HEAP32[HEAP32[HEAP32[r6]+(HEAP32[r2]<<2)>>2]>>2]=r8;r5=HEAP32[r7];L1966:do{if((r5|0)>0){r4=r1+172|0;r9=0;r10=r5;while(1){r11=HEAP32[r2];r12=Math.imul(r11,r10)+r9|0;HEAP32[HEAP32[HEAP32[r6]+(r11<<2)>>2]+(r9<<2)+4>>2]=r12;r12=_calloc(HEAP32[HEAP32[HEAP32[r6]+(HEAP32[r2]<<2)>>2]>>2]<<3|4,1);r11=Math.imul(HEAP32[r7],HEAP32[r2])+r9|0;HEAP32[HEAP32[r4>>2]+(r11<<2)>>2]=r12;r12=HEAP32[r2];r11=HEAP32[HEAP32[HEAP32[r6]+(r12<<2)>>2]>>2];r13=Math.imul(HEAP32[r7],r12)+r9|0;HEAP32[HEAP32[HEAP32[r4>>2]+(r13<<2)>>2]>>2]=r11;r11=r9+1|0;r13=HEAP32[r7];if((r11|0)<(r13|0)){r9=r11;r10=r13}else{r14=r13;break L1966}}}else{r14=r5}}while(0);L1971:do{if((Math.imul(r14,r8)|0)>0){r5=r1+172|0;r10=0;r9=r14;while(1){r4=(r10|0)/(r9|0)&-1;r13=HEAP32[HEAP32[r5>>2]+(HEAP32[HEAP32[HEAP32[r6]+(HEAP32[r2]<<2)>>2]+((r10|0)%(r9|0)<<2)+4>>2]<<2)>>2];r11=(r4<<3)+r13+4|0;r12=r11;r15=r12|0;tempBigInt=0;HEAP8[r15]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r15+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r15+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r15+3|0]=tempBigInt&255;r15=r12+4|0;tempBigInt=0;HEAP8[r15]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r15+1|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r15+2|0]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r15+3|0]=tempBigInt&255;r15=_fgetc(r3)&255;r12=_fgetc(r3);if(r15<<24>>24!=0){HEAP8[r11|0]=r15+48&255;HEAP8[(r4<<3)+r13+5|0]=(r12&255)+1&255}r12=(r4<<3)+r13+7|0;HEAP8[r12]=HEAP32[((_fgetc(r3)&255)<<2)+5250716>>2]&255;r15=_fgetc(r3)&255;r11=(r4<<3)+r13+8|0;HEAP8[r11]=r15;r13=HEAP8[r12];do{if(r13<<24>>24==12&(r15&255)>64){if((r15&255)<81){HEAP8[r12]=10;HEAP8[r11]=r15-64&255;break}if((r15&255)<97){HEAP8[r12]=10;HEAP8[r11]=r15<<4;break}if((r15&255)<113){HEAP8[r12]=14;HEAP8[r11]=r15+32&255|-80;break}if((r15&255)>=129){break}HEAP8[r12]=14;HEAP8[r11]=r15+16&255|-96}else{if(r13<<24>>24==-1){HEAP8[r11]=0;HEAP8[r12]=0;break}else if(r13<<24>>24==0){HEAP8[r11]=(24-((r15&255)>>>4)&255)%12<<4|r15&15;break}else{break}}}while(0);r15=r10+1|0;r11=HEAP32[r7];if((r15|0)<(Math.imul(r11,r8)|0)){r10=r15;r9=r11}else{break L1971}}}}while(0);HEAP32[r2]=HEAP32[r2]+1|0;return}function _get_sbod(r1,r2,r3,r4){var r5,r6,r7;r2=(r4+292|0)>>2;r5=HEAP32[r2];if((r5|0)>=(HEAP32[r1+140>>2]|0)){return}r6=HEAP32[r4+(r5<<2)+144>>2];r5=HEAP32[r4+(r6<<2)>>2];if((r5|0)==0|(r5|0)==2){r7=8}else{r7=0}_load_sample(r3,r7,HEAP32[r1+180>>2]+(r6*52&-1)|0,0);HEAP32[r2]=HEAP32[r2]+1|0;return}function _polly_test(r1,r2,r3){var r4,r5,r6,r7;r3=0;if((_fgetc(r1)&255)<<24>>24!=-82){r4=-1;return r4}r5=_malloc(65536);if((r5|0)==0){r4=-1;return r4}_decode_rle(r5,r1);r1=r5+7936|0;r6=0;while(1){if(HEAP8[r6+(r5+7936)|0]<<24>>24!=0){if(HEAPU8[r1]<224){r3=1413;break}}r7=r6+1|0;if((r7|0)<128){r6=r7}else{break}}if(r3==1413){_free(r5);r4=-1;return r4}do{if((r2|0)!=0){_memcpy(r2,r5+8096|0,16);HEAP8[r2+16|0]=0;r3=r2+15|0;if(HEAP8[r3]<<24>>24!=32){break}HEAP8[r3]=0;r3=r2+14|0;if(HEAP8[r3]<<24>>24!=32){break}HEAP8[r3]=0;r3=r2+13|0;if(HEAP8[r3]<<24>>24!=32){break}HEAP8[r3]=0;r3=r2+12|0;if(HEAP8[r3]<<24>>24!=32){break}HEAP8[r3]=0;r3=r2+11|0;if(HEAP8[r3]<<24>>24!=32){break}HEAP8[r3]=0;r3=r2+10|0;if(HEAP8[r3]<<24>>24!=32){break}HEAP8[r3]=0;r3=r2+9|0;if(HEAP8[r3]<<24>>24!=32){break}HEAP8[r3]=0;r3=r2+8|0;if(HEAP8[r3]<<24>>24!=32){break}HEAP8[r3]=0;r3=r2+7|0;if(HEAP8[r3]<<24>>24!=32){break}HEAP8[r3]=0;r3=r2+6|0;if(HEAP8[r3]<<24>>24!=32){break}HEAP8[r3]=0;r3=r2+5|0;if(HEAP8[r3]<<24>>24!=32){break}HEAP8[r3]=0;r3=r2+4|0;if(HEAP8[r3]<<24>>24!=32){break}HEAP8[r3]=0;r3=r2+3|0;if(HEAP8[r3]<<24>>24!=32){break}HEAP8[r3]=0;r3=r2+2|0;if(HEAP8[r3]<<24>>24!=32){break}HEAP8[r3]=0;r3=r2+1|0;if(HEAP8[r3]<<24>>24!=32){break}HEAP8[r3]=0;if(HEAP8[r2]<<24>>24!=32){break}HEAP8[r2]=0}}while(0);_free(r5);r4=0;return r4}function _test_pru2(r1,r2,r3){var r4,r5,r6;L2042:do{if((r3|0)<260){r4=260-r3|0}else{if(HEAP8[r1]<<24>>24!=83){r4=-1;break}if(HEAP8[r1+1|0]<<24>>24!=78){r4=-1;break}if(HEAP8[r1+2|0]<<24>>24!=84){r4=-1;break}if(HEAP8[r1+3|0]<<24>>24==33){r5=0}else{r4=-1;break}while(1){if((r5|0)>=31){r6=0;break}if(HEAPU8[(r5<<3)+r1+11|0]>64){r4=-1;break L2042}else{r5=r5+1|0}}while(1){if((r6|0)>=31){break}if(HEAPU8[(r6<<3)+r1+10|0]>15){r4=-1;break L2042}else{r6=r6+1|0}}if((r2|0)==0){r4=0;break}HEAP8[r2]=0;r4=0}}while(0);return r4}function _polly_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;r4=STACKTOP;_fseek(r2,r3,0);_fgetc(r2);r3=_calloc(1,65536);if((r3|0)==0){r5=-1;STACKTOP=r4;return r5}_decode_rle(r3,r2);r2=HEAP8[r3+7936|0];L2061:do{if(r2<<24>>24==0){r6=0}else{r7=0;r8=r2;while(1){HEAP8[r1+(r7+952)|0]=r8+32&255;r9=r7+1|0;r10=HEAP8[r7+(r3+7937)|0];if((r9|0)<128&r10<<24>>24!=0){r7=r9;r8=r10}else{r6=r9;break L2061}}}}while(0);r2=r1+156|0;HEAP32[r2>>2]=r6;_memcpy(r1|0,r3+8096|0,16);_set_type(r1,5264392,(tempInt=STACKTOP,STACKTOP=STACKTOP+1|0,STACKTOP=STACKTOP+3>>2<<2,HEAP32[tempInt>>2]=0,tempInt));HEAP32[r1+148>>2]=3;HEAP32[r1+152>>2]=Math.floor(((HEAPU8[r3+8129|0]*125&-1)>>>0)/136);r6=(r1+128|0)>>2;HEAP32[r6]=0;r8=HEAP32[r2>>2];L2065:do{if((r8|0)>0){r2=0;r7=0;while(1){r9=HEAPU8[r1+(r2+952)|0];if((r9|0)>(r7|0)){HEAP32[r6]=r9;r11=r9}else{r11=r7}r9=r2+1|0;if((r9|0)<(r8|0)){r2=r9;r7=r11}else{r12=r11;break L2065}}}else{r12=0}}while(0);r11=r12+1|0;HEAP32[r6]=r11;r12=(r1+136|0)>>2;HEAP32[r12]=4;r8=r11<<2;HEAP32[r1+132>>2]=r8;r11=(r1+172|0)>>2;HEAP32[r11]=_calloc(4,r8);r8=(r1+168|0)>>2;HEAP32[r8]=_calloc(4,HEAP32[r6]+1|0);L2072:do{if((HEAP32[r6]|0)>0){r7=0;while(1){r2=_calloc(1,(HEAP32[r12]<<2)+4|0);HEAP32[HEAP32[r8]+(r7<<2)>>2]=r2;HEAP32[HEAP32[HEAP32[r8]+(r7<<2)>>2]>>2]=64;r2=HEAP32[r12];L2075:do{if((r2|0)>0){r9=0;r10=r2;while(1){r13=Math.imul(r10,r7)+r9|0;HEAP32[HEAP32[HEAP32[r8]+(r7<<2)>>2]+(r9<<2)+4>>2]=r13;r13=_calloc(HEAP32[HEAP32[HEAP32[r8]+(r7<<2)>>2]>>2]<<3|4,1);r14=Math.imul(HEAP32[r12],r7)+r9|0;HEAP32[HEAP32[r11]+(r14<<2)>>2]=r13;r13=HEAP32[HEAP32[HEAP32[r8]+(r7<<2)>>2]>>2];r14=Math.imul(HEAP32[r12],r7)+r9|0;HEAP32[HEAP32[HEAP32[r11]+(r14<<2)>>2]>>2]=r13;r13=r9+1|0;r14=HEAP32[r12];if((r13|0)<(r14|0)){r9=r13;r10=r14}else{break L2075}}}}while(0);r2=r7<<8;r10=0;while(1){r9=(r10<<2)+r2|0;r14=HEAP8[r3+r9|0];r13=HEAP32[HEAP32[r11]+(HEAP32[HEAP32[HEAP32[r8]+(r7<<2)>>2]+4>>2]<<2)>>2];if(r14<<24>>24==-16){HEAP8[(r10<<3)+r13+7|0]=13;HEAP8[(r10<<3)+r13+8|0]=0}else{r15=r14&15;HEAP8[(r10<<3)+r13+4|0]=r15<<24>>24==0?0:r15|48;HEAP8[(r10<<3)+r13+5|0]=(r14&255)>>>4}r14=HEAP8[r3+(r9|1)|0];r13=HEAP32[HEAP32[r11]+(HEAP32[HEAP32[HEAP32[r8]+(r7<<2)>>2]+8>>2]<<2)>>2];if(r14<<24>>24==-16){HEAP8[(r10<<3)+r13+7|0]=13;HEAP8[(r10<<3)+r13+8|0]=0}else{r15=r14&15;HEAP8[(r10<<3)+r13+4|0]=r15<<24>>24==0?0:r15|48;HEAP8[(r10<<3)+r13+5|0]=(r14&255)>>>4}r14=HEAP8[r3+(r9|2)|0];r13=HEAP32[HEAP32[r11]+(HEAP32[HEAP32[HEAP32[r8]+(r7<<2)>>2]+12>>2]<<2)>>2];if(r14<<24>>24==-16){HEAP8[(r10<<3)+r13+7|0]=13;HEAP8[(r10<<3)+r13+8|0]=0}else{r15=r14&15;HEAP8[(r10<<3)+r13+4|0]=r15<<24>>24==0?0:r15|48;HEAP8[(r10<<3)+r13+5|0]=(r14&255)>>>4}r14=HEAP8[r3+(r9|3)|0];r9=HEAP32[HEAP32[r11]+(HEAP32[HEAP32[HEAP32[r8]+(r7<<2)>>2]+16>>2]<<2)>>2];if(r14<<24>>24==-16){HEAP8[(r10<<3)+r9+7|0]=13;HEAP8[(r10<<3)+r9+8|0]=0}else{r13=r14&15;HEAP8[(r10<<3)+r9+4|0]=r13<<24>>24==0?0:r13|48;HEAP8[(r10<<3)+r9+5|0]=(r14&255)>>>4}r14=r10+1|0;if((r14|0)==64){break}else{r10=r14}}r10=r7+1|0;if((r10|0)<(HEAP32[r6]|0)){r7=r10}else{break L2072}}}}while(0);r6=r1+144|0;HEAP32[r6>>2]=15;r8=(r1+140|0)>>2;HEAP32[r8]=15;r11=(r1+176|0)>>2;HEAP32[r11]=_calloc(764,15);r7=HEAP32[r6>>2];if((r7|0)==0){r6=r1+180|0,r16=r6>>2}else{r10=r1+180|0;HEAP32[r10>>2]=_calloc(52,r7);r6=r10,r16=r6>>2}r6=0;while(1){r10=_calloc(64,1);HEAP32[HEAP32[r11]+(r6*764&-1)+756>>2]=r10;if(HEAPU8[r6+(r3+8065)|0]<16){r17=0}else{r17=HEAPU8[r6+(r3+8081)|0]<<8}HEAP32[HEAP32[r16]+(r6*52&-1)+32>>2]=r17;HEAP32[HEAP32[HEAP32[r11]+(r6*764&-1)+756>>2]+16>>2]=0;HEAP32[HEAP32[HEAP32[r11]+(r6*764&-1)+756>>2]>>2]=64;HEAP32[HEAP32[r16]+(r6*52&-1)+36>>2]=0;HEAP32[HEAP32[r16]+(r6*52&-1)+40>>2]=0;HEAP32[HEAP32[r16]+(r6*52&-1)+44>>2]=0;HEAP32[HEAP32[HEAP32[r11]+(r6*764&-1)+756>>2]+8>>2]=128;HEAP32[HEAP32[HEAP32[r11]+(r6*764&-1)+756>>2]+40>>2]=r6;HEAP32[HEAP32[r11]+(r6*764&-1)+36>>2]=(HEAP32[HEAP32[r16]+(r6*52&-1)+32>>2]|0)!=0&1;HEAP32[HEAP32[r11]+(r6*764&-1)+40>>2]=4095;r10=r6+1|0;if((r10|0)==15){r18=8192;break}else{r6=r10}}while(1){r6=r3+r18|0;HEAP8[r6]=HEAP8[r6]<<2;r6=r18+1|0;if((r6|0)==65536){break}else{r18=r6}}r18=HEAP32[r8];L2111:do{if((r18|0)>0){r6=0;r17=r18;while(1){r10=HEAP32[r16];if((HEAP32[r10+(r6*52&-1)+32>>2]|0)==0){r19=r17}else{_load_sample(0,18,r10+(HEAP32[HEAP32[HEAP32[r11]+(r6*764&-1)+756>>2]+40>>2]*52&-1)|0,(HEAPU8[r6+(r3+8065)|0]<<8)+r3+4096|0);r19=HEAP32[r8]}r10=r6+1|0;if((r10|0)<(r19|0)){r6=r10;r17=r19}else{break L2111}}}}while(0);_free(r3);L2118:do{if((HEAP32[r12]|0)>0){r3=0;while(1){HEAP32[r1+(r3*12&-1)+184>>2]=128;r19=r3+1|0;if((r19|0)<(HEAP32[r12]|0)){r3=r19}else{break L2118}}}}while(0);r12=r1+1276|0;HEAP32[r12>>2]=HEAP32[r12>>2]|8192;r5=0;STACKTOP=r4;return r5}function _decode_rle(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10;r3=0;r4=0;while(1){r5=_fgetc(r2)&255;if((_feof(r2)|0)!=0){r3=1505;break}do{if(r5<<24>>24==-82){r6=_fgetc(r2);if((r6&255)<<24>>24==1){HEAP8[r1+r4|0]=-82;r7=r4+1|0;break}r8=_fgetc(r2);if(!((r6&255|0)!=0&(r4|0)<65536)){r7=r4;break}r9=-(r6&255)|0;r6=r4-65536|0;r10=r6>>>0<r9>>>0?r9:r6;_memset(r1+r4|0,r8&255,-r10|0);r7=r4-r10|0}else{HEAP8[r1+r4|0]=r5;r7=r4+1|0}}while(0);if((r7|0)<65536){r4=r7}else{r3=1506;break}}if(r3==1506){return}else if(r3==1505){return}}function _pw_wizardry(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r4=STACKTOP;STACKTOP=STACKTOP+96|0;r5=r4;r6=r4+72;r7=_fdopen(_dup(r1),5263292);L2139:do{if((r7|0)==0){r8=-1}else{r1=_fdopen(_dup(r2),5265792);if((_fstat(_fileno(r7),r5)|0)<0){r8=-2;break}r9=HEAP32[r5+28>>2];if((r9|0)<2048){r8=-2;break}r10=_malloc(r9+4096|0);if((r10|0)==0){_perror(5265832);r8=-1;break}_fread(r10,r9,1,r7);r11=r6|0;r12=0;while(1){if((r12|0)==40){r8=-1;break L2139}r13=HEAP32[(r12<<2)+5248452>>2]>>2;if((FUNCTION_TABLE[HEAP32[r13+1]](r10,r11,r9)|0)>-1){break}else{r12=r12+1|0}}_fseek(r7,0,0);if((FUNCTION_TABLE[HEAP32[r13+2]](r7,r1)|0)<0){r8=-1;break}_fclose(r1);_fclose(r7);_free(r10);if((r3|0)==0){r8=0;break}HEAP32[r3>>2]=HEAP32[r13];r8=0}}while(0);STACKTOP=r4;return r8}function _test_pru1(r1,r2,r3){var r4;do{if((r3|0)<1080){r4=1080-r3|0}else{if(HEAP8[r1+1080|0]<<24>>24!=83){r4=-1;break}if(HEAP8[r1+1081|0]<<24>>24!=78){r4=-1;break}if(HEAP8[r1+1082|0]<<24>>24!=84){r4=-1;break}if(HEAP8[r1+1083|0]<<24>>24!=46){r4=-1;break}if(HEAP8[r1+951|0]<<24>>24!=127){r4=-1;break}if(HEAP8[r1+950|0]<<24>>24<0){r4=-1;break}if((r2|0)==0){r4=0;break}if((r1|0)==0){HEAP8[r2]=0;r4=0;break}else{_memcpy(r2,r1,20);HEAP8[r2+20|0]=0;r4=0;break}}}while(0);return r4}function _depack_pru1(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r3=STACKTOP;STACKTOP=STACKTOP+3072|0;r4=r3;r5=r3+1024;r6=r5|0;_memset(r6,0,2048);_fread(r6,950,1,r1);_fwrite(r6,950,1,r2);r7=0;r8=0;while(1){r9=r8*30&-1;r10=((HEAPU8[r9+(r5+42)|0]<<8|HEAPU8[r9+(r5+43)|0])<<1)+r7|0;r9=r8+1|0;if((r9|0)==31){break}else{r7=r10;r8=r9}}_fputc(_fgetc(r1)&255,r2);_memset(r6,0,2048);_fread(r6,129,1,r1);_fwrite(r6,129,1,r2);_fputc(77,r2);_fputc(46,r2);_fputc(75,r2);_fputc(46,r2);r8=0;r7=1;while(1){r11=HEAP8[r5+r7|0];r9=r7+1|0;if((r9|0)==129){break}else{r8=(r11&255)>(r8&255)?r11:r8;r7=r9}}_fseek(r1,1084,0);r7=r5+2|0;r9=(((r8&255)>(r11&255)?r8:r11)&255)+1|0;r11=0;while(1){r8=0;while(1){r12=_fgetc(r1);r13=r12&255;r14=_fgetc(r1);r15=_fgetc(r1);r16=_fgetc(r1);r17=r14&255;r18=HEAP8[(r17<<1)+5249009|0];_fputc((HEAP8[(r17<<1)+5249008|0]|r13&-16)&255,r2);_fputc(r18&255,r2);_fputc((r12<<4|r15)&255,r2);_fputc(r16&255,r2);r12=r8+1|0;if((r12|0)==256){break}else{r8=r12}}r8=r11+1|0;if((r8|0)==(r9|0)){break}else{r11=r8}}HEAP8[r6]=r13;HEAP8[r5+1|0]=r14&255;HEAP8[r7]=r15&255;HEAP8[r5+3|0]=r16&255;r16=r4|0;r4=r10;while(1){r10=_fread(r16,1,(r4|0)>1024?1024:r4,r1);_fwrite(r16,1,r10,r2);r5=r4-r10|0;if((r10|0)>0&(r5|0)>0){r4=r5}else{break}}STACKTOP=r3;return 0}function _test_skyt(r1,r2,r3){var r4,r5,r6;r4=0;if((r3|0)<260){r5=260-r3|0;return r5}else{r6=0}while(1){if((r6|0)>=31){break}if(HEAPU8[r1+(r6<<3|4)|0]>64){r5=-1;r4=1555;break}else{r6=r6+1|0}}if(r4==1555){return r5}if((HEAPU8[r1+257|0]<<16|HEAPU8[r1+256|0]<<24|HEAPU8[r1+258|0]<<8|HEAPU8[r1+259|0]|0)!=1397446996){r5=-1;return r5}if((r2|0)==0){r5=0;return r5}HEAP8[r2]=0;r5=0;return r5}function _depack_pru2(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49,r50,r51,r52,r53,r54,r55,r56,r57,r58,r59,r60,r61,r62,r63,r64,r65,r66,r67,r68,r69,r70,r71;r3=STACKTOP;STACKTOP=STACKTOP+1040|0;r4=r3+1024;r5=r3|0;_memset(r5,0,20);_fwrite(r5,1,20,r2);_fseek(r1,8,0);r6=0;r7=0;while(1){_memset(r5,0,22);_fwrite(r5,1,22,r2);r8=_fgetc(r1);r9=_fgetc(r1)&255;_fputc(r8&255,r2);_fputc(r9,r2);r10=((r9|r8<<8&65280)<<1)+r6|0;_fputc(_fgetc(r1)&255,r2);_fputc(_fgetc(r1)&255,r2);r8=_fgetc(r1);r9=_fgetc(r1)&255;_fputc(r8&255,r2);_fputc(r9,r2);r9=_fgetc(r1);r8=_fgetc(r1)&255;_fputc(r9&255,r2);_fputc(r8,r2);r8=r7+1|0;if((r8|0)==31){break}else{r6=r10;r7=r8}}_fputc(_fgetc(r1)&255,r2);_fputc(_fgetc(r1)&255,r2);r7=0;r6=0;while(1){r8=_fgetc(r1);r11=r8&255;_fputc(r8&255,r2);r8=r6+1|0;if((r8|0)==128){break}else{r7=(r11&255)>(r7&255)?r11:r7;r6=r8}}_fputc(77,r2);_fputc(46,r2);_fputc(75,r2);_fputc(46,r2);_fseek(r1,770,0);r6=r4+4|0;r8=r4|0;r9=r4+5|0;r12=r4+1|0;r13=r4+6|0;r14=r4+2|0;r15=r4+7|0;r16=r4+3|0;r17=r4+8|0;r18=r4+9|0;r19=r4+10|0;r20=r4+11|0;r21=r4+12|0;r22=r4+13|0;r23=r4+14|0;r24=r4+15|0;r4=(((r7&255)>(r11&255)?r7:r11)&255)+1|0;r11=0;r7=0;r25=0;r26=0;r27=0;r28=0;r29=0;r30=0;r31=0;r32=0;r33=0;r34=0;r35=0;while(1){r36=0;r37=r7;r38=r25;r39=r26;r40=r27;r41=r28;r42=r29;r43=r30;r44=r31;r45=r32;r46=r33;r47=r34;r48=r35;while(1){r49=_fgetc(r1);r50=r49&255;if(r50<<24>>24==-128){_fputc(0,r2);_fputc(0,r2);_fputc(0,r2);_fputc(0,r2);r51=0;r52=0;r53=0;r54=0;r55=r37;r56=r38;r57=r39;r58=r40;r59=r41;r60=r42;r61=r43;r62=r44;r63=r45;r64=r46;r65=r47;r66=r48}else if(r50<<24>>24==-64){_fwrite(r8,4,1,r2);r51=HEAP8[r16];r52=HEAP8[r14];r53=HEAP8[r12];r54=HEAP8[r8];r55=HEAP8[r6];r56=HEAP8[r9];r57=HEAP8[r13];r58=HEAP8[r15];r59=HEAP8[r17];r60=HEAP8[r18];r61=HEAP8[r19];r62=HEAP8[r20];r63=HEAP8[r21];r64=HEAP8[r22];r65=HEAP8[r23];r66=HEAP8[r24]}else{r67=_fgetc(r1)&255;r68=_fgetc(r1);r69=r49>>>1&127;r49=(r67&255)>>>3&16|HEAP8[(r69<<1)+5249008|0];r70=HEAP8[(r69<<1)+5249009|0];r69=r67&15|r50<<4&16|r67<<1&-32;_fputc(r49&255,r2);_fputc(r70&255,r2);_fputc(r69&255,r2);_fputc(r68&255,r2);r51=r68&255;r52=r69;r53=r70;r54=r49;r55=r37;r56=r38;r57=r39;r58=r40;r59=r41;r60=r42;r61=r43;r62=r44;r63=r45;r64=r46;r65=r47;r66=r48}HEAP8[r8]=r55;HEAP8[r12]=r56;HEAP8[r14]=r57;HEAP8[r16]=r58;HEAP8[r6]=r59;HEAP8[r9]=r60;HEAP8[r13]=r61;HEAP8[r15]=r62;HEAP8[r17]=r63;HEAP8[r18]=r64;HEAP8[r19]=r65;HEAP8[r20]=r66;HEAP8[r21]=r54;HEAP8[r22]=r53;HEAP8[r23]=r52;HEAP8[r24]=r51;r49=r36+1|0;if((r49|0)==256){break}else{r36=r49;r37=r59;r38=r60;r39=r61;r40=r62;r41=r63;r42=r64;r43=r65;r44=r66;r45=r54;r46=r53;r47=r52;r48=r51}}r48=r11+1|0;if((r48|0)==(r4|0)){r71=r10;break}else{r11=r48;r7=r59;r25=r60;r26=r61;r27=r62;r28=r63;r29=r64;r30=r65;r31=r66;r32=r54;r33=r53;r34=r52;r35=r51}}while(1){r51=_fread(r5,1,(r71|0)>1024?1024:r71,r1);_fwrite(r5,1,r51,r2);r35=r71-r51|0;if((r51|0)>0&(r35|0)>0){r71=r35}else{break}}STACKTOP=r3;return 0}function _depack_skyt(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23;r3=STACKTOP;STACKTOP=STACKTOP+4096|0;r4=r3+1024;r5=r3+2048,r6=r5>>2;_memset(r5,0,512);r5=r3|0;_memset(r5,0,20);_fwrite(r5,1,20,r2);r7=0;r8=0;while(1){_memset(r5,0,22);_fwrite(r5,1,22,r2);r9=_fgetc(r1);r10=_fgetc(r1)&255;_fputc(r9&255,r2);_fputc(r10,r2);r11=((r10|r9<<8&65280)<<1)+r7|0;_fputc(_fgetc(r1)&255,r2);_fputc(_fgetc(r1)&255,r2);r9=_fgetc(r1);r10=_fgetc(r1)&255;_fputc(r9&255,r2);_fputc(r10,r2);r10=_fgetc(r1);r9=_fgetc(r1)&255;_fputc(r10&255,r2);_fputc(r9,r2);r9=r8+1|0;if((r9|0)==31){break}else{r7=r11;r8=r9}}_fgetc(r1);_fgetc(r1);_fgetc(r1);_fgetc(r1);_fgetc(r1);_fgetc(r1);_fgetc(r1);_fgetc(r1);_fgetc(r1);_fgetc(r1);_fgetc(r1);_fgetc(r1);r8=_fgetc(r1)+1&255;_fputc(r8,r2);_fputc(127,r2);r7=(r8|0)==0;L2225:do{if(r7){r12=0}else{r9=0;while(1){r10=_fgetc(r1);HEAP32[(r9<<4>>2)+r6]=_fgetc(r1)&255|r10<<8&65280;r10=_fgetc(r1);HEAP32[((r9<<4)+4>>2)+r6]=_fgetc(r1)&255|r10<<8&65280;r10=_fgetc(r1);HEAP32[((r9<<4)+8>>2)+r6]=_fgetc(r1)&255|r10<<8&65280;r10=_fgetc(r1);HEAP32[((r9<<4)+12>>2)+r6]=_fgetc(r1)&255|r10<<8&65280;r10=r9+1|0;if((r10|0)<(r8|0)){r9=r10}else{r12=0;break L2225}}}}while(0);while(1){_fputc((r12|0)<(r8|0)?r12:0,r2);r9=r12+1|0;if((r9|0)==128){break}else{r12=r9}}_fputc(77,r2);_fputc(46,r2);_fputc(75,r2);_fputc(46,r2);_fgetc(r1);r12=_ftell(r1);L2231:do{if(r7){r13=r11}else{r9=r4|0;r10=r12-256|0;r14=0;while(1){_memset(r9,0,1024);r15=0;while(1){_fseek(r1,(HEAP32[((r14<<4)+(r15<<2)>>2)+r6]<<8)+r10|0,0);r16=r15<<2;r17=0;while(1){r18=(r17<<4)+r16|0;r19=_fgetc(r1);r20=_fgetc(r1)&255;r21=_fgetc(r1)&255;r22=_fgetc(r1)&255;r23=r19&255;HEAP8[r4+r18|0]=HEAP8[(r23<<1)+5249008|0]|r20&-16;HEAP8[r4+(r18|1)|0]=HEAP8[(r23<<1)+5249009|0];HEAP8[r4+(r18|2)|0]=r20<<4|r21;HEAP8[r4+(r18|3)|0]=r22;r22=r17+1|0;if((r22|0)==64){break}else{r17=r22}}r17=r15+1|0;if((r17|0)==4){break}else{r15=r17}}_fwrite(r9,1024,1,r2);r15=r14+1|0;if((r15|0)<(r8|0)){r14=r15}else{r13=r11;break L2231}}}}while(0);while(1){r11=_fread(r5,1,(r13|0)>1024?1024:r13,r1);_fwrite(r5,1,r11,r2);r8=r13-r11|0;if((r11|0)>0&(r8|0)>0){r13=r8}else{break}}STACKTOP=r3;return 0}function _test_starpack(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10;r3=0;r4=HEAPU8[r1+269|0];r5=HEAPU8[r1+268|0]<<8|r4;if((r4&3|0)!=0){r6=-1;return r6}if((r5&65532|0)==0|r5>>>0>511){r6=-1;return r6}if(HEAP8[r1+784|0]<<24>>24==0){r7=0}else{r6=-1;return r6}while(1){if((r7|0)>=31){r8=0;break}r4=r7<<3;if((((HEAPU8[r4+(r1+20)|0]<<8|HEAPU8[r4+(r1+21)|0])<<1)+2|0)<((HEAPU8[r4+(r1+26)|0]<<8|HEAPU8[r4+(r1+27)|0])+(HEAPU8[r4+(r1+24)|0]<<8|HEAPU8[r4+(r1+25)|0])<<1|0)){r6=-1;r3=1617;break}else{r7=r7+1|0}}if(r3==1617){return r6}while(1){if((r8|0)>=31){r3=1592;break}r7=r8<<3;if(HEAPU8[r7+(r1+22)|0]>15){r6=-1;r3=1629;break}if(HEAPU8[r7+(r1+23)|0]>64){r6=-1;r3=1626;break}else{r8=r8+1|0}}if(r3==1629){return r6}else if(r3==1626){return r6}else if(r3==1592){r8=HEAPU8[r1+785|0]<<16|HEAPU8[r1+786|0]<<8|HEAPU8[r1+787|0];if(r8>>>0<788){r6=-1;return r6}else{r9=0}while(1){if((r9|0)>=(r5|0)){break}if((HEAPU8[r9+(r1+273)|0]<<16|HEAPU8[r9+(r1+272)|0]<<24|HEAPU8[r9+(r1+274)|0]<<8|HEAPU8[r9+(r1+275)|0]|0)>(r8|0)){r6=-1;r3=1616;break}else{r9=r9+4|0}}if(r3==1616){return r6}r5=r9|2;while(1){if((r5|0)>=128){break}r9=r5<<2;if((HEAPU8[r9+(r1+273)|0]<<16|HEAPU8[r9+(r1+272)|0]<<24|HEAPU8[r9+(r1+274)|0]<<8|HEAPU8[r9+(r1+275)|0]|0)==0){r5=r5+1|0}else{r6=-1;r3=1618;break}}if(r3==1618){return r6}r5=r8-4|0;L2280:do{if((r5|0)>788){r8=788;L2281:while(1){r9=HEAP8[r1+r8|0];if(r9<<24>>24==-128){r10=r8+1|0}else{if((r9&255)>128){r6=-1;r3=1619;break}do{if(r9<<24>>24==0){if(HEAP8[r8+(r1+1)|0]<<24>>24!=0){break}if(HEAP8[r8+(r1+2)|0]<<24>>24!=0){break}if(HEAP8[r8+(r1+3)|0]<<24>>24==0){r6=-1;r3=1620;break L2281}}}while(0);r9=HEAPU8[r8+(r1+2)|0]*15&-1;if((r9|0)==12){if(HEAPU8[r8+(r1+3)|0]>64){r6=-1;r3=1621;break}}else if((r9|0)==13){if(HEAPU8[r8+(r1+3)|0]>64){r6=-1;r3=1622;break}}r10=r8+4|0}if((r10|0)<(r5|0)){r8=r10}else{break L2280}}if(r3==1620){return r6}else if(r3==1619){return r6}else if(r3==1621){return r6}else if(r3==1622){return r6}}}while(0);if((r2|0)==0){r6=0;return r6}if((r1|0)==0){HEAP8[r2]=0;r6=0;return r6}else{_memcpy(r2,r1,20);HEAP8[r2+20|0]=0;r6=0;return r6}}}function _test_tdd(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r4=0;if((r3|0)<564){r5=564-r3|0;return r5}else{r6=0;r7=0}while(1){r3=r6*14&-1;r8=HEAPU8[r3+(r1+131)|0]<<16|HEAPU8[r3+(r1+130)|0]<<24|HEAPU8[r3+(r1+132)|0]<<8|HEAPU8[r3+(r1+133)|0];r9=HEAPU8[r3+(r1+134)|0]<<8|HEAPU8[r3+(r1+135)|0];r10=HEAPU8[r3+(r1+139)|0]<<16|HEAPU8[r3+(r1+138)|0]<<24|HEAPU8[r3+(r1+140)|0]<<8|HEAPU8[r3+(r1+141)|0];if(HEAPU8[r3+(r1+137)|0]>64|(r10|0)<(r8|0)){r5=-1;r4=1664;break}if((r8|0)<564|(r10|0)<564){r5=-1;r4=1663;break}r11=r10-r8|0;if((r11|0)>(r9|0)){r5=-1;r4=1671;break}if((r11+(HEAPU8[r3+(r1+142)|0]<<8|HEAPU8[r3+(r1+143)|0])|0)>(r9+2|0)){r5=-1;r4=1666;break}r12=r9+r7|0;r9=r6+1|0;if((r9|0)<31){r6=r9;r7=r12}else{r4=1639;break}}if(r4==1664){return r5}else if(r4==1671){return r5}else if(r4==1663){return r5}else if(r4==1666){return r5}else if(r4==1639){if((r12-3|0)>>>0>2031582){r5=-1;return r5}r7=HEAP8[r1];if(r7<<24>>24<1){r5=-1;return r5}else{r13=0;r14=0}while(1){r6=HEAP8[r14+(r1+2)|0];r9=r6&255;if(r6<<24>>24<0){r5=-1;r4=1672;break}r15=(r9|0)>(r13|0)?r9:r13;r9=r14+1|0;if((r9|0)<128){r13=r15;r14=r9}else{break}}if(r4==1672){return r5}r14=(r15<<10)+1024|0;r15=(r7&255)+2|0;while(1){if((r15|0)>=128){break}if(HEAP8[r15+(r1+2)|0]<<24>>24==0){r15=r15+1|0}else{r5=-1;r4=1659;break}}if(r4==1659){return r5}r15=r12+564|0;r12=0;while(1){if((r12|0)>=(r14|0)){r4=1655;break}r7=r15+r12|0;if(HEAPU8[r1+r7|0]>31){r5=-1;r4=1660;break}r13=HEAP8[r7+(r1+1)|0];if(!((r13&255)<73&(r13&1)<<24>>24==0)){r5=-1;r4=1658;break}r13=HEAP8[r7+(r1+2)|0]&15;if(r13<<24>>24==13){if(HEAPU8[r7+(r1+3)|0]>64){r5=-1;r4=1661;break}}else if(r13<<24>>24==12){if(HEAPU8[r7+(r1+3)|0]>64){r5=-1;r4=1669;break}}else{if(r13<<24>>24==11){r5=-1;r4=1673;break}else{r12=r12+4|0;continue}}r12=r12+4|0}if(r4==1660){return r5}else if(r4==1655){if((r2|0)==0){r5=-1;return r5}HEAP8[r2]=0;r5=-1;return r5}else if(r4==1669){return r5}else if(r4==1673){return r5}else if(r4==1661){return r5}else if(r4==1658){return r5}}}function _depack_starpack(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+2816|0;r5=r4+1024;r6=r4+1152;r7=r4+1280;r8=r4+2304;r9=r8;r10=STACKTOP,r11=r10>>2;STACKTOP=STACKTOP+512|0;r12=r10;r13=STACKTOP,r14=r13>>2;STACKTOP=STACKTOP+512|0;r15=r5|0;_memset(r15,0,128);_memset(r6|0,0,128);_memset(r9,0,512);_memset(r12,0,512);_memset(r13,0,512);r16=r4|0;r17=20;while(1){r18=_fread(r16,1,(r17|0)>1024?1024:r17,r1);_fwrite(r16,1,r18,r2);r19=r17-r18|0;if((r18|0)>0&(r19|0)>0){r17=r19}else{break}}r17=r5|0;r19=r6|0;r18=0;r20=0;while(1){_memset(r16,0,22);_fwrite(r16,1,22,r2);r21=_fgetc(r1);r22=_fgetc(r1)&255;_fputc(r21&255,r2);_fputc(r22,r2);r23=((r22|r21<<8&65280)<<1)+r18|0;_fputc(_fgetc(r1)&255,r2);_fputc(_fgetc(r1)&255,r2);r21=_fgetc(r1);r22=_fgetc(r1)&255;_fputc(r21&255,r2);_fputc(r22,r2);r22=_fgetc(r1);r21=_fgetc(r1)&255;_fputc(r22&255,r2);_fputc(r21,r2);r21=r20+1|0;if((r21|0)==31){break}else{r18=r23;r20=r21}}_fgetc(r1);r20=_fgetc(r1);_fseek(r1,2,1);r18=0;while(1){r21=_fgetc(r1);r22=_fgetc(r1);HEAP32[r8+(r18<<2)>>2]=r22<<16&16711680|r21<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255;r21=r18+1|0;if((r21|0)==128){break}else{r18=r21}}r18=r20&255;r21=(r18|0)==0;L2375:do{if(r21){_memcpy(r12,r9,512);r24=0;r25=0;break}else{r22=0;r26=0;while(1){do{if((r26|0)==0){HEAP8[r15]=0;r27=r22+1|0}else{r28=(r26<<2)+r8|0;r29=0;while(1){if((r29|0)>=(r26|0)){break}if((HEAP32[r28>>2]|0)==(HEAP32[r8+(r29<<2)>>2]|0)){r3=1688;break}else{r29=r29+1|0}}if(r3==1688){r3=0;HEAP8[r5+r26|0]=HEAP8[r5+r29|0]}if((r29|0)!=(r26|0)){r27=r22;break}HEAP8[r5+r26|0]=r22&255;r27=r22+1|0}}while(0);r28=r26+1|0;if((r28|0)<(r18|0)){r22=r27;r26=r28}else{break}}_memcpy(r12,r9,512);if(r21){r24=0;r25=0;break}else{r30=0}while(1){r26=(r30<<2)+r10|0;r22=0;while(1){if((r22|0)>=(r30|0)){r3=1696;break}r31=HEAP32[r26>>2];r32=(r22<<2)+r10|0;r33=HEAP32[r32>>2];if((r31|0)<(r33|0)){r3=1695;break}else{r22=r22+1|0}}if(r3==1696){r3=0;r34=r30+1|0}else if(r3==1695){r3=0;r28=r5+r22|0;r35=HEAP8[r28];r36=r5+r30|0;HEAP8[r28]=HEAP8[r36];HEAP8[r36]=r35;HEAP32[r32>>2]=r31;HEAP32[r26>>2]=r33;r34=0}if((r34|0)<(r18|0)){r30=r34}else{r24=0;r25=0;break L2375}}}}while(0);while(1){r34=HEAP32[(r25<<2>>2)+r11];r30=(r24<<2)+r13|0;if((r25|0)==0){HEAP32[r30>>2]=r34;r24=r24;r25=r25+1|0;continue}if((r34|0)==(HEAP32[r30>>2]|0)){r37=r24}else{r30=r24+1|0;HEAP32[(r30<<2>>2)+r14]=r34;r37=r30}r30=r25+1|0;if((r30|0)==128){break}else{r24=r37;r25=r30}}L2409:do{if((r18-1|0)>0){r25=(r20&255)-1|0;r37=0;r24=0;r13=HEAP32[r14];while(1){HEAP32[(r37<<2>>2)+r11]=r13;r30=r37+1|0;r34=r24+1|0;r33=HEAP32[(r34<<2>>2)+r14];if((r33-r13|0)>1024){HEAP32[(r30<<2>>2)+r11]=r13+1024|0;r38=r37+2|0}else{r38=r30}if((r34|0)==(r25|0)){r39=0;break L2409}else{r37=r38;r24=r34;r13=r33}}}else{r39=0}}while(0);while(1){r38=(r39<<2)+r8|0;r14=0;while(1){if((r14|0)>=128){break}if((HEAP32[r38>>2]|0)==(HEAP32[(r14<<2>>2)+r11]|0)){r3=1711;break}else{r14=r14+1|0}}if(r3==1711){r3=0;HEAP8[r6+r39|0]=r14&255}r38=r39+1|0;if((r38|0)==128){break}else{r39=r38}}_memset(r15,0,128);if(r21){_fputc(r18,r2);r40=1}else{r21=r20&255;_memcpy(r17,r19,r21>>>0>1?r21:1);_fputc(r18,r2);r21=0;r19=0;while(1){r17=HEAP8[r5+r21|0];r41=(r17&255)>(r19&255)?r17:r19;r17=r21+1|0;if((r17|0)<(r18|0)){r21=r17;r19=r41}else{break}}r40=r41+1&255}_fputc(127,r2);_fwrite(r15,128,1,r2);_fputc(77,r2);_fputc(46,r2);_fputc(75,r2);_fputc(46,r2);_fseek(r1,784,0);r15=_fgetc(r1);r41=_fgetc(r1);r19=(r41<<16&16711680|r15<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255)+788|0;r15=r40&255;L2432:do{if(r40<<24>>24!=0){r41=r7|0;r21=0;while(1){_memset(r41,0,1024);r18=0;while(1){r5=r18<<4;r17=0;while(1){r20=(r17<<2)+r5|0;r39=_fgetc(r1)&255;if(r39<<24>>24!=-128){r6=_fgetc(r1)&255;r3=_fgetc(r1)&255;r11=_fgetc(r1)&255;HEAP8[r7+(r20|1)|0]=r6;HEAP8[r7+(r20|3)|0]=r11;r11=(((r3&255)>>>4|r39&-16)&255)>>>2;HEAP8[r7+r20|0]=r11&48|r39&15;HEAP8[r7+(r20|2)|0]=r11<<4|r3&15}r3=r17+1|0;if((r3|0)==4){break}else{r17=r3}}r17=r18+1|0;if((r17|0)==64){break}else{r18=r17}}_fwrite(r41,1024,1,r2);r18=r21+1|0;if((r18|0)<(r15|0)){r21=r18}else{break L2432}}}}while(0);_fseek(r1,r19,0);r19=r23;while(1){r23=_fread(r16,1,(r19|0)>1024?1024:r19,r1);_fwrite(r16,1,r23,r2);r15=r19-r23|0;if((r23|0)>0&(r15|0)>0){r19=r15}else{break}}STACKTOP=r4;return 0}function _depack_tdd(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18;r3=STACKTOP;STACKTOP=STACKTOP+2296|0;r4=r3+1024;r5=r3+2048;r6=r3+2172;_memset(r5,0,124);_memset(r6,0,124);r7=r3|0;_memset(r7,0,1024);_fwrite(r7,1,1024,r2);_memset(r7,0,56);_fwrite(r7,1,56,r2);r8=_malloc(130);_memset(r8,0,130);_fseek(r2,950,0);_fread(r8,130,1,r1);_fwrite(r8,130,1,r2);r9=0;r10=0;while(1){r11=HEAP8[r9+(r8+2)|0];r12=r9+1|0;if((r12|0)==128){break}else{r9=r12;r10=(r11&255)>(r10&255)?r11:r10}}_free(r8);r8=0;r9=0;while(1){_fseek(r2,(r8*30&-1)+42|0,0);r12=_fgetc(r1);r13=_fgetc(r1);r14=r13<<16&16711680|r12<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255;HEAP32[r5+(r8<<2)>>2]=r14;r12=_fgetc(r1);r13=_fgetc(r1)&255;r15=r13|r12<<8&65280;_fputc(r12&255,r2);_fputc(r13,r2);r16=r15+r9|0;HEAP32[r6+(r8<<2)>>2]=r15;_fputc(_fgetc(r1)&255,r2);_fputc(_fgetc(r1)&255,r2);r15=_fgetc(r1);r13=_fgetc(r1);r12=(r13<<16&16711680|r15<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255)-r14|0;_fputc(r12>>>9&255,r2);_fputc(r12>>>1&255,r2);r12=_fgetc(r1);r14=_fgetc(r1)&255;_fputc(r12&255,r2);_fputc(r14,r2);r14=r8+1|0;if((r14|0)==31){break}else{r8=r14;r9=r16}}_fseek(r1,r16,1);_fseek(r2,0,2);_fputc(77,r2);_fputc(46,r2);_fputc(75,r2);_fputc(46,r2);r16=_malloc(1024);r9=r4|0;r8=(((r10&255)>(r11&255)?r10:r11)&255)+1|0;r11=0;while(1){_memset(r16,0,1024);_memset(r9,0,1024);_fread(r16,1024,1,r1);r10=0;while(1){r14=r10<<4;r12=0;while(1){r15=(r12<<2)+r14|0;r13=r15|3;HEAP8[r4+r13|0]=HEAP8[r16+r13|0];r13=r15|2;r17=HEAP8[r16+r15|0];HEAP8[r4+r13|0]=HEAP8[r16+r13|0]&15|r17<<4;r13=r15|1;r18=HEAPU8[r16+r13|0]>>>1;HEAP8[r4+r15|0]=r17&-16|HEAP8[(r18<<1)+5249008|0];HEAP8[r4+r13|0]=HEAP8[(r18<<1)+5249009|0];r18=r12+1|0;if((r18|0)==4){break}else{r12=r18}}r12=r10+1|0;if((r12|0)==64){break}else{r10=r12}}_fwrite(r9,1024,1,r2);r10=r11+1|0;if((r10|0)==(r8|0)){break}else{r11=r10}}_free(r16);r16=0;while(1){r11=HEAP32[r6+(r16<<2)>>2];L2467:do{if((r11|0)!=0){_fseek(r1,HEAP32[r5+(r16<<2)>>2],0);r8=r11;while(1){r9=_fread(r7,1,(r8|0)>1024?1024:r8,r1);_fwrite(r7,1,r9,r2);r4=r8-r9|0;if((r9|0)>0&(r4|0)>0){r8=r4}else{break L2467}}}}while(0);r11=r16+1|0;if((r11|0)==31){break}else{r16=r11}}STACKTOP=r3;return 0}function _cmplong(r1,r2){var r3,r4;r3=HEAP32[r1>>2];r1=HEAP32[r2>>2];if((r3|0)==(r1|0)){r4=0;return r4}r4=(r3|0)>(r1|0)?1:-1;return r4}function _test_titanics(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r4=0;if((r3|0)<182){r5=182-r3|0;return r5}else{r6=0;r7=0}while(1){r3=r6*12&-1;if(HEAPU8[r3+(r1+7)|0]>64){r5=-1;r4=1769;break}if(HEAP8[r3+(r1+6)|0]<<24>>24!=0){r5=-1;r4=1777;break}r8=HEAPU8[r1+(r3|1)|0]<<16|HEAPU8[r1+r3|0]<<24|HEAPU8[r1+(r3|2)|0]<<8|HEAPU8[r1+(r3|3)|0];if((r8|0)<180&(r8|0)!=0){r5=-1;r4=1779;break}r8=HEAPU8[r3+(r1+4)|0]<<8|HEAPU8[r3+(r1+5)|0];r9=r8&65535;r10=HEAPU8[r3+(r1+8)|0]<<8|HEAPU8[r3+(r1+9)|0];r11=HEAPU8[r3+(r1+10)|0]<<8|HEAPU8[r3+(r1+11)|0];if((r10&65535)>(r8&65535)){r5=-1;r4=1771;break}if((r11&65535)>>>0>(r9+1|0)>>>0|(r8&65535)>32768|r11<<16>>16==0){r5=-1;r4=1778;break}if(r8<<16>>16==0){if(!(r10<<16>>16==0&r11<<16>>16==1)){r5=-1;r4=1776;break}}r12=r9+r7|0;r9=r6+1|0;if((r9|0)<15){r6=r9;r7=r12}else{r4=1761;break}}if(r4==1769){return r5}else if(r4==1778){return r5}else if(r4==1779){return r5}else if(r4==1761){if((r12|0)<2){r5=-1;return r5}else{r13=0}while(1){r12=HEAPU8[r13+(r1+180)|0]<<8|HEAPU8[r13+(r1+181)|0];if(r12<<16>>16==-1){r4=1765;break}if((r12&65535)<180){r5=-1;r4=1774;break}r12=r13+2|0;if((r12|0)<256){r13=r12}else{r5=-1;r4=1775;break}}if(r4==1774){return r5}else if(r4==1775){return r5}else if(r4==1765){if((r2|0)==0){r5=0;return r5}HEAP8[r2]=0;r5=0;return r5}}else if(r4==1776){return r5}else if(r4==1771){return r5}else if(r4==1777){return r5}}function _depack_titanics(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25;r3=STACKTOP;STACKTOP=STACKTOP+2560|0;r4=r3+1024;r5=r3+2048;r6=STACKTOP,r7=r6>>2;STACKTOP=STACKTOP+512|0;r8=r6;r6=STACKTOP,r9=r6>>2;STACKTOP=STACKTOP+512|0;r10=STACKTOP;STACKTOP=STACKTOP+60|0;r11=STACKTOP;STACKTOP=STACKTOP+30|0;STACKTOP=STACKTOP+3>>2<<2;_memset(r6,0,512);_memset(r8,0,512);_memset(r5,0,512);r6=r3|0;_memset(r6,0,20);_fwrite(r6,1,20,r2);r12=0;while(1){r13=_fgetc(r1);r14=_fgetc(r1);HEAP32[r10+(r12<<2)>>2]=r14<<16&16711680|r13<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255;_memset(r6,0,22);_fwrite(r6,1,22,r2);r13=_fgetc(r1);r14=_fgetc(r1);_fputc(r13&255,r2);_fputc(r14&255,r2);HEAP16[r11+(r12<<1)>>1]=(r14&255|(r13&65535)<<8)<<1;_fputc(_fgetc(r1)&255,r2);_fputc(_fgetc(r1)&255,r2);r13=_fgetc(r1);r14=_fgetc(r1)&255;_fputc(r13&255,r2);_fputc(r14,r2);r14=_fgetc(r1);r13=_fgetc(r1)&255;_fputc(r14&255,r2);_fputc(r13,r2);r13=r12+1|0;if((r13|0)==15){r15=15;break}else{r12=r13}}while(1){_memset(r6,0,22);_fwrite(r6,1,22,r2);_fputc(0,r2);_fputc(0,r2);_fputc(0,r2);_fputc(64,r2);_fputc(0,r2);_fputc(0,r2);_fputc(0,r2);_fputc(1,r2);r12=r15+1|0;if((r12|0)==31){break}else{r15=r12}}r15=r4|0;_fread(r15,2,128,r1);r12=0;r13=0;while(1){r14=r12<<1;r16=HEAP8[r4+r14|0];if(r16<<24>>24==-1){r17=r12;break}r18=HEAPU8[r4+(r14|1)|0]|(r16&255)<<8;HEAP32[r5+(r12<<2)>>2]=r18;HEAP32[(r12<<2>>2)+r7]=r18;r18=(r13&255)+1&255;r16=r18&255;if(r18<<24>>24>-1){r12=r16;r13=r13+1|0}else{r17=r16;break}}_fputc(r17,r2);_fputc(127,r2);_qsort(r8,r17,4,520);r8=(r17|0)>0;L2524:do{if(r8){r13=0;r12=0;r16=HEAP32[r7];while(1){HEAP32[(r13<<2>>2)+r9]=r16;r18=r12;while(1){r19=r18+1|0;r20=HEAP32[(r19<<2>>2)+r7];if((r20|0)==(r16|0)&(r18|0)<(r17|0)){r18=r19}else{break}}if((r19|0)<(r17|0)){r13=r13+1|0;r12=r19;r16=r20}else{break}}_memset(r15,0,128);if(r8){r21=0;r22=0}else{r23=0;break}while(1){r16=HEAP32[r5+(r21<<2)>>2];r12=0;while(1){if((r16|0)==(HEAP32[(r12<<2>>2)+r9]|0)){break}else{r12=r12+1|0}}HEAP8[r4+r21|0]=r12&255;r16=(r12|0)>(r22|0)?r12:r22;r13=r21+1|0;if((r13|0)==(r17|0)){r23=r16;break L2524}else{r21=r13;r22=r16}}}else{_memset(r15,0,128);r23=0}}while(0);_fwrite(r15,128,1,r2);_fputc(77,r2);_fputc(46,r2);_fputc(75,r2);_fputc(46,r2);L2539:do{if((r23|0)<0){r24=0}else{r22=r23+1|0;r21=0;while(1){_fseek(r1,HEAP32[(r21<<2>>2)+r9],0);_memset(r15,0,1024);r17=0;r5=_fgetc(r1);while(1){r8=_fgetc(r1);r20=(r8&255)>>>6<<2;r19=r8&63;if(r19>>>0<37){r8=r20&255|r17<<4;HEAP8[r4+r8|0]=HEAP8[(r19<<1)+5249008|0];HEAP8[r4+(r8|1)|0]=HEAP8[(r19<<1)+5249009|0];r25=r8}else{r25=r20&255|r17<<4}HEAP8[r4+(r25|2)|0]=_fgetc(r1)&255;HEAP8[r4+(r25|3)|0]=_fgetc(r1)&255;if((r5&255)<<24>>24<0){break}r20=_fgetc(r1);r8=(r20&127)+r17|0;if((r8|0)<64){r17=r8;r5=r20}else{break}}_fwrite(r15,1024,1,r2);r5=r21+1|0;if((r5|0)==(r22|0)){r24=0;break L2539}else{r21=r5}}}}while(0);while(1){r15=HEAP32[r10+(r24<<2)>>2];L2553:do{if((r15|0)!=0){_fseek(r1,r15,0);r25=HEAPU16[r11+(r24<<1)>>1];while(1){r4=_fread(r6,1,(r25|0)>1024?1024:r25,r1);_fwrite(r6,1,r4,r2);r9=r25-r4|0;if((r4|0)>0&(r9|0)>0){r25=r9}else{break L2553}}}}while(0);r15=r24+1|0;if((r15|0)==15){break}else{r24=r15}}STACKTOP=r3;return 0}function _test_tp3(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r4=0;if((r3|0)<1024){r5=1024-r3|0;return r5}if((_memcmp(r1,5267056,8)|0)!=0){r5=-1;return r5}r3=HEAPU8[r1+28|0]<<8|HEAPU8[r1+29|0];r6=r3&65535;if((r6&7|0)!=0|r3<<16>>16==0){r5=-1;return r5}r7=r6>>>3;r6=0;while(1){if((r6|0)>=(r7|0)){r8=0;break}if(HEAPU8[(r6<<3)+r1+30|0]>15){r5=-1;r4=1844;break}else{r6=r6+1|0}}if(r4==1844){return r5}while(1){if((r8|0)>=(r7|0)){break}if(HEAPU8[(r8<<3)+r1+31|0]>64){r5=-1;r4=1840;break}else{r8=r8+1|0}}if(r4==1840){return r5}r8=(r7|0)==0;if(r8){r5=-1;return r5}else{r9=0;r10=0}while(1){r6=r9<<3;r11=(HEAPU8[r6+(r1+32)|0]<<8|HEAPU8[r6+(r1+33)|0])<<1;r12=HEAPU8[r6+(r1+34)|0]<<8|HEAPU8[r6+(r1+35)|0];r13=(r12&65535)<<1;r14=HEAPU8[r6+(r1+36)|0]<<8|HEAPU8[r6+(r1+37)|0];r6=(r14&65535)<<1;if(r11>>>0>65535|r13>>>0>65535|r6>>>0>65535){r5=-1;r4=1833;break}if((r6+r13|0)>(r11+2|0)){r5=-1;r4=1837;break}if(r12<<16>>16!=0&r14<<16>>16==0){r5=-1;r4=1836;break}r15=r11+r10|0;r11=r9+1|0;if((r11|0)<(r7|0)){r9=r11;r10=r15}else{r4=1824;break}}if(r4==1837){return r5}else if(r4==1836){return r5}else if(r4==1824){if((r15|0)<5){r5=-1;return r5}if(r8|(r3&65535)>1031){r5=-1;return r5}r3=r1+8|0;if((r2|0)==0){r5=0;return r5}if((r3|0)==0){HEAP8[r2]=0;r5=0;return r5}else{_memcpy(r2,r3,20);HEAP8[r2+20|0]=0;r5=0;return r5}}else if(r4==1833){return r5}}function _depack_tp3(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+4276|0;r5=r4+1024;r6=r4+1152;r7=r4+2176;r8=r4+2228,r9=r8>>2;_memset(r8,0,2048);r8=r5|0;_memset(r8,0,128);_fseek(r1,8,1);r10=r4|0;r11=20;while(1){r12=_fread(r10,1,(r11|0)>1024?1024:r11,r1);_fwrite(r10,1,r12,r2);r13=r11-r12|0;if((r12|0)>0&(r13|0)>0){r11=r13}else{break}}r11=_fgetc(r1);r13=(_fgetc(r1)&248|r11<<8)>>>3;r11=r13&255;do{if((r11|0)==0){r12=r7|0;_memset(r12,0,29);HEAP8[r7+29|0]=1;r14=0;r15=0;r16=r12;r3=1852;break}else{r12=r13&255;r17=r12>>>0>1;r18=0;r19=0;while(1){_memset(r10,0,22);_fwrite(r10,1,22,r2);r20=_fgetc(r1);r21=_fgetc(r1);r22=_fgetc(r1);r23=_fgetc(r1)&255;_fputc(r22&255,r2);_fputc(r23,r2);r24=((r23|r22<<8&65280)<<1)+r19|0;_fputc(r20&255,r2);_fputc(r21&255,r2);r21=_fgetc(r1);r20=_fgetc(r1)&255;_fputc(r21&255,r2);_fputc(r20,r2);r20=_fgetc(r1);r21=_fgetc(r1)&255;_fputc(r20&255,r2);_fputc(r21,r2);r21=r18+1|0;if((r21|0)<(r11|0)){r18=r21;r19=r24}else{break}}r19=r17?r12:1;r18=r7|0;_memset(r18,0,29);HEAP8[r7+29|0]=1;if(r19>>>0<31){r14=r24;r15=r19;r16=r18;r3=1852;break}else{r25=r24;break}}}while(0);L2617:do{if(r3==1852){r24=r15;while(1){_fwrite(r16,30,1,r2);r7=r24+1|0;if((r7|0)==31){r25=r14;break L2617}else{r24=r7}}}}while(0);_fgetc(r1);r14=_fgetc(r1)&255;_fputc(r14,r2);_fputc(127,r2);if((r14|0)==0){r26=0}else{r16=0;r15=0;while(1){r3=_fgetc(r1)&65535;r24=((_fgetc(r1)&248|r3<<8)&65535)>>>3;r3=r24&255;HEAP8[r5+r15|0]=r3;r27=(r24&255)>>>0>(r16&255)>>>0?r3:r16;r3=r15+1|0;if((r3|0)<(r14|0)){r16=r27;r15=r3}else{break}}r26=r27&255}r27=0;r15=0;while(1){r16=_fgetc(r1);r14=_fgetc(r1)&255|r16<<8&65280;HEAP32[(r27<<4>>2)+r9]=r14;r16=(r14|0)>(r15|0)?r14:r15;r14=_fgetc(r1);r5=_fgetc(r1)&255|r14<<8&65280;HEAP32[((r27<<4)+4>>2)+r9]=r5;r14=(r5|0)>(r16|0)?r5:r16;r16=_fgetc(r1);r5=_fgetc(r1)&255|r16<<8&65280;HEAP32[((r27<<4)+8>>2)+r9]=r5;r16=(r5|0)>(r14|0)?r5:r14;r14=_fgetc(r1);r5=_fgetc(r1)&255|r14<<8&65280;HEAP32[((r27<<4)+12>>2)+r9]=r5;r28=(r5|0)>(r16|0)?r5:r16;r16=r27+1|0;if((r16|0)>(r26|0)){break}else{r27=r16;r15=r28}}_fwrite(r8,128,1,r2);_fputc(77,r2);_fputc(46,r2);_fputc(75,r2);_fputc(46,r2);r8=_ftell(r1)+2|0;r15=r6|0;r27=0;r16=r28;while(1){_memset(r15,0,1024);r28=0;r5=r16;while(1){_fseek(r1,r8+HEAP32[((r27<<4)+(r28<<2)>>2)+r9]|0,0);r14=r28<<2;r3=0;while(1){r24=(r3<<4)+r14|0;r12=_fgetc(r1);r17=r12&255;r7=r12&192;do{if((r7|0)==192){r29=r3+255-(r12&255)|0}else{r11=_fgetc(r1)&255;if((r7|0)==128){r13=(r17&255)>>>1&15;do{if(r13<<24>>24==5|r13<<24>>24==6|r13<<24>>24==10){if((r11&255)>128){r30=-r11&255;break}else{r30=r11<<4;break}}else{r30=r11}}while(0);HEAP8[r6+(r24|2)|0]=r13<<24>>24==8?0:r13;HEAP8[r6+(r24|3)|0]=r30;r29=r3;break}r18=(r11&255)>>>4;r19=(r17&255)>>>2;r21=(r12&64|0)==0?r17&63:127-r17&255;r20=r11&15;if(r20<<24>>24==0){r22=r21&255;HEAP8[r6+r24|0]=HEAP8[(r22<<1)+5249008|0]|r19&16;HEAP8[r6+(r24|1)|0]=HEAP8[(r22<<1)+5249009|0];HEAP8[r6+(r24|2)|0]=r18<<4;r29=r3;break}r22=_fgetc(r1)&255;r23=r20<<24>>24==8?0:r20;do{if(r23<<24>>24==5|r23<<24>>24==6|r23<<24>>24==10){if((r22&255)>128){r31=-r22&255;break}else{r31=r22<<4;break}}else{r31=r22}}while(0);r22=r21&255;HEAP8[r6+r24|0]=HEAP8[(r22<<1)+5249008|0]|r19&16;HEAP8[r6+(r24|1)|0]=HEAP8[(r22<<1)+5249009|0];HEAP8[r6+(r24|2)|0]=r23|r18<<4;HEAP8[r6+(r24|3)|0]=r31;r29=r3}}while(0);r24=r29+1|0;if((r24|0)<64){r3=r24}else{break}}r3=_ftell(r1);r32=(r3|0)>(r5|0)?r3:r5;r3=r28+1|0;if((r3|0)==4){break}else{r28=r3;r5=r32}}_fwrite(r15,1024,1,r2);r5=r27+1|0;if((r5|0)>(r26|0)){break}else{r27=r5;r16=r32}}_fseek(r1,(r32&1)+r32|0,0);r32=r25;while(1){r25=_fread(r10,1,(r32|0)>1024?1024:r32,r1);_fwrite(r10,1,r25,r2);r16=r32-r25|0;if((r25|0)>0&(r16|0)>0){r32=r16}else{break}}STACKTOP=r4;return 0}function _test_unic_id(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r4=0;if((r3|0)<1084){r5=1084-r3|0;return r5}if((HEAPU8[r1+1081|0]<<16|HEAPU8[r1+1080|0]<<24|HEAPU8[r1+1082|0]<<8|HEAPU8[r1+1083|0]|0)==1294879534){r6=0;r7=0}else{r5=-1;return r5}while(1){r8=r6*30&-1;r9=(HEAPU8[r8+(r1+42)|0]<<8|HEAPU8[r8+(r1+43)|0])<<1;if((r9+2|0)<((HEAPU8[r8+(r1+48)|0]<<8|HEAPU8[r8+(r1+49)|0])+(HEAPU8[r8+(r1+46)|0]<<8|HEAPU8[r8+(r1+47)|0])<<1|0)){r5=-1;r4=1922;break}r10=r9+r7|0;r9=r6+1|0;if((r9|0)<31){r6=r9;r7=r10}else{break}}if(r4==1922){return r5}if((r10|0)<3){r5=-1;return r5}else{r11=0}while(1){if((r11|0)>=31){r4=1893;break}r10=r11*30&-1;if(HEAPU8[r10+(r1+40)|0]>15){r5=-1;r4=1916;break}if(HEAP8[r10+(r1+44)|0]<<24>>24!=0){r5=-1;r4=1921;break}if(HEAPU8[r10+(r1+45)|0]>64){r5=-1;r4=1920;break}else{r11=r11+1|0}}if(r4==1893){r11=HEAP8[r1+950|0];r10=r11&255;if(r11<<24>>24<1){r5=-1;return r5}else{r12=0;r13=0}while(1){r11=HEAP8[r13+(r1+952)|0];r7=r11&255;if(r11<<24>>24<0){r5=-1;r4=1918;break}r14=(r7|0)>(r12|0)?r7:r12;r15=r13+1|0;if((r15|0)<(r10|0)){r12=r14;r13=r15}else{break}}if(r4==1918){return r5}r13=r14+1|0;r14=r15;while(1){if((r14|0)==128){break}if(HEAP8[r14+(r1+952)|0]<<24>>24==0){r14=r14+1|0}else{r5=-1;r4=1917;break}}if(r4==1917){return r5}r14=(r13*768&-1)+1084|0;if((r14|0)>(r3|0)){r5=r14-r3|0;return r5}r3=r13<<8;r13=0;while(1){if((r13|0)>=(r3|0)){break}if(HEAPU8[r1+(r13*3&-1)+1084|0]>116){r5=-1;r4=1909;break}else{r13=r13+1|0}}if(r4==1909){return r5}if((r2|0)==0){r5=0;return r5}if((r1|0)==0){HEAP8[r2]=0;r5=0;return r5}else{_memcpy(r2,r1,20);HEAP8[r2+20|0]=0;r5=0;return r5}}else if(r4==1920){return r5}else if(r4==1921){return r5}else if(r4==1916){return r5}}function _depack_unic(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;r3=STACKTOP;STACKTOP=STACKTOP+2052|0;r4=r3+1024;r5=r3|0;r6=20;while(1){r7=_fread(r5,1,(r6|0)>1024?1024:r6,r1);_fwrite(r5,1,r7,r2);r8=r6-r7|0;if((r7|0)>0&(r8|0)>0){r6=r8}else{r9=0;r10=0;break}}while(1){r6=20;while(1){r8=_fread(r5,1,(r6|0)>1024?1024:r6,r1);_fwrite(r5,1,r8,r2);r7=r6-r8|0;if((r8|0)>0&(r7|0)>0){r6=r7}else{break}}_fputc(0,r2);_fputc(0,r2);r6=_fgetc(r1);r7=_fgetc(r1);r8=r6<<8&65280|r7&255;do{if((r8|0)==0){r11=0}else{if(r8>>>0<256){r11=16-r7|0;break}else{r11=-r7|0;break}}}while(0);r7=_fgetc(r1);r8=_fgetc(r1)&255;r6=r8|r7<<8&65280;_fputc(r7&255,r2);_fputc(r8,r2);r12=(r6<<1)+r10|0;_fgetc(r1);_fputc(r11&255,r2);_fputc(_fgetc(r1)&255,r2);r8=_fgetc(r1)&65535;r7=_fgetc(r1)&255|r8<<8;r8=r7&65535;r13=_fgetc(r1);r14=_fgetc(r1)&255;r15=r8<<1;r16=(r15+(r14|r13<<8&65280)|0)>(r6|0)|r7<<16>>16==0?r8:r15;_fputc(r16>>>8&255,r2);_fputc(r16&255,r2);_fputc(r13&255,r2);_fputc(r14,r2);r14=r9+1|0;if((r14|0)==31){break}else{r9=r14;r10=r12}}_fputc(_fgetc(r1)&255,r2);_fputc(127,r2);_fgetc(r1);r10=r4|0;_fread(r10,128,1,r1);_fwrite(r10,128,1,r2);r9=0;r11=0;while(1){r14=HEAP8[r4+r11|0];r17=(r14&255)>(r9&255)?r14:r9;r14=r11+1|0;if((r14|0)==128){break}else{r9=r17;r11=r14}}r11=r17+1&255;_fputc(77,r2);_fputc(46,r2);_fputc(75,r2);_fputc(46,r2);_fseek(r1,1080,0);r17=_fgetc(r1);r9=_fgetc(r1);r14=r9<<16&16711680|r17<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255;if(!((r14|0)==1431193923|(r14|0)==1294879534|(r14|0)==0)){_fseek(r1,-4,1)}r14=r11&255;L2742:do{if(r11<<24>>24==0){r18=r12}else{r17=0;while(1){r9=0;while(1){r13=_fgetc(r1);r16=_fgetc(r1)&255;r15=_fgetc(r1)&255;r8=r13&63;if((r16&15)<<24>>24==13){r19=Math.floor((r15&255)/10)<<4|(r15&255)%10}else{r19=r15}r15=r9<<2;HEAP8[r4+r15|0]=HEAP8[(r8<<1)+5249008|0]|(r13&255)>>>2&16;HEAP8[r4+(r15|1)|0]=HEAP8[(r8<<1)+5249009|0];HEAP8[r4+(r15|2)|0]=r16;HEAP8[r4+(r15|3)|0]=r19;r15=r9+1|0;if((r15|0)==256){break}else{r9=r15}}_fwrite(r10,1024,1,r2);r9=r17+1|0;if((r9|0)<(r14|0)){r17=r9}else{r18=r12;break L2742}}}}while(0);while(1){r12=_fread(r5,1,(r18|0)>1024?1024:r18,r1);_fwrite(r5,1,r12,r2);r14=r18-r12|0;if((r12|0)>0&(r14|0)>0){r18=r14}else{break}}STACKTOP=r3;return 0}function _test_unic2(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;r4=0;if((r3|0)<1084){r5=1084-r3|0;return r5}if((HEAPU8[r1+1081|0]<<16|HEAPU8[r1+1080|0]<<24|HEAPU8[r1+1082|0]<<8|HEAPU8[r1+1083|0]|0)==0){r5=-1;return r5}else{r6=0;r7=0;r8=0}while(1){r9=r7*30&-1;r10=HEAPU8[r9+(r1+22)|0]<<8|HEAPU8[r9+(r1+23)|0];r11=(r10&65535)<<1;r12=(HEAPU8[r9+(r1+26)|0]<<8|HEAPU8[r9+(r1+27)|0])<<1;r13=(HEAPU8[r9+(r1+28)|0]<<8|HEAPU8[r9+(r1+29)|0])<<1;r14=r11+r8|0;if((r11+2|0)<(r13+r12|0)){r5=-1;r4=1976;break}if(r11>>>0>65535|r12>>>0>65535|r13>>>0>65535){r5=-1;r4=1992;break}r13=HEAP8[r9+(r1+25)|0];if((r13&255)>64){r5=-1;r4=1981;break}r12=r10<<16>>16==0;if((HEAPU8[r9+(r1+20)|0]<<8|HEAPU8[r9+(r1+21)|0])<<16>>16!=0&r12){r5=-1;r4=1991;break}if(r13<<24>>24!=0&r12){r5=-1;r4=1982;break}r15=r12?r6:r11|1;r11=r7+1|0;if((r11|0)<31){r6=r15;r7=r11;r8=r14}else{r4=1954;break}}if(r4==1982){return r5}else if(r4==1976){return r5}else if(r4==1954){if((r14|0)<3){r5=-1;return r5}r14=HEAP8[r1+930|0];r8=r14&255;if(r14<<24>>24<1){r5=-1;return r5}else{r16=0;r17=0}while(1){r14=HEAP8[r17+(r1+932)|0];r7=r14&255;if(r14<<24>>24<0){r5=-1;r4=1983;break}r18=(r7|0)>(r16|0)?r7:r16;r7=r17+1|0;if((r7|0)<(r8|0)){r16=r18;r17=r7}else{break}}if(r4==1983){return r5}r16=r18+1|0;r18=r17+3|0;while(1){if((r18|0)==128){break}if(HEAP8[r18+(r1+932)|0]<<24>>24==0){r18=r18+1|0}else{r5=-1;r4=1978;break}}if(r4==1978){return r5}r18=(r16*768&-1)+1062|0;if((r18|0)>(r3|0)){r5=r18-r3|0;return r5}r3=r16<<8;r16=0;L2793:while(1){if((r16|0)>=(r3|0)){r4=1973;break}r18=r16*3&-1;r17=HEAP8[r18+(r1+1060)|0];if((r17&255)>116){r5=-1;r4=1990;break}r8=r17&255;if((r8&63)>>>0>36){r5=-1;r4=1980;break}r17=HEAP8[r18+(r1+1061)|0]&15;do{if(r17<<24>>24==12){if(HEAPU8[r18+(r1+1062)|0]>64){r5=-1;r4=1977;break L2793}else{r4=1970;break}}else if(r17<<24>>24==13){r7=r18+(r1+1062)|0;if(HEAPU8[r7]>64){r5=-1;r4=1984;break L2793}else{r19=r7;break}}else if(r17<<24>>24==11){if(HEAP8[r18+(r1+1062)|0]<<24>>24<0){r5=-1;r4=1988;break L2793}else{r4=1970;break}}else{r4=1970}}while(0);if(r4==1970){r4=0;r19=r18+(r1+1062)|0}if((r8>>>2&48|HEAPU8[r19]>>>4|0)>(r15|0)){r5=-1;r4=1993;break}else{r16=r16+1|0}}if(r4==1977){return r5}else if(r4==1984){return r5}else if(r4==1993){return r5}else if(r4==1980){return r5}else if(r4==1990){return r5}else if(r4==1988){return r5}else if(r4==1973){if((r2|0)==0){r5=0;return r5}HEAP8[r2]=0;r5=0;return r5}}else if(r4==1981){return r5}else if(r4==1991){return r5}else if(r4==1992){return r5}}function _test_unic_noid(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23;r4=0;if((r3|0)<1084){r5=1084-r3|0;return r5}if((HEAPU8[r1+1081|0]<<16|HEAPU8[r1+1080|0]<<24|HEAPU8[r1+1082|0]<<8|HEAPU8[r1+1083|0]|0)==0){r5=-1;return r5}else{r6=0;r7=0;r8=0}while(1){r9=r8*30&-1;r10=HEAPU8[r9+(r1+42)|0]<<8|HEAPU8[r9+(r1+43)|0];r11=(r10&65535)<<1;r12=HEAPU8[r9+(r1+46)|0]<<8|HEAPU8[r9+(r1+47)|0];r13=(r12&65535)<<1;r14=HEAPU8[r9+(r1+48)|0]<<8|HEAPU8[r9+(r1+49)|0];r15=(r14&65535)<<1;r16=r11+r7|0;if(r14<<16>>16!=0){if((r11+2|0)<(r15+r13|0)){r5=-1;r4=2048;break}}if(r11>>>0>65535|r13>>>0>65535|r15>>>0>65535){r5=-1;r4=2038;break}r13=HEAP8[r9+(r1+45)|0];if((r13&255)>64){r5=-1;r4=2046;break}r14=HEAPU8[r9+(r1+40)|0]<<8|HEAPU8[r9+(r1+41)|0];r9=r10<<16>>16==0;if(r14<<16>>16!=0&r9|(r14-9&65535)<238){r5=-1;r4=2040;break}if(r12<<16>>16!=0&r15>>>0<3){r5=-1;r4=2045;break}if(r13<<24>>24!=0&r9){r5=-1;r4=2052;break}r17=r9?r6:r11|1;r11=r8+1|0;if((r11|0)<31){r6=r17;r7=r16;r8=r11}else{r4=2007;break}}if(r4==2038){return r5}else if(r4==2040){return r5}else if(r4==2007){if((r16|0)<3){r5=-1;return r5}r16=HEAP8[r1+950|0];r8=r16&255;if(r16<<24>>24<1){r5=-1;return r5}else{r18=0;r19=0}while(1){r16=HEAP8[r19+(r1+952)|0];r7=r16&255;if(r16<<24>>24<0){r5=-1;r4=2051;break}r20=(r7|0)>(r18|0)?r7:r18;r21=r19+1|0;if((r21|0)<(r8|0)){r18=r20;r19=r21}else{break}}if(r4==2051){return r5}r19=r20+1|0;r20=r21;while(1){if((r20|0)==128){break}if(HEAP8[r20+(r1+952)|0]<<24>>24==0){r20=r20+1|0}else{r5=-1;r4=2055;break}}if(r4==2055){return r5}r20=(r19*768&-1)+1082|0;if((r20|0)>(r3|0)){r5=r20-r3|0;return r5}r3=r19<<8;r19=0;L2862:while(1){if((r19|0)>=(r3|0)){r22=0;r4=2026;break}r20=r19*3&-1;r21=HEAP8[r20+(r1+1080)|0];if((r21&255)>116){r5=-1;r4=2053;break}r18=r21&255;if((r18&63)>>>0>36){r5=-1;r4=2039;break}r21=HEAP8[r20+(r1+1081)|0]&15;do{if(r21<<24>>24==12){if(HEAPU8[r20+(r1+1082)|0]>64){r5=-1;r4=2033;break L2862}else{r4=2023;break}}else if(r21<<24>>24==11){if(HEAP8[r20+(r1+1082)|0]<<24>>24<0){r5=-1;r4=2034;break L2862}else{r4=2023;break}}else if(r21<<24>>24==13){r8=r20+(r1+1082)|0;if(HEAPU8[r8]>64){r5=-1;r4=2035;break L2862}else{r23=r8;break}}else{r4=2023}}while(0);if(r4==2023){r4=0;r23=r20+(r1+1082)|0}if((r18>>>2&48|HEAPU8[r23]>>>4|0)>(r17|0)){r5=-1;r4=2050;break}else{r19=r19+1|0}}if(r4==2026){while(1){r4=0;if((r22|0)>=20){break}r19=HEAP8[r1+r22|0];if(r19<<24>>24!=0&(r19&255)<32|(r19&255)>180){r5=-1;r4=2044;break}else{r22=r22+1|0;r4=2026}}if(r4==2044){return r5}if((r2|0)==0){r5=0;return r5}if((r1|0)==0){HEAP8[r2]=0;r5=0;return r5}else{_memcpy(r2,r1,20);HEAP8[r2+20|0]=0;r5=0;return r5}}else if(r4==2035){return r5}else if(r4==2050){return r5}else if(r4==2039){return r5}else if(r4==2053){return r5}else if(r4==2033){return r5}else if(r4==2034){return r5}}else if(r4==2045){return r5}else if(r4==2046){return r5}else if(r4==2048){return r5}else if(r4==2052){return r5}}function _test_unic_emptyid(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22;r4=0;if((r3|0)<1084){r5=1084-r3|0;return r5}if((HEAPU8[r1+1081|0]<<16|HEAPU8[r1+1080|0]<<24|HEAPU8[r1+1082|0]<<8|HEAPU8[r1+1083|0]|0)==0){r6=0;r7=0;r8=0}else{r5=-1;return r5}while(1){r9=r8*30&-1;r10=HEAPU8[r9+(r1+42)|0]<<8|HEAPU8[r9+(r1+43)|0];r11=(r10&65535)<<1;r12=HEAPU8[r9+(r1+46)|0]<<8|HEAPU8[r9+(r1+47)|0];r13=(r12&65535)<<1;r14=HEAPU8[r9+(r1+48)|0]<<8|HEAPU8[r9+(r1+49)|0];r15=(r14&65535)<<1;r16=r11+r7|0;if(r14<<16>>16!=0){if((r11+2|0)<(r15+r13|0)){r5=-1;r4=2092;break}}if(r11>>>0>65535|r13>>>0>65535|r15>>>0>65535){r5=-1;r4=2104;break}r13=HEAP8[r9+(r1+45)|0];if((r13&255)>64){r5=-1;r4=2098;break}r14=HEAPU8[r9+(r1+40)|0]<<8|HEAPU8[r9+(r1+41)|0];r9=r10<<16>>16==0;if(r14<<16>>16!=0&r9|(r14-9&65535)<238){r5=-1;r4=2109;break}if(r12<<16>>16!=0&r15>>>0<3){r5=-1;r4=2103;break}if(r13<<24>>24!=0&r9){r5=-1;r4=2093;break}r17=r9?r6:r11|1;r11=r8+1|0;if((r11|0)<31){r6=r17;r7=r16;r8=r11}else{r4=2067;break}}if(r4==2092){return r5}else if(r4==2109){return r5}else if(r4==2093){return r5}else if(r4==2098){return r5}else if(r4==2103){return r5}else if(r4==2104){return r5}else if(r4==2067){if((r16|0)<3){r5=-1;return r5}r16=HEAP8[r1+950|0];r8=r16&255;if(r16<<24>>24<1){r5=-1;return r5}else{r18=0;r19=0}while(1){r16=HEAP8[r19+(r1+952)|0];r7=r16&255;if(r16<<24>>24<0){r5=-1;r4=2105;break}r20=(r7|0)>(r18|0)?r7:r18;r21=r19+1|0;if((r21|0)<(r8|0)){r18=r20;r19=r21}else{break}}if(r4==2105){return r5}r19=r20+1|0;r20=r21;while(1){if((r20|0)==128){break}if(HEAP8[r20+(r1+952)|0]<<24>>24==0){r20=r20+1|0}else{r5=-1;r4=2102;break}}if(r4==2102){return r5}r20=(r19*768&-1)+1086|0;if((r20|0)>(r3|0)){r5=r20-r3|0;return r5}r3=r19<<8;r19=0;L2945:while(1){if((r19|0)>=(r3|0)){r4=2086;break}r20=r19*3&-1;r21=HEAP8[r20+(r1+1084)|0];if((r21&255)>116){r5=-1;r4=2101;break}r18=r21&255;if((r18&63)>>>0>36){r5=-1;r4=2097;break}r21=HEAP8[r20+(r1+1085)|0]&15;do{if(r21<<24>>24==12){if(HEAPU8[r20+(r1+1086)|0]>64){r5=-1;r4=2091;break L2945}else{r4=2083;break}}else if(r21<<24>>24==13){r8=r20+(r1+1086)|0;if(HEAPU8[r8]>64){r5=-1;r4=2094;break L2945}else{r22=r8;break}}else if(r21<<24>>24==11){if(HEAP8[r20+(r1+1086)|0]<<24>>24<0){r5=-1;r4=2111;break L2945}else{r4=2083;break}}else{r4=2083}}while(0);if(r4==2083){r4=0;r22=r20+(r1+1086)|0}if((r18>>>2&48|HEAPU8[r22]>>>4|0)>(r17|0)){r5=-1;r4=2110;break}else{r19=r19+1|0}}if(r4==2101){return r5}else if(r4==2086){if((r2|0)==0){r5=0;return r5}if((r1|0)==0){HEAP8[r2]=0;r5=0;return r5}else{_memcpy(r2,r1,20);HEAP8[r2+20|0]=0;r5=0;return r5}}else if(r4==2091){return r5}else if(r4==2110){return r5}else if(r4==2094){return r5}else if(r4==2097){return r5}else if(r4==2111){return r5}}}function _test_xann(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10;r4=0;if((r3|0)<2048){r5=2048-r3|0;return r5}if(HEAP8[r1+3|0]<<24>>24==60){r6=0}else{r5=-1;return r5}while(1){if((r6|0)>=128){r7=0;break}r3=r6<<2;r8=HEAPU8[r1+(r3|1)|0]<<16|HEAPU8[r1+r3|0]<<24|HEAPU8[r1+(r3|2)|0]<<8|HEAPU8[r1+(r3|3)|0];if((((r8|0)/4&-1)<<2|0)!=(r8|0)|(r8|0)>132156){r5=-1;r4=2133;break}else{r6=r6+1|0}}if(r4==2133){return r5}while(1){r6=HEAP8[r1+(r7<<2|3)|0];if(!(r6<<24>>24==60|r6<<24>>24==0)){r5=-1;r4=2127;break}r6=r7+1|0;if((r6|0)<64){r7=r6}else{r9=0;break}}if(r4==2127){return r5}while(1){if((r9|0)>=31){r10=0;break}if(HEAPU8[(r9<<4)+r1+519|0]>64){r5=-1;r4=2129;break}else{r9=r9+1|0}}if(r4==2129){return r5}while(1){if((r10|0)>=30){break}r9=r10<<4;r7=HEAPU8[r9+(r1+527)|0]<<16|HEAPU8[r9+(r1+526)|0]<<24|HEAPU8[r9+(r1+528)|0]<<8|HEAPU8[r9+(r1+529)|0];r9=r10+1|0;r6=r9<<4;r8=HEAPU8[r6+(r1+521)|0]<<16|HEAPU8[r6+(r1+520)|0]<<24|HEAPU8[r6+(r1+522)|0]<<8|HEAPU8[r6+(r1+523)|0];if((r7|0)<2108|(r8|0)<2108|(r7|0)>(r8|0)){r5=-1;r4=2132;break}else{r10=r9}}if(r4==2132){return r5}if((r2|0)==0){r5=0;return r5}HEAP8[r2]=0;r5=0;return r5}function _depack_unic2(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19;r3=STACKTOP;STACKTOP=STACKTOP+2052|0;r4=r3+1024;r5=r3|0;_memset(r5,0,20);_fwrite(r5,1,20,r2);r6=0;r7=0;while(1){r8=20;while(1){r9=_fread(r5,1,(r8|0)>1024?1024:r8,r1);_fwrite(r5,1,r9,r2);r10=r8-r9|0;if((r9|0)>0&(r10|0)>0){r8=r10}else{break}}_fputc(0,r2);_fputc(0,r2);r8=_fgetc(r1);r10=_fgetc(r1);r9=r8<<8&65280|r10&255;do{if((r9|0)==0){r11=0}else{if(r9>>>0<256){r11=16-r10|0;break}else{r11=-r10|0;break}}}while(0);r10=_fgetc(r1);r9=_fgetc(r1)&255;r8=r9|r10<<8&65280;_fputc(r10&255,r2);_fputc(r9,r2);r12=(r8<<1)+r7|0;_fgetc(r1);_fputc(r11&255,r2);_fputc(_fgetc(r1)&255,r2);r9=_fgetc(r1)&65535;r10=_fgetc(r1)&255|r9<<8;r9=r10&65535;r13=_fgetc(r1);r14=_fgetc(r1)&255;r15=r9<<1;r16=(r15+(r14|r13<<8&65280)|0)>(r8|0)|r10<<16>>16==0?r9:r15;_fputc(r16>>>8&255,r2);_fputc(r16&255,r2);_fputc(r13&255,r2);_fputc(r14,r2);r14=r6+1|0;if((r14|0)==31){break}else{r6=r14;r7=r12}}_fputc(_fgetc(r1)&255,r2);_fputc(127,r2);_fgetc(r1);r7=r4|0;_fread(r7,128,1,r1);_fwrite(r7,128,1,r2);r6=0;r11=0;while(1){r14=HEAP8[r4+r11|0];r17=(r14&255)>(r6&255)?r14:r6;r14=r11+1|0;if((r14|0)==128){break}else{r6=r17;r11=r14}}r11=r17+1&255;_fputc(77,r2);_fputc(46,r2);_fputc(75,r2);_fputc(46,r2);r17=r11&255;L3021:do{if(r11<<24>>24==0){r18=r12}else{r6=0;while(1){r14=0;while(1){r13=_fgetc(r1);r16=_fgetc(r1)&255;r15=_fgetc(r1)&255;r9=r13&63;if((r16&15)<<24>>24==13){r19=Math.floor((r15&255)/10)<<4|(r15&255)%10}else{r19=r15}r15=r14<<2;HEAP8[r4+r15|0]=HEAP8[(r9<<1)+5249008|0]|(r13&255)>>>2&16;HEAP8[r4+(r15|1)|0]=HEAP8[(r9<<1)+5249009|0];HEAP8[r4+(r15|2)|0]=r16;HEAP8[r4+(r15|3)|0]=r19;r15=r14+1|0;if((r15|0)==256){break}else{r14=r15}}_fwrite(r7,1024,1,r2);r14=r6+1|0;if((r14|0)<(r17|0)){r6=r14}else{r18=r12;break L3021}}}}while(0);while(1){r12=_fread(r5,1,(r18|0)>1024?1024:r18,r1);_fwrite(r5,1,r12,r2);r17=r18-r12|0;if((r12|0)>0&(r17|0)>0){r18=r17}else{break}}STACKTOP=r3;return 0}function _test_wn(r1,r2,r3){var r4;do{if((r3|0)<1082){r4=1082-r3|0}else{if(HEAP8[r1+1080|0]<<24>>24!=87){r4=-1;break}if(HEAP8[r1+1081|0]<<24>>24!=78){r4=-1;break}if(HEAP8[r1+951|0]<<24>>24!=127){r4=-1;break}if(HEAP8[r1+950|0]<<24>>24<0){r4=-1;break}if((r2|0)==0){r4=0;break}if((r1|0)==0){HEAP8[r2]=0;r4=0;break}else{_memcpy(r2,r1,20);HEAP8[r2+20|0]=0;r4=0;break}}}while(0);return r4}function _depack_wn(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15;r3=STACKTOP;STACKTOP=STACKTOP+2048|0;r4=r3+1024;r5=r3|0;r6=950;while(1){r7=_fread(r5,1,(r6|0)>1024?1024:r6,r1);_fwrite(r5,1,r7,r2);r8=r6-r7|0;if((r7|0)>0&(r8|0)>0){r6=r8}else{r9=0;r10=0;break}}while(1){_fseek(r1,(r10*30&-1)+42|0,0);r6=_fgetc(r1);r11=((_fgetc(r1)&255|r6<<8&65280)<<1)+r9|0;r6=r10+1|0;if((r6|0)==31){break}else{r9=r11;r10=r6}}_fseek(r1,950,0);_fputc(_fgetc(r1)&255,r2);r10=r4|0;_fread(r10,129,1,r1);_fwrite(r10,129,1,r2);_fputc(77,r2);_fputc(46,r2);_fputc(75,r2);_fputc(46,r2);r10=0;r9=0;while(1){r6=r9+1|0;r8=HEAP8[r4+r6|0];r12=(r8&255)>(r10&255)?r8:r10;if((r6|0)==128){break}else{r10=r12;r9=r6}}r9=r12+1&255;_fseek(r1,1084,0);r12=r9&255;L3055:do{if(r9<<24>>24==0){r13=r11}else{r10=0;while(1){r4=0;while(1){r6=_fgetc(r1);r8=_fgetc(r1);r7=_fgetc(r1);r14=_fgetc(r1);r15=r6>>>1&127;_fputc((HEAP8[(r15<<1)+5249008|0]|(r6&255)*-16&255)&255,r2);_fputc(HEAPU8[(r15<<1)+5249009|0],r2);_fputc((r8<<4|r7)&255,r2);_fputc(r14&255,r2);r14=r4+1|0;if((r14|0)==256){break}else{r4=r14}}r4=r10+1|0;if((r4|0)<(r12|0)){r10=r4}else{r13=r11;break L3055}}}}while(0);while(1){r11=_fread(r5,1,(r13|0)>1024?1024:r13,r1);_fwrite(r5,1,r11,r2);r12=r13-r11|0;if((r11|0)>0&(r12|0)>0){r13=r12}else{break}}STACKTOP=r3;return 0}function _depack_xann(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24;r3=STACKTOP;STACKTOP=STACKTOP+2180|0;r4=r3+1024;r5=r3+1152;r6=r4|0;_memset(r6,0,128);r7=r5|0;_memset(r7,0,1025);r8=r3|0;_memset(r8,0,20);_fwrite(r8,1,20,r2);_fseek(r1,518,0);r9=0;r10=0;while(1){_memset(r8,0,22);_fwrite(r8,1,22,r2);r11=_fgetc(r1);r12=_fgetc(r1);r13=_fgetc(r1);r14=_fgetc(r1);r15=r14<<16&16711680|r13<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255;r13=_fgetc(r1);r14=_fgetc(r1)&255;r16=_fgetc(r1);r17=_fgetc(r1);r18=r17<<16&16711680|r16<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255;r16=_fgetc(r1);r17=_fgetc(r1)&255;_fputc(r16&255,r2);_fputc(r17,r2);r19=((r17|r16<<8&65280)<<1)+r10|0;_fputc(r11&255,r2);_fputc(r12&255,r2);r12=(r15-r18|0)/2&-1;_fputc(r12>>>8&255,r2);_fputc(r12&255,r2);_fputc(r13&255,r2);_fputc(r14,r2);_fgetc(r1);_fgetc(r1);r14=r9+1|0;if((r14|0)==31){break}else{r9=r14;r10=r19}}_fseek(r1,0,0);r10=0;r9=0;while(1){r14=_fgetc(r1);r13=_fgetc(r1);r12=r13<<16&16711680|r14<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255;if((r12|0)==0){r20=r10;r21=r9;break}r14=((r12-60|0)/1024&-1)+255|0;r12=r14&255;HEAP8[r4+r9|0]=r12;r13=(r14&255)>>>0>(r10&255)>>>0?r12:r10;r12=r9+1|0;if((r12&255)<<24>>24>-1){r10=r13;r9=r12}else{r20=r13;r21=r12;break}}r9=r20+1&255;_fputc(r21,r2);_fputc(127,r2);_fwrite(r6,128,1,r2);_fputc(77,r2);_fputc(46,r2);_fputc(75,r2);_fputc(46,r2);_fseek(r1,1084,0);r6=r9&255;L3072:do{if(r9<<24>>24==0){r22=r19}else{r21=0;while(1){r20=0;while(1){r10=(_fgetc(r1)&255)>>>3;r4=_fgetc(r1);r12=_fgetc(r1);r13=_fgetc(r1)&255;r14=r12&255;if((r14|0)==40){r23=r13<<4|(r13&255)>>>4;r24=6}else if((r14|0)==76){r23=r13;r24=13}else if((r14|0)==88){r23=1;r24=14}else if((r14|0)==0|(r14|0)==4){r23=r13;r24=0}else if((r14|0)==72){r23=r13;r24=12}else if((r14|0)==24){r23=r13;r24=4}else if((r14|0)==96){r23=r13|32;r24=14}else if((r14|0)==136){r23=r13|-96;r24=14}else if((r14|0)==56){r23=r13;r24=9}else if((r14|0)==64){r23=r13;r24=10}else if((r14|0)==16){r23=r13;r24=3}else if((r14|0)==28){r23=r13;r24=4}else if((r14|0)==140){r23=r13|-80;r24=14}else if((r14|0)==132){r23=r13|-112;r24=14}else if((r14|0)==12){r23=r13;r24=2}else if((r14|0)==68){r23=r13;r24=11}else if((r14|0)==92){r23=r13|16;r24=14}else if((r14|0)==152){r23=r13|-32;r24=14}else if((r14|0)==36){r23=r13;r24=5}else if((r14|0)==20){r23=r13;r24=3}else if((r14|0)==60){r23=r13<<4|(r13&255)>>>4;r24=10}else if((r14|0)==80){r23=r13;r24=15}else if((r14|0)==148){r23=r13|-48;r24=14}else if((r14|0)==8){r23=r13;r24=1}else if((r14|0)==44){r23=r13;r24=6}else{r23=0;r24=0}r13=r20<<2;r14=r4>>>1&127;HEAP8[r5+r13|0]=HEAP8[(r14<<1)+5249008|0]|r10&16;HEAP8[r5+(r13|1)|0]=HEAP8[(r14<<1)+5249009|0];HEAP8[r5+(r13|2)|0]=r24|r10<<4;HEAP8[r5+(r13|3)|0]=r23;r13=r20+1|0;if((r13|0)==256){break}else{r20=r13}}_fwrite(r7,1024,1,r2);r20=r21+1|0;if((r20|0)<(r6|0)){r21=r20}else{r22=r19;break L3072}}}}while(0);while(1){r19=_fread(r8,1,(r22|0)>1024?1024:r22,r1);_fwrite(r8,1,r19,r2);r6=r22-r19|0;if((r19|0)>0&(r6|0)>0){r22=r6}else{break}}STACKTOP=r3;return 0}function _test_zen(r1,r2,r3){var r4,r5,r6,r7,r8,r9;r4=0;if((r3|0)<505){r5=505-r3|0;return r5}r6=HEAPU8[r1+1|0]<<16|HEAPU8[r1]<<24|HEAPU8[r1+2|0]<<8|HEAPU8[r1+3|0];if((r6-502|0)>>>0>2162688){r5=-1;return r5}else{r7=0}while(1){if((r7|0)>=31){r8=0;r4=2218;break}r9=r7<<4;if(HEAPU8[r1+(r9|9)|0]>64){r5=-1;r4=2235;break}if(((HEAPU8[r1+(r9|6)|0]<<8|HEAPU8[r1+(r9|7)|0])&65535)%72<<16>>16==0){r7=r7+1|0}else{r5=-1;r4=2230;break}}if(r4==2235){return r5}else if(r4==2218){while(1){r4=0;r7=r8<<4;r9=r7|14;if(HEAPU8[r1+(r7|10)|0]<<9>>>0>65535){r5=-1;r4=2237;break}if(HEAPU8[r1+(r7|12)|0]<<9>>>0>65535|(HEAPU8[r1+(r7|15)|0]<<16|HEAPU8[r1+r9|0]<<24|HEAPU8[r9+(r1+2)|0]<<8|HEAPU8[r9+(r1+3)|0]|0)<(r6|0)){r5=-1;r4=2229;break}r9=r8+1|0;if((r9|0)<31){r8=r9;r4=2218}else{r4=2221;break}}if(r4==2229){return r5}else if(r4==2221){r8=HEAP8[r1+5|0];if(r8<<24>>24<1){r5=-1;return r5}r9=(r8&255)<<2;r8=r9+(r6+4)|0;if((r8|0)>(r3|0)){r5=r8-r3|0;return r5}r3=r9+r6|0;if((HEAPU8[r3+(r1+1)|0]<<16|HEAPU8[r1+r3|0]<<24|HEAPU8[r3+(r1+2)|0]<<8|HEAPU8[r3+(r1+3)|0]|0)!=-1){r5=-1;return r5}if((r2|0)==0){r5=0;return r5}HEAP8[r2]=0;r5=0;return r5}else if(r4==2237){return r5}}else if(r4==2230){return r5}}function _depack_zen(r1,r2){var r3,r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+3200|0;r5=r4+1024;r6=r4+2048;r7=r4+2176,r8=r7>>2;r9=r4+2688;_memset(r7,0,512);_memset(r9,0,512);r10=r6|0;_memset(r10,0,128);r11=_fgetc(r1);r12=_fgetc(r1);r13=_fgetc(r1);r14=_fgetc(r1);r15=_fgetc(r1);r16=_fgetc(r1);r17=r4|0;_memset(r17,0,20);_fwrite(r17,1,20,r2);r18=r12<<16&16711680|r11<<24|r13<<8&65280|r14&255;r14=0;r13=999999;r11=0;while(1){_memset(r17,0,22);_fwrite(r17,1,22,r2);r12=_fgetc(r1)&65535;r19=Math.floor(((_fgetc(r1)&255|r12<<8)&65535)/72)&65535;_fgetc(r1);r12=_fgetc(r1);r20=_fgetc(r1);r21=_fgetc(r1)&255;_fputc(r20&255,r2);_fputc(r21,r2);r22=((r21|r20<<8&65280)<<1)+r14|0;_fputc(r19&255,r2);_fputc(r12&255,r2);r12=_fgetc(r1);r19=_fgetc(r1)&255;r20=_fgetc(r1);r21=_fgetc(r1);r23=r21<<16&16711680|r20<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255;r24=(r23|0)<(r13|0)?r23:r13;r20=_fgetc(r1);r21=_fgetc(r1);r25=(r21<<16&16711680|r20<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255)-r23|0;_fputc(r25>>>9&255,r2);_fputc(r25>>>1&255,r2);_fputc(r12&255,r2);_fputc(r19,r2);r19=r11+1|0;if((r19|0)==31){break}else{r14=r22;r13=r24;r11=r19}}r11=r16&255;_fputc(r11,r2);_fputc(127,r2);_fseek(r1,r18,0);r18=(r11|0)==0;L3148:do{if(!r18){r16=0;while(1){r13=_fgetc(r1);r14=_fgetc(r1);HEAP32[(r16<<2>>2)+r8]=r14<<16&16711680|r13<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255;r13=r16+1|0;if((r13|0)<(r11|0)){r16=r13}else{break}}if(r18){break}r16=HEAP32[r8];r13=r9|0;r14=0;r19=0;while(1){do{if((r19|0)==0){HEAP8[r10]=0;HEAP32[r13>>2]=r16;r26=r14+1&255}else{r12=(r19<<2)+r7|0;r25=0;while(1){if((r25|0)>=(r19|0)){break}if((HEAP32[r12>>2]|0)==(HEAP32[(r25<<2>>2)+r8]|0)){r3=2250;break}else{r25=r25+1|0}}if(r3==2250){r3=0;HEAP8[r6+r19|0]=HEAP8[r6+r25|0]}if((r25|0)!=(r19|0)){r26=r14;break}HEAP32[r9+((r14&255)<<2)>>2]=HEAP32[r12>>2];HEAP8[r6+r19|0]=r14;r26=r14+1&255}}while(0);r23=r19+1|0;if((r23|0)<(r11|0)){r14=r26;r19=r23}else{break L3148}}}}while(0);_fwrite(r10,128,1,r2);_fputc(77,r2);_fputc(46,r2);_fputc(75,r2);_fputc(46,r2);r10=r5|0;r26=(r15&255)+1|0;r15=0;while(1){_memset(r10,0,1024);_fseek(r1,HEAP32[r9+(r15<<2)>>2],0);while(1){r11=_fgetc(r1);r6=_fgetc(r1);r3=_fgetc(r1)&255;r8=_fgetc(r1)&255;r7=r6>>>1&63;r18=r11&255;r11=r18<<2;HEAP8[r5+r11|0]=(r6&255)<<4&16|HEAP8[(r7<<1)+5249008|0];HEAP8[r5+(r11|1)|0]=HEAP8[(r7<<1)+5249009|0];HEAP8[r5+(r11|2)|0]=r3;HEAP8[r5+(r11|3)|0]=r8;if((r18+1|0)>>>0>=256){break}}_fwrite(r10,1024,1,r2);r18=r15+1|0;if((r18|0)==(r26|0)){break}else{r15=r18}}_fseek(r1,r24,0);r24=r22;while(1){r22=_fread(r17,1,(r24|0)>1024?1024:r24,r1);_fwrite(r17,1,r22,r2);r15=r24-r22|0;if((r22|0)>0&(r15|0)>0){r24=r15}else{break}}STACKTOP=r4;return 0}function _psm_test(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+64|0;r5=r4;r6=_fgetc(r1);r7=_fgetc(r1);if((r7<<16&16711680|r6<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255|0)!=1347636734){r8=-1;STACKTOP=r4;return r8}r6=r5|0;if((r2|0)==0){r8=0;STACKTOP=r4;return r8}_memset(r2,0,61);_fread(r6,1,60,r1);HEAP8[r5+60|0]=0;_memset(r2,0,61);_strncpy(r2,r6,60);r6=HEAP8[r2];if(r6<<24>>24==0){r8=0;STACKTOP=r4;return r8}else{r9=0;r10=r2;r11=r6}while(1){do{if((_isprint(r11<<24>>24)|0)==0){r3=2267}else{if(HEAP8[r10]<<24>>24<0){r3=2267;break}else{break}}}while(0);if(r3==2267){r3=0;HEAP8[r10]=46}r6=r9+1|0;r5=r2+r6|0;r1=HEAP8[r5];if(r1<<24>>24!=0&(r6|0)<60){r9=r6;r10=r5;r11=r1}else{break}}if(HEAP8[r2]<<24>>24==0){r8=0;STACKTOP=r4;return r8}while(1){r11=r2+(_strlen(r2)-1)|0;if(HEAP8[r11]<<24>>24!=32){r8=0;r3=2275;break}HEAP8[r11]=0;if(HEAP8[r2]<<24>>24==0){r8=0;r3=2272;break}}if(r3==2275){STACKTOP=r4;return r8}else if(r3==2272){STACKTOP=r4;return r8}}function _psm_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+1280|0;r6=r5+1024;_fseek(r2,r3,0);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r7=r5|0;_fread(r7,1,60,r2);_strncpy(r1|0,r7,64);r8=_fgetc(r2);r9=_fgetc(r2);_fgetc(r2);if((r8&1|0)!=0){r10=-1;STACKTOP=r5;return r10}_set_type(r1,5267004,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r9>>>4&15,HEAP32[tempInt+4>>2]=r9&15,tempInt));HEAP32[r1+148>>2]=_fgetc(r2)&255;HEAP32[r1+152>>2]=_fgetc(r2)&255;_fgetc(r2);_fgetc(r2);_fgetc(r2);r9=r1+156|0;HEAP32[r9>>2]=_fgetc(r2)&255|_fgetc(r2)<<8&65280;r8=(r1+128|0)>>2;HEAP32[r8]=_fgetc(r2)&255|_fgetc(r2)<<8&65280;r11=(r1+140|0)>>2;HEAP32[r11]=_fgetc(r2)&255|_fgetc(r2)<<8&65280;r12=(r1+136|0)>>2;HEAP32[r12]=_fgetc(r2)&255|_fgetc(r2)<<8&65280;_fgetc(r2);_fgetc(r2);r13=r1+144|0;HEAP32[r13>>2]=HEAP32[r11];r14=r1+132|0;HEAP32[r14>>2]=Math.imul(HEAP32[r12],HEAP32[r8]);r15=_fgetc(r2)&255;r16=_fgetc(r2);r17=r16<<8&65280|r15|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r15=_fgetc(r2)&255;r16=_fgetc(r2);r18=r16<<8&65280|r15|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r15=_fgetc(r2)&255;r16=_fgetc(r2);r19=r16<<8&65280|r15|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r15=_fgetc(r2)&255;r16=_fgetc(r2);r20=r16<<8&65280|r15|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;_fseek(r2,r17+r3|0,0);_fread(r1+952|0,1,HEAP32[r9>>2],r2);_fseek(r2,r18+r3|0,0);_fread(r7,1,16,r2);r18=(r1+176|0)>>2;HEAP32[r18]=_calloc(764,HEAP32[r11]);r9=HEAP32[r13>>2];if((r9|0)!=0){HEAP32[r1+180>>2]=_calloc(52,r9)}_fseek(r2,r20+r3|0,0);L3208:do{if((HEAP32[r11]|0)>0){r20=(r1+180|0)>>2;r9=0;while(1){r13=_calloc(64,1);HEAP32[HEAP32[r18]+(r9*764&-1)+756>>2]=r13;_fread(r7,1,13,r2);_fread(r7,1,24,r2);_strncpy(HEAP32[r18]+(r9*764&-1)|0,r7,24);r13=HEAP32[r18];r17=r13+(r9*764&-1)|0;r15=HEAP8[r17];L3212:do{if(r15<<24>>24!=0){r16=0;r21=r15;while(1){r22=r13+(r9*764&-1)+r16|0;do{if((_isprint(r21<<24>>24)|0)==0){r4=2287}else{if(HEAP8[r22]<<24>>24<0){r4=2287;break}else{break}}}while(0);if(r4==2287){r4=0;HEAP8[r22]=32}r23=r16+1|0;if(r23>>>0>=_strlen(r17)>>>0){break}r16=r23;r21=HEAP8[r13+(r9*764&-1)+r23|0]}if(HEAP8[r17]<<24>>24==0){break}while(1){r21=_strlen(r17)-1+r13+(r9*764&-1)|0;if(HEAP8[r21]<<24>>24!=32){break L3212}HEAP8[r21]=0;if(HEAP8[r17]<<24>>24==0){break L3212}}}}while(0);r17=_fgetc(r2)&255;r13=_fgetc(r2);HEAP32[r6+(r9<<2)>>2]=r13<<8&65280|r17|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);r17=_fgetc(r2);r13=_fgetc(r2)&255;r15=_fgetc(r2);r21=r15<<8&65280|r13|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;HEAP32[HEAP32[r20]+(r9*52&-1)+32>>2]=r21;r21=_fgetc(r2)&255;r13=_fgetc(r2);r15=r13<<8&65280|r21|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;HEAP32[HEAP32[r20]+(r9*52&-1)+36>>2]=r15;r15=_fgetc(r2)&255;r21=_fgetc(r2);r13=r21<<8&65280|r15|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;HEAP32[HEAP32[r20]+(r9*52&-1)+40>>2]=r13;r13=(_fgetc(r2)&255)<<28>>24;r15=_fgetc(r2)&255;HEAP32[HEAP32[HEAP32[r18]+(r9*764&-1)+756>>2]>>2]=r15;r15=Math.floor((((_fgetc(r2)&255|_fgetc(r2)<<8&65280)*8363&-1)>>>0)/8448);HEAP32[HEAP32[HEAP32[r18]+(r9*764&-1)+756>>2]+8>>2]=128;HEAP32[HEAP32[HEAP32[r18]+(r9*764&-1)+756>>2]+40>>2]=r9;HEAP32[HEAP32[r18]+(r9*764&-1)+36>>2]=(HEAP32[HEAP32[r20]+(r9*52&-1)+32>>2]|0)!=0&1;HEAP32[HEAP32[r20]+(r9*52&-1)+44>>2]=r17>>>6&2;r21=HEAP32[r20]+(r9*52&-1)+44|0;HEAP32[r21>>2]=HEAP32[r21>>2]|r17>>>3&4;r17=r15&65535;r15=HEAP32[HEAP32[r18]+(r9*764&-1)+756>>2];r21=r15+12|0;r16=r15+16|0;if((r17|0)==0){HEAP32[r16>>2]=0;HEAP32[r21>>2]=0}else{r15=Math.log((r17|0)/8363)*1536/.6931471805599453&-1;HEAP32[r21>>2]=(r15|0)/128&-1;HEAP32[r16>>2]=(r15|0)%128}r15=HEAP32[HEAP32[r18]+(r9*764&-1)+756>>2]+16|0;HEAP32[r15>>2]=HEAP32[r15>>2]+r13|0;r13=r9+1|0;if((r13|0)<(HEAP32[r11]|0)){r9=r13}else{break L3208}}}}while(0);r4=(r1+172|0)>>2;HEAP32[r4]=_calloc(4,HEAP32[r14>>2]);r14=(r1+168|0)>>2;HEAP32[r14]=_calloc(4,HEAP32[r8]+1|0);_fseek(r2,r19+r3|0,0);L3231:do{if((HEAP32[r8]|0)>0){r19=0;while(1){r7=(_fgetc(r2)&255|_fgetc(r2)<<8&65280)-4|0;r9=_fgetc(r2);_fgetc(r2);r20=_calloc(1,(HEAP32[r12]<<2)+4|0);HEAP32[HEAP32[r14]+(r19<<2)>>2]=r20;r20=r9&255;HEAP32[HEAP32[HEAP32[r14]+(r19<<2)>>2]>>2]=r20;r9=HEAP32[r12];L3234:do{if((r9|0)>0){r13=0;r15=r9;while(1){r16=Math.imul(r15,r19)+r13|0;HEAP32[HEAP32[HEAP32[r14]+(r19<<2)>>2]+(r13<<2)+4>>2]=r16;r16=_calloc(HEAP32[HEAP32[HEAP32[r14]+(r19<<2)>>2]>>2]<<3|4,1);r21=Math.imul(HEAP32[r12],r19)+r13|0;HEAP32[HEAP32[r4]+(r21<<2)>>2]=r16;r16=HEAP32[HEAP32[HEAP32[r14]+(r19<<2)>>2]>>2];r21=Math.imul(HEAP32[r12],r19)+r13|0;HEAP32[HEAP32[HEAP32[r4]+(r21<<2)>>2]>>2]=r16;r16=r13+1|0;r21=HEAP32[r12];if((r16|0)<(r21|0)){r13=r16;r15=r21}else{break L3234}}}}while(0);L3238:do{if((r20|0)==0){r24=r7}else{r9=r7;r15=0;while(1){L3241:do{if((r9|0)>0){r13=r9;while(1){r21=_fgetc(r2);r16=r13-1|0;if((r21&255)<<24>>24==0){r25=r16;break L3241}r17=HEAP32[HEAP32[r4]+(HEAP32[HEAP32[HEAP32[r14]+(r19<<2)>>2]+((r21&15)<<2)+4>>2]<<2)>>2];if((r21&128|0)==0){r26=r16}else{HEAP8[(r15<<3)+r17+4|0]=(_fgetc(r2)&255)+37&255;HEAP8[(r15<<3)+r17+5|0]=_fgetc(r2)&255;r26=r13-3|0}if((r21&64|0)==0){r27=r26}else{HEAP8[(r15<<3)+r17+6|0]=(_fgetc(r2)&255)+1&255;r27=r26-1|0}if((r21&32|0)==0){r28=r27}else{HEAP8[(r15<<3)+r17+7|0]=_fgetc(r2)&255;HEAP8[(r15<<3)+r17+8|0]=_fgetc(r2)&255;r28=r27-2|0}if((r28|0)>0){r13=r28}else{r25=r28;break L3241}}}else{r25=r9}}while(0);r22=r15+1|0;if((r22|0)<(r20|0)){r9=r25;r15=r22}else{r24=r25;break L3238}}}}while(0);if((r24|0)>0){_fseek(r2,r24,1)}r20=r19+1|0;if((r20|0)<(HEAP32[r8]|0)){r19=r20}else{break L3231}}}}while(0);if((HEAP32[r11]|0)<=0){r10=0;STACKTOP=r5;return r10}r8=r1+180|0;r1=0;while(1){_fseek(r2,HEAP32[r6+(r1<<2)>>2]+r3|0,0);_load_sample(r2,1,HEAP32[r8>>2]+(HEAP32[HEAP32[HEAP32[r18]+(r1*764&-1)+756>>2]+40>>2]*52&-1)|0,0);r24=r1+1|0;if((r24|0)<(HEAP32[r11]|0)){r1=r24}else{r10=0;break}}STACKTOP=r5;return r10}function _pt3_test(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+64|0;r5=r4;r6=_fgetc(r1);r7=_fgetc(r1);if((r7<<16&16711680|r6<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255|0)!=1179603533){r8=-1;STACKTOP=r4;return r8}_fgetc(r1);_fgetc(r1);_fgetc(r1);_fgetc(r1);r6=_fgetc(r1);r7=_fgetc(r1);if((r7<<16&16711680|r6<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255|0)!=1297040460){r8=-1;STACKTOP=r4;return r8}r6=_fgetc(r1);r7=_fgetc(r1);if((r7<<16&16711680|r6<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255|0)!=1447383635){r8=-1;STACKTOP=r4;return r8}_fgetc(r1);_fgetc(r1);_fgetc(r1);_fgetc(r1);_fseek(r1,10,1);r6=_fgetc(r1);r7=_fgetc(r1);if((r7<<16&16711680|r6<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255|0)!=1229866575){r6=r5|0;if((r2|0)==0){r8=0;STACKTOP=r4;return r8}HEAP8[r2]=0;_fread(r6,1,0,r1);HEAP8[r6]=0;HEAP8[r2]=0;_strncpy(r2,r6,0);if(HEAP8[r2]<<24>>24==0){r8=0;STACKTOP=r4;return r8}while(1){r6=r2+(_strlen(r2)-1)|0;if(HEAP8[r6]<<24>>24!=32){r8=0;r3=2341;break}HEAP8[r6]=0;if(HEAP8[r2]<<24>>24==0){r8=0;r3=2345;break}}if(r3==2345){STACKTOP=r4;return r8}else if(r3==2341){STACKTOP=r4;return r8}}_fgetc(r1);_fgetc(r1);_fgetc(r1);_fgetc(r1);r6=r5|0;if((r2|0)==0){r8=0;STACKTOP=r4;return r8}_memset(r2,0,33);_fread(r6,1,32,r1);HEAP8[r5+32|0]=0;_memset(r2,0,33);_strncpy(r2,r6,32);r6=HEAP8[r2];if(r6<<24>>24==0){r8=0;STACKTOP=r4;return r8}else{r9=0;r10=r2;r11=r6}while(1){do{if((_isprint(r11<<24>>24)|0)==0){r3=2329}else{if(HEAP8[r10]<<24>>24<0){r3=2329;break}else{break}}}while(0);if(r3==2329){r3=0;HEAP8[r10]=46}r6=r9+1|0;r5=r2+r6|0;r1=HEAP8[r5];if(r1<<24>>24!=0&(r6|0)<32){r9=r6;r10=r5;r11=r1}else{break}}if(HEAP8[r2]<<24>>24==0){r8=0;STACKTOP=r4;return r8}while(1){r11=r2+(_strlen(r2)-1)|0;if(HEAP8[r11]<<24>>24!=32){r8=0;r3=2338;break}HEAP8[r11]=0;if(HEAP8[r2]<<24>>24==0){r8=0;r3=2346;break}}if(r3==2338){STACKTOP=r4;return r8}else if(r3==2346){STACKTOP=r4;return r8}}function _pt3_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r4=STACKTOP;STACKTOP=STACKTOP+20|0;r5=r4;_fseek(r2,r3,0);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fgetc(r2);_fread(r5|0,1,10,r2);_set_type(r1,5266984,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r5+4|0,tempInt));r5=_malloc(16);if((r5|0)==0){r6=-1;STACKTOP=r4;return r6}r3=r5;r7=r5;HEAP32[r7>>2]=r3;r8=(r5+4|0)>>2;HEAP32[r8]=r3;HEAP32[r5+8>>2]=4;r9=(r5+12|0)>>2;HEAP32[r9]=0;r10=_malloc(20);HEAP8[r10]=HEAP8[5265796];HEAP8[r10+1|0]=HEAP8[5265797|0];HEAP8[r10+2|0]=HEAP8[5265798|0];HEAP8[r10+3|0]=HEAP8[5265799|0];HEAP8[r10+4|0]=HEAP8[5265800|0];HEAP32[r10+8>>2]=566;r11=r10+12|0;r12=r11;r13=HEAP32[r8];HEAP32[r8]=r12;HEAP32[r11>>2]=r3;HEAP32[r10+16>>2]=r13;HEAP32[r13>>2]=r12;r12=_malloc(20);HEAP8[r12]=HEAP8[5265064];HEAP8[r12+1|0]=HEAP8[5265065|0];HEAP8[r12+2|0]=HEAP8[5265066|0];HEAP8[r12+3|0]=HEAP8[5265067|0];HEAP8[r12+4|0]=HEAP8[5265068|0];HEAP32[r12+8>>2]=4;r13=r12+12|0;r10=r13;r11=HEAP32[r8];HEAP32[r8]=r10;HEAP32[r13>>2]=r3;HEAP32[r12+16>>2]=r11;HEAP32[r11>>2]=r10;r10=_malloc(20);HEAP8[r10]=HEAP8[5264472];HEAP8[r10+1|0]=HEAP8[5264473|0];HEAP8[r10+2|0]=HEAP8[5264474|0];HEAP8[r10+3|0]=HEAP8[5264475|0];HEAP8[r10+4|0]=HEAP8[5264476|0];HEAP32[r10+8>>2]=308;r11=r10+12|0;r12=r11;r13=HEAP32[r8];HEAP32[r8]=r12;HEAP32[r11>>2]=r3;HEAP32[r10+16>>2]=r13;HEAP32[r13>>2]=r12;HEAP32[r9]=HEAP32[r9]|2;L3315:do{if((_feof(r2)|0)==0){while(1){_iff_chunk(r5,r1,r2,0);if((_feof(r2)|0)!=0){break L3315}}}}while(0);r2=HEAP32[r7>>2];L3319:do{if((r2|0)!=(r3|0)){r7=r2;while(1){r1=r7-16+4|0;r9=HEAP32[r1+12>>2];r12=HEAP32[r1+16>>2];HEAP32[r9+4>>2]=r12;HEAP32[r12>>2]=r9;r9=HEAP32[r7>>2];_free(r1);if((r9|0)==(r3|0)){break L3319}else{r7=r9}}}}while(0);_free(r5);r6=0;STACKTOP=r4;return r6}function _get_info526(r1,r2,r3,r4){r4=r1>>2;_fread(r1|0,1,32,r3);r1=_fgetc(r3);HEAP32[r4+35]=_fgetc(r3)&255|r1<<8&65280;r1=_fgetc(r3);HEAP32[r4+39]=_fgetc(r3)&255|r1<<8&65280;r1=_fgetc(r3);HEAP32[r4+32]=_fgetc(r3)&255|r1<<8&65280;r1=_fgetc(r3);HEAP32[r4+41]=_fgetc(r3)&255|r1<<8&65280;r1=_fgetc(r3);HEAP32[r4+38]=_fgetc(r3)&255|r1<<8&65280;_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);_fgetc(r3);return}function _get_cmnt(r1,r2,r3,r4){return}function _get_ptdt(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35;r4=0;r2=STACKTOP;STACKTOP=STACKTOP+1088|0;r5=r2,r6=r5>>1;r7=r2+1084;r8=r7|0;_fread(r5|0,20,1,r3);r9=0;while(1){_fread(r5+(r9*30&-1)+20|0,22,1,r3);r10=_fgetc(r3)&65535;HEAP16[((r9*30&-1)+42>>1)+r6]=_fgetc(r3)&255|r10<<8;HEAP8[r5+(r9*30&-1)+44|0]=_fgetc(r3)&255;HEAP8[r5+(r9*30&-1)+45|0]=_fgetc(r3)&255;r10=_fgetc(r3)&65535;HEAP16[((r9*30&-1)+46>>1)+r6]=_fgetc(r3)&255|r10<<8;r10=_fgetc(r3)&65535;HEAP16[((r9*30&-1)+48>>1)+r6]=_fgetc(r3)&255|r10<<8;r10=r9+1|0;if((r10|0)==31){break}else{r9=r10}}r9=r5+950|0;HEAP8[r9]=_fgetc(r3)&255;HEAP8[r5+951|0]=_fgetc(r3)&255;r10=r5+952|0;_fread(r10,128,1,r3);_fread(r5+1080|0,4,1,r3);r11=(r1+140|0)>>2;HEAP32[r11]=31;r12=(r1+144|0)>>2;HEAP32[r12]=31;r13=(r1+136|0)>>2;HEAP32[r13]=4;r14=HEAP16[r9>>1];HEAP32[r1+156>>2]=r14&255;HEAP32[r1+160>>2]=(r14&65535)>>>8&65535;_memcpy(r1+952|0,r10,128);r10=(r1+128|0)>>2;r14=0;r9=HEAP32[r10];while(1){r15=HEAPU8[r1+(r14+952)|0];if((r15|0)>(r9|0)){HEAP32[r10]=r15;r16=r15}else{r16=r9}r15=r14+1|0;if((r15|0)==128){break}else{r14=r15;r9=r16}}r9=r16+1|0;HEAP32[r10]=r9;r16=r1+132|0;HEAP32[r16>>2]=r9<<2;r9=(r1+176|0)>>2;HEAP32[r9]=_calloc(764,31);r14=HEAP32[r12];if((r14|0)!=0){HEAP32[r1+180>>2]=_calloc(52,r14)}L3339:do{if((HEAP32[r11]|0)>0){r14=(r1+180|0)>>2;r15=0;while(1){r17=_calloc(64,1);HEAP32[HEAP32[r9]+(r15*764&-1)+756>>2]=r17;HEAP32[HEAP32[r14]+(r15*52&-1)+32>>2]=HEAPU16[((r15*30&-1)+42>>1)+r6]<<1;HEAP32[HEAP32[r14]+(r15*52&-1)+36>>2]=HEAPU16[((r15*30&-1)+46>>1)+r6]<<1;r17=HEAP32[r14];r18=HEAP16[((r15*30&-1)+48>>1)+r6];HEAP32[r17+(r15*52&-1)+40>>2]=((r18&65535)<<1)+HEAP32[r17+(r15*52&-1)+36>>2]|0;HEAP32[HEAP32[r14]+(r15*52&-1)+44>>2]=(r18&65535)>1?2:0;HEAP32[HEAP32[HEAP32[r9]+(r15*764&-1)+756>>2]+16>>2]=HEAP8[r5+(r15*30&-1)+44|0]<<28>>24;HEAP32[HEAP32[HEAP32[r9]+(r15*764&-1)+756>>2]>>2]=HEAP8[r5+(r15*30&-1)+45|0]<<24>>24;HEAP32[HEAP32[HEAP32[r9]+(r15*764&-1)+756>>2]+8>>2]=128;HEAP32[HEAP32[HEAP32[r9]+(r15*764&-1)+756>>2]+40>>2]=r15;HEAP32[HEAP32[r9]+(r15*764&-1)+36>>2]=(HEAP32[HEAP32[r14]+(r15*52&-1)+32>>2]|0)!=0&1;HEAP32[HEAP32[r9]+(r15*764&-1)+40>>2]=4095;r18=HEAP32[r9];r17=r18+(r15*764&-1)|0;_memset(r17,0,23);_strncpy(r17,r5+(r15*30&-1)+20|0,22);r19=HEAP8[r17];L3343:do{if(r19<<24>>24!=0){r20=0;r21=r17;r22=r19;while(1){do{if((_isprint(r22<<24>>24)|0)==0){r4=2375}else{if(HEAP8[r21]<<24>>24<0){r4=2375;break}else{break}}}while(0);if(r4==2375){r4=0;HEAP8[r21]=46}r23=r20+1|0;r24=r18+(r15*764&-1)+r23|0;r25=HEAP8[r24];if(r25<<24>>24!=0&(r23|0)<22){r20=r23;r21=r24;r22=r25}else{break}}if(HEAP8[r17]<<24>>24==0){break}while(1){r22=_strlen(r17)-1+r18+(r15*764&-1)|0;if(HEAP8[r22]<<24>>24!=32){break L3343}HEAP8[r22]=0;if(HEAP8[r17]<<24>>24==0){break L3343}}}}while(0);r17=r15+1|0;if((r17|0)<(HEAP32[r11]|0)){r15=r17}else{break L3339}}}}while(0);r11=(r1+172|0)>>2;HEAP32[r11]=_calloc(4,HEAP32[r16>>2]);r16=(r1+168|0)>>2;HEAP32[r16]=_calloc(4,HEAP32[r10]+1|0);L3357:do{if((HEAP32[r10]|0)>0){r4=r7+1|0;r5=r7+2|0;r6=r7+3|0;r15=0;while(1){r14=_calloc(1,(HEAP32[r13]<<2)+4|0);HEAP32[HEAP32[r16]+(r15<<2)>>2]=r14;HEAP32[HEAP32[HEAP32[r16]+(r15<<2)>>2]>>2]=64;r14=HEAP32[r13];L3361:do{if((r14|0)>0){r17=0;r18=r14;while(1){r19=Math.imul(r18,r15)+r17|0;HEAP32[HEAP32[HEAP32[r16]+(r15<<2)>>2]+(r17<<2)+4>>2]=r19;r19=_calloc(HEAP32[HEAP32[HEAP32[r16]+(r15<<2)>>2]>>2]<<3|4,1);r22=Math.imul(HEAP32[r13],r15)+r17|0;HEAP32[HEAP32[r11]+(r22<<2)>>2]=r19;r19=HEAP32[HEAP32[HEAP32[r16]+(r15<<2)>>2]>>2];r22=Math.imul(HEAP32[r13],r15)+r17|0;HEAP32[HEAP32[HEAP32[r11]+(r22<<2)>>2]>>2]=r19;r19=r17+1|0;r22=HEAP32[r13];if((r19|0)<(r22|0)){r17=r19;r18=r22}else{r26=0;break L3361}}}else{r26=0}}while(0);while(1){r14=(r26|0)/4&-1;r18=HEAP32[HEAP32[r11]+(HEAP32[HEAP32[HEAP32[r16]+(r15<<2)>>2]+((r26|0)%4<<2)+4>>2]<<2)>>2];_fread(r8,1,4,r3);r17=HEAP8[r8];r22=(r17&255)<<8&3840|HEAPU8[r4];if((r22|0)==0){r27=0}else{L3368:do{if(r22>>>0<3628){r19=r22;r21=24;while(1){r20=r21+12|0;r25=r19<<1;if((r25|0)<3628){r19=r25;r21=r20}else{r28=r25;r29=r20;break L3368}}}else{r28=r22;r29=24}}while(0);L3372:do{if((r28|0)>3842){r22=r29;r21=5249472;while(1){r19=r21-32|0;r20=r22-1|0;r25=HEAP32[r19>>2];if((r28|0)>(r25|0)){r22=r20;r21=r19}else{r30=r20;r31=r19,r32=r31>>2;r33=r25;break L3372}}}else{r30=r29;r31=5249472,r32=r31>>2;r33=3842}}while(0);do{if((r33|0)>(r28|0)){if((HEAP32[r32+1]|0)<=(r28|0)){r34=1;break}if((HEAP32[r32+2]|0)<=(r28|0)){r34=1;break}r34=(HEAP32[r32+3]|0)<=(r28|0)&1}else{r34=1}}while(0);r27=r30-r34&255}HEAP8[(r14<<3)+r18+4|0]=r27;r21=HEAP8[r5];HEAP8[(r14<<3)+r18+5|0]=(r21&255)>>>4|r17&-16;r22=r21&15;r21=(r14<<3)+r18+7|0;HEAP8[r21]=r22;r25=HEAP8[r6];HEAP8[(r14<<3)+r18+8|0]=r25;do{if(r25<<24>>24==0){r19=r22&255;if((r19|0)==6){HEAP8[r21]=4;break}else if((r19|0)==5){HEAP8[r21]=3;break}else if((r19|0)==1|(r19|0)==2|(r19|0)==10){HEAP8[r21]=0;break}else{break}}}while(0);r21=r26+1|0;if((r21|0)==256){break}else{r26=r21}}r21=r15+1|0;if((r21|0)<(HEAP32[r10]|0)){r15=r21}else{break L3357}}}}while(0);r10=r1+1276|0;HEAP32[r10>>2]=HEAP32[r10>>2]|8192;r10=HEAP32[r12];if((r10|0)<=0){STACKTOP=r2;return}r26=r1+180|0;r1=0;r27=r10;while(1){r10=HEAP32[r26>>2];if((HEAP32[r10+(r1*52&-1)+32>>2]|0)==0){r35=r27}else{_load_sample(r3,0,r10+(HEAP32[HEAP32[HEAP32[r9]+(r1*764&-1)+756>>2]+40>>2]*52&-1)|0,0);r35=HEAP32[r12]}r10=r1+1|0;if((r10|0)<(r35|0)){r1=r10;r27=r35}else{break}}STACKTOP=r2;return}function _ptm_test(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+64|0;r6=r5;_fseek(r1,r3+44|0,0);r7=_fgetc(r1);r8=_fgetc(r1);if((r8<<16&16711680|r7<<24|_fgetc(r1)<<8&65280|_fgetc(r1)&255|0)!=1347702086){r9=-1;STACKTOP=r5;return r9}_fseek(r1,r3,0);r3=r6|0;if((r2|0)==0){r9=0;STACKTOP=r5;return r9}_memset(r2,0,29);_fread(r3,1,28,r1);HEAP8[r6+28|0]=0;_memset(r2,0,29);_strncpy(r2,r3,28);r3=HEAP8[r2];if(r3<<24>>24==0){r9=0;STACKTOP=r5;return r9}else{r10=0;r11=r2;r12=r3}while(1){do{if((_isprint(r12<<24>>24)|0)==0){r4=2415}else{if(HEAP8[r11]<<24>>24<0){r4=2415;break}else{break}}}while(0);if(r4==2415){r4=0;HEAP8[r11]=46}r3=r10+1|0;r6=r2+r3|0;r1=HEAP8[r6];if(r1<<24>>24!=0&(r3|0)<28){r10=r3;r11=r6;r12=r1}else{break}}if(HEAP8[r2]<<24>>24==0){r9=0;STACKTOP=r5;return r9}while(1){r12=r2+(_strlen(r2)-1)|0;if(HEAP8[r12]<<24>>24!=32){r9=0;r4=2425;break}HEAP8[r12]=0;if(HEAP8[r2]<<24>>24==0){r9=0;r4=2423;break}}if(r4==2423){STACKTOP=r5;return r9}else if(r4==2425){STACKTOP=r5;return r9}}function _ptm_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35,r36,r37,r38,r39,r40,r41,r42,r43,r44,r45,r46,r47,r48,r49;r4=r1>>2;r5=0;r6=STACKTOP;STACKTOP=STACKTOP+1716|0;r7=r6;r8=r6+1024;r9=r6+1632;_fseek(r2,r3,0);r10=r8|0;_fread(r10,28,1,r2);HEAP8[r8+28|0]=_fgetc(r2)&255;r11=r8+29|0;HEAP8[r11]=_fgetc(r2)&255;r12=r8+30|0;HEAP8[r12]=_fgetc(r2)&255;HEAP8[r8+31|0]=_fgetc(r2)&255;r13=r8+32|0;HEAP16[r13>>1]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;HEAP16[r8+34>>1]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;r14=r8+36|0;HEAP16[r14>>1]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;HEAP16[r8+38>>1]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;HEAP16[r8+40>>1]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;HEAP16[r8+42>>1]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;r15=_fgetc(r2);r16=_fgetc(r2);HEAP32[r8+44>>2]=r16<<16&16711680|r15<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;_fread(r8+48|0,16,1,r2);_fread(r8+64|0,32,1,r2);r15=r8+96|0;_fread(r15,256,1,r2);r16=0;while(1){HEAP16[r8+(r16<<1)+352>>1]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;r17=r16+1|0;if((r17|0)==128){break}else{r16=r17}}r16=HEAP32[r13>>2];HEAP32[r4+39]=r16&65535;r13=r16>>>16;r16=(r1+140|0)>>2;HEAP32[r16]=r13;r17=HEAP32[r14>>2];r14=r17&65535;r18=(r1+128|0)>>2;HEAP32[r18]=r14;r19=r17>>>16;r17=(r1+136|0)>>2;HEAP32[r17]=r19;r20=r1+132|0;HEAP32[r20>>2]=Math.imul(r14,r19);r19=(r1+144|0)>>2;HEAP32[r19]=r13;HEAP32[r4+37]=6;HEAP32[r4+38]=125;_memcpy(r1+952|0,r15,256);HEAP32[r4+315]=8363;r15=r1|0;_memset(r15,0,29);_strncpy(r15,r10,28);r10=HEAP8[r15];L3429:do{if(r10<<24>>24!=0){r13=0;r14=r15;r21=r10;while(1){do{if((_isprint(r21<<24>>24)|0)==0){r5=2432}else{if(HEAP8[r14]<<24>>24<0){r5=2432;break}else{break}}}while(0);if(r5==2432){r5=0;HEAP8[r14]=46}r22=r13+1|0;r23=r1+r22|0;r24=HEAP8[r23];if(r24<<24>>24!=0&(r22|0)<28){r13=r22;r14=r23;r21=r24}else{break}}if(HEAP8[r15]<<24>>24==0){break}while(1){r21=r1+(_strlen(r15)-1)|0;if(HEAP8[r21]<<24>>24!=32){break L3429}HEAP8[r21]=0;if(HEAP8[r15]<<24>>24==0){break L3429}}}}while(0);r15=HEAPU8[r11];_set_type(r1,5266948,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=HEAPU8[r12],HEAP32[tempInt+4>>2]=r15,tempInt));r15=(r1+176|0)>>2;HEAP32[r15]=_calloc(764,HEAP32[r16]);r12=HEAP32[r19];if((r12|0)!=0){HEAP32[r4+45]=_calloc(52,r12)}L3445:do{if((HEAP32[r16]|0)>0){r12=r9|0;r11=r9+1|0;r10=r9+13|0;r21=r9+14|0;r14=r9+16|0;r13=r9+20|0;r24=r9+24|0;r23=r9+28|0;r22=r9+32|0;r25=r9+36|0;r26=r9+40|0;r27=r9+44|0;r28=r9+48|0;r29=r9+49|0;r30=r9+50|0;r31=r9+80|0;r32=(r1+180|0)>>2;r33=0;while(1){r34=_calloc(64,1);HEAP32[HEAP32[r15]+(r33*764&-1)+756>>2]=r34;HEAP8[r12]=_fgetc(r2)&255;_fread(r11,12,1,r2);HEAP8[r10]=_fgetc(r2)&255;HEAP16[r21>>1]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;HEAP16[r14>>1]=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;r34=_fgetc(r2)&255;r35=_fgetc(r2);HEAP32[r13>>2]=r35<<8&65280|r34|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r34=_fgetc(r2)&255;r35=_fgetc(r2);HEAP32[r24>>2]=r35<<8&65280|r34|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r34=_fgetc(r2)&255;r35=_fgetc(r2);HEAP32[r23>>2]=r35<<8&65280|r34|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r34=_fgetc(r2)&255;r35=_fgetc(r2);HEAP32[r22>>2]=r35<<8&65280|r34|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r34=_fgetc(r2)&255;r35=_fgetc(r2);HEAP32[r25>>2]=r35<<8&65280|r34|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r34=_fgetc(r2)&255;r35=_fgetc(r2);HEAP32[r26>>2]=r35<<8&65280|r34|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;r34=_fgetc(r2)&255;r35=_fgetc(r2);HEAP32[r27>>2]=r35<<8&65280|r34|_fgetc(r2)<<16&16711680|_fgetc(r2)<<24;HEAP8[r28]=_fgetc(r2)&255;HEAP8[r29]=_fgetc(r2)&255;_fread(r30,28,1,r2);r34=_fgetc(r2);r35=_fgetc(r2);HEAP32[r31>>2]=r35<<16&16711680|r34<<24|_fgetc(r2)<<8&65280|_fgetc(r2)&255;r34=HEAP8[r12];do{if((r34&3)<<24>>24==1){HEAP32[r7+(r33<<2)>>2]=HEAP32[r13>>2];r35=HEAP32[r24>>2];HEAP32[HEAP32[r32]+(r33*52&-1)+32>>2]=r35;HEAP32[HEAP32[r15]+(r33*764&-1)+36>>2]=(r35|0)!=0&1;HEAP32[HEAP32[r32]+(r33*52&-1)+36>>2]=HEAP32[r23>>2];HEAP32[HEAP32[r32]+(r33*52&-1)+40>>2]=HEAP32[r22>>2];HEAP32[HEAP32[r32]+(r33*52&-1)+44>>2]=0;if((r34&4)<<24>>24!=0){r35=HEAP32[r32]+(r33*52&-1)+44|0;HEAP32[r35>>2]=HEAP32[r35>>2]|2}if((r34&8)<<24>>24!=0){r35=HEAP32[r32]+(r33*52&-1)+44|0;HEAP32[r35>>2]=HEAP32[r35>>2]|6}if((r34&16)<<24>>24!=0){r35=HEAP32[r32]+(r33*52&-1)+44|0;HEAP32[r35>>2]=HEAP32[r35>>2]|1;r35=HEAP32[r32]+(r33*52&-1)+32|0;HEAP32[r35>>2]=HEAP32[r35>>2]>>1;r35=HEAP32[r32]+(r33*52&-1)+36|0;HEAP32[r35>>2]=HEAP32[r35>>2]>>1;r35=HEAP32[r32]+(r33*52&-1)+40|0;HEAP32[r35>>2]=HEAP32[r35>>2]>>1}HEAP32[HEAP32[HEAP32[r15]+(r33*764&-1)+756>>2]>>2]=HEAPU8[r10];HEAP32[HEAP32[HEAP32[r15]+(r33*764&-1)+756>>2]+8>>2]=128;HEAP32[HEAP32[HEAP32[r15]+(r33*764&-1)+756>>2]+40>>2]=r33;HEAP32[r31>>2]=0;r35=HEAP32[r15];r36=r35+(r33*764&-1)|0;_memset(r36,0,29);_strncpy(r36,r30,28);r37=HEAP8[r36];L3460:do{if(r37<<24>>24!=0){r38=0;r39=r36;r40=r37;while(1){do{if((_isprint(r40<<24>>24)|0)==0){r5=2451}else{if(HEAP8[r39]<<24>>24<0){r5=2451;break}else{break}}}while(0);if(r5==2451){r5=0;HEAP8[r39]=46}r41=r38+1|0;r42=r35+(r33*764&-1)+r41|0;r43=HEAP8[r42];if(r43<<24>>24!=0&(r41|0)<28){r38=r41;r39=r42;r40=r43}else{break}}if(HEAP8[r36]<<24>>24==0){break}while(1){r40=_strlen(r36)-1+r35+(r33*764&-1)|0;if(HEAP8[r40]<<24>>24!=32){break L3460}HEAP8[r40]=0;if(HEAP8[r36]<<24>>24==0){break L3460}}}}while(0);r36=HEAP16[r21>>1];r35=HEAP32[HEAP32[r15]+(r33*764&-1)+756>>2];r37=r35+12|0;r40=r35+16|0;if(r36<<16>>16==0){HEAP32[r40>>2]=0;HEAP32[r37>>2]=0;break}else{r35=Math.log((r36&65535|0)/8363)*1536/.6931471805599453&-1;HEAP32[r37>>2]=(r35|0)/128&-1;HEAP32[r40>>2]=(r35|0)%128;break}}}while(0);r34=r33+1|0;if((r34|0)<(HEAP32[r16]|0)){r33=r34}else{break L3445}}}}while(0);r16=(r1+172|0)>>2;HEAP32[r16]=_calloc(4,HEAP32[r20>>2]);r20=(r1+168|0)>>2;HEAP32[r20]=_calloc(4,HEAP32[r18]+1|0);r5=HEAP32[r18];L3478:do{if((r5|0)>0){r9=0;r33=r5;while(1){r21=HEAP16[r8+(r9<<1)+352>>1];if(r21<<16>>16==0){r44=r33}else{r30=_calloc(1,(HEAP32[r17]<<2)+4|0);HEAP32[HEAP32[r20]+(r9<<2)>>2]=r30;HEAP32[HEAP32[HEAP32[r20]+(r9<<2)>>2]>>2]=64;r30=HEAP32[r17];L3483:do{if((r30|0)>0){r31=0;r10=r30;while(1){r32=Math.imul(r10,r9)+r31|0;HEAP32[HEAP32[HEAP32[r20]+(r9<<2)>>2]+(r31<<2)+4>>2]=r32;r32=_calloc(HEAP32[HEAP32[HEAP32[r20]+(r9<<2)>>2]>>2]<<3|4,1);r22=Math.imul(HEAP32[r17],r9)+r31|0;HEAP32[HEAP32[r16]+(r22<<2)>>2]=r32;r32=HEAP32[HEAP32[HEAP32[r20]+(r9<<2)>>2]>>2];r22=Math.imul(HEAP32[r17],r9)+r31|0;HEAP32[HEAP32[HEAP32[r16]+(r22<<2)>>2]>>2]=r32;r32=r31+1|0;r22=HEAP32[r17];if((r32|0)<(r22|0)){r31=r32;r10=r22}else{break L3483}}}}while(0);_fseek(r2,((r21&65535)<<4)+r3|0,0);r30=0;while(1){while(1){r10=_fgetc(r2);if((r10&255)<<24>>24==0){break}r31=r10&31;if((r31|0)>=(HEAP32[r17]|0)){continue}r22=HEAP32[HEAP32[r16]+(HEAP32[HEAP32[HEAP32[r20]+(r9<<2)>>2]+(r31<<2)+4>>2]<<2)>>2];if((r10&32|0)!=0){r31=_fgetc(r2);r32=r31&255;if((r32|0)==254){r45=-127}else if((r32|0)==255){r45=0}else{r45=(r31&255)+12&255}HEAP8[(r30<<3)+r22+4|0]=r45;HEAP8[(r30<<3)+r22+5|0]=_fgetc(r2)&255}do{if((r10&64|0)!=0){r31=(r30<<3)+r22+7|0;HEAP8[r31]=_fgetc(r2)&255;r32=_fgetc(r2)&255;r23=(r30<<3)+r22+8|0;HEAP8[r23]=r32;r24=HEAP8[r31];if((r24&255)>23){HEAP8[r23]=0;HEAP8[r31]=0;r46=0;r47=0}else{r46=r24;r47=r32}r32=r46&255;if((r32|0)==22){HEAP8[r31]=-98;break}else if((r32|0)==23){HEAP8[r23]=0;HEAP8[r31]=0;break}else if((r32|0)==16){HEAP8[r31]=16;break}else if((r32|0)==17){HEAP8[r31]=27;break}else if((r32|0)==20){HEAP8[r31]=-99;break}else if((r32|0)==21){HEAP8[r31]=-97;break}else if((r32|0)==18){HEAP8[r31]=-84;break}else if((r32|0)==19){HEAP8[r31]=-100;break}else if((r32|0)==14){if((r47&-16)<<24>>24!=-128){break}HEAP8[r31]=8;HEAP8[r23]=r47<<4;break}else{break}}}while(0);if((r10&128|0)==0){continue}HEAP8[(r30<<3)+r22+6|0]=(_fgetc(r2)&255)+1&255}r23=r30+1|0;if((r23|0)<64){r30=r23}else{break}}r44=HEAP32[r18]}r30=r9+1|0;if((r30|0)<(r44|0)){r9=r30;r33=r44}else{break L3478}}}}while(0);r44=HEAP32[r19];L3522:do{if((r44|0)>0){r18=r1+180|0;r47=0;r46=r44;while(1){r45=HEAP32[r15];do{if((HEAP32[r45+(r47*764&-1)+36>>2]|0)==0){r48=r46}else{r20=HEAP32[HEAP32[r45+(r47*764&-1)+756>>2]+40>>2];r16=HEAP32[r18>>2];if((HEAP32[r16+(r20*52&-1)+32>>2]|0)==0){r48=r46;break}_fseek(r2,HEAP32[r7+(r20<<2)>>2]+r3|0,0);_load_sample(r2,4,r16+(r20*52&-1)|0,0);r48=HEAP32[r19]}}while(0);r45=r47+1|0;if((r45|0)<(r48|0)){r47=r45;r46=r48}else{break L3522}}}}while(0);HEAP32[r4+318]=5248736;if((HEAP32[r17]|0)>0){r49=0}else{STACKTOP=r6;return 0}while(1){HEAP32[((r49*12&-1)+184>>2)+r4]=HEAPU8[r8+(r49+64)|0]<<4;r48=r49+1|0;if((r48|0)<(HEAP32[r17]|0)){r49=r48}else{break}}STACKTOP=r6;return 0}function _pw_test(r1,r2,r3){return _pw_test_format(r1,0,0,0)}function _pw_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34,r35;r4=0;r5=STACKTOP;STACKTOP=STACKTOP+5188|0;r6=r5,r7=r6>>1;r8=r5+1084;r9=r5+1088;r10=r5+1092;r11=r10|0;r12=_getenv(5266596);_strncpy(r11,(r12|0)!=0?r12:5263284,4096);r12=r10+_strlen(r11)|0;tempBigInt=47;HEAP8[r12]=tempBigInt&255;tempBigInt=tempBigInt>>8;HEAP8[r12+1|0]=tempBigInt&255;_memcpy(r10+_strlen(r11)|0,5266936,11);r10=_mkstemp(r11);if((r10|0)<0){r13=-1;STACKTOP=r5;return r13}if((_pw_wizardry(_fileno(r2),r10,r9)|0)<0){_close(r10);_unlink(r11);r13=-1;STACKTOP=r5;return r13}r2=_fdopen(r10,5265792);if((r2|0)==0){_close(r10);_unlink(r11);r13=-1;STACKTOP=r5;return r13}_fseek(r2,r3,0);r3=r6|0;_fread(r3,20,1,r2);r10=0;while(1){_fread(r6+(r10*30&-1)+20|0,22,1,r2);r12=_fgetc(r2)&65535;HEAP16[((r10*30&-1)+42>>1)+r7]=_fgetc(r2)&255|r12<<8;HEAP8[r6+(r10*30&-1)+44|0]=_fgetc(r2)&255;HEAP8[r6+(r10*30&-1)+45|0]=_fgetc(r2)&255;r12=_fgetc(r2)&65535;HEAP16[((r10*30&-1)+46>>1)+r7]=_fgetc(r2)&255|r12<<8;r12=_fgetc(r2)&65535;HEAP16[((r10*30&-1)+48>>1)+r7]=_fgetc(r2)&255|r12<<8;r12=r10+1|0;if((r12|0)==31){break}else{r10=r12}}r10=r6+950|0;HEAP8[r10]=_fgetc(r2)&255;HEAP8[r6+951|0]=_fgetc(r2)&255;r12=r6+952|0;_fread(r12,128,1,r2);r14=r6+1080|0;_fread(r14,4,1,r2);if((_memcmp(r14,5265056,4)|0)!=0){_fclose(r2);_unlink(r11);r13=-1;STACKTOP=r5;return r13}r14=(r1+140|0)>>2;HEAP32[r14]=31;r15=(r1+144|0)>>2;HEAP32[r15]=31;r16=(r1+136|0)>>2;HEAP32[r16]=4;r17=HEAP16[r10>>1];HEAP32[r1+156>>2]=r17&255;HEAP32[r1+160>>2]=(r17&65535)>>>8&65535;_memcpy(r1+952|0,r12,128);r12=(r1+128|0)>>2;r17=0;r10=0;while(1){r18=r1+(r17+952)|0;r19=HEAP8[r18];if(r10){r20=(r19&255)>>>1;HEAP8[r18]=r20;r21=r20}else{r21=r19}r19=r21&255;r20=HEAP32[r12];if((r19|0)>(r20|0)){HEAP32[r12]=r19;r22=r19}else{r22=r20}r20=r17+1|0;if((r20|0)==128){break}r17=r20;r10=(HEAP32[r16]|0)>4}r10=r22+1|0;HEAP32[r12]=r10;r22=r1+132|0;HEAP32[r22>>2]=Math.imul(HEAP32[r16],r10);_snprintf(r1|0,64,5263876,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=r3,tempInt));_snprintf(r1+64|0,64,5263876,(tempInt=STACKTOP,STACKTOP=STACKTOP+4|0,HEAP32[tempInt>>2]=HEAP32[r9>>2],tempInt));r9=(r1+176|0)>>2;HEAP32[r9]=_calloc(764,HEAP32[r14]);r3=HEAP32[r15];if((r3|0)!=0){HEAP32[r1+180>>2]=_calloc(52,r3)}L3569:do{if((HEAP32[r14]|0)>0){r3=(r1+180|0)>>2;r10=0;while(1){r17=_calloc(64,1);HEAP32[HEAP32[r9]+(r10*764&-1)+756>>2]=r17;HEAP32[HEAP32[r3]+(r10*52&-1)+32>>2]=HEAPU16[((r10*30&-1)+42>>1)+r7]<<1;HEAP32[HEAP32[r3]+(r10*52&-1)+36>>2]=HEAPU16[((r10*30&-1)+46>>1)+r7]<<1;r17=HEAP32[r3];r21=r6+(r10*30&-1)+48|0;HEAP32[r17+(r10*52&-1)+40>>2]=(HEAPU16[r21>>1]<<1)+HEAP32[r17+(r10*52&-1)+36>>2]|0;HEAP32[HEAP32[r3]+(r10*52&-1)+44>>2]=HEAPU16[r21>>1]>1?2:0;HEAP32[HEAP32[HEAP32[r9]+(r10*764&-1)+756>>2]+16>>2]=HEAP8[r6+(r10*30&-1)+44|0]<<28>>24;HEAP32[HEAP32[HEAP32[r9]+(r10*764&-1)+756>>2]>>2]=HEAP8[r6+(r10*30&-1)+45|0]<<24>>24;HEAP32[HEAP32[HEAP32[r9]+(r10*764&-1)+756>>2]+8>>2]=128;HEAP32[HEAP32[HEAP32[r9]+(r10*764&-1)+756>>2]+40>>2]=r10;HEAP32[HEAP32[r9]+(r10*764&-1)+36>>2]=(HEAP32[HEAP32[r3]+(r10*52&-1)+32>>2]|0)!=0&1;HEAP32[HEAP32[r9]+(r10*764&-1)+40>>2]=4095;r21=HEAP32[r9];r17=r21+(r10*764&-1)|0;_memset(r17,0,23);_strncpy(r17,r6+(r10*30&-1)+20|0,22);r20=HEAP8[r17];L3573:do{if(r20<<24>>24!=0){r19=0;r18=r17;r23=r20;while(1){do{if((_isprint(r23<<24>>24)|0)==0){r4=2526}else{if(HEAP8[r18]<<24>>24<0){r4=2526;break}else{break}}}while(0);if(r4==2526){r4=0;HEAP8[r18]=46}r24=r19+1|0;r25=r21+(r10*764&-1)+r24|0;r26=HEAP8[r25];if(r26<<24>>24!=0&(r24|0)<22){r19=r24;r18=r25;r23=r26}else{break}}if(HEAP8[r17]<<24>>24==0){break}while(1){r23=_strlen(r17)-1+r21+(r10*764&-1)|0;if(HEAP8[r23]<<24>>24!=32){break L3573}HEAP8[r23]=0;if(HEAP8[r17]<<24>>24==0){break L3573}}}}while(0);r17=r10+1|0;if((r17|0)<(HEAP32[r14]|0)){r10=r17}else{break L3569}}}}while(0);r14=(r1+172|0)>>2;HEAP32[r14]=_calloc(4,HEAP32[r22>>2]);r22=(r1+168|0)>>2;HEAP32[r22]=_calloc(4,HEAP32[r12]+1|0);L3587:do{if((HEAP32[r12]|0)>0){r4=r8|0;r6=r8+1|0;r7=r8+2|0;r10=r8+3|0;r3=0;while(1){r17=_calloc(1,(HEAP32[r16]<<2)+4|0);HEAP32[HEAP32[r22]+(r3<<2)>>2]=r17;HEAP32[HEAP32[HEAP32[r22]+(r3<<2)>>2]>>2]=64;r17=HEAP32[r16];L3591:do{if((r17|0)>0){r21=0;r20=r17;while(1){r23=Math.imul(r20,r3)+r21|0;HEAP32[HEAP32[HEAP32[r22]+(r3<<2)>>2]+(r21<<2)+4>>2]=r23;r23=_calloc(HEAP32[HEAP32[HEAP32[r22]+(r3<<2)>>2]>>2]<<3|4,1);r18=Math.imul(HEAP32[r16],r3)+r21|0;HEAP32[HEAP32[r14]+(r18<<2)>>2]=r23;r23=HEAP32[HEAP32[HEAP32[r22]+(r3<<2)>>2]>>2];r18=Math.imul(HEAP32[r16],r3)+r21|0;HEAP32[HEAP32[HEAP32[r14]+(r18<<2)>>2]>>2]=r23;r23=r21+1|0;r18=HEAP32[r16];if((r23|0)<(r18|0)){r21=r23;r20=r18}else{r27=0;break L3591}}}else{r27=0}}while(0);while(1){r17=(r27|0)/4&-1;r20=HEAP32[HEAP32[r14]+(HEAP32[HEAP32[HEAP32[r22]+(r3<<2)>>2]+((r27|0)%4<<2)+4>>2]<<2)>>2];_fread(r4,1,4,r2);r21=HEAP8[r4];r18=(r21&255)<<8&3840|HEAPU8[r6];if((r18|0)==0){r28=0}else{L3598:do{if(r18>>>0<3628){r23=r18;r19=24;while(1){r26=r19+12|0;r25=r23<<1;if((r25|0)<3628){r23=r25;r19=r26}else{r29=r25;r30=r26;break L3598}}}else{r29=r18;r30=24}}while(0);L3602:do{if((r29|0)>3842){r18=r30;r19=5249472;while(1){r23=r19-32|0;r26=r18-1|0;r25=HEAP32[r23>>2];if((r29|0)>(r25|0)){r18=r26;r19=r23}else{r31=r26;r32=r23,r33=r32>>2;r34=r25;break L3602}}}else{r31=r30;r32=5249472,r33=r32>>2;r34=3842}}while(0);do{if((r34|0)>(r29|0)){if((HEAP32[r33+1]|0)<=(r29|0)){r35=1;break}if((HEAP32[r33+2]|0)<=(r29|0)){r35=1;break}r35=(HEAP32[r33+3]|0)<=(r29|0)&1}else{r35=1}}while(0);r28=r31-r35&255}HEAP8[(r17<<3)+r20+4|0]=r28;r19=HEAP8[r7];HEAP8[(r17<<3)+r20+5|0]=(r19&255)>>>4|r21&-16;r18=r19&15;r19=(r17<<3)+r20+7|0;HEAP8[r19]=r18;r25=HEAP8[r10];HEAP8[(r17<<3)+r20+8|0]=r25;do{if(r25<<24>>24==0){r23=r18&255;if((r23|0)==5){HEAP8[r19]=3;break}else if((r23|0)==6){HEAP8[r19]=4;break}else if((r23|0)==1|(r23|0)==2|(r23|0)==10){HEAP8[r19]=0;break}else{break}}}while(0);r19=r27+1|0;if((r19|0)==256){break}else{r27=r19}}r19=r3+1|0;if((r19|0)<(HEAP32[r12]|0)){r3=r19}else{break L3587}}}}while(0);r12=r1+1276|0;HEAP32[r12>>2]=HEAP32[r12>>2]|8192;L3621:do{if((HEAP32[r15]|0)>0){r12=r1+180|0;r27=0;while(1){_load_sample(r2,0,HEAP32[r12>>2]+(HEAP32[HEAP32[HEAP32[r9]+(r27*764&-1)+756>>2]+40>>2]*52&-1)|0,0);r28=r27+1|0;if((r28|0)<(HEAP32[r15]|0)){r27=r28}else{break L3621}}}}while(0);_fclose(r2);_unlink(r11);r13=0;STACKTOP=r5;return r13}function _pw_test_format(r1,r2,r3,r4){var r5,r6,r7,r8,r9,r10,r11,r12,r13;r3=0;r2=STACKTOP;STACKTOP=STACKTOP+24|0;r5=_calloc(1,65536);_fread(r5,65536,1,r1);r6=r2|0;r7=65536;r8=r5;L3628:while(1){r5=0;while(1){if((r5|0)==40){r9=-1;break L3628}r10=HEAP32[(r5<<2)+5248452>>2];r11=FUNCTION_TABLE[HEAP32[r10+4>>2]](r8,r6,r7);if((r11|0)>0){break}if((r11|0)==0){r3=2568;break L3628}else{r5=r5+1|0}}r5=r11+r7|0;r12=_realloc(r8,r5);if((r12|0)==0){r3=2571;break}_fread(r12+r7|0,r11,1,r1);r7=r5;r8=r12}do{if(r3==2571){_free(r8);r13=-1;STACKTOP=r2;return r13}else if(r3==2568){if((r4|0)==0){r9=0;break}_memcpy(r4|0,r6,21);_strncpy(r4+64|0,HEAP32[r10>>2],64);r9=0}}while(0);_free(r8);r13=r9;STACKTOP=r2;return r13}function _rad_test(r1,r2,r3){var r4,r5,r6,r7;r3=STACKTOP;STACKTOP=STACKTOP+80|0;r4=r3;r5=r3+64|0;L3644:do{if(_fread(r5,1,16,r1)>>>0<16){r6=-1}else{if((_memcmp(r5,5265764,16)|0)!=0){r6=-1;break}r7=r4|0;if((r2|0)==0){r6=0;break}HEAP8[r2]=0;_fread(r7,1,0,r1);HEAP8[r7]=0;HEAP8[r2]=0;_strncpy(r2,r7,0);if(HEAP8[r2]<<24>>24==0){r6=0;break}while(1){r7=r2+(_strlen(r2)-1)|0;if(HEAP8[r7]<<24>>24!=32){r6=0;break L3644}HEAP8[r7]=0;if(HEAP8[r2]<<24>>24==0){r6=0;break L3644}}}}while(0);STACKTOP=r3;return r6}function _rad_load(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13,r14,r15,r16,r17,r18,r19,r20,r21,r22,r23,r24,r25,r26,r27,r28,r29,r30,r31,r32,r33,r34;r4=r1>>2;r5=STACKTOP;STACKTOP=STACKTOP+76|0;r6=r5;r7=r5+12;_fseek(r2,r3,0);_fseek(r2,16,0);r8=_fgetc(r2);r9=_fgetc(r2);r10=(r1+136|0)>>2;HEAP32[r10]=9;HEAP32[r4+38]=125;r11=r9&31;HEAP32[r4+37]=r11>>>0<3?6:r11;r11=(r1+144|0)>>2;HEAP32[r11]=0;_set_type(r1,5266908,(tempInt=STACKTOP,STACKTOP=STACKTOP+8|0,HEAP32[tempInt>>2]=r8>>>4&15,HEAP32[tempInt+4>>2]=r8&15,tempInt));L3653:do{if((r9&128|0)!=0){while(1){if((_fgetc(r2)&255)<<24>>24==0){break L3653}}}}while(0);r9=_ftell(r2);r8=(r1+140|0)>>2;HEAP32[r8]=0;r12=_fgetc(r2);L3657:do{if((r12&255)<<24>>24!=0){r13=r6|0;r14=r12;while(1){HEAP32[r8]=r14&255;_fread(r13,1,11,r2);r15=_fgetc(r2);if((r15&255)<<24>>24==0){break L3657}else{r14=r15}}}}while(0);_fseek(r2,r9,0);r9=HEAP32[r8];HEAP32[r11]=r9;r12=(r1+176|0)>>2;HEAP32[r12]=_calloc(764,r9);r9=HEAP32[r11];if((r9|0)!=0){HEAP32[r4+45]=_calloc(52,r9)}r9=_fgetc(r2);L3665:do{if((r9&255)<<24>>24!=0){r11=r6|0;r14=r1+180|0;r13=r6+1|0;r15=r6+2|0;r16=r6+3|0;r17=r6+4|0;r18=r6+5|0;r19=r6+6|0;r20=r6+7|0;r21=r6+8|0;r22=r6+10|0;r23=r9;while(1){_fread(r11,1,11,r2);r24=(r23&255)-1|0;r25=HEAP32[r14>>2];r26=HEAP8[r11];HEAP8[r11]=HEAP8[r13];HEAP8[r13]=r26;r26=HEAP8[r15];HEAP8[r15]=HEAP8[r16];HEAP8[r16]=r26;r26=HEAP8[r17];HEAP8[r17]=HEAP8[r18];HEAP8[r18]=r26;r26=HEAP8[r19];HEAP8[r19]=HEAP8[r20];HEAP8[r20]=r26;r26=HEAP8[r21];HEAP8[r21]=HEAP8[r22];HEAP8[r22]=r26;r26=_malloc(15);r27=(r25+(r24*52&-1)+48|0)>>2;HEAP32[r27]=r26;if((r26|0)!=0){HEAP32[r26>>2]=0;r26=HEAP32[r27]+4|0;HEAP32[r27]=r26;_memcpy(r26,r11,11);r26=r25+(r24*52&-1)+44|0;HEAP32[r26>>2]=HEAP32[r26>>2]|32768;HEAP32[r25+(r24*52&-1)+32>>2]=11}r24=_fgetc(r2);if((r24&255)<<24>>24==0){break L3665}else{r23=r24}}}}while(0);L3673:do{if((HEAP32[r8]|0)>0){r9=0;while(1){r6=_calloc(64,1);HEAP32[HEAP32[r12]+(r9*764&-1)+756>>2]=r6;HEAP32[HEAP32[r12]+(r9*764&-1)+36>>2]=1;HEAP32[HEAP32[HEAP32[r12]+(r9*764&-1)+756>>2]>>2]=64;HEAP32[HEAP32[HEAP32[r12]+(r9*764&-1)+756>>2]+8>>2]=128;HEAP32[HEAP32[HEAP32[r12]+(r9*764&-1)+756>>2]+12>>2]=-1;HEAP32[HEAP32[HEAP32[r12]+(r9*764&-1)+756>>2]+40>>2]=r9;r6=r9+1|0;if((r6|0)<(HEAP32[r8]|0)){r9=r6}else{break L3673}}}}while(0);r8=_fgetc(r2)&255;r12=r1+156|0;HEAP32[r12>>2]=r8;L3677:do{if((r8|0)!=0){r9=0;r6=0;while(1){r23=_fgetc(r2)&255;if(r23<<24>>24>-1){HEAP8[r1+(r9+952)|0]=r23;r28=r9+1|0}else{r28=r9}r23=r6+1|0;if((r23|0)<(HEAP32[r12>>2]|0)){r9=r28;r6=r23}else{break L3677}}}}while(0);r28=(r1+128|0)>>2;HEAP32[r28]=0;r12=0;while(1){r8=_fgetc(r2)&255|(_fgetc(r2)&65535)<<8;HEAP16[r7+(r12<<1)>>1]=r8;if(r8<<16>>16!=0){HEAP32[r28]=HEAP32[r28]+1|0}r8=r12+1|0;if((r8|0)==32){break}else{r12=r8}}r12=Math.imul(HEAP32[r10],HEAP32[r28]);HEAP32[r4+33]=r12;r8=(r1+172|0)>>2;HEAP32[r8]=_calloc(4,r12);r12=(r1+168|0)>>2;HEAP32[r12]=_calloc(4,HEAP32[r28]+1|0);L3690:do{if((HEAP32[r28]|0)>0){r6=0;while(1){r9=_calloc(1,(HEAP32[r10]<<2)+4|0);HEAP32[HEAP32[r12]+(r6<<2)>>2]=r9;HEAP32[HEAP32[HEAP32[r12]+(r6<<2)>>2]>>2]=64;r9=HEAP32[r10];L3693:do{if((r9|0)>0){r23=0;r11=r9;while(1){r22=Math.imul(r11,r6)+r23|0;HEAP32[HEAP32[HEAP32[r12]+(r6<<2)>>2]+(r23<<2)+4>>2]=r22;r22=_calloc(HEAP32[HEAP32[HEAP32[r12]+(r6<<2)>>2]>>2]<<3|4,1);r21=Math.imul(HEAP32[r10],r6)+r23|0;HEAP32[HEAP32[r8]+(r21<<2)>>2]=r22;r22=HEAP32[HEAP32[HEAP32[r12]+(r6<<2)>>2]>>2];r21=Math.imul(HEAP32[r10],r6)+r23|0;HEAP32[HEAP32[HEAP32[r8]+(r21<<2)>>2]>>2]=r22;r22=r23+1|0;r21=HEAP32[r10];if((r22|0)<(r21|0)){r23=r22;r11=r21}else{break L3693}}}}while(0);r9=HEAP16[r7+(r6<<1)>>1];L3697:do{if(r9<<16>>16!=0){_fseek(r2,(r9&65535)+r3|0,0);while(1){r11=_fgetc(r2);r23=r11&127;while(1){r21=_fgetc(r2);r22=HEAP32[HEAP32[r8]+(HEAP32[HEAP32[HEAP32[r12]+(r6<<2)>>2]+((r21&127)<<2)+4>>2]<<2)>>2];r20=_fgetc(r2)&255;r19=(r23<<3)+r22+5|0;HEAP8[r19]=(r20&255)>>>3&16;r18=r20&15;r17=(r23<<3)+r22+4|0;HEAP8[r17]=r18;if(r18<<24>>24==15){HEAP8[r17]=-127}else if(r18<<24>>24!=0){HEAP8[r17]=(r18+26&255)+(((r20&255)>>>4&7)*12&255)&255}r20=_fgetc(r2)&255;HEAP8[r19]=(r20&255)>>>4|HEAP8[r19];r19=r20&15;r20=(r23<<3)+r22+7|0;HEAP8[r20]=r19;do{if(r19<<24>>24!=0){r18=_fgetc(r2)&255;r17=(r23<<3)+r22+8|0;HEAP8[r17]=r18;if(!(HEAP8[r20]<<24>>24==15&(r18&255)<3)){break}HEAP8[r17]=6}}while(0);if((r21&128|0)!=0){break}}if((r11&128|0)!=0){break L3697}}}}while(0);r9=r6+1|0;if((r9|0)<(HEAP32[r28]|0)){r6=r9}else{break L3690}}}}while(0);if((HEAP32[r10]|0)>0){r29=0}else{r30=r1+6552|0;HEAP32[r30>>2]=5246980;r31=r1+1276|0,r32=r31>>2;r33=HEAP32[r32];r34=r33|4096;HEAP32[r32]=r34;STACKTOP=r5;return 0}while(1){HEAP32[((r29*12&-1)+184>>2)+r4]=128;HEAP32[((r29*12&-1)+192>>2)+r4]=1;r28=r29+1|0;if((r28|0)<(HEAP32[r10]|0)){r29=r28}else{break}}r30=r1+6552|0;HEAP32[r30>>2]=5246980;r31=r1+1276|0,r32=r31>>2;r33=HEAP32[r32];r34=r33|4096;HEAP32[r32]=r34;STACKTOP=r5;return 0}function _rtm_test(r1,r2,r3){var r4,r5,r6,r7,r8,r9,r10,r11,r12,r13;r3=0;r4=STACKTOP;STACKTOP=STACKTOP+68|0;r5=r4;r6=r4+64|0;L3720:do{if(_fread(r6,1,4,r1)>>>0<4){r7=-1}else{if((_memcmp(r6,5266900,4)|0)!=0){r7=-1;break}if((_fgetc(r1)&255)<<24>>24!=32){r7=-1;break}r8=r5|0;if((r2|0)==0){r7=0;break}_memset(r2,0,33);_fread(r8,1,32,r1);HEAP8[r5+32|0]=0;_memset(r2,0,33);_strncpy(r2,r8,32);r8=HEAP8[r2];if(r8<<24>>24==0){r7=0;break}else{r9=0;r10=r2;r11=r8}while(1){do{if((_isprint(r11<<24>>24)|0)==0){r3=2634}else{if(HEAP8[r10]<<24>>24<0){r3=2634;break}else{break}}}while(0);if(r3==2634){r3=0;HEAP8[r10]=46}r8=r9+1|0;r12=r2+r8|0;r13=HEAP8[r12];if(r13<<24>>24!=0&(r8|0)<32){r9=r8;r10=r12;r11=r13}else{break}}if(HEAP8[r2]<<24>>24==0){r7=0;break}while(1){r13=r2+(_strlen(r2)-1)|0;if(HEAP8[r13]<<24>>24!=32){r7=0;break L3720}HEAP8[r13]=0;if(HEAP8[r2]<<24>>24==0){r7=0;break L3720}}}}while(0);STACKTOP=r4;return r7}
// EMSCRIPTEN_END_FUNCS
Module["_initialize_player"] = _initialize_player;
Module["_free_player"] = _free_player;
Module["_read_from_player"] = _read_from_player;
Module["_free_buffer"] = _free_buffer;
Module["_calloc"] = _calloc;
Module["_realloc"] = _realloc;
// TODO: strip out parts of this we do not need
//======= begin closure i64 code =======
// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
/**
 * @fileoverview Defines a Long class for representing a 64-bit two's-complement
 * integer value, which faithfully simulates the behavior of a Java "long". This
 * implementation is derived from LongLib in GWT.
 *
 */
var i64Math = (function() { // Emscripten wrapper
  var goog = { math: {} };
  /**
   * Constructs a 64-bit two's-complement integer, given its low and high 32-bit
   * values as *signed* integers.  See the from* functions below for more
   * convenient ways of constructing Longs.
   *
   * The internal representation of a long is the two given signed, 32-bit values.
   * We use 32-bit pieces because these are the size of integers on which
   * Javascript performs bit-operations.  For operations like addition and
   * multiplication, we split each number into 16-bit pieces, which can easily be
   * multiplied within Javascript's floating-point representation without overflow
   * or change in sign.
   *
   * In the algorithms below, we frequently reduce the negative case to the
   * positive case by negating the input(s) and then post-processing the result.
   * Note that we must ALWAYS check specially whether those values are MIN_VALUE
   * (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
   * a positive number, it overflows back into a negative).  Not handling this
   * case would often result in infinite recursion.
   *
   * @param {number} low  The low (signed) 32 bits of the long.
   * @param {number} high  The high (signed) 32 bits of the long.
   * @constructor
   */
  goog.math.Long = function(low, high) {
    /**
     * @type {number}
     * @private
     */
    this.low_ = low | 0;  // force into 32 signed bits.
    /**
     * @type {number}
     * @private
     */
    this.high_ = high | 0;  // force into 32 signed bits.
  };
  // NOTE: Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the
  // from* methods on which they depend.
  /**
   * A cache of the Long representations of small integer values.
   * @type {!Object}
   * @private
   */
  goog.math.Long.IntCache_ = {};
  /**
   * Returns a Long representing the given (32-bit) integer value.
   * @param {number} value The 32-bit integer in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromInt = function(value) {
    if (-128 <= value && value < 128) {
      var cachedObj = goog.math.Long.IntCache_[value];
      if (cachedObj) {
        return cachedObj;
      }
    }
    var obj = new goog.math.Long(value | 0, value < 0 ? -1 : 0);
    if (-128 <= value && value < 128) {
      goog.math.Long.IntCache_[value] = obj;
    }
    return obj;
  };
  /**
   * Returns a Long representing the given value, provided that it is a finite
   * number.  Otherwise, zero is returned.
   * @param {number} value The number in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromNumber = function(value) {
    if (isNaN(value) || !isFinite(value)) {
      return goog.math.Long.ZERO;
    } else if (value <= -goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MIN_VALUE;
    } else if (value + 1 >= goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MAX_VALUE;
    } else if (value < 0) {
      return goog.math.Long.fromNumber(-value).negate();
    } else {
      return new goog.math.Long(
          (value % goog.math.Long.TWO_PWR_32_DBL_) | 0,
          (value / goog.math.Long.TWO_PWR_32_DBL_) | 0);
    }
  };
  /**
   * Returns a Long representing the 64-bit integer that comes by concatenating
   * the given high and low bits.  Each is assumed to use 32 bits.
   * @param {number} lowBits The low 32-bits.
   * @param {number} highBits The high 32-bits.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromBits = function(lowBits, highBits) {
    return new goog.math.Long(lowBits, highBits);
  };
  /**
   * Returns a Long representation of the given string, written using the given
   * radix.
   * @param {string} str The textual representation of the Long.
   * @param {number=} opt_radix The radix in which the text is written.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromString = function(str, opt_radix) {
    if (str.length == 0) {
      throw Error('number format error: empty string');
    }
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }
    if (str.charAt(0) == '-') {
      return goog.math.Long.fromString(str.substring(1), radix).negate();
    } else if (str.indexOf('-') >= 0) {
      throw Error('number format error: interior "-" character: ' + str);
    }
    // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 8));
    var result = goog.math.Long.ZERO;
    for (var i = 0; i < str.length; i += 8) {
      var size = Math.min(8, str.length - i);
      var value = parseInt(str.substring(i, i + size), radix);
      if (size < 8) {
        var power = goog.math.Long.fromNumber(Math.pow(radix, size));
        result = result.multiply(power).add(goog.math.Long.fromNumber(value));
      } else {
        result = result.multiply(radixToPower);
        result = result.add(goog.math.Long.fromNumber(value));
      }
    }
    return result;
  };
  // NOTE: the compiler should inline these constant values below and then remove
  // these variables, so there should be no runtime penalty for these.
  /**
   * Number used repeated below in calculations.  This must appear before the
   * first call to any from* function below.
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_16_DBL_ = 1 << 16;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_24_DBL_ = 1 << 24;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_32_DBL_ =
      goog.math.Long.TWO_PWR_16_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_31_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ / 2;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_48_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_64_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_32_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_63_DBL_ =
      goog.math.Long.TWO_PWR_64_DBL_ / 2;
  /** @type {!goog.math.Long} */
  goog.math.Long.ZERO = goog.math.Long.fromInt(0);
  /** @type {!goog.math.Long} */
  goog.math.Long.ONE = goog.math.Long.fromInt(1);
  /** @type {!goog.math.Long} */
  goog.math.Long.NEG_ONE = goog.math.Long.fromInt(-1);
  /** @type {!goog.math.Long} */
  goog.math.Long.MAX_VALUE =
      goog.math.Long.fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0);
  /** @type {!goog.math.Long} */
  goog.math.Long.MIN_VALUE = goog.math.Long.fromBits(0, 0x80000000 | 0);
  /**
   * @type {!goog.math.Long}
   * @private
   */
  goog.math.Long.TWO_PWR_24_ = goog.math.Long.fromInt(1 << 24);
  /** @return {number} The value, assuming it is a 32-bit integer. */
  goog.math.Long.prototype.toInt = function() {
    return this.low_;
  };
  /** @return {number} The closest floating-point representation to this value. */
  goog.math.Long.prototype.toNumber = function() {
    return this.high_ * goog.math.Long.TWO_PWR_32_DBL_ +
           this.getLowBitsUnsigned();
  };
  /**
   * @param {number=} opt_radix The radix in which the text should be written.
   * @return {string} The textual representation of this value.
   */
  goog.math.Long.prototype.toString = function(opt_radix) {
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }
    if (this.isZero()) {
      return '0';
    }
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        // We need to change the Long value before it can be negated, so we remove
        // the bottom-most digit in this base and then recurse to do the rest.
        var radixLong = goog.math.Long.fromNumber(radix);
        var div = this.div(radixLong);
        var rem = div.multiply(radixLong).subtract(this);
        return div.toString(radix) + rem.toInt().toString(radix);
      } else {
        return '-' + this.negate().toString(radix);
      }
    }
    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 6));
    var rem = this;
    var result = '';
    while (true) {
      var remDiv = rem.div(radixToPower);
      var intval = rem.subtract(remDiv.multiply(radixToPower)).toInt();
      var digits = intval.toString(radix);
      rem = remDiv;
      if (rem.isZero()) {
        return digits + result;
      } else {
        while (digits.length < 6) {
          digits = '0' + digits;
        }
        result = '' + digits + result;
      }
    }
  };
  /** @return {number} The high 32-bits as a signed value. */
  goog.math.Long.prototype.getHighBits = function() {
    return this.high_;
  };
  /** @return {number} The low 32-bits as a signed value. */
  goog.math.Long.prototype.getLowBits = function() {
    return this.low_;
  };
  /** @return {number} The low 32-bits as an unsigned value. */
  goog.math.Long.prototype.getLowBitsUnsigned = function() {
    return (this.low_ >= 0) ?
        this.low_ : goog.math.Long.TWO_PWR_32_DBL_ + this.low_;
  };
  /**
   * @return {number} Returns the number of bits needed to represent the absolute
   *     value of this Long.
   */
  goog.math.Long.prototype.getNumBitsAbs = function() {
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        return 64;
      } else {
        return this.negate().getNumBitsAbs();
      }
    } else {
      var val = this.high_ != 0 ? this.high_ : this.low_;
      for (var bit = 31; bit > 0; bit--) {
        if ((val & (1 << bit)) != 0) {
          break;
        }
      }
      return this.high_ != 0 ? bit + 33 : bit + 1;
    }
  };
  /** @return {boolean} Whether this value is zero. */
  goog.math.Long.prototype.isZero = function() {
    return this.high_ == 0 && this.low_ == 0;
  };
  /** @return {boolean} Whether this value is negative. */
  goog.math.Long.prototype.isNegative = function() {
    return this.high_ < 0;
  };
  /** @return {boolean} Whether this value is odd. */
  goog.math.Long.prototype.isOdd = function() {
    return (this.low_ & 1) == 1;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long equals the other.
   */
  goog.math.Long.prototype.equals = function(other) {
    return (this.high_ == other.high_) && (this.low_ == other.low_);
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long does not equal the other.
   */
  goog.math.Long.prototype.notEquals = function(other) {
    return (this.high_ != other.high_) || (this.low_ != other.low_);
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than the other.
   */
  goog.math.Long.prototype.lessThan = function(other) {
    return this.compare(other) < 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than or equal to the other.
   */
  goog.math.Long.prototype.lessThanOrEqual = function(other) {
    return this.compare(other) <= 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than the other.
   */
  goog.math.Long.prototype.greaterThan = function(other) {
    return this.compare(other) > 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than or equal to the other.
   */
  goog.math.Long.prototype.greaterThanOrEqual = function(other) {
    return this.compare(other) >= 0;
  };
  /**
   * Compares this Long with the given one.
   * @param {goog.math.Long} other Long to compare against.
   * @return {number} 0 if they are the same, 1 if the this is greater, and -1
   *     if the given one is greater.
   */
  goog.math.Long.prototype.compare = function(other) {
    if (this.equals(other)) {
      return 0;
    }
    var thisNeg = this.isNegative();
    var otherNeg = other.isNegative();
    if (thisNeg && !otherNeg) {
      return -1;
    }
    if (!thisNeg && otherNeg) {
      return 1;
    }
    // at this point, the signs are the same, so subtraction will not overflow
    if (this.subtract(other).isNegative()) {
      return -1;
    } else {
      return 1;
    }
  };
  /** @return {!goog.math.Long} The negation of this value. */
  goog.math.Long.prototype.negate = function() {
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.MIN_VALUE;
    } else {
      return this.not().add(goog.math.Long.ONE);
    }
  };
  /**
   * Returns the sum of this and the given Long.
   * @param {goog.math.Long} other Long to add to this one.
   * @return {!goog.math.Long} The sum of this and the given Long.
   */
  goog.math.Long.prototype.add = function(other) {
    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.
    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;
    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;
    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 + b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };
  /**
   * Returns the difference of this and the given Long.
   * @param {goog.math.Long} other Long to subtract from this.
   * @return {!goog.math.Long} The difference of this and the given Long.
   */
  goog.math.Long.prototype.subtract = function(other) {
    return this.add(other.negate());
  };
  /**
   * Returns the product of this and the given long.
   * @param {goog.math.Long} other Long to multiply with this.
   * @return {!goog.math.Long} The product of this and the other.
   */
  goog.math.Long.prototype.multiply = function(other) {
    if (this.isZero()) {
      return goog.math.Long.ZERO;
    } else if (other.isZero()) {
      return goog.math.Long.ZERO;
    }
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return other.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return this.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    }
    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().multiply(other.negate());
      } else {
        return this.negate().multiply(other).negate();
      }
    } else if (other.isNegative()) {
      return this.multiply(other.negate()).negate();
    }
    // If both longs are small, use float multiplication
    if (this.lessThan(goog.math.Long.TWO_PWR_24_) &&
        other.lessThan(goog.math.Long.TWO_PWR_24_)) {
      return goog.math.Long.fromNumber(this.toNumber() * other.toNumber());
    }
    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.
    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;
    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;
    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };
  /**
   * Returns this Long divided by the given one.
   * @param {goog.math.Long} other Long by which to divide.
   * @return {!goog.math.Long} This Long divided by the given one.
   */
  goog.math.Long.prototype.div = function(other) {
    if (other.isZero()) {
      throw Error('division by zero');
    } else if (this.isZero()) {
      return goog.math.Long.ZERO;
    }
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      if (other.equals(goog.math.Long.ONE) ||
          other.equals(goog.math.Long.NEG_ONE)) {
        return goog.math.Long.MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
      } else if (other.equals(goog.math.Long.MIN_VALUE)) {
        return goog.math.Long.ONE;
      } else {
        // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
        var halfThis = this.shiftRight(1);
        var approx = halfThis.div(other).shiftLeft(1);
        if (approx.equals(goog.math.Long.ZERO)) {
          return other.isNegative() ? goog.math.Long.ONE : goog.math.Long.NEG_ONE;
        } else {
          var rem = this.subtract(other.multiply(approx));
          var result = approx.add(rem.div(other));
          return result;
        }
      }
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.ZERO;
    }
    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().div(other.negate());
      } else {
        return this.negate().div(other).negate();
      }
    } else if (other.isNegative()) {
      return this.div(other.negate()).negate();
    }
    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    var res = goog.math.Long.ZERO;
    var rem = this;
    while (rem.greaterThanOrEqual(other)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      var approx = Math.max(1, Math.floor(rem.toNumber() / other.toNumber()));
      // We will tweak the approximate result by changing it in the 48-th digit or
      // the smallest non-fractional digit, whichever is larger.
      var log2 = Math.ceil(Math.log(approx) / Math.LN2);
      var delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48);
      // Decrease the approximation until it is smaller than the remainder.  Note
      // that if it is too large, the product overflows and is negative.
      var approxRes = goog.math.Long.fromNumber(approx);
      var approxRem = approxRes.multiply(other);
      while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
        approx -= delta;
        approxRes = goog.math.Long.fromNumber(approx);
        approxRem = approxRes.multiply(other);
      }
      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      if (approxRes.isZero()) {
        approxRes = goog.math.Long.ONE;
      }
      res = res.add(approxRes);
      rem = rem.subtract(approxRem);
    }
    return res;
  };
  /**
   * Returns this Long modulo the given one.
   * @param {goog.math.Long} other Long by which to mod.
   * @return {!goog.math.Long} This Long modulo the given one.
   */
  goog.math.Long.prototype.modulo = function(other) {
    return this.subtract(this.div(other).multiply(other));
  };
  /** @return {!goog.math.Long} The bitwise-NOT of this value. */
  goog.math.Long.prototype.not = function() {
    return goog.math.Long.fromBits(~this.low_, ~this.high_);
  };
  /**
   * Returns the bitwise-AND of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to AND.
   * @return {!goog.math.Long} The bitwise-AND of this and the other.
   */
  goog.math.Long.prototype.and = function(other) {
    return goog.math.Long.fromBits(this.low_ & other.low_,
                                   this.high_ & other.high_);
  };
  /**
   * Returns the bitwise-OR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to OR.
   * @return {!goog.math.Long} The bitwise-OR of this and the other.
   */
  goog.math.Long.prototype.or = function(other) {
    return goog.math.Long.fromBits(this.low_ | other.low_,
                                   this.high_ | other.high_);
  };
  /**
   * Returns the bitwise-XOR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to XOR.
   * @return {!goog.math.Long} The bitwise-XOR of this and the other.
   */
  goog.math.Long.prototype.xor = function(other) {
    return goog.math.Long.fromBits(this.low_ ^ other.low_,
                                   this.high_ ^ other.high_);
  };
  /**
   * Returns this Long with bits shifted to the left by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the left by the given amount.
   */
  goog.math.Long.prototype.shiftLeft = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var low = this.low_;
      if (numBits < 32) {
        var high = this.high_;
        return goog.math.Long.fromBits(
            low << numBits,
            (high << numBits) | (low >>> (32 - numBits)));
      } else {
        return goog.math.Long.fromBits(0, low << (numBits - 32));
      }
    }
  };
  /**
   * Returns this Long with bits shifted to the right by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount.
   */
  goog.math.Long.prototype.shiftRight = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >> numBits);
      } else {
        return goog.math.Long.fromBits(
            high >> (numBits - 32),
            high >= 0 ? 0 : -1);
      }
    }
  };
  /**
   * Returns this Long with bits shifted to the right by the given amount, with
   * the new top bits matching the current sign bit.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount, with
   *     zeros placed into the new leading bits.
   */
  goog.math.Long.prototype.shiftRightUnsigned = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >>> numBits);
      } else if (numBits == 32) {
        return goog.math.Long.fromBits(high, 0);
      } else {
        return goog.math.Long.fromBits(high >>> (numBits - 32), 0);
      }
    }
  };
  //======= begin jsbn =======
  var navigator = { appName: 'Modern Browser' }; // polyfill a little
  // Copyright (c) 2005  Tom Wu
  // All Rights Reserved.
  // http://www-cs-students.stanford.edu/~tjw/jsbn/
  /*
   * Copyright (c) 2003-2005  Tom Wu
   * All Rights Reserved.
   *
   * Permission is hereby granted, free of charge, to any person obtaining
   * a copy of this software and associated documentation files (the
   * "Software"), to deal in the Software without restriction, including
   * without limitation the rights to use, copy, modify, merge, publish,
   * distribute, sublicense, and/or sell copies of the Software, and to
   * permit persons to whom the Software is furnished to do so, subject to
   * the following conditions:
   *
   * The above copyright notice and this permission notice shall be
   * included in all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND, 
   * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY 
   * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  
   *
   * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
   * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
   * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
   * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
   * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * In addition, the following condition applies:
   *
   * All redistributions must retain an intact copy of this copyright notice
   * and disclaimer.
   */
  // Basic JavaScript BN library - subset useful for RSA encryption.
  // Bits per digit
  var dbits;
  // JavaScript engine analysis
  var canary = 0xdeadbeefcafe;
  var j_lm = ((canary&0xffffff)==0xefcafe);
  // (public) Constructor
  function BigInteger(a,b,c) {
    if(a != null)
      if("number" == typeof a) this.fromNumber(a,b,c);
      else if(b == null && "string" != typeof a) this.fromString(a,256);
      else this.fromString(a,b);
  }
  // return new, unset BigInteger
  function nbi() { return new BigInteger(null); }
  // am: Compute w_j += (x*this_i), propagate carries,
  // c is initial carry, returns final carry.
  // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
  // We need to select the fastest one that works in this environment.
  // am1: use a single mult and divide to get the high bits,
  // max digit bits should be 26 because
  // max internal value = 2*dvalue^2-2*dvalue (< 2^53)
  function am1(i,x,w,j,c,n) {
    while(--n >= 0) {
      var v = x*this[i++]+w[j]+c;
      c = Math.floor(v/0x4000000);
      w[j++] = v&0x3ffffff;
    }
    return c;
  }
  // am2 avoids a big mult-and-extract completely.
  // Max digit bits should be <= 30 because we do bitwise ops
  // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
  function am2(i,x,w,j,c,n) {
    var xl = x&0x7fff, xh = x>>15;
    while(--n >= 0) {
      var l = this[i]&0x7fff;
      var h = this[i++]>>15;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
      c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
      w[j++] = l&0x3fffffff;
    }
    return c;
  }
  // Alternately, set max digit bits to 28 since some
  // browsers slow down when dealing with 32-bit numbers.
  function am3(i,x,w,j,c,n) {
    var xl = x&0x3fff, xh = x>>14;
    while(--n >= 0) {
      var l = this[i]&0x3fff;
      var h = this[i++]>>14;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x3fff)<<14)+w[j]+c;
      c = (l>>28)+(m>>14)+xh*h;
      w[j++] = l&0xfffffff;
    }
    return c;
  }
  if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
    BigInteger.prototype.am = am2;
    dbits = 30;
  }
  else if(j_lm && (navigator.appName != "Netscape")) {
    BigInteger.prototype.am = am1;
    dbits = 26;
  }
  else { // Mozilla/Netscape seems to prefer am3
    BigInteger.prototype.am = am3;
    dbits = 28;
  }
  BigInteger.prototype.DB = dbits;
  BigInteger.prototype.DM = ((1<<dbits)-1);
  BigInteger.prototype.DV = (1<<dbits);
  var BI_FP = 52;
  BigInteger.prototype.FV = Math.pow(2,BI_FP);
  BigInteger.prototype.F1 = BI_FP-dbits;
  BigInteger.prototype.F2 = 2*dbits-BI_FP;
  // Digit conversions
  var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
  var BI_RC = new Array();
  var rr,vv;
  rr = "0".charCodeAt(0);
  for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
  rr = "a".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  rr = "A".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  function int2char(n) { return BI_RM.charAt(n); }
  function intAt(s,i) {
    var c = BI_RC[s.charCodeAt(i)];
    return (c==null)?-1:c;
  }
  // (protected) copy this to r
  function bnpCopyTo(r) {
    for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
    r.t = this.t;
    r.s = this.s;
  }
  // (protected) set from integer value x, -DV <= x < DV
  function bnpFromInt(x) {
    this.t = 1;
    this.s = (x<0)?-1:0;
    if(x > 0) this[0] = x;
    else if(x < -1) this[0] = x+DV;
    else this.t = 0;
  }
  // return bigint initialized to value
  function nbv(i) { var r = nbi(); r.fromInt(i); return r; }
  // (protected) set from string and radix
  function bnpFromString(s,b) {
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 256) k = 8; // byte array
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else { this.fromRadix(s,b); return; }
    this.t = 0;
    this.s = 0;
    var i = s.length, mi = false, sh = 0;
    while(--i >= 0) {
      var x = (k==8)?s[i]&0xff:intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-") mi = true;
        continue;
      }
      mi = false;
      if(sh == 0)
        this[this.t++] = x;
      else if(sh+k > this.DB) {
        this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
        this[this.t++] = (x>>(this.DB-sh));
      }
      else
        this[this.t-1] |= x<<sh;
      sh += k;
      if(sh >= this.DB) sh -= this.DB;
    }
    if(k == 8 && (s[0]&0x80) != 0) {
      this.s = -1;
      if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
    }
    this.clamp();
    if(mi) BigInteger.ZERO.subTo(this,this);
  }
  // (protected) clamp off excess high words
  function bnpClamp() {
    var c = this.s&this.DM;
    while(this.t > 0 && this[this.t-1] == c) --this.t;
  }
  // (public) return string representation in given radix
  function bnToString(b) {
    if(this.s < 0) return "-"+this.negate().toString(b);
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else return this.toRadix(b);
    var km = (1<<k)-1, d, m = false, r = "", i = this.t;
    var p = this.DB-(i*this.DB)%k;
    if(i-- > 0) {
      if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
      while(i >= 0) {
        if(p < k) {
          d = (this[i]&((1<<p)-1))<<(k-p);
          d |= this[--i]>>(p+=this.DB-k);
        }
        else {
          d = (this[i]>>(p-=k))&km;
          if(p <= 0) { p += this.DB; --i; }
        }
        if(d > 0) m = true;
        if(m) r += int2char(d);
      }
    }
    return m?r:"0";
  }
  // (public) -this
  function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }
  // (public) |this|
  function bnAbs() { return (this.s<0)?this.negate():this; }
  // (public) return + if this > a, - if this < a, 0 if equal
  function bnCompareTo(a) {
    var r = this.s-a.s;
    if(r != 0) return r;
    var i = this.t;
    r = i-a.t;
    if(r != 0) return (this.s<0)?-r:r;
    while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
    return 0;
  }
  // returns bit length of the integer x
  function nbits(x) {
    var r = 1, t;
    if((t=x>>>16) != 0) { x = t; r += 16; }
    if((t=x>>8) != 0) { x = t; r += 8; }
    if((t=x>>4) != 0) { x = t; r += 4; }
    if((t=x>>2) != 0) { x = t; r += 2; }
    if((t=x>>1) != 0) { x = t; r += 1; }
    return r;
  }
  // (public) return the number of bits in "this"
  function bnBitLength() {
    if(this.t <= 0) return 0;
    return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
  }
  // (protected) r = this << n*DB
  function bnpDLShiftTo(n,r) {
    var i;
    for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
    for(i = n-1; i >= 0; --i) r[i] = 0;
    r.t = this.t+n;
    r.s = this.s;
  }
  // (protected) r = this >> n*DB
  function bnpDRShiftTo(n,r) {
    for(var i = n; i < this.t; ++i) r[i-n] = this[i];
    r.t = Math.max(this.t-n,0);
    r.s = this.s;
  }
  // (protected) r = this << n
  function bnpLShiftTo(n,r) {
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<cbs)-1;
    var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
    for(i = this.t-1; i >= 0; --i) {
      r[i+ds+1] = (this[i]>>cbs)|c;
      c = (this[i]&bm)<<bs;
    }
    for(i = ds-1; i >= 0; --i) r[i] = 0;
    r[ds] = c;
    r.t = this.t+ds+1;
    r.s = this.s;
    r.clamp();
  }
  // (protected) r = this >> n
  function bnpRShiftTo(n,r) {
    r.s = this.s;
    var ds = Math.floor(n/this.DB);
    if(ds >= this.t) { r.t = 0; return; }
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<bs)-1;
    r[0] = this[ds]>>bs;
    for(var i = ds+1; i < this.t; ++i) {
      r[i-ds-1] |= (this[i]&bm)<<cbs;
      r[i-ds] = this[i]>>bs;
    }
    if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
    r.t = this.t-ds;
    r.clamp();
  }
  // (protected) r = this - a
  function bnpSubTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]-a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c -= a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c -= a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c -= a.s;
    }
    r.s = (c<0)?-1:0;
    if(c < -1) r[i++] = this.DV+c;
    else if(c > 0) r[i++] = c;
    r.t = i;
    r.clamp();
  }
  // (protected) r = this * a, r != this,a (HAC 14.12)
  // "this" should be the larger one if appropriate.
  function bnpMultiplyTo(a,r) {
    var x = this.abs(), y = a.abs();
    var i = x.t;
    r.t = i+y.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
    r.s = 0;
    r.clamp();
    if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
  }
  // (protected) r = this^2, r != this (HAC 14.16)
  function bnpSquareTo(r) {
    var x = this.abs();
    var i = r.t = 2*x.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < x.t-1; ++i) {
      var c = x.am(i,x[i],r,2*i,0,1);
      if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
        r[i+x.t] -= x.DV;
        r[i+x.t+1] = 1;
      }
    }
    if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
    r.s = 0;
    r.clamp();
  }
  // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
  // r != q, this != m.  q or r may be null.
  function bnpDivRemTo(m,q,r) {
    var pm = m.abs();
    if(pm.t <= 0) return;
    var pt = this.abs();
    if(pt.t < pm.t) {
      if(q != null) q.fromInt(0);
      if(r != null) this.copyTo(r);
      return;
    }
    if(r == null) r = nbi();
    var y = nbi(), ts = this.s, ms = m.s;
    var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
    if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
    else { pm.copyTo(y); pt.copyTo(r); }
    var ys = y.t;
    var y0 = y[ys-1];
    if(y0 == 0) return;
    var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
    var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
    var i = r.t, j = i-ys, t = (q==null)?nbi():q;
    y.dlShiftTo(j,t);
    if(r.compareTo(t) >= 0) {
      r[r.t++] = 1;
      r.subTo(t,r);
    }
    BigInteger.ONE.dlShiftTo(ys,t);
    t.subTo(y,y);	// "negative" y so we can replace sub with am later
    while(y.t < ys) y[y.t++] = 0;
    while(--j >= 0) {
      // Estimate quotient digit
      var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
      if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
        y.dlShiftTo(j,t);
        r.subTo(t,r);
        while(r[i] < --qd) r.subTo(t,r);
      }
    }
    if(q != null) {
      r.drShiftTo(ys,q);
      if(ts != ms) BigInteger.ZERO.subTo(q,q);
    }
    r.t = ys;
    r.clamp();
    if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
    if(ts < 0) BigInteger.ZERO.subTo(r,r);
  }
  // (public) this mod a
  function bnMod(a) {
    var r = nbi();
    this.abs().divRemTo(a,null,r);
    if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
    return r;
  }
  // Modular reduction using "classic" algorithm
  function Classic(m) { this.m = m; }
  function cConvert(x) {
    if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
    else return x;
  }
  function cRevert(x) { return x; }
  function cReduce(x) { x.divRemTo(this.m,null,x); }
  function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
  Classic.prototype.convert = cConvert;
  Classic.prototype.revert = cRevert;
  Classic.prototype.reduce = cReduce;
  Classic.prototype.mulTo = cMulTo;
  Classic.prototype.sqrTo = cSqrTo;
  // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
  // justification:
  //         xy == 1 (mod m)
  //         xy =  1+km
  //   xy(2-xy) = (1+km)(1-km)
  // x[y(2-xy)] = 1-k^2m^2
  // x[y(2-xy)] == 1 (mod m^2)
  // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
  // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
  // JS multiply "overflows" differently from C/C++, so care is needed here.
  function bnpInvDigit() {
    if(this.t < 1) return 0;
    var x = this[0];
    if((x&1) == 0) return 0;
    var y = x&3;		// y == 1/x mod 2^2
    y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
    y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
    y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
    // we really want the negative inverse, and -DV < y < DV
    return (y>0)?this.DV-y:-y;
  }
  // Montgomery reduction
  function Montgomery(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp&0x7fff;
    this.mph = this.mp>>15;
    this.um = (1<<(m.DB-15))-1;
    this.mt2 = 2*m.t;
  }
  // xR mod m
  function montConvert(x) {
    var r = nbi();
    x.abs().dlShiftTo(this.m.t,r);
    r.divRemTo(this.m,null,r);
    if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
    return r;
  }
  // x/R mod m
  function montRevert(x) {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  }
  // x = x/R mod m (HAC 14.32)
  function montReduce(x) {
    while(x.t <= this.mt2)	// pad x so am has enough room later
      x[x.t++] = 0;
    for(var i = 0; i < this.m.t; ++i) {
      // faster way of calculating u0 = x[i]*mp mod DV
      var j = x[i]&0x7fff;
      var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
      // use am to combine the multiply-shift-add into one call
      j = i+this.m.t;
      x[j] += this.m.am(0,u0,x,i,0,this.m.t);
      // propagate carry
      while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
    }
    x.clamp();
    x.drShiftTo(this.m.t,x);
    if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
  }
  // r = "x^2/R mod m"; x != r
  function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
  // r = "xy/R mod m"; x,y != r
  function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  Montgomery.prototype.convert = montConvert;
  Montgomery.prototype.revert = montRevert;
  Montgomery.prototype.reduce = montReduce;
  Montgomery.prototype.mulTo = montMulTo;
  Montgomery.prototype.sqrTo = montSqrTo;
  // (protected) true iff this is even
  function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }
  // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
  function bnpExp(e,z) {
    if(e > 0xffffffff || e < 1) return BigInteger.ONE;
    var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
    g.copyTo(r);
    while(--i >= 0) {
      z.sqrTo(r,r2);
      if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
      else { var t = r; r = r2; r2 = t; }
    }
    return z.revert(r);
  }
  // (public) this^e % m, 0 <= e < 2^32
  function bnModPowInt(e,m) {
    var z;
    if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
    return this.exp(e,z);
  }
  // protected
  BigInteger.prototype.copyTo = bnpCopyTo;
  BigInteger.prototype.fromInt = bnpFromInt;
  BigInteger.prototype.fromString = bnpFromString;
  BigInteger.prototype.clamp = bnpClamp;
  BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
  BigInteger.prototype.drShiftTo = bnpDRShiftTo;
  BigInteger.prototype.lShiftTo = bnpLShiftTo;
  BigInteger.prototype.rShiftTo = bnpRShiftTo;
  BigInteger.prototype.subTo = bnpSubTo;
  BigInteger.prototype.multiplyTo = bnpMultiplyTo;
  BigInteger.prototype.squareTo = bnpSquareTo;
  BigInteger.prototype.divRemTo = bnpDivRemTo;
  BigInteger.prototype.invDigit = bnpInvDigit;
  BigInteger.prototype.isEven = bnpIsEven;
  BigInteger.prototype.exp = bnpExp;
  // public
  BigInteger.prototype.toString = bnToString;
  BigInteger.prototype.negate = bnNegate;
  BigInteger.prototype.abs = bnAbs;
  BigInteger.prototype.compareTo = bnCompareTo;
  BigInteger.prototype.bitLength = bnBitLength;
  BigInteger.prototype.mod = bnMod;
  BigInteger.prototype.modPowInt = bnModPowInt;
  // "constants"
  BigInteger.ZERO = nbv(0);
  BigInteger.ONE = nbv(1);
  // jsbn2 stuff
  // (protected) convert from radix string
  function bnpFromRadix(s,b) {
    this.fromInt(0);
    if(b == null) b = 10;
    var cs = this.chunkSize(b);
    var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
    for(var i = 0; i < s.length; ++i) {
      var x = intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
        continue;
      }
      w = b*w+x;
      if(++j >= cs) {
        this.dMultiply(d);
        this.dAddOffset(w,0);
        j = 0;
        w = 0;
      }
    }
    if(j > 0) {
      this.dMultiply(Math.pow(b,j));
      this.dAddOffset(w,0);
    }
    if(mi) BigInteger.ZERO.subTo(this,this);
  }
  // (protected) return x s.t. r^x < DV
  function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }
  // (public) 0 if this == 0, 1 if this > 0
  function bnSigNum() {
    if(this.s < 0) return -1;
    else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
    else return 1;
  }
  // (protected) this *= n, this >= 0, 1 < n < DV
  function bnpDMultiply(n) {
    this[this.t] = this.am(0,n-1,this,0,0,this.t);
    ++this.t;
    this.clamp();
  }
  // (protected) this += n << w words, this >= 0
  function bnpDAddOffset(n,w) {
    if(n == 0) return;
    while(this.t <= w) this[this.t++] = 0;
    this[w] += n;
    while(this[w] >= this.DV) {
      this[w] -= this.DV;
      if(++w >= this.t) this[this.t++] = 0;
      ++this[w];
    }
  }
  // (protected) convert to radix string
  function bnpToRadix(b) {
    if(b == null) b = 10;
    if(this.signum() == 0 || b < 2 || b > 36) return "0";
    var cs = this.chunkSize(b);
    var a = Math.pow(b,cs);
    var d = nbv(a), y = nbi(), z = nbi(), r = "";
    this.divRemTo(d,y,z);
    while(y.signum() > 0) {
      r = (a+z.intValue()).toString(b).substr(1) + r;
      y.divRemTo(d,y,z);
    }
    return z.intValue().toString(b) + r;
  }
  // (public) return value as integer
  function bnIntValue() {
    if(this.s < 0) {
      if(this.t == 1) return this[0]-this.DV;
      else if(this.t == 0) return -1;
    }
    else if(this.t == 1) return this[0];
    else if(this.t == 0) return 0;
    // assumes 16 < DB < 32
    return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
  }
  // (protected) r = this + a
  function bnpAddTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]+a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c += a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c += a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += a.s;
    }
    r.s = (c<0)?-1:0;
    if(c > 0) r[i++] = c;
    else if(c < -1) r[i++] = this.DV+c;
    r.t = i;
    r.clamp();
  }
  BigInteger.prototype.fromRadix = bnpFromRadix;
  BigInteger.prototype.chunkSize = bnpChunkSize;
  BigInteger.prototype.signum = bnSigNum;
  BigInteger.prototype.dMultiply = bnpDMultiply;
  BigInteger.prototype.dAddOffset = bnpDAddOffset;
  BigInteger.prototype.toRadix = bnpToRadix;
  BigInteger.prototype.intValue = bnIntValue;
  BigInteger.prototype.addTo = bnpAddTo;
  //======= end jsbn =======
  // Emscripten wrapper
  var Wrapper = {
    subtract: function(xl, xh, yl, yh) {
      var x = new goog.math.Long(xl, xh);
      var y = new goog.math.Long(yl, yh);
      var ret = x.subtract(y);
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    multiply: function(xl, xh, yl, yh) {
      var x = new goog.math.Long(xl, xh);
      var y = new goog.math.Long(yl, yh);
      var ret = x.multiply(y);
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    abs: function(l, h) {
      var x = new goog.math.Long(l, h);
      var ret;
      if (x.isNegative()) {
        ret = x.negate();
      } else {
        ret = x;
      }
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    ensureTemps: function() {
      if (Wrapper.ensuredTemps) return;
      Wrapper.ensuredTemps = true;
      Wrapper.two32 = new BigInteger();
      Wrapper.two32.fromString('4294967296', 10);
      Wrapper.two64 = new BigInteger();
      Wrapper.two64.fromString('18446744073709551616', 10);
      Wrapper.temp1 = new BigInteger();
      Wrapper.temp2 = new BigInteger();
    },
    lh2bignum: function(l, h) {
      var a = new BigInteger();
      a.fromString(h.toString(), 10);
      var b = new BigInteger();
      a.multiplyTo(Wrapper.two32, b);
      var c = new BigInteger();
      c.fromString(l.toString(), 10);
      var d = new BigInteger();
      c.addTo(b, d);
      return d;
    },
    divide: function(xl, xh, yl, yh, unsigned) {
      Wrapper.ensureTemps();
      if (!unsigned) {
        var x = new goog.math.Long(xl, xh);
        var y = new goog.math.Long(yl, yh);
        var ret = x.div(y);
        HEAP32[tempDoublePtr>>2] = ret.low_;
        HEAP32[tempDoublePtr+4>>2] = ret.high_;
      } else {
        // slow precise bignum division
        var x = Wrapper.lh2bignum(xl >>> 0, xh >>> 0);
        var y = Wrapper.lh2bignum(yl >>> 0, yh >>> 0);
        var z = new BigInteger();
        x.divRemTo(y, z, null);
        var l = new BigInteger();
        var h = new BigInteger();
        z.divRemTo(Wrapper.two32, h, l);
        HEAP32[tempDoublePtr>>2] = parseInt(l.toString()) | 0;
        HEAP32[tempDoublePtr+4>>2] = parseInt(h.toString()) | 0;
      }
    },
    modulo: function(xl, xh, yl, yh, unsigned) {
      Wrapper.ensureTemps();
      if (!unsigned) {
        var x = new goog.math.Long(xl, xh);
        var y = new goog.math.Long(yl, yh);
        var ret = x.modulo(y);
        HEAP32[tempDoublePtr>>2] = ret.low_;
        HEAP32[tempDoublePtr+4>>2] = ret.high_;
      } else {
        // slow precise bignum division
        var x = Wrapper.lh2bignum(xl >>> 0, xh >>> 0);
        var y = Wrapper.lh2bignum(yl >>> 0, yh >>> 0);
        var z = new BigInteger();
        x.divRemTo(y, null, z);
        var l = new BigInteger();
        var h = new BigInteger();
        z.divRemTo(Wrapper.two32, h, l);
        HEAP32[tempDoublePtr>>2] = parseInt(l.toString()) | 0;
        HEAP32[tempDoublePtr+4>>2] = parseInt(h.toString()) | 0;
      }
    },
    stringify: function(l, h, unsigned) {
      var ret = new goog.math.Long(l, h).toString();
      if (unsigned && ret[0] == '-') {
        // unsign slowly using jsbn bignums
        Wrapper.ensureTemps();
        var bignum = new BigInteger();
        bignum.fromString(ret, 10);
        ret = new BigInteger();
        Wrapper.two64.addTo(bignum, ret);
        ret = ret.toString(10);
      }
      return ret;
    },
    fromString: function(str, base, min, max, unsigned) {
      Wrapper.ensureTemps();
      var bignum = new BigInteger();
      bignum.fromString(str, base);
      var bigmin = new BigInteger();
      bigmin.fromString(min, 10);
      var bigmax = new BigInteger();
      bigmax.fromString(max, 10);
      if (unsigned && bignum.compareTo(BigInteger.ZERO) < 0) {
        var temp = new BigInteger();
        bignum.addTo(Wrapper.two64, temp);
        bignum = temp;
      }
      var error = false;
      if (bignum.compareTo(bigmin) < 0) {
        bignum = bigmin;
        error = true;
      } else if (bignum.compareTo(bigmax) > 0) {
        bignum = bigmax;
        error = true;
      }
      var ret = goog.math.Long.fromString(bignum.toString()); // min-max checks should have clamped this to a range goog.math.Long can handle well
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
      if (error) throw 'range error';
    }
  };
  return Wrapper;
})();
//======= end closure i64 code =======
// === Auto-generated postamble setup entry stuff ===
Module.callMain = function callMain(args) {
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_STATIC) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_STATIC));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_STATIC);
  var ret;
  var initialStackTop = STACKTOP;
  try {
    ret = Module['_main'](argc, argv, 0);
  }
  catch(e) {
    if (e.name == 'ExitStatus') {
      return e.status;
    } else if (e == 'SimulateInfiniteLoop') {
      Module['noExitRuntime'] = true;
    } else {
      throw e;
    }
  } finally {
    STACKTOP = initialStackTop;
  }
  return ret;
}
function run(args) {
  args = args || Module['arguments'];
  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return 0;
  }
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    var toRun = Module['preRun'];
    Module['preRun'] = [];
    for (var i = toRun.length-1; i >= 0; i--) {
      toRun[i]();
    }
    if (runDependencies > 0) {
      // a preRun added a dependency, run will be called later
      return 0;
    }
  }
  function doRun() {
    var ret = 0;
    calledRun = true;
    if (Module['_main']) {
      preMain();
      ret = Module.callMain(args);
      if (!Module['noExitRuntime']) {
        exitRuntime();
      }
    }
    if (Module['postRun']) {
      if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
      while (Module['postRun'].length > 0) {
        Module['postRun'].pop()();
      }
    }
    return ret;
  }
  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
    return 0;
  } else {
    return doRun();
  }
}
Module['run'] = Module.run = run;
// {{PRE_RUN_ADDITIONS}}
if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}
initRuntime();
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}
if (shouldRunNow) {
  run();
}
// {{POST_RUN_ADDITIONS}}
  // {{MODULE_ADDITIONS}}