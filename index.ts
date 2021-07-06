
/**
 * Data type parser class
 * 
 * All parsers inherit from this class
 */
export class Parser<T> {

  /**
   * Use this property only to get the type of the parser
   */
  public readonly type!: T;

  constructor(
    /**
     * Size of the data type in bytes.
     */
    public readonly size: number,
    /**
     * Data type parsing logic.
     * @param buffer Buffer that stores the data type.
     */
    private readonly _parse: (buffer: Buffer) => T,
    /**
     * Data type serialization logic.
     * @param buffer Buffer to store the data type.
     * @param data Data to serialize.
     */
    private readonly _serialize: (buffer: Buffer, data?: T) => void,
  ) { }

  private checkBuffer(buffer: Buffer): void {
    if (buffer.length < this.size) {
      throw new RangeError(`The buffer length (${buffer.length}) is smaller than the data type size (${this.size})`);
    }
  }

  /**
   * Parses the data type.
   * @param buffer Buffer that stores the data type.
   */
  public parse(buffer: Buffer): T {
    this.checkBuffer(buffer);
    return this._parse(buffer.slice(0, this.size));
  }

  /**
   * Serializes the data type.
   * @param data Data to serialize.
   * @param buffer Buffer to store the data type, if not provided a new one is created.
   */
  public serialize(data?: T, buffer?: Buffer): Buffer {
    buffer = buffer || Buffer.alloc(this.size);
    this.checkBuffer(buffer);
    this._serialize(buffer.slice(0, this.size), data);
    return buffer;
  }

  /** Char data type parser */
  static readonly Char = new Parser(1, buffer => String.fromCharCode(buffer.readUInt8(0)), (buffer, data) => buffer.writeUInt8(data?.charCodeAt(0)!, 0));

  /** Boolean data type parser */
  static readonly Bool = new Parser(1, buffer => !!buffer.readUInt8(0), (buffer, data) => buffer.writeUInt8(+data!, 0));

  /** 8 bit signed integer data type parser */
  static readonly Int8 = new Parser(1, buffer => buffer.readInt8(0), (buffer, data) => buffer.writeInt8(data!, 0));
  /** 8 bit unsigned integer data type parser */
  static readonly UInt8 = new Parser(1, buffer => buffer.readUInt8(0), (buffer, data) => buffer.writeUInt8(data!, 0));

  /** 16 bit signed integer data type parser (little-endian) */
  static readonly Int16LE = new Parser(2, buffer => buffer.readInt16LE(0), (buffer, data) => buffer.writeInt16LE(data!, 0));
  /** 16 bit signed integer data type parser (bit-endian) */
  static readonly Int16BE = new Parser(2, buffer => buffer.readInt16BE(0), (buffer, data) => buffer.writeInt16BE(data!, 0));
  /** 16 bit unsigned integer data type parser (little-endian) */
  static readonly UInt16LE = new Parser(2, buffer => buffer.readUInt16LE(0), (buffer, data) => buffer.writeUInt16LE(data!, 0));
  /** 16 bit unsigned integer data type parser (bit-endian) */
  static readonly Uint16BE = new Parser(2, buffer => buffer.readUInt16BE(0), (buffer, data) => buffer.writeUInt16BE(data!, 0));

  /** 32 bit signed integer data type parser (little-endian) */
  static readonly Int32LE = new Parser(4, buffer => buffer.readInt32LE(0), (buffer, data) => buffer.writeInt32LE(data!, 0));
  /** 32 bit signed integer data type parser (bit-endian) */
  static readonly Int32BE = new Parser(4, buffer => buffer.readInt32BE(0), (buffer, data) => buffer.writeInt32BE(data!, 0));
  /** 32 bit unsigned integer data type parser (little-endian) */
  static readonly UInt32LE = new Parser(4, buffer => buffer.readUInt32LE(0), (buffer, data) => buffer.writeUInt32LE(data!, 0));
  /** 32 bit unsigned integer data type parser (bit-endian) */
  static readonly UInt32BE = new Parser(4, buffer => buffer.readUInt32BE(0), (buffer, data) => buffer.writeUInt32BE(data!, 0));

