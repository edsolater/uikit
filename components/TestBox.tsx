import { changeCase } from '@edsolater/fnkit'
import Div from './Div'

export default function TestBox() {
  return (
    <Div className='w-[300px] h-[300px] bg-blue-500'>
      {changeCase('hello-world', { to: 'PascalCase' })}
    </Div>
  )
}
