import { ComponentMeta, ComponentStory } from '@storybook/react'

import { useToggle } from '@edsolater/hookit'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Collapse, CollapseBody, CollapseFace } from '../components/Collapse'
import { Div } from '../components/Div'
import { Transition } from '../components/Transition'
import { icssRow, cssColors, cssShadow } from '../styles'

const storySettings = {
  component: Collapse,
  argTypes: {}
} as ComponentMeta<typeof Collapse>

const Template: ComponentStory<typeof Transition> = (props) => {
  return (
    <Div icss={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Collapse>
        <CollapseFace>
          {(open) => (
            <Card
              icss={[
                icssRow({ justify: 'space-between', items: 'center', gap: 32 }),
                { background: cssColors.cardBgDark, boxShadow: cssShadow.xl }
              ]}
            >
              <Div>Click to {open ? 'close' : 'open'} </Div>
              <Div>Collapse Face: {String(open)}</Div>
            </Card>
          )}
        </CollapseFace>
        <CollapseBody>
          <Card
            icss={[
              { display: 'flex', flexDirection: 'column', alignItems:'center', gap: 32 },
              { background: cssColors.cardBgDark, boxShadow: cssShadow.xl }
            ]}
          >
            <Div>Emily Carr</Div>
            <Div>Marcus Garza</Div>
            <Div>Isaiah Holmes</Div>
            <Div>Jane Jensen</Div>
            <Div>Philip Reeves</Div>
            <Div>Ida McCarthy</Div>
            <Div>Lida Patton</Div>
            <Div>Jon Perry</Div>
            <Div>Winnie Wilkerson</Div>
            <Div>Norman Myers</Div>
            <Div>Lucile Mason</Div>
            <Div>Calvin Gibbs</Div>
          </Card>
        </CollapseBody>
      </Collapse>
    </Div>
  )
}

export default storySettings

export const Primary = Template.bind({})
Primary.args = {}