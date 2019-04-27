export type Target = PathTarget | PrimitiveTarget;

/**
 * Represents the target value inside the context
 */
export interface PathTarget {
  type: "path";
  value: string;
}

/**
 * Represents a const (normally, a formatter argument)
 */
export interface PrimitiveTarget {
  type: "primitive";
  value: PrimitiveValue;
}

export type PrimitiveValue = string | number | boolean | null | undefined;
