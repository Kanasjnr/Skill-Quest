import React from 'react'
import Hero from '../components/HomePage/Hero'
import KeyFeatures from '../components/HomePage/KeyFeatures'
import Benefit from '../components/HomePage/Benefit'

const Home = () => {
  return (
    <div className='min-h-screen bg-[#130F26]'>
      <div className='max-w-7xl mx-auto'>
        <Hero />
        <div className='px-4'>
          <KeyFeatures />
          <Benefit />
        </div>
      </div>
    </div>
  )
}

export default Home