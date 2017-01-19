import Immutable from 'immutable';
import { TypeMapper, IterableWrapper, KeyValuePair } from './serialize/typeMap';

export namespace Serializer {

  let JSOG_OBJECT_ID = '__jsogObjectId';
  let nextId = 0;

  function isArray(obj: any) {
    return Array.isArray(obj) || Object.prototype.toString.call(obj) === '[object Array]';
  }

  function hasCustomJsonification(obj: any) {
    return (obj.toJSON != null) || (obj.toJS != null);
  }

  function isSpecialIterableType(obj: any) {
    return TypeMapper.isSpecialType(obj);
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
    } else if (isSpecialIterableType(original)) {
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
      let typeName = TypeMapper.extractTypeName(original).type;
      if (typeName) {
        encodedObject[TypeMapper.__typeProperty] = typeName;
      }
      sofar[id] = encodedObject;

      let serializableProps;
      if (typeName !== 'Object') {
        let typeData = TypeMapper.__ksTypeMap.get(typeName)
        if (typeData) {
          serializableProps = TypeMapper.__ksTypeMap.get(typeName).properties;
        } else {
          serializableProps = new Set<string>();
        }
      } else {
        serializableProps = new Set<string>();
      }
      if (!serializableProps.size) {
        for (let key in original) {
          serializableProps.add(key);
        }
      }
      serializableProps.forEach(key => {
        if (key !== JSOG_OBJECT_ID) {
          let property = original[key];
          if (property) {
            let result = doEncode(original[key], idProperty, refProperty, sofar);
            sofar = result.sofar;
            encodedObject[key] = result.encodedObject;
          }
        }
      });


    }
    return {encodedObject, sofar};
  };

  function encodeArray(original, idProperty = '@id', refProperty = '@ref', sofar = {}) {
    let encodedObject = [];
    original.forEach(element => {
      let result = doEncode(element, idProperty, refProperty, sofar);
      sofar = result.sofar;
      encodedObject.push(result.encodedObject);
    });
    return {encodedObject, sofar};
  };

  function encodeIterable(original, idProperty = '@id', refProperty = '@ref', sofar = {}) {
    let iterableObject: Array<KeyValuePair> = [];
    original.forEach(
      (value, key) => {
        iterableObject.push(new KeyValuePair(key, value));
      }
    );

    let wrapperObject = new IterableWrapper(iterableObject);
    wrapperObject[TypeMapper.__typeProperty] = TypeMapper.extractTypeName(original).type;
    return doEncode(wrapperObject, idProperty, refProperty, sofar);
  }

  export function encode(original, idProperty = '@id', refProperty = '@ref') {
    return doEncode(original, idProperty, refProperty, {}).encodedObject;
  };

  function decodeObject(encoded, idProperty = '@id', refProperty = '@ref', found = {}, type?) {
    let ref = encoded[refProperty];
    ref = ref != null ? ref.toString() : ref;
    if (ref != null) {
      return found[ref];
    }

    let serializableProps;
    let decodedObject;
    let typeName = encoded[TypeMapper.__typeProperty];
    if (typeName && typeName !== 'Object') {
      let typeData = TypeMapper.getTypeForName(typeName);
      if (typeData) {
        decodedObject = new (<any>typeData.constr)();
        serializableProps = typeData.properties;
      }
      else {
        serializableProps = new Set<string>();
      }
    }
    else {
      serializableProps = new Set<string>();
    }

    if (!serializableProps.size) {
      for (let key in encoded) {
        serializableProps.add(key);
      }
    }

    if (!decodedObject) {
      decodedObject = {}
    }

    let id = encoded[idProperty];
    id = id != null ? id.toString() : id;
    if (id) {
      found[id] = decodedObject;
    }
    serializableProps.forEach(key => {
      if (key !== idProperty) {
        let decodedEntry = doDecode(encoded[key], idProperty, refProperty, found);
        if (decodedEntry) {
          decodedObject[key] = doDecode(encoded[key], idProperty, refProperty, found);
        }
      }
    });
    return decodedObject;
  };

  function decodeArray(encoded, idProperty = '@id', refProperty = '@ref', found = {}) {
    let decodedObject = [];
    encoded.forEach(element => {
      let result = doDecode(element, idProperty, refProperty, found);
      decodedObject.push(result);
    });
    return decodedObject;
  };

  function decodeIterable(encoded, idProperty = '@id', refProperty = '@ref', found = {}) {
    let valuesArray = [];

    encoded.values.forEach(element => {
      let result = doDecode(element, idProperty, refProperty, found);
      if (result.key)
        valuesArray.push(result.key);
      if (result.value)
        valuesArray.push(result.value);
    });

    let typeData = TypeMapper.getTypeForName(encoded[TypeMapper.__typeProperty])

    switch (typeData.constr) {
      case Immutable.List:
      case Immutable.Map:
      case Immutable.OrderedMap:
      case Immutable.Set:
      case Immutable.OrderedSet:
      case Immutable.Stack:
      case Immutable.Record:
      case Immutable.Seq:
        return (<any>typeData.constr).of(...valuesArray);
      case Map:
        return new Map(valuesArray);
      case Set:
        return new Set(valuesArray);
      default:
        throw new Error(`Unsupported Iterable type: ${typeData.constr}`);
    }
  };

  function doDecode(encoded, idProperty = '@id', refProperty = '@ref', found = {}) {
    if (encoded == null) {
      return encoded;
    } else if (isSpecialIterableType(encoded)) {
      return decodeIterable(encoded, idProperty, refProperty, found);
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
