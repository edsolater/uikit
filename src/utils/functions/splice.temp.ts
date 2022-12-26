/**
 * origin `splice` is mutable , not convience to use
 */
export function splice<T>(arr: T[], start: number, deleteCount: number, ...items: T[]) {
  const newArr = [...arr]
  newArr.splice(start, deleteCount, ...items)
  return newArr
}
