"use client"

import { Link, useLocation } from "react-router-dom"
import { cn } from "../../lib/utils"
import {
  Home,
  BookOpen,
  GraduationCap,
  Award,
  User,
  ChevronDown,
  ChevronRight,
  BarChart,
  PlusCircle,
  Settings,
  LogOut,
} from "lucide-react"
import { useState } from "react"
import { Button } from "../ui/button"
import { ScrollArea } from "../ui/scroll-area"

const Sidebar = () => {
  const location = useLocation()
  const [instructorOpen, setInstructorOpen] = useState(false)

  const isActive = (path) => location.pathname.startsWith(path)

  const activeClasses = "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 font-semibold border-l-2 border-sky-500"
  const inactiveClasses = "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50 font-semibold border-l-2 border-transparent"

  const iconStrokeWidth = 1.75

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: <Home className="h-5 w-5" strokeWidth={iconStrokeWidth} /> },
    { path: "/courses", label: "Explore Courses", icon: <BookOpen className="h-5 w-5" strokeWidth={iconStrokeWidth} /> },
    { path: "/my-learning", label: "My Learning", icon: <GraduationCap className="h-5 w-5" strokeWidth={iconStrokeWidth} /> },
    { path: "/certificates", label: "Certificates", icon: <Award className="h-5 w-5" strokeWidth={iconStrokeWidth} /> },
    { path: "/profile", label: "Profile", icon: <User className="h-5 w-5" strokeWidth={iconStrokeWidth} /> },
  ]

  const instructorItems = [
    { path: "/instructor", label: "Dashboard", icon: <BarChart className="h-5 w-5" strokeWidth={iconStrokeWidth} /> },
    { path: "/instructor/create-course", label: "Create Course", icon: <PlusCircle className="h-5 w-5" strokeWidth={iconStrokeWidth} /> },
  ]

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:flex-shrink-0 h-screen">
      <div className="flex flex-col flex-grow pt-5 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/50">
        <div className="flex items-center justify-center h-16 mb-6 px-4">
          <Link to="/dashboard" className="flex items-center">
            <GraduationCap className="h-8 w-8 text-sky-600 dark:text-sky-400" strokeWidth={iconStrokeWidth} />
            <span className="ml-3 text-xl font-bold text-slate-900 dark:text-white">SkillQuest</span>
          </Link>
        </div>
        <ScrollArea className="flex-1 px-4 py-4">
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center px-4 py-3 text-sm rounded-lg transition-colors duration-150",
                  location.pathname === item.path ? activeClasses : inactiveClasses
                )}
              >
                {item.icon}
                <span className="ml-4">{item.label}</span>
              </Link>
            ))}

            <div className="pt-5">
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-between flex items-center px-4 py-3 text-sm rounded-lg transition-colors duration-150",
                  isActive('/instructor') ? activeClasses : inactiveClasses
                )}
                onClick={() => setInstructorOpen(!instructorOpen)}
              >
                <div className="flex items-center">
                  <GraduationCap className="h-5 w-5" strokeWidth={iconStrokeWidth} />
                  <span className="ml-4">Instructor</span>
                </div>
                {instructorOpen ? <ChevronDown className="h-4 w-4" strokeWidth={iconStrokeWidth} /> : <ChevronRight className="h-4 w-4" strokeWidth={iconStrokeWidth} />}
              </Button>

              {instructorOpen && (
                <div className="pl-6 pt-2 space-y-2 mt-1">
                  {instructorItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "flex items-center px-4 py-3 text-sm rounded-lg transition-colors duration-150",
                        location.pathname === item.path ? activeClasses : inactiveClasses
                      )}
                    >
                      {item.icon}
                      <span className="ml-4">{item.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>
        </ScrollArea>

        <div className="p-5 border-t border-slate-200 dark:border-slate-700/50 space-y-3 mt-auto">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-sky-500 flex items-center justify-center text-white font-bold">
                JS
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">John Smith</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Level 12 • 1,250 XP</p>
            </div>
          </div>
          <Link
            to="/settings"
            className={cn("flex items-center px-4 py-3 text-sm rounded-lg w-full transition-colors duration-150", inactiveClasses)}
          >
            <Settings className="h-5 w-5 mr-4" strokeWidth={iconStrokeWidth} />
            Settings
          </Link>
          <button 
            onClick={() => alert('Logout clicked')}
            className={cn("w-full flex items-center px-4 py-3 text-sm rounded-lg transition-colors duration-150", inactiveClasses)}
          >
            <LogOut className="h-5 w-5 mr-4" strokeWidth={iconStrokeWidth} />
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
