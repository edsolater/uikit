import { ComponentMeta, ComponentStory } from '@storybook/react'
import { Button } from '../components/Button'

import { Card } from '../components/Card'
import { Popover, PopoverButton, PopoverPanel } from '../components/Popover/Popover'

const storySettings = {
  component: Popover,
  argTypes: {}
} as ComponentMeta<typeof Popover>

const Template: ComponentStory<typeof Popover> = (props) => {
  return (
    <Popover placement='bottom' {...props}>
      <PopoverButton childIsRoot>
        <Button>Click to pop</Button>
      </PopoverButton>
      <PopoverPanel>
        <Card
          icss={{
            width: 200,
            height: 300
          }}
          bgimgSrc='linear-gradient(dodgerblue,skyblue)'
        >
          hello {'<Popover>'}
        </Card>
      </PopoverPanel>
    </Popover>
  )
}

export default storySettings

export const Basic = Template.bind({})
Basic.args = {}
