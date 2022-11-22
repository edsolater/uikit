import { ComponentMeta, ComponentStory } from '@storybook/react'

import { Button } from '../components/Button'
import { Div } from '../Div/Div'

const storySettings = {
  component: Button,
  argTypes: {
    themeColor: { control: 'color' }
  }
} as ComponentMeta<typeof Button>

const Template: ComponentStory<typeof Button> = (args) => (
  <Div icss={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
    <Button {...args} />
  </Div>
)

export default storySettings
export const Primary = Template.bind({})
Primary.args = {
  variant: 'solid',
  children: 'Button'
}
