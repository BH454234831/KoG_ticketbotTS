export type Expect<T extends true> = T;

export type Remap<T> = T extends Record<string, unknown> ? { [Key in keyof T]: T[Key] } : T;

export type StrictEquals<A1, A2> = (<A>() => A extends A2 ? true : false) extends <A>() => A extends A1
  ? true
  : false
  ? true
  : false;
export type Equals<A1, A2> = StrictEquals<Remap<A1>, Remap<A2>>;
