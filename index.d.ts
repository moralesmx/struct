/// <reference types="node" />
/**
 * Data type parser class
 *
 * All parsers inherit from this class
 */
export declare class Parser<T> {
    /**
     * Size of the data type in bytes.
     */
    readonly size: number;
    /**
     * Data type parsing logic.
     * @param buffer Buffer that stores the data type.
     */
    private readonly _parse;
    /**
     * Data type serialization logic.
     * @param buffer Buffer to store the data type.
     * @param data Data to serialize.
     */
    private readonly _serialize;
    /**
     * Use this property only to get the type of the parser
     */
    readonly type: T;
    constructor(
    /**
     * Size of the data type in bytes.
     */
    size: number, 
    /**
     * Data type parsing logic.
     * @param buffer Buffer that stores the data type.
     */
    _parse: (buffer: Buffer) => T, 
    /**
     * Data type serialization logic.
     * @param buffer Buffer to store the data type.
     * @param data Data to serialize.
     */
    _serialize: (buffer: Buffer, data?: T) => void);
    private checkBuffer;
    /**
     * Parses the data type.
     * @param buffer Buffer that stores the data type.
     */
    parse(buffer: Buffer): T;
    /**
     * Serializes the data type.
     * @param data Data to serialize.
     * @param buffer Buffer to store the data type, if not provided a new one is created.
     */
    serialize(data?: T, buffer?: Buffer): Buffer;
    /** Char data type parser */
    static readonly Char: Parser<string>;
    /** Boolean data type parser */
    static readonly Bool: Parser<boolean>;
    /** 8 bit signed integer data type parser */
    static readonly Int8: Parser<number>;
    /** 8 bit unsigned integer data type parser */
    static readonly UInt8: Parser<number>;
    /** 16 bit signed integer data type parser (little-endian) */
    static readonly Int16LE: Parser<number>;
    /** 16 bit signed integer data type parser (bit-endian) */
    static readonly Int16BE: Parser<number>;
    /** 16 bit unsigned integer data type parser (little-endian) */
    static readonly UInt16LE: Parser<number>;
    /** 16 bit unsigned integer data type parser (bit-endian) */
    static readonly Uint16BE: Parser<number>;
    /** 32 bit signed integer data type parser (little-endian) */
    static readonly Int32LE: Parser<number>;
    /** 32 bit signed integer data type parser (bit-endian) */
    static readonly Int32BE: Parser<number>;
    /** 32 bit unsigned integer data type parser (little-endian) */
    static readonly UInt32LE: Parser<number>;
    /** 32 bit unsigned integer data type parser (bit-endian) */
    static readonly UInt32BE: Parser<number>;
    /** 64 bit signed integer data type parser (little-endian) */
    static readonly Int64LE: Parser<bigint>;
    /** 64 bit signed integer data type parser (bit-endian) */
    static readonly Int64BE: Parser<bigint>;
    /** 64 bit unsigned integer data type parser (little-endian) */
    static readonly UInt64LE: Parser<bigint>;
    /** 64 bit unsigned integer data type parser (bit-endian) */
    static readonly UInt64BE: Parser<bigint>;
}
/**
 * Array parser
 */
export declare class ArrayParser<T> extends Parser<T[]> {
    /**
     * Number of elements in the array
     */
    readonly count: number;
    /**
     * Parser for all elements in the array
     */
    readonly parser: Parser<T>;
    constructor(
    /**
     * Number of elements in the array
     */
    count: number, 
    /**
     * Parser for all elements in the array
     */
    parser: Parser<T>);
}
declare type IndexedStruct<T> = {
    [K in keyof T]: {
        offset: number;
        parser: Parser<T[K]>;
    };
};
export declare class IndexedStructParser<T> extends Parser<T> {
    /**
     * Offset and parser for each element in the data structure
     */
    readonly indexedStruct: IndexedStruct<T>;
    constructor(
    /**
     * Size of the data structure
     */
    size: number, 
    /**
     * Offset and parser for each element in the data structure
     */
    indexedStruct: IndexedStruct<T>);
}
export declare const Padding: unique symbol;
export declare type Padding = typeof Padding;
/**
 * Structure padding
 */
export declare class PaddingParser extends Parser<Padding> {
    constructor(
    /**
     * Size of the padding
     */
    size: number);
}
/**
 * Struct parser
 */
export declare class StructParser<T> extends IndexedStructParser<{
    [K in keyof T as T[K] extends Padding ? never : K]: T[K];
}> {
    constructor(
    /**
     * Parser for each element in the data structure
     *
     * Offsets are calculated by the object propery order and the parser size
     */
    struct: {
        [K in keyof T]: Parser<T[K]>;
    });
}
/** Null-terminated string data type parser */
export declare class CStringParser extends Parser<string> {
    constructor(
    /**
     * Size of the string
     */
    size: number);
}
export {};
