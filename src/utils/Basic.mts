export function without<T = Record<string, unknown>>(
  obj: T,
  ...toDelete: Array<keyof T>
) {
  const newObj = obj;
  toDelete.forEach((k) => delete newObj[k]);
  return newObj;
}
