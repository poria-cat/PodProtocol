import {
  Value,
  ValueKind,
  StringMap,
  stringToArrayBuffer,
  store,
} from "@pod/ts";

export function sayHello(): Value {
  return new Value(ValueKind.STRING, stringToArrayBuffer("hello"));
}

export function storeWhat(what: string): void {
  let map = new StringMap();
  map.set("say", new Value(ValueKind.STRING, stringToArrayBuffer(what)));
  map.set("key1", new Value(ValueKind.STRING, stringToArrayBuffer("say!!!")));
  store.set("Test", "id_12", map.entries);
}
