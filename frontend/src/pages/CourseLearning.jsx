"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Clock, Award, Zap, BookOpen, Users, List, Loader2, AlertCircle, ChevronRight, ChevronLeft, CheckCircle, HelpCircle } from 'lucide-react'
import { Button } from "../components/ui/button"
import { Card, CardContent } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { Progress } from "../components/ui/progress"
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group"
import { Label } from "../components/ui/label"
import { toast } from "react-toastify"
import useSkillQuestCourses from "../hooks/useSkillQuestCourses"
import useSignerOrProvider from "../hooks/useSignerOrProvider"

const CourseLearning = () => {
  const { id: courseId } = useParams()
  const navigate = useNavigate()
  const { signer } = useSignerOrProvider()
  const { getCourseDetails, getCourseModules, contract, completeLesson, generateQuiz, submitQuizAnswers } = useSkillQuestCourses()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeModule, setActiveModule] = useState(0)
  const [activeLesson, setActiveLesson] = useState(0)
  const [completedLessons, setCompletedLessons] = useState(new Set())
  const [quiz, setQuiz] = useState(null)
  const [quizAnswers, setQuizAnswers] = useState({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizScore, setQuizScore] = useState(null)

  useEffect(() => {
    const loadCourseDetails = async () => {
      try {
        setLoading(true)
        setError(null)

        if (!contract || !signer) {
          console.log("[DEBUG] Waiting for contract and signer to be initialized...")
          return
        }

        const courseDetails = await getCourseDetails(courseId)
        console.log("[DEBUG] Course details loaded:", courseDetails)
        
        if (courseDetails) {
          // Get course modules and lessons
          const modules = await getCourseModules(courseId)
          console.log("[DEBUG] Course modules loaded:", modules)

          setCourse({
            ...courseDetails,
            modules
          })

          // Check if all lessons are completed
          const totalLessons = modules.reduce((acc, module) => acc + module.lessons.length, 0)
          const completedLessonsCount = completedLessons.size
          const allLessonsCompleted = totalLessons === completedLessonsCount

          if (allLessonsCompleted) {
            // Start polling for quiz
            const pollForQuiz = async () => {
              try {
                const [quizId, questionIds] = await contract.getCurrentQuiz(courseId)
                if (quizId > 0) {
                  const quizData = await contract.quizzes(quizId)
                  
                  // Fetch question details for each question ID
                  const questions = {}
                  for (const questionId of questionIds) {
                    const [questionText, options] = await contract.getQuestionDetails(questionId)
                    questions[questionId.toString()] = {
                      questionText,
                      options
                    }
                  }

                  setQuiz({
                    id: quizId.toString(),
                    courseId: courseId.toString(),
                    questionIds,
                    questions,
                    score: quizData.score,
                    passed: quizData.passed,
                    timestamp: quizData.timestamp
                  })
                  setQuizSubmitted(quizData.score > 0)
                  if (quizData.score > 0) {
                    setQuizScore(quizData.score)
                  }
                  return true // Quiz found, stop polling
                }
                return false // Quiz not found yet
              } catch (err) {
                console.log("[DEBUG] Error checking for quiz:", err.message)
                return false // Error occurred, keep polling
              }
            }

            // Poll every 2 seconds until quiz is found
            const pollInterval = setInterval(async () => {
              const quizFound = await pollForQuiz()
              if (quizFound) {
                clearInterval(pollInterval)
              }
            }, 2000)

            // Stop polling after 30 seconds
            setTimeout(() => {
              clearInterval(pollInterval)
            }, 30000)
          }
        } else {
          setError("Course not found")
        }
      } catch (err) {
        console.error("[DEBUG] Error loading course details:", err)
        setError(err.message || "Failed to load course details")
      } finally {
        setLoading(false)
      }
    }

    if (courseId) {
      loadCourseDetails()
    }
  }, [courseId, getCourseDetails, getCourseModules, contract, signer, completedLessons])

  const handleCompleteLesson = async () => {
    try {
      if (!currentLesson) return

      const success = await completeLesson(currentLesson.id)
      if (success) {
        setCompletedLessons(prev => new Set([...prev, currentLesson.id]))
        toast.success("Lesson completed! 🎉")

        // Check if all lessons are completed
        const totalLessons = course.modules.reduce((acc, module) => acc + module.lessons.length, 0)
        if (completedLessons.size + 1 === totalLessons) {
          // Generate quiz
          const quizId = await generateQuiz(courseId)
          if (quizId) {
            const quizData = await contract.quizzes(quizId)
            setQuiz(quizData)
            toast.success("All lessons completed! Quiz is now available.")
          }
        }
      }
    } catch (err) {
      console.error("[DEBUG] Error completing lesson:", err)
      toast.error("Failed to complete lesson")
    }
  }

  const handleQuizAnswer = (questionId, answer) => {
    setQuizAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const handleSubmitQuiz = async () => {
    try {
      if (!quiz) return

      // Check if all questions have been answered
      const unansweredQuestions = quiz.questionIds.filter(
        questionId => quizAnswers[questionId.toString()] === undefined
      )

      if (unansweredQuestions.length > 0) {
        toast.error("Please answer all questions before submitting")
        return
      }

      // Convert answers to array in correct order and ensure they are valid numbers
      const answers = quiz.questionIds.map(questionId => {
        const answer = quizAnswers[questionId.toString()]
        if (answer === undefined || answer === null) {
          throw new Error("All questions must be answered")
        }
        return Number(answer) // Convert to number first
      })

      // Get the current quiz ID from the contract
      const [currentQuizId] = await contract.getCurrentQuiz(courseId)
      if (!currentQuizId || currentQuizId.toString() === "0") {
        throw new Error("No active quiz found")
      }

      console.log("[DEBUG] Submitting quiz answers:", { quizId: currentQuizId.toString(), answers })
      const success = await submitQuizAnswers(currentQuizId.toString(), answers)
      if (success) {
        setQuizSubmitted(true)
        const updatedQuiz = await contract.quizzes(currentQuizId)
        setQuizScore(updatedQuiz.score)
        toast.success(`Quiz completed! Score: ${updatedQuiz.score}%`)
      }
    } catch (err) {
      console.error("[DEBUG] Error submitting quiz:", err)
      toast.error(err.message || "Failed to submit quiz")
    }
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

  const currentModule = course.modules?.[activeModule]
  const currentLesson = currentModule?.lessons?.[activeLesson]
  const isLessonCompleted = currentLesson ? completedLessons.has(currentLesson.id) : false
  const allLessonsCompleted = course?.modules?.reduce((acc, module) => acc + module.lessons.length, 0) === completedLessons.size

  const handleNextLesson = () => {
    if (activeLesson < currentModule.lessons.length - 1) {
      setActiveLesson(activeLesson + 1)
    } else if (activeModule < course.modules.length - 1) {
      setActiveModule(activeModule + 1)
      setActiveLesson(0)
    }
  }

  const handlePrevLesson = () => {
    if (activeLesson > 0) {
      setActiveLesson(activeLesson - 1)
    } else if (activeModule > 0) {
      setActiveModule(activeModule - 1)
      setActiveLesson(course.modules[activeModule - 1].lessons.length - 1)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Course Content Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-4">Course Content</h2>
              <div className="space-y-4">
                {course.modules?.map((module, moduleIndex) => (
                  <div key={module.id} className="space-y-2">
                    <div 
                      className={`font-medium cursor-pointer ${moduleIndex === activeModule ? 'text-purple-600' : 'text-slate-700 dark:text-slate-300'}`}
                      onClick={() => {
                        setActiveModule(moduleIndex)
                        setActiveLesson(0)
                      }}
                    >
                      Module {moduleIndex + 1}: {module.title}
                    </div>
                    {moduleIndex === activeModule && (
                      <div className="pl-4 space-y-1">
                        {module.lessons?.map((lesson, lessonIndex) => (
                          <div
                            key={lesson.id}
                            className={`text-sm cursor-pointer flex items-center ${
                              lessonIndex === activeLesson
                                ? 'text-purple-600'
                                : 'text-slate-600 dark:text-slate-400'
                            }`}
                            onClick={() => setActiveLesson(lessonIndex)}
                          >
                            {completedLessons.has(lesson.id) && (
                              <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                            )}
                            {lessonIndex + 1}. {lesson.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-8">
          {allLessonsCompleted && !quiz ? (
            // Course Completion Message
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    Congratulations! 🎉
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400">
                    You have completed all lessons in this course. The final quiz will be automatically generated for you.
                    Please wait a moment while we prepare your quiz...
                  </p>
                  <div className="flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : quiz && !quizSubmitted ? (
            // Quiz Interface
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    Final Course Quiz
                  </h1>
                  <Badge variant="outline" className="text-xs">
                    {quiz.questionIds.length} Questions
                  </Badge>
                </div>

                <div className="space-y-8">
                  {quiz.questionIds.map((questionId, index) => {
                    const question = quiz.questions[questionId.toString()]
                    return (
                      <div key={questionId} className="space-y-4">
                        <h3 className="text-lg font-medium">
                          Question {index + 1}: {question.questionText}
                        </h3>
                        <RadioGroup
                          value={quizAnswers[questionId.toString()]?.toString()}
                          onValueChange={(value) => handleQuizAnswer(questionId, parseInt(value))}
                        >
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center space-x-2">
                              <RadioGroupItem value={optionIndex.toString()} id={`q${questionId}-o${optionIndex}`} />
                              <Label htmlFor={`q${questionId}-o${optionIndex}`}>{option}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    )
                  })}
                </div>

                <div className="flex justify-end mt-8">
                  <Button onClick={handleSubmitQuiz}>
                    Submit Quiz
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : quizSubmitted ? (
            // Quiz Results
            <Card>
              <CardContent className="p-6">
                <div className="text-center space-y-4">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    Quiz Results
                  </h1>
                  <div className="text-4xl font-bold text-purple-600">
                    {quizScore}%
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    {quizScore >= 60 ? (
                      <>
                        Congratulations! You passed the quiz! 🎉
                        <br />
                        You have successfully completed the course and earned your certificate.
                      </>
                    ) : (
                      "You need to score at least 60% to pass. Try again!"
                    )}
                  </p>
                  {quizScore < 60 && (
                    <Button 
                      onClick={async () => {
                        const success = await generateQuiz(courseId)
                        if (success) {
                          toast.success("New quiz is now available!")
                        }
                      }}
                      className="mt-4"
                    >
                      Retake Quiz
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            // Lesson Content
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {currentLesson?.title}
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400">
                      Module {activeModule + 1}: {currentModule?.title}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {currentLesson?.contentType}
                    </Badge>
                    <span className="text-sm text-slate-500">{currentLesson?.duration} min</span>
                  </div>
                </div>

                <div className="prose dark:prose-invert max-w-none mb-8">
                  <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line">
                    {currentLesson?.description || "No content available for this lesson."}
                  </p>
                </div>

                <div className="flex justify-between mt-8">
                  <Button
                    variant="outline"
                    onClick={handlePrevLesson}
                    disabled={activeModule === 0 && activeLesson === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous Lesson
                  </Button>
                  <div className="flex gap-4">
                    {!isLessonCompleted && (
                      <Button
                        variant="default"
                        onClick={handleCompleteLesson}
                      >
                        Mark as Complete
                      </Button>
                    )}
                    <Button
                      onClick={handleNextLesson}
                      disabled={activeModule === course.modules.length - 1 && activeLesson === currentModule.lessons.length - 1}
                    >
                      Next Lesson
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Course Progress */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Your Progress</h2>
                  <span className="text-sm text-slate-500">
                    {Math.round((completedLessons.size / (course.modules?.reduce((acc, module) => acc + module.lessons.length, 0) || 1)) * 100)}% Complete
                  </span>
                </div>
                <Progress 
                  value={(completedLessons.size / (course.modules?.reduce((acc, module) => acc + module.lessons.length, 0) || 1)) * 100} 
                  className="h-2" 
                />
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>{completedLessons.size} of {course.modules?.reduce((acc, module) => acc + module.lessons.length, 0) || 0} lessons completed</span>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Award className="h-4 w-4 mr-1 text-purple-600" />
                      <span>{course.xpReward || 0} XP</span>
                    </div>
                    <div className="flex items-center">
                      <Zap className="h-4 w-4 mr-1 text-yellow-500" />
                      <span>{course.tokenReward || 0} LEARN</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default CourseLearning 