export class BindHelper {
  constructor(exports) {
    this.exports = exports;
    this.memory = exports.memory;
  }

  liftString(pointer) {
    if (!pointer) return null;
    const end =
        (pointer + new Uint32Array(this.memory.buffer)[(pointer - 4) >>> 2]) >>>
        1,
      memoryU16 = new Uint16Array(this.memory.buffer);
    let start = pointer >>> 1,
      string = "";
    while (end - start > 1024)
      string += String.fromCharCode(
        ...memoryU16.subarray(start, (start += 1024))
      );
    return string + String.fromCharCode(...memoryU16.subarray(start, end));
  }
  lowerString(value) {
    if (value == null) return 0;
    const length = value.length,
      pointer = this.exports.__new(length << 1, 1) >>> 0,
      memoryU16 = new Uint16Array(memory.buffer);
    for (let i = 0; i < length; ++i)
      memoryU16[(pointer >>> 1) + i] = value.charCodeAt(i);
    return pointer;
  }

  liftBuffer(pointer) {
    if (!pointer) return null;
    return this.memory.buffer.slice(
      pointer,
      pointer + new Uint32Array(this.memory.buffer)[(pointer - 4) >>> 2]
    );
  }
  lowerBuffer(value) {
    if (value == null) return 0;
    const pointer = this.exports.__new(value.byteLength, 0) >>> 0;
    new Uint8Array(this.memory.buffer).set(new Uint8Array(value), pointer);
    return pointer;
  }
  liftString(pointer) {
    if (!pointer) return null;
    const end =
        (pointer + new Uint32Array(this.memory.buffer)[(pointer - 4) >>> 2]) >>>
        1,
      memoryU16 = new Uint16Array(this.memory.buffer);
    let start = pointer >>> 1,
      string = "";
    while (end - start > 1024)
      string += String.fromCharCode(
        ...memoryU16.subarray(start, (start += 1024))
      );
    return string + String.fromCharCode(...memoryU16.subarray(start, end));
  }
  lowerString(value) {
    if (value == null) return 0;
    const length = value.length,
      pointer = this.exports.__new(length << 1, 1) >>> 0,
      memoryU16 = new Uint16Array(this.memory.buffer);
    for (let i = 0; i < length; ++i)
      memoryU16[(pointer >>> 1) + i] = value.charCodeAt(i);
    return pointer;
  }
  liftArray(liftElement, align, pointer) {
    if (!pointer) return null;
    const memoryU32 = new Uint32Array(this.memory.buffer),
      dataStart = memoryU32[(pointer + 4) >>> 2],
      length = memoryU32[(pointer + 12) >>> 2],
      values = new Array(length);
    for (let i = 0; i < length; ++i)
      values[i] = liftElement(dataStart + ((i << align) >>> 0));
    return values;
  }
  lowerArray(lowerElement, id, align, values) {
    if (values == null) return 0;
    const length = values.length,
      buffer = this.exports.__pin(this.exports.__new(length << align, 0)) >>> 0,
      header = this.exports.__pin(this.exports.__new(16, id)) >>> 0,
      memoryU32 = new Uint32Array(this.memory.buffer);
    memoryU32[(header + 0) >>> 2] = buffer;
    memoryU32[(header + 4) >>> 2] = buffer;
    memoryU32[(header + 8) >>> 2] = length << align;
    memoryU32[(header + 12) >>> 2] = length;
    for (let i = 0; i < length; ++i)
      lowerElement(buffer + ((i << align) >>> 0), values[i]);
    this.exports.__unpin(buffer);
    this.exports.__unpin(header);
    return header;
  }
  liftTypedArray(constructor, pointer) {
    if (!pointer) return null;
    const memoryU32 = new Uint32Array(this.memory.buffer);
    return new constructor(
      this.memory.buffer,
      memoryU32[(pointer + 4) >>> 2],
      memoryU32[(pointer + 8) >>> 2] / constructor.BYTES_PER_ELEMENT
    ).slice();
  }
  lowerTypedArray(constructor, id, align, values) {
    if (values == null) return 0;
    const length = values.length,
      buffer = this.exports.__pin(this.exports.__new(length << align, 0)) >>> 0,
      header = this.exports.__new(12, id) >>> 0,
      memoryU32 = new Uint32Array(this.memory.buffer);
    memoryU32[(header + 0) >>> 2] = buffer;
    memoryU32[(header + 4) >>> 2] = buffer;
    memoryU32[(header + 8) >>> 2] = length << align;
    new constructor(this.memory.buffer, buffer, length).set(values);
    this.exports.__unpin(buffer);
    return header;
  }
  notnull() {
    throw TypeError("value must not be null");
  }
  liftValue(pointer) {
    // Value {kind:enum, data:arraybuffer}
    if (!pointer) return null;
    return {
      kind: new Int32Array(this.memory.buffer)[(pointer + 0) >>> 2],
      data: this.liftBuffer(
        new Uint32Array(this.memory.buffer)[(pointer + 4) >>> 2]
      ),
    };
  }
  lowerValue(value) {
    // Value {kind:enum, data:arraybuffer}
    if (value == null) return 0;
    const pointer = this.exports.__pin(this.exports.__new(8, 3));
    new Int32Array(this.memory.buffer)[(pointer + 0) >>> 2] = value.kind;
    new Uint32Array(this.memory.buffer)[(pointer + 4) >>> 2] =
      this.lowerBuffer(value.data) || this.notnull();
    this.exports.__unpin(pointer);
    return pointer;
  }
  liftKeyValue(pointer) {
    // Value {kind:enum, data:arraybuffer}
    // {key:string, value: Value}
    if (!pointer) return null;
    return {
      key: this.liftString(
        new Uint32Array(this.memory.buffer)[(pointer + 0) >>> 2]
      ),
      value: this.liftValue(
        new Uint32Array(this.memory.buffer)[(pointer + 4) >>> 2]
      ),
    };
  }
  lowerKeyValue(value) {
    // Value {kind:enum, data:arraybuffer}
    // {key:string, value: Value}
    if (value == null) return 0;
    const pointer = this.exports.__pin(this.exports.__new(8, 7));
    new Uint32Array(this.memory.buffer)[(pointer + 0) >>> 2] =
      this.lowerString(value.key) || this.__notnull();
    new Uint32Array(this.memory.buffer)[(pointer + 4) >>> 2] =
      this.lowerValue(value.value) || this.__notnull();
    this.exports.__unpin(pointer);
    return pointer;
  }
  liftKeyValueArray(value) {
    return this.liftArray(
      (pointer) =>
        this.liftKeyValue(
          new Uint32Array(this.memory.buffer)[pointer >>> 2]
        ),
      2,
      value >>> 0
    );
  }
}
