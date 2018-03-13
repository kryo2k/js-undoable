"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const undoable_1 = require("../undoable");
let undoNum = new undoable_1.Undoable(25);
undoNum.current = 26;
undoNum.current = 27;
undoNum.current = 28;
undoNum.current = 55;
console.log(undoNum.changeCount === 4);
console.log(undoNum.current === 55);
undoNum.undo(2);
console.log(undoNum.changeCount === 2);
console.log(undoNum.current === 27);
//# sourceMappingURL=simple.js.map