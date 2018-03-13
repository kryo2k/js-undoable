import { Buffer } from 'buffer';

export interface IUndoableChange <T=any> {
  leftSide  : T;
  rightSide : T;
};

const UINTSIZE = 3;

enum IntOperationStyle {
  READ,
  WRITE
};

enum IntEndienStyle {
  BIG,
  LITTLE
};

type IntByteLength = 1|2|3|4|5|6;

function bufferIntFunction(
  buffer: Buffer,
  style : IntOperationStyle,
  unsigned: boolean = true,
  byteLength : IntByteLength = UINTSIZE,
  endien : IntEndienStyle = IntEndienStyle.BIG
) : Function {

  const
  isRead = style === IntOperationStyle.READ,
  method : string = (isRead ? 'read' : 'write')
    + (unsigned ? 'U' : '')
    + 'Int'
    + (endien === IntEndienStyle.BIG ? 'BE' : 'LE'),
  buff = buffer as any,
  fn = buff[method] as Function;

  // console.log('-----------------------------------------------');
  // console.log('method      : %s', method);
  // console.log('byte length : %d', byteLength);
  // console.log('unsigned    : %j', unsigned);

  if(isRead) return (offset : number, noAssert ?: boolean) : number => {
    const result = fn.call(buffer, offset, byteLength, noAssert);
    // const slice  = buffer.slice(offset, offset + byteLength);
    // console.log('read [%d:%d] => %s => %d', offset, offset + byteLength, slice.toString('hex'), result);
    return result;
  };

  return (value : number, offset : number, noAssert ?: boolean) : number => {
    const result = fn.call(buffer, value, offset, byteLength, noAssert);
    // const slice  = buffer.slice(offset, offset + byteLength);
    // console.log('write [%d:%d] => %s | offset now (%d)', offset, offset + byteLength, slice.toString('hex'), result);
    return result;
  };
}

function bufferIntWrite(buffer: Buffer, n : number, offset : number, unsigned ?: boolean, byteLength ?: IntByteLength, noAssert ?: boolean, endien ?: IntEndienStyle) : number {
  return bufferIntFunction(buffer, IntOperationStyle.WRITE, unsigned, byteLength, endien)
    .call(null, n, offset, noAssert);
}

function bufferIntRead(buffer: Buffer, offset : number, unsigned ?: boolean, byteLength ?: IntByteLength, noAssert ?: boolean, endien ?: IntEndienStyle) : number {
  return bufferIntFunction(buffer, IntOperationStyle.READ, unsigned, byteLength, endien)
    .call(null, offset, noAssert);
}

/**
* Undoable class.
*/
export class Undoable <T=any> {

  private snapshot : T;
  private changes  : IUndoableChange<T>[];

  maxChanges : number;

  /**
  * Constructor for this undoable class.
  */
  constructor (snapshot: T, changes : IUndoableChange<T>[] = [], maxChanges : number = Infinity) {
    this.snapshot   = snapshot;
    this.changes    = changes;
    this.maxChanges = maxChanges;
  }

