"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const buffer_1 = require("buffer");
;
const UINTSIZE = 3;
var IntOperationStyle;
(function (IntOperationStyle) {
    IntOperationStyle[IntOperationStyle["READ"] = 0] = "READ";
    IntOperationStyle[IntOperationStyle["WRITE"] = 1] = "WRITE";
})(IntOperationStyle || (IntOperationStyle = {}));
;
var IntEndienStyle;
(function (IntEndienStyle) {
    IntEndienStyle[IntEndienStyle["BIG"] = 0] = "BIG";
    IntEndienStyle[IntEndienStyle["LITTLE"] = 1] = "LITTLE";
})(IntEndienStyle || (IntEndienStyle = {}));
;
function bufferIntFunction(buffer, style, unsigned = true, byteLength = UINTSIZE, endien = IntEndienStyle.BIG) {
    const isRead = style === IntOperationStyle.READ, method = (isRead ? 'read' : 'write')
        + (unsigned ? 'U' : '')
        + 'Int'
        + (endien === IntEndienStyle.BIG ? 'BE' : 'LE'), buff = buffer, fn = buff[method];
    // console.log('-----------------------------------------------');
    // console.log('method      : %s', method);
    // console.log('byte length : %d', byteLength);
    // console.log('unsigned    : %j', unsigned);
    if (isRead)
        return (offset, noAssert) => {
            const result = fn.call(buffer, offset, byteLength, noAssert);
            // const slice  = buffer.slice(offset, offset + byteLength);
            // console.log('read [%d:%d] => %s => %d', offset, offset + byteLength, slice.toString('hex'), result);
            return result;
        };
    return (value, offset, noAssert) => {
        const result = fn.call(buffer, value, offset, byteLength, noAssert);
        // const slice  = buffer.slice(offset, offset + byteLength);
        // console.log('write [%d:%d] => %s | offset now (%d)', offset, offset + byteLength, slice.toString('hex'), result);
        return result;
    };
}
function bufferIntWrite(buffer, n, offset, unsigned, byteLength, noAssert, endien) {
    return bufferIntFunction(buffer, IntOperationStyle.WRITE, unsigned, byteLength, endien)
        .call(null, n, offset, noAssert);
}
function bufferIntRead(buffer, offset, unsigned, byteLength, noAssert, endien) {
    return bufferIntFunction(buffer, IntOperationStyle.READ, unsigned, byteLength, endien)
        .call(null, offset, noAssert);
}
/**
* Undoable class.
*/
class Undoable {
    /**
    * Constructor for this undoable class.
    */
    constructor(snapshot, changes = [], maxChanges = Infinity) {
        if (changes.length > maxChanges)
            throw new RangeError('Changes length exceeds max changes allowed setting.');
        this.snapshot = snapshot;
        this.changes = changes;
        this.maxChanges = maxChanges;
    }
    /**
    * Build a map of all unique references. This is to be used as a dictionary for exporting.
    */
    referenceMap() {
        const map = [], push = (a) => {
            if (map.indexOf(a) > -1)
                return;
            map.push(a);
        };
        push(this.snapshot); // push snapshot
        this.changes.forEach(change => {
            push(change.leftSide); // push left side
            push(change.rightSide); // push right side
        });
        return map;
    }
    /**
    * Number of changes that were made.
    */
    get changeCount() {
        return this.changes.length;
    }
    /**
    * Grabs the HEAD version of value.
    */
    get current() {
        const changeCount = this.changeCount;
        if (changeCount > 0) {
            let latest = this.changes[changeCount - 1];
            return latest.rightSide;
        }
        return this.snapshot;
    }
    /**
    * Update the current value defined
    */
    set current(v) {
        let current = this.current;
        if (current === v)
            return;
        const changeCount = (this.changeCount + 1), maxChanges = this.maxChanges;
        if (maxChanges >= 0 && changeCount > maxChanges)
            this.commit(changeCount - maxChanges);
        this.changes.push({ leftSide: current, rightSide: v });
        return;
    }
    /**
    * Undo any number of steps.
    */
    undo(steps = 1) {
        const changeCount = this.changeCount, toRemove = Math.max(0, Math.min(steps, changeCount));
        return this.changes.splice(changeCount - toRemove, toRemove);
    }
    /**
    * Apply all recent changes into a snapshot. Returns all changes committed.
    */
    commit(steps = this.changeCount) {
        steps = Math.max(0, Math.min(steps, this.changeCount));
        if (steps === 0)
            return [];
        this.snapshot = this.changes[steps - 1].rightSide;
        return this.changes.splice(0, steps);
    }
    /**
    * Exports the current state to a buffer object. Can be reimported
    * using Undoable.fromBuffer<T>(...);
    */
    toBuffer() {
        // 1) precompute required space, and encode references:
        let offset = 0;
        const snapshot = this.snapshot, changes = this.changes, changeCount = changes.length, refs = this.referenceMap(), refsCount = refs.length, refsEncoded = [], refsLength = [], writeInt = (n) => {
            offset = bufferIntWrite(buffer, n, offset, true);
            return offset;
        }, writeStr = (s, length, encoding = 'utf8') => {
            offset += buffer.write(s, offset, length, encoding);
            return offset;
        };
        let bufferSize = UINTSIZE; // initialize with size of refsCounts
        refs.forEach((ref, refIndex) => {
            const encoded = refsEncoded[refIndex] = JSON.stringify(ref), // stash encoded value
            length = refsLength[refIndex] = encoded.length; // stash length
            // increment by size definition of string, plus string length
            bufferSize += UINTSIZE + length;
        });
        bufferSize += 0
            + UINTSIZE // for ref# of snapshot
            + UINTSIZE // for changeCount
            + (changeCount * (UINTSIZE + UINTSIZE));
        // 1) check.
        let buffer = buffer_1.Buffer.allocUnsafe(bufferSize);
        // write number of references
        writeInt(refsCount);
        // 2) write the references to buffer.
        refs.forEach((ref, refIndex) => {
            const length = refsLength[refIndex];
            writeInt(length);
            writeStr(refsEncoded[refIndex], length, 'utf8');
        });
        // 2) check.
        // 3) write snapshot reference
        writeInt(refs.indexOf(snapshot));
        // 3) check.
        // 4) write the number of changes that are included
        writeInt(changeCount);
        // 4) check.
        // 5) write right & left references of all changes
        changes.forEach(change => {
            writeInt(refs.indexOf(change.rightSide));
            writeInt(refs.indexOf(change.leftSide));
        });
        // 5) check.
        return buffer;
    }
    /**
    * Load undoable from an exported buffer.
    */
    static fromBuffer(buf, reviver) {
        const bufferLength = buf.length;
        if (bufferLength < UINTSIZE)
            throw new RangeError('Buffer is empty or invalid.');
        let offset = 0;
        const safeSlice = (start, end) => {
            if (start > bufferLength)
                throw new RangeError(`Buffer start position (${start}) exceeds buffer length (${bufferLength}).`);
            else if (end > bufferLength)
                throw new RangeError(`Buffer end position (${end}) exceeds buffer length (${bufferLength}).`);
            else if (end < start)
                throw new RangeError(`Buffer end position (${end}) is before start position (${start}).`);
            return buf.slice(start, end);
        }, readUInt = () => {
            const pStart = offset, pEnd = offset + UINTSIZE, asUInt = bufferIntRead(safeSlice(pStart, pEnd), 0, true);
            offset = pEnd; // move offset to end
            return asUInt;
        }, readStr = (length, encoding = 'utf8') => {
            const pStart = offset, pEnd = offset + length, asStr = safeSlice(pStart, pEnd).toString(encoding);
            offset = pEnd; // move offset to end
            return asStr;
        };
        // 1) read the number of unique references
        const refsCount = readUInt();
        // 1) check.
        // 2) read and decode each reference into a new reference array
        const references = [];
        for (let i = 0; i < refsCount; i++)
            references[i] = JSON.parse(readStr(readUInt(), 'utf8'), reviver);
        // 2) check.
        // 3) read reference and link to snapshot
        const snapshot = references[readUInt()];
        // 3) check.
        // 4) read the number of changes that are included
        const changeCount = readUInt();
        // 4) check.
        // 5) read and link right & left references of all changes
        const changes = [];
        for (let i = 0; i < changeCount; i++) {
            let change = { rightSide: undefined, leftSide: undefined };
            change.rightSide = references[readUInt()];
            change.leftSide = references[readUInt()];
            changes.push(change);
        }
        // 5) check.
        return new Undoable(snapshot, changes);
    }
}
exports.Undoable = Undoable;
;
//# sourceMappingURL=undoable.js.map