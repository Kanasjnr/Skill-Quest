"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Input } from "../components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Checkbox } from "../components/ui/checkbox"
import { Progress } from "../components/ui/progress"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../components/ui/pagination"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog"
import {
  Search,
  BookOpen,
  Edit,
  Pause,
  Play,
  Users,
  Award,
  BarChart,
  Filter,
  ChevronDown,
  Copy,
  Trash2,
  MoreHorizontal,
  RefreshCw,
  DollarSign,
  FileText,
  PlusCircle,
  Settings,
  FileQuestion,
  Calendar,
  X,
} from "lucide-react"
import useSkillQuestCourses from "../hooks/useSkillQuestCourses"
import useSkillQuestInstructor from "../hooks/useSkillQuestInstructor"
import { toast } from "react-toastify"
import LoadingSpinner from "../components/LoadingSpinner"

const InstructorCourses = () => {
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCourses, setSelectedCourses] = useState([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [showFilters, setShowFilters] = useState(false)
  const [dateFilter, setDateFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [filteredCourses, setFilteredCourses] = useState([])
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [courseToDelete, setCourseToDelete] = useState(null)
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)
  const [courseToDuplicate, setCourseToDuplicate] = useState(null)
  const [newCourseName, setNewCourseName] = useState("")

  // Pagination settings
  const coursesPerPage = 5

  // Hooks for data fetching
  const {
    instructorCourses,
    fetchInstructorCourses,
    toggleCoursePause,
    deleteCourse,
    duplicateCourse,
    loading: coursesLoading,
    error: coursesError,
  } = useSkillQuestCourses()

  const { isRegistered, instructorData, loading: instructorLoading } = useSkillQuestInstructor()

  // Fetch courses on initial load
  useEffect(() => {
    if (isRegistered) {
      fetchInstructorCourses()
    }
  }, [isRegistered, fetchInstructorCourses])

  // Filter and sort courses
  useEffect(() => {
    if (instructorCourses) {
      let filtered = [...instructorCourses]

      // Apply search filter
      if (searchQuery) {
        filtered = filtered.filter((course) => course.title.toLowerCase().includes(searchQuery.toLowerCase()))
      }

      // Apply status filter
      if (activeTab !== "all") {
        filtered = filtered.filter((course) => {
          if (activeTab === "active") return !course.isPaused && !course.isDraft
          if (activeTab === "paused") return course.isPaused
          if (activeTab === "draft") return course.isDraft
          return true
        })
      }

      // Apply date filter
      if (dateFilter !== "all") {
        const now = new Date()
        const cutoffDate = new Date()

        if (dateFilter === "last7days") {
          cutoffDate.setDate(now.getDate() - 7)
        } else if (dateFilter === "last30days") {
          cutoffDate.setDate(now.getDate() - 30)
        } else if (dateFilter === "last90days") {
          cutoffDate.setDate(now.getDate() - 90)
        }

        filtered = filtered.filter((course) => new Date(course.creationTime) >= cutoffDate)
      }

      // Apply category filter
      if (categoryFilter !== "all") {
        filtered = filtered.filter((course) => course.tags.includes(categoryFilter))
      }

      // Apply sorting
      filtered.sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return new Date(b.creationTime) - new Date(a.creationTime)
          case "oldest":
            return new Date(a.creationTime) - new Date(b.creationTime)
          case "popular":
            return b.enrollmentCount - a.enrollmentCount
          case "rating":
            return (b.rating || 0) - (a.rating || 0)
          case "price-high":
            return Number(b.price) - Number(a.price)
          case "price-low":
            return Number(a.price) - Number(b.price)
          default:
            return 0
        }
      })

      setFilteredCourses(filtered)

      // Reset to first page when filters change
      setCurrentPage(1)
    }
  }, [searchQuery, activeTab, dateFilter, categoryFilter, sortBy, instructorCourses])

  // Get unique categories from all courses
  const getUniqueCategories = useCallback(() => {
    if (!instructorCourses) return []

    const allTags = instructorCourses.flatMap((course) => course.tags)
    return [...new Set(allTags)]
  }, [instructorCourses])

  // Handle course pause/unpause
  const handleTogglePause = async (courseId, isPaused) => {
    try {
      const loadingToast = toast.loading(`${isPaused ? "Unpausing" : "Pausing"} course...`)
      const success = await toggleCoursePause(courseId, !isPaused)
      toast.dismiss(loadingToast)

      if (success) {
        toast.success(`Course ${isPaused ? "unpaused" : "paused"} successfully`)
        await fetchInstructorCourses()
      }
    } catch (error) {
      console.error("Error toggling course pause:", error)
      toast.error(`Failed to ${isPaused ? "unpause" : "pause"} course: ${error.message || "Unknown error"}`)
    }
  }

  // Handle course deletion
  const handleDeleteCourse = async () => {
    if (!courseToDelete) return

    try {
      const loadingToast = toast.loading("Deleting course...")
      const success = await deleteCourse(courseToDelete)
      toast.dismiss(loadingToast)

      if (success) {
        toast.success("Course deleted successfully")
        await fetchInstructorCourses()
        setConfirmDeleteOpen(false)
        setCourseToDelete(null)
      }
    } catch (error) {
      console.error("Error deleting course:", error)
      toast.error(`Failed to delete course: ${error.message || "Unknown error"}`)
    }
  }

  // Handle course duplication
  const handleDuplicateCourse = async () => {
    if (!courseToDuplicate || !newCourseName.trim()) return

    try {
      const loadingToast = toast.loading("Duplicating course...")
      const success = await duplicateCourse(courseToDuplicate, newCourseName)
      toast.dismiss(loadingToast)

      if (success) {
        toast.success("Course duplicated successfully")
        await fetchInstructorCourses()
        setDuplicateDialogOpen(false)
        setCourseToDuplicate(null)
        setNewCourseName("")
      }
    } catch (error) {
      console.error("Error duplicating course:", error)
      toast.error(`Failed to duplicate course: ${error.message || "Unknown error"}`)
    }
  }

  // Handle bulk actions
  const handleBulkAction = async (action) => {
    if (selectedCourses.length === 0) {
      toast.warning("No courses selected")
      return
    }

    try {
      const loadingToast = toast.loading(`Processing ${selectedCourses.length} courses...`)

      // Process each selected course
      for (const courseId of selectedCourses) {
        if (action === "pause") {
          await toggleCoursePause(courseId, true)
        } else if (action === "unpause") {
          await toggleCoursePause(courseId, false)
        }
        // Add other bulk actions as needed
      }

      toast.dismiss(loadingToast)
      toast.success(`Successfully processed ${selectedCourses.length} courses`)

      // Refresh course list and clear selection
      await fetchInstructorCourses()
      setSelectedCourses([])
    } catch (error) {
      console.error("Error processing bulk action:", error)
      toast.error(`Failed to process courses: ${error.message || "Unknown error"}`)
    }
  }

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await fetchInstructorCourses()
      toast.success("Course data refreshed")
    } catch (error) {
      console.error("Error refreshing courses:", error)
      toast.error("Failed to refresh courses")
    } finally {
      setIsRefreshing(false)
    }
  }

  // Toggle course selection
  const toggleCourseSelection = (courseId) => {
    setSelectedCourses((prev) => {
      if (prev.includes(courseId)) {
        return prev.filter((id) => id !== courseId)
      } else {
        return [...prev, courseId]
      }
    })
  }

  // Toggle all courses selection
  const toggleAllCourses = () => {
    if (selectedCourses.length === paginatedCourses.length) {
      setSelectedCourses([])
    } else {
      setSelectedCourses(paginatedCourses.map((course) => course.id))
    }
  }

  // Calculate summary stats
  const calculateStats = useCallback(() => {
    if (!instructorCourses || instructorCourses.length === 0) {
      return {
        totalCourses: 0,
        activeCourses: 0,
        totalStudents: 0,
        totalRevenue: 0,
      }
    }

    const totalCourses = instructorCourses.length
    const activeCourses = instructorCourses.filter((course) => !course.isPaused && !course.isDraft).length
    const totalStudents = instructorCourses.reduce((sum, course) => sum + Number(course.enrollmentCount || 0), 0)
    const totalRevenue = instructorCourses.reduce(
      (sum, course) => sum + Number(course.price || 0) * Number(course.enrollmentCount || 0),
      0,
    )

    return {
      totalCourses,
      activeCourses,
      totalStudents,
      totalRevenue,
    }
  }, [instructorCourses])

  // Get paginated courses
  const paginatedCourses = filteredCourses.slice((currentPage - 1) * coursesPerPage, currentPage * coursesPerPage)

  // Calculate total pages
  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage)

  // Generate pagination items
  const generatePaginationItems = () => {
    const items = []

    // Always show first page
    items.push(
      <PaginationItem key="first">
        <PaginationLink onClick={() => setCurrentPage(1)} isActive={currentPage === 1}>
          1
        </PaginationLink>
      </PaginationItem>,
    )

    // Show ellipsis if needed
    if (currentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis1">
          <span className="px-4 py-2">...</span>
        </PaginationItem>,
      )
    }

    // Show pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (i === 1 || i === totalPages) continue // Skip first and last page as they're always shown

      items.push(
        <PaginationItem key={i}>
          <PaginationLink onClick={() => setCurrentPage(i)} isActive={currentPage === i}>
            {i}
          </PaginationLink>
        </PaginationItem>,
      )
    }

    // Show ellipsis if needed
    if (currentPage < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis2">
          <span className="px-4 py-2">...</span>
        </PaginationItem>,
      )
    }

    // Always show last page if there's more than one page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key="last">
          <PaginationLink onClick={() => setCurrentPage(totalPages)} isActive={currentPage === totalPages}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>,
      )
    }

    return items
  }

  // Loading state
  if (coursesLoading || instructorLoading) {
    return <LoadingSpinner message="Loading your courses..." />
  }

  // Error state
  if (coursesError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-red-500">Error loading courses: {coursesError}</div>
        <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" /> Try Again
        </Button>
      </div>
    )
  }

  // Not registered state
  if (!isRegistered) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <h2 className="text-xl font-semibold">Become an Instructor</h2>
        <p className="text-gray-500">Register as an instructor to create and manage courses</p>
        <Button onClick={() => (window.location.href = "/instructor")} className="bg-purple-600 hover:bg-purple-700">
          Register as Instructor
        </Button>
      </div>
    )
  }

  // Calculate summary stats
  const stats = calculateStats()

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Courses</h1>
          <p className="text-gray-500">Manage and monitor your course catalog</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700" asChild>
            <a href="/instructor/create-course">
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Course
            </a>
          </Button>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Courses</p>
              <p className="text-2xl font-bold">{stats.totalCourses}</p>
            </div>
            <BookOpen className="h-8 w-8 text-purple-500 opacity-80" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Courses</p>
              <p className="text-2xl font-bold">{stats.activeCourses}</p>
            </div>
            <Play className="h-8 w-8 text-green-500 opacity-80" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Students</p>
              <p className="text-2xl font-bold">{stats.totalStudents}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500 opacity-80" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold">{stats.totalRevenue} LEARN</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500 opacity-80" />
          </CardContent>
        </Card>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={showFilters ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? "Hide Filters" : "Show Filters"}
          </Button>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Advanced filters */}
      {showFilters && (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Date Created</label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="last7days">Last 7 Days</SelectItem>
                    <SelectItem value="last30days">Last 30 Days</SelectItem>
                    <SelectItem value="last90days">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Category</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {getUniqueCategories().map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDateFilter("all")
                    setCategoryFilter("all")
                    setSearchQuery("")
                  }}
                  className="flex items-center gap-2"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs and bulk actions */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
          <TabsList>
            <TabsTrigger value="all">
              All Courses
              <Badge variant="secondary" className="ml-2">
                {instructorCourses.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="active">
              Active
              <Badge variant="secondary" className="ml-2">
                {instructorCourses.filter((c) => !c.isPaused && !c.isDraft).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="paused">
              Paused
              <Badge variant="secondary" className="ml-2">
                {instructorCourses.filter((c) => c.isPaused).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="draft">
              Drafts
              <Badge variant="secondary" className="ml-2">
                {instructorCourses.filter((c) => c.isDraft).length}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {selectedCourses.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {selectedCourses.length} course{selectedCourses.length !== 1 ? "s" : ""} selected
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Bulk Actions <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleBulkAction("pause")}>
                  <Pause className="mr-2 h-4 w-4" /> Pause Courses
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction("unpause")}>
                  <Play className="mr-2 h-4 w-4" /> Unpause Courses
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSelectedCourses([])}>
                  <X className="mr-2 h-4 w-4" /> Clear Selection
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Course list */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Course Management</CardTitle>
              <CardDescription>
                {filteredCourses.length} course{filteredCourses.length !== 1 ? "s" : ""} found
              </CardDescription>
            </div>
            {paginatedCourses.length > 0 && (
              <div className="flex items-center">
                <Checkbox
                  id="select-all"
                  checked={selectedCourses.length === paginatedCourses.length && paginatedCourses.length > 0}
                  onCheckedChange={toggleAllCourses}
                />
                <label htmlFor="select-all" className="ml-2 text-sm">
                  Select All
                </label>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {paginatedCourses.length > 0 ? (
            <div className="space-y-4">
              {paginatedCourses.map((course) => {
                // Calculate completion rate
                const completionRate =
                  course.enrollmentCount > 0
                    ? Math.round((Number(course.completionCount) / Number(course.enrollmentCount)) * 100)
                    : 0

                // Calculate revenue
                const revenue = Number(course.price) * Number(course.enrollmentCount)

                return (
                  <div
                    key={course.id}
                    className={`border rounded-lg p-4 transition-colors ${
                      selectedCourses.includes(course.id) ? "border-purple-500 bg-purple-50 dark:bg-purple-900/10" : ""
                    } ${course.isPaused ? "bg-gray-50 dark:bg-gray-800/50" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Checkbox
                          checked={selectedCourses.includes(course.id)}
                          onCheckedChange={() => toggleCourseSelection(course.id)}
                        />
                        <div className="h-12 w-12 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          {course.imageUrl ? (
                            <img
                              src={course.imageUrl || "/placeholder.svg"}
                              alt={course.title}
                              className="h-12 w-12 rounded-md object-cover"
                            />
                          ) : (
                            <BookOpen className="h-6 w-6 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center">
                            <h3 className="font-semibold">{course.title}</h3>
                            {course.isPaused && (
                              <Badge
                                variant="outline"
                                className="ml-2 text-orange-500 border-orange-200 bg-orange-50"
                              >
                                Paused
                              </Badge>
                            )}
                            {course.isDraft && (
                              <Badge variant="outline" className="ml-2 text-blue-500 border-blue-200 bg-blue-50">
                                Draft
                              </Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {Array.isArray(course.tags) && course.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/courses/${course.id}`}>
                            <BookOpen className="h-4 w-4 mr-2" />
                            View
                          </a>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/instructor/course/${course.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </a>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => handleTogglePause(course.id, course.isPaused)}>
                              {course.isPaused ? (
                                <>
                                  <Play className="h-4 w-4 mr-2 text-green-500" />
                                  Unpause Course
                                </>
                              ) : (
                                <>
                                  <Pause className="h-4 w-4 mr-2 text-orange-500" />
                                  Pause Course
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setCourseToDuplicate(course.id)
                                setNewCourseName(`${course.title} (Copy)`)
                                setDuplicateDialogOpen(true)
                              }}
                            >
                              <Copy className="h-4 w-4 mr-2 text-blue-500" />
                              Duplicate Course
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <a href={`/instructor/course/${course.id}/analytics`} className="flex items-center">
                                <BarChart className="h-4 w-4 mr-2 text-purple-500" />
                                View Analytics
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a href={`/instructor/course/${course.id}/students`} className="flex items-center">
                                <Users className="h-4 w-4 mr-2 text-green-500" />
                                Manage Students
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a href={`/instructor/course/${course.id}/content`} className="flex items-center">
                                <FileText className="h-4 w-4 mr-2 text-blue-500" />
                                Manage Content
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a href={`/instructor/course/${course.id}/quizzes`} className="flex items-center">
                                <FileQuestion className="h-4 w-4 mr-2 text-indigo-500" />
                                Manage Quizzes
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setCourseToDelete(course.id)
                                setConfirmDeleteOpen(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Course
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-gray-500">Students</p>
                          <p className="font-semibold">{course.enrollmentCount || 0}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Award className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-gray-500">Completion Rate</p>
                          <div className="flex items-center">
                            <Progress value={completionRate} className="h-2 w-24 mr-2" />
                            <span>{completionRate}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-gray-500">Revenue</p>
                          <p className="font-semibold">{revenue} LEARN</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-gray-500">Created</p>
                          <p className="font-semibold">{new Date(course.creationTime).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Courses Found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || activeTab !== "all" || dateFilter !== "all" || categoryFilter !== "all"
                  ? "Try adjusting your filters"
                  : "Create your first course to start teaching"}
              </p>
              {!searchQuery && activeTab === "all" && dateFilter === "all" && categoryFilter === "all" && (
                <Button className="bg-purple-600 hover:bg-purple-700" asChild>
                  <a href="/instructor/create-course">Create Course</a>
                </Button>
              )}
            </div>
          )}
        </CardContent>
        {totalPages > 1 && (
          <CardFooter>
            <Pagination className="w-full">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  />
                </PaginationItem>

                {generatePaginationItems()}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardFooter>
        )}
      </Card>

      {/* Quick Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks for course management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center" asChild>
              <a href="/instructor/create-course">
                <PlusCircle className="h-6 w-6 mb-2 text-purple-500" />
                <span className="font-medium">Create New Course</span>
                <span className="text-xs text-gray-500 mt-1">Start building a new course</span>
              </a>
            </Button>

            <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center" asChild>
              <a href="/instructor/analytics">
                <BarChart className="h-6 w-6 mb-2 text-blue-500" />
                <span className="font-medium">View Analytics</span>
                <span className="text-xs text-gray-500 mt-1">See performance metrics</span>
              </a>
            </Button>

            <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center" asChild>
              <a href="/instructor/settings">
                <Settings className="h-6 w-6 mb-2 text-gray-500" />
                <span className="font-medium">Instructor Settings</span>
                <span className="text-xs text-gray-500 mt-1">Update your profile</span>
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the course and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCourse} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate Course Dialog */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Course</DialogTitle>
            <DialogDescription>
              Create a copy of this course with a new name. All content, quizzes, and settings will be copied.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="newCourseName" className="text-sm font-medium">
                New Course Name
              </label>
              <Input
                id="newCourseName"
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                placeholder="Enter a name for the new course"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDuplicateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDuplicateCourse}
              disabled={!newCourseName.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Duplicate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default InstructorCourses
