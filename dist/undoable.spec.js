"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const undoable_1 = require("./undoable");
const chai_1 = require("chai");
require("mocha");
describe('Undoable<string>', () => {
    const TEST_1 = 'test-1', TEST_2 = 'test-2', TEST_3 = 'test-3';
    it('should be able to hold a value', () => {
        let undoStr = new undoable_1.Undoable(TEST_1);
        chai_1.expect(undoStr.current).to.be.eq(TEST_1);
        chai_1.expect(undoStr.changeCount).to.be.eq(0);
    });
    it('should ignore duplicate changes', () => {
        let undoStr = new undoable_1.Undoable(TEST_1);
        chai_1.expect(undoStr.current).to.be.eq(TEST_1);
        chai_1.expect(undoStr.changeCount).to.be.eq(0);
        undoStr.current = TEST_1;
        chai_1.expect(undoStr.current).to.be.eq(TEST_1);
        chai_1.expect(undoStr.changeCount).to.be.eq(0);
    });
    it('should be able to record a new change', () => {
        let undoStr = new undoable_1.Undoable(TEST_1);
        undoStr.current = TEST_2;
        chai_1.expect(undoStr.current).to.be.eq(TEST_2);
        chai_1.expect(undoStr.changeCount).to.be.eq(1);
    });
    it('should be able to undo a single change', () => {
        let undoStr = new undoable_1.Undoable(TEST_1);
        undoStr.current = TEST_2;
        undoStr.undo(1);
        chai_1.expect(undoStr.current).to.be.eq(TEST_1);
        chai_1.expect(undoStr.changeCount).to.be.eq(0);
    });
    it('should be able to undo a two changes', () => {
        let undoStr = new undoable_1.Undoable(TEST_1);
        undoStr.current = TEST_2;
        undoStr.current = TEST_3;
        undoStr.undo(2);
        chai_1.expect(undoStr.current).to.be.eq(TEST_1);
        chai_1.expect(undoStr.changeCount).to.be.eq(0);
    });
    it('should respect max steps', () => {
        let undoStr = new undoable_1.Undoable(TEST_1, [], 1);
        undoStr.current = TEST_2;
        undoStr.current = TEST_3;
        chai_1.expect(undoStr.current).to.be.eq(TEST_3);
        chai_1.expect(undoStr.changeCount).to.be.eq(1);
    });
});
//# sourceMappingURL=undoable.spec.js.map