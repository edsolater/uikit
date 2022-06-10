import React from 'react'
import { cssColors, cssShadow, icssRow } from '../../styles'
import { Div } from '../../uikit'

import Card from '../../uikit/Card'
import ExampleCard from './ExampleCard'
import ExampleGroup from './ExampleGroup'
import SplitView from '../../uikit/SplitView'

export default function SplitViewExample() {
  return (
    <ExampleCard title='SplitView' category='uikit' grid>
      <ExampleGroup caption='row 2 item'>
        <SplitView icss={{ width: '100%' }}>
          <Card
            noDefaultStyle
            icss={[
              { display: 'grid', placeContent: 'center' },
              { width: 300, height: 500, padding: '16px 32px' },
              { background: cssColors.cardBg2, boxShadow: cssShadow.xl }
            ]}
          >
            <Div icss={{ textAlign: 'center', color: cssColors.textColor, fontSize: '32px' }}>A</Div>
          </Card>
          <Card
            noDefaultStyle
            icss={[
              { padding: '16px 32px' },
              icssRow({ justify: 'space-between', items: 'center', gap: 32 }),
              { background: cssColors.cardBgDark, boxShadow: cssShadow.xl }
            ]}
          >
            hello world
          </Card>
        </SplitView>
      </ExampleGroup>

      <ExampleGroup caption='row 3 item'>
        <SplitView icss={{ width: '100%' }}>
          <Card
            noDefaultStyle
            icss={[
              { display: 'grid', placeContent: 'center' },
              { padding: '16px 32px' },
              { background: cssColors.cardBg2, boxShadow: cssShadow.xl }
            ]}
          >
            <Div icss={{ textAlign: 'center', color: cssColors.textColor, fontSize: '32px' }}>A</Div>
          </Card>
          <Card
            tag={SplitView.takeSlipRestTag}
            noDefaultStyle
            icss={[
              { padding: '16px 32px' },
              icssRow({ justify: 'space-between', items: 'center', gap: 32 }),
              { background: cssColors.cardBgDark, boxShadow: cssShadow.xl }
            ]}
          >
            hello world
          </Card>
          <Card
            noDefaultStyle
            icss={[
              { order: 0 },
              { padding: '16px 32px' },
              icssRow({ justify: 'space-between', items: 'center', gap: 32 }),
              { background: cssColors.cardBgDark, boxShadow: cssShadow.xl }
            ]}
          >
            foo
          </Card>
        </SplitView>
      </ExampleGroup>

      <ExampleGroup caption='col 2 item'>
        <SplitView dir='y' icss={{ width: '100%' }}>
          <Card
            noDefaultStyle
            icss={[
              { display: 'grid', placeContent: 'center' },
              { height: 500, padding: '16px 32px' },
              { background: cssColors.cardBg2, boxShadow: cssShadow.xl }
            ]}
          >
            <Div icss={{ textAlign: 'center', color: cssColors.textColor, fontSize: '32px' }}>A</Div>
          </Card>
          <Card
            noDefaultStyle
            icss={[
              { padding: '16px 32px' },
              icssRow({ justify: 'space-between', items: 'center', gap: 32 }),
              { background: cssColors.cardBgDark, boxShadow: cssShadow.xl }
            ]}
          >
            hello world
          </Card>
        </SplitView>
      </ExampleGroup>

      <ExampleGroup caption='col 3 item'>
        <SplitView dir='y' icss={{ width: '100%' }}>
          <Card
            noDefaultStyle
            icss={[
              { display: 'grid', placeContent: 'center' },
              { padding: '16px 32px' },
              { background: cssColors.cardBg2, boxShadow: cssShadow.xl }
            ]}
          >
            <Div icss={{ textAlign: 'center', color: cssColors.textColor, fontSize: '32px' }}>A</Div>
          </Card>
          <Card
            tag={SplitView.takeSlipRestTag}
            noDefaultStyle
            icss={[
              { padding: '16px 32px' },
              icssRow({ justify: 'space-between', items: 'center', gap: 32 }),
              { background: cssColors.cardBgDark, boxShadow: cssShadow.xl }
            ]}
          >
            hello world
          </Card>
          <Card
            noDefaultStyle
            icss={[
              { order: 0 },
              { padding: '16px 32px' },
              icssRow({ justify: 'space-between', items: 'center', gap: 32 }),
              { background: cssColors.cardBgDark, boxShadow: cssShadow.xl }
            ]}
          >
            foo
          </Card>
        </SplitView>
      </ExampleGroup>
    </ExampleCard>
  )
}
