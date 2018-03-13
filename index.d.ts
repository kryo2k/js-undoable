/// <reference types="node" />
export interface IUndoableChange<T = any> {
    leftSide: T;
    rightSide: T;
}
/**
* Undoable class.
*/
export declare class Undoable<T = any> {
    private snapshot;
    private changes;
    /**
    * Constructor for this undoable class.
    */
    constructor(snapshot: T, changes?: IUndoableChange<T>[]);
    /**
    * Build a map of all unique references. This is to be used as a dictionary for exporting.
    */
    protected referenceMap(): T[];
    /**
    * Number of changes that were made.
    */
    readonly changeCount: number;
    /**
    * Grabs the HEAD version of value.
    */
    /**
    * Update the current value defined
    */
    current: T;
    /**
    * Undo any number of steps.
    */
    undo(steps?: number): IUndoableChange[];
    /**
    * Apply all recent changes into a snapshot. Returns all changes committed.
    */
    commit(): IUndoableChange<T>[];
    /**
    * Exports the current state to a buffer object. Can be reimported
    * using Undoable.fromBuffer<T>(...);
    */
    toBuffer(): Buffer;
    /**
    * Load undoable from an exported buffer.
    */
    static fromBuffer<T = any>(buf: Buffer): Undoable<T>;
}
