"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CStringParser = exports.StructParser = exports.PaddingParser = exports.Padding = exports.IndexedStructParser = exports.ArrayParser = exports.Parser = void 0;
/**
 * Data type parser class
 *
 * All parsers inherit from this class
 */
class Parser {
    constructor(
    /**
     * Size of the data type in bytes.
     */
    size, 
    /**
     * Data type parsing logic.
     * @param buffer Buffer that stores the data type.
     */
    _parse, 
    /**
     * Data type serialization logic.
     * @param buffer Buffer to store the data type.
     * @param data Data to serialize.
     */
    _serialize) {
        this.size = size;
        this._parse = _parse;
        this._serialize = _serialize;
    }
    checkBuffer(buffer) {
        if (buffer.length < this.size) {
            throw new RangeError(`The buffer length (${buffer.length}) is smaller than the data type size (${this.size})`);
        }
    }
    /**
     * Parses the data type.
     * @param buffer Buffer that stores the data type.
     */
    parse(buffer) {
        this.checkBuffer(buffer);
        return this._parse(buffer.slice(0, this.size));
    }
    /**
     * Serializes the data type.
     * @param data Data to serialize.
     * @param buffer Buffer to store the data type, if not provided a new one is created.
     */
    serialize(data, buffer) {
        buffer = buffer || Buffer.alloc(this.size);
        this.checkBuffer(buffer);
        this._serialize(buffer.slice(0, this.size), data);
        return buffer;
    }
}
exports.Parser = Parser;
/** Char data type parser */
Parser.Char = new Parser(1, buffer => String.fromCharCode(buffer.readUInt8(0)), (buffer, data) => buffer.writeUInt8(data === null || data === void 0 ? void 0 : data.charCodeAt(0), 0));
/** Boolean data type parser */
Parser.Bool = new Parser(1, buffer => !!buffer.readUInt8(0), (buffer, data) => buffer.writeUInt8(+data, 0));
/** 8 bit signed integer data type parser */
Parser.Int8 = new Parser(1, buffer => buffer.readInt8(0), (buffer, data) => buffer.writeInt8(data, 0));
/** 8 bit unsigned integer data type parser */
Parser.UInt8 = new Parser(1, buffer => buffer.readUInt8(0), (buffer, data) => buffer.writeUInt8(data, 0));
/** 16 bit signed integer data type parser (little-endian) */
Parser.Int16LE = new Parser(2, buffer => buffer.readInt16LE(0), (buffer, data) => buffer.writeInt16LE(data, 0));
/** 16 bit signed integer data type parser (bit-endian) */
Parser.Int16BE = new Parser(2, buffer => buffer.readInt16BE(0), (buffer, data) => buffer.writeInt16BE(data, 0));
/** 16 bit unsigned integer data type parser (little-endian) */
Parser.UInt16LE = new Parser(2, buffer => buffer.readUInt16LE(0), (buffer, data) => buffer.writeUInt16LE(data, 0));
/** 16 bit unsigned integer data type parser (bit-endian) */
Parser.Uint16BE = new Parser(2, buffer => buffer.readUInt16BE(0), (buffer, data) => buffer.writeUInt16BE(data, 0));
/** 32 bit signed integer data type parser (little-endian) */
Parser.Int32LE = new Parser(4, buffer => buffer.readInt32LE(0), (buffer, data) => buffer.writeInt32LE(data, 0));
/** 32 bit signed integer data type parser (bit-endian) */
Parser.Int32BE = new Parser(4, buffer => buffer.readInt32BE(0), (buffer, data) => buffer.writeInt32BE(data, 0));
/** 32 bit unsigned integer data type parser (little-endian) */
Parser.UInt32LE = new Parser(4, buffer => buffer.readUInt32LE(0), (buffer, data) => buffer.writeUInt32LE(data, 0));
/** 32 bit unsigned integer data type parser (bit-endian) */
Parser.UInt32BE = new Parser(4, buffer => buffer.readUInt32BE(0), (buffer, data) => buffer.writeUInt32BE(data, 0));
/** 64 bit signed integer data type parser (little-endian) */
Parser.Int64LE = new Parser(8, buffer => buffer.readBigInt64LE(0), (buffer, data) => buffer.writeBigInt64LE(data, 0));
/** 64 bit signed integer data type parser (bit-endian) */
Parser.Int64BE = new Parser(8, buffer => buffer.readBigInt64BE(0), (buffer, data) => buffer.writeBigInt64BE(data, 0));
/** 64 bit unsigned integer data type parser (little-endian) */
Parser.UInt64LE = new Parser(8, buffer => buffer.readBigUInt64LE(0), (buffer, data) => buffer.writeBigUInt64LE(data, 0));
/** 64 bit unsigned integer data type parser (bit-endian) */
Parser.UInt64BE = new Parser(8, buffer => buffer.readBigUInt64BE(0), (buffer, data) => buffer.writeBigUInt64BE(data, 0));
/**
 * Array parser
 */
