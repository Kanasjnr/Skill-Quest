"use client"

import { useState, useEffect } from "react"
import { useParams } from "react-router-dom"
import { Clock, Award, Zap, BookOpen, CheckCircle, Users, Star, MessageSquare, Share2 } from "lucide-react"
import { Button } from "../components/ui/button"
import { Progress } from "../components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar"
import { Separator } from "../components/ui/separator"
import useSkillQuestCourses from "../hooks/useSkillQuestCourses"
import useSkillQuestEnrollment from "../hooks/useSkillQuestEnrollment"
import useSkillQuestToken from "../hooks/useSkillQuestToken"
import useSignerOrProvider from "../hooks/useSignerOrProvider"
import { toast } from "react-toastify"

const CourseDetails = () => {
  const { id } = useParams()
  const courseId = Number.parseInt(id)
  const [course, setCourse] = useState(null)
  const [courseProgress, setCourseProgress] = useState(0)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const { getCourseDetails, loading: courseLoading, error: courseError } = useSkillQuestCourses()
  const {
    enrollCourse,
    getCourseProgress,
    enrolledCourses,
    completedCourses,
    loading: enrollmentLoading,
  } = useSkillQuestEnrollment()
  const { balance, loading: tokenLoading } = useSkillQuestToken()
  const { signer } = useSignerOrProvider()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (!courseId) return

      try {
        setLoading(true)
        const courseDetails = await getCourseDetails(courseId)
        setCourse(courseDetails)

        // Check if user is enrolled
        const isUserEnrolled = enrolledCourses.some((c) => Number(c.id) === courseId)
        setIsEnrolled(isUserEnrolled)

        // Check if course is completed
        const isUserCompleted = completedCourses.some((c) => Number(c.id) === courseId)
        setIsCompleted(isUserCompleted)

        // Get progress if enrolled
        if (isUserEnrolled && signer) {
          const progress = await getCourseProgress(courseId)
          setCourseProgress(Number(progress))
        }
      } catch (error) {
        console.error("Error fetching course details:", error)
        toast.error("Failed to load course details")
      } finally {
        setLoading(false)
      }
    }

    fetchCourseDetails()
  }, [courseId, getCourseDetails, enrolledCourses, completedCourses, getCourseProgress, signer])

  const handleEnroll = async () => {
    if (!signer) {
      toast.error("Please connect your wallet to enroll")
      return
    }

    if (!course) return

    // Check if user has enough tokens
    if (Number(balance) < Number(course.price)) {
      toast.error(`Insufficient LEARN token balance. You need ${course.price} LEARN tokens.`)
      return
    }

    try {
      const result = await enrollCourse(courseId)
      if (result) {
        setIsEnrolled(true)
        setCourseProgress(0)
        toast.success("Successfully enrolled in the course!")
      }
    } catch (error) {
      console.error("Enrollment error:", error)
      toast.error("Failed to enroll in the course")
    }
  }

  if (loading || courseLoading || enrollmentLoading || tokenLoading) {
    return <div className="flex justify-center items-center h-64">Loading course details...</div>
  }

  if (courseError) {
    return <div className="text-red-500">Error loading course: {courseError}</div>
  }

  if (!course) {
    return <div className="text-center py-10">Course not found</div>
  }

  return (
    <div className="space-y-6">
      {/* Course Header */}
      <div className="relative">
        <div className="aspect-[21/9] w-full overflow-hidden rounded-lg">
          <img
            src={course.metadataURI || "/placeholder.svg?height=400&width=800"}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
          <div className="p-6 text-white">
            <div className="flex flex-wrap gap-2 mb-2">
              {course.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="bg-white/20 text-white">
                  {tag}
                </Badge>
              ))}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{course.title}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span>{course.enrollmentCount} students</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>{course.duration} days</span>
              </div>
              <div className="flex items-center">
                <BookOpen className="h-4 w-4 mr-1" />
                <span>{course.completionCount} completed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
              <TabsTrigger value="instructor">Instructor</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-6">
              <div>
                <h2 className="text-xl font-semibold mb-2">About This Course</h2>
                <p className="text-gray-700 dark:text-gray-300">{course.description}</p>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-2">What You'll Learn</h2>
                <ul className="grid md:grid-cols-2 gap-2">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Understand core concepts and principles</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Apply knowledge in practical scenarios</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Develop critical thinking skills</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Gain practical experience through exercises</span>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-semibold mb-2">Prerequisites</h2>
                {course.prerequisites && course.prerequisites.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-1">
                    {course.prerequisites.map((prereqId, index) => (
                      <li key={index}>Course #{prereqId}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-700 dark:text-gray-300">
                    No prerequisites required. This course is suitable for beginners.
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="curriculum" className="space-y-4 mt-6">
              <h2 className="text-xl font-semibold mb-2">Course Curriculum</h2>
              <div className="space-y-4">
                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-lg">Module 1: Introduction</CardTitle>
                  </CardHeader>
                  <CardContent className="py-0">
                    <ul className="divide-y">
                      <li className="py-3 flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="h-5 w-5 border border-gray-300 rounded-full mr-2"></div>
                          <span>Course Overview</span>
                        </div>
                        <span className="text-sm text-gray-500">15 min</span>
                      </li>
                      <li className="py-3 flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="h-5 w-5 border border-gray-300 rounded-full mr-2"></div>
                          <span>Key Concepts</span>
                        </div>
                        <span className="text-sm text-gray-500">20 min</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3">
                    <CardTitle className="text-lg">Module 2: Core Principles</CardTitle>
                  </CardHeader>
                  <CardContent className="py-0">
                    <ul className="divide-y">
                      <li className="py-3 flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="h-5 w-5 border border-gray-300 rounded-full mr-2"></div>
                          <span>Fundamental Principles</span>
                        </div>
                        <span className="text-sm text-gray-500">25 min</span>
                      </li>
                      <li className="py-3 flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="h-5 w-5 border border-gray-300 rounded-full mr-2"></div>
                          <span>Advanced Concepts</span>
                        </div>
                        <span className="text-sm text-gray-500">30 min</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="instructor" className="mt-6">
              <div className="flex items-start space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src="/placeholder.svg?height=64&width=64" />
                  <AvatarFallback className="bg-purple-500 text-white text-lg">
                    {course.instructor.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-semibold">Instructor</h2>
                  <p className="text-gray-500 mb-2">{course.instructor}</p>
                  <p className="text-gray-700 dark:text-gray-300">
                    This instructor has created {course.title} and is an expert in this field.
                  </p>
                  <div className="mt-4 flex space-x-2">
                    <Button variant="outline" size="sm">
                      View Profile
                    </Button>
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold">4.8</div>
                    <div className="flex text-yellow-400 mt-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4" fill={i < 4 ? "currentColor" : "none"} />
                      ))}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">{course.enrollmentCount} students</div>
                  </div>
                  <div className="flex-1">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center space-x-2 mb-1">
                        <div className="text-sm w-2">{rating}</div>
                        <Star className="h-4 w-4 text-yellow-400" />
                        <Progress
                          value={rating === 5 ? 70 : rating === 4 ? 20 : rating === 3 ? 7 : rating === 2 ? 2 : 1}
                          className="h-2 flex-1"
                        />
                        <div className="text-sm w-8">
                          {rating === 5
                            ? "70%"
                            : rating === 4
                              ? "20%"
                              : rating === 3
                                ? "7%"
                                : rating === 2
                                  ? "2%"
                                  : "1%"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  {/* Sample reviews */}
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4">
                      <Avatar>
                        <AvatarFallback className="bg-green-500 text-white">JD</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Jane Doe</h4>
                          <span className="text-sm text-gray-500">2 weeks ago</span>
                        </div>
                        <div className="flex text-yellow-400 my-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-3 w-3" fill="currentColor" />
                          ))}
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">
                          Excellent course! The content is well-structured and easy to follow.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <Avatar>
                        <AvatarFallback className="bg-blue-500 text-white">MS</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Mike Smith</h4>
                          <span className="text-sm text-gray-500">1 month ago</span>
                        </div>
                        <div className="flex text-yellow-400 my-1">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="h-3 w-3" fill={i < 4 ? "currentColor" : "none"} />
                          ))}
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">
                          Great introduction. I would have liked more practical examples, but overall it's a solid
                          foundation.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full">
                    Load More Reviews
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Card className="sticky top-6">
            <CardContent className="p-6 space-y-4">
              {isEnrolled ? (
                <>
                  <div className="space-y-2">
                    <h3 className="font-semibold">Your Progress</h3>
                    <Progress value={courseProgress} className="h-2" />
                    <p className="text-sm text-gray-500">{courseProgress}% Complete</p>
                  </div>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    {isCompleted ? "Review Course" : "Continue Learning"}
                  </Button>
                </>
              ) : (
                <>
                  <div className="text-center">
                    <div className="text-3xl font-bold mb-2">{course.price} LEARN</div>
                    <div className="flex justify-center space-x-4 mb-4">
                      <div className="flex items-center">
                        <Award className="h-5 w-5 text-purple-600 mr-1" />
                        <span>{course.xpReward} XP</span>
                      </div>
                      <div className="flex items-center">
                        <Zap className="h-5 w-5 text-yellow-500 mr-1" />
                        <span>{course.tokenReward} LEARN</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    onClick={handleEnroll}
                    disabled={!signer || course.isPaused}
                  >
                    {course.isPaused ? "Course Paused" : "Enroll Now"}
                  </Button>
                </>
              )}

              <div className="space-y-3 pt-4">
                <h3 className="font-semibold">This course includes:</h3>
                <ul className="space-y-2">
                  <li className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{course.duration} days of access</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <BookOpen className="h-4 w-4 mr-2 text-gray-500" />
                    <span>Comprehensive learning modules</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 mr-2 text-gray-500" />
                    <span>Quizzes and assignments</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <Award className="h-4 w-4 mr-2 text-gray-500" />
                    <span>Certificate of completion</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <MessageSquare className="h-4 w-4 mr-2 text-gray-500" />
                    <span>Instructor Q&A access</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4">
                <Button variant="outline" className="w-full flex items-center justify-center">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Course
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default CourseDetails
