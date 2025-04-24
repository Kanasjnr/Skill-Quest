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
  const { signer, provider } = useSignerOrProvider()
  const contractAddress = import.meta.env.VITE_APP_SKILL_QUEST_ADDRESS
  const tokenAddress = import.meta.env.VITE_APP_LEARN_TOKEN_ADDRESS
  const { contract } = useContract(contractAddress, SkillQuestABI)
  const { contract: tokenContract } = useContract(tokenAddress, SkillQuestTokenABI)

  // Enroll in a course
  const enrollCourse = useCallback(
    async (courseId) => {
      if (!contract || !tokenContract || !signer) {
        toast.error("Please connect your wallet")
        return false
      }

      setLoading(true)
      setError(null)

      try {
        // Get course price
        const courseDetails = await contract.getCourseDetails1(courseId)
        const price = courseDetails.price

        // Check if user has enough tokens
        const userAddress = await signer.getAddress()
        const userBalance = await tokenContract.balanceOf(userAddress)

        if (userBalance < price) {
          toast.error("Insufficient LEARN token balance")
          return false
        }

        // Approve tokens for the contract
        const approveTx = await tokenContract.approve(contractAddress, price)
        await approveTx.wait()

        // Enroll in the course
        const tx = await contract.enrollCourse(BigInt(courseId))
        const receipt = await tx.wait()

        if (receipt.status === 1) {
          toast.success("Successfully enrolled in the course!")
          await fetchEnrolledCourses()
          return true
        } else {
          throw new Error("Transaction failed")
        }
      } catch (err) {
        console.error("Course enrollment error:", err)
        setError("Enrollment failed: " + (err.message || "Unknown error"))
        toast.error(`Enrollment failed: ${err.message || "Unknown error"}`)
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
          totalPrice += courseDetails.price
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

        // Batch enroll in courses
        const tx = await contract.batchEnrollCourses(courseIdsBigInt)
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

  // Update course progress
  const updateProgress = useCallback(
    async (courseId, progress) => {
      if (!contract || !signer) {
        toast.error("Please connect your wallet")
        return false
      }

      if (progress < 0 || progress > 100) {
        toast.error("Progress must be between 0 and 100")
        return false
      }

      setLoading(true)
      setError(null)

      try {
        const tx = await contract.updateProgress(BigInt(courseId), BigInt(progress))
        const receipt = await tx.wait()

        if (receipt.status === 1) {
          toast.success(`Progress updated to ${progress}%`)

          // If progress is 100%, check if the course is now in completed courses
          if (progress === 100) {
            await fetchCompletedCourses()
          }

          return true
        } else {
          throw new Error("Transaction failed")
        }
      } catch (err) {
        console.error("Progress update error:", err)
        setError("Progress update failed: " + (err.message || "Unknown error"))
        toast.error(`Progress update failed: ${err.message || "Unknown error"}`)
        return false
      } finally {
        setLoading(false)
      }
    },
    [contract, signer],
  )

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

          coursesList.push({
            id: details1.id.toString(),
            title: details1.title,
            description: details1.description,
            instructor: details1.instructor,
            price: ethers.formatEther(details1.price),
            progress: progress.toString(),
            enrollmentTime: new Date(Number(enrollmentTime) * 1000).toLocaleString(),
            xpReward: details2.xpReward.toString(),
            tokenReward: ethers.formatEther(details2.tokenReward),
            isPaused: details2.isPaused,
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

          coursesList.push({
            id: details1.id.toString(),
            title: details1.title,
            description: details1.description,
            instructor: details1.instructor,
            xpReward: details2.xpReward.toString(),
            tokenReward: ethers.formatEther(details2.tokenReward),
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

  // Load enrolled and completed courses when signer changes
  useEffect(() => {
    if (contract && signer) {
      fetchEnrolledCourses()
      fetchCompletedCourses()
    } else {
      setEnrolledCourses([])
      setCompletedCourses([])
    }
  }, [contract, signer, fetchEnrolledCourses, fetchCompletedCourses])

  return {
    enrolledCourses,
    completedCourses,
    enrollCourse,
    batchEnrollCourses,
    updateProgress,
    getCourseProgress,
    fetchEnrolledCourses,
    fetchCompletedCourses,
    loading,
    error,
  }
}

export default useSkillQuestEnrollment
