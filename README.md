# bdir – Bidirectional Lookup Table Utility for TypeScript ↕️

[![npm](https://img.shields.io/npm/v/bdir?label=npm&color=0ea5e9)](https://www.npmjs.com/package/bdir)
[![downloads](https://img.shields.io/npm/dm/bdir?label=downloads&color=38bdf8)](https://www.npmjs.com/package/bdir)
[![types](https://img.shields.io/npm/types/bdir?label=types&color=22c55e)](https://www.npmjs.com/package/bdir)
[![bundle size](https://img.shields.io/bundlephobia/minzip/bdir?label=bundle&color=0f172a)](https://bundlephobia.com/package/bdir)
[![license](https://img.shields.io/npm/l/bdir?label=license&color=334155)](LICENSE)

`bdir` is a lightweight utility for building bi-directional lookup tables with first-class TypeScript support. It lets you declare the complete forward direction (keys → values) just once, and automatically keeps reverse lookups (values → labels), runtime validation helpers, and strongly-typed unions in sync.

The package ships ESM + CJS bundles, fully typed declarations, and zero dependencies.

## Installation

```bash
npm install bdir
# or
yarn add bdir
```

## Quick Start

```ts
import bdir from 'bdir';

const Roles = bdir({
  None: 0,
  User: 1,
  Admin: 2,
  0: '',
  2: 'Administrator',
});

Roles.Admin; // 2
Roles.Labels.Admin; // "Administrator"
Roles.render(1); // "User"
Roles.index('User'); // 1
Roles.reverseIndex(2); // "Admin"
```

Forward keys must map to numeric values, and every numeric value that needs a custom label can be declared again in the reverse direction (`{ 2: 'Administrator' }`). If a reverse entry is omitted, the forward key is used as the label.

## Why bdir?

- **Single source of truth** – define the forward direction once and bdir keeps every derived structure aligned.
- **Union-friendly** – forward keys and values are promoted to compile-time unions for safe discriminated logic.
- **Runtime helpers** – render, lookup, and validate dynamic inputs without reimplementing guard code.
- **Typed labels** – `.Labels` exposes readonly label maps tied to the forward keys.
- **Safety built-in** – duplicate value detection, numeric-only guards, label string validation, and reverse-key checks happen during initialization.

## API Overview

`bdir(param)` accepts a `Record<string | number, string | number>` with the constraints described above and returns an object with the following surface:

### Forward Accessors

- `Roles.None`, `Roles.User`, etc. → direct access to numeric values.
- `Roles.Labels.Key` → label for the key (falls back to the key text when no explicit reverse entry exists).

### Lookup Helpers

- `render(value: number): string` – label for a numeric value; empty string when missing.
- `renderByKey(key: string): string` – label derived from the key; empty string when missing.
- `index(key: string): number | -1` – numeric value for a key; `-1` when missing.
- `reverseIndex(value: number): string` – forward key for a value; empty string when missing.

### Collections

- `raw(): Record<string | number, string | number>` – shallow copy of the interleaved map.
- `keys(): Array<BdirKeys<typeof Roles>>` – all forward keys.
- `values(): Array<Bdir<typeof Roles>>` – all numeric values.
- `labels(): string[]` – label strings in insertion order.
- `entries(): Array<[key, value]>` – 2D array of forward pairs.
- `options(): Array<[value, label]>` – convenient tuples for select controls.

### Type Guards

- `isKey(arg: unknown): arg is BdirKeys<typeof Roles>`
- `isValue(arg: unknown): arg is Bdir<typeof Roles>`
- `isLabel(arg: unknown): arg is string`

All helpers use internal `Set` instances for O(1) checks.

## Utility Types

- `Bdir<T>` – given the return type of `bdir`, produces the union of forward numeric values (e.g. `0 | 1 | 2`).
- `BdirKeys<T>` – given the return type of `bdir`, produces the union of forward keys (e.g. `'None' | 'User' | 'Admin'`).

```ts
import { Bdir, BdirKeys } from 'bdir';

const Roles = bdir({
  None: 0,
  User: 1,
  Admin: 2,
  0: '',
  2: 'Administrator',
});

type RoleValues = Bdir<typeof Roles> // 0 | 1 | 2
type RoleKeys = BdirKeys<typeof Roles> // "None" | "User" | "Admin"
```

## Constraints & Validation Rules

- Forward keys **must** be non-numeric strings; forward values **must** be finite numbers.
- Reverse keys **must** be numeric (as string literals or numbers) and map to string labels.
- Each numeric value can appear only once in the forward direction; duplicates throw immediately.
- Every reverse key must already exist as a forward value; referencing unknown values throws.
- Because forward keys become object properties, avoid using keys reserved by the runtime (`Labels`, `render`, etc.).

Violations trigger descriptive runtime errors (see `test/index.test.ts` for coverage) so mistakes are caught during initialization.

## Testing

The repository uses [Vitest](https://vitest.dev/) for runtime verification. Run `npm test` to execute the suite, which exercises every helper and guard demonstrated above.

## License

MIT © [seanpmaxwell1](LICENSE)
