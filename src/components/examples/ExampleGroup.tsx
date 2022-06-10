import Caption from '../../uikit/Caption'
import type { DivProps } from '../../uikit/Div'
import Div from '../../uikit/Div'
import Row from '../../uikit/Row'
import Text from '../../uikit/Text'

interface ExampleGroupProps extends DivProps {
  caption?: string
  explanation?: string
}
export default function ExampleGroup({ caption, explanation, children, ...restProps }: ExampleGroupProps) {
  return (
    <Div {...restProps} className_='ExampleGroup'>
      {caption && <Caption className='my-4 text-xl font-bold'>{caption}</Caption>}
      {explanation && <Text className='text-sm text-text-light text-opacity-60'>{explanation}</Text>}
      <Row className='flex-wrap items-center gap-4'>{children}</Row>
    </Div>
  )
}

// /** test performance */
// const testArr = Array.from({ length: 20 }, (_, i) => i + 1)

// const arr0 = testArr.map((i) => 2 * i)
// console.log('arr0[8]: ', arr0[8])

// const arr20 = map(testArr, (i) => 2 * i)
// console.log('arr20[8]: ', arr20[8])

// console.time('build-in')
// const arr = testArr.map((i) => 2 * i)
// console.log(arr[8])
// console.timeEnd('build-in')

// console.time('i map')
// const arr2 = map(testArr, (i) => 2 * i)
// console.log(arr2[8])
// console.timeEnd('i map')

/** test performance */
// console.time('build-in')
// const arr = Array.from({ length: 10 }, (_, i) => i + 1)
// console.log(arr[8])
// console.timeEnd('build-in')

// console.time('i map')
// const arr2 = Array.from({ length: 10 }, (_, i) => add(i, 1))
// console.log(arr2[8])
// console.timeEnd('i map')
