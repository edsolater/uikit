// Note: it's createRange in fnkit. but I think it's too tedius

/**
 * it is like Python's build-in range, but use length instead of start,end
 * @param length length
 * @param map (optional, default is no => no) will map the output
 * @returns an array of number (always start from zero)
 * @example
 * range(3) //=> [0, 1, 2]
 */
export default function range<T extends any = number>(length: number, map?: (no: number) => T): T[]

/**
 * it is like Python's build-in range
 * @param length  length
 * @param offset  the number start with
 * @param map (optional, default is no => no) will map the output
 * @returns an array of number
 * @example
 * range(2, 3) //=> [3, 6]
 * range(2, 3, no => no * 2) //=> [6, 12]
 */
export default function range<T extends any = number>(length: number, offset: number, map?: (no: number) => T): T[]

/**
 * it is like Python's build-in range
 * @param options detail opts for create a range
 * @param options.length length
 * @param options.offset length offset
 * @param options.start number begin with (it's order is higher than length/offset)
 * @param options.end number end with (it's order is higher than length/offset)
 * @param options.step (optional, default is 1) will affect output
 * @param options.map (optional, default is no => no) will map the output
 * @example
 * range({length: 3}) //=> [0, 1, 2]
 * range({start: 2, end: 4}) //=> [2, 3]
 */
export default function range<T extends any = number>(opts: {
  length?: number
  offset?: number
  start?: number
  end?: number
  step?: number
  map?: (no: number) => T
}): T[]

export default function range(...args) {
  if (typeof args[0] === 'number' && typeof args[1] === 'number') {
    return _range({ start: args[1], end: args[0] + args[1], map: args[2] })
  } else if (typeof args[0] === 'number') {
    return _range({ start: 0, end: args[0], map: args[1] })
  } else {
    return _range({
      ...args[0],
      start: args[0].start ?? args[0].offset ?? 0,
      end: args[0].end ?? (args[0].length ?? 0) + (args[0].offset ?? 0)
    })
  }
}

function _range<T extends any = number>({
  start,
  end,
  step = 1,
  map
}: {
  start: number
  end: number
  step?: number
  map?: (no: number) => T
}): T[] {
  if (end <= start) return []
  const arr = Array.from(
    {
      length: Math.floor((end - start) / step)
    },
    (_, i) => start + i * step
  ).map((no) => map?.(no) ?? no)

  // @ts-expect-error force
  return arr
}

// console.log(range(2))
// console.log(range(10, (n) => n * 2))
// console.log(range({ length: 2 }))
// console.log(range({ start: 2, end: 3 }))
