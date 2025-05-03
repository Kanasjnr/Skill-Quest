"use client"

import { useState, useCallback, useEffect } from "react"
import { toast } from "react-toastify"
import useSignerOrProvider from "./useSignerOrProvider"
import useContract from "./useContract"
import SkillQuestABI from "../ABI/SkillQuest.json"

const useSkillQuestLeaderboard = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [leaderboardData, setLeaderboardData] = useState([])
  const { signer } = useSignerOrProvider()
  const contractAddress = import.meta.env.VITE_APP_SKILLQUEST_ADDRESS
  const { contract } = useContract(contractAddress, SkillQuestABI)

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(
    async (count = 10) => {
      if (!contract) return

      setLoading(true)
      setError(null)

      try {
        // Use the contract's getLeaderboard function
        const leaderboardResult = await contract.getLeaderboard(count)
        const userAddresses = leaderboardResult[0]
        const userXPs = leaderboardResult[1]
        const userLevels = leaderboardResult[2]

        const leaderboard = []

        for (let i = 0; i < userAddresses.length; i++) {
          try {
            // Get user profile to get name
            const userProfile = await contract.getUserProfile(userAddresses[i])

            leaderboard.push({
              position: i + 1,
              address: userAddresses[i],
              username: userProfile[0] || `User_${userAddresses[i].slice(0, 6)}`,
              xp: userXPs[i].toString(),
              level: userLevels[i].toString(),
            })
          } catch (err) {
            console.error(`Error fetching user ${userAddresses[i]}:`, err)
          }
        }

        setLeaderboardData(leaderboard)
        return leaderboard
      } catch (err) {
        console.error("Error fetching leaderboard:", err)
        setError("Failed to fetch leaderboard: " + (err.message || "Unknown error"))
        toast.error("Error loading leaderboard")
        return []
      } finally {
        setLoading(false)
      }
    },
    [contract, signer],
  )

  // Load leaderboard data when contract is available
  useEffect(() => {
    if (contract) {
      fetchLeaderboard()
    }
  }, [contract, fetchLeaderboard])

  return {
    leaderboardData,
    loading,
    error,
    fetchLeaderboard,
  }
}

export default useSkillQuestLeaderboard
