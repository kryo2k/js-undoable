"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const undoable_1 = require("../undoable");
const undoNum = new undoable_1.Undoable(25);
undoNum.current = 26;
undoNum.current = 27;
undoNum.current = 28;
undoNum.current = 55;
const exported = undoNum.toBuffer();
// exported now contains a Buffer object
console.log(exported.toString('hex'));
const imported = undoable_1.Undoable.fromBuffer(exported);
// imported is now almost identitical to undoNum
console.log(imported);
//# sourceMappingURL=buffer.js.map