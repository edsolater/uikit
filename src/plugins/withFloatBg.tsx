import { useEffect } from 'react'
import { Motion, MotionProps } from '../components'
import { Div, DivProps } from '../Div'
import { useDOM } from '../hooks'
import { addEventListener, getSiblings } from '../utils'
import { createNormalPlugin } from './createPlugin'
import { WrappedBy } from './WrappedBy'

export const withFloatBg = createNormalPlugin((oldProps) => (options?: { floatBgProps?: DivProps }) => {
  const [dom, setDOM] = useDOM()
  const [activeTab, setActiveTab] = useDOM()

  useEffect(() => {
    const subscriptions = getSiblings(dom).map((el) =>
      addEventListener(el, 'click', ({ el }) => {
        setActiveTab(el)
      })
    )
    return () => subscriptions.forEach((subscription) => subscription.cancel())
  }, [dom])

  return {
    children: (
      <>
        <Div
          shadowProps={options?.floatBgProps}
          domRef={setDOM}
          icss={{
            width: activeTab?.offsetWidth,
            height: activeTab?.offsetHeight,
            top: activeTab?.offsetTop,
            left: activeTab?.offsetLeft,
            position: 'absolute',
            background: '#d1d3d6'
          }}
          className='Tabs-active-bg-panel'
          plugins={WrappedBy(Motion)}
        ></Div>
        {oldProps.children}
      </>
    )
  }
})
