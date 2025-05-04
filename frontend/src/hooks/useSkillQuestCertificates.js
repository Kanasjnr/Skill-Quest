"use client"

import { useState, useCallback, useEffect } from "react"
import { toast } from "react-toastify"
import useSignerOrProvider from "./useSignerOrProvider"
import useContract from "./useContract"
import SkillQuestABI from "../ABI/SkillQuest.json"

// Helper function to convert IPFS URL to Cloudinary URL
const convertToCloudinaryUrl = (ipfsUrl) => {
  if (!ipfsUrl) return null

  // If it's already a Cloudinary URL, return as is
  if (ipfsUrl.includes("cloudinary.com")) {
    return ipfsUrl
  }

  // If it's an IPFS URL, convert to Cloudinary URL
  if (ipfsUrl.startsWith("ipfs://")) {
    const cloudName = import.meta.env.VITE_APP_CLOUDINARY_CLOUD_NAME
    const publicId = ipfsUrl.replace("ipfs://", "").replace(".json", "")
    return `https://res.cloudinary.com/${cloudName}/image/upload/certificates/${publicId}`
  }

  return ipfsUrl
}

const useSkillQuestCertificates = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [certificates, setCertificates] = useState([])
  const { signer } = useSignerOrProvider()
  const contractAddress = import.meta.env.VITE_APP_SKILLQUEST_ADDRESS
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
          const courseDetails = await contract.getCourseDetails1(certDetails[1]) // courseId is at index 1

          // Get user profile for the recipient
          const userProfile = await contract.getUserProfile(certDetails[2]) // recipient is at index 2
          const username = userProfile[0] || certDetails[2].slice(0, 6) + "..." + certDetails[2].slice(-4)

          certificatesList.push({
            id: certDetails[0].toString(), // id
            courseId: certDetails[1].toString(), // courseId
            courseTitle: courseDetails[2], // title is at index 2
            recipient: username,
            issueDate: new Date(Number(certDetails[3]) * 1000).toLocaleString(), // issueDate
            expiryDate:
              certDetails[4] > 0
                ? new Date(Number(certDetails[4]) * 1000).toLocaleString() // expiryDate
                : "Never expires",
            metadataURI: certDetails[5], // metadataURI
            isRevoked: certDetails[6], // isRevoked
            imageUrl: convertToCloudinaryUrl(certDetails[5]),
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
        const courseDetails = await contract.getCourseDetails1(certDetails[1]) // courseId is at index 1

        const verificationResult = {
          isValid: !certDetails[6], // isRevoked is at index 6
          id: certDetails[0].toString(), // id
          courseId: certDetails[1].toString(), // courseId
          courseTitle: courseDetails[2], // title is at index 2
          recipient: certDetails[2], // recipient
          issueDate: new Date(Number(certDetails[3]) * 1000).toLocaleString(), // issueDate
          expiryDate:
            certDetails[4] > 0
              ? new Date(Number(certDetails[4]) * 1000).toLocaleString() // expiryDate
              : "Never expires",
          metadataURI: certDetails[5], // metadataURI
          isRevoked: certDetails[6], // isRevoked
          imageUrl: convertToCloudinaryUrl(certDetails[5]),
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
