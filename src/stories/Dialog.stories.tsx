import { useToggle } from '@edsolater/hookit'
import { ComponentMeta, ComponentStory } from '@storybook/react'

import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Dialog } from '../components/Dialog'
import { Div } from '../components/Div'

const storySettings = {
  component: Dialog,
  argTypes: {
    themeColor: { control: 'color' }
  }
} as ComponentMeta<typeof Dialog>

const Template: ComponentStory<typeof Dialog> = (args) => {
  const [isShow, { toggle }] = useToggle()

  return (
    <Div icss={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Button onClick={toggle}> isShow: {String(isShow)} </Button>
      <Dialog {...args} />
    </Div>
  )
}

export default storySettings
export const Primary = Template.bind({})
Primary.args = {
  children: (
    <Card
      icss={{
        width: 200,
        height: 300
      }}
      bgimgSrc='linear-gradient(dodgerblue,skyblue)'
    >
      <Div>hello {'<Dialog>'}</Div>
    </Card>
  )
}
