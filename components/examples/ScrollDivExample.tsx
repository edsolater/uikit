import range from '../../functions/fnkit/range'
import Card from '../../uikit/Card'
import Div from '../../uikit/Div'
import ExampleCard from './ExampleCard'
import ExampleGroup from './ExampleGroup'
import ScrollDiv from '../../uikit/ScrollDiv'
import { RefObject, useEffect, useRef, useState } from 'react'

export default function ScrollDivExample() {
  const divRef = useRef()
  const overflowInfo = useOverflowDetect(divRef)
  return (
    <ExampleCard title='ScrollDivExample' category='uikit'>
      <ExampleGroup caption='basic example'>
        <PropertiesDebugger targeObj={overflowInfo} />
        <Div domRef={divRef} className='h-80 w-full overflow-auto'>
          {range(10, (idx) => (
            <Card
              boundingBoxCSS
              key={idx}
              className='bg-block-semi-dark w-44 m-4 rounded-lg  hover:ring-block-light ring-transparent win10-light-spot ring-8 ring-inset hover:ring-opacity-60'
              style={{ aspectRatio: '1 / 1' }}
            />
          ))}
        </Div>
        <ScrollDiv className='h-80 w-full'>
          {range(10, (idx) => (
            <Card
              boundingBoxCSS
              key={idx}
              className='bg-block-semi-dark w-44 m-4 rounded-lg  hover:ring-block-light ring-transparent win10-light-spot ring-8 ring-inset hover:ring-opacity-60'
              style={{ aspectRatio: '1 / 1' }}
            />
          ))}
        </ScrollDiv>
      </ExampleGroup>
    </ExampleCard>
  )
}

function useOverflowDetect(domRef: RefObject<HTMLElement | undefined>) {
  const [xOverflowed, setXOverflowed] = useState(false)
  const [yOverflowed, setYOverflowed] = useState(false)
  useEffect(() => {
    if (!domRef.current) return
    if (domRef.current.scrollWidth > domRef.current.clientWidth) setXOverflowed(true)
    if (domRef.current.scrollHeight > domRef.current.clientHeight) setYOverflowed(true)
  }, [])
  return { xOverflowed, yOverflowed }
}

/** usually it is used for easier debug,  */
/** but maybe use <Div insertNodeTop={<PropertiesDebugger>{{a:1}}</PropertiesDebugger>} /> is better */
function PropertiesDebugger({ targeObj, className }: { targeObj: Record<any, any>; className?: string }) {
  return <Div className={className}>{Object.entries(targeObj).map(([key, value]) => `${key}: ${value};`)}</Div>
}
