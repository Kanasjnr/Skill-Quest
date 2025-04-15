import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '../Navbar'
import Footer from '../Footer'

const HomeLayout = () => {
  return (
    <div 
      className="flex flex-col min-h-screen bg-[#130F26]"
      style={{ 
        backgroundImage: "url('/LooperBG.png')", 
        backgroundPosition: "top center",
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat"
      }}
    >
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default HomeLayout 