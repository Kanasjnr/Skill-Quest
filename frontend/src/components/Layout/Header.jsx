"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { Bell, Search, Menu, X, Moon, Sun, Wallet } from "lucide-react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import { useTheme } from "../theme-provider"
import { Badge } from "../ui/badge"

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>

          <div className="hidden md:block flex-1 max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input type="search" placeholder="Search courses..." className="pl-10" />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Wallet className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">250 LEARN</span>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-purple-600">
                    3
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="p-2 font-medium border-b">Notifications</div>
                <DropdownMenuItem className="p-3 cursor-pointer">
                  <div>
                    <p className="text-sm font-medium">Course Completed</p>
                    <p className="text-xs text-gray-500">You've earned a certificate for "Blockchain Basics"</p>
                    <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="p-3 cursor-pointer">
                  <div>
                    <p className="text-sm font-medium">XP Milestone</p>
                    <p className="text-xs text-gray-500">You've reached 1,000 XP! Level up!</p>
                    <p className="text-xs text-gray-400 mt-1">Yesterday</p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className="p-3 cursor-pointer">
                  <div>
                    <p className="text-sm font-medium">New Course Available</p>
                    <p className="text-xs text-gray-500">Check out "Advanced Smart Contracts"</p>
                    <p className="text-xs text-gray-400 mt-1">3 days ago</p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700"
            >
              Dashboard
            </Link>
            <Link
              to="/courses"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Explore Courses
            </Link>
            <Link
              to="/my-learning"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              My Learning
            </Link>
            <Link
              to="/certificates"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Certificates
            </Link>
            <Link
              to="/profile"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Profile
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
            <div className="px-5 flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                  JS
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800 dark:text-white">John Smith</div>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Level 12 • 1,250 XP</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
