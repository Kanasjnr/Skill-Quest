"use client"

import { useState, useCallback, useEffect } from "react"
import useSignerOrProvider from "./useSignerOrProvider"
import useContract from "./useContract"
import SkillQuestABI from "../ABI/SkillQuest.json"

const useSkillQuestStats = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalCertificates: 0,
    allTags: [],
  })
  const { provider } = useSignerOrProvider()
  const contractAddress = import.meta.env.VITE_APP_SKILL_QUEST_ADDRESS
  const { contract } = useContract(contractAddress, SkillQuestABI)

  // Fetch platform statistics
  const fetchStats = useCallback(async () => {
    if (!contract) return

    setLoading(true)
    setError(null)

    try {
      const [totalUsers, totalCourses, totalCertificates, allTags] = await Promise.all([
        contract.getTotalUsers(),
        contract.getTotalCourses(),
        contract.getTotalCertificates(),
        contract.getAllCourseTags(),
      ])

      setStats({
        totalUsers: totalUsers.toString(),
        totalCourses: totalCourses.toString(),
        totalCertificates: totalCertificates.toString(),
        allTags: allTags,
      })
    } catch (err) {
      console.error("Error fetching platform stats:", err)
      setError("Failed to fetch platform stats: " + (err.message || "Unknown error"))
    } finally {
      setLoading(false)
    }
  }, [contract])

  // Load stats on initial render
  useEffect(() => {
    if (contract) {
      fetchStats()
    }
  }, [contract, fetchStats])

  return {
    stats,
    fetchStats,
    loading,
    error,
  }
}

export default useSkillQuestStats
