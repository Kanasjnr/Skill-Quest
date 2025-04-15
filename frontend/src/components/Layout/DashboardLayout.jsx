import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

const DashboardLayout = () => {
  return (
    <div className="flex min-h-screen bg-white dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8 bg-slate-50 dark:bg-slate-900 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}

export default DashboardLayout 