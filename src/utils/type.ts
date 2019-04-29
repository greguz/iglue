export interface Collection<T = any> {
  [key: string]: T | undefined;
}

export type Getter<T = any, C = any> = (this: C) => T;

export type Setter<T = any, C = any> = (this: C, value: T) => void;
