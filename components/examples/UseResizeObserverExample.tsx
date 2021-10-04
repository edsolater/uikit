import { useRef } from 'react'

import useResizeObserver from '../../hooks/useResizeObserver'
import Card from '../../uikit/Card'
import ExampleCard from './ExampleCard'
import ExampleGroup from './ExampleGroup'

export default function UseResizeObserverExample() {
  const ref = useRef<HTMLDivElement>()

  useResizeObserver(ref, ({ target }) => {
    console.log('client width: ', target.clientWidth)
  })

  return (
    <ExampleCard title='UseResizeObserverExample' category='hooks'>
      <ExampleGroup caption='basic example' explanation='will detect size change. Try to resize it'>
        <Card domRef={ref} className='bg-block-semi-dark w-[20vw] m-4 rounded-lg' style={{ aspectRatio: '1' }} />
      </ExampleGroup>
    </ExampleCard>
  )
}
