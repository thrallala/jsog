import { TypeMapper, TypeData } from './typeMap';

export function Serializable(target: Function) {
  let constr = target;
  let className = target.name;
  let typeData = TypeMapper.__ksTypeMap.get(className);
  if (!typeData) {
    typeData = new TypeData(className);
    TypeMapper.__ksTypeMap.set(className, typeData);
  }
  if (typeData.constr) {
    throw new Error(`Classname ${className} not unique!`);
  }
  typeData.constr = constr;
}

//when inheriting serialization if the parent doesn't have any @serialize, it won't be inherited
export function InheritSerializable(parentType: Function): any {
  return function (childType: Function) {
    let parentClassName = parentType.name;
    let parentTypeData = TypeMapper.__ksTypeMap.get(parentClassName);//TypeMap.get(parentType) || [];
    if (!parentTypeData) {
      throw new Error(`Type data unavailable for ${parentClassName} !`);
    }
    let childConstr = childType;
    let childClassName = childType.name;
    let childTypeData = TypeMapper.__ksTypeMap.get(childClassName);

    if (!childTypeData) {
      childTypeData = new TypeData(childClassName);
      TypeMapper.__ksTypeMap.set(childClassName, childTypeData);
    }

    if(childTypeData.properties.size) {
      if(parentTypeData.properties && parentTypeData.properties.size) {
        parentTypeData.properties.forEach( parentKey =>
        {
          childTypeData.properties.add(parentKey);
        });
      }
    } else {
      childTypeData.properties = new Set<string>(parentTypeData.properties);
    }
    childTypeData.constr = childConstr;
  }
}

//an untyped serialization property annotation, gets existing metadata for the target or creates
//a new one and assigns the serialization key for that type in the meta data
export function serialize(target: any, keyName: string): any {
  if (!target || !keyName) return;

  let className = TypeMapper.getTypeName(target).type;
  if(className) {
    let typeData = TypeMapper.__ksTypeMap.get(className);
    if (!typeData) {
      typeData = new TypeData(className);
      TypeMapper.__ksTypeMap.set(className, typeData);
    }
    typeData.properties.add(keyName);
  }
}


