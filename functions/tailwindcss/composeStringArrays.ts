/**
 * @example
 * composeStringArrays('%1: %2', ['hello', 'hi'], ['Bill', 'Simon']) //=> [
 *   'hello: Bill',
 *   'hi: Bill',
 *   'hello: Simon',
 *   'hi: Simon'
 * ]
 */
export default function composeStringArrays(template: string, ...stringsArray: Array<string[]>) {
  let resultStrings: string[] = [template]
  let newStrings: string[] = []
  for (let i = 0; i < stringsArray.length; i++) {
    const stringsItem = stringsArray[i]
    for (let j = 0; j < stringsItem.length; j++) {
      const word = stringsItem[j]
      for (let m = 0; m < resultStrings.length; m++) {
        const original = resultStrings[m]
        newStrings.push(original.replace(`%${i + 1}`, word))
      }
    }
    resultStrings = newStrings
    newStrings = []
  }
  return resultStrings
}
