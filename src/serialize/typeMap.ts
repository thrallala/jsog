import Immutable from 'immutable';

export class IterableWrapper {
  constructor(public values: Array<any>) {
  }
}

export class KeyValuePair {
  constructor(public key: any, public value: any) {
  }
}


export class TypeData {

  public properties = new Set<string>();

  constructor(public readonly typeName: string,
              public constr?: Function) {
  }

}

export namespace TypeMapper {
  export let __ksTypeMap: Map<string, TypeData> = new Map<string, TypeData>();
  export let __typeProperty = 'cType';
  export let __immutableTypePrefix = 'JS';

  export let iterableNamesMap = new Map<Function, string>();
  export let jsNamesMap = new Map<Function, string>();

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
        __ksTypeMap.set(value, new TypeData(value, key));
      }
    );
    jsNamesMap.forEach(
      (value, key) => {
        __ksTypeMap.set(value, new TypeData(value, key));
      }
    );
  }

  changeTypePrefix('JS');

  export function getTypeName(object): any {

    if (typeof object !== 'object') {
      return {type: undefined};
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

    return {type: 'object'};

  }

  export function setExplicitTypeName(object) {
    if (typeof object !== 'object') {
      return;
    }
    object[__typeProperty] = getTypeName(object).type;
    return object;
  }

  export function getTypeForName(typeName: string) {
    return __ksTypeMap.get(typeName);
  }
}
