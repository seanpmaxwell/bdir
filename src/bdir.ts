/******************************************************************************
                                 Constants
******************************************************************************/

const ERRORS = {
  ForwardKeyNumeric(key: string) {
    return `bdir(): forward key "${key}" must not be numeric`;
  },
  ValueNotNumber(key: string, value: number) {
    return `bdir(): value must be a finite number: [key: ${key}, value: ${value}]`;
  },
  DuplicateValue(key: string, value: number) {
    return `bdir(): duplicate value detected: [key: ${key}, value: ${value}]`;
  },
  LabelNotString(value: string, label: unknown) {
    return 'bdir(): label for value must be a string: ' + 
      `[value: ${value}, label: ${String(label)}]`;
  },
  InvalidEntry(key: string, value: unknown) {
    return `bdir(): invalid entry ["${key}: ${String(value)}] — ` +
      'forward keys must be non-numeric strings, ' +
      'forward values must be numbers, reverse keys must be numeric';
  },
  ReverseWithoutForward(value: number) {
    return 'bdir(): all reverse keys must be mentioned in the forward ' +
      `direction: invalid reverse key: "${String(value)}"`;
  },
} as const;


/******************************************************************************
                                  Types
******************************************************************************/

type BasicBdir = Record<string, number | string>;

type BiDirParam<T extends Record<string | number, string | number>> =
  {
    [K in keyof T]:
      K extends `${number}`
        ? T[K] extends string ? unknown : never
        : T[K] extends number ? unknown : never
  }[keyof T] extends never
    ? never
    : T;

type ForwardOf<T> = {
  [K in keyof T as T[K] extends (`${number}` | number) ? K : never]: T[K];
};

type BdirKeys<T> = {
  [K in keyof T]: K extends (`${number}` | number) ? never : K
}[keyof T];

type BdirValues<T> = T[BdirKeys<T>];

type LabelsOf<T> = {
  [K in keyof ForwardOf<T>]: string;
};

type GetRawValue<T> =
  {
    [K in keyof T]: T[K];
  }
    &
  {
    [V in T[keyof T] & number as `${V}`]: string;
  };

type GetEntries<T> = [keyof T, keyof T[keyof T]][];
type GetOptions<T> = [string, keyof T[keyof T]][];

const Roles = {
  Admin: 0,
  User: 1,
  0: 'Admin',
  1: 'User'
} as const;

type Vals = BdirValues<typeof Roles>;

/******************************************************************************
                              Functions
******************************************************************************/

/**
 * Default function.
 */
function bdir<const T extends BasicBdir>(param: BiDirParam<T>) {
  type Forward = ForwardOf<T>;
  type Key = BdirKeys<T>;
  type Value = BdirValues<T>;
  type RawValue = GetRawValue<T>;
  type LabelsMap = LabelsOf<T>;
  type Entries = GetEntries<T>;
  type Options = GetOptions<T>;

  // Split forward/reverse
  const {
    forward,
    reverse,
    entries,
    options,
    labelMap,
    keyMap,
    keysArray,
    valuesArray,
  } = splitDirections(param)

  // Initialize arrays
  const labelsArray = valuesArray.map((v, i) => reverse[v] ?? keysArray[i]);

  // Initialize Sets
  const keySet = new Set<string>(keysArray),
    valueSet = new Set<number>(valuesArray),
    labelSet = new Set<string>(labelsArray);

  // Initialze the ".raw" and ".Labels" objects
  const rawValue: Record<string, string | number> = {},
      labelsMap: Record<string, string> = {};
  for (let i = 0; i < keysArray.length; i++) {
    const k = keysArray[i],
      v = valuesArray[i],
      label = labelsArray[i];
    rawValue[k] = v;
    rawValue[v] = label;
    labelsMap[k] = label;
  }

  // Validator functions
  const isKey = (arg: unknown): arg is Key => {
    return typeof arg === 'string' && keySet.has(arg);
  }
  const isValue = (arg: unknown): arg is Value => {
    return typeof arg === 'number' && valueSet.has(arg);
  }
  const isLabel = (arg: unknown): arg is string => {
    return typeof arg === 'string' && labelSet.has(arg);
  }

  // Lookup functions
  const render = (arg: unknown): string => {
    if (!isValue(arg)) return '';
    return labelMap.get(arg as number) ?? '';
  }
  const index = (arg: unknown): number => {
    if (!isKey(arg)) return -1;
    return keyMap.get(arg as string) ?? -1;
  }

  // Return
  return {
    ...forward as Forward,
    Labels: labelsMap as LabelsMap,
    render,
    index,
    raw: () => ({ ...rawValue }) as RawValue,
    keys: () => [...keysArray] as Array<keyof Forward>,
    values: () => [...valuesArray] as Value[],
    labels: () => [...labelsArray] as string[],
    entries: () => clone2D(entries) as Entries,
    options: () => clone2D(options) as Options,
    isKey,
    isValue,
    isLabel,
  };
};

/**
 * Runtime check to make sure every value is unique
 */
function splitDirections(param: BasicBdir) {
  const forward: Record<string, number> = {} as any,
    reverse: Record<number, string> = {},
    seenValues = new Set<number>(),
    reverseKeys = new Set<number>(),
    entries: [string, number][] = [],
    options: [number, string][] = [],
    labelMap = new Map<number, string>(),
    keyMap = new Map<string, number>(),
    keysArray = [],
    valuesArray = [];

  // ** Interate whole object ** //
  for (const [key, value] of Object.entries(param)) {
    const isReverseKey = isNumericKey(key);
    // Forward direction
    if (typeof value === 'number') {
      if (isReverseKey) {
        throw new Error(ERRORS.ForwardKeyNumeric(key));
      }
      if (!Number.isFinite(value)) {
        throw new Error(ERRORS.ValueNotNumber(key, value));
      }
      // Uniqueness check
      if (seenValues.has(value)) {
        throw new Error(ERRORS.DuplicateValue(key, value));
      }
      seenValues.add(value);
      forward[key] = value;
      entries.push([key, value]);
      keyMap.set(key, value);
      keysArray.push(key);
      valuesArray.push(value);
      continue;
      // Reverse direction
    } else if (isReverseKey) {
      if (typeof value !== 'string') {
        throw new Error(ERRORS.LabelNotString(key, value));
      }
      const valueAsKey = Number(key);
      reverse[valueAsKey] = value;
      options.push([valueAsKey, value]);
      labelMap.set(valueAsKey, value);
      continue;
    }
    // Invalid value
    throw new Error(ERRORS.InvalidEntry(key, value));
  }

  /* Make sure that all values used as keys in the reverse direction, were
    specified in the forward direction */
  for (const value of reverseKeys) {
    if (!seenValues.has(value)) {
      throw new Error(ERRORS.ReverseWithoutForward(value));
    }
  }

  // Return
  return {
    forward,
    reverse,
    entries,
    options,
    labelMap,
    keyMap,
    keysArray,
    valuesArray,
  };
}

/**
 * Check if a key can be converted to a string.
 */
function isNumericKey(key: string): boolean {
  const numericKey = Number(key);
  return !Number.isNaN(numericKey) && String(numericKey) === key;
}

/**
 * Clone a 2D array
 */
function clone2D(arr: (string | number)[][]) {
  return arr.map(([a, b]) => [a, b]);
}

/******************************************************************************
                                  Export
******************************************************************************/

export default bdir;
