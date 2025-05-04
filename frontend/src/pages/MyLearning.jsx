"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Progress } from "../components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Badge } from "../components/ui/badge"
import {
  BookOpen,
  CheckCircle,
  Clock,
  Award,
  ExternalLink,
  Play,
  Filter,
  Search,
  Calendar,
  BarChart2,
  BookmarkPlus,
  Flame,
  Clock3,
  Target,
  ChevronDown,
  SortAsc,
  Star,
  FileText,
  AlertCircle,
  Bookmark,
} from "lucide-react"
import { Input } from "../components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip"
import useSkillQuestEnrollment from "../hooks/useSkillQuestEnrollment"
import useSkillQuestUser from "../hooks/useSkillQuestUser"
import useSignerOrProvider from "../hooks/useSignerOrProvider"
import { toast } from "react-toastify"
import LoadingSpinner from "../components/LoadingSpinner"

const MyLearning = () => {
  const {
    enrolledCourses,
    completedCourses,
    updateProgress,
    loading: enrollmentLoading,
    error: enrollmentError,
  } = useSkillQuestEnrollment()
  const { userData, loading: userLoading, error: userError } = useSkillQuestUser()
  const { signer } = useSignerOrProvider()

  // State management
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredEnrolled, setFilteredEnrolled] = useState([])
  const [filteredCompleted, setFilteredCompleted] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortOption, setSortOption] = useState("recent")
  const [bookmarkedCourses, setBookmarkedCourses] = useState([])
  const [learningGoal, setLearningGoal] = useState(30) // minutes per day
  const [activeTab, setActiveTab] = useState("in-progress")
  const [showFilters, setShowFilters] = useState(false)
  const [filterCategory, setFilterCategory] = useState("all")

  // Learning stats
  const [learningStats, setLearningStats] = useState({
    totalMinutes: 0,
    weeklyStreak: 0,
    coursesCompleted: 0,
    certificatesEarned: 0,
    averageProgress: 0,
  })

  useEffect(() => {
    setLoading(enrollmentLoading || userLoading)

    // Calculate learning stats when data is available
    if (!enrollmentLoading && !userLoading && enrolledCourses && completedCourses) {
      const totalCourses = [...enrolledCourses, ...completedCourses]
      const totalProgress = totalCourses.reduce((sum, course) => sum + Number(course.progress || 0), 0)
      const avgProgress = totalCourses.length > 0 ? totalProgress / totalCourses.length : 0

      // Calculate total learning time from course durations
      const totalMinutes = totalCourses.reduce((sum, course) => {
        const duration = Number(course.duration || 0) * 60 // Convert hours to minutes
        return sum + duration
      }, 0)

      setLearningStats({
        totalMinutes,
        weeklyStreak: userData?.streak || 0,
        coursesCompleted: completedCourses.length,
        certificatesEarned: userData?.totalCertificates || 0,
        averageProgress: avgProgress,
      })

      // Load bookmarked courses from localStorage
      const savedBookmarks = localStorage.getItem("bookmarkedCourses")
      if (savedBookmarks) {
        setBookmarkedCourses(JSON.parse(savedBookmarks))
      }
    }
  }, [enrollmentLoading, userLoading, enrolledCourses, completedCourses, userData])

  // Filter and sort courses based on search query and sort option
  useEffect(() => {
    let enrolled = [...enrolledCourses]
    let completed = [...completedCourses]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      enrolled = enrolled.filter((course) => course.title.toLowerCase().includes(query))
      completed = completed.filter((course) => course.title.toLowerCase().includes(query))
    }

    // Apply category filter
    if (filterCategory !== "all") {
      enrolled = enrolled.filter((course) => course.category === filterCategory)
      completed = completed.filter((course) => course.category === filterCategory)
    }

    // Apply sorting
    const sortCourses = (courses) => {
      switch (sortOption) {
        case "recent":
          return [...courses].sort((a, b) => new Date(b.enrollmentTime) - new Date(a.enrollmentTime))
        case "oldest":
          return [...courses].sort((a, b) => new Date(a.enrollmentTime) - new Date(b.enrollmentTime))
        case "progress-high":
          return [...courses].sort((a, b) => Number(b.progress || 0) - Number(a.progress || 0))
        case "progress-low":
          return [...courses].sort((a, b) => Number(a.progress || 0) - Number(b.progress || 0))
        case "title-asc":
          return [...courses].sort((a, b) => a.title.localeCompare(b.title))
        case "title-desc":
          return [...courses].sort((a, b) => b.title.localeCompare(a.title))
        default:
          return courses
      }
    }

    setFilteredEnrolled(sortCourses(enrolled))
    setFilteredCompleted(sortCourses(completed))
  }, [searchQuery, enrolledCourses, completedCourses, sortOption, filterCategory])

  const handleUpdateProgress = async (courseId, newProgress) => {
    try {
      const success = await updateProgress(courseId, newProgress)
      if (success) {
        toast.success(`Progress updated to ${newProgress}%`)
      }
    } catch (error) {
      console.error("Error updating progress:", error)
      toast.error("Failed to update progress")
    }
  }

  const toggleBookmark = (courseId) => {
    let updatedBookmarks
    if (bookmarkedCourses.includes(courseId)) {
      updatedBookmarks = bookmarkedCourses.filter((id) => id !== courseId)
      toast.info("Course removed from bookmarks")
    } else {
      updatedBookmarks = [...bookmarkedCourses, courseId]
      toast.success("Course bookmarked")
    }
    setBookmarkedCourses(updatedBookmarks)
    localStorage.setItem("bookmarkedCourses", JSON.stringify(updatedBookmarks))
  }

  const calculateTimeLeft = (course) => {
    const totalMinutes = Number(course.duration || 0) * 60 // Convert hours to minutes
    const minutesLeft = totalMinutes * (1 - Number(course.progress || 0) / 100)
    return Math.round(minutesLeft)
  }

  if (loading) {
    return <LoadingSpinner message="Loading your learning journey..." />
  }

  if (enrollmentError || userError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold text-red-500">Error Loading Data</h2>
        <p className="text-gray-500">{enrollmentError || userError || "Something went wrong. Please try again."}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  if (!signer) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <h2 className="text-xl font-semibold">Connect Your Wallet</h2>
        <p className="text-gray-500">Please connect your wallet to view your learning progress</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Learning</h1>
          <p className="text-gray-500">Track your progress and manage your courses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href="/learning-paths">
              <Target className="h-4 w-4 mr-2" />
              Learning Paths
            </a>
          </Button>
          <Button className="bg-purple-600 hover:bg-purple-700" asChild>
            <a href="/courses">
              <BookOpen className="h-4 w-4 mr-2" />
              Browse Courses
            </a>
          </Button>
        </div>
      </div>

      {/* Learning Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <Flame className="h-8 w-8 text-orange-500 mb-2" />
            <p className="text-sm text-gray-500">Learning Streak</p>
            <h3 className="text-2xl font-bold">{learningStats.weeklyStreak} days</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <Clock3 className="h-8 w-8 text-blue-500 mb-2" />
            <p className="text-sm text-gray-500">Total Learning Time</p>
            <h3 className="text-2xl font-bold">{learningStats.totalMinutes} mins</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
            <p className="text-sm text-gray-500">Courses Completed</p>
            <h3 className="text-2xl font-bold">{learningStats.coursesCompleted}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <Award className="h-8 w-8 text-purple-500 mb-2" />
            <p className="text-sm text-gray-500">Certificates Earned</p>
            <h3 className="text-2xl font-bold">{learningStats.certificatesEarned}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col items-center justify-center">
            <BarChart2 className="h-8 w-8 text-indigo-500 mb-2" />
            <p className="text-sm text-gray-500">Average Progress</p>
            <h3 className="text-2xl font-bold">{learningStats.averageProgress.toFixed(0)}%</h3>
          </CardContent>
        </Card>
      </div>

      {/* Daily Goal */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Daily Learning Goal</CardTitle>
          <CardDescription>Track your daily learning commitment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Today's Progress</span>
              <span className="text-sm text-gray-500">
                {Math.min(learningStats.totalMinutes % 120, learningGoal)} / {learningGoal} minutes
              </span>
            </div>
            <Progress
              value={(Math.min(learningStats.totalMinutes % 120, learningGoal) / learningGoal) * 100}
              className="h-2"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0 min</span>
              <span>{learningGoal / 2} min</span>
              <span>{learningGoal} min</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Select value={learningGoal.toString()} onValueChange={(value) => setLearningGoal(Number(value))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Set daily goal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutes</SelectItem>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="45">45 minutes</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
              <SelectItem value="90">1.5 hours</SelectItem>
              <SelectItem value="120">2 hours</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Target className="h-4 w-4 mr-2" />
            Update Goal
          </Button>
        </CardFooter>
      </Card>

      {/* Search and Filter */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search your courses..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <SortAsc className="h-4 w-4 mr-2" />
                  Sort
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setSortOption("recent")}>Most Recent</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("oldest")}>Oldest First</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("progress-high")}>
                  Progress (High to Low)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("progress-low")}>
                  Progress (Low to High)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("title-asc")}>Title (A-Z)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortOption("title-desc")}>Title (Z-A)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card className="p-4">
            <div className="flex flex-wrap gap-4">
              <div>
                <p className="text-sm font-medium mb-2">Category</p>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="development">Development</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="blockchain">Blockchain</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Status</p>
                <div className="flex gap-2">
                  <Button
                    variant={activeTab === "in-progress" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveTab("in-progress")}
                    className={activeTab === "in-progress" ? "bg-purple-600 hover:bg-purple-700" : ""}
                  >
                    In Progress
                  </Button>
                  <Button
                    variant={activeTab === "completed" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveTab("completed")}
                    className={activeTab === "completed" ? "bg-purple-600 hover:bg-purple-700" : ""}
                  >
                    Completed
                  </Button>
                  <Button
                    variant={activeTab === "bookmarked" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveTab("bookmarked")}
                    className={activeTab === "bookmarked" ? "bg-purple-600 hover:bg-purple-700" : ""}
                  >
                    Bookmarked
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="bookmarked">Bookmarked</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
        </TabsList>

        <TabsContent value="in-progress" className="mt-6">
          <div className="space-y-4">
            {filteredEnrolled.filter((course) => Number(course.progress || 0) < 100).length > 0 ? (
              filteredEnrolled
                .filter((course) => Number(course.progress || 0) < 100)
                .map((course) => (
                  <Card key={course.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        <div className="md:w-1/4 aspect-video md:aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative">
                          {course.imageUrl ? (
                            <img
                              src={course.imageUrl || "/placeholder.svg"}
                              alt={course.title}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <BookOpen className="h-12 w-12 text-gray-400" />
                          )}
                          <div className="absolute top-2 right-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full bg-white/80 hover:bg-white"
                                    onClick={() => toggleBookmark(course.id)}
                                  >
                                    {bookmarkedCourses.includes(course.id) ? (
                                      <Bookmark className="h-4 w-4 text-purple-600 fill-purple-600" />
                                    ) : (
                                      <BookmarkPlus className="h-4 w-4 text-gray-600" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {bookmarkedCourses.includes(course.id) ? "Remove bookmark" : "Bookmark course"}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                        <div className="p-6 flex-1">
                          <div className="flex flex-col md:flex-row md:items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg">{course.title}</h3>
                                {course.category && (
                                  <Badge variant="outline" className="text-xs">
                                    {course.category}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mb-2">
                                Instructor:{" "}
                                {course.instructorName ||
                                  `${course.instructor.slice(0, 6)}...${course.instructor.slice(-4)}`}
                              </p>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  <span>Enrolled: {new Date(course.enrollmentTime).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  <span>{calculateTimeLeft(course)} min left</span>
                                </div>
                                {course.rating && (
                                  <div className="flex items-center">
                                    <Star className="h-4 w-4 mr-1 text-yellow-500" />
                                    <span>{course.rating}</span>
                                  </div>
                                )}
                                {course.isPaused && (
                                  <Badge variant="outline" className="text-yellow-600 border-yellow-300 bg-yellow-50">
                                    Course Paused
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="mt-4 md:mt-0 flex flex-col items-end">
                              <div className="flex items-center space-x-2 mb-2">
                                <Award className="h-4 w-4 text-purple-600" />
                                <span className="text-sm">{course.xpReward} XP</span>
                                <Clock className="h-4 w-4 text-blue-500 ml-2" />
                                <span className="text-sm">Reward: {course.tokenReward} LEARN</span>
                              </div>
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm" asChild>
                                  <a href={`/courses/${course.id}`}>
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Details
                                  </a>
                                </Button>
                                <Button className="bg-purple-600 hover:bg-purple-700" size="sm" asChild>
                                  <a href={`/learn/${course.id}`}>
                                    <Play className="h-4 w-4 mr-2" />
                                    Continue
                                  </a>
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">Progress</span>
                              <span className="text-sm text-gray-500">{course.progress || 0}%</span>
                            </div>
                            <Progress value={Number(course.progress || 0)} className="h-2" />
                            <div className="flex justify-between pt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateProgress(course.id, 25)}
                                disabled={Number(course.progress || 0) >= 25}
                              >
                                25%
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateProgress(course.id, 50)}
                                disabled={Number(course.progress || 0) >= 50}
                              >
                                50%
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateProgress(course.id, 75)}
                                disabled={Number(course.progress || 0) >= 75}
                              >
                                75%
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateProgress(course.id, 100)}
                                disabled={Number(course.progress || 0) >= 100}
                              >
                                Complete
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            ) : (
              <div className="text-center py-10">
                <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Courses In Progress</h3>
                <p className="text-gray-500 mb-4">Enroll in courses to start learning</p>
                <Button className="bg-purple-600 hover:bg-purple-700" asChild>
                  <a href="/courses">Browse Courses</a>
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <div className="space-y-4">
            {filteredCompleted.length > 0 ? (
              filteredCompleted.map((course) => (
                <Card key={course.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:w-1/4 aspect-video md:aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative">
                        {course.imageUrl ? (
                          <img
                            src={course.imageUrl || "/placeholder.svg"}
                            alt={course.title}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <CheckCircle className="h-12 w-12 text-green-500" />
                        )}
                        <div className="absolute top-2 right-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full bg-white/80 hover:bg-white"
                                  onClick={() => toggleBookmark(course.id)}
                                >
                                  {bookmarkedCourses.includes(course.id) ? (
                                    <Bookmark className="h-4 w-4 text-purple-600 fill-purple-600" />
                                  ) : (
                                    <BookmarkPlus className="h-4 w-4 text-gray-600" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {bookmarkedCourses.includes(course.id) ? "Remove bookmark" : "Bookmark course"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                      <div className="p-6 flex-1">
                        <div className="flex flex-col md:flex-row md:items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-lg">{course.title}</h3>
                              <Badge className="bg-green-100 text-green-800">Completed</Badge>
                              {course.category && (
                                <Badge variant="outline" className="text-xs">
                                  {course.category}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mb-2">
                              Instructor:{" "}
                              {course.instructorName ||
                                `${course.instructor.slice(0, 6)}...${course.instructor.slice(-4)}`}
                            </p>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span>
                                  Completed:{" "}
                                  {course.completionTime || "Not available"}
                                </span>
                              </div>
                              {course.rating && (
                                <div className="flex items-center">
                                  <Star className="h-4 w-4 mr-1 text-yellow-500" />
                                  <span>{course.rating}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="mt-4 md:mt-0 flex flex-col items-end">
                            <div className="flex items-center space-x-2 mb-2">
                              <Award className="h-4 w-4 text-purple-600" />
                              <span className="text-sm">{course.xpReward} XP Earned</span>
                              <Clock className="h-4 w-4 text-blue-500 ml-2" />
                              <span className="text-sm">Reward: {course.tokenReward} LEARN</span>
                            </div>
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm" asChild>
                                <a href={`/courses/${course.id}`}>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Details
                                </a>
                              </Button>
                              <Button className="bg-green-600 hover:bg-green-700" size="sm" asChild>
                                <a href={`/certificates/${course.id}`}>
                                  <Award className="h-4 w-4 mr-2" />
                                  Certificate
                                </a>
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Progress</span>
                            <span className="text-sm text-gray-500">100%</span>
                          </div>
                          <Progress value={100} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-10">
                <CheckCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Completed Courses</h3>
                <p className="text-gray-500 mb-4">Complete courses to see them here</p>
                <Button className="bg-purple-600 hover:bg-purple-700" asChild>
                  <a href="/courses">Browse Courses</a>
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="bookmarked" className="mt-6">
          <div className="space-y-4">
            {bookmarkedCourses.length > 0 ? (
              [...enrolledCourses, ...completedCourses]
                .filter((course) => bookmarkedCourses.includes(course.id))
                .map((course) => (
                  <Card key={course.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row">
                        <div className="md:w-1/4 aspect-video md:aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative">
                          {course.imageUrl ? (
                            <img
                              src={course.imageUrl || "/placeholder.svg"}
                              alt={course.title}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <BookOpen className="h-12 w-12 text-gray-400" />
                          )}
                          <div className="absolute top-2 right-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full bg-white/80 hover:bg-white"
                                    onClick={() => toggleBookmark(course.id)}
                                  >
                                    <Bookmark className="h-4 w-4 text-purple-600 fill-purple-600" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Remove bookmark</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                        <div className="p-6 flex-1">
                          <div className="flex flex-col md:flex-row md:items-start justify-between mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-lg">{course.title}</h3>
                                {Number(course.progress || 0) === 100 ? (
                                  <Badge className="bg-green-100 text-green-800">Completed</Badge>
                                ) : (
                                  <Badge className="bg-blue-100 text-blue-800">{course.progress || 0}% Complete</Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 mb-2">
                                Instructor:{" "}
                                {course.instructorName ||
                                  `${course.instructor.slice(0, 6)}...${course.instructor.slice(-4)}`}
                              </p>
                            </div>
                            <div className="mt-4 md:mt-0 flex space-x-2">
                              <Button variant="outline" size="sm" asChild>
                                <a href={`/courses/${course.id}`}>
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Details
                                </a>
                              </Button>
                              <Button className="bg-purple-600 hover:bg-purple-700" size="sm" asChild>
                                <a href={`/learn/${course.id}`}>
                                  <Play className="h-4 w-4 mr-2" />
                                  {Number(course.progress || 0) === 100 ? "Review" : "Continue"}
                                </a>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            ) : (
              <div className="text-center py-10">
                <Bookmark className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Bookmarked Courses</h3>
                <p className="text-gray-500 mb-4">Bookmark courses to access them quickly</p>
                <Button className="bg-purple-600 hover:bg-purple-700" asChild>
                  <a href="/courses">Browse Courses</a>
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="certificates" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Certificates</CardTitle>
              <CardDescription>Showcase your achievements and skills</CardDescription>
            </CardHeader>
            <CardContent>
              {userData?.totalCertificates > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completedCourses.map((course, index) => (
                    <Card key={index} className="overflow-hidden">
                      <div className="aspect-[4/3] bg-gradient-to-br from-purple-100 to-blue-50 dark:from-purple-900 dark:to-blue-900 flex items-center justify-center p-4">
                        <Award className="h-16 w-16 text-purple-600" />
                      </div>
                      <CardContent className="p-4">
                        <h4 className="font-medium">{course.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          Issued on {new Date(course.completionTime).toLocaleDateString()}
                        </p>
                      </CardContent>
                      <CardFooter className="p-4 pt-0 flex justify-between">
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/certificates/${course.id}`}>
                            <FileText className="h-4 w-4 mr-2" />
                            View
                          </a>
                        </Button>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Award className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Certificates Yet</h3>
                  <p className="text-gray-500 mb-4">Complete courses to earn certificates</p>
                  <Button className="bg-purple-600 hover:bg-purple-700" asChild>
                    <a href="/courses">Browse Courses</a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default MyLearning
