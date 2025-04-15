import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Card, CardContent } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Badge } from "../components/ui/badge"
import { Clock, CheckCircle, AlertCircle } from "lucide-react"
import CourseCard from "../components/courses/CourseCard"

const MyLearning = () => {
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
      lastAccessed: "2 days ago",
    },
    {
      id: 2,
      title: "Smart Contract Development",
      instructor: "Maria Garcia",
      progress: 30,
      image: "/placeholder.svg?height=200&width=300",
      xpReward: 750,
      tokenReward: 100,
      lastAccessed: "5 days ago",
    },
    {
      id: 3,
      title: "Web3 Basics",
      instructor: "David Lee",
      progress: 100,
      image: "/placeholder.svg?height=200&width=300",
      xpReward: 450,
      tokenReward: 40,
      lastAccessed: "2 weeks ago",
      completed: true,
    },
    {
      id: 4,
      title: "Cryptocurrency Economics",
      instructor: "Sarah Wilson",
      progress: 100,
      image: "/placeholder.svg?height=200&width=300",
      xpReward: 600,
      tokenReward: 60,
      lastAccessed: "1 month ago",
      completed: true,
    },
  ]

  const inProgressCourses = enrolledCourses.filter((course) => !course.completed)
  const completedCourses = enrolledCourses.filter((course) => course.completed)

  // Assignments and quizzes
  const assignments = [
    {
      id: 1,
      title: "Build a Simple Blockchain",
      course: "Blockchain Fundamentals",
      dueDate: "2023-07-25",
      status: "pending",
    },
    {
      id: 2,
      title: "Smart Contract Security Analysis",
      course: "Smart Contract Development",
      dueDate: "2023-07-30",
      status: "pending",
    },
  ]

  const quizzes = [
    {
      id: 1,
      title: "Blockchain Concepts Quiz",
      course: "Blockchain Fundamentals",
      questions: 10,
      timeLimit: "20 minutes",
      status: "pending",
    },
    {
      id: 2,
      title: "Smart Contract Basics",
      course: "Smart Contract Development",
      questions: 15,
      timeLimit: "30 minutes",
      status: "completed",
      score: "85%",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">My Learning</h1>
      </div>

      <Tabs defaultValue="courses">
        <TabsList>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="mt-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">In Progress</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {inProgressCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Completed</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {completedCourses.map((course) => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="mt-6">
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <Card key={assignment.id}>
                <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1 mb-4 md:mb-0">
                    <h3 className="font-semibold">{assignment.title}</h3>
                    <p className="text-sm text-gray-500">Course: {assignment.course}</p>
                    <div className="flex items-center mt-2">
                      <Clock className="h-4 w-4 text-gray-500 mr-1" />
                      <span className="text-sm">Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={assignment.status === "completed" ? "success" : "outline"}
                      className={
                        assignment.status === "completed" ? "bg-green-100 text-green-800 border-green-200" : ""
                      }
                    >
                      {assignment.status === "completed" ? "Completed" : "Pending"}
                    </Badge>
                    <Button>{assignment.status === "completed" ? "View Submission" : "Start Assignment"}</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="quizzes" className="mt-6">
          <div className="space-y-4">
            {quizzes.map((quiz) => (
              <Card key={quiz.id}>
                <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1 mb-4 md:mb-0">
                    <h3 className="font-semibold">{quiz.title}</h3>
                    <p className="text-sm text-gray-500">Course: {quiz.course}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <div className="flex items-center">
                        <AlertCircle className="h-4 w-4 text-gray-500 mr-1" />
                        <span className="text-sm">{quiz.questions} questions</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-500 mr-1" />
                        <span className="text-sm">{quiz.timeLimit}</span>
                      </div>
                    </div>
                    {quiz.status === "completed" && (
                      <div className="flex items-center mt-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                        <span className="text-sm">Score: {quiz.score}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      variant={quiz.status === "completed" ? "success" : "outline"}
                      className={quiz.status === "completed" ? "bg-green-100 text-green-800 border-green-200" : ""}
                    >
                      {quiz.status === "completed" ? "Completed" : "Pending"}
                    </Badge>
                    <Button>{quiz.status === "completed" ? "Review Quiz" : "Start Quiz"}</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default MyLearning
