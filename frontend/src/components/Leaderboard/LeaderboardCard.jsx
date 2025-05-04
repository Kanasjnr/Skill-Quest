"use client"

import { useState, useEffect } from "react"
import { Award, TrendingUp } from "lucide-react"
import { Card, CardContent } from "../ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar"
import { Badge } from "../ui/badge"
import { Skeleton } from "../ui/skeleton"
import useSkillQuestLeaderboard from "../../hooks/useSkillQuestLeaderboard"
import useSignerOrProvider from "../../hooks/useSignerOrProvider"

const LeaderboardCard = () => {
  const [activeTab, setActiveTab] = useState("xp")
  const { leaderboard, fetchLeaderboard, loading } = useSkillQuestLeaderboard()
  const { signer } = useSignerOrProvider()
  const [userRank, setUserRank] = useState(null)

  useEffect(() => {
    const loadLeaderboardData = async () => {
      if (signer) {
        try {
          await fetchLeaderboard()

          // Find current user's rank if they're on the leaderboard
          if (leaderboard?.length > 0) {
            const address = await signer.getAddress()
            const userIndex = leaderboard.findIndex((user) => user.address.toLowerCase() === address.toLowerCase())

            if (userIndex !== -1) {
              setUserRank({
                ...leaderboard[userIndex],
                position: userIndex + 1,
              })
            }
          }
        } catch (err) {
          console.error("Error loading leaderboard data:", err)
        }
      }
    }

    loadLeaderboardData()
  }, [signer, fetchLeaderboard, leaderboard])

  // Get the appropriate icon for the leaderboard type
  const getLeaderboardIcon = (type) => {
    switch (type) {
      case "xp":
        return <Award className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
      case "courses":
        return <TrendingUp className="h-5 w-5 text-green-500 dark:text-green-400" />
      case "achievements":
        return <Award className="h-5 w-5 text-purple-500 dark:text-purple-400" />
      default:
        return <Award className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />
    }
  }

  // Get the appropriate value for the leaderboard type
  const getLeaderboardValue = (user, type) => {
    switch (type) {
      case "xp":
        return `${user.xp || 0} XP`
      case "courses":
        return `${user.completedCourses || 0} Courses`
      case "achievements":
        return `${user.achievements || 0} Badges`
      default:
        return `${user.xp || 0} XP`
    }
  }

  // Get the appropriate badge for the top 3 positions
  const getPositionBadge = (position) => {
    switch (position) {
      case 1:
        return (
          <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800">
            1st
          </Badge>
        )
      case 2:
        return (
          <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600">
            2nd
          </Badge>
        )
      case 3:
        return (
          <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800">
            3rd
          </Badge>
        )
      default:
        return <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">{position}th</Badge>
    }
  }

  // Generate initials from name
  const getInitials = (name) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  // Filter leaderboard based on active tab
  const getFilteredLeaderboard = () => {
    if (!leaderboard || leaderboard.length === 0) return []

    // Create a copy of the leaderboard to avoid mutating the original
    const filteredLeaderboard = [...leaderboard]

    // Sort based on the active tab
    switch (activeTab) {
      case "xp":
        return filteredLeaderboard.sort((a, b) => (b.xp || 0) - (a.xp || 0))
      case "courses":
        return filteredLeaderboard.sort((a, b) => (b.completedCourses || 0) - (a.completedCourses || 0))
      case "achievements":
        return filteredLeaderboard.sort((a, b) => (b.achievements || 0) - (a.achievements || 0))
      default:
        return filteredLeaderboard
    }
  }

  const filteredLeaderboard = getFilteredLeaderboard()

  return (
    <Card>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="xp">XP Leaders</TabsTrigger>
            <TabsTrigger value="courses">Course Completions</TabsTrigger>
            <TabsTrigger value="achievements">Achievement Leaders</TabsTrigger>
          </TabsList>

          {["xp", "courses", "achievements"].map((tabValue) => (
            <TabsContent key={tabValue} value={tabValue} className="p-4 pt-6">
              {loading ? (
                // Loading state
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-3 w-[100px]" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>
              ) : filteredLeaderboard.length > 0 ? (
                // Leaderboard data
                <div className="space-y-4">
                  {filteredLeaderboard.slice(0, 5).map((user, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <Avatar className="h-10 w-10 border-2 border-slate-200 dark:border-slate-700">
                        <AvatarImage
                          src={user.profileImage || "/placeholder.svg?height=40&width=40&query=user"}
                          alt={user.name}
                        />
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center">
                          <p className="font-medium text-slate-900 dark:text-slate-100">{user.name}</p>
                          <div className="ml-2">{getPositionBadge(index + 1)}</div>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {user.title || "SkillQuest Learner"}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getLeaderboardIcon(tabValue)}
                        <span className="font-medium">{getLeaderboardValue(user, tabValue)}</span>
                      </div>
                    </div>
                  ))}

                  {/* Show user's position if not in top 5 */}
                  {userRank && userRank.position > 5 && (
                    <>
                      <div className="relative py-2">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
                        </div>
                        <div className="relative flex justify-center">
                          <span className="bg-white dark:bg-slate-800 px-2 text-xs text-slate-500 dark:text-slate-400">
                            Your Ranking
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-md">
                        <Avatar className="h-10 w-10 border-2 border-sky-200 dark:border-sky-700">
                          <AvatarImage
                            src={userRank.profileImage || "/placeholder.svg?height=40&width=40&query=user"}
                            alt={userRank.name}
                          />
                          <AvatarFallback>{getInitials(userRank.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center">
                            <p className="font-medium text-slate-900 dark:text-slate-100">{userRank.name}</p>
                            <div className="ml-2">{getPositionBadge(userRank.position)}</div>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {userRank.title || "SkillQuest Learner"}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getLeaderboardIcon(tabValue)}
                          <span className="font-medium">{getLeaderboardValue(userRank, tabValue)}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                // Empty state
                <div className="text-center py-8">
                  <Award className="mx-auto h-12 w-12 text-slate-400" />
                  <h3 className="mt-2 text-lg font-medium text-slate-900 dark:text-slate-100">No data yet</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Be the first to join the leaderboard!
                  </p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default LeaderboardCard
