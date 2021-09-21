import { ReactNode, useEffect, useRef, useState } from 'react'
import Div from './Div'

export default function GradientGrid({ children }: { children?: ReactNode }) {
  const [effectBox, setGridEffectBox] = useState<DOMRect | undefined>(undefined)
  const EffectBoxRef = useRef<HTMLDivElement>()

  const [containerBox, setContainerBox] = useState<DOMRect | undefined>(undefined)
  const containerRef = useRef<HTMLDivElement>()

  useEffect(() => {
    if (EffectBoxRef.current) {
      setGridEffectBox(EffectBoxRef.current.getBoundingClientRect())
    }
    if (containerRef.current) {
      setContainerBox(containerRef.current.getBoundingClientRect())
    }
  }, [])

  const cssLeft = `calc(var(--pointer-x) * 1px - ${effectBox?.left ?? 0} * 1px)`
  const cssTop = `calc(var(--pointer-y) * 1px - ${effectBox?.top ?? 0} * 1px)`
  // const cssLeft = `50%`
  // const cssTop = `50%`
  const effectOffsetWidth = 100
  return (
    <Div domRef={containerRef} className='w-full relative'>
      <Div
        domRef={EffectBoxRef}
        style={[
          {
            position: 'absolute',
            inset: `-${effectOffsetWidth}px`,
            contain: 'layout' /* avoid negative inset value which will result a scroll bar  */,
            background: `radial-gradient(circle at ${cssLeft} ${cssTop}, #fff, transparent 50px)` /* 如何处理衰减呢？ */,
            WebkitMaskImage: `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'>
              <rect 
                width='${containerBox?.width + effectOffsetWidth}' 
                height='${containerBox?.height + effectOffsetWidth}' 
                x='${effectOffsetWidth / 2}'
                y='${effectOffsetWidth / 2}' 
              />
            </svg>")`
          }
        ]}
      />
      <Div className='relative'>{children}</Div>
    </Div>
  )
}
