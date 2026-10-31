export const getNumber = (value: string | number) =>
  typeof value === 'string' ? Number.parseInt(value, 10) : value;
