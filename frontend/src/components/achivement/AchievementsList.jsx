"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { Progress } from "../../components/ui/progress"
import { Award, Zap, CheckCircle, Lock } from "lucide-react"
import useSkillQuestAchievements from "../../hooks/useSkillQuestAchievements"
import useSkillQuestUser from "../../hooks/useSkillQuestUser"
import useSignerOrProvider from "../../hooks/useSignerOrProvider"
import LoadingSpinner from "../../components/LoadingSpinner"

const AchievementsList = ({ userAddress }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [displayedAchievements, setDisplayedAchievements] = useState([])
  const [userAchievements, setUserAchievements] = useState([])

  const {
    achievements,
    fetchUserAchievements,
    loading: achievementsLoading,
    error: achievementsError,
  } = useSkillQuestAchievements()
  const { userData, loading: userLoading, error: userError } = useSkillQuestUser()
  const { signer } = useSignerOrProvider()

  // Combine loading and error states
  useEffect(() => {
    setLoading(achievementsLoading || userLoading)
    setError(achievementsError || userError)
  }, [achievementsLoading, userLoading, achievementsError, userError])

  // Load user achievements with proper error handling
  useEffect(() => {
    const loadAchievements = async () => {
      if (!signer && !userAddress) {
        setError("No wallet connected and no user address provided")
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        let address = userAddress

        // If no address provided, use current user address
        if (!address && signer) {
          address = await signer.getAddress()
        }

        if (!address) {
          throw new Error("No valid address available")
        }

        // Fetch user achievements
        const userAchs = await fetchUserAchievements(address)
        setUserAchievements(userAchs || [])

        // In a real implementation, we would fetch all possible achievements from the contract
        // For now, we'll use our mock implementation with improved error handling

        // Create a list of all possible achievements (earned and unearned)
        const allAchievements = [
          {
            id: "1",
            title: "Course Completer",
            description: "Complete your first course",
            imageURI: "",
            xpReward: "100",
            tokenReward: "10",
            isEarned: userAchs.some((a) => a.id === "1"),
            progress: userAchs.some((a) => a.id === "1")
              ? 100
              : userData?.completedCourses?.length > 0
                ? 100
                : userData?.enrolledCourses?.length > 0
                  ? 50
                  : 0,
          },
          {
            id: "2",
            title: "Fast Learner",
            description: "Complete a course in under a week",
            imageURI: "",
            xpReward: "150",
            tokenReward: "15",
            isEarned: userAchs.some((a) => a.id === "2"),
            progress: userAchs.some((a) => a.id === "2") ? 100 : 50,
          },
          {
            id: "3",
            title: "Knowledge Seeker",
            description: "Enroll in 5 different courses",
            imageURI: "",
            xpReward: "200",
            tokenReward: "20",
            isEarned: userAchs.some((a) => a.id === "3"),
            progress: userAchs.some((a) => a.id === "3") ? 100 : 60,
          },
          {
            id: "4",
            title: "Certificate Collector",
            description: "Earn 10 certificates",
            imageURI: "",
            xpReward: "250",
            tokenReward: "25",
            isEarned: userAchs.some((a) => a.id === "4"),
            progress: userAchs.some((a) => a.id === "4") ? 100 : 30,
          },
          {
            id: "5",
            title: "Master Student",
            description: "Reach level 10",
            imageURI: "",
            xpReward: "500",
            tokenReward: "50",
            isEarned: userAchs.some((a) => a.id === "5"),
            progress: userAchs.some((a) => a.id === "5") ? 100 : 20,
          },
        ]

        setDisplayedAchievements(allAchievements)
      } catch (err) {
        console.error("Error loading achievements:", err)
        setError("Failed to load achievements: " + (err.message || "Unknown error"))
      } finally {
        setLoading(false)
      }
    }

    loadAchievements()
  }, [signer, fetchUserAchievements, userAddress, userData])

  if (loading) {
    return <LoadingSpinner message="Loading achievements..." />
  }

  if (error) {
    return <div className="text-red-500 p-4">Error loading achievements: {error}</div>
  }

  return (
    <div className="space-y-4">
      {displayedAchievements.length > 0 ? (
        displayedAchievements.map((achievement) => (
          <Card
            key={achievement.id}
            className={`overflow-hidden ${
              achievement.isEarned ? "border-green-200 dark:border-green-900" : "border-gray-200 dark:border-gray-800"
            }`}
          >
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/4 aspect-square bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  {achievement.isEarned ? (
                    <Award className="h-16 w-16 text-purple-600 dark:text-purple-400" />
                  ) : (
                    <Lock className="h-12 w-12 text-slate-400 dark:text-slate-600" />
                  )}
                </div>
                <div className="p-6 flex-1">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center">
                        <h3 className="font-semibold text-lg mb-1">{achievement.title}</h3>
                        {achievement.isEarned && (
                          <Badge className="ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                            <CheckCircle className="h-3 w-3 mr-1" /> Earned
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{achievement.description}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {!achievement.isEarned && (
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium">Progress</span>
                          <span className="text-slate-500">{achievement.progress}%</span>
                        </div>
                        <Progress value={achievement.progress} className="h-2" />
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge className="flex items-center bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border-purple-200 dark:border-purple-800">
                        <Award className="h-3.5 w-3.5 mr-1" />
                        {achievement.xpReward} XP
                      </Badge>
                      <Badge className="flex items-center bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800">
                        <Zap className="h-3.5 w-3.5 mr-1" />
                        {achievement.tokenReward} LEARN
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-center py-10">
          <Award className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-medium mb-2">No Achievements Yet</p>
          <p className="text-gray-500">Complete courses and activities to earn achievements</p>
        </div>
      )}
    </div>
  )
}

export default AchievementsList
