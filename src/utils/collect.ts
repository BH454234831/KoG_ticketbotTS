export async function asyncCollect<T> (asyncIterable: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const item of asyncIterable) {
    result.push(item);
  }
  return result;
}
