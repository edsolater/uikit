import { ComponentMeta, ComponentStory } from '@storybook/react'

import { Card } from '../components/Card'
import { Div } from '../components/Div/Div'
import { DivProps } from "../components/Div/type"
import SplitView from '../components/SplitView'
import { cssColors, cssShadow, icssRow } from '../styles'

const storySettings = {
  component: SplitView,
  argTypes: {}
} as ComponentMeta<typeof SplitView>

const Template: ComponentStory<typeof SplitView> = (props) => {
  return (
    <Div icss={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', height: 600, resize:'both', overflow:'hidden' }}>
      <SplitView {...props}></SplitView>
    </Div>
  )
}

const ExampleContentCard1 = ({ text, ...divProps }: { text: string } & DivProps) => (
  <Card
    noDefaultStyle
    {...divProps}
    icss={[
      { padding: '16px 32px' },
      { display: 'grid', placeContent: 'center' },
      { background: cssColors.cardBg2, boxShadow: cssShadow.xl },
      divProps.icss
    ]}
  >
    <Div icss={{ textAlign: 'center', color: cssColors.textColor, fontSize: '32px' }}>{text}</Div>
  </Card>
)

const ExampleContentCard2 = ({ text, ...divProps }: { text: string } & DivProps) => (
  <Card
    noDefaultStyle
    {...divProps}
    icss={[
      { padding: '16px 32px' },
      icssRow({ justify: 'space-between', items: 'center', gap: 32 }),
      { background: cssColors.cardBgDark, boxShadow: cssShadow.xl },
      divProps.icss
    ]}
  >
    <Div icss={{ textAlign: 'center', color: cssColors.textColor, fontSize: '16px' }}>{text}</Div>
  </Card>
)
export default storySettings
export const XRow = Template.bind({})
XRow.args = {
  dir: 'row',
  children: (
    <>
      <ExampleContentCard1 text='A' />
      <ExampleContentCard2 text='hello world' />
    </>
  )
}
export const XRow3slot = Template.bind({})
XRow3slot.args = {
  dir: 'row',
  children: [
    <ExampleContentCard1 text='A' />,
    <ExampleContentCard2 tag={SplitView.flexibleView} text='hello world' />,
    <ExampleContentCard2 text='third' />
  ]
}
export const YCol = Template.bind({})
YCol.args = {
  dir: 'col',
  children: (
    <>
      <ExampleContentCard1 text='A' />
      <ExampleContentCard2 text='hello world' />
    </>
  )
}
export const YCol3slot = Template.bind({})
YCol3slot.args = {
  dir: 'col',
  children: [
    <ExampleContentCard1 text='A' />,
    <ExampleContentCard2 tag={SplitView.flexibleView} text='hello world' />,
    <ExampleContentCard2 text='third' />
  ]
}
