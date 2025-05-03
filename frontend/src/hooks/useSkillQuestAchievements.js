"use client"

import { useState, useCallback } from "react"
import { toast } from "react-toastify"
import useSignerOrProvider from "./useSignerOrProvider"
import useContract from "./useContract"
import SkillQuestABI from "../ABI/SkillQuest.json"

const useSkillQuestAchievements = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [achievements, setAchievements] = useState([])
  const { signer } = useSignerOrProvider()
  const contractAddress = import.meta.env.VITE_APP_SKILLQUEST_ADDRESS
  const { contract } = useContract(contractAddress, SkillQuestABI)

  // Fetch user achievements
  const fetchUserAchievements = useCallback(
    async (userAddress) => {
      if (!contract) return []

      setLoading(true)
      setError(null)

      try {
        const achievementIds = await contract.getUserAchievements(userAddress)
        const achievementsList = []

        for (const achievementId of achievementIds) {
          try {
            const achievement = await contract.getAchievementDetails(achievementId)

            achievementsList.push({
              id: achievementId.toString(),
              title: achievement[0], // title
              description: achievement[1], // description
              imageURI: achievement[2], // imageURI
              xpReward: achievement[3].toString(), // xpReward
              tokenReward: achievement[4].toString(), // tokenReward
              triggerType: achievement[5], // triggerType (enum)
              triggerValue: achievement[6].toString(), // triggerValue
            })
          } catch (err) {
            console.error(`Error fetching achievement ${achievementId}:`, err)
          }
        }

        setAchievements(achievementsList)
        return achievementsList
      } catch (err) {
        console.error("Error fetching user achievements:", err)
        setError("Failed to fetch achievements: " + (err.message || "Unknown error"))
        return []
      } finally {
        setLoading(false)
      }
    },
    [contract, signer],
  )

  // Create achievement (admin only)
  const createAchievement = useCallback(
    async (title, description, imageURI, xpReward, tokenReward, triggerType, triggerValue) => {
      if (!contract || !signer) {
        toast.error("Please connect your wallet")
        return false
      }

      setLoading(true)
      setError(null)

      try {
        const tx = await contract.createAchievement(
          title,
          description,
          imageURI,
          BigInt(xpReward),
          BigInt(tokenReward),
          triggerType,
          BigInt(triggerValue),
        )
        const receipt = await tx.wait()

        if (receipt.status === 1) {
          toast.success("Achievement created successfully!")
          return true
        } else {
          throw new Error("Transaction failed")
        }
      } catch (err) {
        console.error("Achievement creation error:", err)
        setError("Achievement creation failed: " + (err.message || "Unknown error"))
        toast.error(`Achievement creation failed: ${err.message || "Unknown error"}`)
        return false
      } finally {
        setLoading(false)
      }
    },
    [contract, signer],
  )

  // Get achievement trigger type name
  const getAchievementTriggerName = useCallback((triggerType) => {
    const triggerNames = [
      "Course Count",
      "Certificate Count",
      "XP Threshold",
      "Streak Days",
      "Perfect Quiz",
      "Instructor Students",
      "Instructor Courses",
      "Instructor Rating",
    ]
    return triggerNames[triggerType] || "Unknown Trigger"
  }, [])

  // Check if user has earned an achievement
  const hasEarnedAchievement = useCallback(
    async (userAddress, achievementId) => {
      if (!contract) return false

      try {
        return await contract.userAchievements(userAddress, achievementId)
      } catch (err) {
        console.error(`Error checking achievement ${achievementId}:`, err)
        return false
      }
    },
    [contract],
  )

  return {
    achievements,
    fetchUserAchievements,
    createAchievement,
    getAchievementTriggerName,
    hasEarnedAchievement,
    loading,
    error,
  }
}

export default useSkillQuestAchievements
