"use client"

import { useState, useCallback, useEffect } from "react"
import { toast } from "react-toastify"
import useSignerOrProvider from "./useSignerOrProvider"
import useContract from "./useContract"
import SkillQuestABI from "../ABI/SkillQuest.json"

const useSkillQuestUser = () => {
  console.log("[DEBUG] useSkillQuestUser hook initialized")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [userData, setUserData] = useState(null)
  const [isRegistered, setIsRegistered] = useState(false)
  const { signer } = useSignerOrProvider()
  const contractAddress = import.meta.env.VITE_APP_SKILLQUEST_ADDRESS
  const { contract } = useContract(contractAddress, SkillQuestABI)

  console.log("[DEBUG] Contract status:", {
    hasContract: !!contract,
    hasSigner: !!signer,
    contractAddress,
    isRegistered,
    userData
  })

  // Get user data
  const fetchUserData = useCallback(
    async (address) => {
      console.log("[DEBUG] fetchUserData called with address:", address)
      if (!contract || !address) {
        console.log("[DEBUG] fetchUserData: Missing contract or address")
        return
      }

      setLoading(true)
      setError(null)

      try {
        console.log("[DEBUG] Fetching user profile")
        const userProfile = await contract.getUserProfile(address)
        const registrationTime = await contract.getUserRegistrationTime(address)
        const xp = await contract.getUserXP(address)
        const level = await contract.getUserLevel(address)
        const streak = await contract.getUserStreak(address)
        const totalCertificates = await contract.getUserTotalCertificates(address)
        
        console.log("[DEBUG] User profile fetched:", userProfile)
        
        // Check if user is actually registered by verifying the name
        const isActuallyRegistered = userProfile[0] && userProfile[0].length > 0
        
        if (isActuallyRegistered) {
          setUserData({
            name: userProfile[0],
            bio: userProfile[1],
            xp: xp.toString(),
            level: level.toString(),
            streak: streak.toString(),
            totalCertificates: totalCertificates.toString(),
            registrationTime: registrationTime.toString(),
            profileImage: userProfile[2] || "",
            lastActive: userProfile[3]?.toString() || "0"
          })
          setIsRegistered(true)
        } else {
          console.log("[DEBUG] User is not actually registered, resetting state")
          setUserData(null)
          setIsRegistered(false)
        }
      } catch (err) {
        console.error("[DEBUG] Error fetching user data:", err)
        setError("Failed to fetch user data: " + (err.message || "Unknown error"))
        setIsRegistered(false)
        setUserData(null)
      } finally {
        setLoading(false)
      }
    },
    [contract, signer],
  )

  // Register user
  const registerUser = useCallback(
    async (name, role, bio, profileImage, expertise = "") => {
      console.log("[DEBUG] registerUser called with:", { name, role, bio, profileImage, expertise })
      console.log("[DEBUG] Contract and signer status:", {
        hasContract: !!contract,
        hasSigner: !!signer,
        contractAddress: contractAddress,
      })

      if (!contract || !signer) {
        console.error("[DEBUG] Registration blocked: Missing contract or signer")
        toast.error("Please connect your wallet")
        return false
      }

      setLoading(true)
      setError(null)

      try {
        console.log("[DEBUG] Attempting to call contract registration")
        let tx
        if (role === "instructor") {
          console.log("[DEBUG] Registering as instructor")
          tx = await contract.registerInstructor(name, bio || "", profileImage || "", expertise)
        } else {
          console.log("[DEBUG] Registering as student")
          tx = await contract.registerUser(name, bio || "", profileImage || "")
        }
        console.log("[DEBUG] Transaction sent:", tx.hash)

        console.log("[DEBUG] Waiting for transaction receipt...")
        const receipt = await tx.wait()
        console.log("[DEBUG] Transaction receipt:", receipt)

        if (receipt.status === 1) {
          console.log("[DEBUG] Transaction successful, updating local state")
          // Update local state after successful registration
          setIsRegistered(true)
          setUserData({
            name,
            role,
            bio: bio || "",
            profileImage: profileImage || "",
            expertise: role === "instructor" ? expertise : "",
            xp: "0",
            level: "1",
            streak: "0",
            totalCertificates: "0"
          })

          // Refresh user data to ensure we have the latest state
          console.log("[DEBUG] Refreshing user data")
          const address = await signer.getAddress()
          await fetchUserData(address)
          console.log("[DEBUG] User data refreshed")

          return true
        } else {
          console.error("[DEBUG] Transaction failed")
          throw new Error("Transaction failed")
        }
      } catch (error) {
        console.error("[DEBUG] Registration error:", error)
        setError(error.message || "Registration failed")
        toast.error(error.message || "Registration failed")
        return false
      } finally {
        setLoading(false)
      }
    },
    [contract, signer, contractAddress, fetchUserData]
  )

  // Login to update streak
  const login = useCallback(async () => {
    if (!contract || !signer) {
      toast.error("Please connect your wallet")
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const tx = await contract.login()
      const receipt = await tx.wait()

      if (receipt.status === 1) {
        // Check for streak update event
        const streakEvent = receipt.logs.find((log) => {
          try {
            const parsedLog = contract.interface.parseLog(log)
            return parsedLog.name === "StreakUpdated"
          } catch (err) {
            console.log("Error parsing log:", err)
            return false
          }
        })

        if (streakEvent) {
          const streakDays = streakEvent.args.streakDays
          toast.success(`Login successful! Your streak is now ${streakDays} days.`)

          // Refresh user data
          const address = await signer.getAddress()
          await fetchUserData(address)
        } else {
          toast.success("Login successful!")
        }

        return true
      } else {
        throw new Error("Transaction failed")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("Login failed: " + (err.message || "Unknown error"))
      toast.error("Login failed: " + (err.message || "Unknown error"))
      return false
    } finally {
      setLoading(false)
    }
  }, [contract, signer, fetchUserData])

  // Load user data when wallet is connected
  useEffect(() => {
    const getUserData = async () => {
      if (signer) {
        const address = await signer.getAddress()
        await fetchUserData(address)
      } else {
        setIsRegistered(false)
        setUserData(null)
      }
    }

    getUserData()
  }, [signer, fetchUserData])

  return {
    userData,
    isRegistered,
    registerUser,
    login,
    fetchUserData,
    loading,
    error,
  }
}

export default useSkillQuestUser
