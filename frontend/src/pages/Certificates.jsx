"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Award, Download, Share2, CheckCircle, ExternalLink, Shield } from 'lucide-react'
import useSkillQuestCertificates from "../hooks/useSkillQuestCertificates"
import useSignerOrProvider from "../hooks/useSignerOrProvider"
import { toast } from "react-toastify"
import LoadingSpinner from "../components/LoadingSpinner"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const Certificates = () => {
  const {
    certificates,
    fetchCertificates,
    verifyCertificate,
    loading: certLoading,
    error: certError,
  } = useSkillQuestCertificates()
  const { signer } = useSignerOrProvider()
  const [sharedCertificates, setSharedCertificates] = useState({})
  const [verifiedCertificates, setVerifiedCertificates] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCertificate, setSelectedCertificate] = useState(null)

  useEffect(() => {
    setLoading(certLoading)
    setError(certError)
  }, [certLoading, certError])

  useEffect(() => {
    if (signer) {
      const loadData = async () => {
        try {
          await fetchCertificates()
        } catch (err) {
          console.error("Error loading certificate data:", err)
        }
      }
      loadData()
    }
  }, [signer, fetchCertificates])

  // Initialize shared status from localStorage
  useEffect(() => {
    const savedSharedStatus = localStorage.getItem("sharedCertificates")
    if (savedSharedStatus) {
      setSharedCertificates(JSON.parse(savedSharedStatus))
    }
  }, [])

  // Verify certificate authenticity
  const handleVerifyCertificate = async (certificateId) => {
    try {
      const loadingToast = toast.loading("Verifying certificate...")
      const verificationResult = await verifyCertificate(certificateId)
      toast.dismiss(loadingToast)

      if (verificationResult && verificationResult.isValid) {
        toast.success("Certificate verified successfully!")
        setVerifiedCertificates((prev) => ({ ...prev, [certificateId]: true }))
        return verificationResult
      } else {
        toast.error("Certificate verification failed.")
        setVerifiedCertificates((prev) => ({ ...prev, [certificateId]: false }))
        return null
      }
    } catch (error) {
      console.error("Certificate verification error:", error)
      toast.error("Failed to verify certificate")
      return null
    }
  }

  // Toggle share certificate
  const toggleShare = async (id) => {
    try {
      const loadingToast = toast.loading(sharedCertificates[id] ? "Disabling sharing..." : "Sharing certificate...")

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      const newSharedStatus = {
        ...sharedCertificates,
        [id]: !sharedCertificates[id],
      }

      setSharedCertificates(newSharedStatus)
      localStorage.setItem("sharedCertificates", JSON.stringify(newSharedStatus))

      toast.dismiss(loadingToast)
      toast.success(sharedCertificates[id] ? "Certificate sharing disabled" : "Certificate shared successfully!")
    } catch (error) {
      console.error("Error toggling certificate share:", error)
      toast.error("Failed to update sharing status")
    }
  }

  const downloadCertificate = async (certificate) => {
    try {
      const loadingToast = toast.loading("Generating certificate...")

      // Get certificate image URL
      let imageUrl = certificate.imageUrl;
      
      // If no image URL is available, use the metadata URI
      if (!imageUrl && certificate.metadataURI) {
        // If it's an IPFS URI, convert to HTTP gateway URL
        if (certificate.metadataURI.startsWith('ipfs://')) {
          const ipfsHash = certificate.metadataURI.replace('ipfs://', '');
          imageUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
        } else {
          imageUrl = certificate.metadataURI;
        }
      }
      
      // If still no image, use a default template
      if (!imageUrl) {
        imageUrl = "/certificate-template.png";
      }

      // Create download link
      const link = document.createElement("a")
      link.href = imageUrl
      link.download = `certificate-${certificate.id}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.dismiss(loadingToast)
      toast.success(`Certificate downloaded successfully`)
    } catch (error) {
      console.error("Certificate download error:", error)
      toast.error("Failed to download certificate")
    }
  }

  const viewCertificateDetails = (certificate) => {
    setSelectedCertificate(certificate)
  }

  const closeCertificateDetails = () => {
    setSelectedCertificate(null)
  }

  const viewOnBlockchain = (certificate) => {
    // Open blockchain explorer with the certificate ID
    window.open(`https://pharosscan.xyz/token/${import.meta.env.VITE_APP_SKILLQUEST_ADDRESS}?a=${certificate.id}`, '_blank')
  }

  if (loading) {
    return <LoadingSpinner message="Loading certificates..." />
  }

  if (error) {
    return <div className="text-red-500">Error loading data: {error}</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Certificates</h1>
          <p className="mt-2 text-gray-600">View and manage your earned certificates</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {certificates.length > 0 ? (
            certificates.map((certificate) => (
              <div key={certificate.id} className="relative group">
                {/* Compact Certificate */}
                <div className="compact-certificate">
                  {/* Certificate Status Badges */}
                  <div className="certificate-badges">
                    {certificate.isRevoked && (
                      <div className="revoked-badge">
                        REVOKED
                      </div>
                    )}
                    {verifiedCertificates[certificate.id] && (
                      <div className="verified-badge">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        VERIFIED
                      </div>
                    )}
                    {sharedCertificates[certificate.id] && (
                      <div className="shared-badge">
                        SHARED
                      </div>
                    )}
                  </div>
                  
                  {/* Certificate Content */}
                  <div className="certificate-content">
                    {/* Header */}
                    <div className="certificate-header">
                      <div>
                        <h2 className="certificate-title">Certificate of Achievement</h2>
                        <div className="certificate-subtitle">This certifies that</div>
                      </div>
                    </div>
                    
                    {/* Recipient Name */}
                    <div className="recipient-name">
                      {certificate.recipient}
                    </div>
                    
                    {/* Course Info */}
                    <div className="certificate-text">
                      has successfully completed the course
                      <div className="course-title">{certificate.courseTitle}</div>
                      <div className="issue-date">Issued on {certificate.issueDate}</div>
                    </div>
                    
                    {/* Footer with Signature */}
                    <div className="certificate-footer">
                      <div className="signature">
                        <div className="signature-name">SkillQuest</div>
                        <div className="signature-title">Verified on Blockchain</div>
                      </div>
                    </div>
                    
                    {/* Certificate ID */}
                    <div className="certificate-id">Certificate ID: {certificate.id}</div>
                  </div>
                  
                  {/* Certificate Actions */}
                  <div className="certificate-actions opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex justify-center space-x-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="certificate-action-button"
                              onClick={() => handleVerifyCertificate(certificate.id)}
                            >
                              <Shield className="h-3 w-3 mr-1" />
                              Verify
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Verify certificate authenticity</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="certificate-action-button"
                              onClick={() => downloadCertificate(certificate)}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Download certificate</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="certificate-action-button"
                              onClick={() => toggleShare(certificate.id)}
                            >
                              <Share2 className="h-3 w-3 mr-1" />
                              {sharedCertificates[certificate.id] ? 'Unshare' : 'Share'}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{sharedCertificates[certificate.id] ? 'Disable sharing' : 'Share certificate'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="certificate-action-button"
                              onClick={() => viewCertificateDetails(certificate)}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View certificate details</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full">
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <Award className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Certificates Yet</h3>
                <p className="text-gray-500 mb-6">Complete courses to earn certificates</p>
                <Button asChild>
                  <a href="/courses">Browse Courses</a>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Certificate Detail Modal */}
      {selectedCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Certificate Details</h2>
                <Button variant="ghost" size="sm" onClick={closeCertificateDetails}>
                  ✕
                </Button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Certificate Preview */}
                <div className="certificate-preview">
                  <div className="full-certificate">
                    <div className="certificate-content p-8">
                      <div className="certificate-header">
                        <h2 className="certificate-title text-2xl">Certificate of Achievement</h2>
                        <div className="certificate-subtitle text-lg mt-2">This certifies that</div>
                      </div>
                      
                      <div className="recipient-name text-3xl my-6">
                        {selectedCertificate.recipient}
                      </div>
                      
                      <div className="certificate-text text-lg">
                        has successfully completed the course
                        <div className="course-title text-xl my-3">{selectedCertificate.courseTitle}</div>
                        <div className="issue-date">Issued on {selectedCertificate.issueDate}</div>
                      </div>
                      
                      <div className="certificate-footer mt-8">
                        <div className="signature">
                          <div className="signature-name text-2xl">SkillQuest</div>
                          <div className="signature-title">Verified on Blockchain</div>
                        </div>
                      </div>
                      
                      <div className="certificate-id mt-4">Certificate ID: {selectedCertificate.id}</div>
                    </div>
                  </div>
                </div>
                
                {/* Certificate Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Certificate Information</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <div className="flex items-center mt-1">
                        {selectedCertificate.isRevoked ? (
                          <Badge variant="destructive">Revoked</Badge>
                        ) : (
                          <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>
                        )}
                        
                        {verifiedCertificates[selectedCertificate.id] && (
                          <Badge variant="outline" className="ml-2 flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Course</p>
                      <p className="font-medium">{selectedCertificate.courseTitle}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Recipient</p>
                      <p className="font-medium">{selectedCertificate.recipient}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Issue Date</p>
                      <p className="font-medium">{selectedCertificate.issueDate}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Expiry Date</p>
                      <p className="font-medium">{selectedCertificate.expiryDate}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Certificate ID</p>
                      <p className="font-mono text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                        {selectedCertificate.id}
                      </p>
                    </div>
                    
                    <div className="pt-4">
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleVerifyCertificate(selectedCertificate.id)}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Verify on Blockchain
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => downloadCertificate(selectedCertificate)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Certificate
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => viewOnBlockchain(selectedCertificate)}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View on Blockchain
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .compact-certificate {
          position: relative;
          background-color: #fffdf5;
          border: 1px solid #d4af37;
          border-radius: 4px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          overflow: hidden;
          padding: 8px;
          margin: 4px;
          min-height: 200px;
          max-width: 280px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .compact-certificate:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transform: translateY(-2px);
        }
        
        .certificate-badges {
          position: absolute;
          top: 6px;
          right: 6px;
          display: flex;
          gap: 3px;
          z-index: 10;
        }
        
        .verified-badge {
          display: flex;
          align-items: center;
          background-color: rgba(16, 185, 129, 0.1);
          border: 1px solid #10b981;
          color: #10b981;
          font-size: 0.65rem;
          font-weight: 600;
          padding: 1px 3px;
          border-radius: 2px;
        }
        
        .shared-badge {
          background-color: rgba(59, 130, 246, 0.1);
          border: 1px solid #3b82f6;
          color: #3b82f6;
          font-size: 0.65rem;
          font-weight: 600;
          padding: 1px 3px;
          border-radius: 2px;
        }
        
        .revoked-badge {
          background-color: rgba(239, 68, 68, 0.1);
          border: 1px solid #ef4444;
          color: #ef4444;
          font-size: 0.65rem;
          font-weight: 600;
          padding: 1px 3px;
          border-radius: 2px;
        }
        
        .certificate-content {
          padding: 4px;
          text-align: center;
          position: relative;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }
        
        .certificate-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }
        
        .certificate-title {
          font-family: 'Playfair Display', serif;
          font-size: 1rem;
          font-weight: bold;
          color: #5a3e2b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0;
          line-height: 1.2;
          text-align: center;
          width: 100%;
        }
        
        .certificate-subtitle {
          font-family: 'Playfair Display', serif;
          font-size: 0.8rem;
          font-style: italic;
          color: #5a3e2b;
          margin-top: 2px;
          text-align: center;
          width: 100%;
        }
        
        .recipient-name {
          font-family: 'Dancing Script', cursive;
          font-size: 1.4rem;
          color: #5a3e2b;
          margin: 0;
          line-height: 1.2;
          text-align: center;
          width: 100%;
          font-weight: bold;
        }
        
        .certificate-text {
          font-family: 'Playfair Display', serif;
          font-size: 0.8rem;
          color: #5a3e2b;
          margin: 0;
          line-height: 1.3;
          text-align: center;
          width: 100%;
        }
        
        .course-title {
          font-family: 'Playfair Display', serif;
          font-size: 0.9rem;
          font-weight: bold;
          color: #5a3e2b;
          margin: 4px 0;
          line-height: 1.2;
          text-align: center;
          width: 100%;
        }
        
        .issue-date {
          font-family: 'Playfair Display', serif;
          font-size: 0.75rem;
          font-style: italic;
          color: #5a3e2b;
          margin: 0;
          text-align: center;
          width: 100%;
        }
        
        .certificate-footer {
          margin-top: 4px;
          padding: 0;
          width: 100%;
          display: flex;
          justify-content: center;
        }
        
        .signature {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 40%;
        }
        
        .signature-name {
          font-family: 'Dancing Script', cursive;
          font-size: 1.2rem;
          color: #5a3e2b;
          text-align: center;
          line-height: 1;
          width: 100%;
        }
        
        .signature-title {
          font-family: 'Playfair Display', serif;
          font-size: 0.7rem;
          color: #5a3e2b;
          font-weight: 500;
          text-align: center;
          margin-top: 2px;
          width: 100%;
        }
        
        .certificate-id {
          font-family: 'Playfair Display', serif;
          font-size: 0.65rem;
          color: #8a7a5c;
          margin-top: 4px;
          text-align: center;
          width: 100%;
        }
        
        .certificate-actions {
          margin-top: 4px;
          padding: 4px;
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, rgba(255,253,245,0.9), rgba(255,253,245,0.7));
          padding: 8px;
        }
        
        .certificate-action-button {
          padding: 2px 6px;
          font-size: 0.7rem;
        }
        
        .certificate-action-button:hover {
          transform: translateY(-1px);
        }
        
        .full-certificate {
          background-color: #fffdf5;
          border: 2px solid #d4af37;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23d4af37' fillOpacity='0.05' fillRule='evenodd'/%3E%3C/svg%3E");
        }
      `}</style>
    </div>
  )
}

export default Certificates