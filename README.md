## Serializer for typescript based on cerialize and JSOG

Works based on annotations
* @Serializable - it will find the correct type when deserializing
* @InheritSerializable(parent) - inherits the parent's properties when serializing
* @serialize - only serialize certain properties marked with this annotation. If none are marked, it will serialize everything

ex.
```
@Serializable
export class TestClass1 {

  @serialize public x: string;
  @serialize public y: any;
  @serialize public z: number;

  public arr = [1,2,3];
  public obj = {'plr': 'plt'};


  @serialize public immutableJStest : Map<string, TestClass>;

  constructor(plm, plz = 2, immutableJStest?) {
    this.p = this;
    this.plm = plm;
    this.plz = plz;

    if(immutableJStest) {
      this.immutableJStest = immutableJStest;
    }
  }

  testFunction() {
    console.log('testFunction');
  }

}

@InheritSerializable(TestClass1)
export class TestClass extends TestClass1 {

  @serialize public xzy = 3;

  constructor(x: string, plz = 2, immutableJStest?){
    super(x, plz, immutableJStest);
  }

}
```
