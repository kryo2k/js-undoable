import { Undoable } from '../undoable';

const undoNum = new Undoable<number>(25);

undoNum.current = 26;
undoNum.current = 27;
undoNum.current = 28;
undoNum.current = 55;

const exported = undoNum.toBuffer();
// exported now contains a Buffer object

console.log(exported.toString('hex'));

const imported = Undoable.fromBuffer<number>(exported);
// imported is now almost identitical to undoNum

console.log(imported);
