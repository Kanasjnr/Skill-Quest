"use client"

import { useState, useCallback, useEffect } from "react"
import { toast } from "react-toastify"
import { ethers } from "ethers"
import useSignerOrProvider from "./useSignerOrProvider"
import useContract from "./useContract"
import SkillQuestTokenABI from "../ABI/SkillQuestToken.json"
import SkillQuestABI from "../ABI/SkillQuest.json"

const useSkillQuestToken = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [balance, setBalance] = useState("0")
  const { signer, provider } = useSignerOrProvider()
  const tokenAddress = import.meta.env.VITE_APP_LEARN_TOKEN_ADDRESS
  const platformAddress = import.meta.env.VITE_APP_SKILL_QUEST_ADDRESS
  const { contract: tokenContract } = useContract(tokenAddress, SkillQuestTokenABI)
  const { contract: platformContract } = useContract(platformAddress, SkillQuestABI)

  // Get token balance
  const fetchBalance = useCallback(async () => {
    if (!tokenContract || !signer) return

    setLoading(true)
    setError(null)

    try {
      const userAddress = await signer.getAddress()
      const userBalance = await tokenContract.balanceOf(userAddress)
      setBalance(ethers.formatEther(userBalance))
    } catch (err) {
      console.error("Error fetching token balance:", err)
      setError("Failed to fetch token balance: " + (err.message || "Unknown error"))
    } finally {
      setLoading(false)
    }
  }, [tokenContract, signer])

  // Transfer tokens
  const transferTokens = useCallback(
    async (recipient, amount) => {
      if (!tokenContract || !signer) {
        toast.error("Please connect your wallet")
        return false
      }

      if (!ethers.isAddress(recipient)) {
        toast.error("Invalid recipient address")
        return false
      }

      if (isNaN(amount) || Number.parseFloat(amount) <= 0) {
        toast.error("Invalid amount")
        return false
      }

      setLoading(true)
      setError(null)

      try {
        const amountWei = ethers.parseEther(amount.toString())

        // Check if user has enough balance
        const userAddress = await signer.getAddress()
        const userBalance = await tokenContract.balanceOf(userAddress)

        if (userBalance < amountWei) {
          toast.error("Insufficient token balance")
          return false
        }

        const tx = await tokenContract.transfer(recipient, amountWei)
        const receipt = await tx.wait()

        if (receipt.status === 1) {
          toast.success(`Successfully transferred ${amount} LEARN tokens`)
          await fetchBalance()
          return true
        } else {
          throw new Error("Transaction failed")
        }
      } catch (err) {
        console.error("Token transfer error:", err)
        setError("Transfer failed: " + (err.message || "Unknown error"))
        toast.error(`Transfer failed: ${err.message || "Unknown error"}`)
        return false
      } finally {
        setLoading(false)
      }
    },
    [tokenContract, signer, fetchBalance],
  )

  // Top up reward pool
  const topUpRewardPool = useCallback(
    async (amount) => {
      if (!tokenContract || !platformContract || !signer) {
        toast.error("Please connect your wallet")
        return false
      }

      if (isNaN(amount) || Number.parseFloat(amount) <= 0) {
        toast.error("Invalid amount")
        return false
      }

      setLoading(true)
      setError(null)

      try {
        const amountWei = ethers.parseEther(amount.toString())

        // Check if user has enough balance
        const userAddress = await signer.getAddress()
        const userBalance = await tokenContract.balanceOf(userAddress)

        if (userBalance < amountWei) {
          toast.error("Insufficient token balance")
          return false
        }

        // Approve tokens for the platform contract
        const approveTx = await tokenContract.approve(platformAddress, amountWei)
        await approveTx.wait()

        // Top up reward pool
        const tx = await platformContract.topUpRewardPool(amountWei)
        const receipt = await tx.wait()

        if (receipt.status === 1) {
          toast.success(`Successfully contributed ${amount} LEARN tokens to the reward pool`)
          await fetchBalance()
          return true
        } else {
          throw new Error("Transaction failed")
        }
      } catch (err) {
        console.error("Reward pool contribution error:", err)
        setError("Contribution failed: " + (err.message || "Unknown error"))
        toast.error(`Contribution failed: ${err.message || "Unknown error"}`)
        return false
      } finally {
        setLoading(false)
      }
    },
    [tokenContract, platformContract, signer, platformAddress, fetchBalance],
  )

  // Load balance when signer changes
  useEffect(() => {
    if (tokenContract && signer) {
      fetchBalance()
    } else {
      setBalance("0")
    }
  }, [tokenContract, signer, fetchBalance])

  return {
    balance,
    fetchBalance,
    transferTokens,
    topUpRewardPool,
    loading,
    error,
  }
}

export default useSkillQuestToken
