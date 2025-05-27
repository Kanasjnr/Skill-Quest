"use client"

import { useState, useCallback, useEffect } from "react"
import { toast } from "react-toastify"
import { ethers } from "ethers"
import useSignerOrProvider from "./useSignerOrProvider"
import useContract from "./useContract"
import SkillQuestTokenABI from "../ABI/SkillQuestToken.json"
import SkillQuestABI from "../ABI/SkillQuest.json"

const useSkillQuestToken = () => {
  console.log("[DEBUG] useSkillQuestToken hook initialized");
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [balance, setBalance] = useState("0")
  const { signer } = useSignerOrProvider()
  const tokenAddress = import.meta.env.VITE_APP_LEARN_TOKEN_ADDRESS
  const platformAddress = import.meta.env.VITE_APP_SKILLQUEST_ADDRESS
  
  console.log("[DEBUG] Contract addresses:", {
    tokenAddress,
    platformAddress,
    hasSigner: !!signer
  });

  const { contract: tokenContract, error: tokenContractError } = useContract(tokenAddress, SkillQuestTokenABI)
  const { contract: platformContract, error: platformContractError } = useContract(platformAddress, SkillQuestABI)

  console.log("[DEBUG] Contract initialization:", {
    hasTokenContract: !!tokenContract,
    hasPlatformContract: !!platformContract,
    tokenContractError,
    platformContractError
  });

  // Get token balance
  const fetchBalance = useCallback(async () => {
    if (!tokenContract || !signer) {
      console.log("Token contract or signer not available:", {
        hasTokenContract: !!tokenContract,
        hasSigner: !!signer,
        tokenAddress,
      })
      return
    }

    setLoading(true)
    setError(null)

    try {
      const userAddress = await signer.getAddress()
      console.log("Fetching balance for address:", userAddress)
      const userBalance = await tokenContract.balanceOf(userAddress)
      console.log("Raw balance:", userBalance.toString())
      setBalance(ethers.formatEther(userBalance))
    } catch (err) {
      console.error("Error fetching token balance:", err)
      setError("Failed to fetch token balance: " + (err.message || "Unknown error"))
    } finally {
      setLoading(false)
    }
  }, [tokenContract, signer, tokenAddress])

  // Transfer tokens
  const transferTokens = useCallback(
    async (recipient, amount) => {
      console.log("[DEBUG] transferTokens called with:", { recipient, amount });
      console.log("[DEBUG] Contract status:", {
        hasTokenContract: !!tokenContract,
        hasPlatformContract: !!platformContract,
        hasSigner: !!signer,
        tokenAddress,
        platformAddress
      });

      if (!tokenContract || !platformContract || !signer) {
        console.error("[DEBUG] Contracts or signer not initialized");
        toast.error("Please connect your wallet");
        return false;
      }

      let isWithdrawal = false;
      try {
        const userAddress = await signer.getAddress();
        console.log("[DEBUG] User address:", userAddress);
        
        const amountWei = ethers.parseEther(amount.toString());
        isWithdrawal = recipient === userAddress;

        console.log("[DEBUG] Transfer details:", {
          recipient,
          amount,
          amountWei: amountWei.toString(),
          isWithdrawal,
          userAddress
        });

        // Check if user has enough balance
        console.log("[DEBUG] Checking user balance...");
        const userBalance = await tokenContract.balanceOf(userAddress);
        console.log("[DEBUG] User balance:", {
          balance: userBalance.toString(),
          required: amountWei.toString()
        });

        if (userBalance < amountWei) {
          console.error("[DEBUG] Insufficient balance:", {
            required: amountWei.toString(),
            available: userBalance.toString()
          });
          toast.error("Insufficient token balance");
          return false;
        }

        // For both withdrawals and transfers, we use the token contract directly
        console.log("[DEBUG] Processing transfer");
        console.log("[DEBUG] User address:", userAddress);
        console.log("[DEBUG] Amount in Wei:", amountWei.toString());
        
        try {
          // Transfer tokens directly using the token contract
          console.log("[DEBUG] Initiating transfer transaction...");
          const tx = await tokenContract.transfer(recipient, amountWei);
          console.log("[DEBUG] Transfer transaction sent:", tx.hash);
          
          console.log("[DEBUG] Waiting for transaction confirmation...");
          const receipt = await tx.wait();
          console.log("[DEBUG] Transaction receipt:", {
            status: receipt.status,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString()
          });

          if (receipt.status === 1) {
            console.log("[DEBUG] Transfer successful");
            toast.success(`Successfully ${isWithdrawal ? "withdrew" : "transferred"} ${amount} LEARN tokens`);
            await fetchBalance();
            return true;
          } else {
            console.log("[DEBUG] Transfer failed - transaction status:", receipt.status);
            throw new Error("Transfer failed");
          }
        } catch (err) {
          console.error("[DEBUG] Transfer error details:", err);
          throw err;
        }
      } catch (error) {
        console.error("[DEBUG] Transfer error:", error);
        toast.error(`Failed to ${isWithdrawal ? "withdraw" : "transfer"}: ${error.message || "Unknown error"}`);
        return false;
      }
    },
    [tokenContract, platformContract, signer, fetchBalance]
  );

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

  // Get token balance for a specific address
  const getTokenBalance = useCallback(
    async (address) => {
      if (!tokenContract || !address) {
        console.log("Token contract or address not available:", {
          hasTokenContract: !!tokenContract,
          address,
          tokenAddress,
        })
        return "0"
      }

      try {
        console.log("Fetching balance for address:", address)
        const userBalance = await tokenContract.balanceOf(address)
        console.log("Raw balance:", userBalance.toString())
        return ethers.formatEther(userBalance)
      } catch (err) {
        console.error("Error fetching token balance:", err)
        setError("Failed to fetch token balance: " + (err.message || "Unknown error"))
        return "0"
      }
    },
    [tokenContract, tokenAddress]
  )

  // Load balance when signer changes
  useEffect(() => {
    if (tokenContract && signer) {
      fetchBalance()
    } else {
      setBalance("0")
    }
  }, [tokenContract, signer, fetchBalance])

  // Initialize contract
  useEffect(() => {
    if (!tokenContract) {
      console.log("Token contract not initialized:", {
        tokenAddress,
        hasContract: !!tokenContract,
      })
    }
  }, [tokenContract, tokenAddress])

  return {
    balance,
    fetchBalance,
    transferTokens,
    topUpRewardPool,
    getTokenBalance,
    loading,
    error,
  }
}

export default useSkillQuestToken
