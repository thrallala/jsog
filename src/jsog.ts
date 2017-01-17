import Immutable from 'immutable';
import { TypeMapper } from './typeMap';

export namespace JSOG {

  let JSOG_OBJECT_ID = '__jsogObjectId';
  let nextId = 0;

  function isArray(obj: any) {
    return Array.isArray(obj) || Object.prototype.toString.call(obj) === '[object Array]';
  }

  function hasCustomJsonification(obj: any) {
    return (obj.toJSON != null) || (obj.toJS != null);
  }

  function isImmutableJS(obj: any){
    return Immutable.Iterable.isIterable(obj);
  }

  function isSet(obj: any){
    return obj instanceof Set;
  }

  function isMap(obj: any){
    return obj instanceof Map;
  }

  function idOf(obj: any) {
    if (!obj[JSOG_OBJECT_ID]) {
      obj[JSOG_OBJECT_ID] = "" + (nextId++);
    }
    return obj[JSOG_OBJECT_ID];
  };

  function doEncode(original: any, idProperty = '@id', refProperty = '@ref', sofar = {}) {
    if (original == null) {
      return {encodedObject: original, sofar};
    } else if (isImmutableJS(original) || isMap(original) || isSet(original)) {
      return encodeIterable(original, idProperty, refProperty, sofar);
    } else if (hasCustomJsonification(original)) {
      return {encodedObject: original, sofar};
    } else if (isArray(original)) {
      return encodeArray(original, idProperty, refProperty, sofar);
    } else if (typeof original === 'object') {
      return encodeObject(original, idProperty, refProperty, sofar);
    } else {
      return {encodedObject: original, sofar};
    }
  };

  function encodeObject(original: any, idProperty = '@id', refProperty = '@ref', sofar = {}) {
    let id = idOf(original);

    let encodedObject = {};
    if (sofar[id]) {
      encodedObject[refProperty] = id;
    }
    else {
      encodedObject[idProperty] = id;
      encodedObject = TypeMapper.getTypeName(original);
      sofar[id] = encodedObject;
      for (let key in original) {
        if (key !== JSOG_OBJECT_ID) {
          let result = doEncode(original[key], idProperty, refProperty, sofar);
          sofar = result.sofar;
          encodedObject[key] = result.encodedObject;
        }
      }
    }
    return {encodedObject, sofar};
  };

  function encodeArray(original, idProperty = '@id', refProperty = '@ref', sofar = {}) {
    let encodedObject = [];
    original.forEach( element => {
      let result = doEncode(element, idProperty, refProperty, sofar);
      sofar = result.sofar;
      encodedObject.push(result.encodedObject);
    });
    return {encodedObject, sofar};
  };

  function encodeIterable(original, idProperty = '@id', refProperty = '@ref', sofar = {}) {
    let iterableObject: Array<{key?: any, value: any}> = [];
    original.forEach(
      (value, key) => {
        iterableObject.push({key: key, value: value});
      }
    );

    let wrapperObject = {value: iterableObject};
    wrapperObject[TypeMapper.__typeProperty] = TypeMapper.getTypeName(original);
    return doEncode(wrapperObject, idProperty, refProperty, sofar);
  }

  export function encode(original, idProperty = '@id', refProperty = '@ref') {
    return doEncode(original, idProperty, refProperty, {}).encodedObject;
  };

  function decodeObject (encoded, idProperty = '@id', refProperty = '@ref', found = {}) {
    let ref = encoded[refProperty];
    ref = ref != null ? ref.toString() : ref;
    if (ref != null) {
      return found[ref];
    }

    let decodedObject = {};
    let id = encoded[idProperty];
    id = id != null ? id.toString() : id;
    if (id) {
      found[id] = decodedObject;
    }
    for (let key in encoded) {
      if (key !== idProperty) {
        decodedObject[key] = doDecode(encoded[key], idProperty, refProperty, found);
      }
    }
    return decodedObject;
  };

  function decodeArray (encoded, idProperty = '@id', refProperty = '@ref', found = {}) {
    let decodedObject = [];
    encoded.forEach( element => {
      let result = doDecode(element, idProperty, refProperty, found);
      decodedObject.push(result);
    });
    return decodedObject;
  };

  function doDecode (encoded, idProperty = '@id', refProperty = '@ref', found = {}) {
    if (encoded == null) {
      return encoded;
    } else if (isArray(encoded)) {
      return decodeArray(encoded, idProperty, refProperty, found);
    } else if (typeof encoded === 'object') {
      return decodeObject(encoded, idProperty, refProperty, found);
    } else {
      return encoded;
    }
  };

  export function decode(encoded, idProperty = '@id', refProperty = '@ref') {
    return doDecode(encoded, idProperty, refProperty, {});
  };

  export function stringify(obj) {
    return JSON.stringify(encode(obj));
  };

  export function parse(str) {
    return decode(JSON.parse(str));
  };
}
