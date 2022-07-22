import {
  stringToArrayBuffer,
  arrayBufferToString,
  i32ToArrayBuffer,
  arrayBufferToI32,
} from "./convert";

export enum ValueKind {
  STRING = 0,
  INT = 1,
}

export class KeyValue {
  constructor(public key: string, public value: Value) {}
}

export class Value {
  constructor(public kind: ValueKind, public data: ArrayBuffer) {}

  static fromString(s: string): Value {
    return new Value(ValueKind.STRING, stringToArrayBuffer(s));
  }

  static fromI32(n: i32): Value {
    return new Value(ValueKind.INT, i32ToArrayBuffer(n));
  }

  toString(): string {
    assert(this.kind == ValueKind.STRING, "Value is not an string.");
    return arrayBufferToString(this.data);
  }
  toI32(): i32 {
    assert(this.kind == ValueKind.INT, "Value is not an int.");
    return arrayBufferToI32(this.data);
  }
}

export function testInput(p: Value): string {
  return p.toString();
}
