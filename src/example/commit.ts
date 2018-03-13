import { Undoable } from '../undoable';

const undoNum = new Undoable<number>(25);

undoNum.current = 26;
undoNum.current = 27;

// replace snapshot with "26" change, "25" is gone forever.
undoNum.commit(1);

console.log(undoNum.changeCount === 1);  // true
console.log(undoNum.current     === 27); // true

undoNum.undo(1);

console.log(undoNum.changeCount === 0);  // true
console.log(undoNum.current     === 26); // true
