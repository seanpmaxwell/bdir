/******************************************************************************
                                  Types
******************************************************************************/

type BdirBase = {
  [key: string]: number | string;
  [key: number]: string;
};

type ForwardNumberValues<T extends BdirBase> = Extract<
  {
    [K in keyof T]: K extends string
      ? T[K] extends number
        ? T[K]
        : never
      : never;
  }[keyof T],
  number
>;

type ReverseNumberKeys<T extends BdirBase> = Extract<
  {
    [K in keyof T]: K extends number
      ? T[K] extends string
        ? K
        : never
      : never;
  }[keyof T],
  number
>;

type MissingReverseKeys<T extends BdirBase> = Exclude<
  ReverseNumberKeys<T>,
  ForwardNumberValues<T>
>;

type Bdir<T extends BdirBase = BdirBase> =
  MissingReverseKeys<T> extends never
    ? T & Record<ForwardNumberValues<T>, string>
    : never;

// Union of all number values
export type BdirValues<T extends BdirBase> = {
  [K in keyof T]: T[K] extends number ? T[K] : never;
}[keyof T];

// Union of all number values
export type BdirLabels<T extends BdirBase> = {
  [K in keyof T]: T[K] extends string ? T[K] : never;
}[keyof T];

// Array of all Bdir entries [number, string][]
type ReverseEntries<T extends BdirBase> = {
  [K in keyof T]: K extends number | `${string}`
    ? T[K] extends string
      ? [K, T[K]]
      : never
    : never;
}[keyof T][];

/******************************************************************************
                                 Functions
******************************************************************************/

/**
 * Setup utilities for a bi-directional object.
 */
function bdir<T extends BdirBase>(bdirParam: Bdir<T>) {
  const reverseMap = getReverseMap(bdirParam),
    labelSet = new Set<string>(reverseMap.values()),
    entries = Array.from(reverseMap) as ReverseEntries<T>;

  const isValue = (arg: unknown): arg is BdirValues<T> =>
    isNumber(arg) && reverseMap.has(arg);

  const isLabel = (arg: unknown): arg is BdirLabels<T> =>
    isString(arg) && labelSet.has(arg);

  const render = (arg: unknown): string => {
    if (isNumber(arg)) {
      return reverseMap.get(arg) ?? '';
    }
    return '';
  };

  // Return
  return {
    isValue,
    isOptionalValue: makeOptional(isValue),
    isLabel,
    isOptionalLabel: makeOptional(isLabel),
    render,
    entries,
  } as const;
}

/**
 * Reverse direction (number, string)
 */
function getReverseMap<T extends BdirBase>(arg: T) {
  const reverseEntries = new Map<number, string>();
  Object.entries(arg).filter(([k, v]) => {
    if (isValidNumber(k) && isString(v) && !isValidNumber(v)) {
      reverseEntries.set(Number(k), v);
    }
  });
  return reverseEntries;
}

/******************************************************************************
                                 Functions
******************************************************************************/

export default bdir;