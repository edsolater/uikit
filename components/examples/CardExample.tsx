import Card from '../../uikit/Card'
import ExampleCard from './ExampleCard'
import ExampleGroup from './ExampleGroup'

/**
 * Button 的使用示例
 */
const CardExample = () => (
  <ExampleCard title='Card' category='uikit'>
    <ExampleGroup caption='basic example'>
      <Card className='w-[200px] h-[300px]' bg='linear-gradient(dodgerblue, skyblue)' />
    </ExampleGroup>
  </ExampleCard>
)

export default CardExample
