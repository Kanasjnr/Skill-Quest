import { Users, BookOpen, Award, DollarSign, Clock, MessageSquare } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Progress } from "../components/ui/progress"
import { Badge } from "../components/ui/badge"

const InstructorDashboard = () => {
  // Mock data
  const courses = [
    {
      id: 1,
      title: "Blockchain Fundamentals",
      students: 1250,
      completionRate: 68,
      rating: 4.8,
      revenue: 12500,
      lastUpdated: "2 weeks ago",
    },
    {
      id: 2,
      title: "Smart Contract Development",
      students: 850,
      completionRate: 45,
      rating: 4.6,
      revenue: 8500,
      lastUpdated: "1 month ago",
    },
    {
      id: 3,
      title: "Web3 Basics",
      students: 1500,
      completionRate: 72,
      rating: 4.9,
      revenue: 15000,
      lastUpdated: "3 weeks ago",
    },
  ]

  const recentReviews = [
    {
      id: 1,
      courseId: 1,
      courseName: "Blockchain Fundamentals",
      studentName: "Jane Doe",
      rating: 5,
      comment: "Excellent course! The content is well-structured and easy to follow.",
      date: "2 days ago",
    },
    {
      id: 2,
      courseId: 3,
      courseName: "Web3 Basics",
      studentName: "Mike Smith",
      rating: 4,
      comment: "Great introduction to Web3. Would have liked more practical examples.",
      date: "1 week ago",
    },
  ]

  const recentQuestions = [
    {
      id: 1,
      courseId: 2,
      courseName: "Smart Contract Development",
      studentName: "Alex Johnson",
      question: "Could you explain more about gas optimization techniques?",
      date: "3 days ago",
    },
    {
      id: 2,
      courseId: 1,
      courseName: "Blockchain Fundamentals",
      studentName: "Sarah Wilson",
      question: "What are the main differences between PoW and PoS?",
      date: "5 days ago",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Instructor Dashboard</h1>
        <Button className="bg-purple-600 hover:bg-purple-700">Create New Course</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,600</div>
            <p className="text-xs text-muted-foreground">+250 this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">1 in draft</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">36,000 LEARN</div>
            <p className="text-xs text-muted-foreground">+5,200 this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Award className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.8/5.0</div>
            <p className="text-xs text-muted-foreground">Based on 350 reviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Course Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Course Performance</CardTitle>
          <CardDescription>Overview of your course metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {courses.map((course) => (
              <div key={course.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{course.title}</h3>
                  <Badge variant="outline">Last updated: {course.lastUpdated}</Badge>
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                  <div>
                    <p className="text-sm text-gray-500">Students</p>
                    <p className="text-lg font-medium">{course.students}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Completion Rate</p>
                    <div className="flex items-center space-x-2">
                      <Progress value={course.completionRate} className="h-2 flex-1" />
                      <span className="text-sm font-medium">{course.completionRate}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Rating</p>
                    <div className="flex items-center">
                      <span className="text-lg font-medium mr-1">{course.rating}</span>
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <Award
                            key={i}
                            className="h-4 w-4"
                            fill={i < Math.floor(course.rating) ? "currentColor" : "none"}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Revenue</p>
                    <p className="text-lg font-medium">{course.revenue} LEARN</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Two Column Layout */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Reviews */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Reviews</CardTitle>
            <CardDescription>Latest feedback from your students</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentReviews.map((review) => (
              <div key={review.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">{review.courseName}</h4>
                    <p className="text-sm text-gray-500">{review.studentName}</p>
                  </div>
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Award key={i} className="h-4 w-4" fill={i < review.rating ? "currentColor" : "none"} />
                    ))}
                  </div>
                </div>
                <p className="text-sm mb-2">{review.comment}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">{review.date}</span>
                  <Button variant="outline" size="sm">
                    Reply
                  </Button>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full">
              View All Reviews
            </Button>
          </CardContent>
        </Card>

        {/* Recent Questions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Questions</CardTitle>
            <CardDescription>Questions from your students</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentQuestions.map((question) => (
              <div key={question.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">{question.courseName}</h4>
                    <p className="text-sm text-gray-500">{question.studentName}</p>
                  </div>
                  <Badge variant="outline">{question.date}</Badge>
                </div>
                <p className="text-sm mb-2">{question.question}</p>
                <Button className="w-full bg-purple-600 hover:bg-purple-700">Answer Question</Button>
              </div>
            ))}
            <Button variant="outline" className="w-full">
              View All Questions
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* To-Do List */}
      <Card>
        <CardHeader>
          <CardTitle>Instructor To-Do List</CardTitle>
          <CardDescription>Tasks that need your attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center mr-4">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Update Course Content</h4>
                <p className="text-sm text-gray-500">Smart Contract Development needs updated examples</p>
              </div>
              <Button variant="outline" size="sm">
                View
              </Button>
            </div>

            <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Answer Student Questions</h4>
                <p className="text-sm text-gray-500">5 unanswered questions across your courses</p>
              </div>
              <Button variant="outline" size="sm">
                View
              </Button>
            </div>

            <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center mr-4">
                <Award className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium">Review Course Certificates</h4>
                <p className="text-sm text-gray-500">15 certificates pending your review</p>
              </div>
              <Button variant="outline" size="sm">
                View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default InstructorDashboard
