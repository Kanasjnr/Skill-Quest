"use client"

import { useState } from "react"
import { Search, Filter, ChevronDown, X } from "lucide-react"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Badge } from "../components/ui/badge"
import CourseCard from "../components/courses/CourseCard"

const Courses = () => {
  const [selectedTags, setSelectedTags] = useState([])

  // Mock data
  const courses = [
    {
      id: 1,
      title: "Blockchain Fundamentals",
      instructor: "Alex Johnson",
      progress: 0,
      image: "/placeholder.svg?height=200&width=300",
      xpReward: 500,
      tokenReward: 50,
      tags: ["Blockchain", "Beginner"],
      price: 100,
    },
    {
      id: 2,
      title: "Smart Contract Development",
      instructor: "Maria Garcia",
      progress: 0,
      image: "/placeholder.svg?height=200&width=300",
      xpReward: 750,
      tokenReward: 100,
      tags: ["Smart Contracts", "Intermediate"],
      price: 200,
    },
    {
      id: 3,
      title: "DeFi Protocols",
      instructor: "David Lee",
      progress: 0,
      image: "/placeholder.svg?height=200&width=300",
      xpReward: 800,
      tokenReward: 150,
      tags: ["DeFi", "Advanced"],
      price: 250,
    },
    {
      id: 4,
      title: "NFT Creation and Trading",
      instructor: "Emma Wilson",
      progress: 0,
      image: "/placeholder.svg?height=200&width=300",
      xpReward: 600,
      tokenReward: 75,
      tags: ["NFT", "Intermediate"],
      price: 150,
    },
  ]

  const allTags = ["Blockchain", "Smart Contracts", "DeFi", "NFT", "Beginner", "Intermediate", "Advanced"]

  const toggleTag = (tag) => {
    setSelectedTags(currentTags => 
      currentTags.includes(tag)
        ? currentTags.filter((t) => t !== tag)
        : [...currentTags, tag]
    );
  }

  const filteredCourses =
    selectedTags.length > 0
      ? courses.filter((course) => course.tags.some((tag) => selectedTags.includes(tag)))
      : courses

  // Consistent Icon Color
  const iconColor = "text-slate-400 dark:text-slate-500";
  const buttonIconColor = "text-slate-500 dark:text-slate-400";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Explore Courses</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${iconColor}`} />
          <Input 
            placeholder="Search courses..." 
            className="pl-10 bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 focus-visible:ring-sky-500" 
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="flex items-center gap-2 border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-700/50"
            >
              <Filter className={`h-4 w-4 ${buttonIconColor}`} />
              <span className="text-slate-700 dark:text-slate-300">Filter</span>
              <ChevronDown className={`h-4 w-4 ${buttonIconColor}`} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            align="end" 
            className="w-56 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg"
          >
            {allTags.map((tag) => (
              <DropdownMenuCheckboxItem
                key={tag}
                checked={selectedTags.includes(tag)}
                onCheckedChange={() => toggleTag(tag)}
                className="text-slate-700 dark:text-slate-300 focus:bg-sky-100 dark:focus:bg-sky-900/50 focus:text-sky-700 dark:focus:text-sky-300"
              >
                {tag}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="flex items-center gap-1.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
            >
              {tag}
              <button onClick={() => toggleTag(tag)} className="ml-1 appearance-none border-none bg-transparent p-0 cursor-pointer text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button variant="link" className="text-sm h-auto p-0 text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300" onClick={() => setSelectedTags([])}>
            Clear all
          </Button>
        </div>
      )}

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <TabsTrigger value="all" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm data-[state=active]:text-sky-700 dark:data-[state=active]:text-sky-300 text-slate-600 dark:text-slate-400">All Courses</TabsTrigger>
          <TabsTrigger value="popular" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm data-[state=active]:text-sky-700 dark:data-[state=active]:text-sky-300 text-slate-600 dark:text-slate-400">Popular</TabsTrigger>
          <TabsTrigger value="new" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm data-[state=active]:text-sky-700 dark:data-[state=active]:text-sky-300 text-slate-600 dark:text-slate-400">New</TabsTrigger>
          <TabsTrigger value="free" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm data-[state=active]:text-sky-700 dark:data-[state=active]:text-sky-300 text-slate-600 dark:text-slate-400">Free</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))
            ) : (
              <p className="text-slate-500 dark:text-slate-400 col-span-full text-center">No courses match the selected filters.</p>
            )}
          </div>
        </TabsContent>
        <TabsContent value="popular" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCourses.slice(0, 4).map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="new" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
             {filteredCourses.slice(2, 6).map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="free" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredCourses.filter((course) => course.price === 0).length > 0 ? (
              filteredCourses
                .filter((course) => course.price === 0)
                .map((course) => <CourseCard key={course.id} course={course} />)
            ) : (
              <p className="text-slate-500 dark:text-slate-400 col-span-full text-center">No free courses available at the moment.</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Courses
