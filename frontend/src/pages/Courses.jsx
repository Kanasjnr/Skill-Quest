"use client"

import { useState, useEffect } from "react"
import { Search, Filter, ChevronDown, X, SlidersHorizontal, BookOpen } from 'lucide-react'
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "../components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Badge } from "../components/ui/badge"
import { Slider } from "../components/ui/slider"
import { ScrollArea } from "../components/ui/scroll-area"
import CourseCard from "../components/courses/CourseCard"
import useSkillQuestCourses from "../hooks/useSkillQuestCourses"
import useSkillQuestSearch from "../hooks/useSkillQuestSearch"
import useSkillQuestEnrollment from "../hooks/useSkillQuestEnrollment"
import LoadingSpinner from "../components/LoadingSpinner"

const Courses = () => {
  const [selectedTags, setSelectedTags] = useState([])
  const [searchQuery, setSearchQuery] = useState("")
  const [priceRange, setPriceRange] = useState([0, 1000])
  const [sortOption, setSortOption] = useState("newest")
  const [currentPage, setCurrentPage] = useState(1)
  const [coursesPerPage] = useState(12)
  
  const { courses, fetchCourses, loading: coursesLoading, error: coursesError } = useSkillQuestCourses()
  const { searchResults, searchCourses, filterByTag, allTags, fetchAllTags, loading: searchLoading } = useSkillQuestSearch()
  const { enrolledCourses, completedCourses, loading: enrollmentLoading } = useSkillQuestEnrollment()
  
  const [displayedCourses, setDisplayedCourses] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])
  const [maxPrice, setMaxPrice] = useState(1000)
  const [activeTab, setActiveTab] = useState("all")

  const loading = coursesLoading || searchLoading || enrollmentLoading
  const error = coursesError

  // Fetch courses and tags on mount
  useEffect(() => {
    fetchCourses()
    fetchAllTags()
  }, [fetchCourses, fetchAllTags])

  // Determine max price from all courses
  useEffect(() => {
    if (courses.length > 0) {
      const highestPrice = Math.max(...courses.map(course => Number(course.price) || 0))
      setMaxPrice(highestPrice > 0 ? highestPrice : 1000)
      setPriceRange([0, highestPrice > 0 ? highestPrice : 1000])
    }
  }, [courses])

  // Apply filters and search
  useEffect(() => {
    let result = [...courses]
    
    // Apply search query
    if (searchQuery.trim()) {
      result = searchResults
    }
    
    // Apply tag filters
    if (selectedTags.length > 0) {
      result = result.filter(course => 
        course.tags.some(tag => selectedTags.includes(tag))
      )
    }
    
    // Apply price filter
    result = result.filter(course => {
      const price = Number(course.price) || 0
      return price >= priceRange[0] && price <= priceRange[1]
    })
    
    // Apply tab filters
    if (activeTab === "enrolled") {
      const enrolledIds = enrolledCourses.map(c => Number(c.id))
      result = result.filter(course => enrolledIds.includes(Number(course.id)))
    } else if (activeTab === "completed") {
      const completedIds = completedCourses.map(c => Number(c.id))
      result = result.filter(course => completedIds.includes(Number(course.id)))
    } else if (activeTab === "free") {
      result = result.filter(course => Number(course.price) === 0)
    } else if (activeTab === "popular") {
      result = result.sort((a, b) => Number(b.enrollmentCount) - Number(a.enrollmentCount))
    } else if (activeTab === "new") {
      result = result.sort((a, b) => new Date(b.creationTime) - new Date(a.creationTime))
    }
    
    // Apply sorting
    if (sortOption === "newest") {
      result = result.sort((a, b) => new Date(b.creationTime) - new Date(a.creationTime))
    } else if (sortOption === "oldest") {
      result = result.sort((a, b) => new Date(a.creationTime) - new Date(b.creationTime))
    } else if (sortOption === "price-low") {
      result = result.sort((a, b) => Number(a.price) - Number(b.price))
    } else if (sortOption === "price-high") {
      result = result.sort((a, b) => Number(b.price) - Number(a.price))
    } else if (sortOption === "popular") {
      result = result.sort((a, b) => Number(b.enrollmentCount) - Number(a.enrollmentCount))
    } else if (sortOption === "completion") {
      result = result.sort((a, b) => Number(b.completionCount) - Number(a.completionCount))
    }
    
    setFilteredCourses(result)
  }, [
    courses, 
    searchResults, 
    searchQuery, 
    selectedTags, 
    priceRange, 
    sortOption, 
    activeTab,
    enrolledCourses,
    completedCourses
  ])

  // Pagination
  useEffect(() => {
    const indexOfLastCourse = currentPage * coursesPerPage
    const indexOfFirstCourse = indexOfLastCourse - coursesPerPage
    setDisplayedCourses(filteredCourses.slice(indexOfFirstCourse, indexOfLastCourse))
  }, [filteredCourses, currentPage, coursesPerPage])

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedTags, priceRange, sortOption, activeTab])

  const toggleTag = (tag) => {
    setSelectedTags(currentTags =>
      currentTags.includes(tag) 
        ? currentTags.filter(t => t !== tag) 
        : [...currentTags, tag]
    )
  }

  const handleSearch = (e) => {
    const query = e.target.value
    setSearchQuery(query)
    if (query.trim()) {
      searchCourses(query)
    }
  }

  const handleTabChange = (value) => {
    setActiveTab(value)
  }

  const handlePriceChange = (value) => {
    setPriceRange(value)
  }

  const handleSortChange = (value) => {
    setSortOption(value)
  }

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber)
  }

  // Calculate pagination
  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage)
  const pageNumbers = []
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i)
  }

  // Consistent Icon Color
  const iconColor = "text-slate-400 dark:text-slate-500"
  const buttonIconColor = "text-slate-500 dark:text-slate-400"

  if (loading) {
    return <LoadingSpinner message="Loading courses..." />
  }

  if (error) {
    return <div className="text-red-500">Error loading courses: {error}</div>
  }

  // Enhance the course cards with enrollment data
  const enhancedDisplayedCourses = displayedCourses.map(course => {
    const enrolledCourse = enrolledCourses.find(c => Number(c.id) === Number(course.id))
    const isCompleted = completedCourses.some(c => Number(c.id) === Number(course.id))
    
    return {
      ...course,
      progress: enrolledCourse ? enrolledCourse.progress : undefined,
      isEnrolled: !!enrolledCourse,
      isCompleted
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Explore Courses</h1>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              >
                <SlidersHorizontal className={`h-4 w-4 ${buttonIconColor}`} />
                <span className="text-slate-700 dark:text-slate-300">Sort</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg"
            >
              <DropdownMenuLabel>Sort By</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={sortOption} onValueChange={handleSortChange}>
                <DropdownMenuRadioItem value="newest">Newest First</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="oldest">Oldest First</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="price-low">Price: Low to High</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="price-high">Price: High to Low</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="popular">Most Popular</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="completion">Highest Completion Rate</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${iconColor}`} />
          <Input
            placeholder="Search courses..."
            className="pl-10 bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 focus-visible:ring-sky-500"
            value={searchQuery}
            onChange={handleSearch}
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
            className="w-72 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg"
          >
            <DropdownMenuLabel>Filter Courses</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuGroup>
              <div className="px-2 py-2">
                <h4 className="mb-2 text-sm font-medium">Price Range</h4>
                <div className="px-2">
                  <Slider
                    defaultValue={priceRange}
                    min={0}
                    max={maxPrice}
                    step={1}
                    value={priceRange}
                    onValueChange={handlePriceChange}
                    className="mb-4"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{priceRange[0]} LEARN</span>
                    <span>{priceRange[1]} LEARN</span>
                  </div>
                </div>
              </div>
            </DropdownMenuGroup>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuGroup>
              <div className="px-2 py-2">
                <h4 className="mb-2 text-sm font-medium">Categories</h4>
                <ScrollArea className="h-60">
                  <div className="space-y-1">
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
                  </div>
                </ScrollArea>
              </div>
            </DropdownMenuGroup>
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
              <button
                onClick={() => toggleTag(tag)}
                className="ml-1 appearance-none border-none bg-transparent p-0 cursor-pointer text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <Button
            variant="link"
            className="text-sm h-auto p-0 text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
            onClick={() => setSelectedTags([])}
          >
            Clear all
          </Button>
        </div>
      )}

      <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm data-[state=active]:text-sky-700 dark:data-[state=active]:text-sky-300 text-slate-600 dark:text-slate-400"
          >
            All Courses
          </TabsTrigger>
          <TabsTrigger
            value="popular"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm data-[state=active]:text-sky-700 dark:data-[state=active]:text-sky-300 text-slate-600 dark:text-slate-400"
          >
            Popular
          </TabsTrigger>
          <TabsTrigger
            value="new"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm data-[state=active]:text-sky-700 dark:data-[state=active]:text-sky-300 text-slate-600 dark:text-slate-400"
          >
            New
          </TabsTrigger>
          <TabsTrigger
            value="free"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm data-[state=active]:text-sky-700 dark:data-[state=active]:text-sky-300 text-slate-600 dark:text-slate-400"
          >
            Free
          </TabsTrigger>
          <TabsTrigger
            value="enrolled"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm data-[state=active]:text-sky-700 dark:data-[state=active]:text-sky-300 text-slate-600 dark:text-slate-400"
          >
            My Courses
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm data-[state=active]:text-sky-700 dark:data-[state=active]:text-sky-300 text-slate-600 dark:text-slate-400"
          >
            Completed
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {enhancedDisplayedCourses.length > 0 ? (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {enhancedDisplayedCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-8">
                  <nav className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => paginate(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="text-slate-700 dark:text-slate-300"
                    >
                      Previous
                    </Button>
                    
                    {pageNumbers.map(number => (
                      <Button
                        key={number}
                        variant={currentPage === number ? "default" : "outline"}
                        size="sm"
                        onClick={() => paginate(number)}
                        className={
                          currentPage === number 
                            ? "bg-sky-600 hover:bg-sky-700 text-white" 
                            : "text-slate-700 dark:text-slate-300"
                        }
                      >
                        {number}
                      </Button>
                    ))}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="text-slate-700 dark:text-slate-300"
                    >
                      Next
                    </Button>
                  </nav>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">No courses found</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md">
                {searchQuery 
                  ? `No courses match your search for "${searchQuery}".` 
                  : selectedTags.length > 0 
                    ? "No courses match the selected filters." 
                    : activeTab === "enrolled" 
                      ? "You haven't enrolled in any courses yet." 
                      : activeTab === "completed" 
                        ? "You haven't completed any courses yet." 
                        : activeTab === "free" 
                          ? "No free courses available at the moment." 
                          : "No courses available at the moment."}
              </p>
              {(searchQuery || selectedTags.length > 0) && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedTags([])
                    setPriceRange([0, maxPrice])
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Courses