import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import Button from './Button'

const storySettings = {
  title: 'Example/Button',
  component: Button,
  argTypes: {
    themeColor: { control: 'color' }
  }
} as ComponentMeta<typeof Button>

const Template: ComponentStory<typeof Button> = (args) => <Button {...args} />

export default storySettings
export const Primary = Template.bind({})
Primary.args = {
  variant: 'solid',
  children: 'Button'
}
