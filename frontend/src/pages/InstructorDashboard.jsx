"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Badge } from "../components/ui/badge"
import { Progress } from "../components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import {
  BookOpen,
  Users,
  DollarSign,
  TrendingUp,
  Plus,
  Star,
  Edit,
  Pause,
  Play,
  BarChart,
  Calendar,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  Settings,
  ChevronRight,
  RefreshCw,
  CheckCircle,
  HelpCircle,
} from "lucide-react"
import useSkillQuestCourses from "../hooks/useSkillQuestCourses"
import useSkillQuestInstructor from "../hooks/useSkillQuestInstructor"
import useSkillQuestReviews from "../hooks/useSkillQuestReviews"
import useSignerOrProvider from "../hooks/useSignerOrProvider"
import { toast } from "react-toastify"
import LoadingSpinner from "../components/LoadingSpinner"
import { useNavigate } from "react-router-dom"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../components/ui/chart"
import {
  AreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts"

const InstructorDashboard = () => {
  const navigate = useNavigate()
  const {
    instructorCourses,
    fetchInstructorCourses,
    toggleCoursePause,
    loading: coursesLoading,
    error: coursesError,
  } = useSkillQuestCourses()
  const {
    instructorData,
    isRegistered,
    loading: instructorLoading,
    error: instructorError,
    fetchInstructorData,
  } = useSkillQuestInstructor()
  const { reviews, fetchInstructorReviews, loading: reviewsLoading } = useSkillQuestReviews()
  const { signer } = useSignerOrProvider()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [timeFilter, setTimeFilter] = useState("all")
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalRevenue: 0,
    totalCourses: 0,
    completionRate: 0,
    averageRating: 0,
    studentGrowth: 0,
    revenueGrowth: 0,
    engagementRate: 0,
    averageCompletionTime: 0,
    revenuePerStudent: 0,
    activeCourses: 0,
  })

  useEffect(() => {
    setLoading(coursesLoading || instructorLoading || reviewsLoading)
    setError(coursesError || instructorError)
  }, [coursesLoading, instructorLoading, reviewsLoading, coursesError, instructorError])

  // Load instructor data with proper error handling
  useEffect(() => {
    const loadInstructorData = async () => {
      if (!signer) return

      try {
        setLoading(true)

        // Check if instructor is registered first
        const address = await signer.getAddress()
        await fetchInstructorData(address)

        // Only fetch courses and reviews if registered
        if (isRegistered) {
          await Promise.all([
            fetchInstructorCourses(),
            fetchInstructorReviews(address) // Pass the instructor address
          ])
        }
      } catch (err) {
        console.error("Error loading instructor data:", err)
        setError("Failed to load instructor data: " + (err.message || "Unknown error"))
        toast.error("Failed to load instructor dashboard")
      } finally {
        setLoading(false)
      }
    }

    loadInstructorData()
  }, [signer, isRegistered, fetchInstructorData, fetchInstructorCourses, fetchInstructorReviews])

  // Calculate instructor stats from courses and reviews
  useEffect(() => {
    if (instructorCourses.length > 0) {
      const totalStudents = instructorCourses.reduce((sum, course) => sum + Number(course.enrollmentCount || 0), 0)
      const totalRevenue = instructorCourses.reduce(
        (sum, course) => sum + Number(course.price || 0) * Number(course.enrollmentCount || 0),
        0,
      )
      const totalCompletions = instructorCourses.reduce((sum, course) => sum + Number(course.completionCount || 0), 0)
      const completionRate = totalStudents > 0 ? Math.round((totalCompletions / totalStudents) * 100) : 0

      // Calculate average rating from reviews
      let averageRating = 0
      if (Array.isArray(reviews) && reviews.length > 0) {
        const validReviews = reviews.filter(review => {
          const rating = Number(review.rating)
          return !isNaN(rating) && rating > 0 && rating <= 5
        })
        
        if (validReviews.length > 0) {
          const totalRating = validReviews.reduce((sum, review) => {
            return sum + Number(review.rating)
          }, 0)
          averageRating = Number((totalRating / validReviews.length).toFixed(1))
        }
      }

      // Calculate active courses (not paused and not draft)
      const activeCourses = instructorCourses.filter(course => !course.isPaused && !course.isDraft).length

      // Calculate engagement rate based on actual course interactions
      const totalInteractions = instructorCourses.reduce((sum, course) => {
        const enrollments = Number(course.enrollmentCount || 0)
        const completions = Number(course.completionCount || 0)
        const courseReviews = Array.isArray(reviews) 
          ? reviews.filter(review => review && review.courseId === course.id).length 
          : 0
        return sum + enrollments + completions + courseReviews
      }, 0)
      
      const engagementRate = totalStudents > 0 
        ? Math.round((totalInteractions / (totalStudents * 3)) * 100) // Assuming 3 possible interactions per student
        : 0

      // Calculate average completion time from actual completion data
      let totalCompletionTime = 0
      let completedCoursesCount = 0
      
      instructorCourses.forEach(course => {
        if (course.completionTime && course.enrollmentTime) {
          const completionTime = new Date(course.completionTime).getTime() - new Date(course.enrollmentTime).getTime()
          if (!isNaN(completionTime) && completionTime > 0) {
            totalCompletionTime += completionTime
            completedCoursesCount++
          }
        }
      })
      
      const averageCompletionTime = completedCoursesCount > 0 
        ? Math.round(totalCompletionTime / (completedCoursesCount * 24 * 60 * 60 * 1000)) // Convert ms to days
        : 0

      // Calculate revenue per student
      const revenuePerStudent = totalStudents > 0 ? Math.round(totalRevenue / totalStudents) : 0

      setStats({
        totalStudents,
        totalRevenue,
        totalCourses: instructorCourses.length,
        completionRate,
        averageRating,
        studentGrowth: 0,
        revenueGrowth: 0,
        engagementRate,
        averageCompletionTime,
        revenuePerStudent,
        activeCourses
      })
    }
  }, [instructorCourses, reviews])

  // Memoize the monthly data generation
  const { enrollmentData, revenueData, completionData } = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const currentMonth = new Date().getMonth()

    // Last 6 months
    const recentMonths = [
      ...months.slice(currentMonth - 5 >= 0 ? currentMonth - 5 : currentMonth - 5 + 12),
      ...months.slice(0, currentMonth + 1),
    ].slice(-6)

    // Generate enrollment data from actual course enrollments
    const enrollmentData = recentMonths.map((month) => {
      const monthEnrollments = instructorCourses.reduce((sum, course) => {
        const enrollmentTime = new Date(course.enrollmentTime)
        if (enrollmentTime.getMonth() === months.indexOf(month)) {
          return sum + Number(course.enrollmentCount || 0)
        }
        return sum
      }, 0)
      return {
        name: month,
        value: monthEnrollments
      }
    })

    // Generate revenue data from actual course revenue
    const revenueData = recentMonths.map((month) => {
      const monthRevenue = instructorCourses.reduce((sum, course) => {
        const enrollmentTime = new Date(course.enrollmentTime)
        if (enrollmentTime.getMonth() === months.indexOf(month)) {
          return sum + (Number(course.price || 0) * Number(course.enrollmentCount || 0))
        }
        return sum
      }, 0)
      return {
        name: month,
        value: monthRevenue
      }
    })

    // Generate completion rate data from actual course completions
    const completionData = recentMonths.map((month) => {
      const monthCompletions = instructorCourses.reduce((sum, course) => {
        const completionTime = new Date(course.completionTime)
        if (completionTime.getMonth() === months.indexOf(month)) {
          return sum + Number(course.completionCount || 0)
        }
        return sum
      }, 0)
      return {
        name: month,
        value: monthCompletions
      }
    })

    return { recentMonths, enrollmentData, revenueData, completionData }
  }, [instructorCourses])

  // Memoize category data
  const categoryData = useMemo(() => {
    const categories = {}
    instructorCourses.forEach((course) => {
      if (Array.isArray(course.tags)) {
        course.tags.forEach((tag) => {
          if (categories[tag]) {
            categories[tag]++
          } else {
            categories[tag] = 1
          }
        })
      }
    })
    return Object.entries(categories).map(([name, value]) => ({
      name,
      value,
    }))
  }, [instructorCourses])

  // Memoize rating data
  const ratingData = useMemo(() => {
    const ratings = {
      "5 Stars": 0,
      "4 Stars": 0,
      "3 Stars": 0,
      "2 Stars": 0,
      "1 Star": 0,
    }

    if (reviews && reviews.length > 0) {
      reviews.forEach((review) => {
        const rating = Math.floor(Number(review.rating))
        if (rating === 5) ratings["5 Stars"]++
        else if (rating === 4) ratings["4 Stars"]++
        else if (rating === 3) ratings["3 Stars"]++
        else if (rating === 2) ratings["2 Stars"]++
        else if (rating === 1) ratings["1 Star"]++
      })
    }

    return Object.entries(ratings).map(([name, value]) => ({
      name,
      value,
    }))
  }, [reviews])

  // Memoize top performing courses
  const topCourses = useMemo(() => {
    if (!instructorCourses || instructorCourses.length === 0) return []
    return [...instructorCourses]
      .sort((a, b) => {
        const aRevenue = Number(a.price || 0) * Number(a.enrollmentCount || 0)
        const bRevenue = Number(b.price || 0) * Number(b.enrollmentCount || 0)
        return bRevenue - aRevenue
      })
      .slice(0, 3)
  }, [instructorCourses])

  // Memoize recent activities
  const recentActivities = useMemo(() => {
    const activities = []

    instructorCourses.forEach(course => {
      if (course.enrollmentCount > 0) {
        activities.push({
          id: `enrollment-${course.id}`,
          type: "enrollment",
          message: `New student enrolled in ${course.title}`,
          time: course.enrollmentTime || new Date().toLocaleString(),
          icon: <Users className="h-4 w-4 text-blue-500" />
        })
      }
    })

    instructorCourses.forEach(course => {
      if (course.completionCount > 0) {
        activities.push({
          id: `completion-${course.id}`,
          type: "completion",
          message: `A student completed ${course.title}`,
          time: course.completionTime || new Date().toLocaleString(),
          icon: <CheckCircle className="h-4 w-4 text-green-500" />
        })
      }
    })

    if (reviews && reviews.length > 0) {
      reviews.slice(0, 5).forEach(review => {
        const course = instructorCourses.find(c => c.id === review.courseId)
        if (course) {
          activities.push({
            id: `review-${review.id}`,
            type: "review",
            message: `New ${review.rating}-star review on ${course.title}`,
            time: review.timestamp || new Date().toLocaleString(),
            icon: <Star className="h-4 w-4 text-yellow-500" />
          })
        }
      })
    }

    return activities.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5)
  }, [instructorCourses, reviews])

  // Memoize course rating calculation
  const getCourseRating = useCallback((courseId) => {
    if (!Array.isArray(reviews) || reviews.length === 0) return 0
    
    const courseReviews = reviews.filter(review => review && review.courseId === courseId)
    if (courseReviews.length === 0) return 0
    
    const totalRating = courseReviews.reduce((sum, review) => {
      const rating = Number(review.rating)
      return sum + (isNaN(rating) ? 0 : rating)
    }, 0)
    
    return Number((totalRating / courseReviews.length).toFixed(1))
  }, [reviews])

  // Memoize handleTogglePause
  const handleTogglePause = useCallback(async (courseId, isPaused) => {
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
  }, [toggleCoursePause, fetchInstructorCourses])

  // Memoize handleRefresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await fetchInstructorCourses()
      await fetchInstructorReviews()
      toast.success("Dashboard data refreshed")
    } catch (error) {
      console.error("Error refreshing data:", error)
      toast.error("Failed to refresh dashboard data")
    } finally {
      setIsRefreshing(false)
    }
  }, [fetchInstructorCourses, fetchInstructorReviews])

  if (loading) {
    return <LoadingSpinner message="Loading instructor dashboard..." />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-red-500">Error: {error}</div>
        <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" /> Try Again
        </Button>
      </div>
    )
  }

  if (!signer) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <h2 className="text-xl font-semibold">Connect Your Wallet</h2>
        <p className="text-gray-500">Please connect your wallet to view your instructor dashboard</p>
      </div>
    )
  }

  if (!isRegistered) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <h2 className="text-xl font-semibold">Become an Instructor</h2>
        <p className="text-gray-500">You need to register as an instructor to access this dashboard</p>
        <Button onClick={() => navigate("/dashboard")} className="bg-purple-600 hover:bg-purple-700">
          Go to Student Dashboard
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with welcome message and actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Instructor Dashboard</h1>
          <p className="text-gray-500">Welcome back, {instructorData?.name || "Instructor"}</p>
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
            <a href="/create-course">
              <Plus className="h-4 w-4 mr-2" />
              Create New Course
            </a>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents}</div>
            <div className="flex items-center mt-1">
              <Badge
                variant="outline"
                className={`flex items-center gap-1 ${stats.studentGrowth > 0 ? "text-green-500" : "text-red-500"}`}
              >
                {stats.studentGrowth > 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {stats.studentGrowth}%
              </Badge>
              <span className="text-xs text-gray-500 ml-2">vs. last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue} LEARN</div>
            <div className="flex items-center mt-1">
              <Badge
                variant="outline"
                className={`flex items-center gap-1 ${stats.revenueGrowth > 0 ? "text-green-500" : "text-red-500"}`}
              >
                {stats.revenueGrowth > 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {stats.revenueGrowth}%
              </Badge>
              <span className="text-xs text-gray-500 ml-2">vs. last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <div className="w-full mt-2">
              <Progress value={stats.completionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating}/5</div>
            <div className="flex items-center mt-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(stats.averageRating)
                      ? "text-yellow-400 fill-yellow-400"
                      : i < Math.ceil(stats.averageRating) && i >= Math.floor(stats.averageRating)
                        ? "text-yellow-400 fill-yellow-400 opacity-50"
                        : "text-gray-300"
                  }`}
                />
              ))}
              <span className="text-xs text-gray-500 ml-2">({reviews?.length || 0} reviews)</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two-column layout for top section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Top performing courses */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top Performing Courses</CardTitle>
            <CardDescription>Your most successful courses by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            {topCourses.length > 0 ? (
              <div className="space-y-4">
                {topCourses.map((course) => {
                  const revenue = Number(course.price || 0) * Number(course.enrollmentCount || 0)
                  const completionRate =
                    course.enrollmentCount > 0
                      ? Math.round((Number(course.completionCount) / Number(course.enrollmentCount)) * 100)
                      : 0
                  const courseRating = getCourseRating(course.id)

                  return (
                    <div key={course.id} className="border rounded-lg p-4 hover:border-purple-300 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
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
                            <h3 className="font-semibold">{course.title}</h3>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {Array.isArray(course.tags) && course.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {Array.isArray(course.tags) && course.tags.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{course.tags.length - 2} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{revenue} LEARN</p>
                          <p className="text-xs text-gray-500">{course.price} LEARN per student</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Students</p>
                          <p className="font-semibold">{course.enrollmentCount || 0}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Completion Rate</p>
                          <div className="flex items-center">
                            <Progress value={completionRate} className="w-16 h-2 mr-2" />
                            <span>{completionRate}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-500">Rating</p>
                          <div className="flex items-center">
                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 mr-1" />
                            <span>{courseRating}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end">
                        <Button variant="outline" size="sm" asChild>
                          <a href={`/instructor/course/${course.id}/analytics`}>
                            <BarChart className="h-4 w-4 mr-2" />
                            View Analytics
                          </a>
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Courses Yet</h3>
                <p className="text-gray-500 mb-4">Create your first course to start teaching</p>
                <Button className="bg-purple-600 hover:bg-purple-700" asChild>
                  <a href="/create-course">Create Course</a>
                </Button>
              </div>
            )}
          </CardContent>
          {instructorCourses.length > 3 && (
            <CardFooter className="border-t pt-4">
              <Button variant="outline" className="w-full" asChild>
                <a href="/instructor/courses">
                  View All Courses <ChevronRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardFooter>
          )}
        </Card>

        {/* Right column - Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from your courses</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="mt-0.5 bg-slate-100 dark:bg-slate-700 p-2 rounded-full">{activity.icon}</div>
                    <div>
                      <p className="text-sm">{activity.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Recent Activity</h3>
                <p className="text-gray-500">Activity will appear here as students interact with your courses</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different sections */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Enrollment Trends Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Enrollment Trends</CardTitle>
                  <CardDescription>Monthly enrollment data for your courses</CardDescription>
                </div>
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Time Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="year">Past Year</SelectItem>
                    <SelectItem value="month">Past Month</SelectItem>
                    <SelectItem value="week">Past Week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={enrollmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Bar dataKey="value" fill="#8884d8" radius={[4, 4, 0, 0]} />
                  <ChartTooltip />
                </RechartsBarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Charts Row */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
                <CardDescription>Monthly revenue data</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#4ade80"
                      fill="url(#colorRevenue)"
                      fillOpacity={0.3}
                    />
                    <ChartTooltip />
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4ade80" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Completion Rate Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Completion Rates</CardTitle>
                <CardDescription>Monthly course completion rates</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={completionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} />
                    <ChartTooltip />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Rating Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Rating Distribution</CardTitle>
                <CardDescription>Student ratings breakdown</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={ratingData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Bar dataKey="value" fill="#fbbf24" radius={[0, 4, 4, 0]} />
                    <ChartTooltip />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active Courses</p>
                  <p className="text-2xl font-bold">{stats.activeCourses}</p>
                </div>
                <BookOpen className="h-8 w-8 text-purple-500 opacity-80" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Engagement Rate</p>
                  <p className="text-2xl font-bold">{stats.engagementRate}%</p>
                </div>
                <Users className="h-8 w-8 text-blue-500 opacity-80" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Avg. Completion Time</p>
                  <p className="text-2xl font-bold">{stats.averageCompletionTime} days</p>
                </div>
                <Clock className="h-8 w-8 text-cyan-500 opacity-80" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Revenue per Student</p>
                  <p className="text-2xl font-bold">{stats.revenuePerStudent} LEARN</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500 opacity-80" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Your Courses</CardTitle>
                  <CardDescription>Manage your published courses</CardDescription>
                </div>
                <Button className="bg-purple-600 hover:bg-purple-700" asChild>
                  <a href="/create-course">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Course
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {instructorCourses.length > 0 ? (
                <div className="space-y-4">
                  {instructorCourses.map((course) => (
                    <div key={course.id} className="border rounded-lg overflow-hidden">
                      <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center space-x-4">
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
                        <div className="flex items-center space-x-2 mt-4 md:mt-0">
                          <Button variant="outline" size="sm" asChild>
                            <a href={`/courses/${course.id}`}>
                              <BookOpen className="h-4 w-4 mr-2" />
                              View
                            </a>
                          </Button>
                          <Button variant="outline" size="sm" asChild>
                            <a href={`/edit-course/${course.id}`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </a>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTogglePause(course.id, course.isPaused)}
                          >
                            {course.isPaused ? (
                              <>
                                <Play className="h-4 w-4 mr-2 text-green-500" />
                                Unpause
                              </>
                            ) : (
                              <>
                                <Pause className="h-4 w-4 mr-2 text-orange-500" />
                                Pause
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="p-4 grid md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Students</p>
                          <p className="font-semibold">{course.enrollmentCount || 0}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Completed</p>
                          <p className="font-semibold">{course.completionCount || 0}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Price</p>
                          <p className="font-semibold">{course.price || 0} LEARN</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Created</p>
                          <p className="font-semibold">{new Date(course.creationTime).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Courses Yet</h3>
                  <p className="text-gray-500 mb-4">Create your first course to start teaching</p>
                  <Button className="bg-purple-600 hover:bg-purple-700" asChild>
                    <a href="/create-course">Create Course</a>
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button variant="outline" className="w-full" asChild>
                <a href="/instructor/courses">
                  Manage All Courses <ChevronRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Student Management</CardTitle>
              <CardDescription>Track and manage your students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Student Demographics */}
                <div className="border rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-4">Student Demographics</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="h-64">
                      {categoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={categoryData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              fill="#8884d8"
                            />
                            <ChartTooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <p className="text-gray-500">No category data available</p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">Student Engagement</h4>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-500">Engagement Rate</span>
                          <span className="text-sm font-medium">{stats.engagementRate}%</span>
                        </div>
                        <Progress value={stats.engagementRate} className="h-2" />
                      </div>
                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">Completion Time</h4>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-500">Average Time to Complete</span>
                          <span className="text-sm font-medium">{stats.averageCompletionTime} days</span>
                        </div>
                        <Progress value={stats.completionRate} className="h-2" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Students */}
                <div className="border rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-4">Top Students</h3>
                  <div className="space-y-4">
                    {instructorCourses.length > 0 ? (
                      instructorCourses
                        .sort((a, b) => Number(b.completionCount) - Number(a.completionCount))
                        .slice(0, 3)
                        .map((course) => (
                          <div
                            key={course.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={course.imageUrl} alt={course.title} />
                                <AvatarFallback>{course.title.slice(0, 2)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{course.title}</p>
                                <p className="text-xs text-gray-500">
                                  {course.enrollmentCount} students enrolled
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary">{course.completionCount} Completed</Badge>
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                {course.price} LEARN
                              </Badge>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Students Yet</h3>
                        <p className="text-gray-500">Students will appear here as they enroll in your courses</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4">
              <Button variant="outline" className="w-full" asChild>
                <a href="/instructor/students">
                  View All Students <ChevronRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Earnings Tab */}
        <TabsContent value="earnings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Earnings</CardTitle>
              <CardDescription>Track your revenue and payouts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="border rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-4">Revenue Summary</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-gray-500">Total Earnings</p>
                      <p className="text-2xl font-bold">{stats.totalRevenue} LEARN</p>
                      <p className="text-xs text-gray-500 mt-1">Lifetime earnings</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-gray-500">Active Courses</p>
                      <p className="text-2xl font-bold">{stats.activeCourses}</p>
                      <p className="text-xs text-gray-500 mt-1">Currently published courses</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <p className="text-sm text-gray-500">Revenue per Student</p>
                      <p className="text-2xl font-bold">{stats.revenuePerStudent} LEARN</p>
                      <p className="text-xs text-gray-500 mt-1">Average earnings per student</p>
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-6">
                  <h3 className="font-semibold text-lg mb-4">Revenue by Course</h3>
                  <div className="space-y-4">
                    {instructorCourses.map((course) => (
                      <div key={course.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center">
                            {course.imageUrl ? (
                              <img src={course.imageUrl} alt={course.title} className="h-10 w-10 rounded object-cover" />
                            ) : (
                              <BookOpen className="h-5 w-5 text-gray-500" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium">{course.title}</h4>
                            <div className="flex items-center text-sm text-gray-500">
                              <Users className="h-3 w-3 mr-1" />
                              <span>{course.enrollmentCount || 0} students</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">
                            {Number(course.price || 0) * Number(course.enrollmentCount || 0)} LEARN
                          </p>
                          <p className="text-xs text-gray-500">{course.price || 0} LEARN per student</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks for course management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center" asChild>
              <a href="/create-course">
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

      {/* Recent Reviews */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reviews</CardTitle>
          <CardDescription>Latest feedback from students</CardDescription>
        </CardHeader>
        <CardContent>
          {reviews && reviews.length > 0 ? (
            <div className="space-y-4">
              {reviews.slice(0, 5).map((review) => {
                const course = instructorCourses.find(c => c.id === review.courseId)
                if (!course) return null
                
                return (
                  <div key={review.id} className="border rounded-lg p-4 hover:border-yellow-300 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">
                          {review.reviewer.slice(0, 6)}...{review.reviewer.slice(-4)}
                        </h4>
                        <p className="text-sm text-gray-500">{course.title}</p>
                      </div>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Number(review.rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                            }`}
                          />
                        ))}
                        <span className="ml-2 text-sm font-medium">{review.rating}/5</span>
                      </div>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
                    <p className="text-xs text-gray-500 mt-2">{review.timestamp}</p>
                  </div>
                )
              })}

              {reviews.length > 5 && (
                <div className="flex justify-center mt-4">
                  <Button variant="outline" size="sm" className="text-purple-600">
                    View All Reviews
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-10">
              <Star className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Reviews Yet</h3>
              <p className="text-gray-500">Reviews will appear here as students rate your courses</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default InstructorDashboard
