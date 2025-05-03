"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Textarea } from "../../components/ui/textarea"
import { Star } from 'lucide-react'
import { toast } from "react-toastify"
import useSkillQuestReviews from "../../hooks/useSkillQuestReviews"
import useSignerOrProvider from "../../hooks/useSignerOrProvider"

const ReviewForm = ({ instructorAddress, courseId, onReviewSubmitted }) => {
  const [review, setReview] = useState({
    rating: 5,
    comment: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const { submitReview, loading, error: reviewError } = useSkillQuestReviews()
  const { signer } = useSignerOrProvider()

  // Update error from hook
  useEffect(() => {
    if (reviewError) {
      setError(reviewError)
    }
  }, [reviewError])

  const handleRatingChange = (newRating) => {
    setReview({
      ...review,
      rating: newRating,
    })
  }

  const handleCommentChange = (e) => {
    setReview({
      ...review,
      comment: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!signer) {
      toast.error("Please connect your wallet to submit a review")
      return
    }

    // Validate inputs
    if (!review.comment.trim()) {
      toast.error("Please enter your feedback")
      return
    }

    if (review.comment.trim().length < 10) {
      toast.error("Your review is too short. Please provide more details.")
      return
    }

    try {
      setIsSubmitting(true)
      setError(null)

      // Show loading toast
      const loadingToast = toast.loading("Submitting review...")

      const success = await submitReview(instructorAddress, courseId, review.rating, review.comment)

      // Dismiss loading toast
      toast.dismiss(loadingToast)

      if (success) {
        toast.success("Review submitted successfully!")

        // Reset form
        setReview({
          rating: 5,
          comment: "",
        })

        // Notify parent component
        if (onReviewSubmitted) {
          onReviewSubmitted()
        }
      }
    } catch (err) {
      console.error("Error submitting review:", err)
      setError("Failed to submit review: " + (err.message || "Unknown error"))
      toast.error("Failed to submit review: " + (err.message || "Unknown error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Write a Review</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Rating</p>
            <div className="flex space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingChange(star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-6 w-6 ${star <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="comment" className="text-sm font-medium">
              Your Feedback
            </label>
            <Textarea
              id="comment"
              placeholder="Share your experience with this course..."
              className="min-h-[120px]"
              value={review.comment}
              onChange={handleCommentChange}
              disabled={isSubmitting || loading}
            />
          </div>

          {error && <div className="text-sm text-red-500">{error}</div>}

          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={isSubmitting || loading || !signer}
          >
            {isSubmitting || loading ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="text-xs text-gray-500">
        Your review helps other students make informed decisions
      </CardFooter>
    </Card>
  )
}

export default ReviewForm