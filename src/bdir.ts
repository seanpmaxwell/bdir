/******************************************************************************
                                 Constants
******************************************************************************/

const ERRORS = {
  ForwardKeyNumeric(key: string) {
    return `bdir(): forward key "${key}" must not be numeric`;
  },
  ValueNotNumber(key: string, value: number) {
    return `bdir(): value must be a finite number: [key: "${key}", value: "${value}"]`;
  },
  DuplicateValue(key: string, value: number) {
    return `bdir(): duplicate value detected: [key: "${key}", value: "${value}"]`;
  },
  LabelNotString(value: string, label: unknown) {
    return (
      'bdir(): label for value must be a string: ' +
      `[value: "${value}", label: "${String(label)}"]`
    );
  },
  InvalidEntry(key: string, value: unknown) {
    return (
      `bdir(): invalid entry ["${key}": "${String(value)}"] — forward keys ` +
      'must be non-numeric strings, forward values must be numbers, reverse ' +
      'reverse keys must be numeric'
    );
  },
  ReverseWithoutForward(value: number) {
    return (
      'bdir(): all reverse keys must be mentioned in the forward ' +
      `direction: invalid reverse key: "${String(value)}"`
    );
  },
} as const;

/******************************************************************************
                                  Types
******************************************************************************/

type CollapseType<T> = {
  [K in keyof T]: T[K];
} & {};

// -- Function Signature -- //

type BasicBdir = Record<string | number, string | number>;

type IsNumericKey<K> = K extends number
  ? true
  : K extends `${number}`
    ? true
    : false;

type InvalidBiDirKeys<T extends object> = {
  [K in keyof T]: IsNumericKey<K> extends true
    ? T[K] extends string
      ? never
      : K // reverse: numeric key -> string value
    : T[K] extends number
      ? never
      : K; // forward: string key  -> number value
}[keyof T];

type BiDirParam<T extends object> =
  InvalidBiDirKeys<T> extends never ? T : never;

type AssertBdir<T extends object> = T & BiDirParam<T>;

// -- Resolve Labels -- //

type GetLabelsMap<T> = {
  [K in keyof ForwardOf<T> & string]: LabelFor<T, K>;
};

type LabelFor<T, K extends keyof ForwardOf<T>> =
  Extract<T[Extract<keyof T, RevKey<ForwardOf<T>[K]>>], string> extends infer L
    ? [L] extends [never]
      ? K & string
      : L
    : never;

type RevKey<V> = V extends number
  ? V | `${V}`
  : V extends `${number}`
    ? V
    : never;

type ForwardOf<T> = {
  [K in keyof T as T[K] extends `${number}` | number ? K : never]: T[K];
};

// -- Misc -- //

type BdirKeys<T> = {
  [K in keyof T]: K extends `${number}` | number ? never : K;
}[keyof T];

type BdirValues<T> = Extract<T[keyof T], number>;

type GetRawValue<T extends BasicBdir> =
  // keep existing object shape
  T &
    // add any missing reverse labels
    {
      [K in keyof ForwardOf<T> as ForwardOf<T>[K] extends number
        ? ForwardOf<T>[K]
        : never]: LabelFor<T, K>;
    };

type GetEntries<T> = Array<[BdirKeys<T>, BdirValues<T>]>;
type GetOptions<T> = Array<[BdirValues<T>, string]>;

// -- Public Utility Types -- //

export type PublicBdirValues<T extends BdirRetVal> = ReturnType<
  T['values']
>[number];

export type PublicBdirKeys<T extends BdirRetVal> = ReturnType<
  T['keys']
>[number];

export type PublicBdirLabels<T extends BdirRetVal> = ReturnType<
  T['labels']
>[number];

interface BdirRetVal {
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

  // ** Initialze the .raw and ._labels objects ** //
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
    keyLabelMap[key] = label;
    labelMap.set(label, { key, value });
    labelMapIngoreCase.set(label.toLowerCase(), { key, value });
  }

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
    ...(forward as Forward),
    _labels: keyLabelMap as LabelMap,
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
    raw: () => ({ ...rawValue }) as CollapseType<GetRawValue<T>>,
    keys: () => [...keysArray] as Array<keyof Forward>,
    values: () => [...valuesArray] as Value[],
    labels: () => [...labelsArray] as Array<LabelMap[keyof LabelMap]>,
    entries: () => clone2D(entries) as Entries,
    options: () => clone2D(options) as Options,
    isKey,
    isValue,
    isLabel: (arg: unknown): arg is Label => isLabel(arg, false),
  };
}

/**
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
      valueKeyMap.set(value, key);
      entries.push([key, value]);
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
      reverseKeys.push(valueAsKey);
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
    valueKeyMap,
    keysArray,
    valuesArray,
  } as const;
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
