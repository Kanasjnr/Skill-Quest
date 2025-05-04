"use client"

import { useState, useCallback } from "react"
import useSkillQuestCourses from "./useSkillQuestCourses"
import useContract from "./useContract"
import SkillQuestABI from "../ABI/SkillQuest.json"
import useSignerOrProvider from "./useSignerOrProvider"

const useSkillQuestSearch = () => {
  const [searchResults, setSearchResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [allTags, setAllTags] = useState([])
  const { courses, fetchCourses } = useSkillQuestCourses()
  const contractAddress = import.meta.env.VITE_APP_SKILLQUEST_ADDRESS
  const { contract } = useContract(contractAddress, SkillQuestABI)
  const { signer } = useSignerOrProvider()

  // Fetch all course tags
  const fetchAllTags = useCallback(async () => {
    if (!contract) return []

    setLoading(true)
    setError(null)

    try {
      const tags = await contract.getAllCourseTags()
      setAllTags(tags)
      return tags
    } catch (err) {
      console.error("Error fetching course tags:", err)
      setError("Failed to fetch tags: " + (err.message || "Unknown error"))
      return []
    } finally {
      setLoading(false)
    }
  }, [contract, signer])

  // Search courses by title, description, or tags
  const searchCourses = useCallback(
    async (query, options = { byTitle: true, byDescription: true, byTags: true }) => {
      if (!query) {
        setSearchResults([])
        return []
      }

      setLoading(true)
      setError(null)

      try {
        // Make sure we have the latest courses
        await fetchCourses()

        const queryLower = query.toLowerCase()
        const results = courses.filter((course) => {
          // Search by title
          if (options.byTitle && course.title.toLowerCase().includes(queryLower)) {
            return true
          }

          // Search by description
          if (options.byDescription && course.description.toLowerCase().includes(queryLower)) {
            return true
          }

          // Search by tags
          if (options.byTags && course.tags.some((tag) => tag.toLowerCase().includes(queryLower))) {
            return true
          }

          return false
        })

        setSearchResults(results)
        return results
      } catch (err) {
        console.error("Search error:", err)
        setError("Search failed: " + (err.message || "Unknown error"))
        return []
      } finally {
        setLoading(false)
      }
    },
    [courses, fetchCourses],
  )

  // Filter courses by tag
  const filterByTag = useCallback(
    (tag) => {
      if (!tag) {
        setSearchResults([])
        return []
      }

      setLoading(true)
      setError(null)

      try {
        const results = courses.filter((course) => course.tags.includes(tag))
        setSearchResults(results)
        return results
      } catch (err) {
        console.error("Filter error:", err)
        setError("Filter failed: " + (err.message || "Unknown error"))
        return []
      } finally {
        setLoading(false)
      }
    },
    [courses],
  )

  // Filter courses by price range
  const filterByPrice = useCallback(
    (minPrice, maxPrice) => {
      setLoading(true)
      setError(null)

      try {
        const results = courses.filter((course) => {
          const price = Number.parseFloat(course.price)
          return (minPrice === null || price >= minPrice) && (maxPrice === null || price <= maxPrice)
        })
        setSearchResults(results)
        return results
      } catch (err) {
        console.error("Filter error:", err)
        setError("Filter failed: " + (err.message || "Unknown error"))
        return []
      } finally {
        setLoading(false)
      }
    },
    [courses],
  )

  return {
    searchResults,
    allTags,
    searchCourses,
    filterByTag,
    filterByPrice,
    fetchAllTags,
    loading,
    error,
  }
}

export default useSkillQuestSearch
