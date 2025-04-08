import React from 'react'
import Hero from '../components/homePage/Hero'
import KeyFeatures from '../components/HomePage/KeyFeatures'
import Benefit from '../components/HomePage/Benefit'

const Home = () => {
  return (
    <div className='bg-[#130F26]'>
       <Hero />
       <KeyFeatures />
       <Benefit />
    </div>
  )
}

export default Home