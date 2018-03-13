"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const undoable_1 = require("../undoable");
const assert = require("assert");
let undoableGood = new undoable_1.Undoable(undefined, [
    { leftSide: undefined, rightSide: 'Test 1' },
    { leftSide: 'Test 1', rightSide: 'Test 2' },
    { leftSide: 'Test 2', rightSide: 'Test 3' },
    { leftSide: 'Test 3', rightSide: 'Test 4' },
    { leftSide: 'Test 4', rightSide: 'Test 5' },
    { leftSide: 'Test 5', rightSide: 'Test 6' },
]);
assert.equal(undoableGood.current, 'Test 6');
assert.equal(undoableGood.integrityTest(), true);
let undoableBad = new undoable_1.Undoable(undefined, [
    { leftSide: undefined, rightSide: 'Test 1' },
    { leftSide: 'Test 1', rightSide: 'Test 2' },
    { leftSide: 'Test 2', rightSide: 'Test 3' },
    { leftSide: 'Test X', rightSide: 'Test 4' },
    { leftSide: 'Test 4', rightSide: 'Test 5' },
    { leftSide: 'Test 5', rightSide: 'Test 6' },
]);
assert.equal(undoableBad.current, 'Test 6');
assert.equal(undoableBad.integrityTest(), false);
//# sourceMappingURL=integrity-test.js.map