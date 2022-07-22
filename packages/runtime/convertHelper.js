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
