export interface Collection<T = any> {
  [key: string]: T | undefined;
}

export type Getter<T = any> = (this: any) => T;

export type Setter<T = any> = (this: any, value: T) => void;
