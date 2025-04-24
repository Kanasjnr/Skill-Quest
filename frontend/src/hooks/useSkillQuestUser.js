"use client"

import { useState, useCallback, useEffect } from "react"
import { toast } from "react-toastify"
import useSignerOrProvider from "./useSignerOrProvider"
import useContract from "./useContract"
import SkillQuestABI from "../ABI/SkillQuest.json"

const useSkillQuestUser = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [userData, setUserData] = useState(null)
  const [isRegistered, setIsRegistered] = useState(false)
  const { signer, provider } = useSignerOrProvider()
  const contractAddress = import.meta.env.VITE_APP_SKILL_QUEST_ADDRESS
  const { contract } = useContract(contractAddress, SkillQuestABI)

  // Get user data
  const fetchUserData = useCallback(
    async (address) => {
      if (!contract || !address) return

      setLoading(true)
      setError(null)

      try {
        // Check if user is registered
        const user = await contract.users(address)
        setIsRegistered(user.isRegistered)

        if (user.isRegistered) {
          // Get user XP
          const xp = await contract.getUserXP(address)

          // Get user certificates
          const totalCertificates = await contract.getUserTotalCertificates(address)

          // Get enrolled courses
          const enrolledCourses = await contract.getEnrolledCourses(address)

          // Get completed courses
          const completedCourses = await contract.getCompletedCourses(address)

          // Get registration time
          const registrationTime = await contract.getUserRegistrationTime(address)

          setUserData({
            isRegistered: true,
            userId: user.userId.toString(),
            xp: xp.toString(),
            totalCertificates: totalCertificates.toString(),
            enrolledCourses: enrolledCourses.map((id) => id.toString()),
            completedCourses: completedCourses.map((id) => id.toString()),
            registrationTime: new Date(registrationTime * 1000).toLocaleString(),
          })
        } else {
          setUserData({ isRegistered: false })
        }
      } catch (err) {
        console.error("Error fetching user data:", err)
        setError("Failed to fetch user data: " + (err.message || "Unknown error"))
        toast.error("Error loading user data")
      } finally {
        setLoading(false)
      }
    },
    [contract],
  )

  // Register user
  const registerUser = useCallback(async () => {
    if (!contract || !signer) {
      toast.error("Please connect your wallet")
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const tx = await contract.registerUser()
      const receipt = await tx.wait()

      if (receipt.status === 1) {
        toast.success("Registration successful!")

        // Refresh user data
        const address = await signer.getAddress()
        await fetchUserData(address)

        return true
      } else {
        throw new Error("Transaction failed")
      }
    } catch (err) {
      console.error("Registration error:", err)
      setError("Registration failed: " + (err.message || "Unknown error"))
      toast.error(`Registration failed: ${err.message || "Unknown error"}`)
      return false
    } finally {
      setLoading(false)
    }
  }, [contract, signer, fetchUserData])

  // Auto-fetch user data when wallet is connected
  useEffect(() => {
    const getUserData = async () => {
      if (signer) {
        try {
          const address = await signer.getAddress()
          fetchUserData(address)
        } catch (err) {
          console.error("Error getting address:", err)
        }
      } else {
        setUserData(null)
        setIsRegistered(false)
      }
    }

    getUserData()
  }, [signer, fetchUserData])

  return {
    userData,
    isRegistered,
    registerUser,
    fetchUserData,
    loading,
    error,
  }
}

export default useSkillQuestUser
