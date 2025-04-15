import { Award, BookOpen, GraduationCap, TrendingUp, Clock, Zap, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Progress } from "../components/ui/progress"
import { Button } from "../components/ui/button"
import CourseCard from "../components/courses/CourseCard"
import AchievementCard from "../components/achivement/AchievementCard"
import LeaderboardCard from "../components/Leaderboard/LeaderboardCard"
import ActivityFeed from "../components/activity/ActivityFeed"

const Dashboard = () => {
  // Mock data
  const enrolledCourses = [
    {
      id: 1,
      title: "Blockchain Fundamentals",
      instructor: "Alex Johnson",
      progress: 75,
      image: "/placeholder.svg?height=200&width=300",
      xpReward: 500,
      tokenReward: 50,
    },
    {
      id: 2,
      title: "Smart Contract Development",
      instructor: "Maria Garcia",
      progress: 30,
      image: "/placeholder.svg?height=200&width=300",
      xpReward: 750,
      tokenReward: 100,
    },
  ]
  
  // Consistent Icon Color
  const iconColor = "text-sky-600 dark:text-sky-400";
  const accentIconColor = "text-yellow-500 dark:text-yellow-400";
  const positiveIconColor = "text-green-500 dark:text-green-400";

  return (
    // Removed the outer bg-slate-50/rounded-lg as it's handled by DashboardLayout now
    <div className="space-y-8"> 
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Dashboard</h1>
        {/* Use sky blue for primary action */}
        <Button className="bg-sky-600 hover:bg-sky-700 text-white">Continue Learning</Button>
      </div>

      {/* Stats Cards - Added shadow */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"> 
        <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total XP</CardTitle>
            <TrendingUp className={`h-4 w-4 ${iconColor}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">1,250 XP</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Level 12 • 250 XP to next level</p>
            {/* Progress bar with sky blue */}
            <Progress value={80} className="h-2 mt-2 bg-slate-200 dark:bg-slate-700 [&>div]:bg-sky-600" /> 
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">LEARN Tokens</CardTitle>
            <Zap className={`h-4 w-4 ${accentIconColor}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">250 LEARN</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">+50 earned this week</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Courses</CardTitle>
            <BookOpen className={`h-4 w-4 ${iconColor}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">5 / 12</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">5 completed • 7 in progress</p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Certificates</CardTitle>
            <Award className={`h-4 w-4 ${positiveIconColor}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">5</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">3 shared on profile</p>
          </CardContent>
        </Card>
      </div>

      {/* Continue Learning Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">Continue Learning</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {enrolledCourses.map((course) => (
            // Assuming CourseCard also uses Card component internally, it might inherit styles
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>

      {/* Two Column Layout - Added shadow to cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Achievements */}
        <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-100">Recent Achievements</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">Your latest accomplishments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AchievementCard
              title="Course Completer"
              description="Complete 5 courses"
              icon={<GraduationCap className={`h-8 w-8 ${iconColor}`} />}
              date="2 days ago"
              xp={100}
            />
            <AchievementCard
              title="Fast Learner"
              description="Complete a course in less than a week"
              icon={<Clock className={`h-8 w-8 ${iconColor}`} />}
              date="1 week ago"
              xp={50}
            />
            <AchievementCard
              title="Social Learner"
              description="Invite 3 friends to the platform"
              icon={<Users className={`h-8 w-8 ${positiveIconColor}`} />}
              date="2 weeks ago"
              xp={75}
            />
            <Button variant="outline" className="w-full border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
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
            <Button variant="outline" className="w-full mt-4 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
              View Full Leaderboard
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Activity Feed - Added shadow */}
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
