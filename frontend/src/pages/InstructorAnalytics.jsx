"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Progress } from "../components/ui/progress"
import { Badge } from "../components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import {
  Users,
  DollarSign,
  TrendingUp,
  Star,
  BarChart,
  BookOpen,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  RefreshCw,
  ChevronRight,
  PieChart,
  LineChart,
  UserCheck,
  Clock3,
} from "lucide-react"
import useSkillQuestCourses from "../hooks/useSkillQuestCourses"
import useSkillQuestInstructor from "../hooks/useSkillQuestInstructor"
import useSkillQuestReviews from "../hooks/useSkillQuestReviews"
import useSignerOrProvider from "../hooks/useSignerOrProvider"
import { Button } from "../components/ui/button"
import LoadingSpinner from "../components/LoadingSpinner"
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
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts"

const InstructorAnalytics = () => {
  const {
    instructorCourses,
    fetchInstructorCourses,
    loading: coursesLoading,
    error: coursesError,
  } = useSkillQuestCourses()

  const { instructorData, isRegistered, loading: instructorLoading, error: instructorError } = useSkillQuestInstructor()

  const { reviews, fetchInstructorReviews, loading: reviewsLoading } = useSkillQuestReviews()
  const { signer } = useSignerOrProvider()

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
  })

  const [timeFilter, setTimeFilter] = useState("all")
  const [courseFilter, setCourseFilter] = useState("all")
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Generate monthly data for charts
  const generateMonthlyData = () => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const currentMonth = new Date().getMonth()

    // Last 6 months
    const recentMonths = [
      ...months.slice(currentMonth - 5 >= 0 ? currentMonth - 5 : currentMonth - 5 + 12),
      ...months.slice(0, currentMonth + 1),
    ].slice(-6)

    // Generate enrollment data
    const enrollmentData = recentMonths.map((month, index) => {
      // Simulate increasing trend with some randomness
      const baseValue = 10 + index * 5
      return {
        name: month,
        value: Math.floor(baseValue + Math.random() * 15),
      }
    })

    // Generate revenue data
    const revenueData = recentMonths.map((month, index) => {
      // Simulate increasing trend with some randomness
      const baseValue = 50 + index * 25
      return {
        name: month,
        value: Math.floor(baseValue + Math.random() * 75),
      }
    })

    // Generate completion rate data
    const completionData = recentMonths.map((month) => {
      // Random completion rate between 50-90%
      return {
        name: month,
        value: Math.floor(50 + Math.random() * 40),
      }
    })

    return { recentMonths, enrollmentData, revenueData, completionData }
  }

  const { enrollmentData, revenueData, completionData } = generateMonthlyData()

  // Generate category distribution data
  const generateCategoryData = () => {
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
  }

  // Generate rating distribution data
  const generateRatingData = () => {
    const ratings = {
      "5 Stars": 0,
      "4 Stars": 0,
      "3 Stars": 0,
      "2 Stars": 0,
      "1 Star": 0,
    }

    // Count reviews by rating
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

    // Convert to array format for chart
    return Object.entries(ratings).map(([name, value]) => ({
      name,
      value,
    }))
  }

  const categoryData = instructorCourses.length > 0 ? generateCategoryData() : []
  const ratingData = reviews && reviews.length > 0 ? generateRatingData() : []

  // Load data when component mounts
  useEffect(() => {
    const loadData = async () => {
      if (isRegistered && signer) {
        try {
          const address = await signer.getAddress()
          await Promise.all([
            fetchInstructorCourses(),
            fetchInstructorReviews(address)
          ])
        } catch (err) {
          console.error("Error loading instructor data:", err)
        }
      }
    }
    loadData()
  }, [isRegistered, signer, fetchInstructorCourses, fetchInstructorReviews])

  useEffect(() => {
    if (instructorCourses.length > 0) {
      const totalStudents = instructorCourses.reduce((sum, course) => sum + Number(course.enrollmentCount), 0)
      const totalRevenue = instructorCourses.reduce(
        (sum, course) => sum + Number(course.price) * Number(course.enrollmentCount),
        0,
      )
      const totalCompletions = instructorCourses.reduce((sum, course) => sum + Number(course.completionCount), 0)
      const completionRate = totalStudents > 0 ? Math.round((totalCompletions / totalStudents) * 100) : 0

      // Calculate student growth (mock data - would be calculated from historical data)
      const studentGrowth = Math.floor(Math.random() * 30) + 5 // 5-35% growth

      // Calculate revenue growth (mock data - would be calculated from historical data)
      const revenueGrowth = Math.floor(Math.random() * 40) + 10 // 10-50% growth

      // Calculate engagement rate (mock data - would be calculated from actual engagement metrics)
      const engagementRate = Math.floor(Math.random() * 30) + 60 // 60-90% engagement

      // Calculate average completion time in days (mock data)
      const averageCompletionTime = Math.floor(Math.random() * 20) + 10 // 10-30 days

      let averageRating = 0
      if (reviews && reviews.length > 0) {
        const totalRating = reviews.reduce((sum, review) => sum + Number(review.rating), 0)
        averageRating = (totalRating / reviews.length).toFixed(1)
      }

      setStats({
        totalStudents,
        totalRevenue,
        totalCourses: instructorCourses.length,
        completionRate,
        averageRating,
        studentGrowth,
        revenueGrowth,
        engagementRate,
        averageCompletionTime,
      })
    }
  }, [instructorCourses, reviews])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await fetchInstructorCourses()
      await fetchInstructorReviews()
      setTimeout(() => {
        setIsRefreshing(false)
      }, 1000)
    } catch (error) {
      console.error("Error refreshing data:", error)
      setIsRefreshing(false)
    }
  }

  const handleExportData = () => {
    // In a real implementation, this would generate and download a CSV/Excel file
    alert("Analytics data export functionality would be implemented here")
  }

  if (coursesLoading || instructorLoading || reviewsLoading) {
    return <LoadingSpinner message="Loading analytics data..." />
  }

  if (coursesError || instructorError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-red-500">Error: {coursesError || instructorError}</div>
        <Button onClick={handleRefresh} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" /> Try Again
        </Button>
      </div>
    )
  }

  if (!isRegistered) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <h2 className="text-xl font-semibold">Become an Instructor</h2>
        <p className="text-gray-500">Register as an instructor to view analytics</p>
        <Button onClick={() => (window.location.href = "/instructor")} className="bg-purple-600 hover:bg-purple-700">
          Register as Instructor
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-gray-500">Track your course performance and student engagement</p>
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

          <Button variant="outline" size="sm" onClick={handleExportData} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
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

        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by Course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {instructorCourses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

      {/* Additional Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCourses}</div>
            <p className="text-xs text-gray-500">Published courses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <UserCheck className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.engagementRate}%</div>
            <div className="w-full mt-2">
              <Progress value={stats.engagementRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
            <Clock3 className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageCompletionTime} days</div>
            <p className="text-xs text-gray-500">To finish a course</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue per Student</CardTitle>
            <BarChart className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalStudents > 0 ? Math.round(stats.totalRevenue / stats.totalStudents) : 0} LEARN
            </div>
            <p className="text-xs text-gray-500">Average earnings</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <Tabs defaultValue="enrollment" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="enrollment">Enrollment Trends</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
          <TabsTrigger value="performance">Course Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="enrollment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Enrollment Trends</CardTitle>
              <CardDescription>Monthly enrollment data for your courses</CardDescription>
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

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Course Category Distribution</CardTitle>
                <CardDescription>Breakdown by course category</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <div className="h-64">
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
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
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500">No category data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Student Demographics</CardTitle>
                <CardDescription>Student background and experience</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <div className="flex items-center justify-center h-full flex-col gap-2">
                  <PieChart className="h-12 w-12 text-gray-300" />
                  <p className="text-gray-500">Demographics data coming soon</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Monthly revenue data for your courses</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
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

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Course</CardTitle>
                <CardDescription>Top earning courses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {instructorCourses
                    .sort(
                      (a, b) =>
                        Number(b.price) * Number(b.enrollmentCount) - Number(a.price) * Number(a.enrollmentCount),
                    )
                    .slice(0, 5)
                    .map((course, index) => {
                      const revenue = Number(course.price) * Number(course.enrollmentCount)
                      const percentage = stats.totalRevenue > 0 ? Math.round((revenue / stats.totalRevenue) * 100) : 0

                      return (
                        <div key={course.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium truncate max-w-[200px]">{course.title}</span>
                            <span className="text-sm font-medium">{revenue} LEARN</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={percentage} className="h-2" />
                            <span className="text-xs text-gray-500 w-12 text-right">{percentage}%</span>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Projected Revenue</CardTitle>
                <CardDescription>Estimated future earnings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-full flex-col gap-2">
                  <LineChart className="h-12 w-12 text-gray-300" />
                  <p className="text-gray-500">Projection data coming soon</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Completion Rates</CardTitle>
              <CardDescription>Monthly course completion rates</CardDescription>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={completionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2} />
                  <ChartTooltip />
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Rating Distribution</CardTitle>
                <CardDescription>Breakdown of course ratings</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                {ratingData.length > 0 && ratingData.some((item) => item.value > 0) ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={ratingData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          label
                        >
                          {({ cx, cy, midAngle, outerRadius, percent, index }) => {
                            const RADIAN = Math.PI / 180
                            const radius = 25 + outerRadius + 10
                            const x = cx + radius * Math.cos(-midAngle * RADIAN)
                            const y = cy + radius * Math.sin(-midAngle * RADIAN)

                            return (
                              <text
                                x={x}
                                y={y}
                                fill="#8884d8"
                                textAnchor={x > cx ? "start" : "end"}
                                dominantBaseline="central"
                                fontSize="12px"
                              >
                                {ratingData[index].name}
                              </text>
                            )
                          }}
                        </Pie>
                        <ChartTooltip />
                        <Legend />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No rating data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Student Engagement</CardTitle>
                <CardDescription>Lesson completion and quiz attempts</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <div className="flex items-center justify-center h-full flex-col gap-2">
                  <BarChart className="h-12 w-12 text-gray-300" />
                  <p className="text-gray-500">Engagement data coming soon</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Course Performance */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Course Performance</CardTitle>
            <CardDescription>Detailed analytics for each course</CardDescription>
          </div>
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {instructorCourses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {instructorCourses.length > 0 ? (
              instructorCourses
                .filter((course) => courseFilter === "all" || course.id === courseFilter)
                .map((course) => {
                  const completionRate =
                    course.enrollmentCount > 0
                      ? Math.round((Number(course.completionCount) / Number(course.enrollmentCount)) * 100)
                      : 0
                  const revenue = Number(course.price) * Number(course.enrollmentCount)

                  // Calculate course-specific metrics
                  const avgRating =
                    reviews && reviews.length > 0
                      ? reviews
                          .filter((review) => review.courseId === course.id)
                          .reduce((sum, review) => sum + Number(review.rating), 0) /
                        reviews.filter((review) => review.courseId === course.id).length
                      : 0

                  return (
                    <div key={course.id} className="border rounded-lg p-4 hover:border-purple-300 transition-colors">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">{course.title}</h3>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {Array.isArray(course.tags) && course.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{course.price} LEARN</p>
                          <p className="text-xs text-gray-500">Per student</p>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Students</p>
                          <p className="font-semibold">{course.enrollmentCount}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Completed</p>
                          <p className="font-semibold">{course.completionCount}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Revenue</p>
                          <p className="font-semibold">{revenue} LEARN</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Avg. Rating</p>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < Math.floor(avgRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-500">Completion Rate</p>
                          <div className="flex items-center space-x-2">
                            <Progress value={completionRate} className="w-full" />
                            <span className="font-semibold">{completionRate}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 flex items-center"
                          onClick={() => (window.location.href = `/course/${course.id}/analytics`)}
                        >
                          View detailed analytics
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })
            ) : (
              <div className="text-center py-10">
                <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No Courses Yet</h3>
                <p className="text-gray-500 mb-4">Create your first course to see analytics</p>
                <Button
                  onClick={() => (window.location.href = "/create-course")}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Create a Course
                </Button>
              </div>
            )}
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
              {reviews.slice(0, 5).map((review) => (
                <div key={review.id} className="border rounded-lg p-4 hover:border-yellow-300 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">
                        {review.reviewer.slice(0, 6)}...{review.reviewer.slice(-4)}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {instructorCourses.find((c) => c.id === review.courseId)?.title || `Course #${review.courseId}`}
                      </p>
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
              ))}

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

export default InstructorAnalytics