  /**
  * Build a map of all unique references. This is to be used as a dictionary for exporting.
  */
  protected referenceMap () : T[] {
    const
    map  : T[] = [],
    push = (a : T) : void => {
      if(map.indexOf(a) > -1)
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
  get changeCount () : number {
    return this.changes.length;
  }

  /**
  * Grabs the HEAD version of value.
  */
  get current() : T {
    const changeCount = this.changeCount;

    if(changeCount > 0) {
      let latest = this.changes[changeCount - 1];
      return latest.rightSide;
    }

    return this.snapshot;
  }

  /**
  * Update the current value defined
  */
  set current(v : T) {

    let current = this.current;

    if(current === v)
      return;

    const
    changeCount : number = (this.changeCount + 1),
    maxChanges  : number = this.maxChanges;

    if(maxChanges >= 0 && changeCount > maxChanges) // auto commmit difference in steps
      this.commit(changeCount - maxChanges)

    this.changes.push({ leftSide: current, rightSide: v });

    return;
  }

  /**
  * Undo any number of steps.
  */
  undo(steps : number = 1) : IUndoableChange[] {

    const
    changeCount = this.changeCount,
    toRemove = Math.max(0, Math.min(steps, changeCount));

    return this.changes.splice(changeCount - toRemove, toRemove);
  }

  /**
  * Apply all recent changes into a snapshot. Returns all changes committed.
  */
  commit(steps : number = this.changeCount) : IUndoableChange<T>[] {
    steps = Math.max(0, Math.min(steps, this.changeCount));
    if(steps === 0) return [];
    this.snapshot = this.changes[steps - 1].rightSide;
    return this.changes.splice(0, steps);
  }

  /**
  * Exports the current state to a buffer object. Can be reimported
  * using Undoable.fromBuffer<T>(...);
  */
  toBuffer() : Buffer {

    // 1) precompute required space, and encode references:
    let
    offset = 0;

    const
    snapshot    = this.snapshot,
    changes     = this.changes,
    changeCount = changes.length,
    refs        = this.referenceMap(),
    refsCount   = refs.length,
    refsEncoded : string[] = [],
    refsLength  : number[] = [],
    writeInt = (n : number) : number => {
      offset = bufferIntWrite(buffer, n, offset, true);
      return offset;
    },
    writeStr = (s : string, length ?: number, encoding : string = 'utf8') : number => {
      offset += buffer.write(s, offset, length, encoding);
      return offset;
    };

    let
    bufferSize : number = UINTSIZE; // initialize with size of refsCounts

    refs.forEach((ref, refIndex) => { // populate the above with a single iteration over refs:
      const
      encoded = refsEncoded[refIndex] = JSON.stringify(ref), // stash encoded value
      length  = refsLength[refIndex]  = encoded.length; // stash length

      // increment by size definition of string, plus string length
      bufferSize += UINTSIZE + length;
    });

    bufferSize += 0
      + UINTSIZE // for ref# of snapshot
      + UINTSIZE // for changeCount
      + (changeCount * (UINTSIZE + UINTSIZE));
    // 1) check.

    let
    buffer = Buffer.allocUnsafe(bufferSize);

    // write number of references
    writeInt(refsCount);

    // 2) write the references to buffer.
    refs.forEach((ref, refIndex) => { // write from prepared data from above
      const length  = refsLength[refIndex];
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
  static fromBuffer <T=any>(buf: Buffer) : Undoable<T> {
    const bufferLength = buf.length;
    if(bufferLength < UINTSIZE)
      throw new RangeError('Buffer is empty or invalid.');

    let
    offset : number = 0;

    const
    safeSlice = (start : number, end : number) : Buffer => {
      if(start > bufferLength)
        throw new RangeError(`Buffer start position (${start}) exceeds buffer length (${bufferLength}).`);
      else if(end > bufferLength)
        throw new RangeError(`Buffer end position (${end}) exceeds buffer length (${bufferLength}).`);
      else if(end < start)
        throw new RangeError(`Buffer end position (${end}) is before start position (${start}).`);
      return buf.slice(start, end);
    },
    readUInt = () : number => {
      const
      pStart = offset, pEnd = offset + UINTSIZE,
      asUInt = bufferIntRead(safeSlice(pStart, pEnd), 0, true);

      offset = pEnd; // move offset to end
      return asUInt;
    },
    readStr = (length : number, encoding : string = 'utf8') : string => {
      const
      pStart = offset, pEnd = offset + length,
      asStr  = safeSlice(pStart, pEnd).toString(encoding);
      offset = pEnd; // move offset to end
      return asStr;
    };

    // 1) read the number of unique references
    const refsCount = readUInt();
    // 1) check.

    // 2) read and decode each reference into a new reference array
    const references : { [key: number] : T } = [];
    for(let i=0; i < refsCount; i++)
      references[i] = JSON.parse(readStr(readUInt(), 'utf8')) as T;
    // 2) check.

    // 3) read reference and link to snapshot
    const snapshot = references[readUInt()];
    // 3) check.

    // 4) read the number of changes that are included
    const changeCount = readUInt();
    // 4) check.

    // 5) read and link right & left references of all changes
    const changes  : IUndoableChange<T>[] = [];
    for(let i=0; i < changeCount; i++) {
      let change : any = { rightSide: undefined, leftSide: undefined };

      change.rightSide = references[readUInt()];
      change.leftSide  = references[readUInt()];

      changes.push(change as IUndoableChange<T>);
    }
    // 5) check.

    return new Undoable<T>(snapshot, changes);
  }
};
