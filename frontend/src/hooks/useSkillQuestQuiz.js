"use client"

import { useState, useCallback } from "react"
import { toast } from "react-toastify"
import useSignerOrProvider from "./useSignerOrProvider"
import useContract from "./useContract"
import SkillQuestABI from "../ABI/SkillQuest.json"

const useSkillQuestQuiz = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentQuiz, setCurrentQuiz] = useState(null)
  const [quizQuestions, setQuizQuestions] = useState([])
  const { signer } = useSignerOrProvider()
  const contractAddress = import.meta.env.VITE_APP_SKILLQUEST_ADDRESS
  const { contract } = useContract(contractAddress, SkillQuestABI)

  // Create a question for a course
  const createQuestion = useCallback(
    async (courseId, questionText, options, correctOptionIndex, difficulty) => {
      if (!contract || !signer) {
        toast.error("Please connect your wallet")
        return false
      }

      if (!questionText || !options || options.length < 2) {
        toast.error("Question text and at least 2 options are required")
        return false
      }

      if (correctOptionIndex >= options.length) {
        toast.error("Correct option index must be valid")
        return false
      }

      setLoading(true)
      setError(null)

      try {
        const tx = await contract.createQuestion(
          BigInt(courseId),
          questionText,
          options,
          correctOptionIndex,
          BigInt(difficulty),
        )

        const receipt = await tx.wait()

        if (receipt.status === 1) {
          // Find the QuestionCreated event to get the question ID
          const event = receipt.logs
            .map((log) => {
              try {
                return contract.interface.parseLog(log)
              } catch (err) {
                console.error("Error parsing log:", err)
                return null
              }
            })
            .find((event) => event && event.name === "QuestionCreated")

          const questionId = event ? event.args.questionId.toString() : null

          toast.success(`Question created successfully! ID: ${questionId}`)
          return questionId
        } else {
          throw new Error("Transaction failed")
        }
      } catch (err) {
        console.error("Question creation error:", err)
        setError("Question creation failed: " + (err.message || "Unknown error"))
        toast.error(`Question creation failed: ${err.message || "Unknown error"}`)
        return false
      } finally {
        setLoading(false)
      }
    },
    [contract, signer],
  )

  // Generate a new quiz for a course
  const generateQuiz = useCallback(
    async (courseId) => {
      if (!contract || !signer) {
        toast.error("Please connect your wallet")
        return false
      }

      setLoading(true)
      setError(null)

      try {
        const tx = await contract.generateQuiz(BigInt(courseId))
        const receipt = await tx.wait()

        if (receipt.status === 1) {
          toast.success("Quiz generated successfully!")
          return true
        } else {
          throw new Error("Transaction failed")
        }
      } catch (err) {
        console.error("Quiz generation error:", err)
        setError("Failed to generate quiz: " + (err.message || "Unknown error"))
        toast.error(`Failed to generate quiz: ${err.message || "Unknown error"}`)
        return false
      } finally {
        setLoading(false)
      }
    },
    [contract, signer],
  )

  // Get current quiz for a course
  const getCurrentQuiz = useCallback(
    async (courseId) => {
      if (!contract || !signer) {
        toast.error("Please connect your wallet")
        return null
      }

      setLoading(true)
      setError(null)

      try {
        const quizData = await contract.getCurrentQuiz(BigInt(courseId))
        const quizId = quizData[0] // quizId
        const questionIds = quizData[1] // questionIds

        if (!quizId || questionIds.length === 0) {
          // If no quiz exists, try to generate one
          const generated = await generateQuiz(courseId)
          if (!generated) {
            throw new Error("Failed to generate quiz")
          }
          // Get the newly generated quiz
          return await getCurrentQuiz(courseId)
        }

        // Fetch details for each question
        const questions = []
        for (const questionId of questionIds) {
          const questionDetails = await contract.getQuestionDetails(questionId)
          questions.push({
            id: questionId.toString(),
            text: questionDetails[0], // questionText
            options: questionDetails[1], // options array
          })
        }

        const quiz = {
          id: quizId.toString(),
          courseId: courseId.toString(),
          questions: questions,
        }

        setCurrentQuiz(quiz)
        setQuizQuestions(questions)
        return quiz
      } catch (err) {
        console.error("Error fetching current quiz:", err)
        setError("Failed to fetch quiz: " + (err.message || "Unknown error"))
        toast.error(`Failed to fetch quiz: ${err.message || "Unknown error"}`)
        return null
      } finally {
        setLoading(false)
      }
    },
    [contract, signer, generateQuiz],
  )

  // Submit quiz answers
  const submitQuizAnswers = useCallback(
    async (quizId, answers) => {
      if (!contract || !signer) {
        toast.error("Please connect your wallet")
        return false
      }

      if (!answers || !answers.length) {
        toast.error("No answers provided")
        return false
      }

      setLoading(true)
      setError(null)

      try {
        const tx = await contract.submitQuizAnswers(BigInt(quizId), answers)
        const receipt = await tx.wait()

        if (receipt.status === 1) {
          // Find the QuizCompleted event to get the score and pass status
          const event = receipt.logs
            .map((log) => {
              try {
                return contract.interface.parseLog(log)
              } catch (err) {
                console.error("Error parsing log:", err)
                return null
              }
            })
            .find((event) => event && event.name === "QuizCompleted")

          const score = event ? event.args.score.toString() : "0"
          const passed = event ? event.args.passed : false

          if (passed) {
            toast.success(`Quiz passed with a score of ${score}%! You've completed the course.`)
          } else {
            toast.error(`Quiz failed with a score of ${score}%. You need 60% to pass.`)
          }

          return { score, passed }
        } else {
          throw new Error("Transaction failed")
        }
      } catch (err) {
        console.error("Quiz submission error:", err)
        setError("Quiz submission failed: " + (err.message || "Unknown error"))
        toast.error(`Quiz submission failed: ${err.message || "Unknown error"}`)
        return false
      } finally {
        setLoading(false)
      }
    },
    [contract, signer],
  )

  // Check if quiz is completed for a course
  const isQuizCompleted = useCallback(
    async (courseId) => {
      if (!contract || !signer) return false

      try {
        const userAddress = await signer.getAddress()
        return await contract.quizCompleted(BigInt(courseId), userAddress)
      } catch (err) {
        console.error("Error checking quiz completion:", err)
        return false
      }
    },
    [contract, signer],
  )

  return {
    currentQuiz,
    quizQuestions,
    createQuestion,
    getCurrentQuiz,
    generateQuiz,
    submitQuizAnswers,
    isQuizCompleted,
    loading,
    error,
  }
}

export default useSkillQuestQuiz
