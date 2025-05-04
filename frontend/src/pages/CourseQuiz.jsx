"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group"
import { Label } from "../components/ui/label"
import { Progress } from "../components/ui/progress"
import { toast } from "react-toastify"
import useSkillQuestQuiz from "../hooks/useSkillQuestQuiz"
import useSignerOrProvider from "../hooks/useSignerOrProvider"
import LoadingSpinner from "../components/LoadingSpinner"

const CourseQuiz = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const courseId = Number.parseInt(id)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState({})
  const [quiz, setQuiz] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const { getCurrentQuiz, submitQuizAnswers, loading: quizLoading } = useSkillQuestQuiz()
  const { signer } = useSignerOrProvider()

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        // Try to get quiz from localStorage first
        const storedQuiz = localStorage.getItem('currentQuiz')
        if (storedQuiz) {
          setQuiz(JSON.parse(storedQuiz))
          setLoading(false)
          return
        }

        // If not in localStorage, fetch from contract
        const quizData = await getCurrentQuiz(courseId)
        if (!quizData) {
          throw new Error("Failed to load quiz")
        }
        setQuiz(quizData)
      } catch (err) {
        console.error("Error loading quiz:", err)
        setError("Failed to load quiz: " + (err.message || "Unknown error"))
        toast.error("Failed to load quiz")
      } finally {
        setLoading(false)
      }
    }

    loadQuiz()
  }, [courseId, getCurrentQuiz])

  const handleAnswerSelect = (questionId, answerIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }))
  }

  const handleSubmit = async () => {
    if (!signer) {
      toast.error("Please connect your wallet")
      return
    }

    try {
      setLoading(true)
      const answerArray = quiz.questions.map(q => answers[q.id] || 0)
      const result = await submitQuizAnswers(quiz.id, answerArray)
      
      if (result) {
        toast.success("Quiz submitted successfully!")
        navigate(`/courses/${courseId}`)
      }
    } catch (err) {
      console.error("Error submitting quiz:", err)
      toast.error("Failed to submit quiz: " + (err.message || "Unknown error"))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner message="Loading quiz..." />
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>
  }

  if (!quiz) {
    return <div className="text-center py-10">Quiz not found</div>
  }

  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Course Quiz</CardTitle>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-gray-500">
            Question {currentQuestion + 1} of {quiz.questions.length}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {quiz.questions[currentQuestion] && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                {quiz.questions[currentQuestion].text}
              </h3>
              <RadioGroup
                value={answers[quiz.questions[currentQuestion].id]?.toString()}
                onValueChange={(value) => handleAnswerSelect(quiz.questions[currentQuestion].id, parseInt(value))}
              >
                {quiz.questions[currentQuestion].options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
              disabled={currentQuestion === 0}
            >
              Previous
            </Button>
            {currentQuestion < quiz.questions.length - 1 ? (
              <Button
                onClick={() => setCurrentQuestion(prev => prev + 1)}
                disabled={!answers[quiz.questions[currentQuestion].id]}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={Object.keys(answers).length !== quiz.questions.length}
              >
                Submit Quiz
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CourseQuiz 