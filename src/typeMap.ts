import Immutable from 'immutable';

export namespace TypeMapper {
  export let __ksTypeMap: Map<string, Function> = new Map<string, Function>();
  export let __typeProperty = 'cType';

  let iterableNamesMap = new Map<Function, string>();
  let jsNamesMap = new Map<Function, string>();

  export function changeTypePrefix(newPrefix: string) {
    iterableNamesMap.forEach(
      (value, key) => {
        __ksTypeMap.delete(value);
      }
    );
    jsNamesMap.forEach(
      (value, key) => {
        __ksTypeMap.delete(value);
      }
    );

    iterableNamesMap = new Map<Function, string>();
    iterableNamesMap.set(Immutable.List, newPrefix + 'ImmutableList');
    iterableNamesMap.set(Immutable.Map, newPrefix + 'ImmutableMap');
    iterableNamesMap.set(Immutable.OrderedMap, newPrefix + 'ImmutableOrderedMap');
    iterableNamesMap.set(Immutable.Set, newPrefix + 'ImmutableSet');
    iterableNamesMap.set(Immutable.OrderedSet, newPrefix + 'ImmutableOrderedSet');
    iterableNamesMap.set(Immutable.Stack, newPrefix + 'ImmutableStack');
    iterableNamesMap.set(Immutable.Record, newPrefix + 'ImmutableRecord');
    iterableNamesMap.set(Immutable.Seq, newPrefix + 'ImmutableSeq');
    jsNamesMap = new Map<Function, string>();
    jsNamesMap.set(Map, newPrefix + 'Map');
    jsNamesMap.set(Set, newPrefix + 'Set')

    iterableNamesMap.forEach(
      (value, key) => {
        __ksTypeMap.set(value, key);
      }
    );
    jsNamesMap.forEach(
      (value, key) => {
        __ksTypeMap.set(value, key);
      }
    );
  }
  changeTypePrefix('JS');

  export function getTypeName(object) {

    if (typeof object !== 'object') {
      return;
    }

    if (object[__typeProperty]) {
      return {type: object[__typeProperty]}
    }

    if (object.constructor) {

      let result = iterableNamesMap.get(object.constructor);
      if (result) {
        return {type: result, immutable: true};
      }

      result = jsNamesMap.get(object.constructor)
      if (result) {
        return {type: result};
      }

      return {type: object.constructor.name};
    }

    return {type: 'Object'};

  }

  export function setExplicitTypeName(object) {
    if (typeof object !== 'object') {
      return;
    }
    object[__typeProperty] = getTypeName(object);
    return object;
  }

  export function getTypeForName(typeName: string) {
    return __ksTypeMap.get(typeName);
  }
}

export function Serializable(target: Function) {
  let constr = target;
  let className = target.name;
  if (TypeMapper.__ksTypeMap.get(className)) {
    throw new Error(`Classname ${className} not unique!`);
  }
  TypeMapper.__ksTypeMap.set(className, constr);
}
