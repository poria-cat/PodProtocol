export function arrayBufferToString(buf: ArrayBuffer): string {
  let arr: Array<i32> = [];
  let typed = Uint8Array.wrap(buf);
  for (let index = 0; index < typed.length; index++) {
    arr.push(typed[index]);
  }
  return String.fromCharCodes(arr);
}

export function stringToArrayBuffer(str: string): ArrayBuffer {
  let arr = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    arr[i] = str.charCodeAt(i);
  }
  return arr.buffer;
}

export function i32ToArrayBuffer(n: i32): ArrayBuffer {
  let view = new DataView(new ArrayBuffer(16));
  view.setInt32(1, n);
  return view.buffer;
}

export function arrayBufferToI32(buf: ArrayBuffer): i32 {
  return new DataView(buf).getInt32(1);
}
