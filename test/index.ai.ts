import { describe, expect, test } from 'vitest';

import bdir, { type Bdir, type BdirKeys } from '../src';

const createRoles = () =>
  bdir({
    None: 0,
    User: 1,
    Admin: 2,
    0: '',
    2: 'Administrator',
  });

type RolesInstance = ReturnType<typeof createRoles>;

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;
type Expect<T extends true> = T;

type _RoleValueUnion = Expect<Equal<Bdir<RolesInstance>, 0 | 1 | 2>>;
type _RoleKeyUnion = Expect<
  Equal<BdirKeys<RolesInstance>, 'None' | 'User' | 'Admin'>
>;

describe('bdir runtime behavior', () => {
  test('exposes forward values and labels', () => {
    const Roles = createRoles();
    expect(Roles.None).toBe(0);
    expect(Roles.User).toBe(1);
    expect(Roles.Admin).toBe(2);
    expect(Roles.Labels.None).toBe('');
    expect(Roles.Labels.User).toBe('User');
    expect(Roles.Labels.Admin).toBe('Administrator');
  });

  test('lookup helpers handle happy and unhappy paths', () => {
    const Roles = createRoles();
    expect(Roles.render(0)).toBe('');
    expect(Roles.render(1)).toBe('User');
    expect(Roles.render(2)).toBe('Administrator');
    expect(Roles.render(99)).toBe('');
    expect(Roles.render(Number.NaN)).toBe('');

    expect(Roles.index('None')).toBe(0);
    expect(Roles.index('User')).toBe(1);
    expect(Roles.index('missing')).toBe(-1);

    expect(Roles.renderByKey('Admin')).toBe('Administrator');
    expect(Roles.renderByKey('ADMIN')).toBe('');

    expect(Roles.reverseIndex(2)).toBe('Admin');
    expect(Roles.reverseIndex(1000)).toBe('');
    expect(Roles.reverseIndex(Number.NaN)).toBe('');
  });

  test('collection getters return defensive copies', () => {
    const Roles = createRoles();

    const keys = Roles.keys();
    const values = Roles.values();
    const labels = Roles.labels();

    expect(keys).toStrictEqual(['None', 'User', 'Admin']);
    expect(values).toStrictEqual([0, 1, 2]);
    expect(labels).toStrictEqual(['', 'User', 'Administrator']);

    keys.push('Hacker' as never);
    values.push(999 as never);
    labels.push('Mutated');

    expect(Roles.keys()).toStrictEqual(['None', 'User', 'Admin']);
    expect(Roles.values()).toStrictEqual([0, 1, 2]);
    expect(Roles.labels()).toStrictEqual(['', 'User', 'Administrator']);

    const nextKeys = Roles.keys();
    const nextValues = Roles.values();
    const nextLabels = Roles.labels();

    expect(nextKeys).not.toBe(keys);
    expect(nextValues).not.toBe(values);
    expect(nextLabels).not.toBe(labels);
  });

  test('2D collections are deep-cloned and ordered', () => {
    const Roles = createRoles();

    const entries = Roles.entries();
    const options = Roles.options();

    expect(entries).toStrictEqual([
      ['None', 0],
      ['User', 1],
      ['Admin', 2],
    ]);
    expect(options).toStrictEqual([
      [0, ''],
      [1, 'User'],
      [2, 'Administrator'],
    ]);

    (entries as Array<[string, number]>)[0][0] = 'Mutated';
    (options as Array<[number, string]>)[0][1] = 'Mutated';

    expect(Roles.entries()).toStrictEqual([
      ['None', 0],
      ['User', 1],
      ['Admin', 2],
    ]);
    expect(Roles.options()).toStrictEqual([
      [0, ''],
      [1, 'User'],
      [2, 'Administrator'],
    ]);

    const nextEntries = Roles.entries();
    const nextOptions = Roles.options();

    expect(nextEntries).not.toBe(entries);
    expect(nextOptions).not.toBe(options);
    expect(nextEntries[0]).not.toBe(entries[0]);
    expect(nextOptions[0]).not.toBe(options[0]);
  });

  test('raw snapshots are cloned and include auto-generated labels', () => {
    const Roles = createRoles();
    const raw = Roles.raw();

    expect(raw).toStrictEqual({
      None: 0,
      User: 1,
      Admin: 2,
      0: '',
      1: 'User',
      2: 'Administrator',
    });

    (raw as Record<string, string | number>).None = 999;
    expect(Roles.raw().None).toBe(0);
  });

  test('type guards rely on precomputed sets', () => {
    const Roles = createRoles();

    expect(Roles.isKey('User')).toBe(true);
    expect(Roles.isKey('Labels')).toBe(false);
    expect(Roles.isKey('2')).toBe(false);
    expect(Roles.isKey('')).toBe(false);

    expect(Roles.isValue(0)).toBe(true);
    expect(Roles.isValue(1)).toBe(true);
    expect(Roles.isValue(2)).toBe(true);
    expect(Roles.isValue(-1)).toBe(false);
    expect(Roles.isValue(2000)).toBe(false);

    expect(Roles.isLabel('')).toBe(true);
    expect(Roles.isLabel('User')).toBe(true);
    expect(Roles.isLabel('Administrator')).toBe(true);
    expect(Roles.isLabel('Admin')).toBe(false);
    expect(Roles.isLabel('None')).toBe(false);
  });
});

