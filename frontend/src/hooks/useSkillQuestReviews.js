"use client"

import { useState, useCallback } from "react"
import { toast } from "react-toastify"
import useSignerOrProvider from "./useSignerOrProvider"
import useContract from "./useContract"
import SkillQuestABI from "../ABI/SkillQuest.json"

const useSkillQuestReviews = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [reviews, setReviews] = useState([])
  const { signer } = useSignerOrProvider()
  const contractAddress = import.meta.env.VITE_APP_SKILLQUEST_ADDRESS
  const { contract } = useContract(contractAddress, SkillQuestABI)

  // Submit a review
  const submitReview = useCallback(
    async (instructorAddress, courseId, rating, comment) => {
      if (!contract || !signer) {
        toast.error("Please connect your wallet")
        return false
      }

      if (rating < 1 || rating > 5) {
        toast.error("Rating must be between 1 and 5")
        return false
      }

      setLoading(true)
      setError(null)

      try {
        const tx = await contract.submitReview(instructorAddress, BigInt(courseId), BigInt(rating), comment)
        const receipt = await tx.wait()

        if (receipt.status === 1) {
          toast.success("Review submitted successfully!")
          return true
        } else {
          throw new Error("Transaction failed")
        }
      } catch (err) {
        console.error("Review submission error:", err)
        setError("Review submission failed: " + (err.message || "Unknown error"))
        toast.error(`Review submission failed: ${err.message || "Unknown error"}`)
        return false
      } finally {
        setLoading(false)
      }
    },
    [contract, signer],
  )

  // Fetch instructor reviews
  const fetchInstructorReviews = useCallback(
    async (instructorAddress) => {
      if (!contract || !instructorAddress) {
        console.log("Contract or instructor address not available")
        return []
      }

      setLoading(true)
      setError(null)

      try {
        const reviewIds = await contract.getInstructorReviews(instructorAddress)
        const reviewsList = []

        for (const reviewId of reviewIds) {
          try {
            const reviewDetails = await contract.getReviewDetails(reviewId)

            reviewsList.push({
              id: reviewId.toString(),
              reviewer: reviewDetails[0], // reviewer
              instructor: reviewDetails[1], // instructor
              courseId: reviewDetails[2].toString(), // courseId
              rating: reviewDetails[3].toString(), // rating
              comment: reviewDetails[4], // comment
              timestamp: new Date(Number(reviewDetails[5]) * 1000).toLocaleString(), // timestamp
              isVerified: reviewDetails[6], // isVerified
            })
          } catch (err) {
            console.error(`Error fetching review ${reviewId}:`, err)
          }
        }

        setReviews(reviewsList)
        return reviewsList
      } catch (err) {
        console.error("Error fetching instructor reviews:", err)
        setError("Failed to fetch reviews: " + (err.message || "Unknown error"))
        return []
      } finally {
        setLoading(false)
      }
    },
    [contract],
  )

  // Get review details
  const getReviewDetails = useCallback(
    async (reviewId) => {
      if (!contract) return null

      setLoading(true)
      setError(null)

      try {
        const reviewDetails = await contract.getReviewDetails(reviewId)

        const review = {
          id: reviewId.toString(),
          reviewer: reviewDetails[0], // reviewer
          instructor: reviewDetails[1], // instructor
          courseId: reviewDetails[2].toString(), // courseId
          rating: reviewDetails[3].toString(), // rating
          comment: reviewDetails[4], // comment
          timestamp: new Date(Number(reviewDetails[5]) * 1000).toLocaleString(), // timestamp
          isVerified: reviewDetails[6], // isVerified
        }

        return review
      } catch (err) {
        console.error(`Error fetching review ${reviewId}:`, err)
        setError(`Failed to fetch review: ${err.message || "Unknown error"}`)
        return null
      } finally {
        setLoading(false)
      }
    },
    [contract],
  )

  return {
    reviews,
    submitReview,
    fetchInstructorReviews,
    getReviewDetails,
    loading,
    error,
  }
}

export default useSkillQuestReviews
