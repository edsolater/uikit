import { ComponentMeta, ComponentStory } from '@storybook/react'

import { Card } from '../components/Card'
import { List } from '../components/List'

const storySettings = {
  component: List,
  argTypes: {}
} as ComponentMeta<typeof List>

const exampleListData = [
  { name: 'hello', id: 0 },
  { name: 'world', id: 1 },
  { name: 'foo', id: 2 },
  { name: 'bar', id: 3 }
]

const Template: ComponentStory<typeof List> = (props) => {
  return (
    <List
      {...props}
      sourceData={exampleListData}
      renderItem={(item) => (
        <Card icss={{ height: 64 }} bgimgSrc='linear-gradient(dodgerblue,skyblue)'>
          {item.name} {'<List>'}
        </Card>
      )}
    ></List>
  )
}

export default storySettings

export const Basic = Template.bind({})
Basic.args = {}
