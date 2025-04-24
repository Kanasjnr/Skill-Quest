"use client"

import { useEffect, useState } from "react"
import { Award, BookOpen, GraduationCap, TrendingUp, Clock, Zap, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Progress } from "../components/ui/progress"
import { Button } from "../components/ui/button"
import CourseCard from "../components/courses/CourseCard"
import AchievementCard from "../components/achivement/AchievementCard"
import LeaderboardCard from "../components/Leaderboard/LeaderboardCard"
import ActivityFeed from "../components/activity/ActivityFeed"
import useSkillQuestUser from "../hooks/useSkillQuestUser"
import useSkillQuestEnrollment from "../hooks/useSkillQuestEnrollment"
import useSkillQuestToken from "../hooks/useSkillQuestToken"
import useSignerOrProvider from "../hooks/useSignerOrProvider"
import { toast } from "react-toastify"

const Dashboard = () => {
  const { userData, isRegistered, registerUser, loading: userLoading, error: userError } = useSkillQuestUser()
  const { enrolledCourses, loading: enrollmentLoading, error: enrollmentError } = useSkillQuestEnrollment()
  const { balance, loading: tokenLoading, error: tokenError } = useSkillQuestToken()
  const { signer } = useSignerOrProvider()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Set loading state based on all data loading states
    setLoading(userLoading || enrollmentLoading || tokenLoading)
  }, [userLoading, enrollmentLoading, tokenLoading])

  // Handle registration if user is not registered
  const handleRegistration = async () => {
    if (!signer) {
      toast.error("Please connect your wallet")
      return
    }

    try {
      const success = await registerUser()
      if (success) {
        toast.success("Registration successful!")
      }
    } catch (error) {
      console.error("Registration error:", error)
      toast.error("Registration failed: " + (error.message || "Unknown error"))
    }
  }

  // Achievements - this would ideally come from a separate hook
  const achievements = [
    {
      id: 1,
      title: "Course Completer",
      description: "Complete 5 courses",
      icon: <GraduationCap className="h-8 w-8 text-sky-600 dark:text-sky-400" />,
      date: "2 days ago",
      xp: 100,
    },
    {
      id: 2,
      title: "Fast Learner",
      description: "Complete a course in less than a week",
      icon: <Clock className="h-8 w-8 text-sky-600 dark:text-sky-400" />,
      date: "1 week ago",
      xp: 50,
    },
    {
      id: 3,
      title: "Social Learner",
      description: "Invite 3 friends to the platform",
      icon: <Users className="h-8 w-8 text-green-500 dark:text-green-400" />,
      date: "2 weeks ago",
      xp: 75,
    },
  ]

  // Consistent Icon Color
  const iconColor = "text-sky-600 dark:text-sky-400"
  const accentIconColor = "text-yellow-500 dark:text-yellow-400"
  const positiveIconColor = "text-green-500 dark:text-green-400"

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading dashboard data...</div>
  }

  if (!signer) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <h2 className="text-xl font-semibold">Connect Your Wallet</h2>
        <p className="text-gray-500">Please connect your wallet to view your dashboard</p>
      </div>
    )
  }

  if (!isRegistered) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <h2 className="text-xl font-semibold">Welcome to SkillQuest</h2>
        <p className="text-gray-500">Register to start your learning journey</p>
        <Button onClick={handleRegistration} className="bg-sky-600 hover:bg-sky-700 text-white">
          Register Now
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Dashboard</h1>
        <Button className="bg-sky-600 hover:bg-sky-700 text-white">Continue Learning</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total XP</CardTitle>
            <TrendingUp className={`h-4 w-4 ${iconColor}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{userData?.xp || 0} XP</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Level {Math.floor((userData?.xp || 0) / 100) + 1}
            </p>
            <Progress
              value={(userData?.xp || 0) % 100}
              className="h-2 mt-2 bg-slate-200 dark:bg-slate-700 [&>div]:bg-sky-600"
            />
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">LEARN Tokens</CardTitle>
            <Zap className={`h-4 w-4 ${accentIconColor}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{balance} LEARN</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Available balance</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Courses</CardTitle>
            <BookOpen className={`h-4 w-4 ${iconColor}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {enrolledCourses.filter((c) => c.progress === 100).length} / {enrolledCourses.length}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {enrolledCourses.filter((c) => c.progress === 100).length} completed •{" "}
              {enrolledCourses.filter((c) => c.progress < 100).length} in progress
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Certificates</CardTitle>
            <Award className={`h-4 w-4 ${positiveIconColor}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {userData?.totalCertificates || 0}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Earned certificates</p>
          </CardContent>
        </Card>
      </div>

      {/* Continue Learning Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">Continue Learning</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {enrolledCourses.length > 0 ? (
            enrolledCourses
              .filter((course) => course.progress < 100)
              .slice(0, 2)
              .map((course) => <CourseCard key={course.id} course={course} />)
          ) : (
            <div className="col-span-2 text-center py-10 bg-white dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700/50">
              <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium mb-2">No Courses Yet</h3>
              <p className="text-gray-500 mb-4">Enroll in courses to start learning</p>
              <Button asChild className="bg-sky-600 hover:bg-sky-700">
                <a href="/courses">Browse Courses</a>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Achievements */}
        <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-100">Recent Achievements</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              Your latest accomplishments
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {achievements.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                title={achievement.title}
                description={achievement.description}
                icon={achievement.icon}
                date={achievement.date}
                xp={achievement.xp}
              />
            ))}
            <Button
              variant="outline"
              className="w-full border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              View All Achievements
            </Button>
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-100">XP Leaderboard</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">Top learners this week</CardDescription>
          </CardHeader>
          <CardContent>
            <LeaderboardCard />
            <Button
              variant="outline"
              className="w-full mt-4 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              View Full Leaderboard
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">Recent Activity</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">Your learning journey</CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityFeed />
        </CardContent>
      </Card>
    </div>
  )
}

export default Dashboard
