"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback } from "../ui/avatar"
import { Badge } from "../ui/badge"
import { Zap, Trophy } from "lucide-react"
import useSkillQuestUser from "../../hooks/useSkillQuestUser"
import useSignerOrProvider from "../../hooks/useSignerOrProvider"

const LeaderboardCard = () => {
  // Mock data as fallback
  const mockLeaderboard = [
    {
      id: 1,
      address: "0x1234...5678",
      username: "blockchain_master",
      xp: 2450,
      level: 25,
      position: 1,
    },
    {
      id: 2,
      address: "0xabcd...efgh",
      username: "crypto_learner",
      xp: 2100,
      level: 22,
      position: 2,
    },
    {
      id: 3,
      address: "0x9876...5432",
      username: "web3_developer",
      xp: 1950,
      level: 20,
      position: 3,
    },
    {
      id: 4,
      address: "0xijkl...mnop",
      username: "defi_explorer",
      xp: 1800,
      level: 19,
      position: 4,
    },
    {
      id: 5,
      address: "0xqrst...uvwx",
      username: "nft_collector",
      xp: 1650,
      level: 17,
      position: 5,
    },
  ]

  const [leaderboardData, setLeaderboardData] = useState(mockLeaderboard)
  const { userData } = useSkillQuestUser()
  const { signer } = useSignerOrProvider()

  // In a real implementation, you would fetch leaderboard data from the blockchain
  // This is a placeholder for where you would integrate with a leaderboard API or contract
  useEffect(() => {
    // If we have user data, we could potentially add the current user to the leaderboard
    if (userData && signer) {
      const fetchLeaderboard = async () => {
        try {
          // This would be replaced with actual blockchain data fetching
          // For now, we'll just use the mock data

          // Example of how you might add the current user to the leaderboard
          const userAddress = await signer.getAddress()
          const shortenedAddress = `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`

          // Check if user is already in the leaderboard
          const userInLeaderboard = mockLeaderboard.some(
            (user) => user.address.toLowerCase() === shortenedAddress.toLowerCase(),
          )

          if (!userInLeaderboard && userData.xp) {
            // Create a copy of the leaderboard with the user added
            const newLeaderboard = [...mockLeaderboard]

            // Add user to leaderboard
            newLeaderboard.push({
              id: 6,
              address: shortenedAddress,
              username: `user_${shortenedAddress.slice(2, 6)}`,
              xp: Number(userData.xp),
              level: Math.floor(Number(userData.xp) / 100) + 1,
              position: 6,
            })

            // Sort by XP
            newLeaderboard.sort((a, b) => b.xp - a.xp)

            // Update positions
            newLeaderboard.forEach((user, index) => {
              user.position = index + 1
            })

            // Take top 5
            setLeaderboardData(newLeaderboard.slice(0, 5))
          }
        } catch (error) {
          console.error("Error fetching leaderboard:", error)
        }
      }

      fetchLeaderboard()
    }
  }, [userData, signer])

  const getPositionColor = (position) => {
    switch (position) {
      case 1:
        return "text-yellow-500"
      case 2:
        return "text-slate-400"
      case 3:
        return "text-amber-600"
      default:
        return "text-slate-600 dark:text-slate-400"
    }
  }

  const getPositionIcon = (position) => {
    switch (position) {
      case 1:
        return <Trophy className={`h-5 w-5 ${getPositionColor(position)}`} />
      case 2:
        return <Trophy className={`h-5 w-5 ${getPositionColor(position)}`} />
      case 3:
        return <Trophy className={`h-5 w-5 ${getPositionColor(position)}`} />
      default:
        return <span className={`font-medium ${getPositionColor(position)}`}>{position}</span>
    }
  }

  return (
    <div className="space-y-4">
      {leaderboardData.map((user) => (
        <div
          key={user.id}
          className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
        >
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-8">{getPositionIcon(user.position)}</div>
            <Avatar className="h-10 w-10 border-2 border-slate-200 dark:border-slate-700">
              <AvatarFallback className="bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300">
                {user.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">{user.username}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user.address}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex flex-col items-end">
              <div className="flex items-center">
                <Zap className="h-3.5 w-3.5 text-yellow-500 mr-1" />
                <span className="font-medium text-slate-900 dark:text-slate-100">{user.xp} XP</span>
              </div>
              <Badge className="mt-1 text-xs bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
                Level {user.level}
              </Badge>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default LeaderboardCard
