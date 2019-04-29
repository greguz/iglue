export function noop() {
  // empty
}

export function passthrough<T>(value: T): T {
  return value;
}

export function wrapError(message: string): (...args: any[]) => any {
  return function ko(): void {
    throw new Error(message);
  };
}

export function wrapConst<T>(value: T) {
  return function get() {
    return value;
  };
}

export function voidReducer(a: VoidFunction, b: VoidFunction): VoidFunction {
  return function c() {
    a();
    b();
  };
}
