export function stringToArrayBuffer(str) {
  let arr = [];
  for (let i = 0; i < str.length; ++i) {
    arr.push(str.charCodeAt(i));
  }
  return new Uint8Array(arr).buffer;
}

export function arrayBufferToString(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

export function i32toArrayBuffer(n) {
  let view = new DataView(new ArrayBuffer(16));
  view.setInt32(1, n);
  return view.buffer;
}

export function arrayBufferToI32(buf) {
  return new DataView(buf).getInt32(1);
}

export function getValueFromKV(kv) {
  // string
  if (kv.value.kind === 0) {
    return arrayBufferToString(kv.value.data);
  } else if (kv.value.kind === 1) {
    return arrayBufferToI32(kv.value.data);
  }
}

export function kvArrayToObj(kvArray) {
  let obj = {};
  kvArray.forEach((kv) => {
    obj[kv.key] = getValueFromKV(kv);
  });
  return obj;
}

export function objToKVArray(obj) {
  if (!obj) {
    return [];
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
  return arr;
}