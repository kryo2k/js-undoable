import { Undoable } from '../undoable';
import * as assert from 'assert';

let undoableGood = new Undoable<any>(undefined, [
  { leftSide : undefined, rightSide : 'Test 1'},
  { leftSide : 'Test 1',  rightSide : 'Test 2'},
  { leftSide : 'Test 2',  rightSide : 'Test 3'},
  { leftSide : 'Test 3',  rightSide : 'Test 4'},
  { leftSide : 'Test 4',  rightSide : 'Test 5'},
  { leftSide : 'Test 5',  rightSide : 'Test 6'},
]);

assert.equal(undoableGood.current, 'Test 6');
assert.equal(undoableGood.integrityTest(), true);

let undoableBad = new Undoable<any>(undefined, [
  { leftSide : undefined, rightSide : 'Test 1'},
  { leftSide : 'Test 1',  rightSide : 'Test 2'},
  { leftSide : 'Test 2',  rightSide : 'Test 3'},
  { leftSide : 'Test X',  rightSide : 'Test 4'}, // <--- causes the break.
  { leftSide : 'Test 4',  rightSide : 'Test 5'},
  { leftSide : 'Test 5',  rightSide : 'Test 6'},
]);

assert.equal(undoableBad.current, 'Test 6');
assert.equal(undoableBad.integrityTest(), false);