describe('label overrides and defaults', () => {
  test('allows overriding select labels while defaulting to keys', () => {
    const Colors = bdir({
      Red: 10,
      Blue: 20,
      Green: 30,
      10: 'Rouge',
    });

    expect(Colors.Labels.Red).toBe('Rouge');
    expect(Colors.Labels.Blue).toBe('Blue');
    expect(Colors.render(20)).toBe('Blue');
    expect(Colors.render(30)).toBe('Green');
    expect(Colors.options()).toStrictEqual([
      [10, 'Rouge'],
      [20, 'Blue'],
      [30, 'Green'],
    ]);
  });
});

describe('validation errors', () => {
  test('throws when forward key is numeric', () => {
    expect(() =>
      bdir({
        ['123' as 'ForwardKey']: 0,
        User: 1,
        Admin: 2,
        0: '',
        2: 'Administrator',
      }),
    ).toThrowError(`bdir(): forward key "123" must not be numeric`);
  });

  test('throws when forward value is non-finite', () => {
    expect(() =>
      bdir({
        None: Number.POSITIVE_INFINITY,
        User: 1,
        Admin: 2,
        0: '',
        1: 'User',
        2: 'Administrator',
      }),
    ).toThrowError(
      `bdir(): value must be a finite number: [key: "None", value: "Infinity"]`,
    );
  });

  test('throws when duplicate forward values are provided', () => {
    expect(() =>
      bdir({
        None: 0,
        User: 0,
        Admin: 2,
        0: '',
        2: 'Administrator',
      }),
    ).toThrowError(
      `bdir(): duplicate value detected: [key: "User", value: "0"]`,
    );
  });

  test('throws when reverse label is not a string', () => {
    expect(() =>
      bdir({
        None: 0,
        User: 1,
        Admin: 2,
        0: '',
        1: false as unknown as string,
        2: 'Administrator',
      }),
    ).toThrowError(
      'bdir(): label for value must be a string: ' +
        `[value: "1", label: "false"]`,
    );
  });

  test('throws when forward value is not numeric', () => {
    expect(() =>
      bdir({
        None: false as unknown as number,
        User: 1,
        Admin: 2,
        0: '',
        2: 'Administrator',
      }),
    ).toThrowError(
      `bdir(): invalid entry ["None": "false"] — forward keys ` +
        'must be non-numeric strings, forward values must be numbers, reverse ' +
        'reverse keys must be numeric',
    );
  });

  test('throws when reverse keys reference missing forward values', () => {
    expect(() =>
      bdir({
        None: 0,
        User: 1,
        Admin: 2,
        0: '',
        1: 'User',
        2: 'Administrator',
        3: 'Ghost',
      }),
    ).toThrowError(
      'bdir(): all reverse keys must be mentioned in the forward direction: ' +
        `invalid reverse key: "3"`,
    );
  });
});
