/******************************************************************************
                                 Constants
******************************************************************************/

export const Errors = {
  ForwardKeyNumeric(key: string) {
    return `bdir(): forward key "${key}" must not be numeric`;
  },
  ValueNotNumber(key: string, value: number) {
    return `bdir(): value must be a finite number: [key: "${key}", value: "${value}"]`;
  },
  DuplicateValue(key: string, value: number) {
    return `bdir(): duplicate value detected: [key: "${key}", value: "${value}"]`;
  },
  LabelNotString(value: string, label: unknown) {
    return (
      'bdir(): label for value must be a string: ' +
      `[value: "${value}", label: "${String(label)}"]`
    );
  },
  InvalidEntry(key: string, value: unknown) {
    return (
      `bdir(): invalid entry ["${key}": "${String(value)}"] — forward keys ` +
      'must be non-numeric strings, forward values must be numbers, reverse ' +
      'reverse keys must be numeric'
    );
  },
  ReverseWithoutForward(value: number) {
    return (
      'bdir(): all reverse keys must be mentioned in the forward ' +
      `direction: invalid reverse key: "${String(value)}"`
    );
  },
} as const;
