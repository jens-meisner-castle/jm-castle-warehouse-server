export function without<T = Record<string, unknown>>(
  obj: T,
  toDelete: keyof T
) {
  const newObj = obj;
  delete newObj[toDelete];
  return newObj;
}
