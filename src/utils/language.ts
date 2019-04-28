export function noop() {}

export function isUndefined(value: any): value is undefined {
  return value === undefined;
}

export function isNull(value: any): value is null {
  return value === null;
}

export function isNil(value: any) {
  return isUndefined(value) || isNull(value);
}

export function isArray(value: any): value is any[] {
  return value instanceof Array;
}

export function isObject(value: any): value is Object {
  return typeof value === "object" && !isNull(value);
}

export function isFunction(value: any): value is (...args: any[]) => any {
  return typeof value === "function";
}

export function isString(value: any): value is string {
  return typeof value === "string";
}

export function isNumber(value: any): value is number {
  return typeof value === "number" && !isNaN(value);
}

export function captureRegExpGroups(
  regex: RegExp,
  str: string,
  group: number = 1
) {
  if (!regex.global) {
    throw new Error();
  }
  const result: string[] = [];
  let match = regex.exec(str);
  while (match) {
    result.push(match[group] || "");
    match = regex.exec(str);
  }
  return result;
}

export function captureRegExpGroup(
  regex: RegExp,
  str: string,
  group: number = 1
): string | undefined {
  const match = regex.exec(str);
  if (match) {
    return match[group] || "";
  }
}
