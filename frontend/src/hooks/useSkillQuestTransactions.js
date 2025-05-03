"use client"

import { useState, useCallback, useEffect } from "react"
import { ethers } from "ethers"
import useSignerOrProvider from "./useSignerOrProvider"
import SkillQuestTokenABI from "../ABI/SkillQuestToken.json"
import SkillQuestABI from "../ABI/SkillQuest.json"

export default function useSkillQuestTransactions() {
  const [transactions, setTransactions] = useState([])
  const [availableBalance, setAvailableBalance] = useState("0")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { signer } = useSignerOrProvider()
  const tokenAddress = import.meta.env.VITE_APP_LEARN_TOKEN_ADDRESS
  const platformAddress = import.meta.env.VITE_APP_SKILLQUEST_ADDRESS

  const fetchTransactionHistory = useCallback(async () => {
    if (!signer) {
      setError("No signer available")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const userAddress = await signer.getAddress()
      const tokenContract = new ethers.Contract(tokenAddress, SkillQuestTokenABI, signer)
      const platformContract = new ethers.Contract(platformAddress, SkillQuestABI, signer)
      
      // Get instructor earnings from the platform contract
      const instructorInfo = await platformContract.instructors(userAddress)
      const totalEarnings = Number(ethers.formatEther(instructorInfo.earnings))
      
      // Get transaction history for withdrawals
      const events = await tokenContract.queryFilter(tokenContract.filters.Transfer(null, null))
      const userEvents = events.filter(
        (event) => event.args.from === userAddress || event.args.to === userAddress
      )

      console.log("Raw events:", userEvents.map(e => ({
        from: e.args.from,
        to: e.args.to,
        value: ethers.formatEther(e.args.value)
      })))

      const transactions = await Promise.all(
        userEvents.map(async (event, index) => {
          const block = await event.getBlock()
          const isWithdrawal = event.args.from === userAddress && 
                             event.args.to !== platformAddress && 
                             event.args.to !== tokenAddress
          
          return {
            id: `${event.transactionHash}-${index}`,
            type: event.args.to === userAddress ? "received" : "sent",
            amount: ethers.formatEther(event.args.value),
            from: event.args.from,
            to: event.args.to,
            timestamp: block.timestamp,
            hash: event.transactionHash,
            status: "confirmed",
            method: isWithdrawal ? "withdrawal" : "earning"
          }
        })
      )

      // Calculate total withdrawals (only count actual withdrawals, not platform transfers)
      const totalWithdrawals = transactions.reduce((total, tx) => {
        if (tx.type === "sent" && tx.method === "withdrawal") {
          console.log("Counting withdrawal:", {
            amount: tx.amount,
            from: tx.from,
            to: tx.to
          })
          return total + Number(tx.amount)
        }
        return total
      }, 0)

      // Calculate available balance (earnings minus withdrawals)
      const availableBalance = Math.min(
        totalEarnings,
        Math.max(0, totalEarnings - totalWithdrawals)
      )

      console.log("Earnings calculation:", {
        totalEarnings,
        totalWithdrawals,
        availableBalance,
        transactions: transactions.length,
        withdrawalTransactions: transactions.filter(tx => tx.method === "withdrawal").length
      })

      setTransactions(transactions)
      setAvailableBalance(availableBalance.toString())
    } catch (error) {
      console.error("Error fetching transaction history:", error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [signer, tokenAddress, platformAddress])

  useEffect(() => {
    if (signer) {
      fetchTransactionHistory()
    }
  }, [signer, fetchTransactionHistory])

  return {
    transactions,
    availableBalance,
    loading,
    error,
    fetchTransactionHistory
  }
}
