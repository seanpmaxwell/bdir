/******************************************************************************
                                  Types
******************************************************************************/

export type BdirKeys<T> = {
  [K in keyof T]: K extends `${number}` | number ? never : K;
}[keyof T];

export type BdirValues<T> = Extract<T[keyof T], number>;
export type BasicBdir = Record<string | number, string | number>;
export type GetEntries<T> = Array<[BdirKeys<T>, BdirValues<T>]>;
export type GetOptions<T> = Array<[BdirValues<T>, string]>;

// ------------------------ AssertBdir ------------------------------------- //

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

export type AssertBdir<T extends object> = T & BiDirParam<T>;

// ---------------------------- Resolve Labels ----------------------------- //

export type ForwardOf<T> = {
  [K in keyof T as T[K] extends `${number}` | number ? K : never]: T[K];
};

type RevKey<V> = V extends number
  ? V | `${V}`
  : V extends `${number}`
    ? V
    : never;

type LabelFor<T, K extends keyof ForwardOf<T>> =
  Extract<T[Extract<keyof T, RevKey<ForwardOf<T>[K]>>], string> extends infer L
    ? [L] extends [never]
      ? K & string
      : L
    : never;

// ---------------------------- Misc --------------------------------------- //

export type GetLabelsMap<T> = {
  [K in keyof ForwardOf<T> & string]: LabelFor<T, K>;
};

export type GetLabelsObject<T> = {
  [K in keyof ForwardOf<T> & string as `_${K}`]: LabelFor<T, K>;
};

export type GetRawValue<T extends BasicBdir> =
  // keep existing object shape
  T &
    // add any missing reverse labels
    {
      [K in keyof ForwardOf<T> as ForwardOf<T>[K] extends number
        ? ForwardOf<T>[K]
        : never]: LabelFor<T, K>;
    };
