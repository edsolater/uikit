import type { NextPage } from 'next'
import Link from 'next/link'
import Div from '../components/Div'

const Home: NextPage = () => (
  <Div className='w-screen h-screen grid place-items-center'>
    <Link href='/examples'>see all base component's example</Link>
  </Div>
)

export default Home
