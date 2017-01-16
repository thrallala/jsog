import Immutable from 'immutable';

export module JSOG {

  let JSOG_OBJECT_ID = '__jsogObjectId';
  let nextId = 0;

  function isArray(obj: any) {
    return Array.isArray(obj) || Object.prototype.toString.call(obj) === '[object Array]';
  }

  function hasCustomJsonification(obj: any) {
    return (obj.toJSON != null) || (obj.toJS != null);
  }

  export function encode(original, idProperty = '@id', refProperty = '@ref') {
    var doEncode, idOf, sofar;
    sofar = {};
    idOf = function (obj) {
      if (!obj[JSOG_OBJECT_ID]) {
        obj[JSOG_OBJECT_ID] = "" + (nextId++);
      }
      return obj[JSOG_OBJECT_ID];
    };
    doEncode = function (original) {
      var encodeArray, encodeObject;
      encodeObject = function (original) {
        var id, key, obj1, obj2, result, value;
        id = idOf(original);
        if (sofar[id]) {
          return (
            obj1 = {},
              obj1["" + refProperty] = id,
              obj1
          );
        }
        result = sofar[id] = (
          obj2 = {},
            obj2["" + idProperty] = id,
            obj2
        );
        for (key in original) {
          value = original[key];
          if (key !== JSOG_OBJECT_ID) {
            result[key] = doEncode(value);
          }
        }
        return result;
      };
      encodeArray = function (original) {
        var val;
        return (function () {
          var i, len, results;
          results = [];
          for (i = 0, len = original.length; i < len; i++) {
            val = original[i];
            results.push(doEncode(val));
          }
          return results;
        })();
      };
      if (original == null) {
        return original;
      } else if (Immutable.Iterable.isIterable(original)) {
        // let entries = original.entries();
        // let mapObject: Array<{key?:any, value:any}> = [];
        // console.log(original + ' ITERABLE');
        // let entry;
        // while(entry = entries.next() && entry) {
        //   if (entry.value && entry.value.length > 1) {
        //     mapObject.push({
        //       'key': entry.value[0],
        //       'value': entry.value[1]
        //     });
        //   } else if (entry.value && entry.value.length === 1) {
        //     mapObject.push({
        //       'value': entry.value[0]
        //     });
        //   } else {
        //     mapObject.push({
        //       'value': entry.value
        //     });
        //   }
        // }
        // console.log(mapObject);
        return original; // encodeObject(mapObject);
      } else if (hasCustomJsonification(original)) {
        return original;
      } else if (isArray(original)) {
        return encodeArray(original);
      } else if (typeof original === 'object') {
        return encodeObject(original);
      } else {
        return original;
      }
    };
    return doEncode(original);
  };
  export function decode(encoded, idProperty = '@id', refProperty = '@ref') {
    var doDecode, found;
    found = {};
    doDecode = function (encoded) {
      var decodeArray, decodeObject;
      decodeObject = function (encoded) {
        var id, key, ref, result, value;
        ref = encoded[refProperty];
        if (ref != null) {
          ref = ref.toString();
        }
        if (ref != null) {
          return found[ref];
        }
        result = {};
        id = encoded[idProperty];
        if (id != null) {
          id = id.toString();
        }
        if (id) {
          found[id] = result;
        }
        for (key in encoded) {
          value = encoded[key];
          if (key !== idProperty) {
            result[key] = doDecode(value);
          }
        }
        return result;
      };
      decodeArray = function (encoded) {
        var value;
        return (function () {
          var i, len, results;
          results = [];
          for (i = 0, len = encoded.length; i < len; i++) {
            value = encoded[i];
            results.push(doDecode(value));
          }
          return results;
        })();
      };
      if (encoded == null) {
        return encoded;
      } else if (isArray(encoded)) {
        return decodeArray(encoded);
      } else if (typeof encoded === 'object') {
        return decodeObject(encoded);
      } else {
        return encoded;
      }
    };
    return doDecode(encoded);
  };

  export function stringify(obj) {
    return JSON.stringify(encode(obj));
  };

  export function parse(str) {
    return decode(JSON.parse(str));
  };
}
