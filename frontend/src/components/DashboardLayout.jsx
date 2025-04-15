import React from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  BookOpen, 
  Award, 
  User, 
  GraduationCap,
  Settings,
  LogOut
} from 'lucide-react'

const DashboardLayout = () => {
  const location = useLocation()
  
  const navItems = [
    { path: '/dashboard', icon: <LayoutDashboard />, label: 'Overview' },
    { path: '/dashboard/courses', icon: <BookOpen />, label: 'Courses' },
    { path: '/dashboard/my-learning', icon: <GraduationCap />, label: 'My Learning' },
    { path: '/dashboard/certificates', icon: <Award />, label: 'Certificates' },
    { path: '/dashboard/profile', icon: <User />, label: 'Profile' },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r">
        <div className="p-4">
          <h1 className="text-2xl font-bold text-purple-600">Skill Quest</h1>
        </div>
        <nav className="mt-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-2 text-gray-600 hover:bg-purple-50 hover:text-purple-600 ${
                location.pathname === item.path ? 'bg-purple-50 text-purple-600' : ''
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 w-64 p-4 border-t">
          <Link
            to="/dashboard/settings"
            className="flex items-center px-4 py-2 text-gray-600 hover:bg-purple-50 hover:text-purple-600"
          >
            <span className="mr-3"><Settings /></span>
            Settings
          </Link>
          <Link
            to="/logout"
            className="flex items-center px-4 py-2 text-gray-600 hover:bg-purple-50 hover:text-purple-600"
          >
            <span className="mr-3"><LogOut /></span>
            Logout
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout 