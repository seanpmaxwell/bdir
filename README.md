# bdir 

[![npm](https://img.shields.io/npm/v/bdir?label=npm&color=0ea5e9)](https://www.npmjs.com/package/bdir)
[![downloads](https://img.shields.io/npm/dm/bdir?label=downloads&color=38bdf8)](https://www.npmjs.com/package/bdir)
[![types](https://img.shields.io/npm/types/bdir?label=types&color=22c55e)](https://www.npmjs.com/package/bdir)
[![bundle size](https://img.shields.io/bundlephobia/minzip/bdir?label=bundle&color=0f172a)](https://bundlephobia.com/package/bdir)
[![license](https://img.shields.io/npm/l/bdir?label=license&color=334155)](LICENSE)

> A comprehensive collection of TypeScript validator functions and utilities for common compile and runtime checks.


- Example bi-directional object

```ts
const Roles = bdir({
  None: 0,
  User: 1,
  Admin: 2,
  0: '',
  // [1: 'User'] will be generated since not specified
  2: 'Administrator',
});
```

- Setup
  - Forward direction is for listing values, reverse direction is for associating a label with a value.
  - The full foward direction must be specified but reverse entries not specified will automatically use the key as the label. You only need to specify a reverse entry if you want to use something other than the key for the label. 


- Features
  - Statically accessing labels/values
    - Values can be directly accessed on the output using forward keys: `Roles.None --> 0`
    - Labels can be accessed using the `.Labels` property + a foward direction key: `Roles.Labels.Admin --> "Administrator"`

  - Handling dynamic values/keys/labels
    - `.render(arg: number): string`
      - Render a label when the value is unknown. If the value is not found returns an empty string.
    - `.index(arg: string): number`
      - Lookup up a value for a uknown key. If the value is not found it returns `-1`.

    // Need to implement
    - `.reverseIndex(arg: number): string`
      - Lookup up a key for an unknown value. If the key is not found it returns an empty string.
    - `.indexRender(arg: string): string`
      - Lookup up a label for an unknown key. If the key is not found it returns an empty string.
    - Note: label uniqueness is not enforced so we cannot use them to lookup keys/values

  - Utility types:
    - Because the entire forward direction must be specified we can create union-types for the keys and values. Labels can be dynamically generated, are not unique, and therefore can't have union types. 
    - `Bdir<T>` Union of all values: i.e. `0 | 1 | 2`
    - `BdirKeys<T>` Union of all keys: i.e. `("None" | "User" | "Admin")`

  - Validators
    - `.isKey(arg: unknown): arg is BdirKeys<T> (i.e. 'None' | 'User' | 'Admin')`
    - `.isValue(arg: unknown): arg is BdirValues<T> (i.e. 0 | 1 | 2)`
    - `.isLabel(arg: unknown): arg is string`

  - Arrays that can be fetched
    - `.entries() => [[key, value]]`
     - Returns the forward direction in a 2D array format.
    - `.options() => [[label, value]]`
      - Returns a 2D array of the labels with their values. This can be really useful when rendering dropdown selectors in the front end.
    - `.keys() => BdirKeys<T>[]` 
      - Returns an array of all the keys: i.e [type: `('None' | 'User' | 'Admin')[]`, value: `["None", "User", "Admin"]`]
    - `.values() => BdirValues<T>[]`
      - Returns an array of all the values: i.e. [type: `(0 | 1 | 1)[]`, value: `[0, 1, 2]`]
    - `.labels() => string[]`
      - Returns an array of all the labels: i.e. [type: `string[]`, value: `["", "User", "Administrator"]`]

  - Other
    - Runtime validation checks to make sure your bi-directional object has been setup correctly (i.e. no duplicate values)

- Restrictions
  - Cannot use a value for a key in the reverse direction that was not specified in the forward direction.
  - library does not work for bi-directional string objects, only numerical ones
  - Your object cannot use any of the keys reserved for using the final bdir object (i.e. "Labels" or "render")
