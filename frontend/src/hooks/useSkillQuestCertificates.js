"use client"

import { useState, useCallback, useEffect } from "react"
import { toast } from "react-toastify"
import useSignerOrProvider from "./useSignerOrProvider"
import useContract from "./useContract"
import SkillQuestABI from "../ABI/SkillQuest.json"

const useSkillQuestCertificates = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [certificates, setCertificates] = useState([])
  const { signer, provider } = useSignerOrProvider()
  const contractAddress = import.meta.env.VITE_APP_SKILL_QUEST_ADDRESS
  const { contract } = useContract(contractAddress, SkillQuestABI)

  // Fetch user certificates
  const fetchCertificates = useCallback(async () => {
    if (!contract || !signer) return

    setLoading(true)
    setError(null)

    try {
      const userAddress = await signer.getAddress()
      const certificateIds = await contract.getUserCertificates(userAddress)

      const certificatesList = []

      // Fetch details for each certificate
      for (const certId of certificateIds) {
        try {
          const certDetails = await contract.getCertificateDetails(certId)

          // Get course details for the certificate
          const courseDetails = await contract.getCourseDetails1(certDetails.courseId)

          certificatesList.push({
            id: certDetails.id.toString(),
            courseId: certDetails.courseId.toString(),
            courseTitle: courseDetails.title,
            recipient: certDetails.recipient,
            issueDate: new Date(Number(certDetails.issueDate) * 1000).toLocaleString(),
            expiryDate:
              certDetails.expiryDate > 0
                ? new Date(Number(certDetails.expiryDate) * 1000).toLocaleString()
                : "Never expires",
            metadataURI: certDetails.metadataURI,
            isRevoked: certDetails.isRevoked,
          })
        } catch (err) {
          console.error(`Error fetching certificate ${certId}:`, err)
        }
      }

      setCertificates(certificatesList)
    } catch (err) {
      console.error("Error fetching certificates:", err)
      setError("Failed to fetch certificates: " + (err.message || "Unknown error"))
    } finally {
      setLoading(false)
    }
  }, [contract, signer])

  // Revoke certificate (for instructors or owner)
  const revokeCertificate = useCallback(
    async (certificateId) => {
      if (!contract || !signer) {
        toast.error("Please connect your wallet")
        return false
      }

      setLoading(true)
      setError(null)

      try {
        const tx = await contract.revokeCertificate(BigInt(certificateId))
        const receipt = await tx.wait()

        if (receipt.status === 1) {
          toast.success("Certificate revoked successfully")
          await fetchCertificates()
          return true
        } else {
          throw new Error("Transaction failed")
        }
      } catch (err) {
        console.error("Certificate revocation error:", err)
        setError("Revocation failed: " + (err.message || "Unknown error"))
        toast.error(`Revocation failed: ${err.message || "Unknown error"}`)
        return false
      } finally {
        setLoading(false)
      }
    },
    [contract, signer, fetchCertificates],
  )

  // Verify certificate
  const verifyCertificate = useCallback(
    async (certificateId) => {
      if (!contract) return null

      setLoading(true)
      setError(null)

      try {
        const certDetails = await contract.getCertificateDetails(certificateId)

        // Get course details
        const courseDetails = await contract.getCourseDetails1(certDetails.courseId)

        const verificationResult = {
          isValid: !certDetails.isRevoked,
          id: certDetails.id.toString(),
          courseId: certDetails.courseId.toString(),
          courseTitle: courseDetails.title,
          recipient: certDetails.recipient,
          issueDate: new Date(Number(certDetails.issueDate) * 1000).toLocaleString(),
          expiryDate:
            certDetails.expiryDate > 0
              ? new Date(Number(certDetails.expiryDate) * 1000).toLocaleString()
              : "Never expires",
          metadataURI: certDetails.metadataURI,
          isRevoked: certDetails.isRevoked,
        }

        return verificationResult
      } catch (err) {
        console.error("Certificate verification error:", err)
        setError("Verification failed: " + (err.message || "Unknown error"))
        return null
      } finally {
        setLoading(false)
      }
    },
    [contract],
  )

  // Load certificates when signer changes
  useEffect(() => {
    if (contract && signer) {
      fetchCertificates()
    } else {
      setCertificates([])
    }
  }, [contract, signer, fetchCertificates])

  return {
    certificates,
    fetchCertificates,
    revokeCertificate,
    verifyCertificate,
    loading,
    error,
  }
}

export default useSkillQuestCertificates
