import {
  arrayBufferToI32,
  BindHelper,
  stringToArrayBuffer,
  arrayBufferToString,
  i32toArrayBuffer,
} from "@pod/runtime";

import fs from "fs";
import { instantiateSync } from "@assemblyscript/loader";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getValueFromKV(kv) {
  // string
  if (kv.value.kind === 0) {
    return arrayBufferToString(kv.value.data);
  } else if (kv.value.kind === 1) {
    return arrayBufferToI32(kv.value.data);
  }
}

function kvArrayToObj(kvArray) {
  let obj = {};
  kvArray.forEach((kv) => {
    obj[kv.key] = getValueFromKV(kv);
  });
  return obj;
}

function objToKVArray(obj) {
  if (!obj) {
    return []
  }
  let keys = Object.keys(obj);
  let arr = [];
  keys.forEach((key) => {
    let v = obj[key];
    let valueType = typeof v;
    let value = {};
    if (valueType == "number") {
      value = { kind: 0, data: stringToArrayBuffer(v) };
    } else if (valueType == "string") {
      value = { kind: 1, data: i32toArrayBuffer(v) };
    }
    arr.push({ key, value });
  });
  return arr
}

console.log(objToKVArray({test: "qaq", test2: 121}))

let store = {
  // pod_0
  0: {
    Test: {
      id_0: {
        key: "this is test key",
      },
    },
  },
};

let snapshot = {
  // pod id
  // "0": [{entity: "Test", id: "id_1", data: {key: "test key"}}, {entity: "Test2", id: "id_0", data: null}]
};

// need pass pod id, store, snapshot
function loadWasm(wasmBuffer, imports) {
  const wasmModule = instantiateSync(wasmBuffer, {
    index: {
      "console.log": (n) => console.log(bind.liftString(n)),
      "store.set": (entityName, id, kvArray) => {
        entityName = bind.liftString(entityName);
        if (entityName === "Test") {
          throw "Test not defined"
        }
        id = bind.liftString(id);
        kvArray = bind.liftKeyValueArray(kvArray);
        // console.log("in store.set:", {
        //   entityName,
        //   id,
        //   data: kvArrayToObj(kvArray),
        // });
        let convertedValue = kvArrayToObj(kvArray);
        let pod_id = "0";
        if (!store[pod_id]) {
          store[pod_id] = {};
        }
        // check whether config have this entity
        let entity = store[pod_id][entityName];
        if (!entity) {
          store[pod_id][entityName] = {};
        }
        let entityValue = store[pod_id][entityName][id];

        let storeSnapshot = snapshot[pod_id];
        if (!storeSnapshot) {
          // storeSnapshot = []
          snapshot[pod_id] = [];
        }
        let newEntityValue;
        if (!entityValue) {
          snapshot[pod_id].push({ entity: entityName, id, data: null });
          newEntityValue = convertedValue;
        } else {
          snapshot[pod_id].push({ entity: entityName, id, data: entityValue });
          console.log({ entity });
          newEntityValue = { ...entityValue, ...convertedValue };
        }

        store[pod_id][entityName][id] = newEntityValue;

        // console.log("store:", JSON.stringify(store, null, 2));
        // console.log("snapshot", JSON.stringify(snapshot, null, 2));
        // check which value can't not null
        // send revert data or use immerjs
        // if data is null, need remove it
      },
      "store.get": (entityName, id) => {
        entityName = bind.liftString(entityName);
        id = bind.liftString(id);
        let pod_id = "0";
        let obj = store[pod_id][entityName][id]
        let kvArray = objToKVArray(obj)
        // kvArray = bind.lowerArray((pointer, value) => {new Uint32Array(wasmModule.exports.memory.buffer)[pointer >>> 2] = bind.lowerKeyValue(value) || bind.notnull();}, 9, 2, kvArray) || bind.notnull()
        kvArray = bind.lowerKeyValueArray(kvArray)
        return kvArray
        // kvP = __lowerArray((pointer, value) => { new Uint32Array(memory.buffer)[pointer >>> 2] = __lowerRecord8(value) || __notnull(); }, 9, 2, kvP) || __notnull();
      // exports.inputKv(kvP);
      }
    },
  });
  const bind = new BindHelper(wasmModule.exports);

  function testInput(valueParams) {
    valueParams = bind.lowerValue(valueParams) || bind.notnull();
    let result = wasmModule.exports.testInput(valueParams);
    return bind.liftString(result >>> 0);
  }
  console.log(testInput({ kind: 0, data: stringToArrayBuffer("hello") }));
  // exports.testConsole()
  wasmModule.exports.testConsole();
  wasmModule.exports.testInputKV();
  wasmModule.exports.exportStore();
  wasmModule.exports.testInputKV();
}

const imports = {
  env: {
    "console.log": (n) => console.log(__liftString(n)),
  },
};
const wasmBuffer = fs.readFileSync(__dirname + "/build/optimized.wasm");
// const wasmBuffer = fs.readFileSync(__dirname + "/myModule.wasm");

try {
  const wasmInstance = loadWasm(wasmBuffer, imports);
} catch (error) {
  console.log({error})
}
