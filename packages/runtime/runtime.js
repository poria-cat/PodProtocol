import { BindHelper } from "./bindHelper.js";
import {
  kvArrayToObj,
  objToKVArray,
} from "./convertHelper.js";

import { instantiateSync } from "@assemblyscript/loader";

// let store = {
//   // pod_0
//   0: {
//     Test: {
//       id_0: {
//         key: "this is test key",
//       },
//     },
//   },
// };

// let snapshot = {
//   // pod id
//   // "0": [{entity: "Test", id: "id_1", data: {key: "test key"}}, {entity: "Test2", id: "id_0", data: null}]
// };

// need pass pod id, store, snapshot
export function wasmRuntime(wasmBuffer, podId, store = {}, snapshot = {}) {
  const wasmModule = instantiateSync(wasmBuffer, {
    index: {
      "console.log": (n) => console.log(bind.liftString(n)),
      "store.set": (entityName, id, kvArray) => {
        entityName = bind.liftString(entityName);
        id = bind.liftString(id);
        kvArray = bind.liftKeyValueArray(kvArray);
        // console.log("in store.set:", {
        //   entityName,
        //   id,
        //   data: kvArrayToObj(kvArray),
        // });
        let convertedValue = kvArrayToObj(kvArray);
        if (!store[podId]) {
          store[podId] = {};
        }
        // check whether config have this entity
        let entity = store[podId][entityName];
        if (!entity) {
          store[podId][entityName] = {};
        }
        let entityValue = store[podId][entityName][id];

        let storeSnapshot = snapshot[podId];
        if (!storeSnapshot) {
          // storeSnapshot = []
          snapshot[podId] = [];
        }
        let newEntityValue;
        if (!entityValue) {
          snapshot[podId].push({ entity: entityName, id, data: null });
          newEntityValue = convertedValue;
        } else {
          snapshot[podId].push({ entity: entityName, id, data: entityValue });
          console.log({ entity });
          newEntityValue = { ...entityValue, ...convertedValue };
        }

        store[podId][entityName][id] = newEntityValue;

        console.log("store:", JSON.stringify(store, null, 2));
        console.log("snapshot", JSON.stringify(snapshot, null, 2));
        // check which value can't not null
        // send revert data or use immerjs
        // if data is null, need remove it
      },
      "store.get": (entityName, id) => {
        entityName = bind.liftString(entityName);
        id = bind.liftString(id);
        let obj = store[podId][entityName][id];
        let kvArray = objToKVArray(obj);
        // kvArray = bind.lowerArray((pointer, value) => {new Uint32Array(wasmModule.exports.memory.buffer)[pointer >>> 2] = bind.lowerKeyValue(value) || bind.notnull();}, 9, 2, kvArray) || bind.notnull()
        kvArray = bind.lowerKeyValueArray(kvArray);
        return kvArray;
        // kvP = __lowerArray((pointer, value) => { new Uint32Array(memory.buffer)[pointer >>> 2] = __lowerRecord8(value) || __notnull(); }, 9, 2, kvP) || __notnull();
        // exports.inputKv(kvP);
      },
    },
  });
  const bind = new BindHelper(wasmModule.exports);

  return {
    memory: wasmModule.module,
    exports: wasmModule.exports,
    bindHelper: bind,
  };
  //   function testInput(valueParams) {
  //     valueParams = bind.lowerValue(valueParams) || bind.notnull();
  //     let result = wasmModule.exports.testInput(valueParams);
  //     return bind.liftString(result >>> 0);
  //   }

  //   console.log(testInput({ kind: 0, data: stringToArrayBuffer("hello") }));
  // exports.testConsole()
  //   wasmModule.exports.testConsole();
  //   wasmModule.exports.testInputKV();
  //   wasmModule.exports.exportStore();
  //   wasmModule.exports.testInputKV();
}

// const wasmBuffer = fs.readFileSync(__dirname + "/build/optimized.wasm");
// const wasmBuffer = fs.readFileSync(__dirname + "/myModule.wasm");

// const wasmInstance = loadWasm(wasmBuffer, imports);
