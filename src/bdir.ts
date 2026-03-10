import { Errors } from './constants.js';
import type {
  AssertBdir,
  BasicBdir,
  BdirKeys,
  BdirValues,
  ForwardOf,
  GetEntries,
  GetLabelsMap,
  GetLabelsObject,
  GetOptions,
  GetRawValue,
} from './utility-types.js';

/******************************************************************************
                                  Types
******************************************************************************/

type CollapseType<T> = {
  [K in keyof T]: T[K];
} & {};

// -- Public Utility Types -- //

export type PublicBdirValues<T extends PartialRetVal> = ReturnType<
  T['values']
>[number];

export type PublicBdirKeys<T extends PartialRetVal> = ReturnType<
  T['keys']
>[number];

export type PublicBdirLabels<T extends PartialRetVal> = ReturnType<
  T['labels']
>[number];

interface PartialRetVal {
  values: () => number[];
  keys: () => string[];
  labels: () => string[];
}

/******************************************************************************
                              Functions
******************************************************************************/

/**
 * Default function.
 */
function bdir<const T extends BasicBdir>(param: AssertBdir<T>) {
  type Forward = ForwardOf<T>;
  type Key = BdirKeys<T>;
  type Value = BdirValues<T>;
  type Entries = GetEntries<T>;
  type Options = GetOptions<T>;
  type LabelMap = CollapseType<GetLabelsMap<T>>;
  type Label = LabelMap[keyof LabelMap];

  // ** Split forward/reverse ** //
  const { forward, reverse, entries, valueKeyMap, keysArray, valuesArray } =
    splitDirections(param);

  // ** Initialize labels ** //
  const labelsArray: string[] = [],
    valueLabelMap = new Map<number, string>(),
    options: (string | number)[][] = [];
  for (let i = 0; i < valuesArray.length; i++) {
    const value = valuesArray[i],
      label = reverse[value] ?? keysArray[i];
    labelsArray.push(label);
    valueLabelMap.set(value, label);
    options.push([value, label]);
  }

  // ** Initialze the .raw and "labels" objects ** //
  const rawValue: Record<string, string | number> = {},
    keyLabelMap: Record<string, string> = {},
    labelMap = new Map<string, { key: string; value: number }>(),
    labelMapIngoreCase = new Map<string, { key: string; value: number }>();
  for (let i = 0; i < keysArray.length; i++) {
    const key = keysArray[i],
      value = valuesArray[i],
      label = labelsArray[i];
    rawValue[key] = value;
    rawValue[value] = label;
    keyLabelMap['_' + key] = label;
    labelMap.set(label, { key, value });
    labelMapIngoreCase.set(label.toLowerCase(), { key, value });
  }

  const rawValueFinal = sortObjectStringKeysFirst(rawValue);

  // ** Validator functions ** //
  const isKey = (arg: unknown): arg is Key =>
    typeof arg === 'string' && arg in forward;
  const isValue = (arg: unknown): arg is Value =>
    typeof arg === 'number' && valueKeyMap.has(arg);
  const isLabel = (arg: unknown, ingoreCase: boolean): arg is Label =>
    typeof arg === 'string' &&
    (ingoreCase ? labelMapIngoreCase.has(arg) : labelMap.has(arg));

  // ** .render ** //
  const render = (value: unknown): LabelMap[keyof LabelMap] | '' => {
      if (!isValue(value)) return '';
      return (valueLabelMap.get(value as number) ?? '') as Label;
    },
    renderOrThrow = (value: unknown): LabelMap[keyof LabelMap] => {
      if (!isValue(value)) {
        throw new Error('non-value passed to .renderOrThrow');
      }
      return valueLabelMap.get(value as number) as Label;
    };

  // ** .index ** //
  const index = (key: unknown): Value | -1 => {
      if (!isKey(key)) return -1;
      return forward[key as string] as Value;
    },
    indexOrThrow = (key: unknown): Value => {
      if (!isKey(key)) {
        throw new Error('non-key passed to .indexOrThrow');
      }
      return forward[key as string] as Value;
    };

  // ** .renderByKey ** //
  const renderByKey = (key: unknown): LabelMap[keyof LabelMap] | '' => {
      if (!isKey(key)) return '';
      const val = forward[key as string] as number;
      return (valueLabelMap.get(val) ?? '') as Label;
    },
    renderByKeyOrThrow = (key: unknown): LabelMap[keyof LabelMap] => {
      if (!isKey(key)) {
        throw new Error('non-key passed to .renderByKeyOrThrow');
      }
      const val = forward[key as string] as number;
      return valueLabelMap.get(val) as Label;
    };

  // ** .reverseIndex ** //
  const reverseIndex = (value: unknown): keyof Forward | '' => {
      if (!isValue(value)) return '';
      return (valueKeyMap.get(value as number) ?? '') as keyof Forward;
    },
    reverseIndexOrThrow = (value: unknown): keyof Forward => {
      if (!isValue(value)) {
        throw new Error('non-value passed to .reverseIndexOrThrow');
      }
      return (valueKeyMap.get(value as number) ?? '') as keyof Forward;
    };

  // ** .indexByLabel ** //
  const indexByLabelHelper = (label: string, ignoreCase: boolean): Value => {
      if (ignoreCase) {
        return labelMapIngoreCase.get(label.toLowerCase())?.value as Value;
      }
      return labelMap.get(label)?.value as Value;
    },
    indexByLabel = (label: unknown, ignoreCase?: boolean): Value | -1 => {
      if (!isLabel(label, !!ignoreCase)) return -1;
      return indexByLabelHelper(label as string, !!ignoreCase);
    },
    indexByLabelOrThrow = (label: unknown, ignoreCase?: boolean): Value => {
      if (!isLabel(label, !!ignoreCase)) {
        throw new Error('non-label passed to .indexByLabelOrThrow');
      }
      return indexByLabelHelper(label as string, !!ignoreCase);
    };

  // ** .reverseIndexByLabel ** //
  const reverseIndexByLabelHelper = (
      label: string,
      ignoreCase: boolean,
    ): Key => {
      if (ignoreCase) {
        return labelMapIngoreCase.get(label.toLowerCase())?.key as Key;
      }
      return labelMap.get(label)?.key as Key;
    },
    reverseIndexByLabel = (label: unknown, ignoreCase?: boolean): Key | '' => {
      if (!isLabel(label, !!ignoreCase)) return '';
      return reverseIndexByLabelHelper(label as string, !!ignoreCase);
    },
    reverseIndexByLabelOrThrow = (
      label: unknown,
      ignoreCase?: boolean,
    ): Key => {
      if (!isLabel(label, !!ignoreCase)) {
        throw new Error('non-label passed to .reverseIndexByLabelOrThrow');
      }
      return reverseIndexByLabelHelper(label as string, !!ignoreCase);
    };

  // Return
  return {
    ...(forward as CollapseType<Forward>),
    ...(keyLabelMap as CollapseType<GetLabelsObject<T>>),
    render,
    renderOrThrow,
    renderByKey,
    renderByKeyOrThrow,
    index,
    indexOrThrow,
    reverseIndex,
    reverseIndexOrThrow,
    indexByLabel,
    indexByLabelOrThrow,
    reverseIndexByLabel,
    reverseIndexByLabelOrThrow,
    keys: () => [...keysArray] as Array<keyof Forward>,
    values: () => [...valuesArray] as Value[],
    labels: () => [...labelsArray] as Array<LabelMap[keyof LabelMap]>,
    entries: () => clone2D(entries) as Entries,
    options: () => clone2D(options) as Options,
    isKey,
    isValue,
    isLabel: (arg: unknown): arg is Label => isLabel(arg, false),
    toJSON: () => ({ ...rawValueFinal }) as CollapseType<GetRawValue<T>>,
  };
}

