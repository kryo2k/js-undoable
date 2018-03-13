import { Undoable } from 'js-undoable';

let undoNum = new Undoable<number>(25);
undoNum.current = 26;
undoNum.current = 27;
undoNum.current = 28;
undoNum.current = 55;

console.log(undoNum.changeCount === 4);
console.log(undoNum.current     === 55);

undoNum.undo(2);

console.log(undoNum.changeCount === 2);
console.log(undoNum.current     === 27);