class ArrayParser extends Parser {
    constructor(
    /**
     * Number of elements in the array
     */
    count, 
    /**
     * Parser for all elements in the array
     */
    parser) {
        super(parser.size * count, buffer => {
            const data = [];
            for (let i = 0; i < count; i++) {
                data[i] = parser.parse(buffer.slice(parser.size * i));
            }
            return data;
        }, (buffer, data) => {
            for (let i = 0; i < count; i++) {
                parser.serialize(data === null || data === void 0 ? void 0 : data[i], buffer.slice(parser.size * i));
            }
        });
        this.count = count;
        this.parser = parser;
    }
}
exports.ArrayParser = ArrayParser;
class IndexedStructParser extends Parser {
    constructor(
    /**
     * Size of the data structure
     */
    size, 
    /**
     * Offset and parser for each element in the data structure
     */
    indexedStruct) {
        super(size, buffer => {
            const data = {};
            for (const key in indexedStruct) {
                const { offset, parser } = indexedStruct[key];
                data[key] = parser.parse(buffer.slice(offset));
            }
            return data;
        }, (buffer, data) => {
            for (const key in indexedStruct) {
                const { offset, parser } = indexedStruct[key];
                parser.serialize(data === null || data === void 0 ? void 0 : data[key], buffer.slice(offset));
            }
        });
        this.indexedStruct = indexedStruct;
    }
}
exports.IndexedStructParser = IndexedStructParser;
exports.Padding = Symbol();
/**
 * Structure padding
 */
class PaddingParser extends Parser {
    constructor(
    /**
     * Size of the padding
     */
    size) {
        super(size, () => exports.Padding, () => { });
    }
}
exports.PaddingParser = PaddingParser;
/**
 * Struct parser
 */
class StructParser extends IndexedStructParser {
    constructor(
    /**
     * Parser for each element in the data structure
     *
     * Offsets are calculated by the object propery order and the parser size
     */
    struct) {
        let offset = 0;
        const indexedStruct = {};
        for (const key in struct) {
            const parser = struct[key];
            if (!(parser instanceof PaddingParser)) {
                indexedStruct[key] = { offset: offset, parser: parser };
            }
            offset += parser.size;
        }
        super(offset, indexedStruct);
    }
}
exports.StructParser = StructParser;
/** Null-terminated string data type parser */
class CStringParser extends Parser {
    constructor(
    /**
     * Size of the string
     */
    size) {
        super(size, buffer => String.fromCharCode(...buffer).split('\x00')[0], (buffer, data) => {
            data = (data === null || data === void 0 ? void 0 : data.split('\x00')[0]) || '';
            for (let i = 0; i < size; i++) {
                buffer.writeUInt8(data.charCodeAt(i), i);
            }
        });
    }
}
exports.CStringParser = CStringParser;