/**
 * @private
 * @see bdir
 *
 * Runtime check to make sure every value is unique
 */
function splitDirections(param: BasicBdir) {
  const forward: Record<string, number> = {},
    reverse: Record<number, string> = {},
    seenValues = new Set<number>(),
    reverseKeys = [],
    entries: [string, number][] = [],
    valueKeyMap = new Map<number, string>(),
    keysArray = [],
    valuesArray = [];

  // ** Interate whole object ** //
  for (const [key, value] of Object.entries(param)) {
    const isReverseKey = isNumericKey(key);
    // Forward direction
    if (typeof value === 'number') {
      if (isReverseKey) {
        throw new Error(Errors.ForwardKeyNumeric(key));
      }
      if (!Number.isFinite(value)) {
        throw new Error(Errors.ValueNotNumber(key, value));
      }
      // Uniqueness check
      if (seenValues.has(value)) {
        throw new Error(Errors.DuplicateValue(key, value));
      }
      seenValues.add(value);
      forward[key] = value;
      valueKeyMap.set(value, key);
      entries.push([key, value]);
      keysArray.push(key);
      valuesArray.push(value);
      continue;
      // Reverse direction
    } else if (isReverseKey) {
      if (typeof value !== 'string') {
        throw new Error(Errors.LabelNotString(key, value));
      }
      const valueAsKey = Number(key);
      reverse[valueAsKey] = value;
      reverseKeys.push(valueAsKey);
      continue;
    }
    // Invalid value
    throw new Error(Errors.InvalidEntry(key, value));
  }

  /* Make sure that all values used as keys in the reverse direction, were
    specified in the forward direction */
  for (const value of reverseKeys) {
    if (!seenValues.has(value)) {
      throw new Error(Errors.ReverseWithoutForward(value));
    }
  }

  // Return
  return {
    forward,
    reverse,
    entries,
    valueKeyMap,
    keysArray,
    valuesArray,
  } as const;
}

/**
 * @private
 * @see splitDirections
 * Clone a 2D array
 */
function clone2D(arr: (string | number)[][]) {
  return arr.map(([a, b]) => [a, b]);
}

/**
 * @private
 * @see bdir
 *
 * For the raw value object make sure forward keys come first.
 */
function sortObjectStringKeysFirst<T extends Record<string, unknown>>(
  obj: T,
): T {
  const entries = Object.entries(obj);
  const sortedEntries = entries.sort(([a], [b]) => {
    const aIsNumeric = isNumericKey(a),
      bIsNumeric = isNumericKey(b);
    if (aIsNumeric && !bIsNumeric) return 1;
    if (!aIsNumeric && bIsNumeric) return -1;
    return 0;
  });
  return Object.fromEntries(sortedEntries) as T;
}

/**
 * @private
 *
 * Check if a key can be converted to a string.
 */
function isNumericKey(key: string): boolean {
  const numericKey = Number(key);
  return !Number.isNaN(numericKey) && String(numericKey) === key;
}

/******************************************************************************
                                  Export
******************************************************************************/

export default bdir;
