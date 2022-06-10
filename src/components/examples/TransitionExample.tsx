import useToggle from '../../hooks/useToggle'
import Button from '../../uikit/Button'
import Card from '../../uikit/Card'
import Div from '../../uikit/Div'
import FadeIn from '../../uikit/FadeIn'
import ExampleCard from './ExampleCard'
import ExampleGroup from './ExampleGroup'

/**
 * Button 的使用示例
 */
const TransitionExample = () => {
  const [isShow, { toggle }] = useToggle()
  return (
    <ExampleCard title='Transition' category='uikit' subCategory='headless'>
      <Div>Click the button to see demo</Div>
      <Button onClick={toggle}> isShow: {String(isShow)} </Button>
      {/* <ExampleGroup caption='Transition core example'>
        <Transition
          show={isShow}
          presets={[transitionPresetFadeInOut]}
          onBeforeEnter={() => {
            console.log('on before enter')
          }}
          onAfterEnter={() => {
            console.log('on after enter')
          }}
          onBeforeLeave={() => {
            console.log('on before leave')
          }}
          onAfterLeave={() => {
            console.log('on after leave')
          }}
        >
          {({ phase }) => (
            <Card className='w-[200px] h-[300px] translate-x-0 ' bgimgSrc='linear-gradient(dodgerblue,skyblue)'>
              <Div>phase: {phase}</Div>
            </Card>
          )}
        </Transition>
      </ExampleGroup> */}

      <ExampleGroup caption='fadein'>
        <FadeIn show={isShow}>
          <Card className='w-[200px] h-[300px] ' bgimgSrc='linear-gradient(dodgerblue,skyblue)'>
            fadein
          </Card>
        </FadeIn>
      </ExampleGroup>
    </ExampleCard>
  )
}

export default TransitionExample
