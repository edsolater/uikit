import React from 'react'
import { cssColors, cssShadow, icssRow } from '../../styles'
import { Div } from '../../uikit'

import Card from '../../uikit/Card'
import Collapse, { CollapseBody, CollapseFace } from '../../uikit/Collapse'
import ExampleCard from './ExampleCard'
import ExampleGroup from './ExampleGroup'

export default function CollapseExample() {
  return (
    <ExampleCard title='Collapse' category='uikit'>
      <ExampleGroup caption='basic example'>
        <Collapse>
          <CollapseFace>
            {(open) => (
              <Card
                icss={[
                  icssRow({ justify: 'space-between', items: 'center', gap: 32 }),
                  { background: cssColors.cardBgDark, boxShadow: cssShadow.xl }
                ]}
              >
                <Div>Collapse Face: {String(open)}</Div>
              </Card>
            )}
          </CollapseFace>
          <CollapseBody>
            <Card
              icss={[
                icssRow({ justify: 'space-between', items: 'center', gap: 32 }),
                { background: cssColors.cardBgDark, boxShadow: cssShadow.xl }
              ]}
            >
              hello world
            </Card>
          </CollapseBody>
        </Collapse>
      </ExampleGroup>
    </ExampleCard>
  )
}
