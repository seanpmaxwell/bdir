import { expect, test } from 'vitest';

import bdir from '../src';

// ** List of APIs ** //

test('basic runtime validation', () => {
  const Roles = bdir({
    None: 0,
    User: 1,
    Admin: 2,
    0: '',
    2: 'Administrator',
  });

  // Test forward direction
  expect(Roles.None).toBe(0);
  expect(Roles.User).toBe(1);
  expect(Roles.Admin).toBe(2);
  // expect(Roles.Administrator).toBe(2); // type error

  // Test .Labels
  expect(Roles.Labels.None).toBe('');
  expect(Roles.Labels.User).toBe('User');
  expect(Roles.Labels.Admin).toBe('Administrator');
  // expect(Roles.Labels.Administrator).toBe('Administrator'); //type error

  // Test .render()
  expect(Roles.render(0)).toBe('');
  expect(Roles.render(1)).toBe('User');
  expect(Roles.render(2)).toBe('Administrator');
  expect(Roles.render(1000)).toBe('');

  // Test .index()
  expect(Roles.index('User')).toBe(1);
  expect(Roles.index('Admin')).toBe(2);
  expect(Roles.index('None')).toBe(0);
  expect(Roles.index('foo')).toBe(-1);

  // Test .renderByKey()
  expect(Roles.renderByKey('User')).toBe('User');
  expect(Roles.renderByKey('Admin')).toBe('Administrator');
  expect(Roles.renderByKey('None')).toBe('');
  expect(Roles.renderByKey('foo')).toBe('');

  // Test .reverseIndex()
  expect(Roles.reverseIndex(0)).toBe('None');
  expect(Roles.reverseIndex(1)).toBe('User');
  expect(Roles.reverseIndex(2)).toBe('Admin');
  expect(Roles.reverseIndex(1000)).toBe('');

  // Test .raw()
  expect(Roles.raw()).toStrictEqual({
    None: 0,
    User: 1,
    Admin: 2,
    0: '',
    1: 'User',
    2: 'Administrator',
  });

  // Arrays: [.keys(), .values(), .labels()]
  expect(Roles.keys()).toStrictEqual(['None', 'User', 'Admin']);
  expect(Roles.values()).toStrictEqual([0, 1, 2]);
  expect(Roles.labels()).toStrictEqual(['', 'User', 'Administrator']);

  // .entries()
  expect(Roles.entries()).toStrictEqual([
    ['None', 0],
    ['User', 1],
    ['Admin', 2],
  ]);

  // .options()
  expect(Roles.options()).toStrictEqual([
    [0, ''],
    [1, 'User'],
    [2, 'Administrator'],
  ]);

  // .isKey()
  expect(Roles.isKey('User')).toBeTruthy();
  expect(Roles.isKey('Administrator')).toBeFalsy();
  expect(Roles.isKey('None')).toBeTruthy();
  expect(Roles.isKey('')).toBeFalsy();

  // .isValue()
  expect(Roles.isValue(1)).toBeTruthy();
  expect(Roles.isValue(3)).toBeFalsy();
  expect(Roles.isValue(0)).toBeTruthy();
  expect(Roles.isKey(-1)).toBeFalsy();

  // .isLabel()
  expect(Roles.isLabel('User')).toBeTruthy();
  expect(Roles.isLabel('Administrator')).toBeTruthy();
  expect(Roles.isLabel('Admin')).toBeFalsy();
  expect(Roles.isLabel('None')).toBeFalsy();
  expect(Roles.isLabel('')).toBeTruthy();
});

test('test for thrown errors', () => {
  // ** None numeric key ** //
  const test1 = () =>
    bdir({
      '123': 0,
      User: 1,
      Admin: 2,
      0: '',
      2: 'Administrator',
    });
  expect(() => test1()).toThrowError(
    `bdir(): forward key "123" must not be numeric`,
  );

  // ** Non-finite number ** //
  const test2 = () =>
    bdir({
      None: Number.POSITIVE_INFINITY,
      User: 1,
      Admin: 2,
      [Number.POSITIVE_INFINITY]: '',
      2: 'Administrator',
    });
  expect(() => test2()).toThrowError(
    `bdir(): value must be a finite number: [key: "None", value: "Infinity"]`,
  );

  // ** Value not unique ** //
  const test3 = () =>
    bdir({
      None: 0,
      User: 0,
      Admin: 2,
      0: '',
      2: 'Administrator',
    });
  expect(() => test3()).toThrowError(
    `bdir(): duplicate value detected: [key: "User", value: "0"]`,
  );

  // ** Label not a string ** //
  const test4 = () =>
    bdir({
      None: 0,
      User: 1,
      Admin: 2,
      0: '',
      1: false as unknown as string,
      2: 'Administrator',
    });
  expect(() => test4()).toThrowError(
    'bdir(): label for value must be a string: ' +
      `[value: "1", label: "false"]`,
  );

  // ** Invalid Entry ** //
  const test5 = () =>
    bdir({
      None: false as unknown as string,
      User: 1,
      Admin: 2,
      0: '',
      2: 'Administrator',
    });
  expect(() => test5()).toThrowError(
    `bdir(): invalid entry ["None": "false"] — forward keys ` +
      'must be non-numeric strings, forward values must be numbers, reverse ' +
      'reverse keys must be numeric',
  );

  // ** Reverse without forward ** //
  const test6 = () =>
    bdir({
      None: 0,
      User: 1,
      Admin: 2,
      0: '',
      1: 'User',
      2: 'Administrator',
      3: 'foo',
    });
  expect(() => test6()).toThrowError(
    'bdir(): all reverse keys must be mentioned in the forward direction: ' +
      `invalid reverse key: "3"`,
  );
});
