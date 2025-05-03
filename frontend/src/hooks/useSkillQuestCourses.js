"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { toast } from "react-toastify"
import { ethers } from "ethers"
import useSignerOrProvider from "./useSignerOrProvider"
import useContract from "./useContract"
import SkillQuestABI from "../ABI/SkillQuest.json"
import SkillQuestTokenABI from "../ABI/SkillQuestToken.json"

const useSkillQuestCourses = () => {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [instructorCourses, setInstructorCourses] = useState([])
  const [totalCourses, setTotalCourses] = useState(0)
  const { signer } = useSignerOrProvider()
  const contractAddress = import.meta.env.VITE_APP_SKILLQUEST_ADDRESS
  const { contract, error: contractError } = useContract(contractAddress, SkillQuestABI)

  // Test contract connection
  const testContract = useCallback(async () => {
    try {
      if (!contract) {
        console.error("[DEBUG] Contract not initialized")
        return false
      }

      // Use getTotalCourses as a test function since it's a read-only call
      const total = await contract.getTotalCourses()
      console.log("[DEBUG] Contract connection test result - Total courses:", total.toString())
      return true
    } catch (err) {
      console.error("[DEBUG] Contract connection test failed:", err)
      return false
    }
  }, [contract])

  // Test contract on mount
  useEffect(() => {
    if (contract) {
      testContract()
    }
  }, [contract, testContract])

  // Add logging for contract initialization
  useEffect(() => {
    console.log("[DEBUG] Contract initialization:", {
      contractAddress,
      hasContract: !!contract,
      hasSigner: !!signer,
      provider: contract?.provider ? "Available" : "Not available",
      contractError
    })
  }, [contract, contractAddress, signer, contractError])

  // Create a new course
  const createCourse = useCallback(
    async (courseData) => {
      if (!contract || !signer) {
        toast.error("Please connect your wallet")
        return false
      }

      const {
        metadataURI,
        title,
        description,
        price,
        duration,
        xpReward,
        tokenReward,
        requiredCourses,
        tags,
        modules,
        questions
      } = courseData

      if (!title || !description) {
        toast.error("Title and description are required")
        return false
      }

      setLoading(true)
      setError(null)

      try {
        // Validate and convert numeric values
        const validateNumber = (value, fieldName) => {
          const num = Number(value)
          if (isNaN(num)) {
            throw new Error(`Invalid ${fieldName}: ${value} is not a valid number`)
          }
          return num
        }

        // Convert price and rewards to wei
        const priceWei = ethers.parseEther(validateNumber(price, "price").toString())
        const tokenRewardWei = ethers.parseEther(validateNumber(tokenReward, "token reward").toString())

        // Convert duration to seconds (days to seconds)
        const durationSeconds = BigInt(Math.floor(validateNumber(duration, "duration") * 86400))

        // Validate and convert modules data
        const validatedModules = modules.map((module, moduleIndex) => {
          if (!module.title) {
            throw new Error(`Module ${moduleIndex + 1} title is required`)
          }

          return {
            title: module.title,
            description: module.description || "",
            orderIndex: BigInt(moduleIndex),
            lessons: module.lessons.map((lesson, lessonIndex) => {
              if (!lesson.title) {
                throw new Error(`Lesson ${lessonIndex + 1} title in module ${moduleIndex + 1} is required`)
              }

              // Validate contentType
              const validContentTypes = ["text", "video", "quiz", "file"]
              const contentType = lesson.contentType || "text"
              if (!validContentTypes.includes(contentType)) {
                throw new Error(`Invalid content type for lesson ${lessonIndex + 1} in module ${moduleIndex + 1}. Must be one of: ${validContentTypes.join(", ")}`)
              }

              // Map content type string to enum value
              const contentTypeMap = {
                "text": 0, // ContentType.TEXT
                "video": 2, // ContentType.VIDEO
                "quiz": 3, // ContentType.QUIZ
                "file": 4  // ContentType.DOCUMENT
              }

              return {
                title: lesson.title,
                description: lesson.description || "",
                contentType: contentTypeMap[contentType],
                contentURI: lesson.contentURI || "",
                duration: BigInt(Math.floor(validateNumber(lesson.duration, `lesson ${lessonIndex + 1} duration`))),
                orderIndex: BigInt(lessonIndex)
              }
            })
          }
        })

        // Validate and convert questions data
        const validatedQuestions = questions.map((question, index) => {
          if (!question.questionText) {
            throw new Error(`Question ${index + 1} text is required`)
          }
          if (!Array.isArray(question.options) || question.options.length < 2) {
            throw new Error(`Question ${index + 1} must have at least 2 options`)
          }

          // Ensure correctOptionIndex is a valid number within range
          const correctOptionIndex = validateNumber(question.correctOptionIndex, `question ${index + 1} correct option`)
          if (correctOptionIndex < 0 || correctOptionIndex >= question.options.length) {
            throw new Error(`Question ${index + 1} correct option index must be between 0 and ${question.options.length - 1}`)
          }

          // Ensure difficulty is a valid number between 1 and 5
          const difficulty = validateNumber(question.difficulty, `question ${index + 1} difficulty`)
          if (difficulty < 1 || difficulty > 5) {
            throw new Error(`Question ${index + 1} difficulty must be between 1 and 5`)
          }

          return {
            questionText: question.questionText,
            options: question.options.map(option => option.toString()),
            correctOptionIndex: correctOptionIndex,
            difficulty: BigInt(difficulty)
          }
        })

        // Prepare the course creation input
        const courseInput = {
          metadataURI: metadataURI || "",
          title,
          description,
          price: priceWei,
          duration: durationSeconds,
          xpReward: BigInt(Math.floor(validateNumber(xpReward, "XP reward"))),
          tokenReward: tokenRewardWei,
          requiredCourses: requiredCourses.map((id) => BigInt(Math.floor(validateNumber(id, "required course ID")))),
          tags: tags || [],
          modules: validatedModules,
          questions: validatedQuestions
        }

        console.log("[DEBUG] Course input data:", JSON.stringify(courseInput, (key, value) =>
          typeof value === 'bigint' ? value.toString() : value
        ))

        const tx = await contract.createCompleteCourse(courseInput)
        const receipt = await tx.wait()

        if (receipt.status === 1) {
          // Find the CourseCreated event to get the course ID
          const event = receipt.logs
            .map((log) => {
              try {
                return contract.interface.parseLog(log)
              } catch (err) {
                console.error("Error parsing log:", err)
                return null
              }
            })
            .find((event) => event && event.name === "CourseCreated")

          if (!event) {
            throw new Error("CourseCreated event not found in transaction receipt")
          }

          const courseId = event.args.courseId.toString()
          console.log("[DEBUG] Course created with ID:", courseId)

          toast.success(`Course created successfully! ID: ${courseId}`)
          await fetchInstructorCourses()
          return courseId
        } else {
          throw new Error("Transaction failed")
        }
      } catch (err) {
        console.error("Course creation error:", err)
        setError("Course creation failed: " + (err.message || "Unknown error"))
        toast.error(`Course creation failed: ${err.message || "Unknown error"}`)
        return false
      } finally {
        setLoading(false)
      }
    },
    [contract, signer],
  )

  // Fetch all courses
  const fetchCourses = useCallback(async () => {
    if (!contract) return

    setLoading(true)
    setError(null)

    try {
      const total = await contract.getTotalCourses()
      setTotalCourses(total.toString())

      const coursesList = []

      // Fetch details for each course
      for (let i = 1; i <= total; i++) {
        try {
          const course = await contract.courses(i)
          const modules = await contract.getCourseModules(i)

          // Only add active courses
          if (course.isActive) {
            coursesList.push({
              id: course.id.toString(),
              instructor: course.instructor,
              title: course.title,
              description: course.description,
              metadataURI: course.metadataURI,
              price: ethers.formatEther(course.price),
              duration: (course.duration / BigInt(86400)).toString(), // duration (convert seconds to days)
              xpReward: course.xpReward.toString(),
              tokenReward: ethers.formatEther(course.tokenReward),
              isActive: course.isActive,
              isPaused: course.isPaused,
              enrollmentCount: course.enrollmentCount.toString(),
              completionCount: course.completionCount.toString(),
              creationTime: new Date(Number(course.creationTime) * 1000).toLocaleString(),
              moduleCount: modules.length,
            })
          }
        } catch (err) {
          console.error(`Error fetching course ${i}:`, err)
        }
      }

      setCourses(coursesList)
    } catch (err) {
      console.error("Error fetching courses:", err)
      setError("Failed to fetch courses: " + (err.message || "Unknown error"))
      toast.error("Error loading courses")
    } finally {
      setLoading(false)
    }
  }, [contract])

  // Fetch instructor's courses
  const fetchInstructorCourses = useCallback(async () => {
    if (!contract || !signer) return

    setLoading(true)
    setError(null)

    try {
      const address = await signer.getAddress()
      const instructorCourseIds = await contract.getInstructorCourses(address)

      const coursesList = []

      // Fetch details for each course
      for (const courseId of instructorCourseIds) {
        try {
          const course = await contract.courses(courseId)
          const modules = await contract.getCourseModules(courseId)

          // Format creation time
          let formattedCreationTime = "Not available"
          try {
            const timestamp = Number(course.creationTime)
            if (timestamp > 0) {
              const creationDate = new Date(timestamp * 1000)
              if (!isNaN(creationDate.getTime())) {
                formattedCreationTime = creationDate.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              }
            }
          } catch (dateErr) {
            console.error("Error formatting creation date:", dateErr)
          }

          coursesList.push({
            id: course.id.toString(),
            instructor: course.instructor,
            title: course.title,
            description: course.description,
            metadataURI: course.metadataURI,
            price: ethers.formatEther(course.price),
            duration: (course.duration / BigInt(86400)).toString(), // duration (convert seconds to days)
            xpReward: course.xpReward.toString(),
            tokenReward: ethers.formatEther(course.tokenReward),
            isActive: course.isActive,
            isPaused: course.isPaused,
            enrollmentCount: course.enrollmentCount.toString(),
            completionCount: course.completionCount.toString(),
            creationTime: formattedCreationTime,
            moduleCount: modules.length,
          })
        } catch (err) {
          console.error(`Error fetching course ${courseId}:`, err)
        }
      }

      setInstructorCourses(coursesList)
    } catch (err) {
      console.error("Error fetching instructor courses:", err)
      setError("Failed to fetch instructor courses: " + (err.message || "Unknown error"))
      toast.error("Error loading your courses")
    } finally {
      setLoading(false)
    }
  }, [contract, signer])

  // Update course details
  const updateCourse = useCallback(
    async (courseId, courseData) => {
      if (!contract || !signer) {
        toast.error("Please connect your wallet")
        return false
      }

      const { metadataURI, title, description, price, isActive } = courseData

      setLoading(true)
      setError(null)

      try {
        // Convert price to wei
        const priceWei = ethers.parseEther(price.toString())

        const tx = await contract.updateCourse(
          BigInt(courseId),
          metadataURI,
          title,
          description,
          priceWei,
          isActive
        )

        const receipt = await tx.wait()

        if (receipt.status === 1) {
          toast.success("Course updated successfully!")
          await fetchInstructorCourses()
          return true
        } else {
          throw new Error("Transaction failed")
        }
      } catch (err) {
        console.error("Course update error:", err)
        setError("Course update failed: " + (err.message || "Unknown error"))
        toast.error(`Course update failed: ${err.message || "Unknown error"}`)
        return false
      } finally {
        setLoading(false)
      }
    },
    [contract, signer],
  )

  // Update course rewards
  const updateCourseRewards = useCallback(
    async (courseId, xpReward, tokenReward) => {
      if (!contract || !signer) {
        toast.error("Please connect your wallet")
        return false
      }

      setLoading(true)
      setError(null)

      try {
        // Convert token reward to wei
        const tokenRewardWei = ethers.parseEther(tokenReward.toString())

        const tx = await contract.updateCourseRewards(
          BigInt(courseId),
          BigInt(xpReward),
          tokenRewardWei
        )

        const receipt = await tx.wait()

        if (receipt.status === 1) {
          toast.success("Course rewards updated successfully!")
          await fetchInstructorCourses()
          return true
        } else {
          throw new Error("Transaction failed")
        }
      } catch (err) {
        console.error("Course rewards update error:", err)
        setError("Course rewards update failed: " + (err.message || "Unknown error"))
        toast.error(`Course rewards update failed: ${err.message || "Unknown error"}`)
        return false
      } finally {
        setLoading(false)
      }
    },
    [contract, signer],
  )

  // Pause/unpause course
  const toggleCoursePause = useCallback(
    async (courseId, isPaused) => {
      if (!contract || !signer) {
        toast.error("Please connect your wallet")
        return false
      }

      setLoading(true)
      setError(null)

      try {
        const tx = await contract.pauseCourse(BigInt(courseId), isPaused)
        const receipt = await tx.wait()

        if (receipt.status === 1) {
          toast.success(`Course ${isPaused ? "paused" : "unpaused"} successfully!`)
          await fetchInstructorCourses()
          return true
        } else {
          throw new Error("Transaction failed")
        }
      } catch (err) {
        console.error("Course pause toggle error:", err)
        setError("Failed to toggle course pause: " + (err.message || "Unknown error"))
        toast.error(`Failed to ${isPaused ? "pause" : "unpause"} course: ${err.message || "Unknown error"}`)
        return false
      } finally {
        setLoading(false)
      }
    },
    [contract, signer],
  )

  // Get course details
  const getCourseDetails = useCallback(async (courseId) => {
    if (!contract) {
      console.error("[DEBUG] Contract not initialized in getCourseDetails")
      return null
    }

    try {
      console.log("[DEBUG] Getting course details for ID:", courseId)
      const courseIdBigInt = BigInt(courseId)
      
      // Get basic course info
      const [id, instructor, title, description, metadataURI, price, duration] = await contract.getCourseDetails1(courseIdBigInt)
      console.log("[DEBUG] Basic course info:", { id, instructor, title, description, metadataURI, price, duration })
      
      if (!title) {
        console.error("[DEBUG] No basic info returned for course:", courseId)
        return null
      }

      // Get detailed course info
      const [xpReward, tokenReward, isActive, isPaused, enrollmentCount, completionCount, creationTime] = await contract.getCourseDetails2(courseIdBigInt)
      console.log("[DEBUG] Detailed course info:", { xpReward, tokenReward, isActive, isPaused, enrollmentCount, completionCount, creationTime })

      // Get course prerequisites
      const requiredCourses = await contract.getCoursePrerequisites(courseIdBigInt)
      console.log("[DEBUG] Required courses:", requiredCourses)

      // Get course tags
      const tags = await contract.getCourseTags(courseIdBigInt)
      console.log("[DEBUG] Course tags:", tags)

      // Get course modules
      const moduleIds = await contract.getCourseModules(courseIdBigInt)
      console.log("[DEBUG] Module IDs:", moduleIds)

      // Get module details
      const modules = await Promise.all(moduleIds.map(async (moduleId) => {
        const [title, description, orderIndex, isActive] = await contract.getModuleDetails(moduleId)
        const lessonIds = await contract.getModuleLessons(moduleId)
        
        // Get lesson details
        const lessons = await Promise.all(lessonIds.map(async (lessonId) => {
          const [title, description, contentType, contentURI, duration, orderIndex, isActive] = await contract.getLessonDetails(lessonId)
          return {
            id: lessonId.toString(),
            title,
            description,
            contentType: ["text", "video", "quiz", "file"][Number(contentType)],
            contentURI,
            duration: Number(duration)
          }
        }))

        return {
          id: moduleId.toString(),
          title,
          description,
          lessons
        }
      }))

      // Format the course data
      const course = {
        id: courseId,
        title,
        instructor: {
          address: instructor,
          name: "Anonymous Instructor" // TODO: Get instructor name from profile
        },
        price: ethers.formatEther(price),
        isActive,
        description: description || "",
        metadataURI: metadataURI || "",
        duration: Number(duration) / 86400, // Convert seconds to days
        xpReward: Number(xpReward),
        tokenReward: ethers.formatEther(tokenReward),
        requiredCourses: requiredCourses.map(id => Number(id)),
        tags,
        modules,
        enrollmentCount: Number(enrollmentCount),
        completionCount: Number(completionCount),
        creationTime: new Date(Number(creationTime) * 1000).toLocaleString()
      }

      console.log("[DEBUG] Formatted course data:", course)
      return course
    } catch (err) {
      console.error("[DEBUG] Error getting course details:", err)
      throw err
    }
  }, [contract])

  // Enroll in a course
  const enrollInCourse = useCallback(async (courseId) => {
    if (!contract || !signer) {
      toast.error("Please connect your wallet")
      return false
    }

    setLoading(true)
    setError(null)

    try {
      console.log("[DEBUG] Enrolling in course:", courseId)
      const courseIdBigInt = BigInt(courseId)

      // Get course price
      const course = await contract.courses(courseIdBigInt)
      const price = course.price

      // Get token contract
      const tokenAddress = import.meta.env.VITE_APP_LEARN_TOKEN_ADDRESS
      const tokenContract = new ethers.Contract(tokenAddress, SkillQuestTokenABI, signer)

      // Check if user has enough tokens
      const userAddress = await signer.getAddress()
      const userBalance = await tokenContract.balanceOf(userAddress)

      if (userBalance < price) {
        toast.error("Insufficient LEARN token balance")
        return false
      }

      // Check current allowance
      const currentAllowance = await tokenContract.allowance(userAddress, contractAddress)

      // Approve tokens for the contract if needed
      if (currentAllowance < price) {
        console.log("[DEBUG] Approving tokens...")
        const approveTx = await tokenContract.approve(contractAddress, price)
        console.log("[DEBUG] Approval transaction hash:", approveTx.hash)
        const approveReceipt = await approveTx.wait()
        console.log("[DEBUG] Approval receipt:", approveReceipt)
      }

      // Send enrollment transaction
      const tx = await contract.enrollCourse(courseIdBigInt)
      console.log("[DEBUG] Enrollment transaction sent:", tx.hash)

      const receipt = await tx.wait()
      console.log("[DEBUG] Enrollment transaction receipt:", receipt)

      if (receipt.status === 1) {
        toast.success("Successfully enrolled in course!")
        return true
      } else {
        throw new Error("Transaction failed")
      }
    } catch (err) {
      console.error("[DEBUG] Error enrolling in course:", err)
      setError("Failed to enroll in course: " + (err.message || "Unknown error"))
      toast.error(`Failed to enroll in course: ${err.message || "Unknown error"}`)
      return false
    } finally {
      setLoading(false)
    }
  }, [contract, signer])

  // Get course modules
  const getCourseModules = useCallback(async (courseId) => {
    if (!contract) {
      console.error("[DEBUG] Contract not initialized in getCourseModules")
      return []
    }

    try {
      console.log("[DEBUG] Getting modules for course ID:", courseId)
      const courseIdBigInt = BigInt(courseId)
      
      // Get module IDs
      const moduleIds = await contract.getCourseModules(courseIdBigInt)
      console.log("[DEBUG] Module IDs:", moduleIds)

      // Get module details and lessons
      const modules = await Promise.all(moduleIds.map(async (moduleId) => {
        const [title, description, orderIndex, isActive] = await contract.getModuleDetails(moduleId)
        const lessonIds = await contract.getModuleLessons(moduleId)
        
        // Get lesson details
        const lessons = await Promise.all(lessonIds.map(async (lessonId) => {
          const [title, description, contentType, contentURI, duration, orderIndex, isActive] = await contract.getLessonDetails(lessonId)
          return {
            id: lessonId.toString(),
            title,
            description,
            contentType: ["text", "video", "quiz", "file"][Number(contentType)],
            contentURI,
            duration: Number(duration)
          }
        }))

        return {
          id: moduleId.toString(),
          title,
          description,
          lessons
        }
      }))

      console.log("[DEBUG] Modules loaded:", modules)
      return modules
    } catch (err) {
      console.error("[DEBUG] Error getting course modules:", err)
      throw err
    }
  }, [contract])

  // Load courses on initial render
  useEffect(() => {
    if (contract) {
      fetchCourses()
    }
  }, [contract, fetchCourses])

  // Load instructor courses when signer changes
  useEffect(() => {
    if (contract && signer) {
      fetchInstructorCourses()
    } else {
      setInstructorCourses([])
    }
  }, [contract, signer, fetchInstructorCourses])

  // Memoize the instructor courses
  const instructorCoursesMemo = useMemo(() => instructorCourses, [instructorCourses])

  const completeLesson = useCallback(async (lessonId) => {
    try {
      if (!contract || !signer) {
        console.log("[DEBUG] Contract or signer not initialized")
        return false
      }

      console.log("[DEBUG] Completing lesson:", lessonId)
      const tx = await contract.completeLesson(BigInt(lessonId))
      await tx.wait()
      console.log("[DEBUG] Lesson completed successfully")
      return true
    } catch (err) {
      console.error("[DEBUG] Error completing lesson:", err)
      throw err
    }
  }, [contract, signer])

  const generateQuiz = useCallback(async (courseId) => {
    try {
      if (!contract || !signer) {
        console.log("[DEBUG] Contract or signer not initialized")
        return null
      }

      console.log("[DEBUG] Generating quiz for course:", courseId)
      const tx = await contract.generateQuiz(BigInt(courseId))
      const receipt = await tx.wait()

      // Find the QuizGenerated event to get the quiz ID
      const event = receipt.logs
        .map((log) => {
          try {
            return contract.interface.parseLog(log)
          } catch (err) {
            console.error("Error parsing log:", err)
            return null
          }
        })
        .find((event) => event && event.name === "QuizGenerated")

      if (!event) {
        throw new Error("QuizGenerated event not found in transaction receipt")
      }

      const quizId = event.args.quizId.toString()
      console.log("[DEBUG] Quiz generated with ID:", quizId)
      return quizId
    } catch (err) {
      console.error("[DEBUG] Error generating quiz:", err)
      throw err
    }
  }, [contract, signer])

  const submitQuizAnswers = useCallback(
    async (quizId, answers) => {
      if (!contract || !signer) {
        toast.error("Please connect your wallet")
        return false
      }

      setLoading(true)
      setError(null)

      try {
        console.log("[DEBUG] Submitting quiz answers:", { quizId, answers })
        
        // Ensure quizId is a valid number
        const quizIdNum = Number(quizId)
        if (isNaN(quizIdNum)) {
          throw new Error("Invalid quiz ID")
        }

        // Ensure all answers are valid numbers
        const validAnswers = answers.map(answer => {
          const num = Number(answer)
          if (isNaN(num)) {
            throw new Error("Invalid answer format")
          }
          return num
        })

        const tx = await contract.submitQuizAnswers(quizIdNum, validAnswers)
        const receipt = await tx.wait()

        if (receipt.status === 1) {
          toast.success("Quiz submitted successfully!")
          return true
        } else {
          throw new Error("Transaction failed")
        }
      } catch (err) {
        console.error("[DEBUG] Error submitting quiz answers:", err)
        setError("Failed to submit quiz: " + (err.message || "Unknown error"))
        toast.error(`Failed to submit quiz: ${err.message || "Unknown error"}`)
        return false
      } finally {
        setLoading(false)
      }
    },
    [contract, signer],
  )

  return {
    courses,
    instructorCourses: instructorCoursesMemo,
    totalCourses,
    createCourse,
    updateCourse,
    updateCourseRewards,
    toggleCoursePause,
    fetchCourses,
    fetchInstructorCourses,
    getCourseDetails,
    getCourseModules,
    enrollInCourse,
    completeLesson,
    generateQuiz,
    submitQuizAnswers,
    loading,
    error,
    contract,
    contractError
  }
}

export default useSkillQuestCourses
