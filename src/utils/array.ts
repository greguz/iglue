export function findIndex<T>(
  arr: T[],
  predicate: (value: T, index: number) => boolean
): number {
  for (let i = 0; i < arr.length; i++) {
    if (predicate(arr[i], i) === true) {
      return i;
    }
  }
  return -1;
}

export function find<T>(
  arr: T[],
  predicate: (value: T, index: number) => boolean
): T | undefined {
  for (let i = 0; i < arr.length; i++) {
    if (predicate(arr[i], i) === true) {
      return arr[i];
    }
  }
}

export function includes<T>(arr: T[], target: T): boolean {
  for (const entry of arr) {
    if (entry === target) {
      return true;
    }
  }
  return false;
}

export function uniq<T>(arr: T[]): T[] {
  const result: T[] = [];
  for (const entry of arr) {
    if (!includes(result, entry)) {
      result.push(entry);
    }
  }
  return result;
}

export function remove<T>(arr: T[], target: T): boolean {
  const index = findIndex(arr, entry => entry === target);
  if (index >= 0) {
    arr.splice(index, 1);
  }
  return index >= 0;
}

export function voidReducer(a: VoidFunction, b: VoidFunction): VoidFunction {
  return function c() {
    a();
    b();
  };
}
