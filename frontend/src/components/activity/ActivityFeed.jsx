"use client"

import { useState, useEffect } from "react"
import { BookOpen, Award, Zap, Clock, User, CheckCircle } from "lucide-react"
import { Badge } from "../ui/badge"
import useSkillQuestUser from "../../hooks/useSkillQuestUser"
import useSkillQuestEnrollment from "../../hooks/useSkillQuestEnrollment"
import useSignerOrProvider from "../../hooks/useSignerOrProvider"

const ActivityFeed = () => {
  // Mock data as fallback
  const mockActivities = [
    {
      id: 1,
      type: "course_started",
      title: "Started Blockchain Fundamentals",
      timestamp: "2 hours ago",
      icon: <BookOpen className="h-5 w-5 text-sky-600 dark:text-sky-400" />,
    },
    {
      id: 2,
      type: "course_completed",
      title: "Completed Smart Contract Development",
      timestamp: "1 day ago",
      icon: <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />,
    },
    {
      id: 3,
      type: "certificate_earned",
      title: "Earned Certificate in DeFi Basics",
      timestamp: "3 days ago",
      icon: <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
    },
    {
      id: 4,
      type: "tokens_earned",
      title: "Earned 50 LEARN tokens",
      timestamp: "5 days ago",
      icon: <Zap className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />,
    },
    {
      id: 5,
      type: "level_up",
      title: "Reached Level 3",
      timestamp: "1 week ago",
      icon: <User className="h-5 w-5 text-orange-500 dark:text-orange-400" />,
    },
    {
      id: 6,
      type: "achievement_unlocked",
      title: "Unlocked Fast Learner achievement",
      timestamp: "2 weeks ago",
      icon: <Clock className="h-5 w-5 text-blue-500 dark:text-blue-400" />,
    },
  ]

  const [activities, setActivities] = useState(mockActivities)
  const { userData } = useSkillQuestUser()
  const { enrolledCourses, completedCourses } = useSkillQuestEnrollment()
  const { signer } = useSignerOrProvider()

  // Generate activities based on real blockchain data
  useEffect(() => {
    if (signer && userData && (enrolledCourses.length > 0 || completedCourses.length > 0)) {
      try {
        const generatedActivities = []
        let id = 1

        // Add enrollment activities
        enrolledCourses.forEach((course) => {
          generatedActivities.push({
            id: id++,
            type: "course_started",
            title: `Started ${course.title}`,
            timestamp: formatTimeAgo(new Date(course.enrollmentTime)),
            icon: <BookOpen className="h-5 w-5 text-sky-600 dark:text-sky-400" />,
          })
        })

        // Add completion activities
        completedCourses.forEach((course) => {
          generatedActivities.push({
            id: id++,
            type: "course_completed",
            title: `Completed ${course.title}`,
            timestamp: "Recently", // We don't have completion time in the data
            icon: <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400" />,
          })

          // Add certificate earned for completed courses
          generatedActivities.push({
            id: id++,
            type: "certificate_earned",
            title: `Earned Certificate in ${course.title}`,
            timestamp: "Recently", // We don't have certificate time in the data
            icon: <Award className="h-5 w-5 text-purple-600 dark:text-purple-400" />,
          })

          // Add tokens earned for completed courses
          generatedActivities.push({
            id: id++,
            type: "tokens_earned",
            title: `Earned ${course.tokenReward} LEARN tokens`,
            timestamp: "Recently", // We don't have reward time in the data
            icon: <Zap className="h-5 w-5 text-yellow-500 dark:text-yellow-400" />,
          })
        })

        // Add level up activity if we have XP data
        if (userData.xp) {
          const level = Math.floor(Number(userData.xp) / 100) + 1
          generatedActivities.push({
            id: id++,
            type: "level_up",
            title: `Reached Level ${level}`,
            timestamp: "Recently", // We don't have level up time in the data
            icon: <User className="h-5 w-5 text-orange-500 dark:text-orange-400" />,
          })
        }

        // Sort by most recent first (this is a simplification)
        generatedActivities.sort((a, b) => {
          // For simplicity, we'll just use the id as a proxy for recency
          return b.id - a.id
        })

        // Take the most recent 6 activities
        if (generatedActivities.length > 0) {
          setActivities(generatedActivities.slice(0, 6))
        }
      } catch (error) {
        console.error("Error generating activities:", error)
        // Fall back to mock data
      }
    }
  }, [userData, enrolledCourses, completedCourses, signer])

  // Helper function to format time ago
  const formatTimeAgo = (date) => {
    const now = new Date()
    const diffInSeconds = Math.floor((now - date) / 1000)

    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60)
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`
    }

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`
    }

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`
    }

    const diffInWeeks = Math.floor(diffInDays / 7)
    return `${diffInWeeks} ${diffInWeeks === 1 ? "week" : "weeks"} ago`
  }

  const getActivityBadge = (type) => {
    switch (type) {
      case "course_started":
        return <Badge className="bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">Started</Badge>
      case "course_completed":
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300">Completed</Badge>
      case "certificate_earned":
        return (
          <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
            Certificate
          </Badge>
        )
      case "tokens_earned":
        return (
          <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300">Tokens</Badge>
        )
      case "level_up":
        return (
          <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300">Level Up</Badge>
        )
      case "achievement_unlocked":
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">Achievement</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start space-x-4">
          <div className="flex-shrink-0 mt-0.5 bg-slate-100 dark:bg-slate-700 p-2 rounded-full">{activity.icon}</div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-slate-900 dark:text-slate-100">{activity.title}</h4>
              {getActivityBadge(activity.type)}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{activity.timestamp}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ActivityFeed