  /** 64 bit signed integer data type parser (little-endian) */
  static readonly Int64LE = new Parser(8, buffer => buffer.readBigInt64LE(0), (buffer, data) => buffer.writeBigInt64LE(data!, 0));
  /** 64 bit signed integer data type parser (bit-endian) */
  static readonly Int64BE = new Parser(8, buffer => buffer.readBigInt64BE(0), (buffer, data) => buffer.writeBigInt64BE(data!, 0));
  /** 64 bit unsigned integer data type parser (little-endian) */
  static readonly UInt64LE = new Parser(8, buffer => buffer.readBigUInt64LE(0), (buffer, data) => buffer.writeBigUInt64LE(data!, 0));
  /** 64 bit unsigned integer data type parser (bit-endian) */
  static readonly UInt64BE = new Parser(8, buffer => buffer.readBigUInt64BE(0), (buffer, data) => buffer.writeBigUInt64BE(data!, 0));

}

/**
 * Array parser
 */
export class ArrayParser<T> extends Parser<T[]> {

  constructor(
    /**
     * Number of elements in the array
     */
    public readonly count: number,
    /**
     * Parser for all elements in the array
     */
    public readonly parser: Parser<T>,
  ) {
    super(
      parser.size * count,
      buffer => {
        const data: T[] = [];
        for (let i = 0; i < count; i++) {
          data[i] = parser.parse(buffer.slice(parser.size * i));
        }
        return data;
      },
      (buffer, data) => {
        for (let i = 0; i < count; i++) {
          parser.serialize(data?.[i], buffer.slice(parser.size * i));
        }
      }
    );
  }

}

type IndexedStruct<T> = {
  [K in keyof T]: {
    offset: number,
    parser: Parser<T[K]>;
  };
};

export class IndexedStructParser<T> extends Parser<T>{

  constructor(
    /**
     * Size of the data structure
     */
    size: number,
    /**
     * Offset and parser for each element in the data structure
     */
    public readonly indexedStruct: IndexedStruct<T>,
  ) {
    super(
      size,
      buffer => {
        const data = {} as T;
        for (const key in indexedStruct) {
          const { offset, parser } = indexedStruct[key];
          data[key] = parser.parse(buffer.slice(offset));
        }
        return data;
      },
      (buffer, data) => {
        for (const key in indexedStruct) {
          const { offset, parser } = indexedStruct[key];
          parser.serialize(data?.[key], buffer.slice(offset));
        }
      }
    );
  }

}

export const Padding = Symbol();
export type Padding = typeof Padding;

/** 
 * Structure padding
 */
export class PaddingParser extends Parser<Padding> {

  constructor(
    /**
     * Size of the padding
     */
    size: number
  ) {
    super(size, () => Padding, () => { });
  }

}

/**
 * Struct parser
 */
export class StructParser<T> extends IndexedStructParser<{ [K in keyof T as T[K] extends Padding ? never : K]: T[K] }> {

  constructor(
    /**
     * Parser for each element in the data structure
     * 
     * Offsets are calculated by the object propery order and the parser size
     */
    struct: { [K in keyof T]: Parser<T[K]> },
  ) {
    let offset = 0;
    const indexedStruct = {} as IndexedStruct<T>;
    for (const key in struct) {
      const parser = struct[key];
      if (!(parser instanceof PaddingParser)) {
        indexedStruct[key] = { offset: offset, parser: parser };
      }
      offset += parser.size;
    }
    super(offset, indexedStruct as any);
  }

}

/** Null-terminated string data type parser */
export class CStringParser extends Parser<string> {

  constructor(
    /**
     * Size of the string
     */
    size: number
  ) {
    super(
      size,
      buffer => String.fromCharCode(...buffer).split('\x00')[0],
      (buffer, data) => {
        data = data?.split('\x00')[0] || '';
        for (let i = 0; i < size; i++) {
          buffer.writeUInt8(data.charCodeAt(i), i);
        }
      }
    );
  }

}
