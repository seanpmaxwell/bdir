import { expect, test } from 'vitest';

import bdir from '../src';

// ** List of APIs ** //

// isKey
// isValue
// isLabel

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

test('Errors', () => {});
