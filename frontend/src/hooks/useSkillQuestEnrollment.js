"use client"

import { useState, useCallback, useEffect } from "react"
import { toast } from "react-toastify"
import { ethers } from "ethers"
import useSignerOrProvider from "./useSignerOrProvider"
import useContract from "./useContract"
import SkillQuestABI from "../ABI/SkillQuest.json"
import SkillQuestTokenABI from "../ABI/SkillQuestToken.json"

const useSkillQuestEnrollment = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [completedCourses, setCompletedCourses] = useState([])
  const { signer } = useSignerOrProvider()
  const contractAddress = import.meta.env.VITE_APP_SKILLQUEST_ADDRESS
  const tokenAddress = import.meta.env.VITE_APP_LEARN_TOKEN_ADDRESS
  const { contract } = useContract(contractAddress, SkillQuestABI)
  const { contract: tokenContract } = useContract(tokenAddress, SkillQuestTokenABI)

  // Enroll in a course
  const enrollCourse = useCallback(
    async (courseId) => {
      if (!contract || !tokenContract || !signer) {
        console.error("[DEBUG] Missing contract or signer:", {
          hasContract: !!contract,
          hasTokenContract: !!tokenContract,
          hasSigner: !!signer,
        })
        toast.error("Please connect your wallet")
        return false
      }

      setLoading(true)
      setError(null)

      try {
        console.log("[DEBUG] Starting enrollment process for course:", courseId)
        console.log("[DEBUG] Contract instance:", contract)
        console.log("[DEBUG] Contract address:", contractAddress)
        console.log("[DEBUG] Contract ABI:", SkillQuestABI)

        // Get course price
        const courseDetails = await contract.getCourseDetails1(BigInt(courseId))
        const price = courseDetails[5] // price is at index 5
        console.log("[DEBUG] Course price:", price.toString())

        // Check if user has enough tokens
        const userAddress = await signer.getAddress()
        console.log("[DEBUG] User address:", userAddress)
        const userBalance = await tokenContract.balanceOf(userAddress)
        console.log("[DEBUG] User balance:", userBalance.toString())

        if (userBalance < price) {
          console.log("[DEBUG] Insufficient balance. Required:", price.toString(), "Available:", userBalance.toString())
          toast.error("Insufficient LEARN token balance")
          return false
        }

        // Check current allowance
        const currentAllowance = await tokenContract.allowance(userAddress, contractAddress)
        console.log("[DEBUG] Current allowance:", currentAllowance.toString())

        // Approve tokens for the contract if needed
        if (currentAllowance < price) {
          console.log("[DEBUG] Approving tokens...")
          const approveTx = await tokenContract.approve(contractAddress, price)
          console.log("[DEBUG] Approval transaction hash:", approveTx.hash)
          const approveReceipt = await approveTx.wait()
          console.log("[DEBUG] Approval receipt:", approveReceipt)
        }

        // Enroll in the course
        console.log("[DEBUG] Attempting to enroll in course...")

        // Ensure courseId is properly formatted as BigInt
        const courseIdBigInt = BigInt(courseId)
        console.log("[DEBUG] Course ID (BigInt):", courseIdBigInt.toString())

        // FIXED: Use direct contract call instead of populateTransaction + sendTransaction
        const tx = await contract.enrollCourse(courseIdBigInt, {
          gasLimit: 500000, // Increased gas limit for safety
        })

        console.log("[DEBUG] Enrollment transaction hash:", tx.hash)
        const receipt = await tx.wait()
        console.log("[DEBUG] Enrollment receipt:", receipt)

        if (receipt.status === 1) {
          toast.success("Successfully enrolled in the course!")
          await fetchEnrolledCourses()
          return true
        } else {
          throw new Error("Transaction failed")
        }
      } catch (err) {
        console.error("[DEBUG] Course enrollment error:", err)
        console.error("[DEBUG] Error details:", {
          message: err.message,
          code: err.code,
          data: err.data,
          transaction: err.transaction,
          receipt: err.receipt,
        })

        // Check for specific error types
        if (err.code === "INSUFFICIENT_FUNDS") {
          toast.error("Insufficient funds for gas")
        } else if (err.code === "UNPREDICTABLE_GAS_LIMIT") {
          toast.error("Transaction would fail. Please check your token balance and allowance.")
        } else if (err.code === "CALL_EXCEPTION") {
          // Try to check if user is already enrolled
          try {
            const userAddress = await signer.getAddress()
            const enrolledCourses = await contract.getEnrolledCourses(userAddress)
            const isAlreadyEnrolled = enrolledCourses.some((id) => id.toString() === courseId.toString())

            if (isAlreadyEnrolled) {
              toast.error("You are already enrolled in this course")
            } else {
              toast.error("Transaction failed. You may not meet the prerequisites for this course.")
            }
          } catch (checkErr) {
            toast.error("Transaction failed. Please check if you meet all requirements for enrollment.")
          }
        } else {
          setError("Enrollment failed: " + (err.message || "Unknown error"))
          toast.error(`Enrollment failed: ${err.message || "Unknown error"}`)
        }
        return false
      } finally {
        setLoading(false)
      }
    },
    [contract, tokenContract, signer, contractAddress],
  )

  // Batch enroll in multiple courses
  const batchEnrollCourses = useCallback(
    async (courseIds) => {
      if (!contract || !tokenContract || !signer) {
        toast.error("Please connect your wallet")
        return false
      }

      if (!courseIds.length) {
        toast.error("No courses selected")
        return false
      }

      setLoading(true)
      setError(null)

      try {
        // Calculate total price
        let totalPrice = ethers.parseEther("0")

        for (const courseId of courseIds) {
          const courseDetails = await contract.getCourseDetails1(courseId)
          totalPrice += courseDetails[5] // price is at index 5
        }

        // Check if user has enough tokens
        const userAddress = await signer.getAddress()
        const userBalance = await tokenContract.balanceOf(userAddress)

        if (userBalance < totalPrice) {
          toast.error("Insufficient LEARN token balance")
          return false
        }

        // Approve tokens for the contract
        const approveTx = await tokenContract.approve(contractAddress, totalPrice)
        await approveTx.wait()

        // Convert course IDs to BigInt
        const courseIdsBigInt = courseIds.map((id) => BigInt(id))

        // FIXED: Direct contract call with increased gas limit
        const tx = await contract.batchEnrollCourses(courseIdsBigInt, {
          gasLimit: 1000000, // Increased gas limit for batch operations
        })
        const receipt = await tx.wait()

        if (receipt.status === 1) {
          toast.success("Successfully enrolled in all selected courses!")
          await fetchEnrolledCourses()
          return true
        } else {
          throw new Error("Transaction failed")
        }
      } catch (err) {
        console.error("Batch enrollment error:", err)
        setError("Batch enrollment failed: " + (err.message || "Unknown error"))
        toast.error(`Batch enrollment failed: ${err.message || "Unknown error"}`)
        return false
      } finally {
        setLoading(false)
      }
    },
    [contract, tokenContract, signer, contractAddress],
  )

  // Fetch enrolled courses
  const fetchEnrolledCourses = useCallback(async () => {
    if (!contract || !signer) return

    setLoading(true)
    setError(null)

    try {
      const userAddress = await signer.getAddress()
      const enrolledCourseIds = await contract.getEnrolledCourses(userAddress)

      const coursesList = []

      // Fetch details for each course
      for (const courseId of enrolledCourseIds) {
        try {
          const details1 = await contract.getCourseDetails1(courseId)
          const details2 = await contract.getCourseDetails2(courseId)
          const progress = await contract.getCourseProgress(userAddress, courseId)
          const enrollmentTime = await contract.getCourseEnrollmentTime(userAddress, courseId)
          const prerequisites = await contract.getCoursePrerequisites(courseId)
          const tags = await contract.getCourseTags(courseId)
          const modules = await contract.getCourseModules(courseId)

          // Format enrollment time
          let formattedDate = "Not available"
          try {
            if (enrollmentTime && enrollmentTime.toString() !== "0") {
              const enrollmentDate = new Date(Number(enrollmentTime) * 1000)
              if (!isNaN(enrollmentDate.getTime())) {
                formattedDate = enrollmentDate.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              }
            }
          } catch (dateErr) {
            console.error("Error formatting enrollment date:", dateErr)
          }

          // Format creation time
          let formattedCreationTime = "Not available"
          try {
            if (details2[6] && details2[6].toString() !== "0") {
              const creationDate = new Date(Number(details2[6]) * 1000)
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
            id: details1[0].toString(), // id
            title: details1[2], // title
            description: details1[3], // description
            instructor: details1[1], // instructor
            metadataURI: details1[4], // metadataURI
            price: ethers.formatEther(details1[5]), // price
            duration: (details1[6] / BigInt(86400)).toString(), // duration (convert seconds to days)
            progress: progress.toString(),
            enrollmentTime: formattedDate,
            xpReward: details2[0].toString(), // xpReward
            tokenReward: ethers.formatEther(details2[1]), // tokenReward
            isPaused: details2[3], // isPaused
            prerequisites: prerequisites.map((id) => id.toString()),
            tags: tags,
            enrollmentCount: details2[4].toString(), // enrollmentCount
            completionCount: details2[5].toString(), // completionCount
            creationTime: formattedCreationTime,
            moduleIds: modules.map((id) => id.toString()),
            moduleCount: modules.length,
          })
        } catch (err) {
          console.error(`Error fetching enrolled course ${courseId}:`, err)
        }
      }

      setEnrolledCourses(coursesList)
    } catch (err) {
      console.error("Error fetching enrolled courses:", err)
      setError("Failed to fetch enrolled courses: " + (err.message || "Unknown error"))
    } finally {
      setLoading(false)
    }
  }, [contract, signer])

  // Fetch completed courses
  const fetchCompletedCourses = useCallback(async () => {
    if (!contract || !signer) return

    setLoading(true)
    setError(null)

    try {
      const userAddress = await signer.getAddress()
      const completedCourseIds = await contract.getCompletedCourses(userAddress)

      const coursesList = []

      // Fetch details for each course
      for (const courseId of completedCourseIds) {
        try {
          const details1 = await contract.getCourseDetails1(courseId)
          const details2 = await contract.getCourseDetails2(courseId)
          const prerequisites = await contract.getCoursePrerequisites(courseId)
          const tags = await contract.getCourseTags(courseId)

          // Format completion time
          let formattedCompletionTime = "Not available"
          try {
            if (details2[6] && details2[6].toString() !== "0") {
              const completionDate = new Date(Number(details2[6]) * 1000)
              if (!isNaN(completionDate.getTime())) {
                formattedCompletionTime = completionDate.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              }
            }
          } catch (dateErr) {
            console.error("Error formatting completion date:", dateErr)
          }

          // Format creation time
          let formattedCreationTime = "Not available"
          try {
            if (details2[6] && details2[6].toString() !== "0") {
              const creationDate = new Date(Number(details2[6]) * 1000)
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
            id: details1[0].toString(), // id
            title: details1[2], // title
            description: details1[3], // description
            instructor: details1[1], // instructor
            metadataURI: details1[4], // metadataURI
            price: ethers.formatEther(details1[5]), // price
            duration: (details1[6] / BigInt(86400)).toString(), // duration (convert seconds to days)
            xpReward: details2[0].toString(), // xpReward
            tokenReward: ethers.formatEther(details2[1]), // tokenReward
            prerequisites: prerequisites.map((id) => id.toString()),
            tags: tags,
            enrollmentCount: details2[4].toString(), // enrollmentCount
            completionCount: details2[5].toString(), // completionCount
            creationTime: formattedCreationTime,
            completionTime: formattedCompletionTime,
          })
        } catch (err) {
          console.error(`Error fetching completed course ${courseId}:`, err)
        }
      }

      setCompletedCourses(coursesList)
    } catch (err) {
      console.error("Error fetching completed courses:", err)
      setError("Failed to fetch completed courses: " + (err.message || "Unknown error"))
    } finally {
      setLoading(false)
    }
  }, [contract, signer])

  // Get course progress
  const getCourseProgress = useCallback(
    async (courseId) => {
      if (!contract || !signer) return 0

      try {
        const userAddress = await signer.getAddress()
        const progress = await contract.getCourseProgress(userAddress, BigInt(courseId))
        return progress.toString()
      } catch (err) {
        console.error("Error fetching course progress:", err)
        return 0
      }
    },
    [contract, signer],
  )

  // Update course progress
  const updateProgress = useCallback(
    async (courseId, newProgress) => {
      if (!contract || !signer) {
        toast.error("Please connect your wallet")
        return false
      }

      if (newProgress < 0 || newProgress > 100) {
        toast.error("Progress must be between 0 and 100")
        return false
      }

      setLoading(true)
      setError(null)

      try {
        const userAddress = await signer.getAddress()
        const currentProgress = await contract.getCourseProgress(userAddress, BigInt(courseId))
        console.log("[DEBUG] Current progress:", currentProgress.toString())
        
        // Get all modules for the course
        const moduleIds = await contract.getCourseModules(BigInt(courseId))
        console.log("[DEBUG] Module IDs:", moduleIds.map(id => id.toString()))
        
        // For each module, get its lessons
        const allLessons = []
        for (const moduleId of moduleIds) {
          const lessonIds = await contract.getModuleLessons(moduleId)
          console.log(`[DEBUG] Lessons for module ${moduleId}:`, lessonIds.map(id => id.toString()))
          allLessons.push(...lessonIds)
        }
        
        // Check if there are any lessons
        if (allLessons.length === 0) {
          console.error("[DEBUG] No lessons found for course:", courseId)
          toast.error("No lessons found for this course. Please contact the instructor.")
          return false
        }

        // Get already completed lessons
        const completedLessons = new Set()
        for (const lessonId of allLessons) {
          try {
            const isCompleted = await contract.users(userAddress).completedLessons(lessonId)
            if (isCompleted) {
              completedLessons.add(lessonId.toString())
            }
          } catch (err) {
            console.error(`[DEBUG] Error checking lesson ${lessonId} completion:`, err)
          }
        }
        
        // Calculate how many lessons need to be completed
        const totalLessons = allLessons.length
        const targetCompletedLessons = Math.ceil((newProgress / 100) * totalLessons)
        const currentCompletedLessons = completedLessons.size
        const lessonsToComplete = targetCompletedLessons - currentCompletedLessons

        console.log("[DEBUG] Progress update details:", {
          targetProgress: newProgress,
          currentProgress: currentProgress.toString(),
          totalLessons,
          currentCompletedLessons,
          targetCompletedLessons,
          lessonsToComplete
        })

        if (lessonsToComplete <= 0) {
          console.log("[DEBUG] No new lessons to complete")
          return true
        }

        // Complete the required number of lessons
        let completedCount = 0
        for (const lessonId of allLessons) {
          if (completedCount >= lessonsToComplete) break
          
          const lessonIdStr = lessonId.toString()
          if (!completedLessons.has(lessonIdStr)) {
            try {
              console.log("[DEBUG] Completing lesson", lessonIdStr)
              const tx = await contract.completeLesson(lessonId)
              const receipt = await tx.wait()
              if (receipt.status === 1) {
                completedCount++
                completedLessons.add(lessonIdStr)
              }
            } catch (err) {
              console.error(`[DEBUG] Error completing lesson ${lessonIdStr}:`, err)
              // Continue with next lesson if this one fails
              continue
            }
          }
        }

        // Verify final progress
        const finalProgress = await contract.getCourseProgress(userAddress, BigInt(courseId))
        console.log("[DEBUG] Final progress:", finalProgress.toString())

        if (Number(finalProgress) >= newProgress) {
          toast.success("Progress updated successfully!")
          return true
        } else {
          throw new Error(`Progress update incomplete. Current: ${finalProgress}%, Target: ${newProgress}%`)
        }
      } catch (err) {
        console.error("Progress update error:", err)
        setError("Failed to update progress: " + (err.message || "Unknown error"))
        toast.error(`Failed to update progress: ${err.message || "Unknown error"}`)
        return false
      } finally {
        setLoading(false)
      }
    },
    [contract, signer],
  )

  // Test contract connection
  const testContract = useCallback(async () => {
    if (!contract) {
      console.error("[DEBUG] Contract not initialized")
      return
    }

    try {
      console.log("[DEBUG] Testing contract connection...")
      const totalCourses = await contract.getTotalCourses()
      console.log("[DEBUG] Total courses:", totalCourses.toString())
      return true
    } catch (err) {
      console.error("[DEBUG] Error testing contract:", err)
      return false
    }
  }, [contract])

  // Load enrolled and completed courses when signer changes
  useEffect(() => {
    if (contract && signer) {
      fetchEnrolledCourses()
      fetchCompletedCourses()
      testContract() // Test contract connection
    } else {
      setEnrolledCourses([])
      setCompletedCourses([])
    }
  }, [contract, signer, fetchEnrolledCourses, fetchCompletedCourses, testContract])

  return {
    enrolledCourses,
    completedCourses,
    enrollCourse,
    batchEnrollCourses,
    getCourseProgress,
    updateProgress,
    fetchEnrolledCourses,
    fetchCompletedCourses,
    testContract,
    loading,
    error,
  }
}

export default useSkillQuestEnrollment
