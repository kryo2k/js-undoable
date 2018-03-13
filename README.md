# js-undoable
A primitive class which lets you track changes made to it's typed value.

## Notes
This class uses JS native strict equality checking to prevent duplicate change entries. This means that assigning the same value (or class instance) in succession will not count as a change. When exported to a buffer, it tries to create dictionary of unique instances of changed values being tracked, in order to unpack with correct references later on. This project is still under development and might have breaking changes. Don't use in production environment until more testing can be done.

## Installation
```bash
npm install --save js-undoable
```

## Usage Examples

#### Including in Typescript:

```typescript
import { Undoable } from 'js-undoable';
```

#### Including in NodeJS:

```js
const { Undoable } = require('js-undoable');
```

#### An "undoable" number (in Typescript):

```typescript
import { Undoable } from 'js-undoable';

const undoNum = new Undoable<number>(25);

undoNum.current = 26;
undoNum.current = 27;
undoNum.current = 28;
undoNum.current = 55;

console.log(undoNum.changeCount === 4);  // true
console.log(undoNum.current     === 55); // true

undoNum.undo(2); // returns diffs undone

console.log(undoNum.changeCount === 2);  // true
console.log(undoNum.current     === 27); // true
```

#### Export and load from Buffer (in Typescript):

```typescript
import { Undoable } from 'js-undoable';

const undoNum = new Undoable<number>(25);

undoNum.current = 26;
undoNum.current = 27;
undoNum.current = 28;
undoNum.current = 55;

const exported = undoNum.toBuffer();
// exported now contains a Buffer object

const imported = Undoable.fromBuffer<number>(exported);
// imported is now almost identitical to undoNum
```

#### Commit first change to snapshot (in Typescript):

```typescript
import { Undoable } from 'js-undoable';

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
```

## Credits
_Author:_ Hans Doller <kryo2k@gmail.com
