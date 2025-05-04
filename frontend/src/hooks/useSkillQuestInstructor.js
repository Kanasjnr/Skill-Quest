"use client"

import { useState, useCallback, useEffect } from "react"
import { toast } from "react-toastify"
import useSignerOrProvider from "./useSignerOrProvider"
import useContract from "./useContract"
import SkillQuestABI from "../ABI/SkillQuest.json"

const useSkillQuestInstructor = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [instructorData, setInstructorData] = useState(null)
  const [isRegistered, setIsRegistered] = useState(false)
  const { signer } = useSignerOrProvider()
  const contractAddress = import.meta.env.VITE_APP_SKILLQUEST_ADDRESS
  const { contract } = useContract(contractAddress, SkillQuestABI)

  // Get instructor data
  const fetchInstructorData = useCallback(
    async (address) => {
      if (!contract || !address) return

      setLoading(true)
      setError(null)

      try {
        // Check if instructor is registered
        const instructor = await contract.instructors(address)
        setIsRegistered(instructor.isRegistered)

        if (instructor.isRegistered) {
          // Get instructor profile
          const profile = await contract.getInstructorProfile(address)

          // Get instructor courses
          const instructorCourses = await contract.getInstructorCourses(address)

          // Get instructor reviews
          const reviewIds = await contract.getInstructorReviews(address)

          setInstructorData({
            isRegistered: true,
            instructorId: instructor.instructorId.toString(),
            name: profile[0], // name
            bio: profile[1], // bio
            expertise: profile[2], // expertise
            totalCourses: profile[3].toString(), // totalCourses
            totalStudents: profile[4].toString(), // totalStudents
            earnings: profile[5].toString(), // earnings
            level: profile[6].toString(), // level
            courses: instructorCourses.map((id) => id.toString()),
            reviewIds: reviewIds.map((id) => id.toString()),
            averageRating: instructor.averageRating ? instructor.averageRating.toString() : "0",
            totalReviews: instructor.totalReviews ? instructor.totalReviews.toString() : "0",
          })
        } else {
          setInstructorData({ isRegistered: false })
        }
      } catch (err) {
        console.error("Error fetching instructor data:", err)
        setError("Failed to fetch instructor data: " + (err.message || "Unknown error"))
        toast.error("Error loading instructor data")
      } finally {
        setLoading(false)
      }
    },
    [contract],
  )

  // Register as instructor
  const registerInstructor = useCallback(
    async (name, bio, profileImage, expertise) => {
      if (!contract || !signer) {
        toast.error("Please connect your wallet")
        return false
      }

      if (!name || !bio || !expertise) {
        toast.error("Please provide all required fields")
        return false
      }

      setLoading(true)
      setError(null)

      try {
        console.log("Registering instructor with data:", {
          name,
          bio,
          profileImage,
          expertise,
        })

        // First check if the user is already registered
        const address = await signer.getAddress()
        const instructor = await contract.instructors(address)

        if (instructor.isRegistered) {
          toast.error("You are already registered as an instructor")
          return false
        }

        // Estimate gas first to catch any potential issues
        try {
          const gasEstimate = await contract.registerInstructor.estimateGas(name, bio, profileImage || "", expertise)
          console.log("Gas estimate:", gasEstimate.toString())
        } catch (estimateError) {
          console.error("Gas estimation failed:", estimateError)
          toast.error("Registration failed: Invalid input data")
          return false
        }

        // Proceed with the transaction
        const tx = await contract.registerInstructor(name, bio, profileImage || "", expertise)
        console.log("Transaction sent:", tx.hash)

        const receipt = await tx.wait()
        console.log("Transaction receipt:", receipt)

        if (receipt.status === 1) {
          toast.success("Instructor registration successful!")

          // Refresh instructor data
          await fetchInstructorData(address)

          return true
        } else {
          throw new Error("Transaction failed")
        }
      } catch (err) {
        console.error("Instructor registration error:", err)
        let errorMessage = "Registration failed: "

        if (err.code === "ACTION_REJECTED") {
          errorMessage += "Transaction was rejected"
        } else if (err.code === "INSUFFICIENT_FUNDS") {
          errorMessage += "Insufficient funds for gas"
        } else if (err.message.includes("user rejected")) {
          errorMessage += "Transaction was rejected by user"
        } else {
          errorMessage += err.message || "Unknown error"
        }

        setError(errorMessage)
        toast.error(errorMessage)
        return false
      } finally {
        setLoading(false)
      }
    },
    [contract, signer, fetchInstructorData],
  )

  // Update instructor profile
  const updateInstructorProfile = useCallback(
    async (name, bio, expertise, website, twitter, github, linkedin, location, title) => {
      if (!contract || !signer) {
        toast.error("Please connect your wallet")
        return false
      }

      setLoading(true)
      setError(null)

      try {
        console.log("Updating instructor profile with data:", {
          name,
          bio,
          expertise,
          website,
          twitter,
          github,
          linkedin,
          location,
          title,
        })

        // Since the contract doesn't have updateInstructorProfile, we'll show an error
        const errorMessage = "Profile updates are not currently supported. This feature will be available in a future update."
        setError(errorMessage)
        toast.error(errorMessage)
        return false

        // The following code is commented out until the contract is updated
        /*
        const tx = await contract.updateInstructorProfile(
          name,
          bio,
          expertise,
          website || "",
          twitter || "",
          github || "",
          linkedin || "",
          location || "",
          title || ""
        )

        const receipt = await tx.wait()

        if (receipt.status === 1) {
          toast.success("Profile updated successfully!")

          // Refresh instructor data
          const address = await signer.getAddress()
          await fetchInstructorData(address)

          return true
        } else {
          throw new Error("Transaction failed")
        }
        */
      } catch (err) {
        console.error("Profile update error:", err)
        let errorMessage = "Profile update failed: "

        if (err.code === "ACTION_REJECTED") {
          errorMessage += "Transaction was rejected"
        } else if (err.code === "INSUFFICIENT_FUNDS") {
          errorMessage += "Insufficient funds for gas"
        } else if (err.message.includes("user rejected")) {
          errorMessage += "Transaction was rejected by user"
        } else {
          errorMessage += err.message || "Unknown error"
        }

        setError(errorMessage)
        toast.error(errorMessage)
        return false
      } finally {
        setLoading(false)
      }
    },
    [contract, signer, fetchInstructorData]
  )

  // Update profile image
  const updateProfileImage = useCallback(
    async (profileImage) => {
      if (!contract || !signer) {
        toast.error("Please connect your wallet")
        return false
      }

      setLoading(true)
      setError(null)

      try {
        const tx = await contract.updateInstructorProfileImage(profileImage)
        const receipt = await tx.wait()

        if (receipt.status === 1) {
          toast.success("Profile image updated successfully!")

          // Refresh instructor data
          const address = await signer.getAddress()
          await fetchInstructorData(address)

          return true
        } else {
          throw new Error("Transaction failed")
        }
      } catch (err) {
        console.error("Profile image update error:", err)
        setError("Failed to update profile image: " + (err.message || "Unknown error"))
        toast.error("Failed to update profile image: " + (err.message || "Unknown error"))
        return false
      } finally {
        setLoading(false)
      }
    },
    [contract, signer, fetchInstructorData]
  )

  // Update profile visibility
  const updateProfileVisibility = useCallback(
    async (isPublic) => {
      if (!contract || !signer) {
        toast.error("Please connect your wallet")
        return false
      }

      setLoading(true)
      setError(null)

      try {
        const tx = await contract.updateInstructorVisibility(isPublic)
        const receipt = await tx.wait()

        if (receipt.status === 1) {
          toast.success(`Profile ${isPublic ? "made public" : "made private"} successfully!`)

          // Refresh instructor data
          const address = await signer.getAddress()
          await fetchInstructorData(address)

          return true
        } else {
          throw new Error("Transaction failed")
        }
      } catch (err) {
        console.error("Profile visibility update error:", err)
        setError("Failed to update profile visibility: " + (err.message || "Unknown error"))
        toast.error("Failed to update profile visibility: " + (err.message || "Unknown error"))
        return false
      } finally {
        setLoading(false)
      }
    },
    [contract, signer, fetchInstructorData]
  )

  // Auto-fetch instructor data when wallet is connected
  useEffect(() => {
    const getInstructorData = async () => {
      if (signer) {
        try {
          const address = await signer.getAddress()
          fetchInstructorData(address)
        } catch (err) {
          console.error("Error getting address:", err)
        }
      } else {
        setInstructorData(null)
        setIsRegistered(false)
      }
    }

    getInstructorData()
  }, [signer, fetchInstructorData])

  return {
    instructorData,
    isRegistered,
    registerInstructor,
    updateInstructorProfile,
    updateProfileImage,
    updateProfileVisibility,
    fetchInstructorData,
    loading,
    error,
  }
}

export default useSkillQuestInstructor
