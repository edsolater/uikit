import { useLayoutEffect } from 'react'
import { Motion, MotionProps } from '../../components'
import { Div, DivProps } from '../../Div'
import { useDOM } from '../../hooks'
import { addEventListener, getSiblings } from '../../utils'
import { createPropPlugin } from '../createPlugin'
import { WrappedBy } from '../misc/WrappedBy'

export type WithFloatBgOptions = {
  floatBgProps?: DivProps
  MotionProps?: MotionProps
  defaultActiveItemIndex?: number
}

export const withFloatBg = createPropPlugin((oldProps) => (options?: WithFloatBgOptions) => {
  const [dom, setDOM] = useDOM()
  const [activeTab, setActiveTab] = useDOM()

  useLayoutEffect(() => {
    const siblings = getSiblings(dom)
    const subscriptions = siblings.map((el) =>
      addEventListener(el, 'click', ({ el }) => {
        setActiveTab(el)
      })
    )
    if (options?.defaultActiveItemIndex) siblings.at(options.defaultActiveItemIndex)?.click()
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
            zIndex: '-1',
            background: '#d1d3d6'
          }}
          className='Tabs-active-bg-panel'
          plugin={WrappedBy(Motion, options?.MotionProps)}
        ></Div>
        {oldProps.children}
      </>
    )
  }
})
