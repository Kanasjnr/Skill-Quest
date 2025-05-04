"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Clock, Award, Zap, BookOpen, Users, List, Loader2, AlertCircle } from 'lucide-react'
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { toast } from "react-toastify"
import useSkillQuestCourses from "../hooks/useSkillQuestCourses"
import useSignerOrProvider from "../hooks/useSignerOrProvider"

const CourseDetails = () => {
  const { id: courseId } = useParams()
  const navigate = useNavigate()
  const { signer } = useSignerOrProvider()
  const { getCourseDetails, enrollInCourse, contract } = useSkillQuestCourses()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [isCheckingEnrollment, setIsCheckingEnrollment] = useState(true)

  console.log("[DEBUG] CourseDetails component mounted with courseId:", courseId)
  console.log("[DEBUG] Current state:", { signer: !!signer, contract: !!contract, loading, error, course: !!course })

  useEffect(() => {
    console.log("[DEBUG] useEffect triggered with dependencies:", {
      courseId,
      hasGetCourseDetails: !!getCourseDetails,
      hasContract: !!contract,
      hasSigner: !!signer
    })

    const loadCourseDetails = async () => {
      try {
        console.log("[DEBUG] Starting to load course details for ID:", courseId)
        setLoading(true)
        setError(null)

        // Wait for contract and signer to be available
        if (!contract || !signer) {
          console.log("[DEBUG] Waiting for contract and signer to be initialized...")
          return
        }

        console.log("[DEBUG] Contract and signer available, loading course details...")
        const courseDetails = await getCourseDetails(courseId)
        console.log("[DEBUG] Course details loaded:", courseDetails)
        
        if (courseDetails) {
          setCourse(courseDetails)

          // Check if user is enrolled
          try {
            const userAddress = await signer.getAddress()
            const isEnrolled = await contract.courseEnrollments(BigInt(courseId), userAddress)
            console.log("[DEBUG] Enrollment status:", isEnrolled)
            setIsEnrolled(isEnrolled)
          } catch (err) {
            console.error("[DEBUG] Error checking enrollment:", err)
          }
        } else {
          console.error("[DEBUG] No course details returned")
          setError("Course not found")
        }
      } catch (err) {
        console.error("[DEBUG] Error loading course details:", err)
        console.error("[DEBUG] Error details:", {
          message: err.message,
          code: err.code,
          data: err.data,
          stack: err.stack
        })
        setError(err.message || "Failed to load course details")
      } finally {
        setLoading(false)
        setIsCheckingEnrollment(false)
      }
    }

    if (courseId) {
      loadCourseDetails()
    }
  }, [courseId, getCourseDetails, contract, signer])

  // Add effect to log state changes
  useEffect(() => {
    console.log("[DEBUG] State updated:", { loading, error, hasCourse: !!course })
  }, [loading, error, course])

  const handleEnroll = async () => {
    if (!courseId) return

    try {
      const success = await enrollInCourse(courseId)
      if (success) {
        setIsEnrolled(true)
        navigate(`/learn/${courseId}`)
      }
    } catch (err) {
      console.error("[DEBUG] Error enrolling in course:", err)
    }
  }

  const handleContinueLearning = () => {
    navigate(`/learn/${courseId}`)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Error Loading Course</h2>
            <p className="text-slate-600 dark:text-slate-400">{error}</p>
            <Button onClick={() => navigate("/courses")} className="mt-4">
              Back to Courses
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">Course Not Found</h2>
            <p className="text-slate-600 dark:text-slate-400">The course you're looking for doesn't exist or has been removed.</p>
            <Button onClick={() => navigate("/courses")} className="mt-4">
              Back to Courses
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Calculate total lessons
  const totalLessons = course.modules?.reduce((total, module) => total + (module.lessons?.length || 0), 0) || 0

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Course Header */}
          <div className="space-y-4">
            <div className="aspect-video relative bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
              {course.metadataURI ? (
                <img
                  src={course.metadataURI}
                  alt={course.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-slate-400" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{course.title}</h1>
              <p className="text-slate-600 dark:text-slate-400">{course.description}</p>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                <span>{course.enrollmentCount || 0} students enrolled</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                <span>{course.duration || 30} days access</span>
              </div>
              <div className="flex items-center">
                <BookOpen className="h-4 w-4 mr-1" />
                <span>{course.modules?.length || 0} modules</span>
              </div>
              <div className="flex items-center">
                <List className="h-4 w-4 mr-1" />
                <span>{totalLessons} lessons</span>
              </div>
            </div>
          </div>

          {/* Course Content */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Course Content</h2>
            
            {course.modules?.map((module, moduleIndex) => (
              <div key={module.id} className="border rounded-lg overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800">
                  <div className="flex items-center">
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      Module {moduleIndex + 1}: {module.title}
                    </span>
                  </div>
                  <span className="text-sm text-slate-500">{module.lessons?.length || 0} lessons</span>
                </div>
                <div className="p-4 space-y-2 bg-white dark:bg-slate-900">
                  {module.lessons?.map((lesson, lessonIndex) => (
                    <div
                      key={lesson.id}
                      className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                            {lessonIndex + 1}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900 dark:text-slate-100">{lesson.title}</h4>
                          <p className="text-sm text-slate-500">{lesson.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {lesson.contentType}
                        </Badge>
                        <span className="text-sm text-slate-500">{lesson.duration} min</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Enrollment Card */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {Number(course.price) === 0 ? "Free" : `${course.price} LEARN`}
                </span>
                <div className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <span className="text-sm">{course.xpReward || 0} XP</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
                <span className="text-sm">{course.tokenReward || 0} LEARN tokens</span>
              </div>

              {!isCheckingEnrollment && (
                <Button
                  className="w-full"
                  onClick={isEnrolled ? handleContinueLearning : handleEnroll}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : isEnrolled ? (
                    <>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Continue Learning
                    </>
                  ) : (
                    <>
                      <BookOpen className="h-4 w-4 mr-2" />
                      Enroll Now
                    </>
                  )}
                </Button>
              )}

              <div className="text-sm text-slate-500">
                <p>✓ {course.modules?.length || 0} modules</p>
                <p>✓ {totalLessons} lessons</p>
                <p>✓ {course.duration || 30} days access</p>
                <p>✓ Certificate of completion</p>
              </div>
            </CardContent>
          </Card>

          {/* Instructor Card */}
          <Card>
            <CardHeader>
              <CardTitle>Instructor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-sky-500 flex items-center justify-center text-white font-bold text-lg">
                  {course.instructor?.name ? course.instructor.name.charAt(0).toUpperCase() : "?"}
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-slate-100">
                    {course.instructor?.name || "Anonymous Instructor"}
                  </h3>
                  <p className="text-sm text-slate-500">Course Creator</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default CourseDetails