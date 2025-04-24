"use client"

import { useState, useCallback, useEffect } from "react"
import { toast } from "react-toastify"
import { ethers } from "ethers"
import useSignerOrProvider from "./useSignerOrProvider"
import useContract from "./useContract"
import SkillQuestABI from "../ABI/SkillQuest.json"

const useSkillQuestCourses = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [courses, setCourses] = useState([])
  const [instructorCourses, setInstructorCourses] = useState([])
  const [totalCourses, setTotalCourses] = useState(0)
  const { signer, provider } = useSignerOrProvider()
  const contractAddress = import.meta.env.VITE_APP_SKILL_QUEST_ADDRESS
  const { contract } = useContract(contractAddress, SkillQuestABI)

  // Create a new course
  const createCourse = useCallback(
    async (courseData) => {
      if (!contract || !signer) {
        toast.error("Please connect your wallet")
        return false
      }

      const { metadataURI, title, description, price, duration, xpReward, tokenReward, requiredCourses, tags } =
        courseData

      if (!title || !description) {
        toast.error("Title and description are required")
        return false
      }

      setLoading(true)
      setError(null)

      try {
        // Convert price and rewards to wei
        const priceWei = ethers.parseEther(price.toString())
        const tokenRewardWei = ethers.parseEther(tokenReward.toString())

        // Convert duration to seconds
        const durationSeconds = BigInt(duration * 86400) // days to seconds

        const tx = await contract.createCourse(
          metadataURI,
          title,
          description,
          priceWei,
          durationSeconds,
          BigInt(xpReward),
          tokenRewardWei,
          requiredCourses.map((id) => BigInt(id)),
          tags,
        )

        const receipt = await tx.wait()

        if (receipt.status === 1) {
          // Find the CourseCreated event to get the course ID
          const event = receipt.logs
            .map((log) => {
              try {
                return contract.interface.parseLog(log)
              } catch (e) {
                return null
              }
            })
            .find((event) => event && event.name === "CourseCreated")

          const courseId = event ? event.args.courseId.toString() : null

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

        const tx = await contract.updateCourse(BigInt(courseId), metadataURI, title, description, priceWei, isActive)

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

        const tx = await contract.updateCourseRewards(BigInt(courseId), BigInt(xpReward), tokenRewardWei)

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
          const details1 = await contract.getCourseDetails1(i)
          const details2 = await contract.getCourseDetails2(i)
          const prerequisites = await contract.getCoursePrerequisites(i)
          const tags = await contract.getCourseTags(i)

          // Only add active courses
          if (details2.isActive) {
            coursesList.push({
              id: details1.id.toString(),
              instructor: details1.instructor,
              title: details1.title,
              description: details1.description,
              metadataURI: details1.metadataURI,
              price: ethers.formatEther(details1.price),
              duration: (details1.duration / BigInt(86400)).toString(), // Convert seconds to days
              xpReward: details2.xpReward.toString(),
              tokenReward: ethers.formatEther(details2.tokenReward),
              isActive: details2.isActive,
              isPaused: details2.isPaused,
              enrollmentCount: details2.enrollmentCount.toString(),
              completionCount: details2.completionCount.toString(),
              creationTime: new Date(Number(details2.creationTime) * 1000).toLocaleString(),
              prerequisites: prerequisites.map((id) => id.toString()),
              tags: tags,
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
          const details1 = await contract.getCourseDetails1(courseId)
          const details2 = await contract.getCourseDetails2(courseId)
          const prerequisites = await contract.getCoursePrerequisites(courseId)
          const tags = await contract.getCourseTags(courseId)

          coursesList.push({
            id: details1.id.toString(),
            instructor: details1.instructor,
            title: details1.title,
            description: details1.description,
            metadataURI: details1.metadataURI,
            price: ethers.formatEther(details1.price),
            duration: (details1.duration / BigInt(86400)).toString(), // Convert seconds to days
            xpReward: details2.xpReward.toString(),
            tokenReward: ethers.formatEther(details2.tokenReward),
            isActive: details2.isActive,
            isPaused: details2.isPaused,
            enrollmentCount: details2.enrollmentCount.toString(),
            completionCount: details2.completionCount.toString(),
            creationTime: new Date(Number(details2.creationTime) * 1000).toLocaleString(),
            prerequisites: prerequisites.map((id) => id.toString()),
            tags: tags,
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

  // Get course details
  const getCourseDetails = useCallback(
    async (courseId) => {
      if (!contract) return null

      setLoading(true)
      setError(null)

      try {
        const details1 = await contract.getCourseDetails1(courseId)
        const details2 = await contract.getCourseDetails2(courseId)
        const prerequisites = await contract.getCoursePrerequisites(courseId)
        const tags = await contract.getCourseTags(courseId)

        const courseDetails = {
          id: details1.id.toString(),
          instructor: details1.instructor,
          title: details1.title,
          description: details1.description,
          metadataURI: details1.metadataURI,
          price: ethers.formatEther(details1.price),
          duration: (details1.duration / BigInt(86400)).toString(), // Convert seconds to days
          xpReward: details2.xpReward.toString(),
          tokenReward: ethers.formatEther(details2.tokenReward),
          isActive: details2.isActive,
          isPaused: details2.isPaused,
          enrollmentCount: details2.enrollmentCount.toString(),
          completionCount: details2.completionCount.toString(),
          creationTime: new Date(Number(details2.creationTime) * 1000).toLocaleString(),
          prerequisites: prerequisites.map((id) => id.toString()),
          tags: tags,
        }

        return courseDetails
      } catch (err) {
        console.error(`Error fetching course ${courseId}:`, err)
        setError(`Failed to fetch course ${courseId}: ` + (err.message || "Unknown error"))
        toast.error(`Error loading course details`)
        return null
      } finally {
        setLoading(false)
      }
    },
    [contract],
  )

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

  return {
    courses,
    instructorCourses,
    totalCourses,
    createCourse,
    updateCourse,
    updateCourseRewards,
    toggleCoursePause,
    fetchCourses,
    fetchInstructorCourses,
    getCourseDetails,
    loading,
    error,
  }
}

export default useSkillQuestCourses
