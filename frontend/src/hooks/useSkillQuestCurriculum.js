"use client"

import { useState, useCallback } from "react"
import { toast } from "react-toastify"
import useSignerOrProvider from "./useSignerOrProvider"
import useContract from "./useContract"
import SkillQuestABI from "../ABI/SkillQuest.json"

const useSkillQuestCurriculum = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [modules, setModules] = useState([])
  const [lessons, setLessons] = useState([])
  const { signer } = useSignerOrProvider()
  const contractAddress = import.meta.env.VITE_APP_SKILLQUEST_ADDRESS
  const { contract } = useContract(contractAddress, SkillQuestABI)

  // Create a new module
  const createModule = useCallback(
    async (courseId, title, description, orderIndex) => {
      if (!contract || !signer) {
        toast.error("Please connect your wallet")
        return false
      }

      if (!title) {
        toast.error("Module title is required")
        return false
      }

      setLoading(true)
      setError(null)

      try {
        const tx = await contract.createModule(BigInt(courseId), title, description || "", BigInt(orderIndex))

        const receipt = await tx.wait()

        if (receipt.status === 1) {
          // Find the ModuleCreated event to get the module ID
          const event = receipt.logs
            .map((log) => {
              try {
                return contract.interface.parseLog(log)
              } catch (err) {
                console.error("Error parsing log:", err)
                return null
              }
            })
            .find((event) => event && event.name === "ModuleCreated")

          const moduleId = event ? event.args.moduleId.toString() : null

          toast.success(`Module created successfully! ID: ${moduleId}`)
          await fetchCourseModules(courseId)
          return moduleId
        } else {
          throw new Error("Transaction failed")
        }
      } catch (err) {
        console.error("Module creation error:", err)
        setError("Module creation failed: " + (err.message || "Unknown error"))
        toast.error(`Module creation failed: ${err.message || "Unknown error"}`)
        return false
      } finally {
        setLoading(false)
      }
    },
    [contract, signer],
  )

  // Create a new lesson
  const createLesson = useCallback(
    async (moduleId, title, description, contentType, contentURI, duration, orderIndex) => {
      if (!contract || !signer) {
        toast.error("Please connect your wallet")
        return false
      }

      if (!title) {
        toast.error("Lesson title is required")
        return false
      }

      setLoading(true)
      setError(null)

      try {
        // Convert content type to enum value
        let contentTypeEnum = 0 // Default to TEXT
        switch (contentType.toLowerCase()) {
          case "text":
            contentTypeEnum = 0
            break
          case "image":
            contentTypeEnum = 1
            break
          case "video":
            contentTypeEnum = 2
            break
          case "audio":
            contentTypeEnum = 3
            break
          case "document":
            contentTypeEnum = 4
            break
          default:
            contentTypeEnum = 0
        }

        // For text lessons, use the description as content URI if none provided
        if (contentTypeEnum === 0 && !contentURI) {
          contentURI = `ipfs://text/${Date.now()}.txt`
        }

        if (!contentURI) {
          toast.error("Content URI is required for this lesson type")
          return false
        }

        console.log("[DEBUG] Creating lesson with params:", {
          moduleId,
          title,
          description,
          contentType: contentTypeEnum,
          contentURI,
          duration,
          orderIndex
        })

        const tx = await contract.createLesson(
          BigInt(moduleId),
          title,
          description || "",
          contentTypeEnum,
          contentURI,
          BigInt(duration),
          BigInt(orderIndex),
        )

        console.log("[DEBUG] Lesson creation transaction:", tx)
        const receipt = await tx.wait()
        console.log("[DEBUG] Lesson creation receipt:", receipt)

        if (receipt.status === 1) {
          // Find the LessonCreated event to get the lesson ID
          const event = receipt.logs
            .map((log) => {
              try {
                return contract.interface.parseLog(log)
              } catch (err) {
                console.error("Error parsing log:", err)
                return null
              }
            })
            .find((event) => event && event.name === "LessonCreated")

          const lessonId = event ? event.args.lessonId.toString() : null
          console.log("[DEBUG] Created lesson ID:", lessonId)

          // Verify the lesson was created
          try {
            const lessonDetails = await contract.getLessonDetails(BigInt(lessonId))
            console.log("[DEBUG] Created lesson details:", lessonDetails)
          } catch (err) {
            console.error("[DEBUG] Error verifying lesson creation:", err)
          }

          toast.success(`Lesson created successfully! ID: ${lessonId}`)
          await fetchModuleLessons(moduleId)
          return lessonId
        } else {
          throw new Error("Transaction failed")
        }
      } catch (err) {
        console.error("Lesson creation error:", err)
        setError("Lesson creation failed: " + (err.message || "Unknown error"))
        toast.error(`Lesson creation failed: ${err.message || "Unknown error"}`)
        return false
      } finally {
        setLoading(false)
      }
    },
    [contract, signer],
  )

  // Fetch modules for a course
  const fetchCourseModules = useCallback(
    async (courseId) => {
      if (!contract) return []

      setLoading(true)
      setError(null)

      try {
        const moduleIds = await contract.getCourseModules(BigInt(courseId))
        const modulesList = []

        for (const moduleId of moduleIds) {
          try {
            const moduleDetails = await contract.getModuleDetails(moduleId)
            const lessonIds = await contract.getModuleLessons(moduleId)

            modulesList.push({
              id: moduleId.toString(),
              courseId: courseId.toString(),
              title: moduleDetails[0], // title
              description: moduleDetails[1], // description
              orderIndex: moduleDetails[2].toString(), // orderIndex
              isActive: moduleDetails[3], // isActive
              lessonIds: lessonIds.map((id) => id.toString()),
              lessonCount: lessonIds.length,
            })
          } catch (err) {
            console.error(`Error fetching module ${moduleId}:`, err)
          }
        }

        // Sort modules by orderIndex
        modulesList.sort((a, b) => Number(a.orderIndex) - Number(b.orderIndex))
        setModules(modulesList)
        return modulesList
      } catch (err) {
        console.error("Error fetching course modules:", err)
        setError("Failed to fetch modules: " + (err.message || "Unknown error"))
        return []
      } finally {
        setLoading(false)
      }
    },
    [contract, signer],
  )

  // Fetch lessons for a module
  const fetchModuleLessons = useCallback(
    async (moduleId) => {
      if (!contract) return []

      setLoading(true)
      setError(null)

      try {
        console.log("Fetching lessons for module:", moduleId)
        const lessonIds = await contract.getModuleLessons(BigInt(moduleId))
        console.log("Raw lesson IDs from contract:", lessonIds)
        
        // The contract returns a uint256[] array
        // Convert each BigInt to string
        const lessonIdsArray = lessonIds.map(id => id.toString())
        console.log("Processed lesson IDs:", lessonIdsArray)
        
        const lessonsList = []

        for (const lessonId of lessonIdsArray) {
          try {
            console.log("Fetching details for lesson:", lessonId)
            const lessonDetails = await contract.getLessonDetails(BigInt(lessonId))
            console.log("Raw lesson details:", lessonDetails)

            if (lessonDetails && lessonDetails.length >= 7) {
              lessonsList.push({
                id: lessonId,
                moduleId: moduleId.toString(),
                title: lessonDetails[0], // title
                description: lessonDetails[1], // description
                contentType: Number(lessonDetails[2]), // contentType
                contentURI: lessonDetails[3], // contentURI
                duration: lessonDetails[4].toString(), // duration
                orderIndex: lessonDetails[5].toString(), // orderIndex
                isActive: lessonDetails[6], // isActive
                contentTypeName: getContentTypeName(Number(lessonDetails[2])),
              })
            } else {
              console.error("Invalid lesson details format:", lessonDetails)
            }
          } catch (err) {
            console.error(`Error fetching lesson ${lessonId}:`, err)
          }
        }

        // Sort lessons by orderIndex
        lessonsList.sort((a, b) => Number(a.orderIndex) - Number(b.orderIndex))
        console.log("Final lessons list:", lessonsList)
        setLessons(lessonsList)
        return lessonsList
      } catch (err) {
        console.error("Error fetching module lessons:", err)
        setError("Failed to fetch lessons: " + (err.message || "Unknown error"))
        return []
      } finally {
        setLoading(false)
      }
    },
    [contract],
  )

  // Complete a lesson
  const completeLesson = useCallback(
    async (lessonId) => {
      if (!contract || !signer) {
        toast.error("Please connect your wallet")
        return false
      }

      setLoading(true)
      setError(null)

      try {
        const tx = await contract.completeLesson(BigInt(lessonId))
        const receipt = await tx.wait()

        if (receipt.status === 1) {
          toast.success("Lesson completed successfully!")
          return true
        } else {
          throw new Error("Transaction failed")
        }
      } catch (err) {
        console.error("Lesson completion error:", err)
        setError("Lesson completion failed: " + (err.message || "Unknown error"))
        toast.error(`Lesson completion failed: ${err.message || "Unknown error"}`)
        return false
      } finally {
        setLoading(false)
      }
    },
    [contract, signer],
  )

  // Check if a lesson is completed
  const isLessonCompleted = useCallback(
    async (userAddress, lessonId) => {
      if (!contract) return false

      try {
        // Check if the lesson is completed using the mapping
        return await contract.users(userAddress).completedLessons(BigInt(lessonId))
      } catch (err) {
        console.error(`Error checking lesson completion ${lessonId}:`, err)
        return false
      }
    },
    [contract],
  )

  // Helper function to get content type name
  const getContentTypeName = (contentType) => {
    const contentTypes = ["Text", "Image", "Video", "Audio", "Document"]
    return contentTypes[contentType] || "Unknown"
  }

  return {
    modules,
    lessons,
    createModule,
    createLesson,
    fetchCourseModules,
    fetchModuleLessons,
    completeLesson,
    isLessonCompleted,
    getContentTypeName,
    loading,
    error,
  }
}

export default useSkillQuestCurriculum