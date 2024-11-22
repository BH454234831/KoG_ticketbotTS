import type { Equals, Expect } from './typeTest.js';

export type AnyObject = Record<string, any>;

export type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U;

export type PartialPick<T, K extends keyof T> = Overwrite<T, Partial<Pick<T, K>>>;
export type PartialOmit<T, K extends keyof T> = Overwrite<T, Partial<Omit<T, K>>>;
export type RequiredPick<T, K extends keyof T> = Overwrite<T, Required<Pick<T, K>>>;
export type RequiredOmit<T, K extends keyof T> = Overwrite<T, Required<Omit<T, K>>>;

export type PartialNullable<T> = {
  [P in keyof T]?: T[P] | null;
};

export type OptionalPropertiesOf<T> = Exclude<{
  [K in keyof T]: T extends Record<K, T[K]> ? never : K;
}[keyof T], undefined>;
export type PickOptionals<T> = Pick<T, OptionalPropertiesOf<T>>;
export type OmitOptionals<T> = Omit<T, OptionalPropertiesOf<T>>;

export type NullifyOptions<T> = OmitOptionals<T> & { [K in OptionalPropertiesOf<T>]?: T[K] | null };

export type ExtractOverloads<T> = T extends {
  (...args: infer P1): infer R1;
  (...args: infer P2): infer R2;
} ? ((...args: P1) => R1) | ((...args: P2) => R2) : never;

export type FirstOverload<T> = T extends {
  // eslint-disable-next-line @typescript-eslint/prefer-function-type
  (...args: infer P1): infer R1;
} ? ((...args: P1) => R1) : never;

type Cons<H, T> = T extends readonly any[] ?
    ((h: H, ...t: T) => void) extends ((...r: infer R) => void) ? R : never
  : never;

type Prev = readonly [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20, ...Array<0>];

export type Paths<T, D extends number = 10> = [D] extends readonly [never] ? never : T extends object ?
    { readonly [K in keyof T]-?: readonly [K] | (Paths<T[K], Prev[D]> extends infer P ?
      P extends readonly [] ? never : Cons<K, P> : never
    ) }[keyof T]
  : readonly [];

export type Leaves<T, D extends number = 10> = [D] extends readonly [never] ? never : T extends object ?
    { readonly [K in keyof T]-?: Cons<K, Leaves<T[K], Prev[D]>> }[keyof T]
  : readonly [];

export type Prettify<T> = {
  [K in keyof T]: T[K];
// eslint-disable-next-line @typescript-eslint/ban-types
} & {};

// ==================== TESTS ==================== //

/* eslint-disable @typescript-eslint/no-unused-vars */
export type _TEST_Overwrite = Expect<Equals<Overwrite<{ a: number; b: string }, { a: bigint }>, { a: bigint; b: string }>>;

export type _TEST_PartialPick = Expect<Equals<PartialPick<{ a: number; b: string }, 'a'>, { a?: number; b: string }>>;
export type _TEST_PartialOmit = Expect<Equals<PartialOmit<{ a: number; b: string }, 'a'>, { a: number; b?: string }>>;
export type _TEST_RequiredPick = Expect<Equals<RequiredPick<{ a?: number; b?: string }, 'a'>, { a: number; b?: string }>>;
export type _TEST_RequiredOmit = Expect<Equals<RequiredOmit<{ a?: number; b?: string }, 'a'>, { a?: number; b: string }>>;

export type _TEST_OptionalPropertiesOf = Expect<Equals<OptionalPropertiesOf<{ a?: number; b: string }>, 'a'>>;
export type _TEST_PickOptionals = Expect<Equals<PickOptionals<{ a?: number; b: string }>, { a?: number }>>;
export type _TEST_OmitOptionals = Expect<Equals<OmitOptionals<{ a?: number; b: string }>, { b: string }>>;

export type _TEST_NullifyOptions = Expect<Equals<NullifyOptions<{ a?: number; b: string }>, { a?: number | null; b: string }>>;
