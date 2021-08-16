import type { NextPage } from 'next'
import Link from '../components/Link'
import Div from '../components/Div'

const Home: NextPage = () => (
  <Div className='w-screen h-screen grid place-items-center'>
    <Link to='/examples'>see all base component's example</Link>
  </Div>
)

export default Home
