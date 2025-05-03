"use client"

import { Link, useLocation } from "react-router-dom"
import { cn } from "../../lib/utils"
import {
  Home,
  BookOpen,
  GraduationCap,
  Award,
  User,
  BarChart,
  PlusCircle,
  Settings,
  LogOut,
  DollarSign,
} from "lucide-react"
import { Button } from "../ui/button"
import { ScrollArea } from "../ui/scroll-area"
import useSkillQuestUser from "../../hooks/useSkillQuestUser"
import useSkillQuestInstructor from "../../hooks/useSkillQuestInstructor"

const Sidebar = () => {
  const location = useLocation()
  const { userData, loading: userLoading } = useSkillQuestUser()
  const { isRegistered: isInstructor } = useSkillQuestInstructor()

  const activeClasses = "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300 font-bold border-l-2 border-sky-500"
  const inactiveClasses = "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700/50 font-bold border-l-2 border-transparent"

  const iconStrokeWidth = 2

  const studentNavItems = [
    { path: "/dashboard", label: "Student Dashboard", icon: <Home className="h-6 w-6" strokeWidth={iconStrokeWidth} /> },
    { path: "/courses", label: "Explore Courses", icon: <BookOpen className="h-6 w-6" strokeWidth={iconStrokeWidth} /> },
    { path: "/my-learning", label: "My Learning", icon: <GraduationCap className="h-6 w-6" strokeWidth={iconStrokeWidth} /> },
    { path: "/certificates", label: "Certificates", icon: <Award className="h-6 w-6" strokeWidth={iconStrokeWidth} /> },
    { path: "/profile", label: "Profile", icon: <User className="h-6 w-6" strokeWidth={iconStrokeWidth} /> },
  ]

  const instructorNavItems = [
    { path: "/instructor", label: "Instructor Dashboard", icon: <BarChart className="h-6 w-6" strokeWidth={iconStrokeWidth} /> },
    { path: "/instructor/create-course", label: "Create Course", icon: <PlusCircle className="h-6 w-6" strokeWidth={iconStrokeWidth} /> },
    { path: "/instructor/courses", label: "My Courses", icon: <BookOpen className="h-6 w-6" strokeWidth={iconStrokeWidth} /> },
    { path: "/instructor/analytics", label: "Analytics", icon: <BarChart className="h-6 w-6" strokeWidth={iconStrokeWidth} /> },
    { path: "/instructor/earnings", label: "Earnings", icon: <DollarSign className="h-6 w-6" strokeWidth={iconStrokeWidth} /> },
    { path: "/instructor/profile", label: "Profile", icon: <User className="h-6 w-6" strokeWidth={iconStrokeWidth} /> },
  ]

  // Calculate user level and XP
  const calculateLevel = (xp) => {
    const xpValue = Number(xp || 0)
    return Math.floor(xpValue / 100) + 1
  }

  return (
    <div className="hidden md:flex md:w-72 md:flex-col md:flex-shrink-0 h-screen fixed left-0 top-0">
      <div className="flex flex-col flex-grow pt-5 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700/50 h-full">
        <div className="flex items-center justify-center h-20 mb-8 px-4">
          <Link to={isInstructor ? "/instructor" : "/dashboard"} className="flex items-center">
            <GraduationCap className="h-10 w-10 text-sky-600 dark:text-sky-400" strokeWidth={iconStrokeWidth} />
            <span className="ml-4 text-2xl font-bold text-slate-900 dark:text-white">SkillQuest</span>
          </Link>
        </div>
        <ScrollArea className="flex-1 px-4 py-4">
          <nav className="space-y-4">
            {/* Show navigation based on user role */}
            {isInstructor ? (
              instructorNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center px-4 py-4 text-base rounded-lg transition-colors duration-150",
                    location.pathname === item.path ? activeClasses : inactiveClasses
                  )}
                >
                  {item.icon}
                  <span className="ml-4">{item.label}</span>
                </Link>
              ))
            ) : (
              studentNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center px-4 py-4 text-base rounded-lg transition-colors duration-150",
                    location.pathname === item.path ? activeClasses : inactiveClasses
                  )}
                >
                  {item.icon}
                  <span className="ml-4">{item.label}</span>
                </Link>
              ))
            )}
          </nav>
        </ScrollArea>

        <div className="p-6 border-t border-slate-200 dark:border-slate-700/50 space-y-4 mt-auto">
          <div className="flex items-center mb-6">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 rounded-full bg-sky-500 flex items-center justify-center text-white font-bold text-lg">
                {userData?.name ? userData.name.charAt(0).toUpperCase() : "?"}
              </div>
            </div>
            <div className="ml-4">
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {userLoading ? "Loading..." : userData?.name || "Guest User"}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {isInstructor ? "Instructor" : "Student"} • Level {calculateLevel(userData?.xp)} • {userData?.xp || 0} XP
              </p>
            </div>
          </div>
          <Link
            to="/settings"
            className={cn("flex items-center px-4 py-4 text-base rounded-lg w-full transition-colors duration-150", inactiveClasses)}
          >
            <Settings className="h-6 w-6 mr-4" strokeWidth={iconStrokeWidth} />
            Settings
          </Link>
          <button 
            onClick={() => alert('Logout clicked')}
            className={cn("w-full flex items-center px-4 py-4 text-base rounded-lg transition-colors duration-150", inactiveClasses)}
          >
            <LogOut className="h-6 w-6 mr-4" strokeWidth={iconStrokeWidth} />
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
