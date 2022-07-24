import {
  stringToArrayBuffer,
  arrayBufferToString,
  i32ToArrayBuffer,
  arrayBufferToI32,
} from "./convert";

export {
  stringToArrayBuffer,
  arrayBufferToString,
  i32ToArrayBuffer,
  arrayBufferToI32,
};

export enum ValueKind {
  STRING = 0,
  INT = 1,
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

export class KeyValue {
  constructor(public key: string, public value: Value) {}
}

export class StringMap {
  entries: Array<KeyValue>;

  constructor() {
    this.entries = new Array<KeyValue>(0);
  }

  getEntry(key: string): KeyValue | null {
    for (let i = 0; i < this.entries.length; i++) {
      if (this.entries[i].key == key) {
        return this.entries[i];
      }
    }
    return null;
  }

  set(key: string, value: Value): void {
    let entry = this.getEntry(key);
    if (entry) {
      entry.value = value;
    } else {
      this.entries.push(new KeyValue(key, value));
    }
  }

  get(key: string): Value | null {
    let entry = this.getEntry(key);
    return entry ? entry.value : null;
  }
}

export function testInput(p: Value): string {
  return p.toString();
}

export declare namespace console {
  // @external("env", "console.log")
  function log(n: string): void;
}

export declare namespace store {
  function set(entityName: string, id: string, data: Array<KeyValue>): void;
  function get(entityName: string, id: string): Array<KeyValue>;
}

export function testConsole(): void {
  console.log("hello console");
}

export function exportStore(): void {
  let s = new Array<KeyValue>(0);
  let v = new Value(ValueKind.STRING, stringToArrayBuffer("hello"));
  let kv = new KeyValue("testKey", v);
  s.push(kv);
  store.set("TestEntity", "test-id", s);

  let record = new StringMap();
  record.set("qaq", new Value(ValueKind.INT, i32ToArrayBuffer(12121)));
  store.set("Test", "id_0", record.entries);
}

export function testInputKV(): void {
  let v0 = store.get("Test", "id_0");
  let v1 = store.get("Test", "id_2");

  let record = new StringMap();
  record.entries = v0;

  console.log(`${v0.length}, ${v1.length}`);
}
