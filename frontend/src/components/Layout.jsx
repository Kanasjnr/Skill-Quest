import React from 'react'
import Navbar from './Navbar'
import Footer from './Footer'
import Sidebar from './Layout/Sidebar'

const Layout = ({children}) => {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Navbar />
        <main className="flex-grow p-6">{children}</main>
        <Footer />
      </div>
    </div>
  )
}

export default Layout